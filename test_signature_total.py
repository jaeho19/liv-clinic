"""
시그니처 페이지 - 종합 안티에이징 카드 테스트
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 페이지 로드
    print("1. 페이지 로드 중...")
    page.goto('http://localhost:3000/ko/signature')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    # 카드 그리드로 스크롤
    cards_grid = page.locator('#signature-cards-grid')
    if cards_grid.count() > 0:
        cards_grid.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

    # 4번째 카드 (종합 안티에이징) 클릭
    print("2. 종합 안티에이징 카드 클릭...")
    fourth_card = page.locator('text=TOTAL SIGNATURE').first
    if fourth_card.count() == 0:
        fourth_card = page.locator('text=종합 안티에이징').first

    if fourth_card.count() > 0:
        fourth_card.click()
        print("   -> 카드 클릭 완료")
    else:
        # role=button으로 찾기
        card_buttons = page.locator('[role="button"]').all()
        if len(card_buttons) >= 4:
            card_buttons[3].click()
            print("   -> 4번째 role=button 요소 클릭")

    page.wait_for_timeout(800)

    # 스크린샷
    page.screenshot(path='signature_total_click.png')
    print("3. 스크린샷 저장 -> signature_total_click.png")

    # 상세 패널 확인
    detail_panel = page.locator('#section-total')
    if detail_panel.count() > 0:
        print("4. section-total 존재함")
        # 내용 확인
        detail_content = detail_panel.locator('.rounded-2xl')
        if detail_content.count() > 0:
            is_visible = detail_content.is_visible()
            print(f"   -> 상세 패널 표시 여부: {is_visible}")
    else:
        print("4. section-total 없음!")

    # 스크롤 위치
    scroll_y = page.evaluate('window.scrollY')
    print(f"5. 스크롤 위치: {scroll_y}px")

    # 카드 그리드 위치
    grid_box = page.locator('#signature-cards-grid').bounding_box()
    if grid_box:
        print(f"6. 카드 그리드 top: {grid_box['y']:.0f}px")

    browser.close()
    print("\n테스트 완료!")
