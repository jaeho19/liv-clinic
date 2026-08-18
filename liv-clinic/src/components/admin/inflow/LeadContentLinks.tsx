'use client';

/**
 * 리드 ↔ 마케팅 콘텐츠 연결 편집기 (리드 수정 모달 내부).
 * 귀속 기본값은 '추정' — 게시일과 문의일이 가깝다는 이유만으로 '직접'을 쓰지 않는다.
 */
import { useCallback, useEffect, useState } from 'react';
import type { createClient } from '@/lib/supabase-browser';
import type { LeadContentLinkRow, MarketingContentRow } from '@/types/admin';
import {
  ATTRIBUTIONS,
  ATTRIBUTION_DESCRIPTIONS,
  ATTRIBUTION_LABELS,
  type Attribution,
} from '@/lib/inflow/taxonomy';

interface Props {
  leadId: string;
  contents: MarketingContentRow[];
  supabase: ReturnType<typeof createClient>;
}

export default function LeadContentLinks({ leadId, contents, supabase }: Props) {
  const [links, setLinks] = useState<LeadContentLinkRow[]>([]);
  const [contentId, setContentId] = useState('');
  const [attribution, setAttribution] = useState<Attribution>('inferred');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('lead_content_links').select('*').eq('lead_id', leadId);
    if (!error) setLinks((data ?? []) as LeadContentLinkRow[]);
  }, [supabase, leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const addLink = async () => {
    if (!contentId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('lead_content_links')
      .insert({ lead_id: leadId, content_id: contentId, attribution });
    setBusy(false);
    if (error) {
      setError(error.code === '23505' ? '이미 연결된 콘텐츠입니다.' : '연결에 실패했습니다.');
      return;
    }
    setContentId('');
    setAttribution('inferred');
    load();
  };

  const removeLink = async (id: string) => {
    setBusy(true);
    await supabase.from('lead_content_links').delete().eq('id', id);
    setBusy(false);
    load();
  };

  const contentLabel = (id: string) => {
    const c = contents.find((x) => x.id === id);
    return c ? `[${c.posted_at}] ${c.title}` : '(삭제된 콘텐츠)';
  };

  return (
    <div className="border border-[#e5e5e5] rounded-lg p-3">
      {links.length > 0 && (
        <ul className="space-y-1.5 mb-2.5">
          {links.map((k) => (
            <li key={k.id} className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded-full bg-[#f6f6f6] text-[#575756] shrink-0">
                {ATTRIBUTION_LABELS[k.attribution as Attribution] ?? k.attribution}
              </span>
              <span className="text-[#575756] truncate flex-1">{contentLabel(k.content_id)}</span>
              <button
                type="button"
                onClick={() => removeLink(k.id)}
                disabled={busy}
                className="text-red-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                aria-label="연결 해제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {contents.length === 0 ? (
        <p className="text-xs text-[#8a8a8a]">등록된 콘텐츠가 없습니다. 사이드바 &ldquo;마케팅 콘텐츠&rdquo;에서 게시기록을 먼저 등록하세요.</p>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="flex-1 h-8 px-2 text-xs border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d] min-w-0"
            aria-label="콘텐츠 선택"
          >
            <option value="">콘텐츠 선택…</option>
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.posted_at}] {c.title}
              </option>
            ))}
          </select>
          <select
            value={attribution}
            onChange={(e) => setAttribution(e.target.value as Attribution)}
            title={ATTRIBUTION_DESCRIPTIONS[attribution]}
            className="h-8 px-2 text-xs border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d]"
            aria-label="귀속 단계"
          >
            {ATTRIBUTIONS.map((a) => (
              <option key={a} value={a}>
                {ATTRIBUTION_LABELS[a]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLink}
            disabled={busy || !contentId}
            className="h-8 px-3 text-xs bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            연결
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
      <p className="text-[10px] text-[#b0b0b0] mt-1.5">
        직접=UTM·전용링크·고객응답 확인 / 보조=복수 채널 응답 / 추정=시기 연관성만 / 출처불명
      </p>
    </div>
  );
}
