# -*- coding: utf-8 -*-
"""Seedance 2.5 생성 클립을 영상 규격으로 변환한다.

인계문 §4-① 경고: kling3_0 은 9:16 을 요청해도 **1076×1928 / 24fps / 145프레임**으로
나왔다. 요청값을 믿고 파이프라인을 짜면 안 된다. 그래서 이 스크립트는
**받은 파일을 먼저 재고 그 값을 기록한 뒤** 변환한다.

변환: 원본 → cover 크롭 1080×1920 → 30fps → 정확히 N프레임 JPEG 시퀀스.

⚠️ `minterpolate` 는 마지막 프레임을 버린다(실측: 180 요청에 179장). 모자라면
마지막 장을 복제하고 넘치면 잘라서 **항상 정확히 N장**을 만든다. 렌더러가
`clip_frame(key, 1..N)` 으로 읽으므로 한 장이라도 비면 그 프레임에서 죽는다.

사용:
  PYTHONIOENCODING=utf-8 python clips.py --fetch clips.json
  PYTHONIOENCODING=utf-8 python clips.py --convert
  PYTHONIOENCODING=utf-8 python clips.py --sheet          # 각 클립 6컷 대조표
"""
import argparse
import json
import os
import subprocess

from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.join(EDIT, "clips")
FRAMES = os.path.join(CLIPS, "frames")
REPORT = os.path.join(CLIPS, "clip_report.json")

W, H, FPS = 1080, 1920, 30


def _probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate,avg_frame_rate,nb_frames,codec_name",
         "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    num, den = (s.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den or 1) if float(den or 1) else 0.0
    return {"width": s["width"], "height": s["height"], "codec": s.get("codec_name"),
            "fps": round(fps, 3), "nb_frames": int(s.get("nb_frames") or 0),
            "duration": round(float(d["format"]["duration"]), 3)}


def fetch(spec_path):
    """clips.json = [{"key": "V1", "url": "...", "note": "..."}] 을 받아 mp4 로 저장."""
    os.makedirs(CLIPS, exist_ok=True)
    with open(spec_path, encoding="utf-8") as f:
        spec = json.load(f)
    rep = _load_report()
    for item in spec:
        key, url = item["key"], item["url"]
        dst = os.path.join(CLIPS, key + ".mp4")
        # 이 PC 는 TLS 가로채기 프록시 뒤라 -k 가 필요하다.
        subprocess.run(["curl", "-k", "-sS", "-L", "-o", dst, url], check=True)
        info = _probe(dst)
        meta = {"source": info, "note": item.get("note", ""), "url": url}
        # 6분 본편은 클립마다 목표 길이가 다르다(블록 길이에 맞춰 생성했다).
        # 요청 길이와 출력 길이가 또 다르므로(5초 요청에 5.04초), 목표
        # 프레임 수를 spec 에 적어 두고 변환이 그걸 따르게 한다.
        if item.get("frames"):
            meta["want_frames"] = int(item["frames"])
        rep.setdefault(key, {}).update(meta)
        print("  %-4s %sx%s  %.2ffps  %s프레임  %.2fs  %s"
              % (key, info["width"], info["height"], info["fps"],
                 info["nb_frames"], info["duration"], item.get("note", "")))
    _save_report(rep)


def convert(keys=None, frames=None):
    """1080×1920 / 30fps / 정확히 N프레임 JPEG 시퀀스로 만든다."""
    rep = _load_report()
    keys = keys or sorted(k for k in rep if os.path.isfile(os.path.join(CLIPS, k + ".mp4")))
    for key in keys:
        src = os.path.join(CLIPS, key + ".mp4")
        info = rep[key]["source"]
        n = rep[key].get("want_frames") or frames or int(round(info["duration"] * FPS))
        outdir = os.path.join(FRAMES, key)
        os.makedirs(outdir, exist_ok=True)
        for old in os.listdir(outdir):
            os.remove(os.path.join(outdir, old))

        # 원본 fps 가 30 과 다르면 보간한다. 같으면 건드리지 않는다 —
        # 30fps 소스에 minterpolate 를 걸면 없던 아티팩트만 생긴다.
        vf = ("scale=%d:%d:force_original_aspect_ratio=increase:flags=lanczos,"
              "crop=%d:%d" % (W, H, W, H))
        if abs(info["fps"] - FPS) > 0.1:
            vf += (",minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:"
                   "me_mode=bidir:vsbmc=1" % FPS)
        else:
            vf += ",fps=%d" % FPS
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf,
                        "-q:v", "2", "-fps_mode", "passthrough",
                        os.path.join(outdir, "%04d.jpg")], check=True)

        got = sorted(os.listdir(outdir))
        # minterpolate 가 마지막 프레임을 버린다(실측). 항상 정확히 N장으로 맞춘다.
        if len(got) > n:
            for extra in got[n:]:
                os.remove(os.path.join(outdir, extra))
            fixed = "잘라냄 %d장" % (len(got) - n)
        elif len(got) < n:
            last = os.path.join(outdir, got[-1])
            for i in range(len(got) + 1, n + 1):
                Image.open(last).save(os.path.join(outdir, "%04d.jpg" % i), quality=95)
            fixed = "복제 %d장" % (n - len(got))
        else:
            fixed = "그대로"
        final = len(os.listdir(outdir))
        assert final == n, "%s: %d장 (기대 %d)" % (key, final, n)
        rep[key]["frames"] = n
        rep[key]["fixed"] = fixed
        rep[key]["interpolated"] = abs(info["fps"] - FPS) > 0.1
        print("  %-4s -> %d프레임 (%s)%s" % (key, n, fixed,
              "  [보간]" if rep[key]["interpolated"] else ""))
    _save_report(rep)


def sheet():
    """클립마다 6컷을 뽑아 한 장으로. 움직임이 실제로 있는지 눈으로 본다."""
    rep = _load_report()
    keys = sorted(k for k in rep if rep[k].get("frames"))
    if not keys:
        raise SystemExit("변환된 클립이 없다 — 먼저 --convert 를 돌려라")
    cols = 6
    tw, th = 200, 356
    from PIL import ImageDraw, ImageFont
    f = ImageFont.truetype(os.path.join(EDIT, "fonts", "Pretendard-SemiBold.ttf"), 20)
    out = Image.new("RGB", (tw * cols + 4 * (cols - 1), (th + 26) * len(keys)),
                    (250, 250, 250))
    d = ImageDraw.Draw(out)
    for r, key in enumerate(keys):
        n = rep[key]["frames"]
        y = r * (th + 26) + 26
        d.text((2, y - 23), "%s  %s" % (key, rep[key].get("note", "")), font=f,
               fill=(30, 24, 20))
        for c in range(cols):
            idx = 1 + int(c * (n - 1) / (cols - 1))
            im = Image.open(os.path.join(FRAMES, key, "%04d.jpg" % idx))
            out.paste(im.resize((tw, th), Image.LANCZOS), (c * (tw + 4), y))
    path = os.path.join(EDIT, "stills", "_clip_sheet.jpg")
    out.save(path, quality=90)
    print("->", path, out.size)


def motion():
    """클립마다 프레임 간 변화량을 재서 '진짜 움직이는지' 숫자로 본다."""
    import numpy as np
    rep = _load_report()
    for key in sorted(k for k in rep if rep[k].get("frames")):
        n = rep[key]["frames"]
        prev = None
        diffs = []
        for i in range(1, n + 1, 2):
            a = np.asarray(Image.open(os.path.join(FRAMES, key, "%04d.jpg" % i))
                           .convert("L").resize((108, 192)), np.int16)
            if prev is not None:
                diffs.append(float(np.abs(a - prev).mean()))
            prev = a
        rep[key]["motion"] = {"mean": round(sum(diffs) / len(diffs), 3),
                              "min": round(min(diffs), 3), "max": round(max(diffs), 3)}
        print("  %-4s 평균 %6.3f  최소 %6.3f  최대 %6.3f   %s"
              % (key, rep[key]["motion"]["mean"], rep[key]["motion"]["min"],
                 rep[key]["motion"]["max"], rep[key].get("note", "")))
    _save_report(rep)


def _load_report():
    if os.path.isfile(REPORT):
        with open(REPORT, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_report(rep):
    os.makedirs(CLIPS, exist_ok=True)
    with open(REPORT, "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", default=None, metavar="clips.json")
    ap.add_argument("--convert", action="store_true")
    ap.add_argument("--frames", type=int, default=None)
    # 키를 안 주면 보고서에 있는 **모든** 클립을 다시 변환한다. 기존 V1~V10 은
    # 150프레임으로 굳어 있고 want_frames 가 없어서, 같이 돌리면 원본 길이
    # (5.04초 -> 151장)로 바뀌어 파일럿 검사가 깨진다. 새 클립만 지정할 것.
    ap.add_argument("--keys", default=None, metavar="N01,N02,...")
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--motion", action="store_true")
    a = ap.parse_args()
    if a.fetch:
        fetch(a.fetch)
    if a.convert:
        convert(keys=[k.strip() for k in a.keys.split(",")] if a.keys else None,
                frames=a.frames)
    if a.sheet:
        sheet()
    if a.motion:
        motion()


if __name__ == "__main__":
    main()
