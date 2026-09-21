# -*- coding: utf-8 -*-
"""압토스 6분 영상의 조판 계층 — 에디토리얼 그리드.

이전 3편(2026-09-19)은 규격은 맞았지만 연출에서 떨어졌다. 원인은 인계문 §3에
여섯 가지로 진단돼 있고, 그 여섯 가지가 전부 `liv_video.draw` 의 문법에서 나왔다:
둥근 카드 + 드롭섀도 + 전부 중앙 정렬 + 손으로 찍은 y 좌표 + 좁은 타이포 스케일.

그래서 이 모듈이 `liv_video.draw` 를 **대체한다**. 에셋(`media`)·이징(`anim`)·
인코딩(`encode`)·규격 상수(`spec`)는 검증된 것이므로 그대로 물려받는다.

바뀌는 것 네 가지:

1. **필드(field)** — 화면은 항상 셋 중 하나다: NOIR(근사 흑) · PAPER(밝은 지면) ·
   PHOTO(사진 전면). 섹션마다 번갈아 써서 톤 폭을 만든다. 이전 영상은 전부
   로즈~브라운 중간톤이어서 대비가 안 살았다(§3-5).
2. **그리드** — 12컬럼 × 12px 베이스라인. 모든 y 는 `bl()` 을 거친다(§3-3).
3. **타이포 3종** — 영문·숫자는 Cormorant(세리프), 한글 헤드라인은 Paperlogy
   (홈페이지 `--font-sans` 와 같은 얼굴), 본문·라벨은 Pretendard.
   스케일 32 → 200px 로 벌린다(§3-6).
4. **괘선** — 둥근 모서리·드롭섀도를 쓰지 않는다. 경계는 헤어라인이고,
   사진은 하드 엣지다(§3-2).
"""
import math
import os
import sys
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont, ImageFilter

EDIT = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)

from liv_video import spec
from liv_video.spec import (W, H, FPS, SAFE, ROSE, ROSE_T, ROSE_D, BROWN, OFFW,
                            CHAR, INK, CREAM, WHITE, CLINIC, FLOOR, PHONE)

FONTDIR = os.path.join(EDIT, "fonts")
PREP = os.path.join(OUTPUT, "lobby-monitor", "edit", "prep")
GEN = os.path.join(OUTPUT, "lobby-monitor", "edit", "gen")
spec.set_dirs(FONTDIR, PREP, GEN)

from liv_video.anim import clamp01, p, eo, eio, vis            # noqa: E402
from liv_video.media import cover, clip_frame, kb              # noqa: E402


# 공용 media.asset() 은 키 화이트리스트로 확장자를 고르고, 거기에 제품
# 컷아웃(P01/P01T)이 빠져 있어 .jpg 를 찾다가 죽는다. 공용 모듈은 다른 세 편이
# 쓰므로 건드리지 않고 여기서 확장자를 직접 정한다.
_PNG = {"E01", "E02", "E03", "logo_white", "logo_ink", "qr", "P01", "P01T"}

# 이 영상에서 새로 만든 에셋. prep/ 보다 **먼저** 찾는다.
#   *_up  : Topaz 로 해상도만 복원한 실사(얼굴 보정 OFF — 인물의 실제 얼굴을
#           다시 그리지 않는다. 얼굴 보정을 켜면 표정과 이목구비가 바뀐다.
#           인증·연수 사진은 증거라서 형태를 바꾸면 안 된다).
#   *_gen : GPT Image 2.5 로 생성한 것(제품 렌더·배경). 실사가 아니므로
#           화면에 "실물 사진"으로 표기하면 안 된다.
GEN = os.path.join(EDIT, "gen")
_NEW = {
    # 생성 — 사실 주장이 없는 것만
    # P01T/P01B 는 quality="max" 판. high 판(P01T_gen.png)보다 림 하이라이트와
    # 돌기 단면이 확실히 낫다(gen/_cmp_thread_q.jpg 대조). 실물 사진이 아니므로
    # 화면 표기는 "제품 이미지".
    "P01T": "P01T_max.png", "P01B": "P01B_max.png",
    "BG01": "BG01.png", "BG02": "BG02.png", "BG03": "BG03.png",
    "BG04": "BG04.png", "BG05": "BG05.png", "BG06": "BG06.png",
    "BG07": "BG07.png", "BG08": "BG08.png", "BG09": "BG09.png",
    "BG10": "BG10.png",
    # 적용 부위 표시용 조각 두상. 모델·환자 사진이 아니다 — 시술 사례로
    # 오인될 여지를 만들지 않으려고 조형물을 쓴다. 화면 표기는 "개념도".
    "F1": "F1.png", "F2": "F2.png", "F3": "F3.png",
    # 업스케일 — 내용 보존, 얼굴 보정 OFF
    "A02": "A02_up.png", "A09": "A09_up.png", "A10": "A10_up.png",
    "A11": "A11_up.png", "I03": "I03_up.png", "I04": "I04_up.png",
    # 원본 — 더 큰 원본을 그대로 줄여 쓴 것. AI 를 거치지 않았다.
    # A01(인증서)은 글자가 증거라 **일부러** 업스케일하지 않았다.
    "A01": "A01_src.jpg", "A03": "A03_src.jpg", "A04": "A04_src.jpg",
    "A05": "A05_src.jpg", "I01": "I01_src.jpg",
}


@lru_cache(maxsize=64)
def asset(key):
    if key in _NEW:
        path = os.path.join(GEN, _NEW[key])
    else:
        path = os.path.join(PREP, key + (".png" if key in _PNG else ".jpg"))
    im = Image.open(path)
    return im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")


# ---------------------------------------------------------------- 생성 클립
# Seedance 2.5 로 만든 실사 느낌의 움직이는 클립. `clips.py` 가 1080x1920 /
# 30fps / 정확히 N장 JPEG 시퀀스로 변환해 둔 것을 읽는다.
#
# ⚠️ 이 클립은 **감광해서 쓰면 안 된다.** 이전 영상은 생성 클립을 갖고도
# dim 0.46~0.58 로 눌러 깔아서 움직임이 화면에서 사라졌다 — 그래서 전체가
# "사진을 이어 붙인 것" 처럼 보였다. 클립이 주인공인 구간에서는 그대로 쓰고,
# 글자가 올라가는 자리에만 국소 스크림을 깐다.
CLIPDIR = os.path.join(EDIT, "clips", "frames")


@lru_cache(maxsize=16)
def clip_len(key):
    d = os.path.join(CLIPDIR, key)
    return len([n for n in os.listdir(d) if n.endswith(".jpg")])


@lru_cache(maxsize=256)
def _clip_frame(key, idx):
    return Image.open(os.path.join(CLIPDIR, key, "%04d.jpg" % idx)).convert("RGB")


def clip(key, t, fps=FPS, hold=True):
    """t초 시점의 클립 프레임(RGBA). hold=True 면 끝에서 마지막 장을 유지한다.

    유지 구간은 완전 정지가 되므로 3초를 넘기면 안 된다. 블록 길이를 클립
    길이 안에 두는 것이 원칙이고, 넘길 때는 호출부가 켄번즈를 따로 걸어야 한다.
    """
    n = clip_len(key)
    i = int(round(t * fps)) + 1
    i = n if (hold and i > n) else ((i - 1) % n + 1 if i > n else max(1, i))
    return _clip_frame(key, i).convert("RGBA")


# ---------------------------------------------------------------- 팔레트
# spec.py 의 브랜드색(홈페이지 globals.css 와 같은 값)에 **어두운 끝**을 더한다.
# 이전 영상에 없던 톤이고, 대비 punch 가 여기서 나온다.
NOIR = (16, 13, 11)             # 근사 흑 - 따뜻한 쪽으로 기운 먹
NOIR_2 = (30, 24, 21)           # NOIR 위에 얹는 한 단 밝은 면
PAPER = (240, 234, 227)         # 밝은 지면(= CREAM 계열, 표·데이터 구간)
HAIR = (255, 255, 255)          # 헤어라인 기본색(어두운 필드에서 알파로 조절)
HAIR_INK = (42, 32, 26)         # 밝은 필드의 헤어라인


# ---------------------------------------------------------------- 그리드
BASELINE = 12
COLS = 12
GUTTER = 12
CONTENT = W - 2 * SAFE                      # 936
COLW = (CONTENT - GUTTER * (COLS - 1)) / float(COLS)     # 67.0


def col(i, span=1):
    """i번 컬럼의 왼쪽 x 와 span 컬럼을 덮는 폭."""
    x = int(round(SAFE + i * (COLW + GUTTER)))
    w = int(round(span * COLW + (span - 1) * GUTTER))
    return x, w


def bl(n):
    """베이스라인 n칸째의 y. 모든 세로 위치는 이 함수를 지나야 한다."""
    return int(round(n * BASELINE))


# ---------------------------------------------------------------- 폰트
FACES = {
    # 영문·숫자 — 세리프. 섹션 번호와 영문 키커를 전부 이 얼굴로 쓴다.
    "cg-l": "CormorantGaramond-300.ttf",
    "cg": "CormorantGaramond-400.ttf",
    "cg-m": "CormorantGaramond-500.ttf",
    "cg-sb": "CormorantGaramond-600.ttf",
    # 한글 헤드라인 — 홈페이지와 같은 얼굴(Paperlogy).
    "pl": "Paperlogy-4Regular.ttf",
    "pl-sb": "Paperlogy-6SemiBold.ttf",
    "pl-b": "Paperlogy-7Bold.ttf",
    # 본문·라벨 — Pretendard.
    "r": "Pretendard-Regular.ttf",
    "m": "Pretendard-Medium.ttf",
    "sb": "Pretendard-SemiBold.ttf",
    "b": "Pretendard-Bold.ttf",
    "xb": "Pretendard-ExtraBold.ttf",
}


@lru_cache(maxsize=128)
def font(key, size):
    return ImageFont.truetype(os.path.join(FONTDIR, FACES[key]), int(size))


_M = ImageDraw.Draw(Image.new("L", (4, 4)))


@lru_cache(maxsize=4096)
def _bbox(ch, key, size):
    return _M.textbbox((0, 0), ch, font=font(key, size), anchor="la")


@lru_cache(maxsize=4096)
def _advance(ch, key, size):
    return _M.textlength(ch, font=font(key, size))


def twidth(text, key, size, track=0.0):
    """자간(track, em 단위)을 반영한 폭. 마지막 글자 뒤 자간은 세지 않는다."""
    if not text:
        return 0.0
    w = sum(_advance(c, key, size) for c in text)
    return w + track * size * (len(text) - 1)


def fit(text, key, size, maxw, track=0.0, floor=16):
    """maxw 안에 들어갈 때까지 줄인다.

    인계문 §7-4: `liv_video.draw.fit_size` 가 **조용히** 줄여서 제목 규격
    하한(76px)을 두 번 깼다. 여기서는 줄인 사실을 돌려주고, 호출부가
    쓰는 `HEAD/SUB` 헬퍼가 하한을 넘기면 예외를 던지게 한다.
    """
    s = int(size)
    while s > floor and twidth(text, key, s, track) > maxw:
        s -= 2
    return s


@lru_cache(maxsize=1024)
def _glyphs(text, key, size, fill, track):
    """자간을 적용해 한 줄을 미리 그려 둔 RGBA. 원점은 어센더 라인(la)."""
    size = int(size)
    tw = twidth(text, key, size, track)
    # 세로 여유: 어센더/디센더가 잘리지 않게 폰트 메트릭 전체를 담는다.
    asc, desc = font(key, size).getmetrics()
    pad = 8
    img = Image.new("RGBA", (max(4, int(tw) + 2 * pad), asc + desc + 2 * pad),
                    (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = float(pad)
    for c in text:
        d.text((x, pad), c, font=font(key, size), fill=tuple(fill) + (255,),
               anchor="la")
        x += _advance(c, key, size) + track * size
    return img, pad, tw, asc


def _shadow_of(img, strength, blur=14):
    """글자 모양 그대로의 검은 그림자. 알파만 남기고 색을 0으로 만든다.

    사진 필드 위에서만 쓴다. 단색 필드 위 글자에는 그림자를 넣지 않는다 —
    이전 영상은 전부 그림자를 깔아 화면 전체가 흐릿하게 떠 보였다.
    """
    a = img.getchannel("A").point(lambda v, m=strength: v * m // 255)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.putalpha(a)
    return sh.filter(ImageFilter.GaussianBlur(blur))


def put(base, img, x, y, alpha=1.0):
    if alpha <= 0.004 or img is None:
        return
    if alpha < 0.996:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.alpha_composite(img, (int(round(x)), int(round(y))))


def T(base, text, x, y, key, size, fill=OFFW, ha="l", alpha=1.0, track=0.0,
      maxw=None, shadow=0):
    """한 줄 조판. y 는 **어센더 라인**(베이스라인 격자에 맞추는 기준)이다.

    shadow: 사진 위에 올릴 때만 쓴다. 필드 위에서는 0 — 이전 영상은 모든
    글자에 그림자를 깔아 전체가 흐릿하게 떠 보였다.
    """
    if alpha <= 0.004 or not text:
        return 0.0
    size = int(size)
    if maxw:
        size = fit(text, key, size, maxw, track)
    img, pad, tw, asc = _glyphs(text, key, size, tuple(fill), track)
    if ha == "m":
        x -= tw / 2.0
    elif ha == "r":
        x -= tw
    if shadow:
        put(base, _shadow_of(img, int(shadow)), x - pad, y - pad + 4, alpha)
    put(base, img, x - pad, y - pad, alpha)
    return tw


def TL(base, lines, x, y, key, size, fill=OFFW, lh=None, ha="l", alpha=1.0,
       track=0.0, maxw=None, stagger=0.0, t=None, t0=None, shadow=0):
    """여러 줄. lh 는 베이스라인 배수로 준다(None 이면 size*1.34 를 올림)."""
    if lh is None:
        lh = bl(int(math.ceil(size * 1.34 / BASELINE)))
    for i, ln in enumerate(lines):
        a = alpha
        if stagger and t is not None and t0 is not None:
            a = alpha * eo(p(t, t0 + i * stagger, 0.5))
        T(base, ln, x, y + i * lh, key, size, fill, ha, a, track, maxw, shadow)
    return len(lines) * lh


# ---------------------------------------------------------------- 규격 가드
HEAD_MIN, HEAD_MAX = 76, 200
SUB_MIN, SUB_MAX = 54, 96


def HEAD(base, text, x, y, size=104, fill=OFFW, ha="l", alpha=1.0, track=-0.01,
         maxw=None, key="pl-b", shadow=0):
    """한글 헤드라인. 규격(76~200px) 밖으로 나가면 **조용히 넘어가지 않는다**."""
    s = fit(text, key, size, maxw, track) if maxw else int(size)
    if not (HEAD_MIN <= s <= HEAD_MAX):
        raise ValueError(
            "헤드라인 규격 위반: %r 가 %dpx 로 렌더된다(허용 %d~%d). "
            "문구를 줄이거나 maxw 를 넓혀라." % (text, s, HEAD_MIN, HEAD_MAX))
    return T(base, text, x, y, key, s, fill, ha, alpha, track, None, shadow)


def SUB(base, text, x, y, size=56, fill=None, ha="l", alpha=1.0, track=0.0,
        maxw=None, key="m", shadow=0):
    """본문·자막. 하한 54px."""
    fill = OFFW if fill is None else fill
    s = fit(text, key, size, maxw, track) if maxw else int(size)
    if s < SUB_MIN:
        raise ValueError("본문 규격 위반: %r 가 %dpx (하한 %d)" % (text, s, SUB_MIN))
    return T(base, text, x, y, key, s, fill, ha, alpha, track, None, shadow)


# ---------------------------------------------------------------- 필드
@lru_cache(maxsize=8)
def _grain(seed=7):
    """아주 옅은 입자. 평면 단색이 1080 화면에서 밴딩으로 보이는 것을 막는다.

    인계문 §4-② 의 디더링 요구와 같은 목적이고, 라이브 배경이 없는 NOIR /
    PAPER 필드에서도 프레임 간 미세 변화를 만들어 준다.
    """
    import numpy as np
    rng = np.random.default_rng(seed)
    n = rng.integers(0, 10, (H, W), dtype="uint8")
    return Image.fromarray(np.dstack([n, n, n, np.full((H, W), 26, "uint8")]), "RGBA")


def field(tone="noir", t=0.0, plate=None, prog=0.0, dim=0.62, z0=1.02, z1=1.16):
    """단색 필드 한 장. tone: 'noir' | 'paper'.

    plate 를 주면 그 생성 배경(빛줄기·먼지)을 깊게 감광해 깔아 준다. 평면 먹만
    쓰면 6분 내내 배경이 죽어 있고, 생성 클립 없이도 켄번즈로 움직임을 만들 수
    있어야 한다(인계문 §4-② '정지 이미지 + 켄번즈').
    """
    from PIL import ImageEnhance
    base = Image.new("RGBA", (W, H), tuple(NOIR if tone == "noir" else PAPER) + (255,))
    if plate:
        pl = kb(asset(plate), prog, z0, z1, 0.46, 0.5, 0.54, 0.5)
        base.alpha_composite(ImageEnhance.Brightness(pl).enhance(1.0 - dim)
                             .convert("RGBA"))
    base.alpha_composite(_grain(7 if tone == "noir" else 11))
    return base


def photo_field(key, prog, z0=1.02, z1=1.20, cx0=0.5, cy0=0.5, cx1=0.5, cy1=0.5,
                dim=0.0, blur=0):
    """사진 전면 필드. 하드 엣지이고 테두리를 두르지 않는다."""
    from PIL import ImageEnhance
    im = asset(key)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    out = kb(im, prog, z0, z1, cx0, cy0, cx1, cy1)
    if dim:
        out = ImageEnhance.Brightness(out).enhance(1.0 - dim)
    return out.convert("RGBA")


def scrim(base, top=0, bottom=0, color=(10, 8, 7)):
    """사진 위 글자 가독성용 그라디언트. 판(softplate)을 쓰지 않는다 —
    둥근 반투명 판이 이전 영상의 '떠 있는 느낌'을 만든 주범이다."""
    import numpy as np
    if top:
        a = np.linspace(top, 0, 560)
        rgba = np.zeros((560, W, 4), "uint8")
        rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
        rgba[..., 3] = np.repeat(a[:, None], W, 1).astype("uint8")
        base.alpha_composite(Image.fromarray(rgba, "RGBA"), (0, 0))
    if bottom:
        a = np.linspace(0, bottom, 720)
        rgba = np.zeros((720, W, 4), "uint8")
        rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
        rgba[..., 3] = np.repeat(a[:, None], W, 1).astype("uint8")
        base.alpha_composite(Image.fromarray(rgba, "RGBA"), (0, H - 720))


# ---------------------------------------------------------------- 괘선
def hline(base, x, y, w, alpha=1.0, color=None, weight=2, tone="noir"):
    if alpha <= 0.004 or w < 1:
        return
    color = color or (HAIR if tone == "noir" else HAIR_INK)
    a = int(255 * alpha * (0.30 if tone == "noir" else 0.26))
    im = Image.new("RGBA", (max(1, int(w)), int(weight)), tuple(color) + (a,))
    base.alpha_composite(im, (int(x), int(y)))


def vline(base, x, y, h, alpha=1.0, color=None, weight=2, tone="noir"):
    if alpha <= 0.004 or h < 1:
        return
    color = color or (HAIR if tone == "noir" else HAIR_INK)
    a = int(255 * alpha * (0.30 if tone == "noir" else 0.26))
    im = Image.new("RGBA", (int(weight), max(1, int(h))), tuple(color) + (a,))
    base.alpha_composite(im, (int(x), int(y)))


def accent(base, x, y, w, alpha=1.0, weight=6, color=ROSE):
    """로즈 강조 괘선. 헤어라인과 달리 불투명하다."""
    if alpha <= 0.004 or w < 1:
        return
    im = Image.new("RGBA", (max(1, int(w)), int(weight)), tuple(color) + (255,))
    put(base, im, x, y, alpha)


def rect(base, x, y, w, h, color, alpha=1.0):
    if alpha <= 0.004:
        return
    put(base, Image.new("RGBA", (max(1, int(w)), max(1, int(h))),
                        tuple(color) + (255,)), x, y, alpha)


# ---------------------------------------------------------------- 조판 단위
def kicker(base, text, x, y, alpha=1.0, fill=None, size=38, tone="noir",
           rule_w=0, key="cg-sb"):
    """영문 섹션 마커. 세리프 + 넓은 자간 + 대문자.

    레퍼런스가 세련돼 보이는 이유의 절반이 이 한 줄이다(§3). 한글 헤드라인
    **위**에 작게 얹는다.
    """
    fill = fill or (ROSE_T if tone == "noir" else BROWN)
    if rule_w:
        hline(base, x, y - bl(2), rule_w, alpha, weight=2, tone=tone)
    return T(base, text.upper(), x, y, key, size, fill, "l", alpha, 0.34)


def numeral(base, text, x, y, alpha=1.0, size=190, fill=None, tone="noir",
            ha="l"):
    """섹션 번호. 세리프 라이트, 아주 크게, 낮은 대비로 배경에 눕힌다."""
    fill = fill or (ROSE_D if tone == "noir" else ROSE)
    return T(base, text, x, y, "cg-l", size, fill, ha, alpha, 0.02)


def caption(base, text, x, y, alpha=1.0, tone="noir", size=34, ha="l", maxw=None,
            fill=None):
    """작은 라벨·주석. 넓은 자간의 Pretendard Medium.

    maxw 를 받는다: 자간 0.14em 이 붙은 긴 한 줄은 안전영역을 쉽게 넘는데,
    넘어도 조용히 잘려 나간다(첫 렌더에서 'FDA MDSAP' 이 화면 밖으로 나갔다).
    """
    fill = fill or (ROSE_T if tone == "noir" else BROWN)
    return T(base, text, x, y, "m", size, fill, ha, alpha, 0.14, maxw)


def note(base, text, alpha=1.0, tone="noir", y=None):
    """'개념도' / '실물 사진' 구분 표기. 화면 오른쪽 아래, 헤어라인 위."""
    if alpha <= 0.004:
        return
    y = bl(132) if y is None else y
    x, w = col(0, 12)
    hline(base, x + w - 300, y - bl(2), 300, alpha, tone=tone)
    caption(base, text, x + w, y, alpha, tone, 32, "r")


def rail(base, items, x, y, active, alpha=1.0, tone="noir", gap=None):
    """진행 레일 — 번호 + 라벨을 세로로 쌓고 현재 칸만 로즈 괘선으로 켠다.

    이전 영상의 '점 세 개'는 정보가 없었다. 번호와 이름이 같이 보여야
    지금 몇 번째 단계인지 화면만 보고 알 수 있다.
    """
    gap = gap or bl(9)
    fill_on = OFFW if tone == "noir" else INK
    fill_off = (ROSE_D if tone == "noir" else ROSE)
    for i, label in enumerate(items):
        yy = y + i * gap
        on = (i == active)
        accent(base, x, yy - bl(1), 34 if on else 18, alpha * (1.0 if on else 0.45),
               4, ROSE if on else fill_off)
        T(base, "%02d" % (i + 1), x + 52, yy - 26, "cg-m", 34,
          ROSE if on else fill_off, "l", alpha * (1.0 if on else 0.5), 0.12)
        T(base, label, x + 110, yy - 28, "m", 36, fill_on if on else fill_off,
          "l", alpha * (1.0 if on else 0.45), 0.02)


def callout(base, text, anchor, label_xy, alpha=1.0, tone="noir", side="r",
            size=36, sub=None):
    """지시선 + 라벨. 사진·도해 위의 부위 표시를 브래킷 대신 이것으로 한다.

    레퍼런스(세예·톡스앤필)가 얼굴 사진 위에 쓰는 문법이고, 브래킷보다
    훨씬 정밀해 보인다. anchor 에서 꺾임점까지 사선, 거기서 라벨까지 수평.
    """
    if alpha <= 0.004:
        return
    ax, ay = anchor
    lx, ly = label_xy
    color = (OFFW if tone == "noir" else INK)
    a = int(210 * alpha)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    knee = (lx - 44 if side == "r" else lx + 44, ly)
    d.line([(ax, ay), knee], fill=tuple(color) + (a,), width=2)
    d.line([knee, (lx, ly)], fill=tuple(color) + (a,), width=2)
    d.ellipse([ax - 5, ay - 5, ax + 5, ay + 5], fill=tuple(ROSE) + (255,))
    base.alpha_composite(ov)
    ha = "l" if side == "r" else "r"
    T(base, text, lx + (10 if side == "r" else -10), ly - size * 0.62, "m", size,
      color, ha, alpha, 0.03)
    if sub:
        T(base, sub, lx + (10 if side == "r" else -10), ly + size * 0.50, "r", 30,
          ROSE_T if tone == "noir" else BROWN, ha, alpha * 0.9, 0.06)


def table(base, rows, x, y, widths, alpha=1.0, tone="noir", rowh=None,
          head=None, keys=None, sizes=None, stagger=0.0, t=None, t0=None):
    """괘선 표. 카드 테두리가 아니라 가로 괘선만 쓴다(§3 '정보를 담은 표').

    rows: [(셀1, 셀2, ...), ...] / widths: 각 열의 폭 / head: 머리행 튜플.
    """
    rowh = rowh or bl(10)
    ink = INK if tone == "paper" else OFFW
    dim = BROWN if tone == "paper" else ROSE_T
    keys = keys or (["m"] + ["r"] * (len(widths) - 1))
    sizes = sizes or ([44] + [40] * (len(widths) - 1))
    yy = y
    if head:
        for c, (cell, wd) in enumerate(zip(head, widths)):
            T(base, cell, x + sum(widths[:c]), yy, "m", 30, dim, "l", alpha, 0.16)
        yy += bl(5)
        hline(base, x, yy - bl(1), sum(widths), alpha, weight=2, tone=tone)
    hline(base, x, yy, sum(widths), alpha, weight=2, tone=tone)
    for r, row in enumerate(rows):
        a = alpha
        if stagger and t is not None and t0 is not None:
            a = alpha * eo(p(t, t0 + r * stagger, 0.5))
        ty = yy + bl(3)
        for c, (cell, wd) in enumerate(zip(row, widths)):
            if not cell:
                continue
            T(base, cell, x + sum(widths[:c]), ty, keys[c], sizes[c],
              ink if c == 0 else dim, "l", a, 0.0, maxw=wd - 24)
        yy += rowh
        hline(base, x, yy, sum(widths), a, weight=2, tone=tone)
    return yy - y


def items_row(base, items, x, y, width, alpha=1.0, tone="noir", stagger=0.0,
              t=None, t0=None):
    """세로 괘선으로 나눈 항목 행 — 인증처럼 짧은 값이 여럿일 때 쓴다.

    긴 한 줄(`A · B · C · D`)로 늘어놓으면 안전영역을 넘고, 카드 네 장으로
    쪼개면 이전 영상의 카드 문법으로 돌아간다. 열로 세우고 사이만 괘선으로
    가른다.
    """
    n = len(items)
    cw = width / float(n)
    ink = OFFW if tone == "noir" else INK
    dim = ROSE_T if tone == "noir" else BROWN
    for i, (top, bot) in enumerate(items):
        a = alpha
        if stagger and t is not None and t0 is not None:
            a = alpha * eo(p(t, t0 + i * stagger, 0.5))
        cx = x + i * cw
        if i:
            vline(base, cx - 1, y - bl(1), bl(11), a, weight=2, tone=tone)
        T(base, top, cx + 20, y, "m", 44, ink, "l", a, 0.02, maxw=cw - 40)
        T(base, bot, cx + 20, y + bl(5), "r", 32, dim, "l", a, 0.06, maxw=cw - 40)


# ---------------------------------------------------------------- 제품 매크로
@lru_cache(maxsize=8)
def macro_band(key, w, h, zoom=135, cy=50):
    """제품 컷아웃(투명 배경)을 띠 안에 앉힌 판.

    P01/P01T 는 검은 배경을 지운 매크로 사진이다. 먹 위에 그냥 얹으면 차가운
    은색이 평면 먹 위에 떠서 오려 붙인 것처럼 보인다(첫 렌더에서 그랬다).
    바닥에 따뜻한 그라디언트와 로즈 글로우를 깔고 그 위에 앉힌다.

    zoom·cy 는 캐시 키를 정수로 두려고 100배·백분율로 받는다.
    """
    import numpy as np
    g = np.linspace(0, 1, h)[:, None]
    ground = (np.array(NOIR_2)[None, None, :] * (1 - g)[..., None]
              + np.array(NOIR)[None, None, :] * g[..., None])
    band = Image.fromarray(
        np.repeat(ground.astype("uint8"), w, axis=1), "RGB").convert("RGBA")

    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [-w * 0.1, h * (cy / 100.0) - h * 0.42, w * 1.1, h * (cy / 100.0) + h * 0.42],
        fill=tuple(ROSE_D) + (70,))
    band.alpha_composite(glow.filter(ImageFilter.GaussianBlur(int(h * 0.22))))

    src = asset(key)
    if src.mode == "RGBA":
        # 생성 컷아웃은 캔버스에 여백이 넓다. 내용 bbox 로 먼저 조여야 띠 안에서
        # 실제 크기가 지정한 zoom 대로 나온다.
        bb = src.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if bb:
            src = src.crop(bb)
    tw = int(w * zoom / 100.0)
    th = max(1, int(round(src.height * tw / float(src.width))))
    im = src.resize((tw, th), Image.LANCZOS)
    # 차가운 은색을 팔레트 쪽으로 데운다(파랑을 조금 내린다).
    r, g_, b, a = im.split()
    im = Image.merge("RGBA", (r, g_.point(lambda v: int(v * 0.985)),
                              b.point(lambda v: int(v * 0.93)), a))
    band.alpha_composite(im, (int((w - tw) / 2), int(h * (cy / 100.0) - th / 2)))
    return band


# ---------------------------------------------------------------- 고정 크롬
@lru_cache(maxsize=4)
def _chrome(tone):
    """상·하단 고정 크롬. 필 모양 로즈 버튼과 드롭섀도를 버리고 괘선으로 짠다.

    밝은 필드(paper) 위에서는 흰 글자가 안 보이므로 먹색 변형을 따로 만든다.
    """
    dark = (tone == "noir")
    ink = OFFW if dark else INK
    dim = ROSE_T if dark else BROWN
    top = Image.new("RGBA", (W, bl(20)), (0, 0, 0, 0))
    logo = asset("logo_white" if dark else "logo_ink").resize((222, 52), Image.LANCZOS)
    top.alpha_composite(logo, (SAFE, bl(7)))
    T(top, CLINIC, W - SAFE, bl(8) - 4, "m", 40, ink, "r", 0.92, 0.06)
    hline(top, SAFE, bl(16), CONTENT, 1.0, weight=2,
          tone="noir" if dark else "paper")

    bot = Image.new("RGBA", (W, bl(20)), (0, 0, 0, 0))
    hline(bot, SAFE, bl(4), CONTENT, 1.0, weight=2, tone="noir" if dark else "paper")
    rect(bot, SAFE, bl(9) - 2, 5, 40, ROSE)
    T(bot, FLOOR, SAFE + 26, bl(9) - 4, "pl-b", 46, ink, "l", 1.0, 0.0)
    T(bot, PHONE, W - SAFE, bl(9), "m", 40, dim, "r", 1.0, 0.08)
    return top, bot


def chrome(base, tone="noir", photo=False):
    """전 구간 고정 노출. photo=True 면 가독성 스크림을 먼저 깐다."""
    if photo:
        scrim(base, top=150, bottom=190)
    top, bot = _chrome(tone)
    base.alpha_composite(top, (0, 0))
    base.alpha_composite(bot, (0, H - bl(20)))


# ---------------------------------------------------------------- 안전선 오버레이
def guides(base):
    """개발용 그리드 오버레이. 출고본에는 절대 넣지 않는다."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for i in range(COLS):
        x, w = col(i)
        d.rectangle([x, 0, x + w, H], fill=(0, 200, 255, 22))
    for n in range(0, H // BASELINE, 5):
        d.line([(0, bl(n)), (W, bl(n))], fill=(255, 0, 120, 26), width=1)
    d.rectangle([SAFE, SAFE, W - SAFE, H - SAFE], outline=(0, 255, 120, 90), width=2)
    base.alpha_composite(ov)
