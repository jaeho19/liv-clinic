# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to laser page
    print("1. Navigating to /ko/laser...")
    page.goto('http://localhost:3000/ko/laser')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='c:/dev/LIV_homepage/laser_page.png', full_page=True)
    print(f"   Current URL: {page.url}")

    # Find all links with href containing 'laser'
    print("\n2. Looking for laser category links...")
    links = page.locator('a[href*="laser"]').all()

    for link in links:
        href = link.get_attribute('href')
        print(f"   Link href: {href}")

    # Try to click the pigmentation link directly
    print("\n3. Clicking pigmentation link...")
    pigmentation_link = page.locator('a[href*="pigmentation"]').first

    if pigmentation_link.count() > 0:
        href = pigmentation_link.get_attribute('href')
        print(f"   href attribute: {href}")
        pigmentation_link.click()
        page.wait_for_load_state('networkidle')

        print(f"\n4. After click:")
        print(f"   Current URL: {page.url}")

        # Check for 404
        body_text = page.locator('body').inner_text()
        if '404' in body_text:
            print("\n   ERROR: 404 DETECTED!")
            page.screenshot(path='c:/dev/LIV_homepage/laser_404.png', full_page=True)
        else:
            print("\n   SUCCESS: Page loaded")
            page.screenshot(path='c:/dev/LIV_homepage/laser_pigmentation.png', full_page=True)
    else:
        print("   ERROR: Pigmentation link not found!")

    browser.close()
    print("\nTest complete.")
