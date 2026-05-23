# Media & News 이미지 카드 — Gap 분석 (Check)

> **Feature**: `media-news-image-cards`
> **Phase**: Check (Gap Analysis)
> **Created**: 2026-05-23
> **Design**: `docs/02-design/features/media-news-image-cards.design.md`
> **Plan**: `docs/01-plan/features/media-news-image-cards.plan.md`
> **Match Rate**: **96.9%** (정적 96.9% + 런타임 검증 통과) · target 90% ✅

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 텍스트 전용 카드 → 이미지 위주로 주목도·클릭률 향상 |
| **WHO** | 홈 방문자, 글로벌 고객, 언론/제휴 검토자 (모바일 비중↑) |
| **RISK** | OG 저작권(출처표기로 완화)·품질편차·LCP/CLS |
| **SUCCESS** | 홈6+/media 전 카드 깨짐 0, CLS 0, 폴백 100% 커버 |
| **SCOPE** | 카드 레이아웃·데이터모델·OG 파이프라인 (모달 불변) |

---

## 1. 종합 점수

| 축 | 점수 | 상태 |
|----|:----:|:----:|
| Structural Match | 100% | ✅ |
| Functional Depth | 96% | ✅ |
| API Contract | N/A | UI 전용 — 신규 엔드포인트 없음 |
| Intent / UX Fidelity | 100% / 95% | ✅ |
| Decision-Record 준수 | 100% | ✅ |
| **Overall (Contract 제외 재정규화)** | **96.9%** | ✅ ≥90 |

> 검증: gap-detector 에이전트(정적 독립 분석) + Playwright 런타임(L2/L3) + curl(OG 200) + 프로덕션 빌드(exit 0).

---

## 2. Strategic Alignment (WHY 충족)

- **문제 해결**: 텍스트 전용 6카드 → 실이미지 4 + 브랜드 폴백 2의 이미지 위주 갤러리. "보여주는" 임팩트 확보 ✅
- **OG 정책**: "OG 그대로 사용" 결정 준수 — `source` 매체명 카드 노출 + 클릭 시 원문 새 탭(`rel=noopener`). 셀럽 방문(9·10·12)은 초상권상 폴백 ✅
- **아키텍처 C**: 공용 `MediaNewsCardMedia` + `Placeholder` 코로케이트(별도 파일 아님) — 설계 §1.1 그대로 ✅

---

## 3. Plan Success Criteria 검증

| SC | 기준 | 상태 | 증거 |
|----|------|:----:|------|
| SC-1 | 홈 6카드 비주얼 100%, 깨짐 0 | ✅ Met | 런타임: 실이미지 4 + 폴백 2 = 6, naturalWidth=0 → **0건** |
| SC-2 | /media 전 카드 동일 스타일 | ✅ Met | 공용 카드(`media/page.tsx:77`); 5개 필터 순회 깨진 이미지 **0** |
| SC-3 | OG 로컬 서빙(핫링크 0) | ✅ Met | 모든 `image` 경로 `/images/media-news/...` 로컬; curl 9/9 **200** |
| SC-4 | 이미지 없는 항목 폴백 일관 | ✅ Met | `Placeholder` 타입별 브랜드 톤; f4/f6 폴백 렌더 확인 |
| SC-5 | CLS 0 / LCP 예산 | ✅ Met | `aspect-[16/9]` 공간 예약(CLS 0) + 1행 3장 `loading≠lazy`(eager) 런타임 확인 |
| SC-6 | 반응형 + hover/focus | ✅ Met | 런타임: 모바일 1열 / 태블릿 2열; `whileHover y:-6` + `focus-visible:ring` 코드 |
| SC-7 | alt 의미 기반 + 폴백 a11y | ✅ Met | `alt={item.title}`; 폴백 `role=img`+`aria-label`(예: `ACADEMIC 대표 이미지`) |
| SC-8 | 저작권 방침(OG+출처) | ✅ Met | `source` 노출 + 외부 anchor `rel=noopener noreferrer` (vegannews/issuemaker 확인) |

**SC 결과: 8/8 Met (100%)** — 정적 partial이던 SC-5/SC-6을 런타임으로 확정.

---

## 4. Functional Depth 상세 (96%)

| 설계 요소 | 결과 | 증거 |
|---|:--:|---|
| `aspect-[16/9]`·`rounded-t-2xl`·`object-cover`·`fill` | ✅ | `MediaNewsCardMedia.tsx:28-36` |
| `sizes` 반응형 + 호버 `scale-105` | ✅ | `MediaNewsCardMedia.tsx:34-36` |
| 3단 폴백 `image ?? images[0] ?? null` + `'images' in item` 가드 | ✅ | `MediaNewsCard.tsx:115-116` |
| 패딩 재구조화(외곽 `p-6`→`overflow-hidden`, 내부 `flex flex-1 flex-col p-6`) | ✅ | `MediaNewsCard.tsx:25-26,102` (CTA `mt-auto` 보존) |
| `CardContent`로 3 wrapper 중복 제거 | ✅ | `MediaNewsCard.tsx:81-107` |
| `priority={index<3}` (홈 1행만) / 아카이브 lazy | ✅ | `MediaNewsSection.tsx:45` |
| 폴백 타입별 그라데이션 + 모노그램 + 배지 | ✅ | `MediaNewsCardMedia.tsx:46-62` |
| `any`/TODO/`console.log` 없음 | ✅ | grep clean |

---

## 5. Gap 목록 (Critical/Important 없음)

| # | 심각도 | 내용 | 조치 |
|---|:------:|------|------|
| G1 | Minor | 설계 §5.3이 OG를 `og/{id}.jpg` 균일 표기했으나 실측 id 2·5는 `.png`. 데이터·디스크는 일치(깨짐 없음) — 문서 드리프트 | ✅ **수정 완료** (설계 §5.3 실측 표로 갱신) |
| G2 | Minor | OG 화질 게이트(가로≥600·로고 배제)는 수동 체크 — 자동 가드 없음 | 운영 시 1회성 스크립트 리포트로 점검(현 상태 허용) |
| G3 | Info | 런타임 이미지 로드 실패는 next/image 기본 동작으로 폴백(브랜드 폴백 아님) — 설계 §9에서 의도적으로 수용 | 조치 불요 |
| G4 | Info | 화질 낮은 OG 3장(id 3·4·13, 300px급) — "OG 그대로" 결정에 따라 유지, 시각상 허용 | 선택: 해당 카드 `image` 제거 시 즉시 폴백 전환 |

---

## 6. 런타임 검증 로그 (Evidence)

```
[홈] 실이미지 img=4 · 폴백 role=img=2 (합 6, 기대 6)   ✓
[홈] 깨진 이미지(naturalWidth=0): 0                      ✓
[홈] 1행 3장 priority: loading≠lazy(eager)              ✓
[홈] 폴백 aria-label: ACADEMIC 대표 이미지 / LIV VISIT 대표 이미지  ✓
[홈] 외부 anchor 3개 rel=noopener noreferrer (vegannews/issuemaker)  ✓
[홈] 콘솔 에러: 0건                                       ✓
[/media] 5개 필터 순회 깨진 이미지 누적: 0 · 콘솔 에러 0  ✓
[반응형] 모바일 375px=1열 / 태블릿 768px=2열             ✓
[curl] OG 8장 + medical-aesthetic = 9/9 → 200            ✓
[build] exit 0 · Compiled successfully                   ✓
```

---

## 7. 결론

설계·구현 일치도 **96.9%**, Success Criteria **8/8 충족**, Critical/Important Gap **0**. 모든 카드가 깨짐 없이 비주얼(실이미지 또는 브랜드 폴백)을 노출하며 홈/`/media` 전반에서 동작 확인됨. **Report 단계 진행 가능**.

남은 선택 항목: 저화질 OG 3장(id 3·4·13) 폴백 전환 여부 — 사용자 판단.

→ `/pdca report media-news-image-cards`
