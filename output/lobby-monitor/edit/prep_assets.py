# -*- coding: utf-8 -*-
"""②③④편 에셋 전처리.

인물·장비·제품의 형태는 바꾸지 않는다. EXIF 회전 보정, 크기 정규화, 복사만 한다.
"""
import json
import os
import shutil
import sys

from PIL import Image, ImageOps

EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)                       # output/lobby-monitor
OUTPUT = os.path.dirname(ROOT)                     # output
REPO = os.path.dirname(OUTPUT)
IMG = os.path.join(REPO, "liv-clinic", "public", "images")
CITY_PREP = os.path.join(OUTPUT, "lifting-city", "edit", "prep")
PREP = os.path.join(EDIT, "prep")
os.makedirs(PREP, exist_ok=True)

sys.path.insert(0, OUTPUT)
from liv_video.qr import qr_image                                  # noqa: E402
from liv_video.spec import QR_URL                                  # noqa: E402

report = {}


def _save(im, name, **kw):
    im.save(os.path.join(PREP, name), **kw)
    report[name] = list(im.size)
    print("  %-14s %s" % (name, im.size))


def _load(rel, exif=False):
    im = Image.open(os.path.join(IMG, rel))
    if exif:
        im = ImageOps.exif_transpose(im)
    return im


def _fit_w(im, w):
    return im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)


def _fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


print("[1] 압토스 실물 제품 사진 (APTOS Visage 박스 + 실)")
p01 = _load("treatments/aptos.png").convert("RGBA")
p01 = p01.crop(p01.getchannel("A").getbbox())
_save(p01, "P01.png")

# 실만 분리: 보라 박스가 아닌 불투명 픽셀의 bbox
import numpy as np                                                  # noqa: E402
arr = np.asarray(p01)
opaque = arr[..., 3] > 40
r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
purple = (b - r > 25) & (b > 90)
thread = opaque & ~purple
# 박스의 흰색 로고/문구(APTOS, Excellence Method, 4th generation, Visage)와
# 가장자리 안티앨리어싱 프린지는 보라색 판정(b-r>25)을 통과하지 못해 "실"로
# 오분류된다. 실측 결과 그 오염 픽셀이 세로 81.5%(y=627/769)까지 존재해
# 0.42로는 박스가 크게 섞여 들어온다 (육안 확인으로 발견). 82%로 한정해야
# 박스 잔여 없이 깨끗하게 잘린다.
h = thread.shape[0]
thread[: int(h * 0.82), :] = False
ys, xs = np.where(thread)
tbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
print("  실 bbox:", tbox)
_save(_fit_w(p01.crop(tbox), 1600), "P01T.png")

print("[2] 압토스 연수·인증 실사진")
_save(_fit_h(_load("aptos/certificate.jpg").convert("RGB"), 2000), "A01.jpg",
      quality=95, subsampling=0)
_save(_fit_h(_load("aptos/certification-ceremony.jpg").convert("RGB"), 1800), "A02.jpg",
      quality=95, subsampling=0)
for key, rel in [("A03", "aptos/consultation.jpg"), ("A04", "aptos/procedure-main.jpg"),
                 ("A05", "aptos/presentation-podium.jpg")]:
    im = _load(rel, exif=True).convert("RGB")
    _save(_fit_w(im, 2400) if im.width >= im.height else _fit_h(im, 2400),
          key + ".jpg", quality=95, subsampling=0)
_save(_fit_w(_load("aptos/presentation-mips.jpg").convert("RGB"), 1800), "A06.jpg",
      quality=95, subsampling=0)
_save(_load("media-news/aptos-procedure.jpg").convert("RGB"), "A08.jpg",
      quality=95, subsampling=0)

print("[2-2] 원장 활동 실사 (학회·상담·로비)")
_save(_fit_w(_load("media-news/academic-lecture.jpg").convert("RGB"), 1800), "A09.jpg",
      quality=96, subsampling=0)
_save(_fit_h(_load("media-news/axa-conference-2026.jpg").convert("RGB"), 1600), "A10.jpg",
      quality=96, subsampling=0)
_save(_fit_w(_load("media-news/director-consult.jpg").convert("RGB"), 1800), "A11.jpg",
      quality=96, subsampling=0)
_save(_fit_w(_load("media-news/director-portrait.jpg").convert("RGB"), 1200), "A12.jpg",
      quality=96, subsampling=0)

print("[3] 원장 사진")
_save(_load("doctor/doctor-main.jpg").convert("RGB").resize((900, 1353), Image.LANCZOS),
      "D01.jpg", quality=96, subsampling=0)
_save(_fit_h(_load("doctor/doctor-2.jpg").convert("RGB"), 1353), "D02.jpg",
      quality=96, subsampling=0)

print("[4] 1편 전처리 결과 재사용")
for name in ("I01.jpg", "I02.jpg", "I03.jpg", "I04.jpg", "I05.jpg", "I06.jpg",
             "I07.jpg", "E01.png", "E02.png", "E03.png",
             "logo_white.png", "logo_ink.png"):
    shutil.copy2(os.path.join(CITY_PREP, name), os.path.join(PREP, name))
    report[name] = "copied"
    print("  %-14s copied" % name)

print("[5] QR")
_save(qr_image(QR_URL, 380), "qr.png")
report["qr_meta"] = {"url": QR_URL, "ec_level": "M"}

with open(os.path.join(PREP, "prep_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print("\n전처리 완료 ->", PREP)
