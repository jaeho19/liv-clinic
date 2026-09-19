# -*- coding: utf-8 -*-
import os
import subprocess
import sys

import numpy as np
import pytest
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
PREP = os.path.join(EDIT, "prep")


@pytest.fixture(scope="module", autouse=True)
def run_prep():
    subprocess.run([sys.executable, os.path.join(EDIT, "prep_assets.py")],
                   check=True, cwd=EDIT)


def test_product_photo_has_alpha():
    im = Image.open(os.path.join(PREP, "P01.png"))
    assert im.mode == "RGBA"
    assert im.getchannel("A").getbbox() == (0, 0, im.width, im.height), \
        "알파 bbox로 크롭되어 있어야 한다"


def test_thread_crop_is_wide_and_large():
    im = Image.open(os.path.join(PREP, "P01T.png"))
    assert im.width == 1600
    assert im.width > im.height * 2, "실은 가로로 긴 형태여야 한다"


def test_thread_crop_excludes_purple_box():
    """P01T의 y축 컷오프가 낮으면 APTOS 박스가 크롭에 섞여 들어오는데,
    폭/종횡비만 보는 위 테스트는 그 실패를 못 잡는다(실측: 0.42 컷오프일 때
    1600x580으로 종횡비 조건은 여전히 만족했다). prep_assets.py가 실을 골라낼 때
    쓰는 것과 같은 보라 판정식(b-r>25, b>90, 불투명 화소 한정)을 그대로 재사용해
    최종 산출물의 보라 화소 비율을 직접 잰다.
    실측 기준값: 정상(0.82 컷오프) 크롭은 0.0000%, 박스가 섞였던 0.42 컷오프
    크롭은 86.7611% — 1%는 두 값 사이에서 압도적인 여유를 둔 경계다."""
    im = Image.open(os.path.join(PREP, "P01T.png")).convert("RGBA")
    arr = np.asarray(im)
    opaque = arr[..., 3] > 40
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    purple = (b - r > 25) & (b > 90)
    n_opaque = int(opaque.sum())
    purple_ratio = (int((purple & opaque).sum()) / n_opaque) if n_opaque else 1.0
    assert purple_ratio < 0.01, (
        "보라색 박스 화소 비율 %.2f%% - 박스가 섞여 들어왔다" % (purple_ratio * 100))


@pytest.mark.parametrize("key", ["A03", "A04"])
def test_or_photos_are_portrait_after_exif_fix(key):
    """원본은 EXIF 회전 미적용으로 가로 저장되어 있다. 보정 후 세로가 되어야 한다."""
    im = Image.open(os.path.join(PREP, key + ".jpg"))
    assert im.height > im.width, "%s EXIF 회전이 적용되지 않았다 (%dx%d)" % (
        key, im.width, im.height)


def test_certificate_is_tall_enough_to_read_number():
    im = Image.open(os.path.join(PREP, "A01.jpg"))
    assert im.height >= 2000


def test_qr_present_and_square():
    im = Image.open(os.path.join(PREP, "qr.png"))
    assert im.width == im.height >= 380


@pytest.mark.parametrize("key", ["I01", "I03", "I04", "E01", "logo_white"])
def test_reused_assets_copied(key):
    ext = ".png" if key in ("E01", "logo_white") else ".jpg"
    assert os.path.exists(os.path.join(PREP, key + ext))


def test_banned_sources_not_copied():
    for bad in ("Gemini", "thread-hero", "bio-lifting", "visit-"):
        hits = [f for f in os.listdir(PREP) if bad.lower() in f.lower()]
        assert not hits, "사용 금지 파일이 prep에 들어왔다: %s" % hits


@pytest.mark.parametrize("key", ["A09", "A10", "A11", "A12"])
def test_director_activity_photos_prepared(key):
    im = Image.open(os.path.join(PREP, key + ".jpg"))
    assert max(im.size) >= 1200, "%s 해상도가 낮다 %s" % (key, im.size)


def test_lecture_photo_is_large_enough_to_read_screen():
    """A09는 발표 스크린의 'Kim, Soo Young' 을 확대해 읽혀야 하므로 가로 1800 이상."""
    assert Image.open(os.path.join(PREP, "A09.jpg")).width >= 1800
