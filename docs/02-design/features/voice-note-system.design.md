# Design: 음성 노트 시스템 (Voice Note System)

> **Feature**: voice-note-system
> **Created**: 2026-02-08
> **Status**: Draft
> **PDCA Phase**: Design
> **Plan Reference**: `docs/01-plan/features/voice-note-system.plan.md`

---

## 1. 아키텍처 개요

### 1.1 현재 구조

```
VoiceNoteInput.tsx (409 lines, 단일 컴포넌트)
├── Web Speech API 타입 선언 (lines 6-34)
├── ConsultationTemplate 인터페이스 (lines 37-46) ← 상담 전용
├── TEMPLATE_FIELDS 상수 (lines 48-57) ← 하드코딩 8개 필드
├── VoiceNoteInputProps (lines 61-68) ← onTemplateComplete가 ConsultationTemplate 타입
├── 음성 인식 로직 (lines 109-171)
├── 템플릿 모드 네비게이션 (lines 183-229)
└── UI 렌더링 (lines 245-407)
```

사용처:
- `consultations/page.tsx:589` — 메모 인라인 편집 (자유 입력만 사용)
- `consultations/page.tsx:896` — 메모 인라인 편집 (자유 입력만 사용)

### 1.2 목표 구조

```
src/
├── types/
│   └── voice-templates.ts              ← NEW: 템플릿 타입 정의 + 설정
├── components/admin/
│   ├── VoiceNoteInput.tsx              ← MODIFY: 다중 템플릿 지원으로 리팩터링
│   └── ConsultationTimeline.tsx        ← MODIFY: 음성 메모 입력 추가
├── app/admin/(authenticated)/
│   ├── consultations/page.tsx          ← MODIFY: templateType prop 전달
│   ├── operations/page.tsx             ← MODIFY: AddCaseModal에 음성 탭 추가
│   └── voice-note/page.tsx             ← NEW: 모바일 전용 퀵노트 페이지
└── app/api/admin/
    └── voice-notes/route.ts            ← NEW: 퀵노트 저장 API (Phase 4)
```

---

## 2. 상세 설계

### 2.1 Phase 1: 템플릿 설정 분리 (`types/voice-templates.ts`)

```typescript
// ─── 템플릿 필드 정의 ───────────────────────────
export interface TemplateField {
  key: string;
  label: string;          // UI 라벨 (예: "환자명")
  placeholder: string;    // 음성 가이드 (예: "환자 이름을 말씀해주세요")
  required?: boolean;     // 필수 여부 (기본: false)
}

// ─── 템플릿 설정 ────────────────────────────────
export interface TemplateConfig {
  id: string;
  label: string;          // 드롭다운 표시명
  description: string;    // 설명 (모바일 퀵노트에서 사용)
  fields: TemplateField[];
  formatPrefix: Record<string, string>;  // key → 출력 접두사 매핑
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

// ─── 유틸리티 함수 ──────────────────────────────
/** 템플릿 데이터 → 정형화된 텍스트 변환 */
export function templateDataToText(
  data: TemplateData,
  config: TemplateConfig
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
```

### 2.2 Phase 1: VoiceNoteInput 리팩터링

#### Props 변경 (하위 호환 유지)

```typescript
// 기존 export 유지 (하위 호환)
export type { ConsultationTemplate };

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  // 새 props
  templateType?: TemplateType;                        // 기본값: undefined (자유+상담 선택 가능)
  availableTemplates?: TemplateType[];                // 모드 선택기에 표시할 템플릿 목록
  onTemplateComplete?: (data: TemplateData) => void;  // 제네릭 타입으로 변경
  // 기존 props 유지
  placeholder?: string;
  rows?: number;
  className?: string;
  // 모바일 최적화
  mobileOptimized?: boolean;                          // 큰 버튼, 터치 친화적 UI
}
```

#### 주요 변경 사항

| 변경 항목 | 현재 | 변경 후 |
|-----------|------|---------|
| `TEMPLATE_FIELDS` | 컴포넌트 내 하드코딩 | `TEMPLATE_CONFIGS[templateType].fields`에서 동적 로드 |
| `ConsultationTemplate` 타입 | 고정 인터페이스 | `TemplateData` (Record<string, string>) |
| `templateToText()` | 상담 필드 하드코딩 | `templateDataToText()` 유틸리티 함수 사용 |
| 모드 선택기 | "자유입력 / 템플릿" 2개 | "자유입력 / 상담기록 / 운영현황 / 퀵노트" (availableTemplates에 따라) |
| `onTemplateComplete` | `ConsultationTemplate` 반환 | `TemplateData` 반환 |
| `inputMode` state | `'free' \| 'template'` | `'free' \| TemplateType` |

#### 하위 호환 전략
- 기존 `onTemplateComplete?: (template: ConsultationTemplate) => void` 사용처는 없음 (현재 consultations 페이지에서 `onTemplateComplete` prop을 전달하지 않음 — 자유입력만 사용)
- `ConsultationTemplate` 인터페이스는 export 유지하되 deprecated 주석 추가
- `templateType` prop이 없으면 기존과 동일하게 동작 (자유입력 + 상담 템플릿 선택 가능)

#### 모바일 최적화 (`mobileOptimized` prop)

`mobileOptimized={true}` 일 때:
- 마이크 버튼 크기: `w-16 h-16` (64px) → 터치 타겟 충분
- 필드 네비게이션 버튼: `py-2 px-4` (더 큰 터치 영역)
- 진행바 높이: `h-2` (기존 `h-1`)
- 가이드 텍스트 크기: `text-sm` (기존 `text-xs`)
- 스와이프 없음 (구현 복잡도 대비 가치 낮음)

---

### 2.3 Phase 2: 운영현황 AddCaseModal 음성 탭

#### UI 설계

```
┌─────────────────────────────────────┐
│ 새 케이스 추가                        │
│                                      │
│  [수동 입력] [음성 입력]  ← 탭 전환    │
│  ─────────────────────────────       │
│                                      │
│  (음성 입력 탭 선택 시)                │
│  ┌──────────────────────────────┐   │
│  │  VoiceNoteInput               │   │
│  │  templateType="operation"     │   │
│  │  mobileOptimized={true}       │   │
│  └──────────────────────────────┘   │
│                                      │
│  ✅ 인식된 데이터 미리보기:            │
│  환자: 김미영                         │
│  시술: 울쎄라                         │
│  담당: 김수영 원장                     │
│  소요: 40분                           │
│                                      │
│  [취소]  [추가]                        │
└─────────────────────────────────────┘
```

#### 음성 데이터 → 케이스 필드 매핑 로직

```typescript
function mapVoiceToCase(data: TemplateData): Partial<OperationCase> {
  return {
    patientName: data.patientName || '',
    // room → roomId 매핑 (fuzzy: "3번방" → "proc-3")
    roomId: parseRoomId(data.room),
    // procedure → 시술명 매핑 (PROCEDURE_OPTIONS_BY_TYPE에서 매칭)
    procedure: matchProcedure(data.procedure),
    // doctor → DOCTOR_OPTIONS에서 매칭
    doctor: matchDoctor(data.doctor),
    // estimatedDuration → 숫자 추출 (예: "40분" → 40)
    expectedDurationMin: parseDuration(data.estimatedDuration),
    // treatmentType → 시술명에서 추론
    treatmentType: inferTreatmentType(data.procedure),
    memo: data.memo,
  };
}
```

**매핑 헬퍼 함수들** (`types/voice-templates.ts`에 추가):

```typescript
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
  // PROCEDURE_TAG_OPTIONS에서 포함 관계로 매칭
  const found = PROCEDURE_TAG_OPTIONS.find(
    opt => normalized.includes(opt.toLowerCase()) || opt.toLowerCase().includes(normalized)
  );
  return found || text.trim();
}

/** 의사명 텍스트 → DOCTOR_OPTIONS에서 매칭 */
export function matchDoctor(text?: string): string {
  if (!text) return DOCTOR_OPTIONS[0];
  const normalized = text.trim();
  const found = DOCTOR_OPTIONS.find(
    d => normalized.includes(d) || d.includes(normalized)
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
```

#### AddCaseModal 변경

```typescript
function AddCaseModal({ onAdd, onClose }: Props) {
  const [inputTab, setInputTab] = useState<'manual' | 'voice'>('manual');
  const [voiceText, setVoiceText] = useState('');
  const [voiceData, setVoiceData] = useState<TemplateData | null>(null);
  // ... 기존 form state 유지

  const handleVoiceComplete = (data: TemplateData) => {
    setVoiceData(data);
    // 매핑된 데이터로 form 자동 채움
    const mapped = mapVoiceToCase(data);
    setForm(f => ({
      ...f,
      patientName: mapped.patientName || f.patientName,
      procedure: mapped.procedure || f.procedure,
      doctor: mapped.doctor || f.doctor,
      expectedDurationMin: mapped.expectedDurationMin || f.expectedDurationMin,
      memo: mapped.memo || f.memo,
    }));
    // 자동으로 수동 탭으로 전환하여 확인/수정 가능
    setInputTab('manual');
  };

  return (
    // ... 모달 래퍼
    <div>
      {/* 탭 선택 */}
      <div className="flex border-b border-[#e5e5e5]">
        <button onClick={() => setInputTab('manual')}
          className={inputTab === 'manual' ? 'active' : ''}>
          수동 입력
        </button>
        <button onClick={() => setInputTab('voice')}
          className={inputTab === 'voice' ? 'active' : ''}>
          음성 입력
        </button>
      </div>

      {inputTab === 'voice' ? (
        <VoiceNoteInput
          value={voiceText}
          onChange={setVoiceText}
          templateType="operation"
          mobileOptimized={true}
          onTemplateComplete={handleVoiceComplete}
        />
      ) : (
        // 기존 수동 입력 폼 (음성 데이터로 pre-fill 가능)
      )}
    </div>
  );
}
```

---

### 2.4 Phase 3: 상담관리 음성 입력 강화

#### 변경 범위

1. **상담 메모 편집 (기존 2곳)**
   - `consultations/page.tsx:589` — 모바일 뷰 메모
   - `consultations/page.tsx:896` — 데스크톱 뷰 메모
   - 변경: `<VoiceNoteInput>` → `availableTemplates={['consultation', 'quickNote']}` prop 추가

2. **타임라인 메모 추가**
   - `ConsultationTimeline.tsx:96-111` — 현재 텍스트 input
   - 변경: 텍스트 input 옆에 마이크 버튼 추가 (인라인 음성 입력)
   - 별도의 VoiceNoteInput 컴포넌트가 아닌, 간단한 마이크 토글 버튼 + 음성 인식 훅

#### ConsultationTimeline 마이크 추가 설계

```typescript
// ConsultationTimeline.tsx 내부
const [isVoiceMode, setIsVoiceMode] = useState(false);

// 음성 모드일 때 VoiceNoteInput 사용
{isVoiceMode ? (
  <VoiceNoteInput
    value={noteInput}
    onChange={setNoteInput}
    templateType="quickNote"
    rows={2}
    placeholder="음성으로 메모를 추가하세요"
  />
) : (
  <input ... />  // 기존 텍스트 인풋
)}
<button onClick={() => setIsVoiceMode(v => !v)}>
  {isVoiceMode ? '텍스트' : '🎤'}
</button>
```

---

### 2.5 Phase 4: 모바일 전용 퀵노트 페이지

#### 페이지: `/admin/(authenticated)/voice-note/page.tsx`

#### 플로우

```
1. 템플릿 선택 화면
   ┌─────────────────────────────┐
   │ 음성 노트                     │
   │                              │
   │ ┌────────┐ ┌────────┐       │
   │ │운영현황│ │상담기록│        │
   │ └────────┘ └────────┘       │
   │ ┌────────┐ ┌────────┐       │
   │ │ 퀵노트 │ │자유입력│        │
   │ └────────┘ └────────┘       │
   └─────────────────────────────┘

2. 음성 입력 화면 (VoiceNoteInput, mobileOptimized=true)
   ┌─────────────────────────────┐
   │ ← 뒤로    운영 현황          │
   │                              │
   │        ┌───────────┐         │
   │        │           │         │
   │        │  🎤 64px  │         │
   │        │           │         │
   │        └───────────┘         │
   │    "환자 이름을 말씀해주세요"   │
   │                              │
   │  ████████░░░░ 3/7            │
   │                              │
   │  [이전] [건너뛰기] [다음]      │
   │                              │
   │  ┌──────────────────────┐    │
   │  │ [환자] 김미영         │    │
   │  │ [방] 3번방            │    │
   │  │ [시술] 울쎄라         │    │
   │  └──────────────────────┘    │
   └─────────────────────────────┘

3. 저장 확인 → API 호출 → 성공 토스트
```

#### 저장 로직

| 템플릿 | 저장 대상 | API |
|--------|-----------|-----|
| operation | `operation_cases` 테이블 (새 케이스 생성) | `POST /api/admin/operations` |
| consultation | `consultation_timeline` (메모 추가) | `POST /api/admin/consultations/[id]/timeline` |
| quickNote | `voice_notes` 테이블 (새 테이블) | `POST /api/admin/voice-notes` |
| free (자유입력) | `voice_notes` 테이블 | `POST /api/admin/voice-notes` |

#### voice_notes API 설계

```typescript
// POST /api/admin/voice-notes
// Request Body
{
  templateType: 'quickNote' | 'free' | 'operation' | 'consultation';
  structuredData: TemplateData;   // { subject: "김미영", content: "...", priority: "일반" }
  rawText: string;                // textarea의 전체 텍스트
  linkedEntityType?: string;      // 'operation_case' | 'consultation'
  linkedEntityId?: string;        // 연결된 엔티티 ID (선택)
}

// Response
{
  id: string;
  createdAt: string;
}
```

---

## 3. 데이터베이스 변경

### 3.1 Phase 1~3: 변경 없음
기존 테이블/API를 그대로 사용

### 3.2 Phase 4: voice_notes 테이블

```sql
-- Migration: 011_voice_notes.sql
CREATE TABLE IF NOT EXISTS voice_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('operation', 'consultation', 'quickNote', 'free')),
  structured_data JSONB NOT NULL DEFAULT '{}',
  raw_text TEXT,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering
CREATE INDEX idx_voice_notes_template_type ON voice_notes(template_type);
CREATE INDEX idx_voice_notes_created_at ON voice_notes(created_at DESC);
```

### 3.3 supabase.ts 타입 추가 (Phase 4)

```typescript
// src/types/supabase.ts 에 추가
voice_notes: {
  Row: {
    id: string;
    template_type: string;
    structured_data: Record<string, unknown>;
    raw_text: string | null;
    linked_entity_type: string | null;
    linked_entity_id: string | null;
    created_by: string;
    created_at: string;
  };
  Insert: {
    template_type: string;
    structured_data: Record<string, unknown>;
    raw_text?: string | null;
    linked_entity_type?: string | null;
    linked_entity_id?: string | null;
    created_by?: string;
  };
  Update: {
    template_type?: string;
    structured_data?: Record<string, unknown>;
    raw_text?: string | null;
  };
};
```

---

## 4. 파일별 변경 상세

### 4.1 새로 생성하는 파일

| 파일 | Phase | 설명 |
|------|-------|------|
| `src/types/voice-templates.ts` | 1 | 템플릿 타입, 설정 상수, 유틸리티 함수 |
| `src/app/admin/(authenticated)/voice-note/page.tsx` | 4 | 모바일 퀵노트 페이지 |
| `src/app/api/admin/voice-notes/route.ts` | 4 | 퀵노트 저장 API |

### 4.2 수정하는 파일

| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `src/components/admin/VoiceNoteInput.tsx` | 1 | 다중 템플릿 지원, `templateType` prop, `mobileOptimized` prop |
| `src/app/admin/(authenticated)/operations/page.tsx` | 2 | AddCaseModal에 음성 탭 추가 |
| `src/app/admin/(authenticated)/consultations/page.tsx` | 3 | VoiceNoteInput에 `availableTemplates` 전달 |
| `src/components/admin/ConsultationTimeline.tsx` | 3 | 마이크 버튼 + 음성 메모 입력 모드 |
| `src/components/admin/AdminSidebar.tsx` | 4 | "음성 노트" 메뉴 항목 추가 |
| `src/types/supabase.ts` | 4 | voice_notes 타입 추가 |

### 4.3 수정하지 않는 파일
- `src/types/admin.ts` — 기존 타입 변경 불필요
- `src/components/admin/floormap/RoomDetailPanel.tsx` — InlineAddCaseForm은 그대로 유지 (방 클릭 시 수동 입력)
- 기존 API 라우트들 — 변경 없음

---

## 5. VoiceNoteInput 리팩터링 상세

### 5.1 State 변경

```typescript
// Before
const [inputMode, setInputMode] = useState<InputMode>('free');         // 'free' | 'template'
const [templateData, setTemplateData] = useState<ConsultationTemplate>({});

// After
const [inputMode, setInputMode] = useState<'free' | TemplateType>('free');
const [templateData, setTemplateData] = useState<TemplateData>({});
```

### 5.2 현재 템플릿 필드 결정

```typescript
// Before
const currentField = TEMPLATE_FIELDS[currentFieldIdx];

// After
const activeConfig = inputMode !== 'free'
  ? TEMPLATE_CONFIGS[inputMode as TemplateType]
  : null;
const currentFields = activeConfig?.fields || [];
const currentField = currentFields[currentFieldIdx];
```

### 5.3 templateToText 변경

```typescript
// Before (하드코딩)
const templateToText = (data: ConsultationTemplate): string => {
  const lines: string[] = [];
  if (data.patientName) lines.push(`[환자명] ${data.patientName}`);
  // ... 8개 필드 하드코딩
  return lines.join('\n');
};

// After (동적)
const templateToText = (data: TemplateData): string => {
  if (!activeConfig) return '';
  return templateDataToText(data, activeConfig);
};
```

### 5.4 모드 선택기 UI 변경

```typescript
// Before: 2개 옵션 (자유입력 / 템플릿)
// After: 동적 옵션 목록

const modeOptions = useMemo(() => {
  const options: { mode: 'free' | TemplateType; label: string }[] = [
    { mode: 'free', label: '자유 입력' },
  ];
  const templates = availableTemplates || (['consultation', 'operation', 'quickNote'] as TemplateType[]);
  for (const t of templates) {
    options.push({ mode: t, label: TEMPLATE_CONFIGS[t].label });
  }
  return options;
}, [availableTemplates]);
```

### 5.5 onTemplateComplete 호출 변경

```typescript
// Before
const nextField = useCallback(() => {
  // ... 마지막 필드일 때
  onTemplateComplete?.(templateData as ConsultationTemplate);
}, []);

// After
const nextField = useCallback(() => {
  // ... 마지막 필드일 때
  onTemplateComplete?.(templateData);
}, []);
```

---

## 6. 구현 순서 (Implementation Order)

```
Phase 1: VoiceNoteInput 다중 템플릿
├── 1-1. src/types/voice-templates.ts 생성
│     - TemplateField, TemplateConfig, TemplateType 타입
│     - TEMPLATE_CONFIGS 상수 (consultation, operation, quickNote)
│     - templateDataToText() 유틸리티
│     - 매핑 헬퍼 함수들 (parseRoomId, parseDuration, matchProcedure, matchDoctor, inferTreatmentType)
├── 1-2. VoiceNoteInput.tsx 리팩터링
│     - Props에 templateType, availableTemplates, mobileOptimized 추가
│     - inputMode 타입을 'free' | TemplateType으로 변경
│     - TEMPLATE_FIELDS → TEMPLATE_CONFIGS[inputMode]로 동적 로드
│     - templateToText → templateDataToText 사용
│     - 모드 선택기를 동적 목록으로 변경
│     - mobileOptimized일 때 큰 버튼/텍스트
│     - 기존 ConsultationTemplate export 유지 (deprecated)
└── 1-3. 호환성 확인
      - consultations/page.tsx의 기존 VoiceNoteInput 사용이 깨지지 않는지 확인
      - templateType 미지정 시 기존 동작과 동일

Phase 2: 운영현황 통합
├── 2-1. operations/page.tsx의 AddCaseModal 수정
│     - 수동/음성 탭 전환 UI 추가
│     - 음성 탭에 VoiceNoteInput(templateType="operation", mobileOptimized) 배치
│     - handleVoiceComplete: 음성 데이터 → form 자동 채움 → 수동 탭 전환
└── 2-2. 매핑 로직 연동
      - mapVoiceToCase 함수로 voice data → OperationCase 필드 매핑
      - 수동 탭에서 매핑 결과 확인/수정 후 제출

Phase 3: 상담관리 강화
├── 3-1. consultations/page.tsx 수정
│     - VoiceNoteInput에 availableTemplates={['consultation', 'quickNote']} 추가
└── 3-2. ConsultationTimeline.tsx 수정
      - 텍스트 입력 옆 마이크 토글 버튼 추가
      - 음성 모드에서 VoiceNoteInput(templateType="quickNote", rows=2) 사용

Phase 4: 모바일 퀵노트 페이지
├── 4-1. voice_notes DB 테이블 생성 (Supabase migration)
├── 4-2. supabase.ts에 voice_notes 타입 추가
├── 4-3. /api/admin/voice-notes/route.ts 생성 (GET/POST)
├── 4-4. /admin/voice-note/page.tsx 생성
│     - 템플릿 선택 → VoiceNoteInput(mobileOptimized) → 저장
│     - operation 템플릿: POST /api/admin/operations로 케이스 생성
│     - quickNote/free: POST /api/admin/voice-notes로 저장
└── 4-5. AdminSidebar.tsx에 "음성 노트" 메뉴 추가
```

---

## 7. 테스트 시나리오

### 7.1 Phase 1 검증
- [ ] 기존 상담 메모의 VoiceNoteInput이 정상 작동 (하위 호환)
- [ ] templateType="operation" 시 7개 필드가 올바르게 표시
- [ ] templateType="quickNote" 시 3개 필드가 올바르게 표시
- [ ] 모드 선택기에서 템플릿 전환 시 필드/데이터 초기화
- [ ] 음성 인식 후 정형화된 텍스트가 textarea에 표시
- [ ] mobileOptimized 시 큰 버튼/텍스트 렌더링

### 7.2 Phase 2 검증
- [ ] AddCaseModal에서 수동/음성 탭 전환
- [ ] 음성으로 "김미영" → 환자명 필드에 자동 매핑
- [ ] "울쎄라" → procedure 필드에 "울쎄라" 매칭
- [ ] "40분" → expectedDurationMin = 40 파싱
- [ ] 음성 입력 완료 후 수동 탭에서 수정 가능
- [ ] 음성으로 생성된 케이스가 평면도에 정상 표시

### 7.3 Phase 3 검증
- [ ] 상담 메모에서 상담기록/퀵노트 템플릿 선택 가능
- [ ] 타임라인에서 마이크 버튼 → 음성 메모 추가

### 7.4 Phase 4 검증
- [ ] /admin/voice-note 페이지 접근
- [ ] 모바일에서 터치 친화적 UI
- [ ] 운영현황 템플릿 → 케이스 생성 성공
- [ ] 퀵노트 → voice_notes 테이블 저장 성공
- [ ] 최근 노트 목록 표시

---

## 8. 리스크 및 완화

| 리스크 | 완화 방안 |
|--------|-----------|
| VoiceNoteInput 리팩터링 시 기존 기능 깨짐 | templateType 미지정 시 기존과 동일하게 동작하도록 보장 |
| 음성 → 케이스 매핑 부정확 | 음성 완료 후 수동 탭에서 확인/수정 단계 포함 |
| iOS Safari Web Speech API 제한 | continuous=false로 필드별 start/stop 방식 fallback |
| 의료 용어 인식률 | fuzzy matching + 수동 수정 UI |
| Phase 4 DB 테이블 추가 | Phase 1~3은 기존 테이블만 사용, Phase 4는 선택적 |
