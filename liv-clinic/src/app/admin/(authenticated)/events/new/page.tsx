'use client';

import { useState } from 'react';
import EventForm from '@/components/admin/EventForm';
import {
  buildMonthlyPromotionDraft,
  getDefaultPromotionMonth,
  parseMonthInputValue,
  toMonthInputValue,
} from '@/lib/monthlyPromotionTemplate';
import type { MonthlyPromotionDraft } from '@/lib/monthlyPromotionTemplate';

type Stage =
  | { kind: 'choose' }
  | { kind: 'monthly-setup' }
  | { kind: 'monthly-form'; year: number; month: number }
  | { kind: 'general-form' };

export default function NewEventPage() {
  const [stage, setStage] = useState<Stage>({ kind: 'choose' });
  const [monthValue, setMonthValue] = useState(() => {
    const { year, month } = getDefaultPromotionMonth();
    return toMonthInputValue(year, month);
  });

  const parsed = parseMonthInputValue(monthValue);
  const backToChoose = () => setStage({ kind: 'choose' });

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">새 이벤트 등록</h2>

      {stage.kind === 'choose' && (
        <TypeChooser
          onSelect={(kind) => setStage(kind === 'monthly' ? { kind: 'monthly-setup' } : { kind: 'general-form' })}
        />
      )}

      {stage.kind === 'monthly-setup' && (
        <MonthlySetup
          monthValue={monthValue}
          onMonthChange={setMonthValue}
          draft={parsed ? buildMonthlyPromotionDraft(parsed.year, parsed.month) : null}
          onStart={() => { if (parsed) setStage({ kind: 'monthly-form', ...parsed }); }}
          onBack={backToChoose}
        />
      )}

      {/* key 를 템플릿마다 다르게 주어 유형을 다시 고르면 폼이 새로 만들어지게 한다. */}
      {stage.kind === 'monthly-form' && (
        <div>
          <StageHeader label={`매달 프로모션 템플릿 적용 · ${stage.year}년 ${stage.month}월`} onBack={backToChoose} />
          <EventForm
            key={`monthly-${stage.year}-${stage.month}`}
            defaults={buildMonthlyPromotionDraft(stage.year, stage.month)}
          />
        </div>
      )}

      {stage.kind === 'general-form' && (
        <div>
          <StageHeader label="일반 새 이벤트" onBack={backToChoose} />
          <EventForm key="general" />
        </div>
      )}
    </div>
  );
}

function TypeChooser({ onSelect }: { onSelect: (kind: 'monthly' | 'general') => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
      <TypeCard
        icon="📅"
        title="매달 프로모션"
        description="월만 고르면 제목·설명(4개 언어)·기간·관련 시술이 자동으로 채워집니다"
        onClick={() => onSelect('monthly')}
      />
      <TypeCard
        icon="✨"
        title="일반 새 이벤트"
        description="빈 양식에서 처음부터 작성합니다"
        onClick={() => onSelect('general')}
      />
    </div>
  );
}

interface TypeCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

function TypeCard({ icon, title, description, onClick }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-xl border border-[#e5e5e5] p-6 text-left transition-colors hover:border-[#b4988d] hover:bg-[#b4988d]/5 cursor-pointer"
    >
      <span className="text-3xl">{icon}</span>
      <p className="mt-3 text-base font-bold text-[#6d4e42]">{title}</p>
      <p className="mt-1.5 text-sm text-[#8a8a8a] leading-relaxed">{description}</p>
    </button>
  );
}

interface MonthlySetupProps {
  monthValue: string;
  onMonthChange: (value: string) => void;
  draft: MonthlyPromotionDraft | null;
  onStart: () => void;
  onBack: () => void;
}

function MonthlySetup({ monthValue, onMonthChange, draft, onStart, onBack }: MonthlySetupProps) {
  return (
    <div className="max-w-2xl">
      <StageHeader label="매달 프로모션" onBack={onBack} />
      <label className="block text-sm font-medium text-[#575756] mb-1.5">프로모션 월</label>
      <input
        type="month"
        value={monthValue}
        onChange={(e) => onMonthChange(e.target.value)}
        className="px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
      />

      <div className="mt-4">
        {draft ? (
          <DraftPreview draft={draft} />
        ) : (
          <p className="text-sm text-[#8a8a8a]">월을 먼저 선택해 주세요.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={!draft}
        className="mt-5 px-6 py-2.5 bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] disabled:bg-[#d4c4bb] text-sm font-medium transition-colors cursor-pointer"
      >
        이 내용으로 시작하기
      </button>
    </div>
  );
}

function DraftPreview({ draft }: { draft: MonthlyPromotionDraft }) {
  const rows = [
    { label: '슬러그', value: draft.slug },
    { label: '제목 (한국어)', value: draft.title_ko },
    { label: '제목 (English)', value: draft.title_en },
    { label: '제목 (日本語)', value: draft.title_ja },
    { label: '제목 (中文)', value: draft.title_zh },
    { label: '기간', value: `${draft.start_date} ~ ${draft.end_date}` },
    { label: '관련 시술', value: `${draft.related_treatments.length}개 전체 선택` },
  ];

  return (
    <dl className="grid gap-2 bg-[#f6f6f6] rounded-lg p-4">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-3">
          <dt className="w-24 shrink-0 text-xs text-[#8a8a8a] pt-0.5">{row.label}</dt>
          <dd className="text-sm text-[#575756]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StageHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6 text-sm">
      <span className="text-[#8a8a8a]">{label}</span>
      <button
        type="button"
        onClick={onBack}
        className="text-[#b4988d] underline underline-offset-2 hover:text-[#a08474] cursor-pointer"
      >
        유형 다시 선택
      </button>
    </div>
  );
}
