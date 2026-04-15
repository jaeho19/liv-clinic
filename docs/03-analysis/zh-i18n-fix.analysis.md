# Gap Analysis: zh-i18n-fix

> Analyzed: 2026-04-15
> Plan: `docs/01-plan/features/zh-i18n-fix.plan.md`
> Design: `docs/02-design/features/zh-i18n-fix.design.md`
> Implementation root: `liv-clinic/src`

## Summary

| Metric | Value |
|---|---|
| **Match Rate** | **100%** |
| **Total Design Items** | 28 |
| **Matched** | 28 |
| **Partial** | 0 |
| **Missing** | 0 |

모든 Plan/Design 항목이 구현에 반영됨. 범위 외 항목은 Plan §2에서 명시적으로 제외.

---

## Detailed Findings

### §2-1/2-2. `TreatmentL10n` interface + `MAPS` 구조

- `src/lib/treatmentsI18n.ts:16-28` — 11개 필드(`tagline`, `shortDesc`, `targetAreas`, `idealFor`, `cautions`, `duration`, `anesthesia`, `recovery`, `results`, `process`, `faqs`) 모두 존재. **MATCH**
- `src/lib/treatmentsI18n.ts:584-589` — `MAPS`의 `ko: {}` 설계대로. **MATCH**
- `Locale` 타입: `'ko' | 'en' | 'zh' | 'ja'`. **MATCH**

**ZH 커버리지 (9 treatments 전부)**: ulthera(36), thermage(81), density(126), inmode(162), shurink(199), thread(236), botox(273), filler(316), skinbooster(359). **MATCH**
**EN/JA 커버리지 (ulthera+thermage)**: EN 406/449, JA 496/539. **MATCH**

### §3-1. zh.json 신규/변경 키 (22개)

| 키 | 위치 | 값 | 상태 |
|---|---|---|---|
| `common.slogan` | zh.json:6 | `"慢老化，自然之美"` | ✅ |
| `sections.certification.officialPartner` | zh.json:111 | `"官方认证"` | ✅ |
| `sections.certification.visitSite` | zh.json:112 | `"访问官方网站"` | ✅ |
| `sections.certification.ulthera`/`ultheraEn` | zh.json:113-114 | `"超声刀Prime 正品认证"` | ✅ |
| `sections.certification.thermage`/`thermageEn` | zh.json:116-117 | `"热玛吉FLX 合作伙伴"` | ✅ |
| `sections.location.markerTitle` | zh.json:363 | `"LIV整形外科"` | ✅ |
| `sections.location.infoWindowSubway` | zh.json:364 | `"新沙站4号出口步行1分钟"` | ✅ |
| `sections.location.mapLoading` | zh.json:365 | `"地图加载中..."` | ✅ |
| `sections.location.mapError` | zh.json:366 | `"无法加载地图"` | ✅ |
| `aboutPage.locationPage.sectionLabel` | zh.json:3689 | `"交通指南"` | ✅ |
| `aboutPage.locationPage.heroTitle` | zh.json:3690 | `"如何到达"` | ✅ |
| `aboutPage.locationPage.heroDescription` | zh.json:3691 | `"新沙站4号出口步行1分钟，交通便捷的LIV整形外科。"` | ✅ |
| `aboutPage.locationPage.addressLabel` | zh.json:3692 | `"地址"` | ✅ |
| `aboutPage.locationPage.buildingDetail` | zh.json:3693 | `"自恩大厦4层"` | ✅ |
| `aboutPage.locationPage.phoneLabel` | zh.json:3694 | `"电话号码"` | ✅ |
| Ulthera `hero.premiumLifting` | zh.json:596 | `"高端提升"` | ✅ |
| Ulthera `treatmentInfo.labelEn` | zh.json:679 | `"治疗信息"` | ✅ |
| Ulthera `related.labelEn` | zh.json:727 | `"相关治疗"` | ✅ |
| Thermage `treatmentInfo.sectionLabel` | zh.json:902 | `"治疗信息"` | ✅ |
| Density `treatmentInfo.sectionLabel` | zh.json:1121 | `"治疗信息"` | ✅ |
| InMode `treatmentInfo.sectionLabel` | zh.json:1282 | `"治疗信息"` | ✅ |
| Thermage `related.sectionLabel` | zh.json:947 | `"相关推荐治疗"` | ✅ |

### §3-2. ko/en/ja.json parity — 모두 동일 구조로 추가됨

- `officialPartner`/`visitSite`: 4개 locale 모두 111-112 근방에 locale-appropriate 값
- `markerTitle`/`infoWindowSubway`/`mapLoading`/`mapError`: 4개 locale 모두 363-368 근방
- `aboutPage.locationPage.*`: 4개 locale 모두 3688-3694 근방
- Ulthera detail keys: 4개 locale 모두 동일 path에 값 존재. **MATCH**

### §4-1. NaverMap.tsx 번역 + XSS escape

- `useTranslations('sections.location')` at `NaverMap.tsx:40`. ✅
- `escapeHtml()` utility at `NaverMap.tsx:23-30`. ✅
- `resolvedMarkerTitle`/`resolvedInfoWindowText` fallback via `??` at `NaverMap.tsx:41-42`. ✅
- InfoWindow content with `safeTitle`/`safeText` injection at `NaverMap.tsx:86`. ✅
- `t('mapError')` at `NaverMap.tsx:221`, `t('mapLoading')` at `NaverMap.tsx:239`. ✅

### §4-2. 6 lifting detail components

| File | Import | useLocale | getLocalizedTreatment | getRelatedTreatmentLabel |
|---|---|---|---|---|
| `UltheraDetail.tsx` | L5 | L499 | L500 | L1572 |
| `ThermageDetail.tsx` | L4 | L490 | L491 | L1348 |
| `DensityDetail.tsx` | L9 | L450 | L451 | L1208 |
| `InModeDetail.tsx` | L9 | L310 | L311 | L1006 |
| `ShurinkDetail.tsx` | L10 | L428 | L429 | (N/A — Related 섹션 없음) |
| `ThreadDetail.tsx` | L10 | L740 | L741 | (N/A — Related 섹션 없음) |

모두 **MATCH**.

### §4-3. about/location/page.tsx

- `const tLoc = useTranslations('aboutPage.locationPage')` at L50. ✅
- H1: `{tLoc('heroTitle')}` at L60 (한국어 하드코딩 없음). ✅
- Description: `{tLoc('heroDescription')}` at L62. ✅
- Address label: `{tLoc('addressLabel')}` at L99. ✅
- Address value: `{t('sections.location.address')}` at L100. ✅
- Building detail: `{tLoc('buildingDetail')}` at L101. ✅
- Phone label: `{tLoc('phoneLabel')}` at L115. ✅
- Section label: `{tLoc('sectionLabel')}` at L59. ✅

### §4/§5. Certification.tsx / Location.tsx / contact/page.tsx

- `Certification.tsx:73` → `t('officialPartner')`. ✅
- `Certification.tsx:112` → `t('visitSite')`. ✅
- `Location.tsx`: `markerTitle|리브성형외과` 검색 0 matches. ✅
- `contact/page.tsx`: `markerTitle|리브성형외과` 검색 0 matches. ✅

### §5. Botox/Filler/Skinbooster Detail 미수정

설계대로 `useTranslations('treatments')`만 사용 → `TREATMENTS|getLocalizedTreatment|useLocale` 검색 0 matches. **MATCH**.

### §5. ko regression guard

`MAPS['ko'] = {}` + `getLocalizedTreatment` short-circuit → `/ko` 경로는 `constants.ts` 데이터 그대로 반환. **MATCH**.

### Hangul leak check

`rg "[\uAC00-\uD7AF]" src/messages/zh.json` → **0 matches**. ✅

---

## Gaps Found

**없음**. 28/28 설계 항목 모두 구현됨.

---

## Observations (informational, not gaps)

1. **`buildingDetail` 키 중복**: `sections.location.buildingDetail`(zh.json:353)과 `aboutPage.locationPage.buildingDetail`(zh.json:3693)가 서로 다른 번역 사용. `about/location/page.tsx`는 후자를 사용하므로 설계 목적은 달성. 향후 통일 시 참고.
2. **Out-of-scope 한국어 잔존**: `about/location/page.tsx`의 Transportation/Parking/CTA/Quick Links 섹션에 하드코딩된 한국어 다수(L155, L167, L180, L193, L206, L221-222, L266-313, L331/346/361). **Plan §2 "제외" 명시**로 본 PR 범위 외. 다음 스프린트 백로그 후보.

---

## Verification Commands

```bash
# Export confirmation
rg "^export (function|const) (getLocalizedTreatment|getRelatedTreatmentLabel)" src/lib/treatmentsI18n.ts
# → 2 matches (lines 595, 628)

# ZH coverage
rg "^  (ulthera|thermage|density|inmode|shurink|thread|botox|filler|skinbooster):" src/lib/treatmentsI18n.ts
# → 9 treatments in ZH, 2 in EN, 2 in JA

# Component wiring
rg "(getLocalizedTreatment|getRelatedTreatmentLabel|useLocale)" src/components/sections
# → 6 lifting Detail components wired

# Certification hardcode removal
rg "(visitSite|officialPartner)" src/components/sections/Certification.tsx
# → 2 matches (lines 73, 112)

# NaverMap hardcode removal
rg "markerTitle|리브성형외과" src/components/sections/Location.tsx src/app/\[locale\]/contact/page.tsx
# → no matches

# zh.json key coverage
rg "(slogan|officialPartner|visitSite|markerTitle|infoWindowSubway|mapLoading|mapError|heroTitle|heroDescription|addressLabel|phoneLabel|buildingDetail|sectionLabel)" src/messages/zh.json
# → all keys present

# Hangul leak check
rg "[\uAC00-\uD7AF]" src/messages/zh.json
# → 0 matches

# Build verification
npx tsc --noEmit        # → 0 errors
npx next build          # → ✓ Compiled successfully in 4.6s
```

---

## Conclusion

**Match Rate: 100%.** 설계 28개 항목 모두 구현 완료.

- `treatmentsI18n.ts`는 설계 시그니처 그대로 2개 헬퍼 export, ZH 9 treatments 완전 커버, EN/JA ulthera+thermage, ko 회귀 가드 완비.
- `NaverMap.tsx`는 `useTranslations('sections.location')` + XSS-safe `escapeHtml`.
- 6개 리프팅 detail 컴포넌트 모두 `getLocalizedTreatment` 패턴 적용.
- `about/location/page.tsx`의 H1/리드/주소·전화 라벨/sectionLabel `tLoc` 라우팅.
- zh.json `common.slogan` 중국어, 한글 누출 0건, 설계 키 전부 올바른 값.
- `Location.tsx`와 `contact/page.tsx`에서 하드코딩 `markerTitle` 제거.
- Botox/Filler/Skinbooster 컴포넌트 설계대로 미수정.

**Match rate >= 90% → `/pdca report zh-i18n-fix` 진행 가능. Act iteration 불필요.**
