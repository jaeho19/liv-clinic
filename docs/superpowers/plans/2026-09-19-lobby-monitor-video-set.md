# 1층 모니터 영상 3편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 리브성형외과 건물 1층 공용 모니터용 세로 무음 영상 3편(②실이 하는 일 4분, ③조지아에서 배워 왔습니다 3분, ④리프팅 고민 지도 3분)을 제작해 기존 ①〈리프팅 시티〉와 함께 16분 루프를 완성한다.

**Architecture:** ①편 렌더러(`output/lifting-city/edit/render_video.py`)에서 검증된 합성·조판·인코딩 코드를 `output/liv_video/` 공용 파이썬 패키지로 추출하고, 그 위에 3개의 신규 개념도 모듈(실 메커니즘·입자 확산·얼굴 선화)과 편별 장면 모듈을 얹는다. 편마다 프레임 단위 `render_frame(i)` 함수를 정의해 블록별 병렬 렌더 → concat → 단일 마스터 인코딩한다. 배경 분위기만 Higgsfield로 생성하고 의료 관련 도해는 전부 코드로 그린다.

**Tech Stack:** Python 3.13, Pillow 12.3, numpy 2.5, pytest, ffmpeg 9.0, opencv-python-headless(검수), qrcode, fontTools, Higgsfield MCP(nano_banana_pro / kling3_0)

## Global Constraints

- 규격: **1080×1920 / 30fps CFR / H.264 / yuv420p / 무음(오디오 스트림 0) / faststart**
- 길이: ②편 **240.000초 7,200프레임**, ③편 **180.000초 5,400프레임**, ④편 **180.000초 5,400프레임** — 오차 0
- 고정 크롬: 상단 LIV 로고 + "리브성형외과", 하단 "이 건물 4층" 로즈 필 + "02-797-2773" — **전 구간 모든 프레임**
- 안전여백 사방 **72px** 이상
- 팔레트: 로즈 `#b4988d` / 브라운 `#6d4e42` / 오프화이트 `#f6f6f6` / 차콜 `#575756`
- 폰트: Pretendard (`output/lifting-city/edit/fonts/Pretendard-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf`)
- QR: `https://liv-clinic.net/ko/contact`, 각 편 **마지막 12초 완전 고정**, 최종 MP4 프레임에서 디코딩 검증
- **금지 문구** (영상 어디에도 넣지 않음): "효과 지속: 최대 24개월", "압도적", "4세대", "오리지널 브랜드", "유일", 전후 비교, 효과 보장, 수치화된 개선, 타 병원 비교, 환자 후기·체험담
- **사용 금지 파일**: `aptos/Gemini_Generated_Image_*.png`, `lifting/thread-hero.png`, `media-news/aptos-bio-lifting-1.jpg`, `media-news/aptos-bio-lifting-2.jpg`, `treatments/thread.jpg`, `treatments/thread-hero.jpg`, **`media-news/visit-*.jpg` 4장(연예인·인플루언서 방문 — 의료광고 금지)**
- **원장 캐릭터 시트를 만들지 않는다.** 실사 12장만 쓰고, 원장의 새 장면을 생성하지 않는다. Higgsfield Element `709fba3c-1e18-4e12-9384-dd687bcbb880`도 쓰지 않는다
- 개념도 구간에는 화면 구석에 **"개념도"** 표기
- 3초 이상 완전 정지 구간 금지 — 배경은 항상 눈에 보이는 속도로 이동
- Higgsfield: `use_unlim: false`, 컷당 재시도 **2회 한도**, 모든 job ID·비용을 `generation_log.json`에 누적
- 원본 사진의 인물·장비 형태를 변형하지 않는다. 확대·이동·크롭만 허용

---

## 파일 구조

```
output/
  liv_video/                      # [신규] 공용 렌더 툴킷
    __init__.py
    spec.py        규격·팔레트·문구 상수, set_dirs()
    anim.py        이징·가시성·마스크 공개
    draw.py        텍스트·카드·룰·소프트플레이트
    media.py       에셋 로드·커버크롭·사진패널·플레이트·켄번즈
    chrome.py      상단/하단 고정 크롬
    qr.py          QR 생성
    encode.py      프레임 파이프 인코딩 + 병렬 렌더 CLI
  lifting-city/
    edit/render_video.py          # [수정] liv_video 임포트로 전환 (픽셀 동일 보장)
  lobby-monitor/                  # [신규] ②③④편 작업 폴더
    assets/                       # 신규 원본 사본
    edit/
      prep_assets.py              신규 에셋 전처리(EXIF 회전 포함)
      thread_anim.py              실 메커니즘 개념도
      particle_anim.py            히알루론산 캡슐 3단계 확산 개념도
      face_diagram.py             얼굴 선화 + 부위 하이라이트
      copy_guard.py               금지 문구 대조
      video_thread.py             ②편 장면 정의 + CLI
      video_georgia.py            ③편 장면 정의 + CLI
      video_map.py                ④편 장면 정의 + CLI
      qc_check.py                 3편 공통 검수
      tests/
        test_toolkit_parity.py
        test_prep_assets.py
        test_thread_anim.py
        test_particle_anim.py
        test_face_diagram.py
        test_copy_guard.py
        test_video_specs.py
      fonts/ -> lifting-city/edit/fonts 재사용 (경로 상수로 참조)
      prep/ gen/ scenes/ stills/
    renders/
    generation_log.json
    qc_report.md
```

---

### Task 1: 공용 툴킷 추출과 ①편 픽셀 동일성 보장

①편 렌더러는 검수를 통과한 코드다. 옮기되 결과가 1픽셀도 달라지면 안 된다. 골든 프레임을 먼저 박아두고 리팩터링한다.

**Files:**
- Create: `output/liv_video/__init__.py`, `spec.py`, `anim.py`, `draw.py`, `media.py`, `chrome.py`, `qr.py`, `encode.py`
- Modify: `output/lifting-city/edit/render_video.py`
- Test: `output/lobby-monitor/edit/tests/test_toolkit_parity.py`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `liv_video.spec`: `W=1080, H=1920, FPS=30, SAFE=72`, 색상 상수 `ROSE, ROSE_T, ROSE_D, BROWN, OFFW, CHAR, INK, CREAM, WHITE` (모두 `tuple[int,int,int]`), 문구 상수 `CLINIC, FLOOR, PHONE, ADDRESS, QR_URL, FOUR` (`str`), `FONTS: dict[str,str]`, `set_dirs(fontdir: str, prep: str, gen: str) -> None`, `dirs() -> tuple[str,str,str]`
  - `liv_video.anim`: `clamp01(x: float) -> float`, `p(t,t0,d) -> float`, `eo(x) -> float`, `eio(x) -> float`, `vis(t, t0, t1=None, fin=0.5, fout=0.4) -> tuple[float,float]`, `reveal(base: Image, top_img: Image, rect: tuple, prog: float, radius: int=0) -> None`
  - `liv_video.draw`: `font(key,size)`, `tmetrics(text,fkey,size)`, `twidth(text,fkey,size) -> int`, `fit_size(text,fkey,size,maxw) -> int`, `text_img(...)`, `put(base,img,pos,alpha=1.0) -> None`, `T(base,text,x,y,fkey,size,fill=OFFW,ha="l",va="a",alpha=1.0,shadow=0,blur=12,sdy=5,maxw=None,dx=0,dy=0) -> int`, `TL(...) -> int`, `rule(base,x,y,w,h=5,color=ROSE,alpha=1.0)`, `card(w,h,radius,fill,shadow=120,sblur=22,soff=12) -> tuple[Image,int]`, `CARD(base,x,y,w,h,radius=28,fill=CREAM,alpha=1.0,shadow=120,dy=0)`, `card_outline(w,h,radius,a=84,width=3) -> Image`, `rrect_mask(w,h,radius) -> Image`, `softplate(base,cx,cy,w,h,alpha=1.0,a=120,radius=70,blur=26)`
  - `liv_video.media`: `asset(key) -> Image`, `cover(img,w,h,cx=0.5,cy=0.5,zoom=1.0,resample=LANCZOS) -> Image`, `photo_panel(key,w,h,radius=24,dim=0.0,cx=0.5,cy=0.5,shadow=130,border=True) -> tuple[Image,int]`, `device_img(key,h,ground=True) -> tuple[Image,int]`, `clip_frame(key,idx) -> Image`, `ambient_plate(key,blur=26,dim=0.50,bright=1.0) -> Image`, `photo_plate(key,blur=0,dim=0.0,bright=1.0,cx=0.5,cy=0.5,zoom_room=1.24) -> Image`, `kb(plate,prog,z0=1.0,z1=1.07,cx0=0.5,cy0=0.5,cx1=0.5,cy1=0.5,resample=BICUBIC) -> Image`, `vignette(base,alpha=1.0)`
  - `liv_video.chrome`: `draw_chrome(base: Image) -> None`
  - `liv_video.qr`: `qr_image(url: str, min_px: int = 380) -> Image` — 모듈 정수배로 확대한 RGB 이미지
  - `liv_video.encode`: `encode_range(render_frame, first: int, last: int, out_path: str, crf: int = 12, preset: str = "medium", quiet: bool = False) -> str` — **첫 인자로 프레임 함수를 받는다.** ①편의 기존 `encode_range`는 모듈 전역 `render_frame`을 참조했으므로 호출부도 함께 바꿔야 한다

- [ ] **Step 1: pytest 설치 확인**

```bash
cd /d/dev/LIV_homepage
python -m pip install --disable-pip-version-check --trusted-host pypi.org --trusted-host files.pythonhosted.org pytest
python -m pytest --version
```

Expected: `pytest 8.x` 이상 출력

- [ ] **Step 2: 골든 프레임 6장 저장 (리팩터링 전 현재 코드로)**

```bash
cd /d/dev/LIV_homepage/output/lifting-city
python edit/render_video.py --stills 0.5,45,123,190,265,354 --out edit/golden
ls edit/golden
```

Expected: PNG 6장. 이 파일들이 기준이다. 이후 절대 덮어쓰지 않는다.

- [ ] **Step 3: 동일성 테스트를 먼저 작성**

Create `output/lobby-monitor/edit/tests/test_toolkit_parity.py`:

```python
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
```

- [ ] **Step 4: 테스트 실행 — 지금은 통과해야 정상**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_toolkit_parity.py -v
```

Expected: 6 passed. (아직 리팩터링 전이므로 당연히 통과한다. 이 테스트가 리팩터링의 안전망이다.)

- [ ] **Step 5: `liv_video` 패키지 생성 — spec.py**

Create `output/liv_video/spec.py`:

```python
# -*- coding: utf-8 -*-
"""규격·팔레트·고정 문구. 프로젝트별 경로는 set_dirs()로 주입한다.

주의: 하위 모듈이 lru_cache를 경로 기준으로 쓰므로 set_dirs()는
프로세스당 1회, 다른 모듈을 쓰기 전에 호출해야 한다.
"""
W, H, FPS = 1080, 1920, 30
SAFE = 72

ROSE = (180, 152, 141)
ROSE_T = (222, 198, 186)
ROSE_D = (146, 116, 103)
BROWN = (109, 78, 66)
OFFW = (246, 246, 246)
CHAR = (87, 87, 86)
INK = (42, 32, 26)
CREAM = (240, 233, 226)
WHITE = (255, 255, 255)

CLINIC = "리브성형외과"
FLOOR = "이 건물 4층"
PHONE = "02-797-2773"
ADDRESS = "서울 서초구 나루터로 80 자은빌딩 4층"
QR_URL = "https://liv-clinic.net/ko/contact"
QR_TEXT = "liv-clinic.net/ko/contact"
FOUR = "울쎄라 · 써마지 · 덴서티 · 악센트 프라임"

FONTS = {"r": "Pretendard-Regular.ttf", "m": "Pretendard-Medium.ttf",
         "sb": "Pretendard-SemiBold.ttf", "b": "Pretendard-Bold.ttf",
         "xb": "Pretendard-ExtraBold.ttf"}

_DIRS = {"fontdir": None, "prep": None, "gen": None}


def set_dirs(fontdir, prep, gen):
    _DIRS["fontdir"], _DIRS["prep"], _DIRS["gen"] = fontdir, prep, gen


def dirs():
    if _DIRS["fontdir"] is None:
        raise RuntimeError("liv_video.spec.set_dirs()를 먼저 호출해야 한다")
    return _DIRS["fontdir"], _DIRS["prep"], _DIRS["gen"]
```

- [ ] **Step 6: 나머지 모듈로 코드 이동**

`output/lifting-city/edit/render_video.py`에서 아래 심볼을 잘라내 각 모듈로 옮긴다. **로직은 한 줄도 바꾸지 않는다.** 경로 상수(`FONTDIR/PREP/GEN`)만 `spec.dirs()` 호출로 대체한다.

| 옮길 심볼 | 목적지 |
| --- | --- |
| `clamp01, p, eo, eio, vis, reveal` | `liv_video/anim.py` |
| `font, tmetrics, twidth, fit_size, text_img, put, T, TL, rule, card, CARD, card_outline, rrect_mask, _softplate, softplate` | `liv_video/draw.py` |
| `asset, cover, photo_panel, device_img, clip_frame, ambient_plate, photo_plate, kb, _vignette, vignette, _A, _PNG, _PLATE` | `liv_video/media.py` |
| `_scrim, chrome, draw_chrome, _CHROME` | `liv_video/chrome.py` |
| `encode_range` | `liv_video/encode.py` |

`output/liv_video/__init__.py`:

```python
# -*- coding: utf-8 -*-
"""리브 영상 공용 렌더 툴킷."""
from . import spec, anim, draw, media, chrome, qr, encode  # noqa: F401
```

- [ ] **Step 7: qr.py 작성 (①편 prep_assets.py의 QR 로직을 함수로)**

Create `output/liv_video/qr.py`:

```python
# -*- coding: utf-8 -*-
import qrcode
from PIL import Image


def qr_image(url, min_px=380):
    """실제 URL을 인코딩한 QR. 모듈 수의 정수배로 확대해 엣지를 보존한다."""
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=1, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(26, 20, 17), back_color=(255, 255, 255)).convert("RGB")
    modules = img.size[0]
    k = -(-min_px // modules)
    return img.resize((modules * k, modules * k), Image.NEAREST)
```

- [ ] **Step 8: render_video.py를 임포트 방식으로 전환**

`output/lifting-city/edit/render_video.py` 상단을 교체한다.

```python
import os
import sys

EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)
sys.path.insert(0, os.path.dirname(ROOT))          # output/ 를 임포트 경로에 추가

from liv_video.spec import (W, H, FPS, SAFE, ROSE, ROSE_T, ROSE_D, BROWN, OFFW,
                            CHAR, INK, CREAM, WHITE, CLINIC, FLOOR, PHONE,
                            ADDRESS, QR_TEXT, FOUR, set_dirs)
from liv_video.anim import clamp01, p, eo, eio, vis, reveal
from liv_video.draw import (font, tmetrics, twidth, fit_size, text_img, put, T,
                            TL, rule, card, CARD, card_outline, rrect_mask, softplate)
from liv_video.media import (asset, cover, photo_panel, device_img, clip_frame,
                             ambient_plate, photo_plate, kb, vignette)
from liv_video.chrome import draw_chrome
from liv_video.encode import encode_range

set_dirs(os.path.join(EDIT, "fonts"), os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))
```

파일에 남는 것은 상수(`SCENE_SEC`, `SCENE_FRAMES`, `N_SCENES`, `NFRAMES`, `XF_FRAMES`, `SCENEDIR`), 공통 조각(`title_block, eyebrow, recap_block, floor_block, equip_card, accent_hero`), 12개 장면 함수, `SCENES`, `render_scene`, `render_frame`, `main`이다.

**호출부도 함께 바꾼다.** `encode_range`가 이제 프레임 함수를 인자로 받으므로 `main()` 안의 호출을 수정한다.

```python
        encode_range(render_frame, si * SCENE_FRAMES, (si + 1) * SCENE_FRAMES, out, args.crf)
```

- [ ] **Step 9: 동일성 테스트 재실행**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_toolkit_parity.py -v
```

Expected: 6 passed. 하나라도 실패하면 `diff.max()` 값을 보고 옮기는 과정에서 바뀐 부분을 되돌린다.

- [ ] **Step 10: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/liv_video output/lifting-city/edit/render_video.py output/lobby-monitor/edit/tests/test_toolkit_parity.py
git commit -m "refactor(video): 1편 렌더러에서 liv_video 공용 툴킷 추출, 픽셀 동일성 테스트 추가"
```

---

### Task 2: 신규 에셋 전처리

압토스 실물 제품 사진과 연수·인증 사진을 렌더러가 바로 쓸 크기로 정규화한다. 수술실 사진 2장은 EXIF 회전이 적용되지 않은 상태로 저장돼 있어 반드시 바로잡아야 한다.

**Files:**
- Create: `output/lobby-monitor/edit/prep_assets.py`
- Test: `output/lobby-monitor/edit/tests/test_prep_assets.py`

**Interfaces:**
- Consumes: Task 1의 `liv_video.qr.qr_image`
- Produces: `output/lobby-monitor/edit/prep/` 아래 아래 표의 파일들. 이후 모든 태스크가 `media.asset(key)`로 이 키를 참조한다.

| 키 | 출력 파일 | 원본 | 처리 |
| --- | --- | --- | --- |
| P01 | `P01.png` | `liv-clinic/public/images/treatments/aptos.png` | RGBA 유지, 알파 bbox 크롭 |
| P01T | `P01T.png` | 위 파일의 실 부분만 | 실 영역 크롭 후 가로 1600 확대 |
| A01 | `A01.jpg` | `aptos/certificate.jpg` | 세로 2000 |
| A02 | `A02.jpg` | `aptos/certification-ceremony.jpg` | 세로 1800 |
| A03 | `A03.jpg` | `aptos/consultation.jpg` | **EXIF 회전** 후 가로 2400 |
| A04 | `A04.jpg` | `aptos/procedure-main.jpg` | **EXIF 회전** 후 가로 2400 |
| A05 | `A05.jpg` | `aptos/presentation-podium.jpg` | EXIF 회전 후 가로 2400 |
| A06 | `A06.jpg` | `aptos/presentation-mips.jpg` | 가로 1800 |
| A08 | `A08.jpg` | `media-news/aptos-procedure.jpg` | 원본 유지(600×337) |
| A09 | `A09.jpg` | `media-news/academic-lecture.jpg` | 가로 1800 |
| A10 | `A10.jpg` | `media-news/axa-conference-2026.jpg` | 세로 1600 |
| A11 | `A11.jpg` | `media-news/director-consult.jpg` | 가로 1800 |
| A12 | `A12.jpg` | `media-news/director-portrait.jpg` | 가로 1200 |
| D01 | `D01.jpg` | `doctor/doctor-main.jpg` | 900×1353 |
| D02 | `D02.jpg` | `doctor/doctor-2.jpg` | 세로 1353 |
| I01~I07, E01~E03, logo_white, logo_ink | 동명 파일 | `output/lifting-city/edit/prep/` | 그대로 복사 |
| qr | `qr.png` | — | `qr_image(QR_URL, 380)` |

- [ ] **Step 1: 실패하는 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_prep_assets.py`:

```python
# -*- coding: utf-8 -*-
import os
import subprocess
import sys

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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_prep_assets.py -v
```

Expected: FAIL — `prep_assets.py` 없음으로 fixture에서 에러

- [ ] **Step 3: prep_assets.py 구현**

Create `output/lobby-monitor/edit/prep_assets.py`:

```python
# -*- coding: utf-8 -*-
"""②③④편 에셋 전처리.

인물·장비·제품의 형태는 바꾸지 않는다. EXIF 회전 보정, 크기 정규화, 복사만 한다.
"""
import json
import os
import shutil
import sys

from PIL import Image, ImageOps

EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)                       # output/lobby-monitor
OUTPUT = os.path.dirname(ROOT)                     # output
REPO = os.path.dirname(OUTPUT)
IMG = os.path.join(REPO, "liv-clinic", "public", "images")
CITY_PREP = os.path.join(OUTPUT, "lifting-city", "edit", "prep")
PREP = os.path.join(EDIT, "prep")
os.makedirs(PREP, exist_ok=True)

sys.path.insert(0, OUTPUT)
from liv_video.qr import qr_image                                  # noqa: E402
from liv_video.spec import QR_URL                                  # noqa: E402

report = {}


def _save(im, name, **kw):
    im.save(os.path.join(PREP, name), **kw)
    report[name] = list(im.size)
    print("  %-14s %s" % (name, im.size))


def _load(rel, exif=False):
    im = Image.open(os.path.join(IMG, rel))
    if exif:
        im = ImageOps.exif_transpose(im)
    return im


def _fit_w(im, w):
    return im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)


def _fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


print("[1] 압토스 실물 제품 사진 (APTOS Visage 박스 + 실)")
p01 = _load("treatments/aptos.png").convert("RGBA")
p01 = p01.crop(p01.getchannel("A").getbbox())
_save(p01, "P01.png")

# 실만 분리: 보라 박스가 아닌 불투명 픽셀의 bbox
import numpy as np                                                  # noqa: E402
arr = np.asarray(p01)
opaque = arr[..., 3] > 40
r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
purple = (b - r > 25) & (b > 90)
thread = opaque & ~purple
# 박스 그림자를 제외하기 위해 아래쪽 55% 영역으로 한정
h = thread.shape[0]
thread[: int(h * 0.42), :] = False
ys, xs = np.where(thread)
tbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
print("  실 bbox:", tbox)
_save(_fit_w(p01.crop(tbox), 1600), "P01T.png")

print("[2] 압토스 연수·인증 실사진")
_save(_fit_h(_load("aptos/certificate.jpg").convert("RGB"), 2000), "A01.jpg",
      quality=95, subsampling=0)
_save(_fit_h(_load("aptos/certification-ceremony.jpg").convert("RGB"), 1800), "A02.jpg",
      quality=95, subsampling=0)
for key, rel in [("A03", "aptos/consultation.jpg"), ("A04", "aptos/procedure-main.jpg"),
                 ("A05", "aptos/presentation-podium.jpg")]:
    im = _load(rel, exif=True).convert("RGB")
    _save(_fit_w(im, 2400) if im.width >= im.height else _fit_h(im, 2400),
          key + ".jpg", quality=95, subsampling=0)
_save(_fit_w(_load("aptos/presentation-mips.jpg").convert("RGB"), 1800), "A06.jpg",
      quality=95, subsampling=0)
_save(_load("media-news/aptos-procedure.jpg").convert("RGB"), "A08.jpg",
      quality=95, subsampling=0)

print("[2-2] 원장 활동 실사 (학회·상담·로비)")
_save(_fit_w(_load("media-news/academic-lecture.jpg").convert("RGB"), 1800), "A09.jpg",
      quality=96, subsampling=0)
_save(_fit_h(_load("media-news/axa-conference-2026.jpg").convert("RGB"), 1600), "A10.jpg",
      quality=96, subsampling=0)
_save(_fit_w(_load("media-news/director-consult.jpg").convert("RGB"), 1800), "A11.jpg",
      quality=96, subsampling=0)
_save(_fit_w(_load("media-news/director-portrait.jpg").convert("RGB"), 1200), "A12.jpg",
      quality=96, subsampling=0)

print("[3] 원장 사진")
_save(_load("doctor/doctor-main.jpg").convert("RGB").resize((900, 1353), Image.LANCZOS),
      "D01.jpg", quality=96, subsampling=0)
_save(_fit_h(_load("doctor/doctor-2.jpg").convert("RGB"), 1353), "D02.jpg",
      quality=96, subsampling=0)

print("[4] 1편 전처리 결과 재사용")
for name in ("I01.jpg", "I02.jpg", "I03.jpg", "I04.jpg", "I05.jpg", "I06.jpg",
             "I07.jpg", "E01.png", "E02.png", "E03.png",
             "logo_white.png", "logo_ink.png"):
    shutil.copy2(os.path.join(CITY_PREP, name), os.path.join(PREP, name))
    report[name] = "copied"
    print("  %-14s copied" % name)

print("[5] QR")
_save(qr_image(QR_URL, 380), "qr.png")
report["qr_meta"] = {"url": QR_URL, "ec_level": "M"}

with open(os.path.join(PREP, "prep_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print("\n전처리 완료 ->", PREP)
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_prep_assets.py -v
```

Expected: 10 passed. `test_or_photos_are_portrait_after_exif_fix`가 실패하면 원본 EXIF에 회전 태그가 없다는 뜻이므로, 해당 파일에 한해 `im.rotate(-90, expand=True)`를 적용하고 결과를 눈으로 확인한다.

- [ ] **Step 5: 실 크롭을 눈으로 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
python -c "from PIL import Image; Image.open('prep/P01T.png').save('stills/_p01t.png')"
```

`stills/_p01t.png`를 열어 **돌기가 선명하게 보이고 박스가 섞여 들어오지 않았는지** 확인한다. 박스가 섞였으면 위 스크립트의 `0.42` 임계값을 조정한다.

- [ ] **Step 6: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/prep_assets.py output/lobby-monitor/edit/tests/test_prep_assets.py
git commit -m "feat(video): 2~4편 에셋 전처리 - 압토스 실물 제품 사진, 연수 사진 EXIF 보정"
```

---

### Task 3: 실 메커니즘 개념도 모듈

②편의 핵심이다. 실이 들어가고, 돌기가 조직을 걸고, 걸린 채 고정되는 3단계를 코드로 그린다. AI 생성을 쓰지 않는 이유는 형태 통제와 타이밍 정확성 때문이다.

**Files:**
- Create: `output/lobby-monitor/edit/thread_anim.py`
- Test: `output/lobby-monitor/edit/tests/test_thread_anim.py`

**Interfaces:**
- Consumes: `liv_video.spec` 색상, `liv_video.draw.put`
- Produces:
  - `STAGES: tuple[str,str,str]` = `("insert", "engage", "fix")`
  - `barb_positions(box: tuple[int,int,int,int], n: int = 14) -> list[tuple[float,float]]` — 실 곡선 위 돌기 기준점, x 오름차순
  - `thread_points(box, samples: int = 240, shift: float = 0.0) -> list[tuple[float,float]]` — 실 중심선. `shift`는 -1.0~1.0, 실 전체의 좌우 이동량 비율
  - `tissue_shift(stage: str, prog: float) -> float` — 조직 마커가 오른쪽으로 끌려간 정도 0.0~1.0
  - `draw_mechanism(base, box, stage: str, prog: float, alpha: float = 1.0, show_tissue: bool = True) -> None`
  - `draw_note(base, x: int, y: int, alpha: float = 1.0) -> None` — 구석의 "개념도" 표기

- [ ] **Step 1: 실패하는 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_thread_anim.py`:

```python
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_thread_anim.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'thread_anim'`

- [ ] **Step 3: thread_anim.py 구현**

Create `output/lobby-monitor/edit/thread_anim.py`:

```python
# -*- coding: utf-8 -*-
"""압토스 실 메커니즘 개념도.

실제 시술 영상이 아니라 원리를 설명하는 도해다. 화면에 "개념도"를 함께 표기한다.
좌표는 모두 box=(x0,y0,x1,y1) 안의 상대 위치로 계산한다.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, OFFW, CHAR
from liv_video.draw import put, T

STAGES = ("insert", "engage", "fix")

THREAD_COLOR = (232, 228, 224)
BARB_COLOR = (250, 248, 246)
TISSUE_COLOR = (150, 116, 102)
TISSUE_LINE = (196, 166, 152)
MAX_PULL_PX = 46.0          # 조직 마커가 끌려가는 최대 거리


def thread_points(box, samples=240, shift=0.0):
    """실 중심선. 완만한 사인 곡선이며 shift 만큼 좌우로 민다."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    cy = y0 + h * 0.5
    amp = h * 0.10
    dx = shift * w * 0.045
    pts = []
    for i in range(samples):
        u = i / (samples - 1.0)
        x = x0 + u * w + dx
        y = cy + math.sin(u * math.pi * 1.6 - 0.4) * amp
        pts.append((min(max(x, x0), x1), min(max(y, y0), y1)))
    return pts


def barb_positions(box, n=14):
    """돌기 기준점. 실 곡선 위 균등 분포."""
    pts = thread_points(box, samples=n * 12)
    step = len(pts) // (n + 1)
    return [pts[step * (i + 1)] for i in range(n)]


def tissue_shift(stage, prog):
    """조직이 끌려간 정도 0.0~1.0. insert 에서는 0, engage 에서 상승, fix 에서 유지."""
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    if stage == "insert":
        return 0.0
    if stage == "engage":
        return 0.72 * (prog * prog * (3.0 - 2.0 * prog))
    return 0.72 + 0.28 * (prog * prog * (3.0 - 2.0 * prog))


def _tissue_layer(box, pull):
    """조직을 나타내는 가로 결. pull(px) 만큼 오른쪽으로 당겨진 형태."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rows = 9
    for r in range(rows):
        fy = (r + 0.5) / rows
        y = fy * h
        # 중앙에 가까운 결일수록 더 많이 끌려간다
        weight = math.exp(-((fy - 0.5) ** 2) / 0.045)
        pts = []
        for i in range(41):
            u = i / 40.0
            bulge = math.exp(-((u - 0.5) ** 2) / 0.05)
            pts.append((u * w + pull * weight * bulge, y + math.sin(u * 4.2) * 3.0))
        d.line(pts, fill=TISSUE_LINE + (90,), width=3, joint="curve")
    return lay


def draw_mechanism(base, box, stage, prog, alpha=1.0, show_tissue=True):
    """box 영역에 실-조직 개념도를 그린다."""
    if alpha <= 0.004:
        return
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    prog = 0.0 if prog < 0 else (1.0 if prog > 1 else prog)
    pull = MAX_PULL_PX * tissue_shift(stage, prog)

    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if show_tissue:
        lay.alpha_composite(_tissue_layer(box, pull))

    d = ImageDraw.Draw(lay)
    # 삽입 단계에서는 실이 왼쪽에서 들어온다
    visible = prog if stage == "insert" else 1.0
    pts = [(x - x0, y - y0) for x, y in thread_points(box, shift=0.0)]
    cut = max(2, int(len(pts) * visible))
    d.line(pts[:cut], fill=THREAD_COLOR + (255,), width=9, joint="curve")

    # 돌기: engage 부터 세워진다
    lift = 0.0 if stage == "insert" else (prog if stage == "engage" else 1.0)
    for i, (bx, by) in enumerate(barb_positions(box, n=14)):
        if (i + 1) / 14.0 > visible:
            continue
        lx, ly = bx - x0, by - y0
        length = 16 + 22 * lift
        ang = math.radians(150 + 18 * lift)
        tipx = lx + math.cos(ang) * length
        tipy = ly + math.sin(ang) * length
        d.polygon([(lx, ly - 4), (lx + 13, ly + 2), (tipx, tipy)],
                  fill=BARB_COLOR + (int(210 + 45 * lift),))

    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (x0, y0), lay)


def draw_note(base, x, y, alpha=1.0):
    """실촬영으로 오인되지 않도록 구석에 표기."""
    T(base, "개념도", x, y, "m", 30, CHAR, "r", "a", alpha, shadow=120, blur=8)
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_thread_anim.py -v
```

Expected: 6 passed

- [ ] **Step 5: 눈으로 3단계 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
python - <<'PY'
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.getcwd())))
sys.path.insert(0, os.getcwd())
from liv_video.spec import set_dirs
set_dirs(os.path.join(os.path.dirname(os.path.dirname(os.getcwd())), "lifting-city", "edit", "fonts"),
         "prep", "gen")
from PIL import Image
import thread_anim as ta
sheet = Image.new("RGB", (1080, 1200), (20, 16, 14))
for i, (st, pr) in enumerate([("insert", 0.5), ("engage", 1.0), ("fix", 1.0)]):
    img = Image.new("RGB", (1080, 400), (20, 16, 14))
    ta.draw_mechanism(img, (80, 40, 1000, 360), st, pr)
    sheet.paste(img, (0, i * 400))
sheet.save("stills/_thread_stages.png")
print("stills/_thread_stages.png")
PY
```

`stills/_thread_stages.png`를 열어 **돌기가 서고 조직 결이 오른쪽으로 끌려가는지** 확인한다.

- [ ] **Step 6: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/thread_anim.py output/lobby-monitor/edit/tests/test_thread_anim.py
git commit -m "feat(video): 압토스 실 메커니즘 개념도 모듈 (삽입-걸림-고정 3단계)"
```

---

### Task 4: 히알루론산 캡슐 확산 개념도 모듈

**Files:**
- Create: `output/lobby-monitor/edit/particle_anim.py`
- Test: `output/lobby-monitor/edit/tests/test_particle_anim.py`

**Interfaces:**
- Consumes: `liv_video.spec` 색상
- Produces:
  - `SIZES: tuple[tuple[str,int,float], ...]` = `(("micro", 26, 0.00), ("submicro", 14, 0.34), ("nano", 7, 0.64))` — (이름, 반지름 px, 방출 시작 비율)
  - `active_counts(t: float, dur: float) -> dict[str, int]` — 현재 표시 중인 크기별 입자 수
  - `draw_release(base, box, t: float, dur: float = 35.0, alpha: float = 1.0, seed: int = 7) -> dict[str, int]`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_particle_anim.py`:

```python
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_particle_anim.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'particle_anim'`

- [ ] **Step 3: particle_anim.py 구현**

Create `output/lobby-monitor/edit/particle_anim.py`:

```python
# -*- coding: utf-8 -*-
"""NAMICA 캡슐화 히알루론산의 단계별 방출 개념도.

큰 입자(마이크로)가 먼저, 서브마이크로가 다음, 나노가 마지막에 퍼진다.
효과나 기간을 주장하지 않고 '방출 순서'라는 구조만 보여준다.
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, CREAM

# (이름, 반지름 px, 방출 시작 비율)
SIZES = (("micro", 26, 0.00), ("submicro", 14, 0.34), ("nano", 7, 0.64))
PER_CLASS = (16, 34, 70)            # 클래스별 최대 입자 수
CLASS_COLOR = {"micro": (226, 198, 186), "submicro": (214, 180, 166),
               "nano": (198, 160, 146)}


def active_counts(t, dur=35.0):
    """t 시점에 표시 중인 크기별 입자 수."""
    out = {}
    for (name, _r, start), total in zip(SIZES, PER_CLASS):
        span = max(1e-6, (1.0 - start) * 0.82)
        u = (t / max(dur, 1e-6) - start) / span
        u = 0.0 if u < 0 else (1.0 if u > 1 else u)
        out[name] = int(round(total * (u * u * (3.0 - 2.0 * u))))
    return out


def _layout(box, seed):
    """클래스별 입자 위치를 결정론적으로 생성."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    rng = random.Random(seed)
    plan = {}
    for (name, r, _s), total in zip(SIZES, PER_CLASS):
        pts = []
        for i in range(total):
            ang = rng.uniform(0, math.tau)
            rad = math.sqrt(rng.random())
            pts.append((w * 0.5 + math.cos(ang) * rad * (w * 0.5 - r - 4),
                        h * 0.5 + math.sin(ang) * rad * (h * 0.5 - r - 4)))
        plan[name] = pts
    return plan


def draw_release(base, box, t, dur=35.0, alpha=1.0, seed=7):
    """box 영역에 단계별 방출을 그리고 표시된 입자 수를 반환한다."""
    counts = active_counts(t, dur)
    if alpha <= 0.004:
        return counts
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    plan = _layout(box, seed)
    for name, r, start in SIZES:
        col = CLASS_COLOR[name]
        n = counts[name]
        for i, (px, py) in enumerate(plan[name][:n]):
            # 나중에 나타난 입자일수록 살짝 작게 시작해 커진다
            grow = min(1.0, 0.45 + 0.55 * ((t / dur) - start) * 3.0)
            grow = max(0.35, grow)
            rr = r * grow
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=col + (150,))
            d.ellipse([px - rr * 0.45, py - rr * 0.45, px + rr * 0.1, py + rr * 0.1],
                      fill=(255, 255, 255, 90))
    lay = lay.filter(ImageFilter.GaussianBlur(0.6))
    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (x0, y0), lay)
    return counts
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_particle_anim.py -v
```

Expected: 5 passed

- [ ] **Step 5: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/particle_anim.py output/lobby-monitor/edit/tests/test_particle_anim.py
git commit -m "feat(video): NAMICA 캡슐 3단계 방출 개념도 모듈"
```

---

### Task 5: 얼굴 선화 다이어그램 모듈

②편 라인업과 ④편 고민 지도가 함께 쓴다. AI 생성 얼굴을 쓰지 않고 선화로 그린다.

**Files:**
- Create: `output/lobby-monitor/edit/face_diagram.py`
- Test: `output/lobby-monitor/edit/tests/test_face_diagram.py`

**Interfaces:**
- Consumes: `liv_video.spec` 색상, `liv_video.draw.T`
- Produces:
  - `REGIONS: tuple[str, ...]` = `("cheek", "midface", "jawline", "submental", "texture")`
  - `REGION_LABEL: dict[str, str]` — 화면 표기용 한글 (`cheek`→"볼", `midface`→"중안부", `jawline`→"턱선", `submental`→"이중턱", `texture`→"피부결")
  - `face_box_for(box) -> tuple[int,int,int,int]` — 주어진 영역 안에서 얼굴 선화가 차지할 실제 사각형(3:4 비율 유지)
  - `region_rect(box, region) -> tuple[int,int,int,int]`
  - `draw_face(base, box, alpha=1.0, color=None) -> None`
  - `highlight(base, box, region, alpha=1.0, color=None) -> None`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_face_diagram.py`:

```python
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_face_diagram.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'face_diagram'`

- [ ] **Step 3: face_diagram.py 구현**

Create `output/lobby-monitor/edit/face_diagram.py`:

```python
# -*- coding: utf-8 -*-
"""얼굴 선화와 부위 하이라이트.

사진 대신 선화를 쓴다. 특정 인물의 얼굴이 아니고, 부위를 가리키는 도해다.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))))
from liv_video.spec import ROSE, ROSE_T, OFFW

REGIONS = ("cheek", "midface", "jawline", "submental", "texture")
REGION_LABEL = {"cheek": "볼", "midface": "중안부", "jawline": "턱선",
                "submental": "이중턱", "texture": "피부결"}

# 얼굴 사각형 안의 상대 좌표 (x0, y0, x1, y1), 0~1
_REL = {
    "cheek":     (0.08, 0.40, 0.44, 0.63),
    "midface":   (0.22, 0.34, 0.78, 0.58),
    "jawline":   (0.12, 0.62, 0.88, 0.82),
    "submental": (0.30, 0.78, 0.70, 0.95),
    "texture":   (0.20, 0.18, 0.80, 0.42),
}
LINE = (226, 214, 206)


def face_box_for(box):
    """box 안에 3:4 비율로 최대 크기 얼굴 사각형을 중앙 배치."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    fh = min(h, w / 0.75)
    fw = fh * 0.75
    cx, cy = x0 + w / 2.0, y0 + h / 2.0
    return (int(cx - fw / 2), int(cy - fh / 2), int(cx + fw / 2), int(cy + fh / 2))


def region_rect(box, region):
    fx0, fy0, fx1, fy1 = face_box_for(box)
    fw, fh = fx1 - fx0, fy1 - fy0
    rx0, ry0, rx1, ry1 = _REL[region]
    return (int(fx0 + rx0 * fw), int(fy0 + ry0 * fh),
            int(fx0 + rx1 * fw), int(fy0 + ry1 * fh))


def draw_face(base, box, alpha=1.0, color=None):
    """정면 얼굴 윤곽 선화."""
    if alpha <= 0.004:
        return
    color = color or LINE
    fx0, fy0, fx1, fy1 = face_box_for(box)
    w, h = fx1 - fx0, fy1 - fy0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = tuple(color) + (200,)
    lw = max(3, int(w * 0.006))

    # 얼굴 윤곽: 위는 타원, 아래는 턱으로 모이는 곡선
    d.arc([w * 0.10, h * 0.04, w * 0.90, h * 0.86], 180, 360, fill=col, width=lw)
    left = [(w * 0.10, h * 0.45), (w * 0.14, h * 0.66), (w * 0.30, h * 0.86),
            (w * 0.50, h * 0.94)]
    right = [(w * 0.90, h * 0.45), (w * 0.86, h * 0.66), (w * 0.70, h * 0.86),
             (w * 0.50, h * 0.94)]
    d.line(left, fill=col, width=lw, joint="curve")
    d.line(right, fill=col, width=lw, joint="curve")
    # 눈·코·입을 최소한의 선으로
    d.line([(w * 0.28, h * 0.42), (w * 0.40, h * 0.42)], fill=col, width=lw)
    d.line([(w * 0.60, h * 0.42), (w * 0.72, h * 0.42)], fill=col, width=lw)
    d.line([(w * 0.50, h * 0.46), (w * 0.50, h * 0.60)], fill=col, width=lw)
    d.line([(w * 0.42, h * 0.68), (w * 0.58, h * 0.68)], fill=col, width=lw)

    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (fx0, fy0), lay)


def highlight(base, box, region, alpha=1.0, color=None):
    """해당 부위를 부드럽게 밝힌다. 영역 밖으로 번지지 않도록 사각형 안에서만 합성한다."""
    if alpha <= 0.004:
        return
    color = color or ROSE
    rx0, ry0, rx1, ry1 = region_rect(box, region)
    w, h = rx1 - rx0, ry1 - ry0
    if w < 4 or h < 4:
        return
    pad = 0
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([2, 2, w - 3, h - 3], radius=min(w, h) // 3,
                        fill=tuple(color) + (70,), outline=tuple(color) + (220,), width=4)
    lay = lay.filter(ImageFilter.GaussianBlur(3))
    if alpha < 0.996:
        lay.putalpha(lay.getchannel("A").point(lambda v, m=alpha: int(v * m)))
    base.paste(lay, (rx0, ry0), lay)
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_face_diagram.py -v
```

Expected: 11 passed

- [ ] **Step 5: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/face_diagram.py output/lobby-monitor/edit/tests/test_face_diagram.py
git commit -m "feat(video): 얼굴 선화 다이어그램 모듈 (부위 하이라이트)"
```

---

### Task 6: 금지 문구 자동 대조

설계서 §4의 금지 목록이 실제로 화면에 안 나오는지 사람 눈으로 확인하는 건 신뢰할 수 없다. 장면 모듈의 문자열을 수집해 기계로 막는다.

**Files:**
- Create: `output/lobby-monitor/edit/copy_guard.py`
- Test: `output/lobby-monitor/edit/tests/test_copy_guard.py`

**Interfaces:**
- Consumes: 없음 (표준 라이브러리만)
- Produces:
  - `BANNED: tuple[str, ...]`
  - `collect_strings(paths: list[str]) -> list[tuple[str, int, str]]` — (파일, 줄번호, 문자열)
  - `find_banned(items: list[tuple[str,int,str]]) -> list[tuple[str,int,str,str]]` — (파일, 줄번호, 문자열, 걸린 금지어)

- [ ] **Step 1: 실패하는 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_copy_guard.py`:

```python
# -*- coding: utf-8 -*-
import os
import sys

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, EDIT)
import copy_guard as cg                                              # noqa: E402


def test_banned_list_covers_spec(tmp_path):
    for phrase in ("최대 24개월", "압도적", "4세대", "오리지널", "유일"):
        assert any(phrase in b for b in cg.BANNED), "%s 가 금지 목록에 없다" % phrase


def test_detects_banned_phrase(tmp_path):
    f = tmp_path / "scene.py"
    f.write_text('TITLE = "압도적인 라인업"\nOK = "울쎄라"\n', encoding="utf-8")
    hits = cg.find_banned(cg.collect_strings([str(f)]))
    assert len(hits) == 1
    assert hits[0][3] == "압도적"


def test_allows_safe_copy(tmp_path):
    f = tmp_path / "scene.py"
    f.write_text('A = "KFDA 의료기기 4등급 정식 허가"\nB = "100개국 이상 사용"\n',
                 encoding="utf-8")
    assert cg.find_banned(cg.collect_strings([str(f)])) == []


def test_four_etc_not_false_positive(tmp_path):
    """'4등급'이 '4세대'로 오탐되면 안 된다."""
    f = tmp_path / "scene.py"
    f.write_text('A = "의료기기 4등급"\n', encoding="utf-8")
    assert cg.find_banned(cg.collect_strings([str(f)])) == []
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_copy_guard.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'copy_guard'`

- [ ] **Step 3: copy_guard.py 구현**

Create `output/lobby-monitor/edit/copy_guard.py`:

```python
# -*- coding: utf-8 -*-
"""장면 모듈에 들어간 문자열에서 의료광고 금지 표현을 찾아낸다.

설계서 2026-09-19-lobby-monitor-video-set-design.md §4 기준.
"""
import ast
import os
import sys

BANNED = (
    "최대 24개월", "압도적", "4세대", "오리지널", "유일", "최고", "최상",
    "1위", "보장", "완벽", "영구", "부작용 없", "즉시 효과", "할인", "이벤트가",
    "전후 비교", "비포 애프터", "후기", "체험담",
)


def collect_strings(paths):
    """파이썬 소스에서 문자열 리터럴을 (파일, 줄, 값)으로 모은다."""
    out = []
    for path in paths:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        tree = ast.parse(src, filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                out.append((path, node.lineno, node.value))
    return out


def find_banned(items):
    hits = []
    for path, line, value in items:
        for b in BANNED:
            if b in value:
                hits.append((path, line, value, b))
    return hits


def main(argv):
    paths = argv[1:]
    if not paths:
        here = os.path.dirname(os.path.abspath(__file__))
        paths = [os.path.join(here, n) for n in
                 ("video_thread.py", "video_georgia.py", "video_map.py")
                 if os.path.exists(os.path.join(here, n))]
    hits = find_banned(collect_strings(paths))
    for path, line, value, b in hits:
        print("금지 표현 '%s' — %s:%d — %r" % (b, os.path.basename(path), line, value))
    print("\n검사 파일 %d개, 위반 %d건" % (len(paths), len(hits)))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_copy_guard.py -v
```

Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/copy_guard.py output/lobby-monitor/edit/tests/test_copy_guard.py
git commit -m "feat(video): 의료광고 금지 표현 자동 대조 도구"
```

---

### Task 7: Higgsfield 배경 6종 생성

배경 분위기만 생성한다. 사람·장비·실·글자는 생성하지 않는다.

**Files:**
- Create: `output/lobby-monitor/generation_log.json`
- Create: `output/lobby-monitor/edit/gen/frames/{H01..H06}/*.jpg`

**Interfaces:**
- Consumes: 없음
- Produces: `media.clip_frame("H01".."H06", 1..180)` 로 접근 가능한 30fps 프레임 시퀀스. 각 180장.

**공통 프롬프트 접두 (모든 이미지에 동일하게 붙인다):**

```
Vertical 9:16 premium clinical-editorial background plate. Warm travertine,
dark walnut, dusty rose accents, soft amber indirect lighting, charcoal
shadows. Clean central composition and stable perspective, no text, no
letters, no logos, no people, no medical devices, no threads, no needles,
no human skin, no clinical procedure. Leave the middle area calm and
uncluttered for graphics added in editing.
```

| 키 | 이미지 프롬프트 (접두 뒤에 붙임) | 영상 프롬프트 |
| --- | --- | --- |
| H01 | `A deep charcoal void with one broad soft horizontal band of warm light across the middle third, fine dust motes suspended in the beam. Minimal, almost abstract.` | `Over six seconds the light band brightens very slowly and the dust motes drift laterally. Locked camera, no other movement. Stay completely open and still in the final second.` |
| H02 | `A soft warm gradient field, out-of-focus rose and cream bokeh spheres of varying size scattered across a dark warm ground. Abstract, no objects.` | `Over six seconds the bokeh spheres drift apart slowly and the field brightens a little. One calm continuous motion, no cuts. Final second completely still.` |
| H03 | `A shallow travertine display niche with a matte charcoal grey back panel and a slim walnut ledge, lit by a warm cove light. The niche is completely empty.` | `Over six seconds the cove light warms up and the camera pushes in very gently. The niche stays empty. No object appears. Final second completely still.` |
| H04 | `A calm European stone gallery corridor with pale limestone walls, arched openings and a matte charcoal grey floor, daylight from the left.` | `Over six seconds one slow forward dolly down the corridor. Locked horizon, no rotation. Nothing enters the frame. Final second completely still.` |
| H05 | `A dim auditorium interior seen from the side: rows of empty seats, a soft pool of stage light on an empty lectern area, deep charcoal grey surroundings.` | `Over six seconds the stage light slowly grows brighter and the camera drifts right a little. The lectern area stays empty, no people. Final second completely still.` |
| H06 | `A smooth warm off-white studio backdrop with a very soft top-left light falloff and a faint rose tint at the edges. Completely empty and minimal.` | `Over six seconds the light falloff shifts slowly from left to right. Nothing else moves. Final second completely still.` |

- [ ] **Step 1: 생성 전 견적 재확인**

`generate_image`와 `generate_video`를 `get_cost: true`, `use_unlim: false`로 각 1회 호출한다. 파라미터는 이미지 `{model:"nano_banana_pro", aspect_ratio:"9:16", resolution:"2k", count:1}`, 영상 `{model:"kling3_0", aspect_ratio:"9:16", duration:6, mode:"pro", sound:"off", count:1}`.

Expected: 이미지 2, 영상 10.5. 다르면 그 값으로 예상 비용을 다시 계산하고 기록한다.

- [ ] **Step 2: 시작 이미지 6장 생성**

`generate_image_batch`로 index 1~6, 위 표의 이미지 프롬프트. 모든 항목에 `use_unlim: false`.

`jobs_wait`로 terminal 대기 후 결과 URL을 받는다.

- [ ] **Step 3: 이미지 내려받아 육안 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit/gen
# 각 URL에 대해 (TLS 프록시 때문에 -k 필요)
curl -sk -o H01_start.png "<url>"
python - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import glob, os
fs = sorted(glob.glob('H0*_start.png'))
tw, th = 300, 537
sheet = Image.new('RGB', (tw*len(fs), th+28), (20, 20, 20))
d = ImageDraw.Draw(sheet)
F = ImageFont.truetype(r"D:\dev\LIV_homepage\output\lifting-city\edit\fonts\Pretendard-Bold.ttf", 20)
for i, p in enumerate(fs):
    sheet.paste(Image.open(p).resize((tw, th), Image.LANCZOS), (i*tw, 28))
    d.text((i*tw+6, 4), os.path.basename(p)[:3], font=F, fill=(255, 255, 255))
sheet.save('contact_sheet_H.png')
PY
```

`contact_sheet_H.png`를 열어 확인한다. **글자·사람·장비가 섞여 들어갔거나 중앙이 지저분하면 그 컷만 재생성한다(컷당 2회 한도).**

- [ ] **Step 4: 영상 6개 생성**

`generate_video_batch`로 index 1~6. 각 항목:
`{model:"kling3_0", aspect_ratio:"9:16", duration:6, mode:"pro", sound:"off", count:1, use_unlim:false, declined_preset_id:"24bae836-2c4a-48e0-89b6-49fcc0b21612", medias:[{role:"start_image", value:"<해당 이미지 job_id>"}], prompt:"<위 표의 영상 프롬프트>"}`

`declined_preset_id`를 반드시 넣는다. 넣지 않으면 프롬프트의 `dark` 같은 단어 때문에 프리셋 추천으로 대체되어 job이 만들어지지 않는다. `submitted_count`가 6인지 확인하고, 실패 항목은 이유를 보고 재제출한다.

- [ ] **Step 5: 30fps 프레임 시퀀스로 변환**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit/gen
for k in H01 H02 H03 H04 H05 H06; do
  mkdir -p "frames/$k"
  ( ffmpeg -v error -y -i "$k.mp4" \
      -vf "scale=1080:-2:flags=lanczos,crop=1080:1920,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
      -frames:v 180 -q:v 2 "frames/$k/%04d.jpg" ) &
done; wait
for k in H01 H02 H03 H04 H05 H06; do
  cp "frames/$k/0179.jpg" "frames/$k/0180.jpg"
  echo "$k: $(ls frames/$k | wc -l)"
done
```

Expected: 각 `180`. minterpolate가 마지막 프레임을 버리므로 179장이 나오고 복제로 180을 채운다.

- [ ] **Step 6: 마지막 1초 정착 여부를 기계로 판정**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit/gen
python - <<'PY'
import numpy as np, glob
from PIL import Image
for k in ["H01","H02","H03","H04","H05","H06"]:
    fs = sorted(glob.glob(f"frames/{k}/*.jpg"))
    def d(a, b):
        x = np.asarray(Image.open(a).convert("L"), float)
        y = np.asarray(Image.open(b).convert("L"), float)
        return float(np.abs(x - y).mean())
    peak = max(d(fs[i], fs[i+1]) for i in range(0, 150, 10))
    tail = max(d(fs[i], fs[i+1]) for i in range(len(fs)-30, len(fs)-1))
    ok = tail <= peak * 0.10
    print(f"{k}: peak={peak:.2f} tail={tail:.2f} {'OK' if ok else '흔들림 — 재시도 대상'}")
PY
```

`흔들림` 판정이 나온 컷은 영상 프롬프트 끝에 `The final 1.5 seconds are completely frozen with zero camera and object movement.` 를 덧붙여 1회 재시도한다.

- [ ] **Step 7: generation_log.json 기록**

`output/lobby-monitor/generation_log.json`에 1편과 같은 형식으로 기록한다: `credits`(사용액·단가·항목별 소계), `image_jobs`(키·job_id·프롬프트·사용 여부), `video_jobs`(키·job_id·start_image_job·프롬프트·사용 여부·재시도 사유), `submissions_rejected_without_charge`.

**비용은 잔액 차이가 아니라 제출한 job ID 수 × 단가로 계산한다.** 이 계정은 다른 세션과 공용이다.

- [ ] **Step 8: 커밋 (프레임 시퀀스는 제외)**

```bash
cd /d/dev/LIV_homepage
printf 'edit/gen/frames/\nedit/gen/*.mp4\nedit/gen/*_start.png\nedit/stills/\nedit/prep/\nrenders/\nedit/scenes/\n' > output/lobby-monitor/.gitignore
git add output/lobby-monitor/.gitignore output/lobby-monitor/generation_log.json
git commit -m "chore(video): 2~4편 배경 6종 생성 기록"
```

---

### Task 8: ②편 〈실이 하는 일〉 240초

**Files:**
- Create: `output/lobby-monitor/edit/video_thread.py`
- Test: `output/lobby-monitor/edit/tests/test_video_specs.py` (3편 공통, 이 태스크에서 생성)

**Interfaces:**
- Consumes: Task 1~6의 모든 모듈
- Produces:
  - `BLOCKS: list[dict]` — `{"id": str, "start": float, "dur": float, "fn": callable}`, 합 240.0
  - `TOTAL_FRAMES: int` = 7200
  - `render_frame(i: int) -> PIL.Image` (RGB 1080×1920)
  - CLI: `python video_thread.py --chunk N` (0~7, 각 900프레임), `--stills a,b,c --out DIR`

**블록 구성 (설계서 §3 ②):**

| id | start | dur | 내용 | 배경 |
| --- | --- | --- | --- | --- |
| A 훅 | 0 | 12 | P01T 실 확대 → 돌기 드러남, "실은 당기지 않습니다 / 겁니다" | H01 |
| B 실물 | 12 | 20 | P01 박스+실 전체, "압토스 실리프팅 · APTOS Visage" | H01 앰비언트 |
| C 원리1 | 32 | 38 | `thread_anim` 3단계 (각 12.6초), 단계 자막 + "개념도" | H01 앰비언트 |
| D 원리2 | 70 | 35 | `particle_anim` 확산, "나노 · 서브마이크로 · 마이크로" | H02 |
| E 라인업 | 105 | 40 | `face_diagram` + LL25/NAMICA19/LL50 부위 | H06 |
| F 인증 | 145 | 25 | KFDA 4등급 정식 허가 · CE · ISO 13485 · FDA MDSAP · 100개국 이상 | H03 |
| G 사람 | 170 | 38 | A03→A02→A01, "김수영 대표원장 / APTOS Professional Course 수료 / KR0062025" | H04 |
| H 공간 | 208 | 20 | I01·I04 | 사진 |
| I 마무리 | 228 | 12 | QR 고정 | I03 정지 배경 |

- [ ] **Step 1: 3편 공통 규격 테스트 작성**

Create `output/lobby-monitor/edit/tests/test_video_specs.py`:

```python
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
```

- [ ] **Step 2: 테스트 실행 — 스킵 확인**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v
```

Expected: `skipped` — 아직 편 모듈이 없다

- [ ] **Step 3: video_thread.py 구현**

`output/lifting-city/edit/render_video.py`의 장면 함수 작성 방식을 그대로 따른다. 차이는 두 가지다: 장면 길이가 블록마다 다르고, 배경이 블록별로 바뀐다.

뼈대는 다음과 같다. 각 블록 함수는 `(t_local)`을 받아 RGB 이미지를 반환한다.

```python
# -*- coding: utf-8 -*-
"""②편 〈실이 하는 일〉 240초 / 7,200프레임."""
import argparse
import os
import sys

from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(EDIT)
OUTPUT = os.path.dirname(ROOT)
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

from liv_video.spec import (W, H, FPS, SAFE, ROSE, ROSE_T, BROWN, OFFW, CHAR,
                            INK, CREAM, WHITE, CLINIC, FLOOR, PHONE, ADDRESS,
                            QR_TEXT, set_dirs)
set_dirs(os.path.join(OUTPUT, "lifting-city", "edit", "fonts"),
         os.path.join(EDIT, "prep"), os.path.join(EDIT, "gen"))

from liv_video.anim import clamp01, p, eo, eio, vis, reveal
from liv_video.draw import T, TL, put, rule, card, CARD, softplate, twidth, fit_size
from liv_video.media import asset, cover, photo_panel, clip_frame, ambient_plate, photo_plate, kb
from liv_video.chrome import draw_chrome
from liv_video.encode import encode_range

import thread_anim as ta
import particle_anim as pa
import face_diagram as fd

TOTAL_FRAMES = 7200
XF = 12                     # 블록 경계 크로스 디졸브 프레임 수


def _bg_clip(key, t, cut, **kw):
    """0~cut초는 생성 클립, 이후는 블러 플레이트를 가로 드리프트시킨다."""
    amb = kb(ambient_plate(key, kw.get("blur", 24), kw.get("dim", 0.46)),
             clamp01((t - cut) / max(1e-6, kw.get("span", 24.0))),
             1.0, 1.17, 0.45, 0.54, 0.55, 0.46)
    if t >= cut + 0.7:
        return amb
    live = clip_frame(key, int(t * FPS) + 1)
    return live if t <= cut else Image.blend(live, amb, eio((t - cut) / 0.7))
```

블록 함수는 아래 규칙으로 작성한다.

- **A 훅 (0~12초)**: 배경 `_bg_clip("H01", t, 6.0, span=6.0)`. `ta.draw_mechanism(img, (60, 780, 1020, 1140), "insert", p(t, 0.6, 4.0), show_tissue=False)` 로 실만 먼저 그린다. 6.2초 지점에서 **마스크 전환**으로 실물을 공개한다 — `reveal(img, top, (420, 900, 660, 1020), eo(p(t, 6.2, 1.0)), radius=14)`, 여기서 `top`은 `P01T` 실물 사진을 화면 크기로 커버 크롭한 이미지다. 전 구간 디졸브만 쓰지 않고 마스크를 섞으라는 설계서 §5 요구를 여기서 충족한다. 자막은 `T(img, "실은 당기지 않습니다", W/2, 420, "xb", 96, OFFW, "m", alpha=vis(t,0.5,None,0.45)[0], shadow=190, blur=20)` 와 1.8초 뒤 `"겁니다"` 를 같은 위치 아래 130px에 로즈로.
- **B 실물 (12~32초)**: `photo_panel("P01", 936, 620, radius=28)` 를 중앙에, 상단 아이브로우 `"리브성형외과가 쓰는 실"`, 하단에 `"압토스 실리프팅"` 96px + `"APTOS Visage"` 52px 로즈.
- **C 원리1 (32~70초)**: 12.6초씩 3구간. 각 구간에서 `ta.draw_mechanism(img, (60, 700, 1020, 1220), stage, prog)`, `stage`는 순서대로 `"insert"/"engage"/"fix"`, `prog = clamp01((tl - k*12.667) / 10.0)`. 자막은 `["① 실이 들어갑니다", "② 돌기가 조직을 겁니다", "③ 걸린 채 고정됩니다"]`. 매 프레임 `ta.draw_note(img, W - SAFE, 1560)` 호출.
- **D 원리2 (70~105초)**: 배경 `_bg_clip("H02", tl, 6.0, span=29.0)`. `pa.draw_release(img, (90, 620, 990, 1300), tl - 2.0, dur=31.0)`. 자막은 크기 클래스가 등장하는 시점(`tl`=3.0 / 14.0 / 24.0)에 맞춰 `"마이크로"`, `"서브마이크로"`, `"나노"` 를 왼쪽 정렬로 누적 표시하고, 상단에 `"히알루론산을 세 가지 크기로 나눠 담습니다"` 56px.
- **E 라인업 (105~145초)**: 배경 `_bg_clip("H06", tl, 6.0, span=34.0)`. `fd.draw_face(img, (240, 520, 840, 1320))` 후 13초 간격으로 `fd.highlight(...)` 부위를 바꾸며 카드 표기:
  `("cheek", "압토스 Light Lift 25", "볼")`, `("midface", "압토스 NAMICA 19", "중안부 · 하안부")`, `("submental", "압토스 Light Lift 50", "이중턱")`.
- **F 인증 (145~170초)**: 배경 `_bg_clip("H03", tl, 6.0, span=19.0)`. 2×2 카드에 `"KFDA 의료기기 4등급 정식 허가"`, `"유럽 CE 인증"`, `"ISO 13485"`, `"FDA MDSAP"`, 아래 큰 타이포로 `"100개국 이상 사용"`.
- **G 사람 (170~208초)**: 배경 `_bg_clip("H04", tl, 6.0, span=32.0)`. `photo_panel("A03", 936, 560)` → 12초 뒤 `"A02"` → 12초 뒤 `"A01"`(인증서는 `cover`로 번호 영역까지 확대). 자막 `"김수영 대표원장"` / `"APTOS Professional Course 수료"` / `"KR0062025"`.
- **H 공간 (208~228초)**: `kb(photo_plate("I01"), p(tl,0,20), 1.0, 1.16, 0.44, 0.5, 0.56, 0.5)` 위에 `photo_panel("I04", 936, 420)` 를 10초 지점에 겹치고 `CLINIC` + `FLOOR`.
- **I 마무리 (228~240초)**: 배경은 `kb(photo_plate("I03", blur=20, dim=0.62), p(tl, 0, 12), 1.14, 1.24, 0.44, 0.5, 0.56, 0.5)` 로 **천천히 움직인다**. 배경까지 멈추면 12초 완전 정지가 되어 Task 11의 `freezedetect` 0건 기준과 충돌하고 화면이 고장난 것처럼 보인다. **QR 카드만 완전히 고정**한다. QR 카드는 ①편 `qr_card()` 와 같은 구성(크림 카드 936×900, 상단 "상담 안내", QR 396px, URL, 전화, 주소)을 이 모듈에 복제해 `@lru_cache` 로 만들고 `put` 한다. 12초 내내 위치·내용 불변.

`render_frame`:

```python
def _block_at(i):
    t = i / float(FPS)
    for k, b in enumerate(BLOCKS):
        if b["start"] <= t < b["start"] + b["dur"] or k == len(BLOCKS) - 1:
            return k
    return len(BLOCKS) - 1


def render_block(k, i):
    b = BLOCKS[k]
    return b["fn"](i / float(FPS) - b["start"])


def render_frame(i):
    k = _block_at(i)
    img = render_block(k, i)
    half = XF // 2
    b0 = int(round(BLOCKS[k]["start"] * FPS))
    if k > 0 and (i - b0) < half:
        img = Image.blend(render_block(k - 1, i), img, eio((i - (b0 - half)) / float(XF)))
    if k < len(BLOCKS) - 1:
        b1 = int(round((BLOCKS[k]["start"] + BLOCKS[k]["dur"]) * FPS))
        if (b1 - i) <= half:
            img = Image.blend(img, render_block(k + 1, i), eio((i - (b1 - half)) / float(XF)))
    draw_chrome(img)
    return img
```

**마지막 블록에는 디졸브를 걸지 않는다** — QR 정지 요구와 충돌한다. `_block_at`이 마지막 블록을 반환할 때 위쪽 분기만 동작하고, 그 경계는 QR 시작 0.2초 전이므로 QR 영역에는 영향이 없다.

CLI는 `--chunk N`(0~7, 900프레임씩)과 `--stills`를 지원하고, `encode_range(render_frame, N*900, (N+1)*900, "scenes/C%02d.mp4" % N, crf=12)` 를 호출한다.

- [ ] **Step 4: 규격 테스트 실행**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v
```

Expected: 12 passed (video_thread 만 대상)

- [ ] **Step 5: 블록별 스틸 검수**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
python video_thread.py --stills 3,20,40,55,68,85,100,120,150,165,185,200,215,232 --out stills/v2
```

각 스틸을 열어 확인한다: 글자 잘림 없음, 안전여백 72px 유지, "개념도" 표기가 C·D·E 구간에 있음, 인증서 번호 판독 가능.

- [ ] **Step 6: 8청크 병렬 렌더 후 합치기**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
mkdir -p scenes
for k in 0 1 2 3 4 5 6 7; do ( python video_thread.py --chunk $k > "scenes/log_v2_$k.txt" 2>&1 ) & done; wait
grep -il traceback scenes/log_v2_*.txt
for k in 0 1 2 3 4 5 6 7; do printf "file 'C%02d.mp4'\n" $k; done > scenes/concat_v2.txt
cd /d/dev/LIV_homepage/output/lobby-monitor
mkdir -p renders
ffmpeg -v error -y -f concat -safe 0 -i edit/scenes/concat_v2.txt \
  -c:v libx264 -preset slow -crf 14 -maxrate 16M -bufsize 28M -pix_fmt yuv420p \
  -r 30 -fps_mode cfr -g 60 -an -movflags +faststart \
  renders/LIV_thread_1080x1920_4min_silent.mp4
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=width,height,r_frame_rate,nb_read_frames,pix_fmt \
  -show_entries format=duration -of default=nw=1 \
  renders/LIV_thread_1080x1920_4min_silent.mp4
```

Expected: `1080 / 1920 / 30/1 / 7200 / yuv420p / 240.000000`

- [ ] **Step 7: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/video_thread.py output/lobby-monitor/edit/tests/test_video_specs.py
git commit -m "feat(video): 2편 〈실이 하는 일〉 240초 - 실 메커니즘·캡슐 확산·라인업·인증"
```

---

### Task 9: ③편 〈조지아에서 배워 왔습니다〉 180초

**Files:**
- Create: `output/lobby-monitor/edit/video_georgia.py`
- Test: `output/lobby-monitor/edit/tests/test_video_specs.py` (Task 8에서 만든 파일이 자동으로 이 모듈을 포함한다)

**Interfaces:**
- Consumes: Task 1~7
- Produces: `BLOCKS`, `TOTAL_FRAMES = 5400`, `render_frame(i)`, CLI `--chunk N` (0~5, 900프레임씩)

| id | start | dur | 내용 | 배경 |
| --- | --- | --- | --- | --- |
| A 훅 | 0 | 14 | A01 인증서가 화면을 채우며 `Kim Sooyoung` · `KR0062025` 가 읽힐 때까지 확대 | A01 자체 |
| B 조지아 | 14 | 30 | A03 12초 → A04 12초 → 조판 6초, "조지아 트빌리시 / APTOS 본사 연수" | H04 |
| C 수여 | 44 | 22 | A02, "APTOS Professional Course 수료" / "Certified by G.·M.·C. Sulamanidze MD-PhD" | H04 앰비언트 |
| D 학회 | 66 | 34 | **A09 17초(스크린의 "Kim, Soo Young / Liv Plastic Surgery"를 확대해 읽히게) → A10 17초(AXA 연단)** | H05 |
| E 상담 | 100 | 26 | **A11 — 얼굴 부위를 짚으며 설명하는 실제 상담 장면**, "얼굴의 상태와 원하는 변화를 함께 봅니다" | H03 |
| F 사람 | 126 | 28 | **A12 14초 → D01 14초**, "김수영 대표원장" / "성형외과 전문의" | H03 앰비언트 |
| G 연결 | 154 | 14 | I04, "이 건물 4층에서 상담합니다" | 사진 |
| H 마무리 | 168 | 12 | QR 고정 | I03 (배경 드리프트, 카드 고정) |

- [ ] **Step 1: 블록 표를 코드로 옮기기 전에 테스트가 이 모듈을 집도록 확인**

`test_video_specs.py`의 `MODULES`는 파일 존재 여부로 결정되므로 별도 수정이 필요 없다. 빈 모듈을 만들어 테스트가 실패하는 것을 먼저 본다.

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
printf 'TOTAL_FRAMES = 0\nBLOCKS = []\n' > video_georgia.py
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v -k georgia
```

Expected: FAIL — `assert 0 == 5400`

- [ ] **Step 2: video_georgia.py 구현**

**먼저 `output/lobby-monitor/edit/video_thread.py`를 열어 읽는다.** 임포트 블록, `_bg_clip`, `BLOCKS` 자료구조, `render_frame`, CLI 부분을 그대로 가져와 블록 내용만 바꾼다(코드를 여기 다시 적지 않는 이유는 그 파일이 이미 리포에 있고 그쪽이 정본이기 때문이다). 위 블록 표대로 작성하되:

- **A 훅**: 배경 없이 `kb(photo_plate("A01", zoom_room=1.30), p(t, 0.4, 12.0), 1.0, 1.55, 0.5, 0.42, 0.5, 0.52)` 로 인증서를 천천히 확대한다. 4초 지점에 `softplate(img, W/2, 1500, 940, 300, 0.9)` 위로 `"Kim Sooyoung"` 72px, `"KR0062025"` 88px ExtraBold 로즈.
- **B 어디서**: `photo_panel("A03", 936, 700, radius=24)` 를 **12초**, 이어 `"A04"`를 **12초**, 마지막 12초는 사진 없이 H04 배경 위에 `"조지아 트빌리시"` 88px + `"APTOS 본사"` 64px 조판. **확대하지 않고 정지 컷으로 배치한다.** 설계서 §3 ③이 수술실 사진을 "각 12초 이내, 확대 없이"로 못박았으므로 18초씩 쓰면 안 된다.
- **C 수여**: `photo_panel("A02", 820, 1093, radius=24)` 중앙. 자막 2줄.
- **D 학회**: 이 편의 핵심이다. 앞 17초는 `A09`를 **스크린 글자가 읽히도록 확대**한다 — `kb(photo_plate("A09", zoom_room=1.30), p(tl, 0, 17), 1.0, 1.45, 0.5, 0.45, 0.46, 0.40)`. 자막은 하단에 `softplate` 위로 `"학회 발표"` 76px + `"Kim, Soo Young · Liv Plastic Surgery"` 44px. 뒤 17초는 `photo_panel("A10", 820, 1230, radius=24)` 정지 배치, 자막 `"Aptos Xperts Alliance"` 64px + `"압토스 국제 조직 연단"` 44px.
- **E 상담**: `photo_panel("A11", 936, 620, radius=24)` 중앙 + 하단 자막 `"얼굴의 상태와 원하는 변화를"` / `"함께 봅니다"` 각 64px. 확대하지 않는다.
- **F 사람**: 앞 14초는 `A12`가 가로 사진이므로 `photo_panel("A12", 936, 670, radius=24)` 패널로 배치. 뒤 14초는 ①편 M07의 월넛 프레임 연출 — `CARD(img, fx-22, fy-22, fw+44, fh+44, 20, BROWN)` 위에 `photo_panel("D01", 560, 842, radius=10, shadow=0, border=False)`.
- **G 연결**: `photo_panel("I04", 936, 560)` + `FLOOR`.
- **H 마무리**: ②편과 동일한 QR 카드. **배경은 ②편 I블록과 같은 방식으로 천천히 움직이고 QR 카드만 고정**한다.

- [ ] **Step 3: 테스트 실행**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v
```

Expected: 24 passed (video_thread + video_georgia)

- [ ] **Step 4: 인증서 번호가 실제로 읽히는지 스틸로 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
python video_georgia.py --stills 8,12,25,50,70,80,90,110,135,158,175 --out stills/v3
```

`stills/v3/t0012.00.png`에서 `KR0062025`가, `stills/v3/t0080.00.png`에서 학회 스크린의
`Kim, Soo Young`이 판독되는지 확인한다. 안 읽히면 각각 A블록 줌 1.55→1.75, D블록 줌 1.45→1.70으로 올린다.

- [ ] **Step 5: 6청크 렌더 + 인코딩**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
for k in 0 1 2 3 4 5; do ( python video_georgia.py --chunk $k > "scenes/log_v3_$k.txt" 2>&1 ) & done; wait
grep -il traceback scenes/log_v3_*.txt
for k in 0 1 2 3 4 5; do printf "file 'G%02d.mp4'\n" $k; done > scenes/concat_v3.txt
cd /d/dev/LIV_homepage/output/lobby-monitor
ffmpeg -v error -y -f concat -safe 0 -i edit/scenes/concat_v3.txt \
  -c:v libx264 -preset slow -crf 14 -maxrate 16M -bufsize 28M -pix_fmt yuv420p \
  -r 30 -fps_mode cfr -g 60 -an -movflags +faststart \
  renders/LIV_georgia_1080x1920_3min_silent.mp4
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=nb_read_frames -show_entries format=duration -of default=nw=1 \
  renders/LIV_georgia_1080x1920_3min_silent.mp4
```

Expected: `5400` / `180.000000`

- [ ] **Step 6: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/video_georgia.py
git commit -m "feat(video): 3편 〈조지아에서 배워 왔습니다〉 180초 - 연수·수여·학회 발표"
```

---

### Task 10: ④편 〈리프팅 고민 지도〉 180초

**Files:**
- Create: `output/lobby-monitor/edit/video_map.py`

**Interfaces:**
- Consumes: Task 1~7
- Produces: `BLOCKS`, `TOTAL_FRAMES = 5400`, `render_frame(i)`, CLI `--chunk N` (0~5)

고민 3종은 병원 공개 분류(`ko.json > sections.concerns.cards`)에서 **안면거상 상담·지방재배치 상담을 제외한** 것이다. 원장님이 2026-09-19에 미진행으로 확인했다.

| 순서 | 고민 | 상담 방향 | 하이라이트 부위 |
| --- | --- | --- | --- |
| 1 | 처진 얼굴선과 턱선 | 압토스 · 실리프팅 | `jawline` |
| 2 | 수술 없이 탄력 개선 | 울쎄라 · 써마지 · 복합 리프팅 | `midface` |
| 3 | 피부결 · 모공 · 재생 | 포텐자 · 리쥬란 · 쥬베룩 | `texture` |

| id | start | dur | 내용 |
| --- | --- | --- | --- |
| A 훅 | 0 | 12 | 얼굴 선화에 3개 지점이 차례로 점등, "어디가 제일 신경 쓰이세요?" |
| B 고민1 | 12 | 40 | 부위 점등 8초 → 고민 문장 12초 → 상담 방향 태그 12초 → 병원 연결 8초 |
| C 고민2 | 52 | 40 | 동일 구조 |
| D 고민3 | 92 | 40 | 동일 구조 |
| E 정리 | 132 | 24 | "정답은 상담에서 함께 정합니다" |
| F 병원 | 156 | 12 | 리브성형외과 · 이 건물 4층 |
| G 마무리 | 168 | 12 | QR 고정 |

- [ ] **Step 1: 빈 모듈로 테스트 실패 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
printf 'TOTAL_FRAMES = 0\nBLOCKS = []\n' > video_map.py
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v -k map
```

Expected: FAIL — `assert 0 == 5400`

- [ ] **Step 2: video_map.py 구현**

배경은 전 구간 `_bg_clip("H06", tl, 6.0, span=...)` 계열로 통일하고, 얼굴 선화는 A~D 블록에서 같은 좌표 `(240, 470, 840, 1270)` 에 고정해 부위만 바뀌게 한다. **장비 사진을 쓰지 않는다** — ①편과의 중복을 피하는 장치다.

각 고민 블록(40초)의 내부 타이밍:

```python
def _concern(tl, region, title, tags):
    img = _bg_clip("H06", tl, 6.0, span=34.0)
    fd.draw_face(img, FACE_BOX)
    fd.highlight(img, FACE_BOX, region, alpha=eo(p(tl, 0.4, 1.2)))
    a1, r1 = vis(tl, 8.0, None, 0.55)
    T(img, title, W / 2, 1360 + int((1 - r1) * 26), "xb", 76, OFFW, "m", "a", a1,
      shadow=190, blur=18, maxw=W - 2 * SAFE)
    a2, r2 = vis(tl, 20.0, None, 0.55)
    CARD(img, SAFE, 1480, W - 2 * SAFE, 150, 26, CREAM, a2, dy=int((1 - r2) * 30))
    T(img, tags, W / 2, 1530 + int((1 - r2) * 30), "b", 54, INK, "m", "a", a2,
      maxw=W - 2 * SAFE - 60)
    a3, _ = vis(tl, 32.0, None, 0.5)
    T(img, "리브성형외과에서 상담합니다", W / 2, 1680, "m", 46, ROSE_T, "m", "a", a3,
      shadow=150, blur=12)
    return img
```

`FACE_BOX = (240, 470, 840, 1270)`. 세 블록은 `_concern` 에 다른 인자를 넘긴다:

```python
CONCERNS = [
    ("jawline", "처진 얼굴선과 턱선", "압토스 · 실리프팅"),
    ("midface", "수술 없이 탄력 개선", "울쎄라 · 써마지 · 복합 리프팅"),
    ("texture", "피부결 · 모공 · 재생", "포텐자 · 리쥬란 · 쥬베룩"),
]
```

E 블록은 `photo_panel("A11", 936, 520, radius=24)` 실제 상담 장면을 위에 두고, 그 아래
`softplate` 위에 `"정답은 상담에서 함께 정합니다"` 84px 한 줄과 세 고민명을 42px로 나열한다. F는 `kb(photo_plate("I01"), ...)` 위에 `CLINIC` 116px + `FLOOR`. G는 ②③편과 같은 QR 카드이며, **배경은 움직이고 QR 카드만 고정**한다.

- [ ] **Step 3: 테스트 실행**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests/test_video_specs.py -v
```

Expected: 36 passed (3편 모두)

- [ ] **Step 4: 제외한 시술이 실제로 안 들어갔는지 확인**

```bash
cd /d/dev/LIV_homepage
grep -n "안면거상\|지방재배치\|눈 밑\|근본적인 처짐" output/lobby-monitor/edit/video_map.py || echo "OK: 미진행 시술 언급 없음"
```

Expected: `OK: 미진행 시술 언급 없음`

- [ ] **Step 5: 6청크 렌더 + 인코딩**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/edit
for k in 0 1 2 3 4 5; do ( python video_map.py --chunk $k > "scenes/log_v4_$k.txt" 2>&1 ) & done; wait
grep -il traceback scenes/log_v4_*.txt
for k in 0 1 2 3 4 5; do printf "file 'M%02d.mp4'\n" $k; done > scenes/concat_v4.txt
cd /d/dev/LIV_homepage/output/lobby-monitor
ffmpeg -v error -y -f concat -safe 0 -i edit/scenes/concat_v4.txt \
  -c:v libx264 -preset slow -crf 14 -maxrate 16M -bufsize 28M -pix_fmt yuv420p \
  -r 30 -fps_mode cfr -g 60 -an -movflags +faststart \
  renders/LIV_map_1080x1920_3min_silent.mp4
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=nb_read_frames -show_entries format=duration -of default=nw=1 \
  renders/LIV_map_1080x1920_3min_silent.mp4
```

Expected: `5400` / `180.000000`

- [ ] **Step 6: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/video_map.py
git commit -m "feat(video): 4편 〈리프팅 고민 지도〉 180초 - 병원 공개 고민 3종"
```

---

### Task 11: 3편 통합 검수와 납품

**Files:**
- Create: `output/lobby-monitor/edit/qc_check.py`
- Create: `output/lobby-monitor/qc_report.md`
- Create: `output/lobby-monitor/renders/*_preview.mp4` 3개
- Modify: `output/lobby-monitor/generation_log.json`
- Modify: `docs/superpowers/specs/2026-09-19-lobby-monitor-video-set-design.md` (상태 갱신)

**Interfaces:**
- Consumes: Task 8~10의 마스터 MP4 3개
- Produces: `output/lobby-monitor/edit/qc_result.json`

- [ ] **Step 1: qc_check.py 작성**

①편 `output/lifting-city/edit/qc_check.py`를 복사해 3편을 순회하도록 고친다. 검사 항목과 통과 기준:

| 항목 | 기준 |
| --- | --- |
| 규격 | 각 편 1080×1920 / 30fps / yuv420p / 오디오 스트림 0 / 프레임 수 7200·5400·5400 / 길이 240.000·180.000·180.000 |
| 고정 크롬 | 2fps 전수 샘플에서 하단 로즈 필·상단 로고·상단 병원명 누락 0건 |
| 검은 프레임 | 샘플 평균 휘도 18 미만 0건 |
| QR | 각 편 마지막 12초 내 6개 시점에서 `https://liv-clinic.net/ko/contact` 디코딩 |
| 금지 문구 | `copy_guard.main()` 위반 0건 |

```python
# qc_check.py 핵심부
MASTERS = [
    ("thread", "LIV_thread_1080x1920_4min_silent.mp4", 7200, 240.0),
    ("georgia", "LIV_georgia_1080x1920_3min_silent.mp4", 5400, 180.0),
    ("map", "LIV_map_1080x1920_3min_silent.mp4", 5400, 180.0),
]
```

각 편의 QR 샘플 시점은 `dur-11.5, dur-10, dur-7.5, dur-5, dur-2.5, dur-0.1`로 계산한다.

- [ ] **Step 2: 검수 실행**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor
python edit/qc_check.py
```

Expected: 마지막 줄 `ALL PASS`. 실패 항목이 있으면 해당 태스크로 돌아간다.

- [ ] **Step 3: 검은 프레임·정지 구간 확인**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/renders
for f in LIV_thread_*.mp4 LIV_georgia_*.mp4 LIV_map_*.mp4; do
  echo "=== $f"
  echo -n "black: "; ffmpeg -v info -i "$f" -vf "blackdetect=d=0.05:pic_th=0.98:pix_th=0.10" -an -f null - 2>&1 | grep -c "black_start"
  echo -n "freeze>=3s: "; ffmpeg -v info -i "$f" -vf "freezedetect=n=0.001:d=3" -an -f null - 2>&1 | grep -c "freeze_start"
done
```

Expected: 각 편 `black: 0`. `freeze>=3s`는 **QR 구간 1건까지 허용**(마지막 12초 QR 고정은 의도된 설계이며 배경만 움직인다 — 배경이 움직이므로 실제로는 0건이 나와야 정상이고, 1건 이상이면 배경 드리프트가 빠졌다는 뜻이므로 해당 편을 고친다).

- [ ] **Step 4: 프리뷰 3개 생성**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor/renders
for f in LIV_thread_1080x1920_4min_silent LIV_georgia_1080x1920_3min_silent LIV_map_1080x1920_3min_silent; do
  ffmpeg -v error -y -i "$f.mp4" -vf "scale=540:960:flags=lanczos" \
    -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -r 30 -fps_mode cfr -an \
    -movflags +faststart "${f%%_1080*}_preview.mp4"
done
ls -la
```

- [ ] **Step 5: 장면 스틸 시트 3장 생성**

```bash
cd /d/dev/LIV_homepage/output/lobby-monitor
python - <<'PY'
import subprocess, os
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype(r"D:\dev\LIV_homepage\output\lifting-city\edit\fonts\Pretendard-Bold.ttf", 17)
jobs = [("thread", "renders/LIV_thread_1080x1920_4min_silent.mp4",
         [3,20,40,55,68,85,100,120,150,165,185,200,215,232]),
        ("georgia", "renders/LIV_georgia_1080x1920_3min_silent.mp4",
         [8,25,45,60,85,100,120,140,158,175]),
        ("map", "renders/LIV_map_1080x1920_3min_silent.mp4",
         [5,20,35,48,65,80,100,115,140,160,175])]
os.makedirs("edit/stills", exist_ok=True)
for name, mp4, times in jobs:
    ims = []
    for t in times:
        fp = "edit/stills/_%s_%d.png" % (name, t)
        subprocess.run(["ffmpeg","-v","error","-y","-ss",str(t),"-i",mp4,"-frames:v","1",fp], check=True)
        ims.append((t, fp))
    cols = 7; tw, th = 210, 373
    rows = (len(ims)+cols-1)//cols
    s = Image.new("RGB", (tw*cols, (th+22)*rows), (18,18,18)); d = ImageDraw.Draw(s)
    for i,(t,fp) in enumerate(ims):
        x=(i%cols)*tw; y=(i//cols)*(th+22)
        s.paste(Image.open(fp).resize((tw,th), Image.LANCZOS), (x,y+22))
        d.text((x+5,y+2), "%ds"%t, font=F, fill=(255,255,255))
    s.save("edit/stills/sheet_%s.png" % name)
    print("edit/stills/sheet_%s.png" % name)
PY
```

세 시트를 모두 열어 확인한다: 글자 잘림, 오탈자, 잘못된 장비-이름 짝, 안전여백 침범.

- [ ] **Step 6: qc_report.md 작성**

①편 `output/lifting-city/qc_report.md` 형식을 따른다. 포함할 것:
규격 실측표(3편), 고정 크롬 전수 검사 결과, 검은 프레임·정지 구간, QR 재스캔 표(편별 6시점), 금지 문구 대조 결과, 설계서 대비 변경점, 비용(job ID 기준), 현장 확인 항목.

**현장 확인 항목에 반드시 남길 것**: 2~3m 거리 가독성, 4편 16분 루프 재생 설정, 실제 휴대폰 QR 스캔, 의료광고 문구 최종 검토(이 검수는 심의 완료가 아님), 수술실 사진에 대한 입주민 반응.

- [ ] **Step 7: generation_log.json 최종 갱신**

Task 7의 기록에 실제 사용 배경과 미사용 배경, 재시도 사유, 최종 비용 합계를 채운다. 산출물 경로 3편과 프리뷰 3개를 `outputs` 배열에 추가한다.

- [ ] **Step 8: 설계서 상태 갱신**

```bash
cd /d/dev/LIV_homepage
python - <<'PY'
import io
p = "docs/superpowers/specs/2026-09-19-lobby-monitor-video-set-design.md"
s = io.open(p, encoding="utf-8").read()
s = s.replace("**상태**: 설계 확정 (2026-09-19) — 구현 계획 작성 단계",
              "**상태**: 제작 완료 — 검수 통과. 산출물 `output/lobby-monitor/renders/`, 검수 `output/lobby-monitor/qc_report.md`", 1)
io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
PY
```

- [ ] **Step 9: 전체 테스트 재실행**

```bash
cd /d/dev/LIV_homepage
python -m pytest output/lobby-monitor/edit/tests -v
python output/lobby-monitor/edit/copy_guard.py
```

Expected: 모든 테스트 통과, `위반 0건`

- [ ] **Step 10: 커밋**

```bash
cd /d/dev/LIV_homepage
git add output/lobby-monitor/edit/qc_check.py output/lobby-monitor/qc_report.md \
        output/lobby-monitor/generation_log.json \
        docs/superpowers/specs/2026-09-19-lobby-monitor-video-set-design.md
git commit -m "feat(video): 2~4편 통합 검수 통과, 납품 문서 작성"
```

---

## 실행 순서와 병렬 가능성

Task 1 → 2 → (3, 4, 5, 6 병렬 가능) → 7 → (8, 9, 10 병렬 가능) → 11

Task 7(배경 생성)은 외부 API 호출이고 비용이 발생하므로 반드시 단독으로, 견적 재확인 후 실행한다.

## 이 계획에 일부러 넣지 않은 것

설계서 §4 "이 작업 밖에서 처리할 것" — 홈페이지 `sections.concerns.cards`의 `fundamental`·
`underEye`가 미진행 시술(안면거상 상담·지방재배치 상담)을 안내하고 있다. 영상에서는 뺐지만
홈페이지 수정은 4개 로케일 동시 변경이고 `verify:i18n` 게이트를 통과해야 하므로 별도 작업으로
분리한다. 이 계획을 끝낸 뒤 원장님께 다시 확인받고 진행한다.
