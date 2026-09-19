# -*- coding: utf-8 -*-
"""얼굴 선화와 부위 하이라이트.

사진 대신 선화를 쓴다. 특정 인물의 얼굴이 아니고, 부위를 가리키는 도해다.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, OFFW

REGIONS = ("cheek", "midface", "jawline", "submental", "texture")
REGION_LABEL = {"cheek": "볼", "midface": "중안부", "jawline": "턱선",
                "submental": "이중턱", "texture": "피부결"}

# 얼굴 윤곽 제어점 (얼굴 사각형 w,h에 대한 0~1 비율).
# draw_face의 선화와 _face_mask의 내부 채움이 반드시 같은 모양을 쓰도록
# 여기 한 곳에서만 정의한다 (호: 180'->360', 두 폴리라인은 뺨에서 턱끝으로).
_ARC_BOX = (0.10, 0.04, 0.90, 0.86)
_LEFT = [(0.10, 0.45), (0.14, 0.66), (0.30, 0.86), (0.50, 0.94)]
_RIGHT = [(0.90, 0.45), (0.86, 0.66), (0.70, 0.86), (0.50, 0.94)]

# 얼굴 사각형 안의 상대 좌표 (x0, y0, x1, y1), 0~1.
# 눈썹 y=0.42, 코 y=0.46~0.60, 입 y=0.68, 턱끝 y=0.94 (draw_face 기준) 뿐 아니라
# _face_mask로 잰 "실제 윤곽 안쪽 담김 비율"까지 맞춰 정했다 — fix round 1 리뷰에서
# 사각형이 윤곽 밖 빈 배경을 크게 침범한다는 지적(특히 jawline 18~75%, cheek 13~36px)을
# 받고 좌표를 다시 잡았다. 실측치·근거는 test_face_diagram.py의
# _MIN_INSIDE_RATIO 주석과 task-5-report.md 표 참조.
_REL = {
    "cheek":     (0.135, 0.46, 0.42, 0.62),
    "midface":   (0.20, 0.40, 0.80, 0.62),
    "jawline":   (0.22, 0.70, 0.78, 0.87),
    "submental": (0.32, 0.78, 0.68, 0.94),
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


def _face_mask(w, h):
    """draw_face가 그리는 얼굴 윤곽 내부를 채운 흑백 마스크 (255=안쪽, 0=바깥).
    _ARC_BOX/_LEFT/_RIGHT를 draw_face와 공유하므로 항상 같은 모양이 나온다.
    region_rect가 실제로 윤곽 안에 담기는지 재는 용도 (테스트 전용, 비공개)."""
    cx = 0.5
    cy = (_ARC_BOX[1] + _ARC_BOX[3]) / 2.0
    a = (_ARC_BOX[2] - _ARC_BOX[0]) / 2.0
    b = (_ARC_BOX[3] - _ARC_BOX[1]) / 2.0
    pts = []
    for i in range(65):  # 180'->360' 호를 64등분한 점으로 근사
        rad = math.radians(180 + 180 * i / 64.0)
        pts.append((cx + a * math.cos(rad), cy + b * math.sin(rad)))
    pts += _RIGHT[1:]                  # 오른쪽 뺨 -> 턱끝 (호의 끝점과 중복 제거)
    pts += list(reversed(_LEFT))[1:]   # 턱끝 -> 왼쪽 뺨 (첫 점에서 폐곡선이 닫힘)
    poly = [(x * w, y * h) for x, y in pts]
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return m


def draw_face(base, box, alpha=1.0, color=None):
    """정면 얼굴 윤곽 선화."""
    if alpha <= 0.004:
        return
    color = color or LINE
    fx0, fy0, fx1, fy1 = face_box_for(box)
    w, h = fx1 - fx0, fy1 - fy0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = tuple(color) + (255,)
    # 2.5~3m 사이니지 가독성 기준 최소 8px(1080px 패널에서 약 4.8mm)가 목표다.
    # 바닥값을 6으로 낮춰 실사용 폭 w=600에서 비율 항(w/75=8.0)이 바닥값(6)보다
    # 커지게 했다 — 즉 실제 크기에서 값을 정하는 건 바닥값이 아니라 비율 항이고,
    # 더 큰 박스를 쓰면 그만큼 비례해서 굵어진다.
    # (이전 max(3, int(w*0.006))의 결함은 "w>=1333 필요"가 아니라: w=600에서
    # 비율 항이 int(3.6)=3으로 자기 바닥값(3)과 정확히 같았다는 것이다 — 그 항이
    # 자기 바닥값을 넘으려면 w>=667이 필요한데 실사용 폭은 항상 600이라 못 미쳐,
    # 사실상 상수 3px로 고정돼 있었다. fix round 1에서 상수만 8로 키웠을 때도
    # 바닥/비율이 여전히 8로 동률이라 같은 결함이 남아 있었다 — round 2에서 바닥을
    # 6으로 낮춰서야 실제로 해소됐다.)
    lw = max(6, round(w / 75.0))

    # 얼굴 윤곽: 위는 타원, 아래는 턱으로 모이는 곡선
    d.arc([w * _ARC_BOX[0], h * _ARC_BOX[1], w * _ARC_BOX[2], h * _ARC_BOX[3]],
          180, 360, fill=col, width=lw)
    left = [(w * x, h * y) for x, y in _LEFT]
    right = [(w * x, h * y) for x, y in _RIGHT]
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
