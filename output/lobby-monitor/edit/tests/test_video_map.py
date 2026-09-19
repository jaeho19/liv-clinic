# -*- coding: utf-8 -*-
"""④편 전용 검사. 편 공통 규격은 test_video_specs.py 가 본다."""
import os
import sys

import numpy as np
import pytest

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

import video_map as m

# 아래 프레임들은 '생성 클립 창'(A 0~6초, C 52~58초) 안에 있다. 그 구간의 배경은
# 파일에서 읽은 PIL 이미지 그대로이고, 블록 함수와 draw_chrome 이 그 이미지를
# 제자리 변형한다. 배경을 캐시해서 같은 객체를 두 번 돌려주면 두 번째 렌더는
# 이미 조판·크롬이 그려진 이미지 위에 또 그린다 - 프레임이 점점 어두워진다.
#   int(t*FPS)+1 의 반올림과 인덱스 1/180 포화 때문에 같은 인덱스가 연달아
#   요청되므로(C 진입부에서 인덱스 1이 8프레임 연속), 순차 렌더에서도 터진다.
# f5395(G, 클립 없음)는 대조군이다.
LIVE_WINDOW_FRAMES = [0, 1554, 1560, 1568, 1600, 1740]

# 블록마다 한 프레임씩. 캐시가 걸린 이미지 반환 경로를 전부 지난다 -
# ambient_plate(A~E) · photo_panel(E) · photo_plate(F·G) · qr_card(G) ·
# card/softplate/text_img(전 블록). 그중 하나라도 제자리 변형되면 여기서 걸린다.
BLOCK_FRAMES = [180, 960, 2160, 3360, 4320, 4860, 5220, 5395]


@pytest.mark.parametrize("i", LIVE_WINDOW_FRAMES + BLOCK_FRAMES)
def test_render_frame_is_idempotent(i):
    """같은 프레임을 두 번 렌더하면 픽셀이 완전히 같아야 한다."""
    a = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
    b = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
    assert np.abs(a - b).max() == 0, (
        "f%d 를 두 번 렌더하면 결과가 다르다 (최대차 %d) - 렌더 함수가 캐시된 "
        "이미지를 제자리 변형하고 있다" % (i, np.abs(a - b).max()))


def test_sequential_render_matches_single_frame_render():
    """순차 렌더(실제 인코딩 경로)와 한 프레임만 렌더한 결과가 같아야 한다.

    위 검사는 같은 인덱스를 연달아 부르는 경우를, 이 검사는 앞 프레임들을
    거쳐 온 경우를 본다. 실제 청크 렌더는 후자다.
    """
    start = 1554                       # C 블록 진입 직전(크로스 디졸브 구간)
    # 렌더 결과를 PIL 객체로 들고 있으면 안 된다 - 캐시된 이미지를 그대로 돌려주는
    # 구현에서는 두 결과가 같은 객체라 차이가 0으로 나온다(실제로 겪었다).
    a = None
    for i in range(start, start + 14):
        a = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
    b = np.asarray(m.render_frame(start + 13).convert("RGB")).astype(int)
    assert np.abs(a - b).max() == 0, (
        "순차 렌더한 f%d 가 단독 렌더와 다르다 (최대차 %d)"
        % (start + 13, np.abs(a - b).max()))
