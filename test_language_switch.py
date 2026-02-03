# -*- coding: utf-8 -*-
"""Language switching test script for LIV website"""
from playwright.sync_api import sync_playwright
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_language_switching():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("LIV Website Language Switching Test")
        print("=" * 60)

        # Test 1: Direct URL navigation to different locales
        print("\n[TEST 1] Direct URL navigation tests")
        print("-" * 40)

        locales = ['ko', 'en', 'ja', 'zh']
        for locale in locales:
            page.goto(f'http://localhost:3000/{locale}')
            page.wait_for_load_state('networkidle')
            title = page.title()
            url = page.url
            print(f"  {locale.upper()}: {url}")
            print(f"       Title: {title}")
            page.screenshot(path=f'c:/dev/LIV_homepage/test_locale_{locale}_main.png', full_page=False)

        # Test 2: Navigation persistence test
        print("\n[TEST 2] Navigation persistence test")
        print("-" * 40)

        test_cases = [
            ('zh', '/about', 'Chinese -> About'),
            ('ja', '/lifting', 'Japanese -> Lifting'),
            ('en', '/signature', 'English -> Signature'),
        ]

        for locale, target_path, description in test_cases:
            # Start from locale main page
            page.goto(f'http://localhost:3000/{locale}')
            page.wait_for_load_state('networkidle')
            start_url = page.url
            print(f"\n  {description}")
            print(f"    Start URL: {start_url}")

            # Find and click the target link
            target_link = page.locator(f'a[href*="{target_path}"]').first
            if target_link.count() > 0:
                target_href = target_link.get_attribute('href')
                print(f"    Link href: {target_href}")

                # Use force click to avoid overlay issues
                target_link.click(force=True)
                page.wait_for_load_state('networkidle')
                end_url = page.url
                print(f"    End URL: {end_url}")

                # Check if locale is maintained
                maintained = f'/{locale}' in end_url or f'/{locale}/' in end_url
                print(f"    Locale maintained: {'YES' if maintained else 'NO - BUG!'}")

                page.screenshot(path=f'c:/dev/LIV_homepage/test_nav_{locale}_{target_path.replace("/", "_")}.png', full_page=False)
            else:
                print(f"    ERROR: Link not found for {target_path}")

        # Test 3: Language switcher component test
        print("\n[TEST 3] Language switcher component test")
        print("-" * 40)

        # Start from Korean page
        page.goto('http://localhost:3000/ko')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='c:/dev/LIV_homepage/test_switcher_01_initial.png', full_page=False)

        # Find language switcher button
        lang_btn = page.locator('button:has(span:text("KOR")), button:has(span:text("KO"))').first
        if lang_btn.count() > 0:
            print("  Language button found")
            lang_btn.click()
            page.wait_for_timeout(300)
            page.screenshot(path='c:/dev/LIV_homepage/test_switcher_02_dropdown.png', full_page=False)

            # Find Chinese option
            zh_btn = page.locator('button:has-text("Chinese"), button:has-text("CHN"), button:has(span:text("CHN"))').first
            if zh_btn.count() == 0:
                # Try to find by Chinese text
                zh_btn = page.locator('button:has-text("Chinese")').first
            if zh_btn.count() == 0:
                # Try by emoji
                zh_btn = page.locator('div.bg-white button').nth(1)  # Second button in dropdown

            if zh_btn.count() > 0:
                print("  Chinese option found, clicking...")
                zh_btn.click(force=True)
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                new_url = page.url
                print(f"  New URL after switch: {new_url}")
                page.screenshot(path='c:/dev/LIV_homepage/test_switcher_03_after_switch.png', full_page=False)

                if '/zh' in new_url:
                    print("  SUCCESS: Language switched to Chinese!")
                else:
                    print("  FAIL: Language did not switch properly")
            else:
                print("  ERROR: Chinese option not found in dropdown")
        else:
            print("  ERROR: Language switcher button not found")

        # Test 4: Check link structure in page
        print("\n[TEST 4] Link structure analysis")
        print("-" * 40)

        page.goto('http://localhost:3000/zh')
        page.wait_for_load_state('networkidle')

        # Get all nav links
        all_links = page.locator('a').all()
        print(f"  Total links on page: {len(all_links)}")

        # Check href patterns
        zh_links = 0
        ko_links = 0
        relative_links = 0
        absolute_links = 0

        for link in all_links[:30]:  # Check first 30 links
            href = link.get_attribute('href') or ''
            if href.startswith('/zh'):
                zh_links += 1
            elif href.startswith('/ko'):
                ko_links += 1
            elif href.startswith('/') and not href.startswith('//'):
                relative_links += 1
            elif href.startswith('http'):
                absolute_links += 1

        print(f"  Links starting with /zh: {zh_links}")
        print(f"  Links starting with /ko: {ko_links}")
        print(f"  Relative links (/...): {relative_links}")
        print(f"  Absolute links (http...): {absolute_links}")

        if zh_links > 0:
            print("  RESULT: Links are properly localized!")
        elif relative_links > 0:
            print("  RESULT: Links may be using next-intl Link (auto-prefix)")
        else:
            print("  WARNING: Link structure needs investigation")

        # Print first 10 nav links
        print("\n  First 10 nav links:")
        nav_links = page.locator('nav a').all()
        for i, link in enumerate(nav_links[:10]):
            href = link.get_attribute('href')
            text = link.inner_text().strip()[:25]
            print(f"    [{i}] {text}: {href}")

        print("\n" + "=" * 60)
        print("Test Complete!")
        print("=" * 60)

        browser.close()

if __name__ == '__main__':
    test_language_switching()
