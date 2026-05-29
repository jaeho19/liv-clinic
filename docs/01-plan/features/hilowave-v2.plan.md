# HILO WAVE v2 — 풀 컴포넌트 상세페이지 (비교용)

> **Feature**: `hilowave-v2`
> **Phase**: Plan
> **Created**: 2026-05-29
> **Route**: `/[locale]/antiaging/hilowave-v2`
> **관계**: 기존 통이미지 `hilowave`는 **그대로 유지**. 본 건은 비교/의견수렴용 별도 버전.

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 통이미지 `hilowave`는 다른 안티에이징 페이지(보톡스/필러/스킨부스터/스킨케어)와 형식이 달라 일관성이 없다. 어떤 형식이 나은지 내부 의견 수렴이 필요하다. |
| **Solution** | 통이미지에서 추출한 콘텐츠로 skincare와 **동일한 8섹션 컴포넌트 구조**의 `hilowave-v2` 페이지를 추가 생성. 기존 통이미지 버전과 나란히 비교 가능하게 한다. |
| **Function·UX** | 히어로/증상3카드/원리+다이어그램/추천대상/무드/프로그램가격/차별점/의료진/공간 섹션, framer-motion, 11개 로케일 자동 번역. 안티에이징 드롭다운에 "HILO WAVE (v2)" 임시 노출. |
| **Core Value** | A/B 비교로 "통이미지 vs 컴포넌트" 의사결정 근거 제공. 기존 컨벤션(번역키·아이콘·카드·모션) 100% 재사용. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 통이미지 vs 컴포넌트 형식 중 무엇이 나은지 비교·의견 수렴 |
| **WHO** | 내부 의사결정자(원장/마케팅) + 잠재 고객(최종 채택 시) |
| **RISK** | ① 11개 자동번역 품질 ② 통이미지 디자인 완성도를 DOM이 못 따라갈 수 있음 ③ 원본에서 크롭한 사진의 배경/품질 ④ 두 버전 메뉴 공존 혼란 |
| **SUCCESS** | `/ko/antiaging/hilowave-v2`가 skincare 톤의 8섹션으로 렌더, 11개 로케일 노출, 기존 `hilowave`는 무손상 유지 |
| **SCOPE** | 신규 라우트 1개(page+layout) + 콘텐츠(11로케일) + 자산 크롭 + 메뉴 1항목. 기존 hilowave/타 페이지 변경 없음 |

---

## 1. 배경

사용자 결정사항(확정):
- 기존 통이미지 `hilowave`는 **유지**
- 풀 전환(A) 버전을 **별도 라우트 `/antiaging/hilowave-v2`** 로 추가
- 다국어: **11개 자동 번역**
- 메뉴: 안티에이징 드롭다운에 **"HILO WAVE (v2)" 임시 노출**

기준 페이지: `src/components/sections/SkinboosterDetail.tsx` 및 `antiaging/skincare/page.tsx` (동일 섹션 패턴).

---

## 2. 추출 콘텐츠 (이미지 → 섹션 매핑)

> 9장 이미지 판독 결과(한국어 원문). 11개 로케일은 이를 자동 번역.

### S1. 히어로 (img1)
- Badge: `HILO WAVE`
- Title: **피부 깊숙이 차오르는 탄력의 흐름**
- Desc: 피부 속부터 차오르는 탄력감과 시간이 지나도 자연스러운 얼굴선을 완성합니다.
- CTA: 상담 예약(`/contact`), 카카오 상담(`https://pf.kakao.com/_hgFwn`, 새탭)

### S2. 증상 3카드 — "지금 이런 변화가 느껴지시나요?" (img2)
- Sub: 피부 속부터 시작되는 섬세한 변화로, 자신감을 되찾아보세요.
- 01 탄력이 떨어진 느낌 / 처진 피부와 무너진 볼륨이 고민이신가요?
- 02 볼륨이 부족한 얼굴 / 꺼진 볼륨과 입체감 저하로 나이 들어 보이시나요?
- 03 피부결이 거칠어진 느낌 / 거칠어진 피부결과 건조함이 신경 쓰이시나요?

### S3. 원리 — "힐로웨이브란" (img3)
- Body: 고·저분자 Dual-HA가 피부 깊숙이 자연스럽게 퍼져 탄력과 밀도를 채우고 건강한 변화를 만들어냅니다.
- 3 포인트: **Skin Density**(피부 밀도 개선) / **Elastic Flow**(탄력·윤곽 개선) / **Natural Volume**(자연스러운 볼륨)
- 비주얼: 피부 단면 다이어그램 (Epidermis/Dermis/Subcutaneous)

### S4. 추천대상 — "이런 분께 추천합니다" (img4)
- Sub: 힐로웨이브는 자연스러운 변화를 원하는 분들에게 특히 만족도가 높습니다.
- 자연스러운 리프팅을 원하는 분 / 인위적인 변화가 부담스러운 분 / 피부결과 탄력을 함께 개선하고 싶은 분 / 시간이 지날수록 자연스러운 변화를 원하는 분

### S5. 무드 — "자연스러운 변화의 무드" (img5)
- Badge: 힐로웨이브가 만드는 / Title: 자연스러운 변화의 무드
- 무드 3컷 (모델 비주얼 중심, 캡션 최소)

### S6. 프로그램/가격 — "HILO WAVE PROGRAM" (img6)
- Title: 시간이 지날수록 차오르는 변화를 경험해보세요.
- **HILO WAVE 2cc** — 피부 속 밀도와 자연스러운 탄력을 위한 프리미엄 안티에이징 프로그램 — **53만 9천원**
- **HILO WAVE 4cc** — 보다 깊은 볼륨과 탄력 개선을 위한 집중 프로그램 — **88만원**
- Footer: 프로그램 구성은 개인별 피부 상태에 따라 달라질 수 있습니다.

### S7. 차별점 — "과하지 않게, 하지만 확실하게" (img7)
- **Personalized Design** / **Natural Tightening** / **Premium Care**

### S8. 의료진 — "LIV DOCTOR" (img8)
- Title: 자연스러운 변화의 균형을 섬세하게 디자인합니다.
- 김수영 대표원장 — 안티에이징과 리프팅을 중심으로 개개인의 얼굴 흐름에 맞춘 자연스러운 변화를 지향
- 천신혜 대표원장 — 피부와 얼굴의 흐름을 고려하여 시간이 지나도 자연스러운 안티에이징을 지향

### S9. 공간 — "LIV EXPERIENCE" (img9) + CTA
- Title: 편안함과 프라이빗함까지 LIV만의 프리미엄 경험을 완성합니다.
- 하단 CTA: 상담 예약 / 전화

---

## 3. 자산(이미지) 전략

DOM 섹션에 쓸 사진은 **원본 9장에서 크롭**(별도 촬영 없음):
| 용도 | 출처 | 비고 |
|------|------|------|
| 히어로 제품컷 | img1 우하단 보틀 | 누끼/크롭 |
| 피부 단면도 | img3 우측 다이어그램 | 크롭 |
| 모델컷 | img4 좌측 모델 | 크롭 |
| 눈 클로즈업 | img7 | 크롭 |
| 의료진 2명 | img8 | 각각 크롭 (또는 기존 staff 사진 재사용 검토) |
| 공간 컷 | img9 | 메인+무드 크롭 |
| 무드 3컷 | img5 | 크롭 |
- 카드/아이콘/뱃지/구분선은 skincare처럼 **SVG 아이콘 + Tailwind 토큰**으로 DOM 구현.
- ⚠️ 크롭 사진은 크림색 배경이 포함될 수 있음 → 섹션 배경(#FDF8F8 등)과 톤 맞춤. Design에서 확정.

---

## 4. 다국어 (11 로케일 자동 번역)

- 대상: ko(원문) + en, ja, zh, zh-TW, vi, th, ru, mn, fr, ar
- 위치: `messages/*.json` → `treatments.antiaging.hilowave.detail.*` (skincare 키 구조 그대로 복제)
- 영문 고유명(HILO WAVE, Skin Density 등)은 비번역 유지
- ⚠️ 의료 표현 자동번역 품질은 검수 필요(특히 ar RTL, 의료광고 표현)

---

## 5. Success Criteria

- [ ] **SC1** `/ko/antiaging/hilowave-v2` 8~9섹션 렌더(skincare 톤)
- [ ] **SC2** 기존 `/antiaging/hilowave` 통이미지 페이지 **무손상 유지**
- [ ] **SC3** 안티에이징 드롭다운/모바일에 "HILO WAVE (v2)" 노출·이동
- [ ] **SC4** 11개 로케일 모두 본문 노출(누락 키 0, 빌드 에러 0)
- [ ] **SC5** 가격(2cc 53.9만 / 4cc 88만) 정확 표기
- [ ] **SC6** 모바일/PC 반응형, 가로 스크롤 0
- [ ] **SC7** `npm run build` 0 에러 / `verify:i18n` 통과
- [ ] **SC8** framer-motion 스크롤 애니메이션 동작

---

## 6. 리스크 & 제약

| 리스크 | 대응 |
|--------|------|
| 11개 자동번역 품질 | 1차 자동번역 후 ko/en 우선 검수, 나머지 베스트에포트(비교용 단계) |
| 크롭 사진 배경/화질 | 섹션 배경 톤 매칭, 필요한 부분만 크롭. 부적합 시 아이콘/그라데이션 대체 |
| 디자인 완성도 | skincare 검증된 레이아웃 재사용으로 최소 품질 보장 |
| 두 버전 공존 혼란 | 메뉴 라벨 "(v2)" 명시, 비교 종료 후 한쪽 제거 예정 |
| verify:i18n 마스터 키 동기화 | ko에 추가한 키를 11개 전부에 동일 구조로 생성 |

---

## 7. 변경/생성 파일 (예상)

**생성**
- `src/app/[locale]/antiaging/hilowave-v2/page.tsx`
- `src/app/[locale]/antiaging/hilowave-v2/layout.tsx`
- `liv-clinic/public/images/antiaging/hilowave-v2/*`（크롭 자산）

**수정**
- `src/components/layout/Header.tsx` (navItems에 hilowave-v2 1줄)
- `src/messages/*.json` ×11 (nav.hilowaveV2 라벨 + treatments.antiaging.hilowave.detail.*)
- (선택) `src/lib/constants.ts` TREATMENTS에 hilowave 항목 — 스키마/시술정보 필요 시

---

## 8. Out of Scope

- 기존 통이미지 `hilowave` 수정/삭제
- 실제 신규 촬영·디자인 (원본 크롭만)
- 전문 번역 (이번엔 자동번역, 채택 확정 시 검수 별도)
- 메뉴 영구화 (비교 단계 임시)

---

**다음 단계**: `/pdca design hilowave-v2` — 컴포넌트 구조(공유 컴포넌트화 vs 페이지 단독) + 자산 크롭 방식 확정
