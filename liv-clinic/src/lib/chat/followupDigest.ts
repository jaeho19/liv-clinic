import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import {
  CLOSING_SOON_MIN,
  dayRangeMinutes,
  getBusinessHoursConfig,
  type BusinessHoursConfig,
} from '@/lib/chat/businessHours';
import { isFollowupEnabled } from '@/lib/chat/chatFlags';
import { isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
import { loadStaffDirectory } from '@/lib/chat/slackStaff';
import {
  adminSessionUrl,
  buildFollowupDigestText,
  staffChannelLabel,
  type FollowupDigestItem,
} from '@/lib/chat/slackText';

// "오늘 연락할 손님" (스펙 2026-10-01 §4.5).
// 연락처를 남겼고 직원 답을 기다리는 손님 — 새 상태 컬럼 없이 기존 값에서 파생한다.
// 하루 두 번(영업 시작 시각, 마감 60분 전) #해외문의에 남은 손님 목록을 올린다.
// 3분 크론(POST /api/chat/ops)이 확대 알림 다음에 부른다. 영업시간·휴진일 판정은 그 라우트가 한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 요약 창 길이(분) — 3분 크론 3회분. 한 번 빠져도 다음 회가 받는다. */
export const DIGEST_WINDOW_MIN = 9;
/** 이보다 오래 기다린 건은 요약에 올리지 않는다 — 오래된 건이 끝없이 오르지 않게. */
const LOOKBACK_DAYS = 7;
const QUERY_LIMIT = 50;

export interface FollowupState {
  status: string;
  resolved_at: string | null;
  awaiting_since: string | null;
  visitor_email: string | null;
  visitor_messenger_handle: string | null;
}

/** '오늘 연락할 손님'인가 (순수). 카드 단추만 누른 손님은 아니다 — 우리가 먼저 연락할 길이 없다. */
export function isFollowupDue(s: FollowupState): boolean {
  return (
    s.status === 'open' &&
    !s.resolved_at &&
    Boolean(s.awaiting_since) &&
    Boolean(s.visitor_email || s.visitor_messenger_handle)
  );
}

export interface DigestWindow {
  /** open = 영업 시작 시각, closing = 마감 60분 전 */
  kind: 'open' | 'closing';
  startsAt: Date;
}

/**
 * 지금이 요약 창 안인가 (순수).
 * 창은 그날 영업 시작 시각부터 9분, 마감 60분 전부터 9분. 휴진일 판정은 호출자가 한다.
 */
export function digestWindow(now: Date, hours: BusinessHoursConfig): DigestWindow | null {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const range = dayRangeMinutes(hours, kst.getUTCDay());
  if (!range) return null;
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  const dayStartMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS;
  const candidates: Array<[DigestWindow['kind'], number]> = [
    ['open', range.startMin],
    ['closing', range.endMin - CLOSING_SOON_MIN],
  ];
  for (const [kind, startMin] of candidates) {
    if (startMin < range.startMin) continue; // 영업시간이 60분보다 짧은 날에는 마감 전 요약이 없다
    if (cur >= startMin && cur < startMin + DIGEST_WINDOW_MIN) {
      return { kind, startsAt: new Date(dayStartMs + startMin * 60_000) };
    }
  }
  return null;
}

const DIGEST_COLUMNS =
  'id, visitor_name, visitor_locale, visitor_email, visitor_messenger_channel, visitor_messenger_handle, awaiting_since, followup_digest_at, slack_mode, slack_channel_id';

interface DigestRow {
  id: string;
  visitor_name: string | null;
  visitor_locale: string;
  visitor_email: string | null;
  visitor_messenger_channel: string | null;
  visitor_messenger_handle: string | null;
  awaiting_since: string;
  followup_digest_at: string | null;
  slack_mode: string | null;
  slack_channel_id: string | null;
}

function toDigestItem(s: DigestRow): FollowupDigestItem {
  const labels: string[] = [];
  if (s.visitor_messenger_handle) labels.push(staffChannelLabel(s.visitor_messenger_channel) || '메신저');
  if (s.visitor_email) labels.push('이메일');
  const channelId = s.slack_mode === 'room' ? s.slack_channel_id : null;
  return {
    visitorName: s.visitor_name,
    visitorLocale: s.visitor_locale,
    contactLabel: labels.join(', '),
    awaitingSince: s.awaiting_since,
    channelId,
    adminUrl: channelId ? null : adminSessionUrl(s.id),
  };
}

export interface DigestResult {
  /** 지금 열려 있는 창. 창 밖이거나 꺼져 있으면 null */
  window: DigestWindow['kind'] | null;
  /** 이번 실행에서 요약에 올린 손님 수 */
  listed: number;
}

/**
 * 요약 창 안이면 '오늘 연락할 손님'을 #해외문의에 한 번 올린다. throw하지 않는다.
 * 세션마다 followup_digest_at 을 조건부 UPDATE로 선점하고, 선점된 세션만 모아 게시한다 —
 * 크론이 겹치거나 같은 창에서 다시 돌아도 같은 손님이 두 번 오르지 않는다.
 */
export async function runFollowupDigest(now: Date): Promise<DigestResult> {
  if (!isFollowupEnabled() || !isSlackRelayConfigured()) return { window: null, listed: 0 };
  const window = digestWindow(now, getBusinessHoursConfig());
  if (!window) return { window: null, listed: 0 };
  try {
    const staff = await loadStaffDirectory();
    // 답변 직원이 한 명도 없으면(SLACK_ROOMS=off 등) 새 Slack 트래픽을 만들지 않는다 — 기존 안전 스위치와 같다.
    if (staff.responderIds.length === 0) return { window: window.kind, listed: 0 };

    const admin = createChatAdminClient();
    const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data, error } = await admin
      .from('chat_sessions')
      .select(DIGEST_COLUMNS)
      .eq('status', 'open')
      .is('resolved_at', null)
      .not('awaiting_since', 'is', null)
      .gte('awaiting_since', cutoff)
      .or('visitor_email.not.is.null,visitor_messenger_handle.not.is.null')
      .order('awaiting_since', { ascending: true })
      .limit(QUERY_LIMIT);
    if (error) {
      // 042 적용 전이면 followup_digest_at 이 없어 여기로 온다.
      console.warn('[chat ops] followup digest query failed:', error.code ?? 'unknown');
      return { window: window.kind, listed: 0 };
    }

    const windowStartMs = window.startsAt.getTime();
    const due = ((data ?? []) as DigestRow[]).filter(
      (s) => !s.followup_digest_at || Date.parse(s.followup_digest_at) < windowStartMs
    );

    const claimed: DigestRow[] = [];
    for (const s of due) {
      // 조건부 선점 — 읽은 값이 그대로일 때만 1행 (auto_ack_at 과 같은 방식).
      let claim = admin.from('chat_sessions').update({ followup_digest_at: now.toISOString() }).eq('id', s.id);
      claim = s.followup_digest_at
        ? claim.eq('followup_digest_at', s.followup_digest_at)
        : claim.is('followup_digest_at', null);
      const { data: got, error: claimError } = await claim.select('id');
      if (claimError) {
        console.warn('[chat ops] followup digest claim failed:', claimError.code ?? 'unknown');
        continue;
      }
      if (got && got.length > 0) claimed.push(s);
    }
    if (claimed.length === 0) return { window: window.kind, listed: 0 };

    // 선점 뒤 게시 — 게시가 실패해도 이 창에서는 다시 시도하지 않는다(확대 알림과 같은 방식). 다음 창에서 다시 오른다.
    const posted = await postSlackMessage({
      text: buildFollowupDigestText({ mentionAll: staff.mentionAll(), items: claimed.map(toDigestItem) }),
    });
    if (!posted.ok) console.warn('[chat ops] followup digest post failed:', posted.error);
    return { window: window.kind, listed: claimed.length };
  } catch (e) {
    console.warn('[chat ops] followup digest failed:', e);
    return { window: window.kind, listed: 0 };
  }
}
