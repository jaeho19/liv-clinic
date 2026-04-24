# Plan: Floating CTA Instagram 버튼 추가

> **Feature**: `floating-cta-instagram`
> **Phase**: Plan
> **Created**: 2026-04-24
> **Owner**: jaeho19@gmail.com

---

## 1. 배경 (Background)

홈페이지 우측 하단 플로팅 CTA에는 현재 로케일별로 4개의 연락 버튼(전화/카카오톡/WeChat/LINE/WhatsApp 중 선택 노출)이 표시되고 있다. 공식 인스타그램 채널 (`@livclinic_after`) 유입을 늘리기 위해 기존 CTA 스택 **최상단**에 인스타그램 바로가기 버튼을 추가한다.

- 현재 구현: `liv-clinic/src/components/layout/FloatingCTA.tsx`
- 노출 위치: `bottom-right fixed` (모바일·데스크탑 공통)
- 기존 아이콘: 인라인 SVG + Tailwind 컬러 배경
- 신규 아이콘 자산: `public/images/insta.jpg` (3D 그라디언트 카메라 아이콘, 현재는 작업 폴더 루트에만 존재)

---

## 2. 목표 (Goals)

1. 플로팅 CTA 스택 **최상단**에 Instagram 버튼을 배치한다.
2. 버튼 클릭 시 `https://www.instagram.com/livclinic_after/` 를 **새 탭**으로 연다.
3. 제공된 `insta.jpg` 이미지를 버튼 아이콘으로 사용한다 (브랜드 공식 3D 아이콘).
4. 모든 로케일(ko / en / ja / zh)에서 동일하게 최상단에 노출한다.
5. 기존 4개 버튼(메인 + 보조 3)의 순서·디자인을 변경하지 않는다.

---

## 3. 범위 (Scope)

### In Scope
- `FloatingCTA.tsx` 버튼 정의(`ctaButtons`) 및 로케일 순서(`buttonOrderByLocale`) 수정
- `public/images/insta.jpg` 을 `liv-clinic/public/images/insta.jpg` 로 복사
- `next/image` 기반 아이콘 렌더링 (기존 SVG 버튼과 시각적 통일)
- `analytics-events.ts` `trackContact()` 타입에 `instagram` 채널 확장
- `SITE_INFO` / 상수 파일에 인스타그램 공식 URL 상수 추가 (기존 `SOCIAL_LINKS.instagram`과 구분: `livps_official` vs `livclinic_after`)
- 접근성 속성(`aria-label`, 다국어 라벨) 추가

### Out of Scope
- 헤더 / 푸터 내 인스타그램 링크 변경 (기존 `livps_official` 유지)
- 인스타그램 피드 임베드 / 최근 포스트 위젯
- QuickConsultBar, PopupManager 등 다른 위젯 수정
- 버튼 디자인 리디자인 (원형 셰이프·크기 규격은 기존 유지)

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 플로팅 CTA 스택 최상단에 Instagram 버튼이 노출된다. | P0 |
| FR-02 | 버튼 클릭 시 `https://www.instagram.com/livclinic_after/` 가 새 탭(`target="_blank"`, `rel="noopener noreferrer"`)에서 열린다. | P0 |
| FR-03 | 버튼 아이콘은 `public/images/insta.jpg` 를 사용한다. | P0 |
| FR-04 | 모든 로케일(ko, en, ja, zh)에서 동일하게 최상단에 노출된다. | P0 |
| FR-05 | 기존 메인 CTA(라벨 포함) 및 3개 보조 버튼의 순서가 유지된다. | P0 |
| FR-06 | 버튼에 다국어 `aria-label`("인스타그램" / "Instagram" / "インスタグラム" / "Instagram") 이 제공된다. | P1 |
| FR-07 | GA4 `trackContact('instagram')` 이벤트가 발송된다. | P1 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 이미지 렌더링 성능 저하 없음 | `next/image` 사용, 크기 고정(w-11/12 h-11/12) |
| NFR-02 | 기존 버튼과 시각적 일관성 | 원형(`rounded-full`), 동일 크기, 동일 그림자(`shadow-lg`) |
| NFR-03 | 모바일 터치 타겟 최소 44px | `w-11 h-11` (44px) 유지 |
| NFR-04 | Framer Motion 애니메이션 동일 적용 | `initial`/`animate`/`whileHover`/`whileTap` 일관 적용 |

---

## 5. 제약사항 (Constraints)

- **이미지 자산**: jpg 포맷이므로 배경이 투명하지 않음. 원형 마스크(`rounded-full overflow-hidden`)로 처리하여 주변 그림자와 자연스럽게 통합.
- **로케일별 버튼 순서**: 기존 `buttonOrderByLocale` 는 `[main, ...secondary]` 구조이므로, Instagram 은 `secondary` 배열의 **첫 번째** 자리(버튼 렌더 순서상 최상단)에 삽입.
- **기존 SOCIAL_LINKS 영향 금지**: 헤더·푸터 등에서 참조 중인 `SOCIAL_LINKS.instagram` 값은 변경하지 않는다 (별도 상수 또는 인라인 URL 사용).
- **단일 컴포넌트 변경**: FloatingCTA 외 수정 파일 최소화.
- **사용자 요청 URL 정확성**: `https://www.instagram.com/livclinic_after/` — 오타 없이 그대로 사용.

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] 홈(`/ko`) 접속 시 우측 하단 버튼 스택의 **최상단**에 Instagram 아이콘이 보인다.
- [ ] 아이콘 클릭 시 새 탭으로 `https://www.instagram.com/livclinic_after/` 가 열린다.
- [ ] `/en`, `/ja`, `/zh` 로케일에서도 동일하게 최상단에 노출된다.
- [ ] 기존 메인 CTA 라벨/색상/펄스 애니메이션이 그대로 유지된다.
- [ ] 모바일(≤375px) / 태블릿 / 데스크탑에서 레이아웃 깨짐 없이 정렬된다.
- [ ] 버튼에 `aria-label="Instagram"` 또는 로케일별 라벨이 설정되어 있다.
- [ ] `next build` 및 `next lint` 통과 (0 errors).
- [ ] 브라우저 콘솔에 이미지 404 또는 CLS 경고가 발생하지 않는다.

---

## 7. 예상 구조 (변경 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/public/images/insta.jpg` | 신규(복사) | 루트 `public/images/insta.jpg` → `liv-clinic/public/images/` 복사 |
| `liv-clinic/src/components/layout/FloatingCTA.tsx` | 수정 | `ctaButtons.instagram` 추가, `buttonOrderByLocale` 에 instagram 선두 삽입, 이미지 버튼 분기 렌더 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정(경량) | `trackContact` 채널 타입 `'instagram'` 추가 |

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| jpg 배경이 페이지 배경과 이질감 발생 | Medium | 원형 마스크(`overflow-hidden rounded-full`) + 필요 시 살짝 그림자 강조 |
| 버튼 5개 노출 시 모바일 세로 공간 부족 | Low | 기존 gap(1.5/2/3) 유지 시 약 220~260px, 뷰포트 하단 여유 충분 (safe-area 포함) |
| 인스타그램 계정 URL 오타 (다른 계정 연결) | High | 상수로 분리하여 단일 출처, 수용 기준에 URL 확인 포함 |
| `SOCIAL_LINKS.instagram` 와 URL 불일치로 혼동 | Medium | 플로팅 CTA 전용 상수(`INSTAGRAM_CTA_URL`)로 의도 명확화 또는 인라인 주석 |

---

## 9. 다음 단계 (Next Phase)

- `/pdca design floating-cta-instagram` — 컴포넌트 분기 렌더 로직 / 상수 구조 / 로케일 매트릭스 설계
- `/pdca do floating-cta-instagram` — 파일 복사 + 컴포넌트 수정 구현
- `/pdca analyze floating-cta-instagram` — 수용 기준 기반 Gap 분석

---

## 10. 참고 자료

- 요청 이미지: `C:\dev\LIV_homepage\public\images\insta.jpg`
- 요청 링크: <https://www.instagram.com/livclinic_after/>
- 현재 구현: `liv-clinic/src/components/layout/FloatingCTA.tsx` (156줄)
- 기존 상수: `liv-clinic/src/lib/constants.ts` — `SOCIAL_LINKS.instagram` (다른 계정이므로 재사용 지양)
