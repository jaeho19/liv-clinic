# Slack 방 AI 답 전문 + 멈춤 요약 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slack 손님 방에 AI가 손님에게 실제로 쓴 답(한국어 번역 전문)을 올리고, 매 차례의 요지 대신 대화가 10분 멈추면 "무엇을 묻고 어떻게 답했는지" 요약 1개를 올린다.

**Architecture:** AI 차례의 뒤처리(`aiFollowups.ts`)가 한국어 번역을 먼저 끝내고 그 번역으로 `AI 응대` 글을 올린다(금액이 번역에서 빠지면 프로그램이 만든 정확한 금액 줄을 덧붙임). 3분마다 도는 운영 작업(`/api/chat/ops`, 이제 매일 24시간)이 새 모듈 `ai/aiSummary.ts`로 멈춘 대화를 찾아 `chat_sessions.ai_summary_at`(마이그레이션 045)을 조건부 선점하고, AI로 요약을 만들어(실패하면 차례별 요지로 대신) 방에 올린다.

**Tech Stack:** Next.js 16 route handler, Supabase(supabase-js admin client), Slack Web API(기존 `postStyled`/`postSlackMessage`), OpenAI chat.completions(기존 `callChatAi`), vitest, Netlify Scheduled Function.

## Global Constraints

- 설계서: `docs/superpowers/specs/2026-10-22-chat-ai-slack-transcript-design.md`
- 요약 시점: 마지막 글 뒤 **10분**(`SUMMARY_IDLE_MIN = 10`), 대상은 마지막 글이 **24시간** 안(`SUMMARY_LOOKBACK_HOURS = 24`), 한 번 실행에 **최대 3대화**(`SUMMARY_MAX_PER_RUN = 3`), AI 호출 한도 **15초**.
- 요약 모양: 머리줄 `📝 *AI 응대 요약* · HH:MM~HH:MM · 손님 글 N개`, 줄 `• 물은 것:` · `• 답한 것:` · `• 직원이 할 일:`(있을 때만). 실패하면 머리줄 끝에 `· 자동 요약 실패 — 차례별 요지`, 줄은 `• <요지>`.
- 번역 실패 표시: `_(번역 실패 — 손님에게 나간 글 그대로)_`. 금액 안전줄: `> 안내한 금액: <priceQuoteKo / 로 이음>`.
- 멘션 없음. 이름표는 기존 `AI_LOOK`(`AI 응대`, `:speech_balloon:`).
- 스위치 `CHAT_AI_SUMMARY=off`면 요약만 멈춘다(기본 켜짐).
- 예약 함수 일정 `*/3 * * * *`.
- 모든 npm 명령은 `liv-clinic/`에서. 테스트: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run <파일>`.
- 운영(DB · Slack · Netlify)에 닿는 일은 이 계획에 없다 — 045 적용과 배포는 끝난 뒤 따로 승인을 받는다.
- 커밋 끝줄: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Slack 글 모양 — AI 답 전문 · 요약 (slackText · slackLook)

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackText.ts` (`AiReplyArgs` · `buildAiReplyBody` · `buildAiReplyText` 자리, 약 396~419줄)
- Modify: `liv-clinic/src/lib/chat/slackLook.ts` (`styledAiReply` 주석, `styledAiSummary` 추가, import)
- Test: `liv-clinic/src/lib/chat/__tests__/slackAiNotices.test.ts`, `liv-clinic/src/lib/chat/__tests__/slackOfferNotices.test.ts`

**Interfaces:**
- Produces:
  - `interface AiReplyArgs { sentText: string; koreanText: string | null; quoted: string[] }`
  - `AI_TRANSLATION_FAILED_NOTE = '_(번역 실패 — 손님에게 나간 글 그대로)_'`
  - `missingAmounts(sentText: string, koreanText: string): string[]`
  - `buildAiReplyBody(args: AiReplyArgs): string`, `buildAiReplyText(args: AiReplyArgs): string`
  - `interface AiSummaryArgs { from: string; until: string; visitorMessages: number; summary: { asked: string; answered: string; todo: string } | null; notes: string[] }`
  - `buildAiSummaryBody(args: AiSummaryArgs): string`
  - `styledAiReply(args: AiReplyArgs): StyledMessage`(시그니처 그대로, 인자 타입만 바뀜), `styledAiSummary(args: AiSummaryArgs): StyledMessage`

- [ ] **Step 1: 실패하는 시험 — `slackAiNotices.test.ts`의 첫 describe를 바꾼다**

`describe('AI 응대 글 — AI가 손님에게 한 답의 요지', …)` 블록 전체를 아래로 바꾸고, import에 `AI_TRANSLATION_FAILED_NOTE, buildAiSummaryBody, missingAmounts`와 `styledAiSummary`를 더한다.

```ts
const SENT =
  'Ultherapy Prime pricing depends on the area.\n• Ultherapy Prime · Upper face (200-300 shots): from KRW 780,000 (KRW 858,000 incl. VAT)\nIf you book through this chat, you get 5% off.';
const KO =
  '울쎄라피 프라임 가격은 부위에 따라 다릅니다.\n• 울쎄라피 프라임 · 상안면(200~300샷): KRW 780,000부터 (부가세 포함 KRW 858,000)\n이 채팅으로 예약하시면 5% 할인됩니다.';
const QUOTED = ['울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~'];

describe('AI 응대 글 — 손님에게 나간 답의 한국어 번역 전문 (스펙 2026-10-22 §1)', () => {
  it('번역문 전문을 그대로 올린다. 금액이 다 들어 있으면 금액 줄을 덧붙이지 않는다', () => {
    expect(buildAiReplyBody({ sentText: SENT, koreanText: KO, quoted: QUOTED })).toBe(KO);
  });

  it('missingAmounts: KRW 금액 가운데 번역문에 없는 것 — 쉼표는 무시, 다른 숫자에 붙은 것은 없는 것으로 본다', () => {
    expect(missingAmounts(SENT, KO)).toEqual([]);
    expect(missingAmounts(SENT, '상안면 780000원부터, 부가세 포함 858,000원')).toEqual([]);
    expect(missingAmounts(SENT, '상안면 78만 원부터 (부가세 포함 85만 8천 원)')).toEqual(['780000', '858000']);
    expect(missingAmounts(SENT, '상안면 7800001원')).toEqual(['780000', '858000']);
    expect(missingAmounts('KRW 1,000 and KRW 1,000', '없음')).toEqual(['1000']);
  });

  it('번역이 금액을 바꿨으면 정확한 금액 줄을 붙인다', () => {
    const ko = '울쎄라피 프라임 상안면은 78만 원부터입니다.';
    expect(buildAiReplyBody({ sentText: SENT, koreanText: ko, quoted: QUOTED })).toBe(
      `${ko}\n> 안내한 금액: 울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~`
    );
  });

  it('번역 실패(null): 나간 글 그대로 + 정확한 금액 줄 + 실패 표시', () => {
    expect(AI_TRANSLATION_FAILED_NOTE).toBe('_(번역 실패 — 손님에게 나간 글 그대로)_');
    expect(buildAiReplyBody({ sentText: SENT, koreanText: null, quoted: QUOTED })).toBe(
      `${SENT}\n> 안내한 금액: 울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~\n${AI_TRANSLATION_FAILED_NOTE}`
    );
    expect(buildAiReplyBody({ sentText: 'Hello!', koreanText: null, quoted: [] })).toBe(`Hello!\n${AI_TRANSLATION_FAILED_NOTE}`);
  });

  it('빈 글이면 정해진 문장, 특수문자는 이스케이프', () => {
    expect(buildAiReplyBody({ sentText: ' ', koreanText: '  ', quoted: [] })).toBe('손님에게 답했습니다.');
    expect(buildAiReplyBody({ sentText: 'x', koreanText: 'A & B <c>', quoted: [] })).toBe('A &amp; B &lt;c&gt;');
  });

  it('꾸민 글: 이름표 AI 응대, 막대 없음, 멘션 없음. 글자만 문구에는 머리말이 붙는다', () => {
    const args = { sentText: 'Hi', koreanText: '위치를 안내했습니다.', quoted: [] };
    const m = styledAiReply(args);
    expect(AI_LOOK).toEqual({ username: 'AI 응대', iconEmoji: ':speech_balloon:' });
    expect(m).toEqual({ ...AI_LOOK, text: '위치를 안내했습니다.', plainText: '💬 _AI 응대_\n위치를 안내했습니다.' });
    expect(buildAiReplyText(args)).toBe(m.plainText);
    expect(m.attachments).toBeUndefined();
  });
});

describe('AI 응대 요약 — 대화가 멈췄을 때 1개 (스펙 2026-10-22 §2)', () => {
  const base = { from: '2026-10-22T01:43:14Z', until: '2026-10-22T01:50:05Z', visitorMessages: 7, notes: [] };

  it('머리줄(시각 범위 · 손님 글 수) + 물은 것 · 답한 것 · 직원이 할 일', () => {
    expect(
      buildAiSummaryBody({
        ...base,
        summary: { asked: '울쎄라 가격, 예약 변경', answered: '부위별 가격 안내, 10/28 11시 가예약', todo: '가예약 확정 연락' },
      })
    ).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개\n• 물은 것: 울쎄라 가격, 예약 변경\n• 답한 것: 부위별 가격 안내, 10/28 11시 가예약\n• 직원이 할 일: 가예약 확정 연락'
    );
  });

  it('할 일이 비어 있으면 그 줄을 빼고, 같은 분이면 시각을 하나만', () => {
    expect(
      buildAiSummaryBody({ ...base, until: base.from, visitorMessages: 1, summary: { asked: '위치', answered: '주소 안내', todo: ' ' } })
    ).toBe('📝 *AI 응대 요약* · 10:43 · 손님 글 1개\n• 물은 것: 위치\n• 답한 것: 주소 안내');
  });

  it('요약 실패: 머리줄에 표시하고 차례별 요지를 목록으로. 요지도 없으면 머리줄만. 특수문자 이스케이프', () => {
    expect(buildAiSummaryBody({ ...base, summary: null, notes: ['가격을 안내했습니다.', ' ', 'A <b>'] })).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개 · 자동 요약 실패 — 차례별 요지\n• 가격을 안내했습니다.\n• A &lt;b&gt;'
    );
    expect(buildAiSummaryBody({ ...base, summary: null, notes: [] })).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개 · 자동 요약 실패 — 차례별 요지'
    );
  });

  it('꾸민 글: AI 응대 이름표, 막대 · 멘션 없음, 글자만 문구도 같은 본문', () => {
    const m = styledAiSummary({ ...base, summary: { asked: 'a', answered: 'b', todo: '' } });
    expect(m).toEqual({ ...AI_LOOK, text: m.plainText, plainText: '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개\n• 물은 것: a\n• 답한 것: b' });
    expect(m.attachments).toBeUndefined();
  });
});
```

`slackOfferNotices.test.ts`에서는 `describe('AI 응대 요지 — "> 제안:" 줄', …)` 블록 전체와 import의 `styledAiReply` · `buildAiReplyBody`를 지우고, 파일 머리 주석 아래에 한 줄을 더한다:
`// 2026-10-22: 요지의 "> 제안:" 줄은 없어졌다 — 방에 AI 답 전문이 올라가므로 제안은 그 글에 그대로 보인다(스펙 2026-10-22 chat-ai-slack-transcript §1).`

- [ ] **Step 2: 실패 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackAiNotices.test.ts src/lib/chat/__tests__/slackOfferNotices.test.ts`
Expected: FAIL — `missingAmounts` · `buildAiSummaryBody` · `styledAiSummary` 가 없다.

- [ ] **Step 3: 구현 — `slackText.ts`**

`export interface AiReplyArgs` 부터 `buildAiReplyText` 끝까지를 아래로 바꾼다:

```ts
export interface AiReplyArgs {
  /** 손님에게 나간 답 (손님 언어) */
  sentText: string;
  /** 그 답의 한국어 번역. null = 번역 실패 → 나간 글을 그대로 올리고 표시한다 */
  koreanText: string | null;
  /** 이 답에 쓰인 가격 줄 — `써마지 레이저 · 600샷 2,400,000원~` 꼴. 번역이 금액을 빠뜨렸거나 번역이 실패했을 때만 붙인다 */
  quoted: string[];
}

export const AI_TRANSLATION_FAILED_NOTE = '_(번역 실패 — 손님에게 나간 글 그대로)_';

/** 손님에게 나간 글의 금액(`KRW 1,234,000`) 가운데 번역문에 없는 것. 쉼표는 무시하고, 앞뒤에 다른 숫자가 붙은 것은 없는 것으로 본다. */
export function missingAmounts(sentText: string, koreanText: string): string[] {
  const korean = koreanText.replace(/,/g, '');
  const amounts = [...sentText.matchAll(/KRW\s*(\d[\d,]*)/g)].map((m) => m[1].replace(/,/g, ''));
  return [...new Set(amounts)].filter((a) => !new RegExp(`(?<!\\d)${a}(?!\\d)`).test(korean));
}

/**
 * `AI 응대` 글의 본문 — 손님에게 나간 답의 한국어 번역 전문 (스펙 2026-10-22 chat-ai-slack-transcript §1).
 * 번역이 금액을 빠뜨렸거나 번역이 실패했으면 프로그램이 만든 정확한 금액 줄을 붙인다. 실패면 나간 글 그대로 + 표시.
 */
export function buildAiReplyBody(args: AiReplyArgs): string {
  const failed = args.koreanText === null;
  const shown = (args.koreanText ?? args.sentText).trim();
  const lines = [escapeSlackText(shown || '손님에게 답했습니다.')];
  if (args.quoted.length > 0 && (failed || missingAmounts(args.sentText, args.koreanText ?? '').length > 0)) {
    lines.push(`> 안내한 금액: ${args.quoted.map(escapeSlackText).join(' / ')}`);
  }
  if (failed) lines.push(AI_TRANSLATION_FAILED_NOTE);
  return lines.join('\n');
}

/** `AI 응대` 글을 글자만으로 — 스레드 방식이거나 꾸민 글을 못 올릴 때. */
export function buildAiReplyText(args: AiReplyArgs): string {
  return `💬 _AI 응대_\n${buildAiReplyBody(args)}`;
}

export interface AiSummaryArgs {
  /** 요약한 구간의 첫 글 · 마지막 글 시각 */
  from: string;
  until: string;
  /** 그 구간의 손님 글 수 */
  visitorMessages: number;
  /** AI가 쓴 요약. null = 요약 실패 → notes 를 대신 올린다 */
  summary: { asked: string; answered: string; todo: string } | null;
  /** 그 구간 AI 차례들의 요지 (요약 실패 때만 쓴다) */
  notes: string[];
}

const hm = (iso: string): string => formatKstTime(iso).replace(' KST', '');

/** 대화가 멈췄을 때의 `AI 응대 요약` 본문 (스펙 2026-10-22 chat-ai-slack-transcript §2). 멘션 없음. */
export function buildAiSummaryBody(args: AiSummaryArgs): string {
  const range = hm(args.from) === hm(args.until) ? hm(args.from) : `${hm(args.from)}~${hm(args.until)}`;
  const head = ['📝 *AI 응대 요약*', range, `손님 글 ${args.visitorMessages}개`];
  if (!args.summary) head.push('자동 요약 실패 — 차례별 요지');
  const lines = [head.join(' · ')];
  if (args.summary) {
    lines.push(`• 물은 것: ${escapeSlackText(args.summary.asked)}`);
    lines.push(`• 답한 것: ${escapeSlackText(args.summary.answered)}`);
    if (args.summary.todo.trim()) lines.push(`• 직원이 할 일: ${escapeSlackText(args.summary.todo.trim())}`);
  } else {
    for (const note of args.notes) if (note.trim()) lines.push(`• ${escapeSlackText(note.trim())}`);
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: 구현 — `slackLook.ts`**

slackText에서 가져오는 목록에 `buildAiSummaryBody`와 `type AiSummaryArgs`를 더하고, `styledAiReply`를 아래 두 함수로 바꾼다:

```ts
/** AI가 손님에게 한 답의 한국어 번역 전문(스펙 2026-10-22 chat-ai-slack-transcript §1). 멘션도 막대도 없다 — 방에 조용히 쌓인다. */
export function styledAiReply(args: AiReplyArgs): StyledMessage {
  return { ...AI_LOOK, text: buildAiReplyBody(args), plainText: buildAiReplyText(args) };
}

/** 대화가 멈췄을 때의 요약 1개 (스펙 2026-10-22 §2). 멘션도 막대도 없다. 글자만 문구도 같은 본문이다(머리줄이 📝 로 시작한다). */
export function styledAiSummary(args: AiSummaryArgs): StyledMessage {
  const body = buildAiSummaryBody(args);
  return { ...AI_LOOK, text: body, plainText: body };
}
```

`AI_LOOK` 위 주석을 `/** AI 응대 글(손님에게 나간 답의 번역 전문)과 대화 요약의 이름표 — 직원만 본다 */`로 바꾼다.

- [ ] **Step 5: 통과 확인**

Run: Step 2와 같은 명령.
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/slackLook.ts liv-clinic/src/lib/chat/__tests__/slackAiNotices.test.ts liv-clinic/src/lib/chat/__tests__/slackOfferNotices.test.ts && git commit -m "feat(chat): Slack AI 응대 글을 답 전문(한국어 번역)으로 · 대화 요약 글 모양" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 방에 올리기 — relayAiTurnToSlack(reply) · relayAiSummaryToSlack

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (`AiSlackArgs` · `relayAiTurnToSlack` 약 628~740줄, import)
- Test: `liv-clinic/src/lib/chat/__tests__/slackRelayAi.test.ts`

**Interfaces:**
- Consumes: Task 1의 `AiReplyArgs` · `AiSummaryArgs` · `styledAiReply` · `styledAiSummary`
- Produces:
  - `AiSlackArgs = { sessionId: string; reply: AiReplyArgs | null; booking: …(그대로); staffNeeded: …(그대로) }` — `note` · `quoted` · `offers` · `offerDeclined` 는 없어진다
  - `relayAiSummaryToSlack(args: { session: Pick<RelaySessionRow, 'slack_mode' | 'slack_channel_id' | 'slack_thread_ts'>; summary: AiSummaryArgs }): Promise<boolean>`

- [ ] **Step 1: 실패하는 시험 — `slackRelayAi.test.ts`**

`describe('relayAiTurnToSlack', …)`의 `args`를 `{ sessionId: SESSION_ID, reply: { sentText: 'Ulthera is …', koreanText: '울쎄라 가격을 안내했습니다.', quoted: [] }, booking: null, staffNeeded: null }`로 바꾸고, 첫 시험을 아래로 바꾼다. 파일의 다른 `note: null` 은 모두 `reply: null`로 바꾼다.

```ts
  it('AI 응대 글: 이름표 AI 응대, 멘션 없음, 손님에게 나간 답의 번역 전문. 금액이 빠졌으면 정확한 금액 줄', async () => {
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({
      ...args,
      reply: { sentText: 'Thermage 600 shots: from KRW 2,400,000', koreanText: '써마지 600샷은 240만 원부터입니다.', quoted: ['써마지 레이저 · 600샷 2,400,000원~'] },
    });
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({
      channelId: 'C0ROOM',
      username: 'AI 응대',
      iconEmoji: ':speech_balloon:',
      text: '써마지 600샷은 240만 원부터입니다.\n> 안내한 금액: 써마지 레이저 · 600샷 2,400,000원~',
    });
  });
```

파일 끝에 새 describe를 더한다(import에 `relayAiSummaryToSlack` 추가):

```ts
describe('relayAiSummaryToSlack — 대화가 멈췄을 때의 요약 (스펙 2026-10-22 §2)', () => {
  const summary = { from: '2026-10-22T01:43:14Z', until: '2026-10-22T01:50:05Z', visitorMessages: 2, summary: { asked: '가격', answered: '안내', todo: '' }, notes: [] };

  it('방이면 AI 응대 이름표로 방에, 멘션 없이. 올렸으면 true', async () => {
    const ok = await relayAiSummaryToSlack({ session: { slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null }, summary });
    expect(ok).toBe(true);
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ channelId: 'C0ROOM', username: 'AI 응대' });
    expect(String(posts()[0].text)).toContain('📝 *AI 응대 요약*');
    expect(String(posts()[0].text)).not.toContain('<@');
  });

  it('스레드면 글자만으로 스레드에. 방도 스레드도 없으면 올리지 않고 false', async () => {
    await relayAiSummaryToSlack({ session: { slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: '1.1' }, summary });
    expect(posts()[0]).toMatchObject({ threadTs: '1.1', channelId: 'C0FEED' });
    postMock.mockClear();
    expect(await relayAiSummaryToSlack({ session: { slack_mode: null, slack_channel_id: null, slack_thread_ts: null }, summary })).toBe(false);
    expect(posts()).toHaveLength(0);
  });

  it('Slack 이 실패하면 false, throw 하지 않는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' } as never);
    expect(await relayAiSummaryToSlack({ session: { slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null }, summary })).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackRelayAi.test.ts`
Expected: FAIL — `relayAiSummaryToSlack` 가 없고, `reply` 인자를 모른다.

- [ ] **Step 3: 구현**

`AiSlackArgs`를 바꾼다:

```ts
export interface AiSlackArgs {
  sessionId: string;
  /** 손님에게 나간 답과 그 한국어 번역(스펙 2026-10-22 chat-ai-slack-transcript §1). AI가 답하지 못했으면(접수 안내로 대신함) null — 답 글을 올리지 않는다 */
  reply: AiReplyArgs | null;
  /** 가예약이 처음 찼거나 바뀌었으면 그 내용. when 은 피드 줄에 쓰는 날짜·시각, benefit 은 안내한 혜택(`혜택: …`, 없으면 null) */
  booking: { changed: boolean; summary: string; when: string; benefit?: string | null } | null;
  /** 직원 확인이 필요하면 그 사유 */
  staffNeeded: { reason: string | null } | null;
}
```

`relayAiTurnToSlack` 주석의 `1. \`AI 응대\` 요지 — 멘션 없음` 을 `1. \`AI 응대\` — 손님에게 나간 답의 한국어 번역 전문, 멘션 없음`으로, `방도 스레드도 없는 대화(…)면 요지는 올리지 않고` 를 `… 답 글은 올리지 않고`로 바꾸고, 본문의 첫 게시를 바꾼다:

```ts
    if (args.reply !== null) {
      await post(styledAiReply(args.reply), 'ai reply');
    }
```

`relayAiTurnToSlack` 바로 뒤에 더한다:

```ts
/**
 * 대화가 멈췄을 때의 AI 응대 요약 1개를 그 대화의 방(또는 스레드)에 올린다 (스펙 2026-10-22 chat-ai-slack-transcript §2).
 * 방도 스레드도 없으면 올리지 않는다(#해외문의에 따로 올리지 않는다). 올렸으면 true. throw-free.
 */
export async function relayAiSummaryToSlack(args: {
  session: Pick<RelaySessionRow, 'slack_mode' | 'slack_channel_id' | 'slack_thread_ts'>;
  summary: AiSummaryArgs;
}): Promise<boolean> {
  if (!isSlackRelayConfigured()) return false;
  try {
    const target = resolveTarget(args.session, getSlackChannelId());
    const result = await postToSessionTarget(target, styledAiSummary(args.summary));
    if (result && !result.ok) console.warn('[slack relay] ai summary failed:', result.error);
    return Boolean(result?.ok);
  } catch (e) {
    console.warn('[slack relay] ai summary relay failed:', e);
    return false;
  }
}
```

import: slackLook 목록에 `styledAiSummary`, slackText에서 `type AiReplyArgs, type AiSummaryArgs`.

- [ ] **Step 4: 통과 확인**

Run: Step 2와 같은 명령. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelayAi.test.ts && git commit -m "feat(chat): 방에 AI 답 전문을 올리고, 대화 요약을 올리는 relayAiSummaryToSlack" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 번역 먼저 → 그 번역으로 Slack (aiFollowups)

**Files:**
- Modify: `liv-clinic/src/lib/chat/ai/aiFollowups.ts`
- Test: `liv-clinic/src/lib/chat/ai/__tests__/aiFollowups.test.ts`

**Interfaces:**
- Consumes: Task 2의 `AiSlackArgs.reply`
- Produces: `finishAiTurn` 동작 — 번역을 먼저 끝내고 `relayAiTurnToSlack({ sessionId, reply: { sentText, koreanText, quoted }, booking, staffNeeded })`

- [ ] **Step 1: 실패하는 시험**

`describe('finishAiTurn — 답이 나간 차례', …)`의 시험을 이렇게 고친다.
1. 첫 시험의 기대값을:
```ts
    expect(relayAi).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      reply: { sentText: 'Hello! How can we help you today?', koreanText: '안녕하세요! 무엇을 도와드릴까요?', quoted: [] },
      booking: null,
      staffNeeded: null,
    });
```
시험 이름은 `'번역을 먼저 끝내고, 방에 답 전문(번역)을 올리고, 같은 번역을 관리자 화면용으로 저장한다'`.
2. `'금액 줄을 썼으면 "안내한 금액"을 한국어로 넘긴다'`의 기대를 `expect(relayAi.mock.calls[0][0].reply?.quoted).toEqual(['써마지 레이저 · 600샷 2,400,000원~'])` 로.
3. `'제안형 응대: …'` 시험을 `'제안형 응대: 가예약에 안내한 혜택을 한국어로 넘긴다(제안 이름은 이제 답 전문에 보인다)'`로 이름을 바꾸고 `offers` · `offerDeclined` 기대 두 줄을 지운다.
4. `'한국어 번역은 Slack 게시와 함께 돈다 …'` 시험을 아래로 바꾼다:
```ts
  it('번역이 끝난 뒤에 Slack 에 올린다 — 방에 번역 전문이 올라가야 한다', async () => {
    const order: string[] = [];
    translateMock.mockImplementation(async () => {
      order.push('translate');
      return { status: 'success', text: '안녕하세요!', latencyMs: 1 };
    });
    relayAi.mockImplementation(async () => {
      order.push('slack');
    });
    await finish(SENT);
    expect(order).toEqual(['translate', 'slack']);
  });

  it('번역 실패: 나간 글 그대로(koreanText=null)로 올리고 글은 고치지 않는다. 번역할 것이 없으면(skipped) 나간 글을 번역으로 쓴다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    translateMock.mockResolvedValueOnce({ status: 'failed', text: SENT.text, errorCode: 'timeout', latencyMs: 5000 });
    await finish(SENT);
    expect(relayAi.mock.calls[0][0].reply?.koreanText).toBeNull();
    translateMock.mockResolvedValueOnce({ status: 'skipped', text: SENT.text, latencyMs: 0 });
    await finish(SENT);
    expect(relayAi.mock.calls[1][0].reply?.koreanText).toBe(SENT.text);
    expect(admin.ops.filter((o) => o.op === 'update')).toHaveLength(0);
  });
```
5. `'번역이 실패하거나 원문과 같으면 글을 고치지 않는다'`의 끝 기대 `expect(warn).toHaveBeenCalledTimes(2)` 를 `toHaveBeenCalledTimes(1)`로(건너뜀은 이제 경고하지 않는다).
6. `describe('finishAiTurn — 답이 나가지 않은 차례', …)`의 fallback 기대값에서 `note: null, quoted: [], offers: [], offerDeclined: false,` 를 `reply: null,` 로 바꾼다.

- [ ] **Step 2: 실패 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/ai/__tests__/aiFollowups.test.ts`
Expected: FAIL.

- [ ] **Step 3: 구현 — `aiFollowups.ts` 전체를 아래로**

```ts
import 'server-only';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiTurnToSlack, relayContactToSlack } from '@/lib/chat/slackRelay';
import { AI_FALLBACK_REASON, AI_SESSION_CAP_REASON } from '@/lib/chat/slackText';
import { translate } from '@/lib/chat/translation';
import { bookingSummaryKo, bookingWhenKo } from './booking';
import { priceQuoteKo } from './knowledge';
import { benefitKo } from './knowledge/offers';
import type { AiTurnOutcome } from './turn';

// AI 응대 한 차례의 뒤처리 (스펙 2026-10-02 chat-ai-first-response §4.1 의 "응답 뒤" · §4.11 · §4.12,
// 2026-10-22 chat-ai-slack-transcript §1). throw 하지 않는다.
// 손님 글의 Slack 릴레이가 끝난 뒤에 부른다 — 방에서 손님 글 → AI 답(번역 전문) → 가예약 → 직원 확인 필요 순으로 보이게.

/** runAiTurn 의 결과, 또는 대화당 한도에 닿아 AI가 답하지 않은 경우 */
export type AiFollowup = AiTurnOutcome | { kind: 'session_cap' };

/** 043 의 글 길이 한도 */
const ORIGINAL_TEXT_MAX = 4000;

/**
 * 손님에게 나간 AI 글의 한국어 번역. 실패하면 null(방에는 나간 글 그대로 올라간다).
 * 번역할 것이 없으면(skipped — 이모지뿐 등) 나간 글을 그대로 쓴다.
 */
async function koreanOf(text: string, locale: VisitorLocale): Promise<string | null> {
  const result = await translate(text, locale, 'ko');
  if (result.status === 'skipped') return text;
  if (result.status !== 'success') {
    console.warn('[chat ai] korean translation not saved:', result.status, result.errorCode ?? '');
    return null;
  }
  return Array.from(result.text.trim()).slice(0, ORIGINAL_TEXT_MAX).join('') || null;
}

/** 관리자 화면이 직원 글과 같은 방식(한국어가 큰 글, 손님에게 나간 글이 작은 글)으로 보이게 AI 글을 한국어로 바꿔 둔다. */
async function saveKoreanTranslation(messageId: string, text: string, korean: string): Promise<void> {
  if (korean === text) return;
  const admin = createChatAdminClient();
  const { error } = await admin.from('chat_messages').update({ original_text: korean }).eq('id', messageId);
  if (error) console.warn('[chat ai] korean translation update failed:', error.code ?? 'unknown');
}

export async function finishAiTurn(args: { sessionId: string; locale: VisitorLocale; outcome: AiFollowup }): Promise<void> {
  const { sessionId, locale, outcome } = args;
  try {
    if (outcome.kind === 'superseded') return;
    if (outcome.kind === 'fallback' || outcome.kind === 'session_cap') {
      // AI가 답하지 못했다(접수 안내가 대신 나갔다) · 대화당 한도에 닿았다 → 직원에게 넘긴다
      await relayAiTurnToSlack({
        sessionId,
        reply: null,
        booking: null,
        staffNeeded: { reason: outcome.kind === 'fallback' ? AI_FALLBACK_REASON : AI_SESSION_CAP_REASON },
      });
      return;
    }
    // 번역을 먼저 끝낸다(한도 5초 + 재시도 1번) — 방에는 그 번역(손님에게 나간 답 전문)을 올리고,
    // 관리자 화면에도 같은 번역을 저장한다(번역은 한 번만 부른다).
    const korean = await koreanOf(outcome.text, locale).catch((e: unknown) => {
      console.warn('[chat ai] korean translation failed:', e);
      return null;
    });
    const slack = async (): Promise<void> => {
      await relayAiTurnToSlack({
        sessionId,
        reply: { sentText: outcome.text, koreanText: korean, quoted: outcome.usedRows.map(priceQuoteKo) },
        booking: outcome.bookingEvent
          ? {
              changed: outcome.bookingEvent === 'changed',
              summary: bookingSummaryKo(outcome.booking, outcome.contact),
              when: bookingWhenKo(outcome.booking),
              benefit: outcome.bookingBenefit ? benefitKo(outcome.bookingBenefit) : null,
            }
          : null,
        staffNeeded: outcome.needsStaff ? { reason: outcome.staffReasonKo } : null,
      });
      // 가예약이 차지 않았는데 연락처만 받았다 → 지금의 연락처 알림(초록 막대 + 피드 줄)
      if (outcome.contactSaved) {
        await relayContactToSlack({ sessionId, channel: outcome.contactSaved.channel, handle: outcome.contactSaved.handle });
      }
    };
    // Slack 게시(글 여러 개)와 관리자 화면용 저장은 함께 돈다. 한쪽이 실패해도 다른 쪽은 끝까지 간다.
    const [posted, saved] = await Promise.allSettled([
      slack(),
      korean ? saveKoreanTranslation(outcome.messageId, outcome.text, korean) : Promise.resolve(),
    ]);
    if (posted.status === 'rejected') console.warn('[chat ai] slack followups failed:', posted.reason);
    if (saved.status === 'rejected') console.warn('[chat ai] korean translation save failed:', saved.reason);
  } catch (e) {
    console.warn('[chat ai] followups failed:', e);
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: Step 2와 같은 명령. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/ai/aiFollowups.ts liv-clinic/src/lib/chat/ai/__tests__/aiFollowups.test.ts && git commit -m "feat(chat): AI 답의 한국어 번역을 먼저 끝내고 그 전문을 방에 올린다" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 마이그레이션 045 — chat_sessions.ai_summary_at

**Files:**
- Create: `liv-clinic/supabase/migrations/045_chat_ai_summary.sql`
- Create: `liv-clinic/scripts/_db/run-045.mjs`, `liv-clinic/scripts/_db/verify-045.mjs`

**Interfaces:**
- Produces: `chat_sessions.ai_summary_at TIMESTAMPTZ NULL` (Task 5가 읽고 조건부 UPDATE 한다)

- [ ] **Step 1: 마이그레이션**

```sql
-- 045: 라이브채팅 AI 응대 — 대화가 멈췄을 때의 요약을 어디까지 올렸는가 (스펙 2026-10-22 chat-ai-slack-transcript §2 · §3)
-- 043 · 044 뒤에 적용한다. 추가형 · 멱등이다(다시 돌려도 된다). 코드를 배포하기 전에 적용한다 —
-- 없으면 운영 작업의 요약 단계가 조회에 실패해 건너뛸 뿐 다른 운영 작업은 그대로다.
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS ai_summary_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.chat_sessions.ai_summary_at IS
  'AI 응대 요약을 어디까지 올렸는가 — 요약한 구간의 끝(그때의 last_message_at). 운영 작업이 조건부 UPDATE 로 선점한다';
```

- [ ] **Step 2: 검증 스크립트 `verify-045.mjs`**

```js
// 045 검증 — 트랜잭션 안에서 새 컬럼의 꼴 · 기본값 · 조건부 선점이 설계대로인지 본다.
// q(sql, params) → rows 배열을 돌려주는 함수만 받는다. run-045.mjs 가 pg 로 감싸 넘긴다.
// 넣은 행은 끝에 지운다(호출한 쪽이 트랜잭션을 되돌리든 확정하든 남지 않는다).

export async function verify045(q, log = console.log) {
  const fails = [];
  const check = (name, cond, detail) => {
    log(`[verify] ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : ` — ${JSON.stringify(detail)}`}`);
    if (!cond) fails.push(name);
  };

  const [col] = await q(
    "SELECT data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'ai_summary_at'"
  );
  check('chat_sessions.ai_summary_at: timestamptz · NULL 허용', col?.data_type === 'timestamp with time zone' && col?.is_nullable === 'YES', col);

  const [s] = await q(
    "INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 045') RETURNING id, ai_summary_at"
  );
  check('새 대화: ai_summary_at 은 비어 있다', s.ai_summary_at === null, s);

  const claim = 'UPDATE public.chat_sessions SET ai_summary_at = now() WHERE id = $1 AND ai_summary_at IS NULL RETURNING id';
  const first = await q(claim, [s.id]);
  const again = await q(claim, [s.id]);
  check('조건부 선점: 처음 1행 · 같은 조건으로 다시 0행', first.length === 1 && again.length === 0, { first: first.length, again: again.length });

  await q('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);
  const [left] = await q('SELECT count(*)::int AS n FROM public.chat_sessions WHERE id = $1', [s.id]);
  check('정리: 넣은 대화를 지웠다', left.n === 0, left);

  return { ok: fails.length === 0, fails };
}
```

- [ ] **Step 3: 적용 스크립트 `run-045.mjs`** — `run-044.mjs`와 같은 꼴, 이름만 045:

```js
// 마이그레이션 045 를 운영 DB에 적용하거나(--apply), 트랜잭션 안에서 검증만 하고 되돌린다(기본).
// 사용 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-045.mjs           # 검증만 (ROLLBACK)
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-045.mjs --apply   # 검증이 통과하면 적용 (COMMIT)
// .env.local 의 DATABASE_URL 을 쓴다. 다른 세션이 테이블을 잡고 있으면 5초 기다리다 그만둔다. 043 · 044 가 먼저 적용돼 있어야 한다.
import fs from 'node:fs';
import pg from 'pg';
import { verify045 } from './verify-045.mjs';

const FILE = 'supabase/migrations/045_chat_ai_summary.sql';
const apply = process.argv.includes('--apply');

const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
if (!m) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString: m[1], ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query(fs.readFileSync(FILE, 'utf8'));
  console.log(`[run-045] ${FILE} executed inside transaction`);

  const result = await verify045((sql, params) => client.query(sql, params).then((r) => r.rows));
  console.log(result.ok ? '[verify] 045 OK' : `[verify] 045 MISMATCH — do not apply (${result.fails.join(' / ')})`);

  if (apply && result.ok) {
    await client.query('COMMIT');
    console.log('[run-045] COMMITTED');
  } else {
    await client.query('ROLLBACK');
    console.log(apply ? '[run-045] ROLLED BACK (verify failed)' : '[run-045] ROLLED BACK (dry run)');
    if (!result.ok) process.exitCode = 1;
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[run-045] failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
```

- [ ] **Step 4: 문법 확인 (운영에 닿지 않음)**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && node --check scripts/_db/run-045.mjs && node --check scripts/_db/verify-045.mjs && echo SYNTAX-OK`
Expected: `SYNTAX-OK`. 운영 dry-run(`node scripts/_db/run-045.mjs`)은 배포 승인 때 한다.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/supabase/migrations/045_chat_ai_summary.sql liv-clinic/scripts/_db/run-045.mjs liv-clinic/scripts/_db/verify-045.mjs && git commit -m "feat(db): 045 chat_sessions.ai_summary_at — AI 응대 요약을 어디까지 올렸는가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 멈춘 대화 요약 — chatFlags · ai/aiSummary.ts

**Files:**
- Modify: `liv-clinic/src/lib/chat/chatFlags.ts` (`isAiSummaryEnabled` 추가 — `isRoomLookEnabled` 뒤)
- Create: `liv-clinic/src/lib/chat/ai/aiSummary.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts`, `liv-clinic/src/lib/chat/ai/__tests__/aiSummary.test.ts`

**Interfaces:**
- Consumes: Task 2 `relayAiSummaryToSlack`, Task 4 `ai_summary_at`, 기존 `callChatAi` · `readAiCallConfig`(`./openai`), `isSlackRelayConfigured`(`@/lib/chat/slack`), `formatKstTime`(`@/lib/chat/kst`)
- Produces:
  - `isAiSummaryEnabled(): boolean`
  - `SUMMARY_IDLE_MIN = 10`, `SUMMARY_LOOKBACK_HOURS = 24`, `SUMMARY_MAX_PER_RUN = 3`
  - `segmentLines(messages: SegmentMessage[], after: string | null, until: string): TranscriptLine[]`
  - `buildSummaryMessages(lines: TranscriptLine[]): AiMessage[]`
  - `parseSummary(content: string): AiSummaryFields | null`
  - `runAiSummaries(now: Date): Promise<{ summarized: number; fallback: number }>`

- [ ] **Step 1: 실패하는 시험 — 스위치**

`chatFlags.test.ts`의 import에 `isAiSummaryEnabled`를, afterEach에 `delete process.env.CHAT_AI_SUMMARY;`를 더하고 describe 끝에:

```ts
  it("AI 응대 요약 스위치(CHAT_AI_SUMMARY): 없으면 켜짐, 'off'일 때만 꺼짐", () => {
    expect(isAiSummaryEnabled()).toBe(true);
    process.env.CHAT_AI_SUMMARY = ' Off ';
    expect(isAiSummaryEnabled()).toBe(false);
    process.env.CHAT_AI_SUMMARY = 'on';
    expect(isAiSummaryEnabled()).toBe(true);
  });
```

- [ ] **Step 2: 실패하는 시험 — `ai/__tests__/aiSummary.test.ts`(새 파일)**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/chat/db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('@/lib/chat/slackRelay', () => ({ relayAiSummaryToSlack: vi.fn() }));
vi.mock('../openai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../openai')>()),
  callChatAi: vi.fn(),
}));

import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiSummaryToSlack } from '@/lib/chat/slackRelay';
import { fakeAdmin, hasFilter, hasFilterOp, type FakeOp, type FakeResult } from '@/lib/chat/__tests__/fakeAdmin';
import { callChatAi } from '../openai';
import { buildSummaryMessages, parseSummary, runAiSummaries, segmentLines, type SegmentMessage } from '../aiSummary';

const adminMock = vi.mocked(createChatAdminClient);
const relayMock = vi.mocked(relayAiSummaryToSlack);
const aiMock = vi.mocked(callChatAi);

const NOW = new Date('2026-10-22T02:10:00Z'); // 11:10 KST
const S = 'sess-1';
const LAST = '2026-10-22T01:50:05Z'; // 20분 전
const MSGS: Array<SegmentMessage & { id: string }> = [
  { id: 'm0', created_at: '2026-10-22T01:42:58Z', sender: 'system', source: 'app', original_text: 'Hello! How can we help?', translated_text: null },
  { id: 'm1', created_at: '2026-10-22T01:43:13Z', sender: 'visitor', source: 'app', original_text: 'How much is Ulthera?', translated_text: '울쎄라 얼마인가요?' },
  { id: 'm2', created_at: '2026-10-22T01:43:16Z', sender: 'operator', source: 'ai', original_text: '부위별 금액은 …', translated_text: 'Prices …' },
  { id: 'm3', created_at: '2026-10-22T01:49:28Z', sender: 'operator', source: 'slack', original_text: '확인해서 연락드리겠습니다.', translated_text: 'We will check.' },
  { id: 'm4', created_at: '2026-10-22T01:50:05Z', sender: 'operator', source: 'auto', original_text: '메시지 잘 받았습니다.', translated_text: 'Received.' },
];
const ROOM = { id: S, last_message_at: LAST, ai_summary_at: null, slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null };

describe('segmentLines — 요약할 구간의 글', () => {
  it('(after, until] 의 손님(번역) · AI · 직원 글만. 자동 안내 · 시스템 글은 뺀다', () => {
    expect(segmentLines(MSGS, null, LAST)).toEqual([
      { at: '2026-10-22T01:43:13Z', who: '손님', text: '울쎄라 얼마인가요?' },
      { at: '2026-10-22T01:43:16Z', who: 'AI', text: '부위별 금액은 …' },
      { at: '2026-10-22T01:49:28Z', who: '직원', text: '확인해서 연락드리겠습니다.' },
    ]);
    expect(segmentLines(MSGS, '2026-10-22T01:43:13Z', '2026-10-22T01:43:16Z').map((l) => l.who)).toEqual(['AI']);
  });

  it('손님 글의 번역이 없으면 원문, 빈 글은 뺀다', () => {
    const rows: SegmentMessage[] = [
      { created_at: '2026-10-22T01:00:00Z', sender: 'visitor', source: 'app', original_text: 'Hi', translated_text: null },
      { created_at: '2026-10-22T01:00:01Z', sender: 'visitor', source: 'app', original_text: '  ', translated_text: '' },
    ];
    expect(segmentLines(rows, null, '2026-10-22T02:00:00Z')).toEqual([{ at: '2026-10-22T01:00:00Z', who: '손님', text: 'Hi' }]);
  });
});

describe('buildSummaryMessages · parseSummary', () => {
  it('지시문(JSON 세 칸)과 시각 · 말한 이가 붙은 대화', () => {
    const [system, user] = buildSummaryMessages(segmentLines(MSGS, null, LAST));
    expect(system.role).toBe('system');
    expect(system.content).toContain('{"asked": "...", "answered": "...", "todo": "..."}');
    expect(user).toEqual({ role: 'user', content: '[10:43] 손님: 울쎄라 얼마인가요?\n[10:43] AI: 부위별 금액은 …\n[10:49] 직원: 확인해서 연락드리겠습니다.' });
  });

  it('대화가 너무 길면 앞부분을 줄인다', () => {
    const long = Array.from({ length: 40 }, (_, i) => ({ at: '2026-10-22T01:00:00Z', who: '손님' as const, text: `${i} ${'가'.repeat(600)}` }));
    const [, user] = buildSummaryMessages(long);
    expect(user.content.startsWith('(앞부분 생략)\n')).toBe(true);
    expect(user.content.length).toBeLessThanOrEqual(12_000 + 20);
    expect(user.content).toContain('39 ');
  });

  it('parseSummary: asked · answered 가 있어야 한다. todo 는 없어도 된다. 다듬고 300자로 자른다', () => {
    expect(parseSummary('{"asked":" 가격 ","answered":"안내","todo":""}')).toEqual({ asked: '가격', answered: '안내', todo: '' });
    expect(parseSummary('{"asked":"가격","answered":"안내"}')).toEqual({ asked: '가격', answered: '안내', todo: '' });
    expect(parseSummary('{"asked":"","answered":"안내","todo":""}')).toBeNull();
    expect(parseSummary('not json')).toBeNull();
    expect(parseSummary('[1,2]')).toBeNull();
    expect(parseSummary(JSON.stringify({ asked: '가'.repeat(400), answered: 'b', todo: 1 }))).toEqual({ asked: '가'.repeat(300), answered: 'b', todo: '' });
  });
});

describe('runAiSummaries', () => {
  let ops: FakeOp[];
  function useAdmin(over: (op: FakeOp) => FakeResult | undefined = () => undefined) {
    const admin = fakeAdmin((op) => {
      const custom = over(op);
      if (custom) return custom;
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: [ROOM] };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: S }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') return { data: [{ session_id: S, created_at: '2026-10-22T01:43:16Z' }] };
      if (op.table === 'chat_messages') return { data: MSGS };
      if (op.table === 'chat_ai_turns') return { data: [{ created_at: '2026-10-22T01:43:17Z', staff_note_ko: '울쎄라 가격을 안내했습니다.' }] };
      return { data: null };
    });
    ops = admin.ops;
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    relayMock.mockResolvedValue(true);
    aiMock.mockResolvedValue({ ok: true, content: '{"asked":"울쎄라 가격","answered":"부위별 가격 안내","todo":"연락"}', latencyMs: 900, usage: { promptTokens: 1, cachedTokens: 0, completionTokens: 1 } });
  });
  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_AI_SUMMARY;
    vi.restoreAllMocks();
  });

  it('10분 넘게 멈춘 · 24시간 안 · 열린 대화를 찾아, 선점하고, 요약을 방에 올린다', async () => {
    useAdmin();
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 1, fallback: 0 });
    const query = ops.find((o) => o.table === 'chat_sessions' && o.op === 'select')!;
    expect(hasFilter(query, 'status', 'open')).toBe(true);
    expect(hasFilterOp(query, 'resolved_at', 'is')).toBe(true);
    expect(query.filters).toContainEqual(['last_message_at', 'lt', '2026-10-22T02:00:00.000Z']);
    expect(query.filters).toContainEqual(['last_message_at', 'gte', '2026-10-21T02:10:00.000Z']);
    const claim = ops.find((o) => o.table === 'chat_sessions' && o.op === 'update')!;
    expect(claim.payload).toEqual({ ai_summary_at: LAST });
    expect(hasFilterOp(claim, 'ai_summary_at', 'is')).toBe(true);
    expect(relayMock).toHaveBeenCalledWith({
      session: ROOM,
      summary: {
        from: '2026-10-22T01:43:13Z',
        until: '2026-10-22T01:49:28Z',
        visitorMessages: 1,
        summary: { asked: '울쎄라 가격', answered: '부위별 가격 안내', todo: '연락' },
        notes: [],
      },
    });
    expect(aiMock.mock.calls[0][2]).toEqual({ timeoutMs: 15_000 });
  });

  it('지난 요약이 있으면 그 뒤 구간만, 선점은 읽은 값이 그대로일 때만', async () => {
    const prev = '2026-10-22T01:43:16Z';
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'select' ? { data: [{ ...ROOM, ai_summary_at: prev }] } : undefined));
    // 지난 요약 뒤의 AI 글이 없으면 대상이 아니다
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops.some((o) => o.op === 'update')).toBe(false);

    useAdmin((op) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: [{ ...ROOM, ai_summary_at: prev }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') return { data: [{ session_id: S, created_at: '2026-10-22T01:49:00Z' }] };
      return undefined;
    });
    await runAiSummaries(NOW);
    const claim = ops.find((o) => o.op === 'update')!;
    expect(hasFilter(claim, 'ai_summary_at', prev)).toBe(true);
    expect(relayMock.mock.calls[0][0].summary.from).toBe('2026-10-22T01:49:28Z');
  });

  it('이미 요약한 지점이 마지막 글이면, 방도 스레드도 없으면 대상이 아니다', async () => {
    useAdmin((op) =>
      op.table === 'chat_sessions' && op.op === 'select'
        ? { data: [{ ...ROOM, ai_summary_at: LAST }, { ...ROOM, id: 's2', slack_mode: null, slack_channel_id: null }] }
        : undefined
    );
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops.some((o) => o.table === 'chat_messages')).toBe(false);
  });

  it('선점에 지면(다른 실행이 먼저) 올리지 않는다', async () => {
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'update' ? { data: [] } : undefined));
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(relayMock).not.toHaveBeenCalled();
    expect(aiMock).not.toHaveBeenCalled();
  });

  it('AI 요약이 실패하면 그 구간 AI 차례들의 요지로 대신한다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin();
    aiMock.mockResolvedValueOnce({ ok: false, error: 'timeout', latencyMs: 15_000 });
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 1 });
    expect(relayMock.mock.calls[0][0].summary).toMatchObject({ summary: null, notes: ['울쎄라 가격을 안내했습니다.'] });
    const turns = ops.find((o) => o.table === 'chat_ai_turns')!;
    expect(turns.filters).toContainEqual(['reply_message_id', 'in', ['m2']]);

    aiMock.mockResolvedValueOnce({ ok: true, content: 'oops', latencyMs: 1, usage: { promptTokens: 1, cachedTokens: 0, completionTokens: 1 } });
    useAdmin();
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 1 });
  });

  it('한 번에 최대 3대화', async () => {
    const many = ['a', 'b', 'c', 'd'].map((id) => ({ ...ROOM, id }));
    useAdmin((op) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: many };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: 'x' }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') return { data: many.map((s) => ({ session_id: s.id, created_at: '2026-10-22T01:43:16Z' })) };
      return undefined;
    });
    expect((await runAiSummaries(NOW)).summarized).toBe(3);
    expect(relayMock).toHaveBeenCalledTimes(3);
  });

  it('스위치 off · Slack 미설정이면 아무것도 하지 않는다. 조회 실패(045 전)는 경고만', async () => {
    useAdmin();
    process.env.CHAT_AI_SUMMARY = 'off';
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    delete process.env.CHAT_AI_SUMMARY;
    delete process.env.SLACK_BOT_TOKEN;
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops).toHaveLength(0);

    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'select' ? { error: { code: '42703' } } : undefined));
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(warn).toHaveBeenCalled();
  });

  it('Slack 게시가 실패하면 센 수에 넣지 않는다(다시 시도하지 않는다)', async () => {
    useAdmin();
    relayMock.mockResolvedValueOnce(false);
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/chatFlags.test.ts src/lib/chat/ai/__tests__/aiSummary.test.ts`
Expected: FAIL — `isAiSummaryEnabled` · `../aiSummary` 가 없다.

- [ ] **Step 4: 구현 — `chatFlags.ts`** (`isRoomLookEnabled` 뒤)

```ts
/**
 * 대화가 멈췄을 때의 AI 응대 요약 (스펙 2026-10-22 chat-ai-slack-transcript §2).
 * CHAT_AI_SUMMARY=off 면 false — 요약만 멈춘다(AI 답 전문은 그대로 방에 올라간다).
 */
export function isAiSummaryEnabled(): boolean {
  return !isOff('CHAT_AI_SUMMARY');
}
```

- [ ] **Step 5: 구현 — `ai/aiSummary.ts`**

```ts
import 'server-only';
import { isAiSummaryEnabled } from '@/lib/chat/chatFlags';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { formatKstTime } from '@/lib/chat/kst';
import { isSlackRelayConfigured } from '@/lib/chat/slack';
import { relayAiSummaryToSlack } from '@/lib/chat/slackRelay';
import { callChatAi, readAiCallConfig, type AiMessage } from './openai';

// 대화가 멈추면 AI 응대 요약 1개 (스펙 2026-10-22 chat-ai-slack-transcript §2). throw 하지 않는다.
// 운영 작업(/api/chat/ops)이 3분마다 부른다 — AI는 밤 · 주말에도 답하므로 영업시간 밖에도.

export const SUMMARY_IDLE_MIN = 10;
export const SUMMARY_LOOKBACK_HOURS = 24;
export const SUMMARY_MAX_PER_RUN = 3;
/** 예약 함수가 라우트를 25초까지 기다린다 */
const SUMMARY_TIMEOUT_MS = 15_000;
const QUERY_LIMIT = 30;
const MESSAGE_LIMIT = 300;
const LINE_MAX = 1500;
const TRANSCRIPT_MAX = 12_000;
const FIELD_MAX = 300;

const SESSION_COLUMNS = 'id, last_message_at, ai_summary_at, slack_mode, slack_channel_id, slack_thread_ts';

interface SummarySession {
  id: string;
  last_message_at: string;
  ai_summary_at: string | null;
  slack_mode: string | null;
  slack_channel_id: string | null;
  slack_thread_ts: string | null;
}

export interface SegmentMessage {
  created_at: string;
  sender: string;
  source: string | null;
  original_text: string;
  translated_text: string | null;
}

export interface TranscriptLine {
  at: string;
  who: '손님' | 'AI' | '직원';
  text: string;
}

export interface AiSummaryFields {
  asked: string;
  answered: string;
  todo: string;
}

/** at 이 (after, until] 안에 있는가 */
function within(at: string, after: string | null, until: string): boolean {
  const t = Date.parse(at);
  return t > (after ? Date.parse(after) : -Infinity) && t <= Date.parse(until);
}

/** 요약할 구간의 글 — (after, until] 의 손님(한국어 번역) · AI · 직원 글. 자동 안내 · 시스템 글은 뺀다 (순수). */
export function segmentLines(messages: SegmentMessage[], after: string | null, until: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const m of messages) {
    if (!within(m.created_at, after, until)) continue;
    if (m.sender === 'visitor') lines.push({ at: m.created_at, who: '손님', text: (m.translated_text || m.original_text).trim() });
    else if (m.sender === 'operator' && m.source === 'ai') lines.push({ at: m.created_at, who: 'AI', text: m.original_text.trim() });
    else if (m.sender === 'operator' && m.source !== 'auto') lines.push({ at: m.created_at, who: '직원', text: m.original_text.trim() });
  }
  return lines.filter((l) => l.text.length > 0);
}

const SYSTEM_PROMPT = [
  '너는 성형외과 라이브채팅을 직원에게 짧게 요약해 주는 도우미다.',
  '아래는 손님과 자동 응대(AI), 직원 사이에 오간 대화다. 손님 글은 한국어로 번역되어 있다.',
  'JSON 객체 하나로만 답한다: {"asked": "...", "answered": "...", "todo": "..."}',
  '- asked: 손님이 묻거나 요청한 것을 한 줄로(쉼표로 나열).',
  '- answered: 자동 응대와 직원이 답한 것을 한 줄로. 금액 · 날짜 · 시간 · 인원은 대화에 나온 그대로만 쓴다.',
  '- todo: 직원이 해야 할 일(예약 확정 연락, 나중에 답하겠다고 한 질문 등)을 한 줄로. 없으면 빈 문자열.',
  '- 대화에 없는 내용이나 약속을 지어내지 않는다. 각 값은 한국어 120자 안팎.',
].join('\n');

/** 요약을 부탁하는 메시지 — 지시문 + `[HH:MM] 손님: …` 꼴의 대화. 길면 앞부분을 줄인다. */
export function buildSummaryMessages(lines: TranscriptLine[]): AiMessage[] {
  let transcript = lines
    .map((l) => `[${formatKstTime(l.at).replace(' KST', '')}] ${l.who}: ${Array.from(l.text).slice(0, LINE_MAX).join('')}`)
    .join('\n');
  if (transcript.length > TRANSCRIPT_MAX) transcript = `(앞부분 생략)\n${transcript.slice(-TRANSCRIPT_MAX)}`;
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: transcript },
  ];
}

const field = (v: unknown): string => (typeof v === 'string' ? Array.from(v.trim()).slice(0, FIELD_MAX).join('') : '');

/** AI의 답(JSON)을 읽는다. asked · answered 가 비어 있으면 null. */
export function parseSummary(content: string): AiSummaryFields | null {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return null;
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const asked = field(o.asked);
  const answered = field(o.answered);
  return asked && answered ? { asked, answered, todo: field(o.todo) } : null;
}

/** 요약 실패 때 대신 올릴 것 — 그 구간 AI 글들의 차례별 요지(chat_ai_turns.staff_note_ko), 시간 순. */
async function segmentNotes(admin: ChatAdminClient, aiMessageIds: string[]): Promise<string[]> {
  if (aiMessageIds.length === 0) return [];
  const { data, error } = await admin
    .from('chat_ai_turns')
    .select('created_at, staff_note_ko')
    .in('reply_message_id', aiMessageIds);
  if (error) {
    console.warn('[chat ai summary] notes lookup failed:', error.code ?? 'unknown');
    return [];
  }
  return ((data ?? []) as Array<{ created_at: string; staff_note_ko: string | null }>)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((t) => (t.staff_note_ko ?? '').trim())
    .filter(Boolean);
}

/** 한 대화: 선점 → 구간 글 → AI 요약(실패하면 요지) → 게시. */
async function summarizeOne(admin: ChatAdminClient, s: SummarySession): Promise<'summary' | 'fallback' | 'skipped'> {
  // 조건부 선점 — 읽은 ai_summary_at 이 그대로일 때만 1행('오늘 연락할 손님'의 followup_digest_at 과 같은 방식).
  // 크론이 겹쳐도 두 번 올리지 않는다. 선점 뒤 게시가 실패해도 다시 시도하지 않는다(실제 답은 방에 다 있다).
  let claim = admin.from('chat_sessions').update({ ai_summary_at: s.last_message_at }).eq('id', s.id);
  claim = s.ai_summary_at ? claim.eq('ai_summary_at', s.ai_summary_at) : claim.is('ai_summary_at', null);
  const { data: got, error: claimError } = await claim.select('id');
  if (claimError) {
    console.warn('[chat ai summary] claim failed:', claimError.code ?? 'unknown');
    return 'skipped';
  }
  if (!got || got.length === 0) return 'skipped';

  const { data: msgData, error: msgError } = await admin
    .from('chat_messages')
    .select('id, created_at, sender, source, original_text, translated_text')
    .eq('session_id', s.id)
    .order('created_at', { ascending: true })
    .limit(MESSAGE_LIMIT);
  if (msgError) console.warn('[chat ai summary] messages lookup failed:', msgError.code ?? 'unknown');
  const messages = (msgData ?? []) as Array<SegmentMessage & { id: string }>;
  const lines = segmentLines(messages, s.ai_summary_at, s.last_message_at);

  let summary: AiSummaryFields | null = null;
  if (lines.length > 0) {
    const res = await callChatAi(buildSummaryMessages(lines), readAiCallConfig(), { timeoutMs: SUMMARY_TIMEOUT_MS });
    if (!res.ok) console.warn('[chat ai summary] model call failed:', res.error);
    else {
      summary = parseSummary(res.content);
      if (!summary) console.warn('[chat ai summary] invalid summary json');
    }
  }
  const notes = summary
    ? []
    : await segmentNotes(
        admin,
        messages.filter((m) => m.source === 'ai' && within(m.created_at, s.ai_summary_at, s.last_message_at)).map((m) => m.id)
      );

  const posted = await relayAiSummaryToSlack({
    session: s,
    summary: {
      from: lines[0]?.at ?? s.last_message_at,
      until: lines[lines.length - 1]?.at ?? s.last_message_at,
      visitorMessages: lines.filter((l) => l.who === '손님').length,
      summary,
      notes,
    },
  });
  if (!posted) return 'skipped';
  return summary ? 'summary' : 'fallback';
}

export interface SummaryRunResult {
  /** AI 요약을 올린 대화 수 */
  summarized: number;
  /** 요약 대신 차례별 요지를 올린 대화 수 */
  fallback: number;
}

/**
 * 멈춘 대화(마지막 글 뒤 10분, 24시간 안, 열려 있음, 방이나 스레드가 있음, 지난 요약 뒤에 AI 글이 있음)마다 요약 1개.
 * 한 번에 최대 3대화. throw 하지 않는다.
 */
export async function runAiSummaries(now: Date): Promise<SummaryRunResult> {
  const result: SummaryRunResult = { summarized: 0, fallback: 0 };
  if (!isAiSummaryEnabled() || !isSlackRelayConfigured()) return result;
  try {
    const admin = createChatAdminClient();
    const idleCutoff = new Date(now.getTime() - SUMMARY_IDLE_MIN * 60_000).toISOString();
    const lookback = new Date(now.getTime() - SUMMARY_LOOKBACK_HOURS * 3_600_000).toISOString();
    const { data, error } = await admin
      .from('chat_sessions')
      .select(SESSION_COLUMNS)
      .eq('status', 'open')
      .is('resolved_at', null)
      .lt('last_message_at', idleCutoff)
      .gte('last_message_at', lookback)
      .order('last_message_at', { ascending: true })
      .limit(QUERY_LIMIT);
    if (error) {
      // 045 적용 전이면 ai_summary_at 이 없어 여기로 온다
      console.warn('[chat ai summary] session query failed:', error.code ?? 'unknown');
      return result;
    }
    const sessions = ((data ?? []) as SummarySession[]).filter(
      (s) =>
        ((s.slack_mode === 'room' && s.slack_channel_id) || (s.slack_mode === 'thread' && s.slack_thread_ts)) &&
        (!s.ai_summary_at || Date.parse(s.ai_summary_at) < Date.parse(s.last_message_at))
    );
    if (sessions.length === 0) return result;

    // 지난 요약 뒤에 AI 글이 있는 대화만 — AI 글의 시각으로 본다(chat_ai_turns 는 글보다 조금 늦게 남는다)
    const { data: aiData, error: aiError } = await admin
      .from('chat_messages')
      .select('session_id, created_at')
      .in('session_id', sessions.map((s) => s.id))
      .eq('source', 'ai')
      .gte('created_at', lookback);
    if (aiError) {
      console.warn('[chat ai summary] ai message query failed:', aiError.code ?? 'unknown');
      return result;
    }
    const aiMessages = (aiData ?? []) as Array<{ session_id: string; created_at: string }>;
    const due = sessions
      .filter((s) => aiMessages.some((m) => m.session_id === s.id && within(m.created_at, s.ai_summary_at, s.last_message_at)))
      .slice(0, SUMMARY_MAX_PER_RUN);

    const outcomes = await Promise.all(
      due.map((s) =>
        summarizeOne(admin, s).catch((e: unknown) => {
          console.warn('[chat ai summary] summarize failed:', e);
          return 'skipped' as const;
        })
      )
    );
    for (const o of outcomes) {
      if (o === 'summary') result.summarized += 1;
      if (o === 'fallback') result.fallback += 1;
    }
    return result;
  } catch (e) {
    console.warn('[chat ai summary] run failed:', e);
    return result;
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: Step 3과 같은 명령. Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/chatFlags.ts liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts liv-clinic/src/lib/chat/ai/aiSummary.ts liv-clinic/src/lib/chat/ai/__tests__/aiSummary.test.ts && git commit -m "feat(chat): 대화가 10분 멈추면 AI 응대 요약 1개 (CHAT_AI_SUMMARY=off 로 정지)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 운영 작업 — 요약을 밤 · 주말에도 (ops 라우트 · 예약 함수)

**Files:**
- Modify: `liv-clinic/src/app/api/chat/ops/route.ts`
- Modify: `liv-clinic/netlify/functions/chat-ops.mts`
- Test: `liv-clinic/src/app/api/chat/ops/__tests__/route.test.ts` (새 파일)

**Interfaces:**
- Consumes: Task 5 `runAiSummaries(now)`

- [ ] **Step 1: 실패하는 시험**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/chat/businessHours', () => ({ isBusinessHours: vi.fn() }));
vi.mock('@/lib/chat/escalationRunner', () => ({ pruneSlackEvents: vi.fn(), runEscalations: vi.fn() }));
vi.mock('@/lib/chat/followupDigest', () => ({ runFollowupDigest: vi.fn() }));
vi.mock('@/lib/chat/ai/aiSummary', () => ({ runAiSummaries: vi.fn() }));

import { NextRequest } from 'next/server';
import { runAiSummaries } from '@/lib/chat/ai/aiSummary';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';
import { runFollowupDigest } from '@/lib/chat/followupDigest';
import { POST } from '../route';

const req = (auth = 'Bearer s3cret') => new NextRequest('https://liv-clinic.net/api/chat/ops', { method: 'POST', headers: { authorization: auth } });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CHAT_OPS_SECRET = 's3cret';
  vi.mocked(pruneSlackEvents).mockResolvedValue(0 as never);
  vi.mocked(runEscalations).mockResolvedValue({ escalated: 0 } as never);
  vi.mocked(runFollowupDigest).mockResolvedValue({ window: null, listed: 0 });
  vi.mocked(runAiSummaries).mockResolvedValue({ summarized: 1, fallback: 0 });
});
afterEach(() => {
  delete process.env.CHAT_OPS_SECRET;
});

describe('POST /api/chat/ops (스펙 2026-10-22 chat-ai-slack-transcript §2)', () => {
  it('영업시간 밖: 정리와 AI 응대 요약만 하고 끝난다', async () => {
    vi.mocked(isBusinessHours).mockReturnValue(false);
    const res = await POST(req());
    expect(await res.json()).toMatchObject({ ok: true, skipped: 'off_hours', summaries: { summarized: 1, fallback: 0 } });
    expect(runAiSummaries).toHaveBeenCalledTimes(1);
    expect(runEscalations).not.toHaveBeenCalled();
    expect(runFollowupDigest).not.toHaveBeenCalled();
  });

  it('영업시간 안: 요약 · 확대 알림 · 오늘 연락할 손님', async () => {
    vi.mocked(isBusinessHours).mockReturnValue(true);
    const res = await POST(req());
    expect(await res.json()).toMatchObject({ ok: true, summaries: { summarized: 1, fallback: 0 }, digest: { window: null, listed: 0 } });
    expect(runAiSummaries).toHaveBeenCalledTimes(1);
    expect(runEscalations).toHaveBeenCalledTimes(1);
    expect(runFollowupDigest).toHaveBeenCalledTimes(1);
  });

  it('시크릿이 틀리면 401, 아무것도 하지 않는다', async () => {
    const res = await POST(req('Bearer nope'));
    expect(res.status).toBe(401);
    expect(runAiSummaries).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/app/api/chat/ops/__tests__/route.test.ts`
Expected: FAIL — 응답에 `summaries` 가 없다.

- [ ] **Step 3: 구현 — `route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { runAiSummaries } from '@/lib/chat/ai/aiSummary';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';
import { runFollowupDigest } from '@/lib/chat/followupDigest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 운영 작업 라우트 — Netlify 예약 함수(chat-ops.mts)가 3분마다(매일 24시간 — 2026-10-22부터) 호출한다.
 * 공유 시크릿(CHAT_OPS_SECRET)으로만 접근.
 * 영업시간 밖(휴진일 포함): 정리 + AI 응대 요약(스펙 2026-10-22 chat-ai-slack-transcript §2 — AI는 밤에도 답한다)만 하고 끝난다.
 * 영업시간 중: AI 응대 요약과 미응답 확대 알림(기본 꺼짐 — CHAT_ESCALATION=on 일 때만)을 함께 → '오늘 연락할 손님' 요약(하루 두 번, 창 안에서만).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pruned = await pruneSlackEvents(now);
  if (!isBusinessHours(now)) {
    const summaries = await runAiSummaries(now);
    return NextResponse.json({ ok: true, skipped: 'off_hours', pruned, summaries });
  }

  // 예약 함수가 25초까지만 기다리므로 요약(AI 호출 최대 15초)과 확대 알림을 함께 돌린다
  const [summaries, result] = await Promise.all([runAiSummaries(now), runEscalations(now)]);
  const digest = await runFollowupDigest(now);
  return NextResponse.json({ ok: true, ...result, pruned, summaries, digest });
}
```

- [ ] **Step 4: 구현 — `chat-ops.mts`**

머리 주석 첫 줄을 `// 채팅 운영 작업 (Netlify Scheduled Function, 매일 24시간 3분 간격) — AI 응대 요약(밤 · 주말 포함), '오늘 연락할 손님' 요약, 처리 기록 정리.`로, 넷째 줄을 `// 스케줄은 UTC 매일 3분마다(2026-10-22부터 — AI 응대 요약이 밤 · 주말에도 돌아야 한다). 영업시간 판정은 라우트가 한다.`로 바꾸고, 끝 줄을:

```ts
export const config = { schedule: '*/3 * * * *' };
```

- [ ] **Step 5: 통과 확인**

Run: Step 2와 같은 명령. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/app/api/chat/ops/route.ts liv-clinic/src/app/api/chat/ops/__tests__/route.test.ts liv-clinic/netlify/functions/chat-ops.mts && git commit -m "feat(chat): 운영 작업이 AI 응대 요약을 밤 · 주말에도 돌린다 (예약 함수 매일 24시간)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 문서 · 전체 검증

**Files:**
- Modify: `.env.example` (`CHAT_AI_OFFERS=` 줄 뒤)
- Modify: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md` (머리 개정 줄, §6 표, §9 안내문 두 곳)
- Modify: `docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md` §4.11, `docs/superpowers/specs/2026-10-12-chat-ai-guided-offers-design.md` §4.6 — `[변경 2026-10-22]` 한 줄

- [ ] **Step 1: `.env.example`** — `CHAT_AI_OFFERS=` 바로 뒤에:

```
# 대화가 10분 멈추면 Slack 방에 'AI 응대 요약' 1개 (스펙 2026-10-22 chat-ai-slack-transcript). 비우면 켜짐, off 면 요약만 멈춘다(AI 답 전문은 그대로 방에 올라간다).
# 마이그레이션 045 를 코드보다 먼저 적용한다(없으면 요약만 건너뛴다)
CHAT_AI_SUMMARY=
```

- [ ] **Step 2: Slack 설정 문서**
  - 머리 개정 줄들 끝에: `> 2026-10-22 개정(4): 방의 \`AI 응대\` 글이 요지 한 줄에서 **손님에게 나간 답의 한국어 번역 전문**으로 바뀌고, 대화가 10분 멈추면 \`📝 AI 응대 요약\` 1개가 올라온다(설계 \`2026-10-22-chat-ai-slack-transcript-design.md\`). §6에 \`CHAT_AI_SUMMARY\`, 예약 함수는 매일 24시간 돈다. 배포 전에 마이그레이션 045를 먼저 적용한다.`
  - §6 표의 `CHAT_AI_OFFERS` 줄 뒤에: `| \`CHAT_AI_SUMMARY\` | 비워 둠 | **AI 응대 요약 스위치**(2026-10-22 추가). 비어 있으면 켜짐 — 대화가 10분 멈추면 방에 요약 1개. \`off\` = 요약만 멈춤(AI 답 전문은 그대로). 긴급 정지: \`off\`로 두고 재배포 |`
  - §9 "방에 "AI 응대"라는 이름표로 올라오는 글은 AI가 손님에게 한 답의 요지입니다(직원만 봅니다)." → `방에 "AI 응대"라는 이름표로 올라오는 글은 AI가 손님에게 실제로 한 답(한국어 번역)입니다(직원만 봅니다). 대화가 10분쯤 멈추면 "📝 AI 응대 요약"이 하나 올라옵니다 — 손님이 물은 것 · AI가 답한 것 · 직원이 할 일.`
  - §9 ""AI 응대" 요지 아래의 "> 제안:" 줄이 AI가 안내한 구성입니다." → `"AI 응대" 글에 AI가 안내한 구성이 그대로 보입니다.`
- [ ] **Step 3: 10/2 설계서 §4.11 · 제안형 설계서 §4.6** — 각 절 제목 바로 아래에 한 줄: `> [변경 2026-10-22] 방의 \`AI 응대\` 글은 요지가 아니라 손님에게 나간 답의 한국어 번역 전문이다. 요지 · \`> 안내한 금액:\`(번역이 금액을 빠뜨렸을 때만 남는다) · \`> 제안:\` 줄은 없어졌고, 대화가 멈추면 요약 1개가 올라온다 — \`2026-10-22-chat-ai-slack-transcript-design.md\`.`

- [ ] **Step 4: 전체 검증**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npm run verify:i18n 2>&1 | tail -1
cd "D:/dev/LIV_homepage-slack-rooms" && git diff --name-only --diff-filter=AM origin/master...HEAD -- 'liv-clinic/*.ts' 'liv-clinic/*.tsx' 'liv-clinic/*.mjs' 'liv-clinic/*.mts' | sed 's#^liv-clinic/##' > /tmp/lintfiles.txt && cd liv-clinic && tr '\n' '\0' < /tmp/lintfiles.txt | xargs -0 npx eslint && echo LINT-OK
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build 2>&1 | tail -4; echo "build exit: ${PIPESTATUS[0]}"
```
Expected: 테스트 전부 통과(85파일 이상), `TSC-OK`, i18n ✓, `LINT-OK`, `build exit: 0`(Google 글꼴 일시 오류면 한 번 더). 빌드가 다시 만든 `*.generated.ts` 세 개는 `git checkout --`으로 되돌린다.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add .env.example docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md docs/superpowers/specs/2026-10-12-chat-ai-guided-offers-design.md && git commit -m "docs(chat): AI 응대 글 전문 · 대화 요약 — 환경변수 CHAT_AI_SUMMARY, 직원 안내문, 설계서 변경 표시" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## 운영 반영 (이 계획 밖 — 단계마다 승인)

1. 045 dry-run → 적용 (`node scripts/_db/run-045.mjs` → `--apply`)
2. master 푸시 → Netlify 배포 `ready` 확인
3. 시험 모드(`CHAT_AI=test`)에서 `ai-test-…` 문의: 방에 한국어 전문, 10~13분 뒤 요약 1개, 다시 쓰고 멈추면 그 뒤 구간만의 두 번째 요약
