# -*- coding: utf-8 -*-
"""3편 공통 규격 검사. 모듈이 생기는 대로 MODULES 에 추가된다."""
import importlib
import os
import sys

import numpy as np
import pytest
from PIL import Image

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

EXPECTED = {"video_thread": 7200, "video_georgia": 5400, "video_map": 5400}
MODULES = [m for m in EXPECTED if os.path.exists(os.path.join(EDIT, m + ".py"))]
pytestmark = pytest.mark.skipif(not MODULES, reason="아직 편 모듈이 없다")

ROSE = np.array([180, 152, 141])


@pytest.fixture(scope="module", params=MODULES)
def mod(request):
    return importlib.import_module(request.param), request.param


def test_total_frames_exact(mod):
    m, name = mod
    assert m.TOTAL_FRAMES == EXPECTED[name]


def test_blocks_are_contiguous_and_sum_to_length(mod):
    m, name = mod
    total = EXPECTED[name] / 30.0
    t = 0.0
    for b in m.BLOCKS:
        assert abs(b["start"] - t) < 1e-6, "%s 블록이 이어지지 않는다: %s" % (name, b["id"])
        t += b["dur"]
    assert abs(t - total) < 1e-6, "%s 합계가 %.3f (기대 %.3f)" % (name, t, total)


@pytest.mark.parametrize("frac", [0.0, 0.13, 0.37, 0.52, 0.71, 0.88, 0.999])
def test_chrome_present_in_every_sampled_frame(mod, frac):
    m, name = mod
    i = int((EXPECTED[name] - 1) * frac)
    arr = np.asarray(m.render_frame(i).convert("RGB")).astype(float)
    pill = arr[1795:1812, 78:101].reshape(-1, 3).mean(axis=0)
    assert np.abs(pill - ROSE).max() < 42, \
        "%s f%d 하단 '이 건물 4층' 필이 없다 (%s)" % (name, i, pill.round())
    lum = arr @ np.array([0.2126, 0.7152, 0.0722])
    assert lum[84:142, 72:319].max() > 170, "%s f%d 상단 로고가 없다" % (name, i)
    assert lum[86:146, 700:1010].max() > 170, "%s f%d 상단 병원명이 없다" % (name, i)
    assert lum.mean() > 18, "%s f%d 이 사실상 검은 프레임이다" % (name, i)


def test_frame_size_and_mode(mod):
    m, name = mod
    img = m.render_frame(0)
    assert img.size == (1080, 1920)
    assert img.mode == "RGB"


def test_last_12s_qr_region_is_static(mod):
    """마지막 12초 동안 QR 카드 영역이 완전히 고정되어야 한다."""
    m, name = mod
    n = EXPECTED[name]
    a = np.asarray(m.render_frame(n - 300).convert("RGB")).astype(int)
    b = np.asarray(m.render_frame(n - 5).convert("RGB")).astype(int)
    region = (slice(560, 1460), slice(72, 1008))
    assert np.abs(a[region] - b[region]).max() == 0, "%s QR 영역이 움직인다" % name


def test_no_banned_copy_in_module(mod):
    import copy_guard as cg
    m, name = mod
    hits = cg.find_banned(cg.collect_strings([os.path.join(EDIT, name + ".py")]))
    assert hits == [], "금지 표현: %s" % hits
