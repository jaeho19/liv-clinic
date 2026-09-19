# -*- coding: utf-8 -*-
"""liv_video 툴킷 추출 후에도 1편 렌더 결과가 픽셀 단위로 동일한지 검증."""
import os
import subprocess
import sys

import numpy as np
import pytest
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
CITY = os.path.join(REPO, "output", "lifting-city")
GOLDEN = os.path.join(CITY, "edit", "golden")
TIMES = ["0.5", "45", "123", "190", "265", "354"]


@pytest.fixture(scope="module")
def rerendered(tmp_path_factory):
    out = tmp_path_factory.mktemp("reren")
    subprocess.run(
        [sys.executable, os.path.join(CITY, "edit", "render_video.py"),
         "--stills", ",".join(TIMES), "--out", str(out)],
        check=True, cwd=CITY)
    return out


@pytest.mark.parametrize("sec", TIMES)
def test_frame_pixel_identical(rerendered, sec):
    name = "t%07.2f.png" % float(sec)
    g = np.asarray(Image.open(os.path.join(GOLDEN, name)).convert("RGB"))
    r = np.asarray(Image.open(os.path.join(rerendered, name)).convert("RGB"))
    assert g.shape == r.shape
    diff = np.abs(g.astype(int) - r.astype(int))
    assert diff.max() == 0, "최대 화소 차이 %d — 리팩터링이 결과를 바꿨다" % diff.max()
