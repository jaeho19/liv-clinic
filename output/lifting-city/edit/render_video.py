# -*- coding: utf-8 -*-
"""LIV 리프팅 시티 01 - 1080x1920 / 30fps / 360초 세로 영상 렌더러.

- 배경: Higgsfield 생성 6초 클립 8개(G01~G08b) + 실제 병원 사진
- 전경: 실제 장비 PNG / 원장 사진 D01 / 한글 조판 / QR
- 병원명(상단)과 "이 건물 4층"(하단)은 전 구간 고정 노출
- 장면 경계는 0.4초 크로스 디졸브. 고정 크롬은 디졸브 위에 그려 흔들리지 않는다.

사용:
  python render_video.py --scene 1          # 1번 장면(30초)만 렌더 -> edit/scenes/M01.mp4
  python render_video.py --stills 0,3,6.5   # 해당 초의 정지 프레임 PNG 저장
"""
import os
import sys
import argparse
import subprocess
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# ---------------------------------------------------------------- paths / spec
EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)
PREP = os.path.join(EDIT, "prep")
GEN = os.path.join(EDIT, "gen")
FONTDIR = os.path.join(EDIT, "fonts")
SCENEDIR = os.path.join(EDIT, "scenes")

W, H, FPS = 1080, 1920, 30
SCENE_SEC = 30
SCENE_FRAMES = SCENE_SEC * FPS
N_SCENES = 12
NFRAMES = SCENE_FRAMES * N_SCENES          # 10800
SAFE = 72
XF_FRAMES = 12                              # 장면 간 디졸브 길이(0.4초)

# ---------------------------------------------------------------- palette
ROSE = (180, 152, 141)          # #b4988d
ROSE_T = (222, 198, 186)        # 어두운 배경 위 로즈 텍스트
ROSE_D = (146, 116, 103)
BROWN = (109, 78, 66)           # #6d4e42
OFFW = (246, 246, 246)          # #f6f6f6
CHAR = (87, 87, 86)             # #575756
INK = (42, 32, 26)
CREAM = (240, 233, 226)
WHITE = (255, 255, 255)

CLINIC = "리브성형외과"
FLOOR = "이 건물 4층"
PHONE = "02-797-2773"
ADDRESS = "서울 서초구 나루터로 80 자은빌딩 4층"
QR_TEXT = "liv-clinic.net/ko/contact"
FOUR = "울쎄라 · 써마지 · 덴서티 · 악센트 프라임"

FONTS = {"r": "Pretendard-Regular.ttf", "m": "Pretendard-Medium.ttf",
         "sb": "Pretendard-SemiBold.ttf", "b": "Pretendard-Bold.ttf",
         "xb": "Pretendard-ExtraBold.ttf"}


# ---------------------------------------------------------------- easing
def clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def p(t, t0, d):
    return clamp01((t - t0) / d) if d > 0 else (1.0 if t >= t0 else 0.0)


def eo(x):          # ease-out cubic
    return 1.0 - (1.0 - x) ** 3


def eio(x):         # smoothstep
    return x * x * (3.0 - 2.0 * x)


def vis(t, t0, t1=None, fin=0.5, fout=0.4):
    """(alpha, 등장진행도) - 등장진행도는 슬라이드 오프셋용."""
    a_in = eo(p(t, t0, fin))
    a_out = 1.0 - eio(p(t, t1, fout)) if t1 is not None else 1.0
    return a_in * a_out, a_in


# ---------------------------------------------------------------- primitives
@lru_cache(maxsize=96)
def font(key, size):
    return ImageFont.truetype(os.path.join(FONTDIR, FONTS[key]), int(size))


_MEASURE = ImageDraw.Draw(Image.new("RGBA", (4, 4)))


@lru_cache(maxsize=2048)
def tmetrics(text, fkey, size):
    bb = _MEASURE.textbbox((0, 0), text, font=font(fkey, size), anchor="la")
    return bb  # (x0, y0, x1, y1) - 'la' 원점 기준


def twidth(text, fkey, size):
    bb = tmetrics(text, fkey, size)
    return bb[2] - bb[0]


def fit_size(text, fkey, size, maxw):
    s = int(size)
    while s > 16 and twidth(text, fkey, s) > maxw:
        s -= 2
    return s


@lru_cache(maxsize=1200)
def text_img(text, fkey, size, fill, shadow, blur, sdy):
    f = font(fkey, size)
    bb = tmetrics(text, fkey, size)
    pad = (blur * 2 + 12) if shadow else 6
    w = max(4, bb[2] - bb[0] + pad * 2)
    h = max(4, bb[3] - bb[1] + pad * 2 + (sdy if shadow else 0))
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ox, oy = pad - bb[0], pad - bb[1]
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((ox, oy + sdy), text, font=f, fill=(0, 0, 0, shadow), anchor="la")
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(img).text((ox, oy), text, font=f, fill=fill, anchor="la")
    return img, ox, oy, bb[2] - bb[0], bb[3] - bb[1], bb[1]


def put(base, img, pos, alpha=1.0):
    if alpha <= 0.004:
        return
    if alpha < 0.996:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(img, (int(round(pos[0])), int(round(pos[1]))), img)


def T(base, text, x, y, fkey, size, fill=OFFW, ha="l", va="a", alpha=1.0,
      shadow=0, blur=12, sdy=5, maxw=None, dx=0, dy=0):
    """한 줄 조판. y는 기본적으로 어센더 라인(va='a'), va='c'면 잉크 세로중심."""
    if alpha <= 0.004 or not text:
        return 0
    if maxw:
        size = fit_size(text, fkey, size, maxw)
    im, ox, oy, tw, th, by0 = text_img(text, fkey, int(size), fill, int(shadow), int(blur), int(sdy))
    if ha == "m":
        x -= tw / 2.0
    elif ha == "r":
        x -= tw
    if va == "c":
        y = y - by0 - th / 2.0
    elif va == "b":
        y = y - by0 - th
    put(base, im, (x - ox + dx, y - oy + dy), alpha)
    return tw


def TL(base, lines, x, y, fkey, size, fill=OFFW, lh=None, ha="l", alpha=1.0,
       shadow=0, blur=12, maxw=None, dy=0, stagger=0.0, t=None, t0=None):
    lh = lh or int(size * 1.26)
    for i, ln in enumerate(lines):
        a = alpha
        if stagger and t is not None and t0 is not None:
            a = alpha * eo(p(t, t0 + i * stagger, 0.45))
        T(base, ln, x, y + i * lh, fkey, size, fill, ha, "a", a, shadow, blur, maxw=maxw, dy=dy)
    return len(lines) * lh


def rule(base, x, y, w, h=5, color=ROSE, alpha=1.0):
    if alpha <= 0.004 or w < 1:
        return
    im = Image.new("RGBA", (int(w), int(h)), tuple(color) + (255,))
    put(base, im, (x, y), alpha)


@lru_cache(maxsize=192)
def card(w, h, radius, fill, shadow=120, sblur=22, soff=12):
    pad = sblur * 2 + soff + 8
    img = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([pad, pad + soff, pad + w, pad + h + soff],
                                             radius, fill=(0, 0, 0, shadow))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(sblur)))
    ImageDraw.Draw(img).rounded_rectangle([pad, pad, pad + w, pad + h], radius, fill=tuple(fill))
    return img, pad


def CARD(base, x, y, w, h, radius=28, fill=CREAM, alpha=1.0, shadow=120, dy=0):
    im, pad = card(int(w), int(h), int(radius), tuple(fill), int(shadow))
    put(base, im, (x - pad, y - pad + dy), alpha)


@lru_cache(maxsize=32)
def card_outline(w, h, radius, a=84, width=3):
    img = Image.new("RGBA", (w + 4, h + 4), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([1, 1, w + 2, h + 2], radius,
                                          outline=(246, 246, 246, a), width=width)
    return img


@lru_cache(maxsize=96)
def rrect_mask(w, h, radius):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius, fill=255)
    return m


# ---------------------------------------------------------------- assets
_A = {}
_PNG = {"E01", "E02", "E03", "logo_white", "logo_ink", "qr"}


def asset(key):
    if key not in _A:
        ext = ".png" if key in _PNG else ".jpg"
        im = Image.open(os.path.join(PREP, key + ext))
        _A[key] = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    return _A[key]


def cover(img, w, h, cx=0.5, cy=0.5, zoom=1.0, resample=Image.LANCZOS):
    w, h = int(w), int(h)
    ar_t = w / float(h)
    sw, sh = img.size
    if sw / float(sh) > ar_t:
        ch = sh / zoom
        cw = ch * ar_t
    else:
        cw = sw / zoom
        ch = cw / ar_t
    cw, ch = min(cw, sw), min(ch, sh)
    x = (sw - cw) * cx
    y = (sh - ch) * cy
    return img.resize((w, h), resample, box=(x, y, x + cw, y + ch))


@lru_cache(maxsize=160)
def photo_panel(key, w, h, radius=24, dim=0.0, cx=0.5, cy=0.5, shadow=130, border=True):
    im = cover(asset(key), w, h, cx, cy, 1.0)
    if dim > 0:
        im = ImageEnhance.Brightness(im).enhance(1.0 - dim)
    im = im.convert("RGBA")
    im.putalpha(rrect_mask(w, h, radius))
    pad = 46
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 14, pad + w, pad + h + 14],
                                             radius, fill=(0, 0, 0, shadow))
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(20)))
    out.alpha_composite(im, (pad, pad))
    if border:
        ImageDraw.Draw(out).rounded_rectangle([pad, pad, pad + w - 1, pad + h - 1],
                                              radius, outline=(255, 255, 255, 46), width=2)
    return out, pad


@lru_cache(maxsize=96)
def device_img(key, h, ground=True):
    src = asset(key)
    w = max(1, int(round(src.width * h / float(src.height))))
    im = src.resize((w, int(h)), Image.LANCZOS)
    pad = 46
    out = Image.new("RGBA", (w + 2 * pad, int(h) + 2 * pad), (0, 0, 0, 0))
    if ground:
        sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse([pad + w * 0.06, pad + h - 22, pad + w * 0.94, pad + h + 30],
                                   fill=(0, 0, 0, 120))
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(16)))
    out.alpha_composite(im, (pad, pad))
    return out, pad


# ---------------------------------------------------------------- backgrounds
def clip_frame(key, idx):
    idx = max(1, min(180, int(idx)))
    return Image.open(os.path.join(GEN, "frames", key, "%04d.jpg" % idx)).convert("RGB")


_PLATE = {}


def ambient_plate(key, blur=26, dim=0.50, bright=1.0):
    k = ("a", key, blur, dim, bright)
    if k not in _PLATE:
        pl = cover(clip_frame(key, 180), int(W * 1.24), int(H * 1.24))
        pl = pl.filter(ImageFilter.GaussianBlur(blur))
        _PLATE[k] = ImageEnhance.Brightness(pl).enhance((1.0 - dim) * bright)
    return _PLATE[k]


def photo_plate(key, blur=0, dim=0.0, bright=1.0, cx=0.5, cy=0.5, zoom_room=1.24):
    k = ("p", key, blur, dim, bright, cx, cy, zoom_room)
    if k not in _PLATE:
        pl = cover(asset(key), int(W * zoom_room), int(H * zoom_room), cx, cy)
        if blur:
            pl = pl.filter(ImageFilter.GaussianBlur(blur))
        if dim or bright != 1.0:
            pl = ImageEnhance.Brightness(pl).enhance((1.0 - dim) * bright)
        _PLATE[k] = pl
    return _PLATE[k]


def kb(plate, prog, z0=1.0, z1=1.07, cx0=0.5, cy0=0.5, cx1=0.5, cy1=0.5,
       resample=Image.BICUBIC):
    prog = clamp01(prog)
    return cover(plate, W, H,
                 cx0 + (cx1 - cx0) * prog, cy0 + (cy1 - cy0) * prog,
                 z0 + (z1 - z0) * prog, resample)


def bg_scene(key, t, cut=6.0, xf=0.7, blur=24, dim=0.44, bright=1.0, z1=1.17, sway=1):
    """0~cut초는 생성 클립 원본, 이후는 마지막 프레임의 블러 플레이트로 자연 전환.

    뒤 24초는 항상 눈에 보이는 속도로 천천히 움직인다(완전 정지 구간을 만들지 않음).
    """
    amb = kb(ambient_plate(key, blur, dim, bright), (t - cut) / (SCENE_SEC - cut), 1.0, z1,
             0.5 - 0.055 * sway, 0.5 + 0.045 * sway, 0.5 + 0.055 * sway, 0.5 - 0.045 * sway)
    if t >= cut + xf:
        return amb
    live = clip_frame(key, int(t * FPS) + 1)
    if t <= cut:
        return live
    return Image.blend(live, amb, eio((t - cut) / xf))


@lru_cache(maxsize=8)
def _vignette():
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.72)) ** 2 + ((yy - H / 2) / (H * 0.78)) ** 2)
    a = np.clip((d - 0.55) / 0.85, 0, 1) ** 1.6 * 150
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., 3] = a.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def vignette(base, alpha=1.0):
    put(base, _vignette(), (0, 0), alpha)


# ---------------------------------------------------------------- fixed chrome
def _scrim(height, a_top, a_bot, color=(24, 18, 15)):
    a = np.linspace(a_top, a_bot, height)
    rgba = np.zeros((height, W, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
    rgba[..., 3] = np.repeat(a[:, None], W, axis=1).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


_CHROME = {}


def chrome():
    if "top" not in _CHROME:
        # ---- 상단: 병원 로고 + 병원명
        top = Image.new("RGBA", (W, 330), (0, 0, 0, 0))
        top.alpha_composite(_scrim(330, 172, 0))
        logo = asset("logo_white").resize((247, 58), Image.LANCZOS)
        top.alpha_composite(logo, (SAFE, 84))
        T(top, CLINIC, W - SAFE, 113, "sb", 46, OFFW, "r", "c", 1.0, shadow=150, blur=10)
        _CHROME["top"] = top

        # ---- 하단: "이 건물 4층" 필 + 전화번호
        bot = Image.new("RGBA", (W, 430), (0, 0, 0, 0))
        bot.alpha_composite(_scrim(430, 0, 205))
        py = 430 - 72 - 92            # 하단 안전여백 72 위
        pw = int(twidth(FLOOR, "b", 50) + 76)
        pill, pad = card(pw, 92, 46, ROSE, shadow=110)
        bot.alpha_composite(pill, (SAFE - pad, py - pad))
        T(bot, FLOOR, SAFE + pw / 2, py + 46, "b", 50, WHITE, "m", "c")
        T(bot, PHONE, W - SAFE, py + 46, "m", 42, OFFW, "r", "c", 1.0, shadow=140, blur=10)
        _CHROME["bot"] = bot
    return _CHROME["top"], _CHROME["bot"]


def draw_chrome(base):
    top, bot = chrome()
    base.paste(top, (0, 0), top)
    base.paste(bot, (0, H - 430), bot)


# ---------------------------------------------------------------- 공통 조각
@lru_cache(maxsize=48)
def _softplate(w, h, radius, a, blur):
    pad = blur * 2 + 10
    img = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([pad, pad, pad + w, pad + h], radius, fill=(18, 13, 11, a))
    return img.filter(ImageFilter.GaussianBlur(blur)), pad


def softplate(base, cx, cy, w, h, alpha=1.0, a=120, radius=70, blur=26):
    """사진 위 흰 글씨 가독성을 위한 가장자리가 부드러운 어두운 판."""
    im, pad = _softplate(int(w), int(h), int(radius), int(a), int(blur))
    put(base, im, (cx - w / 2 - pad, cy - h / 2 - pad), alpha)


def title_block(img, t, lines, size=104, y=300, x=SAFE, fkey="xb", fill=OFFW,
                t0=0.12, t1=5.6, ha="l", lh=None):
    a, r = vis(t, t0, t1, 0.42, 0.45)
    if a <= 0:
        return
    lh2 = lh or int(size * 1.26)
    wmax = max(twidth(ln, fkey, fit_size(ln, fkey, size, W - 2 * SAFE)) for ln in lines)
    cx = (x + wmax / 2.0) if ha == "l" else x
    softplate(img, cx, y + len(lines) * lh2 / 2.0 + 6, min(W - 20, wmax + 150),
              len(lines) * lh2 + 120, a * 0.85, a=108, radius=80, blur=34)
    TL(img, lines, x, y + int((1 - r) * 34), fkey, size, fill, lh, ha, a, shadow=180, blur=18,
       maxw=W - 2 * SAFE)


def eyebrow(img, t, text, y, t0, t1=None, fill=ROSE_T, size=42, x=SAFE, ha="l"):
    a, r = vis(t, t0, t1, 0.45)
    if a <= 0:
        return
    if ha == "l":
        rule(img, x, y - 26, 96 * r, 5, ROSE, a)
        T(img, text, x, y, "m", size, fill, "l", "a", a, shadow=150, blur=10)
    else:
        T(img, text, x, y, "m", size, fill, ha, "a", a, shadow=150, blur=10)


def recap_block(img, t, name, sub, t0=22.0, t1=26.0, y=980, size=104):
    """beat4: 장비·주제명 + 병원명 재확인."""
    a, r = vis(t, t0, t1, 0.5, 0.4)
    if a <= 0:
        return
    softplate(img, W / 2, y + 96, 920, 330, a * 0.92)
    T(img, name, W / 2, y + int((1 - r) * 26), "xb", size, OFFW, "m", "a", a,
      shadow=180, blur=18, maxw=W - 2 * SAFE)
    rule(img, W / 2 - 60, y + int(size * 1.22) + 34, 120, 5, ROSE, a)
    T(img, sub, W / 2, y + int(size * 1.22) + 82, "m", 52, ROSE_T, "m", "a",
      a * eo(p(t, t0 + 0.25, 0.5)), shadow=150, blur=12, maxw=W - 2 * SAFE)


def floor_block(img, t, t0=26.0, sub="리프팅 상담은 리브성형외과", y=1030):
    """beat5: 4층 안내."""
    a, r = vis(t, t0, None, 0.55)
    if a <= 0:
        return
    softplate(img, W / 2, y + 130, 920, 360, a * 0.92)
    T(img, FLOOR, W / 2, y + int((1 - r) * 30), "xb", 116, OFFW, "m", "a", a,
      shadow=190, blur=20)
    rule(img, W / 2 - 70, y + 190, 140, 5, ROSE, a)
    T(img, sub, W / 2, y + 236, "m", 52, ROSE_T, "m", "a",
      a * eo(p(t, t0 + 0.3, 0.5)), shadow=160, blur=12, maxw=W - 2 * SAFE)


@lru_cache(maxsize=64)
def equip_card(kind, w, h, label, sub):
    """장비 카드(사진형) / 악센트 프라임 카드(조판형). 텍스트까지 구운 캐시 이미지.

    주의: card()가 돌려주는 이미지는 lru_cache 공유 객체이므로 반드시 복사 후 그린다.
    """
    lab_area = 170 if h >= 600 else 150
    ih = h - lab_area
    cap_size = 34 if h >= 600 else 30

    if kind == "ACCENT":
        base, pad = card(w, h, 28, ROSE, shadow=130)
        img = base.copy()
        d = ImageDraw.Draw(img)
        cx = pad + w / 2.0
        top = pad + ih * 0.16
        for rw, al, lw in ((w * 0.74, 105, 9), (w * 0.54, 150, 8), (w * 0.34, 205, 7)):
            d.arc([cx - rw / 2, top, cx + rw / 2, top + rw * 0.92], 190, 350,
                  fill=(255, 255, 255, al), width=lw)
        lines = label.split("\n")
        ly = pad + ih + 10 - (0 if len(lines) == 1 else int(cap_size * 1.0))
        s = min(fit_size(ln, "b", 58, w - 56) for ln in lines)
        for i, ln in enumerate(lines):
            T(img, ln, cx, ly + i * int(s * 1.16), "b", s, WHITE, "m")
        if sub:
            T(img, sub, cx, pad + h - cap_size - 26, "m", cap_size, (255, 255, 255, 225), "m",
              maxw=w - 48)
        return img, pad

    base, pad = card(w, h, 28, CREAM, shadow=130)
    img = base.copy()
    dv, dpad = device_img(kind, ih - 50, ground=False)
    img.alpha_composite(dv, (int(pad + (w - dv.width) / 2), int(pad + 25 - dpad)))
    ly = pad + ih + 10
    s = fit_size(label, "b", 58, w - 48)
    T(img, label, pad + w / 2, ly, "b", s, INK, "m")
    ImageDraw.Draw(img).rounded_rectangle(
        [pad + w / 2 - 30, ly + int(s * 1.14), pad + w / 2 + 30, ly + int(s * 1.14) + 5],
        3, fill=ROSE + (255,))
    if sub:
        T(img, sub, pad + w / 2, ly + int(s * 1.14) + 26, "m", cap_size, CHAR, "m", maxw=w - 48)
    return img, pad


def reveal(base, top_img, rect, prog, radius=0):
    """rect(사각형)에서 시작해 전체 화면으로 확장하며 top_img를 드러낸다."""
    prog = clamp01(prog)
    x0, y0, x1, y1 = rect
    cx0 = x0 + (0 - x0) * prog
    cy0 = y0 + (0 - y0) * prog
    cx1 = x1 + (W - x1) * prog
    cy1 = y1 + (H - y1) * prog
    w = max(2, int(cx1 - cx0))
    h = max(2, int(cy1 - cy0))
    rad = int(radius * (1 - prog))
    crop = top_img.crop((int(cx0), int(cy0), int(cx0) + w, int(cy0) + h)).convert("RGBA")
    crop.putalpha(rrect_mask(w, h, rad) if rad > 0 else Image.new("L", (w, h), 255))
    base.paste(crop, (int(cx0), int(cy0)), crop)


@lru_cache(maxsize=4)
def accent_hero(w, h):
    """악센트 프라임 전용 히어로 판. 장비 사진이 없으므로 조판과 리본 그래픽으로 완결."""
    base, pad = card(w, h, 32, ROSE, shadow=140)
    img = base.copy()
    d = ImageDraw.Draw(img)
    cx = pad + w / 2.0
    top = pad + 54
    for rw, al, lw in ((w * 0.78, 100, 10), (w * 0.58, 148, 9), (w * 0.38, 205, 8)):
        d.arc([cx - rw / 2, top, cx + rw / 2, top + rw * 0.44], 190, 350,
              fill=(255, 255, 255, al), width=lw)
    T(img, "악센트 프라임", cx, pad + 400, "b", 104, WHITE, "m", maxw=w - 90)
    T(img, "리브성형외과 리프팅 상담", cx, pad + 552, "m", 46, (255, 255, 255, 232), "m",
      maxw=w - 90)
    return img, pad


# ================================================================ SCENES
def m01(t):
    """0:00-0:30 4층이 열린다"""
    img = bg_scene("G01", t, dim=0.40, blur=22, sway=1)

    # b4/b5: 실제 로비 공개
    if t >= 21.6:
        lob = kb(photo_plate("I01", cx=0.42, cy=0.52), p(t, 21.6, 8.4), 1.02, 1.20)
        reveal(img, lob, (390, 700, 690, 1180), eo(p(t, 22.0, 1.0)), radius=26)

    title_block(img, t, ["리프팅,", "이 건물 4층에서"], 104, 300, t1=5.7)
    a4, _ = vis(t, 3.2, 5.7, 0.5, 0.4)
    if a4 > 0:
        rule(img, SAFE, 596, 96, 5, ROSE, a4)
        T(img, FOUR, SAFE, 640, "m", 44, ROSE_T, "l", "a", a4, shadow=150, blur=12,
          maxw=W - 2 * SAFE)

    # b2 / b3 : 장비 카드 두 쌍
    cw, ch = 456, 800
    cy = 640
    pairs = [(6.0, 13.9, [("E01", "울쎄라", "울쎄라피 프라임"), ("E02", "써마지", "FLX")]),
             (14.0, 21.6, [("E03", "덴서티", "고주파 기반 장비"),
                           ("ACCENT", "악센트\n프라임", "")])]
    for t0, t1, items in pairs:
        a, r = vis(t, t0, t1, 0.55, 0.4)
        if a <= 0:
            continue
        for i, (kind, lab, sub) in enumerate(items):
            im, pad = equip_card(kind, cw, ch, lab, sub)
            ai = a * eo(p(t, t0 + i * 0.14, 0.5))
            dy = int((1 - eo(p(t, t0 + i * 0.14, 0.6))) * 44)
            put(img, im, (SAFE + i * (cw + 24) - pad, cy - pad + dy), ai)
        eyebrow(img, t, "리브성형외과 리프팅 장비", 548, t0 + 0.1, t1)

    # b4 병원명
    a, r = vis(t, 22.9, 26.0, 0.5, 0.4)
    if a > 0:
        softplate(img, W / 2, 1290, 920, 340, a * 0.9)
        T(img, CLINIC, W / 2, 1180 + int((1 - r) * 26), "xb", 116, OFFW, "m", "a", a,
          shadow=190, blur=20)
        T(img, "리프팅 상담", W / 2, 1360, "m", 52, ROSE_T, "m", "a",
          a * eo(p(t, 23.2, 0.5)), shadow=150, blur=12)

    floor_block(img, t, 26.0, "리프팅 상담은 리브성형외과", 1020)
    return img


def _device_scene(bgkey, t, name_lines, sub_line, info_main, info_sub, dev,
                  layout="center", eyebrow_txt="리브성형외과 보유 장비",
                  title_size=112, bright=1.0, dim=0.5, sway=1):
    img = bg_scene(bgkey, t, dim=dim, blur=26, bright=bright, sway=sway)
    title_block(img, t, name_lines, title_size, 300, t1=5.7)
    a, _ = vis(t, 3.0, 5.7, 0.5, 0.4)
    if a > 0:
        y = 300 + len(name_lines) * int(title_size * 1.22) + 34
        rule(img, SAFE, y - 26, 96, 5, ROSE, a)
        T(img, sub_line, SAFE, y, "m", 56, ROSE_T, "l", "a", a, shadow=150, blur=12,
          maxw=W - 2 * SAFE)
    return img


def m02(t):
    """0:30-1:00 울쎄라 쇼룸 - 장비 중앙, 정보 카드 하단"""
    img = _device_scene("G02", t, ["울쎄라"], "울쎄라피 프라임", None, None, "E01", sway=-1)

    # b2: 장비 크게 중앙
    a, r = vis(t, 6.0, 13.9, 0.6, 0.45)
    if a > 0:
        eyebrow(img, t, "리브성형외과 보유 장비", 500, 6.1, 13.9)
        dv, pad = device_img("E01", 700)
        put(img, dv, (W / 2 - dv.width / 2, 560 - pad + int((1 - r) * 30)), a)
        T(img, "울쎄라", W / 2, 1310, "xb", 108, OFFW, "m", "a",
          a * eo(p(t, 6.3, 0.5)), shadow=190, blur=18)
        T(img, "울쎄라피 프라임", W / 2, 1440, "m", 54, ROSE_T, "m", "a",
          a * eo(p(t, 6.6, 0.5)), shadow=150, blur=12)

    # b3: 장비 축소 + 정보 카드
    a, r = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        dv, pad = device_img("E01", 520)
        put(img, dv, (W / 2 - dv.width / 2, 470 - pad), a)
        CARD(img, SAFE, 1090, W - 2 * SAFE, 330, 28, CREAM, a, dy=int((1 - r) * 40))
        yy = 1150 + int((1 - r) * 40)
        T(img, "초음파 기반 장비", W / 2, yy, "b", 76, INK, "m", "a", a, maxw=W - 2 * SAFE - 60)
        rule(img, W / 2 - 40, yy + 104, 80, 5, ROSE, a)
        T(img, "울쎄라 리프팅 상담은 리브성형외과", W / 2, yy + 146, "m", 46, CHAR, "m", "a",
          a * eo(p(t, 14.4, 0.5)), maxw=W - 2 * SAFE - 60)

    # b4
    a, r = vis(t, 22.0, 26.0, 0.5, 0.4)
    if a > 0:
        dv, pad = device_img("E01", 320)
        put(img, dv, (W / 2 - dv.width / 2, 560 - pad), a)
    recap_block(img, t, "울쎄라", CLINIC, 22.0, 26.0, 1000, 112)

    floor_block(img, t, 26.0, "울쎄라 상담은 리브성형외과", 1020)
    return img


def m03(t):
    """1:00-1:30 써마지 쇼룸 - 장비 오른쪽, 이름 왼쪽"""
    img = _device_scene("G03", t, ["써마지 FLX"], "고주파 기반 장비", None, None, "E02",
                        title_size=100, sway=1)

    a, r = vis(t, 6.0, 13.9, 0.6, 0.45)
    if a > 0:
        dv, pad = device_img("E02", 760)
        put(img, dv, (700 - dv.width / 2 + int((1 - r) * 40), 560 - pad), a)
        eyebrow(img, t, "리브성형외과 보유 장비", 600, 6.1, 13.9)
        T(img, "써마지", SAFE, 700, "xb", 100, OFFW, "l", "a",
          a * eo(p(t, 6.3, 0.5)), shadow=190, blur=18)
        T(img, "FLX", SAFE, 830, "xb", 86, ROSE_T, "l", "a",
          a * eo(p(t, 6.5, 0.5)), shadow=170, blur=16)
        rule(img, SAFE, 970, 140, 5, ROSE, a * eo(p(t, 6.8, 0.5)))

    a, r = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        dv, pad = device_img("E02", 640)
        put(img, dv, (W / 2 - dv.width / 2, 430 - pad), a)
        CARD(img, SAFE, 1160, W - 2 * SAFE, 330, 28, CREAM, a, dy=int((1 - r) * 40))
        yy = 1220 + int((1 - r) * 40)
        T(img, "고주파 기반 장비", W / 2, yy, "b", 76, INK, "m", "a", a, maxw=W - 2 * SAFE - 60)
        rule(img, W / 2 - 40, yy + 104, 80, 5, ROSE, a)
        T(img, "써마지 상담은 리브성형외과", W / 2, yy + 146, "m", 46, CHAR, "m", "a",
          a * eo(p(t, 14.4, 0.5)), maxw=W - 2 * SAFE - 60)

    a, _ = vis(t, 22.0, 26.0, 0.5, 0.4)
    if a > 0:
        dv, pad = device_img("E02", 320)
        put(img, dv, (W / 2 - dv.width / 2, 560 - pad), a)
    recap_block(img, t, "써마지 FLX", CLINIC, 22.0, 26.0, 1000, 104)

    floor_block(img, t, 26.0, "써마지 상담은 리브성형외과", 1020)
    return img


def m04(t):
    """1:30-2:00 덴서티 쇼룸 - 정보 카드 상단, 장비 하단"""
    img = _device_scene("G04", t, ["덴서티"], "고주파 기반 장비", None, None, "E03",
                        bright=1.22, dim=0.42, sway=-1)

    a, r = vis(t, 6.0, 13.9, 0.6, 0.45)
    if a > 0:
        eyebrow(img, t, "리브성형외과 보유 장비", 500, 6.1, 13.9)
        dv, pad = device_img("E03", 720)
        put(img, dv, (W / 2 - dv.width / 2, 560 - pad + int((1 - r) * 30)), a)
        T(img, "덴서티", W / 2, 1330, "xb", 112, OFFW, "m", "a",
          a * eo(p(t, 6.3, 0.5)), shadow=190, blur=18)
        T(img, "고주파 기반 장비", W / 2, 1465, "m", 54, ROSE_T, "m", "a",
          a * eo(p(t, 6.6, 0.5)), shadow=150, blur=12)

    a, r = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        CARD(img, SAFE, 420, W - 2 * SAFE, 300, 28, CREAM, a, dy=-int((1 - r) * 40))
        yy = 478 - int((1 - r) * 40)
        T(img, "나의 피부 상태에 맞는 상담", W / 2, yy, "b", 68, INK, "m", "a", a,
          maxw=W - 2 * SAFE - 60)
        rule(img, W / 2 - 40, yy + 96, 80, 5, ROSE, a)
        T(img, "덴서티 상담은 리브성형외과", W / 2, yy + 136, "m", 44, CHAR, "m", "a",
          a * eo(p(t, 14.4, 0.5)), maxw=W - 2 * SAFE - 60)
        dv, pad = device_img("E03", 640)
        put(img, dv, (W / 2 - dv.width / 2, 800 - pad), a)

    a, _ = vis(t, 22.0, 26.0, 0.5, 0.4)
    if a > 0:
        dv, pad = device_img("E03", 320)
        put(img, dv, (W / 2 - dv.width / 2, 560 - pad), a)
    recap_block(img, t, "덴서티", CLINIC, 22.0, 26.0, 1000, 112)

    floor_block(img, t, 26.0, "덴서티 상담은 리브성형외과", 1020)
    return img


def m05(t):
    """2:00-2:30 악센트 프라임 - 장비 사진 없이 조판으로 완결"""
    img = bg_scene("G05", t, dim=0.44, blur=24, sway=1)
    title_block(img, t, ["악센트", "프라임"], 112, 300, t1=5.7)
    a, _ = vis(t, 3.2, 5.7, 0.5, 0.4)
    if a > 0:
        rule(img, SAFE, 596, 96, 5, ROSE, a)
        T(img, "리브성형외과 리프팅 상담", SAFE, 640, "m", 52, ROSE_T, "l", "a", a,
          shadow=150, blur=12)

    a, r = vis(t, 6.0, 13.9, 0.6, 0.45)
    if a > 0:
        im, pad = accent_hero(W - 2 * SAFE, 620)
        put(img, im, (SAFE - pad, 600 - pad + int((1 - r) * 40)), a)
        T(img, "탄력과 라인 고민", W / 2, 1340, "b", 76, OFFW, "m", "a",
          a * eo(p(t, 6.6, 0.5)), shadow=180, blur=16)

    a, r = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        T(img, "탄력과 라인 고민", W / 2, 700 + int((1 - r) * 26), "xb", 90, OFFW, "m", "a", a,
          shadow=190, blur=18, maxw=W - 2 * SAFE)
        rule(img, W / 2 - 70, 850, 140, 5, ROSE, a)
        T(img, "리브성형외과에서", W / 2, 910, "m", 58, ROSE_T, "m", "a",
          a * eo(p(t, 14.3, 0.5)), shadow=150, blur=12)
        T(img, "상담하세요", W / 2, 990, "m", 58, ROSE_T, "m", "a",
          a * eo(p(t, 14.5, 0.5)), shadow=150, blur=12)
        T(img, FOUR, W / 2, 1300, "m", 42, OFFW, "m", "a",
          a * eo(p(t, 15.0, 0.6)), shadow=150, blur=12, maxw=W - 2 * SAFE)

    recap_block(img, t, "악센트 프라임", CLINIC, 22.0, 26.0, 980, 100)
    floor_block(img, t, 26.0, "리프팅 상담은 리브성형외과", 1020)
    return img


def m06(t):
    """2:30-3:00 네 개의 방, 한 곳의 상담"""
    img = bg_scene("G06", t, dim=0.46, blur=24, sway=-1)
    title_block(img, t, ["네 가지 리프팅 상담", CLINIC], 88, 300, t1=5.7)

    GW, GH = 456, 470
    gx = [SAFE, SAFE + GW + 24]
    gy = [530, 530 + GH + 24]
    items = [("E01", "울쎄라", "울쎄라피 프라임"), ("E02", "써마지", "FLX"),
             ("E03", "덴서티", "고주파 기반 장비"), ("ACCENT", "악센트\n프라임", "")]

    a, r = vis(t, 6.0, 21.9, 0.6, 0.45)
    if a > 0:
        # b3 구간에서는 2초씩 한 카드를 강조
        hl = -1
        if t >= 14.0:
            hl = min(3, int((t - 14.0) / 2.0))
        for i, (kind, lab, sub) in enumerate(items):
            im, pad = equip_card(kind, GW, GH, lab, sub)
            ai = a * eo(p(t, 6.0 + i * 0.13, 0.5))
            dy = int((1 - eo(p(t, 6.0 + i * 0.13, 0.62))) * 46)
            if hl >= 0:
                ai *= 1.0 if i == hl else 0.55
            x, y = gx[i % 2], gy[i // 2]
            put(img, im, (x - pad, y - pad + dy), ai)
            if i == hl:
                ring = Image.new("RGBA", (GW + 16, GH + 16), (0, 0, 0, 0))
                ImageDraw.Draw(ring).rounded_rectangle([0, 0, GW + 15, GH + 15], 34,
                                                       outline=ROSE + (255,), width=6)
                put(img, ring, (x - 8, y - 8), a * eo(p(t, 14.0 + hl * 2.0, 0.35)))
        T(img, FOUR, W / 2, 1548, "m", 42, OFFW, "m", "a",
          a * eo(p(t, 6.8, 0.6)), shadow=150, blur=12, maxw=W - 2 * SAFE)

    # b4: 실제 로비 사진 + 문구
    a, r = vis(t, 22.0, 26.0, 0.55, 0.4)
    if a > 0:
        im, pad = photo_panel("I03", W - 2 * SAFE, 620, 28, 0.06, 0.5, 0.5)
        put(img, im, (SAFE - pad, 520 - pad + int((1 - r) * 34)), a)
        T(img, "네 가지 리프팅 상담", W / 2, 1240, "xb", 84, OFFW, "m", "a", a,
          shadow=190, blur=18, maxw=W - 2 * SAFE)
        T(img, CLINIC, W / 2, 1360, "xb", 84, ROSE_T, "m", "a",
          a * eo(p(t, 22.3, 0.5)), shadow=180, blur=18)

    floor_block(img, t, 26.0, "네 가지 리프팅 상담은 여기에서", 1020)
    return img


def m07(t):
    """3:00-3:30 김수영 대표원장"""
    img = bg_scene("G07", t, dim=0.46, blur=26, sway=1)
    title_block(img, t, ["김수영 대표원장"], 92, 300, t1=5.7)
    a, _ = vis(t, 3.0, 5.7, 0.5, 0.4)
    if a > 0:
        rule(img, SAFE, 434, 96, 5, ROSE, a)
        T(img, "성형외과 전문의", SAFE, 478, "m", 56, ROSE_T, "l", "a", a, shadow=150, blur=12)

    # b2: 전시 프레임 안의 실제 프로필
    a, r = vis(t, 6.0, 13.9, 0.6, 0.45)
    if a > 0:
        fw, fh = 560, 842
        fx, fy = int(W / 2 - fw / 2), 470
        drift = int(6 * np.sin((t - 6.0) * 0.7))
        CARD(img, fx - 22, fy - 22, fw + 44, fh + 44, 20, BROWN, a, shadow=150,
             dy=int((1 - r) * 34))
        im, pad = photo_panel("D01", fw, fh, 10, 0.0, 0.5, 0.42, shadow=0, border=False)
        put(img, im, (fx - pad, fy - pad + int((1 - r) * 34) + drift), a)
        T(img, "김수영 대표원장", W / 2, 1400, "xb", 84, OFFW, "m", "a",
          a * eo(p(t, 6.4, 0.5)), shadow=190, blur=18)
        T(img, "성형외과 전문의", W / 2, 1512, "m", 50, ROSE_T, "m", "a",
          a * eo(p(t, 6.7, 0.5)), shadow=150, blur=12)

    # b3: 상담 관점
    a, r = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        pw, ph = 420, 632
        im, pad = photo_panel("D01", pw, ph, 18, 0.0, 0.5, 0.42)
        put(img, im, (SAFE - pad, 560 - pad), a)
        CARD(img, 530, 560, W - SAFE - 530, ph, 28, CREAM, a, dy=int((1 - r) * 34))
        TL(img, ["얼굴의 상태와", "원하는 변화를", "함께 살피는", "리프팅 상담"],
           530 + 44, 640 + int((1 - r) * 34), "b", 54, INK, 84, "l", a,
           maxw=W - SAFE - 530 - 88, stagger=0.14, t=t, t0=14.2)
        rule(img, 530 + 44, 1050 + int((1 - r) * 34), 80, 5, ROSE, a)
        T(img, CLINIC, 530 + 44, 1100 + int((1 - r) * 34), "m", 44, CHAR, "l", "a",
          a * eo(p(t, 14.9, 0.5)))

    a, _ = vis(t, 22.0, 26.0, 0.5, 0.4)
    if a > 0:
        im, pad = photo_panel("D01", 320, 481, 18, 0.0, 0.5, 0.42)
        put(img, im, (W / 2 - 160 - pad, 470 - pad), a)
    recap_block(img, t, "김수영 대표원장", CLINIC, 22.0, 26.0, 1050, 88)

    floor_block(img, t, 26.0, "리프팅 상담은 리브성형외과", 1020)
    return img


def m08(t):
    """3:30-4:00 선택의 시작은 상담 - 카드 3장"""
    img = kb(photo_plate("I04", blur=22, dim=0.48), p(t, 0, 30), 1.0, 1.18, 0.43, 0.56, 0.57, 0.44)
    title_block(img, t, ["내게 필요한", "리프팅은?"], 92, 300, t1=5.7)

    a, r = vis(t, 2.4, 5.7, 0.6, 0.4)
    if a > 0:
        im, pad = photo_panel("D01", 300, 451, 18, 0.0, 0.5, 0.42)
        put(img, im, (W - SAFE - 300 - pad, 1060 - pad + int((1 - r) * 30)), a)
        T(img, "김수영 대표원장", W - SAFE, 1560, "m", 36, OFFW, "r", "a",
          a * eo(p(t, 2.8, 0.5)), shadow=150, blur=10)

    rows = [("피부 상태", "지금 상태를 함께 확인합니다"),
            ("고민 부위", "신경 쓰이는 곳을 알려주세요"),
            ("이전 시술", "이전에 받은 시술을 알려주세요")]
    a, r = vis(t, 6.0, 21.9, 0.6, 0.45)
    if a > 0:
        spread = eo(p(t, 6.2, 0.9))
        hl = -1
        if t >= 14.0:
            hl = min(2, int((t - 14.0) / 2.7))
        cw, ch = W - 2 * SAFE, 258
        base_y = 620
        for i, (head, sub) in enumerate(rows):
            y = base_y + (i * 300) * spread + (1 - spread) * i * 14
            fill = ROSE if i == hl else CREAM
            tcol = WHITE if i == hl else INK
            scol = (255, 255, 255, 225) if i == hl else CHAR
            ai = a * eo(p(t, 6.0 + i * 0.1, 0.5))
            CARD(img, SAFE, y, cw, ch, 26, fill, ai)
            T(img, "0%d" % (i + 1), SAFE + 44, y + 60, "b", 44,
              (WHITE if i == hl else ROSE), "l", "a", ai)
            T(img, head, SAFE + 44, y + 118, "b", 64, tcol, "l", "a", ai, maxw=cw - 88)
            T(img, sub, SAFE + 44, y + 198, "m", 36, scol, "l", "a", ai, maxw=cw - 88)

    a, _ = vis(t, 22.0, 26.0, 0.5, 0.4)
    if a > 0:
        T(img, FOUR, W / 2, 1300, "m", 42, ROSE_T, "m", "a",
          a * eo(p(t, 22.4, 0.5)), shadow=150, blur=12, maxw=W - 2 * SAFE)
    recap_block(img, t, "리프팅 상담", CLINIC, 22.0, 26.0, 960, 104)

    floor_block(img, t, 26.0, "상담은 리브성형외과에서", 1020)
    return img


def m09(t):
    """4:00-4:30 가상의 문, 실제 공간"""
    img = bg_scene("G08b", t, cut=6.0, dim=0.44, blur=24, sway=-1)
    title_block(img, t, ["문 너머, 실제 LIV"], 92, 300, t1=5.7)

    # b2: 문 안쪽에서 실제 로비로 마스크 전환
    if 5.9 <= t < 14.0:
        lob = kb(photo_plate("I01", cx=0.44, cy=0.54), p(t, 6.0, 8.0), 1.02, 1.20)
        reveal(img, lob, (370, 500, 790, 1430), eo(p(t, 6.0, 1.1)), radius=18)
        a, r = vis(t, 7.4, 13.9, 0.55, 0.4)
        if a > 0:
            softplate(img, W / 2, 1330, 920, 340, a * 0.92)
            T(img, "실제 리브성형외과", W / 2, 1220 + int((1 - r) * 26), "xb", 92, OFFW, "m", "a",
              a, shadow=190, blur=20, maxw=W - 2 * SAFE)
            rule(img, W / 2 - 70, 1360, 140, 5, ROSE, a)
            T(img, "이 건물 4층", W / 2, 1408, "m", 54, ROSE_T, "m", "a",
              a * eo(p(t, 7.8, 0.5)), shadow=160, blur=12)

    # b3: 실제 공간 사진 패널 3장
    panels = [("I07", "로비"), ("I03", "접수대"), ("I05", "대기 공간")]
    a, _ = vis(t, 14.0, 21.9, 0.6, 0.45)
    if a > 0:
        for i, (key, cap) in enumerate(panels):
            y = 470 + i * 412
            ai = a * eo(p(t, 14.0 + i * 0.5, 0.55))
            dx = int((1 - eo(p(t, 14.0 + i * 0.5, 0.7))) * (60 if i % 2 == 0 else -60))
            im, pad = photo_panel(key, W - 2 * SAFE, 372, 24, 0.04, 0.5, 0.5)
            put(img, im, (SAFE - pad + dx, y - pad), ai)
            pw = int(twidth(cap, "b", 38) + 52)
            CARD(img, SAFE + 22 + dx, y + 22, pw, 60, 30, ROSE, ai, shadow=0)
            T(img, cap, SAFE + 22 + dx + pw / 2, y + 52, "b", 38, WHITE, "m", "c", ai)

    # b4
    if t >= 21.6:
        lob = kb(photo_plate("I01", cx=0.5, cy=0.5), p(t, 21.6, 8.4), 1.0, 1.18)
        a = eo(p(t, 21.8, 0.6))
        img = Image.blend(img, lob, a)
    recap_block(img, t, "문 너머, 실제 LIV", CLINIC, 22.2, 26.0, 1000, 92)

    floor_block(img, t, 26.0, "리프팅 상담은 리브성형외과", 1020)
    return img


def m10(t):
    """4:30-5:00 장비명 다시 기억하기"""
    img = kb(photo_plate("I06", blur=24, dim=0.50), p(t, 0, 30), 1.0, 1.18, 0.57, 0.44, 0.43, 0.56)
    title_block(img, t, ["리프팅 상담, LIV"], 96, 320, x=W / 2, ha="m", t1=5.7)

    a, _ = vis(t, 3.0, 5.7, 0.5, 0.4)
    if a > 0:
        rule(img, W / 2 - 70, 486, 140, 5, ROSE, a)
        T(img, CLINIC, W / 2, 540, "m", 54, ROSE_T, "m", "a", a, shadow=150, blur=12)

    cw, ch = 456, 760
    pairs = [(6.0, 13.9, "울쎄라 · 써마지",
              [("E01", "울쎄라", "울쎄라피 프라임"), ("E02", "써마지", "FLX")]),
             (14.0, 21.9, "덴서티 · 악센트 프라임",
              [("E03", "덴서티", "고주파 기반 장비"), ("ACCENT", "악센트\n프라임", "")])]
    for t0, t1, head, items in pairs:
        a, r = vis(t, t0, t1, 0.6, 0.45)
        if a <= 0:
            continue
        T(img, head, W / 2, 470, "b", 62, OFFW, "m", "a",
          a * eo(p(t, t0 + 0.1, 0.5)), shadow=170, blur=14, maxw=W - 2 * SAFE)
        for i, (kind, lab, sub) in enumerate(items):
            im, pad = equip_card(kind, cw, ch, lab, sub)
            ai = a * eo(p(t, t0 + i * 0.14, 0.5))
            dy = int((1 - eo(p(t, t0 + i * 0.14, 0.62))) * 46)
            put(img, im, (SAFE + i * (cw + 24) - pad, 600 - pad + dy), ai)
        T(img, "리브성형외과 리프팅 상담", W / 2, 1436, "m", 46, ROSE_T, "m", "a",
          a * eo(p(t, t0 + 0.5, 0.6)), shadow=150, blur=12)

    # b4: 네 장비명 목록
    a, r = vis(t, 22.0, 26.0, 0.55, 0.4)
    if a > 0:
        names = ["울쎄라", "써마지", "덴서티", "악센트 프라임"]
        for i, n in enumerate(names):
            ai = a * eo(p(t, 22.0 + i * 0.12, 0.5))
            y = 700 + i * 118
            dot = Image.new("RGBA", (18, 18), (0, 0, 0, 0))
            ImageDraw.Draw(dot).ellipse([0, 0, 17, 17], fill=ROSE + (255,))
            put(img, dot, (SAFE + 8, y + 34), ai)
            T(img, n, SAFE + 54, y, "b", 76, OFFW, "l", "a", ai, shadow=180, blur=16)
        T(img, CLINIC, W - SAFE, 1240, "m", 52, ROSE_T, "r", "a",
          a * eo(p(t, 22.6, 0.5)), shadow=150, blur=12)

    floor_block(img, t, 26.0, "네 가지 리프팅 상담", 1020)
    return img


def m11(t):
    """5:00-5:30 상담 전 세 가지"""
    img = kb(photo_plate("I07", blur=24, dim=0.50), p(t, 0, 30), 1.0, 1.18, 0.43, 0.57, 0.57, 0.43)
    title_block(img, t, ["상담할 때", "알려주세요"], 96, 320, t1=5.7)

    rows = [("신경 쓰이는 부위", "어디가 가장 신경 쓰이는지"),
            ("이전에 받은 시술", "언제 어떤 시술을 받았는지"),
            ("원하는 변화", "어떤 모습을 원하는지")]
    starts = [6.0, 13.0, 17.5]
    cw, ch = W - 2 * SAFE, 250
    # 세 자리를 먼저 비워 둔 채 보여주고 내용이 하나씩 채워진다
    ao, _ = vis(t, 5.7, 21.9, 0.6, 0.45)
    if ao > 0:
        for i in range(3):
            put(img, card_outline(cw, ch, 26), (SAFE - 2, 600 + i * 290 - 2),
                ao * 0.85 * eo(p(t, 5.7 + i * 0.12, 0.5)))
    for i, ((head, sub), t0) in enumerate(zip(rows, starts)):
        a, r = vis(t, t0, 21.9, 0.6, 0.45)
        if a <= 0:
            continue
        y = 600 + i * 290
        CARD(img, SAFE, y, cw, ch, 26, CREAM, a, dy=int((1 - r) * 40))
        yy = y + int((1 - r) * 40)
        T(img, "0%d" % (i + 1), SAFE + 44, yy + 52, "b", 44, ROSE, "l", "a", a)
        T(img, head, SAFE + 44, yy + 110, "b", 64, INK, "l", "a", a, maxw=cw - 88)
        T(img, sub, SAFE + 44, yy + 190, "m", 36, CHAR, "l", "a",
          a * eo(p(t, t0 + 0.3, 0.5)), maxw=cw - 88)

    a, r = vis(t, 22.0, 26.0, 0.55, 0.4)
    if a > 0:
        im, pad = photo_panel("I04", W - 2 * SAFE, 560, 28, 0.06, 0.5, 0.5)
        put(img, im, (SAFE - pad, 520 - pad + int((1 - r) * 34)), a)
    recap_block(img, t, "리프팅 상담", CLINIC, 22.0, 26.0, 1200, 96)

    floor_block(img, t, 26.0, "편하게 말씀해 주세요", 1020)
    return img


@lru_cache(maxsize=4)
def qr_card():
    cw, ch = W - 2 * SAFE, 900
    base, pad = card(cw, ch, 36, CREAM, shadow=150)
    img = base.copy()
    cx = pad + cw / 2
    T(img, "상담 안내", cx, pad + 56, "b", 58, INK, "m")
    rule(img, cx - 40, pad + 140, 80, 5, ROSE)
    q = asset("qr")
    qs = 396
    qi = q.resize((qs, qs), Image.NEAREST).convert("RGBA")
    frame = Image.new("RGBA", (qs + 44, qs + 44), (255, 255, 255, 255))
    frame.alpha_composite(qi, (22, 22))
    img.alpha_composite(frame, (int(cx - (qs + 44) / 2), pad + 186))
    y = pad + 186 + qs + 44 + 34
    T(img, QR_TEXT, cx, y, "m", 38, CHAR, "m")
    T(img, PHONE, cx, y + 62, "b", 66, INK, "m")
    T(img, ADDRESS, cx, y + 150, "m", 36, CHAR, "m", maxw=cw - 80)
    return img, pad


def m12(t):
    """5:30-6:00 이 건물 4층 (6 / 6 / 6 / 12초)"""
    if t < 17.4:
        img = kb(photo_plate("I01", cx=0.5, cy=0.5), p(t, 0, 18), 1.0, 1.16, 0.44, 0.5, 0.56, 0.5)
        if t >= 5.6:
            dark = kb(photo_plate("I03", blur=20, dim=0.55), p(t, 6, 12), 1.0, 1.14,
                      0.56, 0.5, 0.44, 0.5)
            img = Image.blend(img, dark, eo(p(t, 5.8, 0.8)))
    else:
        # 마지막 12초: 배경만 아주 천천히 움직이고 QR 카드는 완전 고정
        img = kb(photo_plate("I03", blur=20, dim=0.62), p(t, 17.4, 12.6), 1.14, 1.24,
                 0.44, 0.5, 0.56, 0.5)

    # b1 병원명
    a, r = vis(t, 0.3, 5.8, 0.5, 0.45)
    if a > 0:
        softplate(img, W / 2, 960, 940, 480, a * 0.9)
        T(img, CLINIC, W / 2, 780 + int((1 - r) * 30), "xb", 116, OFFW, "m", "a", a,
          shadow=190, blur=20)
        logo = asset("logo_white").resize((330, 77), Image.LANCZOS)
        put(img, logo, (W / 2 - 165, 960), a * eo(p(t, 0.8, 0.6)))
        T(img, "리프팅 상담", W / 2, 1120, "m", 52, ROSE_T, "m", "a",
          a * eo(p(t, 1.0, 0.6)), shadow=150, blur=12)

    # b2 장비명
    a, r = vis(t, 6.0, 11.8, 0.55, 0.45)
    if a > 0:
        TL(img, ["울쎄라 · 써마지", "덴서티 · 악센트 프라임"], W / 2,
           760 + int((1 - r) * 26), "xb", 82, OFFW, 116, "m", a, shadow=190, blur=18,
           maxw=W - 2 * SAFE)
        T(img, "네 가지 리프팅 상담", W / 2, 1060, "m", 52, ROSE_T, "m", "a",
          a * eo(p(t, 6.4, 0.5)), shadow=150, blur=12)

    # b3 4층 안내
    a, r = vis(t, 12.0, 17.8, 0.55, 0.45)
    if a > 0:
        T(img, FLOOR, W / 2, 720 + int((1 - r) * 30), "xb", 150, OFFW, "m", "a", a,
          shadow=200, blur=22, maxw=W - 2 * SAFE)
        rule(img, W / 2 - 70, 940, 140, 5, ROSE, a)
        T(img, ADDRESS, W / 2, 990, "m", 44, ROSE_T, "m", "a",
          a * eo(p(t, 12.4, 0.5)), shadow=150, blur=12, maxw=W - 2 * SAFE)
        T(img, PHONE, W / 2, 1090, "b", 72, OFFW, "m", "a",
          a * eo(p(t, 12.7, 0.5)), shadow=170, blur=14)

    # b4 QR 고정 (18.0 ~ 30.0)
    a = eo(p(t, 18.0, 0.5))
    if a > 0:
        T(img, "리브성형외과 리프팅 상담", W / 2, 452, "m", 50, ROSE_T, "m", "a", a,
          shadow=160, blur=12)
        im, pad = qr_card()
        put(img, im, (SAFE - pad, 560 - pad), min(1.0, a))
    return img


SCENES = [
    dict(id="M01", fn=m01), dict(id="M02", fn=m02), dict(id="M03", fn=m03),
    dict(id="M04", fn=m04), dict(id="M05", fn=m05), dict(id="M06", fn=m06),
    dict(id="M07", fn=m07), dict(id="M08", fn=m08), dict(id="M09", fn=m09),
    dict(id="M10", fn=m10), dict(id="M11", fn=m11), dict(id="M12", fn=m12),
]


# ---------------------------------------------------------------- frame assembly
def render_scene(si, i):
    t = (i - si * SCENE_FRAMES) / float(FPS)
    return SCENES[si]["fn"](t)


def render_frame(i):
    si = max(0, min(N_SCENES - 1, i // SCENE_FRAMES))
    img = render_scene(si, i)
    half = XF_FRAMES // 2
    b = si * SCENE_FRAMES
    if si > 0 and (i - b) < half:
        w = eio((i - (b - half)) / float(XF_FRAMES))
        img = Image.blend(render_scene(si - 1, i), img, w)
    b2 = (si + 1) * SCENE_FRAMES
    if si < N_SCENES - 1 and (b2 - i) <= half:
        w = eio((i - (b2 - half)) / float(XF_FRAMES))
        img = Image.blend(img, render_scene(si + 1, i), w)
    draw_chrome(img)
    return img


# ---------------------------------------------------------------- CLI
def encode_range(first, last, out_path, crf=12, preset="medium", quiet=False):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-g", "30", "-keyint_min", "30",
           "-x264-params", "scenecut=0:open_gop=0", "-fps_mode", "cfr", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = last - first
    for k, i in enumerate(range(first, last)):
        proc.stdin.write(render_frame(i).tobytes())
        if not quiet and k % 60 == 0:
            print("  %s %d/%d" % (os.path.basename(out_path), k, n), flush=True)
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise SystemExit("ffmpeg failed rc=%d" % rc)
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", type=int, help="1-12")
    ap.add_argument("--stills", type=str, help="쉼표로 구분한 초 단위 시간")
    ap.add_argument("--out", type=str, default=None)
    ap.add_argument("--crf", type=int, default=12)
    args = ap.parse_args()

    os.makedirs(SCENEDIR, exist_ok=True)

    if args.stills:
        outdir = args.out or os.path.join(EDIT, "stills")
        os.makedirs(outdir, exist_ok=True)
        for s in args.stills.split(","):
            sec = float(s)
            i = int(round(sec * FPS))
            i = max(0, min(NFRAMES - 1, i))
            fp = os.path.join(outdir, "t%07.2f.png" % sec)
            render_frame(i).save(fp)
            print("still", fp)
        return

    if args.scene:
        si = args.scene - 1
        out = args.out or os.path.join(SCENEDIR, "%s.mp4" % SCENES[si]["id"])
        encode_range(si * SCENE_FRAMES, (si + 1) * SCENE_FRAMES, out, args.crf)
        print("done", out)
        return

    ap.error("--scene 또는 --stills 중 하나가 필요합니다")


if __name__ == "__main__":
    main()
