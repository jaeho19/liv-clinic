# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    urls_to_test = [
        '/ko/laser',
        '/ko/laser/pigmentation',
        '/ko/laser/vascular',
        '/ko/laser/skintone',
        '/ko/laser/hair-removal',
        '/ko/laser/tattoo',
    ]

    print("Testing laser pages directly...\n")

    for url in urls_to_test:
        full_url = f'http://localhost:3000{url}'
        page.goto(full_url)
        page.wait_for_load_state('networkidle')

        body_text = page.locator('body').inner_text()
        is_404 = '404' in body_text and 'could not be found' in body_text.lower()

        status = "ERROR 404" if is_404 else "OK"
        print(f"{status}: {url}")

        if is_404:
            page.screenshot(path=f'c:/dev/LIV_homepage/error_{url.replace("/", "_")}.png')

    browser.close()
    print("\nTest complete.")
