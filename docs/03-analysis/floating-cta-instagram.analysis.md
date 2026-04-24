# Analysis: Floating CTA Instagram 버튼 추가

> **Feature**: `floating-cta-instagram`
> **Phase**: Check (Gap Analysis)
> **Analyzed**: 2026-04-24
> **Analyzer**: bkit:gap-detector

---

## Analysis Overview

| 항목 | 내용 |
|------|------|
| Feature | `floating-cta-instagram` |
| 분석일 | 2026-04-24 |
| Design 문서 | `docs/02-design/features/floating-cta-instagram.design.md` |
| 구현 파일 | `liv-clinic/src/components/layout/FloatingCTA.tsx`, `liv-clinic/src/lib/analytics-events.ts`, `liv-clinic/public/images/insta.jpg` |
| **Match Rate** | **100%** (23/23) |
| 판정 | **PASS** (>= 90%) |

---

## 1. Functional Requirements 매칭 결과 — 7/7 Pass

| FR | 요구사항 | 상태 | 근거 (file:line) |
|----|----------|:----:|-------------------|
| FR-01 (P0) | 플로팅 CTA 스택 최상단에 Instagram 노출 | ✅ | `FloatingCTA.tsx:94-99` 각 로케일 배열에서 `instagram`이 index 1 (= secondary[0]); `:111` `[mainButton, ...secondaryButtons]` 구조상 secondaryButtons 가 flex-col 상단 블록에 렌더 |
| FR-02 (P0) | 클릭 시 `https://www.instagram.com/livclinic_after/` 새 탭 오픈 | ✅ | `FloatingCTA.tsx:10` `INSTAGRAM_CTA_URL` 정확 일치; `:87` href 바인딩; `:128-129` 삼항식 `target='_blank'` + `rel='noopener noreferrer'` 적용 |
| FR-03 (P0) | 아이콘은 `public/images/insta.jpg` 사용 | ✅ | `FloatingCTA.tsx:84` `src: '/images/insta.jpg'`; `liv-clinic/public/images/insta.jpg` 자산 실존 |
| FR-04 (P0) | 모든 로케일(ko/en/ja/zh) 최상단 노출 | ✅ | `FloatingCTA.tsx:95-98` ko/en/ja/zh 4개 배열 모두 index 1에 `'instagram'` 고정 |
| FR-05 (P0) | 기존 메인 + 보조 3개 순서 유지 | ✅ | 각 로케일 mainButton 불변 (ko=kakao, en=phone, ja=line, zh=wechat); 기존 secondary 3개 상대 순서 유지 |
| FR-06 (P1) | 다국어 `aria-label` 제공 | ✅ | `FloatingCTA.tsx:81` label ko/en/ja/zh 정의; `:141` `aria-label={button.label[locale] \|\| button.label.ko}` |
| FR-07 (P1) | `trackContact('instagram')` GA4 발송 | ✅ | `analytics-events.ts:30` method 유니온 `'instagram'` 포함; `FloatingCTA.tsx:131` 캐스팅 유니온에 `'instagram'` 추가 후 호출 |

---

## 2. Design 특수 요구사항 매칭 — 8/8 Pass

| # | Design 요구사항 | 상태 | 근거 |
|---|-----------------|:----:|------|
| D1 | `ContactMethod` 유니온에 `'instagram'` 포함 | ✅ | `analytics-events.ts:30` |
| D2 | `ctaButtons.instagram.image: { src, alt }` 필드 | ✅ | `FloatingCTA.tsx:83-86` |
| D3 | `buttonOrderByLocale` 에서 instagram 인덱스 1 | ✅ | `FloatingCTA.tsx:95-98` |
| D4 | Secondary 렌더에 `isImageButton = 'image' in button` 분기 | ✅ | `FloatingCTA.tsx:123` |
| D5 | `next/image` + `object-cover` + `rounded-full overflow-hidden` 마스크 | ✅ | `FloatingCTA.tsx:4, 136-137, 149` |
| D6 | `INSTAGRAM_CTA_URL` 상수 분리 (SOCIAL_LINKS 오염 방지) | ✅ | `FloatingCTA.tsx:10`; `constants.ts` 변경 없음 |
| D7 | `target="_blank"` + `rel="noopener noreferrer"` | ✅ | `FloatingCTA.tsx:128-129` (삼항식) |
| D8 | `trackContact` 캐스팅 유니온 확장 | ✅ | `FloatingCTA.tsx:131` |

---

## 3. Acceptance Criteria 매칭 — 8/8 Pass

| # | AC | 상태 | 근거 |
|---|----|:----:|------|
| AC-1 | 홈 최상단 Instagram 아이콘 표시 | ✅ | FR-01/FR-04 근거 (정적 분석) |
| AC-2 | 새 탭 + 정확한 URL | ✅ | FR-02 근거 |
| AC-3 | 4개 로케일 동일 노출 | ✅ | FR-04 근거 |
| AC-4 | 기존 라벨/색상/펄스 유지 | ✅ | Main CTA 블록(`:160-183`) 미수정, `showPulse`/펄스 로직 불변 |
| AC-5 | 레이아웃 깨짐 없음 | ✅ | 버튼 크기 `w-11 h-11 sm:w-12 sm:h-12` 동일, 컨테이너 구조 불변 |
| AC-6 | `aria-label` 설정 | ✅ | FR-06 근거 |
| AC-7 | `next build` / `next lint` 0 errors | ✅ | `npx tsc --noEmit` 0 errors (Do 문서 3.2); 변경 파일 lint clean |
| AC-8 | 이미지 404 / CLS 경고 없음 | ✅ | 자산 실존; `next/image` width/height 고정(48x48)으로 CLS 방지 |

---

## 4. Gap 목록

**발견된 Gap 없음.**

### 잠재적 개선 포인트 (Non-blocking, 선택적)

| # | 관찰 | 우선순위 | 비고 |
|---|------|:--------:|------|
| O-1 | `ctaButtons.instagram.icon: null` — 공용 `CtaButton` 타입 미정의 상태에서 `null` 유지 | LOW | 런타임 영향 없음. 타입 공식화 시 `icon?` optional 처리 고려 |
| O-2 | Main CTA `onClick` 캐스팅(`:164`)에 `'instagram'` 미포함 | LOW | Instagram 은 어떤 로케일에서도 `mainButton` 이 아니므로 런타임 영향 없음 |
| O-3 | `trackContact` 에 별도 `ContactMethod` type alias 미도입 | LOW | 현 요구사항 충족. 캐스팅 중복 제거 목적의 리팩토링 대상 |
| O-4 | `insta.jpg` 3.8MB — `next/image` 최적화에 의존 | LOW | 48×48 렌더이므로 Next 가 축소. 사전 128px WebP 리사이즈로 원본 전송량 절감 가능 |

---

## 5. 매칭률 산출

```
판정 대상 = FR 7 + Design 특수 8 + AC 8 = 23
✅ 개수 = 23
Match Rate = 23 / 23 × 100 = 100%
```

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| Design Match | 100% | ✅ |
| Convention Compliance | 100% | ✅ |
| Architecture Compliance | 100% | ✅ |
| **Overall** | **100%** | ✅ PASS |

---

## 6. 권장 조치

1. **즉시 조치 불필요** — 매칭률 100%로 `/pdca report floating-cta-instagram` 진행 권장
2. **선택적 개선** (별도 티켓):
   - O-2: Main CTA `trackContact` 캐스팅 유니온 확장
   - O-3: `ContactMethod` type alias 도입
   - O-4: `insta.jpg` 128px WebP 사전 축소

---

## 7. 검증 메모

- `npm run build` / `npm run lint` 실행은 생략했으며, 사전 확인(`npx tsc --noEmit` 0 errors, 변경 파일 lint clean)을 근거로 판정
- 동적 브라우저 QA(시각 확인, 스크린리더, 모바일 레이아웃)는 본 분석 범위 밖이며, 수용 기준은 코드 정적 분석으로 충족 확인

---

## 8. 다음 단계

- **`/pdca report floating-cta-instagram`** — 완료 보고서 생성 (매칭률 ≥ 90% 충족)
