"""Test filler treatment areas section - side-by-side layout with click interaction"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    # Navigate to filler page with extended timeout
    page.goto('http://localhost:3000/ko/antiaging/filler', timeout=60000)
    page.wait_for_load_state('networkidle', timeout=60000)

    # Scroll to treatment areas section
    page.evaluate("""
        const section = document.querySelector('section:has(h2)');
        const sections = document.querySelectorAll('section');
        for (const s of sections) {
            if (s.textContent.includes('시술 부위') || s.textContent.includes('Treatment Areas')) {
                s.scrollIntoView({ behavior: 'instant', block: 'start' });
                break;
            }
        }
    """)
    page.wait_for_timeout(1000)

    # Take initial screenshot of the treatment areas section
    page.screenshot(path='c:/dev/LIV_homepage/filler_areas_01_initial.png', full_page=False)
    print("1. Initial view captured")

    # Find and click on first treatment area (이마)
    try:
        first_area = page.locator('button:has-text("이마")').first
        if first_area.is_visible():
            first_area.click()
            page.wait_for_timeout(500)
            page.screenshot(path='c:/dev/LIV_homepage/filler_areas_02_forehead_selected.png', full_page=False)
            print("2. Forehead (이마) selected")
    except Exception as e:
        print(f"Could not click forehead: {e}")

    # Click on another area (코)
    try:
        nose_area = page.locator('button:has-text("코")').first
        if nose_area.is_visible():
            nose_area.click()
            page.wait_for_timeout(500)
            page.screenshot(path='c:/dev/LIV_homepage/filler_areas_03_nose_selected.png', full_page=False)
            print("3. Nose (코) selected")
    except Exception as e:
        print(f"Could not click nose: {e}")

    # Click on lips (입술)
    try:
        lips_area = page.locator('button:has-text("입술")').first
        if lips_area.is_visible():
            lips_area.click()
            page.wait_for_timeout(500)
            page.screenshot(path='c:/dev/LIV_homepage/filler_areas_04_lips_selected.png', full_page=False)
            print("4. Lips (입술) selected")
    except Exception as e:
        print(f"Could not click lips: {e}")

    # Take full page screenshot
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(500)
    page.screenshot(path='c:/dev/LIV_homepage/filler_areas_05_full_page.png', full_page=True)
    print("5. Full page captured")

    browser.close()
    print("\nDone! Screenshots saved to c:/dev/LIV_homepage/")
