import 'server-only';
import {
  archiveChannel,
  createPrivateChannel,
  inviteToChannel,
  setChannelTopic,
} from '@/lib/chat/slack';
import { legacyRoomName, roomNameCandidates } from '@/lib/chat/roomName';
import { buildRoomTopic, type RoomSessionInfo } from '@/lib/chat/slackText';

// 손님 1명 = 비공개 채널 1개. 이 파일은 "방을 확보하는" 절차만 담당한다.
// DB 접근은 RoomDeps로 주입받아 Vitest에서 가짜로 바꿀 수 있게 한다.
// 방 이름 규칙은 roomName.ts에 있다 (스펙 2026-10-01 slack-room-look §3.1).

export interface RoomDeps {
  /** 초대 대상 = 답변 직원 + 관찰자 */
  staffIds: string[];
  /** 답변 직원이 1명 이상인지. 없으면 방을 만들지 않는다(아무도 멘션할 수 없는 방은 없는 것과 같다) */
  hasResponders: boolean;
  sleep(ms: number): Promise<void>;
  /** `slack_mode IS NULL`인 세션을 'room'으로 선점. 성공 시 true */
  claimRoomMode(sessionId: string): Promise<boolean>;
  /** 선점한 세션에 채널 확정. DB 쓰기 실패 시 reject — ensureRoom이 스레드로 폴백한다 */
  setRoom(sessionId: string, channelId: string, roomName: string): Promise<void>;
  /** 방 생성을 포기하고 스레드 모드로 */
  setThreadMode(sessionId: string): Promise<void>;
  /** 선점에서 진 쪽이 상대의 결과를 기다릴 때 */
  reloadTarget(
    sessionId: string
  ): Promise<{ mode: 'room'; channelId: string } | { mode: 'thread' } | null>;
}

export type EnsureRoomResult =
  | { mode: 'room'; channelId: string; created: boolean }
  | { mode: 'thread' }
  /** 경합에서 졌는데 방이 끝내 안 보임 → 호출자가 피드에 단독 게시 */
  | { mode: 'feed' };

const LOST_RACE_POLLS = 3;
const LOST_RACE_INTERVAL_MS = 700;

/** receivedAt = 방을 만들게 한 첫 글의 시각. 방 이름의 날짜가 된다. */
export async function ensureRoom(
  session: RoomSessionInfo,
  deps: RoomDeps,
  receivedAt: string | Date
): Promise<EnsureRoomResult> {
  if (!deps.hasResponders) {
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const claimed = await deps.claimRoomMode(session.sessionId);
  if (!claimed) {
    for (let i = 0; i < LOST_RACE_POLLS; i++) {
      await deps.sleep(LOST_RACE_INTERVAL_MS);
      const t = await deps.reloadTarget(session.sessionId);
      if (t?.mode === 'room') return { mode: 'room', channelId: t.channelId, created: false };
      if (t?.mode === 'thread') return { mode: 'thread' };
    }
    return { mode: 'feed' };
  }

  const created = await createWithRetries(session, receivedAt);
  if (!created) {
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const invited = await inviteToChannel(created.id, deps.staffIds);
  if (!invited.ok) {
    console.warn('[slack rooms] invite failed:', invited.error);
    await archiveChannel(created.id);
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  try {
    await deps.setRoom(session.sessionId, created.id, created.name);
  } catch (e) {
    console.warn('[slack rooms] setRoom failed:', e);
    await archiveChannel(created.id);
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const topic = await setChannelTopic(created.id, buildRoomTopic(session));
  if (!topic.ok) console.warn('[slack rooms] setTopic failed:', topic.error);
  return { mode: 'room', channelId: created.id, created: true };
}

/**
 * 이름 후보를 차례로 시도한다 (`10월01일-이름` → `-2` → `-3` → `-참조코드`).
 * - name_taken: 다음 후보 (보관된 방의 이름도 점유된다).
 * - invalid_name…: Slack이 이름 글자를 거부했다 → 지금까지 항상 통한 예전 꼴(`chat-이름-코드`)로 한 번만 더.
 * - 그 밖의 오류(권한·제한·시간 초과): 곧바로 포기 → 호출자가 스레드 방식으로 넘긴다.
 */
async function createWithRetries(
  session: RoomSessionInfo,
  receivedAt: string | Date
): Promise<{ id: string; name: string } | null> {
  const names = roomNameCandidates({
    visitorName: session.visitorName,
    visitorLocale: session.visitorLocale,
    sessionId: session.sessionId,
    at: receivedAt,
  });
  let lastError = 'name_taken';
  for (const name of names) {
    const r = await createPrivateChannel(name);
    if (r.ok) return { id: r.data.channel.id, name: r.data.channel.name };
    lastError = r.error;
    if (r.error === 'name_taken') continue;
    if (r.error.startsWith('invalid_name')) {
      console.warn('[slack rooms] name rejected, retrying with legacy name:', r.error);
      const legacy = await createPrivateChannel(legacyRoomName(session));
      if (legacy.ok) return { id: legacy.data.channel.id, name: legacy.data.channel.name };
      lastError = legacy.error;
    }
    break;
  }
  console.warn('[slack rooms] create failed:', lastError);
  return null;
}
