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
