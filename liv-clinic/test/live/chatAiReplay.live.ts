// AI 응대 재생 시험 (스펙 2026-10-02 chat-ai-first-response §9 3단계).
// 손님 글 목록(사례 파일)을 실제 모델에 넣어, 운영 코드(runAiTurn — 지시문 · 검사 · 조립 · 가예약)가 내는 답을 표로 만든다.
// 운영 DB·Slack에는 닿지 않는다(메모리 DB). OpenAI 호출 비용이 든다 — 답 한 번에 약 2센트.
//
// 실행 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run --config vitest.live.config.ts
// 환경변수:
//   CHAT_AI_REPLAY_CASES  사례 파일(JSON). 기본 test/live/chat-ai-cases.sample.json
//   CHAT_AI_REPLAY_OUT    결과 폴더. 기본 ../output/ai-first-response/replay (git 이 추적하지 않는 폴더)
//   CHAT_AI_REPLAY_ONLY   쉼표로 구분한 사례 id — 그 사례만 돌린다
//   CHAT_AI_REPLAY_KO     off 로 두면 한국어 뜻(번역)을 만들지 않는다
//   OPENAI_CHAT_AI_MODEL · OPENAI_CHAT_AI_REASONING_EFFORT  비교할 모델을 바꿀 때
// 실제 문의(이름·연락처가 든 글)로 만든 사례 파일은 저장소에 커밋하지 않는다.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('@/lib/chat/broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));

// 모델이 낸 출력을 차례마다 모은다 — 검사에 걸려 버린 글(다시 쓰기 전의 글)을 JSON 에 남기려는 것. 호출은 실제 모델로 그대로 간다.
const { modelOutputs } = vi.hoisted(() => ({ modelOutputs: [] as string[] }));
vi.mock('@/lib/chat/ai/openai', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/chat/ai/openai')>();
  const callChatAi: typeof real.callChatAi = async (...args) => {
    const res = await real.callChatAi(...args);
    if (res.ok) modelOutputs.push(res.content);
    return res;
  };
  return { ...real, callChatAi };
});

import { _resetBusinessHoursForTesting } from '@/lib/chat/businessHours';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { _resetRateLimitForTesting } from '@/lib/chat/rateLimit';
import { translate } from '@/lib/chat/translation';
import { bookingSummaryKo } from '@/lib/chat/ai/booking';
import { priceQuoteKo } from '@/lib/chat/ai/knowledge';
import { readAiCallConfig } from '@/lib/chat/ai/openai';
import { decideAiTurn, runAiTurn } from '@/lib/chat/ai/turn';
import { memoryChatDb } from './memoryChatDb';

interface ReplayCase {
  id: string;
  locale: VisitorLocale;
  /** 그 대화가 시작되는 시각(ISO). 없으면 사례 파일의 defaultNow, 그것도 없으면 지금 */
  now?: string;
  /** 무엇을 보려는 사례인가 (한국어) */
  note?: string;
  /** 손님 글 — 순서대로 */
  turns: string[];
  /** 실제 직원 답(참고용, 한국어) */
  actual?: string[];
}
interface CaseFile {
  closedDates?: string;
  defaultNow?: string;
  cases: ReplayCase[];
}
interface TurnReport {
  visitor: string;
  visitorKo: string | null;
  outcome: string;
  reply: string | null;
  /** AI가 쓴 글 그대로(꼬리표 포함). 답이 나가지 못했으면 마지막으로 받은 출력 — 표에는 싣지 않고 JSON 에만 남긴다 */
  raw: string | null;
  replyKo: string | null;
  staffNoteKo: string | null;
  quotedRows: string[];
  bookingEvent: string | null;
  bookingKo: string | null;
  needsStaff: boolean;
  staffReasonKo: string | null;
  attempts: number | null;
  latencyMs: number | null;
  /** 검사에 걸린 이유 — 답이 나갔으면 다시 쓰기 전의 글이 걸린 이유다 */
  issues: string[];
  /** 검사에 걸려 버린 글(다시 쓰기 전에 AI가 쓴 글) — JSON 에만 남긴다 */
  rejectedDrafts: string[];
}

/** 모델 출력(JSON 글)에서 reply 만 꺼낸다. 읽지 못하면 출력 그대로. */
function replyOf(content: string): string {
  try {
    const reply = (JSON.parse(content) as { reply?: unknown }).reply;
    return typeof reply === 'string' ? reply : content;
  } catch {
    return content;
  }
}

function loadEnvLocal(): void {
  let raw = '';
  try {
    raw = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^(OPENAI_[A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SESSION_ID = '00000000-0000-4000-8000-000000000001';

it('AI 응대 재생 시험', async () => {
  loadEnvLocal();
  expect(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY 가 없다 (.env.local)').toBeTruthy();
  const casesPath = process.env.CHAT_AI_REPLAY_CASES ?? path.join(process.cwd(), 'test/live/chat-ai-cases.sample.json');
  const outDir = process.env.CHAT_AI_REPLAY_OUT ?? path.join(process.cwd(), '..', 'output', 'ai-first-response', 'replay');
  const only = (process.env.CHAT_AI_REPLAY_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const wantKo = (process.env.CHAT_AI_REPLAY_KO ?? '').toLowerCase() !== 'off';
  const file = JSON.parse(readFileSync(casesPath, 'utf8')) as CaseFile;

  process.env.CHAT_AI = 'on';
  process.env.CHAT_CLOSED_DATES = file.closedDates ?? '';
  _resetBusinessHoursForTesting();
  const config = readAiCallConfig();
  const ko = async (text: string, from: VisitorLocale): Promise<string | null> => {
    if (!wantKo) return null;
    const r = await translate(text, from, 'ko');
    return r.status === 'success' ? r.text : null;
  };

  const results: Array<{ id: string; locale: string; note: string | null; actual: string[]; turns: TurnReport[] }> = [];
  for (const c of file.cases) {
    if (only.length > 0 && !only.includes(c.id)) continue;
    _resetRateLimitForTesting();
    const start = new Date(c.now ?? file.defaultNow ?? Date.now());
    const db = memoryChatDb(
      {
        id: SESSION_ID,
        visitor_locale: c.locale,
        visitor_name: `replay ${c.id}`,
        visitor_email: null,
        visitor_messenger_channel: null,
        visitor_messenger_handle: null,
      },
      start
    );
    const turns: TurnReport[] = [];
    for (let i = 0; i < c.turns.length; i++) {
      const text = c.turns[i];
      const now = new Date(start.getTime() + i * 60_000);
      const triggerMessageId = db.addVisitorMessage(SESSION_ID, text);
      const report: TurnReport = {
        visitor: text,
        visitorKo: await ko(text, c.locale),
        outcome: '',
        reply: null,
        raw: null,
        replyKo: null,
        staffNoteKo: null,
        quotedRows: [],
        bookingEvent: null,
        bookingKo: null,
        needsStaff: false,
        staffReasonKo: null,
        attempts: null,
        latencyMs: null,
        issues: [],
        rejectedDrafts: [],
      };
      const decision = await decideAiTurn(db as never, SESSION_ID, text, now);
      if (!decision.run) {
        report.outcome = `skip:${decision.reason}`;
      } else {
        modelOutputs.length = 0;
        const out = await runAiTurn(db as never, { ctx: decision.ctx, triggerMessageId, text, now });
        // 답이 나갔으면 마지막 출력이 나간 글이고 그 앞의 것이 버린 글이다. 나가지 못했으면 모두 버린 글이다.
        report.rejectedDrafts = (out.kind === 'sent' ? modelOutputs.slice(0, -1) : modelOutputs.slice()).map(replyOf);
        const logged = db.tables.chat_ai_turns[db.tables.chat_ai_turns.length - 1] ?? {};
        report.outcome = out.kind;
        report.attempts = (logged.attempts as number | undefined) ?? null;
        report.latencyMs = (logged.latency_ms as number | undefined) ?? null;
        report.issues = (logged.issues as string[] | null | undefined) ?? [];
        report.raw = (logged.raw_reply as string | null | undefined) ?? null;
        if (out.kind === 'sent') {
          report.reply = out.text;
          report.replyKo = await ko(out.text, c.locale);
          report.staffNoteKo = out.staffNoteKo;
          report.quotedRows = out.usedRows.map(priceQuoteKo);
          report.bookingEvent = out.bookingEvent;
          report.bookingKo = bookingSummaryKo(out.booking, out.contact) || null;
          report.needsStaff = out.needsStaff;
          report.staffReasonKo = out.staffReasonKo;
        } else if (out.kind === 'fallback') {
          report.issues = report.issues.length > 0 ? report.issues : [out.reason];
        }
      }
      turns.push(report);
      console.log(
        `${c.id} #${i + 1} ${report.outcome}${report.latencyMs ? ` ${report.latencyMs}ms` : ''}${report.attempts && report.attempts > 1 ? ` (시도 ${report.attempts})` : ''}${report.needsStaff ? ' 🙋' : ''}${report.bookingEvent ? ` 🗓 ${report.bookingEvent}` : ''}${report.issues.length ? ` ⚠ ${report.issues.join(' | ')}` : ''}`
      );
    }
    results.push({ id: c.id, locale: c.locale, note: c.note ?? null, actual: c.actual ?? [], turns });
  }

  // 요약
  const all = results.flatMap((r) => r.turns);
  const sent = all.filter((t) => t.outcome === 'sent');
  const ms = sent.map((t) => t.latencyMs ?? 0).sort((a, b) => a - b);
  const summary = {
    model: config.model,
    reasoningEffort: config.reasoningEffort,
    cases: results.length,
    turns: all.length,
    sent: sent.length,
    fallback: all.filter((t) => t.outcome === 'fallback').length,
    retried: all.filter((t) => (t.attempts ?? 0) > 1).length,
    needsStaff: sent.filter((t) => t.needsStaff).length,
    bookings: sent.filter((t) => t.bookingEvent === 'requested').length,
    medianMs: ms.length ? ms[Math.floor(ms.length / 2)] : null,
    maxMs: ms.length ? ms[ms.length - 1] : null,
  };

  // 표(마크다운)
  const md: string[] = [
    `# AI 응대 재생 시험 — ${summary.model} (추론 강도 ${summary.reasoningEffort})`,
    '',
    `사례 ${summary.cases}개 · 손님 글 ${summary.turns}건 · 답 나감 ${summary.sent} · 접수 안내로 대체 ${summary.fallback} · 다시 쓴 답 ${summary.retried} · 직원 확인 필요 ${summary.needsStaff} · 가예약 ${summary.bookings} · 답까지 걸린 시간 중앙값 ${summary.medianMs}ms / 최대 ${summary.maxMs}ms`,
    '',
  ];
  for (const r of results) {
    md.push(`## ${r.id} (${r.locale})${r.note ? ` — ${r.note}` : ''}`, '');
    r.turns.forEach((t, i) => {
      md.push(`**손님 ${i + 1}**: ${t.visitor}`);
      if (t.visitorKo && t.visitorKo !== t.visitor) md.push(`> 뜻: ${t.visitorKo}`);
      md.push('');
      if (t.reply === null) {
        md.push(`**AI**: (답이 나가지 않음 — ${t.outcome}${t.issues.length ? ` · ${t.issues.join(' | ')}` : ''})`, '');
        return;
      }
      md.push('**AI**:', '```', t.reply, '```');
      if (t.replyKo) md.push('뜻:', '```', t.replyKo, '```');
      const facts = [
        t.staffNoteKo ? `직원용 요지: ${t.staffNoteKo}` : '',
        t.quotedRows.length ? `안내한 금액: ${t.quotedRows.join(' / ')}` : '',
        t.bookingEvent ? `🗓 가예약${t.bookingEvent === 'changed' ? ' 변경' : ''} · ${t.bookingKo}` : t.bookingKo ? `(가예약 받는 중: ${t.bookingKo})` : '',
        t.needsStaff ? `🙋 직원 확인 필요 · ${t.staffReasonKo ?? ''}` : '',
        `${t.latencyMs}ms${(t.attempts ?? 1) > 1 ? ` · 시도 ${t.attempts}회${t.issues.length ? ` (처음 걸린 이유: ${t.issues.join(' | ')})` : ''}` : ''}`,
      ].filter(Boolean);
      md.push(...facts.map((f) => `- ${f}`), '');
    });
    if (r.actual.length) md.push('**실제 직원 답(참고)**', ...r.actual.map((a) => `- ${a}`), '');
  }

  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = path.join(outDir, `replay-${config.model}-${stamp}`);
  writeFileSync(`${base}.json`, JSON.stringify({ summary, results }, null, 1), 'utf8');
  writeFileSync(`${base}.md`, md.join('\n'), 'utf8');
  console.log('요약', JSON.stringify(summary));
  console.log('결과', `${base}.md`);

  expect(all.length).toBeGreaterThan(0);
});
