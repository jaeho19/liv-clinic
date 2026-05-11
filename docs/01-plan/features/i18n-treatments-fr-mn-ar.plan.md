# Plan: 시술 상세 데이터 다국어화 — 프랑스어 · 몽골어 · 아랍어 LocaleMap 추가

> **Feature**: `i18n-treatments-fr-mn-ar`
> **Phase**: Plan
> **Created**: 2026-05-11
> **Owner**: jaeho19@gmail.com
> **Related (선행)**:
> - `i18n-fr-mn-ar` (조건부 완료, matchRate 84%) — 본 PDCA는 그 hotfix 분리분
> - `zh-i18n-fix` (완료) — `treatmentsI18n.ts` 도입
> - `multilingual-expansion` Phase 1 (완료) — 8 → 11 locale 인프라

---

## 1. 배경 (Background)

선행 PDCA `i18n-fr-mn-ar`가 **조건부 완료(84%)**된 사유는 명확하다.
`.bkit-memory.json`의 `completionReason` 인용:

> "User-agreed hotfix separation: treatmentsI18n LocaleMap deferred to i18n-treatments-fr-mn-ar PDCA"

즉 i18n 인프라(routing/locales-meta/fonts/RTL/SEO)는 완성됐지만, **시술 상세 페이지가 사용하는 `treatmentsI18n.ts`의 FR/MN/AR LocaleMap 정의가 누락**되어 있다. 그 결과 `/fr/lifting/ulthera`, `/mn/antiaging/botox`, `/ar/lifting/thermage` 등 시술 상세 페이지에서 `targetAreas`, `idealFor`, `cautions`, `faqs`, `process`, `duration`, `anesthesia`, `recovery`, `results` 9개 필드가 **한국어(constants.ts baseline) fallback**으로 노출되는 상태다.

### 현재 `treatmentsI18n.ts` 커버리지 매트릭스

| Locale | LocaleMap 등록 | 포함 시술 수 | 사용자 가시 상태 |
|--------|---------------|-------------|-------------------|
| `ko`   | `{}` (baseline) | — | ✅ 한국어(constants.ts) |
| `en`   | `EN` | **2** (ulthera, thermage) | ⚠️ ulthera/thermage만 영어, 나머지 7종 한국어 |
| `zh`   | `ZH` | **9** (전체) | ✅ 중국어 완전 |
| `ja`   | `JA` | **2** (ulthera, thermage) | ⚠️ ulthera/thermage만 일본어, 나머지 7종 한국어 |
| `zh-TW`| `{}` | 0 | ❌ 전부 한국어 |
| `vi`   | `{}` | 0 | ❌ 전부 한국어 |
| `th`   | `{}` | 0 | ❌ 전부 한국어 |
| `ru`   | `{}` | 0 | ❌ 전부 한국어 |
| `fr`   | **미등록** | 0 | ❌ 전부 한국어 — **본 PDCA 타깃** |
| `mn`   | **미등록** | 0 | ❌ 전부 한국어 — **본 PDCA 타깃** |
| `ar`   | **미등록** | 0 | ❌ 전부 한국어 — **본 PDCA 타깃** |

### 비즈니스 임팩트

선행 PDCA로 메시지 키(`fr.json`/`mn.json`/`ar.json`)는 모두 번역됐다. 하지만 시술 상세 페이지의 **핵심 콘텐츠(시술 부위·적합 대상·주의사항·FAQ·시술 과정 등)**가 한국어로 노출되면, **신규 3개 locale의 진입 효과가 메인 페이지 수준에서 정체**된다. 안티에이징·리프팅 시술 의사결정에 가장 큰 영향을 주는 페이지이므로, **의료관광 환자 컨버전 직결 영역**이다.

### 시술 9종 목록 (`liv-clinic/src/lib/constants.ts` 기반)

| 카테고리 | 시술 ID | 명칭(ko) | 페이지 |
|---------|---------|----------|--------|
| Lifting | `ulthera` | 울쎄라 프라임 | `/[locale]/lifting/ulthera` |
| Lifting | `thermage` | 써마지 FLX | `/[locale]/lifting/thermage` |
| Lifting | `shurink` | 슈링크 유니버스 | `/[locale]/lifting/shurink` |
| Lifting | `inmode` | 인모드 | `/[locale]/lifting/inmode` |
| Lifting | `density` | 덴서티 | `/[locale]/lifting/density` |
| Lifting | `thread` | 실리프팅 | `/[locale]/lifting/thread` |
| Antiaging | `botox` | 보톡스 | `/[locale]/antiaging/botox` |
| Antiaging | `filler` | 필러 | `/[locale]/antiaging/filler` |
| Antiaging | `skinbooster` | 스킨부스터 | `/[locale]/antiaging/skinbooster` |

---

## 2. 목표 (Goals)

1. `fr`, `mn`, `ar` 3개 locale의 `LocaleMap`을 `treatmentsI18n.ts`에 추가 → 시술 상세 페이지 다국어화 완성
2. **선행 PDCA에서 분리된 hotfix 작업의 명시적 종결** (matchRate 84% → 본 PDCA 100% 목표)
3. `RELATED_TREATMENTS_L10N`에도 `fr/mn/ar` 추가 (관련 시술 카드 명칭 다국어화)
4. EN/JA의 불완전 LocaleMap(2/9)에 대해 보완 여부 의사결정 (본 PDCA 포함 / 별도 PDCA)
5. **빌드·타입체크 회귀 0건**, 시술 상세 페이지 9 × 3 = **27 페이지 조합** 시각 검수 가능 상태 달성

---

## 3. 범위 (Scope)

### In Scope

#### A. `treatmentsI18n.ts` LocaleMap 신규 정의

- `FR: LocaleMap` 신규 추가 — 9개 시술 전체
- `MN: LocaleMap` 신규 추가 — 9개 시술 전체
- `AR: LocaleMap` 신규 추가 — 9개 시술 전체
- `MAPS`에 `fr: FR`, `mn: MN`, `ar: AR` 3 항목 등록

각 시술별 번역 필드 (9 × 9 시술 = 81개 항목 그룹):
- `targetAreas` (string[]) — 시술 부위, 3~6개
- `idealFor` (string[]) — 적합 대상, 3~5개
- `cautions` (string[]) — 주의사항, 3~5개
- `duration` (string) — 시술 시간
- `anesthesia` (string) — 마취 방법
- `recovery` (string) — 회복 기간
- `results` (string) — 효과 지속
- `process` (ProcessStep[]) — 시술 과정, 4~5단계 × {step, title, desc}
- `faqs` (FAQ[]) — 자주 묻는 질문, 3개 × {q, shortA, a}

총 번역 단위 추정: **9 시술 × 약 50 문자열 × 3 locale ≈ 1,350 항목**

#### B. `RELATED_TREATMENTS_L10N` 확장

- `fr`, `mn`, `ar`에 9 시술 + `laser`(센터) = **10개 항목** × `{name, desc}` 추가
- 현재 `zh`만 채워져 있음 → 본 PDCA에서 `fr/mn/ar` 3개 추가
- `en/ja` 누락분은 별도 의사결정 (섹션 11 참조)

#### C. 검증

- `npx tsc --noEmit` — 0 errors
- `npm run build` — exit 0, missing key warning 0건
- `npm run lint` — 0 errors
- 시술 상세 페이지 9 × 3 = 27 조합 페이지 스폿 체크:
  - `/fr/lifting/ulthera`, `/fr/antiaging/botox` — 프랑스어 정상 표시
  - `/mn/lifting/thermage`, `/mn/antiaging/filler` — 몽골어(키릴) 정상 표시
  - `/ar/lifting/shurink`, `/ar/antiaging/skinbooster` — 아랍어 RTL + 폰트 정상
- `getLocalizedTreatment()` fallback 동작 확인 (override 누락 시 한국어 출력)

### Out of Scope

- **EN/JA LocaleMap 보완** (현재 2/9 → 9/9): 본 PDCA의 합의된 사용자 분리 권고에 따라 **별도 PDCA `i18n-treatments-en-ja-complete`로 분리 권장** (섹션 11 결정 사항)
- **`zh-TW`/`vi`/`th`/`ru` LocaleMap**: 본 PDCA 타깃 외. 각 locale 활성화 시점에 개별 PDCA로 처리
- **번역 품질 네이티브 검수**: LLM 1차 번역 → 출시 → 의료 전문가/현지 검수 단계적
- **`constants.ts` 한국어 baseline 수정**: 한국어 콘텐츠 변경은 별도 작업
- **신규 시술 추가**: 본 PDCA는 기존 9 시술 다국어화에만 집중
- **시술 상세 페이지 UI 변경**: 컴포넌트·레이아웃 수정 없음. 데이터 레이어만 추가
- **관리자 페이지(`/admin`)**: 한국어 고정 유지

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `/fr/lifting/{id}` 9 페이지 모두 시술 상세 9개 필드가 프랑스어로 표시 | P0 |
| FR-02 | `/mn/lifting/{id}` 9 페이지 모두 시술 상세 9개 필드가 몽골어(키릴)로 표시 | P0 |
| FR-03 | `/ar/lifting/{id}` 9 페이지 모두 시술 상세 9개 필드가 아랍어로 표시(RTL 적용 상태에서) | P0 |
| FR-04 | `/fr/antiaging/{id}` 3 페이지(botox/filler/skinbooster)도 동일 동작 | P0 |
| FR-05 | `/mn/antiaging/{id}` 3 페이지 동일 동작 | P0 |
| FR-06 | `/ar/antiaging/{id}` 3 페이지 동일 동작 | P0 |
| FR-07 | `getLocalizedTreatment(base, treatmentId, locale)` 호출 시 `locale='fr'\|'mn'\|'ar'`에 대해 override 객체가 반환된다 | P0 |
| FR-08 | 관련 시술 카드(`RELATED_TREATMENTS_L10N`)가 `/fr`, `/mn`, `/ar`에서 현지어 명칭·설명으로 표시 | P0 |
| FR-09 | 부분 누락(override 객체에서 일부 필드만 정의) 시 한국어 baseline fallback 정상 동작 | P1 |
| FR-10 | `process` step의 `title`·`desc`가 step 순서대로 현지어 표시 | P1 |
| FR-11 | `faqs`의 `q`·`shortA`·`a` 3개 필드 모두 현지어 표시 | P1 |
| FR-12 | 의료 전문 용어 일관성 (HIFU, RF, FDA 등) — locale별 표준 표기 사용 | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | TypeScript strict 호환 | `npx tsc --noEmit` 0 errors |
| NFR-02 | 빌드 회귀 0건 | `npm run build` exit 0, missing translation warning 0건 |
| NFR-03 | 번들 크기 영향 최소 | `treatmentsI18n.ts` 단일 파일 증가, dynamic chunk split 유지 |
| NFR-04 | 기존 locale 회귀 0건 | `ko/en/zh/ja/zh-TW/vi/th/ru` 시술 상세 페이지 동작 보존 |
| NFR-05 | 코드 일관성 | ZH LocaleMap과 동일한 들여쓰기·필드 순서·구조 |
| NFR-06 | 의료 용어 정확성 | 보톡스/필러/HIFU/RF 등 핵심 용어 locale별 표준 표기 가이드 준수 |
| NFR-07 | 폰트 글리프 커버리지 | 프랑스어 diacritics(é, è, ç, ô, à), 몽골어 키릴(Ө, Ү, ё), 아랍어 28자 모두 렌더 (선행 PDCA에서 인프라 완료) |

---

## 5. 제약사항 (Constraints)

### 5.1 번역 분량
- 9 시술 × 평균 50 문자열 × 3 locale ≈ **1,350 항목**
- ZH LocaleMap(35-403행, 약 370줄)을 기준 분량으로 추정 시 **FR/MN/AR 각각 ~370줄, 총 ~1,100줄 추가**
- 최종 `treatmentsI18n.ts` 예상 크기: 629줄 → **약 1,700~1,800줄**
- 단일 파일 800줄 가이드 초과 → **파일 분할 검토** (섹션 11 결정 사항)

### 5.2 의료 용어집 (사전 정의 필수)

| 한국어 | 영어 | 프랑스어 | 몽골어(키릴) | 아랍어 |
|--------|------|----------|--------------|--------|
| HIFU | HIFU | HIFU / Ultrasons focalisés | HIFU / Өндөр эрчимтэй фокус ультра-авиа | الموجات فوق الصوتية المركّزة عالية الكثافة (HIFU) |
| RF | RF | RF / Radiofréquence | RF / Радио давтамж | الترددات الراديوية (RF) |
| 보톡스 | Botox | Botox | Ботокс | البوتوكس |
| 필러 | Filler | Acide hyaluronique / Filler | Филлер | الفيلر |
| 리프팅 | Lifting | Lifting / Tenseur | Лифтинг | الشد |
| 안티에이징 | Anti-aging | Anti-âge | Хөгшрөлтийн эсрэг | مكافحة الشيخوخة |
| FDA 승인 | FDA-approved | Approuvé par la FDA | FDA-аас зөвшөөрөгдсөн | معتمد من إدارة الغذاء والدواء |
| 콜라겐 | Collagen | Collagène | Коллаген | الكولاجين |
| 다운타임 | Downtime | Temps d'arrêt / Sans éviction sociale | Сэргэх хугацаа | فترة النقاهة |
| 마취 크림 | Topical anesthetic cream | Crème anesthésiante | Мэдээ алдуулах тос | كريم مخدر موضعي |

→ Design 단계에서 50~80개 용어로 확장하여 `docs/02-design/glossary-fr-mn-ar.md` 산출

### 5.3 LLM 번역 한계
- 의료 전문 용어 LLM 1차 번역은 일반 표현보다 오차 가능성 높음
- 프랑스어: 캐나다 퀘벡 표준 vs 프랑스 본토 표준 차이 (예: "courriel" vs "email") — **프랑스 본토 우선**
- 몽골어: 키릴 전사 vs 영어 음차 (예: "Ультерапи" vs "Ulthera") — **키릴 음차 + 괄호 영어 원어 병기 권장**
- 아랍어: MSA(현대 표준 아랍어) 일관 사용. 방언(이집트·걸프) 금지

### 5.4 LocaleMap 구조 일관성
- ZH/EN/JA와 동일한 TypeScript 인터페이스 준수 (`LocaleMap`, `TreatmentL10n`)
- 필드 순서: `targetAreas → idealFor → cautions → duration → anesthesia → recovery → results → process → faqs`
- `process` step 번호 1~5 고정 (ZH 패턴 따름)
- `faqs` 항목 수 3개 고정 (ZH 패턴 따름)

### 5.5 Next.js 16 / 빌드 영향
- `treatmentsI18n.ts`는 server component에서 import → SSR 단계 평가
- 파일 크기 증가는 빌드 시간에 영향 가능 (현재 385 페이지 build 기준)
- dynamic import 대상 아님 (constants 성격) — 분할 시 별도 모듈 고려

### 5.6 fallback 동작 보존
- `getLocalizedTreatment()`의 spread 머지 패턴 유지 (`{ ...base, ...override }`)
- 부분 누락 필드는 한국어 baseline fallback (현행 동작과 동일)
- 의도적으로 일부 필드만 override하는 케이스 허용 (e.g., `duration`만 같은 형식이면 생략 가능하지만, **본 PDCA는 9 필드 전체 채움 원칙**)

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `treatmentsI18n.ts`에 `FR`, `MN`, `AR` LocaleMap 객체가 정의되어 있다
- [ ] 3개 LocaleMap 모두 9 시술 ID(ulthera, thermage, shurink, inmode, density, thread, botox, filler, skinbooster) 전부 포함
- [ ] 각 시술 객체에 `targetAreas`, `idealFor`, `cautions`, `duration`, `anesthesia`, `recovery`, `results`, `process`, `faqs` 9개 필드 모두 정의
- [ ] `MAPS` 객체에 `fr: FR`, `mn: MN`, `ar: AR` 3 항목 등록
- [ ] `RELATED_TREATMENTS_L10N`에 `fr`, `mn`, `ar` 키 추가, 각각 10개 항목(9 시술 + laser)
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run build` exit 0, missing translation key warning 0건
- [ ] `npm run lint` 0 errors
- [ ] `/fr/lifting/ulthera` 페이지 5종 콘텐츠(시술 부위, 적합 대상, 주의사항, FAQ, 시술 과정)가 **모두 프랑스어**로 표시 (한국어 잔존 0건, 고유명사 제외)
- [ ] `/mn/antiaging/botox` 페이지 동일 항목이 **몽골어(키릴)**로 표시
- [ ] `/ar/lifting/thermage` 페이지 동일 항목이 **아랍어**로 표시, RTL 레이아웃 정상
- [ ] 관련 시술 카드(페이지 하단)가 신규 3개 locale에서 현지어 명칭·설명 표시
- [ ] 기존 `/ko`, `/en`, `/zh`, `/ja` 시술 상세 페이지 회귀 0건
- [ ] `getLocalizedTreatment(base, 'ulthera', 'fr')` 호출 결과가 프랑스어 override를 포함하는 객체

---

## 7. 예상 구조 (변경 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/lib/treatmentsI18n.ts` | **수정 (대규모)** | `FR`/`MN`/`AR` LocaleMap 3개 추가, `MAPS`에 3 키 등록, `RELATED_TREATMENTS_L10N`에 3 키 추가. 약 +1,100줄 예상 |

**선택적 (섹션 11 결정에 따라):**

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/lib/treatmentsI18n/fr.ts` | (신규, 분할 선택 시) | FR LocaleMap을 별도 파일로 분리 |
| `liv-clinic/src/lib/treatmentsI18n/mn.ts` | (신규, 분할 선택 시) | MN LocaleMap |
| `liv-clinic/src/lib/treatmentsI18n/ar.ts` | (신규, 분할 선택 시) | AR LocaleMap |
| `liv-clinic/src/lib/treatmentsI18n/index.ts` | (신규, 분할 선택 시) | `MAPS` 조립 + `getLocalizedTreatment` export |

**총 변경**: 단일 파일 1개 수정 (기본 권장) 또는 5개 파일 신규 + 1개 파일 수정 (분할 시).

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| LLM 의료 전문 용어 1차 번역 품질 저하 (HIFU·RF·시술명) | **High** | 섹션 5.2 용어집을 Design 단계에서 50~80개로 확장, FR/AR/MN locale별 표준 표기 사전 정의. 핵심 9 시술명은 ZH/EN/JA 기존 번역 패턴 참조 |
| `treatmentsI18n.ts` 단일 파일 1,800줄 초과로 가독성·리뷰 부담 | Medium | **분할 옵션 결정** (섹션 11). 권장: 기본 단일 파일 유지, 향후 vi/th/ru/zh-TW 추가 시 분할 |
| 아랍어 RTL 환경에서 `process` step 순서가 시각적으로 역전돼 보임 | Medium | 선행 PDCA에서 RTL 인프라 완성됨. step 번호는 1→5 유지하되 CSS `flex-direction` 자동 적용. 시각 검수 필수 |
| 몽골어 키릴 음차와 영어 원어 병기 정책 미정 | Medium | **Design 단계에서 정책 확정**: "Ультерапи(Ulthera)" 형식 vs "Ulthera" 단독. 권장: 첫 등장 시 키릴 + 영어 병기, 이후 영어만 |
| 부분 번역 누락(필드 일부만 채움) | Low | `getLocalizedTreatment()` spread 머지로 자동 한국어 fallback. 단, **본 PDCA는 9 필드 전체 채움 원칙** 준수로 사전 방지 |
| 빌드 시간 증가 | Low | 단일 constants 파일 증가는 빌드에 미세 영향만 (현재 385 페이지 build) |
| 기존 EN/JA가 2/9만 채워진 상태와의 일관성 결여 | Medium | 섹션 11 결정 사항. 권장: 본 PDCA에서 FR/MN/AR은 9/9 완성, EN/JA 보완은 별도 PDCA |
| `RELATED_TREATMENTS_L10N`에서 `laser`(센터)는 시술 ID가 아닌데 같은 맵에 들어있음 | Low | ZH 패턴 따라 그대로 추가. 구조적 정합성은 별도 리팩터링 |
| 아랍어 텍스트 길이가 한국어 대비 1.5~2배 → 카드 UI overflow | Medium | 시술 상세 페이지 컴포넌트는 텍스트 길이 가변 대응(`flex-wrap`, `line-clamp` 사용). 시각 검수에서 확인 |
| 프랑스어 텍스트 길이도 한국어 대비 1.3~1.5배 (단어 길이) | Low | 동일. 컴포넌트 가변 대응 |
| 번역 검수 비용 | Medium | LLM 1차 → 출시 → 의료 전문가/네이티브 검수 단계적. 본 PDCA는 1차 번역까지 |

---

## 9. 구현 순서 (개략)

### 1단계 — Design 산출물
1. 의료 전문 용어집 확장 (50~80 용어 × 4 locale: ko/fr/mn/ar)
2. ZH LocaleMap 구조 분석 → FR/MN/AR 템플릿 설계
3. 파일 분할 여부 결정 (섹션 11 의사결정)
4. EN/JA 보완 분리 정책 확정
5. `liv-clinic/scripts/generate-treatments-i18n.mjs` 스크립트 설계 (옵션) — `ko.json` constants 기반 LLM 프롬프트 자동화

### 2단계 — Do
1. 의료 용어집 사전 정의 (`docs/02-design/glossary-fr-mn-ar.md`)
2. **FR LocaleMap 작성**:
   - 9 시술 × 9 필드 LLM 번역 + 용어집 반영
   - ZH 패턴 mirror
3. **MN LocaleMap 작성**:
   - 키릴 음차 정책 적용
4. **AR LocaleMap 작성**:
   - MSA 일관 사용, RTL 컨텍스트 고려한 어구 순서
5. `MAPS` 등록
6. `RELATED_TREATMENTS_L10N` 3 locale × 10 항목 추가
7. 타입체크 → 빌드 → lint 통과

### 3단계 — Check
1. `gap-detector` 실행 (Design 대비 구현 매치율)
2. 9 시술 × 3 locale = **27 페이지 조합** 스폿 체크 (전체는 무리, 핵심 6개: lifting/ulthera·thermage·shurink, antiaging/botox·filler·skinbooster)
3. 한국어 잔존 텍스트 grep으로 검증

### 4단계 — Act (필요 시)
- matchRate < 90% 시 `pdca-iterator` 자동 반복

### 5단계 — Report
- `report-generator`로 완료 보고서 생성

---

## 10. 다음 단계 (Next Phase)

- `/pdca design i18n-treatments-fr-mn-ar` — 용어집 작성, 파일 분할 여부 확정, EN/JA 분리 정책 확정, 번역 자동화 스크립트 설계
- `/pdca do i18n-treatments-fr-mn-ar` — FR/MN/AR 3개 LocaleMap 순차 구현
- `/pdca analyze i18n-treatments-fr-mn-ar` — 시술 페이지 27 조합 검증
- `/pdca report i18n-treatments-fr-mn-ar` — 완료 보고서 + 선행 PDCA 미해결 hotfix 종결 선언

---

## 11. 결정 필요 사항 (Design 진입 전 확인)

1. **EN/JA LocaleMap 보완 분리 정책**: 현재 EN/JA는 ulthera·thermage 2/9만 채워짐. 본 PDCA 범위에 포함할지 결정.
   - **권장 (A)**: 본 PDCA에서 FR/MN/AR 9/9만 완성 → 일관성 결여 해소는 별도 PDCA `i18n-treatments-en-ja-complete`로 분리. **본 PDCA 집중도 보존.**
   - 대안 (B): 본 PDCA에서 EN/JA 보완 7 시술 × 2 locale = 14 시술 추가 + FR/MN/AR 27 시술 = 총 41 시술 작업. 범위 +50% 증가.

2. **`treatmentsI18n.ts` 파일 분할 여부**: 본 PDCA 완료 시 ~1,800줄 예상.
   - **권장 (A)**: 분할하지 않음. 단일 파일 유지. 코딩 스타일 가이드(800줄)는 초과하나 constants 데이터 파일 특성상 허용. 리뷰는 locale별 섹션 헤더로 가독성 확보.
   - 대안 (B): `treatmentsI18n/` 디렉터리로 분할. `index.ts` + `{locale}.ts` 5~11개 파일. 향후 vi/th/ru/zh-TW 보완 대비 구조적 이점. 단, 본 PDCA 범위 증가.

3. **몽골어 영어 원어 병기 정책**: 시술명·기술명을 어떻게 표기할지.
   - 옵션 (A): 첫 등장 시 키릴 + 영어 병기 `Ультерапи(Ulthera)`, 이후 키릴
   - 옵션 (B): 영어 원어 그대로 `Ulthera Prime`
   - 옵션 (C): 키릴 전사만 `Ультерапи Прайм`
   - **권장**: 옵션 (A) — 의료 환자의 검색·정보 매칭 편의

4. **아랍어 locale code**: 선행 PDCA에서 `ar` 단일로 시작했음. 본 PDCA도 동일 정책 유지.
   - **확인 사항**: 별도 의사결정 없음 (선행 PDCA 정책 승계)

5. **번역 검수 정책**: LLM 1차 → 출시 → 네이티브 검수 vs 출시 전 부분 검수
   - **권장**: 선행 PDCA와 동일 정책 — LLM 1차 + 의료 용어집 강제 + 출시 후 의료 전문가/네이티브 검수 단계적

6. **`RELATED_TREATMENTS_L10N`의 `laser` 항목**: 현재 시술 ID가 아닌 센터/카테고리인데 같은 맵에 들어있음.
   - **권장**: 본 PDCA에서는 ZH 패턴 그대로 추가. 구조 정리는 별도 작업

---

## 12. 참고 자료

### 선행 PDCA
- `docs/01-plan/features/i18n-fr-mn-ar.plan.md` — 부모 PDCA Plan
- `docs/02-design/features/i18n-fr-mn-ar.design.md` — RTL/폰트/SEO 인프라 설계
- `docs/03-analysis/i18n-fr-mn-ar.analysis.md` — 84% 미달 사유 (treatmentsI18n 미반영)
- `docs/04-report/i18n-fr-mn-ar.report.md` — 조건부 완료 사유 명시

### 기존 LocaleMap 참조 패턴
- `liv-clinic/src/lib/treatmentsI18n.ts:35` — `ZH` (9/9 완성, **본 PDCA 템플릿**)
- `liv-clinic/src/lib/treatmentsI18n.ts:405` — `EN` (2/9, 미완성)
- `liv-clinic/src/lib/treatmentsI18n.ts:495` — `JA` (2/9, 미완성)
- `liv-clinic/src/lib/treatmentsI18n.ts:584` — `MAPS` (등록 지점)
- `liv-clinic/src/lib/treatmentsI18n.ts:616` — `RELATED_TREATMENTS_L10N` (관련 시술 명칭)

### 시술 데이터 baseline
- `liv-clinic/src/lib/constants.ts` — `TREATMENTS` 한국어 baseline (constants.ts)
- 시술 9종: ulthera, thermage, shurink, inmode, density, thread, botox, filler, skinbooster

### 사용 컴포넌트
- `liv-clinic/src/app/[locale]/lifting/[procedure]/page.tsx` (or 동등) — `getLocalizedTreatment()` 호출 지점
- `liv-clinic/src/app/[locale]/antiaging/[procedure]/page.tsx`

### 의료 용어집 참고
- WHO ICD-11 다국어 용어
- ISAPS (International Society of Aesthetic Plastic Surgery) — 시술명 표준
- 한국보건산업진흥원 의료관광 다국어 가이드
