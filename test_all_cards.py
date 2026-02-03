"""
4개 카드 클릭 동작 비교 테스트
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    card_names = ['LIFTING', 'PETIT', 'GLOW', 'TOTAL']

    for name in card_names:
        print(f"\n=== {name} SIGNATURE card test ===")

        page.goto('http://localhost:3000/ko/signature')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)

        # 카드 그리드로 스크롤
        cards_grid = page.locator('#signature-cards-grid')
        cards_grid.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

        initial_url = page.url
        print(f"  Initial URL: {initial_url}")

        # 카드 클릭
        card = page.locator(f'text={name} SIGNATURE').first
        if card.count() > 0:
            card.click()
            page.wait_for_timeout(800)

        current_url = page.url
        print(f"  After click URL: {current_url}")

        if initial_url == current_url:
            print(f"  OK: URL unchanged (stayed on page)")
        else:
            print(f"  WARN: URL changed!")

        # 스크롤 위치 확인
        scroll_y = page.evaluate('window.scrollY')
        print(f"  Scroll position: {scroll_y}px")

        # 상세 패널 표시 확인
        section_id = name.lower()
        if name == 'LIFTING':
            section_id = 'lifting'
        elif name == 'PETIT':
            section_id = 'petit'
        elif name == 'GLOW':
            section_id = 'glow'
        elif name == 'TOTAL':
            section_id = 'total'

        detail = page.locator(f'#section-{section_id}')
        if detail.count() > 0:
            # 상세 패널 내용 확인
            content = detail.locator('.rounded-2xl')
            if content.count() > 0 and content.is_visible():
                print(f"  OK: Detail panel visible")
            else:
                print(f"  INFO: Detail panel not visible yet")
        else:
            print(f"  WARN: Section #{section_id} not found")

        page.screenshot(path=f'card_{name.lower()}_click.png')

    browser.close()
    print("\nTest complete!")
