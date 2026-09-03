import { after, NextRequest, NextResponse } from 'next/server';
import { createChatAdminClient } from '@/lib/chat/db';
import { verifySlackSignature } from '@/lib/chat/slack';
import { classifySlackEvent, type SlackEnvelope } from '@/lib/chat/slackEvents';
import {
  handleRoomArchived,
  handleRoomUnarchived,
  notifyDeliveryFailure,
  relaySlackReplyToVisitor,
  type RelayInboundArgs,
} from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';
// 서명 검증에는 원본 바이트가 필요하므로 어떤 캐싱/변형도 걸리지 않게 한다.
export const dynamic = 'force-dynamic';

const IS_DEV = process.env.NODE_ENV !== 'production';

function debug(...args: unknown[]): void {
  if (IS_DEV) console.log('[slack/events]', ...args);
}

/**
 * Slack Events API 수신 (message.groups + group_archive + group_unarchive).
 * 동기 구간은 [서명 검증 → 분류 → event_id 선점]까지. 번역·DB INSERT·Broadcast는 after().
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'unreadable_body' }, { status: 400 });
  }

  const sig = verifySlackSignature({
    rawBody,
    signature: req.headers.get('x-slack-signature'),
    timestamp: req.headers.get('x-slack-request-timestamp'),
  });
  if (!sig.valid) {
    if (sig.reason === 'no_signing_secret') {
      console.error('[slack/events] SLACK_SIGNING_SECRET is not configured');
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }
    debug('signature rejected:', sig.reason);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let body: SlackEnvelope;
  try {
    body = JSON.parse(rawBody) as SlackEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const decision = classifySlackEvent(body);
  if (decision.action === 'challenge') {
    return NextResponse.json({ challenge: decision.challenge });
  }
  if (decision.action === 'ignore') {
    debug('ignored:', decision.reason);
    return NextResponse.json({ ok: true, ignored: decision.reason });
  }

  const claim = await claimEvent(decision.eventId, body.event?.type ?? null);
  if (claim === 'duplicate') {
    debug('duplicate event_id, skipping:', decision.eventId);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  after(async () => {
    if (decision.action === 'room_archived') {
      await handleRoomArchived(decision.channel);
      return;
    }
    if (decision.action === 'room_unarchived') {
      await handleRoomUnarchived(decision.channel);
      return;
    }
    const inbound: RelayInboundArgs = {
      channel: decision.channel,
      slackTs: decision.slackTs,
      threadTs: decision.threadTs,
      isTopLevel: decision.isTopLevel,
      isBroadcast: decision.isBroadcast,
      text: decision.text,
      slackUserId: decision.slackUserId,
    };
    const outcome = await relaySlackReplyToVisitor(inbound);
    if (outcome === 'delivered') {
      debug('delivered to visitor:', decision.channel);
      return;
    }
    // event_id를 이미 선점했으므로 Slack 재시도로는 복구되지 않는다 — 로그 + 같은 방/스레드에 ⚠️ 알림.
    console.warn(
      `[slack/events] reply not delivered (${outcome}) event_id=${decision.eventId} channel=${decision.channel}`
    );
    await notifyDeliveryFailure(inbound, outcome);
  });

  return NextResponse.json({ ok: true });
}

type ClaimResult = 'claimed' | 'duplicate' | 'unknown';

/** chat_slack_events에 event_id를 INSERT하여 처리 권한을 선점한다. PK 충돌(23505) = 이미 처리됨. */
async function claimEvent(eventId: string, eventType: string | null): Promise<ClaimResult> {
  try {
    const admin = createChatAdminClient();
    const { error } = await admin.from('chat_slack_events').insert({ event_id: eventId, event_type: eventType });
    if (!error) return 'claimed';
    if (error.code === '23505') return 'duplicate';
    console.warn('[slack/events] event claim failed:', error.code ?? 'unknown');
    return 'unknown';
  } catch (e) {
    console.warn('[slack/events] event claim threw:', e);
    return 'unknown';
  }
}

// Slack은 POST만 보낸다. GET은 헬스체크(keep-warm 대상) 용도로만 최소 응답.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'slack-events' });
}
