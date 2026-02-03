# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("Loading page...")
    page.goto('http://localhost:3000/ko')
    page.wait_for_load_state('networkidle')
    print("Page loaded")

    # Full page screenshot
    page.screenshot(path='C:/dev/LIV_homepage/screenshots/debug_fullpage.png', full_page=True)
    print("Full page screenshot saved")

    # Get page HTML structure
    html = page.content()

    # Check for equipment-related content
    print("\n--- Checking for equipment section ---")

    # Look for specific classes or text
    checks = [
        'infinite-scroll-track',
        'equipment',
        'Ultherapy',
        'Premium',
        '정품',
        '장비'
    ]

    for check in checks:
        if check.lower() in html.lower():
            print(f"  [FOUND] '{check}' in page")
        else:
            print(f"  [NOT FOUND] '{check}' in page")

    # Check what sections exist
    print("\n--- Page structure ---")
    sections = page.locator('section').all()
    print(f"Number of sections: {len(sections)}")

    # Get all text containing "장비" or "equipment"
    equipment_elements = page.locator('text=/장비|equipment|Equipment/i').all()
    print(f"\nElements with 'equipment/장비': {len(equipment_elements)}")

    # Check if it's a client-side rendered component
    print("\n--- Scroll down and check ---")
    page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
    page.wait_for_timeout(2000)
    page.screenshot(path='C:/dev/LIV_homepage/screenshots/debug_scrolled.png', full_page=False)
    print("Scrolled screenshot saved")

    # Re-check after scroll
    scroll_track = page.locator('.infinite-scroll-track')
    print(f"\ninfinite-scroll-track count: {scroll_track.count()}")

    browser.close()
    print("\nDone!")
