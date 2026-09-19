# -*- coding: utf-8 -*-
"""④편 〈리프팅 고민 지도〉 180초 / 5,400프레임.

- 1080x1920 / 30fps CFR / 무음. 상·하단 고정 크롬은 전 구간 노출한다.
- 블록 7개(12~40초)를 이어 붙이고 경계만 0.4초 크로스 디졸브한다.
  마지막 G 블록에는 뒤쪽 디졸브를 걸지 않는다 - QR 영역 고정 규격과 충돌한다.
- ①편이 장비 이름 순서로 진행하므로 이 편은 부위·고민 순서로 진행한다.
  장비 사진을 쓰지 않고 얼굴 선화와 조판만 쓴다(상담 방향 태그에 들어가는 장비
  이름은 병원이 공개한 표기를 그대로 옮긴 텍스트다).
- 고민 3종과 상담 방향은 병원이 홈페이지에 공개한 분류를 그대로 쓴다. 원장님이
  2026-09-19에 미진행으로 확인한 2건(cards 의 fundamental·underEye)은 뺐다.

사용:
  python video_map.py --chunk 0              # 0~5, 900프레임씩 -> edit/scenes/M00.mp4
  python video_map.py --stills 5,20,48 --out stills/v4
"""
import argparse
import math
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

import face_diagram as fd

TOTAL_FRAMES = 5400
XF = 12                     # 블록 경계 크로스 디졸브 프레임 수
CHUNKS = 6
CHUNK_FRAMES = TOTAL_FRAMES // CHUNKS
SCENEDIR = os.path.join(EDIT, "scenes")

# 얼굴 선화는 A~D 블록 내내 같은 자리에 두고 부위만 바뀌게 한다.
FACE_BOX = (240, 470, 840, 1270)
NOTE_DIAGRAM = "개념도"
NOTE_Y = 1190               # ②편은 1560이지만 여기는 그 아래가 전부 조판이다(선화 오른쪽 아래 빈 곳)
NOTE_SIZE = 44


# ---------------------------------------------------------------- 배경
# 켄번즈 최저 속도(초당 줌 증가량). ②편 실측: 이보다 느리면 블러 플레이트의
# 프레임 간 변화가 x264 양자화 아래로 내려가 인코딩 결과가 앞 프레임과 똑같아지고,
# 검수의 freezedetect(n=0.001:d=3) 가 '정지 구간'으로 잡는다.
# (0.0034/s 는 4건, 0.0084/s 는 0건 - 블러·디더 조정 없이 해소.)
KB_RATE = 0.009


def _z1(span, z0=1.0):
    """span 초 동안 쓸 도착 줌. 짧은 구간은 ①편과 같은 0.17 이동을 유지한다."""
    return z0 + max(0.17, KB_RATE * span)


BG_KEY = "H06"
BG_BLUR, BG_DIM = 26, 0.54

# ④편은 전 구간 배경이 H06 하나다. 블록마다 진행도를 0에서 다시 시작하면 경계에서
# 배경이 되감기므로(②편 인계 8번), 구간을 이어 붙인 하나의 켄번즈 경로로 민다.
# 한 구간의 도착 (줌, 중심) 이 다음 구간의 출발이라 경계가 매끄럽고, 구간마다
# 줌 방향과 중심이 달라 40초 블록 3개가 같은 움직임으로 안 보인다.
#   경로 0: A 앰비언트 + B      경로 1: C 앰비언트 + D + E
# 경로가 둘인 이유는 C 블록이 생성 클립으로 다시 열리기 때문이다 - 클립 6.7초가
# 앞을 가리는 동안 줌을 1.0으로 되돌릴 수 있어서 거기서만 경로를 끊는다.
# 이동량은 _z1() 이 정하므로 어느 구간에서도 초당 줌 변화는 KB_RATE 이상이다.
# 마지막 구간(E)만 1.5배로 더 민다: 전경이 24초 동안 거의 안 변하는 블록이라
# 기본 속도에서는 3초 평균 절대차가 0.549 로 전 블록 최저였다(하한 0.40).
#   (구간 끝 시각, 줌 방향·배수, 도착 중심x, 도착 중심y)
BG_RUNS = (
    (6.0, ((12.0, 1, 0.56, 0.46), (32.0, 1, 0.44, 0.54), (52.0, -1, 0.58, 0.48))),
    (52.0, ((72.0, 1, 0.45, 0.56), (92.0, 1, 0.57, 0.44), (112.0, -1, 0.43, 0.52),
            (132.0, 1, 0.55, 0.57), (156.0, -1.5, 0.44, 0.42))),
)


def _bg_segments():
    """BG_RUNS 를 (t0, t1, z0, z1, 시작중심, 도착중심) 구간 목록으로 편다."""
    runs = []
    for t0, legs in BG_RUNS:
        segs, z, c = [], 1.0, (0.5, 0.5)
        for t1, sign, cx, cy in legs:
            z1 = z + sign * (_z1(t1 - t0) - 1.0)
            segs.append((t0, t1, z, z1, c, (cx, cy)))
            t0, z, c = t1, z1, (cx, cy)
        runs.append(tuple(segs))
    return tuple(runs)


BG_SEGS = _bg_segments()


def _h06(t, run):
    """전역 시각 t(초)의 H06 블러 앰비언트 배경."""
    segs = BG_SEGS[run]
    seg = segs[-1]
    for s in segs:
        if t < s[1]:
            seg = s
            break
    t0, t1, z0, z1, c0, c1 = seg
    return kb(ambient_plate(BG_KEY, BG_BLUR, BG_DIM), clamp01((t - t0) / (t1 - t0)),
              z0, z1, c0[0], c0[1], c1[0], c1[1])


def _live_frame(idx, dim):
    """생성 클립 한 프레임. 블러는 걸지 않고 앰비언트와 같은 정도로만 감광한다.

    ②편 _bg_clip() 은 dim 을 _amb() 에만 넘기고 라이브 프레임은 원본 밝기
    그대로 돌려줬다. H06 은 6초 내내 평균휘도 145·밝은 픽셀 26~29%로 안 어두워져
    (②편 리뷰 실측) 그 위 흰 조판과 선화의 대비가 무너진다. ④편은 배경이 H06
    하나라 라이브 창이 두 번 다 H06 이므로 여기서 같은 감광을 건다.

    **캐시하지 않는다.** 여기서 돌려준 이미지는 블록 함수와 draw_chrome 이
    제자리 변형한다. lru_cache 를 걸면 같은 인덱스가 다시 요청될 때 이미 조판이
    그려진 이미지 위에 또 그려져 프레임이 점점 어두워진다. int(t*FPS)+1 의
    반올림과 인덱스 1/180 포화 때문에 같은 인덱스는 순차 렌더에서도 반복
    요청된다(C 진입부에서 인덱스 1이 7프레임 연속). 1차 출고본에서 실제로
    t=52~58초에 ~7.5Hz 스트로브가 인코딩됐다 - tests/test_video_map.py 가 막는다.
    """
    return ImageEnhance.Brightness(clip_frame(BG_KEY, idx)).enhance(1.0 - dim)


def _live_to(amb, t, cut, dim=BG_DIM):
    """0~cut초는 생성 클립, 이후 0.7초에 걸쳐 앰비언트로 넘긴다.

    ②편 _bg_clip 과 같은 구성이되 옵션을 **kw 로 받지 않는다 - kw.get("dim") 은
    이름을 잘못 써도 조용히 기본값으로 렌더된다.
    """
    if t >= cut + 0.7:
        return amb
    live = _live_frame(max(1, min(180, int(t * FPS) + 1)), dim)
    return live if t <= cut else Image.blend(live, amb, eio((t - cut) / 0.7))


def _breath(t, t0, period):
    """켜진 뒤 천천히 오르내리는 밝기. 전경이 오래 멈춰 보이지 않게 한다."""
    return 0.80 + 0.20 * math.cos(2.0 * math.pi * max(0.0, t - t0) / period)


# ---------------------------------------------------------------- 공통 조각
def corner_note(img, text, alpha=1.0, y=NOTE_Y):
    """개념도 표기. ②편과 같은 구성(44px OFFW + 소프트플레이트, 우측 정렬)이다.

    face_diagram 의 30px·CHAR 고정 표기는 어두운 배경에서 대비가 없어 쓰지 않는다.
    """
    if alpha <= 0.004:
        return
    tw = twidth(text, "m", NOTE_SIZE)
    softplate(img, W - SAFE - tw / 2.0, y + 28, tw + 104, 104, alpha * 0.8,
              a=118, radius=52, blur=24)
    T(img, text, W - SAFE, y, "m", NOTE_SIZE, OFFW, "r", "a", alpha,
      shadow=150, blur=10)


def eyebrow(img, t, text, y, t0, t1=None, fill=ROSE_T, size=44, x=SAFE):
    """왼쪽 로즈 괘선 + 작은 안내 문구(①②편 조판과 동일)."""
    a, r = vis(t, t0, t1, 0.45)
    if a <= 0:
        return
    rule(img, x, y - 26, 96 * r, 5, ROSE, a)
    T(img, text, x, y, "m", size, fill, "l", "a", a, shadow=150, blur=10)


def face_plate(img):
    """선화 뒤에 까는 어두운 판. 생성 클립 구간에서도 선이 또렷하게 읽힌다."""
    softplate(img, 540, 880, 780, 900, 1.0, a=150, radius=100, blur=40)


def _region_tag(img, region, side, alpha, r):
    """점등한 부위 옆에 붙는 이름표. face_diagram.region_rect 로 자리를 잡는다."""
    if alpha <= 0.004:
        return
    rx0, ry0, rx1, ry1 = fd.region_rect(FACE_BOX, region)
    cy = (ry0 + ry1) / 2.0
    label = fd.REGION_LABEL[region]
    if side == "r":
        rule(img, rx1 + 16, cy - 3, 56 * r, 6, ROSE, alpha)
        T(img, label, rx1 + 88, cy, "b", 44, ROSE_T, "l", "c", alpha,
          shadow=160, blur=12)
    else:
        rule(img, rx0 - 16 - 56 * r, cy - 3, 56 * r, 6, ROSE, alpha)
        T(img, label, rx0 - 88, cy, "b", 44, ROSE_T, "r", "c", alpha,
          shadow=160, blur=12)


@lru_cache(maxsize=2)
def qr_card():
    """①②편과 같은 구성의 상담 안내 카드. 마지막 12초 동안 한 픽셀도 안 움직인다.

    모서리를 둥글리지 않는다: 카드가 안전영역 폭(72~1008)을 정확히 채우므로
    라운드를 주면 네 귀퉁이로 켄번즈 중인 배경이 비쳐 'QR 영역 고정' 규격을 깬다.
    대신 안쪽에 로즈 괘선을 둘러 카드로 읽히게 했다.
    """
    cw, ch = W - 2 * SAFE, 900
    base, pad = card(cw, ch, 0, CREAM, shadow=150)
    img = base.copy()
    # 괘선은 반드시 불투명하게 긋는다. ImageDraw 는 합성이 아니라 픽셀을
    # 덮어쓰므로 반투명 색을 주면 그 줄만 알파가 낮아져 뒤 배경이 비치고,
    # 배경이 켄번즈로 움직이는 순간 'QR 영역 고정'이 깨진다(②편 실측: 최대 20).
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
    # 알파까지 같이 낮춘다(②편 실측: 그 픽셀들이 최대 5씩 흔들렸다). 카드 사각형
    # 안쪽은 알파를 255로 되돌려 검사 영역 전체를 불투명하게 만든다.
    alpha = img.getchannel("A")
    alpha.paste(255, (pad, pad, pad + cw + 1, pad + ch + 1))
    img.putalpha(alpha)
    return img, pad


# ================================================================ 고민 3종
# 병원이 홈페이지에 공개한 분류 그대로다(고민 문장 · 상담 방향 태그).
#   (부위, 고민 문장, 상담 방향, 이름표 쪽, 점등 시각, 앞머리 생성 클립 길이)
CONCERNS = (
    ("jawline", "처진 얼굴선과 턱선", "압토스 · 실리프팅", "r", 0.5, 0.0),
    ("midface", "수술 없이 탄력 개선", "울쎄라 · 써마지 · 복합 리프팅", "l", 1.2, 6.0),
    ("texture", "피부결 · 모공 · 재생", "포텐자 · 리쥬란 · 쥬베룩", "r", 0.8, 0.0),
)
CONCERN_AT = ((12.0, 0), (52.0, 1), (92.0, 1))      # (전역 시작 시각, 배경 경로)
ORDINAL = ("첫 번째 고민", "두 번째 고민", "세 번째 고민")
A_LIT = (2.6, 4.7, 6.8)                             # A 훅에서 세 지점이 켜지는 시각


# ================================================================ BLOCKS
def a_hook(tl):
    """0:00-0:12 훅 - 얼굴 선화에 세 지점이 차례로 켜진다."""
    img = _live_to(_h06(tl, 0), tl, 6.0)
    face_plate(img)
    eyebrow(img, tl, "리프팅 고민 지도", 430, 0.3)

    # 하이라이트를 선화보다 먼저 깔아야 눈·코·입 선이 사각형에 덮이지 않는다.
    # 기본 ROSE 는 어두운 배경 위에서 탁한 갈색 덩어리로 보여 밝은 ROSE_T 를 쓴다.
    # 켜질 때 한 번 밝게 올라오고 다음 지점으로 넘어가면 자리만 남긴다 - 세 개가
    # 계속 밝으면 선화가 판 세 장에 덮인 그림이 된다(스틸 t=5 1차 실측).
    for i, (region, _t, _g, _s, _l, _c) in enumerate(CONCERNS):
        a = eo(p(tl, A_LIT[i], 1.0)) * (1.0 - 0.78 * eio(p(tl, A_LIT[i] + 1.9, 1.3)))
        fd.highlight(img, FACE_BOX, region, a * _breath(tl, A_LIT[i], 6.0 + i), ROSE_T)
    fd.draw_face(img, FACE_BOX, eo(p(tl, 0.4, 1.0)))
    for i, (region, _t, _g, side, _l, _c) in enumerate(CONCERNS):
        la, lr = vis(tl, A_LIT[i] + 0.5, None, 0.5)
        _region_tag(img, region, side, la, lr)

    a2, r2 = vis(tl, 1.0, None, 0.6, 0.45)
    if a2 > 0:
        softplate(img, W / 2, 1400, 980, 220, a2 * 0.88, a=118, radius=70, blur=30)
        T(img, "어디가 제일 신경 쓰이세요?", W / 2, 1352 + int((1 - r2) * 26), "xb", 84,
          OFFW, "m", "a", a2, shadow=190, blur=20, maxw=W - 2 * SAFE)
    corner_note(img, NOTE_DIAGRAM, eo(p(tl, 1.4, 0.6)))
    return img


def _concern(tl, k):
    """고민 한 개 40초. 부위 점등 8초 → 고민 문장 12초 → 상담 방향 12초 → 병원 8초."""
    region, title, tags, side, lit, cut = CONCERNS[k]
    start, run = CONCERN_AT[k]
    img = _h06(start + tl, run)
    if cut:
        img = _live_to(img, tl, cut)
    face_plate(img)

    eyebrow(img, tl, ORDINAL[k], 430, 0.2)
    for i in range(3):                 # 세 고민 중 어디쯤인지 (오른쪽 위)
        rule(img, W - SAFE - (3 - i) * 108 + 24, 404, 84, 6, ROSE,
             1.0 if i == k else 0.28)

    ha = eo(p(tl, lit, 1.2)) * _breath(tl, lit, 7.0 + k)
    fd.highlight(img, FACE_BOX, region, ha, ROSE_T)
    fd.draw_face(img, FACE_BOX, eo(p(tl, 0.2, 0.9)))
    la, lr = vis(tl, lit + 0.8, None, 0.5)
    _region_tag(img, region, side, la, lr)
    corner_note(img, NOTE_DIAGRAM, eo(p(tl, lit + 0.4, 0.6)))

    # 하단 스크림(y=1490부터 알파 0->205)이 조판을 깎지 않게 세 줄을 전부 위로
    # 올렸다. 1차본은 카드 바닥이 알파 73(28.8%), 병원 연결 줄이 91(35.5%)을
    # 받아 ROSE_T 휘도 203이 실효 152로 떨어졌다(리뷰 M5). 선화 바닥이 1270이라
    # 남는 높이가 220px 뿐이어서 카드 소제목("상담 방향" 34px)은 뺐다 -
    # 자막 하한 54px 과 스크림 회피를 같이 만족시키는 유일한 조합이다.
    # 자리는 실측 잉크 높이로 잡았다(고민 문장 70 · 태그 51 · 병원 연결 49).
    # 선화가 실제로 끝나는 곳은 FACE_BOX 바닥(1270)이 아니라 턱끝 1222 다.
    a1, r1 = vis(tl, 8.0, None, 0.55)
    T(img, title, W / 2, 1268 + int((1 - r1) * 26), "xb", 76, OFFW, "m", "a", a1,
      shadow=190, blur=18, maxw=W - 2 * SAFE)

    a2, r2 = vis(tl, 20.0, None, 0.55)
    if a2 > 0:
        dy = int((1 - r2) * 30)
        CARD(img, SAFE, 1362, W - 2 * SAFE, 106, 26, CREAM, a2, dy=dy)
        T(img, tags, W / 2, 1390 + dy, "b", 56, INK, "m", "a", a2,
          maxw=W - 2 * SAFE - 60)

    a3, _ = vis(tl, 32.0, None, 0.5)
    T(img, "리브성형외과에서 상담합니다", W / 2, 1492, "m", 54, ROSE_T, "m", "a", a3,
      shadow=150, blur=12)
    return img


def b_sagging(tl):
    """0:12-0:52 고민 1 - 처진 얼굴선과 턱선."""
    return _concern(tl, 0)


def c_elasticity(tl):
    """0:52-1:32 고민 2 - 수술 없이 탄력 개선. 생성 클립으로 화면을 한 번 연다."""
    return _concern(tl, 1)


def d_texture(tl):
    """1:32-2:12 고민 3 - 피부결 · 모공 · 재생."""
    return _concern(tl, 2)


def e_together(tl):
    """2:12-2:36 정리 - 정답은 상담에서 함께 정합니다."""
    img = _h06(132.0 + tl, 1)

    a, r = vis(tl, 0.3, None, 0.6, 0.45)
    im, pad = photo_panel("A11", 936, 520, 24)
    put(img, im, (SAFE - pad, 520 - pad + int((1 - r) * 30)), a)

    a2, r2 = vis(tl, 1.6, None, 0.55, 0.4)
    if a2 > 0:
        softplate(img, W / 2, 1330, 980, 440, a2 * 0.9)
        # 84px 로는 한 줄이 1,006px 이라 안전영역(936px)을 넘는다. maxw 를 줘서
        # 78px 로 자동으로 줄어들게 한다 - 두 줄로 쪼개지 않고 한 줄을 유지한다.
        T(img, "정답은 상담에서 함께 정합니다", W / 2, 1150 + int((1 - r2) * 24), "xb",
          84, OFFW, "m", "a", a2, shadow=190, blur=20, maxw=W - 2 * SAFE)

    for i, (_r, title, _g, _s, _l, _c) in enumerate(CONCERNS):
        a3, r3 = vis(tl, 3.4 + i * 0.7, None, 0.5)
        if a3 <= 0:
            continue
        # 영상 전체를 되짚는 주 내용이라 42px -> 54px. 세 줄 잉크가 1272~1472 라
        # 하단 스크림(1490~)에 안 닿는다.
        y = 1272 + i * 76
        tw = twidth(title, "m", 54)
        rule(img, W / 2 - 22 - tw / 2 + int((1 - r3) * 16), y + 22, 22, 6, ROSE, a3)
        T(img, title, W / 2 + 18, y, "m", 54, OFFW, "m", "a", a3, shadow=160, blur=12)
    return img


def f_clinic(tl):
    """2:36-2:48 병원 - 리브성형외과 · 이 건물 4층."""
    img = kb(photo_plate("I01", cx=0.46, cy=0.5), p(tl, 0, 12), 1.0, _z1(12.0),
             0.44, 0.5, 0.56, 0.5)

    fa, fr = vis(tl, 0.4, None, 0.55, 0.45)
    if fa > 0:
        # I01 로비는 밝은 사진이라 기본 소프트플레이트(a=120)로는 흰 조판이 뜬다
        # (스틸 t=160 1차 실측). 이 블록만 더 진하고 크게 깐다.
        softplate(img, W / 2, 990, 960, 520, fa * 0.92, a=152, radius=80, blur=34)
        T(img, CLINIC, W / 2, 800 + int((1 - fr) * 28), "xb", 116, OFFW, "m", "a", fa,
          shadow=190, blur=20)
        rule(img, W / 2 - 70, 980, 140, 5, ROSE, fa)
        T(img, FLOOR, W / 2, 1026, "m", 58, ROSE_T, "m", "a",
          fa * eo(p(tl, 0.8, 0.5)), shadow=160, blur=12)
        T(img, "고민에서 시작하는 맞춤 진료", W / 2, 1126, "m", 50, OFFW, "m", "a",
          fa * eo(p(tl, 1.6, 0.6)), shadow=160, blur=12, maxw=W - 2 * SAFE)
    return img


def g_outro(tl):
    """2:48-3:00 마무리 - 배경만 천천히 움직이고 QR 카드는 완전 고정."""
    img = kb(photo_plate("I03", blur=20, dim=0.62), p(tl, 0, 12), 1.14,
             _z1(12.0, 1.14), 0.44, 0.5, 0.56, 0.5)
    T(img, "고민에서 시작하는 맞춤 진료", W / 2, 452, "m", 50, ROSE_T, "m", "a",
      eo(p(tl, 0.2, 0.6)), shadow=160, blur=12)
    im, pad = qr_card()
    put(img, im, (SAFE - pad, 560 - pad), eo(p(tl, 0.2, 1.0)))
    return img


BLOCKS = [
    dict(id="A", start=0.0, dur=12.0, fn=a_hook),
    dict(id="B", start=12.0, dur=40.0, fn=b_sagging),
    dict(id="C", start=52.0, dur=40.0, fn=c_elasticity),
    dict(id="D", start=92.0, dur=40.0, fn=d_texture),
    dict(id="E", start=132.0, dur=24.0, fn=e_together),
    dict(id="F", start=156.0, dur=12.0, fn=f_clinic),
    dict(id="G", start=168.0, dur=12.0, fn=g_outro),
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
        out = args.out or os.path.join(SCENEDIR, "M%02d.mp4" % args.chunk)
        encode_range(render_frame, args.chunk * CHUNK_FRAMES,
                     (args.chunk + 1) * CHUNK_FRAMES, out, args.crf)
        print("done", out, flush=True)
        return

    ap.error("--chunk 또는 --stills 중 하나가 필요합니다")


if __name__ == "__main__":
    main()
