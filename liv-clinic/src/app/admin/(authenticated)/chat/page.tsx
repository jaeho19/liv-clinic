import Link from 'next/link';
import { createChatAdminClient } from '@/lib/chat/db';

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  visitor_locale: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
  last_message_at: string | null;
  unread_admin_count: number;
  created_at: string;
}

const LOCALE_FLAG: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

function relativeTime(iso: string | null): string {
  if (!iso) return '-';
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

async function loadSessions(status: string): Promise<SessionRow[]> {
  const admin = createChatAdminClient();
  const { data, error } = await admin
    .from('chat_sessions')
    .select(
      'id, visitor_locale, visitor_name, visitor_email, status, last_message_at, unread_admin_count, created_at'
    )
    .eq('status', status)
    .order('unread_admin_count', { ascending: false })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) {
    console.error('[admin/chat] list failed:', error);
    return [];
  }
  return (data ?? []) as SessionRow[];
}

export default async function AdminChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status === 'closed' ? 'closed' : 'open';
  const sessions = await loadSessions(status);
  const unreadCount = sessions.reduce((acc, s) => acc + (s.unread_admin_count || 0), 0);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#6d4e42]">
          채팅 상담
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center text-xs bg-red-500 text-white rounded-full px-2 py-0.5 align-middle">
              미응답 {unreadCount}
            </span>
          )}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/chat?status=open"
            className={`px-3 inline-flex items-center min-h-[40px] rounded-md ${
              status === 'open' ? 'bg-[#b4988d] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            진행 중
          </Link>
          <Link
            href="/admin/chat?status=closed"
            className={`px-3 inline-flex items-center min-h-[40px] rounded-md ${
              status === 'closed' ? 'bg-[#b4988d] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            종료
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {status === 'open' ? '진행 중인 대화가 없습니다.' : '종료된 대화가 없습니다.'}
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/chat/${s.id}`}
                  className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 min-h-[64px] hover:bg-[#f6f6f6] active:bg-[#f6f6f6] transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0" aria-hidden>
                      {LOCALE_FLAG[s.visitor_locale] ?? '🌐'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#6d4e42] truncate">
                        {s.visitor_name || '익명'}
                        <span className="ml-2 text-xs text-gray-400">
                          ({s.visitor_locale.toUpperCase()})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {s.visitor_email || '이메일 없음'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {s.unread_admin_count > 0 && (
                      <span className="inline-flex items-center justify-center text-[11px] bg-red-500 text-white rounded-full px-2 py-0.5 whitespace-nowrap">
                        미응답 {s.unread_admin_count}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {relativeTime(s.last_message_at ?? s.created_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
