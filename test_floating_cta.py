"""
플로팅 CTA 버튼 테스트 - viewport 기준
"""
from playwright.sync_api import sync_playwright
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_floating_cta():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        print("1. 페이지 로드...")
        page.goto('http://localhost:3000/ko')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        # 스크롤 맨 위로
        page.evaluate('window.scrollTo(0, 0)')
        page.wait_for_timeout(500)

        print("\n2. 스크린샷 촬영...")
        page.screenshot(path='c:/dev/LIV_homepage/floating_cta_viewport.png', full_page=False)

        # JavaScript로 직접 요소 찾기 (viewport 내 visible 요소만)
        print("\n3. Viewport 내 플로팅 버튼 확인...")
        result = page.evaluate('''() => {
            const viewportHeight = window.innerHeight;
            const results = {
                ctaContainer: null,
                consultationBar: null,
                buttons: []
            };

            // 플로팅 CTA 컨테이너 찾기 (z-40, fixed, 우측)
            const allFixed = document.querySelectorAll('div.fixed');
            for (const el of allFixed) {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                // 우측에 있고, z-index가 40인 요소 (CTA 컨테이너)
                if (style.zIndex === '40' && rect.right > window.innerWidth - 200) {
                    results.ctaContainer = {
                        bottom: style.bottom,
                        right: style.right,
                        boundingRect: {
                            top: rect.top,
                            bottom: rect.bottom,
                            height: rect.height
                        }
                    };
                }

                // z-index 50이고 하단에 있는 요소 (상담바)
                if (style.zIndex === '50' && rect.bottom >= viewportHeight - 10) {
                    results.consultationBar = {
                        height: rect.height,
                        top: rect.top,
                        bottom: rect.bottom
                    };
                }
            }

            // 플로팅 버튼들 (a 태그, rounded-full, viewport 내)
            const links = document.querySelectorAll('a.rounded-full, a[class*="rounded-full"]');
            for (const link of links) {
                const rect = link.getBoundingClientRect();
                // viewport 내에 있고 우측에 위치한 버튼만
                if (rect.top >= 0 && rect.bottom <= viewportHeight && rect.right > window.innerWidth - 200) {
                    const href = link.getAttribute('href') || '';
                    let type = 'unknown';
                    if (href.includes('tel:')) type = 'phone';
                    else if (href.includes('kakao')) type = 'kakao';
                    else if (href.includes('line')) type = 'line';
                    else if (href.includes('weixin')) type = 'wechat';

                    results.buttons.push({
                        type: type,
                        href: href.substring(0, 50),
                        top: rect.top,
                        bottom: rect.bottom,
                        height: rect.height
                    });
                }
            }

            return results;
        }''')

        # 결과 출력
        print(f"\n4. CTA 컨테이너 CSS:")
        if result['ctaContainer']:
            cta = result['ctaContainer']
            print(f"   bottom: {cta['bottom']}")
            print(f"   위치: top={cta['boundingRect']['top']:.0f}px, bottom={cta['boundingRect']['bottom']:.0f}px")
        else:
            print("   [WARN] CTA 컨테이너를 찾지 못함")

        print(f"\n5. 상담 바:")
        if result['consultationBar']:
            bar = result['consultationBar']
            print(f"   높이: {bar['height']:.0f}px")
            print(f"   위치: top={bar['top']:.0f}px, bottom={bar['bottom']:.0f}px")
        else:
            print("   [WARN] 상담 바를 찾지 못함")

        print(f"\n6. 플로팅 버튼 ({len(result['buttons'])}개):")
        for btn in result['buttons']:
            print(f"   - {btn['type']}: top={btn['top']:.0f}px, bottom={btn['bottom']:.0f}px")

        # 겹침 확인
        print("\n7. 겹침 분석:")
        if result['ctaContainer'] and result['consultationBar']:
            cta_bottom = result['ctaContainer']['boundingRect']['bottom']
            bar_top = result['consultationBar']['top']
            gap = bar_top - cta_bottom
            print(f"   CTA 하단: {cta_bottom:.0f}px")
            print(f"   상담바 상단: {bar_top:.0f}px")
            print(f"   간격: {gap:.0f}px")

            if gap >= 0:
                print("   [PASS] 겹치지 않음!")
            else:
                print(f"   [FAIL] {abs(gap):.0f}px 겹침!")

        # 카카오 버튼 확인
        print("\n8. 카카오채널 버튼:")
        kakao_found = any(btn['type'] == 'kakao' for btn in result['buttons'])
        if kakao_found:
            print("   [PASS] 존재함!")
        else:
            print("   [FAIL] 없음!")

        browser.close()
        print("\n완료! 스크린샷: floating_cta_viewport.png")

if __name__ == '__main__':
    test_floating_cta()
