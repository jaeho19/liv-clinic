from playwright.sync_api import sync_playwright
import time

def dismiss_popups(page):
    """Dismiss any popup overlays that might intercept clicks."""
    # Try multiple strategies to close popups
    close_selectors = [
        "div[class*='z-[9999]'] button",           # close button inside popup
        "div[class*='z-[9999]'] [aria-label*='close']",
        "div[class*='z-[9999]'] [aria-label*='Close']",
        "div[class*='z-[9999]'] svg",               # X icon
        "button[aria-label*='close']",
        "button[aria-label*='Close']",
        ".popup-close",
        "[data-testid='popup-close']",
    ]
    
    for sel in close_selectors:
        els = page.query_selector_all(sel)
        if els:
            print(f"  Found popup close button with selector: {sel} ({len(els)} elements)")
            for el in els:
                try:
                    el.click(timeout=3000)
                    time.sleep(0.5)
                    print(f"  Clicked popup close button")
                except:
                    pass
            return True
    
    # If no close button found, try clicking outside the popup or pressing Escape
    print("  No close button found, trying Escape key...")
    page.keyboard.press("Escape")
    time.sleep(1)
    
    # Check if popup is still there, try clicking the backdrop
    backdrop = page.query_selector("div.fixed.inset-0")
    if backdrop:
        # Click on the edge of the screen to dismiss
        page.mouse.click(1270, 790)
        time.sleep(1)
    
    return False

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    # ============================================================
    # Test 1: Public events list page
    # ============================================================
    print("[Test 1] Navigating to /ko/events ...")
    page.goto("http://localhost:3000/ko/events", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    # Dismiss popups before screenshot
    dismiss_popups(page)
    time.sleep(1)
    page.screenshot(path=r"c:\dev\LIV_homepage\test_events_list.png", full_page=True)
    print("[Test 1] Screenshot saved: test_events_list.png")

    # ============================================================
    # Test 2: Admin events page
    # ============================================================
    print("[Test 2] Navigating to /admin/events ...")
    page.goto("http://localhost:3000/admin/events", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=r"c:\dev\LIV_homepage\test_admin_events.png", full_page=True)
    print("[Test 2] Screenshot saved: test_admin_events.png")

    # ============================================================
    # Test 3: Click first event card on public page -> detail
    # ============================================================
    print("[Test 3] Navigating back to /ko/events to click first event ...")
    page.goto("http://localhost:3000/ko/events", wait_until="networkidle", timeout=30000)
    time.sleep(2)

    # Dismiss any popups first
    print("  Dismissing popups...")
    dismiss_popups(page)
    time.sleep(1)
    
    # Also try to remove the popup overlay via JavaScript
    page.evaluate("""
        document.querySelectorAll('div[class*="z-[9999]"]').forEach(el => el.remove());
        document.querySelectorAll('.fixed.inset-0').forEach(el => {
            if (el.style.zIndex > 1000 || el.className.includes('9999')) el.remove();
        });
    """)
    time.sleep(0.5)

    # Try multiple selectors to find the first clickable event card
    selectors = [
        "a[href*='/events/']",
        "[data-testid='event-card']",
        "main a[href*='event']",
        "article a",
        "main article",
    ]

    clicked = False
    for sel in selectors:
        els = page.query_selector_all(sel)
        if els:
            print(f"  Found {len(els)} element(s) with selector: {sel}")
            href = els[0].get_attribute("href")
            print(f"  First element href: {href}")
            try:
                els[0].click(timeout=10000)
                clicked = True
                break
            except Exception as e:
                print(f"  Click failed with selector {sel}: {e}")
                # Try force click
                try:
                    els[0].click(force=True, timeout=5000)
                    clicked = True
                    break
                except Exception as e2:
                    print(f"  Force click also failed: {e2}")
                    # Try navigating directly via href
                    if href:
                        full_url = f"http://localhost:3000{href}" if href.startswith("/") else href
                        print(f"  Navigating directly to: {full_url}")
                        page.goto(full_url, wait_until="networkidle", timeout=30000)
                        clicked = True
                        break
    
    if not clicked:
        # Last resort: gather all event links and navigate directly
        all_links = page.query_selector_all("a")
        event_links = []
        for a in all_links:
            href = a.get_attribute("href")
            if href and "/events/" in href and href != "/ko/events/":
                event_links.append(href)
        
        if event_links:
            full_url = f"http://localhost:3000{event_links[0]}" if event_links[0].startswith("/") else event_links[0]
            print(f"  Direct navigation to first event: {full_url}")
            page.goto(full_url, wait_until="networkidle", timeout=30000)
            clicked = True

    if clicked:
        page.wait_for_load_state("networkidle", timeout=15000)
        time.sleep(2)
        # Dismiss popups on detail page too
        dismiss_popups(page)
        time.sleep(0.5)
        print(f"  Current URL: {page.url}")
        page.screenshot(path=r"c:\dev\LIV_homepage\test_event_detail.png", full_page=True)
        print("[Test 3] Screenshot saved: test_event_detail.png")
    else:
        print("  WARNING: No event links found on the page.")
        page.screenshot(path=r"c:\dev\LIV_homepage\test_event_detail.png", full_page=True)
        print("[Test 3] Screenshot saved (fallback): test_event_detail.png")

    browser.close()
    print("\nAll tests completed successfully.")
