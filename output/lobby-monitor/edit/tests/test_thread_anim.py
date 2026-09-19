# -*- coding: utf-8 -*-
import os
import sys

import numpy as np
import pytest
from PIL import Image

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

from liv_video.spec import set_dirs                                  # noqa: E402
set_dirs(os.path.join(OUTPUT, "lifting-city", "edit", "fonts"),
         os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))

import thread_anim as ta                                             # noqa: E402

BOX = (100, 600, 980, 1200)


def test_barbs_are_ordered_and_counted():
    pts = ta.barb_positions(BOX, n=14)
    assert len(pts) == 14
    xs = [x for x, _ in pts]
    assert xs == sorted(xs), "돌기는 x 오름차순이어야 한다"
    assert BOX[0] <= xs[0] and xs[-1] <= BOX[2]


def test_thread_stays_inside_box():
    for shift in (-1.0, 0.0, 1.0):
        for x, y in ta.thread_points(BOX, shift=shift):
            assert BOX[0] - 1 <= x <= BOX[2] + 1
            assert BOX[1] - 1 <= y <= BOX[3] + 1


def test_tissue_shift_monotonic_across_stages():
    seq = [ta.tissue_shift("insert", 0.0), ta.tissue_shift("insert", 1.0),
           ta.tissue_shift("engage", 0.5), ta.tissue_shift("engage", 1.0),
           ta.tissue_shift("fix", 1.0)]
    assert seq == sorted(seq), "조직 이동량은 단계가 갈수록 커져야 한다: %s" % seq
    assert seq[0] == 0.0
    assert 0.0 < seq[-1] <= 1.0


def _draw(stage, prog):
    img = Image.new("RGB", (1080, 1920), (20, 16, 14))
    ta.draw_mechanism(img, BOX, stage, prog)
    return np.asarray(img).astype(int)


def test_mechanism_draws_something():
    base = np.asarray(Image.new("RGB", (1080, 1920), (20, 16, 14))).astype(int)
    for stage in ta.STAGES:
        arr = _draw(stage, 1.0)
        changed = (np.abs(arr - base).sum(axis=2) > 12).sum()
        assert changed > 5000, "%s 단계에서 그려진 화소가 너무 적다 (%d)" % (stage, changed)


def test_engage_moves_content_right_relative_to_insert():
    """돌기가 조직을 걸면 조직 마커의 무게중심이 오른쪽으로 이동한다."""
    def centroid_x(arr):
        m = (np.abs(arr - np.array([20, 16, 14])).sum(axis=2) > 12)
        band = m[BOX[1]:BOX[3], BOX[0]:BOX[2]]
        xs = np.where(band.any(axis=0))[0]
        w = band.sum(axis=0)[xs]
        return float((xs * w).sum() / w.sum())

    a = centroid_x(_draw("insert", 1.0))
    b = centroid_x(_draw("fix", 1.0))
    assert b > a + 2.0, "고정 단계 무게중심이 삽입 단계보다 오른쪽이어야 한다 (%.1f -> %.1f)" % (a, b)


def test_note_label_renders():
    img = Image.new("RGB", (1080, 1920), (0, 0, 0))
    ta.draw_note(img, 980, 1560)
    arr = np.asarray(img)
    assert arr.max() > 60, "'개념도' 표기가 그려지지 않았다"
