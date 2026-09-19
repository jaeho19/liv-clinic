# -*- coding: utf-8 -*-
"""LIV 리프팅 시티 01 - 에셋 전처리.

원본 사진/장비 PNG/로고를 렌더러가 바로 쓸 수 있는 크기로 정규화해 edit/prep/ 에 저장한다.
사람 얼굴·장비 형태는 변형하지 않는다. 크기 조절과 투명영역 트리밍만 수행.
"""
import os
import json
import qrcode
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # output/lifting-city
ASSETS = os.path.join(ROOT, "assets")
PREP = os.path.join(ROOT, "edit", "prep")
os.makedirs(PREP, exist_ok=True)

QR_URL = "https://liv-clinic.net/ko/contact"

report = {}


def save(img, name, **kw):
    p = os.path.join(PREP, name)
    img.save(p, **kw)
    report[name] = list(img.size)
    print(f"  {name:22s} {img.size}")
    return p


print("[1] 인테리어 사진")
# I01: 6000x4000 고해상도 로비 -> 3000x2000 작업본 (세로 크롭 여유 확보)
i01 = Image.open(os.path.join(ASSETS, "interior_lobby.jpg")).convert("RGB")
save(i01.resize((3000, 2000), Image.LANCZOS), "I01.jpg", quality=95, subsampling=0)

# I02~I07: 800x533 -> 1.4배 (패널 최대폭 936px 대응)
for key, fn in [("I02", "interior_01.jpg"), ("I03", "interior_02.jpg"), ("I04", "interior_03.jpg"),
                ("I05", "interior_04.jpg"), ("I06", "interior_05.jpg"), ("I07", "interior_06.jpg")]:
    im = Image.open(os.path.join(ASSETS, fn)).convert("RGB")
    save(im.resize((int(im.width * 1.4), int(im.height * 1.4)), Image.LANCZOS), key + ".jpg",
         quality=95, subsampling=0)

print("[2] 원장 사진 D01 (김수영 대표원장 / doctor-main.jpg 와 동일 파일)")
d01 = Image.open(os.path.join(ASSETS, "doctor_verified.jpg")).convert("RGB")
save(d01.resize((900, 1353), Image.LANCZOS), "D01.jpg", quality=96, subsampling=0)

print("[3] 장비 PNG (투명영역 트리밍 후 높이 1000 정규화, 형태 변형 없음)")
for key, fn in [("E01", "equipment_ultherapy.png"), ("E02", "equipment_thermage.png"),
                ("E03", "equipment_density.png")]:
    im = Image.open(os.path.join(ASSETS, fn)).convert("RGBA")
    box = im.getchannel("A").getbbox()
    im = im.crop(box)
    scale = 1000.0 / im.height
    im = im.resize((max(1, int(round(im.width * scale))), 1000), Image.LANCZOS)
    save(im, key + ".png")

print("[4] 로고 (병원 공식 로고, 색만 변경)")
logo = Image.open(os.path.join(ASSETS, "liv_logo.png")).convert("RGBA")
alpha = logo.getchannel("A")
white = Image.new("RGBA", logo.size, (246, 246, 246, 0))
white.putalpha(alpha)
save(white, "logo_white.png")
ink = Image.new("RGBA", logo.size, (48, 36, 30, 0))
ink.putalpha(alpha)
save(ink, "logo_ink.png")

print("[5] QR (실제 URL 인코딩, 모듈 정수배 확대로 엣지 유지)")
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=4)
qr.add_data(QR_URL)
qr.make(fit=True)
img = qr.make_image(fill_color=(26, 20, 17), back_color=(255, 255, 255)).convert("RGB")
modules = img.size[0]
k = -(-380 // modules)  # 380px 이상이 되는 최소 정수 배율
big = img.resize((modules * k, modules * k), Image.NEAREST)
save(big, "qr.png")
report["qr_meta"] = {"url": QR_URL, "modules_with_border": modules, "scale": k,
                     "px": modules * k, "ec_level": "M"}

with open(os.path.join(PREP, "prep_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print("\n전처리 완료 ->", PREP)
