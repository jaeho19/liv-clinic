import Link from 'next/link';
import { createChatAdminClient } from '@/lib/chat/db';
import type { VisitorLocale } from '@/lib/chat/chatApi';

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  visitor_locale: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_messenger_channel: string | null;
  visitor_messenger_handle: string | null;
  status: string;
  last_message_at: string | null;
  unread_admin_count: number;
  created_at: string;
  assigned_label: string | null;
  resolved_at: string | null;
}

// 방문자가 남긴 채널 표기 (미지의 값은 원문 그대로 — 채널 확장 대비)
function messengerLabel(channel: string | null): string {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'wechat') return 'WeChat';
  if (channel === 'line') return 'LINE';
  return channel ?? '';
}

// 인덱싱은 DB에서 온 임의 문자열(visitor_locale)로 하므로 선언 타입은 Record<string, string>을
// 유지하고, 누락 로케일은 satisfies로 컴파일 타임에 잡는다.
const LOCALE_FLAG: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  'zh-TW': '🇹🇼',
  vi: '🇻🇳',
  th: '🇹🇭',
  ru: '🇷🇺',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
} satisfies Record<VisitorLocale, string>;

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

type Tab = 'open' | 'resolved' | 'closed';

async function loadSessions(tab: Tab): Promise<SessionRow[]> {
  const admin = createChatAdminClient();
  let query = admin
    .from('chat_sessions')
    .select(
      'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, status, last_message_at, unread_admin_count, created_at, assigned_label, resolved_at'
    );
  if (tab === 'open') query = query.eq('status', 'open').is('resolved_at', null);
  else if (tab === 'resolved') query = query.eq('status', 'open').not('resolved_at', 'is', null);
  else query = query.eq('status', 'closed');
  const { data, error } = await query
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
  const tab: Tab = sp.status === 'closed' ? 'closed' : sp.status === 'resolved' ? 'resolved' : 'open';
  const sessions = await loadSessions(tab);
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
          {(
            [
              ['open', '진행 중'],
              ['resolved', '완료'],
              ['closed', '종료'],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/chat?status=${key}`}
              className={`px-3 inline-flex items-center min-h-[40px] rounded-md ${
                tab === key ? 'bg-[#b4988d] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {tab === 'open' ? '진행 중인 대화가 없습니다.' : tab === 'resolved' ? '완료한 대화가 없습니다.' : '종료된 대화가 없습니다.'}
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
                      {s.visitor_messenger_handle && (
                        <div className="text-xs text-emerald-700 truncate">
                          📱 {messengerLabel(s.visitor_messenger_channel)}{' '}
                          {s.visitor_messenger_handle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {s.assigned_label && (
                      <span className="text-[11px] text-[#6d4e42] bg-[#b4988d]/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                        담당 {s.assigned_label}
                      </span>
                    )}
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
