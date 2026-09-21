# -*- coding: utf-8 -*-
"""압토스 실리프팅 6분 — 본편 렌더러. 정확히 10,800프레임(360.000초).

`pilot2.py` 가 본보기다. 그 문법(생성 클립이 주인공, 글자 자리에만 국소 스크림,
의료 내용은 코드로)을 6분으로 확장한 것이고, 6분이라서 새로 생긴 규칙이 하나 있다.

## 강약 — 6분은 30초와 다르다

승인된 v2 파일럿은 **이미 균일하지 않았다**. 구간별 프레임 간 변화량이
오프너 1.886 대 개념도 0.275 로 **6.9배** 차이다. 사장님이 좋다고 하신 것은
봉우리가 세다는 뜻이지 내내 세다는 뜻이 아니었다.

그리고 폐기된 v1 의 실패는 봉우리가 낮아서가 아니라 **바닥이 0.111 까지
내려가서**였다. 그러니 6분에서 지켜야 할 것은 봉우리의 연속이 아니라 바닥이다.

    강(ACCENT)  목표 >= 0.55  클립 전면, 감광 0. 글자 자리에만 band_scrim
    중(MID)     목표 >= 0.30  실사 패널·전면 + 움직이는 바탕
    약(BED)     목표 >= 0.21  클립을 감광해 깔고 도해·표가 주인공

**이 숫자는 승인·폐기된 두 판을 `verify_film.py` 로 직접 재서 얻은 것이다.**
인계문에 적힌 0.478 / 0.111 을 그대로 쓰면 안 됐다 — 그건 다른 측정 코드의
숫자다. 같은 V1 클립을 쓴 구간을 인계문은 0.640 이라 적었는데 이 코드로는
0.558 이 나온다. **자를 바꾸면 숫자가 바뀐다.** 그래서 다시 쟀다:

    v2 (승인)  전체 0.430   A 0.558 · B 0.273 · C 1.540 · D 0.211 · E 0.395
    v1 (폐기)  전체 0.087   A 0.051 · B 0.031 · C 0.060 · D 0.129

승인과 폐기를 가른 것은 **약 5배**다. 그러니 목표는 승인판의 프로파일이고,
바닥 0.21 은 그 판에서 가장 조용했던 블록과 같다. 처음에는 클립 자체의
움직임(V4 는 5.106)을 보고 강 1.0 으로 잡았는데, 최종 렌더는 고정 크롬·스크림·
조판이 정지 영역이라 클립 원본의 **0.37~0.5배**로 희석된다. 근거 없이 엄격한
목표는 스스로를 막을 뿐이다.

**악센트 사이 간격은 30초를 넘기지 않는다.** 1층 로비는 체류시간이 30초~몇 분
이라, 간격이 그보다 길면 그 사이에 들어온 사람은 조용한 구간만 보고 나간다.
`test_film.py` 가 이 둘(바닥·간격)을 검사로 강제한다.

## 클립을 감속하지 않는다

5초 클립을 16초로 늘리면 움직임이 배속만큼 깎인다(0.544 -> 0.17). 거기에
감광까지 걸면 0.12 — v1 의 실패 지점이다. 그래서 긴 베드는 **블록 길이와 같은
길이로 새로 생성**했다(Seedance 2.5 는 4~30초를 받는다). `clip_bed` 가 남은
감속을 1.6배로 제한하고, 넘으면 예외로 멈춘다.

## 섹션 번호

화면에 나가는 번호는 **01~07 연속**이다. HANDOFF2 §2 의 행 번호(00~09)를
그대로 쓰면 오프너(02)와 본문(03)이 한 섹션인데 번호가 둘이라 화면에서 03 이
건너뛴 것처럼 보인다. 행 번호는 추적용으로 블록 id 에 남기고, 화면 번호는
따로 센다.

사용:
  PYTHONIOENCODING=utf-8 python film.py --chunk 0      # 0~11, 900프레임씩
  PYTHONIOENCODING=utf-8 python film.py --join
  PYTHONIOENCODING=utf-8 python film.py --stills 3,25,64,86,140,190,226,268,320,352
  PYTHONIOENCODING=utf-8 python film.py --sheet        # 블록마다 1컷 대조표
"""
import argparse
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageEnhance

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import look as L
from look import (W, H, FPS, SAFE, bl, col, ROSE, ROSE_T, ROSE_D, BROWN, OFFW,
                  INK, CREAM, WHITE, CLINIC, FLOOR, PHONE, clamp01, p, eo, eio)
import thread_dia as td
import capsule_dia as cd
import face_areas as fa
from pilot import (rise, draw_rule, draw_accent, wipe_down, wipe_right,
                   reveal_box, hard_cut, DIM, DIM_P, L_KB)
from liv_video.encode import encode_range
from liv_video.qr import qr_image

TOTAL = 10800                    # 360.000초
CHUNKS = 12
CHUNK_FRAMES = TOTAL // CHUNKS   # 900
SCENES = os.path.join(EDIT, "scenes_film")
STILLS = os.path.join(EDIT, "stills", "film")

# 계층 — 문자열로 두면 오타가 조용히 지나간다. 검사가 이 집합으로 막는다.
ACCENT, MID, BED = "accent", "mid", "bed"
MOTION_FLOOR = 0.21              # 승인된 v2 파일럿의 가장 조용한 블록과 같다
# 계층별 목표 — 여기가 단일 진실이다. verify_film 과 probe_motion 이 이걸 읽는다.
# 값의 근거는 **승인된 판의 가장 약한 블록**이다. 승인판에서 클립 악센트의
# 하단은 0.273(돌기 구간)이었고 베드의 하단은 0.211(개념도)이었다. 승인판보다
# 엄격한 기준을 스스로에게 걸 이유가 없다.
TIER_FLOOR = {"accent": 0.30, "mid": 0.25, "bed": 0.21}
# 진짜 품질 기준은 분포다 — 승인판의 프로파일을 통째로 넘어야 한다.
MEDIAN_MIN = 0.43                # 전체 프레임 간 변화량 중앙값 (승인판 0.430)
BLOCK_MEDIAN_MIN = 0.395         # 블록 중앙값들의 중앙값 (승인판 0.395)
BLOCK_MIN = 0.21                 # 가장 조용한 블록 (승인판 0.211)
ACCENT_GAP_MAX = 30.0            # 악센트 사이 최대 간격(초)
SLOWDOWN_MAX = 1.6               # 클립 감속 한계. 넘으면 clip_bed 가 멈춘다

QR_URL = "https://liv-clinic.net/ko/contact"


# ================================================================ 바탕 도구
def clip_bed(key, tl, dur, dim=0.0, wash=None, wash_a=0.0, z=0.0, t0=0.0):
    """블록 길이에 맞춰 클립을 깔아 준다.

    클립이 블록보다 **길거나 같으면 배속 1.0** — 앞에서부터 그대로 쓴다.
    짧을 때만 감속하고, 감속이 SLOWDOWN_MAX 를 넘으면 예외로 멈춘다.
    이전 작업은 5초 클립을 16초로 늘려 쓰다 움직임을 잃었다(그리고 그걸
    눈으로 알아채기까지 6분을 다 만들어야 했다).

    z 를 주면 켄번즈 푸시인을 추가로 건다 — 감속이 남은 구간에서 잃은
    움직임을 메운다.
    """
    # t0 를 주면 클립 앞부분을 버리고 시작한다. "빛이 번져 나온다" 류의 클립은
    # 첫 1초가 거의 검어서 섹션이 검은 화면으로 열린다(실제로 blackdetect 가
    # 246초에서 1.03초를 잡았다). 그 앞을 잘라 낼 때 쓴다.
    native = L.clip_len(key) / float(FPS) - t0
    if dur > native * SLOWDOWN_MAX + 1e-6:
        raise ValueError(
            "%s 를 %.1f초 블록에 쓰면 %.2f배 감속이다(한계 %.1f배). "
            "클립을 더 길게 생성하거나 블록을 쪼개라."
            % (key, dur, dur / native, SLOWDOWN_MAX))
    rate = min(1.0, native / float(dur))
    img = L.clip(key, t0 + tl * rate)
    if z:
        img = L.cover(img, W, H, 0.5, 0.5, 1.0 + z * clamp01(tl / dur)).convert("RGBA")
    if dim:
        img = ImageEnhance.Brightness(img).enhance(1.0 - dim).convert("RGBA")
    if wash and wash_a > 0:
        img.alpha_composite(Image.new("RGBA", (W, H),
                                      tuple(wash) + (int(255 * wash_a),)))
    return img


SCRIM_INK = (10, 8, 7)           # 어두운 필드 — 흰 글자를 받친다
SCRIM_PAPER = (252, 248, 243)    # 밝은 필드 — 먹색 글자를 받친다


def band_scrim(img, y, h, a=190, color=SCRIM_INK):
    """글자가 올라갈 자리에만 까는 국소 스크림. 화면 전체를 감광하지 않는다.

    밝은 클립(석고벽·종이) 위에 먹색 글자를 올리는 구간이 있다. 거기에
    어두운 스크림을 깔면 **먹 위에 먹**이 돼 글자가 사라진다. 그래서 색을
    받는다 — 필드 톤과 같은 쪽으로 들어 올려야 대비가 생긴다.
    """
    import numpy as np
    h = int(h)
    feather = max(1, int(h * 0.34))
    g = np.concatenate([np.linspace(0, a, feather),
                        np.full(max(0, h - 2 * feather), a),
                        np.linspace(a, 0, feather)])[:h]
    rgba = np.zeros((h, W, 4), "uint8")
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
    rgba[..., 3] = np.repeat(g[:, None], W, 1).astype("uint8")
    img.alpha_composite(Image.fromarray(rgba, "RGBA"), (0, int(y)))


def photo(key, tl, dur, z0=1.02, dz=None, cx0=0.5, cy0=0.5, cx1=None, cy1=None,
          dim=0.0):
    """실사 전면 + 켄번즈. dz=0 이면 확대 없이 크롭만 옆으로 흐른다.

    A03·A04(본사 연수)는 원장님이 **확대 금지** 조건을 달았다. 그런데 확대를
    아예 빼면 그 구간이 정지가 된다. 원본이 3:4 라 9:16 화면에서는 줌 1.0 에도
    가로 크롭 여유가 있으므로, **줌은 고정하고 크롭만 옆으로 민다.**
    (F1 처럼 원본이 9:16 과 같은 비율이면 줌 1.0 에서 cx 가 안 먹는다 —
     face_areas.py 에 그 실측이 적혀 있다.)
    """
    dz = max(0.14, L_KB * dur) if dz is None else dz
    cx1 = cx0 if cx1 is None else cx1
    cy1 = cy0 if cy1 is None else cy1
    return L.photo_field(key, tl / float(dur), z0, z0 + dz, cx0, cy0, cx1, cy1, dim)


# 패널 띠 — 원본 비율 그대로 사진을 앉히는 자리.
PANEL_BAND = (bl(26), bl(96))


def panel_scene(key, tl, dur, cap, head, sub=None, bed=None, head_px=76,
                head_key="pl-b", track=-0.01, reveal=0.14):
    """사진을 **원본 비율 그대로** 보여 준다. 잘라서 화면을 채우지 않는다.

    왜 이게 따로 필요한가 — 전면(`photo`)으로 쓰면 9:16 이 아닌 원본은 가로가
    크게 잘린다. 실측하면 이렇다:

        A01 수료증   1214x1707  가로 21% 버림 → 제목이 양쪽으로 잘린다
        A09 학회     2400x2400  가로 44% 버림 → 스크린의 원장명·병원명이 날아간다
        A11 상담     2400x1598  가로 63% 버림 → 부위를 짚는 손이 화면 밖으로 나간다
        I01 로비     3000x2000  가로 62% 버림 → 로비가 복도가 된다

    이 넷은 **잘린 부분이 곧 증거**다. 그래서 띠 안에 통째로 앉힌다. 네 장 모두
    패널이 원본보다 작으므로 **확대가 한 픽셀도 없다**(A01 0.49배, A09 0.35배,
    A11 0.39배, I01 0.31배).

    움직임은 셋에서 나온다 — 뒤에 깔린 클립, 조판 애니메이션, 그리고 패널 안에서
    크롭이 4.5% 에서 0% 로 **열리는** 아주 느린 이동. 열리는 방향이라 마지막
    프레임에서 사진이 온전해진다.
    """
    img = clip_bed(bed, tl, dur, dim=0.22, wash=L.NOIR, wash_a=0.12, z=0.14)
    x, cw = col(0, 12)
    by0, by1 = PANEL_BAND
    bandh = by1 - by0

    src = L.asset(key)
    ar = src.width / float(src.height)
    pw, ph = cw, int(round(cw / ar))
    if ph > bandh:
        ph, pw = bandh, int(round(bandh * ar))
    q = clamp01(tl / float(dur))
    keep = (1.0 - reveal) + reveal * eo(q)
    panel = L.cover(src, pw, ph, 0.5, 0.5, 1.0 / keep).convert("RGBA")

    # 등장은 세로 마스크로 **잘라서** 연다 — 페이드는 '밝아진다'가 되고,
    # 절단은 '드러난다'가 된다(LOOK.md 2단계 움직임 원칙).
    open_h = int(ph * eo(p(tl, 0.10, 0.85)))
    py = by0 + (bandh - ph) // 2
    if open_h > 2:
        img.alpha_composite(panel.crop((0, 0, pw, open_h)), (x, py))
        if open_h < ph:
            L.rect(img, x, py + open_h - 5, pw, 5, ROSE)
    L.accent(img, x, py - 14, int(96 * eo(p(tl, 0.30, 0.6))), 1.0, 5, ROSE)

    ty = by0 + (bandh + ph) // 2 + bl(5)
    ca = eo(p(tl, 0.85, 0.5))
    L.caption(img, cap, x, ty, ca, "noir", 32, maxw=cw)
    draw_rule(img, x, ty + bl(6), cw, tl, 1.0, 0.8)
    a, d = rise(tl, 1.3, 0.65, 24)
    L.T(img, head, x, ty + bl(11) + d, head_key, head_px, OFFW, "l", a, track)
    if sub:
        a2, d2 = rise(tl, 1.8, 0.65, 20)
        L.SUB(img, sub, x, ty + bl(24) + d2, 54, fill=(230, 222, 216),
              alpha=a2, maxw=cw)
    L.chrome(img, "noir")
    return img


def kicker_head(img, tl, num, kick, head, sub=None, tone="noir", head_px=116,
                num_px=180, t0=0.0, shadow=0):
    """섹션 오프너 조판 — 번호 → 괘선 → 키커 → 헤드라인 → 부제 순서로 선다.

    이 순서가 중요하다. 한꺼번에 나타나면 슬라이드가 되고, 순서대로 서면
    조판이 된다.
    """
    x, cw = col(0, 12)
    ink = OFFW if tone == "noir" else INK
    # 밝은 필드에서는 번호를 로즈로 내린다. (214,190,178)로 두면 거의 흰
    # 석고벽 위에서 숫자가 사라진다 — F1·X1 에서 실제로 안 보였다.
    dimc = (226, 200, 187) if tone == "noir" else ROSE
    na, nd = rise(tl, t0, 0.5, 18)
    L.numeral(img, num, x - 8, bl(23) + nd, na * 0.95, num_px, dimc, tone)
    nw = int(L.twidth(num, "cg-l", num_px, 0.02)) + 56
    draw_rule(img, x + nw, bl(29), cw - nw, tl, t0 + 0.1, 0.6, tone)
    L.kicker(img, kick, x + nw, bl(31), eo(p(tl, t0 + 0.3, 0.4)),
             None, 38, tone)
    ha, hd = rise(tl, t0 + 0.55, 0.6, 30)
    L.HEAD(img, head, x, bl(40) + hd, head_px, ink, "l", ha, maxw=cw,
           shadow=shadow)
    if sub:
        sa, sd = rise(tl, t0 + 0.95, 0.6, 22)
        L.SUB(img, sub, x, bl(53) + sd, 56,
              fill=(232, 224, 218) if tone == "noir" else DIM_P,
              alpha=sa, maxw=cw, shadow=shadow)


# ================================================================ 00 훅
def h1_thread(tl):
    """V1 전면. 감광 0. 훅 첫 줄."""
    img = clip_bed("V1", tl, H1_DUR, z=0.22)
    band_scrim(img, bl(108), bl(36), 200)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(112), cw, tl, 1.1, 0.8)
    a1, d1 = rise(tl, 1.35, 0.65)
    L.T(img, "실은 당기지 않습니다", x, bl(116) + d1, "pl-b", 80, OFFW, "l", a1,
        -0.01, shadow=150)
    L.note(img, "제품 이미지", eo(p(tl, 0.9, 0.6)), y=bl(104))
    L.chrome(img, "noir", photo=True)
    return img


def h2_barb(tl):
    """N01 전면. 훅 둘째 줄 — 첫 줄을 받는 한 마디."""
    img = clip_bed("N01", tl, H2_DUR, z=0.26)
    band_scrim(img, bl(104), bl(40), 200)
    x, cw = col(0, 12)
    L.T(img, "실은 당기지 않습니다", x, bl(110), "pl-b", 80, (198, 188, 182), "l",
        0.55, -0.01, shadow=140)
    draw_rule(img, x, bl(120), cw, tl, 0.25, 0.7)
    a, d = rise(tl, 0.55, 0.7)
    L.T(img, "겁니다", x, bl(124) + d, "pl-b", 96, ROSE_T, "l", a, -0.01,
        shadow=170)
    L.note(img, "제품 이미지", 0.85, y=bl(100))
    L.chrome(img, "noir", photo=True)
    return img


def h3_title(tl):
    """N02 전면. 제목 카드 — 이 영상이 무엇에 대한 것인지 한 번 못 박는다."""
    img = clip_bed("N02", tl, H3_DUR, z=0.20)
    band_scrim(img, bl(40), bl(56), 214)
    x, cw = col(0, 12)
    ka = eo(p(tl, 0.35, 0.5))
    L.kicker(img, "Aptos thread lifting", x, bl(48), ka, ROSE_T, 40,
             rule_w=int(320 * eo(p(tl, 0.2, 0.6))))
    ha, hd = rise(tl, 0.75, 0.7, 34)
    L.HEAD(img, "압토스 실리프팅", x, bl(58) + hd, 128, OFFW, "l", ha, maxw=cw,
           shadow=190)
    sa, sd = rise(tl, 1.35, 0.7, 24)
    L.SUB(img, CLINIC, x, bl(74) + sd, 60, fill=(232, 224, 218), alpha=sa,
          maxw=cw, shadow=170)
    L.note(img, "제품 이미지", eo(p(tl, 1.8, 0.6)), y=bl(100))
    L.chrome(img, "noir", photo=True)
    return img


# ================================================================ 01 압토스란
def b1_open(tl):
    img = clip_bed("N03", tl, B1_DUR)
    band_scrim(img, bl(16), bl(52), 230)
    kicker_head(img, tl, "01", "What is it", "압토스란",
                "실 표면에 돌기를 세운 제품입니다", shadow=190)
    L.chrome(img, "noir", photo=True)
    return img


B2_BAND_Y, B2_BAND_H = bl(44), 452


def b2_product(tl):
    """제품 매크로 띠. 배경 클립은 눌러 깔고 제품이 주인공이다."""
    img = clip_bed("N04", tl, B2_DUR, dim=0.08, wash=L.NOIR, wash_a=0.06, z=0.20)
    x, cw = col(0, 12)

    band = L.macro_band("P01T", W, B2_BAND_H, 104, 50)
    open_w = int(W * eo(p(tl, 0.15, 1.05)))
    if open_w > 2:
        img.alpha_composite(band.crop((0, 0, open_w, B2_BAND_H)), (0, B2_BAND_Y))
        L.rect(img, 0, B2_BAND_Y, open_w, 2, (74, 62, 56))
        L.rect(img, 0, B2_BAND_Y + B2_BAND_H - 2, open_w, 2, (74, 62, 56))
        if open_w < W:
            L.rect(img, open_w - 5, B2_BAND_Y, 5, B2_BAND_H, ROSE)

    cap_y = B2_BAND_Y + B2_BAND_H + bl(4)
    ca = eo(p(tl, 1.35, 0.55))
    L.caption(img, "APTOS VISAGE · 실 표면", x, cap_y, ca, "noir", 32)
    L.kicker(img, "What is it", x, bl(24), eo(p(tl, 0.05, 0.45)), ROSE_T, 34,
             rule_w=int(180 * eo(p(tl, 0.0, 0.5))))
    y = B2_BAND_Y + B2_BAND_H + bl(14)
    draw_rule(img, x, y, cw, tl, 1.9, 0.8)
    a1, d1 = rise(tl, 2.2, 0.65)
    L.T(img, "표면에 돌기가 나 있습니다", x, y + bl(5) + d1, "pl-b", 76, OFFW, "l",
        a1, -0.01)
    a2, d2 = rise(tl, 3.4, 0.65)
    L.SUB(img, "돌기는 좌우로 방향이 갈립니다", x, y + bl(16) + d2, 56, fill=DIM,
          alpha=a2, maxw=cw)
    L.note(img, "제품 이미지", eo(p(tl, 1.0, 0.6)))
    L.chrome(img, "noir")
    return img


def b3_barb(tl):
    """N05 전면. 지시선 둘만 — 클립을 가리지 않는다."""
    img = clip_bed("N05", tl, B3_DUR, z=0.28)
    ca = eo(p(tl, 0.8, 0.8))
    L.callout(img, "돌기", (int(W * 0.44), int(H * 0.58)),
              (int(W * 0.44) + 148, int(H * 0.42)), ca, "noir", "r", 42,
              "실 표면에 세워진 갈고리")
    x, cw = col(0, 12)
    band_scrim(img, bl(112), bl(28), 185)
    draw_rule(img, x, bl(116), cw, tl, 2.6, 0.8)
    a, d = rise(tl, 2.9, 0.65)
    L.T(img, "이 돌기가 조직을 겁니다", x, bl(120) + d, "pl-b", 76, OFFW, "l", a,
        -0.01, shadow=150)
    L.note(img, "제품 이미지", 0.85, y=bl(104))
    L.chrome(img, "noir", photo=True)
    return img


SHAPE = (("돌기", "실 표면에 세워진 갈고리"),
         ("방향", "좌우로 갈린다"),
         ("굵기", "부위에 따라 다르다"))


def b4_shape(tl):
    """지면으로 톤이 뒤집힌다. 톤 폭이 6분 내내 유지되게 하는 장치다."""
    img = clip_bed("N06", tl, B4_DUR, wash=L.PAPER, wash_a=0.36)
    x, cw = col(0, 12)
    L.kicker(img, "What is it", x, bl(26), eo(p(tl, 0.1, 0.45)), BROWN, 34,
             "paper", rule_w=int(180 * eo(p(tl, 0.05, 0.5))))
    ha, hd = rise(tl, 0.5, 0.65, 26)
    L.HEAD(img, "실의 생김새", x, bl(36) + hd, 104, INK, "l", ha, maxw=cw)
    draw_rule(img, x, bl(52), cw, tl, 1.0, 0.8, "paper")
    L.items_row(img, SHAPE, x, bl(58), cw, 1.0, "paper",
                stagger=0.22, t=tl, t0=1.25)
    draw_rule(img, x, bl(72), cw, tl, 2.1, 0.8, "paper")
    fa_, fd = rise(tl, 2.5, 0.7, 22)
    L.SUB(img, "부위에 따라 굵기와 길이가 다른 실을 씁니다", x, bl(78) + fd, 56,
          fill=DIM_P, alpha=fa_, maxw=cw, key="r")
    L.chrome(img, "paper")
    return img


# ================================================================ 02 실이 하는 일
def c1_open(tl):
    img = clip_bed("N07", tl, C1_DUR)
    band_scrim(img, bl(16), bl(52), 230)
    kicker_head(img, tl, "02", "How it works", "실이 하는 일",
                "돌기가 조직을 걸어 그 자리에 둡니다", shadow=190)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(70), cw, tl, 2.4, 0.9)
    for i, (num, label) in enumerate(td_stages()):
        a, dy = rise(tl, 2.8 + i * 0.22, 0.55, 20)
        yy = bl(76) + i * bl(9)
        L.T(img, num, x, yy + dy, "cg-m", 40, ROSE_D, "l", a, 0.12, shadow=140)
        L.T(img, label, x + 96, yy + dy - 2, "m", 44, OFFW, "l", a, 0.02,
            shadow=140)
    L.chrome(img, "noir", photo=True)
    return img


D_STAGES = (("insert", "실이 들어갑니다"),
            ("engage", "돌기가 조직을 겁니다"),
            ("fix", "걸린 채 고정됩니다"))


def td_stages():
    return [("%02d" % (i + 1), s[1]) for i, s in enumerate(D_STAGES)]


D_BOX = (-80, bl(46), W + 80, bl(94))


def _d_box(q):
    """도해에 걸리는 느린 카메라 움직임.

    고정 상자에 그리면 '그려진 그림'으로 보인다. 천천히 밀어 넣고 옆으로
    흘리면 촬영된 것처럼 읽힌다. 도해 구간이 긴 6분에서는 이게 더 중요하다.
    """
    z = 1.0 + 0.075 * q
    dx, dy = -30.0 * q, -12.0 * q
    x0, y0, x1, y1 = D_BOX
    cx, cy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
    return (cx + (x0 - cx) * z + dx, cy + (y0 - cy) * z + dy,
            cx + (x1 - cx) * z + dx, cy + (y1 - cy) * z + dy)


def _d_frame(img, tl, active, note_a=1.0):
    x, cw = col(0, 12)
    L.kicker(img, "How it works", x, bl(24), eo(p(tl, 0.05, 0.45)), ROSE_T, 34,
             rule_w=int(180 * eo(p(tl, 0.0, 0.5))))
    draw_rule(img, x, bl(100), cw, tl, 0.2, 0.7)
    L.rail(img, [s[1] for s in D_STAGES], x, bl(106), active,
           eo(p(tl, 0.35, 0.5)))
    L.note(img, "개념도", note_a * eo(p(tl, 0.3, 0.5)))


def d1_open(tl):
    """섹션 진입 — 클립이 주인공. 03 행의 오프너이지만 화면 번호는 02 를 잇는다."""
    img = clip_bed("N08", tl, D1_DUR)
    band_scrim(img, bl(100), bl(44), 205)
    x, cw = col(0, 12)
    L.kicker(img, "How it works", x, bl(24), eo(p(tl, 0.1, 0.45)), ROSE_T, 36,
             rule_w=int(200 * eo(p(tl, 0.05, 0.5))))
    draw_rule(img, x, bl(104), cw, tl, 0.6, 0.8)
    a, d = rise(tl, 0.9, 0.7, 28)
    L.T(img, "세 단계로 나눠 봅니다", x, bl(110) + d, "pl-b", 80, OFFW, "l", a,
        -0.01, shadow=160)
    a2, d2 = rise(tl, 1.7, 0.7, 20)
    L.SUB(img, "삽입 · 걸림 · 고정", x, bl(122) + d2, 56, fill=(232, 224, 218),
          alpha=a2, maxw=cw, shadow=150)
    L.chrome(img, "noir", photo=True)
    return img


def d2_insert(tl):
    """1단계 삽입. 17초 동안 실이 천천히 들어간다 — 서두르지 않는 것이 도해다."""
    img = clip_bed("N09", tl, D2_DUR, dim=0.14, wash=L.NOIR, wash_a=0.10, z=0.12)
    q = clamp01(tl / D2_DUR)
    td.draw(img, _d_box(q), "insert", clamp01(tl / (D2_DUR * 0.86)))
    x, cw = col(0, 12)
    a, dy = rise(tl, 0.3, 0.6, 24)
    L.HEAD(img, D_STAGES[0][1], x, bl(32) + dy, 92, OFFW, "l", a, maxw=cw)
    _d_frame(img, tl, 0)
    L.chrome(img, "noir")
    return img


def d3_taut(tl):
    """악센트 — 도해에서 잠깐 나와 실물로 받는다. 17초 도해 둘 사이의 숨이다."""
    img = clip_bed("N10", tl, D3_DUR, z=0.18)
    band_scrim(img, bl(106), bl(36), 195)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(110), cw, tl, 0.5, 0.8)
    a, d = rise(tl, 0.8, 0.7, 26)
    L.T(img, "돌기가 서면 방향이 갈립니다", x, bl(115) + d, "pl-b", 76, OFFW, "l",
        a, -0.01, shadow=155)
    L.note(img, "제품 이미지", eo(p(tl, 0.6, 0.6)), y=bl(100))
    L.chrome(img, "noir", photo=True)
    return img


def d4_engage(tl):
    """2·3단계. 앞 절반이 걸림, 뒤 절반이 고정."""
    img = clip_bed("N11", tl, D4_DUR, dim=0.14, wash=L.NOIR, wash_a=0.10, z=0.12)
    half = D4_DUR / 2.0
    k = 1 if tl < half else 2
    stage, label = D_STAGES[k]
    tk = tl - (0.0 if k == 1 else half)
    q = clamp01(tl / D4_DUR)
    td.draw(img, _d_box(q), stage, clamp01(tk / (half * 0.84)))
    x, cw = col(0, 12)
    a, dy = rise(tk, 0.3, 0.6, 24)
    if k == 1:
        a *= 1.0 - eio(p(tk, half - 0.55, 0.45))
    L.HEAD(img, label, x, bl(32) + dy, 92, OFFW, "l", a, maxw=cw)
    _d_frame(img, tl, k)
    L.chrome(img, "noir")
    return img


def d5_marks(tl):
    """지시선으로 정리. 도해는 고정 단계지만 카메라와 지시선이 계속 움직인다."""
    img = clip_bed("N12", tl, D5_DUR, dim=0.06, wash=L.NOIR, wash_a=0.06, z=0.16)
    q = clamp01(tl / D5_DUR)
    box = _d_box(0.55 + 0.45 * q)
    td.draw(img, box, "fix", 0.62 + 0.38 * q)
    ca = eo(p(tl, 0.7, 0.7))
    ax, ay = td.barb_anchor(box, 2)
    L.callout(img, "돌기", (ax, ay), (ax + 96, ay - bl(9)), ca, "noir", "r", 38,
              "실 표면에 세워진 갈고리")
    bx, by = td.barb_anchor(box, 5)
    L.callout(img, "걸림점", (bx, by), (bx - 104, by + bl(9)),
              eo(p(tl, 1.5, 0.7)), "noir", "l", 38, "조직이 붙잡히는 자리")
    _d_frame(img, tl, 2)
    L.chrome(img, "noir")
    return img


# ================================================================ 03 NAMICA
def e1_open(tl):
    img = clip_bed("N13", tl, E1_DUR)
    band_scrim(img, bl(16), bl(52), 230)
    # 부제에 등급 셋을 다 넣으면 936px 안에서 52px 로 줄어 하한(54)을 깬다.
    # 등급 이름은 E2 의 크기 기준자가 보여 준다 — 여기서 겹쳐 쓸 필요가 없다.
    kicker_head(img, tl, "03", "Namica", "히알루론산 캡슐",
                "세 가지 크기로 캡슐화합니다", shadow=190)
    L.chrome(img, "noir", photo=True)
    return img


E_BOX = (SAFE - 40, bl(36), W - SAFE + 40, bl(96))


def e2_capsule(tl):
    """캡슐 개념도. 의료 내용은 코드로 그린다(설계서 §4-③)."""
    img = clip_bed("N14", tl, E2_DUR, dim=0.10, wash=L.NOIR, wash_a=0.06, z=0.20)
    cd.draw(img, E_BOX, tl, E2_DUR)
    x, cw = col(0, 12)
    L.kicker(img, "Namica", x, bl(24), eo(p(tl, 0.05, 0.45)), ROSE_T, 34,
             rule_w=int(160 * eo(p(tl, 0.0, 0.5))))
    a, dy = rise(tl, 0.35, 0.6, 24)
    L.HEAD(img, "세 크기로 캡슐화합니다", x, bl(30) + dy, 84, OFFW, "l", a, maxw=cw)
    draw_rule(img, x, bl(100), cw, tl, 0.6, 0.8)
    cd.scale_row(img, x, bl(106), cw, cd.active_index(tl, E2_DUR),
                 eo(p(tl, 0.9, 0.6)), tl)
    L.note(img, "개념도", eo(p(tl, 0.5, 0.5)))
    L.chrome(img, "noir")
    return img


E3_BOX = (SAFE - 60, bl(26), W - SAFE + 60, bl(96))


def e3_release(tl):
    """캡슐 근접 — **코드로 그린다**.

    첫 판은 여기에 V6(생성 클립)을 깔았다. 화면에 구슬 더미가 나오고 그 위에
    "단계적으로 방출되는 구조입니다" 가 얹혔는데, 그러면 보는 사람은 그 구슬을
    캡슐로 읽는다. **AI 그림이 의료 내용을 설명하게 되는 것**이고 설계서 §4-③ 과
    인계문 원칙 2 가 금지한 바로 그 경우다. 클립은 바탕으로 물리고 캡슐은
    `capsule_dia.closeup` 이 직접 그린다.
    """
    img = clip_bed("N30", tl, E3_DUR, dim=0.08, wash=L.NOIR, wash_a=0.10)
    cd.closeup(img, E3_BOX, tl, E3_DUR)
    band_scrim(img, bl(104), bl(38), 200)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(108), cw, tl, 0.5, 0.8)
    a, d = rise(tl, 0.8, 0.7, 26)
    L.T(img, "단계적으로 방출되는 구조입니다", x, bl(113) + d, "pl-b", 72, OFFW,
        "l", a, -0.01, shadow=155)
    L.note(img, "개념도", eo(p(tl, 0.6, 0.6)), y=bl(100))
    L.chrome(img, "noir", photo=True)
    return img


NAMICA = (("나노", "가장 작은 등급"),
          ("서브마이크로", "중간 등급"),
          ("마이크로", "가장 큰 등급"))


def e4_sum(tl):
    img = clip_bed("N15", tl, E4_DUR, dim=0.16, wash=L.NOIR, wash_a=0.12)
    x, cw = col(0, 12)
    L.kicker(img, "Namica", x, bl(26), eo(p(tl, 0.1, 0.45)), ROSE_T, 34,
             rule_w=int(160 * eo(p(tl, 0.05, 0.5))))
    ha, hd = rise(tl, 0.5, 0.65, 26)
    L.HEAD(img, "캡슐 세 등급", x, bl(36) + hd, 104, OFFW, "l", ha, maxw=cw)
    draw_rule(img, x, bl(52), cw, tl, 1.0, 0.8)
    L.items_row(img, NAMICA, x, bl(58), cw, 1.0, "noir",
                stagger=0.22, t=tl, t0=1.25)
    draw_rule(img, x, bl(72), cw, tl, 2.2, 0.8)
    a, d = rise(tl, 2.6, 0.7, 22)
    L.SUB(img, "히알루론산을 캡슐로 감싼 구조입니다", x, bl(78) + d, 56, fill=DIM,
          alpha=a, maxw=cw)
    L.note(img, "개념도", eo(p(tl, 3.2, 0.6)))
    L.chrome(img, "noir")
    return img


# ================================================================ 04 라인업
def f1_open(tl):
    img = clip_bed("N16", tl, F1_DUR, dim=0.06, z=0.26)
    band_scrim(img, bl(16), bl(52), 176, SCRIM_PAPER)
    kicker_head(img, tl, "04", "Line up", "라인업과 적용 부위",
                "부위에 따라 굵기와 길이가 다른 실을 씁니다", tone="paper",
                head_px=96)
    L.chrome(img, "paper")
    return img


F2_AREAS = ("cheek", "midface", "submental")
F2_ZOOM = 0.32                   # 20초 동안의 푸시인 폭


def f2_face(tl):
    """조각 두상 위 부위 표시. 모델·환자 사진을 쓰지 않는다(face_areas.py 참조)."""
    # 푸시인 0.075 로는 20초 동안 실측 변화량이 0.037 이었다 — 정지 플레이트
    # (0.095)보다도 낮다. 조각은 생성 이미지라 증거가 아니고 원본이 2160x3840
    # 이므로, 0.26 까지 밀어도 표시 배율은 0.50 -> 0.63 으로 여전히 축소다.
    z = fa.zoom_at(tl, F2_DUR, F2_ZOOM)
    img = fa.face_field(tl, F2_DUR, 0.0, F2_ZOOM)
    # 매끈한 조각은 밀어도 화면이 안 변한다. 빛을 움직인다(face_areas.sweep 주석).
    fa.sweep(img, tl, F2_DUR, passes=2.5, strength=0.44)
    fa.left_scrim(img, 176, 600)
    x, cw = col(0, 12)
    seg = F2_DUR / 3.0
    k = max(0, min(2, int(tl / seg)))
    for i, key in enumerate(F2_AREAS):
        on = (i == k)
        fa.mark(img, key, 1.0 if on else 0.24, tl, 1.0 + i * 0.45, z)
        if i <= k:
            fa.label(img, key, x, bl(58) + i * bl(12),
                     eo(p(tl, 1.2 + i * 0.45, 0.6)) * (1.0 if on else 0.45),
                     52, z)
    L.kicker(img, "Line up", x, bl(24), eo(p(tl, 0.1, 0.45)), ROSE_T, 34,
             rule_w=int(160 * eo(p(tl, 0.05, 0.5))))
    a, dy = rise(tl, 0.4, 0.6, 24)
    L.HEAD(img, "적용 부위", x, bl(32) + dy, 88, OFFW, "l", a, maxw=cw,
           shadow=170)
    L.note(img, "개념도", eo(p(tl, 0.8, 0.5)))
    L.chrome(img, "noir", photo=True)
    return img


def f3_accent(tl):
    img = clip_bed("N17", tl, F3_DUR)
    band_scrim(img, bl(104), bl(38), 200)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(108), cw, tl, 0.5, 0.8)
    a, d = rise(tl, 0.8, 0.7, 26)
    L.T(img, "세 가지를 씁니다", x, bl(113) + d, "pl-b", 84, OFFW, "l", a, -0.01,
        shadow=160)
    a2, d2 = rise(tl, 1.6, 0.7, 20)
    L.SUB(img, "부위에 맞춰 고릅니다", x, bl(126) + d2, 56, fill=(232, 224, 218),
          alpha=a2, maxw=cw, shadow=150)
    L.chrome(img, "noir", photo=True)
    return img


LINEUP = (
    ("압토스 Light Lift 25", "볼", "Light Lift"),
    ("압토스 NAMICA 19", "중안부 · 하안부", "NAMICA"),
    ("압토스 Light Lift 50", "이중턱", "Light Lift"),
)


def f4_table(tl):
    img = clip_bed("N18", tl, F4_DUR, wash=L.PAPER, wash_a=0.30, z=0.14)
    x, cw = col(0, 12)
    na, nd = rise(tl, 0.05, 0.6, 16)
    L.numeral(img, "04", x - 8, bl(23) + nd, na * 0.92, 150, ROSE, "paper")
    draw_rule(img, x + 200, bl(28), cw - 200, tl, 0.25, 0.7, "paper")
    L.kicker(img, "Line up", x + 200, bl(30), eo(p(tl, 0.45, 0.45)), BROWN, 34,
             "paper")
    ha, hd = rise(tl, 0.65, 0.6, 26)
    L.HEAD(img, "라인업과 적용 부위", x, bl(39) + hd, 96, INK, "l", ha, maxw=cw)
    sa, sd = rise(tl, 1.0, 0.6, 20)
    L.SUB(img, "부위에 따라 굵기와 길이가 다른 실을 씁니다", x, bl(51) + sd, 54,
          fill=DIM_P, alpha=sa, maxw=cw, key="r")
    L.table(img, LINEUP, x, bl(60), [470, 300, 166], 1.0, "paper", rowh=bl(11),
            head=("제품", "적용 부위", "계열"), keys=["m", "r", "m"],
            sizes=[46, 42, 34], stagger=0.30, t=tl, t0=1.6)
    L.chrome(img, "paper")
    return img


# ================================================================ 05 인증
def g1_open(tl):
    img = clip_bed("N19", tl, G1_DUR)
    band_scrim(img, bl(16), bl(52), 230)
    kicker_head(img, tl, "05", "Certified", "인증",
                "정식 허가를 받은 의료기기입니다", shadow=190)
    L.chrome(img, "noir", photo=True)
    return img


CERTS = (("KFDA", "의료기기 4등급"), ("CE", "유럽 인증"),
         ("ISO", "13485"), ("FDA", "MDSAP"))


def g2_certs(tl):
    img = clip_bed("N20", tl, G2_DUR, dim=0.12, wash=L.NOIR, wash_a=0.08, z=0.10)
    x, cw = col(0, 12)
    L.kicker(img, "Certified", x, bl(26), eo(p(tl, 0.1, 0.45)), ROSE_T, 34,
             rule_w=int(200 * eo(p(tl, 0.05, 0.5))))
    ha, hd = rise(tl, 0.5, 0.65, 26)
    L.HEAD(img, "네 가지 인증", x, bl(36) + hd, 104, OFFW, "l", ha, maxw=cw)
    draw_rule(img, x, bl(54), cw, tl, 1.0, 0.9)
    L.items_row(img, CERTS, x, bl(60), cw, 1.0, "noir",
                stagger=0.20, t=tl, t0=1.3)
    draw_rule(img, x, bl(74), cw, tl, 2.6, 0.9)
    a, d = rise(tl, 3.0, 0.7, 22)
    L.SUB(img, "KFDA 의료기기 4등급 정식 허가", x, bl(80) + d, 58, fill=DIM,
          alpha=a, maxw=cw)
    a2, d2 = rise(tl, 3.9, 0.7, 20)
    L.SUB(img, "CE · ISO 13485 · FDA MDSAP", x, bl(90) + d2, 54, fill=ROSE_T,
          alpha=a2, maxw=cw, key="r")
    L.chrome(img, "noir")
    return img


def g3_world(tl):
    """큰 숫자 하나. 타이포 스케일 대비가 여기서 제일 크게 벌어진다."""
    img = clip_bed("N21", tl, G3_DUR, dim=0.10, wash=L.NOIR, wash_a=0.08)
    x, cw = col(0, 12)
    band_scrim(img, bl(46), bl(46), 200)
    L.kicker(img, "In use worldwide", x, bl(54), eo(p(tl, 0.2, 0.5)), ROSE_T, 36,
             rule_w=int(260 * eo(p(tl, 0.1, 0.6))))
    # 숫자는 세리프를 쓰지 않는다. Cormorant 의 기본 숫자는 올드스타일이라
    # 1 이 소문자 높이로 내려앉아 "100" 이 화면에서 **I O O** 로 읽힌다.
    # LOOK.md §2 가 KR0062025 에 대해 적어 둔 것과 같은 함정이고, 여기도 걸렸다.
    na, nd = rise(tl, 0.6, 0.8, 30)
    L.T(img, "100", x - 6, bl(60) + nd, "sb", 184, OFFW, "l", na, -0.01,
        shadow=190)
    ta, tdy = rise(tl, 1.3, 0.7, 24)
    L.T(img, "개국 이상 사용", x + int(L.twidth("100", "sb", 184, -0.01)) + 34,
        bl(74) + tdy, "pl-b", 76, ROSE_T, "l", ta, -0.01, shadow=170)
    draw_rule(img, x, bl(92), cw, tl, 2.1, 0.9)
    L.chrome(img, "noir", photo=True)
    return img


# ================================================================ 06 누가 하는가
def w1_open(tl):
    img = clip_bed("N22", tl, W1_DUR)
    band_scrim(img, bl(16), bl(52), 230)
    kicker_head(img, tl, "06", "Who", "누가 하는가",
                "본사 연수를 받고 수료증을 받았습니다", shadow=190)
    L.chrome(img, "noir", photo=True)
    return img


def _photo_scene(key, tl, dur, cap, head, sub=None, dz=None, cx0=0.5, cx1=None,
                 cy0=0.5, cy1=None, head_px=76, z0=1.02):
    """실사 한 컷 — 캡션 + 한 줄. 실사 구간이 길어지면 v1 로 돌아간다.

    그래서 실사 컷은 7~9초로 끊고, 사이에 악센트 클립을 넣는다(BLOCKS 참조).
    """
    img = photo(key, tl, dur, z0, dz, cx0, cy0, cx1, cy1)
    x, cw = col(0, 12)
    band_scrim(img, bl(104), bl(40), 196)
    ca = eo(p(tl, 0.25, 0.5))
    L.caption(img, cap, x, bl(102), ca, "noir", 32, maxw=cw)
    draw_rule(img, x, bl(108), cw, tl, 0.45, 0.8)
    a, d = rise(tl, 0.75, 0.65, 24)
    L.T(img, head, x, bl(113) + d, "pl-b", head_px, OFFW, "l", a, -0.01,
        shadow=155)
    if sub:
        a2, d2 = rise(tl, 1.25, 0.65, 20)
        L.SUB(img, sub, x, bl(126) + d2, 54, fill=(230, 222, 216), alpha=a2,
              maxw=cw, shadow=145)
    L.chrome(img, "noir", photo=True)
    return img


def w2_georgia(tl):
    # A03·A04 는 원장님 조건이 **확대 금지**다. 줌은 1.0 에 묶고 크롭만 민다.
    # 줌을 1.0 에 묶어 원본보다 크게 보이는 픽셀이 한 장도 없게 한다.
    return _photo_scene("A03", tl, W2_DUR, "조지아 · APTOS 본사",
                        "본사에서 배웠습니다", dz=0.0, cx0=0.30, cx1=0.70,
                        z0=1.0)


def w3_ceremony(tl):
    return _photo_scene("A02", tl, W3_DUR, "APTOS Professional Course",
                        "수료증을 받았습니다", dz=0.20, cy0=0.40, cy1=0.56)


def w4_accent(tl):
    """악센트 — 실사 다섯 컷 사이의 숨. V4(움직임 5.106)를 그대로 쓴다."""
    img = clip_bed("V4", tl, W4_DUR)
    band_scrim(img, bl(104), bl(38), 200)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(108), cw, tl, 0.4, 0.8)
    a, d = rise(tl, 0.7, 0.7, 26)
    L.T(img, "증명할 수 있는 것만 말합니다", x, bl(113) + d, "pl-b", 72, OFFW, "l",
        a, -0.01, shadow=160)
    L.chrome(img, "noir", photo=True)
    return img


def w5_cert(tl):
    """수료증 — 문서 전체를 보여 준다. 잘라내면 증거가 아니라 그림이 된다.

    번호는 Cormorant 를 안 쓴다. 올드스타일 숫자라 0 과 6 의 높이가 달라
    공식 번호가 날짜처럼 읽힌다(LOOK.md §2 실측). 산세리프 + 넓은 자간.
    """
    return panel_scene("A01", tl, W5_DUR, "APTOS PROFESSIONAL COURSE",
                       "KR0062025", "수료증 번호입니다", bed="N26",
                       head_px=88, head_key="sb", track=0.10)


def w6_academy(tl):
    # 스크린에 원장명과 병원명이 찍혀 있다. 그게 이 사진의 증거이고,
    # 전면으로 쓰면 가로 44% 가 잘려 그 글자가 날아간다.
    return panel_scene("A09", tl, W6_DUR, "학회 발표", "학회에서 발표했습니다",
                       bed="N27")


def w7_podium(tl):
    return _photo_scene("A10", tl, W7_DUR, "AXA 연단", "연단에 섰습니다",
                        dz=0.34, cy0=0.34, cy1=0.62)


# ================================================================ 07 공간
def x1_open(tl):
    img = clip_bed("N23", tl, X1_DUR, dim=0.06, z=0.26)
    band_scrim(img, bl(16), bl(52), 176, SCRIM_PAPER)
    kicker_head(img, tl, "07", "Here", "상담",
                "얼굴을 보고 부위를 정합니다", tone="paper", head_px=116)
    L.chrome(img, "paper")
    return img


def x2_consult(tl):
    # 부위를 짚는 손이 장면의 핵심이다. 전면으로 쓰면 가로 63% 가 잘려
    # 손도 환자도 화면 밖으로 나가고 얼굴만 남는다.
    return panel_scene("A11", tl, X2_DUR, "상담", "직접 보고 정합니다",
                       bed="N28")


def x3_lobby(tl):
    # 로비도 가로다. 전면으로 쓰면 62% 가 잘려 로비가 복도로 보인다.
    return panel_scene("I01", tl, X3_DUR, CLINIC, FLOOR, PHONE, bed="N29",
                       head_px=88)


# ================================================================ 08 마무리
def y1_close(tl):
    img = clip_bed("N24", tl, Y1_DUR, z=0.22)
    # 스크림을 화면 34% 에 214 로 깔았더니 배경까지 눌려 이 구간이 0.352 로
    # 내려앉았다. 헤드라인은 shadow=190 을 이미 갖고 있으므로 띠를 좁히고 낮춘다.
    band_scrim(img, bl(48), bl(34), 168)
    x, cw = col(0, 12)
    ka = eo(p(tl, 0.35, 0.5))
    L.kicker(img, "Aptos thread lifting", x, bl(52), ka, ROSE_T, 40,
             rule_w=int(320 * eo(p(tl, 0.2, 0.6))))
    ha, hd = rise(tl, 0.8, 0.7, 34)
    L.HEAD(img, CLINIC, x, bl(62) + hd, 128, OFFW, "l", ha, maxw=cw, shadow=190)
    sa, sd = rise(tl, 1.5, 0.7, 24)
    L.SUB(img, "압토스 실리프팅", x, bl(78) + sd, 60, fill=(232, 224, 218),
          alpha=sa, maxw=cw, shadow=170)
    L.chrome(img, "noir", photo=True)
    return img


@L.lru_cache(maxsize=2)
def _qr_card():
    """마지막 12초 고정 카드. 배경 클립은 계속 움직이고 이 판만 멈춘다.

    `lru_cache` 가 돌려주는 이미지를 호출부가 제자리 변형하면 캐시가 오염된다
    (인계문 §7-2 의 97프레임 스트로브). 여기서는 만들어서 그대로 돌려주기만
    하고, 합성은 `alpha_composite` 로 **복사본 위에** 한다.
    """
    # qr_image 는 모듈 수의 **정수배**로 확대해 돌려준다. 여기서 임의 크기로
    # 다시 줄이면 모듈 폭이 1px 씩 어긋나 스캔이 불안정해진다. 받은 크기를 쓴다.
    q = qr_image(QR_URL, 380).convert("RGBA")
    qw = q.size[0]
    card = Image.new("RGBA", (W, bl(58)), (0, 0, 0, 0))
    x, cw = col(0, 12)
    pad = 26
    L.rect(card, x - pad, 0, qw + 2 * pad, qw + 2 * pad, (255, 255, 255))
    card.alpha_composite(q, (x, pad))
    tx = x + qw + pad * 2 + 40
    L.T(card, "상담 문의", tx, pad + 6, "pl-b", 68, OFFW, "l", 1.0, -0.01,
        shadow=170)
    L.T(card, PHONE, tx, pad + bl(9), "m", 56, ROSE_T, "l", 1.0, 0.06,
        shadow=150)
    L.T(card, FLOOR, tx, pad + bl(17), "m", 48, (230, 222, 216), "l", 1.0, 0.02,
        shadow=150)
    L.caption(card, "QR 로 상담 페이지가 열립니다", x - pad, qw + 2 * pad + bl(5),
              1.0, "noir", 32)
    return card


def y2_qr(tl):
    img = clip_bed("N25", tl, Y2_DUR, z=0.30)
    # 카드가 고정인 만큼 배경이 전부 일해야 한다. 조각 구간에서 쓴 빛 쓸기를
    # 여기에도 한 번 지나가게 한다 — 같은 문법이라 톤이 어긋나지 않는다.
    fa.sweep(img, tl, Y2_DUR, passes=1.0, strength=0.16, width=900, soft=0.5)
    # 스크림을 화면 39% 에 깔았더니 **배경까지 같이 눌려** 이 구간의 변화량이
    # 0.200 으로 떨어졌다. 설계서가 요구하는 것은 '카드 고정, 배경은 계속
    # 움직임'이다. QR 은 흰 판이라 스크림이 필요 없고 글자는 그림자로 받는다.
    band_scrim(img, bl(96), bl(18), 150)
    img.alpha_composite(_qr_card(), (0, bl(50)))
    L.chrome(img, "noir")
    return img


# ================================================================ 조립
#
# 행 번호(sec)는 HANDOFF2 §2 의 추적용이고, 화면 번호는 조판 쪽에서 따로 센다.
# tier 는 검사가 읽는다 — 바닥·악센트 간격을 여기서 선언하고 `test_film.py` 가
# 실측으로 대조한다.
H1_DUR, H2_DUR, H3_DUR = 5.0, 7.0, 8.0
B1_DUR, B2_DUR, B3_DUR, B4_DUR = 8.0, 12.0, 8.0, 10.0
C1_DUR = 12.0
D1_DUR, D2_DUR, D3_DUR, D4_DUR, D5_DUR = 8.0, 17.0, 8.0, 17.0, 8.0
E1_DUR, E2_DUR, E3_DUR, E4_DUR = 8.0, 16.0, 8.0, 12.0
F1_DUR, F2_DUR, F3_DUR, F4_DUR = 8.0, 20.0, 8.0, 14.0
G1_DUR, G2_DUR, G3_DUR = 8.0, 16.0, 10.0
W1_DUR, W2_DUR, W3_DUR, W4_DUR = 8.0, 7.0, 7.0, 7.0
W5_DUR, W6_DUR, W7_DUR = 8.0, 8.0, 9.0
X1_DUR, X2_DUR, X3_DUR = 8.0, 9.0, 9.0
Y1_DUR, Y2_DUR = 12.0, 12.0

_SPEC = [
    # (id, 행, 길이, 계층, 함수, 전환, 전환길이)
    ("H1", "00", H1_DUR, ACCENT, h1_thread,  None,       0.00),
    ("H2", "00", H2_DUR, ACCENT, h2_barb,    hard_cut,   0.00),
    ("H3", "00", H3_DUR, MID,    h3_title,   hard_cut,   0.00),

    ("B1", "01", B1_DUR, ACCENT, b1_open,    wipe_down,  0.50),
    ("B2", "01", B2_DUR, BED,    b2_product, hard_cut,   0.00),
    ("B3", "01", B3_DUR, ACCENT, b3_barb,    hard_cut,   0.00),
    ("B4", "01", B4_DUR, BED,    b4_shape,   reveal_box, 0.80),

    ("C1", "02", C1_DUR, ACCENT, c1_open,    wipe_down,  0.55),

    ("D1", "03", D1_DUR, ACCENT, d1_open,    hard_cut,   0.00),
    ("D2", "03", D2_DUR, BED,    d2_insert,  wipe_down,  0.55),
    ("D3", "03", D3_DUR, ACCENT, d3_taut,    hard_cut,   0.00),
    ("D4", "03", D4_DUR, BED,    d4_engage,  wipe_down,  0.55),
    ("D5", "03", D5_DUR, MID,    d5_marks,   hard_cut,   0.00),

    ("E1", "04", E1_DUR, ACCENT, e1_open,    wipe_right, 0.55),
    ("E2", "04", E2_DUR, BED,    e2_capsule, wipe_down,  0.55),
    ("E3", "04", E3_DUR, ACCENT, e3_release, hard_cut,   0.00),
    ("E4", "04", E4_DUR, BED,    e4_sum,     wipe_down,  0.55),

    ("F1", "05", F1_DUR, ACCENT, f1_open,    reveal_box, 0.80),
    ("F2", "05", F2_DUR, MID,    f2_face,    wipe_right, 0.55),
    ("F3", "05", F3_DUR, ACCENT, f3_accent,  hard_cut,   0.00),
    ("F4", "05", F4_DUR, BED,    f4_table,   reveal_box, 0.80),

    ("G1", "06", G1_DUR, ACCENT, g1_open,    wipe_down,  0.55),
    ("G2", "06", G2_DUR, BED,    g2_certs,   wipe_down,  0.55),
    ("G3", "06", G3_DUR, MID,    g3_world,   hard_cut,   0.00),

    ("W1", "07", W1_DUR, ACCENT, w1_open,    wipe_down,  0.55),
    ("W2", "07", W2_DUR, MID,    w2_georgia, hard_cut,   0.00),
    ("W3", "07", W3_DUR, MID,    w3_ceremony, hard_cut,  0.00),
    ("W4", "07", W4_DUR, ACCENT, w4_accent,  hard_cut,   0.00),
    ("W5", "07", W5_DUR, MID,    w5_cert,    hard_cut,   0.00),
    ("W6", "07", W6_DUR, MID,    w6_academy, hard_cut,   0.00),
    ("W7", "07", W7_DUR, MID,    w7_podium,  hard_cut,   0.00),

    ("X1", "08", X1_DUR, ACCENT, x1_open,    reveal_box, 0.80),
    ("X2", "08", X2_DUR, MID,    x2_consult, wipe_right, 0.55),
    ("X3", "08", X3_DUR, MID,    x3_lobby,   hard_cut,   0.00),

    ("Y1", "09", Y1_DUR, ACCENT, y1_close,   wipe_down,  0.55),
    ("Y2", "09", Y2_DUR, MID,    y2_qr,      hard_cut,   0.00),
]


def _build():
    out, t = [], 0.0
    for (bid, sec, dur, tier, fn, trans, tdur) in _SPEC:
        out.append(dict(id=bid, sec=sec, start=t, dur=dur, tier=tier, fn=fn,
                        trans=trans, tdur=tdur))
        t += dur
    if abs(t - TOTAL / float(FPS)) > 1e-9:
        raise ValueError("블록 합계가 %.3f초다 — %.3f초여야 한다"
                         % (t, TOTAL / float(FPS)))
    return out


BLOCKS = _build()


def _block_at(t):
    for i in range(len(BLOCKS) - 1, -1, -1):
        if t >= BLOCKS[i]["start"] - 1e-9:
            return i
    return 0


def render_frame(i):
    t = i / float(FPS)
    k = _block_at(t)
    b = BLOCKS[k]
    img = b["fn"](t - b["start"])
    # 전환 구간이면 앞 블록을 **계속 돌린 채로** 합성한다. 마지막 프레임에
    # 얼려 두면 그 0.8초가 정지 구간이 된다(인계문 §7-3).
    if k > 0 and b["tdur"] > 0:
        dt = t - b["start"]
        if dt < b["tdur"]:
            prev = BLOCKS[k - 1]
            under = prev["fn"](t - prev["start"])
            img = b["trans"](under, img, dt / b["tdur"])
    return img.convert("RGB")


# ================================================================ CLI
def _sheet():
    """블록마다 가운데 한 컷. 6분을 한 장으로 훑어본다."""
    cols, tw, th = 6, 240, 427
    rows = -(-len(BLOCKS) // cols)
    out = Image.new("RGB", (tw * cols + 4 * (cols - 1), (th + 26) * rows),
                    (250, 250, 250))
    d = ImageDraw.Draw(out)
    f = L.font("sb", 20)
    for i, b in enumerate(BLOCKS):
        r, c = divmod(i, cols)
        y = r * (th + 26) + 26
        sec = b["start"] + b["dur"] * 0.5
        im = render_frame(int(round(sec * FPS)))
        out.paste(im.resize((tw, th), Image.LANCZOS), (c * (tw + 4), y))
        d.text((c * (tw + 4) + 2, y - 23),
               "%s %s %.0fs %s" % (b["id"], b["sec"], b["dur"], b["tier"]),
               font=f, fill=(30, 24, 20))
    os.makedirs(STILLS, exist_ok=True)
    path = os.path.join(STILLS, "_sheet.jpg")
    out.save(path, quality=88)
    print("->", path, out.size)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunk", type=int, default=None)
    ap.add_argument("--join", action="store_true")
    ap.add_argument("--stills", default=None, help="초 단위, 쉼표 구분")
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--plan", action="store_true", help="블록표를 찍는다")
    a = ap.parse_args()
    os.makedirs(SCENES, exist_ok=True)

    if a.plan:
        last = -99.0
        print("%-4s %-4s %8s %8s %7s %-7s %s" %
              ("id", "행", "시작", "끝", "길이", "계층", "악센트 간격"))
        for b in BLOCKS:
            gap = ""
            if b["tier"] == ACCENT:
                gap = "%.0f초" % (b["start"] - last) if last > -1 else "-"
                last = b["start"] + b["dur"]
            print("%-4s %-4s %8.1f %8.1f %7.1f %-7s %s" %
                  (b["id"], b["sec"], b["start"], b["start"] + b["dur"],
                   b["dur"], b["tier"], gap))
        print("합계 %.3f초 / %d프레임" % (
            sum(b["dur"] for b in BLOCKS), TOTAL))
        return

    if a.sheet:
        _sheet()
        return

    if a.stills:
        os.makedirs(STILLS, exist_ok=True)
        for s in a.stills.split(","):
            sec = float(s)
            render_frame(int(round(sec * FPS))).save(
                os.path.join(STILLS, "t%06.1f.png" % sec))
            print("%.1fs" % sec)
        return

    if a.join:
        parts = [os.path.join(SCENES, "R%02d.mp4" % k) for k in range(CHUNKS)]
        miss = [q for q in parts if not os.path.isfile(q)]
        if miss:
            raise SystemExit("청크가 없다: %s"
                             % ", ".join(map(os.path.basename, miss)))
        lst = os.path.join(SCENES, "_join.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for q in parts:
                f.write("file '%s'\n" % q.replace("\\", "/"))
        out = os.path.join(os.path.dirname(EDIT), "aptos_6min.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe",
                        "0", "-i", lst, "-c", "copy", "-movflags", "+faststart",
                        out], check=True)
        print("->", out)
        return

    if a.chunk is None:
        raise SystemExit("--chunk 0..%d / --join / --stills / --sheet / --plan"
                         % (CHUNKS - 1))
    k = a.chunk
    out = os.path.join(SCENES, "R%02d.mp4" % k)
    encode_range(render_frame, k * CHUNK_FRAMES, (k + 1) * CHUNK_FRAMES, out,
                 crf=12, preset="medium")
    print("청크 %d -> %s" % (k, out))


if __name__ == "__main__":
    main()
