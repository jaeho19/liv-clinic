"""
필러 시술 부위 인터랙티브 이미지 테스트 스크립트
각 시술부위를 클릭하여 하이라이트 영역이 정확하게 표시되는지 확인
"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1400, 'height': 900},
            device_scale_factor=2
        )
        page = await context.new_page()

        # 필러 페이지 접속
        await page.goto('http://localhost:3000/ko/antiaging/filler', wait_until='networkidle')
        await asyncio.sleep(2)

        # Treatment Areas 섹션으로 스크롤 (약 2000px 정도)
        await page.evaluate('window.scrollTo(0, 2200)')
        await asyncio.sleep(1)

        # 초기 상태 캡처
        await page.screenshot(path='filler_areas_initial.png', full_page=False)
        print("1. 초기 상태 캡처 완료")

        # 각 시술 부위 클릭 및 캡처
        area_names = ['이마', '관자놀이', '코', '앞광대', '팔자', '옆볼', '턱끝', '애교살', '입술', '눈썹']

        for i, name in enumerate(area_names, 1):
            try:
                button = page.locator(f'button:has-text("{name}")').first
                if await button.count() > 0:
                    await button.click()
                    await asyncio.sleep(0.8)
                    await page.screenshot(path=f'filler_area_{i:02d}_{name}.png', full_page=False)
                    print(f"{i}. {name} 클릭 후 캡처 완료")
            except Exception as e:
                print(f"{i}. {name} 캡처 실패: {e}")

        # 선택 해제 (이미 선택된 것 다시 클릭)
        try:
            button = page.locator('button:has-text("눈썹")').first
            await button.click()
            await asyncio.sleep(0.5)
        except:
            pass

        # 모바일 뷰포트로 변경
        await page.set_viewport_size({'width': 390, 'height': 844})
        await asyncio.sleep(1)

        # 모바일에서 섹션 스크롤
        await page.evaluate('window.scrollTo(0, 1800)')
        await asyncio.sleep(1)

        # 모바일 초기 상태
        await page.screenshot(path='filler_areas_mobile.png', full_page=False)
        print("모바일 초기 상태 캡처 완료")

        # 모바일에서 몇 개 부위 클릭
        for name in ['이마', '코', '입술']:
            try:
                button = page.locator(f'button:has-text("{name}")').first
                if await button.count() > 0:
                    await button.click()
                    await asyncio.sleep(0.8)
                    await page.screenshot(path=f'filler_mobile_{name}.png', full_page=False)
                    print(f"모바일 {name} 클릭 후 캡처 완료")
            except Exception as e:
                print(f"모바일 {name} 캡처 실패: {e}")

        await browser.close()
        print("\n모든 캡처 완료!")

if __name__ == '__main__':
    asyncio.run(main())
