"""
시그니처 페이지 카드 클릭 시 스크롤 동작 테스트
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 1. 페이지 로드
    print("1. 페이지 로드 중...")
    page.goto('http://localhost:3000/ko/signature')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)  # 애니메이션 완료 대기

    # 초기 상태 스크린샷
    page.screenshot(path='signature_01_initial.png', full_page=True)
    print("   -> signature_01_initial.png 저장")

    # 카드 그리드 섹션으로 스크롤
    cards_grid = page.locator('#signature-cards-grid')
    if cards_grid.count() > 0:
        cards_grid.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

    # 카드 영역 스크린샷
    page.screenshot(path='signature_02_cards_view.png')
    print("2. 카드 영역 스크린샷 저장 -> signature_02_cards_view.png")

    # 2. 첫 번째 카드 (LIFTING SIGNATURE) 클릭
    print("3. 첫 번째 카드 클릭 중...")

    # 첫 번째 카드 찾기 (LIFTING SIGNATURE 또는 울쎄라피 프라임 & 써마지)
    first_card = page.locator('text=LIFTING SIGNATURE').first
    if first_card.count() == 0:
        first_card = page.locator('text=울쎄라피 프라임').first

    if first_card.count() > 0:
        first_card.click()
        print("   -> 카드 클릭 완료")
    else:
        # 카드 그리드의 첫 번째 카드 클릭
        card_buttons = page.locator('[role="button"]').all()
        if len(card_buttons) > 0:
            card_buttons[0].click()
            print("   -> 첫 번째 role=button 요소 클릭")

    # 3. 스크롤 및 상세 패널 렌더링 대기
    page.wait_for_timeout(800)  # 스크롤 애니메이션 + 상세 패널 렌더링 대기

    # 클릭 후 스크린샷 (뷰포트)
    page.screenshot(path='signature_03_after_click.png')
    print("4. 클릭 후 스크린샷 저장 -> signature_03_after_click.png")

    # 전체 페이지 스크린샷
    page.screenshot(path='signature_04_full_page.png', full_page=True)
    print("5. 전체 페이지 스크린샷 저장 -> signature_04_full_page.png")

    # 상세 패널 확인
    detail_panel = page.locator('#section-lifting')
    if detail_panel.count() > 0:
        print("6. 상세 패널 확인: section-lifting 존재함")
        # 상세 패널 내용 확인
        detail_content = page.locator('#section-lifting .rounded-2xl')
        if detail_content.count() > 0:
            print("   -> 상세 패널 내용이 표시됨")

    # 스크롤 위치 확인
    scroll_y = page.evaluate('window.scrollY')
    print(f"7. 현재 스크롤 위치: {scroll_y}px")

    # 카드 그리드가 뷰포트 상단 근처에 있는지 확인
    grid_box = page.locator('#signature-cards-grid').bounding_box()
    if grid_box:
        print(f"8. 카드 그리드 위치: top={grid_box['y']:.0f}px")
        if grid_box['y'] < 150:
            print("   -> 성공: 카드 그리드가 상단에 위치함")
        else:
            print(f"   -> 주의: 카드 그리드가 상단에서 {grid_box['y']:.0f}px 떨어져 있음")

    browser.close()
    print("\n테스트 완료!")
