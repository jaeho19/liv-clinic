import 'server-only';
import { buildChatRefCode } from '@/lib/chat/contactChannels';
import {
  archiveChannel,
  createPrivateChannel,
  inviteToChannel,
  setChannelTopic,
} from '@/lib/chat/slack';
import { buildRoomTopic, type RoomSessionInfo } from '@/lib/chat/slackText';

// 손님 1명 = 비공개 채널 1개. 이 파일은 "방을 확보하는" 절차만 담당한다.
// DB 접근은 RoomDeps로 주입받아 Vitest에서 가짜로 바꿀 수 있게 한다.

export const DEFAULT_ROOM_PREFIX = 'chat';

export function roomPrefix(): string {
  return (process.env.SLACK_ROOM_PREFIX || DEFAULT_ROOM_PREFIX).trim() || DEFAULT_ROOM_PREFIX;
}

/**
 * 이름 슬러그: NFKD → 결합 부호 제거 → 소문자 → [a-z0-9] 외 연속 문자를 '-' 하나로 → 앞뒤 '-' 제거 → 16자.
 * CJK·태국어처럼 ASCII로 만들 수 없는 이름은 ''(호출자가 로케일로 대체).
 */
export function slugifyName(name: string | null | undefined): string {
  if (!name) return '';
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii.slice(0, 16).replace(/-+$/g, '');
}

/** `{prefix}-{slug|locale}-{참조코드 앞 6자}` (+ `-N`, N ≥ 2) */
export function buildRoomName(args: {
  prefix: string;
  visitorName: string | null;
  visitorLocale: string;
  sessionId: string;
  suffix?: number;
}): string {
  const slug = slugifyName(args.visitorName) || args.visitorLocale.toLowerCase();
  const code = buildChatRefCode(args.sessionId).slice(0, 6).toLowerCase();
  const base = `${args.prefix}-${slug}-${code}`;
  return args.suffix && args.suffix > 1 ? `${base}-${args.suffix}` : base;
}

export interface RoomDeps {
  /** 초대 대상 = 답변 직원 + 관찰자 */
  staffIds: string[];
  /** 답변 직원이 1명 이상인지. 없으면 방을 만들지 않는다(아무도 멘션할 수 없는 방은 없는 것과 같다) */
  hasResponders: boolean;
  prefix: string;
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

export async function ensureRoom(session: RoomSessionInfo, deps: RoomDeps): Promise<EnsureRoomResult> {
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

  const created = await createWithRetries(session, deps.prefix);
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

async function createWithRetries(
  session: RoomSessionInfo,
  prefix: string
): Promise<{ id: string; name: string } | null> {
  let currentPrefix = prefix;
  let suffix = 1;
  for (let attempt = 0; attempt < 4; attempt++) {
    const name = buildRoomName({
      prefix: currentPrefix,
      visitorName: session.visitorName,
      visitorLocale: session.visitorLocale,
      sessionId: session.sessionId,
      suffix,
    });
    const r = await createPrivateChannel(name);
    if (r.ok) return { id: r.data.channel.id, name: r.data.channel.name };
    if (r.error === 'name_taken' && suffix < 3) {
      suffix += 1;
      continue;
    }
    if (r.error === 'invalid_name_specials' && currentPrefix !== DEFAULT_ROOM_PREFIX) {
      currentPrefix = DEFAULT_ROOM_PREFIX;
      continue;
    }
    console.warn('[slack rooms] create failed:', r.error);
    return null;
  }
  return null;
}
