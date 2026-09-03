# 상담 준비 카드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손님이 자기 말로 쓴 고민을, 상담에서 쓸 수 있는 용어·시술 목록·질문 3개로 바꿔 주는 웹 도구를 만들고 관계자에게 시연한다.

**Architecture:** 홈의 고민 카드 → 3단계 폼 → `POST /api/consult-prep` → 결과 카드 4장 → 기존 문의 폼으로 전환. 서버는 LLM을 **분류·선택 용도로만** 1회 호출하고, 용어·시술·질문은 모두 원장 검수 CSV에서 빌드 시 생성된 상수를 조회한다. LLM이 실패하거나 없는 id를 돌려줘도 규칙표만으로 화면이 완성된다.

**Tech Stack:** Next.js 16 (App Router) · React 19 · next-intl 4 · Zod 4 · Supabase · Vitest · papaparse (빌드 스크립트 전용) · OpenAI chat.completions

**설계 문서:** `docs/superpowers/specs/2026-09-03-consult-prep-card-design.md`

## Global Constraints

- 모든 경로는 `liv-clinic/` 기준이다. **npm 명령은 반드시 `liv-clinic/`에서 실행한다.**
- `npm run verify:i18n`이 11개 로케일(`ko en ja zh zh-TW vi th ru fr mn ar`) 키 정합성을 강제한다. 어긋나면 `prebuild`에서 빌드가 실패한다.
- `src/messages/*.json`은 **줄 중간에 고립된 `\r`**이 있다. `/[^\r\n]*(?:\r*\n|$)/g` 방식 줄 분할은 그 바이트를 조용히 삼킨다. `\n`만 경계로 삼는 수동 분할 + `split(raw).join('') === raw` 라운드트립 검증을 반드시 통과시킨 뒤 편집한다.
- 이 PC는 TLS 가로채기 프록시 뒤에 있다. Node 스크립트에서 `fetch`를 쓰면 `NODE_TLS_REJECT_UNAUTHORIZED=0`이 필요하다. `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`이 필요하다.
- 1차 지원 언어는 `ko` `en` `ja` `zh` 4종. 나머지 7개 로케일에서는 진입점을 노출하지 않는다.
- 화면 문구 규칙 — 카드 2 제목은 **"이 부위를 다루는 시술"**이며 "추천"·"맞춤"·"최적"을 쓰지 않는다. 정렬은 점수순이 아니라 `displayOrder` 고정값이다.
- 삭제 불가 고지(모든 결과 화면 하단):
  > 이 안내는 진단이 아니며, 상담을 준비하기 위한 참고 자료입니다.
  > 개인차가 있으며 실제 시술 여부와 방법은 의료진 상담으로 결정됩니다.
- 커밋 메시지는 한국어 conventional commits (`feat(consult-prep): …`).

---

## File Structure

| 파일 | 책임 |
|---|---|
| `data/concern-rules.csv` | 고민×시술 규칙표 (원장·실장 검수) |
| `data/concern-terms.csv` | 용어 사전 |
| `data/prep-questions.csv` | 질문 은행 |
| `scripts/compile-concern-rules.mjs` | CSV 3종 → TS 상수 생성 + 검증. `prebuild`에서 실행 |
| `src/lib/data/concernRules.generated.ts` | 생성물 (커밋함) |
| `src/lib/consultPrep/types.ts` | 공유 타입 |
| `src/lib/consultPrep/adGuard.ts` | 금지어 검사. 문자열만 안다 |
| `src/lib/consultPrep/rules.ts` | 생성 상수 조회. 순수 함수. LLM을 모른다 |
| `src/lib/consultPrep/classify.ts` | LLM 1회 호출 + 반환값 정화. throw 하지 않는다 |
| `src/app/api/consult-prep/route.ts` | 유일한 서버 진입점 |
| `src/components/consultPrep/PrepWizard.tsx` | 3단계 폼 |
| `src/components/consultPrep/PrepResult.tsx` | 결과 카드 4장 |
| `src/app/[locale]/consult-prep/page.tsx` | 페이지 |
| `src/components/sections/ConcernPathways.tsx` | 링크 대상 변경 (수정) |
| `src/lib/analytics-events.ts` | 이벤트 4개 추가 (수정) |

---

## Task 1: 금지어 검사기 (`adGuard`)

가장 안쪽 단위. 의존성이 없고 다른 모든 태스크가 이걸 쓴다.

**Files:**
- Create: `src/lib/consultPrep/adGuard.ts`
- Test: `src/lib/consultPrep/__tests__/adGuard.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `checkAdCopy(text: string): { ok: boolean; hits: string[] }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/consultPrep/__tests__/adGuard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { checkAdCopy } from '../adGuard';

describe('checkAdCopy', () => {
  it('정상 문장은 통과시킨다', () => {
    expect(checkAdCopy('턱선이 흐려진 것이 신경 쓰이신다는 말씀이군요.')).toEqual({
      ok: true,
      hits: [],
    });
  });

  it('빈 문자열은 통과시킨다', () => {
    expect(checkAdCopy('')).toEqual({ ok: true, hits: [] });
  });

  it.each([
    ['최고의 시술입니다', '최고'],
    ['국내 유일한 장비', '유일'],
    ['강남 1위 병원', '1위'],
    ['100% 만족하실 겁니다', '100%'],
    ['완벽하게 개선됩니다', '완벽'],
    ['영구적으로 유지됩니다', '영구'],
    ['부작용 없는 시술', '부작용 없'],
    ['효과를 보장합니다', '보장'],
    ['확실하게 좋아집니다', '확실'],
    ['즉시 효과가 나타납니다', '즉시 효과'],
  ])('금지어를 잡는다: %s', (text, expected) => {
    const result = checkAdCopy(text);
    expect(result.ok).toBe(false);
    expect(result.hits).toContain(expected);
  });

  it('가격·할인 표현을 잡는다', () => {
    expect(checkAdCopy('30% 할인된 가격입니다').ok).toBe(false);
    expect(checkAdCopy('50만원에 가능합니다').ok).toBe(false);
  });

  it('전후 비교 표현을 잡는다', () => {
    expect(checkAdCopy('시술 전후 사진을 보세요').ok).toBe(false);
  });

  it('여러 금지어를 모두 모아서 돌려준다', () => {
    const result = checkAdCopy('최고의 시술로 완벽하게');
    expect(result.hits).toEqual(expect.arrayContaining(['최고', '완벽']));
    expect(result.hits).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/adGuard.test.ts`
Expected: FAIL — `Failed to resolve import "../adGuard"`

- [ ] **Step 3: 최소 구현을 쓴다**

`src/lib/consultPrep/adGuard.ts`:

```ts
/**
 * 의료광고 금지 표현 검사.
 *
 * 목록의 출처는 `ConcernPathways.tsx` 상단 주석의 운영 규칙이다.
 * 이 모듈은 무엇을 검사하는지 모른다 — 문자열을 받아 통과/차단만 돌려준다.
 * 호출부에서 차단된 문장은 대체하지 말고 **통째로 생략**한다.
 */

/** 단순 포함 검사 대상 */
const BANNED_SUBSTRINGS = [
  '최고',
  '유일',
  '1위',
  '100%',
  '완벽',
  '영구',
  '부작용 없',
  '보장',
  '확실',
  '즉시 효과',
] as const;

/** 정규식 검사 대상 — 히트 시 라벨을 hits에 넣는다 */
const BANNED_PATTERNS: ReadonlyArray<{ label: string; re: RegExp }> = [
  { label: '가격표현', re: /\d[\d,]*\s*(원|만원|만 원)/ },
  { label: '할인표현', re: /\d+\s*%\s*(할인|세일)/ },
  { label: '전후비교', re: /(시술|수술)\s*전후/ },
];

export interface AdCopyResult {
  ok: boolean;
  hits: string[];
}

export function checkAdCopy(text: string): AdCopyResult {
  const hits: string[] = [];

  for (const word of BANNED_SUBSTRINGS) {
    if (text.includes(word)) hits.push(word);
  }
  for (const { label, re } of BANNED_PATTERNS) {
    if (re.test(text)) hits.push(label);
  }

  return { ok: hits.length === 0, hits };
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/adGuard.test.ts`
Expected: PASS — 7 tests (`it.each` 10건 포함이면 16 assertions)

- [ ] **Step 5: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/lib/consultPrep/adGuard.ts liv-clinic/src/lib/consultPrep/__tests__/adGuard.test.ts
git commit -m "feat(consult-prep): 의료광고 금지어 검사기

ConcernPathways 주석의 운영 규칙을 코드 상수로 내린다. 문자열만 받아
통과/차단을 돌려주고, 무엇을 검사하는지는 호출부가 정한다."
```

---

## Task 2: 규칙표 CSV 3종 + 빌드 생성기

원장·실장이 엑셀로 편집하는 단일 진실 공급원과, 그것을 검증하며 TS로 굽는 스크립트.

**Files:**
- Create: `data/concern-rules.csv`, `data/concern-terms.csv`, `data/prep-questions.csv`
- Create: `scripts/compile-concern-rules.mjs`
- Create: `src/lib/consultPrep/types.ts`
- Create: `src/lib/data/concernRules.generated.ts` (스크립트가 생성)
- Modify: `package.json` (`prebuild`)
- Test: `scripts/__tests__/compile-concern-rules.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces: `CONCERN_RULES: ConcernRule[]` · `CONCERN_TERMS: ConcernTerm[]` · `PREP_QUESTIONS: PrepQuestion[]` · 타입 `PrepLang = 'ko' | 'en' | 'ja' | 'zh'` · `CONSULT_ONLY = 'consultOnly'`

- [ ] **Step 1: 타입 파일을 만든다**

`src/lib/consultPrep/types.ts`:

```ts
/** 1차 지원 언어. 나머지 7개 로케일에서는 진입점을 노출하지 않는다. */
export type PrepLang = 'ko' | 'en' | 'ja' | 'zh';
export const PREP_LANGS: readonly PrepLang[] = ['ko', 'en', 'ja', 'zh'] as const;

/**
 * TREATMENTS에 없는 특수 값. "수술 상담이 필요한 고민"을 표현한다.
 * 카드 2에는 상담 안내 행으로 렌더하고, 카드 4(소요시간·회복)에서는 제외한다.
 */
export const CONSULT_ONLY = 'consultOnly';

export interface ConcernRule {
  concernId: string;
  /** TREATMENTS의 id 또는 CONSULT_ONLY */
  treatmentId: string;
  displayOrder: number;
  reason: Record<PrepLang, string>;
  caution: Record<PrepLang, string>;
  reviewedBy: string;
  reviewedAt: string;
}

export interface ConcernTerm {
  termId: string;
  concernId: string;
  label: Record<PrepLang, string>;
  bodyArea: string;
}

export interface PrepQuestion {
  questionId: string;
  /** '*' | `concern:{id}` | `treatment:{id}` */
  appliesTo: string;
  text: Record<PrepLang, string>;
  /** TREATMENTS의 필드명. 답이 존재하지 않는 질문은 만들 수 없다. */
  answerSource: string;
}

/** answerSource로 허용되는 TREATMENTS 필드 */
export const ALLOWED_ANSWER_SOURCES = [
  'duration',
  'anesthesia',
  'recovery',
  'results',
  'cautions',
  'benefits',
  'process',
  'targetAreas',
  'idealFor',
] as const;

/** reviewed_by로 허용되는 값 */
export const ALLOWED_REVIEWERS = ['원장', '실장', '원장,실장'] as const;
```

- [ ] **Step 2: 규칙표 CSV를 만든다**

`data/concern-rules.csv` — `reviewed_at`은 실제 검수일로 교체하기 전까지 아래 값을 그대로 둔다:

```csv
concern_id,treatment_id,display_order,reason_ko,reason_en,reason_ja,reason_zh,caution_ko,caution_en,caution_ja,caution_zh,reviewed_by,reviewed_at
sagging,aptos,1,실을 넣어 처진 조직을 당겨 올리는 방식입니다,Threads are placed to lift sagging tissue,糸を挿入してたるんだ組織を引き上げる方法です,通过埋线提拉下垂组织,실 종류에 따라 유지 기간이 다릅니다,Duration varies by thread type,糸の種類により持続期間が異なります,持续时间因线材种类而异,"원장,실장",2026-09-10
sagging,thread,2,가는 실을 여러 개 넣어 라인을 정리합니다,Multiple fine threads refine the contour,細い糸を複数入れてラインを整えます,植入多根细线修饰轮廓,,,,,"원장,실장",2026-09-10
sagging,ulthera,3,초음파로 피부 깊은 층에 열을 전달합니다,Ultrasound delivers heat to deep skin layers,超音波で皮膚の深い層に熱を伝えます,超声波将热能传递至皮肤深层,임신·수유 중에는 시술하지 않습니다,Not performed during pregnancy or breastfeeding,妊娠中・授乳中は施術できません,孕期哺乳期不可进行,"원장,실장",2026-09-10
elasticity,ulthera,1,초음파로 피부 깊은 층에 열을 전달합니다,Ultrasound delivers heat to deep skin layers,超音波で皮膚の深い層に熱を伝えます,超声波将热能传递至皮肤深层,임신·수유 중에는 시술하지 않습니다,Not performed during pregnancy or breastfeeding,妊娠中・授乳中は施術できません,孕期哺乳期不可进行,"원장,실장",2026-09-10
elasticity,thermage,2,고주파로 진피층 콜라겐을 자극합니다,Radiofrequency stimulates collagen in the dermis,高周波で真皮層のコラーゲンを刺激します,射频刺激真皮层胶原蛋白,,,,,"원장,실장",2026-09-10
elasticity,density,3,초음파와 고주파를 함께 쓰는 장비입니다,Combines ultrasound and radiofrequency,超音波と高周波を併用する機器です,结合超声波与射频的设备,,,,,"원장,실장",2026-09-10
fundamental,consultOnly,1,수술적 방법은 상담에서 확인이 필요합니다,Surgical options require an in-person consultation,外科的方法は診察での確認が必要です,手术方式需面诊确认,,,,,"원장,실장",2026-09-10
fundamental,aptos,2,실을 넣어 처진 조직을 당겨 올리는 방식입니다,Threads are placed to lift sagging tissue,糸を挿入してたるんだ組織を引き上げる方法です,通过埋线提拉下垂组织,,,,,"원장,실장",2026-09-10
fundamental,ulthera,3,초음파로 피부 깊은 층에 열을 전달합니다,Ultrasound delivers heat to deep skin layers,超音波で皮膚の深い層に熱を伝えます,超声波将热能传递至皮肤深层,,,,,"원장,실장",2026-09-10
underEye,consultOnly,1,눈밑 지방 관련 수술은 상담에서 확인이 필요합니다,Under-eye fat procedures require an in-person consultation,目の下の脂肪に関する手術は診察での確認が必要です,眼下脂肪相关手术需面诊确认,,,,,"원장,실장",2026-09-10
underEye,filler,2,꺼진 부위에 볼륨을 채우는 방식입니다,Filler restores volume in hollow areas,へこんだ部位にボリュームを補います,填充凹陷部位,,,,,"원장,실장",2026-09-10
underEye,skinbooster,3,피부 자체의 수분과 탄력을 보충합니다,Boosters replenish hydration and elasticity,肌自体の水分と弾力を補います,补充皮肤水分与弹性,,,,,"원장,실장",2026-09-10
texture,skinbooster,1,피부 자체의 수분과 탄력을 보충합니다,Boosters replenish hydration and elasticity,肌自体の水分と弾力を補います,补充皮肤水分与弹性,,,,,"원장,실장",2026-09-10
texture,toning,2,레이저로 색소와 피부톤을 다룹니다,Laser addresses pigment and skin tone,レーザーで色素と肌のトーンを扱います,激光处理色素与肤色,,,,,"원장,실장",2026-09-10
texture,skincare,3,피부 상태에 맞춰 단계적으로 관리합니다,Care is staged to the current skin condition,肌の状態に合わせて段階的にケアします,根据皮肤状态分阶段护理,,,,,"원장,실장",2026-09-10
```

- [ ] **Step 3: 용어 사전 CSV를 만든다**

`data/concern-terms.csv`:

```csv
term_id,concern_id,label_ko,label_en,label_ja,label_zh,body_area
jawline_sagging,sagging,하악선 처짐,Jawline laxity,フェイスラインのたるみ,下颌线松弛,lower_face
nasolabial,sagging,팔자주름이 깊어진 상태,Deepened nasolabial folds,ほうれい線の深まり,法令纹加深,mid_face
double_chin,sagging,턱밑 이중 라인,Submental fullness,顎下の二重ライン,下巴双下颌,lower_face
skin_laxity,elasticity,피부 탄력 저하,Reduced skin elasticity,肌の弾力低下,皮肤弹性下降,full_face
fine_lines,elasticity,잔주름,Fine lines,小じわ,细纹,full_face
deep_sagging,fundamental,심부 조직 처짐,Deep tissue descent,深部組織のたるみ,深层组织下垂,full_face
volume_loss,fundamental,중안면 볼륨 저하,Midface volume loss,中顔面のボリューム低下,中面部容积流失,mid_face
under_eye_shadow,underEye,눈밑 그늘,Under-eye shadowing,目の下のくま,眼下阴影,under_eye
under_eye_bag,underEye,눈밑 지방 돌출,Under-eye fat protrusion,目の下の脂肪の突出,眼下脂肪突出,under_eye
enlarged_pores,texture,모공이 늘어난 상태,Enlarged pores,毛穴の開き,毛孔粗大,full_face
rough_texture,texture,피부결 거칠어짐,Rough skin texture,肌のキメの粗さ,肤质粗糙,full_face
dullness,texture,피부톤 칙칙함,Dull skin tone,肌のくすみ,肤色暗沉,full_face
```

- [ ] **Step 4: 질문 은행 CSV를 만든다**

`data/prep-questions.csv`:

```csv
question_id,applies_to,text_ko,text_en,text_ja,text_zh,answer_source
q_sessions,*,몇 회 정도 받아야 하나요?,How many sessions would I need?,何回くらい受ける必要がありますか?,大概需要做几次?,results
q_duration,*,한 번에 얼마나 걸리나요?,How long does one session take?,1回にどれくらいかかりますか?,一次需要多长时间?,duration
q_recovery,*,회복은 며칠 걸리나요?,How many days is the recovery?,回復に何日かかりますか?,恢复需要几天?,recovery
q_anesthesia,*,마취는 어떻게 하나요?,What kind of anesthesia is used?,麻酔はどうしますか?,如何麻醉?,anesthesia
q_cautions,*,제가 피해야 할 조건이 있나요?,Are there conditions that rule this out for me?,私が避けるべき条件はありますか?,我有需要避免的情况吗?,cautions
q_maintain,*,효과는 얼마나 유지되나요?,How long do the results last?,効果はどれくらい持続しますか?,效果能维持多久?,results
q_area,*,제가 신경 쓰는 부위에도 되나요?,Does this apply to the area I care about?,私が気にしている部位にも可能ですか?,我在意的部位也可以做吗?,targetAreas
q_fit,*,저 같은 경우에 맞는 편인가요?,Is this generally suitable for someone like me?,私のような場合に向いていますか?,像我这样的情况适合吗?,idealFor
q_process,*,시술은 어떤 순서로 진행되나요?,What are the steps of the procedure?,施術はどんな流れで進みますか?,治疗按什么流程进行?,process
q_thread_type,concern:sagging,실 종류에 따라 뭐가 달라지나요?,How do the thread types differ?,糸の種類で何が変わりますか?,不同线材有什么区别?,benefits
q_texture_order,concern:texture,여러 개를 받는다면 순서가 있나요?,If I do several, is there an order?,複数受ける場合、順番はありますか?,如果做多项，有先后顺序吗?,process
```

- [ ] **Step 5: 생성기 테스트를 쓴다**

`scripts/__tests__/compile-concern-rules.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRows } from '../compile-concern-rules.mjs';

const TREATMENT_IDS = new Set(['aptos', 'ulthera', 'thread']);

const okRule = {
  concern_id: 'sagging', treatment_id: 'aptos', display_order: '1',
  reason_ko: '설명', reason_en: 'r', reason_ja: 'r', reason_zh: 'r',
  caution_ko: '', caution_en: '', caution_ja: '', caution_zh: '',
  reviewed_by: '원장,실장', reviewed_at: '2026-09-10',
};

test('정상 규칙 행은 통과한다', () => {
  const errors = validateRows({ rules: [okRule], terms: [], questions: [] }, TREATMENT_IDS);
  assert.deepEqual(errors, []);
});

test('reviewed_by가 비면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reviewed_by: '' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /reviewed_by/);
});

test('reviewed_by가 허용값이 아니면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reviewed_by: '김원장' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.match(errors[0], /reviewed_by/);
});

test('treatment_id가 TREATMENTS에 없으면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, treatment_id: '없는시술' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.match(errors[0], /treatment_id/);
});

test('consultOnly는 TREATMENTS에 없어도 통과한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, treatment_id: 'consultOnly' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.deepEqual(errors, []);
});

test('answer_source가 허용 목록 밖이면 실패한다', () => {
  const q = {
    question_id: 'q1', applies_to: '*',
    text_ko: 'a', text_en: 'a', text_ja: 'a', text_zh: 'a',
    answer_source: 'price',
  };
  const errors = validateRows({ rules: [], terms: [], questions: [q] }, TREATMENT_IDS);
  assert.match(errors[0], /answer_source/);
});

test('reason_ko만 있고 번역이 비면 경고이지 오류가 아니다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reason_en: '', reason_ja: '', reason_zh: '' }], terms: [], questions: [] },
    TREATMENT_IDS);
  assert.deepEqual(errors, []);
});
```

- [ ] **Step 6: 실패를 확인한다**

Run: `cd liv-clinic && node --test scripts/__tests__/compile-concern-rules.test.mjs`
Expected: FAIL — `Cannot find module '../compile-concern-rules.mjs'`

- [ ] **Step 7: 생성기를 쓴다**

`scripts/compile-concern-rules.mjs`:

```js
#!/usr/bin/env node
/**
 * data/*.csv 3종을 검증하고 src/lib/data/concernRules.generated.ts 로 굽는다.
 *
 * prebuild 에서 verify:i18n 앞에 실행된다. 검증 실패는 빌드 실패다 —
 * 검수 안 된 문구와 답이 없는 질문이 배포되지 않게 하는 장치다.
 *
 * 생성물은 커밋한다. 빌드가 깨져도 이전 값으로 돌아갈 수 있고,
 * 규칙표 변경이 diff에 드러난다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'src', 'lib', 'data', 'concernRules.generated.ts');

const LANGS = ['ko', 'en', 'ja', 'zh'];
const ALLOWED_ANSWER_SOURCES = new Set([
  'duration', 'anesthesia', 'recovery', 'results', 'cautions',
  'benefits', 'process', 'targetAreas', 'idealFor',
]);
const ALLOWED_REVIEWERS = new Set(['원장', '실장', '원장,실장']);
const CONSULT_ONLY = 'consultOnly';

/** 검증만 한다. 파일 시스템을 모른다 (테스트를 위해 export). */
export function validateRows({ rules, terms, questions }, treatmentIds) {
  const errors = [];

  rules.forEach((r, i) => {
    const at = `concern-rules.csv:${i + 2}`;
    if (!r.concern_id) errors.push(`${at} concern_id 가 비었습니다`);
    if (!r.treatment_id) errors.push(`${at} treatment_id 가 비었습니다`);
    else if (r.treatment_id !== CONSULT_ONLY && !treatmentIds.has(r.treatment_id))
      errors.push(`${at} treatment_id '${r.treatment_id}' 가 TREATMENTS 에 없습니다`);
    if (!/^\d+$/.test(String(r.display_order ?? '')))
      errors.push(`${at} display_order 는 숫자여야 합니다`);
    if (!r.reason_ko) errors.push(`${at} reason_ko 가 비었습니다`);
    if (!r.reviewed_by) errors.push(`${at} reviewed_by 가 비었습니다 — 검수 전에는 배포할 수 없습니다`);
    else if (!ALLOWED_REVIEWERS.has(r.reviewed_by))
      errors.push(`${at} reviewed_by 는 '원장' · '실장' · '원장,실장' 만 허용됩니다 (받은 값: ${r.reviewed_by})`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.reviewed_at ?? '')))
      errors.push(`${at} reviewed_at 은 YYYY-MM-DD 형식이어야 합니다`);
  });

  terms.forEach((t, i) => {
    const at = `concern-terms.csv:${i + 2}`;
    if (!t.term_id) errors.push(`${at} term_id 가 비었습니다`);
    if (!t.concern_id) errors.push(`${at} concern_id 가 비었습니다`);
    if (!t.label_ko) errors.push(`${at} label_ko 가 비었습니다`);
  });

  questions.forEach((q, i) => {
    const at = `prep-questions.csv:${i + 2}`;
    if (!q.question_id) errors.push(`${at} question_id 가 비었습니다`);
    if (!q.text_ko) errors.push(`${at} text_ko 가 비었습니다`);
    if (!ALLOWED_ANSWER_SOURCES.has(q.answer_source))
      errors.push(`${at} answer_source '${q.answer_source}' 는 TREATMENTS 필드가 아닙니다 — 답이 없는 질문은 만들 수 없습니다`);
  });

  return errors;
}

function readCsv(name) {
  const text = fs.readFileSync(path.join(DATA, name), 'utf8');
  const { data, errors } = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  if (errors.length) throw new Error(`${name} 파싱 실패: ${errors[0].message}`);
  return data;
}

function langMap(row, prefix) {
  return Object.fromEntries(LANGS.map((l) => [l, row[`${prefix}_${l}`] || '']));
}

function warnMissingTranslations(rules) {
  for (const r of rules) {
    const missing = LANGS.filter((l) => l !== 'ko' && !r[`reason_${l}`]);
    if (missing.length) {
      console.warn(
        `[concern-rules] ${r.concern_id}/${r.treatment_id}: reason_${missing.join(', reason_')} 비어 있음 — 해당 언어에서는 시술명만 표시됩니다`
      );
    }
  }
}

async function main() {
  const { TREATMENTS } = await import('../src/lib/constants.ts');
  const treatmentIds = new Set(Object.values(TREATMENTS).flatMap((g) => Object.keys(g)));

  const rules = readCsv('concern-rules.csv');
  const terms = readCsv('concern-terms.csv');
  const questions = readCsv('prep-questions.csv');

  const errors = validateRows({ rules, terms, questions }, treatmentIds);
  if (errors.length) {
    console.error('[concern-rules] 검증 실패:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  warnMissingTranslations(rules);

  const body = `// 이 파일은 scripts/compile-concern-rules.mjs 가 생성합니다. 직접 수정하지 마세요.
// 원본: data/concern-rules.csv · data/concern-terms.csv · data/prep-questions.csv
import type { ConcernRule, ConcernTerm, PrepQuestion } from '@/lib/consultPrep/types';

export const CONCERN_RULES: ConcernRule[] = ${JSON.stringify(
    rules.map((r) => ({
      concernId: r.concern_id,
      treatmentId: r.treatment_id,
      displayOrder: Number(r.display_order),
      reason: langMap(r, 'reason'),
      caution: langMap(r, 'caution'),
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
    })),
    null,
    2
  )};

export const CONCERN_TERMS: ConcernTerm[] = ${JSON.stringify(
    terms.map((t) => ({
      termId: t.term_id,
      concernId: t.concern_id,
      label: langMap(t, 'label'),
      bodyArea: t.body_area,
    })),
    null,
    2
  )};

export const PREP_QUESTIONS: PrepQuestion[] = ${JSON.stringify(
    questions.map((q) => ({
      questionId: q.question_id,
      appliesTo: q.applies_to,
      text: langMap(q, 'text'),
      answerSource: q.answer_source,
    })),
    null,
    2
  )};
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(
    `[concern-rules] ok: 규칙 ${rules.length} · 용어 ${terms.length} · 질문 ${questions.length} → ${path.relative(ROOT, OUT)}`
  );
}

if (process.argv[1] && process.argv[1].endsWith('compile-concern-rules.mjs')) {
  main().catch((e) => {
    console.error('[concern-rules] ' + e.message);
    process.exit(1);
  });
}
```

- [ ] **Step 8: 테스트 통과를 확인한다**

Run: `cd liv-clinic && node --test scripts/__tests__/compile-concern-rules.test.mjs`
Expected: PASS — 7 tests

- [ ] **Step 9: 생성기를 실제로 돌린다**

Run: `cd liv-clinic && node scripts/compile-concern-rules.mjs`
Expected: `[concern-rules] ok: 규칙 15 · 용어 12 · 질문 11 → src\lib\data\concernRules.generated.ts`

번역 누락 경고가 나오면 정상이다(빈 `reason_en` 등). 오류로 종료되면 CSV를 고친다.

- [ ] **Step 10: prebuild에 건다**

`package.json`의 `prebuild`를 바꾼다:

```json
"prebuild": "node scripts/compile-concern-rules.mjs && npm run verify:i18n",
"test:rules": "node --test scripts/__tests__/compile-concern-rules.test.mjs"
```

- [ ] **Step 11: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/data liv-clinic/scripts/compile-concern-rules.mjs liv-clinic/scripts/__tests__ \
        liv-clinic/src/lib/consultPrep/types.ts liv-clinic/src/lib/data/concernRules.generated.ts \
        liv-clinic/package.json
git commit -m "feat(consult-prep): 원장 검수 규칙표 CSV 3종 + 빌드 생성기

고민×시술 규칙표·용어 사전·질문 은행을 엑셀로 편집 가능한 CSV로 두고
prebuild에서 TS 상수로 굽는다. 검증 실패는 빌드 실패다:
- reviewed_by 가 '원장'·'실장'·'원장,실장' 이 아니면 실패
- treatment_id 가 TREATMENTS 에 없으면 실패 (consultOnly 제외)
- answer_source 가 TREATMENTS 필드가 아니면 실패 — 답 없는 질문 금지
번역 누락은 경고만 내고 통과시킨다 (한국어부터 채우는 실제 순서를 막지 않는다)."
```

---

## Task 3: 규칙표 조회 (`rules`)

생성 상수를 읽는 순수 함수. LLM을 전혀 모른다.

**Files:**
- Create: `src/lib/consultPrep/rules.ts`
- Test: `src/lib/consultPrep/__tests__/rules.test.ts`

**Interfaces:**
- Consumes: Task 2의 `CONCERN_RULES` · `CONCERN_TERMS` · `PREP_QUESTIONS` · `PrepLang` · `CONSULT_ONLY`
- Produces:
  - `treatmentsFor(concernId: string): ConcernRule[]` — `displayOrder` 오름차순
  - `termsFor(concernId: string): ConcernTerm[]`
  - `questionsFor(concernId: string, treatmentIds: string[]): PrepQuestion[]`
  - `isKnownTerm(id: string): boolean` · `isKnownQuestion(id: string): boolean`
  - `pickText(map: Record<PrepLang, string>, lang: PrepLang): string` — 해당 언어가 비면 `''`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/consultPrep/__tests__/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  treatmentsFor, termsFor, questionsFor, isKnownTerm, isKnownQuestion, pickText,
} from '../rules';
import { CONSULT_ONLY } from '../types';

describe('treatmentsFor', () => {
  it('displayOrder 오름차순으로 돌려준다', () => {
    const rows = treatmentsFor('sagging');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.displayOrder)).toEqual([...rows.map((r) => r.displayOrder)].sort((a, b) => a - b));
  });

  it('sagging의 첫 시술은 aptos다 (고정 순서)', () => {
    expect(treatmentsFor('sagging')[0].treatmentId).toBe('aptos');
  });

  it('수술 상담이 필요한 고민은 consultOnly를 첫 행으로 둔다', () => {
    expect(treatmentsFor('underEye')[0].treatmentId).toBe(CONSULT_ONLY);
  });

  it('없는 고민에는 빈 배열을 돌려준다', () => {
    expect(treatmentsFor('nope')).toEqual([]);
  });
});

describe('termsFor', () => {
  it('해당 고민의 용어만 돌려준다', () => {
    const terms = termsFor('texture');
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.concernId === 'texture')).toBe(true);
  });
});

describe('questionsFor', () => {
  it("appliesTo가 '*'인 질문을 항상 포함한다", () => {
    const ids = questionsFor('texture', ['skinbooster']).map((q) => q.questionId);
    expect(ids).toContain('q_sessions');
  });

  it('concern 한정 질문은 해당 고민에서만 나온다', () => {
    expect(questionsFor('sagging', ['aptos']).map((q) => q.questionId)).toContain('q_thread_type');
    expect(questionsFor('texture', ['skinbooster']).map((q) => q.questionId)).not.toContain('q_thread_type');
  });
});

describe('isKnownTerm / isKnownQuestion', () => {
  it('실재하는 id에만 true를 준다', () => {
    expect(isKnownTerm('jawline_sagging')).toBe(true);
    expect(isKnownTerm('made_up')).toBe(false);
    expect(isKnownQuestion('q_sessions')).toBe(true);
    expect(isKnownQuestion('q_made_up')).toBe(false);
  });
});

describe('pickText', () => {
  it('해당 언어를 돌려준다', () => {
    expect(pickText({ ko: '가', en: 'a', ja: 'あ', zh: '啊' }, 'ja')).toBe('あ');
  });

  it('비어 있으면 빈 문자열을 돌려준다 (한국어로 흘리지 않는다)', () => {
    expect(pickText({ ko: '가', en: '', ja: '', zh: '' }, 'en')).toBe('');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/rules.test.ts`
Expected: FAIL — `Failed to resolve import "../rules"`

- [ ] **Step 3: 구현을 쓴다**

`src/lib/consultPrep/rules.ts`:

```ts
/**
 * 생성된 규칙표를 조회한다. 순수 함수만 두고 LLM·네트워크·DB를 모른다.
 *
 * 정렬은 반드시 displayOrder 고정값이다. 점수 정렬을 도입하면 화면이
 * '목록'에서 '추천'으로 바뀐다 — 설계 문서 §3 참조.
 */
import {
  CONCERN_RULES,
  CONCERN_TERMS,
  PREP_QUESTIONS,
} from '@/lib/data/concernRules.generated';
import type { ConcernRule, ConcernTerm, PrepQuestion, PrepLang } from './types';

export function treatmentsFor(concernId: string): ConcernRule[] {
  return CONCERN_RULES.filter((r) => r.concernId === concernId).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function termsFor(concernId: string): ConcernTerm[] {
  return CONCERN_TERMS.filter((t) => t.concernId === concernId);
}

export function questionsFor(concernId: string, treatmentIds: string[]): PrepQuestion[] {
  const wanted = new Set([
    '*',
    `concern:${concernId}`,
    ...treatmentIds.map((id) => `treatment:${id}`),
  ]);
  return PREP_QUESTIONS.filter((q) => wanted.has(q.appliesTo));
}

const TERM_IDS = new Set(CONCERN_TERMS.map((t) => t.termId));
const QUESTION_IDS = new Set(PREP_QUESTIONS.map((q) => q.questionId));

export function isKnownTerm(id: string): boolean {
  return TERM_IDS.has(id);
}

export function isKnownQuestion(id: string): boolean {
  return QUESTION_IDS.has(id);
}

/** 해당 언어 문자열. 비어 있으면 빈 문자열 — 한국어로 흘리지 않는다. */
export function pickText(map: Record<PrepLang, string>, lang: PrepLang): string {
  return map[lang] ?? '';
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/rules.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/lib/consultPrep/rules.ts liv-clinic/src/lib/consultPrep/__tests__/rules.test.ts
git commit -m "feat(consult-prep): 규칙표 조회 순수 함수

displayOrder 고정 정렬. 점수 정렬을 쓰지 않는 것이 '목록'과 '추천'을 가른다.
번역이 비면 한국어로 흘리지 않고 빈 문자열을 돌려준다."
```

---

## Task 4: LLM 분류기 (`classify`)

LLM을 1회 호출하고, 돌아온 것을 **전부 의심한다.** 절대 throw 하지 않는다.

**Files:**
- Create: `src/lib/consultPrep/classify.ts`
- Test: `src/lib/consultPrep/__tests__/classify.test.ts`

**Interfaces:**
- Consumes: Task 1 `checkAdCopy` · Task 3 `treatmentsFor` `termsFor` `questionsFor` `isKnownTerm` `isKnownQuestion` · Task 2 타입
- Produces:
```ts
export interface PrepSelection {
  termIds: string[];
  treatmentIds: string[];
  questionIds: string[];
  restatement: string;   // 금지어 차단 시 ''
  lowConfidence: boolean;
}
export function classify(input: {
  concernId: string; description: string; lang: PrepLang;
}): Promise<PrepSelection>;
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/consultPrep/__tests__/classify.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function importClassify() {
  vi.resetModules();
  return (await import('../classify')).classify;
}

function okResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
  };
}

const INPUT = { concernId: 'sagging', description: '턱선이 흐려졌어요', lang: 'ko' as const };

describe('classify', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it('정상 응답을 그대로 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: ['jawline_sagging'],
      treatment_ids: ['aptos', 'ulthera'],
      question_ids: ['q_sessions', 'q_recovery', 'q_cautions'],
      restatement: '턱선이 흐려진 것이 신경 쓰이신다는 말씀이군요.',
      confidence: 'high',
    })));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.termIds).toEqual(['jawline_sagging']);
    expect(out.treatmentIds).toEqual(['aptos', 'ulthera']);
    expect(out.questionIds).toHaveLength(3);
    expect(out.restatement).toContain('턱선');
    expect(out.lowConfidence).toBe(false);
  });

  it('사전에 없는 term_id는 버린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: ['jawline_sagging', '지어낸용어'],
      treatment_ids: ['aptos'],
      question_ids: ['q_sessions'],
      restatement: '',
      confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).termIds).toEqual(['jawline_sagging']);
  });

  it('규칙표에 없는 treatment_id는 버린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos', 'botox'], question_ids: [],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    // botox 는 sagging 규칙표에 없다
    expect((await classify(INPUT)).treatmentIds).toEqual(['aptos']);
  });

  it('treatment_ids가 비면 규칙표 상위 3개로 채운다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: [], question_ids: [],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
  });

  it('금지어가 든 restatement는 통째로 생략한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '최고의 결과를 보장합니다',
      confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).restatement).toBe('');
  });

  it('question_ids가 3개 미만이면 규칙표에서 채워 3개를 만든다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: ['q_sessions'],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.questionIds).toHaveLength(3);
    expect(out.questionIds[0]).toBe('q_sessions');
  });

  it('API 실패해도 throw 하지 않고 규칙표 결과를 돌려준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
    expect(out.questionIds).toHaveLength(3);
    expect(out.restatement).toBe('');
    expect(out.lowConfidence).toBe(true);
  });

  it('JSON이 아닌 응답도 throw 하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '안녕하세요' } }] }),
    }));
    const classify = await importClassify();
    expect((await classify(INPUT)).lowConfidence).toBe(true);
  });

  it('API 키가 없어도 throw 하지 않는다', async () => {
    delete process.env.OPENAI_API_KEY;
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.treatmentIds.length).toBeGreaterThan(0);
    expect(out.lowConfidence).toBe(true);
  });

  it("confidence가 'low'면 lowConfidence를 세운다", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '', confidence: 'low',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).lowConfidence).toBe(true);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/classify.test.ts`
Expected: FAIL — `Failed to resolve import "../classify"`

- [ ] **Step 3: 구현을 쓴다**

`src/lib/consultPrep/classify.ts`:

```ts
import 'server-only';

/**
 * LLM을 1회 호출해 **고르게만** 한다.
 *
 * 생성하는 것은 restatement 한 문장뿐이고, 그것도 금지어 검사를 통과해야 살아남는다.
 * 용어·시술·질문은 전부 사전/규칙표/은행에 실재하는 id여야 하며, 아니면 버린다.
 *
 * translation.ts 와 같은 throw-free 계약을 따른다 — 무슨 일이 나도 화면은 나온다.
 * 실패 시 규칙표만으로 결과를 만들고 lowConfidence 를 세운다.
 */
import { checkAdCopy } from './adGuard';
import { treatmentsFor, termsFor, questionsFor, isKnownTerm, isKnownQuestion } from './rules';
import type { PrepLang } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_CONSULT_PREP_MODEL ?? 'gpt-5.6-luna';
const TIMEOUT_MS = Number(process.env.CONSULT_PREP_TIMEOUT_MS ?? 5000);
const MAX_OUTPUT_TOKENS = 500;
const QUESTION_COUNT = 3;
const TREATMENT_COUNT = 3;

export interface PrepSelection {
  termIds: string[];
  treatmentIds: string[];
  questionIds: string[];
  /** 금지어에 걸리면 빈 문자열 */
  restatement: string;
  lowConfidence: boolean;
}

interface RawSelection {
  term_ids?: unknown;
  treatment_ids?: unknown;
  question_ids?: unknown;
  restatement?: unknown;
  confidence?: unknown;
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** 규칙표만으로 만드는 안전한 기본값 */
function fallback(concernId: string): PrepSelection {
  const treatmentIds = treatmentsFor(concernId).slice(0, TREATMENT_COUNT).map((r) => r.treatmentId);
  return {
    termIds: termsFor(concernId).slice(0, 1).map((t) => t.termId),
    treatmentIds,
    questionIds: questionsFor(concernId, treatmentIds).slice(0, QUESTION_COUNT).map((q) => q.questionId),
    restatement: '',
    lowConfidence: true,
  };
}

function buildPrompt(concernId: string, lang: PrepLang): string {
  const terms = termsFor(concernId);
  const rules = treatmentsFor(concernId);
  const questions = questionsFor(concernId, rules.map((r) => r.treatmentId));

  return [
    `You classify a cosmetic-clinic visitor's free-text concern. You do NOT diagnose, recommend, or invent.`,
    ``,
    `Choose ONLY from these ids. Never output an id that is not listed.`,
    ``,
    `TERM IDS: ${terms.map((t) => `${t.termId} (${t.label.ko})`).join(' | ')}`,
    `TREATMENT IDS: ${rules.map((r) => r.treatmentId).join(' | ')}`,
    `QUESTION IDS: ${questions.map((q) => `${q.questionId} (${q.text.ko})`).join(' | ')}`,
    ``,
    `Return ONLY a JSON object, no markdown fence:`,
    `{"term_ids":[],"treatment_ids":[],"question_ids":[],"restatement":"","confidence":"high"}`,
    ``,
    `Rules:`,
    `1. term_ids: up to 3, the terms that match what the visitor described.`,
    `2. treatment_ids: up to ${TREATMENT_COUNT}, only ids from TREATMENT IDS. Order does not matter — the UI re-sorts.`,
    `3. question_ids: exactly ${QUESTION_COUNT} ids from QUESTION IDS, the most useful for this visitor.`,
    `4. restatement: ONE sentence in ${lang}, restating what the visitor said so they feel understood.`,
    `   Do NOT name a diagnosis, do NOT promise any result, do NOT mention price or duration.`,
    `   If you cannot do this safely, return an empty string.`,
    `5. confidence: "low" if the description is too short or unrelated, else "high".`,
  ].join('\n');
}

async function callModel(prompt: string, userText: string): Promise<RawSelection | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userText },
        ],
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        reasoning_effort: process.env.CONSULT_PREP_REASONING_EFFORT || 'none',
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    return JSON.parse(content) as RawSelection;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function classify(input: {
  concernId: string;
  description: string;
  lang: PrepLang;
}): Promise<PrepSelection> {
  const { concernId, description, lang } = input;
  const base = fallback(concernId);

  const raw = await callModel(buildPrompt(concernId, lang), description);
  if (!raw) return base;

  const allowedTreatments = new Set(treatmentsFor(concernId).map((r) => r.treatmentId));

  const termIds = asStringArray(raw.term_ids).filter(isKnownTerm).slice(0, 3);

  let treatmentIds = asStringArray(raw.treatment_ids)
    .filter((id) => allowedTreatments.has(id))
    .slice(0, TREATMENT_COUNT);
  if (treatmentIds.length === 0) treatmentIds = base.treatmentIds;

  const questionIds = asStringArray(raw.question_ids).filter(isKnownQuestion);
  for (const q of questionsFor(concernId, treatmentIds)) {
    if (questionIds.length >= QUESTION_COUNT) break;
    if (!questionIds.includes(q.questionId)) questionIds.push(q.questionId);
  }

  const candidate = typeof raw.restatement === 'string' ? raw.restatement.trim() : '';
  const restatement = candidate && checkAdCopy(candidate).ok ? candidate : '';

  return {
    termIds: termIds.length ? termIds : base.termIds,
    treatmentIds,
    questionIds: questionIds.slice(0, QUESTION_COUNT),
    restatement,
    lowConfidence: raw.confidence === 'low',
  };
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/classify.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/lib/consultPrep/classify.ts liv-clinic/src/lib/consultPrep/__tests__/classify.test.ts
git commit -m "feat(consult-prep): LLM 분류기 — 고르게만 하고 지어내지 못하게

translation.ts의 throw-free 계약을 따른다. 사전·규칙표·은행에 없는 id는
버리고, treatment_ids가 비면 규칙표 상위 3개로 채우고, restatement가
금지어에 걸리면 통째로 생략한다. API 키가 없거나 호출이 실패해도
규칙표만으로 결과가 나온다."
```

---

## Task 5: API 라우트

**Files:**
- Create: `src/app/api/consult-prep/route.ts`
- Test: `src/lib/consultPrep/__tests__/buildResult.test.ts`
- Create: `src/lib/consultPrep/buildResult.ts`

**Interfaces:**
- Consumes: Task 4 `classify` · Task 3 조회 함수 · `TREATMENTS`(`@/lib/constants`)
- Produces:
```ts
export interface PrepCardResult {
  restatement: string;
  lowConfidence: boolean;
  terms: Array<{ id: string; label: string }>;
  treatments: Array<{
    id: string; name: string; reason: string; caution: string;
    consultOnly: boolean; href: string | null;
    duration: string; anesthesia: string; recovery: string; cautions: string[];
  }>;
  questions: Array<{ id: string; text: string }>;
}
export function buildResult(sel: PrepSelection, concernId: string, lang: PrepLang): PrepCardResult;
```

`buildResult`를 라우트에서 분리하는 이유: 라우트는 vitest(node 환경)에서 직접 테스트하기 번거롭고, 값 조립 로직이 실제 위험 지점이기 때문이다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/consultPrep/__tests__/buildResult.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildResult } from '../buildResult';
import { CONSULT_ONLY } from '../types';

const SEL = {
  termIds: ['jawline_sagging'],
  treatmentIds: ['ulthera', 'aptos'],
  questionIds: ['q_sessions', 'q_recovery', 'q_cautions'],
  restatement: '턱선이 신경 쓰이신다는 말씀이군요.',
  lowConfidence: false,
};

describe('buildResult', () => {
  it('시술을 displayOrder 순으로 재정렬한다 (LLM 순서를 믿지 않는다)', () => {
    const out = buildResult(SEL, 'sagging', 'ko');
    expect(out.treatments.map((t) => t.id)).toEqual(['aptos', 'ulthera']);
  });

  it('시술 이름과 사유를 채운다', () => {
    const out = buildResult(SEL, 'sagging', 'ko');
    expect(out.treatments[0].name).toBe('압토스 바이오 리프팅');
    expect(out.treatments[0].reason).toContain('실');
  });

  it('카드 4 필드를 TREATMENTS에서 가져온다', () => {
    const t = buildResult(SEL, 'sagging', 'ko').treatments.find((x) => x.id === 'ulthera')!;
    expect(t.duration).toBe('60-90분');
    expect(t.recovery).toBe('즉시 일상 복귀 가능');
    expect(t.cautions.length).toBeGreaterThan(0);
  });

  it('consultOnly는 이름만 두고 소요시간·회복을 비운다', () => {
    const out = buildResult(
      { ...SEL, treatmentIds: [CONSULT_ONLY, 'filler'] }, 'underEye', 'ko');
    const row = out.treatments.find((t) => t.consultOnly)!;
    expect(row.duration).toBe('');
    expect(row.href).toBeNull();
    expect(row.reason).toContain('상담');
  });

  it('용어와 질문을 해당 언어로 채운다', () => {
    const out = buildResult(SEL, 'sagging', 'en');
    expect(out.terms[0].label).toBe('Jawline laxity');
    expect(out.questions[0].text).toBe('How many sessions would I need?');
  });

  it('없는 id는 조용히 건너뛴다', () => {
    const out = buildResult({ ...SEL, termIds: ['nope'], questionIds: ['nope'] }, 'sagging', 'ko');
    expect(out.terms).toEqual([]);
    expect(out.questions).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/buildResult.test.ts`
Expected: FAIL — `Failed to resolve import "../buildResult"`

- [ ] **Step 3: `buildResult`를 쓴다**

`src/lib/consultPrep/buildResult.ts`:

```ts
/**
 * 선택 결과(id 목록)를 화면이 그대로 그릴 수 있는 값으로 조립한다.
 *
 * 정렬은 여기서 다시 displayOrder 로 강제한다 — LLM이 돌려준 순서를 믿지 않는다.
 */
import { TREATMENTS } from '@/lib/constants';
import { treatmentsFor, termsFor, questionsFor, pickText } from './rules';
import { CONSULT_ONLY, type PrepLang } from './types';
import type { PrepSelection } from './classify';

const TREATMENT_HREF: Record<string, string> = {
  ulthera: '/lifting/ulthera',
  thermage: '/lifting/thermage',
  shurink: '/lifting/shurink',
  density: '/lifting/density',
  inmode: '/lifting/inmode',
  thread: '/lifting/thread',
  aptos: '/lifting/aptos',
  onda: '/lifting/onda',
  botox: '/antiaging/botox',
  filler: '/antiaging/filler',
  skinbooster: '/antiaging/skinbooster',
  skincare: '/antiaging/skincare',
};

interface TreatmentMeta {
  name: string;
  duration: string;
  anesthesia: string;
  recovery: string;
  cautions: string[];
}

function metaOf(id: string): TreatmentMeta | null {
  for (const group of Object.values(TREATMENTS)) {
    const t = (group as Record<string, unknown>)[id] as
      | { name: string; duration?: string; anesthesia?: string; recovery?: string; cautions?: string[] }
      | undefined;
    if (t) {
      return {
        name: t.name,
        duration: t.duration ?? '',
        anesthesia: t.anesthesia ?? '',
        recovery: t.recovery ?? '',
        cautions: t.cautions ?? [],
      };
    }
  }
  return null;
}

export interface PrepCardResult {
  restatement: string;
  lowConfidence: boolean;
  terms: Array<{ id: string; label: string }>;
  treatments: Array<{
    id: string;
    name: string;
    reason: string;
    caution: string;
    consultOnly: boolean;
    href: string | null;
    duration: string;
    anesthesia: string;
    recovery: string;
    cautions: string[];
  }>;
  questions: Array<{ id: string; text: string }>;
}

export function buildResult(
  sel: PrepSelection,
  concernId: string,
  lang: PrepLang
): PrepCardResult {
  const picked = new Set(sel.treatmentIds);
  const rules = treatmentsFor(concernId).filter((r) => picked.has(r.treatmentId));

  const treatments = rules.map((r) => {
    const consultOnly = r.treatmentId === CONSULT_ONLY;
    const meta = consultOnly ? null : metaOf(r.treatmentId);
    return {
      id: r.treatmentId,
      name: meta?.name ?? '',
      reason: pickText(r.reason, lang),
      caution: pickText(r.caution, lang),
      consultOnly,
      href: consultOnly ? null : TREATMENT_HREF[r.treatmentId] ?? null,
      duration: meta?.duration ?? '',
      anesthesia: meta?.anesthesia ?? '',
      recovery: meta?.recovery ?? '',
      cautions: meta?.cautions ?? [],
    };
  });

  const termById = new Map(termsFor(concernId).map((t) => [t.termId, t]));
  const terms = sel.termIds
    .map((id) => termById.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({ id: t.termId, label: pickText(t.label, lang) }));

  const qById = new Map(
    questionsFor(concernId, sel.treatmentIds).map((q) => [q.questionId, q])
  );
  const questions = sel.questionIds
    .map((id) => qById.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({ id: q.questionId, text: pickText(q.text, lang) }));

  return {
    restatement: sel.restatement,
    lowConfidence: sel.lowConfidence,
    terms,
    treatments,
    questions,
  };
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `cd liv-clinic && npx vitest run src/lib/consultPrep/__tests__/buildResult.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: 라우트를 쓴다**

`src/app/api/consult-prep/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { classify } from '@/lib/consultPrep/classify';
import { buildResult, type PrepCardResult } from '@/lib/consultPrep/buildResult';
import { treatmentsFor } from '@/lib/consultPrep/rules';
import { PREP_LANGS, type PrepLang } from '@/lib/consultPrep/types';

const schema = z.object({
  concernId: z.string().min(1).max(40),
  // 설계 §12-2: 자유 서술은 필수. 문턱을 낮추려 최소 2자만 요구한다.
  description: z.string().trim().min(2, '어떤 점이 신경 쓰이는지 적어주세요').max(500),
  lang: z.enum(PREP_LANGS as unknown as [PrepLang, ...PrepLang[]]),
});

export interface ConsultPrepResponse {
  success: boolean;
  data?: PrepCardResult;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json<ConsultPrepResponse>(
        { success: false, error: parsed.error.issues[0]?.message ?? '입력이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    const { concernId, description, lang } = parsed.data;

    // 없는 고민 id면 규칙표가 비어 카드가 못 나온다 — 여기서 끊는다.
    if (treatmentsFor(concernId).length === 0) {
      return NextResponse.json<ConsultPrepResponse>(
        { success: false, error: '알 수 없는 고민 항목입니다' },
        { status: 400 }
      );
    }

    const selection = await classify({ concernId, description, lang });
    return NextResponse.json<ConsultPrepResponse>(
      { success: true, data: buildResult(selection, concernId, lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error('consult-prep API error:', error);
    return NextResponse.json<ConsultPrepResponse>(
      { success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: 타입 검사**

Run: `cd liv-clinic && npx tsc --noEmit -p tsconfig.json`
Expected: 오류 0

- [ ] **Step 7: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/lib/consultPrep/buildResult.ts \
        liv-clinic/src/lib/consultPrep/__tests__/buildResult.test.ts \
        liv-clinic/src/app/api/consult-prep/route.ts
git commit -m "feat(consult-prep): 결과 조립기 + API 라우트

buildResult가 displayOrder로 다시 정렬한다 — LLM이 돌려준 순서를 믿지 않는다.
consultOnly 행은 이름·소요시간·링크를 비우고 상담 안내만 남긴다.
자유 서술은 최소 2자 필수(설계 §12-2)."
```

---

## Task 6: i18n 키 (11개 로케일)

UI보다 먼저 넣는다. 키가 없으면 `next-intl`이 렌더 시점에 던진다.

**Files:**
- Modify: `src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,fr,mn,ar}.json`
- Create: `scripts/_i18n-work/add-consult-prep-keys.mjs` (일회성 삽입 스크립트)

**Interfaces:**
- Produces: `consultPrep` 네임스페이스 22키

- [ ] **Step 1: 삽입 스크립트를 쓴다**

`scripts/_i18n-work/add-consult-prep-keys.mjs`:

```js
/**
 * consultPrep 네임스페이스를 11개 로케일에 삽입한다.
 *
 * 메시지 JSON은 줄 중간에 고립된 \r 이 있어(예: ko.json 의 chat.promoCta 줄)
 * 정규식 줄 분할이 바이트를 삼킨다. \n 만 경계로 삼고, 편집 전에
 * 라운드트립을 반드시 확인한다.
 *
 * 1차 지원 언어(ko/en/ja/zh) 외 7개 로케일에는 en 문구를 넣는다 —
 * 그 로케일에서는 진입점을 노출하지 않으므로 화면에 뜨지 않고,
 * verify:i18n 의 키 정합성만 만족시키면 된다.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'D:/dev/LIV_homepage/liv-clinic/src/messages/';
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const WRITE = process.argv.includes('--write');

const T = {
  ko: {
    title: '상담 준비 카드', step1Title: '이 고민이 맞으신가요?',
    step2Title: '어떻게 보이는 게 제일 신경 쓰이세요?',
    step2Placeholder: '예) 웃을 때 턱선이 흐려 보여요 / 오후만 되면 처져 보여요 / 사진에서 나이 들어 보여요',
    step2Required: '한 줄만 적어주세요 (2자 이상)',
    step3Title: '언제까지 필요하세요?',
    step3None: '특별한 일정 없음', step3Wedding: '자녀 결혼식', step3Meeting: '상견례',
    step3Reunion: '동창회·모임', step3Holiday: '명절', step3Stay: '한국 체류 기간',
    next: '다음', back: '이전', submit: '결과 보기', loading: '정리하고 있습니다',
    card1Title: '말씀하신 건 보통 이렇게 부릅니다',
    card2Title: '이 부위를 다루는 시술',
    card3Title: '상담에서 물어보세요',
    card4Title: '참고',
    lowConfidence: '조금 더 자세히 적어주시면 정확해집니다.',
    consultOnly: '상담에서 확인이 필요합니다',
    labelDuration: '소요시간', labelAnesthesia: '마취', labelRecovery: '회복', labelCautions: '주의사항',
    disclaimer: '이 안내는 진단이 아니며, 상담을 준비하기 위한 참고 자료입니다. 개인차가 있으며 실제 시술 여부와 방법은 의료진 상담으로 결정됩니다.',
    ctaInquiry: '이대로 상담 문의하기',
    error: '잠시 후 다시 시도해주세요.',
  },
  en: {
    title: 'Consultation Prep', step1Title: 'Is this your concern?',
    step2Title: 'What bothers you most about how it looks?',
    step2Placeholder: 'e.g. My jawline blurs when I smile / It looks saggy by afternoon / I look older in photos',
    step2Required: 'Please write one line (2+ characters)',
    step3Title: 'By when do you need this?',
    step3None: 'No particular date', step3Wedding: "My child's wedding", step3Meeting: 'Family meeting',
    step3Reunion: 'Reunion or gathering', step3Holiday: 'Holiday', step3Stay: 'Stay in Korea',
    next: 'Next', back: 'Back', submit: 'See result', loading: 'Organizing',
    card1Title: 'What you described is usually called',
    card2Title: 'Treatments that address this area',
    card3Title: 'Ask these at your consultation',
    card4Title: 'Reference',
    lowConfidence: 'A little more detail would make this more accurate.',
    consultOnly: 'Needs to be confirmed at consultation',
    labelDuration: 'Duration', labelAnesthesia: 'Anesthesia', labelRecovery: 'Recovery', labelCautions: 'Cautions',
    disclaimer: 'This is not a diagnosis. It is reference material to help you prepare for a consultation. Results vary by individual, and whether and how a procedure is performed is decided through consultation with medical staff.',
    ctaInquiry: 'Send this as an inquiry',
    error: 'Please try again in a moment.',
  },
  ja: {
    title: 'カウンセリング準備カード', step1Title: 'このお悩みで合っていますか?',
    step2Title: '見た目でいちばん気になるのはどこですか?',
    step2Placeholder: '例) 笑うとフェイスラインがぼやける / 午後になるとたるんで見える / 写真で老けて見える',
    step2Required: '一行だけ書いてください (2文字以上)',
    step3Title: 'いつまでに必要ですか?',
    step3None: '特に予定なし', step3Wedding: '子どもの結婚式', step3Meeting: '顔合わせ',
    step3Reunion: '同窓会・集まり', step3Holiday: '連休', step3Stay: '韓国滞在期間',
    next: '次へ', back: '戻る', submit: '結果を見る', loading: '整理しています',
    card1Title: 'おっしゃった内容は通常こう呼ばれます',
    card2Title: 'この部位を扱う施術',
    card3Title: 'カウンセリングで聞いてみてください',
    card4Title: '参考',
    lowConfidence: 'もう少し詳しく書いていただくと正確になります。',
    consultOnly: '診察での確認が必要です',
    labelDuration: '所要時間', labelAnesthesia: '麻酔', labelRecovery: '回復', labelCautions: '注意事項',
    disclaimer: 'この案内は診断ではなく、カウンセリングを準備するための参考資料です。個人差があり、実際の施術の可否と方法は医療スタッフとの相談で決まります。',
    ctaInquiry: 'この内容で相談する',
    error: 'しばらくしてからもう一度お試しください。',
  },
  zh: {
    title: '面诊准备卡', step1Title: '是这个困扰吗?',
    step2Title: '外观上最在意的是什么?',
    step2Placeholder: '例) 笑起来下颌线模糊 / 到下午就显得松弛 / 照片里显老',
    step2Required: '请写一行 (2个字以上)',
    step3Title: '需要在什么时候之前?',
    step3None: '没有特别安排', step3Wedding: '子女婚礼', step3Meeting: '双方家长见面',
    step3Reunion: '同学会·聚会', step3Holiday: '假期', step3Stay: '在韩停留期间',
    next: '下一步', back: '上一步', submit: '查看结果', loading: '整理中',
    card1Title: '您描述的情况通常这样称呼',
    card2Title: '处理该部位的项目',
    card3Title: '面诊时可以这样问',
    card4Title: '参考',
    lowConfidence: '再写详细一些会更准确。',
    consultOnly: '需要面诊确认',
    labelDuration: '所需时间', labelAnesthesia: '麻醉', labelRecovery: '恢复', labelCautions: '注意事项',
    disclaimer: '本内容并非诊断，仅为准备面诊的参考资料。个体差异存在，是否进行以及如何进行由医疗人员面诊决定。',
    ctaInquiry: '就以此内容咨询',
    error: '请稍后再试。',
  },
};

function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') { out.push(raw.slice(start, i + 1)); start = i + 1; }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}
const body = (l) => l.replace(/\r*\n$/, '');
const eol = (l) => (l.match(/\r*\n$/) || ['\n'])[0];

let failed = 0;
for (const L of LOCALES) {
  const file = `${DIR}${L}.json`;
  const raw = readFileSync(file, 'utf8');
  if (splitLines(raw).join('') !== raw) { console.log(`!! ${L}: 라운드트립 실패`); failed++; continue; }
  if (JSON.parse(raw).consultPrep) { console.log(`-- ${L}: 이미 있음, 건너뜀`); continue; }

  const lines = splitLines(raw);
  // 최상위 "pricing": { 앞에 넣는다 (위치는 무관하나 결정적이어야 한다)
  const anchor = lines.findIndex((l) => body(l) === '  "pricing": {');
  if (anchor < 0) { console.log(`!! ${L}: 앵커 없음`); failed++; continue; }

  const e = eol(lines[anchor]);
  const t = T[L] ?? T.en;
  const entries = Object.entries(t);
  const block = [
    `  "consultPrep": {${e}`,
    ...entries.map(([k, v], i) =>
      `    ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < entries.length - 1 ? ',' : ''}${e}`),
    `  },${e}`,
  ];
  lines.splice(anchor, 0, ...block);

  const out = lines.join('');
  try { JSON.parse(out); } catch (err) { console.log(`!! ${L}: JSON 깨짐 ${err.message}`); failed++; continue; }
  console.log(`${WRITE ? '기록' : '미리보기'} ${L} (+${block.length}줄)`);
  if (WRITE) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
```

- [ ] **Step 2: 미리보기로 확인한다**

Run: `cd liv-clinic && node scripts/_i18n-work/add-consult-prep-keys.mjs`
Expected: 11줄 모두 `미리보기 <locale> (+24줄)`, 마지막에 `전체 정상`

- [ ] **Step 3: 기록한다**

Run: `cd liv-clinic && node scripts/_i18n-work/add-consult-prep-keys.mjs --write`

- [ ] **Step 4: 검증한다**

```bash
cd D:/dev/LIV_homepage/liv-clinic && npm run verify:i18n
cd D:/dev/LIV_homepage && git diff --numstat -- liv-clinic/src/messages/
```
Expected: `verify:i18n` 전체 통과, 각 파일 `24 0` (추가만, 삭제 0)

삭제가 0이 아니면 EOL이 오염된 것이다. `git checkout -- liv-clinic/src/messages/` 로 되돌리고 스크립트를 고친다.

- [ ] **Step 5: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/messages liv-clinic/scripts/_i18n-work/add-consult-prep-keys.mjs
git commit -m "feat(consult-prep): consultPrep 네임스페이스 22키 11개 로케일 추가

ko/en/ja/zh는 실제 번역, 나머지 7개는 en 문구를 넣어 verify:i18n의 키
정합성만 만족시킨다 (그 로케일에서는 진입점을 노출하지 않는다).
줄 중간 고립 \\r 때문에 \\n만 경계로 삼는 분할 + 라운드트립 검증으로 삽입."
```

---

## Task 7: 3단계 폼 (`PrepWizard`)

**Files:**
- Create: `src/components/consultPrep/PrepWizard.tsx`

**Interfaces:**
- Consumes: Task 6 `consultPrep` 메시지 · Task 5 `POST /api/consult-prep`
- Produces: `<PrepWizard concernId lang concernTitle onResult={(r: PrepCardResult, description: string) => void} />` · `trackPrepStarted` · `trackPrepDescribed` · `trackPrepResultShown` · `trackPrepToInquiry`

- [ ] **Step 1: GA4 이벤트 4종을 먼저 추가한다**

`PrepWizard`가 이 중 둘을 쓴다. 나중에 넣으면 이 태스크의 커밋이 `tsc`를 통과하지 못한다.

`src/lib/analytics-events.ts` 맨 끝에 덧붙인다:

```ts
// ============================================
// 상담 준비 카드
// ============================================

/** 1단계 진입 */
export function trackPrepStarted(concernId: string) {
  trackEvent('prep_started', { concern_id: concernId });
}

/** 2단계 자유 서술 제출 */
export function trackPrepDescribed(concernId: string, length: number) {
  trackEvent('prep_described', { concern_id: concernId, description_length: length });
}

/** 결과 카드 노출 */
export function trackPrepResultShown(concernId: string, lowConfidence: boolean) {
  trackEvent('prep_result_shown', { concern_id: concernId, low_confidence: lowConfidence });
}

/** 결과에서 문의로 전환 */
export function trackPrepToInquiry(concernId: string) {
  trackEvent('prep_to_inquiry', { concern_id: concernId });
}
```

- [ ] **Step 2: 컴포넌트를 쓴다**

`src/components/consultPrep/PrepWizard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import type { PrepLang } from '@/lib/consultPrep/types';
import { trackPrepStarted, trackPrepDescribed } from '@/lib/analytics-events';

interface Props {
  concernId: string;
  concernTitle: string;
  lang: PrepLang;
  onResult: (result: PrepCardResult, description: string) => void;
}

const KO_TIMING_KEYS = ['step3None', 'step3Wedding', 'step3Meeting', 'step3Reunion', 'step3Holiday'] as const;

export default function PrepWizard({ concernId, concernTitle, lang, onResult }: Props) {
  const t = useTranslations('consultPrep');
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [timing, setTiming] = useState('step3None');
  const [stay, setStay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const descriptionOk = description.trim().length >= 2;

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/consult-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concernId, description: description.trim(), lang }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || t('error'));
        return;
      }
      onResult(json.data as PrepCardResult, description.trim());
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {step === 1 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step1Title')}</h2>
          <p className="text-body text-mono mb-8">{concernTitle}</p>
          <Button
            onClick={() => {
              trackPrepStarted(concernId);
              setStep(2);
            }}
          >
            {t('next')}
          </Button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step2Title')}</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('step2Placeholder')}
            rows={4}
            maxLength={500}
            className="w-full rounded-xl border border-border p-4 text-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {!descriptionOk && (
            <p className="text-small text-mono-light mt-2">{t('step2Required')}</p>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              {t('back')}
            </Button>
            <Button
              disabled={!descriptionOk}
              onClick={() => {
                trackPrepDescribed(concernId, description.trim().length);
                setStep(3);
              }}
            >
              {t('next')}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step3Title')}</h2>

          {lang === 'ko' ? (
            <div className="flex flex-wrap gap-2">
              {KO_TIMING_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTiming(key)}
                  className={`rounded-full border px-4 py-2 text-small transition-colors ${
                    timing === key
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-mono hover:bg-background'
                  }`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          ) : (
            <label className="block">
              <span className="text-small text-mono">{t('step3Stay')}</span>
              <input
                type="text"
                value={stay}
                onChange={(e) => setStay(e.target.value)}
                placeholder="2026-09-20 ~ 2026-09-24"
                className="mt-2 w-full rounded-xl border border-border p-4 text-body"
              />
            </label>
          )}

          {error && <p className="text-small text-red-600 mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              {t('back')}
            </Button>
            <Button onClick={submit} isLoading={loading} disabled={loading}>
              {loading ? t('loading') : t('submit')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
```

> **주의:** 1차에서 `timing` / `stay` 값은 화면 흐름에만 쓰고 API로 보내지 않는다. 일정 역산은 설계 §11의 2차 항목이다. 여기서 값을 받아 두는 이유는 관계자 시연에서 "여기에 일정이 붙는다"를 보여주기 위해서다.

> **확인된 사항 (계획 작성 시 검증):** `Button`의 `variant`는 `'primary' | 'secondary' | 'ghost' | 'outline'`이다. `secondary`는 `bg-secondary text-white`인 채워진 진한 버튼이라 '이전'에는 어울리지 않아 `outline`을 쓴다. `isLoading` prop이 이미 있으므로 그대로 쓴다.

- [ ] **Step 3: 타입 검사**

Run: `cd liv-clinic && npx tsc --noEmit -p tsconfig.json`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/components/consultPrep/PrepWizard.tsx liv-clinic/src/lib/analytics-events.ts
git commit -m "feat(consult-prep): 3단계 폼 + GA4 이벤트 4종

자유 서술은 필수(최소 2자)이며 비우면 다음 버튼이 잠긴다. 3단계 시기 선택은
ko 로케일이면 자녀 결혼식·상견례 등 프리셋, 그 외에는 한국 체류 기간 입력.
1차에서 시기 값은 API로 보내지 않는다 (일정 역산은 2차)."
```

---

## Task 8: 결과 카드 + 페이지

**Files:**
- Create: `src/components/consultPrep/PrepResult.tsx`
- Create: `src/app/[locale]/consult-prep/page.tsx`

**Interfaces:**
- Consumes: Task 5 `PrepCardResult` · Task 6 메시지 · Task 7 `PrepWizard`
- Produces: 라우트 `/{locale}/consult-prep?concern={id}`

- [ ] **Step 1: 결과 카드를 쓴다**

`src/components/consultPrep/PrepResult.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import { trackPrepToInquiry } from '@/lib/analytics-events';

interface Props {
  result: PrepCardResult;
  concernId: string;
  description: string;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-h4 text-secondary mb-4">{title}</h3>
      {children}
    </section>
  );
}

export default function PrepResult({ result, concernId, description }: Props) {
  const t = useTranslations('consultPrep');
  const withMeta = result.treatments.filter((x) => !x.consultOnly && x.duration);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card title={t('card1Title')}>
        {result.restatement && <p className="text-body text-mono mb-4">{result.restatement}</p>}
        <ul className="flex flex-wrap gap-2">
          {result.terms.map((term) => (
            <li
              key={term.id}
              className="rounded-full bg-background px-4 py-2 text-small text-secondary"
            >
              {term.label}
            </li>
          ))}
        </ul>
        {result.lowConfidence && (
          <p className="text-small text-mono-light mt-4">{t('lowConfidence')}</p>
        )}
      </Card>

      <Card title={t('card2Title')}>
        <ul className="space-y-4">
          {result.treatments.map((item) => (
            <li key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body font-medium text-secondary">
                  {item.consultOnly ? t('consultOnly') : item.name}
                </span>
                {item.href && (
                  <Link href={item.href} className="text-small text-primary shrink-0">
                    →
                  </Link>
                )}
              </div>
              {item.reason && <p className="text-small text-mono mt-1">{item.reason}</p>}
              {item.caution && <p className="text-small text-mono-light mt-1">{item.caution}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('card3Title')}>
        <ol className="space-y-3 list-decimal list-inside">
          {result.questions.map((q) => (
            <li key={q.id} className="text-body text-mono">
              {q.text}
            </li>
          ))}
        </ol>
      </Card>

      {withMeta.length > 0 && (
        <Card title={t('card4Title')}>
          <dl className="space-y-4">
            {withMeta.map((item) => (
              <div key={item.id}>
                <dt className="text-small font-medium text-secondary mb-1">{item.name}</dt>
                <dd className="text-small text-mono">
                  {t('labelDuration')} {item.duration} · {t('labelAnesthesia')} {item.anesthesia} ·{' '}
                  {t('labelRecovery')} {item.recovery}
                </dd>
                {item.cautions.length > 0 && (
                  <dd className="text-small text-mono-light mt-1">
                    {t('labelCautions')}: {item.cautions.join(' / ')}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </Card>
      )}

      <p className="text-small text-mono-light leading-relaxed">{t('disclaimer')}</p>

      <Link
        href={{
          pathname: '/contact',
          query: {
            concern: concernId,
            prep: description.slice(0, 200),
            tags: result.treatments.filter((x) => !x.consultOnly).map((x) => x.id).join(','),
          },
        }}
        onClick={() => trackPrepToInquiry(concernId)}
      >
        <Button className="w-full">{t('ctaInquiry')}</Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 페이지를 쓴다**

`src/app/[locale]/consult-prep/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import PrepWizard from '@/components/consultPrep/PrepWizard';
import PrepResult from '@/components/consultPrep/PrepResult';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import { PREP_LANGS, type PrepLang } from '@/lib/consultPrep/types';
import { trackPrepResultShown } from '@/lib/analytics-events';

const CONCERN_IDS = ['sagging', 'elasticity', 'fundamental', 'underEye', 'texture'] as const;

export default function ConsultPrepPage() {
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('consultPrep');
  const tConcerns = useTranslations('sections.concerns');
  const [result, setResult] = useState<PrepCardResult | null>(null);
  const [description, setDescription] = useState('');

  const raw = params.get('concern') ?? '';
  const concernId = (CONCERN_IDS as readonly string[]).includes(raw) ? raw : CONCERN_IDS[0];
  const lang: PrepLang = (PREP_LANGS as readonly string[]).includes(locale)
    ? (locale as PrepLang)
    : 'en';

  return (
    <main className="section-gap bg-background">
      <div className="container-custom">
        <h1 className="text-h2 text-secondary text-center mb-10">{t('title')}</h1>
        {result ? (
          <PrepResult result={result} concernId={concernId} description={description} />
        ) : (
          <PrepWizard
            concernId={concernId}
            concernTitle={tConcerns(`cards.${concernId}.title`)}
            lang={lang}
            onResult={(r, d) => {
              setResult(r);
              setDescription(d);
              trackPrepResultShown(concernId, r.lowConfidence);
            }}
          />
        )}
      </div>
    </main>
  );
}
```

> `description`을 페이지에서 들고 있어야 결과 카드의 문의 링크에 실을 수 있다. `PrepWizard`의 `onResult`는 Task 7에서 이미 `(result, description)` 2인자로 정의돼 있다.

- [ ] **Step 3: 타입 검사**

Run: `cd liv-clinic && npx tsc --noEmit -p tsconfig.json`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/components/consultPrep/PrepResult.tsx liv-clinic/src/app/\[locale\]/consult-prep/page.tsx
git commit -m "feat(consult-prep): 결과 카드 4장 + 페이지

카드 2 제목은 '이 부위를 다루는 시술'이며 정렬은 서버가 준 순서를 그대로 쓴다
(buildResult가 displayOrder로 이미 정렬). 삭제 불가 고지를 결과 하단에 고정.
카드 4는 consultOnly 행을 제외하고 TREATMENTS 값만 보여준다."
```

---

## Task 9: 진입점 연결 + 시연 확인

**Files:**
- Modify: `src/components/sections/ConcernPathways.tsx:22-28`

**Interfaces:**
- Consumes: Task 7의 GA4 이벤트 4종 · Task 8의 `/consult-prep` 라우트
- Produces: 홈 고민 카드 → `/consult-prep?concern={id}` (ko/en/ja/zh 한정)

- [ ] **Step 1: 고민 카드 링크를 바꾼다**

`src/components/sections/ConcernPathways.tsx`의 `concernsConfig`를 바꾼다. **1차 지원 언어에서만 새 경로로 보낸다.**

```tsx
const PREP_LOCALES = new Set(['ko', 'en', 'ja', 'zh']);

const concernsConfig = [
  { id: 'sagging', href: '/lifting/aptos' },
  { id: 'elasticity', href: '/lifting' },
  { id: 'fundamental', href: '/contact' },
  { id: 'underEye', href: '/contact' },
  { id: 'texture', href: '/antiaging/skinbooster' },
] as const;
```

컴포넌트 본문의 `concerns` 매핑을 바꾼다 (`useLocale`을 import):

```tsx
  const locale = useLocale();
  const usePrep = PREP_LOCALES.has(locale);

  const concerns = concernsConfig.map((config) => ({
    ...config,
    href: usePrep ? `/consult-prep?concern=${config.id}` : config.href,
    title: t(`cards.${config.id}.title`),
    desc: t(`cards.${config.id}.desc`),
    tags: t(`cards.${config.id}.tags`),
    ctaLabel: config.href === '/contact' ? tCommon('consultation') : tCommon('learnMore'),
  }));
```

`import { useLocale, useTranslations } from 'next-intl';` 로 바꾼다.

- [ ] **Step 2: 전체 검증**

```bash
cd D:/dev/LIV_homepage/liv-clinic
npx tsc --noEmit -p tsconfig.json
npm run test
npm run verify:i18n
node --test scripts/__tests__/compile-concern-rules.test.mjs
```
Expected: tsc 오류 0 · vitest 전체 통과(기존 194 + 신규 33 = 227) · verify:i18n 통과 · 생성기 테스트 7건 통과

- [ ] **Step 3: 실제로 돌려서 확인한다**

```bash
cd D:/dev/LIV_homepage/liv-clinic
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

브라우저에서 확인할 것:
1. `http://localhost:3000/ko` — 홈의 고민 카드 5개가 `/ko/consult-prep?concern=...`로 가는가
2. 2단계에서 **빈 칸이면 다음 버튼이 잠기는가**
3. `턱선이 흐려 보여요`를 넣고 결과 카드 4장이 나오는가
4. 카드 2 제목이 "이 부위를 다루는 시술"이고 순서가 압토스 → 실리프팅 → 울쎄라인가
5. `?concern=underEye`에서 첫 행이 "상담에서 확인이 필요합니다"인가
6. `http://localhost:3000/en/consult-prep?concern=texture` — 영어로 나오는가
7. `OPENAI_API_KEY`를 잠시 비우고 재시작 → **결과 카드가 그대로 나오는가**(규칙표 폴백). 이게 시연에서 가장 중요한 확인이다
8. 결과 하단 고지 문구가 보이는가

- [ ] **Step 4: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/components/sections/ConcernPathways.tsx
git commit -m "feat(consult-prep): 홈 고민 카드를 상담 준비 카드로 연결

ko/en/ja/zh 로케일에서만 고민 카드가 /consult-prep으로 향하고, 나머지
7개 로케일은 기존 시술 페이지 링크를 유지한다."
```

---

## 시연 준비 메모

관계자에게 보여줄 때 준비할 것:

- **일부러 API 키를 끈 화면을 함께 보여준다.** "AI가 죽어도 화면은 나온다"가 이 설계에서 가장 설명하기 어려운 부분이고, 직접 보여주는 게 가장 빠르다.
- **규칙표 CSV를 엑셀로 열어서 보여준다.** 원장·실장이 직접 고칠 물건이므로, 문서로 설명하기보다 파일을 띄우는 편이 낫다.
- **금지어 검사를 시연한다.** `data/concern-rules.csv`의 `reason_ko`에 "최고의 효과"를 넣고 `node scripts/compile-concern-rules.mjs`를 돌리면 어떻게 되는지 — 단, 현재 생성기는 `reason_ko`에 `checkAdCopy`를 걸지 않는다. **시연 전에 물어볼 것: 규칙표 문구에도 금지어 검사를 걸까?** (검수자가 사람이므로 1차에서는 일부러 뺐다.)
- 피드백에서 나올 것이 확실한 항목: 고민 분류 5종이 충분한지, 카드 2에 가격을 넣을지, 실장 화면을 언제 만들지. 셋 다 설계 문서 §11·§12에 이미 "다음 차수"로 적혀 있다.

---

## Self-Review

**스펙 커버리지**

| 설계 문서 | 태스크 |
|---|---|
| §3 흐름 3단계 + 카드 4장 | Task 7, 8 |
| §4 파일 배치 | Task 1~8 (전부) |
| §5-1~5-3 CSV 3종 | Task 2 |
| §5-4 `consultation_requests` 저장 | **Task 8에서 `/contact` 쿼리 전달까지만.** 실제 insert는 기존 문의 폼이 한다 — `procedure_tags` 채우기는 문의 폼 쪽 수정이 필요하며, 1차 시연 범위 밖으로 둔다 (아래 갭 참조) |
| §6 AI 경계 | Task 4 |
| §7 의료광고·개인정보 | Task 1(금지어), Task 8(고지) |
| §8 i18n | Task 6 |
| §9 측정 | Task 9 |
| §10 테스트 | Task 1~5 |

**알려진 갭 (의도적)**

1. **`procedure_tags` 실제 저장이 빠져 있다.** 결과 카드는 `/contact?tags=...`로 값을 넘기지만, 문의 폼이 그 쿼리를 읽어 `procedure_tags`에 넣는 작업은 이 계획에 없다. 문의 폼(`ContactForm` + `/api/contact`)을 건드려야 하고, 시연에는 필요 없다. **시연 후 별도 태스크로 뺀다** — 다만 §2의 성공 기준 2번(`procedure_tags`가 채워진 문의)은 그때까지 측정 불가다.
2. `PrepWizard`의 시기(`timing`/`stay`) 값이 API로 가지 않는다. 의도적이며 Task 7에 명시했다.
3. 규칙표 문구 자체에는 `checkAdCopy`를 걸지 않는다. 사람이 검수하는 문구이기 때문이며, 시연 메모에 질문으로 남겼다.

**타입 일관성 확인**

- `PrepSelection`은 Task 4에서 정의하고 Task 5 `buildResult`가 소비한다. 필드명 `termIds` `treatmentIds` `questionIds` `restatement` `lowConfidence` 일치.
- `PrepCardResult`는 Task 5에서 정의하고 Task 7 `onResult`, Task 8 `PrepResult`가 소비한다.
- `PrepLang`은 Task 2 `types.ts`에서 정의하고 Task 3·4·5·7·8이 모두 같은 것을 import한다.
- `CONSULT_ONLY`는 Task 2에서 정의하고 Task 3 테스트·Task 5 `buildResult`가 쓴다.
- `onResult`는 Task 7에서 `(result) => void`로 시작해 Task 8 Step 3에서 `(result, description) => void`로 바뀐다. **Task 8을 건너뛰면 Task 7이 컴파일되지 않는다** — 순서대로 실행할 것.
