'use client';

import { useState, useEffect, useCallback } from 'react';
import { CONSULTATION_STATUS_LABELS } from '@/types/admin';
import VoiceNoteInput from '@/components/admin/VoiceNoteInput';

interface TimelineEvent {
  id: string;
  eventType: string;
  description: string;
  actor: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

interface Props {
  consultationId: string;
  onAddNote?: (note: string) => void;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  status_change: '🔄',
  note_added: '📝',
  callback_set: '📞',
  assigned: '👤',
  tag_added: '🏷️',
  budget_updated: '💰',
};

function formatTimelineDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `오늘 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

function getEventLabel(event: TimelineEvent): string {
  if (event.eventType === 'status_change') {
    const oldLabel = CONSULTATION_STATUS_LABELS[event.oldValue || ''] || event.oldValue || '?';
    const newLabel = CONSULTATION_STATUS_LABELS[event.newValue || ''] || event.newValue || '?';
    return `상태변경: ${oldLabel} → ${newLabel}`;
  }
  return event.description;
}

export default function ConsultationTimeline({ consultationId, onAddNote }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/consultations/${consultationId}/timeline`);
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.timeline || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [consultationId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const addNote = async () => {
    if (!noteInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/consultations/${consultationId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'note_added',
          description: noteInput.trim(),
          actor: 'admin',
        }),
      });
      if (res.ok) {
        setNoteInput('');
        setIsVoiceMode(false);
        fetchTimeline();
        onAddNote?.(noteInput.trim());
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-[#6d4e42] mb-2">📋 상담 타임라인</p>

      {/* Add note */}
      <div className="mb-3">
        {isVoiceMode ? (
          <div>
            <VoiceNoteInput
              value={noteInput}
              onChange={setNoteInput}
              templateType="quickNote"
              placeholder="음성으로 메모를 추가하세요"
              rows={2}
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={addNote}
                disabled={submitting || !noteInput.trim()}
                className="px-3 py-1.5 text-xs bg-[#6d4e42] text-white rounded-lg hover:bg-[#5a3d33] disabled:opacity-50 cursor-pointer"
              >
                추가
              </button>
              <button
                onClick={() => setIsVoiceMode(false)}
                className="px-3 py-1.5 text-xs text-[#8a8a8a] bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] cursor-pointer"
              >
                텍스트 입력
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
              placeholder="메모 추가..."
              className="flex-1 px-2.5 py-1.5 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#b4988d]"
            />
            <button
              onClick={() => setIsVoiceMode(true)}
              className="px-2 py-1.5 text-xs text-[#6d4e42] bg-[#f6f4f2] rounded-lg hover:bg-[#ebe7e4] cursor-pointer"
              title="음성 입력"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              onClick={addNote}
              disabled={submitting || !noteInput.trim()}
              className="px-3 py-1.5 text-xs bg-[#6d4e42] text-white rounded-lg hover:bg-[#5a3d33] disabled:opacity-50 cursor-pointer"
            >
              추가
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <p className="text-xs text-[#8a8a8a]">로딩중...</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-[#c0c0c0]">타임라인 이력이 없습니다.</p>
      ) : (
        <div className="space-y-0 border-l-2 border-[#e5e5e5] ml-2">
          {events.map((event) => (
            <div key={event.id} className="relative pl-4 pb-3">
              <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#b4988d]" />
              <div className="text-xs">
                <span className="text-[#8a8a8a]">{formatTimelineDate(event.createdAt)}</span>
                {event.actor && <span className="text-[#b4988d] ml-1.5">({event.actor})</span>}
              </div>
              <p className="text-xs text-[#575756] mt-0.5">
                {EVENT_TYPE_ICONS[event.eventType] || '•'} {getEventLabel(event)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
