# -*- coding: utf-8 -*-
"""Detailed language persistence test for LIV website"""
from playwright.sync_api import sync_playwright
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_detailed_language():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 70)
        print("LIV Website - Detailed Language Persistence Test")
        print("=" * 70)

        issues_found = []

        # Test various page combinations
        test_pages = [
            ('/', 'Home'),
            ('/about', 'About'),
            ('/about/staff', 'Staff'),
            ('/about/equipment', 'Equipment'),
            ('/about/location', 'Location'),
            ('/signature', 'Signature'),
            ('/lifting', 'Lifting'),
            ('/lifting/ulthera', 'Ulthera'),
            ('/lifting/thermage', 'Thermage'),
            ('/antiaging', 'Antiaging'),
            ('/antiaging/botox', 'Botox'),
            ('/laser', 'Laser'),
            ('/medical', 'Medical'),
            ('/contact', 'Contact'),
        ]

        locales = ['zh', 'ja', 'en']

        for locale in locales:
            print(f"\n{'='*70}")
            print(f"Testing locale: {locale.upper()}")
            print('='*70)

            for path, name in test_pages[:5]:  # Test first 5 pages per locale
                full_path = f'/{locale}{path}' if path != '/' else f'/{locale}'
                page.goto(f'http://localhost:3000{full_path}')
                page.wait_for_load_state('networkidle')

                # Check all links on the page
                all_links = page.locator('a[href^="/"]').all()
                wrong_locale_links = []

                for link in all_links:
                    href = link.get_attribute('href') or ''
                    # Check if any link goes to wrong locale
                    if href and href.startswith('/'):
                        # Links should start with /{locale} or be properly relative
                        for other_locale in ['ko', 'en', 'ja', 'zh']:
                            if other_locale != locale and href.startswith(f'/{other_locale}/'):
                                wrong_locale_links.append(href)
                        # Check for links without locale prefix (not allowed with localePrefix: 'always')
                        if not any(href.startswith(f'/{l}') for l in ['ko', 'en', 'ja', 'zh']):
                            if href != '/' and not href.startswith('/#'):
                                wrong_locale_links.append(f"NO_PREFIX: {href}")

                if wrong_locale_links:
                    print(f"  [ISSUE] {name} ({full_path})")
                    for wrong in wrong_locale_links[:5]:
                        print(f"          - {wrong}")
                    issues_found.append((locale, name, wrong_locale_links[:5]))
                else:
                    print(f"  [OK] {name} ({full_path})")

        # Test footer links specifically
        print(f"\n{'='*70}")
        print("Testing Footer Links")
        print('='*70)

        page.goto('http://localhost:3000/zh')
        page.wait_for_load_state('networkidle')

        footer_links = page.locator('footer a[href^="/"]').all()
        print(f"\nFooter links count: {len(footer_links)}")

        for link in footer_links:
            href = link.get_attribute('href') or ''
            text = link.inner_text().strip()[:20]
            if href.startswith('/zh'):
                print(f"  [OK] {text}: {href}")
            else:
                print(f"  [ISSUE] {text}: {href}")
                issues_found.append(('footer', 'zh', href))

        # Test mobile menu links
        print(f"\n{'='*70}")
        print("Testing Mobile Menu")
        print('='*70)

        page.set_viewport_size({"width": 375, "height": 812})
        page.goto('http://localhost:3000/zh')
        page.wait_for_load_state('networkidle')

        # Click mobile menu button
        mobile_menu_btn = page.locator('button[aria-label*="menu"], button[aria-label*="Open"]').first
        if mobile_menu_btn.count() > 0:
            mobile_menu_btn.click()
            page.wait_for_timeout(500)

            mobile_links = page.locator('[role="dialog"] a, .mobile-menu a, nav a').all()
            print(f"Mobile menu links count: {len(mobile_links)}")

            for link in mobile_links[:10]:
                href = link.get_attribute('href') or ''
                text = link.inner_text().strip()[:20]
                if href.startswith('/zh') or href.startswith('http') or not href.startswith('/'):
                    print(f"  [OK] {text}: {href}")
                elif href.startswith('/'):
                    print(f"  [CHECK] {text}: {href}")

        # Summary
        print(f"\n{'='*70}")
        print("TEST SUMMARY")
        print('='*70)

        if issues_found:
            print(f"\nFound {len(issues_found)} issues:")
            for issue in issues_found:
                print(f"  - {issue}")
        else:
            print("\nNo issues found! Language persistence is working correctly.")

        browser.close()

if __name__ == '__main__':
    test_detailed_language()
