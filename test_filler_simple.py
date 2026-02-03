"""Test filler treatment areas section with retry logic"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    # Wait a bit for server to be fully ready
    print("Waiting for server to warm up...")
    time.sleep(5)

    # Try to connect with retries
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}: Navigating to page...")
            page.goto('http://localhost:3000/ko/antiaging/filler', timeout=90000)
            page.wait_for_load_state('domcontentloaded', timeout=30000)
            print("Page loaded!")
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            else:
                raise

    # Scroll to treatment areas section
    print("Scrolling to treatment areas section...")
    page.evaluate("""
        const sections = document.querySelectorAll('section');
        for (const s of sections) {
            if (s.textContent.includes('시술 부위') || s.textContent.includes('Treatment Areas')) {
                s.scrollIntoView({ behavior: 'instant', block: 'start' });
                break;
            }
        }
    """)
    page.wait_for_timeout(1500)

    # Take initial screenshot
    page.screenshot(path='c:/dev/LIV_homepage/filler_new_01_initial.png', full_page=False)
    print("1. Initial view captured")

    # Click on first treatment area (이마)
    try:
        first_area = page.locator('button:has-text("이마")').first
        if first_area.is_visible():
            first_area.click()
            page.wait_for_timeout(800)
            page.screenshot(path='c:/dev/LIV_homepage/filler_new_02_forehead.png', full_page=False)
            print("2. Forehead selected - marker should appear on image")
    except Exception as e:
        print(f"Could not click forehead: {e}")

    # Click on 입술
    try:
        lips = page.locator('button:has-text("입술")').first
        if lips.is_visible():
            lips.click()
            page.wait_for_timeout(800)
            page.screenshot(path='c:/dev/LIV_homepage/filler_new_03_lips.png', full_page=False)
            print("3. Lips selected - marker should appear on image")
    except Exception as e:
        print(f"Could not click lips: {e}")

    # Click on 턱끝
    try:
        chin = page.locator('button:has-text("턱끝")').first
        if chin.is_visible():
            chin.click()
            page.wait_for_timeout(800)
            page.screenshot(path='c:/dev/LIV_homepage/filler_new_04_chin.png', full_page=False)
            print("4. Chin selected - marker should appear on image")
    except Exception as e:
        print(f"Could not click chin: {e}")

    browser.close()
    print("\nDone! Check screenshots in c:/dev/LIV_homepage/")
