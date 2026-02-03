# -*- coding: utf-8 -*-
"""
Equipment Section Infinite Scroll Animation Test
- 30 second CSS @keyframes animation
- Click to pause/resume functionality
"""

from playwright.sync_api import sync_playwright
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_equipment_scroll():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        print("=" * 60)
        print("Equipment Section Test Start")
        print("=" * 60)

        # 1. Page load
        print("\n[1] Loading page...")
        page.goto('http://localhost:3000/ko')
        page.wait_for_load_state('networkidle')
        print("    [OK] Page loaded")

        # 2. Scroll to equipment section using JavaScript
        print("\n[2] Scrolling to equipment section...")

        # Use JavaScript to scroll since elements are animated
        page.evaluate('''
            () => {
                const track = document.querySelector('.infinite-scroll-track');
                if (track) {
                    track.scrollIntoView({ behavior: 'instant', block: 'center' });
                } else {
                    // Scroll to middle of page
                    window.scrollTo(0, document.body.scrollHeight * 0.4);
                }
            }
        ''')
        page.wait_for_timeout(1000)
        print("    [OK] Scrolled to section")

        # 3. Initial screenshot
        print("\n[3] Taking initial screenshot...")
        page.screenshot(path='C:/dev/LIV_homepage/screenshots/equipment_01_initial.png', full_page=False)
        print("    [OK] Saved: equipment_01_initial.png")

        # 4. Find infinite scroll track
        print("\n[4] Checking infinite scroll track...")
        scroll_track = page.locator('.infinite-scroll-track')

        if scroll_track.count() > 0:
            print("    [OK] infinite-scroll-track class found")

            # Check animation style
            animation_style = scroll_track.evaluate('''
                (el) => {
                    const style = window.getComputedStyle(el);
                    return {
                        animation: style.animation,
                        animationName: style.animationName,
                        animationDuration: style.animationDuration,
                        animationPlayState: style.animationPlayState,
                        transform: style.transform
                    };
                }
            ''')
            print(f"    Animation info:")
            print(f"      - animationName: {animation_style.get('animationName', 'N/A')}")
            print(f"      - animationDuration: {animation_style.get('animationDuration', 'N/A')}")
            print(f"      - animationPlayState: {animation_style.get('animationPlayState', 'N/A')}")
        else:
            print("    [WARN] infinite-scroll-track class not found")
            # Take debug screenshot
            page.screenshot(path='C:/dev/LIV_homepage/screenshots/debug_not_found.png', full_page=True)
            print("    Debug screenshot saved")
            browser.close()
            return

        # 5. Check animation movement (position change)
        print("\n[5] Checking animation movement (2 sec wait)...")

        # Save initial transform
        initial_transform = scroll_track.evaluate('(el) => window.getComputedStyle(el).transform')
        print(f"    Initial transform: {initial_transform[:50] if len(initial_transform) > 50 else initial_transform}...")

        # Wait 2 seconds
        page.wait_for_timeout(2000)

        # Check changed transform
        after_transform = scroll_track.evaluate('(el) => window.getComputedStyle(el).transform')
        print(f"    After 2s transform: {after_transform[:50] if len(after_transform) > 50 else after_transform}...")

        if initial_transform != after_transform:
            print("    [OK] Animation working - position change detected")
        else:
            print("    [WARN] No position change detected (animation may be very slow)")

        # 6. Click to pause test - use JavaScript click to avoid stability issues
        print("\n[6] Testing click to pause...")
        scroll_track.evaluate('(el) => el.click()')
        page.wait_for_timeout(500)

        # Check paused state
        paused_state = scroll_track.evaluate('(el) => el.style.animationPlayState')
        computed_state = scroll_track.evaluate('(el) => window.getComputedStyle(el).animationPlayState')
        print(f"    After click - inline style: {paused_state}")
        print(f"    After click - computed style: {computed_state}")

        if paused_state == 'paused' or computed_state == 'paused':
            print("    [OK] Pause functionality working")
        else:
            print("    [WARN] Pause state not detected")

        # Paused state screenshot
        page.screenshot(path='C:/dev/LIV_homepage/screenshots/equipment_02_paused.png', full_page=False)
        print("    [OK] Saved: equipment_02_paused.png")

        # 7. Check PAUSED indicator
        print("\n[7] Checking pause indicator...")
        paused_indicator = page.locator('text=PAUSED')
        if paused_indicator.count() > 0:
            print("    [OK] 'PAUSED' text displayed")
        else:
            print("    [WARN] 'PAUSED' text not found")

        play_hint = page.locator('text=재생')
        if play_hint.count() > 0:
            print("    [OK] Play hint displayed")

        # 8. Click again to resume - use JavaScript click
        print("\n[8] Testing click to resume...")
        scroll_track.evaluate('(el) => el.click()')
        page.wait_for_timeout(500)

        running_state = scroll_track.evaluate('(el) => el.style.animationPlayState')
        computed_running = scroll_track.evaluate('(el) => window.getComputedStyle(el).animationPlayState')
        print(f"    After click - inline style: {running_state}")
        print(f"    After click - computed style: {computed_running}")

        if running_state == 'running' or computed_running == 'running':
            print("    [OK] Resume functionality working")

        # AUTO SCROLLING text check
        auto_scroll = page.locator('text=AUTO SCROLLING')
        if auto_scroll.count() > 0:
            print("    [OK] 'AUTO SCROLLING' text displayed")

        # Running state screenshot
        page.screenshot(path='C:/dev/LIV_homepage/screenshots/equipment_03_running.png', full_page=False)
        print("    [OK] Saved: equipment_03_running.png")

        # 9. Check device cards
        print("\n[9] Checking device cards...")
        equipment_names = [
            'Ultherapy Prime', 'Thermage FLX', 'Density', 'Shurink', 'Inmode',
            'Potenza', 'Clarity II', 'LUCAS Laser', 'CO2 Laser', 'Ulblanc'
        ]

        found_count = 0
        for name in equipment_names:
            if page.locator(f'text={name}').count() > 0:
                found_count += 1
                print(f"      - {name}: Found")

        print(f"    Total found: {found_count}/10 devices")
        if found_count >= 10:
            print("    [OK] All device cards rendered (duplicates included)")

        # 10. Responsive test (mobile viewport)
        print("\n[10] Responsive test (mobile 375px)...")
        page.set_viewport_size({'width': 375, 'height': 812})
        page.wait_for_timeout(500)

        # Scroll to section using JavaScript
        page.evaluate('''
            () => {
                const track = document.querySelector('.infinite-scroll-track');
                if (track) {
                    track.scrollIntoView({ behavior: 'instant', block: 'center' });
                }
            }
        ''')

        page.wait_for_timeout(500)
        page.screenshot(path='C:/dev/LIV_homepage/screenshots/equipment_04_mobile.png', full_page=False)
        print("    [OK] Mobile screenshot saved: equipment_04_mobile.png")

        # Check scroll track on mobile
        mobile_track = page.locator('.infinite-scroll-track')
        if mobile_track.count() > 0:
            print("    [OK] Scroll track renders correctly on mobile")

        print("\n" + "=" * 60)
        print("TEST COMPLETE!")
        print("=" * 60)
        print("\nScreenshots saved at:")
        print("  - C:/dev/LIV_homepage/screenshots/equipment_01_initial.png")
        print("  - C:/dev/LIV_homepage/screenshots/equipment_02_paused.png")
        print("  - C:/dev/LIV_homepage/screenshots/equipment_03_running.png")
        print("  - C:/dev/LIV_homepage/screenshots/equipment_04_mobile.png")

        browser.close()

if __name__ == '__main__':
    test_equipment_scroll()
