from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1400, 'height': 900})

    print("Navigating to staff page...")
    page.goto('http://localhost:3000/ko/about/staff', timeout=60000)
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(2000)

    # 김수영 전문의 섹션 스크린샷
    page.screenshot(path='c:/dev/LIV_homepage/staff_kim_new.png', full_page=False)
    print("Screenshot 1: staff_kim_new.png")

    # 스크롤하여 천신혜 원장 섹션 확인
    page.evaluate('window.scrollTo(0, document.body.scrollHeight * 0.45)')
    page.wait_for_timeout(1000)
    page.screenshot(path='c:/dev/LIV_homepage/staff_cheon_new.png', full_page=False)
    print("Screenshot 2: staff_cheon_new.png")

    # 전체 페이지
    page.screenshot(path='c:/dev/LIV_homepage/staff_full_new.png', full_page=True)
    print("Screenshot 3: staff_full_new.png")

    print("Done!")
    browser.close()
