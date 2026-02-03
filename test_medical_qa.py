# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. Navigating to /ko/medical...")
    page.goto('http://localhost:3000/ko/medical')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='c:/dev/LIV_homepage/medical_1_initial.png', full_page=True)
    print("   Initial page loaded")

    # Find Q&A items
    qa_items = page.locator('[class*="space-y"] > div').all()
    print(f"\n2. Found {len(qa_items)} Q&A items")

    if len(qa_items) >= 3:
        # Get the third question button
        third_item = qa_items[2]
        button = third_item.locator('button').first

        # Get initial position
        initial_box = third_item.bounding_box()
        print(f"\n3. Third item initial position: y={initial_box['y']:.0f}")

        # Click the third question
        print("   Clicking third question...")
        button.click()

        # Wait for animation
        time.sleep(0.5)
        page.wait_for_load_state('networkidle')

        # Take screenshot after click
        page.screenshot(path='c:/dev/LIV_homepage/medical_2_after_click.png', full_page=True)

        # Check new positions - find the expanded item
        qa_items_after = page.locator('[class*="space-y"] > div').all()

        # Find which item is now expanded (has the answer visible)
        expanded_found = False
        for i, item in enumerate(qa_items_after):
            # Check if this item has expanded content
            answer_div = item.locator('div:has-text("A")').first
            if answer_div.count() > 0:
                box = item.bounding_box()
                print(f"\n4. Expanded item is now at position {i} (y={box['y']:.0f})")
                if i == 0:
                    print("   SUCCESS: Clicked item moved to top!")
                    expanded_found = True
                else:
                    print("   WARNING: Item did not move to top")
                break

        if not expanded_found:
            print("\n4. Checking first item position...")
            first_item_after = qa_items_after[0]
            first_box = first_item_after.bounding_box()
            print(f"   First item y={first_box['y']:.0f}")

        # Click another question (first one in current order, which was originally second)
        print("\n5. Clicking another question...")
        if len(qa_items_after) >= 2:
            second_button = qa_items_after[1].locator('button').first
            second_button.click()
            time.sleep(0.5)
            page.screenshot(path='c:/dev/LIV_homepage/medical_3_second_click.png', full_page=True)
            print("   Clicked second item")

    browser.close()
    print("\nTest complete. Check screenshots in c:/dev/LIV_homepage/")
