# -*- coding: utf-8 -*-
"""사진·생성 클립 에셋과 배경 플레이트. 경로는 spec.dirs() 에서 가져온다."""
import os
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

from . import spec
from .anim import clamp01
from .draw import put, rrect_mask
from .spec import W, H


# ---------------------------------------------------------------- assets
_A = {}
_PNG = {"E01", "E02", "E03", "logo_white", "logo_ink", "qr"}


def asset(key):
    if key not in _A:
        ext = ".png" if key in _PNG else ".jpg"
        prep = spec.dirs()[1]
        im = Image.open(os.path.join(prep, key + ext))
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
    gen = spec.dirs()[2]
    return Image.open(os.path.join(gen, "frames", key, "%04d.jpg" % idx)).convert("RGB")


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


# ---------------------------------------------------------------- 비네트
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
