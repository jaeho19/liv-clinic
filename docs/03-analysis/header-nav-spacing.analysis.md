# Analysis (Check): 상단 헤더 네비게이션 간격 개선 (header-nav-spacing)

> **Feature**: header-nav-spacing
> **작성일**: 2026-05-30
> **Phase**: Check (Gap Analysis)
> **Match Rate**: **98%** (Structural 100% · Functional 100% · Runtime 100% · 품질 감점 -2%)
> **검증 방식**: 정적 코드 대조 + Playwright 다중 폭 런타임 측정 (팝업 제거 클린 캡처)

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 좁은 메뉴 간격이 프리미엄 인상을 해침 → 여유 간격으로 고급스러움 강화 |
| **RISK** | nav 9개 → 1024~1280px overflow 위험. compact-nav locale 미변경. |
| **SUCCESS** | `/ko` PC 메뉴 분리, 로고↔소개·이벤트↔상담 여백, 태블릿/모바일 무손상, build 0 error |
| **SCOPE** | nav gap·로고/우측 margin만 `xl:`/`2xl:` 한정. 높이·폰트·색상·버튼 디자인 불변. |

## 1. Strategic Alignment Check

| 질문 | 판정 | 근거 |
|------|------|------|
| 핵심 문제(메뉴가 붙어 보임) 해결? | ✅ | logo→nav 0~2px→16~32px, event→consult 0~2px→8~12px (런타임 실측) |
| Plan Success Criteria 충족? | ✅ | SC-1~8 전부 충족 (아래 §3) |
| 핵심 Design 결정(Option A, xl 한정) 준수? | ✅ | 모든 변경 `xl:`/`2xl:` prefix, `lg` base 불변 확인 |

전략적 정렬 어긋남 없음 → Critical 없음.

## 2. 구조적 일치 (Design §3 ↔ 구현)

| Design 명세 | 구현 (Header.tsx) | 일치 |
|-------------|-------------------|:----:|
| §3.1 nav gap 상단 `gap-5 xl:gap-7 2xl:gap-9` | L200 동일 | ✅ |
| §3.1 nav gap 스크롤 `gap-4 xl:gap-6 2xl:gap-7` | L202 동일 | ✅ |
| §3.1 로고 분리 `xl:ms-4 2xl:ms-8` | L200 nav className 동일 | ✅ |
| §3.2 우측 gap `xl:gap-5` | L271 동일 | ✅ |
| §3.3 상담버튼 `xl:ms-2 2xl:ms-3` | L275 동일 | ✅ |
| §3.4 LanguageSwitcher 조건부(기본 무변경) | 미변경 (consult→lang 76px로 충분) | ✅ |
| §3.5 높이/폰트/색상/compact-nav/드롭다운 불변 | git diff 5줄, 모두 간격 클래스 | ✅ |

**Structural Match: 100%** (7/7)

## 3. Plan Success Criteria 검증

| SC | 기준 | 판정 | 증거 (런타임 실측) |
|----|------|:----:|---------------------|
| SC-1 | PC 메뉴 안 붙음 | ✅ Met | 1440px logo→nav 16px, event→consult 8px |
| SC-2 | 로고↔리브소개 여백 | ✅ Met | 2px → 16px(1440) / 32px(1920) |
| SC-3 | 이벤트↔상담 여백 | ✅ Met | 2px → 8px(1440) / 12px(1920) |
| SC-4 | KR영역↔상담 분리 | ✅ Met | 68px → 76px |
| SC-5 | 1024/1280px nav 한 줄 | ✅ Met | 1280px h=80, langRight 1259/1280 클리핑 없음 |
| SC-6 | 768/375 햄버거 무손상 | ✅ Met | nav=hidden, h=80 변화 없음 |
| SC-7 | 높이·폰트·색상 불변 | ✅ Met | h=80 유지, diff에 height/text-/color 클래스 없음 |
| SC-8 | `npm run build` 0 error | ✅ Met | EXIT 0, ✓ Compiled successfully in 5.6s |

**충족률: 8/8 (100%)**

## 4. Functional Depth (런타임 측정 매트릭스)

| 폭 | logo→nav | event→consult | consult→lang | 높이 | langRight/vw | 줄바꿈 |
|----|:--:|:--:|:--:|:--:|:--:|:--:|
| 1920 (2xl) | 32px | 12px | 76px | 80 | 1663/1920 | 없음 |
| 1440 (xl) | 16px | 8px | 76px | 80 | 1339/1440 | 없음 |
| 1280 (xl) | 16px | 8px | 76px | 80 | 1259/1280 | 없음 |
| 1024 (lg) | 0px | 0px | 60px | 80 | 1076/1024 | 없음 (단, 기존 lang 클리핑) |
| 768 (md) | 햄버거 | — | — | 80 | 744/768 | 없음 |
| 375 | 햄버거 | — | — | 80 | 364/375 | 없음 |

**Functional: 100%** — 의도한 간격 전부 달성, 회귀 없음.

## 5. Gap 목록

| # | 항목 | 심각도 | 본 기능의 Gap? | 비고 |
|---|------|:------:|:--:|------|
| G-1 | 1024px(lg)에서 언어 스위처 클리핑 (langRight 1076 > 1024) | Important | ❌ **아님** | **baseline 동일** — 사전 존재 버그. 본 변경(`xl:` 한정)은 `lg` 미변경이라 영향 0. 별도 이슈로 분리 권장 |
| G-2 | 1280px(xl 최소폭) 우측 여유 21px로 빡빡 | Minor | ⚠️ 경계 | 클리핑·줄바꿈 없음. Design §3에서 xl 범위 수용 결정. 1440px+ 충분(101px+) |

**본 기능 자체의 Critical/Important Gap: 0건.**

## 6. Decision Record 검증

| 결정 | 준수 여부 |
|------|:--:|
| [Plan] Option A 최소 변경 | ✅ git diff 5줄, 추상화 도입 없음 |
| [Design] `xl:`/`2xl:` 한정으로 overflow 차단 | ✅ lg base 불변, 1280px 클리핑 없음 |
| [Design] 버튼 크기·톤 유지 | ✅ 버튼 패딩/색상 클래스 미변경 |

## 7. 결론

Match Rate **98%** (≥90% 통과). 본 기능의 모든 Success Criteria 충족, Critical/Important Gap 0건. G-1(1024px lang 클리핑)은 사전 존재 버그로 본 작업 범위 밖 — 사용자 결정에 따라 별도 처리. → **report 단계 진행 가능.**

---
*감점 -2%: G-2(1280px 경계 빡빡함) 품질 여유 부족. 기능 요구사항은 전부 충족.*
