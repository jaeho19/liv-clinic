import 'server-only';
import { chatAiMode, isAiNoticeEnabled } from '@/lib/chat/chatFlags';
import type { ChatAdminClient } from '@/lib/chat/db';
import { aiAppliesTo } from './eligibility';

// 손님 화면이 쓰는 두 가지 신호 (스펙 2026-10-02 chat-ai-first-response §4.10).
//   instantReply    : 다음 손님 글에 몇 초 안에 답이 간다 → 머리말을 "온라인"으로, 시간 외 안내를 숨긴다
//   assistantNotice : 고지 한 줄을 보인다 (CHAT_AI_NOTICE=on 이고, 이 대화가 AI 응대 대상일 때만)
// 한도(대화당·하루)는 보지 않는다 — 드물고, 걸리면 접수 안내가 대신 나간다.

export interface VisitorAiFlags {
  instantReply: boolean;
  assistantNotice: boolean;
}

const OFF: VisitorAiFlags = { instantReply: false, assistantNotice: false };

function appliesTo(visitorName: string | null | undefined): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && aiAppliesTo(chatAiMode(), visitorName);
}

/** 대화가 정해지기 전(채팅 시작 화면). 시험 모드에서는 손님 이름을 모르므로 꺼진 것으로 본다. */
export function presenceAiFlags(): VisitorAiFlags {
  if (chatAiMode() !== 'on' || !process.env.OPENAI_API_KEY) return OFF;
  return { instantReply: true, assistantNotice: isAiNoticeEnabled() };
}

/** 대화를 시작하는 순간 — 아직 직원이 맡았을 수 없다. */
export function newSessionAiFlags(visitorName: string | null | undefined): VisitorAiFlags {
  if (!appliesTo(visitorName)) return OFF;
  return { instantReply: true, assistantNotice: isAiNoticeEnabled() };
}

/**
 * 진행 중인 대화. 직원이 맡았으면 instantReply 가 꺼진다 — 다만 완료(보관)했거나 종료한 대화는
 * 손님이 다시 쓰는 순간 직원 담당이 풀리므로(043 의 트리거 · 재오픈 처리) 켜진 것으로 본다.
 * 043 의 새 컬럼은 여기서 따로 읽는다 — 읽지 못하면 둘 다 false (AI도 답하지 않는 상태다).
 */
export async function sessionAiFlags(
  admin: ChatAdminClient,
  session: { id: string; visitor_name: string | null }
): Promise<VisitorAiFlags> {
  if (!appliesTo(session.visitor_name)) return OFF;
  try {
    const { data, error } = await admin
      .from('chat_sessions')
      .select('staff_engaged_at, resolved_at, status')
      .eq('id', session.id)
      .maybeSingle();
    if (error || !data) {
      console.warn('[chat ai] visitor flags read failed:', error?.code ?? 'not_found');
      return OFF;
    }
    const staffOwns = Boolean(data.staff_engaged_at) && !data.resolved_at && data.status === 'open';
    return { instantReply: !staffOwns, assistantNotice: isAiNoticeEnabled() };
  } catch (e) {
    console.warn('[chat ai] visitor flags threw:', e);
    return OFF;
  }
}
