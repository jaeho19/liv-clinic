# Analysis: floating-cta-redesign — Gap Analysis Report

> **Feature**: `floating-cta-redesign`
> **Phase**: Check (Gap Analysis)
> **Analyzed**: 2026-04-30
> **Plan 참조**: `docs/01-plan/features/floating-cta-redesign.plan.md`
> **Design 참조**: `docs/02-design/features/floating-cta-redesign.design.md` (§12 Addendum 포함)
> **분석 도구**: `bkit:gap-detector` 에이전트

---

## Analysis Overview

| Item | Value |
|------|-------|
| Feature | `floating-cta-redesign` |
| Source of Truth | Design §12 Addendum (구현 중 스코프 변경 반영) |
| Implementation | `liv-clinic/src/components/layout/FloatingCTA.tsx` (164 lines), `liv-clinic/src/lib/analytics-events.ts` (line 28-46) |
| **Match Rate** | **100%** (27/27) ✅ |
| Verdict | **PASS** (≥ 90% target met) |

---

## 1. Acceptance Criteria 평가 (Plan §6, §12 반영)

| # | Acceptance Criterion | §12 Override | Status | Evidence |
|---|---------------------|:------------:|:------:|----------|
| AC-1 | `/ko` 3개 버튼 노출 — **§12.1로 7개로 변경됨** | §12.1 final | ✅ PASS | `FloatingCTA.tsx:106-114` `BUTTON_ORDER = [instagram, youtube, phone, kakao, line, whatsapp, wechat]` |
| AC-2 | Instagram → 새 탭 `livclinic_after` | — | ✅ PASS | `:26` href; `:128` `isExternal` true; `:134` `target='_blank'`; `:135` `rel='noopener noreferrer'` |
| AC-3 | YouTube → 새 탭 `@리브성형외과` | — | ✅ PASS | `:34` `SOCIAL_LINKS.youtube` (`constants.ts:32`); 동일 외부 링크 처리 |
| AC-4 | Phone → `tel:02-797-2773` | — | ✅ PASS | `:42` `tel:${SITE_INFO.phone}` (`constants.ts:6`) |
| AC-5 | `/en`, `/ja`, `/zh` 동일 구성 | — | ✅ PASS | 단일 `BUTTON_ORDER` 배열, 로케일 분기 없음 |
| AC-6 | Kakao 메인 CTA(라벨+pulse) 제거 | §12.1 | ✅ PASS | mainButton/secondaryButtons 분리 폐지; `useState`/`useEffect`/`showPulse` 제거; kakao 아이콘 전용 |
| AC-7 | Instagram·YouTube 동일 크기·스타일 | — | ✅ PASS | 둘 다 `bg-white`, `next/image w=48 h=48 object-cover`, `w-11 h-11 sm:w-12 sm:h-12` |
| AC-8 | 모바일(≤375px) 레이아웃 무결성 | — | ✅ PASS | 44px 터치 타겟(WCAG 2.5.5), `bottom: calc(80px + safe-area)` 69px CTA 바 + 11px 버퍼, 7개 약 350px 세로 (375×667 수납) |
| AC-9 | 각 버튼 `aria-label` | — | ✅ PASS | `:145` 다국어 라벨 + ko fallback |
| AC-10 | `npm run lint` 통과 | — | ✅ PASS | `npx eslint src/components/layout/FloatingCTA.tsx src/lib/analytics-events.ts src/lib/constants.ts` → **exit 0, 0 errors** (실측 2026-04-30) |
| AC-11 | 이미지 404 없음 | — | ✅ PASS | `instagram.png` (205KB), `youtube.png` (32KB) 디스크 존재; 나머지 5개 인라인 SVG |

**소계: 11/11 PASS**

---

## 2. Design §12 Addendum 검증

| # | §12 사양 | Status | Evidence |
|---|----------|:------:|----------|
| D12-1 | 7개 버튼 [instagram, youtube, phone, kakao, line, whatsapp, wechat] | ✅ PASS | `FloatingCTA.tsx:106-114` |
| D12-2 | `ContactMethod` 유니온 7개로 확장 | ✅ PASS | `:10` |
| D12-3 | wechat `weixin://` 외부 링크 분기 | ✅ PASS | `:128` `startsWith('http') \|\| startsWith('weixin')` → `target='_blank'` |
| D12-4 | `rel="noopener noreferrer"` `http`만 적용 | ✅ PASS | `:135` `startsWith('http') ? 'noopener noreferrer' : undefined` (XSS 방지) |
| D12-5 | 컨테이너 `bottom: 80px` | ✅ PASS | `:122` `calc(80px + env(safe-area-inset-bottom, 0px))` |
| D12-6 | ASCII 파일명 (`instagram.png`/`youtube.png`) | ✅ PASS | `:27, :35` 코드 + 디스크 자산 일치 |

**소계: 6/6 PASS**

---

## 3. Design §1~§11 검증 (§12로 미덮인 사양)

| # | 사양 | Status | Evidence |
|---|------|:------:|----------|
| D-1 | 컨테이너 `right-2 sm:right-4 md:right-6 z-40 flex flex-col items-end gap-2` | ✅ PASS | `:121` 일치 |
| D-2 | 버튼 외부 `w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all` | ✅ PASS | `:140-142` |
| D-3 | 이미지 버튼 `bg-white overflow-hidden` + `next/image` w=48 h=48 `object-cover w-full h-full` | ✅ PASS | `:141, 147-154` |
| D-4 | 전화 버튼 `bg-primary hover:bg-primary/90 text-white` | ✅ PASS | `:53-54` |
| D-5 | `trackContact` 유니온 `'youtube'` 추가 | ✅ PASS | `analytics-events.ts:39` |
| D-6 | `trackContact(button.id)` 캐스팅 없음 (Design §5.2) | ✅ PASS | `:136` `as` 캐스팅 없음, `ContactMethod` ⊆ method 유니온 |
| D-7 | Framer Motion `initial`/`animate`/`transition`(delay=index×0.1)/`whileHover`/`whileTap` | ✅ PASS | `:137-144` |
| D-8 | `aria-label` ko fallback | ✅ PASS | `:145` |
| D-9 | `useState`/`useEffect`/`showPulse` 제거 (단일 렌더 루프) | ✅ PASS | `useLocale`만 유지 (`:117`) |
| D-10 | 단일 `BUTTON_ORDER` 배열 (`buttonOrderByLocale` 폐지) | ✅ PASS | `:106` |

**소계: 10/10 PASS**

---

## 4. Match Rate Summary

```
┌──────────────────────────────────────────────┐
│  Match Rate: 100% (27/27)                    │
├──────────────────────────────────────────────┤
│  PASS:        27 items                       │
│  UNVERIFIED:   0 items                       │
│  FAIL:         0 items                       │
└──────────────────────────────────────────────┘
```

---

## 5. Gap List (잔여 이슈)

### Gap-A (P2, 문서 일관성 — 구현 영향 없음)

- **위치**: Design §6 (접근성 키보드 Tab 순서 표) — §12 추가 전 작성된 3개 버튼 기준
- **현재 구현**: `FloatingCTA.tsx:106-114` 7개 버튼 자연 순서
- **이슈**: §6 접근성 표가 3개 버튼 시점 그대로. §12.1이 7개 버튼으로 변경했지만 §12에서 Tab 순서를 명시적으로 갱신하지 않음.
- **유형**: Design 문서 내부 일관성 (구현은 §12 사양과 일치)
- **권장**: 선택 — Design §12에 Tab 순서 한 줄 추가: "Tab order: instagram → youtube → phone → kakao → line → whatsapp → wechat"

### Gap-B (P2, Plan-Design 트레이드오프 문서 — 구현 영향 없음)

- **위치**: Plan §11 리스크 행 "해외 사용자 접근성 (WhatsApp/LINE) — 의식적 trade-off"
- **§12 변경**: §12.1에서 kakao/line/whatsapp/wechat 모두 복원
- **이슈**: §11 트레이드오프 결정이 §12.1로 뒤집혔지만 명시적 철회 문구 없음
- **유형**: Plan 레벨 문서 누락 (§12에 스코프 변경 자체는 기록됨)
- **권장**: 선택 — Report 단계에서 트레이드오프 번복 명시

### Gap-C (P2, accepted scope change — 구현 영향 없음)

- **위치**: Plan §6 AC-1 "3개 버튼" / FR-05 "kakao·WhatsApp·LINE·WeChat 제거"
- **§12 변경**: §12.1 4개 채널 복원
- **유형**: **공식 승인된 스코프 변경**. 사용자 요청에 따른 의식적 결정으로 §12에 문서화됨
- **권장**: 조치 불필요

---

## 6. Strengths (잘 구현된 항목)

1. **단일 렌더 루프** — `[mainButton, ...secondaryButtons]` 분리 완전 폐지, `BUTTON_ORDER.map()` 7개 깔끔하게 처리 (`:124-160`)
2. **불필요한 훅 제거** — `useState`/`useEffect`/`showPulse` 모두 삭제, `useLocale`만 유지
3. **로케일 단순화** — 단일 `BUTTON_ORDER` 배열, 로케일은 aria-label 룩업에만 사용
4. **외부 링크 안전성 분기** — `target='_blank'`은 `http` + `weixin://` 모두 지원, `rel='noopener noreferrer'`은 `http`만 (XSS 방지). §12.1 사양 정확히 구현
5. **타입 안전성 향상** — `trackContact(button.id)` `as` 캐스팅 불필요 (`ContactMethod` ⊆ method 유니온)
6. **WCAG 2.5.5** — 44×44px(모바일), 48×48px(sm+) 터치 타겟 준수
7. **하단 바 충돌 해결** — 80px가 69px CTA 바 + 11px 버퍼 확보 (§12.2 목표 달성)
8. **ASCII 파일명 + 자산 존재** — Plan §8 #2 인코딩 리스크 완전 해소
9. **시각적 차별화** — 전화 `bg-primary`(브랜드), 이미지 `bg-white`, SVG 채널 브랜드 컬러 보존
10. **Framer Motion 스태거** — `delay: index * 0.1`로 위→아래 부드러운 페이드인

---

## 7. Recommendations

**판정: cleanup 불필요, 즉시 Report 단계 진행 가능.** `/pdca iterate` 호출 불필요.

### 7.1 선택적 문서 개선 (P2)

| # | 항목 | 위치 |
|---|------|------|
| 1 | §12.6에 7개 버튼 Tab 순서 추가 | `floating-cta-redesign.design.md` |
| 2 | WhatsApp/LINE 트레이드오프 번복 명시 | §12 Addendum 또는 Report |
| 3 | Plan §6 AC-1/FR-05에 §12.1 cross-reference | `floating-cta-redesign.plan.md` |

### 7.2 백로그 (블로킹 아님)

- `INSTAGRAM_CTA_URL` 상수가 인라인됨 (Design §8 step 2 "또는 유지" 허용 범위) → 향후 모든 URL을 `SOCIAL_LINKS`로 통일 검토

---

## 8. Next Step

Match Rate 100% 달성 (≥ 90% 목표 충족) → **Report 단계 진행 권장**

```
/pdca report floating-cta-redesign
```

---

## 9. 참고 파일

- Plan: `C:\dev\LIV_homepage\docs\01-plan\features\floating-cta-redesign.plan.md`
- Design (§12 Addendum 포함): `C:\dev\LIV_homepage\docs\02-design\features\floating-cta-redesign.design.md`
- 컴포넌트: `C:\dev\LIV_homepage\liv-clinic\src\components\layout\FloatingCTA.tsx` (164 lines)
- Analytics: `C:\dev\LIV_homepage\liv-clinic\src\lib\analytics-events.ts:28-46`
- 상수: `C:\dev\LIV_homepage\liv-clinic\src\lib\constants.ts:6, 28-36`
- 자산: `C:\dev\LIV_homepage\liv-clinic\public\images\instagram.png` (205KB), `youtube.png` (32KB)
- 선행 분석: `C:\dev\LIV_homepage\docs\03-analysis\floating-cta-instagram.analysis.md`
- gap-detector 실행 결과: 본 문서 §1~§4 (Match Rate 96% → lint 검증 후 100%)
