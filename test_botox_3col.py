"""Test botox page 3-column layout and SVG overlay"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # First warm up the server with the home page
    print("Warming up server...")
    try:
        page.goto('http://localhost:3000/ko', timeout=90000)
        page.wait_for_load_state('domcontentloaded', timeout=60000)
        print("Home page loaded!")
    except Exception as e:
        print(f"Home page load issue: {e}")

    time.sleep(2)

    # Navigate to botox page with longer timeout for Next.js compilation
    print("Navigating to botox page...")
    page.goto('http://localhost:3000/ko/antiaging/botox', timeout=90000)
    page.wait_for_load_state('domcontentloaded', timeout=60000)
    print("Botox page loaded!")

    # Scroll to treatment areas section
    page.evaluate('''() => {
        const section = document.querySelector('section:has(h2)');
        if (section) {
            // Find the treatment areas section by looking for the specific heading
            const sections = document.querySelectorAll('section');
            for (const s of sections) {
                if (s.textContent.includes('Treatment Areas') || s.textContent.includes('시술 부위')) {
                    s.scrollIntoView({ behavior: 'instant', block: 'start' });
                    break;
                }
            }
        }
    }''')
    page.wait_for_timeout(500)

    # Take full page screenshot
    page.screenshot(path='C:/dev/LIV_homepage/botox_3col_fullpage.png', full_page=True)

    # Scroll to treatment areas section and capture
    page.evaluate('''() => {
        // Scroll to approximately where treatment areas section should be
        window.scrollTo(0, 1800);
    }''')
    page.wait_for_timeout(500)

    # Take viewport screenshot of treatment areas
    page.screenshot(path='C:/dev/LIV_homepage/botox_3col_treatment_areas.png')

    # Test hovering on a treatment area to trigger SVG overlay
    # Look for the treatment area buttons
    buttons = page.locator('button:has-text("이마")').all()
    if buttons:
        buttons[0].hover()
        page.wait_for_timeout(800)
        page.screenshot(path='C:/dev/LIV_homepage/botox_3col_forehead_hover.png')

    # Test another area
    buttons = page.locator('button:has-text("사각턱")').all()
    if buttons:
        buttons[0].hover()
        page.wait_for_timeout(800)
        page.screenshot(path='C:/dev/LIV_homepage/botox_3col_masseter_hover.png')

    print("Screenshots captured successfully!")
    browser.close()
