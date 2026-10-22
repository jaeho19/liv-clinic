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
      .in(
        'session_id',
        sessions.map((s) => s.id)
      )
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
