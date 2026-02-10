import { DOCTOR_OPTIONS, PROCEDURE_TAG_OPTIONS } from './admin';

// ─── 필드 입력 방식 ───────────────────────────
export type InputMethod = 'manual' | 'voice' | 'both';

// ─── 수동 입력 필드 타입 ──────────────────────
export type ManualFieldType = 'text' | 'select' | 'radio' | 'number' | 'textarea';

// ─── 하이브리드 폼 필드 정의 ──────────────────
export interface HybridFormField {
  key: string;
  label: string;
  inputMethod: InputMethod;
  fieldType: ManualFieldType;
  options?: readonly string[] | string[];
  placeholder?: string;
  voicePrompt?: string;
  required?: boolean;
  defaultValue?: string;
}

// ─── 스마트 양식 템플릿 ───────────────────────
export type SmartFormCategory = 'consultation' | 'operation' | 'quickNote' | 'custom';

export interface SmartFormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SmartFormCategory;
  fields: HybridFormField[];
  isBuiltin: boolean;
}

// ─── 폼 데이터 (key-value) ────────────────────
export type HybridFormData = Record<string, string>;

// ─── 폼 상태 ──────────────────────────────────
export type HybridFormPhase = 'manual' | 'voice' | 'preview';

// ─── 5개 기본 제공 양식 ───────────────────────
export const SMART_FORM_TEMPLATES: SmartFormTemplate[] = [
  // ━━━ 1. 초진 상담 ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'first-visit',
    name: '초진 상담',
    description: '신규 환자 상담 내용을 체계적으로 기록',
    icon: '🩺',
    category: 'consultation',
    isBuiltin: true,
    fields: [
      {
        key: 'patientName',
        label: '환자명',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '환자 이름',
        required: true,
      },
      {
        key: 'consultType',
        label: '상담 유형',
        inputMethod: 'manual',
        fieldType: 'radio',
        options: ['초진', '재진', '시술후관리'],
        defaultValue: '초진',
      },
      {
        key: 'assignee',
        label: '담당자',
        inputMethod: 'manual',
        fieldType: 'select',
        options: [...DOCTOR_OPTIONS, '상담실장'],
      },
      {
        key: 'mainConcern',
        label: '주요 호소/고민',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '환자의 주요 고민이나 원하는 부위를 말씀해주세요',
        placeholder: '예: 이마 주름, 팔자 주름이 신경쓰여서...',
      },
      {
        key: 'consultNote',
        label: '상담 내용',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '상담한 내용을 말씀해주세요',
        placeholder: '상담 진행 내용...',
      },
      {
        key: 'memo',
        label: '메모',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '추가 메모를 말씀해주세요',
        placeholder: '추가 참고사항...',
      },
      {
        key: 'recommended',
        label: '권장 시술',
        inputMethod: 'both',
        fieldType: 'select',
        options: PROCEDURE_TAG_OPTIONS,
        voicePrompt: '추가 설명이 있으면 말씀해주세요',
      },
      {
        key: 'estimatedCost',
        label: '예상 비용',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '예: 350만원',
      },
      {
        key: 'nextStep',
        label: '다음 단계',
        inputMethod: 'manual',
        fieldType: 'radio',
        options: ['예약확정', '재연락', '검토중', '보류'],
      },
    ],
  },

  // ━━━ 2. 재진 상담 ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'follow-up',
    name: '재진 상담',
    description: '기존 환자의 경과 및 추가 요청 기록',
    icon: '🔄',
    category: 'consultation',
    isBuiltin: true,
    fields: [
      {
        key: 'patientName',
        label: '환자명',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '환자 이름',
        required: true,
      },
      {
        key: 'assignee',
        label: '담당자',
        inputMethod: 'manual',
        fieldType: 'select',
        options: [...DOCTOR_OPTIONS, '상담실장'],
      },
      {
        key: 'progress',
        label: '경과/변화',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '이전 시술 후 경과나 변화를 말씀해주세요',
        placeholder: '시술 후 경과...',
      },
      {
        key: 'additionalRequest',
        label: '추가 요청',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '환자의 추가 요청사항을 말씀해주세요',
        placeholder: '추가 요청사항...',
      },
      {
        key: 'memo',
        label: '메모',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '추가 메모를 말씀해주세요',
        placeholder: '참고사항...',
      },
      {
        key: 'nextStep',
        label: '다음 단계',
        inputMethod: 'manual',
        fieldType: 'radio',
        options: ['추가 시술 예약', '경과 관찰', '완료'],
      },
    ],
  },

  // ━━━ 3. 시술 배정 ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'procedure-assign',
    name: '시술 배정',
    description: '환자 입실, 시술 배정 및 소요시간 기록',
    icon: '💉',
    category: 'operation',
    isBuiltin: true,
    fields: [
      {
        key: 'patientName',
        label: '환자명',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '환자 이름',
        required: true,
      },
      {
        key: 'room',
        label: '방 번호',
        inputMethod: 'manual',
        fieldType: 'select',
        options: ['1번방', '2번방', '3번방', '4번방', '5번방', '상담실1', '상담실2'],
      },
      {
        key: 'procedure',
        label: '시술명',
        inputMethod: 'manual',
        fieldType: 'select',
        options: PROCEDURE_TAG_OPTIONS,
      },
      {
        key: 'doctor',
        label: '담당 의사',
        inputMethod: 'manual',
        fieldType: 'select',
        options: DOCTOR_OPTIONS,
      },
      {
        key: 'estimatedDuration',
        label: '예상 소요시간',
        inputMethod: 'manual',
        fieldType: 'select',
        options: ['15분', '30분', '40분', '50분', '60분', '90분', '120분'],
        defaultValue: '60분',
      },
      {
        key: 'status',
        label: '현재 상태',
        inputMethod: 'manual',
        fieldType: 'radio',
        options: ['대기', '상담', '마취', '시술'],
        defaultValue: '대기',
      },
      {
        key: 'memo',
        label: '메모/특이사항',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '특이사항이나 메모를 말씀해주세요',
        placeholder: '예: 마취크림 도포 완료, 보호자 대기 중...',
      },
    ],
  },

  // ━━━ 4. 빠른 메모 ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'quick-memo',
    name: '빠른 메모',
    description: '전달사항, 업무 메모를 빠르게 음성 기록',
    icon: '📝',
    category: 'quickNote',
    isBuiltin: true,
    fields: [
      {
        key: 'subject',
        label: '대상',
        inputMethod: 'both',
        fieldType: 'text',
        placeholder: '누구에 대한 메모인지',
        voicePrompt: '누구에 대한 메모인지 말씀해주세요',
        required: true,
      },
      {
        key: 'priority',
        label: '긴급도',
        inputMethod: 'manual',
        fieldType: 'radio',
        options: ['일반', '중요', '긴급'],
        defaultValue: '일반',
      },
      {
        key: 'content',
        label: '내용',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '내용을 말씀해주세요',
        placeholder: '메모 내용...',
        required: true,
      },
    ],
  },

  // ━━━ 5. 시술 후 기록 ━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'post-procedure',
    name: '시술 후 기록',
    description: '시술 완료 후 경과, 주의사항 기록',
    icon: '📊',
    category: 'consultation',
    isBuiltin: true,
    fields: [
      {
        key: 'patientName',
        label: '환자명',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '환자 이름',
        required: true,
      },
      {
        key: 'procedure',
        label: '시술명',
        inputMethod: 'manual',
        fieldType: 'select',
        options: PROCEDURE_TAG_OPTIONS,
      },
      {
        key: 'doctor',
        label: '담당 의사',
        inputMethod: 'manual',
        fieldType: 'select',
        options: DOCTOR_OPTIONS,
      },
      {
        key: 'result',
        label: '시술 경과',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '시술 경과를 말씀해주세요',
        placeholder: '시술 후 상태, 경과...',
      },
      {
        key: 'precautions',
        label: '주의사항',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '환자에게 전달할 주의사항을 말씀해주세요',
        placeholder: '주의사항, 관리 방법...',
      },
      {
        key: 'memo',
        label: '메모',
        inputMethod: 'voice',
        fieldType: 'textarea',
        voicePrompt: '추가 메모를 말씀해주세요',
        placeholder: '추가 참고사항...',
      },
      {
        key: 'nextVisit',
        label: '다음 내원',
        inputMethod: 'manual',
        fieldType: 'text',
        placeholder: '예: 2주 후, 1개월 후',
      },
    ],
  },
];

// ─── 유틸리티 함수 ─────────────────────────────

export function getSmartFormById(id: string): SmartFormTemplate | undefined {
  return SMART_FORM_TEMPLATES.find(t => t.id === id);
}

export function getSmartFormsByCategory(category: SmartFormCategory): SmartFormTemplate[] {
  return SMART_FORM_TEMPLATES.filter(t => t.category === category);
}

export function getManualFields(template: SmartFormTemplate): HybridFormField[] {
  return template.fields.filter(f => f.inputMethod === 'manual' || f.inputMethod === 'both');
}

export function getVoiceFields(template: SmartFormTemplate): HybridFormField[] {
  return template.fields.filter(f => f.inputMethod === 'voice' || f.inputMethod === 'both');
}

export function getVoiceOnlyFields(template: SmartFormTemplate): HybridFormField[] {
  return template.fields.filter(f => f.inputMethod === 'voice');
}

/** 폼 데이터를 정형화된 텍스트로 변환 */
export function hybridFormDataToText(data: HybridFormData, template: SmartFormTemplate): string {
  return template.fields
    .filter(f => data[f.key])
    .map(f => `[${f.label}] ${data[f.key]}`)
    .join('\n');
}
