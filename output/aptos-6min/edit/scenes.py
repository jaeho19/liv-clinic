# -*- coding: utf-8 -*-
"""룩 확정용 대표 장면. 1단계 — 정지 이미지로만 판단한다.

인계문 §8: 6분을 다 만든 뒤에야 눈으로 볼 수 있었던 것이 이전 실패의 원인이다.
그래서 조판·톤·그리드를 **정지 이미지 5장**으로 먼저 확정하고, 승인된 뒤에
30초 파일럿(움직임·전환), 그 다음 6분 전체로 간다.

다섯 장이 덮는 것:
  S1 섹션 오프너   — 번호·영문 키커·한글 헤드라인·제품 매크로 띠 (NOIR)
  S2 개념도        — 실 메커니즘을 화면 가득, 지시선과 단계 레일 (NOIR)
  S3 실사 블록     — 사진 전면 + 먹 띠, 인증 번호 조판 (PHOTO + NOIR)
  S4 표            — 라인업·적용 부위를 괘선 표로 (PAPER, 밝은 필드)
  S5 마무리        — QR 고정면 (PHOTO)

문구는 전부 설계서 §4 를 통과하는 것만 쓴다(`copy_guard.py` 로 검사).

사용:
  PYTHONIOENCODING=utf-8 python scenes.py            # 5장 전부
  PYTHONIOENCODING=utf-8 python scenes.py --only s2  # 한 장만
  PYTHONIOENCODING=utf-8 python scenes.py --guides   # 그리드 오버레이
"""
import argparse
import os
import sys

from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import look as L
from look import (W, H, SAFE, bl, col, ROSE, ROSE_T, ROSE_D, BROWN, OFFW, CHAR,
                  INK, CREAM, WHITE, NOIR, NOIR_2, PAPER)
import thread_dia as td

OUT = os.path.join(EDIT, "stills")

DIM = (206, 196, 189)           # 먹 위 보조 본문
DIM_P = (104, 92, 84)           # 지면 위 보조 본문


# ---------------------------------------------------------------- S1 오프너
def s1_opener(t=3.0):
    """섹션 오프너 — `02 / HOW IT WORKS / 실이 하는 일`.

    이전 영상의 섹션 시작은 중앙 정렬 제목 한 줄이 전부였다. 여기서는
    세리프 번호(180px) · 영문 키커 · 한글 헤드라인(116px) · 제품 매크로 띠를
    좌측 정렬 그리드에 세운다. 타이포 스케일이 30~180px 로 벌어진다.
    """
    img = L.field("noir", plate="BG01", prog=0.25, dim=0.58)
    x, cw = col(0, 12)

    # 큰 세리프 번호 — 배경에 눕혀 두고, 그 오른쪽에 키커를 붙인다.
    L.numeral(img, "02", x - 8, bl(23), 1.0, 180, ROSE_D)
    L.hline(img, x + 236, bl(29), cw - 236)
    L.kicker(img, "How it works", x + 236, bl(31), 1.0, ROSE_T, 38)

    L.HEAD(img, "실이 하는 일", x, bl(40), 116)
    L.SUB(img, "돌기가 조직을 걸어 그 자리에 둡니다", x, bl(53), 56, fill=DIM,
          maxw=cw)

    # 제품 매크로 띠 — 전면. 둥근 모서리도 테두리도 없다.
    band_y, band_h = bl(62), 468
    img.alpha_composite(L.macro_band("P01T", W, band_h, 104, 50), (0, band_y))
    L.rect(img, 0, band_y, W, 2, (74, 62, 56))
    L.rect(img, 0, band_y + band_h - 2, W, 2, (74, 62, 56))
    cap_y = band_y + band_h + bl(4)
    L.caption(img, "APTOS VISAGE · 실 표면", x, cap_y, 1.0, "noir", 32, maxw=cw)
    # 이 띠는 **생성 이미지**다(실물 사진을 참조해 GPT Image 2.5 로 다시 그렸다).
    # 그래서 "실물 사진"으로 표기하지 않는다 — 실촬영으로 오인시키면 안 된다.
    L.note(img, "제품 이미지", y=cap_y)

    # 띠 아래 — 훅 두 줄로 받는다. 빈 먹을 400px 씩 남기지 않는다.
    # 문구는 ②편에서 사장님 확인을 거친 원문 그대로 쓴다.
    y = band_y + band_h + bl(12)
    L.hline(img, x, y, cw)
    L.T(img, "실은 당기지 않습니다", x, y + bl(5), "pl-b", 84, OFFW, "l", 1.0, -0.01)
    L.T(img, "겁니다", x, y + bl(14), "pl-b", 84, ROSE_T, "l", 1.0, -0.01)
    L.chrome(img, "noir")
    return img


# ---------------------------------------------------------------- S2 개념도
def s2_diagram(t=8.0):
    """개념도 — 화면을 채운 실 메커니즘.

    §4-③ 에 따라 의료 내용은 전부 코드로 그린다. 이전 도해는 상자 안에
    작게 들어 있었고 가로줄 위 곡선 하나로 읽혔다. 여기서는 좌우로 화면을
    넘겨 흘리고, 돌기 하나에 지시선을 건다.
    """
    img = L.field("noir", plate="BG05", prog=0.4, dim=0.74)
    x, cw = col(0, 12)

    L.kicker(img, "How it works", x, bl(24), 1.0, ROSE_T, 34, rule_w=180)
    L.HEAD(img, "돌기가 조직을 겁니다", x, bl(30), 92)

    box = (-80, bl(44), W + 80, bl(92))
    td.draw(img, box, "engage", 1.0)

    # 지시선 — 브래킷 대신. 앵커는 실제 돌기 끝 좌표에서 가져온다.
    # 라벨은 앵커 가까이 둔다. 화면을 가로지르는 긴 사선은 지저분하다.
    ax, ay = td.barb_anchor(box, 2)
    L.callout(img, "돌기", (ax, ay), (ax + 96, ay - bl(9)), 1.0, "noir", "r", 38,
              "실 표면에 세워진 갈고리")
    # 아래쪽 라벨은 왼쪽으로 뺀다 — 오른쪽으로 두면 안전영역 밖으로 나간다.
    bx, by = td.barb_anchor(box, 5)
    L.callout(img, "걸림점", (bx, by), (bx - 104, by + bl(9)), 1.0, "noir", "l",
              38, "조직이 붙잡히는 자리")

    L.hline(img, x, bl(98), cw)
    L.rail(img, ["실이 들어갑니다", "돌기가 조직을 겁니다", "걸린 채 고정됩니다"],
           x, bl(104), 1)
    L.note(img, "개념도")
    L.chrome(img, "noir")
    return img


# ---------------------------------------------------------------- S3 실사
def s3_evidence(t=4.0):
    """실사 블록 — 본사 인증서 수여식 전면 + 먹 띠 위 번호 조판.

    증거는 사진이어야 한다(§4-④). 사진은 전면으로 쓰고 하드 엣지로 자른다.
    아래 먹 띠에서 번호를 세워 문서를 확대하지 않고도 읽힌다.
    """
    img = L.field("noir")
    x, cw = col(0, 12)

    cut = bl(86)
    ph = L.photo_field("A02", 0.35, 1.04, 1.18, 0.5, 0.66, 0.5, 0.70, dim=0.10)
    img.alpha_composite(ph.crop((0, 0, W, cut)), (0, 0))
    L.scrim(img, top=190)
    L.rect(img, 0, cut - 2, W, 2, (68, 56, 50))

    L.numeral(img, "06", x - 8, bl(23), 0.92, 150, (238, 218, 208))
    L.hline(img, x + 200, bl(28), cw - 200, 0.9)
    L.kicker(img, "Who does it", x + 200, bl(30), 1.0, (242, 226, 217), 34)

    L.HEAD(img, "김수영 대표원장", x, cut + bl(7), 88)
    L.SUB(img, "조지아 APTOS 본사 인증서 수여", x, cut + bl(19), 54, fill=DIM,
          maxw=cw, key="r")

    L.hline(img, x, cut + bl(28), cw)
    L.caption(img, "APTOS PROFESSIONAL COURSE", x, cut + bl(32), 1.0, "noir", 30)
    L.caption(img, "CERTIFICATE NO.", x, cut + bl(38), 1.0, "noir", 30)
    # 번호는 세리프로 두지 않는다 — Cormorant 의 기본 숫자는 올드스타일이라
    # 0 과 6 의 높이가 달라 공식 번호가 날짜처럼 읽힌다(실측). 산세리프 + 넓은
    # 자간이 증빙 번호답다.
    L.T(img, "KR0062025", x + cw, cut + bl(34), "sb", 84, OFFW, "r", 1.0, 0.06)
    L.chrome(img, "noir")
    return img


# ---------------------------------------------------------------- S4 표
LINEUP = (
    ("압토스 Light Lift 25", "볼", "Light Lift"),
    ("압토스 NAMICA 19", "중안부 · 하안부", "NAMICA"),
    ("압토스 Light Lift 50", "이중턱", "Light Lift"),
)
CERTS = (("KFDA", "의료기기 4등급"), ("CE", "유럽 인증"),
         ("ISO", "13485"), ("FDA", "MDSAP"))


def s4_table(t=6.0):
    """라인업 표 — 밝은 필드.

    톤 교대의 절반이 이 화면이다. 이전 영상에는 밝은 면이 아예 없었고
    로즈~브라운 중간톤만 있어서 대비가 안 살았다(§3-5). 카드 대신 괘선으로
    짜고, 크롬은 먹색 변형으로 바꾼다.
    """
    img = L.field("paper", plate="BG06", prog=0.3, dim=0.02,
                  z0=1.04, z1=1.14)
    x, cw = col(0, 12)

    L.numeral(img, "04", x - 8, bl(23), 0.92, 150, (214, 190, 178))
    L.hline(img, x + 200, bl(28), cw - 200, 1.0, tone="paper")
    L.kicker(img, "Line up", x + 200, bl(30), 1.0, BROWN, 34)

    L.HEAD(img, "라인업과 적용 부위", x, bl(39), 96, INK)
    L.SUB(img, "부위에 따라 굵기와 길이가 다른 실을 씁니다", x, bl(51), 54,
          fill=DIM_P, maxw=cw, key="r")

    L.table(img, LINEUP, x, bl(60), [470, 300, 166], 1.0, "paper", rowh=bl(11),
            head=("제품", "적용 부위", "계열"),
            keys=["m", "r", "m"], sizes=[46, 42, 34])

    # 인증은 긴 한 줄이 아니라 열로 세운다 — 한 줄로 늘어놓으면 자간 때문에
    # 안전영역을 넘고, 카드 네 장으로 쪼개면 이전 영상의 카드 문법이 된다.
    L.caption(img, "CERTIFICATION", x, bl(102), 1.0, "paper", 30)
    L.hline(img, x, bl(106), cw, 1.0, tone="paper")
    L.items_row(img, CERTS, x, bl(110), cw, 1.0, "paper")
    L.hline(img, x, bl(122), cw, 1.0, tone="paper")
    L.T(img, "100개국 이상 사용", x, bl(126), "pl-b", 64, INK, "l", 1.0, -0.01)
    L.chrome(img, "paper")
    return img


# ---------------------------------------------------------------- S5 마무리
def s5_outro(t=6.0):
    """마무리 — QR 고정면. 카드가 아니라 하드 엣지 흰 판이다."""
    img = L.photo_field("I03", 0.4, 1.10, 1.22, 0.46, 0.5, 0.54, 0.5,
                        dim=0.70, blur=22)
    L.scrim(img, top=170, bottom=230)
    x, cw = col(0, 12)

    L.kicker(img, "Consultation", x, bl(27), 1.0, ROSE_T, 34, rule_w=180)
    L.HEAD(img, "압토스 실리프팅 상담", x, bl(33), 92, OFFW, shadow=150)

    qs = 372
    qr = L.asset("qr").convert("RGBA").resize((qs, qs), Image.NEAREST)
    qx, qy = x, bl(48)
    L.rect(img, qx - 20, qy - 20, qs + 40, qs + 40, WHITE)
    img.alpha_composite(qr, (qx, qy))

    tx = qx + qs + bl(7)
    L.caption(img, "SCAN", tx, qy + bl(1), 1.0, "noir", 30)
    L.T(img, "예약 · 상담", tx, qy + bl(6), "pl-b", 68, OFFW, "l", 1.0, 0.0,
        shadow=150)
    L.hline(img, tx, qy + bl(16), cw - (tx - x))
    L.SUB(img, "liv-clinic.net", tx, qy + bl(19), 54, fill=ROSE_T, key="r",
          maxw=cw - (tx - x), shadow=140)

    L.hline(img, x, bl(92), cw)
    L.T(img, L.CLINIC, x, bl(97), "pl-b", 92, OFFW, "l", 1.0, -0.01, shadow=150)
    L.SUB(img, "서울 서초구 나루터로 80 자은빌딩 4층", x, bl(110), 54, fill=DIM,
          key="r", maxw=cw, shadow=140)
    L.SUB(img, "지하철 3호선 신사역 3번 출구", x, bl(118), 54, fill=DIM, key="r",
          maxw=cw, shadow=140)
    L.chrome(img, "noir")
    return img


SCENES = {"s1": s1_opener, "s2": s2_diagram, "s3": s3_evidence,
          "s4": s4_table, "s5": s5_outro}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--guides", action="store_true")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    keys = [a.only] if a.only else list(SCENES)
    for k in keys:
        img = SCENES[k]()
        if a.guides:
            L.guides(img)
        path = os.path.join(a.out, "%s.png" % k)
        img.convert("RGB").save(path)
        print("%s -> %s" % (k, path))


if __name__ == "__main__":
    main()
