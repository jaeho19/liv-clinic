# -*- coding: utf-8 -*-
"""완성본 MP4 자체를 다시 읽어 검수한다(렌더러 결과가 아니라 인코딩된 파일 기준).

검사 항목
 1) 규격: 해상도/프레임수/fps/픽셀포맷/오디오 유무
 2) 전 구간 고정 요소: 상단 로고·병원명, 하단 "이 건물 4층" 로즈 필
 3) 검은 프레임 없음(평균 휘도)
 4) 마지막 12초 QR을 최종 영상 프레임에서 실제로 디코딩
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, "renders", "LIV_lifting_city_01_1080x1920_6min_silent.mp4")
W, H = 1080, 1920
QR_URL = "https://liv-clinic.net/ko/contact"

result = {"master": os.path.basename(MASTER), "checks": {}}


def probe():
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration,size,bit_rate",
                          "-show_entries", "stream=codec_type,codec_name,width,height,"
                          "r_frame_rate,nb_frames,pix_fmt", "-of", "json", MASTER],
                         capture_output=True, text=True).stdout
    return json.loads(out)


info = probe()
vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
audio = [s for s in info["streams"] if s["codec_type"] == "audio"]
result["checks"]["spec"] = {
    "width": vs["width"], "height": vs["height"], "fps": vs["r_frame_rate"],
    "frames": int(vs["nb_frames"]), "pix_fmt": vs["pix_fmt"],
    "duration_sec": float(info["format"]["duration"]),
    "size_bytes": int(info["format"]["size"]),
    "bitrate_bps": int(info["format"]["bit_rate"]),
    "audio_streams": len(audio),
    "pass": (vs["width"] == W and vs["height"] == H and int(vs["nb_frames"]) == 10800
             and vs["r_frame_rate"] == "30/1" and vs["pix_fmt"] == "yuv420p"
             and abs(float(info["format"]["duration"]) - 360.0) < 0.01
             and len(audio) == 0),
}

# ---------------------------------------------------------------- 2,3) 프레임 스캔
SAMPLE_FPS = 2
proc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-i", MASTER, "-vf", "fps=%d" % SAMPLE_FPS,
     "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    stdout=subprocess.PIPE, bufsize=10 ** 8)

ROSE = np.array([180, 152, 141], np.float32)
frame_bytes = W * H * 3
n = 0
fails = {"dark": [], "pill": [], "logo": [], "clinic": []}
lum_min = 255.0
while True:
    buf = proc.stdout.read(frame_bytes)
    if len(buf) < frame_bytes:
        break
    fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    tsec = n / float(SAMPLE_FPS)

    lum = fr.astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    m = float(lum.mean())
    lum_min = min(lum_min, m)
    if m < 18:
        fails["dark"].append(round(tsec, 2))

    pill = fr[1795:1812, 78:101].reshape(-1, 3).astype(np.float32).mean(axis=0)
    if np.abs(pill - ROSE).max() > 42:
        fails["pill"].append((round(tsec, 2), [round(float(v)) for v in pill]))

    logo_box = lum[84:142, 72:319]
    if float(logo_box.max()) < 170:
        fails["logo"].append(round(tsec, 2))

    clinic_box = lum[86:146, 700:1010]
    if float(clinic_box.max()) < 170:
        fails["clinic"].append(round(tsec, 2))
    n += 1
proc.stdout.close()
proc.wait()

result["checks"]["frame_scan"] = {
    "sampled_frames": n, "sample_fps": SAMPLE_FPS,
    "min_mean_luma": round(lum_min, 2),
    "dark_frames": fails["dark"],
    "footer_pill_missing": fails["pill"][:10],
    "header_logo_missing": fails["logo"][:10],
    "header_clinic_missing": fails["clinic"][:10],
    "pass": not (fails["dark"] or fails["pill"] or fails["logo"] or fails["clinic"]),
}

# ---------------------------------------------------------------- 4) QR 재스캔
qr_rows = []
det = cv2.QRCodeDetector()
tmp = os.path.join(ROOT, "edit", "stills", "qr_scan")
os.makedirs(tmp, exist_ok=True)
for sec in (348.5, 350, 352.5, 355, 357.5, 359.9):
    fp = os.path.join(tmp, "qr_%.1f.png" % sec)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(sec), "-i", MASTER,
                    "-frames:v", "1", fp], check=True)
    img = cv2.imread(fp)
    data, pts, _ = det.detectAndDecode(img)
    qr_rows.append({"t": sec, "decoded": data, "match": data == QR_URL})
result["checks"]["qr_rescan"] = {
    "expected": QR_URL, "samples": qr_rows,
    "pass": all(r["match"] for r in qr_rows),
}

print(json.dumps(result, ensure_ascii=False, indent=1))
with open(os.path.join(ROOT, "edit", "qc_result.json"), "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

allpass = all(v["pass"] for v in result["checks"].values())
print("\nALL PASS" if allpass else "\nFAIL 있음")
sys.exit(0 if allpass else 1)
