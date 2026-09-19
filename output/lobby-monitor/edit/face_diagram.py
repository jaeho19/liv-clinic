# -*- coding: utf-8 -*-
"""얼굴 선화와 부위 하이라이트.

사진 대신 선화를 쓴다. 특정 인물의 얼굴이 아니고, 부위를 가리키는 도해다.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, OFFW

REGIONS = ("cheek", "midface", "jawline", "submental", "texture")
REGION_LABEL = {"cheek": "볼", "midface": "중안부", "jawline": "턱선",
                "submental": "이중턱", "texture": "피부결"}

# 얼굴 사각형 안의 상대 좌표 (x0, y0, x1, y1), 0~1
# 눈썹 y=0.42, 코 y=0.46~0.60, 입 y=0.68, 턱끝 y=0.94 (draw_face 기준)에 맞춰
# 부위별 밴드가 서로 겹치는 이목구비를 가리지 않도록 배치했다.
_REL = {
    "cheek":     (0.08, 0.46, 0.42, 0.66),
    "midface":   (0.20, 0.40, 0.80, 0.62),
    "jawline":   (0.10, 0.70, 0.90, 0.90),
    "submental": (0.30, 0.78, 0.70, 0.95),
    "texture":   (0.20, 0.18, 0.80, 0.42),
}
LINE = (226, 214, 206)


def face_box_for(box):
    """box 안에 3:4 비율로 최대 크기 얼굴 사각형을 중앙 배치."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    fh = min(h, w / 0.75)
    fw = fh * 0.75
    cx, cy = x0 + w / 2.0, y0 + h / 2.0
    return (int(cx - fw / 2), int(cy - fh / 2), int(cx + fw / 2), int(cy + fh / 2))


def region_rect(box, region):
    fx0, fy0, fx1, fy1 = face_box_for(box)
    fw, fh = fx1 - fx0, fy1 - fy0
    rx0, ry0, rx1, ry1 = _REL[region]
    return (int(fx0 + rx0 * fw), int(fy0 + ry0 * fh),
            int(fx0 + rx1 * fw), int(fy0 + ry1 * fh))


def draw_face(base, box, alpha=1.0, color=None):
    """정면 얼굴 윤곽 선화."""
    if alpha <= 0.004:
        return
    color = color or LINE
    fx0, fy0, fx1, fy1 = face_box_for(box)
    w, h = fx1 - fx0, fy1 - fy0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = tuple(color) + (200,)
    lw = max(3, int(w * 0.006))

    # 얼굴 윤곽: 위는 타원, 아래는 턱으로 모이는 곡선
    d.arc([w * 0.10, h * 0.04, w * 0.90, h * 0.86], 180, 360, fill=col, width=lw)
    left = [(w * 0.10, h * 0.45), (w * 0.14, h * 0.66), (w * 0.30, h * 0.86),
            (w * 0.50, h * 0.94)]
    right = [(w * 0.90, h * 0.45), (w * 0.86, h * 0.66), (w * 0.70, h * 0.86),
             (w * 0.50, h * 0.94)]
    d.line(left, fill=col, width=lw, joint="curve")
    d.line(right, fill=col, width=lw, joint="curve")
    # 눈·코·입을 최소한의 선으로
    d.line([(w * 0.28, h * 0.42), (w * 0.40, h * 0.42)], fill=col, width=lw)
    d.line([(w * 0.60, h * 0.42), (w * 0.72, h * 0.42)], fill=col, width=lw)
    d.line([(w * 0.50, h * 0.46), (w * 0.50, h * 0.60)], fill=col, width=lw)
    d.line([(w * 0.42, h * 0.68), (w * 0.58, h * 0.68)], fill=col, width=lw)

    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (fx0, fy0), lay)


def highlight(base, box, region, alpha=1.0, color=None):
    """해당 부위를 부드럽게 밝힌다. 영역 밖으로 번지지 않도록 사각형 안에서만 합성한다."""
    if alpha <= 0.004:
        return
    color = color or ROSE
    rx0, ry0, rx1, ry1 = region_rect(box, region)
    w, h = rx1 - rx0, ry1 - ry0
    if w < 4 or h < 4:
        return
    pad = 0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([2, 2, w - 3, h - 3], radius=min(w, h) // 3,
                        fill=tuple(color) + (70,), outline=tuple(color) + (220,), width=4)
    lay = lay.filter(ImageFilter.GaussianBlur(3))
    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (rx0, ry0), lay)
