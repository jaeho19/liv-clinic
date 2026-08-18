'use client';

/**
 * 표준화 검토 탭.
 *
 * 과거 행(표준화 필드 누락 + 미확인)에 대해 규칙 기반 후보를 보여주고,
 * 관리자가 체크한 행만 DB에 반영한다. 반영 전에는 DB가 절대 변경되지 않으며,
 * 반영 시에도 이미 값이 있는 필드는 덮어쓰지 않는다(누락 필드만 채움).
 * 후보가 틀렸으면 "수정"으로 직접 입력하고, 판단 불가면 "미분류 확정"으로
 * 필드를 비운 채 검토 큐에서만 내린다(classified_at 기록).
 */
import { useMemo, useState } from 'react';
import type { createClient } from '@/lib/supabase-browser';
import { getInflowChannelLabel, type InflowLeadRow, type InflowLeadUpdate } from '@/types/admin';
import { suggestForLead, type Confidence, type LeadSuggestions } from '@/lib/inflow/classify';
import {
  CHANNEL_CATEGORY_LABELS,
  PATIENT_ORIGIN_LABELS,
  getTreatmentTagLabel,
  needsReview,
} from '@/lib/inflow/taxonomy';

const CONF_BADGE: Record<Confidence, { label: string; cls: string }> = {
  high: { label: '확실', cls: 'bg-emerald-50 text-emerald-700' },
  medium: { label: '확인 권장', cls: 'bg-amber-50 text-amber-700' },
  low: { label: '불확실', cls: 'bg-gray-100 text-gray-500' },
};

function rowConfidence(s: LeadSuggestions): Confidence | null {
  const present = [s.channel?.confidence, s.origin?.confidence, s.treatment?.confidence].filter(
    Boolean
  ) as Confidence[];
  if (present.length === 0) return null;
  if (present.includes('low')) return 'low';
  if (present.includes('medium')) return 'medium';
  return 'high';
}

interface Props {
  leads: InflowLeadRow[];
  supabase: ReturnType<typeof createClient>;
  onEdit: (lead: InflowLeadRow) => void;
  onApplied: () => void;
}

export default function InflowReviewTab({ leads, supabase, onEdit, onApplied }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const queue = useMemo(
    () =>
      leads
        .filter((l) =>
          needsReview({
            patient_origin: l.patient_origin ?? null,
            channel_category: l.channel_category ?? null,
            treatment_tags: l.treatment_tags ?? [],
            classified_at: l.classified_at ?? null,
          })
        )
        .sort((a, b) => b.contact_date.localeCompare(a.contact_date)),
    [leads]
  );

  const suggestions = useMemo(() => {
    const map = new Map<string, LeadSuggestions>();
    for (const l of queue) {
      map.set(
        l.id,
        suggestForLead({
          channel: l.channel,
          agency: l.agency,
          wechat_id: l.wechat_id,
          treatment: l.treatment,
          note: l.note,
        })
      );
    }
    return map;
  }, [queue]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectHighOnly = () =>
    setSelected(new Set(queue.filter((l) => rowConfidence(suggestions.get(l.id)!) === 'high').map((l) => l.id)));

  const buildPatch = (l: InflowLeadRow, s: LeadSuggestions): InflowLeadUpdate => {
    const patch: InflowLeadUpdate = { classified_at: new Date().toISOString() };
    if (!l.patient_origin && s.origin) patch.patient_origin = s.origin.origin;
    if (!l.channel_category && s.channel) {
      patch.channel_category = s.channel.category;
      if (!l.channel_detail && s.channel.detail) patch.channel_detail = s.channel.detail;
    }
    if ((l.treatment_tags ?? []).length === 0 && s.treatment) patch.treatment_tags = s.treatment.tags;
    return patch;
  };

  const applySelected = async () => {
    const targets = queue.filter((l) => selected.has(l.id));
    if (targets.length === 0) return;
    setApplying(true);
    setMessage(null);
    let ok = 0;
    let failed = 0;
    // 순차 청크 처리 (한 번에 10건)
    for (let i = 0; i < targets.length; i += 10) {
      const chunk = targets.slice(i, i + 10);
      const results = await Promise.all(
        chunk.map((l) =>
          supabase
            .from('inflow_leads')
            .update(buildPatch(l, suggestions.get(l.id)!))
            .eq('id', l.id)
        )
      );
      for (const r of results) {
        if (r.error) failed++;
        else ok++;
      }
    }
    setApplying(false);
    setSelected(new Set());
    setMessage(failed > 0 ? `${ok}건 반영, ${failed}건 실패 — 다시 시도하세요.` : `${ok}건 반영 완료.`);
    onApplied();
  };

  const confirmUnclassified = async (l: InflowLeadRow) => {
    setApplying(true);
    const { error } = await supabase
      .from('inflow_leads')
      .update({ classified_at: new Date().toISOString() })
      .eq('id', l.id);
    setApplying(false);
    if (error) setMessage('미분류 확정에 실패했습니다. 다시 시도하세요.');
    onApplied();
  };

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-sm text-[#575756] font-medium">표준화 검토가 필요한 항목이 없습니다.</p>
        <p className="text-xs text-[#8a8a8a] mt-2 max-w-md mx-auto leading-relaxed">
          이 탭은 리드의 자유 입력 기록을 표준 분류(국내/해외 · 유입 경로 · 시술 태그)로 정리하는
          곳으로, 규칙 엔진의 제안을 관리자가 확인한 행만 반영됩니다(기존 값은 덮어쓰지 않음).
        </p>
        <p className="text-xs text-[#8a8a8a] mt-1">
          새 리드에 국내/해외·유입 경로·시술 태그가 비어 있으면 여기에 다시 나타납니다.
        </p>
        {message && <p className="text-xs text-emerald-600 mt-3">{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#f6f2ef] border border-[#e8ddd6] rounded-xl p-4 mb-4 text-xs text-[#6d4e42] leading-relaxed">
        <b>과거 데이터 표준화 절차</b> — 아래 후보는 규칙 기반 <b>제안</b>입니다. ① 제안을 확인하고 ② 맞는
        행만 체크해 반영하세요. 반영 전에는 DB가 변경되지 않고, 반영 시에도 이미 입력된 값은 덮어쓰지
        않습니다. 제안이 틀리면 <b>수정</b>으로 직접 입력하고, 판단이 어려우면 <b>미분류 확정</b>으로
        비워 둔 채 목록에서만 내립니다.
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-sm text-[#575756]">
          검토 대상 <b className="text-[#6d4e42]">{queue.length}</b>건 · 선택{' '}
          <b className="text-[#6d4e42]">{selected.size}</b>건
        </span>
        <div className="flex-1" />
        <button
          onClick={selectHighOnly}
          className="h-8 px-3 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          &lsquo;확실&rsquo;만 선택
        </button>
        <button
          onClick={() => setSelected(new Set(queue.map((l) => l.id)))}
          className="h-8 px-3 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          전체 선택
        </button>
        <button
          onClick={() => setSelected(new Set())}
          className="h-8 px-3 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          해제
        </button>
        <button
          onClick={applySelected}
          disabled={applying || selected.size === 0}
          className="h-8 px-4 text-xs bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer disabled:opacity-50"
        >
          {applying ? '반영 중...' : `선택 ${selected.size}건 반영`}
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-3 text-xs text-emerald-700">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0]">
        {queue.map((l) => {
          const s = suggestions.get(l.id)!;
          const conf = rowConfidence(s);
          const ident = l.name || l.wechat_id || l.kakao_id || l.phone || '(이름 없음)';
          return (
            <div key={l.id} className="p-3 lg:p-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(l.id)}
                onChange={() => toggle(l.id)}
                disabled={!conf}
                className="w-4 h-4 mt-1 accent-[#b4988d] shrink-0"
                aria-label={`${ident} 선택`}
              />
              <div className="flex-1 min-w-0">
                {/* 현재 기록 */}
                <div className="flex flex-wrap items-center gap-1.5 text-sm mb-1.5">
                  <span className="text-xs text-[#8a8a8a]">{l.contact_date}</span>
                  <span className="font-medium text-[#6d4e42]">{ident}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#f6f6f6] text-[#575756]">
                    {getInflowChannelLabel(l.channel)}
                  </span>
                  {l.agency && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{l.agency}</span>
                  )}
                  {l.treatment && <span className="text-xs text-[#8a8a8a] truncate">· {l.treatment}</span>}
                  {l.note && <span className="text-xs text-[#b0b0b0] truncate">({l.note})</span>}
                </div>
                {/* 제안 */}
                {conf ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded-full ${CONF_BADGE[conf].cls}`}>{CONF_BADGE[conf].label}</span>
                    <span className="text-[#8a8a8a]">제안 →</span>
                    {s.origin && !l.patient_origin && (
                      <span className="px-2 py-0.5 rounded-full border border-[#e5e5e5] text-[#575756]">
                        {PATIENT_ORIGIN_LABELS[s.origin.origin]}
                      </span>
                    )}
                    {s.channel && !l.channel_category && (
                      <span className="px-2 py-0.5 rounded-full border border-[#e5e5e5] text-[#575756]">
                        {CHANNEL_CATEGORY_LABELS[s.channel.category]}
                        {s.channel.detail ? ` · ${s.channel.detail}` : ''}
                      </span>
                    )}
                    {s.treatment && (l.treatment_tags ?? []).length === 0 && (
                      <span className="px-2 py-0.5 rounded-full border border-[#e5e5e5] text-[#575756]">
                        {s.treatment.tags.map(getTreatmentTagLabel).join(', ')}
                      </span>
                    )}
                    {s.channel?.reason && <span className="text-[#b0b0b0]">— {s.channel.reason}</span>}
                  </div>
                ) : (
                  <p className="text-xs text-[#8a8a8a]">자동 제안 불가 — 직접 수정하거나 미분류로 확정하세요.</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                <button
                  onClick={() => onEdit(l)}
                  className="px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                >
                  수정
                </button>
                <button
                  onClick={() => confirmUnclassified(l)}
                  disabled={applying}
                  className="px-2.5 py-1 text-xs border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  미분류 확정
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
