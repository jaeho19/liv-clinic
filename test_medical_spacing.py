# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Test mobile viewport
    print("1. Testing mobile viewport (375x812)...")
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    page.goto('http://localhost:3000/ko/medical')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='c:/dev/LIV_homepage/medical_mobile_spacing.png', full_page=True)

    # Measure key elements
    hero = page.locator('section').first
    hero_box = hero.bounding_box()
    print(f"   Hero section height: {hero_box['height']:.0f}px")

    # Find first Q&A item
    qa_items = page.locator('[class*="space-y"] > div')
    if qa_items.count() > 0:
        first_qa = qa_items.first
        first_qa_box = first_qa.bounding_box()
        print(f"   First Q&A item y position: {first_qa_box['y']:.0f}px")

    page.close()

    # Test desktop viewport
    print("\n2. Testing desktop viewport (1440x900)...")
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.goto('http://localhost:3000/ko/medical')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='c:/dev/LIV_homepage/medical_desktop_spacing.png', full_page=True)

    hero = page.locator('section').first
    hero_box = hero.bounding_box()
    print(f"   Hero section height: {hero_box['height']:.0f}px")

    qa_items = page.locator('[class*="space-y"] > div')
    if qa_items.count() > 0:
        first_qa = qa_items.first
        first_qa_box = first_qa.bounding_box()
        print(f"   First Q&A item y position: {first_qa_box['y']:.0f}px")

    browser.close()
    print("\nTest complete. Screenshots saved.")
