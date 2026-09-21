# -*- coding: utf-8 -*-
"""30초 파일럿 — 2단계. 움직임과 전환을 확인받는다.

1단계(정지 이미지 5장)로 조판·톤·그리드를 확정했다. 정지 이미지로는 판단할 수
없는 것이 둘 남는다: **무엇이 어떻게 움직이는가**와 **장면이 어떻게 바뀌는가**.
이 파일럿은 그 둘만 보여 주려고 만든 30초다.

인계문 §3-4 진단: 이전 세 편은 16분을 통틀어 전환이 크로스디졸브 하나뿐이었고
마스크 전환은 1회였다. 그래서 여기서는 전환을 네 종류로 나눠 쓴다.

  A 훅        0.0-7.0   실 매크로가 **가로 마스크 와이프**로 열린다
  ── 하드컷 ──
  B 오프너    7.0-13.0  번호·괘선·헤드라인이 순차로 선다
  ── 세로 와이프 ──
  C 개념도   13.0-23.0  삽입 → 걸림 → 고정. 레일이 따라 켜진다
  ── 사각 리빌 ──
  D 표       23.0-30.0  먹에서 **지면으로 톤이 뒤집힌다**. 표가 행 단위로 그려진다

정확히 900프레임(30.000초). 1080×1920 / 30fps CFR / 무음.

사용:
  PYTHONIOENCODING=utf-8 python pilot.py --chunk 0      # 0~2, 300프레임씩
  PYTHONIOENCODING=utf-8 python pilot.py --join         # 청크를 이어 붙인다
  PYTHONIOENCODING=utf-8 python pilot.py --stills 2,9,17,25
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
                  CHAR, INK, WHITE, NOIR, PAPER, clamp01, p, eo, eio, vis)
import thread_dia as td
from liv_video.encode import encode_range

TOTAL = 900                      # 30.000초
CHUNKS = 3
CHUNK_FRAMES = TOTAL // CHUNKS
SCENES = os.path.join(EDIT, "scenes_out")
STILLS = os.path.join(EDIT, "stills", "pilot")

DIM = (206, 196, 189)
DIM_P = (104, 92, 84)


# ================================================================ 움직임 도구
def rise(t, t0, d=0.6, px=26):
    """등장 — 페이드 + 아래에서 살짝 올라옴. (alpha, dy)"""
    r = eo(p(t, t0, d))
    return r, int((1.0 - r) * px)


def draw_rule(img, x, y, w, t, t0, d=0.7, tone="noir", weight=2):
    """괘선이 좌에서 우로 그어진다. 나타나는 게 아니라 **그어져야** 한다."""
    L.hline(img, x, y, w * eo(p(t, t0, d)), 1.0, weight=weight, tone=tone)


def draw_accent(img, x, y, w, t, t0, d=0.5, weight=6):
    L.accent(img, x, y, w * eo(p(t, t0, d)), 1.0, weight)


# ================================================================ 전환
def hard_cut(prev, nxt, prog):
    """하드컷 — 섞지 않는다. 전환 구간이 0이므로 실제로는 호출되지 않는다."""
    return nxt


def wipe_down(prev, nxt, prog):
    """위에서 아래로 내려오는 경계. 경계선에 로즈 한 줄을 얹어 '잘린다'를 보이게 한다."""
    y = int(round(clamp01(prog) * (H + 8)))
    out = prev.copy()
    if y > 0:
        out.paste(nxt.crop((0, 0, W, min(H, y))), (0, 0))
    if 0 < y < H:
        L.rect(out, 0, max(0, y - 6), W, 6, ROSE)
    return out


def wipe_right(prev, nxt, prog):
    """왼쪽에서 오른쪽으로 밀고 들어온다."""
    x = int(round(clamp01(prog) * (W + 8)))
    out = prev.copy()
    if x > 0:
        out.paste(nxt.crop((0, 0, min(W, x), H)), (0, 0))
    if 0 < x < W:
        L.rect(out, max(0, x - 6), 0, 6, H, ROSE)
    return out


REVEAL_RECT = (SAFE, bl(60), W - SAFE, bl(86))


def reveal_box(prev, nxt, prog):
    """작은 사각형에서 화면 전체로 퍼지는 하드 엣지 마스크.

    `liv_video.anim.reveal` 과 달리 모서리를 둥글리지 않는다 — 이번 룩은
    둥근 모서리를 쓰지 않기로 했고, 전환에서만 둥글면 그 한 번이 튄다.
    """
    q = eio(clamp01(prog))
    x0, y0, x1, y1 = REVEAL_RECT
    cx0 = int(x0 + (0 - x0) * q)
    cy0 = int(y0 + (0 - y0) * q)
    cx1 = int(x1 + (W - x1) * q)
    cy1 = int(y1 + (H - y1) * q)
    out = prev.copy()
    if cx1 > cx0 and cy1 > cy0:
        out.paste(nxt.crop((cx0, cy0, cx1, cy1)), (cx0, cy0))
        if q < 0.995:
            d = ImageDraw.Draw(out)
            d.rectangle([cx0, cy0, cx1 - 1, cy1 - 1], outline=tuple(ROSE), width=5)
    return out


# ================================================================ A 훅
A_DUR = 6.0
BAND_Y, BAND_H = bl(46), 468


def a_hook(tl):
    """실 매크로가 가로 마스크로 열리고, 훅 두 줄이 선다."""
    img = L.field("noir", plate="BG01", prog=tl / (A_DUR + 2.0), dim=0.48,
                  z0=1.02, z1=1.02 + max(0.17, L_KB * (A_DUR + 2.0)))

    # 띠가 좌에서 우로 열린다. 알파를 깎지 않고 **잘라서** 붙인다 —
    # 페이드로 열면 '밝아진다'가 되고, 잘라서 열어야 '드러난다'가 된다.
    band = L.macro_band("P01T", W, BAND_H, 104, 50)
    open_w = int(W * eo(p(tl, 0.10, 1.15)))
    if open_w > 2:
        img.alpha_composite(band.crop((0, 0, open_w, BAND_H)), (0, BAND_Y))
        L.rect(img, 0, BAND_Y, open_w, 2, (74, 62, 56))
        L.rect(img, 0, BAND_Y + BAND_H - 2, open_w, 2, (74, 62, 56))
        if open_w < W:
            L.rect(img, open_w - 5, BAND_Y, 5, BAND_H, ROSE)

    cap_y = BAND_Y + BAND_H + bl(4)
    ca = eo(p(tl, 1.25, 0.55))
    L.caption(img, "APTOS VISAGE · 실 표면", col(0)[0], cap_y, ca, "noir", 32)
    L.note(img, "제품 이미지", ca, y=cap_y)

    x, cw = col(0, 12)
    y = BAND_Y + BAND_H + bl(12)
    draw_rule(img, x, y, cw, tl, 1.45, 0.75)
    a1, d1 = rise(tl, 1.70, 0.65)
    L.T(img, "실은 당기지 않습니다", x, y + bl(5) + d1, "pl-b", 84, OFFW, "l", a1, -0.01)
    a2, d2 = rise(tl, 2.65, 0.65)
    L.T(img, "겁니다", x, y + bl(14) + d2, "pl-b", 84, ROSE_T, "l", a2, -0.01)
    L.chrome(img, "noir")
    return img


# ================================================================ B 오프너
B_DUR = 5.5


def b_opener(tl):
    """번호 → 괘선 → 키커 → 헤드라인 순서로 선다."""
    img = L.field("noir", plate="BG03", prog=tl / (B_DUR + 2.0), dim=0.66,
                  z0=1.03, z1=1.03 + max(0.17, L_KB * (B_DUR + 2.0)))
    x, cw = col(0, 12)

    na, nd = rise(tl, -0.28, 0.5, 18)
    L.numeral(img, "02", x - 8, bl(23) + nd, na, 180, ROSE_D)
    draw_rule(img, x + 236, bl(29), cw - 236, tl, -0.18, 0.6)
    ka, _ = rise(tl, 0.10, 0.4, 0)
    L.kicker(img, "How it works", x + 236, bl(31), ka, ROSE_T, 38)

    ha, hd = rise(tl, 0.28, 0.55, 30)
    L.HEAD(img, "실이 하는 일", x, bl(40) + hd, 116, OFFW, "l", ha)
    sa, sd = rise(tl, 0.62, 0.55, 22)
    L.SUB(img, "돌기가 조직을 걸어 그 자리에 둡니다", x, bl(53) + sd, 56,
          fill=DIM, alpha=sa, maxw=cw)

    draw_rule(img, x, bl(70), cw, tl, 1.10, 0.7)
    for i, (num, label) in enumerate((("01", "실이 들어갑니다"),
                                      ("02", "돌기가 조직을 겁니다"),
                                      ("03", "걸린 채 고정됩니다"))):
        a, dy = rise(tl, 1.35 + i * 0.18, 0.5, 20)
        yy = bl(76) + i * bl(9)
        L.T(img, num, x, yy + dy, "cg-m", 40, ROSE_D, "l", a, 0.12)
        L.T(img, label, x + 96, yy + dy - 2, "m", 44, OFFW, "l", a, 0.02)
    L.chrome(img, "noir")
    return img


# ================================================================ C 개념도
C_DUR = 11.0
C_SEG = C_DUR / 3.0
C_BOX = (-80, bl(44), W + 80, bl(92))
C_STAGES = (("insert", "실이 들어갑니다"),
            ("engage", "돌기가 조직을 겁니다"),
            ("fix", "걸린 채 고정됩니다"))


def c_diagram(tl):
    """삽입 → 걸림 → 고정. 단계마다 제목이 바뀌고 레일이 옮겨 붙는다."""
    img = L.field("noir", plate="BG05", prog=tl / (C_DUR + 2.0), dim=0.76,
                  z0=1.02, z1=1.02 + max(0.17, L_KB * (C_DUR + 2.0)))
    x, cw = col(0, 12)

    k = max(0, min(2, int(tl / C_SEG)))
    stage, label = C_STAGES[k]
    tk = tl - k * C_SEG
    td.draw(img, C_BOX, stage, clamp01(tk / (C_SEG * 0.78)))

    L.kicker(img, "How it works", x, bl(24), eo(p(tl, 0.1, 0.5)), ROSE_T, 34,
             rule_w=int(180 * eo(p(tl, 0.0, 0.6))))
    # 제목은 단계 경계에서 갈아 끼운다 — 이전 것이 나가고 새 것이 들어온다.
    a, dy = rise(tk, 0.15, 0.55, 24)
    a *= 1.0 - eio(p(tk, C_SEG - 0.45, 0.4)) if k < 2 else 1.0
    L.HEAD(img, label, x, bl(30) + dy, 92, OFFW, "l", a)

    # 지시선은 마지막 단계에서만. 매 단계 그리면 화면이 어지럽다.
    if k == 2:
        ca = eo(p(tk, 0.5, 0.7))
        ax, ay = td.barb_anchor(C_BOX, 2)
        L.callout(img, "돌기", (ax, ay), (ax + 96, ay - bl(9)), ca, "noir", "r",
                  38, "실 표면에 세워진 갈고리")
        bx, by = td.barb_anchor(C_BOX, 5)
        L.callout(img, "걸림점", (bx, by), (bx - 104, by + bl(9)), ca, "noir",
                  "l", 38, "조직이 붙잡히는 자리")

    draw_rule(img, x, bl(98), cw, tl, 0.3, 0.8)
    L.rail(img, [s[1] for s in C_STAGES], x, bl(104), k, eo(p(tl, 0.5, 0.6)))
    L.note(img, "개념도", eo(p(tl, 0.4, 0.6)))
    L.chrome(img, "noir")
    return img


# ================================================================ D 표
D_DUR = 7.5
LINEUP = (
    ("압토스 Light Lift 25", "볼", "Light Lift"),
    ("압토스 NAMICA 19", "중안부 · 하안부", "NAMICA"),
    ("압토스 Light Lift 50", "이중턱", "Light Lift"),
)
CERTS = (("KFDA", "의료기기 4등급"), ("CE", "유럽 인증"),
         ("ISO", "13485"), ("FDA", "MDSAP"))


def d_table(tl):
    """먹에서 지면으로 톤이 뒤집힌 뒤, 표가 행 단위로 그려진다."""
    img = L.field("paper", plate="BG06", prog=tl / (D_DUR + 2.0), dim=0.02,
                  z0=1.04, z1=1.04 + max(0.17, L_KB * (D_DUR + 2.0)))
    x, cw = col(0, 12)

    na, nd = rise(tl, 0.1, 0.7, 16)
    L.numeral(img, "04", x - 8, bl(23) + nd, na * 0.92, 150, (214, 190, 178))
    draw_rule(img, x + 200, bl(28), cw - 200, tl, 0.35, 0.8, "paper")
    L.kicker(img, "Line up", x + 200, bl(30), eo(p(tl, 0.55, 0.5)), BROWN, 34)

    ha, hd = rise(tl, 0.8, 0.7, 26)
    L.HEAD(img, "라인업과 적용 부위", x, bl(39) + hd, 96, INK, "l", ha)
    sa, sd = rise(tl, 1.2, 0.7, 20)
    L.SUB(img, "부위에 따라 굵기와 길이가 다른 실을 씁니다", x, bl(51) + sd, 54,
          fill=DIM_P, alpha=sa, maxw=cw, key="r")

    L.table(img, LINEUP, x, bl(60), [470, 300, 166], 1.0, "paper", rowh=bl(11),
            head=("제품", "적용 부위", "계열"), keys=["m", "r", "m"],
            sizes=[46, 42, 34], stagger=0.30, t=tl, t0=1.7)

    ca = eo(p(tl, 3.3, 0.6))
    L.caption(img, "CERTIFICATION", x, bl(102), ca, "paper", 30)
    draw_rule(img, x, bl(106), cw, tl, 3.4, 0.7, "paper")
    L.items_row(img, CERTS, x, bl(110), cw, 1.0, "paper",
                stagger=0.16, t=tl, t0=3.6)
    draw_rule(img, x, bl(122), cw, tl, 4.5, 0.7, "paper")
    fa, fd = rise(tl, 4.7, 0.7, 22)
    L.T(img, "100개국 이상 사용", x, bl(126) + fd, "pl-b", 64, INK, "l", fa, -0.01)
    L.chrome(img, "paper")
    return img


# ================================================================ 조립
L_KB = 0.009                     # 켄번즈 최저 속도. 이보다 느리면 freezedetect 가 문다

BLOCKS = [
    dict(id="A", start=0.0,  dur=A_DUR, fn=a_hook,    trans=None,        tdur=0.0),
    dict(id="B", start=6.0,  dur=B_DUR, fn=b_opener,  trans=hard_cut,    tdur=0.0),
    dict(id="C", start=11.5, dur=C_DUR, fn=c_diagram, trans=wipe_down,   tdur=0.55),
    dict(id="D", start=22.5, dur=D_DUR, fn=d_table,   trans=reveal_box,  tdur=0.80),
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
    # 전환 구간이면 앞 블록을 **계속 돌린 채로** 합성한다. 앞 블록을 마지막
    # 프레임에 얼려 두면 그 0.8초가 정지 구간으로 잡힌다(인계문 §7-3).
    if k > 0 and b["tdur"] > 0:
        dt = t - b["start"]
        if dt < b["tdur"]:
            prev = BLOCKS[k - 1]
            under = prev["fn"](t - prev["start"])
            img = b["trans"](under, img, dt / b["tdur"])
    return img.convert("RGB")


# ================================================================ CLI
def _join(paths, out):
    lst = os.path.join(SCENES, "_join.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for p_ in paths:
            f.write("file '%s'\n" % p_.replace("\\", "/"))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", lst, "-c", "copy", "-movflags", "+faststart", out],
                   check=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunk", type=int, default=None)
    ap.add_argument("--join", action="store_true")
    ap.add_argument("--stills", default=None, help="초 단위, 쉼표 구분")
    a = ap.parse_args()
    os.makedirs(SCENES, exist_ok=True)

    if a.stills:
        os.makedirs(STILLS, exist_ok=True)
        for s in a.stills.split(","):
            sec = float(s)
            img = render_frame(int(round(sec * FPS)))
            path = os.path.join(STILLS, "t%05.1f.png" % sec)
            img.save(path)
            print("%.1fs -> %s" % (sec, path))
        return

    if a.join:
        parts = [os.path.join(SCENES, "P%02d.mp4" % k) for k in range(CHUNKS)]
        miss = [p_ for p_ in parts if not os.path.isfile(p_)]
        if miss:
            raise SystemExit("청크가 없다: %s" % ", ".join(os.path.basename(m) for m in miss))
        out = os.path.join(os.path.dirname(EDIT), "pilot_30s.mp4")
        print("->", _join(parts, out))
        return

    if a.chunk is None:
        raise SystemExit("--chunk 0..%d / --join / --stills 중 하나를 줘야 한다" % (CHUNKS - 1))
    k = a.chunk
    first, last = k * CHUNK_FRAMES, (k + 1) * CHUNK_FRAMES
    out = os.path.join(SCENES, "P%02d.mp4" % k)
    encode_range(render_frame, first, last, out, crf=12, preset="medium")
    print("청크 %d (%d~%d) -> %s" % (k, first, last, out))


if __name__ == "__main__":
    main()
