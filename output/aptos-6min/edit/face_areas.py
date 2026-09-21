# -*- coding: utf-8 -*-
"""적용 부위를 얼굴 조형물 위에 표시한다.

사장님 지적: "라인업과 적용 부위가 그냥 텍스트면 별로 효과가 없다".
맞는 말이다 — `볼` `중안부 · 하안부` `이중턱` 은 글자로 읽는 것보다 얼굴
위에서 보는 쪽이 훨씬 빠르다. 레퍼런스(톡스앤필·세예)도 얼굴 사진에
지시선을 걸어 부위를 표시한다.

**모델 얼굴이나 환자 사진을 쓰지 않는다.** 조각 두상(F1, 생성 이미지)을 쓴다.
이유는 둘이다:
  1. 사람 얼굴을 쓰면 시술 사례로 오인될 수 있다. 설계서 §4 는 전후 사진과
     환자 사례를 금지하고, 오인 여지 자체를 만들지 않는 것이 맞다.
  2. 조각은 팔레트와 톤이 이미 맞고, 부위 표시가 얹혀도 '사람'이 아니라
     '도해'로 읽힌다. 화면 표기도 `개념도` 로 나간다.

좌표는 **줌 1.0 화면 기준** 실측값이다(`stills/_face_grid2.png` 로 읽었다).
푸시인이 걸리면 화면 좌표가 움직이므로 `project()` 로 같은 변환을 앵커에도
적용한다 — 안 하면 부위 표시가 얼굴에서 떨어져 나간다.
"""
import math

from PIL import Image, ImageDraw, ImageFilter

import look as L
from look import W, H, ROSE, OFFW, clamp01, eo, p

# F1 원본(2160×3840)은 화면과 가로세로비가 정확히 같다. 그래서 줌 1.0 에서는
# cx/cy 가 아무 효과도 없고 전체가 그대로 들어온다. 크롭 이동은 줌 > 1 에서만 생긴다.
FACE_CX, FACE_CY = 0.42, 0.40

# (키, 라벨, 앵커(줌1.0 화면좌표), 표시 반경)
AREAS = (
    ("cheek",     "볼",             (455, 765),  120),
    ("midface",   "중안부 · 하안부",  (605, 1005), 125),
    ("submental", "이중턱",          (480, 1225), 105),
)
AREA_BY_KEY = {a[0]: a for a in AREAS}


def project(ax, ay, z):
    """줌 1.0 화면좌표를 줌 z 화면좌표로 옮긴다.

    `liv_video.media.cover` 가 하는 크롭과 같은 계산이다. 이걸 빼먹으면
    푸시인이 걸리는 동안 링이 얼굴에서 미끄러진다(실제로 그랬다).
    """
    u, v = ax / float(W), ay / float(H)
    x = (u - (1.0 - 1.0 / z) * FACE_CX) * z * W
    y = (v - (1.0 - 1.0 / z) * FACE_CY) * z * H
    return x, y


def zoom_at(t, span=8.0, amount=0.055):
    return 1.0 + amount * clamp01(t / max(1e-6, span))


def face_field(t=0.0, span=8.0, dim=0.0, amount=0.055):
    """아주 느린 푸시인을 건 얼굴 바탕. 정지 화면이 되지 않게 한다."""
    from PIL import ImageEnhance
    img = L.cover(L.asset("F1"), W, H, FACE_CX, FACE_CY, zoom_at(t, span, amount))
    if dim:
        img = ImageEnhance.Brightness(img).enhance(1.0 - dim)
    return img.convert("RGBA")


def left_scrim(img, a=170, width=560):
    """왼쪽 조판 기둥 뒤에 까는 가로 그라디언트. 라벨이 조각 위에서 읽히게 한다."""
    import numpy as np
    g = np.clip(np.linspace(a, 0, width), 0, 255)
    rgba = np.zeros((H, width, 4), "uint8")
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = (10, 8, 7)
    rgba[..., 3] = np.repeat(g[None, :], H, 0).astype("uint8")
    img.alpha_composite(Image.fromarray(rgba, "RGBA"), (0, 0))


@L.lru_cache(maxsize=4)
def _sweep_band(width, soft):
    """대각선 빛 띠 한 장(가로 그라디언트). 위치만 옮겨 쓰므로 한 번만 만든다."""
    import numpy as np
    x = np.linspace(-1.0, 1.0, int(width))
    a = np.exp(-(x ** 2) / (2 * soft ** 2))
    rgba = np.zeros((H, int(width), 4), "uint8")
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = (255, 246, 236)
    rgba[..., 3] = np.repeat((a * 255).astype("uint8")[None, :], H, 0)
    return Image.fromarray(rgba, "RGBA")


def sweep(img, t, dur, passes=2.0, strength=0.30, width=760, soft=0.40):
    """조각 위를 빛이 쓸고 지나가게 한다.

    왜 필요한가 — 조각 두상은 표면이 매끈해서 **푸시인을 걸어도 화면이 거의
    안 변한다.** 실측하면 20초 블록의 프레임 간 변화량이 0.060 으로, 정지
    플레이트(0.095)보다도 낮았다. 움직임 지표는 공간 기울기 × 이동량이라,
    매끈한 면은 아무리 밀어도 숫자가 안 오른다.

    그래서 빛을 움직인다. 이 영상에서 가장 잘 먹힌 생성 클립(V4, 움직임 5.106)이
    한 것이 정확히 이것 — "빛 한 줄이 석재를 쓸고 지나간다" — 이고, 조각에도
    같은 문법을 쓰면 톤이 어긋나지 않는다. 생성이 아니라 코드로 그리므로
    비용도 없다.
    """
    if strength <= 0.004:
        return
    q = (t / max(dur, 1e-6)) * passes
    # 왕복한다. 한 방향으로만 지나가면 지나간 뒤 구간이 조용해진다.
    u = abs((q % 2.0) - 1.0)
    band = _sweep_band(width, soft)
    x = int(-width + u * (W + 2 * width))
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lay.alpha_composite(band, (x, 0))
    lay.putalpha(lay.getchannel("A").point(lambda v, m=strength: int(v * m)))
    img.alpha_composite(lay)


@L.lru_cache(maxsize=32)
def _glow(r, a):
    """부위를 감싸는 부드러운 로즈 원. 하드 엣지로 그리면 스티커처럼 보인다."""
    r = int(r)
    pad = int(r * 1.8)
    im = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse([pad - r, pad - r, pad + r, pad + r],
                               fill=tuple(ROSE) + (int(a),))
    return im.filter(ImageFilter.GaussianBlur(r * 0.55)), pad


def mark(img, key, alpha=1.0, t=0.0, t0=0.0, z=1.0):
    """부위 하나를 표시한다 — 글로우 + 아주 느리게 맥동하는 링 + 앵커 점."""
    if alpha <= 0.004:
        return
    _k, _label, (ax, ay), r = AREA_BY_KEY[key]
    a = alpha * eo(p(t, t0, 0.55))
    if a <= 0.004:
        return
    px, py = project(ax, ay, z)
    rr = r * z
    gl, pad = _glow(int(rr), 92)
    L.put(img, gl, px - pad, py - pad, a)

    # 정지한 원은 스티커로 보인다. 아주 느리게 숨 쉬면 '표시'로 읽힌다.
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    pr = rr * (1.0 + 0.045 * math.sin((t - t0) * 1.9))
    d.ellipse([px - pr, py - pr, px + pr, py + pr],
              outline=tuple(ROSE) + (int(210 * a),), width=3)
    d.ellipse([px - 6, py - 6, px + 6, py + 6], fill=tuple(ROSE) + (int(255 * a),))
    img.alpha_composite(ov)


def label(img, key, x, y, alpha=1.0, size=52, z=1.0):
    """부위 라벨 + 앵커까지 잇는 지시선. 라벨은 왼쪽 조판 기둥에 둔다."""
    if alpha <= 0.004:
        return
    _k, text, (ax, ay), _r = AREA_BY_KEY[key]
    px, py = project(ax, ay, z)
    tw = L.twidth(text, "m", size, 0.02)
    ex = x + tw + 24
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    knee = (ex + 70, y)
    col = tuple(OFFW) + (int(190 * alpha),)
    d.line([(ex, y), knee], fill=col, width=2)
    d.line([knee, (px, py)], fill=col, width=2)
    img.alpha_composite(ov)
    L.T(img, text, x, y - size * 0.62, "m", size, OFFW, "l", alpha, 0.02, shadow=150)


def draw_all(img, active=None, alpha=1.0, t=0.0, z=1.0, stagger=0.18):
    """세 부위를 한 번에. active 를 주면 그 부위만 밝게, 나머지는 옅게."""
    for i, (key, _text, _xy, _r) in enumerate(AREAS):
        on = (active is None or key == active)
        mark(img, key, alpha * (1.0 if on else 0.26), t, i * stagger, z)
