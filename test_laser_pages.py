"""
레이저 센터 페이지 테스트 스크립트
- 메인 페이지와 5개 하위 페이지 검증
- 페이지 로딩, 주요 요소, 링크 동작 확인
"""
from playwright.sync_api import sync_playwright
import os

BASE_URL = "http://localhost:3000/ko"
SCREENSHOT_DIR = "c:/dev/LIV_homepage"

# 테스트할 페이지 목록
PAGES = [
    {"path": "/laser", "name": "laser-main", "title": "레이저 센터"},
    {"path": "/laser/pigmentation", "name": "laser-pigmentation", "title": "기미/색소"},
    {"path": "/laser/vascular", "name": "laser-vascular", "title": "홍조/혈관"},
    {"path": "/laser/skintone", "name": "laser-skintone", "title": "피부톤"},
    {"path": "/laser/hair-removal", "name": "laser-hair-removal", "title": "제모"},
    {"path": "/laser/tattoo", "name": "laser-tattoo", "title": "문신 제거"},
]

def test_pages():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # 콘솔 에러 캡처
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        for page_info in PAGES:
            url = f"{BASE_URL}{page_info['path']}"
            print(f"\n{'='*60}")
            print(f"테스트: {page_info['title']} ({page_info['path']})")
            print(f"{'='*60}")

            result = {
                "page": page_info['name'],
                "url": url,
                "status": "PASS",
                "errors": [],
                "warnings": []
            }

            try:
                # 페이지 로드
                response = page.goto(url, wait_until="networkidle", timeout=30000)

                # HTTP 상태 확인
                if response.status != 200:
                    result["errors"].append(f"HTTP {response.status}")
                    result["status"] = "FAIL"
                else:
                    print(f"  [OK] HTTP 200")

                # 메인 콘텐츠 존재 확인
                main = page.locator("main")
                if main.count() > 0:
                    print(f"  [OK] main 태그 존재")
                else:
                    result["warnings"].append("main 태그 없음")
                    print(f"  [WARN] main 태그 없음")

                # 히어로 섹션 확인
                hero_section = page.locator("section").first
                if hero_section.count() > 0:
                    print(f"  [OK] 섹션 구조 확인")

                # h1 확인
                h1 = page.locator("h1")
                if h1.count() > 0:
                    h1_text = h1.first.inner_text()
                    print(f"  [OK] h1: {h1_text[:30]}...")
                else:
                    result["warnings"].append("h1 태그 없음")

                # CTA 버튼 확인
                cta_buttons = page.locator("a[href*='contact'], button:has-text('상담')")
                if cta_buttons.count() > 0:
                    print(f"  [OK] CTA 버튼: {cta_buttons.count()}개")

                # 메인 페이지의 경우 카테고리 링크 확인
                if page_info['path'] == "/laser":
                    category_links = page.locator("a[href*='/laser/']")
                    link_count = category_links.count()
                    if link_count >= 5:
                        print(f"  [OK] 카테고리 링크: {link_count}개")
                    else:
                        result["warnings"].append(f"카테고리 링크 {link_count}개 (5개 예상)")

                # 하위 페이지의 경우 브레드크럼 확인
                if page_info['path'] != "/laser":
                    breadcrumb = page.locator("a[href='/laser'], a[href*='/ko/laser']")
                    if breadcrumb.count() > 0:
                        print(f"  [OK] 브레드크럼 존재")
                    else:
                        result["warnings"].append("브레드크럼 링크 없음")

                # FAQ 섹션 확인
                faq_section = page.locator("text=자주 묻는 질문")
                if faq_section.count() > 0:
                    print(f"  [OK] FAQ 섹션 존재")

                # 스크린샷 저장
                screenshot_path = f"{SCREENSHOT_DIR}/{page_info['name']}.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"  [OK] 스크린샷: {page_info['name']}.png")

            except Exception as e:
                result["status"] = "FAIL"
                result["errors"].append(str(e))
                print(f"  [FAIL] 에러: {e}")

            results.append(result)

        # 메인 페이지에서 각 카테고리로 네비게이션 테스트
        print(f"\n{'='*60}")
        print("네비게이션 테스트: 메인 → 하위 페이지")
        print(f"{'='*60}")

        page.goto(f"{BASE_URL}/laser", wait_until="networkidle")

        # 각 카테고리 카드 클릭 테스트
        category_cards = [
            {"text": "기미", "expected_url": "/pigmentation"},
            {"text": "홍조", "expected_url": "/vascular"},
            {"text": "피부톤", "expected_url": "/skintone"},
            {"text": "제모", "expected_url": "/hair-removal"},
            {"text": "문신", "expected_url": "/tattoo"},
        ]

        for card in category_cards:
            try:
                # 메인 페이지로 돌아가기
                page.goto(f"{BASE_URL}/laser", wait_until="networkidle")

                # 카드 찾기 및 클릭
                link = page.locator(f"a:has-text('{card['text']}')")
                if link.count() > 0:
                    link.first.click()
                    page.wait_for_load_state("networkidle")

                    if card['expected_url'] in page.url:
                        print(f"  [OK] '{card['text']}' 카드 → {card['expected_url']}")
                    else:
                        print(f"  [WARN] '{card['text']}' 카드 클릭 후 URL: {page.url}")
                else:
                    print(f"  [WARN] '{card['text']}' 카드를 찾을 수 없음")
            except Exception as e:
                print(f"  [FAIL] '{card['text']}' 네비게이션 에러: {e}")

        browser.close()

    # 결과 요약
    print(f"\n{'='*60}")
    print("TEST RESULTS SUMMARY")
    print(f"{'='*60}")

    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")

    for r in results:
        status_icon = "[PASS]" if r["status"] == "PASS" else "[FAIL]"
        print(f"  {status_icon} {r['page']}: {r['status']}")
        if r["errors"]:
            for err in r["errors"]:
                print(f"      Error: {err}")
        if r["warnings"]:
            for warn in r["warnings"]:
                print(f"      Warning: {warn}")

    print(f"\nTotal: {len(results)} pages | Passed: {passed} | Failed: {failed}")

    return results

if __name__ == "__main__":
    test_pages()
