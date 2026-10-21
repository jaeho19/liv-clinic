import 'server-only';
import { broadcastToSession } from '@/lib/chat/broadcast';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { chatAiMode } from '@/lib/chat/chatFlags';
import type { ContactChannel } from '@/lib/chat/contactChannels';
import { saveVisitorContact } from '@/lib/chat/contactService';
import type { ChatAdminClient } from '@/lib/chat/db';
import { checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { assembleReply, MAX_ASSEMBLED_CHARS, type Assembled } from './assemble';
import {
  bookingEvent,
  bookingPromptText,
  contactInVisitorText,
  effectiveContact,
  mergeBooking,
  sameContact,
  sessionContactOf,
  type BookingEvent,
  type BookingFields,
  type ContactRef,
} from './booking';
import { loadBooking, saveBooking } from './bookingStore';
import { buildCalendarText, currentCalendarContext, nowLine, promiseEnglish, replyPromise } from './calendar';
import { aiAppliesTo, decideAi, hasSubstance, readAiLimits, type AiSkipReason } from './eligibility';
import { checkReplyText, parseAiOutput, retryFeedback, sanitizeBookingText, type AiOutput, type GuardContext } from './guards';
import { CLINIC_HANDLES, CLINIC_PHONE_DIGITS, getKnowledge, type PriceRow } from './knowledge';
import { ALLOWED_PERCENTS } from './knowledge/scope';
import { callChatAi, readAiCallConfig, type AiMessage, type AiUsage } from './openai';
import { buildHistory, buildSystemPrompt, HISTORY_MAX_MESSAGES, type HistoryMessage } from './prompt';

// AI 응대의 한 차례 (스펙 2026-10-02 chat-ai-first-response §4.1 · §4.2 · §4.9). throw 하지 않는다.
//   decideAiTurn : 이 손님 글에 AI가 답할 차례인가 (스위치 · 직원 담당 · 한도)
//   runAiTurn    : 답을 만들어(검사 → 한 번 다시 쓰기) 손님 화면에 내보내고, 가예약과 기록을 남긴다
// Slack 게시와 접수 안내로의 대체는 호출자(visitorMessageFollowups.ts)가 결과를 보고 한다.

/** 답을 버릴지 볼 때 읽는 최근 손님 글의 수 */
const SUPERSEDE_LOOKBACK = 6;
/** 답을 만드는 데 쓰는 전체 시간 (재시도 포함). Netlify 함수 한도 60초 안에서 Slack 게시·번역까지 끝나야 한다 */
const TOTAL_BUDGET_MS = 22_000;
/** 이보다 적게 남으면 다시 부르지 않는다 */
const MIN_ATTEMPT_MS = 4_000;
const MAX_ATTEMPTS = 2;
export const AI_SENDER_LABEL = 'AI 응대';

const digitsOf = (s: string): string => s.replace(/\D/g, '');

export interface AiTurnContext {
  sessionId: string;
  locale: VisitorLocale;
  visitorEmail: string | null;
  messengerChannel: string | null;
  messengerHandle: string | null;
  /** 가예약에 쓸 세션의 연락처 (메신저가 있으면 메신저, 없으면 이메일) */
  sessionContact: ContactRef | null;
  /** 🙋 멘션을 이미 보냈으면 그 시각 (chat_sessions.ai_handoff_at) */
  handoffAt: string | null;
}

/**
 * reason 'no_substance' 는 AI가 맡은 대화(스위치 대상이고 직원이 맡지 않았다)에서만 나온다 —
 * 호출자는 그 글에 접수 안내도 보내지 않는다. 그 밖의 이유는 "지금 방식대로"다.
 */
export type AiTurnDecision =
  | { run: true; ctx: AiTurnContext }
  | { run: false; reason: AiSkipReason | 'error'; ctx: AiTurnContext | null };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 이 손님 글에 AI가 답할 차례인가.
 * 043 의 새 컬럼은 여기서 따로 읽는다 — 조회가 실패하면(043 미적용) 'error' 로 돌아가 AI만 답하지 않는다.
 */
export async function decideAiTurn(
  admin: ChatAdminClient,
  sessionId: string,
  text: string,
  now: Date = new Date()
): Promise<AiTurnDecision> {
  const mode = chatAiMode();
  if (mode === 'off') return { run: false, reason: 'off', ctx: null };
  if (!process.env.OPENAI_API_KEY) return { run: false, reason: 'no_key', ctx: null };
  try {
    const { data: s, error } = await admin
      .from('chat_sessions')
      .select(
        'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, staff_engaged_at, ai_handoff_at'
      )
      .eq('id', sessionId)
      .maybeSingle();
    if (error || !s) {
      console.warn('[chat ai] session read failed:', error?.code ?? 'not_found');
      return { run: false, reason: 'error', ctx: null };
    }
    const ctx: AiTurnContext = {
      sessionId,
      locale: s.visitor_locale as VisitorLocale,
      visitorEmail: s.visitor_email,
      messengerChannel: s.visitor_messenger_channel,
      messengerHandle: s.visitor_messenger_handle,
      sessionContact: sessionContactOf(s),
      handoffAt: s.ai_handoff_at,
    };
    if (!aiAppliesTo(mode, s.visitor_name)) return { run: false, reason: 'off', ctx };
    if (s.staff_engaged_at) return { run: false, reason: 'staff_engaged', ctx };
    // 이모지·문장부호뿐인 글 — AI가 맡은 대화지만 답할 내용이 없다 (호출 수도 세지 않는다)
    if (!hasSubstance(text)) return { run: false, reason: 'no_substance', ctx };

    // 대화당 한도는 결과와 상관없이 센다 — 글을 연달아 보내면 차례마다 모델을 부르고 버리므로,
    // 나간 답만 세면 한 대화가 하루 한도(모든 손님이 함께 쓴다)를 다 태울 수 있다.
    const since = new Date(now.getTime() - DAY_MS).toISOString();
    const [sessionCount, dailyCount] = await Promise.all([
      admin.from('chat_ai_turns').select('id', { count: 'exact', head: true }).eq('session_id', sessionId),
      admin.from('chat_ai_turns').select('id', { count: 'exact', head: true }).gte('created_at', since),
    ]);
    if (sessionCount.error || dailyCount.error) {
      console.warn('[chat ai] turn count failed:', (sessionCount.error ?? dailyCount.error)?.code ?? 'unknown');
      return { run: false, reason: 'error', ctx };
    }
    const decision = decideAi({
      mode,
      hasKey: true,
      visitorName: s.visitor_name,
      text,
      staffEngagedAt: s.staff_engaged_at,
      sessionTurns: sessionCount.count ?? 0,
      dailyCalls: dailyCount.count ?? 0,
      limits: readAiLimits(),
    });
    if (!decision.eligible) {
      if (decision.reason === 'daily_cap') console.warn('[chat ai] daily cap reached — AI replies paused');
      return { run: false, reason: decision.reason, ctx };
    }
    return { run: true, ctx };
  } catch (e) {
    console.warn('[chat ai] decide failed:', e);
    return { run: false, reason: 'error', ctx: null };
  }
}

export interface AiTurnSent {
  kind: 'sent';
  /** 나간 AI 글의 chat_messages.id */
  messageId: string;
  /** 손님에게 나간 글 (조립한 것) */
  text: string;
  /** 직원에게 보일 요지 */
  staffNoteKo: string;
  /** 이 답에 쓰인 가격 줄 */
  usedRows: PriceRow[];
  /** 가예약이 처음 찼는가 · 찬 뒤에 바뀌었는가 */
  bookingEvent: BookingEvent;
  booking: BookingFields;
  /** 가예약에 쓰는 연락처 */
  contact: ContactRef | null;
  needsStaff: boolean;
  staffReasonKo: string | null;
  /** 가예약이 차지 않았는데 연락처를 새로 저장했다 → 방에 연락처 알림(초록 막대)을 올린다 */
  contactSaved: ContactRef | null;
}

export type AiTurnOutcome =
  | AiTurnSent
  /** 답을 내지 못했다 → 호출자가 접수 안내로 대신하고 직원에게 알린다 */
  | { kind: 'fallback'; reason: string }
  /** 더 새 손님 글이 있거나 그 사이 직원이 답했다 → 아무것도 하지 않는다 */
  | { kind: 'superseded' };

export interface RunAiTurnArgs {
  ctx: AiTurnContext;
  /** 답하려는 손님 글의 chat_messages.id */
  triggerMessageId: string;
  /** 그 글의 원문 */
  text: string;
  now?: Date;
}

interface Accepted {
  output: AiOutput;
  booking: BookingFields;
  event: BookingEvent;
  contact: ContactRef | null;
  assembled: Assembled;
}

interface TurnLog {
  outcome: 'sent' | 'fallback' | 'superseded';
  replyMessageId?: string | null;
  attempts: number;
  latencyMs: number;
  usage: AiUsage | null;
  rawReply: string | null;
  historyText?: string | null;
  staffNoteKo?: string | null;
  needsStaff?: boolean;
  staffReasonKo?: string | null;
  issues: string[];
}

export async function runAiTurn(admin: ChatAdminClient, args: RunAiTurnArgs): Promise<AiTurnOutcome> {
  const started = Date.now();
  const now = args.now ?? new Date();
  const { ctx } = args;
  const config = readAiCallConfig();
  let attempts = 0;
  let usage: AiUsage | null = null;
  let modelMs = 0;
  let lastRaw: string | null = null;
  let lastIssues: string[] = [];
  /** 버린 시도가 걸린 이유 — 다시 써서 나간 답의 기록에도 남긴다 (매주 점검에서 "왜 다시 썼는가"를 본다) */
  const rejected: string[] = [];

  const log = async (entry: TurnLog): Promise<void> => {
    try {
      const { error } = await admin.from('chat_ai_turns').insert({
        session_id: ctx.sessionId,
        trigger_message_id: args.triggerMessageId,
        reply_message_id: entry.replyMessageId ?? null,
        outcome: entry.outcome,
        model: config.model,
        attempts: entry.attempts,
        latency_ms: entry.latencyMs,
        prompt_tokens: entry.usage?.promptTokens ?? null,
        cached_tokens: entry.usage?.cachedTokens ?? null,
        completion_tokens: entry.usage?.completionTokens ?? null,
        raw_reply: entry.rawReply,
        history_text: entry.historyText ?? null,
        staff_note_ko: entry.staffNoteKo ?? null,
        needs_staff: entry.needsStaff ?? false,
        staff_reason_ko: entry.staffReasonKo ?? null,
        issues: entry.issues.length > 0 ? entry.issues : null,
      });
      if (error) console.warn('[chat ai] turn log failed:', error.code ?? 'unknown');
    } catch (e) {
      console.warn('[chat ai] turn log threw:', e);
    }
  };
  const fallback = async (reason: string): Promise<AiTurnOutcome> => {
    console.warn('[chat ai] fallback:', reason);
    await log({ outcome: 'fallback', attempts, latencyMs: modelMs, usage, rawReply: lastRaw, issues: lastIssues.length ? lastIssues : [reason] });
    return { kind: 'fallback', reason };
  };

  try {
    // 1. 대화 이력 · 가예약 · AI가 냈던 답의 이력용 글
    const [messagesRes, stored, turnsRes] = await Promise.all([
      admin
        .from('chat_messages')
        .select('id, sender, source, original_text, translated_text, created_at')
        .eq('session_id', ctx.sessionId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_MAX_MESSAGES + 10),
      loadBooking(admin, ctx.sessionId),
      admin
        .from('chat_ai_turns')
        .select('reply_message_id, history_text')
        .eq('session_id', ctx.sessionId)
        .eq('outcome', 'sent')
        .order('created_at', { ascending: false })
        .limit(HISTORY_MAX_MESSAGES + 10),
    ]);
    if (messagesRes.error || turnsRes.error || !stored) return fallback('context_read_failed');

    const rows = [...((messagesRes.data ?? []) as HistoryMessage[])].reverse();
    const aiHistoryById = new Map<string, string>();
    for (const t of (turnsRes.data ?? []) as Array<{ reply_message_id: string | null; history_text: string | null }>) {
      if (t.reply_message_id && t.history_text) aiHistoryById.set(t.reply_message_id, t.history_text);
    }
    const history = buildHistory(rows, aiHistoryById);
    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      history.push({ role: 'user', content: args.text });
    }

    // 2. 지시문
    const knowledge = getKnowledge(ctx.locale, now);
    const calendar = currentCalendarContext();
    const promise = replyPromise(now, calendar);
    const system = buildSystemPrompt(knowledge, {
      locale: ctx.locale,
      calendarText: buildCalendarText(now, calendar),
      nowLine: nowLine(now, calendar),
      replyPromise: promiseEnglish(promise),
      bookingText: bookingPromptText(stored.fields, ctx.sessionContact),
    });
    const baseMessages: AiMessage[] = [{ role: 'system', content: system }, ...history];

    // AI가 낸 연락처는 손님 글에 실제로 있는 것만 받는다(이미 저장된 연락처와 같은 것은 그대로 둔다).
    // 지어낸 번호 · 다른 사람의 아이디가 가예약 요약에 찍히거나 "손님 연락처"로 검사를 통과하지 않게 한다.
    const visitorTexts = rows
      .filter((m) => m.sender === 'visitor')
      .map((m) => m.original_text)
      .concat(args.text);
    const storedContact: ContactRef | null =
      stored.fields.contactChannel && stored.fields.contactHandle
        ? { channel: stored.fields.contactChannel, handle: stored.fields.contactHandle }
        : null;
    const groundContact = (given: BookingFields): BookingFields => {
      if (given.contactHandle === null) return given;
      const ref: ContactRef | null = given.contactChannel ? { channel: given.contactChannel, handle: given.contactHandle } : null;
      const known = sameContact(ref, ctx.sessionContact) || sameContact(ref, storedContact);
      if (known || contactInVisitorText(given.contactHandle, visitorTexts)) return given;
      console.warn('[chat ai] contact not found in visitor messages — dropped');
      return { ...given, contactChannel: null, contactHandle: null };
    };

    // 검사 C-7 · C-8 에서 통과시킬 것: 병원 번호 · 아이디, 손님이 연락처로 남긴 번호 · 아이디 · 메일(세션 · 가예약 · 이번 출력).
    // 손님이 글에 적은 숫자는 넣지 않는다 — "1500000 won" 을 전화번호로 보고 통과시키면 AI가 그 금액을 따라 쓸 수 있다.
    const guardFor = (booking: BookingFields): GuardContext => {
      const contacts: Array<{ channel: string | null; handle: string | null }> = [
        { channel: ctx.messengerChannel, handle: ctx.messengerHandle },
        { channel: 'email', handle: ctx.visitorEmail },
        { channel: stored.fields.contactChannel, handle: stored.fields.contactHandle },
        { channel: booking.contactChannel, handle: booking.contactHandle },
      ];
      const handles = (email: boolean): string[] =>
        contacts.filter((c) => (c.channel === 'email') === email).flatMap((c) => (c.handle ? [c.handle] : []));
      return {
        rowIds: new Set(knowledge.rowById.keys()),
        allowedUrls: knowledge.allowedUrls,
        allowedPercents: ALLOWED_PERCENTS,
        allowedPhoneDigits: [...CLINIC_PHONE_DIGITS, ...handles(false).map(digitsOf)],
        allowedEmails: handles(true),
        allowedHandles: [...CLINIC_HANDLES, ...handles(false)],
      };
    };

    // 3. 답 만들기 — 검사에 걸리면 이유를 알려 한 번 다시 쓰게 한다
    let accepted: Accepted | null = null;
    let messages = baseMessages;
    while (attempts < MAX_ATTEMPTS && accepted === null) {
      const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
      if (remaining < MIN_ATTEMPT_MS) break;
      attempts += 1;
      const res = await callChatAi(messages, config, { timeoutMs: Math.min(config.timeoutMs, remaining) });
      modelMs += res.latencyMs;
      if (!res.ok) {
        lastIssues = [`call:${res.error}`];
        rejected.push(...lastIssues);
        if (res.error === 'no_api_key') break;
        continue;
      }
      usage = res.usage;
      lastRaw = res.content;
      const output = parseAiOutput(res.content);
      let issues: string[];
      let candidate: Accepted | null = null;
      if (!output) {
        issues = ['json'];
      } else {
        const given = groundContact(output.booking);
        const guard = guardFor(given);
        // 가예약 요약에 그대로 찍히는 칸(시술 · 이름 · 시각 · 시간 메모)도 검사한다 — 걸린 칸은 받지 않는다
        const clean = sanitizeBookingText(given, guard);
        if (clean.dropped.length > 0) console.warn('[chat ai] booking text dropped:', clean.dropped.join(','));
        const merged = mergeBooking(stored.fields, clean.booking, now, calendar);
        issues = [...checkReplyText(output.reply, guard), ...merged.issues];
        if (issues.length === 0) {
          const event = bookingEvent({ status: stored.status, notifiedKey: stored.notifiedKey }, merged.next, ctx.sessionContact);
          const contact = effectiveContact(merged.next, ctx.sessionContact);
          const assembled = assembleReply({
            locale: ctx.locale,
            reply: output.reply,
            rowById: knowledge.rowById,
            identityQuestion: output.identityQuestion,
            bookingEvent: event,
            booking: merged.next,
            contact,
            promise,
          });
          if (assembled.text.length > MAX_ASSEMBLED_CHARS) issues.push(`too_long:${assembled.text.length}`);
          else candidate = { output, booking: merged.next, event, contact, assembled };
        }
      }
      if (candidate) {
        accepted = candidate;
        lastIssues = [];
      } else {
        lastIssues = issues;
        rejected.push(...issues);
        messages = [
          ...baseMessages,
          { role: 'assistant', content: res.content.slice(0, 4000) },
          { role: 'system', content: retryFeedback(issues) },
        ];
      }
    }
    if (!accepted) return fallback(lastIssues.join(' | ') || 'no_time');

    // 4. 더 새 손님 글이 있거나 그 사이 직원이 답했으면 이 답은 버린다.
    //    뒤따라온 글이 이모지·문장부호뿐이면("🙏") 새 글로 치지 않는다 — 그 글에는 아무도 답하지 않으므로 이 답이 나가야 한다.
    const [recentRes, engagedRes] = await Promise.all([
      admin
        .from('chat_messages')
        .select('id, original_text')
        .eq('session_id', ctx.sessionId)
        .eq('sender', 'visitor')
        .order('created_at', { ascending: false })
        .limit(SUPERSEDE_LOOKBACK),
      admin.from('chat_sessions').select('staff_engaged_at').eq('id', ctx.sessionId).maybeSingle(),
    ]);
    // 확인하지 못했으면 내보내지 않는다 — 직원이 이미 답했는지 모르는 채로 AI 글이 뒤따라 나가면 안 된다
    if (recentRes.error || engagedRes.error) {
      lastIssues = [`supersede_check:${(recentRes.error ?? engagedRes.error)?.code ?? 'unknown'}`];
      return fallback('supersede_check_failed');
    }
    const recent = (recentRes.data ?? []) as Array<{ id: string; original_text: string }>;
    const latest = recent.find((m) => hasSubstance(m.original_text));
    const newerVisitorMessage = Boolean(latest && latest.id !== args.triggerMessageId);
    if (newerVisitorMessage || engagedRes.data?.staff_engaged_at) {
      await log({ outcome: 'superseded', attempts, latencyMs: modelMs, usage, rawReply: lastRaw, issues: [] });
      return { kind: 'superseded' };
    }

    // 5. 손님 화면에 내보낸다. original_text 는 한국어 번역이 끝나면 그 번역으로 바뀐다(뒤처리)
    const { output, booking, event, contact, assembled } = accepted;
    const { data: inserted, error: insertError } = await admin
      .from('chat_messages')
      .insert({
        session_id: ctx.sessionId,
        sender: 'operator',
        sender_admin_id: null,
        original_text: assembled.text,
        original_lang: 'ko',
        translated_text: assembled.text,
        translated_lang: ctx.locale,
        translation_status: 'success',
        translation_latency_ms: modelMs,
        source: 'ai',
        sender_label: AI_SENDER_LABEL,
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      lastIssues = [`insert:${insertError?.code ?? 'unknown'}`];
      return fallback('insert_failed');
    }
    await broadcastToSession(ctx.sessionId, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });

    // 6. 가예약과 연락처 저장 — 글이 나간 뒤에 한다. 먼저 저장하고 글이 못 나가면 "직원에게 알렸다"는 표시만 남아
    //    요약과 알림이 영영 나가지 않는다. 저장이 실패하면 다음 차례에 다시 알리게 될 뿐이다(겹쳐 알리는 쪽이 안전하다).
    await saveBooking(admin, ctx.sessionId, stored, booking, event, ctx.sessionContact, now);
    let contactSaved: ContactRef | null = null;
    if (booking.contactChannel && booking.contactHandle) {
      const given: ContactRef = { channel: booking.contactChannel, handle: booking.contactHandle };
      const onFile: ContactRef | null =
        given.channel === 'email'
          ? ctx.visitorEmail
            ? { channel: 'email', handle: ctx.visitorEmail }
            : null
          : ctx.messengerChannel === given.channel && ctx.messengerHandle
            ? { channel: given.channel, handle: ctx.messengerHandle }
            : null;
      if (!sameContact(given, onFile) && checkContactSaveLimit(ctx.sessionId).allowed) {
        const saved = await saveVisitorContact(
          admin,
          { id: ctx.sessionId, visitor_locale: ctx.locale },
          { channel: given.channel as ContactChannel, handle: given.handle },
          { confirm: false }
        );
        // 가예약 알림(파란 막대)에 연락처가 들어가므로, 가예약이 차지 않았을 때만 따로 알린다
        if (saved.ok && !event) contactSaved = given;
      }
    }

    await log({
      outcome: 'sent',
      replyMessageId: inserted.id,
      attempts,
      latencyMs: modelMs,
      usage,
      rawReply: output.reply,
      historyText: assembled.historyText,
      staffNoteKo: output.staffNoteKo,
      needsStaff: output.needsStaff,
      staffReasonKo: output.staffReasonKo,
      issues: rejected,
    });

    return {
      kind: 'sent',
      messageId: inserted.id,
      text: assembled.text,
      staffNoteKo: output.staffNoteKo,
      usedRows: assembled.usedRows,
      bookingEvent: event,
      booking,
      contact,
      needsStaff: output.needsStaff,
      staffReasonKo: output.staffReasonKo,
      contactSaved,
    };
  } catch (e) {
    console.warn('[chat ai] turn threw:', e);
    return fallback('exception');
  }
}
