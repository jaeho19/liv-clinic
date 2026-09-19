# -*- coding: utf-8 -*-
import os
import sys

import numpy as np
from PIL import Image

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)
from liv_video.spec import set_dirs                                  # noqa: E402
set_dirs(os.path.join(OUTPUT, "lifting-city", "edit", "fonts"),
         os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))
import particle_anim as pa                                           # noqa: E402

BOX = (90, 560, 990, 1320)
DUR = 35.0


def test_three_size_classes_defined():
    names = [s[0] for s in pa.SIZES]
    assert names == ["micro", "submicro", "nano"]
    radii = [s[1] for s in pa.SIZES]
    assert radii == sorted(radii, reverse=True), "마이크로가 가장 커야 한다"


def test_release_order_is_micro_then_submicro_then_nano():
    early = pa.active_counts(DUR * 0.10, DUR)
    mid = pa.active_counts(DUR * 0.50, DUR)
    late = pa.active_counts(DUR * 0.95, DUR)
    assert early["micro"] > 0 and early["submicro"] == 0 and early["nano"] == 0
    assert mid["submicro"] > 0 and mid["nano"] == 0
    assert late["nano"] > 0
    assert late["micro"] >= mid["micro"] >= early["micro"]


def test_counts_never_decrease():
    prev = {k: 0 for k, _, _ in pa.SIZES}
    for i in range(0, 36):
        cur = pa.active_counts(float(i), DUR)
        for k in prev:
            assert cur[k] >= prev[k], "%s 입자 수가 줄었다 (t=%d)" % (k, i)
        prev = cur


def test_draw_fills_more_area_over_time():
    def painted(t):
        img = Image.new("RGB", (1080, 1920), (18, 14, 12))
        pa.draw_release(img, BOX, t, DUR)
        arr = np.asarray(img).astype(int)
        return int((np.abs(arr - np.array([18, 14, 12])).sum(axis=2) > 10).sum())

    a, b, c = painted(2.0), painted(18.0), painted(34.0)
    assert a < b < c, "시간이 갈수록 칠해진 면적이 늘어야 한다 (%d/%d/%d)" % (a, b, c)


def test_particles_stay_inside_box():
    img = Image.new("RGB", (1080, 1920), (0, 0, 0))
    pa.draw_release(img, BOX, DUR, DUR)
    arr = np.asarray(img).sum(axis=2)
    outside = arr.copy()
    outside[BOX[1]:BOX[3], BOX[0]:BOX[2]] = 0
    assert outside.max() == 0, "입자가 지정 영역 밖으로 나갔다"


def test_draw_release_is_deterministic_for_same_seed():
    # 태스크 8이 이 영상을 8개 청크로 나눠 병렬 프로세스로 렌더한 뒤 이어 붙인다.
    # 같은 seed·t가 프로세스마다 다르게 나오면 청크 경계에서 입자가 튀는
    # 결함이 생기고, 자동 검수는 이를 잡지 못한다.
    def render(seed):
        img = Image.new("RGB", (1080, 1920), (18, 14, 12))
        pa.draw_release(img, BOX, 20.0, DUR, seed=seed)
        return np.asarray(img)

    a1 = render(7)
    a2 = render(7)
    assert np.array_equal(a1, a2), "같은 seed·t인데 픽셀이 달라졌다"

    a3 = render(99)
    assert not np.array_equal(a1, a3), "seed를 바꿔도 결과가 같다 (테스트가 무의미해짐)"
