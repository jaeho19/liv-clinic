# Design: 시술 상세 데이터 다국어화 — FR/MN/AR LocaleMap

> **Feature**: `i18n-treatments-fr-mn-ar`
> **Phase**: Design
> **Created**: 2026-05-11
> **Owner**: jaeho19@gmail.com
> **Plan**: `docs/01-plan/features/i18n-treatments-fr-mn-ar.plan.md`
>
> **Plan §11 의사결정 확정 (사용자 합의 가정)**:
> 1. EN/JA LocaleMap 보완(2/9 → 9/9): **별도 PDCA `i18n-treatments-en-ja-complete`로 분리**
> 2. 파일 분할: **단일 `treatmentsI18n.ts` 유지** (locale별 섹션 헤더 명확화)
> 3. 몽골어 영어 원어 병기: **첫 등장 시 키릴 + 영어 병기**, 이후 키릴 단독
> 4. 아랍어 locale code: **`ar` 단일** (선행 PDCA 정책 승계)
> 5. 번역 검수: **LLM 1차 + 의료 용어집 강제 + 출시 후 단계적 네이티브 검수**
> 6. `RELATED_TREATMENTS_L10N`의 `laser` 항목: ZH 패턴 그대로 추가, 구조 정리는 별도 작업

---

## 0. Plan 단계 미발견 사실 (Design 단계 코드 감사 결과)

Design 단계 코드 분석에서 **Plan의 핵심 전제가 부정확**함을 발견했다. 이는 Design 산출물에 반영되어 범위 정정으로 이어진다.

### 0.1 발견 사실: 시술 상세 페이지의 **이원화된 i18n 아키텍처**

`grep -n "getLocalizedTreatment\|t('antiaging" liv-clinic/src/components/sections/*Detail.tsx` 결과:

| 시술 ID | Detail 컴포넌트 | i18n 방식 | `treatmentsI18n.ts` 의존 |
|--------|---------------|---------|------------------------|
| ulthera | UltheraDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| thermage | ThermageDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| shurink | ShurinkDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| inmode | InModeDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| density | DensityDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| thread | ThreadDetail.tsx | `getLocalizedTreatment()` | ✅ 필요 |
| **botox** | BotoxDetail.tsx | `t('antiaging.botox.detail.…')` | ❌ **불필요** |
| **filler** | FillerDetail.tsx | `t('antiaging.filler.detail.…')` | ❌ **불필요** |
| **skinbooster** | SkinboosterDetail.tsx | `t('antiaging.skinbooster.detail.…')` | ❌ **불필요** |

→ **결론**: 안티에이징 3종은 이미 선행 PDCA `i18n-fr-mn-ar`의 `messages/{fr,mn,ar}.json`을 통해 i18n이 적용된 상태. `treatmentsI18n.ts`의 antiaging override는 **현재 시점에서 dead code** (ZH가 botox/filler/skinbooster를 포함하고 있지만 실제 렌더링에 사용되지 않음).

### 0.2 Plan 범위 정정

| 항목 | Plan 표기 | 실제 (Design 정정) | 비고 |
|------|-----------|-------------------|------|
| `LocaleMap` 시술 entry 수 (필수) | 9 × 3 = 27 | **6 × 3 = 18** | lifting만 의미 있음 |
| `LocaleMap` 시술 entry 수 (옵션) | — | **9 × 3 = 27** | 향후 antiaging 통합 대비 future-proof |
| `RELATED_TREATMENTS_L10N` entries | 10 × 3 = 30 | **10 × 3 = 30** | 변경 없음 (related-cards는 9 + laser 모두 노출) |
| 검수 페이지 조합 | 27 (9 × 3) | **18 (6 × 3)** | antiaging은 선행 PDCA 회귀 검증만 |

### 0.3 본 PDCA 정정 후 핵심 결정

`treatmentsI18n.ts`의 FR/MN/AR LocaleMap에 **botox/filler/skinbooster 포함 여부**:

- **옵션 A (권장)**: **6 lifting만 포함**. dead code 추가 회피. 명확한 책임 분리(treatmentsI18n=lifting only, messages.json=antiaging) 정착.
- 옵션 B: 9개 포함 (ZH/JA 패턴 유지). 향후 antiaging Detail 컴포넌트가 `getLocalizedTreatment`로 통합될 때를 대비. 단, 현 시점은 dead code 18개 (3 시술 × 6 locale 미사용).

→ **Design 결정**: **옵션 A**. 본 PDCA 산출물은 **6 시술 × 3 locale = 18 entries**. 추후 antiaging i18n 통합 리팩터링은 별도 PDCA로 처리.

---

## 1. 아키텍처 개요 (Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│  현재 (선행 PDCA 완료 시점)                                       │
│                                                                 │
│  /[locale]/lifting/{id}        /[locale]/antiaging/{id}         │
│         │                              │                        │
│         ▼                              ▼                        │
│  UltheraDetail.tsx 등 6개      BotoxDetail.tsx 등 3개            │
│         │                              │                        │
│         ▼                              ▼                        │
│  getLocalizedTreatment(...)    useTranslations('antiaging')      │
│         │                              │                        │
│         ▼                              ▼                        │
│  treatmentsI18n.ts             messages/{locale}.json            │
│   MAPS[locale] = {…}            antiaging.botox.detail.{…}       │
│   (ZH/EN/JA만 등록,             (fr/mn/ar 포함 11개 locale       │
│    fr/mn/ar 미등록)              완료 by 선행 PDCA)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  본 PDCA 작업
┌─────────────────────────────────────────────────────────────────┐
│  본 PDCA 완료 후                                                  │
│                                                                 │
│  treatmentsI18n.ts                                              │
│   MAPS[locale]:                                                 │
│     - ko: {}                                                    │
│     - en: EN (2/9, 별도 PDCA로 보완 예정)                          │
│     - zh: ZH (9/9, 그대로)                                       │
│     - ja: JA (2/9, 별도 PDCA로 보완 예정)                          │
│     - zh-TW/vi/th/ru: {} (별도 PDCA로 보완 예정)                   │
│     - fr: FR (6/6, 신규) ◀──── 본 PDCA                          │
│     - mn: MN (6/6, 신규) ◀──── 본 PDCA                          │
│     - ar: AR (6/6, 신규) ◀──── 본 PDCA                          │
│                                                                 │
│  RELATED_TREATMENTS_L10N:                                       │
│     - zh: {…10 entries…}                                        │
│     - fr: {…10 entries…} ◀──── 본 PDCA                          │
│     - mn: {…10 entries…} ◀──── 본 PDCA                          │
│     - ar: {…10 entries…} ◀──── 본 PDCA                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 데이터 스키마 (Data Schema)

### 2.1 기존 타입 정의 (변경 없음)

```ts
// liv-clinic/src/lib/treatmentsI18n.ts:13-32
type FAQ = { q: string; shortA?: string; a: string };
type ProcessStep = { step: number; title: string; desc: string };

export interface TreatmentL10n {
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

type LocaleMap = Record<string, TreatmentL10n>;
```

### 2.2 시술별 의무 필드 (본 PDCA 산출물 기준)

ZH LocaleMap 패턴을 기준으로 **9개 필드 전체 채움 원칙**:

| 필드 | 타입 | 길이 가이드 | 비고 |
|------|------|------------|------|
| `targetAreas` | `readonly string[]` | 3~6개 항목, 항목당 1~3 단어 | 예: ["이마", "눈가", "볼"] |
| `idealFor` | `readonly string[]` | 3~5개, 항목당 1 문장 | 예: ["비수술 리프팅을 원하는 분"] |
| `cautions` | `readonly string[]` | 3~5개, 항목당 1 문장 | 예: ["임산부·수유부 시술 불가"] |
| `duration` | `string` | "N-M분" 또는 현지어 | 예: "60-90 minutes" |
| `anesthesia` | `string` | 1~2문장 | 예: "마취 크림 (30분)" |
| `recovery` | `string` | 1문장 | 예: "즉시 일상 복귀 가능" |
| `results` | `string` | 1문장, 기간·지속 명시 | 예: "3-6개월 점진적 개선, 1-2년 지속" |
| `process` | `readonly ProcessStep[]` | 5개 step (ZH 패턴) | step: 1~5, title 1~3 단어, desc 1문장 |
| `faqs` | `readonly FAQ[]` | 3개 항목 (ZH 패턴) | q 1문장, shortA ≤30자, a 1~2문장 |

`tagline`, `shortDesc`는 본 PDCA에서는 채우지 않음 (현재 ZH도 일부만 채움, 시술 상세에서 사용 안 함).

### 2.3 `RELATED_TREATMENTS_L10N` 스키마

```ts
// liv-clinic/src/lib/treatmentsI18n.ts:616
export const RELATED_TREATMENTS_L10N: Partial<Record<Locale, Record<string, { name: string; desc: string }>>>
```

본 PDCA 산출물:
```ts
fr: {
  ulthera: { name: 'Ultherapy Prime', desc: '…' },
  thermage: { name: 'Thermage FLX', desc: '…' },
  shurink: { name: 'Shurink Universe', desc: '…' },
  thread: { name: 'Lifting par fils', desc: '…' },
  inmode: { name: 'InMode', desc: '…' },
  density: { name: 'Densiti', desc: '…' },
  botox: { name: 'Botox', desc: '…' },
  filler: { name: 'Acide hyaluronique', desc: '…' },
  skinbooster: { name: 'Skinbooster', desc: '…' },
  laser: { name: 'Centre laser', desc: '…' },
},
mn: { … 10 entries 키릴 + 영어 병기 패턴 … },
ar: { … 10 entries MSA … },
```

---

## 3. 의료 전문 용어집 (Glossary)

본 PDCA 산출물의 핵심 보조 자산. **LLM 1차 번역 시 강제 참조 기준**.

### 3.1 핵심 시술 기술 용어 (15)

| ko | en | fr | mn (Cyrillic) | ar |
|----|----|----|---------------|-----|
| HIFU | HIFU | HIFU (Ultrasons focalisés de haute intensité) | HIFU (Өндөр эрчимтэй фокус ультра-авиа) | الموجات فوق الصوتية المركّزة (HIFU) |
| RF (고주파) | RF / Radiofrequency | RF (Radiofréquence) | RF (Радио давтамж) | الترددات الراديوية (RF) |
| 초음파 | Ultrasound | Ultrasons | Ультра-авиа | الموجات فوق الصوتية |
| 콜라겐 | Collagen | Collagène | Коллаген | الكولاجين |
| 엘라스틴 | Elastin | Élastine | Эластин | الإيلاستين |
| 진피층 | Dermis layer | Couche dermique | Дермисийн давхарга | طبقة الأدمة |
| SMAS | SMAS | SMAS | SMAS | طبقة SMAS |
| 마이크로니들 | Microneedle | Micro-aiguille | Микро-зүү | الإبر الدقيقة |
| 모노폴라 | Monopolar | Monopolaire | Монопляр | أحادي القطب |
| 바이폴라 | Bipolar | Bipolaire | Биполяр | ثنائي القطب |
| FDA 승인 | FDA-approved | Approuvé par la FDA | FDA-аас зөвшөөрөгдсөн | معتمد من إدارة الغذاء والدواء |
| 식약처 승인 | KFDA-approved | Approuvé par la KFDA | Солонгосын KFDA-аас зөвшөөрөгдсөн | معتمد من إدارة الغذاء والدواء الكورية |
| 진공 흡입 | Vacuum suction | Aspiration sous vide | Вакуум хүчирхэг | الشفط بالتفريغ |
| 펄스 | Pulse | Pulsation | Импульс | النبضة |
| 핸드피스 | Handpiece | Pièce à main | Гар хэрэгсэл | القطعة اليدوية |

### 3.2 시술 명칭 (12)

| ko | en | fr | mn | ar |
|----|-----|----|-----|-----|
| 울쎄라 프라임 | Ultherapy Prime | Ultherapy Prime | Ультерапи Прайм | ألثرابي برايم |
| 써마지 FLX | Thermage FLX | Thermage FLX | Термаж FLX | ثيرماج FLX |
| 슈링크 유니버스 | Shurink Universe | Shurink Universe | Шүрэнк Юниверс | شورينك يونيفرس |
| 인모드 | InMode | InMode | ИнМоуд | إن مود |
| 덴서티 | Densiti | Densiti | Денсити | دنسيتي |
| 실리프팅 | Thread lifting | Lifting par fils | Утсан лифтинг | شد الخيوط |
| 보톡스 | Botox | Botox | Ботокс | البوتوكس |
| 필러 | Filler / Hyaluronic acid | Filler / Acide hyaluronique | Филлер / Гиалуроны хүчил | الفيلر / حمض الهيالورونيك |
| 스킨부스터 | Skinbooster | Skinbooster | Скинбүүстер | سكين بوستر |
| 리프팅 | Lifting | Lifting | Лифтинг | الشد |
| 안티에이징 | Anti-aging | Anti-âge | Хөгшрөлтийн эсрэг | مكافحة الشيخوخة |
| 비수술 | Non-surgical | Non chirurgical | Мэс заслын бус | غير جراحي |

### 3.3 신체 부위 (15)

| ko | en | fr | mn | ar |
|----|-----|----|-----|-----|
| 이마 | Forehead | Front | Дух | الجبهة |
| 눈가 | Eye area / Around the eyes | Contour des yeux | Нүдний эргэн тойрон | محيط العين |
| 볼 | Cheeks | Joues | Хацар | الخدود |
| 턱선 | Jawline | Mâchoire | Эрүүний шугам | خط الفك |
| 목 | Neck | Cou | Хүзүү | الرقبة |
| 입가 | Mouth area | Contour de la bouche | Амны эргэн тойрон | محيط الفم |
| 미간 | Glabella / Between brows | Glabelle | Нүдний хоорондох | بين الحاجبين |
| 코 | Nose | Nez | Хамар | الأنف |
| 팔자주름 | Nasolabial folds | Sillons nasogéniens | Хамар амны нугарал | الخطوط الأنفية الشفوية |
| 마리오넷주름 | Marionette lines | Plis d'amertume | Тавлагч шугам | خطوط ماريونيت |
| 눈밑 | Under eyes | Cernes | Нүдний доод хэсэг | تحت العينين |
| 광대 | Cheekbones | Pommettes | Чихний өмнөх | عظمة الخد |
| 턱 끝 | Chin | Menton | Эрүү | الذقن |
| 가슴 | Décolleté / Chest | Décolleté | Цээж | الصدر |
| 손등 | Hands | Mains | Гар | اليدين |

### 3.4 시술 효과·과정 어휘 (20)

| ko | en | fr | mn | ar |
|----|-----|----|-----|-----|
| 다운타임 | Downtime | Temps d'arrêt / Sans éviction sociale | Сэргэх хугацаа | فترة النقاهة |
| 즉시 일상 복귀 | Immediate return to daily life | Reprise immédiate des activités | Тэр даруй өдөр тутмын амьдралд эргэн орох | العودة الفورية إلى الحياة اليومية |
| 마취 크림 | Topical anesthetic cream | Crème anesthésiante | Мэдээ алдуулах тос | كريم مخدر موضعي |
| 무마취 | No anesthesia | Sans anesthésie | Мэдээ алдуулалтгүй | بدون تخدير |
| 시술 시간 | Treatment duration | Durée du traitement | Эмчилгээний хугацаа | مدة الإجراء |
| 회복 기간 | Recovery period | Période de récupération | Сэргэх хугацаа | فترة التعافي |
| 효과 지속 | Result duration | Durée des résultats | Үр дүн үргэлжлэх хугацаа | مدة استمرار النتائج |
| 점진적 개선 | Gradual improvement | Amélioration progressive | Аажмаар сайжрах | تحسن تدريجي |
| 즉각적 효과 | Immediate effect | Effet immédiat | Шууд үр нөлөө | تأثير فوري |
| 콜라겐 재생 | Collagen regeneration | Régénération du collagène | Коллагены сэргэлт | تجديد الكولاجين |
| 탄력 개선 | Elasticity improvement | Amélioration de l'élasticité | Уян хатан байдлыг сайжруулах | تحسين المرونة |
| 잔주름 | Fine lines | Ridules | Жижиг үрчлээ | الخطوط الدقيقة |
| 깊은 주름 | Deep wrinkles | Rides profondes | Гүн үрчлээ | التجاعيد العميقة |
| 처짐 | Sagging | Affaissement | Уналт | الترهل |
| 볼륨 | Volume | Volume | Эзлэхүүн | الحجم |
| V라인 | V-line / V-shape | Forme en V | V хэлбэр | شكل V |
| 윤곽 | Contour | Contour | Хэлбэр | الكنتور |
| 정밀 시술 | Precision treatment | Traitement de précision | Нарийн эмчилгээ | علاج دقيق |
| 상담 | Consultation | Consultation | Зөвлөгөө | الاستشارة |
| 사후 관리 | Aftercare | Soins post-traitement | Дараах арчилгаа | الرعاية بعد العلاج |

### 3.5 금기·주의 어휘 (10)

| ko | en | fr | mn | ar |
|----|-----|----|-----|-----|
| 임산부 | Pregnant women | Femmes enceintes | Жирэмсэн эмэгтэйчүүд | الحوامل |
| 수유부 | Breastfeeding | Femmes allaitantes | Хөхүүл эх | المرضعات |
| 금속 임플란트 | Metal implants | Implants métalliques | Металл суулгац | الزرعات المعدنية |
| 심박조율기 | Pacemaker | Stimulateur cardiaque | Зүрхний хэмнэлзүүлэгч | منظم ضربات القلب |
| 부작용 | Side effect | Effet secondaire | Хажуугийн нөлөө | الآثار الجانبية |
| 일시적 | Temporary | Temporaire | Түр зуурын | مؤقت |
| 붓기 | Swelling | Œdème / Gonflement | Хавдар | التورم |
| 홍조 | Redness / Erythema | Rougeur / Érythème | Улайлт | الاحمرار |
| 멍 | Bruising | Bleus / Ecchymoses | Хөхрөлт | الكدمات |
| 알레르기 | Allergy | Allergie | Харшил | الحساسية |

**총 용어 수**: 72개 (Plan §5.2 목표 50~80 충족)

→ 산출물: `docs/02-design/glossary-fr-mn-ar.md` (별도 파일 또는 본 design.md §3 참조)

---

## 4. LocaleMap 구현 패턴

### 4.1 코드 위치 및 삽입 지점

`liv-clinic/src/lib/treatmentsI18n.ts:582` 부근, JA LocaleMap 끝 `};` 다음, `MAPS` 정의 전:

```ts
// ----- 기존 JA 끝 (line 582) -----
};

// ----- French (fr) ----- ◀──── 본 PDCA 신규
const FR: LocaleMap = {
  ulthera: { … },
  thermage: { … },
  shurink: { … },
  inmode: { … },
  density: { … },
  thread: { … },
};

// ----- Mongolian (mn, Cyrillic) ----- ◀──── 본 PDCA 신규
const MN: LocaleMap = {
  ulthera: { … },
  thermage: { … },
  shurink: { … },
  inmode: { … },
  density: { … },
  thread: { … },
};

// ----- Arabic (ar, MSA, RTL) ----- ◀──── 본 PDCA 신규
const AR: LocaleMap = {
  ulthera: { … },
  thermage: { … },
  shurink: { … },
  inmode: { … },
  density: { … },
  thread: { … },
};

const MAPS: Partial<Record<Locale, LocaleMap>> = {
  ko: {},
  en: EN,
  zh: ZH,
  ja: JA,
  'zh-TW': {},
  vi: {},
  th: {},
  ru: {},
  fr: FR,  // ◀──── 본 PDCA 추가
  mn: MN,  // ◀──── 본 PDCA 추가
  ar: AR,  // ◀──── 본 PDCA 추가
};
```

### 4.2 시술 entry 작성 패턴 (FR ulthera 예시)

ZH의 ulthera entry를 패턴으로 삼아 의료 용어집(§3) 강제 매핑:

```ts
// FR (line 36 of ZH 패턴 기준)
ulthera: {
  targetAreas: ['Front', 'Contour des yeux', 'Joues', 'Mâchoire', 'Cou'],
  idealFor: [
    'Personnes recherchant un lifting non chirurgical',
    'Personnes préoccupées par le relâchement cutané et la perte d\'élasticité',
    'Personnes recherchant un résultat naturel',
    'Personnes ne souhaitant aucun temps d\'arrêt',
  ],
  cautions: [
    'De légers gonflements ou rougeurs peuvent apparaître après le traitement',
    'Des troubles sensoriels temporaires sont possibles selon la zone',
    'Contre-indiqué pour les femmes enceintes ou allaitantes',
    'Consultation requise en cas d\'implants métalliques dans la zone traitée',
  ],
  duration: '60-90 minutes',
  anesthesia: 'Crème anesthésiante topique (30 min)',
  recovery: 'Reprise immédiate des activités quotidiennes',
  results: 'Amélioration progressive sur 3-6 mois, durée 1-2 ans',
  process: [
    { step: 1, title: 'Consultation', desc: 'Analyse de la peau et planification du traitement' },
    { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
    { step: 3, title: 'Anesthésie', desc: 'Application de crème anesthésiante pour le confort' },
    { step: 4, title: 'Traitement', desc: 'Traitement de précision guidé par DeepSEE' },
    { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
  ],
  faqs: [
    {
      q: 'Le traitement Ultherapy Prime est-il douloureux ?',
      shortA: 'Avec la crème anesthésiante, la plupart le tolèrent bien.',
      a: 'Nous appliquons une crème anesthésiante topique avant le traitement, ce qui le rend tolérable pour la plupart des patients. Une gestion supplémentaire de la douleur est disponible pour les patients sensibles.',
    },
    {
      q: 'Quand les résultats apparaissent-ils ?',
      shortA: 'Effet immédiat + amélioration progressive sur 3-6 mois.',
      a: 'Un effet de lifting immédiat est ressenti, puis une amélioration progressive sur 3-6 mois à mesure que le collagène se régénère.',
    },
    {
      q: 'Quelle est la différence entre Ultherapy Prime et Thermage ?',
      shortA: 'Ultherapy utilise les HIFU (ultrasons), Thermage utilise les RF.',
      a: 'Ultherapy Prime utilise les HIFU (ultrasons) et atteint les couches profondes de lifting. Thermage utilise les RF (radiofréquence) et améliore l\'élasticité globale. Combiner les deux produit des effets synergiques.',
    },
  ],
},
```

### 4.3 몽골어 (mn) entry 작성 정책

**원어 병기 규칙**: 시술명·기술명 첫 등장 시 키릴 + 영어 병기, 이후 키릴 단독.

```ts
ulthera: {
  targetAreas: ['Дух', 'Нүдний эргэн тойрон', 'Хацар', 'Эрүүний шугам', 'Хүзүү'],
  idealFor: [
    'Мэс заслын бус лифтинг хүсэж байгаа хүмүүс',
    'Арьс уналт, уян хатан байдал буурахад санаа зовж буй хүмүүс',
    'Байгалийн өөрчлөлт хүсэж буй хүмүүс',
    'Сэргэх хугацаа шаардахгүй эмчилгээ хүсэж буй хүмүүс',
  ],
  cautions: [
    'Эмчилгээний дараа бага зэргийн хавдар, улайлт гарч болно',
    'Эмчилгээний хэсгээс хамаарч түр зуурын мэдрэхүйн өөрчлөлт гарч болно',
    'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
    'Эмчилгээний хэсэгт металл суулгац байгаа тохиолдолд зөвлөгөө шаардлагатай',
  ],
  duration: '60-90 минут',
  anesthesia: 'Мэдээ алдуулах тос (30 минут)',
  recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
  results: '3-6 сарын турш аажмаар сайжирч, 1-2 жил үргэлжилнэ',
  process: [
    { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж эмчилгээний төлөвлөгөө гаргах' },
    { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
    { step: 3, title: 'Мэдээгүйжүүлэлт', desc: 'Тав тухтай эмчилгээний төлөө мэдээ алдуулах тос түрхэх' },
    { step: 4, title: 'Эмчилгээ', desc: 'DeepSEE-ээр харж нарийн эмчилгээ хийх' },
    { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж сэргээлтийн заавар өгөх' },
  ],
  faqs: [
    {
      q: 'Ultherapy Prime эмчилгээ өвдөх үү?',
      shortA: 'Мэдээ алдуулах тосоор ихэнх хүн тэвчиж чадна.',
      a: 'Эмчилгээний өмнө мэдээ алдуулах тос түрхдэг тул ихэнх хүн тэвчиж чадна. Өвдөлтөд мэдрэмтгий хүмүүсийн хувьд нэмэлт өвдөлт намдаах боломжтой.',
    },
    // … 2개 더
  ],
},
```

### 4.4 아랍어 (ar) entry 작성 정책

**RTL·MSA 규칙**:
- MSA(Modern Standard Arabic) 일관 사용. 방언(이집트·걸프·레반트) 금지.
- 영어 시술명(`Ultherapy Prime`)은 그대로 라틴 문자로 유지하거나 음차(`ألثرابي برايم`) 후 괄호 영어 병기.
- 숫자: 서양 숫자(`60-90`)와 아라비아 숫자(`٦٠-٩٠`) 중 **서양 숫자 사용**(국제 의료 표준, 환자 인지 용이).

```ts
ulthera: {
  targetAreas: ['الجبهة', 'محيط العين', 'الخدود', 'خط الفك', 'الرقبة'],
  idealFor: [
    'الباحثون عن شد غير جراحي',
    'المعانون من ترهل الجلد وفقدان المرونة',
    'الراغبون في نتائج طبيعية',
    'الراغبون في علاج بدون فترة نقاهة',
  ],
  cautions: [
    'قد يظهر تورم خفيف أو احمرار بعد العلاج',
    'قد تحدث تغيرات حسية مؤقتة حسب المنطقة',
    'غير مناسب للحوامل أو المرضعات',
    'يتطلب استشارة في حالة وجود زرعات معدنية في منطقة العلاج',
  ],
  duration: '60-90 دقيقة',
  anesthesia: 'كريم مخدر موضعي (30 دقيقة)',
  recovery: 'العودة الفورية إلى الحياة اليومية',
  results: 'تحسن تدريجي على مدى 3-6 أشهر، يستمر 1-2 سنة',
  process: [
    { step: 1, title: 'الاستشارة', desc: 'تحليل البشرة وتخطيط العلاج' },
    { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
    { step: 3, title: 'التخدير', desc: 'تطبيق كريم مخدر للراحة' },
    { step: 4, title: 'العلاج', desc: 'علاج دقيق بتوجيه نظام DeepSEE' },
    { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
  ],
  faqs: [
    {
      q: 'هل علاج ألثرابي برايم (Ultherapy Prime) مؤلم؟',
      shortA: 'مع الكريم المخدر، يتحمله معظم المرضى.',
      a: 'نطبق كريمًا مخدرًا موضعيًا قبل العلاج، فيتحمله معظم الناس. كما تتوفر إدارة إضافية للألم للمرضى الحساسين.',
    },
    // … 2개 더
  ],
},
```

---

## 5. RELATED_TREATMENTS_L10N 추가 패턴

`treatmentsI18n.ts:616` 부근 `zh` 항목 다음에 `fr`, `mn`, `ar` 3개 키 추가. 각 10개 entry(9 시술 + laser).

```ts
export const RELATED_TREATMENTS_L10N: Partial<Record<Locale, Record<string, { name: string; desc: string }>>> = {
  ko: {},
  en: {},
  zh: { … 기존 10 entries 유지 … },

  // ◀──── 본 PDCA 추가 시작
  fr: {
    ulthera: { name: 'Ultherapy Prime', desc: 'Standard mondial du lifting HIFU, approuvé par la FDA américaine et la KFDA' },
    thermage: { name: 'Thermage FLX', desc: 'Le summum reconnu mondialement du lifting par radiofréquence' },
    shurink: { name: 'Shurink Universe', desc: 'Soin d\'élasticité ultrasonique au rapport qualité-prix raisonnable' },
    thread: { name: 'Lifting par fils', desc: 'Lifting en V avec fils résorbables' },
    inmode: { name: 'InMode', desc: 'Réduction de graisse et lifting simultanés grâce à l\'énergie RF' },
    density: { name: 'Densiti', desc: 'Lifting uniforme et lisse grâce à l\'énergie RF haute fréquence' },
    botox: { name: 'Botox', desc: 'Amélioration naturelle des rides et affinage du contour' },
    filler: { name: 'Acide hyaluronique', desc: 'Volume naturel par injection d\'acide hyaluronique' },
    skinbooster: { name: 'Skinbooster', desc: 'Injection dermique pour hydratation, régénération et élasticité' },
    laser: { name: 'Centre laser', desc: 'Diverses thérapies laser pour améliorer l\'état de la peau' },
  },
  mn: {
    ulthera: { name: 'Ultherapy Prime (Ультерапи Прайм)', desc: 'АНУ-ын FDA болон Солонгосын KFDA-ээс зөвшөөрөгдсөн HIFU лифтингийн дэлхийн стандарт' },
    thermage: { name: 'Thermage FLX (Термаж FLX)', desc: 'Радио давтамжийн лифтингийн дэлхийн нэр хүндтэй шилдэг бүтээгдэхүүн' },
    shurink: { name: 'Shurink Universe (Шүрэнк Юниверс)', desc: 'Хүртээмжтэй үнэтэй ультра-авианы уян хатан эмчилгээ' },
    thread: { name: 'Утсан лифтинг (Thread lifting)', desc: 'Шингээгдэх утсаар V-хэлбэрийн лифтинг' },
    inmode: { name: 'InMode (ИнМоуд)', desc: 'RF энергийг ашиглан өөхний бууралт болон лифтингийг нэгэн зэрэг' },
    density: { name: 'Densiti (Денсити)', desc: 'Өндөр давтамжийн (RF) энергийг ашиглан тэгш гөлгөр лифтинг' },
    botox: { name: 'Ботокс (Botox)', desc: 'Үрчлээний байгалийн сайжралт ба контур засвар' },
    filler: { name: 'Филлер (Filler)', desc: 'Гиалуроны хүчилээр байгалийн эзлэхүүн' },
    skinbooster: { name: 'Скинбүүстер (Skinbooster)', desc: 'Чийгшил, сэргэлт, уян хатан байдлыг сайжруулах дермисийн тарилга' },
    laser: { name: 'Лазер төв (Laser Center)', desc: 'Арьсны төлөв сайжруулах олон төрлийн лазер эмчилгээ' },
  },
  ar: {
    ulthera: { name: 'ألثرابي برايم (Ultherapy Prime)', desc: 'المعيار العالمي للشد بتقنية HIFU، معتمد من إدارة الغذاء والدواء الأمريكية والكورية' },
    thermage: { name: 'ثيرماج FLX (Thermage FLX)', desc: 'الجوهرة المعترف بها عالميًا لشد البشرة بالترددات الراديوية' },
    shurink: { name: 'شورينك يونيفرس (Shurink Universe)', desc: 'علاج مرونة بالموجات فوق الصوتية بسعر معقول' },
    thread: { name: 'شد الخيوط', desc: 'شد على شكل V بخيوط قابلة للذوبان' },
    inmode: { name: 'إن مود (InMode)', desc: 'تقليل الدهون والشد في آن واحد بطاقة الترددات الراديوية' },
    density: { name: 'دنسيتي (Densiti)', desc: 'شد متجانس وناعم بطاقة الترددات الراديوية العالية' },
    botox: { name: 'البوتوكس', desc: 'تحسين طبيعي للتجاعيد وتنسيق الكنتور' },
    filler: { name: 'الفيلر / حمض الهيالورونيك', desc: 'حجم طبيعي بحقن حمض الهيالورونيك' },
    skinbooster: { name: 'سكين بوستر', desc: 'حقن في الأدمة لتحسين الترطيب والتجديد والمرونة' },
    laser: { name: 'مركز الليزر', desc: 'علاجات ليزر متنوعة لتحسين حالة البشرة' },
  },
  // ◀──── 본 PDCA 추가 끝
};
```

---

## 6. 번역 자동화 스크립트 설계 (선택)

본 PDCA의 작업량(약 18 entries × 9 필드 + 30 related = **약 162 항목**)은 LLM 1차 번역 + 수동 검증으로 처리 가능. **자동화 스크립트는 선택 사항**이나, 일관성·재현성을 위해 권장.

### 6.1 옵션 A — 인라인 수동 작성 (권장, 본 PDCA 채택)

- `treatmentsI18n.ts`에 직접 FR/MN/AR LocaleMap을 한 번에 작성
- LLM(Claude)에게 ZH entry + 글로서리 §3 제공 → FR/MN/AR 3개 변환 동시 요청
- 6 시술 × 3 locale = 18회 변환 요청 (또는 1회 통합 요청)
- 결과를 직접 코드에 삽입

**장점**: 즉시성, 검토 용이, 추가 스크립트 의존성 없음

### 6.2 옵션 B — 스크립트 생성 후 머지 (보류)

`liv-clinic/scripts/generate-treatments-i18n.mjs`:
- 입력: `treatmentsI18n.ts`의 ZH 객체 + 글로서리 JSON + 타깃 locale 코드
- 출력: `FR.partial.ts`, `MN.partial.ts`, `AR.partial.ts`
- 머지: `cat FR.partial.ts >> treatmentsI18n.ts` 후 수동 위치 조정

**단점**: 본 PDCA 1회성 작업에 스크립트 도입은 over-engineering

→ **결정**: **옵션 A**. 스크립트 없음.

---

## 7. 파일 구조 영향

**Plan §11 의사결정 §2 확정**: 단일 파일 유지.

### 7.1 변경 파일 (1개)

| 파일 | 변경 유형 | 변경 규모 | 비고 |
|------|----------|----------|------|
| `liv-clinic/src/lib/treatmentsI18n.ts` | 수정 | +약 600~700줄 (6 시술 × 3 locale × 평균 35줄/entry + 30 related-cards) | 단일 파일 1,250~1,350줄 예상 |

### 7.2 변경 없음 (호출부)

| 파일 | 변경 없음 사유 |
|------|---------------|
| `UltheraDetail.tsx` | 이미 `getLocalizedTreatment` 사용 중. MAPS만 추가하면 자동 동작 |
| `ThermageDetail.tsx` | 동일 |
| `ShurinkDetail.tsx` | 동일 |
| `InModeDetail.tsx` | 동일 |
| `DensityDetail.tsx` | 동일 |
| `ThreadDetail.tsx` | 동일 |
| `BotoxDetail.tsx` 등 antiaging | `treatmentsI18n.ts` 미참조 (별 경로 i18n) |
| `routing.ts`, `locales-meta.ts` | 선행 PDCA에서 fr/mn/ar 등록 완료 |
| `messages/{fr,mn,ar}.json` | 선행 PDCA에서 생성 완료 |

---

## 8. 검증 전략 (Verification)

### 8.1 정적 검증

| 검증 | 명령 | 통과 기준 |
|------|------|----------|
| 타입 체크 | `npx tsc --noEmit` (in `liv-clinic/`) | 0 errors |
| 빌드 | `npm run build` | exit 0, 0 missing key warnings |
| Lint | `npm run lint` | 0 errors |
| Locale 키 동기화 | `node scripts/verify-locale-keys.mjs` | 11/11 locale 통과 |

### 8.2 동적 검증 (스폿 체크)

본 PDCA 검증 페이지: **6 lifting × 3 locale = 18 페이지**

| 페이지 | 검증 항목 | 우선순위 |
|--------|----------|---------|
| `/fr/lifting/ulthera` | targetAreas/idealFor/cautions/duration/anesthesia/recovery/results/process/faqs 모두 프랑스어 | P0 |
| `/fr/lifting/thermage` | 동일 | P0 |
| `/fr/lifting/shurink` | 동일 | P1 |
| `/fr/lifting/inmode` | 동일 | P1 |
| `/fr/lifting/density` | 동일 | P1 |
| `/fr/lifting/thread` | 동일 | P1 |
| `/mn/lifting/{6개}` | 동일, **키릴 + 영어 병기 패턴 일관** | P0~P1 |
| `/ar/lifting/{6개}` | 동일, **RTL 레이아웃 + 아랍어 폰트 + 숫자 서양식** | P0~P1 |

회귀 검증 페이지: 기존 8개 locale의 6 lifting 페이지 (총 48 페이지) — 변경 없음 확인.

### 8.3 시각 검수 체크리스트 (RTL `/ar` 특별)

- [ ] `process` 단계 표시기가 1→5 순서대로 시각적 흐름 자연스러움 (RTL 컨텍스트에서 좌측 또는 우측 자동 배치)
- [ ] `faqs` accordion 화살표 아이콘 방향 (선행 PDCA RTL 인프라 의존)
- [ ] `targetAreas`/`idealFor`/`cautions` 리스트 bullet 정렬 (RTL 우측 정렬)
- [ ] 텍스트 overflow 없음 (아랍어 단어 길이 한국어 대비 1.5~2배)

### 8.4 한국어 잔존 검증

```bash
# 본 PDCA 작업 검증용 grep (treatmentsI18n.ts에서 FR/MN/AR 블록 내 한글 검출)
grep -nP "(?<=FR.|MN.|AR.).*[\p{Hangul}]" liv-clinic/src/lib/treatmentsI18n.ts
```

기대 결과: 한글 0건 (몽골어의 영어 병기 외 모든 본문은 현지어)

---

## 9. 리스크 및 대응 (Design 단계 보강)

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 의료 전문 용어 LLM 1차 번역 일관성 (HIFU, RF, FDA 등) | **High** | §3 글로서리 강제 매핑. 번역 요청 시 LLM에 글로서리 표를 함께 전달 |
| 아랍어 텍스트 길이 → 카드 overflow | Medium | 선행 PDCA에서 컴포넌트 `flex-wrap`/`line-clamp` 검토 완료 가정. 시각 검수에서 확인 |
| 몽골어 영어 병기 정책 위반 (전 항목 병기 시 가독성 저하) | Medium | **첫 등장 시에만 병기, 이후 단독** 규칙 일관 적용. process step의 `desc`에서는 시술명 재등장 시 키릴 단독 |
| ZH의 9개 entry vs FR/MN/AR의 6개 entry 구조 불일치 | Low | **의도된 일관성 결여**. Design §0에 명시. 향후 antiaging 통합 PDCA에서 해소 |
| `RELATED_TREATMENTS_L10N`의 `laser` 항목 위치 | Low | ZH 패턴 그대로 추가. 구조 정리는 별도 |
| 빌드 시간 증가 | Low | 단일 파일 +700줄 추가는 무시 가능 (`liv-clinic/scripts/verify-locale-keys.mjs` 외 빌드 영향 없음) |
| 미번역 잔존 (LLM 누락) | Medium | §8.4 grep 검증으로 자동 검출. 발견 시 즉시 패치 |
| 아랍어 숫자 표기 (서양 vs 아라비아) | Low | **서양 숫자 일관 사용** 결정. 국제 의료 표준 |
| Detail 컴포넌트의 `getLocalizedTreatment` 호출 시 locale param 정상 전달 여부 | Low | 기존 ZH 동작 확인된 상태. `useLocale()` 결과 정상 전달 가정 |
| `liv-clinic/src/messages/{fr,mn,ar}.json`의 시술 관련 키와 LocaleMap의 텍스트 불일치 | Medium | 선행 PDCA의 messages는 페이지 타이틀·메뉴·헤더 등 UI 텍스트 중심. LocaleMap은 시술 데이터(targetAreas 등). **두 레이어가 독립적이므로 직접 충돌은 없음**. 단, 시술명 표기는 동일해야 함 (예: `targetAreas` 페이지 타이틀 vs LocaleMap의 시술명) — 글로서리 §3.2로 통일 |

---

## 10. 구현 순서 (상세)

### Step 1 — 글로서리 사전 검증 (30분)
- `docs/02-design/glossary-fr-mn-ar.md`로 §3 분리 또는 본 design.md §3 그대로 사용
- 의료 전문가/네이티브 1차 확인 (선택, 본 PDCA에서는 생략 가능)

### Step 2 — FR LocaleMap 작성 (1.5시간)
1. ZH `ulthera` entry 추출 → 글로서리와 함께 LLM에 FR 번역 요청
2. `thermage` 동일
3. `shurink`, `inmode`, `density`, `thread` (ZH에 이미 있음, 패턴 활용)
4. `treatmentsI18n.ts:582` 다음에 `FR: LocaleMap` 객체 삽입
5. **즉시 `npx tsc --noEmit` 통과 확인** (구문 오류 조기 발견)

### Step 3 — MN LocaleMap 작성 (1.5시간)
1. 영어 병기 정책(§4.3) 적용하며 6 시술 변환
2. 코드 삽입
3. tsc 통과 확인

### Step 4 — AR LocaleMap 작성 (1.5시간)
1. MSA 일관 + 서양 숫자 사용 (§4.4)
2. 코드 삽입
3. tsc 통과 확인

### Step 5 — MAPS 등록 (5분)
```ts
fr: FR, mn: MN, ar: AR,
```

### Step 6 — RELATED_TREATMENTS_L10N 추가 (30분)
§5의 3개 키(fr/mn/ar) × 10 entries 일괄 작성

### Step 7 — 빌드·검증 (15분)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `node scripts/verify-locale-keys.mjs`

### Step 8 — 시각 스폿 체크 (20분)
- `npm run dev`
- `/fr/lifting/ulthera`, `/mn/lifting/thermage`, `/ar/lifting/shurink` 3개 페이지 시각 확인

### Step 9 — Check 단계로 이행
- `/pdca analyze i18n-treatments-fr-mn-ar`

**총 예상 시간**: 약 5~6시간 (인라인 LLM 호출 포함)

---

## 11. 산출물 체크리스트

본 Design 문서가 제공한 자산:

- [x] Plan §11 의사결정 6개 모두 확정
- [x] §0 Plan 범위 정정 (9 시술 → 6 시술, 27 → 18 entries)
- [x] §1 아키텍처 다이어그램 (현재 ↔ 목표)
- [x] §2 데이터 스키마 (타입, 필드별 가이드)
- [x] §3 의료 전문 용어집 72개 (4개 카테고리 × 4 locale)
- [x] §4.1 코드 삽입 위치 명시
- [x] §4.2 FR ulthera 예시 entry (LLM 변환 기준)
- [x] §4.3 MN 영어 병기 정책 + ulthera 예시
- [x] §4.4 AR MSA·서양숫자 정책 + ulthera 예시
- [x] §5 RELATED_TREATMENTS_L10N 추가 패턴 (30 entries 일괄)
- [x] §6 자동화 스크립트 검토 → 옵션 A 채택
- [x] §7 파일 구조 영향 (단일 파일 1개 수정)
- [x] §8 검증 전략 (정적/동적/시각/한국어 잔존)
- [x] §9 리스크 11개 + 대응
- [x] §10 9단계 구현 순서 (총 5~6시간)

---

## 12. 다음 단계 (Next Phase)

- `/pdca do i18n-treatments-fr-mn-ar` — §10의 9단계 순차 구현
- `/pdca analyze i18n-treatments-fr-mn-ar` — §8 검증 항목 자동 + 시각 검수
- `/pdca report i18n-treatments-fr-mn-ar` — 완료 보고서 + 선행 PDCA hotfix 종결 선언

---

## 13. 참고 자료

### 본 PDCA 코드 위치 (검증 완료)
- `liv-clinic/src/lib/treatmentsI18n.ts:35` — `ZH` LocaleMap (구조 템플릿)
- `liv-clinic/src/lib/treatmentsI18n.ts:582` — JA 종료, FR/MN/AR 삽입 지점
- `liv-clinic/src/lib/treatmentsI18n.ts:584` — `MAPS` 객체 (3 키 등록 지점)
- `liv-clinic/src/lib/treatmentsI18n.ts:616` — `RELATED_TREATMENTS_L10N` (3 키 추가 지점)
- `liv-clinic/src/lib/treatmentsI18n.ts:601` — `getLocalizedTreatment()` (변경 없음, 기존 동작 보존)
- `liv-clinic/src/lib/treatmentsI18n.ts:634` — `getRelatedTreatmentLabel()` (변경 없음)

### 호출 지점 (변경 없음)
- `liv-clinic/src/components/sections/UltheraDetail.tsx:500`
- `liv-clinic/src/components/sections/ThermageDetail.tsx:494`
- `liv-clinic/src/components/sections/ShurinkDetail.tsx:438`
- `liv-clinic/src/components/sections/InModeDetail.tsx:320`
- `liv-clinic/src/components/sections/DensityDetail.tsx:451`
- `liv-clinic/src/components/sections/ThreadDetail.tsx:741`

### 선행 PDCA
- `docs/04-report/i18n-fr-mn-ar.report.md` — 84% 조건부 완료 사유 (본 PDCA로 분리 합의)

### 외부 참조
- BCP 47: ar (MSA), fr (Standard French), mn (Khalkha Mongolian, Cyrillic)
- ISO 639-1: ar / fr / mn
- ISAPS 시술명 다국어 가이드
- WHO ICD-11 다국어 (의학 용어 검증)
