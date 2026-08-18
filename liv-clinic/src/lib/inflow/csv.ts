/**
 * 유입 리드 CSV 내보내기 (BOM + 전 셀 따옴표 — 기존 entry 탭 내보내기와 동일 규칙).
 * 미입력 수치는 0이 아니라 빈 셀로 내보낸다.
 */
import { getInflowChannelLabel } from '@/types/admin';
import {
  LEAD_OUTCOME_LABELS,
  LEAD_STAGE_LABELS,
  getChannelCategoryLabel,
  getLeadStage,
  getPatientOriginLabel,
  getTreatmentTagLabel,
  type LeadOutcome,
} from './taxonomy';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const BOM = '﻿';

function esc(v: string | number | null | undefined): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => esc(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => esc(c.value(r))).join(',')),
  ];
  return BOM + lines.join('\n');
}

export interface LeadsCsvRow {
  contact_date: string;
  channel: string;
  agency: string | null;
  is_returning: boolean;
  name: string | null;
  wechat_id: string | null;
  kakao_id: string | null;
  phone: string | null;
  treatment: string | null;
  reserved: boolean;
  reserved_date: string | null;
  visited: boolean;
  visited_date: string | null;
  note: string | null;
  patient_origin: string | null;
  channel_category: string | null;
  channel_detail: string | null;
  treatment_tags: string[];
  paid: boolean;
  paid_date: string | null;
  paid_amount_krw: number | null;
  outcome: string | null;
  manager: string | null;
}

/**
 * 앞 14열은 기존 entry 탭 CSV와 동일한 순서(외부 스프레드시트 호환),
 * 표준화 신규 열은 그 뒤에 덧붙인다.
 */
export const LEADS_CSV_COLUMNS: CsvColumn<LeadsCsvRow>[] = [
  { header: '연락일', value: (l) => l.contact_date },
  { header: '채널', value: (l) => getInflowChannelLabel(l.channel) },
  { header: '에이전시', value: (l) => l.agency },
  { header: '구분', value: (l) => (l.is_returning ? '재진' : '신규') },
  { header: '이름', value: (l) => l.name },
  { header: '위챗ID', value: (l) => l.wechat_id },
  { header: '카카오ID', value: (l) => l.kakao_id },
  { header: '전화', value: (l) => l.phone },
  { header: '시술', value: (l) => l.treatment },
  { header: '예약', value: (l) => (l.reserved ? 'O' : '') },
  { header: '예약일', value: (l) => l.reserved_date },
  { header: '내원', value: (l) => (l.visited ? 'O' : '') },
  { header: '내원일', value: (l) => l.visited_date },
  { header: '비고', value: (l) => l.note },
  { header: '국내/해외', value: (l) => (l.patient_origin ? getPatientOriginLabel(l.patient_origin) : '') },
  { header: '유입 대분류', value: (l) => (l.channel_category ? getChannelCategoryLabel(l.channel_category) : '') },
  { header: '세부 채널', value: (l) => l.channel_detail },
  { header: '시술 태그', value: (l) => l.treatment_tags.map(getTreatmentTagLabel).join('|') },
  { header: '현재 단계', value: (l) => LEAD_STAGE_LABELS[getLeadStage(l)] },
  { header: '결제', value: (l) => (l.paid ? 'O' : '') },
  { header: '결제일', value: (l) => l.paid_date },
  { header: '결제금액(원)', value: (l) => l.paid_amount_krw },
  { header: '취소/노쇼', value: (l) => (l.outcome ? LEAD_OUTCOME_LABELS[l.outcome as LeadOutcome] ?? l.outcome : '') },
  { header: '담당자', value: (l) => l.manager },
];

export const LEADS_CSV_HEADERS = LEADS_CSV_COLUMNS.map((c) => c.header);

export function buildLeadsCsv(rows: LeadsCsvRow[]): string {
  return buildCsv(rows, LEADS_CSV_COLUMNS);
}
