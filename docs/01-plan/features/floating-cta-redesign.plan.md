# Plan: Floating CTA 단순화 (Instagram + YouTube + Phone)

> **Feature**: `floating-cta-redesign`
> **Phase**: Plan
> **Created**: 2026-04-30
> **Owner**: jaeho19@gmail.com
> **Related**: `floating-cta-instagram` (선행) — 본 작업으로 일부 무효화

---

## 1. 배경 (Background)

홈페이지 우측 하단 플로팅 CTA가 한국어 로케일 기준 **5개 버튼**(카카오 메인 CTA + 인스타그램/전화/WhatsApp/LINE 보조 스택)으로 구성되어 시각적으로 복잡하고 핵심 채널이 분산되어 있다.

선행 작업 `floating-cta-instagram`(2026-04-24)에서 인스타그램 버튼이 추가되었고, 이번 작업에서는 **유튜브 채널 노출**을 추가하면서 동시에 **버튼 구성을 3개로 단순화**한다.

- 현재 구현: `liv-clinic/src/components/layout/FloatingCTA.tsx` (187줄)
- 변경 후 노출 채널: **인스타그램·유튜브·전화** 3개만 (카카오/WhatsApp/LINE/WeChat 모두 제거)
- 신규 자산: `public/images/인스타 버튼.png`, `public/images/유튜브-버튼.png` (사용자 직접 업로드)

---

## 2. 목표 (Goals)

1. 플로팅 CTA를 위에서 아래 순서로 **인스타그램 → 유튜브 → 전화** 3개 버튼으로 재구성한다.
2. 인스타그램 버튼 이미지를 신규 PNG (`/images/인스타 버튼.png`)로 교체하고 링크 `https://www.instagram.com/livclinic_after/` 유지.
3. 유튜브 버튼을 신규 추가하여 `https://www.youtube.com/@리브성형외과` 채널로 새 탭 연결.
4. 모든 로케일(ko / en / ja / zh)에서 동일한 3개 버튼 구성을 노출한다.
5. 기존 카카오 메인 CTA(라벨 + 펄스 애니메이션) 구조를 폐지하고, 3개 모두 동일한 아이콘 버튼으로 통일한다.

---

## 3. 범위 (Scope)

### In Scope
- `FloatingCTA.tsx` 전면 재작성: `ctaButtons`에서 `kakao/wechat/line/whatsapp` 제거, `youtube` 추가
- `buttonOrderByLocale` 단순화: 모든 로케일 `['instagram', 'youtube', 'phone']` 동일 적용
- 메인 CTA 분리 로직 폐지 (`mainButton`/`secondaryButtons` 구조 제거)
- 인스타그램 이미지 경로 교체: `/images/insta.jpg` → `/images/인스타 버튼.png`
- 유튜브 버튼 신규: 인스타그램과 동일 크기·스타일(`w-11 h-11 sm:w-12 sm:h-12`, `bg-white`, `rounded-full`, `shadow-lg`)
- `analytics-events.ts` `trackContact()` 타입에 `'youtube'` 추가
- 접근성 속성(`aria-label`, 다국어 라벨) 유지

### Out of Scope
- **이미지 파일 업로드**: 사용자가 `public/images/`에 직접 PNG 추가 (코드만 경로 참조)
- **카카오 채널 다른 위치 이전**: 헤더/푸터 카카오 노출 강화는 별도 작업
- 헤더/푸터 SNS 링크 변경 (기존 유지)
- 모바일/데스크톱 반응형 위치 변경 (`right-2 sm:right-4 md:right-6` 유지)
- ClientSideWidgets 로더 변경

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 플로팅 CTA에 위→아래 순서로 인스타그램, 유튜브, 전화 3개 버튼만 노출된다. | P0 |
| FR-02 | 인스타그램 버튼은 `/images/인스타 버튼.png`을 사용하고 `https://www.instagram.com/livclinic_after/`를 새 탭으로 연다. | P0 |
| FR-03 | 유튜브 버튼은 `/images/유튜브-버튼.png`을 사용하고 `https://www.youtube.com/@리브성형외과`를 새 탭으로 연다. | P0 |
| FR-04 | 전화 버튼은 `tel:02-797-2773`로 연결되며 보조 스택 최하단에 위치한다. | P0 |
| FR-05 | 카카오·WhatsApp·LINE·WeChat 버튼은 플로팅 CTA에서 제거된다. | P0 |
| FR-06 | 모든 로케일(ko, en, ja, zh)에서 동일한 3개 버튼 구성이 노출된다. | P0 |
| FR-07 | 인스타그램·유튜브 버튼은 동일한 크기·스타일을 갖는다. | P0 |
| FR-08 | 각 버튼에 다국어 `aria-label`이 제공된다. | P1 |
| FR-09 | GA4 `trackContact()` 이벤트가 `instagram`/`youtube`/`phone` 채널로 발송된다. | P1 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 이미지 렌더링 성능 저하 없음 | `next/image` 사용, 크기 고정(`w-11 h-11 sm:w-12 sm:h-12`) |
| NFR-02 | 버튼 시각적 일관성 | 원형(`rounded-full`), 동일 크기, 동일 그림자(`shadow-lg`), `bg-white` |
| NFR-03 | 모바일 터치 타겟 최소 44px | `w-11 h-11` (44px) 유지 |
| NFR-04 | Framer Motion 애니메이션 일관 적용 | `initial`/`animate`/`whileHover`/`whileTap` 동일 |
| NFR-05 | 빌드 안정성 | `npm run lint` 0 errors, `npm run build` exit 0 |

---

## 5. 제약사항 (Constraints)

- **이미지 파일 의존성**: 신규 PNG는 사용자가 직접 업로드하므로, 코드 머지 시점에 파일이 없으면 깨진 이미지 표시. → 사용자에게 업로드 안내 필수.
- **한글 파일명**: `인스타 버튼.png`(공백 포함), `유튜브-버튼.png` — Next.js Image 컴포넌트가 자동 URL 인코딩 처리하므로 코드에는 한글 그대로 사용 가능. 단, 일부 정적 호스팅 환경에서 인코딩 이슈 가능성 존재.
- **카카오 채널 접근성 저하**: 메인 CTA였던 카카오를 제거 → 헤더/푸터에 카카오 링크가 충분히 노출되는지 별도 검토 필요(out of scope).
- **`SOCIAL_LINKS.youtube` 재사용**: `src/lib/constants.ts:32` 이미 `https://www.youtube.com/@리브성형외과` 정의됨. 사용자 요청 URL은 인코딩된 동일 URL. → 상수 그대로 사용.
- **선행 PDCA 상호작용**: `floating-cta-instagram`(완료)에서 만든 인스타그램 버튼은 본 작업에서 이미지 경로만 교체되며, 외형은 유지(원형 마스크 + 흰 배경).

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `/ko` 접속 시 우측 하단에 **3개 버튼**(인스타·유튜브·전화)만 노출된다 (위→아래 순서).
- [ ] 인스타그램 클릭 → 새 탭으로 `https://www.instagram.com/livclinic_after/` 열림.
- [ ] 유튜브 클릭 → 새 탭으로 `https://www.youtube.com/@리브성형외과` 열림.
- [ ] 전화 클릭 → `tel:02-797-2773` 다이얼러 호출.
- [ ] `/en`, `/ja`, `/zh` 로케일에서도 동일한 3개 버튼이 동일 순서로 노출.
- [ ] 카카오 메인 CTA(라벨·펄스 애니메이션)가 더 이상 표시되지 않는다.
- [ ] 인스타그램과 유튜브 버튼이 동일한 크기·스타일로 정렬된다.
- [ ] 모바일(≤375px) / 태블릿 / 데스크탑에서 레이아웃 깨짐 없음.
- [ ] 각 버튼에 `aria-label`이 설정되어 있다.
- [ ] `npm run lint` 통과 (0 errors), `npm run build` 통과 (exit 0).
- [ ] 브라우저 콘솔에 이미지 404나 TypeScript 에러 없음 (이미지 업로드 후 검증).

---

## 7. 예상 구조 (변경 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/components/layout/FloatingCTA.tsx` | 수정 (전면 재작성) | `ctaButtons`에서 4개 채널 제거, `youtube` 추가, `buttonOrderByLocale` 단순화, 메인/보조 분리 로직 폐지 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정 (경량) | `trackContact()` 채널 타입 union에 `'youtube'` 추가 |
| `liv-clinic/public/images/인스타 버튼.png` | **사용자 업로드** | 코드는 경로 참조만, 실제 파일은 사용자가 추가 |
| `liv-clinic/public/images/유튜브-버튼.png` | **사용자 업로드** | 동일 |

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 신규 이미지 파일 미업로드로 깨진 이미지 표시 | High | 구현 완료 후 사용자에게 업로드 안내 메시지 명시 / Plan 산출물에 명기 |
| 한글 파일명 + 공백으로 인한 일부 환경 인코딩 이슈 | Low | Next.js 자동 인코딩 처리. Vercel/Netlify에서 정상 동작 확인됨. 향후 ASCII 파일명 마이그레이션 후보로 노트 |
| 카카오 채널 유입 감소 | Medium | 헤더/푸터 카카오 링크 노출 충분성 별도 검토 (별도 이슈로 트래킹) |
| `trackContact('youtube')` GA4 이벤트 누락 | Low | analytics-events.ts에서 unknown 채널 fallback 처리 또는 이벤트 정의 추가 (Design 단계에서 결정) |
| WhatsApp/LINE 사용자 (해외) 접근성 저하 | Medium | en/ja/zh 로케일에서도 제거되므로, 해외 사용자 접근 채널 누락. → 사용자가 명시적으로 모든 로케일 동일 적용 결정 (의식적 trade-off) |

---

## 9. 다음 단계 (Next Phase)

- `/pdca design floating-cta-redesign` — `ctaButtons` 단순화 구조, 단일 렌더 루프 설계, analytics 채널 union 확장 설계
- `/pdca do floating-cta-redesign` — 컴포넌트 수정 구현 + 사용자에게 이미지 업로드 안내
- `/pdca analyze floating-cta-redesign` — 수용 기준 기반 Gap 분석 (이미지 파일 존재 여부 검증 포함)

---

## 10. 참고 자료

- 현재 구현: `liv-clinic/src/components/layout/FloatingCTA.tsx`
- 선행 PDCA: `docs/01-plan/features/floating-cta-instagram.plan.md`
- 기존 상수: `liv-clinic/src/lib/constants.ts` — `SOCIAL_LINKS.youtube` (line 32, 재사용)
- 사용자 요청 URL:
  - Instagram: <https://www.instagram.com/livclinic_after/>
  - YouTube: <https://www.youtube.com/@리브성형외과>
- 시스템 Plan 파일: `C:\Users\1\.claude\plans\plan-cozy-pnueli.md`
