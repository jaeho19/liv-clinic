'use client';

/**
 * 마케팅 콘텐츠 게시기록 + 캠페인(광고비) 관리.
 *
 * - 게시기록: 어떤 콘텐츠를 언제 어디에 올렸는지 + 성과 지표(조회/댓글/저장/공유/문의).
 *   지표 미입력은 0이 아니라 '–'(데이터 없음)로 표기한다.
 * - 캠페인: 광고 집행 단위. 광고비(spend_krw)는 선택 입력 — 값이 있어야
 *   유입 통계 대시보드에서 CPL/CAC/ROAS가 계산된다.
 * - 코드(code)는 UTM 매칭용: 캠페인 code = utm_campaign, 콘텐츠 code = utm_content.
 * - 리드와의 연결(귀속)은 유입 통계 리드 수정 모달에서 한다. 여기서는 연결 수만 보여준다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type {
  LeadContentLinkRow,
  MarketingCampaignInsert,
  MarketingCampaignRow,
  MarketingContentInsert,
  MarketingContentRow,
} from '@/types/admin';
import {
  CHANNEL_CATEGORIES,
  CHANNEL_CATEGORY_LABELS,
  CONTENT_PLATFORMS,
  CONTENT_PLATFORM_LABELS,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  getChannelCategoryLabel,
  getContentPlatformLabel,
  type ContentPlatform,
  type ContentType,
} from '@/lib/inflow/taxonomy';

const INPUT_CLS =
  'w-full h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d]';

type Tab = 'contents' | 'campaigns';

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 지표 표시: null = 데이터 없음('–'), 0은 실제 0 */
function metric(v: number | null): string {
  return v == null ? '–' : v.toLocaleString('ko-KR');
}

export default function MarketingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>('contents');
  const [contents, setContents] = useState<MarketingContentRow[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [links, setLinks] = useState<LeadContentLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 첫 로드는 loading 초기값(true)이 스피너를 담당하고, 이후 갱신은 백그라운드로 반영한다.
  const load = useCallback(async () => {
    const [contentsRes, campaignsRes, linksRes] = await Promise.all([
      supabase.from('marketing_contents').select('*').order('posted_at', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('lead_content_links').select('*'),
    ]);
    if (contentsRes.error || campaignsRes.error) {
      setError('데이터를 불러오지 못했습니다. (마이그레이션 확인: supabase/migrations/038_marketing_attribution.sql)');
    } else {
      setError(null);
    }
    setContents((contentsRes.data ?? []) as MarketingContentRow[]);
    setCampaigns((campaignsRes.data ?? []) as MarketingCampaignRow[]);
    setLinks((linksRes.data ?? []) as LeadContentLinkRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const linkedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of links) map.set(k.content_id, (map.get(k.content_id) ?? 0) + 1);
    return map;
  }, [links]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">마케팅 콘텐츠</h2>
          <p className="text-xs text-[#8a8a8a] mt-0.5">
            게시기록과 캠페인(광고비)을 관리합니다. 리드 귀속 연결은 유입 통계 → 리드 수정에서.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-1 self-start">
          {(['contents', 'campaigns'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'
              }`}
            >
              {t === 'contents' ? `게시기록 (${contents.length})` : `캠페인 (${campaigns.length})`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'contents' ? (
        <ContentsTab supabase={supabase} contents={contents} campaigns={campaigns} linkedCounts={linkedCounts} onChanged={load} />
      ) : (
        <CampaignsTab supabase={supabase} campaigns={campaigns} onChanged={load} />
      )}
    </div>
  );
}

// ─── 게시기록 탭 ────────────────────────────────────
function ContentsTab({
  supabase,
  contents,
  campaigns,
  linkedCounts,
  onChanged,
}: {
  supabase: ReturnType<typeof createClient>;
  contents: MarketingContentRow[];
  campaigns: MarketingCampaignRow[];
  linkedCounts: Map<string, number>;
  onChanged: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MarketingContentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarketingContentRow | null>(null);
  const [platformFilter, setPlatformFilter] = useState('');

  const visible = platformFilter ? contents.filter((c) => c.platform === platformFilter) : contents;
  const campaignName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? '';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('marketing_contents').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className={`${INPUT_CLS} w-auto`} aria-label="플랫폼 필터">
          <option value="">플랫폼 전체</option>
          {CONTENT_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {CONTENT_PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditTarget(null);
            setModalOpen(true);
          }}
          className="h-9 px-4 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer"
        >
          + 게시기록 추가
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center text-sm text-[#8a8a8a]">
          게시기록이 없습니다. 콘텐츠를 올릴 때마다 여기에 기록하면 유입 통계와 연결해 성과를 볼 수 있습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-xs text-[#8a8a8a] border-b border-[#f0f0f0]">
                <th className="py-2.5 pl-4 pr-3 font-medium">게시일</th>
                <th className="py-2.5 px-3 font-medium">플랫폼</th>
                <th className="py-2.5 px-3 font-medium">제목</th>
                <th className="py-2.5 px-3 font-medium">캠페인</th>
                <th className="py-2.5 px-3 font-medium">담당자</th>
                <th className="py-2.5 px-3 font-medium text-right">조회</th>
                <th className="py-2.5 px-3 font-medium text-right">댓글</th>
                <th className="py-2.5 px-3 font-medium text-right">저장</th>
                <th className="py-2.5 px-3 font-medium text-right">공유</th>
                <th className="py-2.5 px-3 font-medium text-right" title="수동 입력한 문의 건수">문의</th>
                <th className="py-2.5 px-3 font-medium text-right" title="유입 통계 리드와 연결된 수(귀속)">연결 리드</th>
                <th className="py-2.5 pl-3 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-[#f6f6f6] last:border-0">
                  <td className="py-2.5 pl-4 pr-3 text-[#575756]">{c.posted_at}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f6f6f6] text-[#575756]">
                      {getContentPlatformLabel(c.platform)}
                    </span>
                    {c.content_type && (
                      <span className="text-[10px] text-[#8a8a8a] ml-1">
                        {CONTENT_TYPE_LABELS[c.content_type as ContentType] ?? c.content_type}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-[240px]">
                    <span className="text-[#6d4e42] font-medium truncate inline-block max-w-full align-bottom" title={c.title}>
                      {c.title}
                    </span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#b4988d] ml-1.5 text-xs hover:underline">
                        링크↗
                      </a>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#575756]">{campaignName(c.campaign_id) || '–'}</td>
                  <td className="py-2.5 px-3 text-[#575756]">{c.manager ?? '–'}</td>
                  <td className="py-2.5 px-3 text-right text-[#575756]">{metric(c.view_count)}</td>
                  <td className="py-2.5 px-3 text-right text-[#575756]">{metric(c.comment_count)}</td>
                  <td className="py-2.5 px-3 text-right text-[#575756]">{metric(c.save_count)}</td>
                  <td className="py-2.5 px-3 text-right text-[#575756]">{metric(c.share_count)}</td>
                  <td className="py-2.5 px-3 text-right text-[#575756]">{metric(c.inquiry_count)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#6d4e42]">{linkedCounts.get(c.id) ?? 0}</td>
                  <td className="py-2.5 pl-3 pr-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => {
                          setEditTarget(c);
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="px-2.5 py-1 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ContentFormModal
          supabase={supabase}
          campaigns={campaigns}
          editTarget={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onChanged();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="게시기록 삭제"
        message={`"${deleteTarget?.title ?? ''}" 기록을 삭제하시겠습니까? 이 콘텐츠에 연결된 리드 귀속 정보도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── 게시기록 입력/수정 모달 ─────────────────────────
function ContentFormModal({
  supabase,
  campaigns,
  editTarget,
  onClose,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  campaigns: MarketingCampaignRow[];
  editTarget: MarketingContentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MarketingContentInsert>(() => ({
    posted_at: editTarget?.posted_at ?? todayStr(),
    platform: editTarget?.platform ?? 'instagram',
    content_type: editTarget?.content_type ?? null,
    title: editTarget?.title ?? '',
    url: editTarget?.url ?? '',
    campaign_id: editTarget?.campaign_id ?? null,
    code: editTarget?.code ?? '',
    manager: editTarget?.manager ?? '',
    view_count: editTarget?.view_count ?? null,
    comment_count: editTarget?.comment_count ?? null,
    save_count: editTarget?.save_count ?? null,
    share_count: editTarget?.share_count ?? null,
    inquiry_count: editTarget?.inquiry_count ?? null,
    note: editTarget?.note ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof MarketingContentInsert>(key: K, value: MarketingContentInsert[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clean = (v: string | null | undefined) => {
    const s = (v ?? '').toString().trim();
    return s === '' ? null : s;
  };

  const utmUrl = useMemo(() => {
    const code = (form.code ?? '').toString().trim();
    if (!code) return null;
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';
    const campaign = campaigns.find((c) => c.id === form.campaign_id);
    const params = new URLSearchParams({ utm_source: form.platform ?? 'etc', utm_medium: 'social' });
    if (campaign?.code) params.set('utm_campaign', campaign.code);
    params.set('utm_content', code);
    return `${base}/ko?${params.toString()}`;
  }, [form.code, form.platform, form.campaign_id, campaigns]);

  const copyUtm = async () => {
    if (!utmUrl) return;
    try {
      await navigator.clipboard.writeText(utmUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 미지원 브라우저 — URL이 화면에 노출되므로 무시 */
    }
  };

  const handleSave = async () => {
    if (!(form.title ?? '').toString().trim()) {
      setError('제목을 입력하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: MarketingContentInsert = {
      posted_at: form.posted_at,
      platform: form.platform,
      content_type: form.content_type ?? null,
      title: (form.title ?? '').toString().trim(),
      url: clean(form.url),
      campaign_id: form.campaign_id || null,
      code: clean(form.code),
      manager: clean(form.manager),
      view_count: form.view_count ?? null,
      comment_count: form.comment_count ?? null,
      save_count: form.save_count ?? null,
      share_count: form.share_count ?? null,
      inquiry_count: form.inquiry_count ?? null,
      note: clean(form.note),
    };
    const res = editTarget
      ? await supabase.from('marketing_contents').update(payload).eq('id', editTarget.id)
      : await supabase.from('marketing_contents').insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.code === '23505' ? '이미 사용 중인 코드입니다.' : '저장에 실패했습니다.');
      return;
    }
    onSaved();
  };

  const numField = (
    label: string,
    key: 'view_count' | 'comment_count' | 'save_count' | 'share_count' | 'inquiry_count'
  ) => (
    <Field label={label}>
      <input
        type="number"
        min={0}
        value={form[key] ?? ''}
        onChange={(e) => set(key, e.target.value === '' ? null : Number(e.target.value))}
        placeholder="미입력=–"
        className={INPUT_CLS}
      />
    </Field>
  );

  return (
    // items-center 금지: 패널이 화면보다 길면 위쪽이 스크롤 불가 영역이 됨 → 패널 m-auto로 중앙정렬
    <div className="fixed inset-0 z-50 flex bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-xl m-auto">
        <h3 className="font-bold text-[#6d4e42] mb-4">{editTarget ? '게시기록 수정' : '게시기록 추가'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="게시일">
            <input type="date" value={form.posted_at ?? ''} onChange={(e) => set('posted_at', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="플랫폼">
            <select value={form.platform} onChange={(e) => set('platform', e.target.value as ContentPlatform)} className={INPUT_CLS}>
              {CONTENT_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {CONTENT_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="콘텐츠 유형">
            <select value={form.content_type ?? ''} onChange={(e) => set('content_type', e.target.value || null)} className={INPUT_CLS}>
              <option value="">선택 안 함</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <input type="text" value={form.manager ?? ''} onChange={(e) => set('manager', e.target.value)} className={INPUT_CLS} />
          </Field>

          <Field label="제목" full>
            <input type="text" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="게시물 링크" full>
            <input type="url" value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://..." className={INPUT_CLS} />
          </Field>

          <Field label="캠페인">
            <select value={form.campaign_id ?? ''} onChange={(e) => set('campaign_id', e.target.value || null)} className={INPUT_CLS}>
              <option value="">연결 안 함</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="콘텐츠 코드 (utm_content 매칭)">
            <input
              type="text"
              value={form.code ?? ''}
              onChange={(e) => set('code', e.target.value)}
              placeholder="예: 2608_reels_aptos01"
              className={INPUT_CLS}
            />
          </Field>

          {utmUrl && (
            <div className="col-span-2 flex items-center gap-2 bg-[#f6f2ef] border border-[#e8ddd6] rounded-lg px-3 py-2">
              <span className="text-[11px] text-[#6d4e42] truncate flex-1" title={utmUrl}>
                {utmUrl}
              </span>
              <button
                type="button"
                onClick={copyUtm}
                className="shrink-0 h-7 px-2.5 text-[11px] border border-[#d9c8be] rounded-lg hover:bg-white transition-colors cursor-pointer text-[#6d4e42]"
              >
                {copied ? '복사됨 ✓' : 'UTM 링크 복사'}
              </button>
            </div>
          )}

          {numField('조회수', 'view_count')}
          {numField('댓글', 'comment_count')}
          {numField('저장', 'save_count')}
          {numField('공유', 'share_count')}
          {numField('문의 건수 (고객 응답 기준)', 'inquiry_count')}
          <div />

          <Field label="비고" full>
            <textarea
              value={form.note ?? ''}
              onChange={(e) => set('note', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d] resize-none"
            />
          </Field>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 캠페인 탭 ──────────────────────────────────────
function CampaignsTab({
  supabase,
  campaigns,
  onChanged,
}: {
  supabase: ReturnType<typeof createClient>;
  campaigns: MarketingCampaignRow[];
  onChanged: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MarketingCampaignRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarketingCampaignRow | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('marketing_campaigns').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs text-[#8a8a8a]">
          광고비를 입력한 캠페인만 유입 통계에서 CPL·CAC·ROAS가 계산됩니다 (미입력은 &lsquo;데이터 없음&rsquo;).
          광고비는 <b>수수료·VAT 포함 총지출</b>로 입력하고, 장기 집행은 <b>월 단위로 캠페인을 나눠</b> 등록하세요.
          CAC = 광고비 ÷ 결제 환자 수.
        </p>
        <button
          onClick={() => {
            setEditTarget(null);
            setModalOpen(true);
          }}
          className="h-9 px-4 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer shrink-0"
        >
          + 캠페인 추가
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center text-sm text-[#8a8a8a]">
          등록된 캠페인이 없습니다. 예: &ldquo;바비톡 8월 배너&rdquo;, &ldquo;아파트 엘리베이터 광고&rdquo;
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-xs text-[#8a8a8a] border-b border-[#f0f0f0]">
                <th className="py-2.5 pl-4 pr-3 font-medium">캠페인</th>
                <th className="py-2.5 px-3 font-medium">코드</th>
                <th className="py-2.5 px-3 font-medium">채널</th>
                <th className="py-2.5 px-3 font-medium">집행 기간</th>
                <th className="py-2.5 px-3 font-medium text-right">광고비</th>
                <th className="py-2.5 px-3 font-medium">상태</th>
                <th className="py-2.5 pl-3 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[#f6f6f6] last:border-0">
                  <td className="py-2.5 pl-4 pr-3 font-medium text-[#6d4e42]">{c.name}</td>
                  <td className="py-2.5 px-3 text-[#8a8a8a] text-xs">{c.code ?? '–'}</td>
                  <td className="py-2.5 px-3 text-[#575756]">
                    {c.channel_category ? getChannelCategoryLabel(c.channel_category) : '–'}
                    {c.channel_detail && <span className="text-xs text-[#8a8a8a]"> · {c.channel_detail}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-[#575756]">
                    {c.start_date && c.end_date ? `${c.start_date} ~ ${c.end_date}` : '–'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {c.spend_krw == null ? (
                      <span className="text-xs text-[#8a8a8a]">데이터 없음</span>
                    ) : (
                      <span className="text-[#575756]">{c.spend_krw.toLocaleString('ko-KR')}원</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 pr-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => {
                          setEditTarget(c);
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="px-2.5 py-1 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CampaignFormModal
          supabase={supabase}
          editTarget={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onChanged();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="캠페인 삭제"
        message={`"${deleteTarget?.name ?? ''}" 캠페인을 삭제하시겠습니까? 연결된 리드·콘텐츠에서는 캠페인 연결만 해제됩니다.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── 캠페인 입력/수정 모달 ───────────────────────────
function CampaignFormModal({
  supabase,
  editTarget,
  onClose,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  editTarget: MarketingCampaignRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MarketingCampaignInsert>(() => ({
    name: editTarget?.name ?? '',
    code: editTarget?.code ?? '',
    channel_category: editTarget?.channel_category ?? null,
    channel_detail: editTarget?.channel_detail ?? '',
    start_date: editTarget?.start_date ?? null,
    end_date: editTarget?.end_date ?? null,
    spend_krw: editTarget?.spend_krw ?? null,
    note: editTarget?.note ?? '',
    is_active: editTarget?.is_active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MarketingCampaignInsert>(key: K, value: MarketingCampaignInsert[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clean = (v: string | null | undefined) => {
    const s = (v ?? '').toString().trim();
    return s === '' ? null : s;
  };

  const handleSave = async () => {
    if (!(form.name ?? '').toString().trim()) {
      setError('캠페인 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: MarketingCampaignInsert = {
      name: (form.name ?? '').toString().trim(),
      code: clean(form.code),
      channel_category: form.channel_category ?? null,
      channel_detail: clean(form.channel_detail),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      spend_krw: form.spend_krw ?? null,
      note: clean(form.note),
      is_active: form.is_active ?? true,
    };
    const res = editTarget
      ? await supabase.from('marketing_campaigns').update(payload).eq('id', editTarget.id)
      : await supabase.from('marketing_campaigns').insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.code === '23505' ? '이미 사용 중인 코드입니다.' : '저장에 실패했습니다.');
      return;
    }
    onSaved();
  };

  return (
    // items-center 금지: 패널이 화면보다 길면 위쪽이 스크롤 불가 영역이 됨 → 패널 m-auto로 중앙정렬
    <div className="fixed inset-0 z-50 flex bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-5 max-w-lg w-full shadow-xl m-auto">
        <h3 className="font-bold text-[#6d4e42] mb-4">{editTarget ? '캠페인 수정' : '캠페인 추가'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="캠페인 이름" full>
            <input type="text" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="예: 바비톡 8월 배너" className={INPUT_CLS} />
          </Field>

          <Field label="코드 (utm_campaign 매칭)">
            <input type="text" value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="예: 2608_babitalk" className={INPUT_CLS} />
          </Field>
          <Field label="활성">
            <label className="flex items-center gap-2 h-9 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="w-4 h-4 accent-[#b4988d]"
              />
              사용 중
            </label>
          </Field>

          <Field label="유입 경로 (전후 비교 기준)">
            <select value={form.channel_category ?? ''} onChange={(e) => set('channel_category', e.target.value || null)} className={INPUT_CLS}>
              <option value="">지정 안 함</option>
              {CHANNEL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="세부 채널">
            <input type="text" value={form.channel_detail ?? ''} onChange={(e) => set('channel_detail', e.target.value)} placeholder="예: 바비톡" className={INPUT_CLS} />
          </Field>

          <Field label="시작일">
            <input type="date" value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value || null)} className={INPUT_CLS} />
          </Field>
          <Field label="종료일">
            <input type="date" value={form.end_date ?? ''} min={form.start_date ?? undefined} onChange={(e) => set('end_date', e.target.value || null)} className={INPUT_CLS} />
          </Field>

          <Field label="광고비(원) — 입력해야 CAC·ROAS 계산" full>
            <input
              type="number"
              min={0}
              step={10000}
              value={form.spend_krw ?? ''}
              onChange={(e) => set('spend_krw', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="미입력 = 데이터 없음"
              className={INPUT_CLS}
            />
          </Field>

          <Field label="비고" full>
            <textarea
              value={form.note ?? ''}
              onChange={(e) => set('note', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d] resize-none"
            />
          </Field>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-[#8a8a8a] mb-1">{label}</label>
      {children}
    </div>
  );
}
