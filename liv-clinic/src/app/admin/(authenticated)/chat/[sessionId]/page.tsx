import { notFound } from 'next/navigation';
import { createChatAdminClient } from '@/lib/chat/db';
import type { ChatMessage, VisitorLocale } from '@/lib/chat/chatApi';
import ChatDetailClient from './ChatDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const admin = createChatAdminClient();

  const { data: session } = await admin
    .from('chat_sessions')
    .select(
      'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, status, last_message_at, unread_admin_count, created_at, assigned_label, resolved_at'
    )
    .eq('id', sessionId)
    .single();

  if (!session) notFound();

  const { data: messages } = await admin
    .from('chat_messages')
    .select(
      'id, session_id, sender, original_text, original_lang, translated_text, translated_lang, translation_status, created_at, sender_label, source'
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200);

  return (
    <ChatDetailClient
      session={{
        id: session.id,
        visitor_locale: session.visitor_locale as VisitorLocale,
        visitor_name: session.visitor_name,
        visitor_email: session.visitor_email,
        visitor_messenger_channel: session.visitor_messenger_channel,
        visitor_messenger_handle: session.visitor_messenger_handle,
        status: session.status as 'open' | 'closed' | 'abandoned',
        created_at: session.created_at,
        assigned_label: session.assigned_label,
        resolved_at: session.resolved_at,
      }}
      initialMessages={(messages ?? []) as unknown as ChatMessage[]}
    />
  );
}
