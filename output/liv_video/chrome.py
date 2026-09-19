# -*- coding: utf-8 -*-
"""전 구간 고정 노출되는 상·하단 크롬(병원명 / 이 건물 4층 / 전화번호)."""
import numpy as np
from PIL import Image

from .draw import T, card, twidth
from .media import asset
from .spec import W, H, SAFE, CLINIC, FLOOR, PHONE, ROSE, OFFW, WHITE


# ---------------------------------------------------------------- fixed chrome
def _scrim(height, a_top, a_bot, color=(24, 18, 15)):
    a = np.linspace(a_top, a_bot, height)
    rgba = np.zeros((height, W, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
    rgba[..., 3] = np.repeat(a[:, None], W, axis=1).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


_CHROME = {}


def chrome():
    if "top" not in _CHROME:
        # ---- 상단: 병원 로고 + 병원명
        top = Image.new("RGBA", (W, 330), (0, 0, 0, 0))
        top.alpha_composite(_scrim(330, 172, 0))
        logo = asset("logo_white").resize((247, 58), Image.LANCZOS)
        top.alpha_composite(logo, (SAFE, 84))
        T(top, CLINIC, W - SAFE, 113, "sb", 46, OFFW, "r", "c", 1.0, shadow=150, blur=10)
        _CHROME["top"] = top

        # ---- 하단: "이 건물 4층" 필 + 전화번호
        bot = Image.new("RGBA", (W, 430), (0, 0, 0, 0))
        bot.alpha_composite(_scrim(430, 0, 205))
        py = 430 - 72 - 92            # 하단 안전여백 72 위
        pw = int(twidth(FLOOR, "b", 50) + 76)
        pill, pad = card(pw, 92, 46, ROSE, shadow=110)
        bot.alpha_composite(pill, (SAFE - pad, py - pad))
        T(bot, FLOOR, SAFE + pw / 2, py + 46, "b", 50, WHITE, "m", "c")
        T(bot, PHONE, W - SAFE, py + 46, "m", 42, OFFW, "r", "c", 1.0, shadow=140, blur=10)
        _CHROME["bot"] = bot
    return _CHROME["top"], _CHROME["bot"]


def draw_chrome(base):
    top, bot = chrome()
    base.paste(top, (0, 0), top)
    base.paste(bot, (0, H - 430), bot)
