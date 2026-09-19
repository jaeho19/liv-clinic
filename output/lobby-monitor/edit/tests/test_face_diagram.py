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


# region_rect가 face_box_for 사각형 '안'에 드는지는 (region_rect = fx0 + rel*fw,
# rel이 항상 0~1이므로) 대수적으로 언제나 참이라 아무 결함도 못 잡는다 — fix round 1
# 리뷰 지적대로, _REL을 뭘로 바꿔도 이 형태의 assert는 계속 통과했다(증거: 좌표를
# 세 번 바꾸는 동안 이 테스트만 매번 그대로 11 passed였다).
#
# 실제로 의미 있는 검사는 "draw_face가 실제로 그리는 얼굴 윤곽 안"에 하이라이트가
# 얼마나 담기는가이다. fd._face_mask(fw, fh)로 그 윤곽을 채운 마스크를 만들어
# region_rect와 겹치는 화소 중 안쪽 비율을 재고 임계값과 비교한다.
#
# 임계값은 fix round 1에서 _REL을 조정한 뒤 실측한 값(task-5-report.md 표)에
# 여유를 두고 정했다 — 지금 값에 억지로 맞추지 않고, 조정 후의 건강한 값을 기준으로
# 삼았다:
_MIN_INSIDE_RATIO = {
    "cheek": 0.97,      # 실측 100.0% — 눈썹 아래·입 위, 코 옆으로 재배치
    "midface": 0.97,    # 실측 100.0% — 원래도 중앙에 안전하게 인셋돼 있었음
    # 턱은 턱끝으로 갈수록 급격히 좁아져 사각형 하나로는 100%를 낼 수 없다.
    # 실측 90.0%(y 0.70~0.87)가 폭을 "턱선"으로 읽히게 유지하면서 낼 수 있는
    # 상한에 가깝다 — 더 밀어붙이면 폭이 좁아져 턱끝 한 점처럼 보인다.
    "jawline": 0.85,
    # 이중턱은 정의상 그려진 턱 윤곽선 '밖'(턱 아래 빈 배경)을 가리켜야 하는
    # 부위라 다른 부위처럼 90%대를 요구하면 오히려 턱선 쪽으로 밀려 올라가
    # 두 부위가 구분이 안 된다. 실측 78.1%가 턱선과는 구분되면서도 대부분
    # 턱 언저리에 걸치는 지점이다.
    "submental": 0.70,
    "texture": 0.97,    # 실측 100.0% — 이마 돔 안에 원래부터 거의 딱 맞았음
}


@pytest.mark.parametrize("region", ["cheek", "midface", "jawline", "submental", "texture"])
def test_region_rect_inside_face(region):
    fb = fd.face_box_for(BOX)
    fw, fh = fb[2] - fb[0], fb[3] - fb[1]
    mask = np.asarray(fd._face_mask(fw, fh)) > 127
    rx0, ry0, rx1, ry1 = fd.region_rect(BOX, region)
    lx0, ly0 = rx0 - fb[0], ry0 - fb[1]
    lx1, ly1 = rx1 - fb[0], ry1 - fb[1]
    sub = mask[max(ly0, 0):ly1, max(lx0, 0):lx1]
    assert sub.size, "%s 하이라이트 사각형이 비어 있다" % region
    ratio = sub.mean()
    min_ratio = _MIN_INSIDE_RATIO[region]
    assert ratio >= min_ratio, (
        "%s 하이라이트의 %.0f%%만 얼굴 윤곽 안에 든다 (최소 %.0f%% 필요)"
        % (region, ratio * 100, min_ratio * 100))


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
    assert inside > 1.5, "%s 영역이 밝아지지 않았다 (%.2f)" % (region, inside)

    # highlight()는 region_rect 크기의 레이어를 (rx0,ry0)에만 붙이므로
    # (face_diagram.py의 highlight 본문 참조) 영역 밖 화소는 base와 lit가
    # 바이트 단위로 동일해야 한다 — "정확히 0"이 참인 주장이다. 나중에 글로우나
    # 블러가 사각형 밖으로 번지도록 바뀌면 이 assert가 회귀로 잡는다.
    # (예전의 "inside > outside*3"은 highlight 구조상 outside가 항상 정확히
    # 0이라 inside>0으로 축소되는 공허한 검사였다 — fix round 1 리뷰 지적.)
    base_arr = np.asarray(base).astype(int)
    lit_arr = np.asarray(lit).astype(int)
    diff = np.abs(lit_arr - base_arr).sum(axis=2)
    outside_mask = np.ones(diff.shape, dtype=bool)
    outside_mask[ry0:ry1, rx0:rx1] = False
    assert diff[outside_mask].max() == 0, "%s 하이라이트가 영역 밖으로 번졌다" % region
