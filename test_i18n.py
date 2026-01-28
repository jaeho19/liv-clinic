# -*- coding: utf-8 -*-
"""
다국어(i18n) 테스트 스크립트
1. 4개 언어(ko, en, ja, zh) 전환 테스트
2. 페이지 이동 시 언어 유지 테스트
"""

import asyncio
from playwright.async_api import async_playwright
import os
import sys

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = "C:/dev/LIV_homepage"

# 각 언어별 테스트 텍스트 (헤더나 주요 요소에서 확인)
LANG_INDICATORS = {
    "ko": ["예약", "상담", "시그니처", "리프팅"],
    "en": ["Reservation", "Consultation", "Signature", "Lifting"],
    "ja": ["予約", "相談", "シグネチャー", "リフティング"],
    "zh": ["预约", "咨询", "签名", "提拉"]
}

# 테스트할 페이지 목록
TEST_PAGES = [
    ("main", ""),
    ("about", "/about"),
    ("signature", "/signature"),
    ("lifting", "/lifting"),
    ("laser", "/laser"),
]

async def test_language_switch():
    """언어 전환 테스트"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()

        print("=" * 60)
        print("i18n Test Start")
        print("=" * 60)

        results = []

        # 1. 각 언어별 메인 페이지 접속 테스트
        print("\n[Test 1] Language-specific main page access")
        print("-" * 40)

        for lang in ["ko", "en", "ja", "zh"]:
            try:
                url = f"{BASE_URL}/{lang}"
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(1000)

                # 현재 URL 확인
                current_url = page.url

                # 페이지 내용 확인
                content = await page.content()

                # 해당 언어의 텍스트가 포함되어 있는지 확인
                lang_found = any(indicator in content for indicator in LANG_INDICATORS[lang])

                # html lang 속성 확인
                html_lang = await page.evaluate("document.documentElement.lang")

                status = "PASS" if lang_found else "FAIL"
                print(f"  {lang.upper()}: {status} (URL: {current_url}, html lang: {html_lang})")

                # 스크린샷 저장
                screenshot_path = os.path.join(SCREENSHOT_DIR, f"i18n_test_{lang}_main.png")
                await page.screenshot(path=screenshot_path, full_page=False)

                results.append({
                    "test": f"main_page_{lang}",
                    "success": lang_found,
                    "url": current_url,
                    "html_lang": html_lang
                })

            except Exception as e:
                print(f"  {lang.upper()}: FAIL - {str(e)[:50]}")
                results.append({
                    "test": f"main_page_{lang}",
                    "success": False,
                    "error": str(e)
                })

        # 2. 언어 전환 드롭다운 테스트
        print("\n[Test 2] Language switcher dropdown test")
        print("-" * 40)

        # 한국어 페이지에서 시작
        await page.goto(f"{BASE_URL}/ko", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)

        # 언어 선택 버튼/드롭다운 찾기
        try:
            # 언어 선택기 찾기 (다양한 선택자 시도)
            lang_selector = None
            selectors_to_try = [
                'button[aria-label*="Language"]',
                'button[aria-label*="language"]',
                '[data-testid="language-switcher"]',
                'button:has-text("KO")',
                'button:has-text("ko")',
                '.language-selector',
                '#language-switcher',
                'nav button:has-text("KO")',
                'header button:has-text("KO")',
                'button:has-text("Korean")',
            ]

            for selector in selectors_to_try:
                try:
                    element = await page.wait_for_selector(selector, timeout=2000)
                    if element:
                        lang_selector = selector
                        print(f"  Language selector found: {selector}")
                        break
                except:
                    continue

            if lang_selector:
                # 드롭다운 열기
                await page.click(lang_selector)
                await page.wait_for_timeout(500)

                # 스크린샷
                screenshot_path = os.path.join(SCREENSHOT_DIR, f"i18n_test_dropdown_open.png")
                await page.screenshot(path=screenshot_path)
                print(f"  Dropdown opened successfully")

                # 영어 선택
                try:
                    await page.click('text=English', timeout=3000)
                    await page.wait_for_timeout(2000)

                    # URL 변경 확인
                    current_url = page.url
                    is_english = "/en" in current_url

                    status = "PASS" if is_english else "FAIL"
                    print(f"  Switch to English: {status} (URL: {current_url})")

                    screenshot_path = os.path.join(SCREENSHOT_DIR, f"i18n_test_switched_to_en.png")
                    await page.screenshot(path=screenshot_path)

                    results.append({
                        "test": "language_switch_ko_to_en",
                        "success": is_english,
                        "url": current_url
                    })
                except Exception as e:
                    print(f"  Switch to English failed: {e}")
            else:
                print("  Language selector not found")

        except Exception as e:
            print(f"  Language switch test error: {e}")

        # 3. 페이지 이동 시 언어 유지 테스트
        print("\n[Test 3] Language persistence across pages")
        print("-" * 40)

        for lang in ["ko", "en", "ja", "zh"]:
            print(f"\n  [{lang.upper()}] Testing page navigation:")

            # 해당 언어의 메인 페이지로 이동
            await page.goto(f"{BASE_URL}/{lang}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1000)

            all_pages_ok = True
            page_results = []

            for page_name, page_path in TEST_PAGES:
                try:
                    # 페이지 이동
                    full_url = f"{BASE_URL}/{lang}{page_path}"
                    await page.goto(full_url, wait_until="networkidle", timeout=30000)
                    await page.wait_for_timeout(500)

                    # URL에 해당 언어가 유지되는지 확인
                    current_url = page.url
                    lang_preserved = f"/{lang}" in current_url or f"/{lang}/" in current_url

                    # 페이지 내용에 해당 언어 텍스트가 있는지 확인
                    content = await page.content()
                    lang_content_found = any(indicator in content for indicator in LANG_INDICATORS[lang])

                    success = lang_preserved and lang_content_found
                    status = "PASS" if success else "FAIL"

                    page_results.append((page_name, success, lang_preserved, lang_content_found))

                    if not success:
                        all_pages_ok = False

                    results.append({
                        "test": f"lang_persist_{lang}_{page_name}",
                        "success": success,
                        "url": current_url,
                        "lang_preserved": lang_preserved,
                        "content_found": lang_content_found
                    })

                except Exception as e:
                    all_pages_ok = False
                    page_results.append((page_name, False, False, False))
                    results.append({
                        "test": f"lang_persist_{lang}_{page_name}",
                        "success": False,
                        "error": str(e)
                    })

            # 결과 출력
            for page_name, success, url_ok, content_ok in page_results:
                status = "PASS" if success else "FAIL"
                print(f"    {page_name}: {status} (URL:{url_ok}, Content:{content_ok})")

        # 4. 네비게이션 링크 클릭 시 언어 유지 테스트
        print("\n[Test 4] Navigation link language persistence")
        print("-" * 40)

        for lang in ["ko", "en"]:  # 한국어, 영어만 테스트
            await page.goto(f"{BASE_URL}/{lang}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1000)

            # 네비게이션 링크 찾아서 클릭
            nav_links = await page.query_selector_all('nav a[href]')

            print(f"\n  [{lang.upper()}] Navigation link test:")

            nav_test_count = 0
            nav_test_pass = 0

            for i, link in enumerate(nav_links[:5]):  # 최대 5개만 테스트
                try:
                    href = await link.get_attribute('href')
                    if href and not href.startswith('http') and not href.startswith('#'):
                        # 링크 클릭
                        await link.click()
                        await page.wait_for_timeout(1500)

                        current_url = page.url
                        lang_preserved = f"/{lang}" in current_url

                        status = "PASS" if lang_preserved else "FAIL"
                        nav_test_count += 1
                        if lang_preserved:
                            nav_test_pass += 1
                        print(f"    Link {href}: {status} -> {current_url}")

                        # 다시 메인으로
                        await page.goto(f"{BASE_URL}/{lang}", wait_until="networkidle", timeout=30000)
                        await page.wait_for_timeout(500)
                        nav_links = await page.query_selector_all('nav a[href]')

                except Exception as e:
                    print(f"    Link test error: {str(e)[:30]}")

            if nav_test_count > 0:
                print(f"    Total: {nav_test_pass}/{nav_test_count} passed")

        # 결과 요약
        print("\n" + "=" * 60)
        print("Test Results Summary")
        print("=" * 60)

        success_count = sum(1 for r in results if r.get("success", False))
        total_count = len(results)

        print(f"\nTotal: {success_count}/{total_count} tests passed")
        print(f"Success rate: {success_count/total_count*100:.1f}%")

        # 실패한 테스트 출력
        failed = [r for r in results if not r.get("success", False)]
        if failed:
            print("\nFailed tests:")
            for f in failed:
                print(f"  - {f['test']}: {f.get('error', f.get('url', 'unknown'))}")
        else:
            print("\nAll tests passed!")

        await browser.close()

        return results

if __name__ == "__main__":
    asyncio.run(test_language_switch())
