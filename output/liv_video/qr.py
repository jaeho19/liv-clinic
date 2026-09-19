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
