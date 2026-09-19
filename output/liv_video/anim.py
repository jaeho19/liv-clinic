# -*- coding: utf-8 -*-
"""이징 곡선과 사각형에서 화면 전체로 번지는 공개(reveal)."""
from PIL import Image

from .spec import W, H


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


def reveal(base, top_img, rect, prog, radius=0):
    """rect(사각형)에서 시작해 전체 화면으로 확장하며 top_img를 드러낸다."""
    from .draw import rrect_mask      # draw 가 anim 을 쓰므로 순환을 피해 호출 시 가져온다
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
