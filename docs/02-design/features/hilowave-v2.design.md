# HILO WAVE v2 — 설계 (Design)

> **Feature**: `hilowave-v2`
> **Phase**: Design
> **Plan**: `docs/01-plan/features/hilowave-v2.plan.md`
> **Selected Architecture**: **Option C — Page-local (skincare 패턴 그대로)**

---

## Context Anchor
| 항목 | 내용 |
|------|------|
| **WHY** | 통이미지 vs 컴포넌트 형식 비교·의견 수렴 |
| **WHO** | 내부 의사결정자 + 잠재 고객 |
| **RISK** | 11개 자동번역 품질 / 크롭 사진 / 디자인 완성도 / 메뉴 공존 |
| **SUCCESS** | hilowave-v2 8~9섹션 렌더, 기존 hilowave 무손상, 11로케일, 빌드 0에러 |
| **SCOPE** | 신규 라우트 + 11로케일 콘텐츠 + 크롭 자산 + 메뉴 1항목 |

---

## 1. 아키텍처 결정

3안 비교 후 **C 채택**:
- **A 단일 인라인**: page.tsx 한 파일에 콘텐츠 하드코딩 — i18n 불가, 탈락
- **B 공유 컴포넌트(`HilowaveDetailV2.tsx`)**: 재사용 대비 과설계(1회 비교용), 탈락
- **C Page-local (채택)**: `antiaging/skincare/page.tsx`와 **동일 패턴** — `'use client'` page.tsx가 `useTranslations('treatments')`로 `antiaging.hilowave.detail.*`를 읽어 8섹션 렌더 + `layout.tsx` SEO. 기존 컨벤션 100% 일치, 빠르고 일관적.

근거: 기존 안티에이징 상세는 전부 page-local 인라인(skincare)이거나 섹션 컴포넌트(SkinboosterDetail). 비교 목적엔 검증된 skincare 구조 복제가 최단·최일관.

---

## 2. 컴포넌트 구조 (skincare 미러)

```
antiaging/hilowave-v2/
├── page.tsx     'use client' — colors 토큰 + Icons(SVG) + getIcon + 8섹션 렌더
└── layout.tsx   generatePageMetadata + WebPage/Breadcrumb 스키마
```

**섹션 매핑 (skincare 섹션 ↔ hilowave-v2)**
| skincare 섹션 | hilowave-v2 | 비주얼 |
|---------------|-------------|--------|
| Hero | S1 히어로 | 크롭 모델/제품 이미지 + 텍스트 (priority) |
| Programs(카드) | S2 증상 3카드 | SVG 아이콘 카드 |
| (신규) | S3 원리 "힐로웨이브란" | 피부 단면도 크롭 + 3포인트(Skin Density/Elastic Flow/Natural Volume) |
| Equipment/Differentiators | S7 차별점 | SVG 아이콘 3 (Personalized Design/Natural Tightening/Premium Care) |
| Ideal For | S4 추천대상 | 체크 리스트 4 |
| Programs/가격 | S6 프로그램 | 가격 카드 2 (2cc 53.9만 / 4cc 88만) |
| (신규) | S5 무드 | 크롭 무드컷 (선택, 1~3컷) |
| (신규) | S8 의료진 | 김수영·천신혜 크롭 포트레이트 |
| (신규) | S9 공간 + CTA | 공간 크롭 + 상담/전화 CTA |

- 색상 토큰: skincare와 동일 (`#D4A5A5 / #8B7B8B / #F5E6E8 / #3A3A3A / #FDF8F8`)
- 모션: `motion` + `whileInView viewport={{once:true}}` (프로젝트 컨벤션)

---

## 3. i18n 키 구조

`messages/*.json` → `treatments.antiaging.hilowave.detail`:
```
heroBadge, heroTitle, heroDesc
symptoms{ title, subtitle, items[3]{title,desc} }
about{ title, body, points[3]{en, ko} }
differentiators{ title, items[3]{en, ko} }
idealFor{ title, subtitle, items[4] }
program{ title, items[2]{name, desc, price}, note }
mood{ badge, title }
doctors{ badge, title, subtitle, items[2]{name, role, desc} }
experience{ badge, title, caption }
cta{ title, description, button }
```
- 영문 고유명(HILO WAVE, Skin Density, Personalized Design, 가격 숫자, 의사명)은 전 로케일 공통(비번역).
- nav 라벨: `nav.hilowaveV2 = "HILO WAVE (v2)"` (전 로케일 공통).
- 11개 로케일 전부 동일 키 구조 생성(verify:i18n 통과 필수). 값은 ko 원문 + 10개 자동번역.

---

## 4. 자산 크롭 전략

`public/images/antiaging/hilowave-v2/`에 원본 9장에서 크롭:
| 파일 | 출처 | 영역 |
|------|------|------|
| hero.jpg | hilowave-1 | 우측 모델+제품 |
| diagram.jpg | hilowave-3 | 우측 피부 단면도 |
| doctor-1.jpg / doctor-2.jpg | hilowave-8 | 각 포트레이트 |
| space.jpg | hilowave-9 | 메인 공간컷 |
| mood.jpg | hilowave-5 | 중앙 모델 (선택) |
- 크림 배경 포함 허용(팔레트와 조화). 크롭 부적합 섹션은 SVG 아이콘/그라데이션 대체.
- 카드형 섹션(S2/S4/S7)은 사진 없이 SVG 아이콘(skincare 방식).

---

## 5. Test Plan
| Lv | 항목 | 기대 |
|----|------|------|
| L1 | `/ko/antiaging/hilowave-v2` 200 | OK |
| L1 | 기존 `/ko/antiaging/hilowave` 200 유지 | OK |
| L2 | 8~9섹션 렌더, 가격 표기 | 일치 |
| L2 | 메뉴 "HILO WAVE (v2)" 노출·이동 | 정상 |
| L2 | 가로 스크롤 0 (375/1440) | true |
| - | `npm run build` + verify:i18n | 0 에러 |

---

## 6. 구현 순서 (Do)
1. 자산 크롭 (Python/PIL) → `public/images/antiaging/hilowave-v2/`
2. ko 콘텐츠 작성 + 10개 자동번역 → 11개 messages에 `treatments.antiaging.hilowave.detail` + `nav.hilowaveV2` 삽입 (Python 스크립트)
3. `layout.tsx` (SEO)
4. `page.tsx` (skincare 미러, 8섹션)
5. `Header.tsx` navItems에 hilowave-v2 추가
6. `npm run build` + dev 육안

---

**다음 단계**: `/pdca do hilowave-v2`
