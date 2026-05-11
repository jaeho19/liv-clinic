# i18n Tier 2 번역 인계 문서

> **작성일**: 2026-05-11 (최초)
> **갱신일**: 2026-05-11 (Batch 3, 4, 5a, 5b, 6 추가 진행)
> **상태**: 진행 중 (9 commits, 4,896 strings 번역 완료)
> **잔여**: fr 527 / mn 466 / ar 460 keys (~1,500 strings)
> **목적**: fr/mn/ar locale의 영어 잔존 문자열을 모두 현지어로 번역

---

## 1. 현재 상태 (master 브랜치, 9 commits push 완료)

| commit | 내용 | strings |
|--------|------|---------:|
| `50c55df` | middleware matcher fix — `/fr`, `/mn`, `/ar` 라우팅 silent fail 해결 | (인프라) |
| `7886544` | Tier 1: common/sections/contact/faq/chat 등 사용자 가시 핵심 영역 | 1,134 |
| `bf6bed4` | Tier 2 batch 1: treatments.lifting.{ulthera, thermage} 상세 | 591 |
| `1e668da` | Tier 2 batch 2: treatments.lifting.{density, inmode} 상세 | 621 |
| `5603a1e` | Tier 2 batch 3: treatments.lifting.{shurink, thread, aptos} 상세 | 609 |
| `d1dbeec` | Tier 2 batch 4: treatments.antiaging.{botox, filler, skinbooster, skincare} | 462 |
| `b34592a` | Tier 2 batch 5a: treatments.laser.{center, pigmentation, vascular} | 393 |
| `5ad7cda` | Tier 2 batch 5b: treatments.laser.{skintone, hairRemoval, tattoo} | 498 |
| `e952713` | Tier 2 batch 6: liftingPage + antiagingPage + laserPage 카테고리 메인 | 588 |

**완료 페이지** (3 locale 모두 정상 표시):
- 홈(`/`), 모든 nav/sections, footer, contact, faq, chat
- `/lifting` 메인 + 시술 상세 7개 (ulthera, thermage, density, inmode, shurink, thread, aptos)
- `/antiaging` 메인 + 시술 상세 4개 (botox, filler, skinbooster, skincare)
- `/laser` 메인 + 시술 상세 6개 (center, pigmentation, vascular, skintone, hairRemoval, tattoo)
- **= 모든 시술 상세 페이지 + 3개 카테고리 메인 페이지 번역 완료**

**영어 잔존 페이지**:
- `/about/equipment`, `/about` 잔여 항목
- `/signature` 페이지 body
- `/pricing` 페이지
- `/events`

---

## 2. 잔여 작업 — 권장 batch 순서

각 batch별 1 commit씩 처리. 시술명/브랜드명은 영문 유지(Ultherapy/Thermage/Density/InMode/Shurink/Morpheus8/FaceTite/Forma/Sculptra/Juvelook/Potenza/Clarity II/Lucas/Ulblanc/HIFU/RF/FDA/KFDA 등).

### ~~Batch 3~~ ✅ — treatments.lifting 잔여 (shurink + thread + aptos) — 609 strings → `5603a1e`

### ~~Batch 4~~ ✅ — treatments.antiaging 전체 (botox + filler + skinbooster + skincare) — 462 strings → `d1dbeec`

### ~~Batch 5a~~ ✅ — treatments.laser (center + pigmentation + vascular) — 393 strings → `b34592a`

### ~~Batch 5b~~ ✅ — treatments.laser 잔여 (skintone + hairRemoval + tattoo) — 498 strings → `5ad7cda`

### ~~Batch 6~~ ✅ — page-specific 1 (liftingPage + antiagingPage + laserPage) — 588 strings → `e952713`

### Batch 7 — page-specific 2 (signaturePage + equipmentPage + aboutPage + events) — **~194 keys × 3 = 582 strings**
- `signaturePage.*` (~62 keys)
- `equipmentPage.*` (~73 keys)
- `aboutPage.*` (~31 keys)
- `events.*` (~28 keys)

### Batch 8 — pricing + 잔여 자투리 — **~333 keys × 3 = ~1,000 strings**
- `pricing.*` (~89 keys, 라벨/헤더/카테고리/시술명)
- `treatments.*` 잔여 (~132 keys, lifting/antiaging/laser의 nav/categories/공통 항목)
- `sections.*` 잔여 (~40 keys)
- `liftingPage.*` 잔여 (~35 keys, 추가 항목)
- 기타 자투리 (`nav`, `contact`, `chat`, `common`, `medical`, `trust`, `floatingCta`, etc. ~30 keys)

**잔여 약 527 unique keys (fr) × 3 locale ≈ 1,500 strings (locale별 일부 중복 포함, 의도적 영문 유지 키 제외)**

---

## 3. 번역 파이프라인 (이미 구축됨)

### Scripts (in `liv-clinic/scripts/`)

| 파일 | 역할 |
|------|------|
| `i18n-extract-untranslated.mjs` | en.json과 diff하여 미번역 키 추출 (array는 자동 skip) |
| `i18n-apply-translations.mjs` | `_translated.{locale}.json`을 nested locale JSON에 머지 |

### Workflow (각 batch마다)

```bash
cd liv-clinic

# 1. 미번역 키 재추출
node scripts/i18n-extract-untranslated.mjs
# → scripts/_untranslated.fr.json (현재 1271 keys)
# → scripts/_untranslated.mn.json (현재 1241 keys)
# → scripts/_untranslated.ar.json (현재 1237 keys)

# 2. 해당 batch 키만 subset으로 추출 (Node script로)
node -e "
const fs=require('fs');
const u=JSON.parse(fs.readFileSync('scripts/_untranslated.fr.json','utf8'));
const subset={};
for(const k of Object.keys(u)){
  if(k.startsWith('treatments.lifting.shurink.')||k.startsWith('treatments.lifting.thread.')||k.startsWith('treatments.lifting.aptos.')){
    subset[k]=u[k];
  }
}
fs.writeFileSync('scripts/_subset.json',JSON.stringify(subset,null,2));
console.log('keys:',Object.keys(subset).length);
"

# 3. _subset.json을 읽어 fr/mn/ar 번역 생성:
#    scripts/_translated.fr.json
#    scripts/_translated.mn.json
#    scripts/_translated.ar.json
#    (Claude가 직접 Write tool로 생성)

# 4. 적용
node scripts/i18n-apply-translations.mjs

# 5. 검증
npx tsc --noEmit
npm run build  # ✓ 385/385 pages 통과해야 함

# 6. commit + push
cd ..
git add liv-clinic/src/messages/fr.json liv-clinic/src/messages/mn.json liv-clinic/src/messages/ar.json
git commit -m "fix(i18n): fr/mn/ar tier2 batchN — {section} ({M} strings)"
git push origin master
```

---

## 4. ⚠️ 중요 caveats (망가지면 빌드 실패)

### 4.1 Array 필드는 절대 string으로 덮어쓰지 말 것
136개 array-typed paths가 있음 (faqs, education, experience, features 등). Extract 스크립트는 array를 자동 skip하지만, **수동으로 array 경로에 string을 넣으면 안 됨**. 빌드 시 `.map is not a function` 에러.

손상되면 복원 스크립트:
```bash
node <<'EOF'
const fs=require('fs');
const en=JSON.parse(fs.readFileSync('src/messages/en.json','utf8'));
function findArrayPaths(o,p='',out=[]){for(const k in o){const v=o[k];const path=p?p+'.'+k:k;if(Array.isArray(v))out.push(path);else if(v&&typeof v==='object')findArrayPaths(v,path,out);}return out;}
function getByPath(o,k){return k.split('.').reduce((c,p)=>c&&c[p]!==undefined?c[p]:undefined,o);}
function setByPath(o,k,v){const ps=k.split('.');let c=o;for(let i=0;i<ps.length-1;i++){if(typeof c[ps[i]]!=='object')c[ps[i]]={};c=c[ps[i]];}c[ps[ps.length-1]]=v;}
const paths=findArrayPaths(en);
for(const l of ['fr','mn','ar']){
  const d=JSON.parse(fs.readFileSync('src/messages/'+l+'.json','utf8'));
  let r=0;
  for(const p of paths){if(!Array.isArray(getByPath(d,p))){setByPath(d,p,getByPath(en,p));r++;}}
  fs.writeFileSync('src/messages/'+l+'.json',JSON.stringify(d,null,2)+'\n');
  console.log(l,'restored:',r);
}
EOF
```

### 4.2 middleware.ts matcher 동기화 (이미 수정됨, 변경 금지)
`liv-clinic/src/middleware.ts:60`의 matcher는 `(ko|en|ja|zh|zh-TW|vi|th|ru|fr|mn|ar)`를 포함해야 함. **새 locale 추가 시 함께 수정 필수** (Next.js 제약상 정적 문자열만 가능).

### 4.3 브랜드명/고유명사 영문 유지
다음 단어들은 모든 locale에서 영문 유지:
- 시술/장비: `Ultherapy Prime`, `Thermage FLX`, `Density`, `InMode`, `Shurink`, `APTOS`, `Morpheus8`, `FaceTite`, `Forma`, `Potenza`, `Sculptra`, `Juvelook`, `Clarity II`, `Lucas`, `Ulblanc`, `Co2 Laser`
- 기술 약어: `HIFU`, `RF`, `FDA`, `KFDA`, `SMAS`, `MFU-V`, `DeepSEE`, `AccuREP`, `Comfort Pulse`, `PDRN`
- 회사: `Solta Medical`, `Merz Korea`
- 한국 지명/시설: `Sinsa Station`, `Naruteo-ro`, `Seocho-gu`, `Jaeun Building` (음역으로)
- 의사 이름: `Sooyoung Kim`, `Shinhye Cheon`, `Dr. ...` (romanized)

### 4.4 Locale별 스타일 규칙
| Locale | 규칙 |
|--------|------|
| `fr` | 프랑스 본토 표준 프랑스어. 의료 용어 정확성 우선. `é è ç ô à ù â` diacritics. 숫자 형식: `60-90 minutes`, `1,5 mm`(쉼표) |
| `mn` | Khalkha 키릴. 외래 브랜드명은 영문 유지(Cyrillic transliteration 함께 사용 가능 — 첫 등장 시). `Морфеус8` 아니라 `Morpheus8` |
| `ar` | MSA(Modern Standard Arabic). **서양 숫자 사용** (60-90 아니라 ٦٠-٩٠ 금지). 방언(이집트/걸프) 금지. RTL은 인프라가 처리 |

### 4.5 Plural / ICU 형식 보존
일부 키는 ICU 포맷 사용:
```
"chat.unreadAria": "{count, plural, one {1 new message} other {# new messages}}"
```
번역 시 ICU 구문(`{count, plural, ...}`, `{name}`, `<br />`, `<strong>` 등)을 **반드시 보존**.

---

## 5. 새 세션 시작용 프롬프트 (복붙용)

> 새 Claude Code 세션을 열고 아래 내용을 그대로 붙여넣으세요.

```
LIV 홈페이지 i18n 번역 작업을 이어서 진행해주세요.

## 이전 세션 진행 상황
- 9 commits master에 push됨 (50c55df, 7886544, bf6bed4, 1e668da, 5603a1e, d1dbeec, b34592a, 5ad7cda, e952713)
- 총 4,896 strings 번역 완료 (Tier 1 + Batch 1-6)
- 잔여 ~1,500 strings (fr 527 / mn 466 / ar 460 keys × 3 locale에서 일부 중복)

## 인계 문서 (먼저 읽기)
`docs/05-handoff/i18n-tier2-translation-handoff.md` 파일에 전체 컨텍스트, 파이프라인, batch 계획, caveats 정리되어 있어요. 이걸 먼저 읽어주세요.

## 작업
docs/05-handoff/i18n-tier2-translation-handoff.md 의 §2 권장 batch 순서대로 진행해주세요. Batch 7 (signaturePage + equipmentPage + aboutPage + events)부터 시작.

각 batch:
1. node scripts/i18n-extract-untranslated.mjs 실행
2. 해당 batch subset 추출 (Node one-liner)
3. _translated.{fr,mn,ar}.json에 번역 작성 (3개 locale 모두)
4. node scripts/i18n-apply-translations.mjs 로 적용
5. npm run build 검증 (385/385 pages 통과 필수)
6. commit + push

각 batch가 끝나면 다음 batch로 진행하기 전에 진행 상황을 1줄로 보고해주세요.

## 주의
- §4 caveats (특히 array 필드 보존, 브랜드명 영문 유지, locale별 스타일) 반드시 준수
- 출력 토큰 한계로 한 세션에 모든 batch를 다 못할 수 있음. 가능한 만큼만 진행하고 남은 건 그 다음 세션으로 인계
- 빌드 실패 시 즉시 중단하고 원인 보고
```

---

## 6. 자동화 옵션 (대안)

세션 기반 수동 처리가 부담스러우면 **Anthropic API 활용 스크립트** 작성 가능:

```javascript
// scripts/i18n-translate-bulk.mjs (예시 스켈레톤)
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const untranslated = JSON.parse(fs.readFileSync('scripts/_untranslated.fr.json', 'utf8'));
const batches = chunk(Object.entries(untranslated), 50); // 50개씩 batch

for (const batch of batches) {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system: '의료 시술 다국어 번역 전문가. 브랜드명/기술명 영문 유지. JSON으로만 응답.',
    messages: [{
      role: 'user',
      content: `다음 영어를 프랑스어로 번역. 키는 그대로, 값만 번역:\n\n${JSON.stringify(Object.fromEntries(batch), null, 2)}`,
    }],
  });
  // ... merge response into _translated.fr.json
}
```

비용 예상 (Opus 4.7 기준):
- 입력 ~150KB × 3 locale = 450KB ≈ 100K tokens × $15/1M = $1.5
- 출력 ~150KB × 3 locale = 450KB ≈ 100K tokens × $75/1M = $7.5
- **총 약 USD 9** (Sonnet 사용 시 1/5 비용, 품질 약간 하락)

이 스크립트는 별도 PDCA로 진행 가능 (`/pdca plan i18n-bulk-translation-api`).

---

## 7. 검증 체크리스트 (각 batch 종료 시)

- [ ] `npx tsc --noEmit` 0 errors
- [ ] `node scripts/verify-locale-keys.mjs` 11/11 in sync
- [ ] `npm run build` ✓ 385/385 pages
- [ ] 브랜드명 영문 유지 확인 (Ultherapy, Thermage 등)
- [ ] Array 필드 손상 없음 (faqs, education 등이 여전히 배열인지)
- [ ] ICU 포맷 유지 확인 (`{count, plural, ...}`, `<br />` 등)
- [ ] commit message 형식: `fix(i18n): fr/mn/ar tier2 batchN — {섹션} ({M} strings)`

---

## 8. 비상 복구

빌드가 깨지면:

1. **Array 손상**: §4.1의 복원 스크립트 실행
2. **JSON 구문 오류**: `node -e "JSON.parse(require('fs').readFileSync('src/messages/fr.json','utf8'))"` 로 어느 locale 깨졌는지 확인
3. **routing 오류**: middleware.ts:60 matcher 확인 (fr|mn|ar 포함되어야 함)
4. **전체 revert**: `git reset --hard 1e668da` (마지막 안정 commit으로)

---

## 9. 참고 파일

- 번역 글로서리: `docs/02-design/features/i18n-treatments-fr-mn-ar.design.md` §3 (72개 의료 용어 × 4 locale)
- 선행 PDCA: `docs/04-report/i18n-fr-mn-ar.report.md` (84% 조건부 완료 사유)
- treatmentsI18n 보고서: `docs/04-report/i18n-treatments-fr-mn-ar.report.md` (98% 완료)
