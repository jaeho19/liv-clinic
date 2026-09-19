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
import face_diagram as fd                                            # noqa: E402

BOX = (140, 480, 940, 1420)


def test_regions_and_labels_match():
    assert set(fd.REGIONS) == set(fd.REGION_LABEL)
    for r in fd.REGIONS:
        assert fd.REGION_LABEL[r].strip(), "%s 라벨이 비어 있다" % r


def test_face_box_keeps_ratio_and_fits():
    fx0, fy0, fx1, fy1 = fd.face_box_for(BOX)
    assert BOX[0] <= fx0 < fx1 <= BOX[2]
    assert BOX[1] <= fy0 < fy1 <= BOX[3]
    ratio = (fx1 - fx0) / float(fy1 - fy0)
    assert abs(ratio - 0.75) < 0.02, "얼굴 선화는 3:4 비율이어야 한다 (%.3f)" % ratio


@pytest.mark.parametrize("region", ["cheek", "midface", "jawline", "submental", "texture"])
def test_region_rect_inside_face(region):
    fb = fd.face_box_for(BOX)
    r = fd.region_rect(BOX, region)
    assert fb[0] - 40 <= r[0] and r[2] <= fb[2] + 40
    assert fb[1] - 40 <= r[1] and r[3] <= fb[3] + 40


def test_draw_face_paints_lines():
    img = Image.new("RGB", (1080, 1920), (16, 12, 10))
    fd.draw_face(img, BOX)
    arr = np.asarray(img).astype(int)
    changed = (np.abs(arr - np.array([16, 12, 10])).sum(axis=2) > 12).sum()
    assert changed > 3000, "선화가 그려지지 않았다 (%d)" % changed


@pytest.mark.parametrize("region", ["cheek", "jawline", "submental"])
def test_highlight_brightens_only_its_region(region):
    base = Image.new("RGB", (1080, 1920), (16, 12, 10))
    fd.draw_face(base, BOX)
    lit = base.copy()
    fd.highlight(lit, BOX, region)
    b = np.asarray(base).astype(float).mean(axis=2)
    l = np.asarray(lit).astype(float).mean(axis=2)
    rx0, ry0, rx1, ry1 = fd.region_rect(BOX, region)
    inside = (l - b)[ry0:ry1, rx0:rx1].mean()
    outside_mask = np.ones_like(b, bool)
    outside_mask[ry0:ry1, rx0:rx1] = False
    outside = (l - b)[outside_mask].mean()
    assert inside > 1.5, "%s 영역이 밝아지지 않았다 (%.2f)" % (region, inside)
    assert inside > outside * 3, "%s 하이라이트가 영역 밖으로 번졌다" % region
