import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { parseThresholds, planEscalation } from '@/lib/chat/escalation';
import { getSlackChannelId, isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
import { getStaffDirectory, mentionOf } from '@/lib/chat/slackStaff';
import { postFeed, RELAY_SESSION_COLUMNS, resolveTarget, type RelaySessionRow } from '@/lib/chat/slackRelay';
import { buildEscalationText, buildFeedLine } from '@/lib/chat/slackText';

// 3분마다 호출된다 (netlify/functions/chat-ops.mts → POST /api/chat/ops).
// 영업시간 판정은 호출자(app/api/chat/ops/route.ts) 한 곳에서만 한다 — 여기서는 반복하지 않는다.
// 세션당 한 실행에 한 단계만, 조건부 UPDATE로 중복 알림 없이.

const BATCH = 20;
const EVENT_RETENTION_DAYS = 30;

type Candidate = RelaySessionRow & { awaiting_since: string; escalation_level: number };

export async function runEscalations(now: Date): Promise<{ checked: number; escalated: number }> {
  if (!isSlackRelayConfigured()) return { checked: 0, escalated: 0 };
  const admin = createChatAdminClient();
  const thresholds = parseThresholds(process.env.CHAT_ESCALATION_MINUTES);
  const staff = getStaffDirectory();
  // 답변 직원이 한 명도 없으면 오늘(스레드 전용) 대비 새 Slack 트래픽을 전혀 만들지 않는다 — 안전 스위치.
  if (staff.responderIds.length === 0) return { checked: 0, escalated: 0 };
  const legacy = getSlackChannelId();

  const { data, error } = await admin
    .from('chat_sessions')
    .select(`${RELAY_SESSION_COLUMNS}, awaiting_since, escalation_level`)
    .eq('status', 'open')
    .is('resolved_at', null)
    .not('awaiting_since', 'is', null)
    .lt('escalation_level', 3)
    .not('slack_mode', 'is', null)
    .order('awaiting_since', { ascending: true })
    .limit(BATCH);
  if (error) {
    console.warn('[chat ops] candidate query failed:', error.code ?? 'unknown');
    return { checked: 0, escalated: 0 };
  }
  const rows = (data ?? []) as Candidate[];

  let escalated = 0;
  for (const s of rows) {
    // 지금도 답변 직원인 담당자만 1단계의 단독 대상이 된다 — 명단에서 빠진 담당자를 계속 부르지 않는다.
    const assigneeId =
      s.assigned_slack_user_id && staff.isResponder(s.assigned_slack_user_id) ? s.assigned_slack_user_id : null;
    const step = planEscalation(
      {
        awaitingSinceMs: Date.parse(s.awaiting_since),
        level: s.escalation_level,
        hasAssignee: Boolean(assigneeId),
      },
      now.getTime(),
      thresholds
    );
    if (!step) continue;

    // 선점보다 먼저 게시 대상을 확인한다 — 대상이 없으면 escalation_level을 건드리지 않고 건너뛴다.
    const target = resolveTarget(s, legacy);
    if (target.mode === 'unassigned' || (target.mode === 'thread' && !target.threadTs)) {
      console.warn('[chat ops] no post target for session', s.id, target.mode);
      continue;
    }

    // 단계 선점 — 겹쳐 실행돼도 한 번만 알린다
    const { data: claimed, error: claimError } = await admin
      .from('chat_sessions')
      .update({ escalation_level: step.nextLevel })
      .eq('id', s.id)
      .eq('escalation_level', s.escalation_level)
      .select('id');
    if (claimError) {
      console.warn('[chat ops] escalation claim failed:', claimError.code ?? 'unknown');
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    const assigneeMention = assigneeId ? mentionOf(assigneeId) : null;
    const mention = step.target === 'assignee' && assigneeMention ? assigneeMention : staff.mentionAll();
    const text = buildEscalationText({ level: step.nextLevel, minutes: step.minutes, mention, assigneeMention });

    if (target.mode === 'room') {
      const r = await postSlackMessage({ text, channelId: target.channelId });
      if (!r.ok) console.warn('[chat ops] escalation post failed:', r.error);
    } else if (target.mode === 'thread' && target.threadTs) {
      const r = await postSlackMessage({
        text,
        channelId: target.channelId ?? undefined,
        threadTs: target.threadTs,
        replyBroadcast: step.nextLevel >= 2,
      });
      if (!r.ok) console.warn('[chat ops] escalation post failed:', r.error);
    }
    if (step.feed) {
      await postFeed(
        buildFeedLine({
          kind: 'escalated',
          visitorName: s.visitor_name,
          visitorLocale: s.visitor_locale,
          channelId: target.mode === 'room' ? target.channelId : null,
          at: now.toISOString(),
          minutes: step.minutes,
        })
      );
    }
    escalated += 1;
  }
  return { checked: rows.length, escalated };
}

/** 처리 기록 정리 — Slack 재시도 창(수 분)보다 훨씬 긴 30일만 남긴다. */
export async function pruneSlackEvents(now: Date): Promise<number> {
  const admin = createChatAdminClient();
  const cutoff = new Date(now.getTime() - EVENT_RETENTION_DAYS * 86_400_000).toISOString();
  const { data, error } = await admin.from('chat_slack_events').delete().lt('received_at', cutoff).select('event_id');
  if (error) {
    console.warn('[chat ops] prune failed:', error.code ?? 'unknown');
    return 0;
  }
  return data?.length ?? 0;
}
