# -*- coding: utf-8 -*-
"""블록별 움직임을 **렌더 없이** 바로 잰다.

`verify_film.py` 는 완성된 mp4 를 읽는다. 그건 최종 판정용으로 맞지만, 한 블록의
감광을 고쳐 보는 데 3분 렌더 + 인코딩 + 20초 검수를 매번 돌릴 수는 없다.
여기서는 `film.render_frame` 을 직접 불러 프레임을 만들고 같은 자(108×192
그레이스케일, 프레임 간 절대차 평균)로 잰다.

인코딩을 거치지 않으므로 최종값과 완전히 같지는 않다(CRF 12 는 거의 무손실이라
차이는 작다). **판정은 verify_film 이 한다.** 이건 고치는 동안 쓰는 자다.

사용:
  PYTHONIOENCODING=utf-8 python probe_motion.py            # 전 블록
  PYTHONIOENCODING=utf-8 python probe_motion.py F2 Y2 D2   # 지정 블록만
  PYTHONIOENCODING=utf-8 python probe_motion.py --step 3   # 빠르지만 과소평가
"""
import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import film as F                                     # noqa: E402
from look import FPS                                 # noqa: E402

MW, MH = 108, 192


def _measure(args):
    bid, step = args
    b = next(x for x in F.BLOCKS if x["id"] == bid)
    i0 = int(round(b["start"] * FPS))
    i1 = int(round((b["start"] + b["dur"]) * FPS))
    skip = int(round(b["tdur"] * FPS))
    prev, diffs = None, []
    for i in range(i0 + skip, i1, step):
        a = np.asarray(F.render_frame(i).convert("L").resize((MW, MH),
                                                             Image.BILINEAR),
                       np.int16)
        if prev is not None:
            # step 프레임 건너뛰고 쟀으므로 1프레임 간격으로 환산한다.
            diffs.append(float(np.abs(a - prev).mean()) / step)
        prev = a
    return bid, b["tier"], float(np.median(diffs)), F.TIER_FLOOR.get(b["tier"], 0.0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    # step 을 키우면 **실제보다 낮게** 나온다(실측: E2 가 step1 0.275,
    # step3 0.205). 부드러운 움직임은 프레임 간격을 벌려도 차이가 비례해서
    # 커지지 않기 때문이다. 기본은 1 로 두고, 급할 때만 키운다.
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--jobs", type=int, default=8)
    a = ap.parse_args()
    ids = a.ids or [b["id"] for b in F.BLOCKS]
    rows = []
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        for r in ex.map(_measure, [(i, a.step) for i in ids]):
            rows.append(r)
    print("  %-4s %-7s %8s %8s  %s" % ("id", "계층", "중앙값", "목표", "판정"))
    bad = 0
    for bid, tier, med, target in rows:
        ok = med >= target
        bad += 0 if ok else 1
        print("  %-4s %-7s %8.3f %8.2f  %s"
              % (bid, tier, med, target, "OK" if ok else "미달"))
    allm = float(np.median([r[2] for r in rows]))
    print("  블록 중앙값의 중앙값 %.3f   미달 %d개" % (allm, bad))


if __name__ == "__main__":
    main()
