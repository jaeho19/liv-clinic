# -*- coding: utf-8 -*-
"""NAMICA 캡슐화 히알루론산의 단계별 방출 개념도.

큰 입자(마이크로)가 먼저, 서브마이크로가 다음, 나노가 마지막에 퍼진다.
효과나 기간을 주장하지 않고 '방출 순서'라는 구조만 보여준다.
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, CREAM

# (이름, 반지름 px, 방출 시작 비율)
SIZES = (("micro", 26, 0.00), ("submicro", 14, 0.34), ("nano", 7, 0.64))
PER_CLASS = (16, 34, 70)            # 클래스별 최대 입자 수
CLASS_COLOR = {"micro": (226, 198, 186), "submicro": (214, 180, 166),
               "nano": (198, 160, 146)}


def active_counts(t, dur):
    """t 시점에 표시 중인 크기별 입자 수."""
    out = {}
    for (name, _r, start), total in zip(SIZES, PER_CLASS):
        span = max(1e-6, (1.0 - start) * 0.82)
        u = (t / max(dur, 1e-6) - start) / span
        u = 0.0 if u < 0 else (1.0 if u > 1 else u)
        out[name] = int(round(total * (u * u * (3.0 - 2.0 * u))))
    return out


def _layout(box, seed):
    """클래스별 입자 위치를 결정론적으로 생성."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    rng = random.Random(seed)
    plan = {}
    for (name, r, _s), total in zip(SIZES, PER_CLASS):
        pts = []
        for i in range(total):
            ang = rng.uniform(0, math.tau)
            rad = math.sqrt(rng.random())
            pts.append((w * 0.5 + math.cos(ang) * rad * (w * 0.5 - r - 4),
                        h * 0.5 + math.sin(ang) * rad * (h * 0.5 - r - 4)))
        plan[name] = pts
    return plan


def draw_release(base, box, t, dur=35.0, alpha=1.0, seed=7):
    """box 영역에 단계별 방출을 그리고 표시된 입자 수를 반환한다."""
    counts = active_counts(t, dur)
    if alpha <= 0.004:
        return counts
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    plan = _layout(box, seed)
    for name, r, start in SIZES:
        col = CLASS_COLOR[name]
        n = counts[name]
        for i, (px, py) in enumerate(plan[name][:n]):
            # 나중에 나타난 입자일수록 살짝 작게 시작해 커진다
            grow = min(1.0, 0.45 + 0.55 * ((t / dur) - start) * 3.0)
            grow = max(0.35, grow)
            rr = r * grow
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=col + (150,))
            d.ellipse([px - rr * 0.45, py - rr * 0.45, px + rr * 0.1, py + rr * 0.1],
                      fill=(255, 255, 255, 90))
    lay = lay.filter(ImageFilter.GaussianBlur(0.6))
    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (x0, y0), lay)
    return counts
