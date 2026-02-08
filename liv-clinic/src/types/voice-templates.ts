import { PROCEDURE_TAG_OPTIONS, DOCTOR_OPTIONS } from './admin';
import type { TreatmentType } from './admin';

// ─── 템플릿 필드 정의 ───────────────────────────
export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

// ─── 템플릿 설정 ────────────────────────────────
export interface TemplateConfig {
  id: string;
  label: string;
  description: string;
  fields: TemplateField[];
  formatPrefix: Record<string, string>;
}

export type TemplateType = 'consultation' | 'operation' | 'quickNote';

// ─── 템플릿 데이터 (key-value) ──────────────────
export type TemplateData = Record<string, string>;

// ─── 템플릿 설정 상수 ───────────────────────────
export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  consultation: {
    id: 'consultation',
    label: '상담 기록',
    description: '환자 상담 내용을 정형화된 포맷으로 기록합니다',
    fields: [
      { key: 'patientName', label: '환자명', placeholder: '환자 이름을 말씀해주세요', required: true },
      { key: 'consultType', label: '상담 유형', placeholder: '초진, 재진, 시술후관리 중 하나를 말씀해주세요' },
      { key: 'mainConcern', label: '주요 호소', placeholder: '환자의 주요 고민이나 원하는 부위를 말씀해주세요' },
      { key: 'consultNote', label: '상담 내용', placeholder: '상담한 내용을 말씀해주세요' },
      { key: 'recommended', label: '권장 시술', placeholder: '추천 시술을 말씀해주세요' },
      { key: 'estimatedCost', label: '예상 비용', placeholder: '예상 비용을 말씀해주세요' },
      { key: 'nextStep', label: '다음 단계', placeholder: '예약확정, 재연락, 검토중 등을 말씀해주세요' },
      { key: 'memo', label: '메모', placeholder: '추가 메모를 말씀해주세요' },
    ],
    formatPrefix: {
      patientName: '환자명', consultType: '상담유형', mainConcern: '주요호소',
      consultNote: '상담내용', recommended: '권장시술', estimatedCost: '예상비용',
      nextStep: '다음단계', memo: '메모',
    },
  },

  operation: {
    id: 'operation',
    label: '운영 현황',
    description: '환자 입실, 시술 배정, 소요시간 등을 기록합니다',
    fields: [
      { key: 'patientName', label: '환자명', placeholder: '환자 이름을 말씀해주세요', required: true },
      { key: 'room', label: '방 번호', placeholder: '몇 번 방인지 말씀해주세요' },
      { key: 'procedure', label: '시술명', placeholder: '어떤 시술인지 말씀해주세요' },
      { key: 'doctor', label: '담당 의사', placeholder: '담당 의사를 말씀해주세요' },
      { key: 'estimatedDuration', label: '예상 소요시간', placeholder: '몇 분 정도 걸릴지 말씀해주세요' },
      { key: 'status', label: '현재 상태', placeholder: '대기, 상담, 마취, 시술 중 하나를 말씀해주세요' },
      { key: 'memo', label: '메모', placeholder: '추가 참고사항을 말씀해주세요' },
    ],
    formatPrefix: {
      patientName: '환자', room: '방', procedure: '시술', doctor: '담당',
      estimatedDuration: '예상시간', status: '상태', memo: '메모',
    },
  },

  quickNote: {
    id: 'quickNote',
    label: '퀵노트',
    description: '빠르게 간단한 메모를 기록합니다',
    fields: [
      { key: 'subject', label: '대상', placeholder: '누구에 대한 메모인지 말씀해주세요', required: true },
      { key: 'content', label: '내용', placeholder: '내용을 말씀해주세요', required: true },
      { key: 'priority', label: '긴급도', placeholder: '일반, 중요, 긴급 중 하나를 말씀해주세요' },
    ],
    formatPrefix: {
      subject: '대상', content: '내용', priority: '긴급도',
    },
  },
};

// ─── 유틸리티: 템플릿 데이터 → 정형화된 텍스트 ──────
export function templateDataToText(
  data: TemplateData,
  config: TemplateConfig,
): string {
  const lines: string[] = [];
  for (const field of config.fields) {
    const value = data[field.key];
    if (value) {
      const prefix = config.formatPrefix[field.key] || field.label;
      lines.push(`[${prefix}] ${value}`);
    }
  }
  return lines.join('\n');
}

// ─── 매핑 헬퍼: 음성 텍스트 → 구조화 데이터 ────────

/** "3번방", "3번", "시술실3" → "proc-3" */
export function parseRoomId(text?: string): string {
  if (!text) return 'cons-1';
  const match = text.match(/(\d+)/);
  return match ? `proc-${match[1]}` : 'cons-1';
}

/** "40분", "사십분", "40" → 40 */
export function parseDuration(text?: string): number {
  if (!text) return 60;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : 60;
}

/** 시술명 텍스트 → PROCEDURE_TAG_OPTIONS에서 가장 유사한 것 매칭 */
export function matchProcedure(text?: string): string {
  if (!text) return '';
  const normalized = text.trim().toLowerCase();
  const found = PROCEDURE_TAG_OPTIONS.find(
    opt => normalized.includes(opt.toLowerCase()) || opt.toLowerCase().includes(normalized),
  );
  return found || text.trim();
}

/** 의사명 텍스트 → DOCTOR_OPTIONS에서 매칭 */
export function matchDoctor(text?: string): string {
  if (!text) return DOCTOR_OPTIONS[0];
  const normalized = text.trim();
  const found = DOCTOR_OPTIONS.find(
    d => normalized.includes(d) || d.includes(normalized),
  );
  return found || DOCTOR_OPTIONS[0];
}

/** 시술명으로 TreatmentType 추론 */
export function inferTreatmentType(procedure?: string): TreatmentType {
  if (!procedure) return 'PROCEDURE';
  const p = procedure.toLowerCase();
  if (p.includes('상담') || p.includes('초진') || p.includes('재진')) return 'CONSULT';
  if (p.includes('마취') || p.includes('수면')) return 'ANESTHESIA';
  if (p.includes('관리') || p.includes('보습') || p.includes('재생')) return 'SKINCARE';
  return 'PROCEDURE';
}

/** 음성 operation 데이터 → OperationCase 필드 매핑 */
export function mapVoiceToCase(data: TemplateData) {
  return {
    patientName: data.patientName || '',
    roomId: parseRoomId(data.room),
    procedure: matchProcedure(data.procedure),
    doctor: matchDoctor(data.doctor),
    expectedDurationMin: parseDuration(data.estimatedDuration),
    treatmentType: inferTreatmentType(data.procedure),
    memo: data.memo,
  };
}
