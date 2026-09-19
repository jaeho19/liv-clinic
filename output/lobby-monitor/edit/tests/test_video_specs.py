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


# 3초(90프레임) 동안 화면이 얼마나 변하는지의 하한(평균 절대차, 8비트 단위).
#
# 배경 켄번즈가 너무 느리면 프레임 간 변화가 x264 양자화 아래로 내려가 인코딩 결과가
# 앞 프레임과 똑같아지고, 최종 검수의 freezedetect(n=0.001:d=3) 가 정지 구간으로
# 잡는다. 편 모듈이 배경 속도 상수(KB_RATE/_z1)를 빠뜨려도 나머지 11개 테스트는
# 전부 통과하므로 - 8청크 전체 렌더를 마친 뒤에야 드러난다 - 여기서 먼저 막는다.
#
# 블록마다 두 곳을 본다: 시작 +1.5초(생성 클립을 그대로 쓰는 라이브 구간)와 중앙
# (블러 플레이트 구간). 두 구간은 원인이 달라 한쪽만 재면 놓친다 - 실제로 ②편에서
# 중앙만 재던 판에서는 통과했는데 E 블록 라이브 6초가 통째로 얼어 있었다.
#
# ②편 실측(18곳 중 최솟값): 정상 0.646(E 중앙) / 배경 속도 상수를 0.0034 로 낮추면
# 0.284(B 중앙) / 라이브 푸시인을 빼면 0.170(E +1.5초). 뒤의 두 경우는 실제로
# 인코딩 후 freezedetect 에 각각 4건·1건(4.9초)으로 잡혔다. 정상 쪽에 1.6배
# 여유를 두고 0.40 으로 잡았다.
MIN_MOVE_MAD = 0.40


def test_background_keeps_moving(mod):
    """각 블록의 라이브 구간과 중앙에서 3초 떨어진 두 프레임이 충분히 달라야 한다."""
    m, name = mod
    worst = None
    for b in m.BLOCKS:
        for off in (1.5, b["dur"] / 2.0):
            i = max(0, min(EXPECTED[name] - 91, int((b["start"] + off) * 30)))
            a = np.asarray(m.render_frame(i).convert("RGB")).astype(np.int16)
            c = np.asarray(m.render_frame(i + 90).convert("RGB")).astype(np.int16)
            mad = float(np.abs(a - c).mean())
            if worst is None or mad < worst[0]:
                worst = (mad, b["id"], i)
    assert worst[0] > MIN_MOVE_MAD, (
        "%s %s블록(f%d) 이 3초 동안 평균 %.3f 밖에 안 변한다 (하한 %.2f). "
        "배경 켄번즈 속도와 라이브 구간 푸시인을 확인할 것 - 이 상태로 인코딩하면 "
        "freezedetect 가 정지 구간으로 잡는다." % (name, worst[1], worst[2], worst[0],
                                                MIN_MOVE_MAD))


def test_render_frame_is_idempotent(mod):
    """같은 프레임을 두 번 렌더하면 픽셀이 완전히 같아야 한다.

    lru_cache 가 붙은 함수가 가변 PIL 이미지를 돌려주고 호출부가 그것을 제자리
    변형하면, 같은 인덱스를 다시 그릴 때 이미 그려진 그림 위에 또 그린다. ④편에서
    실제로 이 결함이 최종 마스터까지 나갔다(라이브 구간 97프레임 스트로브).

    이 스위트의 다른 단언으로는 못 잡는다 - 크롬·휘도 단언은 덧그려진 프레임도
    통과하고, freezedetect/blackdetect 는 움직임이 '모자란' 쪽을 찾으므로 움직임이
    '넘치는' 이 결함은 원리상 못 본다. 그래서 별도 가드가 필요하다.

    샘플은 블록마다 두 곳: 시작 +0.4초(생성 클립을 그대로 쓰는 라이브 창 - 오염이
    거기서 일어난다)와 중앙(블러 플레이트 구간).
    """
    m, name = mod
    for b in m.BLOCKS:
        for off in (0.4, b["dur"] / 2.0):
            i = max(0, min(EXPECTED[name] - 1, int((b["start"] + off) * 30)))
            a = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
            c = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
            d = int(np.abs(a - c).max())
            assert d == 0, (
                "%s %s블록 f%d 를 두 번 렌더하면 그림이 달라진다 (최대 %d). "
                "캐시(lru_cache 등)가 돌려준 이미지를 그 자리에서 덧그리는 곳이 "
                "있는지 확인할 것 - 캐시된 이미지는 반드시 복사한 뒤 그려야 한다."
                % (name, b["id"], i, d))


def test_no_banned_copy_in_module(mod):
    import copy_guard as cg
    m, name = mod
    hits = cg.find_banned(cg.collect_strings([os.path.join(EDIT, name + ".py")]))
    assert hits == [], "금지 표현: %s" % hits
