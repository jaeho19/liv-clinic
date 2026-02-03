'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { NotificationTemplateRow, TemplateType } from '@/types/admin';
import { TEMPLATE_TYPE_LABELS } from '@/types/admin';

function TemplateForm({ template, onClose, onSaved }: { template?: NotificationTemplateRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    treatment_name: template?.treatment_name || '',
    template_type: template?.template_type || 'revisit',
    title: template?.title || '',
    message: template?.message || '',
    video_url: template?.video_url || '',
    is_active: template?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.treatment_name || !form.title || !form.message) return;
    setSaving(true);
    try {
      const body = { ...form, video_url: form.video_url || null };
      const url = template ? `/api/admin/notification-templates/${template.id}` : '/api/admin/notification-templates';
      const method = template ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { onSaved(); onClose(); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#6d4e42] mb-4">{template ? '템플릿 수정' : '새 템플릿'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">시술명 *</label>
              <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.treatment_name} onChange={e => setForm(p => ({ ...p, treatment_name: e.target.value }))} placeholder="보톡스, 울쎄라 등" />
            </div>
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">유형</label>
              <select className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.template_type} onChange={e => setForm(p => ({ ...p, template_type: e.target.value }))}>
                <option value="revisit">재방문 안내</option>
                <option value="aftercare">사후관리</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">제목 *</label>
            <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">메시지 내용 *</label>
            <textarea className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="변수: {name}, {treatment}, {days}, {event} 사용 가능" />
            <p className="text-xs text-[#8a8a8a] mt-1">사용 가능한 변수: {'{name}'} 환자명, {'{treatment}'} 시술명, {'{days}'} 경과일, {'{event}'} 진행중 이벤트</p>
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">영상 URL</label>
            <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtu.be/..." />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
            활성화
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] rounded-lg">취소</button>
          <button onClick={handleSubmit} disabled={saving || !form.treatment_name || !form.title || !form.message} className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478] disabled:opacity-50">
            {saving ? '저장 중...' : template ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplateRow | undefined>();
  const [activeTab, setActiveTab] = useState<TemplateType | 'all'>('all');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notification-templates');
      if (res.ok) setTemplates(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/notification-templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  const filtered = activeTab === 'all' ? templates : templates.filter(t => t.template_type === activeTab);

  const tabs: { value: TemplateType | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'revisit', label: '재방문 안내' },
    { value: 'aftercare', label: '사후관리' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications" className="text-[#8a8a8a] hover:text-[#6d4e42] text-sm">&larr; 알림관리</Link>
          <h2 className="text-xl font-bold text-[#6d4e42]">알림 템플릿 관리</h2>
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478]">
          + 템플릿 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-[#f6f6f6] rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.value ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-sm text-[#8a8a8a] py-12">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-[#8a8a8a] py-12 bg-white rounded-xl border border-[#e5e5e5]">
          등록된 템플릿이 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border border-[#e5e5e5] p-5 ${!t.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{t.treatment_name}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{TEMPLATE_TYPE_LABELS[t.template_type as TemplateType] || t.template_type}</span>
                    {!t.is_active && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">비활성</span>}
                  </div>
                  <h4 className="font-medium text-[#6d4e42] mb-1">{t.title}</h4>
                  <p className="text-sm text-[#575756] whitespace-pre-wrap line-clamp-3">{t.message}</p>
                  {t.video_url && (
                    <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                      &#9654;&#65039; 영상: {t.video_url}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  <button onClick={() => { setEditing(t); setShowForm(true); }} className="px-3 py-1.5 text-xs text-[#8a8a8a] hover:bg-[#f6f6f6] rounded-lg border border-[#e5e5e5]">편집</button>
                  <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-lg border border-[#e5e5e5]">삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TemplateForm template={editing} onClose={() => setShowForm(false)} onSaved={fetchTemplates} />}
    </div>
  );
}
