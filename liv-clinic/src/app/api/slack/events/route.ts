import { after, NextRequest, NextResponse } from 'next/server';
import { createChatAdminClient } from '@/lib/chat/db';
import { getSlackChannelId, verifySlackSignature } from '@/lib/chat/slack';
import { classifySlackEvent, type SlackEnvelope } from '@/lib/chat/slackEvents';
import { relaySlackReplyToVisitor } from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';
// 서명 검증에는 원본 바이트가 필요하므로 어떤 캐싱/변형도 걸리지 않게 한다.
export const dynamic = 'force-dynamic';

const IS_DEV = process.env.NODE_ENV !== 'production';

function debug(...args: unknown[]): void {
  if (IS_DEV) console.log('[slack/events]', ...args);
}

/**
 * Slack Events API 수신 엔드포인트 (비공개 채널 → message.groups 구독).
 *
 * 응답 예산: Slack은 3초 내 200을 못 받으면 동일 event_id로 재시도한다.
 * 따라서 동기 구간은 [서명 검증 → 분류 → event_id 선점] 까지만 두고,
 * 번역·DB INSERT·Broadcast는 `after()`로 응답 이후에 처리한다.
 */
export async function POST(req: NextRequest) {
  // 1. raw body — JSON.parse 이전의 원문 그대로여야 HMAC이 일치한다.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'unreadable_body' }, { status: 400 });
  }

  // 2. 서명 검증 (url_verification 요청도 서명되어 오므로 challenge보다 먼저 검증한다)
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

  // 3. 파싱
  let body: SlackEnvelope;
  try {
    body = JSON.parse(rawBody) as SlackEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 4. 분류
  const decision = classifySlackEvent(body, getSlackChannelId());

  if (decision.action === 'challenge') {
    // Events API Request URL 등록 핸드셰이크
    return NextResponse.json({ challenge: decision.challenge });
  }

  if (decision.action === 'ignore') {
    debug('ignored:', decision.reason);
    // 무시하는 이벤트도 200 — 재시도를 유발하지 않는다.
    return NextResponse.json({ ok: true, ignored: decision.reason });
  }

  // 5. event_id 선점 (중복/재시도 차단). 처리 전에 기록해야 재시도가 겹치지 않는다.
  const claim = await claimEvent(decision.eventId, body.event?.type ?? null);
  if (claim === 'duplicate') {
    debug('duplicate event_id, skipping:', decision.eventId);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 6. 무거운 작업은 응답 이후로 — 3초 예산 안에서 200을 먼저 돌려준다.
  after(async () => {
    const outcome = await relaySlackReplyToVisitor({
      threadTs: decision.threadTs,
      slackTs: decision.slackTs,
      text: decision.text,
    });
    if (outcome !== 'delivered') {
      // event_id를 이미 선점했으므로 Slack 재시도로는 복구되지 않는다 — 로그로 남긴다.
      console.warn(
        `[slack/events] reply not delivered (${outcome}) event_id=${decision.eventId} thread_ts=${decision.threadTs}`
      );
    } else {
      debug('delivered to visitor:', decision.threadTs);
    }
  });

  return NextResponse.json({ ok: true });
}

type ClaimResult = 'claimed' | 'duplicate' | 'unknown';

/**
 * chat_slack_events에 event_id를 INSERT하여 처리 권한을 선점한다.
 * PK 충돌(23505) = 이미 처리된 이벤트.
 * 그 외 DB 오류는 'unknown'으로 처리를 진행시킨다 — 중복 전달이 유실보다 낫다.
 */
async function claimEvent(eventId: string, eventType: string | null): Promise<ClaimResult> {
  try {
    const admin = createChatAdminClient();
    const { error } = await admin
      .from('chat_slack_events')
      .insert({ event_id: eventId, event_type: eventType });

    if (!error) return 'claimed';
    if (error.code === '23505') return 'duplicate';

    console.warn('[slack/events] event claim failed:', error.code ?? 'unknown');
    return 'unknown';
  } catch (e) {
    console.warn('[slack/events] event claim threw:', e);
    return 'unknown';
  }
}

// Slack은 POST만 보낸다. GET은 헬스체크 용도로만 최소 응답.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'slack-events' });
}
