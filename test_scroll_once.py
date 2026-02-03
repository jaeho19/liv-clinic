"""
시그니처 페이지 - 카드 클릭 시 스크롤 한 번만 실행되는지 테스트
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

    print("=== GLOW card test ===")
    glow_card = page.locator('text=GLOW SIGNATURE').first
    if glow_card.count() > 0:
        glow_card.click()

    positions = []
    for i in range(10):
        page.wait_for_timeout(200)
        pos = page.evaluate('window.scrollY')
        positions.append(pos)
        print(f"  {i*200}ms: scrollY = {pos}px")

    print(f"  Final: {positions[-1]}px")
    if len(set(positions[-3:])) == 1:
        print("  OK: Scroll stable")
    else:
        print("  WARN: Scroll unstable")

    page.screenshot(path='scroll_glow_final.png')

    # Reset
    page.evaluate('window.scrollTo(0, 0)')
    page.wait_for_timeout(500)

    print("\n=== TOTAL card test ===")
    cards_grid.scroll_into_view_if_needed()
    page.wait_for_timeout(500)

    total_card = page.locator('text=TOTAL SIGNATURE').first
    if total_card.count() > 0:
        total_card.click()

    positions = []
    for i in range(10):
        page.wait_for_timeout(200)
        pos = page.evaluate('window.scrollY')
        positions.append(pos)
        print(f"  {i*200}ms: scrollY = {pos}px")

    print(f"  Final: {positions[-1]}px")
    if len(set(positions[-3:])) == 1:
        print("  OK: Scroll stable")
    else:
        print("  WARN: Scroll unstable")

    page.screenshot(path='scroll_total_final.png')

    browser.close()
    print("\nTest complete!")
