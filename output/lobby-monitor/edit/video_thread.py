# -*- coding: utf-8 -*-
"""②편 〈실이 하는 일〉 240초 / 7,200프레임.

- 1080x1920 / 30fps CFR / 무음. 상·하단 고정 크롬은 전 구간 노출한다.
- 블록 9개(12~40초 가변)를 이어 붙이고 경계만 0.4초 크로스 디졸브한다.
  마지막 I 블록에는 뒤쪽 디졸브를 걸지 않는다 - QR 영역 고정 규격과 충돌한다.
- 실물(제품 사진)과 개념도(직접 그린 도해)를 화면 구석 표기로 구분한다.

사용:
  python video_thread.py --chunk 0            # 0~7, 900프레임씩 -> edit/scenes/C00.mp4
  python video_thread.py --stills 3,20,40 --out stills/v2
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
                            INK, CREAM, WHITE, CLINIC, FLOOR, PHONE, ADDRESS,
                            QR_TEXT, set_dirs)
set_dirs(os.path.join(OUTPUT, "lifting-city", "edit", "fonts"),
         os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))

from liv_video.anim import clamp01, p, eo, eio, vis, reveal
from liv_video.draw import T, TL, put, rule, card, CARD, softplate, twidth, fit_size
from liv_video.media import asset, cover, photo_panel, clip_frame, ambient_plate, photo_plate, kb
from liv_video.chrome import draw_chrome
from liv_video.encode import encode_range

import thread_anim as ta
import particle_anim as pa
import face_diagram as fd

TOTAL_FRAMES = 7200
XF = 12                     # 블록 경계 크로스 디졸브 프레임 수
CHUNKS = 8
CHUNK_FRAMES = TOTAL_FRAMES // CHUNKS
SCENEDIR = os.path.join(EDIT, "scenes")

NOTE_DIAGRAM = "개념도"
NOTE_PHOTO = "실물 사진"
NOTE_Y = 1560
NOTE_SIZE = 44


# ---------------------------------------------------------------- 배경
# 켄번즈 최저 속도(초당 줌 증가량). 이보다 느리면 블러 플레이트의 프레임 간 변화가
# x264 양자화 아래로 내려가 인코딩 결과가 앞 프레임과 똑같아지고, 검수의
# freezedetect(n=0.001:d=3) 가 '정지 구간'으로 잡는다. B 블록 20초를 실제로
# 인코딩해 잰 값: 0.0034/s 는 4건, 0.0084/s 는 0건 (블러·디더 조정 없이 해소).
KB_RATE = 0.009


def _z1(span, z0=1.0):
    """span 초 동안 쓸 도착 줌. 짧은 구간은 ①편과 같은 0.17 이동을 유지한다."""
    return z0 + max(0.17, KB_RATE * span)


def _amb(key, prog, blur=24, dim=0.46, z0=1.0, z1=1.17, sway=1):
    """블러 앰비언트 플레이트를 켄번즈로 천천히 민다(완전 정지 구간을 안 만든다)."""
    return kb(ambient_plate(key, blur, dim), prog, z0, z1,
              0.5 - 0.055 * sway, 0.5 + 0.045 * sway,
              0.5 + 0.055 * sway, 0.5 - 0.045 * sway)


def _live_frame(key, t, dim):
    """생성 클립 한 장 - 앰비언트와 같은 정도로 감광하고 아주 느리게 밀어 넣는다.

    감광: ambient_plate 는 blur 와 dim 을 함께 하므로 라이브 경로에 그대로 못 쓴다.
    라이브는 선명해야 하니 밝기만 낮춘다. 감광을 빼먹으면 블록 앞 6초 동안만 배경이
    원본 밝기로 나와 그 위 조판이 묻힌다. 고치기 전 실측(잉크 박스 안 배경
    평균휘도 / 150 초과 픽셀 비율): G 제목 자리가 t=6초에 150 / 50%,
    D 제목 자리가 135 / 27%, E 제목 자리가 116 / 3%.

    푸시인: 생성 클립 중에는 거의 움직이지 않는 것이 있다(프레임 간 평균 절대차
    실측 H04 1.988 / H03 1.108 / H06 0.172). 감광까지 걸면 H06 라이브 6초가 통째로
    정지 구간이 된다(실측: freezedetect 106.3~111.2초 4.9초). 앰비언트와 같은
    KB_RATE 로 아주 느리게 당겨 어느 클립이 와도 화면이 멈추지 않게 한다.
    """
    im = clip_frame(key, int(t * FPS) + 1)
    im = cover(im, W, H, 0.5, 0.5, 1.0 + KB_RATE * max(0.0, t))
    return ImageEnhance.Brightness(im).enhance(1.0 - dim) if dim > 0.004 else im


def _bg_clip(key, t, cut, span=24.0, blur=24, dim=0.46, z0=1.0, z1=None, sway=1):
    """0~cut초는 생성 클립(감광만), 이후는 블러 플레이트를 가로 드리프트시킨다.

    옵션을 **kw 로 받지 않는 이유: 이름을 잘못 적어도 예외 없이 조용히 기본값으로
    렌더돼 한 블록 배경이 통째로 틀린 채 넘어간다.
    """
    amb = _amb(key, clamp01((t - cut) / max(1e-6, span)), blur, dim,
               z0, _z1(span, z0) if z1 is None else z1, sway)
    if t >= cut + 0.7:
        return amb
    live = _live_frame(key, t, dim)
    return live if t <= cut else Image.blend(live, amb, eio((t - cut) / 0.7))


# A~C 블록은 같은 H01 플레이트를 쓴다. 블록마다 진행도를 0부터 다시 시작하면
# 경계에서 배경이 되감기므로, B 시작을 0으로 잡은 통시각으로 이어서 민다.
H01_SPAN = 58.0                 # B(20초) + C(38초)


def _h01_amb(t_since_b):
    return _amb("H01", t_since_b / H01_SPAN, 26, 0.50,
                1.05, _z1(H01_SPAN, 1.05), sway=-1)


# ---------------------------------------------------------------- 공통 조각
def corner_note(img, text, alpha=1.0, y=NOTE_Y):
    """개념도 / 실물 사진 구분 표기.

    thread_anim.draw_note 는 30px·CHAR(어두운 회색) 고정이라 어두운 배경 위
    1080폭 화면에서 거의 읽히지 않는다(스틸 대조 실측). 모듈은 태스크 3 소유라
    건드리지 않고, 같은 자리에 같은 문구를 본문 크기(44px)로 직접 그린다.
    """
    if alpha <= 0.004:
        return
    tw = twidth(text, "m", NOTE_SIZE)
    softplate(img, W - SAFE - tw / 2.0, y + 28, tw + 104, 104, alpha * 0.8,
              a=118, radius=52, blur=24)
    T(img, text, W - SAFE, y, "m", NOTE_SIZE, OFFW, "r", "a", alpha,
      shadow=150, blur=10)


def eyebrow(img, t, text, y, t0, t1=None, fill=ROSE_T, size=44, x=SAFE):
    """왼쪽 로즈 괘선 + 작은 안내 문구(①편 조판과 동일)."""
    a, r = vis(t, t0, t1, 0.45)
    if a <= 0:
        return
    rule(img, x, y - 26, 96 * r, 5, ROSE, a)
    T(img, text, x, y, "m", size, fill, "l", "a", a, shadow=150, blur=10)


@lru_cache(maxsize=4)
def product_src(key):
    """압토스 실물 컷아웃 PNG(투명 배경).

    공용 media.asset() 은 키 화이트리스트로 확장자를 정하므로 P01/P01T 를
    모르고 .jpg 를 찾는다. 공용 모듈을 고치는 대신 여기서 직접 읽는다.
    """
    return Image.open(os.path.join(EDIT, "prep", key + ".png")).convert("RGBA")


@lru_cache(maxsize=8)
def product_panel(key, w, h, inset=44, radius=28, fill=CREAM):
    """투명 배경 제품 컷아웃을 카드 위에 비율 그대로 얹는다.

    photo_panel 은 커버 크롭이라 2:1 제품 사진의 좌우를 잘라먹고, 투명 영역의
    알파도 라운드 마스크로 덮어써 배경이 드러난다. 그래서 컨테인 배치로 따로 만든다.
    """
    base, pad = card(int(w), int(h), int(radius), tuple(fill), 140)
    img = base.copy()
    src = product_src(key)
    s = min((w - 2 * inset) / float(src.width), (h - 2 * inset) / float(src.height))
    im = src.resize((max(1, int(src.width * s)), max(1, int(src.height * s))),
                    Image.LANCZOS)
    img.alpha_composite(im, (int(pad + (w - im.width) / 2), int(pad + (h - im.height) / 2)))
    return img, pad


@lru_cache(maxsize=2)
def thread_macro_plate():
    """P01T(실만 분리한 실물)를 화면보다 크게 깔아 매크로 질감을 만든다."""
    plate = ambient_plate("H01", 30, 0.58)
    base = plate.copy()
    src = product_src("P01T")
    tw = int(base.width * 1.45)
    im = src.resize((tw, max(1, round(src.height * tw / float(src.width)))), Image.LANCZOS)
    base.paste(im, (int((base.width - tw) / 2), int(base.height * 0.52 - im.height / 2)), im)
    return base


@lru_cache(maxsize=2)
def qr_card():
    """①편과 같은 구성의 상담 안내 카드. 마지막 12초 동안 한 픽셀도 안 움직인다.

    모서리를 둥글리지 않는다: 카드가 안전영역 폭(72~1008)을 정확히 채우므로
    라운드를 주면 네 귀퉁이로 켄번즈 중인 배경이 비쳐 'QR 영역 고정' 규격을 깬다.
    대신 안쪽에 로즈 괘선을 둘러 카드로 읽히게 했다.
    """
    cw, ch = W - 2 * SAFE, 900
    base, pad = card(cw, ch, 0, CREAM, shadow=150)
    img = base.copy()
    # 괘선은 반드시 불투명하게 긋는다. ImageDraw 는 합성이 아니라 픽셀을
    # 덮어쓰므로 반투명 색을 주면 그 줄만 알파가 낮아져 뒤 배경이 비치고,
    # 배경이 켄번즈로 움직이는 순간 'QR 영역 고정'이 깨진다(실측: 최대 20).
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
    # 알파까지 같이 낮춘다(실측: 그 픽셀들이 최대 5씩 흔들렸다). 카드 사각형
    # 안쪽은 알파를 255로 되돌려 검사 영역 전체를 불투명하게 만든다.
    alpha = img.getchannel("A")
    alpha.paste(255, (pad, pad, pad + cw + 1, pad + ch + 1))
    img.putalpha(alpha)
    return img, pad


# ================================================================ BLOCKS
def a_hook(tl):
    """0:00-0:12 훅 - 개념 선으로 실을 긋고, 마스크로 실물 매크로를 연다."""
    img = _bg_clip("H01", tl, 6.0, span=6.0, dim=0.44)

    if tl < 6.4:
        ta.draw_mechanism(img, (60, 780, 1020, 1140), "insert", p(tl, 0.6, 4.0),
                          show_tissue=False)
        corner_note(img, NOTE_DIAGRAM,
                    eo(p(tl, 0.9, 0.6)) * (1.0 - eio(p(tl, 5.6, 0.5))))

    a, r = vis(tl, 0.5, 5.5, 0.45, 0.45)
    if a > 0:
        softplate(img, W / 2, 530, 960, 400, a * 0.85, a=112, radius=80, blur=34)
        T(img, "실은 당기지 않습니다", W / 2, 420 + int((1 - r) * 26), "xb", 96, OFFW,
          "m", "a", a, shadow=190, blur=20, maxw=W - 2 * SAFE)
    a2, r2 = vis(tl, 2.3, 5.5, 0.45, 0.45)
    if a2 > 0:
        T(img, "겁니다", W / 2, 550 + int((1 - r2) * 26), "xb", 96, ROSE_T,
          "m", "a", a2, shadow=190, blur=20)

    rv = eo(p(tl, 6.2, 1.0))
    if rv > 0:
        macro = kb(thread_macro_plate(), p(tl, 6.2, 6.4), 1.0, _z1(6.4),
                   0.44, 0.52, 0.56, 0.48)
        reveal(img, macro, (420, 900, 660, 1020), rv, radius=14)
        corner_note(img, NOTE_PHOTO, eo(p(tl, 6.9, 0.6)))
        a3, r3 = vis(tl, 8.0, None, 0.5)
        if a3 > 0:
            softplate(img, W / 2, 1345, 900, 220, a3 * 0.88, a=118, radius=70, blur=30)
            T(img, "실에 돌기가 있습니다", W / 2, 1300 + int((1 - r3) * 22), "xb", 76,
              OFFW, "m", "a", a3, shadow=190, blur=18, maxw=W - 2 * SAFE)
    return img


def b_product(tl):
    """0:12-0:32 실물 - APTOS Visage 박스와 실 전체."""
    img = _h01_amb(tl)

    a, r = vis(tl, 0.3, None, 0.55, 0.4)
    eyebrow(img, tl, "리브성형외과가 쓰는 실", 470, 0.4)
    im, pad = product_panel("P01", 936, 620)
    put(img, im, (SAFE - pad, 560 - pad + int((1 - r) * 34)), a)
    corner_note(img, NOTE_PHOTO, eo(p(tl, 1.0, 0.6)))

    a2, r2 = vis(tl, 1.4, None, 0.55, 0.4)
    if a2 > 0:
        T(img, "압토스 실리프팅", W / 2, 1270 + int((1 - r2) * 24), "xb", 96, OFFW,
          "m", "a", a2, shadow=190, blur=20, maxw=W - 2 * SAFE)
        rule(img, W / 2 - 70, 1400, 140, 5, ROSE, a2)
        T(img, "APTOS Visage", W / 2, 1442, "m", 52, ROSE_T, "m", "a",
          a2 * eo(p(tl, 1.8, 0.5)), shadow=160, blur=12)
    return img


C_BOX = (60, 700, 1020, 1220)
C_SEG = 38.0 / 3.0
C_STAGES = (("insert", "① 실이 들어갑니다"),
            ("engage", "② 돌기가 조직을 겁니다"),
            ("fix", "③ 걸린 채 고정됩니다"))


def c_mechanism(tl):
    """0:32-1:10 원리 1 - 삽입 · 걸림 · 고정 3단계 개념도."""
    img = _h01_amb(20.0 + tl)

    k = max(0, min(2, int(tl / C_SEG)))
    stage, label = C_STAGES[k]
    ta.draw_mechanism(img, C_BOX, stage, clamp01((tl - k * C_SEG) / 10.0))

    a, r = vis(tl - k * C_SEG, 0.2, C_SEG - 0.8, 0.45, 0.4)
    if a > 0:
        softplate(img, W / 2, 490, 960, 230, a * 0.85, a=112, radius=80, blur=34)
        T(img, label, W / 2, 440 + int((1 - r) * 22), "xb", 76, OFFW, "m", "a", a,
          shadow=190, blur=18, maxw=W - 2 * SAFE)

    for i in range(3):
        rule(img, W / 2 - 150 + i * 108, 1336, 84, 7, ROSE, 1.0 if i == k else 0.30)
    corner_note(img, NOTE_DIAGRAM, eo(p(tl, 0.4, 0.6)))
    return img


D_BOX = (90, 620, 990, 1300)
D_DUR = 31.0
D_LEAD = 2.0                    # draw_release 는 블록보다 2초 먼저 시작한다
D_LABELS = (("micro", "마이크로"), ("submicro", "서브마이크로"), ("nano", "나노"))
D_RADIUS = dict((name, r) for name, r, _s in pa.SIZES)


def _first_seen(name, dur):
    """그 크기의 입자가 실제로 1개 이상 그려지기 시작하는 시각(초).

    active_counts 가 반올림 정수를 돌려주므로 SIZES 의 방출 시작 비율과 눈에
    보이는 시점이 다르다. 자막을 실제 등장에 맞추려고 실측한다.
    """
    for k in range(int(dur * FPS) + 1):
        t = k / float(FPS)
        if pa.active_counts(t, dur)[name] >= 1:
            return t
    return dur


D_ONSET = dict((name, _first_seen(name, D_DUR) + D_LEAD) for name, _lab in D_LABELS)


def d_capsule(tl):
    """1:10-1:45 원리 2 - 히알루론산 캡슐이 세 가지 크기로 퍼진다."""
    img = _bg_clip("H02", tl, 6.0, span=29.0, dim=0.52, blur=30, sway=-1)
    softplate(img, W / 2, 960, 980, 780, 1.0, a=112, radius=90, blur=38)

    a, r = vis(tl, 0.3, None, 0.5, 0.4)
    if a > 0:
        softplate(img, W / 2, 470, 960, 250, a * 0.85, a=112, radius=80, blur=34)
        TL(img, ["히알루론산을 세 가지 크기로", "나눠 담습니다"], W / 2,
           400 + int((1 - r) * 22), "b", 56, OFFW, 80, "m", a, shadow=180, blur=16,
           maxw=W - 2 * SAFE)

    pa.draw_release(img, D_BOX, tl - D_LEAD, dur=D_DUR)

    for i, (name, label) in enumerate(D_LABELS):
        la, lr = vis(tl, D_ONSET[name], None, 0.5)
        if la <= 0:
            continue
        y = 1330 + i * 68
        rr = D_RADIUS[name] * 0.62
        dot = Image.new("RGBA", (56, 56), (0, 0, 0, 0))
        ImageDraw.Draw(dot).ellipse([28 - rr, 28 - rr, 28 + rr, 28 + rr],
                                    fill=pa.CLASS_COLOR[name] + (235,))
        put(img, dot, (SAFE + 6, y + 6), la)
        T(img, label, SAFE + 76 + int((1 - lr) * 18), y, "m", 54, OFFW, "l", "a", la,
          shadow=160, blur=12)

    corner_note(img, NOTE_DIAGRAM, eo(p(tl, 0.4, 0.6)))
    return img


E_BOX = (240, 520, 840, 1320)
E_SEG = 40.0 / 3.0
E_ITEMS = (("cheek", "압토스 Light Lift 25", "볼"),
           ("midface", "압토스 NAMICA 19", "중안부 · 하안부"),
           ("submental", "압토스 Light Lift 50", "이중턱"))


def e_lineup(tl):
    """1:45-2:25 라인업 - 얼굴 선화 위에 3종의 적용 부위."""
    img = _bg_clip("H06", tl, 6.0, span=34.0, dim=0.58, blur=26)
    softplate(img, 540, 920, 760, 940, 1.0, a=152, radius=100, blur=40)

    a, r = vis(tl, 0.3, None, 0.5, 0.4)
    if a > 0:
        softplate(img, W / 2, 432, 920, 200, a * 0.85, a=112, radius=80, blur=34)
        T(img, "압토스 라인업과 적용 부위", W / 2, 400 + int((1 - r) * 22), "b", 56,
          OFFW, "m", "a", a, shadow=180, blur=16, maxw=W - 2 * SAFE)

    # 하이라이트를 선화보다 먼저 깔아야 눈·코·입 선이 사각형에 덮이지 않는다.
    # 기본 ROSE 는 어두운 배경 위에서 탁한 갈색 덩어리로 보여 밝은 ROSE_T 를 쓴다.
    k = max(0, min(2, int(tl / E_SEG)))
    region, name, part = E_ITEMS[k]
    tk = tl - k * E_SEG
    ha, _hr = vis(tk, 0.2, E_SEG - 0.7, 0.5, 0.4)
    fd.highlight(img, E_BOX, region, ha, ROSE_T)
    fd.draw_face(img, E_BOX, eo(p(tl, 0.4, 0.9)))

    ca, cr = vis(tk, 0.35, E_SEG - 0.7, 0.5, 0.4)
    if ca > 0:
        CARD(img, SAFE, 1324, W - 2 * SAFE, 192, 26, CREAM, ca, dy=int((1 - cr) * 26))
        yy = 1356 + int((1 - cr) * 26)
        T(img, name, W / 2, yy, "b", 60, INK, "m", "a", ca, maxw=W - 2 * SAFE - 80)
        T(img, part, W / 2, yy + 84, "m", 54, CHAR, "m", "a",
          ca * eo(p(tk, 0.6, 0.5)), maxw=W - 2 * SAFE - 80)

    corner_note(img, NOTE_DIAGRAM, eo(p(tl, 0.4, 0.6)))
    return img


F_CARDS = (("KFDA 의료기기", "4등급 정식 허가"),
           ("유럽", "CE 인증"),
           ("ISO", "13485"),
           ("FDA", "MDSAP"))


def f_certification(tl):
    """2:25-2:50 인증 - 정식 허가와 국제 인증, 사용국."""
    img = _bg_clip("H03", tl, 6.0, span=19.0, dim=0.50, sway=-1)

    softplate(img, W / 2, 490, 1000, 250, 0.85, a=112, radius=80, blur=34)
    eyebrow(img, tl, "압토스 실리프팅", 430, 0.3)
    a, r = vis(tl, 0.5, None, 0.5, 0.4)
    if a > 0:
        T(img, "정식 허가와 국제 인증", SAFE, 490 + int((1 - r) * 22), "xb", 76, OFFW,
          "l", "a", a, shadow=190, blur=18, maxw=W - 2 * SAFE)

    cw, chh = 456, 262
    for i, (top, bot) in enumerate(F_CARDS):
        ca, cr = vis(tl, 1.0 + i * 0.16, None, 0.5, 0.4)
        if ca <= 0:
            continue
        x = SAFE + (i % 2) * (cw + 24)
        y = 640 + (i // 2) * (chh + 24)
        dy = int((1 - cr) * 40)
        CARD(img, x, y, cw, chh, 26, CREAM, ca, dy=dy)
        T(img, top, x + cw / 2, y + 62 + dy, "b", 54, INK, "m", "a", ca, maxw=cw - 56)
        rule(img, x + cw / 2 - 30, y + 134 + dy, 60, 5, ROSE, ca)
        T(img, bot, x + cw / 2, y + 166 + dy, "b", 54, BROWN, "m", "a", ca, maxw=cw - 56)

    a2, r2 = vis(tl, 3.0, None, 0.6, 0.4)
    if a2 > 0:
        softplate(img, W / 2, 1360, 940, 280, a2 * 0.9, a=118, radius=80, blur=32)
        T(img, "100개국 이상 사용", W / 2, 1300 + int((1 - r2) * 24), "xb", 92, OFFW,
          "m", "a", a2, shadow=190, blur=20, maxw=W - 2 * SAFE)
    return img


G_SEGS = ((0.0, 12.0), (12.0, 25.0), (25.0, 38.0))


def _g_photo(img, tl, t0, t1, key, pw, ph, head, sub):
    """사진 패널 한 벌 - 위에 조판, 아래에 사진. 확대하지 않는다.

    주제목은 한글 76px, 보조는 54px 로 고정한다. "APTOS Professional Course 수료"를
    주제목에 두면 안전영역 936px 안에서 draw.fit_size 가 60px 까지 조용히 줄여
    제목 규격(76~116px) 아래로 떨어진다(실측: 72px 지정 -> 60px 렌더). 그래서 그
    문구는 보조 줄로 내리고 주제목은 한글로 둔다.
    """
    a, r = vis(tl, t0, t1, 0.6, 0.45)
    if a <= 0:
        return
    softplate(img, W / 2, 500, 960, 250, a * 0.85, a=112, radius=80, blur=34)
    T(img, head, W / 2, 430 + int((1 - r) * 22), "xb", 76, OFFW, "m", "a", a,
      shadow=190, blur=18, maxw=W - 2 * SAFE)
    T(img, sub, W / 2, 540, "m", 54, ROSE_T, "m", "a", a * eo(p(tl, t0 + 0.3, 0.5)),
      shadow=160, blur=12, maxw=W - 2 * SAFE)
    im, pad = photo_panel(key, pw, ph, 24, 0.0, 0.5, 0.5)
    put(img, im, (W / 2 - pw / 2 - pad, 620 - pad + int((1 - r) * 30)), a)


def g_person(tl):
    """2:50-3:28 사람 - 본사 연수 → 수여식 → 인증서 번호."""
    img = _bg_clip("H04", tl, 6.0, span=32.0, dim=0.50)

    _g_photo(img, tl, G_SEGS[0][0], G_SEGS[0][1] - 0.3, "A03", 630, 840,
             "김수영 대표원장", "조지아 APTOS 본사 연수")
    _g_photo(img, tl, G_SEGS[1][0], G_SEGS[1][1] - 0.3, "A02", 630, 840,
             "APTOS 본사 인증서 수여", "APTOS Professional Course 수료")
    # 인증서는 화면을 채우는 커버 크롭으로 쓰지 않는다. 세로 화면의 9:16 크롭은
    # 원본 폭의 21%를 잘라내 표제("APTOS PROFESSIONAL COURSE CERTIFICATE")가
    # 중간에서 끊긴다(스틸 실측). 문서를 온전히 보여 주고 번호는 조판으로 키운다.
    _g_photo(img, tl, G_SEGS[2][0], None, "A01", 540, 760,
             "APTOS 본사 발급 인증서", "APTOS Professional Course 수료")

    a2, r2 = vis(tl, G_SEGS[2][0] + 1.2, None, 0.55, 0.4)
    if a2 > 0:
        rule(img, W / 2 - 70, 1402, 140, 5, ROSE, a2)
        T(img, "KR0062025", W / 2, 1440 + int((1 - r2) * 18), "xb", 92, ROSE_T,
          "m", "a", a2, shadow=190, blur=20)
    return img


def h_space(tl):
    """3:28-3:48 공간 - 실제 로비와 상담실."""
    img = kb(photo_plate("I01", cx=0.46, cy=0.5), p(tl, 0, 20), 1.0, _z1(20.0),
             0.44, 0.5, 0.56, 0.5)

    a, r = vis(tl, 0.4, 9.5, 0.55, 0.45)
    if a > 0:
        softplate(img, W / 2, 960, 940, 420, a * 0.9)
        T(img, CLINIC, W / 2, 800 + int((1 - r) * 28), "xb", 116, OFFW, "m", "a", a,
          shadow=190, blur=20)
        rule(img, W / 2 - 70, 980, 140, 5, ROSE, a)
        T(img, "압토스 실리프팅 상담", W / 2, 1026, "m", 54, ROSE_T, "m", "a",
          a * eo(p(tl, 0.8, 0.5)), shadow=160, blur=12)

    a2, r2 = vis(tl, 10.0, None, 0.6, 0.45)
    if a2 > 0:
        im, pad = photo_panel("I04", 936, 420, 24, 0.04, 0.5, 0.5)
        put(img, im, (SAFE - pad, 560 - pad + int((1 - r2) * 34)), a2)
        softplate(img, W / 2, 1220, 940, 360, a2 * 0.9)
        T(img, CLINIC, W / 2, 1080 + int((1 - r2) * 24), "xb", 104, OFFW, "m", "a", a2,
          shadow=190, blur=18)
        T(img, FLOOR, W / 2, 1230, "m", 58, ROSE_T, "m", "a",
          a2 * eo(p(tl, 10.4, 0.5)), shadow=160, blur=12)
    return img


def i_outro(tl):
    """3:48-4:00 마무리 - 배경만 천천히 움직이고 QR 카드는 완전 고정."""
    img = kb(photo_plate("I03", blur=20, dim=0.62), p(tl, 0, 12), 1.14,
             _z1(12.0, 1.14), 0.44, 0.5, 0.56, 0.5)
    T(img, "압토스 실리프팅 상담", W / 2, 452, "m", 54, ROSE_T, "m", "a",
      eo(p(tl, 0.2, 0.6)), shadow=160, blur=12)
    im, pad = qr_card()
    put(img, im, (SAFE - pad, 560 - pad), eo(p(tl, 0.2, 1.0)))
    return img


BLOCKS = [
    dict(id="A", start=0.0, dur=12.0, fn=a_hook),
    dict(id="B", start=12.0, dur=20.0, fn=b_product),
    dict(id="C", start=32.0, dur=38.0, fn=c_mechanism),
    dict(id="D", start=70.0, dur=35.0, fn=d_capsule),
    dict(id="E", start=105.0, dur=40.0, fn=e_lineup),
    dict(id="F", start=145.0, dur=25.0, fn=f_certification),
    dict(id="G", start=170.0, dur=38.0, fn=g_person),
    dict(id="H", start=208.0, dur=20.0, fn=h_space),
    dict(id="I", start=228.0, dur=12.0, fn=i_outro),
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
        out = args.out or os.path.join(SCENEDIR, "C%02d.mp4" % args.chunk)
        encode_range(render_frame, args.chunk * CHUNK_FRAMES,
                     (args.chunk + 1) * CHUNK_FRAMES, out, args.crf)
        print("done", out, flush=True)
        return

    ap.error("--chunk 또는 --stills 중 하나가 필요합니다")


if __name__ == "__main__":
    main()
