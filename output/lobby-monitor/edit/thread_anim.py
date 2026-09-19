# -*- coding: utf-8 -*-
"""압토스 실 메커니즘 개념도.

실제 시술 영상이 아니라 원리를 설명하는 도해다. 화면에 "개념도"를 함께 표기한다.
좌표는 모두 box=(x0,y0,x1,y1) 안의 상대 위치로 계산한다.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, OFFW, CHAR
from liv_video.draw import put, T

STAGES = ("insert", "engage", "fix")

THREAD_COLOR = (232, 228, 224)
BARB_COLOR = (250, 248, 246)
TISSUE_COLOR = (150, 116, 102)
TISSUE_LINE = (196, 166, 152)
MAX_PULL_PX = 70.0          # 조직 마커가 끌려가는 최대 거리


def thread_points(box, samples=240, shift=0.0):
    """실 중심선. 완만한 사인 곡선이며 shift 만큼 좌우로 민다."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    cy = y0 + h * 0.5
    amp = h * 0.10
    dx = shift * w * 0.045
    pts = []
    for i in range(samples):
        u = i / (samples - 1.0)
        x = x0 + u * w + dx
        y = cy + math.sin(u * math.pi * 1.6 - 0.4) * amp
        pts.append((min(max(x, x0), x1), min(max(y, y0), y1)))
    return pts


def barb_positions(box, n=14):
    """돌기 기준점. 실 곡선 위 균등 분포."""
    pts = thread_points(box, samples=n * 12)
    step = len(pts) // (n + 1)
    return [pts[step * (i + 1)] for i in range(n)]


def tissue_shift(stage, prog):
    """조직이 끌려간 정도 0.0~1.0. insert 에서는 0, engage 에서 상승, fix 에서 유지."""
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    if stage == "insert":
        return 0.0
    if stage == "engage":
        return 0.72 * (prog * prog * (3.0 - 2.0 * prog))
    return 0.72 + 0.28 * (prog * prog * (3.0 - 2.0 * prog))


def _tissue_layer(box, pull):
    """조직을 나타내는 가로 결. pull(px) 만큼 오른쪽으로 당겨진 형태.

    각 결을 ``pull * weight`` 만큼 오른쪽으로 평행 이동한다: 왼쪽은 원래
    있던 자리가 비고, 오른쪽은 상자 경계에서 잘린다. 원래는 대칭 종형
    곡선으로 결 가운데만 국소적으로 부풀렸으나, 그 방식은 양 끝(u=0, u=1)이
    항상 x=0/x=w 에 고정돼 있어 결 하나가 덮는 x 범위 자체가 pull 과 무관하게
    항상 [0, w] 그대로였다 — 실측 결과 결 하나의 무게중심이 pull 을 0에서
    최댓값까지 올려도 0.1px 이하로만 움직여 사실상 무효였다(원인 분석은
    task-3-report.md). 그래서 범위 자체를 옮기는 평행 이동으로 바꿨다.
    """
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rows = 9
    for r in range(rows):
        fy = (r + 0.5) / rows
        y = fy * h
        # 중앙에 가까운 결일수록 더 많이 끌려간다(가장자리 결도 절반가량은
        # 함께 끌려가야 "덩어리째 당겨진다"는 인상을 준다 — 0.045 로 너무
        # 좁히면 중앙 2~3줄만 움직이고 나머지는 그대로라 눈으로 확인하기
        # 어려웠다)
        weight = math.exp(-((fy - 0.5) ** 2) / 0.09)
        shift = pull * weight
        pts = []
        for i in range(41):
            u = i / 40.0
            x = min(u * w + shift, w)
            pts.append((x, y + math.sin(u * 4.2) * 3.0))
        d.line(pts, fill=TISSUE_LINE + (90,), width=3, joint="curve")
    return lay


def draw_mechanism(base, box, stage, prog, alpha=1.0, show_tissue=True):
    """box 영역에 실-조직 개념도를 그린다."""
    if alpha <= 0.004:
        return
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    pull = MAX_PULL_PX * tissue_shift(stage, prog)

    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if show_tissue:
        lay.alpha_composite(_tissue_layer(box, pull))

    d = ImageDraw.Draw(lay)
    # 삽입 단계에서는 실이 왼쪽에서 들어온다
    visible = prog if stage == "insert" else 1.0
    pts = [(x - x0, y - y0) for x, y in thread_points(box, shift=0.0)]
    cut = max(2, int(len(pts) * visible))
    d.line(pts[:cut], fill=THREAD_COLOR + (255,), width=9, joint="curve")

    # 돌기: engage 부터 세워진다
    lift = 0.0 if stage == "insert" else (prog if stage == "engage" else 1.0)
    for i, (bx, by) in enumerate(barb_positions(box, n=14)):
        if (i + 1) / 14.0 > visible:
            continue
        lx, ly = bx - x0, by - y0
        length = 16 + 22 * lift
        # lift=0: 실을 따라 뒤로 접혀 거의 안 보임(178° ~ 실과 평행).
        # lift=1: 조직 쪽으로 거의 수직으로 서서 건다(110°). 150->168 처럼
        # 두 각이 모두 180°에 가까우면 코사인이 계속 음수로 커져 끝점이
        # 왼쪽으로 더 뻗는다(무게중심 실측 참고) — 접힘/기립 대비가 뚜렷하도록
        # 범위를 바꿨다.
        ang = math.radians(178 - 68 * lift)
        tipx = lx + math.cos(ang) * length
        tipy = ly + math.sin(ang) * length
        d.polygon([(lx, ly - 4), (lx + 13, ly + 2), (tipx, tipy)],
                  fill=BARB_COLOR + (int(210 + 45 * lift),))

    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (x0, y0), lay)


def draw_note(base, x, y, alpha=1.0):
    """실촬영으로 오인되지 않도록 구석에 표기."""
    T(base, "개념도", x, y, "m", 30, CHAR, "r", "a", alpha, shadow=120, blur=8)
