# Design: /zh 페이지 한국어·영어 혼용 제거

> Feature: zh-i18n-fix
> Created: 2026-04-15
> Related Plan: `docs/01-plan/features/zh-i18n-fix.plan.md`

---

## 1. 아키텍처

```
┌────────────────────────────────────────────────────────┐
│ src/messages/{ko,en,zh,ja}.json   (공통 UI 번역)         │
│   - common.slogan                                      │
│   - sections.certification.{visitSite, officialPartner}│
│   - sections.location.{markerTitle, infoWindowSubway,  │
│                        mapLoading, mapError}           │
│   - aboutPage.locationPage.{heroTitle, heroDescription,│
│                             addressLabel, phoneLabel,  │
│                             buildingDetail, sectionLabel}│
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│ src/lib/treatmentsI18n.ts   (TREATMENTS override)        │
│   - TreatmentL10n interface                            │
│   - ZH/EN/JA LocaleMap (ko는 비어있음 = constants 사용)   │
│   - getLocalizedTreatment(base, id, locale) → merge    │
│   - getRelatedTreatmentLabel(id, locale) → {name,desc} │
└────────────────────┬───────────────────────────────────┘
                     │
      ┌──────────────┴────────────────┐
      ▼                               ▼
┌──────────────────────┐   ┌──────────────────────────────┐
│ NaverMap.tsx         │   │ *Detail.tsx (상세 컴포넌트 8)   │
│  useTranslations     │   │  const locale = useLocale()  │
│  textContent(escaped)│   │  const treatment =           │
│                      │   │    getLocalizedTreatment(...)│
└──────────────────────┘   └──────────────────────────────┘
```

---

## 2. 데이터 모델

### 2-1. `TreatmentL10n` 인터페이스
```ts
interface TreatmentL10n {
  tagline?: string;
  shortDesc?: string;
  targetAreas?: readonly string[];
  idealFor?: readonly string[];
  cautions?: readonly string[];
  duration?: string;
  anesthesia?: string;
  recovery?: string;
  results?: string;
  process?: readonly ProcessStep[];
  faqs?: readonly FAQ[];
}
```

### 2-2. Merge 규칙
```ts
function getLocalizedTreatment<T extends TreatmentL10n>(
  base: T,              // constants.ts Korean base
  treatmentId: string,  // 'ulthera' | 'thermage' | ...
  locale: string,       // 'ko' | 'en' | 'zh' | 'ja'
): T & TreatmentL10n {
  const override = MAPS[locale]?.[treatmentId];
  if (!override) return base;
  return { ...base, ...override };
}
```

- `ko` locale: MAPS['ko']가 `{}`이므로 항상 base 반환 → 기존 동작 유지
- `zh` locale: ulthera/thermage/density/inmode/shurink/thread/botox/filler/skinbooster 전부 override
- `en`/`ja`: ulthera/thermage만 override, 나머지 base fallback

---

## 3. 번역 키 구조

### 3-1. zh.json 신규·변경 키
```
common.slogan                                  → "慢老化，自然之美"
sections.certification.officialPartner         → "官方认证"
sections.certification.visitSite               → "访问官方网站"
sections.certification.ulthera                 → "超声刀Prime 正品认证"
sections.certification.ultheraEn               → "超声刀Prime 正品认证"
sections.certification.thermage                → "热玛吉FLX 合作伙伴"
sections.certification.thermageEn              → "热玛吉FLX 合作伙伴"
sections.location.markerTitle                  → "LIV整形外科"
sections.location.infoWindowSubway             → "新沙站4号出口步行1分钟"
sections.location.mapLoading                   → "地图加载中..."
sections.location.mapError                     → "无法加载地图"
sections.location.address                      → "首尔市瑞草区纳鲁特路80号 自恩大厦4层"
aboutPage.certifications.subtitle              → "官方认证"
aboutPage.locationPage.sectionLabel            → "交通指南"
aboutPage.locationPage.heroTitle               → "如何到达"
aboutPage.locationPage.heroDescription         → "新沙站4号出口步行1分钟，交通便捷的LIV整形外科。"
aboutPage.locationPage.addressLabel            → "地址"
aboutPage.locationPage.buildingDetail          → "自恩大厦4层"
aboutPage.locationPage.phoneLabel              → "电话号码"
treatments.lifting.ulthera.detail.hero.premiumLifting      → "高端提升"
treatments.lifting.ulthera.detail.clinicalEvidence.label   → "临床证据"
treatments.lifting.ulthera.detail.treatmentInfo.labelEn    → "治疗信息"
treatments.lifting.ulthera.detail.related.labelEn          → "相关治疗"
treatments.lifting.{thermage,density,inmode,shurink}.detail.treatmentInfo.sectionLabel → "治疗信息"
treatments.lifting.thermage.detail.related.sectionLabel    → "相关推荐治疗"
```

### 3-2. ko/en/ja.json 동일 키 구조 with locale-appropriate 값
- `ko`: `officialPartner: "공식 인증"`, `visitSite: "공식 사이트 방문"` 등
- `en`: `officialPartner: "Certifications"`, `visitSite: "Visit Official Site"` 등
- `ja`: `officialPartner: "公式認証"`, `visitSite: "公式サイトを訪問"` 등

---

## 4. 컴포넌트 변경

### 4-1. `NaverMap.tsx`
```ts
// Before
markerTitle = '리브성형외과'  // hardcoded default
content: '<div>...리브성형외과...신사역 4번 출구 도보 1분...</div>'  // hardcoded HTML

// After
const t = useTranslations('sections.location');
const resolvedMarkerTitle = markerTitle ?? t('markerTitle');
const resolvedInfoWindowText = infoWindowText ?? t('infoWindowSubway');

// XSS-safe injection
const safeTitle = escapeHtml(resolvedMarkerTitle);
const safeText = escapeHtml(resolvedInfoWindowText);
content: `<div>...${safeTitle}...${safeText}...</div>`
```

### 4-2. 상세 컴포넌트 (Ulthera/Thermage/Shurink/Thread/InMode/Density)
```ts
// Before
const treatment = TREATMENTS.lifting.ulthera;

// After
const locale = useLocale();
const treatment = getLocalizedTreatment(TREATMENTS.lifting.ulthera, 'ulthera', locale);

// Related Treatments 카드
const l10n = getRelatedTreatmentLabel(relatedId, locale);
<h3>{l10n?.name ?? related.name}</h3>
<p>{l10n?.desc ?? related.shortDesc}</p>
```

### 4-3. `about/location/page.tsx`
```tsx
const tLoc = useTranslations('aboutPage.locationPage');
<h1>{tLoc('heroTitle')}</h1>
<p>{tLoc('heroDescription')}</p>
<h3>{tLoc('addressLabel')}</h3>
<p>{t('sections.location.address')}</p>
<p>{tLoc('buildingDetail')}</p>
<h3>{tLoc('phoneLabel')}</h3>
```

---

## 5. 예외 처리 / 회귀 방지

- **ShurinkDetail.tsx / ThreadDetail.tsx**: 모듈 스코프 `const treatment = TREATMENTS.lifting.X;` 선언을 컴포넌트 내부로 이동 (`useLocale` 사용 가능하게).
- **BotoxDetail/FillerDetail/SkinboosterDetail**: 이미 `useTranslations('treatments')`만 사용 → 컴포넌트 변경 없음, zh.json 키만 확보되면 동작.
- **ko 회귀**: `MAPS['ko'] = {}`이므로 `getLocalizedTreatment`가 base를 그대로 반환 → 기존 한국어 경로 불변.
- **미지원 locale fallback**: `MAPS[locale] ?? {}`로 undefined 방어.

---

## 6. 테스트 계획

1. `npx tsc --noEmit` → 0 errors 확인
2. `npx next build` → ✓ Compiled successfully 확인
3. `PYTHONIOENCODING=utf-8 python -c "...[\uAC00-\uD7AF]..."` → zh.json 내 한글 0건
4. 수동 브라우저 확인 (`/zh` main, `/zh/lifting/ulthera`, `/zh/lifting/thermage`, `/zh/about/location`)
5. `/ko` 회귀 확인
