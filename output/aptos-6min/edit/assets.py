# -*- coding: utf-8 -*-
"""6분 영상 에셋 정리 — 출처와 방법을 기록으로 남긴다.

왜 다시 만드나: 이전 ②③④편의 `prep_assets.py` 가 **원본을 업스케일했다.**
홈페이지용 웹 이미지(600~1200px)를 LANCZOS 로 1.5~2.25배 키워 prep/ 에 넣었고,
1080×1920 화면에서 그게 흐릿하게 보였다. 실측(라플라시안 분산):

    A11 상담   1200x799  -> 1198x1800 (2.25배)   선명도 21   ← 최악
    D01 원장    600x902  ->  900x1353 (1.5배)    선명도 58
    A02 수여식  900x1200 -> 1350x1800 (1.5배)    선명도 346

동시에 **더 좋은 원본이 그대로 남아 있었다** — 로비 6000x4000, 본사 연수·수술실·
연단 4032x3024. prep 이 그걸 두고 작은 파일을 쓴 경우가 있었다.

그래서 에셋을 세 갈래로 나눈다:

  원본   더 큰 원본이 있으면 그걸 줄여 쓴다. AI 를 쓸 이유가 없다.
  업스케일 원본이 진짜 작을 때만 Topaz 로 해상도를 복원한다.
          **얼굴 보정은 끈다** — 켜면 실제 인물의 이목구비를 다시 그린다(실측 확인).
          **글자가 증거인 사진은 제외한다** — 업스케일이 작은 글자를 지어낸다
          (로비 간판 영문이 엉뚱한 글자로 바뀌는 것을 확인했다). 인증서가 여기 해당.
  생성   사실 주장이 없는 것만. 제품 렌더와 추상 배경.
          화면 표기를 "실물 사진"으로 하면 안 된다.

이 스크립트는 **원본 갈래만** 처리한다(로컬 리사이즈, AI 없음). 업스케일·생성
산출물은 `gen/` 에 이미 있고 `look.asset()` 이 키로 먼저 집어 간다.

사용:  PYTHONIOENCODING=utf-8 python assets.py
"""
import json
import os

from PIL import Image, ImageOps

EDIT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(EDIT)))
IMG = os.path.join(REPO, "liv-clinic", "public", "images")
GEN = os.path.join(EDIT, "gen")
os.makedirs(GEN, exist_ok=True)

# key -> (원본 상대경로, 목표 긴 변, 설명)
# 목표 크기는 **원본보다 크게 잡지 않는다**. 키우는 건 업스케일 갈래의 일이다.
FROM_SOURCE = [
    ("A01", "aptos/certificate.jpg",            1707, "인증서 KR0062025 — 글자가 증거라 업스케일 금지"),
    ("A03", "aptos/consultation.jpg",           2800, "조지아 본사 연수"),
    ("A04", "aptos/procedure-main.jpg",         2800, "본사 수술실 연수"),
    ("A05", "aptos/presentation-podium.jpg",    2800, "연단"),
    ("I01", "about/lobby.jpg",                  3000, "로비 — 6000x4000 원본"),
]

# gen/ 에 들어 있는 업스케일·생성 산출물(기록용). 파일은 이미 있다.
DERIVED = [
    ("P01T", "P01T_gen.png", "생성", "GPT Image 2.5 · treatments/aptos.png 참조 · 알파"),
    ("A02",  "A02_up.png",   "업스케일", "Topaz High Fidelity V2 · 얼굴보정 OFF · 900x1200 -> 1800x2400"),
    ("A09",  "A09_up.png",   "업스케일", "Topaz High Fidelity V2 · 얼굴보정 OFF · 1200x1200 -> 2400x2400"),
    ("A10",  "A10_up.png",   "업스케일", "Topaz Low Resolution V2 · 얼굴보정 OFF · 602x903 -> 1806x2709"),
    ("A11",  "A11_up.png",   "업스케일", "Topaz High Fidelity V2 · 얼굴보정 OFF · 1200x799 -> 2400x1598"),
    ("I03",  "I03_up.png",   "업스케일", "Topaz Low Resolution V2 · 800x533 -> 2400x1599"),
    ("I04",  "I04_up.png",   "업스케일", "Topaz Low Resolution V2 · 800x533 -> 2400x1599"),
    ("BG01", "BG01.png",     "생성", "GPT Image 2.5 · 빛줄기 + 먼지"),
    ("BG02", "BG02.png",     "생성", "GPT Image 2.5 · 트래버틴 측광"),
    ("BG03", "BG03.png",     "생성", "GPT Image 2.5 · 수직 광주"),
    ("BG04", "BG04.png",     "생성", "GPT Image 2.5 · 월넛 결"),
    ("BG05", "BG05.png",     "생성", "GPT Image 2.5 · 로즈 안개"),
    ("BG06", "BG06.png",     "생성", "GPT Image 2.5 · 밝은 지면 질감"),
]


def _fit(im, long_side):
    """긴 변을 long_side 로 맞춘다. **원본보다 키우지 않는다.**"""
    s = long_side / float(max(im.size))
    if s >= 1.0:
        return im, 1.0
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))),
                     Image.LANCZOS), s


def main():
    report = {"from_source": [], "derived": [], "skipped": []}
    for key, rel, long_side, note in FROM_SOURCE:
        src = os.path.join(IMG, rel)
        if not os.path.isfile(src):
            report["skipped"].append({"key": key, "src": rel, "why": "원본 없음"})
            print("  %-5s 원본 없음: %s" % (key, rel))
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        before = im.size
        im, scale = _fit(im, long_side)
        out = os.path.join(GEN, key + "_src.jpg")
        im.save(out, quality=96, subsampling=0)
        report["from_source"].append({
            "key": key, "src": rel, "src_px": list(before), "out_px": list(im.size),
            "scale": round(scale, 3), "method": "원본 축소" if scale < 1 else "원본 그대로",
            "note": note})
        print("  %-5s %-36s %s -> %s  (%s)" %
              (key, rel, before, im.size, "축소" if scale < 1 else "그대로"))

    for key, fn, method, note in DERIVED:
        p = os.path.join(GEN, fn)
        if os.path.isfile(p):
            px = list(Image.open(p).size)
            report["derived"].append({"key": key, "file": fn, "px": px,
                                      "method": method, "note": note})
            print("  %-5s %-16s %s  [%s]" % (key, fn, px, method))
        else:
            report["skipped"].append({"key": key, "file": fn, "why": "아직 없음"})
            print("  %-5s %-16s 아직 없음" % (key, fn))

    with open(os.path.join(GEN, "asset_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print("\n기록 -> gen/asset_report.json")


if __name__ == "__main__":
    main()
