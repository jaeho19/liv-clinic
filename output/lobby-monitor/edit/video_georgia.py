# -*- coding: utf-8 -*-
"""3편 〈조지아에서 배워 왔습니다〉 180초 / 5,400프레임.

- 1080x1920 / 30fps CFR / 무음. 상·하단 고정 크롬은 전 구간 노출한다.
- 블록 8개(12~34초 가변)를 이어 붙이고 경계만 0.4초 크로스 디졸브한다.
  마지막 H 블록에는 뒤쪽 디졸브를 걸지 않는다 - QR 영역 고정 규격과 충돌한다.
- 이 편의 화면은 전부 실사진이다(직접 그린 도해가 없다). 그래서 2편의
  '개념도 / 실물 사진' 구석 표기는 가져오지 않았다.

사용:
  python video_georgia.py --chunk 0           # 0~5, 900프레임씩 -> edit/scenes/G00.mp4
  python video_georgia.py --stills 8,12,80 --out stills/v3
"""
import argparse
import os
import sys
from functools import lru_cache

from PIL import Image, ImageDraw, ImageEnhance

EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)
OUTPUT = os.path.dirname(ROOT)
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

from liv_video.spec import (W, H, FPS, SAFE, ROSE, ROSE_T, BROWN, OFFW, CHAR,
                            INK, CREAM, FLOOR, PHONE, ADDRESS, QR_TEXT, set_dirs)
set_dirs(os.path.join(OUTPUT, "lifting-city", "edit", "fonts"),
         os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))

from liv_video.anim import clamp01, p, eo, eio, vis
from liv_video.draw import T, put, rule, card, CARD, softplate
from liv_video.media import asset, photo_panel, clip_frame, ambient_plate, photo_plate, kb
from liv_video.chrome import draw_chrome
from liv_video.encode import encode_range

TOTAL_FRAMES = 5400
XF = 12                     # 블록 경계 크로스 디졸브 프레임 수
CHUNKS = 6
CHUNK_FRAMES = TOTAL_FRAMES // CHUNKS
SCENEDIR = os.path.join(EDIT, "scenes")


# ---------------------------------------------------------------- 배경
# 켄번즈 최저 속도(초당 줌 증가량). 2편 구현자가 실제 인코딩으로 잰 값을 그대로
# 가져왔다: 0.0034/s 는 freezedetect(n=0.001:d=3) 4건, 0.0084/s 는 0건.
# 이보다 느리면 블러 플레이트의 프레임 간 변화가 x264 양자화 아래로 내려가
# 디코딩 결과가 앞 프레임과 똑같아진다. 검수 합격선은 0건이다.
KB_RATE = 0.009


def _z1(span, z0=1.0):
    """span 초 동안 쓸 도착 줌. 짧은 구간은 1편과 같은 0.17 이동을 유지한다."""
    return z0 + max(0.17, KB_RATE * span)


def _amb(key, prog, blur=24, dim=0.46, z0=1.0, z1=1.17, sway=1):
    """블러 앰비언트 플레이트를 켄번즈로 천천히 민다(완전 정지 구간을 안 만든다)."""
    return kb(ambient_plate(key, blur, dim), prog, z0, z1,
              0.5 - 0.055 * sway, 0.5 + 0.045 * sway,
              0.5 + 0.055 * sway, 0.5 - 0.045 * sway)


def _live_frame(key, idx, dim):
    """생성 클립의 한 프레임. 앰비언트와 같은 정도로 감광하되 블러는 안 건다."""
    im = clip_frame(key, idx)
    return ImageEnhance.Brightness(im).enhance(1.0 - dim) if dim > 0 else im


def _bg_clip(key, t, cut, span=24.0, blur=24, dim=0.46, z0=1.0, z1=None, sway=1):
    """0~cut초는 생성 클립, 이후는 블러 플레이트를 가로 드리프트시킨다.

    2편 원본은 `kw.get()` 으로 옵션을 읽어 `dim` 을 오타내도 조용히 기본값으로
    렌더됐고, 라이브 구간에는 감광이 아예 안 걸려 앞 6초 배경만 훨씬 밝았다
    (H04 는 t=6 에서 조판 잉크 박스 픽셀의 35%가 휘도 150 초과). 둘 다 고쳤다:
    옵션은 명시적 키워드 인자로 받고, 라이브 프레임에도 같은 dim 을 적용한다.
    """
    if z1 is None:
        z1 = _z1(span, z0)
    amb = _amb(key, clamp01((t - cut) / max(1e-6, span)), blur, dim, z0, z1, sway)
    if t >= cut + 0.7:
        return amb
    live = _live_frame(key, int(t * FPS) + 1, dim)
    return live if t <= cut else Image.blend(live, amb, eio((t - cut) / 0.7))


# 배경을 공유하는 블록(B+C, E+F)은 통시각으로 이어서 민다. 블록마다 진행도를
# 0부터 다시 시작하면 경계에서 배경이 되감긴다(2편 실측).
CLIP_CUT = 6.0                  # 생성 클립을 그대로 보여 주는 앞 구간
H04_SPAN = 46.0                 # B(30) + C(22) - CLIP_CUT
H03_SPAN = 48.0                 # E(26) + F(28) - CLIP_CUT


def _h04_amb(t_since_b):
    return _amb("H04", clamp01((t_since_b - CLIP_CUT) / H04_SPAN), 24, 0.50,
                1.0, _z1(H04_SPAN), sway=1)


def _h03_amb(t_since_e):
    return _amb("H03", clamp01((t_since_e - CLIP_CUT) / H03_SPAN), 24, 0.52,
                1.0, _z1(H03_SPAN), sway=-1)


# ---------------------------------------------------------------- 공통 조각
def eyebrow(img, t, text, y, t0, t1=None, fill=ROSE_T, size=44, x=SAFE):
    """왼쪽 로즈 괘선 + 작은 안내 문구(1·2편 조판과 동일)."""
    a, r = vis(t, t0, t1, 0.45)
    if a <= 0:
        return
    rule(img, x, y - 26, 96 * r, 5, ROSE, a)
    T(img, text, x, y, "m", size, fill, "l", "a", a, shadow=150, blur=10)


def photo_still(img, t, t0, t1, key, box, panel=None):
    """사진 한 컷을 정지 배치한다 - 켄번즈를 걸지 않는다.

    box = (x, y, w, h), panel = photo_panel 의 (dim, cx, cy).
    등장 때만 30px 슬라이드하고 그 뒤로는 한 픽셀도 안 움직인다. 배경 플레이트는
    계속 흐르므로 화면 전체가 멈추지는 않는다(freezedetect 대응).
    """
    a, r = vis(t, t0, t1, 0.6, 0.45)
    if a <= 0:
        return
    x, y, pw, ph = box
    dim, cx, cy = panel or (0.0, 0.5, 0.5)
    im, pad = photo_panel(key, pw, ph, 24, dim, cx, cy)
    put(img, im, (x - pad, y - pad + int((1 - r) * 30)), a)


def duo(img, t, t0, t1, l1, l2, y1, y2, s1, s2, plate=None, pa=124, f1=OFFW,
        f2=ROSE_T, k1="xb", k2="m", lead=0.3):
    """가운데 정렬 두 줄 조판. plate=(cy, w, h) 를 주면 뒤에 소프트플레이트를 깐다."""
    a, r = vis(t, t0, t1, 0.6, 0.45)
    if a <= 0:
        return
    if plate:
        cy, pw, ph = plate
        softplate(img, W / 2, cy, pw, ph, a, a=pa, radius=80, blur=32)
    T(img, l1, W / 2, y1 + int((1 - r) * 22), k1, s1, f1, "m", "a", a,
      shadow=190, blur=18, maxw=W - 2 * SAFE)
    if l2:
        T(img, l2, W / 2, y2, k2, s2, f2, "m", "a", a * eo(p(t, t0 + lead, 0.5)),
          shadow=170, blur=14, maxw=W - 2 * SAFE)


@lru_cache(maxsize=2)
def qr_card():
    """1·2편과 같은 구성의 상담 안내 카드. 마지막 12초 동안 한 픽셀도 안 움직인다.

    모서리를 둥글리지 않는다: 카드가 안전영역 폭(72~1008)을 정확히 채우므로
    라운드를 주면 네 귀퉁이로 켄번즈 중인 배경이 비쳐 'QR 영역 고정' 규격을 깬다.
    대신 안쪽에 로즈 괘선을 둘러 카드로 읽히게 했다.
    """
    cw, ch = W - 2 * SAFE, 900
    base, pad = card(cw, ch, 0, CREAM, shadow=150)
    img = base.copy()
    # 괘선은 반드시 불투명하게 긋는다. ImageDraw 는 합성이 아니라 픽셀을
    # 덮어쓰므로 반투명 색을 주면 그 줄만 알파가 낮아져 뒤 배경이 비치고,
    # 배경이 켄번즈로 움직이는 순간 'QR 영역 고정'이 깨진다(2편 실측: 최대 20).
    ImageDraw.Draw(img).rectangle([pad + 18, pad + 18, pad + cw - 18, pad + ch - 18],
                                  outline=ROSE_T + (255,), width=2)
    cx = pad + cw / 2
    T(img, "상담 안내", cx, pad + 56, "b", 58, INK, "m")
    rule(img, cx - 40, pad + 140, 80, 5, ROSE)
    qs = 396
    qi = asset("qr").resize((qs, qs), Image.NEAREST).convert("RGBA")
    frame = Image.new("RGBA", (qs + 44, qs + 44), (255, 255, 255, 255))
    frame.alpha_composite(qi, (22, 22))
    img.alpha_composite(frame, (int(cx - (qs + 44) / 2), pad + 186))
    y = pad + 186 + qs + 44 + 34
    T(img, QR_TEXT, cx, y, "m", 38, CHAR, "m")
    T(img, PHONE, cx, y + 62, "b", 66, INK, "m")
    T(img, ADDRESS, cx, y + 150, "m", 36, CHAR, "m", maxw=cw - 80)
    # draw.put() 은 paste(mask=원본알파)라 글자 안티앨리어싱 가장자리에서 카드의
    # 알파까지 같이 낮춘다(2편 실측: 그 픽셀들이 최대 5씩 흔들렸다). 카드 사각형
    # 안쪽은 알파를 255로 되돌려 검사 영역 전체를 불투명하게 만든다.
    alpha = img.getchannel("A")
    alpha.paste(255, (pad, pad, pad + cw + 1, pad + ch + 1))
    img.putalpha(alpha)
    return img, pad


# ================================================================ BLOCKS
# A01(1422x2000) 안에서 잰 잉크 세로 위치:
#   KR0062025  0.355~0.368 / Kim Sooyoung 0.650~0.694
# 끝 프레임에서 두 문자열이 동시에 크롬 바깥(세로 340~1440)에 남도록 도착 중심을
# 0.65 로 잡았다. 줌 1.55 가 상한이다 - 1.70 이면 세로 가시범위가 0.588 로 줄어
# 두 문자열 간격 0.339 를 크롬 사이 1,100px 안에 넣을 수 없다.
A_ZOOM = (1.0, 1.55)
A_CY = (0.42, 0.65)


def a_certificate(tl):
    """0:00-0:14 훅 - 인증서를 천천히 밀어 이름과 번호가 읽히게 한다."""
    img = kb(photo_plate("A01", zoom_room=1.30), p(tl, 0.4, 12.0),
             A_ZOOM[0], A_ZOOM[1], 0.5, A_CY[0], 0.5, A_CY[1])
    # 인증서 본문 위에 조판이 얹히는 자리라 플레이트를 다른 블록(124)보다 훨씬
    # 진하게 깐다. 124 로는 뒤 영문 본문이 비쳐 두 글자가 뭉개졌다(스틸 실측).
    duo(img, tl, 4.0, None, "Kim Sooyoung", "KR0062025", 1466, 1568, 72, 88,
        plate=(1568, 1180, 300), pa=252, k2="xb", lead=0.6)
    return img


# 본사 연수 사진은 설계서 3장이 "각 12초 이내, 확대 없이 정지 컷"으로 못박았다.
# 사진 패널에는 켄번즈를 걸지 않고, 뒤 배경 플레이트만 움직인다.
B_PHOTO = (218, 600, 645, 860)          # x, y, w, h - 3:4 원본 비율 그대로
# 사진이 화면에 실제로 떠 있는 시간 = t1 + fout(0.45) - t0 = 11.95초.
# 설계서의 "각 12초 이내"를 페이드아웃까지 포함해 지킨다.
B_SEGS = ((0.0, 11.5, "A03", "APTOS 본사 연수"),
          (12.0, 23.5, "A04", "본사 수술실 교육"))


def b_georgia(tl):
    """0:14-0:44 조지아 - 본사 연수 2컷(각 12초) + 조판 6초."""
    img = _bg_clip("H04", tl, CLIP_CUT, span=H04_SPAN, dim=0.50)

    # 조판 띠는 두 구간에 걸쳐 한 장만 깐다. H04 는 밝은 석재 회랑이라
    # 소프트플레이트 없이는 흰 글자가 묻힌다(라이브 6초 구간에서 특히).
    a, _r = vis(tl, 0.4, 23.2, 0.6, 0.45)
    if a > 0:
        softplate(img, W / 2, 505, 940, 260, a * 0.9, a=124, radius=80, blur=32)
    eyebrow(img, tl, "조지아 트빌리시", 446, 0.4, 23.2)
    for t0, t1, key, head in B_SEGS:
        duo(img, tl, t0, t1, head, None, 520, 0, 72, 0)
        photo_still(img, tl, t0, t1, key, B_PHOTO)

    duo(img, tl, 24.0, None, "조지아 트빌리시", "APTOS 본사", 860, 1040, 88, 64,
        plate=(966, 940, 380), k2="b", lead=0.4)
    a, _r = vis(tl, 24.0, None, 0.6, 0.45)
    if a > 0:
        rule(img, W / 2 - 70, 986, 140, 5, ROSE, a * eo(p(tl, 24.3, 0.5)))
    return img


def c_ceremony(tl):
    """0:44-1:06 수여 - 본사 깃발 앞 인증서 수여."""
    img = _h04_amb(30.0 + tl)
    duo(img, tl, 0.3, None, "APTOS Professional Course 수료",
        "Certified by G. · M. · C. Sulamanidze MD-PhD", 452, 546, 66, 40,
        plate=(505, 940, 260), lead=0.4)
    photo_still(img, tl, 0.3, None, "A02", B_PHOTO, panel=(0.0, 0.5, 0.52))
    return img


def d_lecture(tl):
    """1:06-1:40 학회 - 발표 스크린의 이름·병원명, 그리고 AXA 연단.

    A09(1800x1800)는 정사각이라 9:16 전면 크롭이 가로의 44%를 잘라낸다. 스크린의
    "Kim, Soo Young" 은 가로 0.453~0.978 구간에 있어 전면 크롭으로는 통째로 담기지
    않고, 확대하면 화면 밖으로 밀려난다. 가로 전체를 살리는 패널로 배치하면
    936/1800 = 0.52 축소이고 원본 글자 높이 105px 가 화면 55px 로 남는다
    - 본문 자막(44px)보다 크다.
    """
    img = _bg_clip("H05", tl, CLIP_CUT, span=28.0, dim=0.52, blur=26, sway=-1)

    photo_still(img, tl, 0.0, 16.7, "A09", (SAFE, 440, 936, 760),
                panel=(0.0, 0.5, 0.56))
    photo_still(img, tl, 17.0, None, "A10", (SAFE, 400, 936, 840),
                panel=(0.0, 0.5, 0.62))
    duo(img, tl, 0.2, 16.7, "학회 발표", "Kim, Soo Young · Liv Plastic Surgery",
        1240, 1348, 76, 44, plate=(1330, 940, 240))
    duo(img, tl, 17.2, None, "Aptos Xperts Alliance", "압토스 국제 조직 연단",
        1310, 1400, 64, 44, plate=(1370, 940, 230))
    return img


def e_consult(tl):
    """1:40-2:06 상담 - 얼굴 부위를 짚으며 설명하는 실제 상담 장면."""
    img = _bg_clip("H03", tl, CLIP_CUT, span=H03_SPAN, dim=0.52, sway=-1)

    eyebrow(img, tl, "상담실에서", 450, 0.3)
    photo_still(img, tl, 0.4, None, "A11", (SAFE, 540, 936, 620))
    duo(img, tl, 1.0, None, "얼굴의 상태와 원하는 변화를", "함께 봅니다",
        1210, 1310, 64, 64, plate=(1300, 940, 260), f2=OFFW, k2="xb", lead=0.6)
    return img


F_FRAME = (260, 380, 560, 842)          # 월넛 액자 안 D01 자리 (1편 M07 연출)


def f_person(tl):
    """2:06-2:34 사람 - 로비 정면(14초) → 스튜디오 정면(14초)."""
    img = _h03_amb(26.0 + tl)

    photo_still(img, tl, 0.3, 13.7, "A12", (SAFE, 540, 936, 670))

    a, r = vis(tl, 14.0, None, 0.6, 0.45)
    if a > 0:
        fx, fy, fw, fh = F_FRAME
        dy = int((1 - r) * 30)
        CARD(img, fx - 22, fy - 22, fw + 44, fh + 44, 20, BROWN, a, dy=dy)
        im, pad = photo_panel("D01", fw, fh, 10, 0.0, 0.5, 0.5, 0, False)
        put(img, im, (fx - pad, fy - pad + dy), a)

    duo(img, tl, 0.8, None, "김수영 대표원장", "성형외과 전문의",
        1300, 1398, 76, 48, plate=(1370, 940, 240))
    return img


def g_floor(tl):
    """2:34-2:48 연결 - 실제 상담실과 층 안내."""
    img = kb(photo_plate("I07", blur=18, dim=0.58), p(tl, 0, 14), 1.0, _z1(14.0),
             0.44, 0.5, 0.56, 0.5)
    photo_still(img, tl, 0.4, None, "I04", (SAFE, 500, 936, 560),
                panel=(0.04, 0.5, 0.5))
    duo(img, tl, 1.0, None, FLOOR + "에서", "상담합니다", 1130, 1240, 84, 84,
        plate=(1240, 940, 340), k2="xb", lead=0.6)
    return img


def h_outro(tl):
    """2:48-3:00 마무리 - 배경만 천천히 움직이고 QR 카드는 완전 고정."""
    img = kb(photo_plate("I03", blur=20, dim=0.62), p(tl, 0, 12), 1.14,
             _z1(12.0, 1.14), 0.44, 0.5, 0.56, 0.5)
    T(img, "김수영 대표원장 상담", W / 2, 452, "m", 50, ROSE_T, "m", "a",
      eo(p(tl, 0.2, 0.6)), shadow=160, blur=12)
    im, pad = qr_card()
    put(img, im, (SAFE - pad, 560 - pad), eo(p(tl, 0.2, 1.0)))
    return img


BLOCKS = [
    dict(id="A", start=0.0, dur=14.0, fn=a_certificate),
    dict(id="B", start=14.0, dur=30.0, fn=b_georgia),
    dict(id="C", start=44.0, dur=22.0, fn=c_ceremony),
    dict(id="D", start=66.0, dur=34.0, fn=d_lecture),
    dict(id="E", start=100.0, dur=26.0, fn=e_consult),
    dict(id="F", start=126.0, dur=28.0, fn=f_person),
    dict(id="G", start=154.0, dur=14.0, fn=g_floor),
    dict(id="H", start=168.0, dur=12.0, fn=h_outro),
]


# ---------------------------------------------------------------- 프레임 조립
def _block_at(i):
    t = i / float(FPS)
    for k, b in enumerate(BLOCKS):
        if b["start"] <= t < b["start"] + b["dur"] or k == len(BLOCKS) - 1:
            return k
    return len(BLOCKS) - 1


def render_block(k, i):
    b = BLOCKS[k]
    return b["fn"](i / float(FPS) - b["start"])


def render_frame(i):
    k = _block_at(i)
    img = render_block(k, i)
    half = XF // 2
    b0 = int(round(BLOCKS[k]["start"] * FPS))
    if k > 0 and (i - b0) < half:
        img = Image.blend(render_block(k - 1, i), img, eio((i - (b0 - half)) / float(XF)))
    if k < len(BLOCKS) - 1:
        b1 = int(round((BLOCKS[k]["start"] + BLOCKS[k]["dur"]) * FPS))
        if (b1 - i) <= half:
            img = Image.blend(img, render_block(k + 1, i), eio((i - (b1 - half)) / float(XF)))
    draw_chrome(img)
    return img


# ---------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunk", type=int, help="0~%d, %d프레임씩" % (CHUNKS - 1, CHUNK_FRAMES))
    ap.add_argument("--stills", type=str, help="쉼표로 구분한 초 단위 시간")
    ap.add_argument("--out", type=str, default=None)
    ap.add_argument("--crf", type=int, default=12)
    args = ap.parse_args()

    if args.stills:
        outdir = args.out or os.path.join(EDIT, "stills")
        if not os.path.isabs(outdir):
            outdir = os.path.join(EDIT, outdir)
        os.makedirs(outdir, exist_ok=True)
        for s in args.stills.split(","):
            sec = float(s)
            i = max(0, min(TOTAL_FRAMES - 1, int(round(sec * FPS))))
            fp = os.path.join(outdir, "t%07.2f.png" % sec)
            render_frame(i).save(fp)
            print("still", fp, flush=True)
        return

    if args.chunk is not None:
        if not 0 <= args.chunk < CHUNKS:
            ap.error("--chunk 는 0~%d" % (CHUNKS - 1))
        os.makedirs(SCENEDIR, exist_ok=True)
        out = args.out or os.path.join(SCENEDIR, "G%02d.mp4" % args.chunk)
        encode_range(render_frame, args.chunk * CHUNK_FRAMES,
                     (args.chunk + 1) * CHUNK_FRAMES, out, args.crf)
        print("done", out, flush=True)
        return

    ap.error("--chunk 또는 --stills 중 하나가 필요합니다")


if __name__ == "__main__":
    main()
