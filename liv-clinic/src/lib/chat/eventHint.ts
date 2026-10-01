import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { isEventHintEnabled } from '@/lib/chat/chatFlags';
import { looksLikePriceQuestion } from '@/lib/chat/priceIntent';
import { composeEventHintTexts, type VisitorLocale } from '@/lib/chat/serverI18n';
import { SITE_URL } from '@/lib/siteEnvironment';

// 가격 문의에 이벤트 안내 (스펙 2026-10-01 §4.10).
// 가격은 계속 직원이 답한다 — 여기서는 직원이 확인하는 동안 손님이 볼 프로모션 페이지 링크만 먼저 보낸다.
// 메시지는 자동 안내와 같은 꼴(source='auto')이라 대기 시계·미응답 수·확대 알림을 건드리지 않는다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한 손님에게 이벤트 안내를 다시 보내기까지의 간격 — 접수 안내와 같은 12시간. */
export const EVENT_HINT_REPEAT_MS = 12 * 60 * 60 * 1000;
/** 직원 글이 이 시간 안에 있으면 끼어들지 않는다 — 연락처 카드와 같은 10분. */
export const EVENT_HINT_STAFF_ACTIVE_MS = 10 * 60 * 1000;

function kstDate(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

/** 한국 날짜 'YYYY-MM-DD' */
export function kstDateKey(now: Date): string {
  return kstDate(now).toISOString().slice(0, 10);
}

/**
 * 이번 달 프로모션의 주소(slug) — 관리자 화면 「매달 프로모션」이 만드는 꼴 (monthlyPromotionTemplate.ts).
 * "진행 중인 이벤트"가 아니라 주소로 찾는다: 상시 이벤트나 미리 시작된 다음 달 프로모션과 섞이지 않는다.
 */
export function currentPromotionSlug(now: Date): string {
  return `${kstDate(now).toISOString().slice(0, 7)}-promotion`;
}

/** 손님에게 보낼 링크: 이번 달 프로모션이 게시돼 있으면 상세, 없으면 이벤트 목록. */
export function eventHintUrl(locale: string, promotionSlug: string | null): string {
  const base = `${SITE_URL}/${locale}/events`;
  return promotionSlug ? `${base}/${promotionSlug}` : base;
}

/** 12시간 안에 이미 보냈거나, 직원이 10분 안에 답하고 있는 대화면 보내지 않는다 (순수). */
export function shouldSendEventHint(s: { eventHintAt: string | null; lastStaffAt: string | null }, now: Date): boolean {
  const nowMs = now.getTime();
  if (s.eventHintAt && nowMs - Date.parse(s.eventHintAt) <= EVENT_HINT_REPEAT_MS) return false;
  if (s.lastStaffAt && nowMs - Date.parse(s.lastStaffAt) < EVENT_HINT_STAFF_ACTIVE_MS) return false;
  return true;
}

export type EventHintOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';

/**
 * 손님 글이 가격·프로모션 문의로 보이면 이벤트 안내를 보낸다. throw하지 않는다.
 * 낱말이 없거나 긴급 정지(CHAT_EVENT_HINT=off) 상태면 DB를 건드리지 않고 돌아온다.
 */
export async function sendEventHintIfDue(
  admin: ChatAdminClient,
  sessionId: string,
  text: string,
  now = new Date()
): Promise<{ outcome: EventHintOutcome; url?: string }> {
  try {
    if (!isEventHintEnabled() || !looksLikePriceQuestion(text)) return { outcome: 'not_due' };

    const slug = currentPromotionSlug(now);
    const [sessionRes, staffRes, promoRes] = await Promise.all([
      // event_hint_at 은 042의 새 컬럼 — 자동 안내의 세션 조회와 따로 읽는다(042 적용 전 배포에서 자동 안내까지 깨지지 않게).
      admin.from('chat_sessions').select('id, visitor_locale, event_hint_at').eq('id', sessionId).maybeSingle(),
      // 마지막 직원 글 — 자동 안내(source='auto')는 직원 글이 아니다
      admin
        .from('chat_messages')
        .select('created_at')
        .eq('session_id', sessionId)
        .eq('sender', 'operator')
        .in('source', ['app', 'slack'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('events')
        .select('slug')
        .eq('slug', slug)
        .eq('is_published', true)
        .gte('end_date', kstDateKey(now))
        .maybeSingle(),
    ]);
    if (sessionRes.error) {
      console.warn('[event hint] session read failed:', sessionRes.error.code ?? 'unknown');
      return { outcome: 'error' };
    }
    if (staffRes.error) {
      console.warn('[event hint] staff message read failed:', staffRes.error.code ?? 'unknown');
      return { outcome: 'error' };
    }
    const session = sessionRes.data;
    if (!session) return { outcome: 'not_due' };
    if (
      !shouldSendEventHint({ eventHintAt: session.event_hint_at, lastStaffAt: staffRes.data?.created_at ?? null }, now)
    ) {
      return { outcome: 'not_due' };
    }

    // 조건부 선점 — 읽은 값이 그대로일 때만 1행. 손님이 가격을 연달아 물어도 한 번만 나간다.
    let claim = admin.from('chat_sessions').update({ event_hint_at: now.toISOString() }).eq('id', sessionId);
    claim = session.event_hint_at
      ? claim.eq('event_hint_at', session.event_hint_at)
      : claim.is('event_hint_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError) {
      console.warn('[event hint] claim failed:', claimError.code ?? 'unknown');
      return { outcome: 'error' };
    }
    if (!claimed || claimed.length === 0) return { outcome: 'lost_race' };

    // 이번 달 프로모션 조회가 실패했거나 아직 게시 전이면 이벤트 목록으로 보낸다 — 안내 자체는 나간다.
    if (promoRes.error) console.warn('[event hint] promotion lookup failed:', promoRes.error.code ?? 'unknown');
    const published = !promoRes.error && Boolean(promoRes.data);
    const locale = session.visitor_locale as VisitorLocale;
    const url = eventHintUrl(locale, published ? slug : null);
    const texts = composeEventHintTexts(locale, published ? 'promotion' : 'list', url);

    const { data: inserted, error: insertError } = await admin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'operator',
        sender_admin_id: null,
        original_text: texts.ko,
        original_lang: 'ko',
        translated_text: texts.localized,
        translated_lang: locale,
        translation_status: 'success',
        translation_latency_ms: 0,
        source: 'auto',
        sender_label: '자동 안내',
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.warn('[event hint] insert failed:', insertError?.code ?? 'unknown');
      return { outcome: 'error' };
    }
    await broadcastToSession(sessionId, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return { outcome: 'sent', url };
  } catch (e) {
    console.warn('[event hint] failed:', e);
    return { outcome: 'error' };
  }
}
