# -*- coding: utf-8 -*-
"""파일럿 렌더러 검사. `PYTHONIOENCODING=utf-8 python -m pytest test_pilot.py -q`

인계문 §7 이 경고한 것 중 **지표로는 안 잡히는 결함**을 겨냥한다.

§7-2 캐시 오염: `@lru_cache` 가 가변 PIL 이미지를 돌려주고 호출부가 그 위에
그리면, 같은 인덱스를 다시 요청했을 때 덧그려진 그림이 나온다. 이전 작업에서
실제로 **97프레임 스트로브**가 출고본에 들어갔고, `freezedetect`·`blackdetect` 는
원리상 이걸 못 잡는다(움직임이 넘치는 방향이라). 그래서 같은 프레임을 두 번
그려 바이트가 같은지 직접 본다.

§7-4 조용한 축소: `fit` 이 제목을 규격 아래로 줄여도 예외 없이 넘어가던 문제.
`HEAD`/`SUB` 가 실제로 막는지 확인한다.
"""
import os
import sys

import pytest
from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import look as L                                     # noqa: E402
import pilot                                         # noqa: E402
import pilot2                                        # noqa: E402

# 두 파일럿을 같은 검사에 태운다. v2(생성 클립 판)만 고치다 v1 이 깨지는 일을 막는다.
RENDERERS = [pilot, pilot2]
IDS = ["pilot", "pilot2"]


# ---------------------------------------------------------------- 멱등성
@pytest.mark.parametrize("P", RENDERERS, ids=IDS)
@pytest.mark.parametrize("frame", [0, 45, 120, 210, 260, 390, 405, 540, 690, 700, 830, 899])
def test_frame_is_idempotent(P, frame):
    """같은 프레임을 두 번 그리면 바이트가 같아야 한다(캐시 오염 탐지)."""
    a = P.render_frame(frame).tobytes()
    b = P.render_frame(frame).tobytes()
    assert a == b, "프레임 %d 가 두 번째 렌더에서 달라졌다 — 캐시된 이미지를 제자리 변형한다" % frame


@pytest.mark.parametrize("P", RENDERERS, ids=IDS)
def test_render_order_does_not_matter(P):
    """앞 프레임을 먼저 그린 뒤 뒤 프레임을 그려도 결과가 같아야 한다.

    청크 렌더는 프로세스마다 시작 인덱스가 다르다. 캐시가 오염되면 청크
    경계에서만 그림이 달라져 이어 붙인 뒤에야 드러난다.
    """
    alone = P.render_frame(700).tobytes()
    for i in (0, 210, 390, 690):
        P.render_frame(i)
    assert P.render_frame(700).tobytes() == alone


# ---------------------------------------------------------------- 규격
@pytest.mark.parametrize("P", RENDERERS, ids=IDS)
def test_total_frames_exact(P):
    assert P.TOTAL == 900
    assert P.CHUNKS * P.CHUNK_FRAMES == P.TOTAL


@pytest.mark.parametrize("P", RENDERERS, ids=IDS)
def test_blocks_are_contiguous(P):
    """블록이 빈틈 없이 이어지고 마지막이 정확히 30초에서 끝난다."""
    t = 0.0
    for b in P.BLOCKS:
        assert abs(b["start"] - t) < 1e-9, "블록 %s 가 %.3f 초에서 시작한다(기대 %.3f)" % (
            b["id"], b["start"], t)
        t += b["dur"]
    assert abs(t - P.TOTAL / P.FPS) < 1e-9


@pytest.mark.parametrize("P", RENDERERS, ids=IDS)
def test_frame_size_and_mode(P):
    img = P.render_frame(123)
    assert img.size == (L.W, L.H)
    assert img.mode == "RGB"


# ---------------------------------------------------------------- 생성 클립
def test_clips_are_exact_length():
    """변환된 클립은 정확히 150프레임이어야 한다.

    minterpolate 가 마지막 프레임을 버린다(실측: 150 요청에 149장). 한 장이라도
    모자라면 그 프레임을 읽는 순간 렌더가 죽는다.
    """
    import json
    with open(os.path.join(L.EDIT, "clips", "clip_report.json"), encoding="utf-8") as f:
        rep = json.load(f)
    # 보고서에는 6분 본편용 클립(N01~)도 들어 있고 그쪽은 길이가 제각각이다
    # (블록 길이에 맞춰 생성했다). 파일럿이 쓰는 것은 V1~V10 뿐이므로
    # 여기서 전부를 150 으로 단정하면 본편 클립이 늘 때마다 이 검사가 깨진다.
    pilot_keys = [k for k in rep if k.startswith("V")]
    assert pilot_keys, "파일럿 클립(V*)이 보고서에 없다"
    for key in pilot_keys:
        meta = rep[key]
        if "frames" not in meta:
            continue
        assert L.clip_len(key) == meta["frames"] == 150, "%s: %d장" % (key, L.clip_len(key))


def test_clip_bed_never_runs_past_the_clip():
    """블록이 클립보다 길면 감속 재생이라 끝까지 새 프레임이 나와야 한다.

    마지막 프레임 유지로 떨어지면 그 구간이 통째로 정지가 된다.

    블록의 **실제 마지막 프레임**은 tl = dur - 1/FPS 다. tl = dur 는 다음 블록의
    첫 프레임이라 이 블록에서는 그려지지 않는다 — 거기까지 재면 한 프레임 차이로
    범위를 넘는다(처음 이 검사를 dur 로 썼다가 걸렸다).
    """
    for key, dur in (("V7", pilot2.D_DUR), ("V8", pilot2.E_DUR)):
        tl_last = dur - 1.0 / L.FPS
        rate = pilot2.CLIP_SECONDS / dur
        idx = int(round(tl_last * rate * L.FPS)) + 1
        assert idx <= L.clip_len(key), "%s: 마지막 프레임이 %d 번째를 읽는다(총 %d장)" % (
            key, idx, L.clip_len(key))
        assert (pilot2.clip_bed(key, tl_last, dur).tobytes()
                != pilot2.clip_bed(key, dur * 0.5, dur).tobytes())


# ---------------------------------------------------------------- 조판 가드
def test_head_guard_rejects_undersized():
    """제목이 규격(76px) 아래로 줄면 조용히 넘어가지 않고 예외가 나야 한다."""
    img = Image.new("RGBA", (L.W, L.H))
    with pytest.raises(ValueError):
        L.HEAD(img, "아주 긴 제목을 좁은 폭에 억지로 밀어 넣는 경우", 0, 0, 116, maxw=200)


def test_sub_guard_rejects_undersized():
    img = Image.new("RGBA", (L.W, L.H))
    with pytest.raises(ValueError):
        L.SUB(img, "본문도 하한 아래로는 줄지 않는다", 0, 0, 56, maxw=120)


def test_head_guard_allows_in_spec():
    img = Image.new("RGBA", (L.W, L.H))
    L.HEAD(img, "실이 하는 일", L.SAFE, 400, 116)      # 예외가 나면 실패


# ---------------------------------------------------------------- 에셋
def test_generated_assets_present():
    for key, fn in L._NEW.items():
        path = os.path.join(L.GEN, fn)
        assert os.path.isfile(path), "%s 에셋이 없다: %s" % (key, fn)


def test_certificate_is_not_upscaled():
    """A01(인증서)은 글자가 증거다. 업스케일 산출물(*_up)을 쓰면 안 된다.

    업스케일러가 작은 글자를 지어내는 것을 실제로 확인했다(로비 간판 영문).
    """
    assert not L._NEW["A01"].endswith("_up.png")


def test_assets_meet_screen_resolution():
    """화면 전면으로 쓰는 에셋은 1080x1920 을 덮을 수 있어야 한다.

    이전 작업의 I03/I04 는 746x1120 이라 전면으로 쓰면 1.7배 확대됐다.
    """
    for key in ("A02", "A09", "A11", "I01", "I03", "I04"):
        im = L.asset(key)
        assert max(im.size) >= 1920, "%s 가 %s — 전면 사용에 모자란다" % (key, im.size)
