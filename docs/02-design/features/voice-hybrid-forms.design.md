# Voice Hybrid Forms Design Document

> **Summary**: 수동입력(클릭/타이핑) + 음성입력을 한 폼에서 혼합하는 하이브리드 폼 시스템 상세 설계
>
> **Project**: LIV Plastic Surgery Admin
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-02-10
> **Status**: Draft
> **Planning Doc**: [voice-hybrid-forms.plan.md](../../01-plan/features/voice-hybrid-forms.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 기존 `VoiceNoteInput.tsx`를 수정 없이 유지하면서 새 `HybridForm` 계층으로 래핑
2. 필드별로 `manual` / `voice` / `both` 입력방식을 설정할 수 있는 유연한 구조
3. 수동 필드 완료 → 음성 필드 자동 전환의 매끄러운 UX
4. 5개 기본 제공 양식(Smart Form)을 즉시 사용 가능
5. 모바일/데스크톱 모두 최적화

### 1.2 Design Principles

- **기존 코드 최소 변경**: VoiceNoteInput은 그대로 두고, HybridForm이 이를 내부적으로 사용
- **점진적 적용**: 각 페이지를 독립적으로 전환 가능 (한번에 모두 바꿀 필요 없음)
- **Fallback First**: 음성 미지원 환경에서도 모든 필드가 수동 입력으로 동작
- **Single Source of Truth**: 양식 정의는 `smart-forms.ts` 한 파일에서 관리

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Pages (Consumer)                     │
├──────────────┬──────────────────┬───────────────────────────┤
│ Consultations│   Operations     │   Voice Note Page          │
│   page.tsx   │   page.tsx       │   page.tsx                 │
└──────┬───────┴────────┬─────────┴────────────┬──────────────┘
       │                │                      │
       ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FormTemplateSelector.tsx                         │
│  (양식 선택 카드 UI - 초진상담/재진상담/시술배정/퀵메모/...)    │
└────────────────────────┬────────────────────────────────────┘
                         │ selected template
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   HybridForm.tsx                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Manual Section (수동 입력 필드들)                   │       │
│  │  ┌─────────────┐ ┌──────────────┐               │       │
│  │  │ TextInput   │ │ SelectInput  │ ...           │       │
│  │  └─────────────┘ └──────────────┘               │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Voice Section (음성 입력 필드들)                    │       │
│  │  ┌──────────────────────────────────────────┐   │       │
│  │  │ VoiceFieldRecorder (wraps VoiceNoteInput)│   │       │
│  │  │  - 단일 필드 음성 인식                     │   │       │
│  │  │  - 필드 간 자동 전환                       │   │       │
│  │  │  - 진행 표시                               │   │       │
│  │  └──────────────────────────────────────────┘   │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ FormPreview.tsx (결과 미리보기)                    │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
       │                                          │
       ▼                                          ▼
┌─────────────────────┐              ┌─────────────────────────┐
│ VoiceNoteInput.tsx  │              │ smart-forms.ts           │
│ (기존 컴포넌트 유지)  │              │ (양식 정의 + 타입)        │
└─────────────────────┘              └─────────────────────────┘
```

### 2.2 Data Flow

```
1. 사용자가 양식 선택 (FormTemplateSelector)
   └→ SmartFormTemplate 객체가 HybridForm에 전달

2. HybridForm이 필드를 분류
   ├→ manual 필드: 텍스트/셀렉트/라디오/숫자 렌더링
   ├→ voice 필드: VoiceFieldRecorder로 순차 음성 입력
   └→ both 필드: 수동 입력 + 마이크 보조 버튼

3. 수동 필드 입력 완료
   └→ "음성 입력 시작" 버튼 or 자동 전환

4. 음성 필드 순차 입력
   ├→ 필드별 음성 안내 표시
   ├→ Web Speech API로 인식
   ├→ 인식 결과 → formData[fieldKey]에 저장
   └→ 다음 필드 자동 이동 (또는 수동 건너뛰기)

5. 모든 필드 완료
   ├→ FormPreview에서 결과 확인
   └→ onSubmit 콜백으로 상위 컴포넌트에 전달

6. 상위 컴포넌트가 적절한 API 호출
   ├→ 상담기록: PATCH /api/admin/consultations/:id
   ├→ 운영현황: POST /api/admin/operations
   └→ 퀵노트: localStorage (Phase 4에서 DB)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| HybridForm | smart-forms.ts, VoiceNoteInput | 하이브리드 폼 렌더링 |
| FormTemplateSelector | smart-forms.ts | 양식 선택 UI |
| VoiceFieldRecorder | VoiceNoteInput (내부 로직 재사용) | 단일 필드 음성 입력 |
| FormPreview | smart-forms.ts | 결과 미리보기 |
| Admin Pages | HybridForm, FormTemplateSelector | 페이지 통합 |

---

## 3. Data Model

### 3.1 Core Type Definitions

```typescript
// src/types/smart-forms.ts

// ─── 필드 입력 방식 ───────────────────────────
export type InputMethod = 'manual' | 'voice' | 'both';

// ─── 수동 입력 필드 타입 ──────────────────────
export type ManualFieldType = 'text' | 'select' | 'radio' | 'number' | 'textarea';

// ─── 하이브리드 폼 필드 정의 ──────────────────
export interface HybridFormField {
  key: string;                    // 필드 식별자
  label: string;                  // 표시 라벨
  inputMethod: InputMethod;       // 입력 방식
  fieldType: ManualFieldType;     // 수동 입력 시 필드 타입
  options?: string[];             // select/radio 옵션 목록
  placeholder?: string;           // 플레이스홀더
  voicePrompt?: string;           // 음성 모드 안내 문구
  required?: boolean;             // 필수 여부
  defaultValue?: string;          // 기본값
}

// ─── 스마트 양식 템플릿 ───────────────────────
export type SmartFormCategory = 'consultation' | 'operation' | 'quickNote' | 'custom';

export interface SmartFormTemplate {
  id: string;                     // 양식 ID (URL-safe slug)
  name: string;                   // 양식 이름
  description: string;            // 양식 설명
  icon: string;                   // 양식 아이콘 (이모지 or SVG name)
  category: SmartFormCategory;    // 분류
  fields: HybridFormField[];      // 필드 목록 (순서 = 렌더링 순서)
  isBuiltin: boolean;             // 기본 제공 여부
}

// ─── 폼 데이터 (key-value) ────────────────────
export type HybridFormData = Record<string, string>;

// ─── 폼 상태 ──────────────────────────────────
export type HybridFormPhase = 'manual' | 'voice' | 'preview';
```

### 3.2 Built-in Smart Form Templates

```typescript
// src/types/smart-forms.ts (계속)

import { DOCTOR_OPTIONS, PROCEDURE_TAG_OPTIONS } from './admin';

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
      // ── 수동 입력 구간 ──
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
      // ── 음성 입력 구간 ──
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
      // ── 수동 마무리 구간 ──
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
```

---

## 4. Component Specifications

### 4.1 HybridForm.tsx (메인 컴포넌트)

```typescript
// src/components/admin/hybrid-form/HybridForm.tsx

interface HybridFormProps {
  template: SmartFormTemplate;           // 양식 템플릿
  initialData?: HybridFormData;          // 초기값 (수정 시)
  onSubmit: (data: HybridFormData) => void;  // 완료 콜백
  onCancel?: () => void;                 // 취소 콜백
  autoStartVoice?: boolean;             // 수동 필드 후 음성 자동 시작
  compact?: boolean;                     // 컴팩트 모드 (모달 내 사용)
}
```

**내부 상태 관리:**

```typescript
// useReducer로 폼 상태 관리
type FormAction =
  | { type: 'SET_FIELD'; key: string; value: string }
  | { type: 'SET_PHASE'; phase: HybridFormPhase }
  | { type: 'VOICE_NEXT_FIELD' }
  | { type: 'VOICE_PREV_FIELD' }
  | { type: 'RESET' };

interface FormState {
  data: HybridFormData;
  phase: HybridFormPhase;       // 'manual' | 'voice' | 'preview'
  voiceFieldIdx: number;         // 현재 음성 필드 인덱스 (voice 필드들 중)
}
```

**렌더링 흐름:**

```
phase === 'manual':
┌─────────────────────────────────────────────┐
│  [양식명: 초진 상담]                          │
│                                              │
│  ── 기본 정보 ──                              │
│  환자명: [____________]                       │
│  상담유형: (●)초진 ( )재진 ( )시술후           │
│  담당자: [▾ 김수영 원장]                      │
│                                              │
│  [음성 입력으로 넘어가기 →]                    │
│  또는 하단 '수동으로 계속' 링크                 │
└─────────────────────────────────────────────┘

phase === 'voice':
┌─────────────────────────────────────────────┐
│  [양식명: 초진 상담]                          │
│                                              │
│  ── 음성 입력 (1/3) ──                       │
│  ┌─────────────────────────────────────┐    │
│  │  🎤 주요 호소/고민                    │    │
│  │  "환자의 주요 고민이나 원하는..."      │    │
│  │                                      │    │
│  │  이마 주름이 신경 쓰이시고...          │    │
│  │  ░░░ 인식 중...                       │    │
│  │                                      │    │
│  │  [이전] [건너뛰기] [다음]              │    │
│  │  ████████░░░ 1/3                      │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  또는 하단 '직접 타이핑' 링크                  │
└─────────────────────────────────────────────┘

phase === 'preview':
┌─────────────────────────────────────────────┐
│  [양식명: 초진 상담] - 미리보기                │
│                                              │
│  [환자명] 김미영                              │
│  [상담유형] 초진                              │
│  [담당자] 김수영 원장                         │
│  [주요호소] 이마 주름이 신경 쓰이시고...       │
│  [상담내용] 울쎄라와 보톡스 병행을 추천...     │
│  [메모] 다음 주 화요일 시술 예정               │
│  [권장시술] 울쎄라                            │
│  [예상비용] 350만원                           │
│  [다음단계] 예약확정                          │
│                                              │
│  [수정하기]  [저장]                            │
└─────────────────────────────────────────────┘
```

### 4.2 VoiceFieldRecorder.tsx (음성 필드 입력)

기존 `VoiceNoteInput`의 핵심 음성 인식 로직을 재사용하되, **단일 필드 단위**로 동작하는 경량 컴포넌트.

```typescript
interface VoiceFieldRecorderProps {
  field: HybridFormField;              // 현재 필드 정의
  value: string;                       // 현재 필드 값
  onChange: (value: string) => void;   // 값 변경 콜백
  onNext: () => void;                  // 다음 필드로
  onPrev: () => void;                  // 이전 필드로
  onSkip: () => void;                  // 건너뛰기
  fieldIndex: number;                  // 현재 인덱스
  totalFields: number;                 // 전체 음성 필드 수
  autoStart?: boolean;                 // 자동 음성 시작
}
```

**핵심 동작:**
1. 필드 진입 시 `voicePrompt` 표시
2. 마이크 버튼 클릭 → Web Speech API 시작 (ko-KR)
3. 인식 결과 → `onChange`로 상위에 전달
4. `다음` 클릭 → `onNext` 호출
5. 마지막 필드 `완료` → phase를 'preview'로 전환

**기존 VoiceNoteInput과의 차이:**

| 기능 | VoiceNoteInput | VoiceFieldRecorder |
|------|---------------|-------------------|
| 목적 | 범용 음성 메모 + 다중 템플릿 | 단일 필드 음성 입력 |
| 모드 | free / template (전체 필드 순회) | 단일 필드만 담당 |
| 텍스트영역 | 전체 결과 textarea 포함 | 없음 (상위에서 관리) |
| 필드 전환 | 내부에서 관리 | 상위(HybridForm)에서 관리 |

### 4.3 FormTemplateSelector.tsx (양식 선택 UI)

```typescript
interface FormTemplateSelectorProps {
  templates?: SmartFormTemplate[];      // 표시할 양식 목록 (미지정 시 전체)
  categories?: SmartFormCategory[];     // 카테고리 필터
  onSelect: (template: SmartFormTemplate) => void;
  compact?: boolean;                    // 컴팩트 모드
}
```

**레이아웃:**

```
Desktop (grid-cols-3):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🩺 초진 상담  │ │ 🔄 재진 상담  │ │ 💉 시술 배정  │
│ 신규 환자 상담│ │ 경과 및 추가  │ │ 입실/배정 기록│
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ 📝 빠른 메모  │ │ 📊 시술후기록  │
│ 전달사항 메모 │ │ 경과/주의사항 │
└──────────────┘ └──────────────┘

Mobile (grid-cols-2):
┌──────────┐ ┌──────────┐
│🩺 초진상담│ │🔄 재진상담│
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│💉시술배정 │ │📝 빠른메모│
└──────────┘ └──────────┘
┌──────────┐
│📊시술후기록│
└──────────┘
```

### 4.4 FormPreview.tsx (결과 미리보기)

```typescript
interface FormPreviewProps {
  template: SmartFormTemplate;
  data: HybridFormData;
  onEdit: () => void;                   // 수정하기 → phase를 'manual'로
  onSubmit: () => void;                 // 저장
  saving?: boolean;
}
```

---

## 5. UI/UX Design

### 5.1 상담기록 페이지 통합

**현재**: 메모 필드 클릭 → VoiceNoteInput으로 자유/템플릿 입력

**변경**: 메모 필드 클릭 → 양식 선택 드로어 → 하이브리드 폼

```
상담 상세 패널 (expanded):
┌───────────────────────────────────────────────┐
│  ── 메모 ──                                    │
│  [클릭하여 메모 추가]                           │
│                                                │
│  ┌────────────── 양식 선택 ─────────────────┐  │
│  │ 🩺 초진상담  🔄 재진상담  📝 빠른메모     │  │
│  │ 📊 시술후기록  ✏️ 자유입력                │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  (양식 선택 후 HybridForm 인라인 렌더링)        │
│  ┌──────────────────────────────────────────┐  │
│  │  🩺 초진 상담                             │  │
│  │  환자명: [김미영___________]              │  │
│  │  유형: (●)초진 ( )재진                    │  │
│  │  담당자: [▾ 김수영 원장]                  │  │
│  │                                           │  │
│  │  [🎤 음성 입력 시작]                      │  │
│  │  (주요호소 → 상담내용 → 메모 순차 입력)   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [저장]  [취소]                                 │
└───────────────────────────────────────────────┘
```

**자유 입력 선택 시**: 기존 VoiceNoteInput 그대로 사용 (하위 호환)

### 5.2 운영현황 페이지 통합

**현재**: AddCaseModal에서 수동/음성 탭 분리

**변경**: 하이브리드 폼으로 통합 (탭 제거)

```
새 케이스 추가 모달:
┌───────────────────────────────────────┐
│  새 케이스 추가                        │
│                                        │
│  환자명: [____________] *              │
│  유형: (●)시술 ( )상담 ( )마취 ( )관리 │
│  시술: [▾ 울쎄라]   소요: [▾ 60분]    │
│  담당의: [▾ 김수영 원장]              │
│  방: [▾ 3번방]                        │
│                                        │
│  메모/특이사항:                         │
│  ┌───────────────────────────────┐    │
│  │  🎤 음성 입력                  │    │
│  │  "특이사항을 말씀해주세요"      │    │
│  │                                │    │
│  │  마취크림 도포 완료...          │    │
│  └───────────────────────────────┘    │
│                                        │
│  [취소]  [추가]                         │
└───────────────────────────────────────┘
```

### 5.3 음성노트 전용 페이지 통합

**현재**: 4개 템플릿 카드 선택 → 순차 음성 입력

**변경**: Smart Form 카드 선택 → 하이브리드 입력

```
음성 노트 페이지:
┌───────────────────────────────────────┐
│  음성 노트                             │
│  음성으로 빠르게 기록하세요              │
│                                        │
│  ┌──────────┐ ┌──────────┐            │
│  │ 🩺 초진   │ │ 🔄 재진   │            │
│  │ 상담      │ │ 상담      │            │
│  └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐            │
│  │ 💉 시술   │ │ 📝 빠른   │            │
│  │ 배정      │ │ 메모      │            │
│  └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐            │
│  │ 📊 시술후 │ │ ✏️ 자유   │            │
│  │ 기록      │ │ 입력      │            │
│  └──────────┘ └──────────┘            │
│                                        │
│  (선택 후 HybridForm 표시)             │
└───────────────────────────────────────┘
```

### 5.4 User Flow (전체)

```
┌─────────┐     ┌──────────────┐     ┌────────────┐
│ 양식선택 │────▶│ 수동필드 입력 │────▶│ 음성필드    │
│ (카드)   │     │ (타이핑/클릭) │     │ (순차 음성) │
└─────────┘     └──────────────┘     └─────┬──────┘
                       ▲                    │
                       │                    ▼
                ┌──────┴──────┐     ┌────────────┐
                │   수정하기   │◀────│  미리보기   │
                └─────────────┘     └─────┬──────┘
                                          │
                                          ▼
                                   ┌────────────┐
                                   │    저장     │
                                   └────────────┘
```

---

## 6. File Structure & Implementation Order

### 6.1 New Files

```
src/
├── types/
│   └── smart-forms.ts              # [1] 타입 + 5개 기본 양식 정의
└── components/admin/hybrid-form/
    ├── HybridForm.tsx              # [2] 메인 하이브리드 폼 컴포넌트
    ├── VoiceFieldRecorder.tsx      # [3] 단일 필드 음성 입력 컴포넌트
    ├── FormTemplateSelector.tsx    # [4] 양식 선택 카드 UI
    └── FormPreview.tsx             # [5] 결과 미리보기 컴포넌트
```

### 6.2 Modified Files

```
src/
├── app/admin/(authenticated)/
│   ├── consultations/page.tsx      # [6] 메모 편집 영역에 HybridForm 통합
│   ├── operations/page.tsx         # [7] AddCaseModal을 하이브리드로 전환
│   └── voice-note/page.tsx         # [8] Smart Form 카드 + HybridForm 전환
└── components/admin/
    └── VoiceNoteInput.tsx          # 수정 없음 (기존 유지)
```

### 6.3 Implementation Order

```
Step 1: 타입 정의                    smart-forms.ts
  └─ HybridFormField, SmartFormTemplate 타입
  └─ 5개 기본 양식 상수
  └─ 유틸 함수 (getManualFields, getVoiceFields, hybridFormDataToText)

Step 2: VoiceFieldRecorder          VoiceFieldRecorder.tsx
  └─ Web Speech API 음성 인식 (VoiceNoteInput의 로직 추출)
  └─ 단일 필드: 안내문 표시 → 음성 인식 → 결과 표시
  └─ 이전/다음/건너뛰기 버튼 + 진행바

Step 3: HybridForm                  HybridForm.tsx
  └─ useReducer 폼 상태 관리
  └─ phase='manual': 수동 필드 렌더링 (text/select/radio/number)
  └─ phase='voice': VoiceFieldRecorder로 음성 필드 순차 입력
  └─ phase='preview': FormPreview로 결과 확인
  └─ 수동→음성 전환 버튼 + 직접 타이핑 fallback 링크

Step 4: FormTemplateSelector        FormTemplateSelector.tsx
  └─ 양식 카드 그리드 (2열 모바일 / 3열 데스크톱)
  └─ 카테고리 필터 (선택적)
  └─ 카드 클릭 → onSelect 콜백

Step 5: FormPreview                 FormPreview.tsx
  └─ key-value 미리보기 렌더링
  └─ 수정/저장 버튼

Step 6: 상담기록 통합               consultations/page.tsx
  └─ 메모 편집 영역 변경
  └─ 양식 선택 + HybridForm 인라인 렌더링
  └─ 자유입력 시 기존 VoiceNoteInput fallback 유지
  └─ HybridForm 결과 → notes 필드에 텍스트 저장

Step 7: 운영현황 통합               operations/page.tsx
  └─ AddCaseModal 내 수동/음성 탭 → 하이브리드 폼 통합
  └─ 메모 필드만 VoiceFieldRecorder 사용
  └─ form 데이터 → OperationCase로 매핑

Step 8: 음성노트 페이지 전환        voice-note/page.tsx
  └─ TEMPLATE_OPTIONS → FormTemplateSelector 교체
  └─ VoiceNoteInput → HybridForm 교체
  └─ 자유입력 옵션 유지
```

---

## 7. Error Handling

### 7.1 음성 인식 에러

| 상황 | 처리 |
|------|------|
| 브라우저 미지원 | 모든 필드를 수동 입력으로 렌더링 (graceful degradation) |
| 마이크 권한 거부 | 안내 메시지 + 수동 입력 전환 링크 |
| 인식 실패/타임아웃 | "인식되지 않았습니다. 다시 시도하거나 직접 입력해주세요" |
| 네트워크 끊김 | STT는 브라우저 로컬이므로 영향 없음 |

### 7.2 폼 제출 에러

| 상황 | 처리 |
|------|------|
| 필수 필드 미입력 | 미리보기에서 빨간 하이라이트 + 수정 유도 |
| API 호출 실패 | 에러 토스트 표시, 데이터 유지 (재시도 가능) |
| 중복 제출 | 저장 버튼 disabled 처리 |

---

## 8. Security Considerations

- [x] 음성 데이터는 브라우저에서만 처리 (Web Speech API) — 서버 전송 없음
- [x] 폼 데이터는 기존 Supabase RLS로 보호됨
- [x] 환자 개인정보(이름, 증상)는 HTTPS 경유로만 전송
- [x] XSS 방지: React JSX 자동 이스케이핑으로 충분
- [x] 인증: 기존 관리자 인증(createServerClient) 유지

---

## 9. Test Plan

### 9.1 Key Test Cases

- [ ] Smart Form 5개 양식 각각 수동+음성 입력 후 저장 정상 동작
- [ ] 음성 미지원 브라우저에서 모든 필드가 수동으로 입력 가능
- [ ] 수동 필드 → 음성 필드 전환이 매끄럽게 동작
- [ ] 음성 필드 건너뛰기/이전 이동 정상 동작
- [ ] 미리보기에서 수정 → 다시 입력 흐름 정상
- [ ] 상담기록 페이지: 양식으로 입력한 메모가 정상 저장
- [ ] 운영현황: 하이브리드 폼으로 케이스 생성 정상
- [ ] 음성노트 페이지: Smart Form 선택 → 입력 → 저장 정상
- [ ] 모바일에서 원클릭 양식 진입 및 음성 입력 정상
- [ ] 자유 입력 선택 시 기존 VoiceNoteInput 동작 유지

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase (HybridForm, VoiceFieldRecorder) |
| File organization | `components/admin/hybrid-form/` 디렉토리 |
| State management | useReducer (HybridForm 내부) |
| Type definitions | `types/smart-forms.ts` 분리 |
| Styling | Tailwind CSS (기존 디자인 시스템 컬러 사용) |
| 컬러 | primary: #b4988d, secondary: #6d4e42, bg: #f6f4f2 |

---

## 11. Migration Notes

### 11.1 Backward Compatibility

| 기존 코드 | 변경 사항 |
|-----------|----------|
| `VoiceNoteInput.tsx` | 수정 없음 — 기존 사용처 모두 유지 |
| `voice-templates.ts` | 수정 없음 — smart-forms.ts가 별도로 존재 |
| `consultations/page.tsx` 메모 | 자유입력 선택 시 기존 VoiceNoteInput으로 fallback |
| `operations/page.tsx` AddCaseModal | 수동/음성 탭 → 하이브리드 폼 (기존 API 호출 그대로) |
| `voice-note/page.tsx` | Template 선택 → Smart Form 카드 (+ 자유입력 옵션 유지) |

### 11.2 Gradual Rollout

각 페이지를 독립적으로 전환할 수 있도록 설계:
- Step 6~8은 서로 독립적이므로 순서 변경 가능
- 문제 발생 시 개별 페이지만 롤백 가능

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-10 | Initial draft | Claude |
