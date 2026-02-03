from playwright.sync_api import sync_playwright
import time
import requests

# 서버 초기화 대기 - 서버가 실제로 응답할 때까지 대기
print("Waiting for server to be ready...")
for i in range(30):
    try:
        resp = requests.get('http://localhost:3000/', timeout=5)
        if resp.status_code == 200 or resp.status_code == 307:
            print(f"Server responded with status {resp.status_code}")
            break
    except Exception as e:
        print(f"Attempt {i+1}: {e}")
    time.sleep(2)

time.sleep(3)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1400, 'height': 900})

    print("Navigating to staff page...")
    page.goto('http://localhost:3000/ko/about/staff', timeout=120000, wait_until='domcontentloaded')
    print("Waiting for network idle...")
    page.wait_for_load_state('networkidle', timeout=60000)
    page.wait_for_timeout(3000)

    # 김수영 전문의 섹션 스크린샷
    page.screenshot(path='c:/dev/LIV_homepage/staff_kim.png', full_page=False)

    # 페이지 스크롤하여 천신혜 원장 섹션 확인
    page.evaluate('window.scrollTo(0, document.body.scrollHeight * 0.5)')
    page.wait_for_timeout(1000)
    page.screenshot(path='c:/dev/LIV_homepage/staff_cheon.png', full_page=False)

    # 전체 페이지 스크린샷
    page.screenshot(path='c:/dev/LIV_homepage/staff_full.png', full_page=True)

    print("Screenshots captured successfully!")
    browser.close()
