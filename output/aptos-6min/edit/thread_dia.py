# -*- coding: utf-8 -*-
"""압토스 실 메커니즘 개념도 — 다시 그린 것.

이전 `thread_anim.py` 는 가로줄 9개 위에 흰 곡선 하나를 얹은 그림이었다.
스틸로 보면 의료 도해가 아니라 그래프로 읽힌다. 내용(삽입·걸림·고정 3단계)은
검토가 끝난 것이므로 그대로 두고, **그리는 방식만** 바꾼다:

1. **배율을 올린다** — 이전 도해가 투박했던 진짜 이유다. 1080 폭에 돌기 14개를
   넣으면 돌기 하나가 46px 짜리 잔털이 된다. 여기서는 돌기 7개, 길이 120px 로
   확대한 단면을 그린다. 무엇이 일어나는지 화면에서 보여야 도해다.
2. **조직을 섬유망으로 그린다** — 균일한 가로줄이 아니라 길이·각도·밝기가
   제각각인 결 다발이다. 돌기 끝 근처에서만 국소적으로 끌려 모인다.
3. **돌기를 세운다** — 실제 압토스 실처럼 좌우로 방향이 갈리는
   (multi-directional) 원뿔형. 삽입 때는 몸통에 누워 있고 걸릴 때 선다.
4. **2배 수퍼샘플링** — PIL 선에는 안티에일리어싱이 없다. 2배로 그린 뒤 줄인다.
   '정밀해 보인다'의 나머지 절반이 여기서 나온다.

의료 사실관계는 설계서 §4 를 따른다. 이 모듈에는 효과·기간을 말하는 문자열을
두지 않는다(문구는 전부 장면 쪽에서 `copy_guard` 검사를 받는다).
"""
import math
import random
from functools import lru_cache

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from look import ROSE, ROSE_D, NOIR_2

SS = 2                          # 수퍼샘플링 배수
STAGES = ("insert", "engage", "fix")
NBARB = 7                       # 화면에 보이는 돌기 수 — 적고 크게
BARB_LEN = 118.0                # 돌기 길이(실좌표 px)
BODY = 22.0                     # 실 몸통 두께(실좌표 px)

FIBER = (150, 124, 112)
FIBER_HI = (206, 182, 170)
THREAD = (238, 233, 228)
THREAD_HI = (255, 255, 255)
THREAD_LO = (146, 134, 126)
BARB_C = (250, 246, 242)


def _smooth(x):
    x = 0.0 if x < 0 else (1.0 if x > 1 else x)
    return x * x * (3.0 - 2.0 * x)


def open_amount(stage, prog):
    """돌기가 선 정도 0~1. insert 0 → engage 상승 → fix 유지."""
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    if stage == "insert":
        return 0.0
    if stage == "engage":
        return _smooth(prog)
    return 1.0


def hold_amount(stage, prog):
    """조직이 걸려 이동한 정도 0~1."""
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    if stage == "insert":
        return 0.0
    if stage == "engage":
        return 0.80 * _smooth(prog)
    return 0.80 + 0.20 * _smooth(prog)


def insert_reach(prog):
    """삽입 단계에서 실 끝이 도달한 비율 0~1."""
    return _smooth(prog)


# ---------------------------------------------------------------- 기하
def _cy(box):
    return (box[1] + box[3]) * 0.5


def thread_y(box, u):
    """실 중심선의 y. 아주 완만한 호 — 얼굴 곡면을 따라간다는 뜻이다."""
    return _cy(box) + math.sin(u * math.pi) * -(box[3] - box[1]) * 0.055


def barb_us():
    """돌기의 실 위 위치(u). 가운데를 비우고 좌우로 방향이 갈린다."""
    return [0.5 + (i - (NBARB - 1) / 2.0) * (0.72 / (NBARB - 1))
            for i in range(NBARB)]


def _barb_angle(u, openv, up):
    """누운 각(몸통과 나란) → 선 각. u<0.5 는 왼쪽을, u>0.5 는 오른쪽을 향한다."""
    # 누운 각을 몸통과 완전히 나란하게(172/8) 두면 돌기가 몸통 뒤로 숨어
    # 삽입 단계 3초 동안 실이 민민한 선으로 보인다. 실제 실에도 돌기는 늘
    # 달려 있으므로 접힌 우산처럼 **뒤로 누운 채 보이게** 둔다.
    lay = math.radians(154.0 if u < 0.5 else 26.0)
    stand = math.radians(126.0 if u < 0.5 else 54.0)
    a = lay + (stand - lay) * openv
    return a if up else -a


def barb_tip(box, k, openv=1.0, scale=1.0):
    """k번째 돌기 끝의 실좌표 — 지시선을 걸 자리."""
    us = barb_us()
    u = us[k % NBARB]
    bx = box[0] + u * (box[2] - box[0])
    by = thread_y(box, u)
    ang = _barb_angle(u, openv, k % 2 == 0)
    return (bx + math.cos(ang) * BARB_LEN * scale,
            by - math.sin(ang) * BARB_LEN * scale)


# ---------------------------------------------------------------- 조직
BAND = 520.0                    # 조직 띠의 높이(실좌표 px). 위아래는 먹으로 녹는다


@lru_cache(maxsize=8)
def _fiber_field(seed, w, h, rows=30):
    """조직 결의 원본 좌표(**수퍼샘플 좌표계**). 시드가 같으면 같은 배치다.

    프레임마다 다시 뽑으면 결이 매 프레임 새로 태어나 화면이 지글거린다.
    배치는 고정하고 `_fibers` 가 끌림만 매 프레임 다시 계산한다.

    결은 **층으로 눕힌다**. 각도를 넓게 흩으면 지푸라기 더미가 되고 조직으로
    안 읽힌다(첫 시도에서 실제로 그랬다). 각도는 ±6도 안에 두고 길이·밝기·
    굵기만 흩어서 결 다발처럼 보이게 한다. 길이는 전부 SS 배다 — 실좌표 값을
    그대로 쓰면 최종 축소 뒤 절반이 돼 잔털이 된다.
    """
    rng = random.Random(seed)
    cy = h * 0.5
    band = BAND * SS
    out = []
    for r in range(rows):
        fy = (r + 0.5) / rows * 2.0 - 1.0                # -1 ~ 1
        y0 = cy + fy * band * 0.5
        per = 5 if abs(fy) < 0.55 else 3
        for _ in range(per):
            y = y0 + rng.uniform(-band / rows * 0.5, band / rows * 0.5)
            x = rng.uniform(-140 * SS, w + 140 * SS)
            ln = rng.uniform(210, 560) * SS
            ang = math.radians(rng.uniform(-6, 6))
            bow = rng.uniform(-10, 10) * SS
            out.append((x, y, ln, ang, bow, abs(fy), rng.random()))
    return tuple(out)


@lru_cache(maxsize=4)
def _band_mask(w, h):
    """조직 띠의 위아래를 녹이는 세로 페더. 상자 경계가 직선으로 드러나면
    '도해 상자 안에 그린 그림'으로 보인다 — 이전 영상이 딱 그랬다."""
    import numpy as np
    band = BAND * SS
    yy = np.abs(np.arange(h) - h * 0.5) / (band * 0.5)
    a = np.clip(1.0 - (yy - 0.62) / 0.55, 0.0, 1.0) ** 1.4
    return Image.fromarray((np.repeat(a[:, None], w, 1) * 255).astype("uint8"), "L")


def _fibers(size, tips, pull, seed=31):
    """조직 결 레이어(수퍼샘플 좌표계).

    전체를 평행 이동하면 화면 밖으로 밀려 나가 '당긴다'가 아니라 '흐른다'로
    보인다. 돌기 끝 주변에만 종형 가중치를 줘서 결이 **그쪽으로 모이게** 한다.
    시그마를 좁게 잡아야 결이 걸림점 주변에서만 접히고, 멀리 있는 결은
    제자리에 남아 '국소적으로 걸렸다'로 읽힌다.
    """
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    sigma = 86.0 * SS
    for (x, y, ln, ang, bow, dist, r) in _fiber_field(seed, size[0], size[1]):
        a = int((225 if dist < 0.34 else 170) * (1.0 - dist * 0.55) * (0.55 + 0.45 * r))
        if a <= 8:
            continue
        col = FIBER_HI if (dist < 0.32 and r > 0.62) else FIBER
        wgt = 3 if (dist < 0.34 and r > 0.7) else 2
        pts = []
        for i in range(9):
            u = i / 8.0
            px = x + (u - 0.5) * ln * math.cos(ang)
            py = y + (u - 0.5) * ln * math.sin(ang) + math.sin(u * math.pi) * bow
            dx = dy = 0.0
            for (tx, ty) in tips:
                w = math.exp(-(((px - tx) ** 2 + (py - ty) ** 2) / (2 * sigma ** 2)))
                dx += (tx - px) * w * 0.62 * pull
                dy += (ty - py) * w * 0.62 * pull
            pts.append((px + dx, py + dy))
        d.line(pts, fill=tuple(col) + (a,), width=wgt, joint="curve")
    lay.putalpha(ImageChops.multiply(lay.getchannel("A"),
                                     _band_mask(size[0], size[1])))
    return lay


# ---------------------------------------------------------------- 실
def _thread(size, box, openv, reach=1.0):
    """실 몸통 + 돌기(수퍼샘플 좌표계). 몸통은 입체로 — 위는 하이라이트, 아래는 그늘."""
    x0, y0, x1, y1 = box
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    body = BODY * SS
    blen = BARB_LEN * SS

    end = 0.06 + 0.94 * max(0.0, min(1.0, reach))
    spine = []
    for i in range(int(193 * end) + 2):
        u = min(end, i / 192.0)
        spine.append((x0 + u * (x1 - x0), thread_y(box, u)))

    # 돌기를 먼저 — 몸통이 뿌리를 덮어 한 몸으로 보인다.
    for k, u in enumerate(barb_us()):
        if u > end:
            continue
        bx = x0 + u * (x1 - x0)
        by = thread_y(box, u)
        ang = _barb_angle(u, openv, k % 2 == 0)
        tipx = bx + math.cos(ang) * blen
        tipy = by - math.sin(ang) * blen
        nx, ny = -math.sin(ang), -math.cos(ang)
        root = body * 0.62
        # 그늘 쪽 면을 먼저 깔아 원뿔에 두께를 준다.
        d.polygon([(bx + nx * root, by + ny * root),
                   (bx - nx * root, by - ny * root),
                   (tipx, tipy)],
                  fill=tuple(THREAD_LO) + (int(120 + 90 * openv),))
        d.polygon([(bx + nx * root * 0.45, by + ny * root * 0.45),
                   (bx - nx * root, by - ny * root),
                   (tipx, tipy)],
                  fill=tuple(BARB_C) + (int(150 + 105 * openv),))

    d.line(spine, fill=tuple(THREAD_LO) + (255,), width=int(body), joint="curve")
    d.line(spine, fill=tuple(THREAD) + (255,), width=int(body * 0.74), joint="curve")
    up = [(px, py - body * 0.22) for (px, py) in spine]
    d.line(up, fill=tuple(THREAD_HI) + (215,), width=max(2, int(body * 0.22)),
           joint="curve")
    return lay


def _anchors(size, box, openv, holdv):
    """걸림점 표시 — 돌기가 선 뒤에만 로즈 점이 켜진다."""
    if openv <= 0.03:
        return None
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    d, g = ImageDraw.Draw(lay), ImageDraw.Draw(glow)
    for k in range(NBARB):
        tx, ty = barb_tip(box, k, openv, SS)
        r = 6.0 * SS
        g.ellipse([tx - r * 6, ty - r * 6, tx + r * 6, ty + r * 6],
                  fill=tuple(ROSE_D) + (int(90 * holdv),))
        d.ellipse([tx - r, ty - r, tx + r, ty + r],
                  fill=tuple(ROSE) + (int(240 * openv),))
    lay.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14 * SS)), (0, 0))
    for k in range(NBARB):
        tx, ty = barb_tip(box, k, openv, SS)
        r = 6.0 * SS
        d.ellipse([tx - r, ty - r, tx + r, ty + r],
                  fill=tuple(ROSE) + (int(240 * openv),))
    return lay


# ---------------------------------------------------------------- 공개 API
def draw(img, box, stage, prog, show_tissue=True, alpha=1.0, seed=31):
    """개념도 한 장을 img 위에 그린다. box=(x0,y0,x1,y1) 는 실좌표."""
    if alpha <= 0.004:
        return
    x0, y0, x1, y1 = [int(v) for v in box]
    size = ((x1 - x0) * SS, (y1 - y0) * SS)
    sbox = (0, 0, size[0], size[1])
    openv = open_amount(stage, prog)
    holdv = hold_amount(stage, prog)
    reach = insert_reach(prog) if stage == "insert" else 1.0

    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    if show_tissue:
        tips = [barb_tip(sbox, k, openv, SS) for k in range(NBARB)]
        lay.alpha_composite(_fibers(size, tips, holdv, seed))
    lay.alpha_composite(_thread(size, sbox, openv, reach))
    anc = _anchors(size, sbox, openv, holdv)
    if anc is not None:
        lay.alpha_composite(anc)

    out = lay.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    if alpha < 0.996:
        out.putalpha(out.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    img.alpha_composite(out, (x0, y0))


def barb_anchor(box, k, openv=1.0):
    """지시선을 걸 실좌표. box 는 draw() 에 준 것과 같아야 한다."""
    x0, y0, x1, y1 = box
    tx, ty = barb_tip((0, 0, x1 - x0, y1 - y0), k, openv, 1.0)
    return (tx + x0, ty + y0)
