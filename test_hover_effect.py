"""
시그니처 카드 호버 시 이미지 전환 테스트 - 4개 카드 비교
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    page.goto('http://localhost:3000/ko/signature')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    # 카드 그리드로 스크롤
    cards_grid = page.locator('#signature-cards-grid')
    cards_grid.scroll_into_view_if_needed()
    page.wait_for_timeout(500)

    # 모든 카드 버튼 가져오기
    card_buttons = page.locator('[role="button"]').all()
    print(f"카드 수: {len(card_buttons)}")

    card_names = ['LIFTING', 'PETIT', 'GLOW', 'TOTAL']

    for i, (card, name) in enumerate(zip(card_buttons[:4], card_names)):
        print(f"\n--- {name} 카드 테스트 ---")

        # 호버 전 스크린샷
        page.screenshot(path=f'hover_{i+1}_{name}_before.png')

        # 호버
        card.hover()
        page.wait_for_timeout(500)  # 호버 딜레이 대기

        # 호버 중 스크린샷
        page.screenshot(path=f'hover_{i+1}_{name}_hover.png')

        # before/after 인디케이터 확인
        before_indicator = page.locator('text=BEFORE').first
        after_indicator = page.locator('text=AFTER').first

        if before_indicator.count() > 0 and before_indicator.is_visible():
            print(f"  BEFORE/AFTER 인디케이터: 표시됨")
        else:
            print(f"  BEFORE/AFTER 인디케이터: 안보임")

        # 이미지 전환 대기
        page.wait_for_timeout(2000)  # after 이미지로 전환 대기

        # after 상태 스크린샷
        page.screenshot(path=f'hover_{i+1}_{name}_after.png')
        print(f"  스크린샷 저장: hover_{i+1}_{name}_*.png")

        # 마우스 이동 (호버 해제)
        page.mouse.move(0, 0)
        page.wait_for_timeout(500)

    browser.close()
    print("\n테스트 완료!")
