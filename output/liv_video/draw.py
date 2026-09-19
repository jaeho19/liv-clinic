# -*- coding: utf-8 -*-
"""폰트·조판·카드 등 그리기 원시 요소. 경로는 spec.dirs() 에서 가져온다."""
import os
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from . import spec
from .anim import eo, p
from .spec import FONTS, OFFW, ROSE, CREAM


# ---------------------------------------------------------------- primitives
@lru_cache(maxsize=96)
def font(key, size):
    fontdir = spec.dirs()[0]
    return ImageFont.truetype(os.path.join(fontdir, FONTS[key]), int(size))


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


# ---------------------------------------------------------------- 소프트 플레이트
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
