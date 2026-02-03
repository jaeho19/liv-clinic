# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    print("1. Loading page...")
    page.goto('http://localhost:3000/ko/medical')
    page.wait_for_load_state('networkidle')

    # Take screenshot before scroll
    page.screenshot(path='c:/dev/LIV_homepage/sticky_before_scroll.png')
    print("   Screenshot before scroll saved")

    # Scroll down
    print("\n2. Scrolling down...")
    page.evaluate('window.scrollBy(0, 300)')
    time.sleep(0.5)

    # Measure positions
    header = page.locator('header').first
    header_box = header.bounding_box()
    header_bottom = header_box['y'] + header_box['height']
    print(f"   Header bottom: {header_bottom:.0f}px")

    search_section = page.locator('section').nth(1)  # Second section (search)
    search_box = search_section.bounding_box()
    search_top = search_box['y']
    print(f"   Search section top: {search_top:.0f}px")

    gap = search_top - header_bottom
    print(f"   Gap between header and search: {gap:.0f}px")

    # Take screenshot after scroll
    page.screenshot(path='c:/dev/LIV_homepage/sticky_after_scroll.png')
    print("   Screenshot after scroll saved")

    if gap <= 1:
        print("\n   SUCCESS: No gap between header and search!")
    else:
        print(f"\n   WARNING: {gap:.0f}px gap exists")

    browser.close()
    print("\nTest complete.")
