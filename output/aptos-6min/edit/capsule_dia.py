# -*- coding: utf-8 -*-
"""NAMICA 캡슐 개념도 — 다시 그린 것.

이전 `particle_anim.py` 는 원 안에 점을 흩뿌린 그림이었다. 점은 캡슐로 읽히지
않는다. 그냥 입자다. 설계서가 말하는 것은 **캡슐화 구조**이므로 껍질이 보여야
한다. `thread_dia.py` 와 같은 원칙으로 다시 그린다:

1. **껍질을 그린다** — 껍질 링 + 비쳐 보이는 내용물 + 스페큘러. 큰 등급 일부는
   안쪽에 미세 알갱이를 담는다. '캡슐화'를 화면에서 보여 주는 것이 그것이다.
   (껍질을 호로 잘라 단면을 그려 봤는데 **팩맨 모양**으로 읽혀서 버렸다.
    잘라 보여 줄 필요가 없다 — 안이 비치면 담겨 있다는 게 그대로 읽힌다.)
2. **세 등급의 크기 차이를 확실히 벌린다** — 9 / 20 / 44px. 점 크기가
   비슷하면 등급이 셋이라는 사실 자체가 화면에서 안 보인다.
3. **2배 수퍼샘플링** — PIL 원에는 안티에일리어싱이 없다. 링이 계단으로 나온다.
4. **시간은 끊기지 않는다** — 단계가 바뀌어도 이미 나온 캡슐은 계속 떠다닌다.
   단계마다 필드를 리셋하면 그 순간이 정지·점프로 보인다.

의료 사실관계는 설계서 §4 의 허용 목록 그대로다:

    히알루론산을 나노·서브마이크로·마이크로로 캡슐화해 단계적으로 방출하는 구조

여기서 더 나가지 않는다. 효과·기간·우열은 이 모듈에 문자열로도 두지 않는다.
등급이 화면에 들어오는 순서는 설계서가 적어 둔 나열 순서(나노 → 서브마이크로
→ 마이크로)를 따른다. **어느 등급이 먼저 방출되는지는 주장하지 않는다** —
근거가 없는 순서를 그림으로 단정하면 그것도 주장이다.
"""
import math
import random
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFilter

from look import ROSE, ROSE_D, ROSE_T, CREAM, OFFW

SS = 2                          # 수퍼샘플링 배수

# (키, 라벨, 반지름 px(실좌표), 최대 개수, 등장 시작 비율)
# 반지름은 실제 물리 비율이 아니다. 나노:마이크로를 실제 비율로 그리면 나노가
# 1px 미만이 돼 화면에서 사라진다. 화면 표기가 `개념도` 인 이유가 이것이다.
CLASSES = (
    ("nano",  "나노",        9.0,  66, 0.00),
    ("sub",   "서브마이크로", 20.0, 30, 0.30),
    ("micro", "마이크로",     44.0, 14, 0.60),
)
KEYS = tuple(c[0] for c in CLASSES)
LABELS = {c[0]: c[1] for c in CLASSES}

SHELL = (238, 226, 218)         # 껍질
CORE = (206, 172, 158)          # 내용물
GRAIN = (232, 210, 200)         # 단면 안쪽 미세 알갱이


def _smooth(x):
    x = 0.0 if x < 0 else (1.0 if x > 1 else x)
    return x * x * (3.0 - 2.0 * x)


# ---------------------------------------------------------------- 진행도
def active_index(t, dur):
    """지금 강조할 등급의 번호 0~2."""
    q = 0.0 if dur <= 0 else max(0.0, min(1.0, t / float(dur)))
    for i in range(len(CLASSES) - 1, -1, -1):
        if q >= CLASSES[i][4]:
            return i
    return 0


def class_amount(key, t, dur):
    """등급이 화면에 들어온 정도 0~1. 한 번 들어오면 줄지 않는다."""
    for (k, _lab, _r, _n, start) in CLASSES:
        if k != key:
            continue
        q = 0.0 if dur <= 0 else max(0.0, min(1.0, t / float(dur)))
        span = max(1e-6, 0.26)
        return _smooth((q - start) / span)
    return 0.0


# ---------------------------------------------------------------- 배치
@lru_cache(maxsize=8)
def _field(seed, w, h):
    """캡슐 배치(수퍼샘플 좌표계). 시드가 같으면 같은 배치다.

    프레임마다 다시 뽑으면 캡슐이 매 프레임 새로 태어나 화면이 지글거린다
    (`thread_dia._fiber_field` 와 같은 이유). 배치는 고정하고 `draw` 가
    시간에 따른 확산만 다시 계산한다.
    """
    rng = random.Random(seed)
    cx, cy = w * 0.5, h * 0.46
    out = {}
    for (key, _lab, r, n, _s) in CLASSES:
        pts = []
        for i in range(n):
            ang = rng.uniform(0, math.tau)
            # sqrt 로 뽑아야 원판 위에 고르게 퍼진다. 균등난수를 그대로 쓰면
            # 가운데로 몰려 덩어리가 된다.
            rad = math.sqrt(rng.random())
            pts.append((cx, cy, ang, rad,
                        rng.uniform(0, math.tau),        # 부유 위상
                        rng.uniform(0.75, 1.25),         # 크기 흔들림
                        rng.random()))                   # 잡다한 선택용
        out[key] = tuple(pts)
    return out


# ---------------------------------------------------------------- 캡슐 한 개
def _capsule(d, x, y, r, a, cutaway=False, rng_r=0.0):
    """캡슐 한 개 — 껍질 링 + 비쳐 보이는 내용물 + 스페큘러.

    처음에는 껍질을 호로 잘라 '단면'을 그렸는데, 호 양끝에서 중심으로 선을 긋는
    방식이라 화면에서 **팩맨 모양**으로 읽혔다. 캡슐이 아니라 파이 조각이 됐다.
    잘라서 보여 줄 필요가 없다 — 껍질을 밝은 링으로 두르고 안쪽을 비쳐 보이게
    하면 '무언가 담겨 있다'가 그대로 읽힌다.

    cutaway=True 면 안쪽에 미세 알갱이를 뿌린다. 캡슐화된 내용물이다.
    """
    if a <= 4 or r < 1.2:
        return
    wall = max(2.0, r * 0.16)
    inner = r - wall * 0.5

    # 내용물 — 껍질 안쪽을 채운다. 반투명이라 배경이 살짝 비친다.
    d.ellipse([x - inner, y - inner, x + inner, y + inner],
              fill=tuple(CORE) + (int(a * 0.55),))

    if cutaway and inner > 10:
        # 알갱이 — 결정론적으로 배치한다(프레임마다 새로 뽑으면 지글거린다).
        g = max(1.2, inner * 0.085)
        k = 14
        for i in range(k):
            ang = (i * 2.399963) + rng_r * 6.283
            rad = inner * 0.80 * math.sqrt((i + 0.5) / k)
            gx, gy = x + math.cos(ang) * rad, y + math.sin(ang) * rad
            d.ellipse([gx - g, gy - g, gx + g, gy + g],
                      fill=tuple(GRAIN) + (int(a * 0.80),))

    # 아래·오른쪽 그늘 호 — 이 한 줄이 원을 구(球)로 만든다.
    d.arc([x - r + wall * 0.5, y - r + wall * 0.5,
           x + r - wall * 0.5, y + r - wall * 0.5],
          20, 160, fill=tuple(CORE) + (int(a * 0.72),), width=int(wall * 0.9))
    # 껍질 링.
    d.ellipse([x - r + wall * 0.5, y - r + wall * 0.5,
               x + r - wall * 0.5, y + r - wall * 0.5],
              outline=tuple(SHELL) + (a,), width=int(wall))
    # 좌상단 밝은 호 — 빛을 받는 쪽.
    d.arc([x - r + wall * 0.5, y - r + wall * 0.5,
           x + r - wall * 0.5, y + r - wall * 0.5],
          190, 320, fill=(255, 255, 255, int(a * 0.85)), width=int(wall * 0.7))

    # 스페큘러.
    sp = max(1.2, r * 0.13)
    sx, sy = x - r * 0.40, y - r * 0.42
    d.ellipse([sx - sp, sy - sp, sx + sp, sy + sp],
              fill=(255, 255, 255, int(a * 0.88)))


# ---------------------------------------------------------------- 공개 API
def draw(img, box, t, dur, alpha=1.0, seed=17):
    """확산 필드 한 장을 img 위에 그린다. box=(x0,y0,x1,y1) 는 실좌표.

    t 는 **개념도 블록 전체에서의 경과 시간**이다. 단계별로 0 부터 다시 세면
    이미 퍼진 캡슐이 제자리로 돌아가 그 순간이 점프로 보인다.
    """
    if alpha <= 0.004:
        return
    x0, y0, x1, y1 = [int(v) for v in box]
    w, h = (x1 - x0) * SS, (y1 - y0) * SS
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    g = ImageDraw.Draw(glow)

    field = _field(seed, w, h)
    spread = min(w, h) * 0.46

    for (key, _lab, r, _n, _s) in CLASSES:
        amt = class_amount(key, t, dur)
        if amt <= 0.004:
            continue
        # 확산은 등장 뒤에도 아주 느리게 계속된다 — 멈추면 정지 화면이 된다.
        grow = 0.30 + 0.70 * _smooth(amt) + 0.055 * (t / max(dur, 1e-6))
        for i, (cx, cy, ang, rad, phase, jitter, pick) in enumerate(field[key]):
            # 개수도 시간에 따라 늘어난다. 전부 한꺼번에 나오면 '켜졌다'가 된다.
            if (i + 1) / float(len(field[key])) > amt * 1.06:
                continue
            drift = math.sin(t * 0.55 + phase) * 8.0 * SS
            rr = rad * spread * grow
            px = cx + math.cos(ang) * rr + math.cos(phase) * drift
            py = cy + math.sin(ang) * rr * 0.86 + math.sin(phase * 1.3) * drift
            a = int(232 * alpha * min(1.0, amt * 1.5) * (0.62 + 0.38 * pick))
            rp = r * SS * jitter
            # 큰 등급 일부만 단면으로. 전부 단면이면 그림이 시끄럽다.
            _capsule(d, px, py, rp, a, cutaway=(key == "micro" and pick > 0.66),
                     rng_r=pick)
            if key != "nano":
                g.ellipse([px - rp * 2.2, py - rp * 2.2, px + rp * 2.2, py + rp * 2.2],
                          fill=tuple(ROSE_D) + (int(30 * alpha * amt),))

    lay.alpha_composite(glow.filter(ImageFilter.GaussianBlur(int(20 * SS))), (0, 0))
    out = lay.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    if alpha < 0.996:
        out.putalpha(out.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    img.alpha_composite(out, (x0, y0))


CLOSEUP = (
    # (중심 x·y 비율, 반지름 px, 알갱이 여부, 위상)
    # 반지름을 처음보다 줄이고 자리를 벌렸다 — 크게 그려 겹치니 캡슐 여럿이
    # 아니라 덩어리 하나로 보였다.
    (0.26, 0.28, 132, True,  0.0),
    (0.70, 0.22,  84, False, 1.7),
    (0.74, 0.60, 152, True,  3.1),
    (0.22, 0.70,  96, False, 4.6),
    (0.48, 0.45,  62, True,  2.3),
)


def closeup(img, box, t, dur, alpha=1.0):
    """캡슐 근접 도해 — 껍질 안에 무엇이 들어 있는지 크게 보여 준다.

    왜 코드로 그리나: 이 자리에 생성 클립을 깔면 **AI 그림이 의료 내용을
    설명하게 된다**. 설계서 §4-③ 과 인계문 원칙 2 가 금지하는 것이 그것이다.
    처음 판에서는 여기에 구슬 더미처럼 보이는 생성 클립을 깔고 그 위에
    "단계적으로 방출되는 구조입니다" 를 얹었는데, 그러면 보는 사람은 그 구슬을
    캡슐로 읽는다. 클립은 바탕으로 물리고 캡슐은 직접 그린다.

    확산 필드(`draw`)와 달리 몇 개만 크게 그린다. 단면이 보여야 '캡슐화'가
    화면에서 읽힌다 — 작은 원 수십 개로는 껍질이 안 보인다.
    """
    if alpha <= 0.004:
        return
    x0, y0, x1, y1 = [int(v) for v in box]
    w, h = (x1 - x0) * SS, (y1 - y0) * SS
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d, g = ImageDraw.Draw(lay), ImageDraw.Draw(glow)
    q = 0.0 if dur <= 0 else max(0.0, min(1.0, t / float(dur)))

    for i, (fx, fy, r, cut, phase) in enumerate(CLOSEUP):
        # 등장은 시차를 두고, 그 뒤에는 계속 아주 느리게 떠 있는다.
        a0 = _smooth((q - i * 0.09) / 0.22)
        if a0 <= 0.004:
            continue
        drift = 16.0 * SS
        px = fx * w + math.cos(t * 0.42 + phase) * drift
        py = fy * h + math.sin(t * 0.33 + phase * 1.4) * drift - q * 26.0 * SS
        rp = r * SS * (0.86 + 0.14 * _smooth(a0))
        g.ellipse([px - rp * 1.9, py - rp * 1.9, px + rp * 1.9, py + rp * 1.9],
                  fill=tuple(ROSE_D) + (int(42 * alpha * a0),))
        _capsule(d, px, py, rp, int(238 * alpha * a0), cutaway=cut,
                 rng_r=(t * 0.07 + phase) % 1.0)

    lay.alpha_composite(glow.filter(ImageFilter.GaussianBlur(int(26 * SS))), (0, 0))
    out = lay.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    if alpha < 0.996:
        out.putalpha(out.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    img.alpha_composite(out, (x0, y0))


def scale_row(img, x, y, width, active, alpha=1.0, t=0.0):
    """세 등급 크기 표본 + 라벨을 한 행으로. 활성 등급만 밝게.

    확산 필드만 보면 '작은 것과 큰 것이 있다'까지는 읽히지만 **등급이 셋**이고
    각각 이름이 있다는 것은 안 읽힌다. 기준자가 있어야 도해가 된다.
    괘선으로 칸을 가른다 — 카드로 쪼개면 이전 영상의 문법으로 돌아간다.
    """
    import look as L
    if alpha <= 0.004:
        return
    n = len(CLASSES)
    cw = width / float(n)
    maxr = max(c[2] for c in CLASSES)
    for i, (key, lab, r, _n, _s) in enumerate(CLASSES):
        on = (i == active)
        a = alpha * (1.0 if on else 0.42)
        cx = x + i * cw
        if i:
            L.vline(img, cx - 1, y - L.bl(2), L.bl(13), a, weight=2)
        # 표본 캡슐 — 실제 그리는 반지름 그대로 두어야 기준자 노릇을 한다.
        ss = Image.new("RGBA", (int(maxr * 2.6), int(maxr * 2.6)), (0, 0, 0, 0))
        _capsule(ImageDraw.Draw(ss), maxr * 1.3, maxr * 1.3, r,
                 int(240 * a), cutaway=(key == "micro"), rng_r=0.5)
        L.put(img, ss, cx + 24, y + L.bl(1) - maxr * 1.3, 1.0)
        L.T(img, lab, cx + 24 + maxr * 2.8, y - 4, "m", 38,
            OFFW if on else ROSE_T, "l", a, 0.02, maxw=cw - maxr * 3.0 - 40)
        if on:
            L.accent(img, cx + 24, y + L.bl(6), 44, alpha, 4, ROSE)
