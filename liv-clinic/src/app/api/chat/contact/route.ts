import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient } from '@/lib/chat/db';
import { CLINIC_LINK_CHANNELS, validateContactHandle } from '@/lib/chat/contactChannels';
import { recordMessengerClick, saveVisitorContact } from '@/lib/chat/contactService';
import { checkContactClickLimit, checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { relayContactToSlack, relayMessengerClickToSlack } from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';

const ContactSchema = z.object({
  sessionToken: z.string().uuid(),
  // line 저장은 새 카드에 없지만, 캐시된 옛 화면이 보낼 수 있어 받아 준다.
  channel: z.enum(CLINIC_LINK_CHANNELS),
  kind: z.enum(['save', 'click']).default('save'),
  handle: z.string().trim().max(254).optional(),
});

// 이메일 형식 검증은 세션 생성(api/chat/sessions)과 같은 규칙을 쓴다.
const EmailSchema = z.string().email();

// 연락처 카드 (스펙 2026-10-01 §4.4).
//   kind=save  : 손님이 자기 연락처(WhatsApp 번호·WeChat ID·이메일)를 남긴다 → '오늘 연락할 손님'
//   kind=click : 손님이 병원 연락 단추를 눌렀다 → 기록 + 방에 한 줄. 연락처로 치지 않는다
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = ContactSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionToken, channel, kind } = parsed.data;
  const handle = parsed.data.handle ?? '';

  if (kind === 'save') {
    if (handle.length < 4) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    const valid =
      channel === 'email' ? EmailSchema.safeParse(handle).success : validateContactHandle(channel, handle);
    if (!valid) {
      return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
    }
  }

  const admin = createChatAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  if (kind === 'click') {
    // 손님 화면은 응답을 기다리지 않는다. 한도를 넘은 클릭은 조용히 버린다(방에 📲 줄이 쌓이지 않게).
    if (!checkContactClickLimit(session.id).allowed) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    await recordMessengerClick(admin, session, channel);
    after(async () => {
      await relayMessengerClickToSlack({ sessionId: session.id, channel });
    });
    return NextResponse.json({ ok: true });
  }

  const limit = checkContactSaveLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited', reason: limit.reason }, { status: 429 });
  }

  const saved = await saveVisitorContact(admin, session, { channel, handle });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  after(async () => {
    await relayContactToSlack({ sessionId: session.id, channel, handle });
  });

  return NextResponse.json({ ok: true, hasContact: true }, { status: 201 });
}
