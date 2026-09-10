import 'server-only';
import { getBotUserId, getSlackChannelId, getUserInfo, listChannelMembers } from '@/lib/chat/slack';

// 답변 직원 = #해외문의(SLACK_CHANNEL_ID) 채널의 사람 멤버 − 관찰자. (2026-09-10 원장님 결정)
//   - 새 직원은 채널에 추가, 퇴사자는 채널에서 내보내기만 하면 된다.
//   - 관찰자 SLACK_OBSERVERS="U0ZZZ:이재호": 방 초대만, 멘션·담당 제외 (2026-09-03 결정, 형식 불변)
//   - SLACK_STAFF 는 더 이상 읽지 않는다. SLACK_ROOMS=off 는 긴급 정지(빈 명단 = 스레드 방식).
// 이름은 users.info(users:read) 프로필 표시 이름. 권한이 없으면 'Slack 직원'.

export interface StaffDirectory {
  /** 답변 직원 ID (채널 순서, 중복 제거) */
  responderIds: string[];
  /** 방에 초대할 전원 = 답변 직원 + 관찰자 */
  inviteIds: string[];
  isResponder(id: string | null | undefined): boolean;
  /** 표시용 이름. 모르면 'Slack 직원' */
  labelOf(id: string | null | undefined): string;
  /** 답변 직원 전원 멘션 `<@U1> <@U2>`. 비어 있으면 '' */
  mentionAll(): string;
}

export interface StaffMember {
  id: string;
  name: string | null;
  isBot: boolean;
  deleted: boolean;
}

export const UNKNOWN_STAFF_LABEL = 'Slack 직원';
const SLACKBOT_ID = 'USLACKBOT';
const ID_RE = /^[UW][A-Z0-9]{2,}$/;

const DIRECTORY_TTL_MS = 60_000;
const USER_TTL_MS = 600_000;

function parseList(raw: string | undefined | null): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of (raw ?? '').split(',')) {
    const [idRaw, ...rest] = part.split(':');
    const id = (idRaw ?? '').trim();
    if (!ID_RE.test(id) || out.has(id)) continue;
    const label = rest.join(':').trim();
    out.set(id, label || UNKNOWN_STAFF_LABEL);
  }
  return out;
}

export function mentionOf(id: string): string {
  return `<@${id}>`;
}

/** 채널 멤버 + 관찰자 → 명단 (순수). 봇 자신·다른 봇·삭제 계정·Slackbot·관찰자는 답변 직원에서 뺀다. */
export function buildStaffDirectory(args: {
  members: StaffMember[];
  botUserId: string | null;
  observers: Map<string, string>;
}): StaffDirectory {
  const responders = new Map<string, string>();
  for (const m of args.members) {
    if (m.id === args.botUserId || m.id === SLACKBOT_ID || m.isBot || m.deleted) continue;
    if (args.observers.has(m.id) || responders.has(m.id)) continue;
    responders.set(m.id, m.name || UNKNOWN_STAFF_LABEL);
  }
  const responderIds = [...responders.keys()];
  const inviteIds = [...responderIds, ...args.observers.keys()];
  const labels = new Map([...responders, ...args.observers]);
  return {
    responderIds,
    inviteIds,
    isResponder: (id) => Boolean(id && responders.has(id)),
    labelOf: (id) => (id && labels.get(id)) || UNKNOWN_STAFF_LABEL,
    mentionAll: () => responderIds.map(mentionOf).join(' '),
  };
}

/** "ID:이름,…" 두 목록 → 명단. 테스트와 폴백용 순수 파서(환경변수는 읽지 않는다). */
export function parseStaffDirectory(
  staffRaw: string | undefined | null,
  observerRaw?: string | undefined | null
): StaffDirectory {
  const staff = parseList(staffRaw);
  const observers = parseList(observerRaw);
  for (const id of staff.keys()) observers.delete(id); // 양쪽에 있으면 답변 직원
  const members: StaffMember[] = [...staff].map(([id, label]) => ({
    id,
    name: label === UNKNOWN_STAFF_LABEL ? null : label,
    isBot: false,
    deleted: false,
  }));
  return buildStaffDirectory({ members, botUserId: null, observers });
}

export function roomsDisabled(): boolean {
  return (process.env.SLACK_ROOMS ?? '').trim().toLowerCase() === 'off';
}

function observersFromEnv(): Map<string, string> {
  return parseList(process.env.SLACK_OBSERVERS);
}

const EMPTY_DIRECTORY: StaffDirectory = buildStaffDirectory({ members: [], botUserId: null, observers: new Map() });

let directoryCache: { directory: StaffDirectory; fetchedAt: number } | null = null;
const userCache = new Map<string, { member: StaffMember; fetchedAt: number }>();
let warnedStaffEnv = false;
let warnedMissingScope = false;

/** 테스트용 훅. */
export const _internals = {
  now: () => Date.now(),
  resetCache() {
    directoryCache = null;
    userCache.clear();
    warnedStaffEnv = false;
    warnedMissingScope = false;
  },
};

async function lookupMember(id: string, now: number): Promise<StaffMember> {
  const cached = userCache.get(id);
  if (cached && now - cached.fetchedAt < USER_TTL_MS) return cached.member;
  const r = await getUserInfo(id);
  let member: StaffMember;
  if (r.ok) {
    member = { id, name: r.data.name, isBot: r.data.isBot, deleted: r.data.deleted };
  } else {
    // users:read 미추가(missing_scope)·일시 오류: 후보에 남기고 이름만 비운다. 봇 제외는 auth.test로 충분하다.
    if (r.error === 'missing_scope') {
      if (!warnedMissingScope) {
        warnedMissingScope = true;
        console.warn('[slack staff] users:read scope missing — names fall back to', UNKNOWN_STAFF_LABEL);
      }
    } else {
      console.warn('[slack staff] users.info failed:', id, r.error);
    }
    member = { id, name: null, isBot: false, deleted: false };
  }
  userCache.set(id, { member, fetchedAt: now });
  return member;
}

/**
 * #해외문의 멤버 → 명단. 60초 캐시. 조회 실패 시 마지막 성공값, 그것도 없으면 빈 명단(= 기존 안전 경로).
 */
export async function loadStaffDirectory(): Promise<StaffDirectory> {
  if (roomsDisabled()) return EMPTY_DIRECTORY;
  if (process.env.SLACK_STAFF && !warnedStaffEnv) {
    warnedStaffEnv = true;
    console.warn('[slack staff] SLACK_STAFF is ignored; members of SLACK_CHANNEL_ID are used');
  }
  const now = _internals.now();
  if (directoryCache && now - directoryCache.fetchedAt < DIRECTORY_TTL_MS) return directoryCache.directory;

  const channel = getSlackChannelId();
  if (!channel) return EMPTY_DIRECTORY;

  const listed = await listChannelMembers(channel);
  if (!listed.ok) {
    console.warn('[slack staff] members lookup failed:', listed.error);
    // 다음 시도까지 최소 60초를 두어, 장애가 계속돼도 1분에 한 번만 재시도한다.
    if (directoryCache) directoryCache.fetchedAt = now;
    return directoryCache?.directory ?? EMPTY_DIRECTORY;
  }

  const botUserId = await getBotUserId();
  if (botUserId === null) {
    // auth.test 실패 — 봇 자신을 명단에서 뺄 수 없으니 조회 실패로 취급한다(캐시하지 않음: 회복 즉시 재조회).
    console.warn('[slack staff] auth.test failed — reusing last directory');
    return directoryCache?.directory ?? EMPTY_DIRECTORY;
  }

  const observers = observersFromEnv();
  const members = await Promise.all(
    listed.data.members.map((id): Promise<StaffMember> => {
      if (id === botUserId || id === SLACKBOT_ID || observers.has(id)) {
        // 어차피 답변 직원이 아니다 — users.info 생략
        return Promise.resolve({ id, name: null, isBot: false, deleted: false });
      }
      return lookupMember(id, now);
    })
  );
  const directory = buildStaffDirectory({ members, botUserId, observers });
  directoryCache = { directory, fetchedAt: now };
  return directory;
}

/** 답장 작성자 라벨: 명단 → users.info 1회(캐시) → 'Slack 직원'. */
export async function resolveStaffLabel(userId: string | null, directory: StaffDirectory): Promise<string> {
  if (!userId) return UNKNOWN_STAFF_LABEL;
  const known = directory.labelOf(userId);
  if (known !== UNKNOWN_STAFF_LABEL) return known;
  const member = await lookupMember(userId, _internals.now());
  return member.name || UNKNOWN_STAFF_LABEL;
}
