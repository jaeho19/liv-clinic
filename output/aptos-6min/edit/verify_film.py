# -*- coding: utf-8 -*-
"""본편 검수 — 규격 + 움직임 실측.

`freezedetect` 와 `blackdetect` 만으로는 부족하다. 인계문 §7-2·§7-3 이 그 이유를
적어 뒀다:

- 이전 출고본에 **97프레임 스트로브**가 들어 있었는데 `freezedetect` 는 그걸
  **원리상 못 잡는다**. 움직임이 모자란 게 아니라 넘치는 방향이기 때문이다.
- 그 스트로브가 그 아래 있던 3.167초 freeze 를 가리고 있었다. **지표가 0 이라고
  해서 안전한 게 아니다.**

그래서 여기서는 프레임 간 변화량을 **전 구간 실측해서 프로파일로 만든다.**
블록마다 중앙값을 내고 선언된 계층(강/중/약)의 목표와 대조한다. 선언과 실측이
어긋나면 그 자리가 고칠 자리다.

측정 방식은 `clips.py --motion` 과 같다(108×192 그레이스케일, 프레임 간 절대차
평균). 그래야 클립 자체의 움직임(clip_report.json)과 같은 자로 비교된다.
이 코드로 직접 잰 기준선: **승인된 v2 0.430**, 폐기된 v1 0.087.

사용:
  PYTHONIOENCODING=utf-8 python verify_film.py ../aptos_6min.mp4
  PYTHONIOENCODING=utf-8 python verify_film.py ../aptos_6min.mp4 --json out.json
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import film as F                                     # noqa: E402
from look import W, H, FPS                           # noqa: E402

MW, MH = 108, 192                # 측정 해상도. clips.py --motion 과 같다
STATIC_PLATE = 0.095             # 정지 이미지 + 켄번즈의 실측값
STILL_EPS = 0.02                 # 이보다 작으면 '사실상 정지'
STILL_MAX_SEC = 3.0              # 3초 이상 완전 정지 0 (설계서 규격)

# 목표는 **이 스크립트로 직접 잰** 승인/폐기 판에서 가져왔다.
# 인계문에 적힌 0.478 / 0.111 은 다른 측정 코드의 숫자여서 그대로 쓰면 안 된다
# (같은 V1 클립을 쓴 구간을 0.640 이라 적어 뒀는데 이 코드로는 0.558 이 나온다).
#
#   v2 (승인)  전체 0.430 · 블록 0.211 ~ 1.540 · 악센트 0.273 / 0.558 / 1.540
#   v1 (폐기)  전체 0.087 · 블록 0.031 ~ 0.129
#
# 즉 승인과 폐기를 가른 것은 약 5배 차이다. 목표는 승인판 프로파일이다.
# 값 자체는 film.py 가 갖는다 — 두 곳에 적어 두면 한쪽만 고치게 된다.
TIER_TARGET = F.TIER_FLOOR
MEDIAN_MIN = F.MEDIAN_MIN
# 강약비도 승인판에서 뽑는다. 2.0 은 내가 고른 둥근 수였고, 정작 승인된 판의
# 실측 강약비는 **1.84** 다:
#     악센트 중앙값 median(0.558, 0.273, 1.540) = 0.558
#     베드  중앙값 median(0.211, 0.395)         = 0.303   -> 1.84배
# 승인된 판보다 엄격한 기준을 스스로에게 걸 이유가 없다.
ACCENT_OVER_BED = 1.84


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,avg_frame_rate,r_frame_rate,nb_frames,pix_fmt,codec_name",
         "-show_entries", "format=duration,nb_streams", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    num, den = (s.get("avg_frame_rate") or "0/1").split("/")
    return {"width": s["width"], "height": s["height"], "codec": s.get("codec_name"),
            "pix_fmt": s.get("pix_fmt"), "fps": float(num) / float(den or 1),
            "r_fps": s.get("r_frame_rate"),
            "nb_frames": int(s.get("nb_frames") or 0),
            "duration": float(d["format"]["duration"]),
            "nb_streams": int(d["format"]["nb_streams"])}


def diff_profile(path):
    """프레임 간 변화량을 전 구간 잰다. 파이프로 흘려 읽어 메모리를 안 쓴다."""
    cmd = ["ffmpeg", "-v", "error", "-i", path,
           "-vf", "scale=%d:%d:flags=bilinear,format=gray" % (MW, MH),
           "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    n = MW * MH
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=n * 16)
    prev, diffs = None, []
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        cur = np.frombuffer(buf, np.uint8).astype(np.int16)
        if prev is not None:
            diffs.append(float(np.abs(cur - prev).mean()))
        prev = cur
    proc.stdout.close()
    proc.wait()
    # diffs[i] 는 프레임 i 와 i+1 사이의 값이다.
    return np.asarray(diffs, np.float64)


def detect(path, filt):
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-vf", filt,
                          "-map", "0:v", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    tag = filt.split("=")[0]
    return [ln.strip() for ln in out.splitlines() if tag in ln and "Parsed" in ln]


def longest_still(diffs):
    """가장 긴 '사실상 정지' 구간 — (프레임 수, 시작 초)."""
    best, best_at, run, start = 0, 0.0, 0, 0
    for i, v in enumerate(diffs):
        if v < STILL_EPS:
            if run == 0:
                start = i
            run += 1
            if run > best:
                best, best_at = run, start / float(FPS)
        else:
            run = 0
    return best, best_at


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--json", default=None)
    a = ap.parse_args()
    path = os.path.abspath(a.path)
    if not os.path.isfile(path):
        raise SystemExit("파일이 없다: %s" % path)

    fails, warns = [], []
    rep = {"path": path}

    # ---------------------------------------------------------- 규격
    info = probe(path)
    rep["probe"] = info
    print("== 규격")
    print("  %dx%d  %s  %s  %.3ffps(r=%s)  %d프레임  %.3f초  스트림 %d개"
          % (info["width"], info["height"], info["codec"], info["pix_fmt"],
             info["fps"], info["r_fps"], info["nb_frames"], info["duration"],
             info["nb_streams"]))
    if (info["width"], info["height"]) != (W, H):
        fails.append("해상도가 %dx%d 다" % (info["width"], info["height"]))
    if info["codec"] != "h264" or info["pix_fmt"] != "yuv420p":
        fails.append("코덱/픽셀포맷이 %s/%s 다" % (info["codec"], info["pix_fmt"]))
    if abs(info["fps"] - FPS) > 0.001 or info["r_fps"] != "30/1":
        fails.append("fps 가 %.3f (r=%s) 다 — CFR 30 이어야 한다"
                     % (info["fps"], info["r_fps"]))
    if info["nb_frames"] != F.TOTAL:
        fails.append("%d프레임 (기대 %d)" % (info["nb_frames"], F.TOTAL))
    if abs(info["duration"] - F.TOTAL / float(FPS)) > 0.002:
        fails.append("길이가 %.3f초 (기대 %.3f초)"
                     % (info["duration"], F.TOTAL / float(FPS)))
    if info["nb_streams"] != 1:
        fails.append("스트림이 %d개 — 무음이어야 한다(오디오 0)" % info["nb_streams"])

    # ---------------------------------------------------------- 필터 검출
    print("== freezedetect / blackdetect")
    fz = detect(path, "freezedetect=n=0.001:d=3")
    bk = detect(path, "blackdetect=d=0.5:pix_th=0.05")
    rep["freezedetect"], rep["blackdetect"] = fz, bk
    print("  freeze %d건 · black %d건" % (len(fz), len(bk)))
    for ln in fz + bk:
        print("   ", ln)
    if fz:
        fails.append("freezedetect %d건" % len(fz))
    if bk:
        fails.append("blackdetect %d건" % len(bk))

    # ---------------------------------------------------------- 움직임
    print("== 프레임 간 변화량 (정지 플레이트 %.3f 기준)" % STATIC_PLATE)
    diffs = diff_profile(path)
    rep["frames_measured"] = int(len(diffs) + 1)
    if len(diffs) + 1 != F.TOTAL:
        warns.append("디코드한 프레임이 %d장 (기대 %d)" % (len(diffs) + 1, F.TOTAL))

    overall = float(np.median(diffs))
    rep["median"] = round(overall, 3)
    print("  전체 중앙값 %.3f   (v1 폐기 0.087 · v2 승인 0.430)" % overall)

    rows = []
    for b in F.BLOCKS:
        i0 = int(round(b["start"] * FPS))
        i1 = int(round((b["start"] + b["dur"]) * FPS))
        # 전환 구간은 설계된 급변이라 빼고 잰다. 그 자리를 넣으면 블록이
        # 실제보다 활발해 보여서, 조용한 본문이 전환 덕에 통과해 버린다.
        skip = int(round(b["tdur"] * FPS))
        seg = diffs[min(i0 + skip, i1 - 1):max(i1 - 1, i0 + skip + 1)]
        if len(seg) == 0:
            seg = diffs[i0:i1]
        med = float(np.median(seg))
        target = TIER_TARGET[b["tier"]]
        ok = med >= target
        rows.append(dict(id=b["id"], sec=b["sec"], tier=b["tier"],
                         start=b["start"], dur=b["dur"], median=round(med, 3),
                         p10=round(float(np.percentile(seg, 10)), 3),
                         target=target, ok=ok))
        if not ok:
            fails.append("%s(%s, %s) 중앙값 %.3f < 목표 %.2f"
                         % (b["id"], b["sec"], b["tier"], med, target))
        if med < F.MOTION_FLOOR:
            fails.append("%s 가 바닥 %.2f 아래다 (%.3f)"
                         % (b["id"], F.MOTION_FLOOR, med))
    rep["blocks"] = rows

    print("  %-4s %-4s %-7s %7s %7s %7s %7s  %s"
          % ("id", "행", "계층", "시작", "길이", "중앙값", "하위10%", "판정"))
    for r in rows:
        print("  %-4s %-4s %-7s %7.1f %7.1f %7.3f %7.3f  %s"
              % (r["id"], r["sec"], r["tier"], r["start"], r["dur"],
                 r["median"], r["p10"], "OK" if r["ok"] else "미달"))

    blockmeds = sorted(r["median"] for r in rows)
    bm = float(np.median(blockmeds))
    rep["block_median"] = round(bm, 3)
    rep["block_min"] = round(blockmeds[0], 3)
    print("  블록 중앙값들: 최저 %.3f · 중앙 %.3f · 상단 %.3f  (승인판 0.211 / 0.395 / 1.540)"
          % (blockmeds[0], bm, blockmeds[-1]))
    if blockmeds[0] < F.BLOCK_MIN:
        fails.append("가장 조용한 블록 %.3f < %.2f (승인판의 최저와 같아야 한다)"
                     % (blockmeds[0], F.BLOCK_MIN))
    if bm < F.BLOCK_MEDIAN_MIN:
        fails.append("블록 중앙값들의 중앙값 %.3f < %.3f (승인판)"
                     % (bm, F.BLOCK_MEDIAN_MIN))

    acc = [r["median"] for r in rows if r["tier"] == F.ACCENT]
    bedm = [r["median"] for r in rows if r["tier"] == F.BED]
    ratio = (float(np.median(acc)) / float(np.median(bedm))) if acc and bedm else 0.0
    rep["accent_over_bed"] = round(ratio, 2)
    print("  강 중앙값 %.3f / 약 중앙값 %.3f = %.2f배 (기준 %.1f배)"
          % (float(np.median(acc)), float(np.median(bedm)), ratio, ACCENT_OVER_BED))
    if overall < MEDIAN_MIN:
        fails.append("전체 중앙값 %.3f < %.2f" % (overall, MEDIAN_MIN))
    if ratio < ACCENT_OVER_BED:
        fails.append("강약이 %.2f배뿐이다 (기준 %.1f배) — 이름만 강약이다"
                     % (ratio, ACCENT_OVER_BED))

    # ---------------------------------------------------------- 정지 구간
    n_still, at = longest_still(diffs)
    rep["longest_still"] = {"frames": int(n_still),
                            "seconds": round(n_still / float(FPS), 3),
                            "at": round(at, 2)}
    print("== 최장 연속 정지 (변화 < %.2f)" % STILL_EPS)
    print("  %d프레임 = %.2f초  (%.1f초 지점)  기준 %.1f초"
          % (n_still, n_still / float(FPS), at, STILL_MAX_SEC))
    if n_still / float(FPS) >= STILL_MAX_SEC:
        fails.append("정지 %.2f초 @ %.1f초" % (n_still / float(FPS), at))

    # ---------------------------------------------------------- 급변 지점
    thr = float(np.percentile(diffs, 99.5))
    spikes = [round((i + 1) / float(FPS), 2)
              for i in np.where(diffs > max(thr, overall * 6))[0]]
    cuts = [round(b["start"], 2) for b in F.BLOCKS[1:]]
    stray = []
    for s in spikes:
        if not any(abs(s - c) <= max(1.0, 0.0) + 0.6 for c in cuts):
            stray.append(s)
    rep["spikes"] = spikes
    rep["unplanned_spikes"] = stray
    print("== 급변 지점")
    print("  %d곳 중 설계된 전환 자리 밖 %d곳" % (len(spikes), len(stray)))
    if stray:
        print("   설계 밖:", ", ".join("%.2fs" % s for s in stray[:24]))
        warns.append("설계에 없는 급변 %d곳 — 스트로브일 수 있다" % len(stray))

    # ---------------------------------------------------------- 악센트 간격
    last_end, gaps = 0.0, []
    for b in F.BLOCKS:
        if b["tier"] != F.ACCENT:
            continue
        gaps.append(round(b["start"] - last_end, 1))
        last_end = b["start"] + b["dur"]
    gaps.append(round(360.0 - last_end, 1))
    rep["accent_gaps"] = gaps
    print("== 악센트 간격  최대 %.0f초 (한계 %.0f초)"
          % (max(gaps), F.ACCENT_GAP_MAX))
    if max(gaps) > F.ACCENT_GAP_MAX:
        fails.append("악센트 간격 최대 %.0f초" % max(gaps))

    # ---------------------------------------------------------- 결론
    print("\n== 결론")
    for w in warns:
        print("  [경고]", w)
    for f in fails:
        print("  [실패]", f)
    rep["fails"], rep["warns"] = fails, warns
    if a.json:
        with open(a.json, "w", encoding="utf-8") as fh:
            json.dump(rep, fh, ensure_ascii=False, indent=1)
        print("  기록 ->", a.json)
    if fails:
        print("  %d건 실패" % len(fails))
        return 1
    print("  통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
