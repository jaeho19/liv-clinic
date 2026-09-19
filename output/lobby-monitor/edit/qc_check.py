# -*- coding: utf-8 -*-
"""2~4편 완성본 MP4 를 다시 읽어 통합 검수한다.

검수 대상은 렌더러 결과가 아니라 **인코딩이 끝난 최종 MP4** 다.
(1)편 output/lifting-city/edit/qc_check.py 의 구조를 따르되 3편을 순회하고,
1편 검수에 없던 깜빡임(스트로브) 검사를 추가했다.

검사 항목
 1) 규격      : 해상도/프레임수/fps/픽셀포맷/오디오 유무/길이
 2) 고정 크롬 : 2fps 전수 표본에서 상단 로고·병원명, 하단 "이 건물 4층" 로즈 필
 3) 검은 프레임: 표본 평균 휘도 + ffmpeg blackdetect
 4) 정지 구간 : ffmpeg freezedetect (n=0.001, d=3) - 합격선 0건
 5) 깜빡임    : 전수 디코딩 인접 프레임 MAD (blackdetect/freezedetect 가 원리상
                못 잡는 결함. 2026-09-19 (4)편 출고본에서 실제로 잡혔다)
 6) QR        : 마지막 12초 6개 시점에서 실제 디코딩
 7) 금지 문구 : copy_guard.main()

주의: 이 PC 의 python stdout 기본 인코딩은 cp949 다. 출력이 파일로 리디렉션돼도
죽지 않도록 특수문자를 쓰지 않고 errors="replace" 로 방어한다.

사용법
    python output/lobby-monitor/edit/qc_check.py            # 전체
    python output/lobby-monitor/edit/qc_check.py thread     # 한 편만
"""
import ast
import json
import os
import re
import subprocess
import sys

import cv2
import numpy as np

try:
    sys.stdout.reconfigure(errors="replace")
except (AttributeError, ValueError):
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

W, H, FPS = 1080, 1920, 30
QR_URL = "https://liv-clinic.net/ko/contact"
ROSE = np.array([180, 152, 141], np.float32)
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)

SAMPLE_FPS = 2                  # 고정 크롬 전수 표본 간격
DARK_LUMA = 18.0                # 표본 평균 휘도 하한
PILL_TOL = 42                   # 로즈 필 색 허용 오차
CHROME_LUMA = 170.0             # 로고·병원명 영역 최대 휘도 하한
MAD_SPIKE = 5.0                 # 깜빡임 후보 임계 (인접 프레임 MAD)

#                 이름        파일                                        프레임  길이   소스
MASTERS = [
    ("thread",  "LIV_thread_1080x1920_4min_silent.mp4",  7200, 240.0, "video_thread.py"),
    ("georgia", "LIV_georgia_1080x1920_3min_silent.mp4", 5400, 180.0, "video_georgia.py"),
    ("map",     "LIV_map_1080x1920_3min_silent.mp4",     5400, 180.0, "video_map.py"),
]


# ---------------------------------------------------------------- 블록 경계
def parse_blocks(src_name):
    """장면 모듈 소스에서 BLOCKS 와 XF 를 읽는다.

    검수가 렌더러를 임포트하지 않고(폰트·에셋 의존 없이) 실제 코드의 블록
    경계를 쓰게 하려는 것이다. 값을 qc_check 안에 베껴 두면 소스가 바뀌어도
    검수는 옛 경계로 통과해 버린다.
    """
    path = os.path.join(HERE, src_name)
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=path)
    blocks, xf = None, None
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue
        names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        if "XF" in names and isinstance(node.value, ast.Constant):
            xf = int(node.value.value)
        if "BLOCKS" in names and isinstance(node.value, (ast.List, ast.Tuple)):
            blocks = []
            for el in node.value.elts:
                kw = {k.arg: k.value for k in el.keywords}
                blocks.append({"id": kw["id"].value,
                               "start": float(kw["start"].value),
                               "dur": float(kw["dur"].value)})
    if blocks is None or xf is None:
        raise RuntimeError("BLOCKS/XF 를 %s 에서 찾지 못했다" % src_name)
    return blocks, xf


def block_of(blocks, frame):
    t = frame / float(FPS)
    for k, b in enumerate(blocks):
        if b["start"] <= t < b["start"] + b["dur"]:
            return k
    return len(blocks) - 1


# ---------------------------------------------------------------- 1) 규격
def probe(mp4):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration,size,bit_rate",
                          "-show_entries", "stream=codec_type,codec_name,width,height,"
                          "r_frame_rate,nb_frames,pix_fmt", "-of", "json", mp4],
                         capture_output=True, text=True).stdout
    return json.loads(out)


def check_spec(mp4, frames, dur):
    info = probe(mp4)
    vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
    audio = [s for s in info["streams"] if s["codec_type"] == "audio"]
    d = float(info["format"]["duration"])
    return {
        "width": vs["width"], "height": vs["height"], "fps": vs["r_frame_rate"],
        "codec": vs["codec_name"], "frames": int(vs["nb_frames"]),
        "pix_fmt": vs["pix_fmt"], "duration_sec": d,
        "size_bytes": int(info["format"]["size"]),
        "bitrate_bps": int(info["format"]["bit_rate"]),
        "audio_streams": len(audio),
        "expected_frames": frames, "expected_duration": dur,
        "pass": (vs["width"] == W and vs["height"] == H
                 and int(vs["nb_frames"]) == frames
                 and vs["r_frame_rate"] == "%d/1" % FPS
                 and vs["pix_fmt"] == "yuv420p"
                 and abs(d - dur) < 0.01 and len(audio) == 0),
    }


# ------------------------------------------- 2,3,5) 전수 디코딩 한 번에
def decode_scan(mp4):
    """rgb24 전수 디코딩 1회로 고정 크롬 표본 검사와 인접 MAD 를 함께 잰다.

    반환: (frame_scan dict, mad1 ndarray, mad2 ndarray, decoded_frames)
      mad1[n] = MAD(frame n, frame n+1)
      mad2[n] = MAD(frame n, frame n+2)
    """
    fb = W * H * 3
    proc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", mp4, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE, bufsize=10 ** 8)

    step = FPS // SAMPLE_FPS
    fails = {"dark": [], "pill": [], "logo": [], "clinic": []}
    lum_min, sampled, n = 255.0, 0, 0
    mad1, mad2 = [], []
    p1 = p2 = None                      # 직전 / 두 칸 전 프레임 (평면 uint8)
    while True:
        buf = proc.stdout.read(fb)
        if len(buf) < fb:
            break
        flat = np.frombuffer(buf, np.uint8).reshape(H, W * 3)
        if p1 is not None:
            mad1.append(cv2.mean(cv2.absdiff(flat, p1))[0])
        if p2 is not None:
            mad2.append(cv2.mean(cv2.absdiff(flat, p2))[0])
        p2, p1 = p1, flat

        if n % step == 0:               # 2fps 고정 크롬 표본
            fr = flat.reshape(H, W, 3)
            tsec = round(n / float(FPS), 2)
            lum = fr.astype(np.float32) @ LUMA
            m = float(lum.mean())
            lum_min = min(lum_min, m)
            if m < DARK_LUMA:
                fails["dark"].append(tsec)
            pill = fr[1795:1812, 78:101].reshape(-1, 3).astype(np.float32).mean(axis=0)
            if np.abs(pill - ROSE).max() > PILL_TOL:
                fails["pill"].append((tsec, [round(float(v)) for v in pill]))
            if float(lum[84:142, 72:319].max()) < CHROME_LUMA:
                fails["logo"].append(tsec)
            if float(lum[86:146, 700:1010].max()) < CHROME_LUMA:
                fails["clinic"].append(tsec)
            sampled += 1
        n += 1
    proc.stdout.close()
    proc.wait()

    scan = {
        "decoded_frames": n, "sampled_frames": sampled, "sample_fps": SAMPLE_FPS,
        "min_mean_luma": round(lum_min, 2),
        "dark_frames": fails["dark"],
        "footer_pill_missing": fails["pill"][:10],
        "header_logo_missing": fails["logo"][:10],
        "header_clinic_missing": fails["clinic"][:10],
        "pass": not (fails["dark"] or fails["pill"] or fails["logo"] or fails["clinic"]),
    }
    return scan, np.array(mad1), np.array(mad2), n


# ---------------------------------------------------------------- 5) 깜빡임
def check_strobe(mad1, mad2, blocks, xf):
    """인접 프레임 MAD 스파이크를 위치로 분류하고 왕복 여부를 판별한다.

    freezedetect/blackdetect 는 움직임이 **모자란** 쪽만 본다. 캐시 오염 같은
    깜빡임은 프레임 차이를 늘리는 방향이라 두 검사 모두 원리상 통과한다.
    그래서 여기서 따로 본다.

    판별: 왕복 스트로브는 두 칸 건너뛰면 원래 그림으로 돌아오므로
    MAD(n,n+2) < MAD(n,n+1) (비율 < 1). 한 방향 전환(페이드/슬라이드/디졸브)은
    두 칸 차이가 더 크다 (비율 > 1).
    """
    half = xf // 2
    bounds = [int(round(b["start"] * FPS)) for b in blocks[1:]]
    spikes = np.nonzero(mad1 > MAD_SPIKE)[0]

    inside, outside = [], []
    for n in spikes.tolist():
        near = min(abs(n - b) for b in bounds) if bounds else 10 ** 9
        (inside if near <= half else outside).append(n)

    rows, susp = [], 0
    for n in outside:
        # 마지막 쌍은 두 칸 건너뛸 프레임이 없다(mad2 가 한 칸 짧다). 비율을 못 내는
        # 경우는 None 으로 남기고 왕복 판정에서 제외한다.
        m2 = float(mad2[n]) if n < len(mad2) else None
        r = (m2 / float(mad1[n])) if (m2 is not None and mad1[n] > 0) else None
        k = block_of(blocks, n)
        if r is not None and r < 1.0:
            susp += 1
        rows.append({"frame": n, "t": round(n / float(FPS), 3),
                     "block": blocks[k]["id"],
                     "offset_frames": n - int(round(blocks[k]["start"] * FPS)),
                     "mad1": round(float(mad1[n]), 3),
                     "mad2": None if m2 is None else round(m2, 3),
                     "ratio": None if r is None else round(r, 3)})

    mask = np.ones(len(mad1), bool)
    for b in bounds:
        mask[max(0, b - half):b + half + 1] = False
    return {
        "pairs": int(len(mad1)),
        "mad_mean": round(float(mad1.mean()), 4),
        "mad_median": round(float(np.median(mad1)), 4),
        "mad_max": round(float(mad1.max()), 4),
        "threshold": MAD_SPIKE,
        "spikes": int(len(spikes)),
        "spikes_at_block_boundary": len(inside),
        "spikes_outside_boundary": len(outside),
        "boundary_window_frames": half,
        "off_boundary_pairs": int(mask.sum()),
        "off_boundary_mad_max": round(float(mad1[mask].max()), 4) if mask.any() else None,
        "outside_detail": rows[:60],
        "ratio_min_outside": min([r["ratio"] for r in rows if r["ratio"] is not None],
                                 default=None),
        "ratio_unmeasured": sum(1 for r in rows if r["ratio"] is None),
        "strobe_suspects": susp,
        "pass": susp == 0,
    }


# ---------------------------------------------------- 3,4) black / freeze
def check_black_freeze(mp4):
    def run(vf):
        p = subprocess.run(["ffmpeg", "-v", "info", "-i", mp4, "-vf", vf,
                            "-an", "-f", "null", "-"],
                           capture_output=True, text=True, errors="replace")
        return p.stderr

    err_b = run("blackdetect=d=0.05:pic_th=0.98:pix_th=0.10")
    err_f = run("freezedetect=n=0.001:d=3")
    blacks = re.findall(r"black_start:([0-9.]+) black_end:([0-9.]+)", err_b)
    # 건수는 freeze_start 로 센다. 파일 끝까지 이어지는 정지에는 freeze_duration/
    # freeze_end 가 찍히지 않으므로(음성 대조군에서 확인), detail 이 start 보다
    # 짧을 수 있다. 판정은 어디까지나 건수 기준이다.
    fstart = re.findall(r"freeze_start: ([0-9.]+)", err_f)
    fdur = re.findall(r"freeze_duration: ([0-9.]+)", err_f)
    return {
        "black_count": len(blacks),
        "black_detail": [{"start": float(a), "end": float(b)} for a, b in blacks][:10],
        "freeze_count": len(fstart),
        "freeze_detail": [{"start": float(s), "duration": float(d)}
                          for s, d in zip(fstart, fdur)][:10],
        "freeze_threshold": "n=0.001 d=3",
        "pass": len(blacks) == 0 and len(fstart) == 0,
    }


# ---------------------------------------------------------------- 6) QR
def check_qr(mp4, dur, name):
    det = cv2.QRCodeDetector()
    tmp = os.path.join(ROOT, "edit", "stills", "qr_scan")
    os.makedirs(tmp, exist_ok=True)
    rows = []
    for back in (11.5, 10.0, 7.5, 5.0, 2.5, 0.1):
        sec = round(dur - back, 2)
        fp = os.path.join(tmp, "%s_%.1f.png" % (name, sec))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(sec), "-i", mp4,
                        "-frames:v", "1", fp], check=True)
        img = cv2.imread(fp)
        data, _, _ = det.detectAndDecode(img)
        rows.append({"t": sec, "decoded": data, "match": data == QR_URL})
    return {"expected": QR_URL, "samples": rows,
            "pass": all(r["match"] for r in rows)}


# ---------------------------------------------------------------- 7) 금지 문구
def check_copy_guard():
    import copy_guard
    code = copy_guard.main(["copy_guard"])
    return {"exit_code": code, "banned_terms": len(copy_guard.BANNED),
            "pass": code == 0}


# ---------------------------------------------------------------- 실행
def check_master(name, fn, frames, dur, src):
    mp4 = os.path.join(ROOT, "renders", fn)
    blocks, xf = parse_blocks(src)
    print("[%s] %s" % (name, fn))
    out = {"file": fn, "source": src, "blocks": len(blocks), "xf": xf, "checks": {}}
    out["checks"]["spec"] = check_spec(mp4, frames, dur)
    print("  규격        : %s" % ok(out["checks"]["spec"]))

    scan, mad1, mad2, decoded = decode_scan(mp4)
    scan["decoded_frames_match"] = decoded == frames
    scan["pass"] = scan["pass"] and decoded == frames
    out["checks"]["frame_scan"] = scan
    print("  고정 크롬    : %s (표본 %d, 전수 디코딩 %d 프레임)"
          % (ok(scan), scan["sampled_frames"], decoded))

    st = check_strobe(mad1, mad2, blocks, xf)
    out["checks"]["strobe"] = st
    print("  깜빡임      : %s (MAD>%.1f %d개 / 경계밖 %d개 / 왕복의심 %d개)"
          % (ok(st), MAD_SPIKE, st["spikes"], st["spikes_outside_boundary"],
             st["strobe_suspects"]))

    bf = check_black_freeze(mp4)
    out["checks"]["black_freeze"] = bf
    print("  검은/정지    : %s (black %d, freeze %d)"
          % (ok(bf), bf["black_count"], bf["freeze_count"]))

    qr = check_qr(mp4, dur, name)
    out["checks"]["qr_rescan"] = qr
    print("  QR          : %s" % ok(qr))
    return out


def ok(d):
    return "PASS" if d["pass"] else "FAIL"


def main(argv):
    only = argv[1:]
    result = {"masters": {}, "shared": {}}
    for name, fn, frames, dur, src in MASTERS:
        if only and name not in only:
            continue
        result["masters"][name] = check_master(name, fn, frames, dur, src)

    cg = check_copy_guard()
    result["shared"]["copy_guard"] = cg
    print("금지 문구      : %s" % ok(cg))

    with open(os.path.join(HERE, "qc_result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)

    allpass = cg["pass"] and all(
        c["pass"] for m in result["masters"].values() for c in m["checks"].values())
    print("\nALL PASS" if allpass else "\nFAIL 있음")
    return 0 if allpass else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
