import 'server-only';

// 직원 명단은 환경변수 두 개로 관리한다. users:read 스코프 없이 이름을 표시하려고 이름을 함께 싣는다.
//   SLACK_STAFF="U0AAA:이정현,U0BBB:정소월,U0CCC"   답변 직원: 방 초대 + 멘션 + 담당 대상
//   SLACK_OBSERVERS="U0ZZZ:이재호"                    관찰자: 방 초대만. 멘션·담당 제외 (원장님 결정 2026-09-03)

export interface StaffDirectory {
  /** 답변 직원 ID (입력 순서, 중복 제거) */
  responderIds: string[];
  /** 방에 초대할 전원 = 답변 직원 + 관찰자 */
  inviteIds: string[];
  isResponder(id: string | null | undefined): boolean;
  /** 표시용 이름. 미등록이면 'Slack 직원' */
  labelOf(id: string | null | undefined): string;
  /** 답변 직원 전원 멘션 `<@U1> <@U2>`. 비어 있으면 '' */
  mentionAll(): string;
}

export const UNKNOWN_STAFF_LABEL = 'Slack 직원';
const ID_RE = /^[UW][A-Z0-9]{2,}$/;

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

export function parseStaffDirectory(
  staffRaw: string | undefined | null,
  observerRaw?: string | undefined | null
): StaffDirectory {
  const responders = parseList(staffRaw);
  const observers = parseList(observerRaw);
  for (const id of responders.keys()) observers.delete(id); // 양쪽에 있으면 답변 직원
  const responderIds = [...responders.keys()];
  const inviteIds = [...responderIds, ...observers.keys()];
  const labels = new Map([...observers, ...responders]);
  return {
    responderIds,
    inviteIds,
    isResponder: (id) => Boolean(id && responders.has(id)),
    labelOf: (id) => (id && labels.get(id)) || UNKNOWN_STAFF_LABEL,
    mentionAll: () => responderIds.map(mentionOf).join(' '),
  };
}

export function getStaffDirectory(): StaffDirectory {
  return parseStaffDirectory(process.env.SLACK_STAFF, process.env.SLACK_OBSERVERS);
}
