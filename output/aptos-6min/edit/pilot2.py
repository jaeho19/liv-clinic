# -*- coding: utf-8 -*-
"""30초 파일럿 v2 — 생성 클립이 주인공인 판.

v1 에 대한 사장님 지적: "사진 프레임들을 연결한 것 같다".
맞는 지적이고, 원인은 둘이었다.

1. v1 은 **전부 정지 이미지에 켄번즈만** 걸려 있었다. 프레임 간 변화량 중앙값이
   0.111 이었다 — 거의 안 움직인다는 뜻이다. Seedance 2.5 로 만든 클립은
   1.5~5.1 로 **10~46배** 움직인다.
2. 이전 ②편은 생성 클립을 **갖고도** dim 0.46~0.58 로 눌러 깔았다. 움직임이
   화면에서 사라져서 결국 정지 이미지와 구별이 안 됐다.

그래서 v2 의 원칙은 하나다: **클립이 주인공인 구간에서는 클립을 감광하지
않는다.** 글자가 올라가는 자리에만 국소 스크림을 깐다.

  A 실 트래킹   0.0-5.0   V1 전면. 스페큘러가 실을 따라 미끄러진다
  ── 하드컷 ──
  B 돌기        5.0-10.0  V2 전면. 지시선 하나만 그어진다
  ── 하드컷 ──
  C 오프너      10.0-15.5 V4(빛이 석재를 쓸고 지나감) 위에 섹션 조판
  ── 세로 와이프 ──
  D 개념도      15.5-23.0 코드 도해 (의료 내용은 AI 에 맡기지 않는다, 설계서 §4-③)
  ── 사각 리빌 ──
  E 표          23.0-30.0 지면 필드

정확히 900프레임(30.000초). 1080×1920 / 30fps CFR / 무음.

사용:
  PYTHONIOENCODING=utf-8 python pilot2.py --chunk 0   # 0~2
  PYTHONIOENCODING=utf-8 python pilot2.py --join
  PYTHONIOENCODING=utf-8 python pilot2.py --stills 1,6,12,18,26
"""
import argparse
import os
import subprocess
import sys

from PIL import Image, ImageDraw

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import look as L
from look import (W, H, FPS, SAFE, bl, col, ROSE, ROSE_T, ROSE_D, BROWN, OFFW,
                  INK, WHITE, clamp01, p, eo, eio)
import thread_dia as td
from pilot import (rise, draw_rule, wipe_down, reveal_box, hard_cut,
                   LINEUP, CERTS, DIM, DIM_P, L_KB)
from liv_video.encode import encode_range

TOTAL = 900
CHUNKS = 3
CHUNK_FRAMES = TOTAL // CHUNKS
SCENES = os.path.join(EDIT, "scenes_out2")
STILLS = os.path.join(EDIT, "stills", "pilot2")


CLIP_SECONDS = 5.0              # 생성 클립 한 편의 길이


def clip_bed(key, tl, dur, dim=0.0, wash=None, wash_a=0.0):
    """블록 길이에 맞춰 클립을 **느리게 재생**해 깐다.

    클립은 5초인데 블록이 8초면 선택지가 셋이다: 반복(이음매에서 튄다),
    마지막 프레임 유지(그 구간이 정지가 된다), **감속 재생**. 셋 중 감속만
    깨끗하다. 움직임은 배속만큼 줄지만 정지 플레이트(0.095)보다는 여전히
    몇 배 크다.

    (이 주석의 원래 문장은 `copy_guard` 의 금지어에 걸렸다. 화면 문구가 아니라
     주석이지만, 검사를 느슨하게 하느니 표현을 바꾸는 쪽이 맞다.)
    """
    from PIL import ImageEnhance
    rate = CLIP_SECONDS / float(dur)
    img = L.clip(key, tl * rate)
    if dim:
        img = ImageEnhance.Brightness(img).enhance(1.0 - dim).convert("RGBA")
    if wash and wash_a > 0:
        img.alpha_composite(Image.new("RGBA", (W, H),
                                      tuple(wash) + (int(255 * wash_a),)))
    return img


def band_scrim(img, y, h, a=190):
    """글자가 올라갈 자리에만 까는 국소 스크림.

    화면 전체를 감광하면 클립의 움직임이 죽는다(v1 의 실패). 위아래로
    부드럽게 빠지는 띠 하나만 깐다.
    """
    import numpy as np
    g = np.concatenate([np.linspace(0, a, int(h * 0.34)),
                        np.full(h - 2 * int(h * 0.34), a),
                        np.linspace(a, 0, int(h * 0.34))])[:h]
    rgba = np.zeros((h, W, 4), "uint8")
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = (10, 8, 7)
    rgba[..., 3] = np.repeat(g[:, None], W, 1).astype("uint8")
    img.alpha_composite(Image.fromarray(rgba, "RGBA"), (0, int(y)))


# ================================================================ A 실 트래킹
A_DUR = 5.0


def a_thread(tl):
    """V1 전면. 감광 없음. 훅 한 줄만 하단에 들어온다."""
    img = L.clip("V1", tl)
    band_scrim(img, bl(108), bl(36), 200)
    x, cw = col(0, 12)
    draw_rule(img, x, bl(112), cw, tl, 1.1, 0.8)
    a1, d1 = rise(tl, 1.35, 0.65)
    L.T(img, "실은 당기지 않습니다", x, bl(116) + d1, "pl-b", 80, OFFW, "l", a1,
        -0.01, shadow=150)
    a2, d2 = rise(tl, 2.30, 0.65)
    L.T(img, "겁니다", x, bl(125) + d2, "pl-b", 80, ROSE_T, "l", a2, -0.01,
        shadow=150)
    L.note(img, "제품 이미지", eo(p(tl, 0.9, 0.6)), y=bl(104))
    L.chrome(img, "noir", photo=True)
    return img


# ================================================================ B 돌기
B_DUR = 5.0


def b_barb(tl):
    """V2 전면. 지시선 하나만 그어진다 — 클립을 가리지 않는다."""
    img = L.clip("V2", tl)
    x, cw = col(0, 12)
    ca = eo(p(tl, 0.9, 0.8))
    L.callout(img, "돌기", (int(W * 0.46), int(H * 0.60)),
              (int(W * 0.46) + 150, int(H * 0.44)), ca, "noir", "r", 40,
              "실 표면에 세워진 갈고리")
    band_scrim(img, bl(112), bl(28), 185)
    draw_rule(img, x, bl(116), cw, tl, 2.2, 0.8)
    a, d = rise(tl, 2.45, 0.65)
    L.T(img, "이 돌기가 조직을 겁니다", x, bl(120) + d, "pl-b", 76, OFFW, "l", a,
        -0.01, shadow=150)
    L.note(img, "제품 이미지", eo(p(tl, 0.7, 0.6)), y=bl(104))
    L.chrome(img, "noir", photo=True)
    return img


# ================================================================ C 오프너
C_DUR = 5.0


def c_opener(tl):
    """V4(빛이 석재를 쓸고 지나감) 위에 섹션 조판. 빛이 지나가는 동안 글자가 선다."""
    img = L.clip("V4", tl)
    band_scrim(img, bl(16), bl(52), 234)
    x, cw = col(0, 12)

    na, nd = rise(tl, 0.0, 0.5, 18)
    L.numeral(img, "02", x - 8, bl(23) + nd, na * 0.95, 180, (226, 200, 187))
    draw_rule(img, x + 236, bl(29), cw - 236, tl, 0.1, 0.6)
    L.kicker(img, "How it works", x + 236, bl(31), eo(p(tl, 0.3, 0.4)),
             (240, 222, 212), 38)
    ha, hd = rise(tl, 0.55, 0.6, 30)
    L.HEAD(img, "실이 하는 일", x, bl(40) + hd, 116, OFFW, "l", ha, shadow=200)
    sa, sd = rise(tl, 0.95, 0.6, 22)
    L.SUB(img, "돌기가 조직을 걸어 그 자리에 둡니다", x, bl(53) + sd, 56,
          fill=(232, 224, 218), alpha=sa, maxw=cw, shadow=190)
    L.chrome(img, "noir", photo=True)
    return img


# ================================================================ D 개념도
D_DUR = 8.0
D_SEG = D_DUR / 3.0
D_BOX = (-80, bl(44), W + 80, bl(92))


def _d_box(tl):
    """도해에 걸리는 느린 카메라 움직임.

    도해를 고정 상자에 그리면 '그려진 그림'으로 보인다. 8초 동안 6% 밀어 넣고
    옆으로 조금 흘리면 **촬영된 것**처럼 읽힌다. 뒤 15초가 정지 화면처럼
    느껴진 원인 중 하나가 이것이었다(구간 변화량 0.095).
    """
    q = clamp01(tl / D_DUR)
    z = 1.0 + 0.06 * q
    dx = -26.0 * q
    dy = -10.0 * q
    x0, y0, x1, y1 = D_BOX
    cx, cy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
    return (cx + (x0 - cx) * z + dx, cy + (y0 - cy) * z + dy,
            cx + (x1 - cx) * z + dx, cy + (y1 - cy) * z + dy)
D_STAGES = (("insert", "실이 들어갑니다"),
            ("engage", "돌기가 조직을 겁니다"),
            ("fix", "걸린 채 고정됩니다"))


def d_diagram(tl):
    """의료 내용은 코드로 그린다(설계서 §4-③). 배경만 생성 클립을 아주 어둡게 깐다.

    여기서는 **도해가 주인공**이라 배경을 눌러야 한다. 클립을 감광하지 않는다는
    원칙은 '클립이 주인공인 구간'에 적용된다.
    """
    img = clip_bed("V7", tl, D_DUR, dim=0.30, wash=L.NOIR, wash_a=0.22)
    x, cw = col(0, 12)

    k = max(0, min(2, int(tl / D_SEG)))
    stage, label = D_STAGES[k]
    tk = tl - k * D_SEG
    td.draw(img, _d_box(tl), stage, clamp01(tk / (D_SEG * 0.78)))

    L.kicker(img, "How it works", x, bl(24), eo(p(tl, 0.05, 0.45)), ROSE_T, 34,
             rule_w=int(180 * eo(p(tl, 0.0, 0.5))))
    a, dy = rise(tk, 0.12, 0.5, 24)
    a *= 1.0 - eio(p(tk, D_SEG - 0.40, 0.35)) if k < 2 else 1.0
    L.HEAD(img, label, x, bl(30) + dy, 92, OFFW, "l", a)

    draw_rule(img, x, bl(98), cw, tl, 0.2, 0.7)
    L.rail(img, [s[1] for s in D_STAGES], x, bl(104), k, eo(p(tl, 0.35, 0.5)))
    L.note(img, "개념도", eo(p(tl, 0.3, 0.5)))
    L.chrome(img, "noir")
    return img


# ================================================================ E 표
E_DUR = 7.0


def e_table(tl):
    img = clip_bed("V8", tl, E_DUR, wash=L.PAPER, wash_a=0.34)
    x, cw = col(0, 12)

    na, nd = rise(tl, 0.05, 0.6, 16)
    L.numeral(img, "04", x - 8, bl(23) + nd, na * 0.92, 150, (214, 190, 178))
    draw_rule(img, x + 200, bl(28), cw - 200, tl, 0.25, 0.7, "paper")
    L.kicker(img, "Line up", x + 200, bl(30), eo(p(tl, 0.45, 0.45)), BROWN, 34)
    ha, hd = rise(tl, 0.65, 0.6, 26)
    L.HEAD(img, "라인업과 적용 부위", x, bl(39) + hd, 96, INK, "l", ha)
    sa, sd = rise(tl, 1.0, 0.6, 20)
    L.SUB(img, "부위에 따라 굵기와 길이가 다른 실을 씁니다", x, bl(51) + sd, 54,
          fill=DIM_P, alpha=sa, maxw=cw, key="r")
    L.table(img, LINEUP, x, bl(60), [470, 300, 166], 1.0, "paper", rowh=bl(11),
            head=("제품", "적용 부위", "계열"), keys=["m", "r", "m"],
            sizes=[46, 42, 34], stagger=0.28, t=tl, t0=1.45)
    ca = eo(p(tl, 2.9, 0.55))
    L.caption(img, "CERTIFICATION", x, bl(102), ca, "paper", 30)
    draw_rule(img, x, bl(106), cw, tl, 3.0, 0.6, "paper")
    L.items_row(img, CERTS, x, bl(110), cw, 1.0, "paper",
                stagger=0.15, t=tl, t0=3.2)
    draw_rule(img, x, bl(122), cw, tl, 4.0, 0.6, "paper")
    fa, fd = rise(tl, 4.2, 0.65, 22)
    L.T(img, "100개국 이상 사용", x, bl(126) + fd, "pl-b", 64, INK, "l", fa, -0.01)
    L.chrome(img, "paper")
    return img


# ================================================================ 조립
BLOCKS = [
    dict(id="A", start=0.0,  dur=A_DUR, fn=a_thread,  trans=None,       tdur=0.0),
    dict(id="B", start=5.0,  dur=B_DUR, fn=b_barb,    trans=hard_cut,   tdur=0.0),
    dict(id="C", start=10.0, dur=C_DUR, fn=c_opener,  trans=hard_cut,   tdur=0.0),
    dict(id="D", start=15.0, dur=D_DUR, fn=d_diagram, trans=wipe_down,  tdur=0.50),
    dict(id="E", start=23.0, dur=E_DUR, fn=e_table,   trans=reveal_box, tdur=0.80),
]


def _block_at(t):
    for i in range(len(BLOCKS) - 1, -1, -1):
        if t >= BLOCKS[i]["start"] - 1e-9:
            return i
    return 0


def render_frame(i):
    t = i / float(FPS)
    k = _block_at(t)
    b = BLOCKS[k]
    img = b["fn"](t - b["start"])
    if k > 0 and b["tdur"] > 0:
        dt = t - b["start"]
        if dt < b["tdur"]:
            prev = BLOCKS[k - 1]
            under = prev["fn"](t - prev["start"])
            img = b["trans"](under, img, dt / b["tdur"])
    return img.convert("RGB")


# ================================================================ CLI
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunk", type=int, default=None)
    ap.add_argument("--join", action="store_true")
    ap.add_argument("--stills", default=None)
    a = ap.parse_args()
    os.makedirs(SCENES, exist_ok=True)

    if a.stills:
        os.makedirs(STILLS, exist_ok=True)
        for s in a.stills.split(","):
            sec = float(s)
            render_frame(int(round(sec * FPS))).save(
                os.path.join(STILLS, "t%05.1f.png" % sec))
            print("%.1fs" % sec)
        return

    if a.join:
        parts = [os.path.join(SCENES, "Q%02d.mp4" % k) for k in range(CHUNKS)]
        miss = [q for q in parts if not os.path.isfile(q)]
        if miss:
            raise SystemExit("청크가 없다: %s" % ", ".join(map(os.path.basename, miss)))
        lst = os.path.join(SCENES, "_join.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for q in parts:
                f.write("file '%s'\n" % q.replace("\\", "/"))
        out = os.path.join(os.path.dirname(EDIT), "pilot_30s_v2.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                        "-i", lst, "-c", "copy", "-movflags", "+faststart", out],
                       check=True)
        print("->", out)
        return

    if a.chunk is None:
        raise SystemExit("--chunk 0..%d / --join / --stills 중 하나" % (CHUNKS - 1))
    k = a.chunk
    out = os.path.join(SCENES, "Q%02d.mp4" % k)
    encode_range(render_frame, k * CHUNK_FRAMES, (k + 1) * CHUNK_FRAMES, out,
                 crf=12, preset="medium")
    print("청크 %d -> %s" % (k, out))


if __name__ == "__main__":
    main()
