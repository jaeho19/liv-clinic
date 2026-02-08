# Plan: 음성 노트 시스템 (Voice Note System)

> **Feature**: voice-note-system
> **Created**: 2026-02-08
> **Status**: Draft
> **PDCA Phase**: Plan

---

## 1. 배경 (Background)

### 현재 상태
- `VoiceNoteInput.tsx` 컴포넌트가 이미 존재 (Web Speech API, 한국어 STT)
- 상담관리 페이지의 메모 입력에서만 사용 중
- **자유 입력 모드**와 **템플릿 모드** (상담 8개 필드) 지원
- 현재 템플릿이 상담 전용으로 고정됨 (환자명/상담유형/주요호소/상담내용/권장시술/예상비용/다음단계/메모)

### 문제점
1. **단일 템플릿 한계**: 상담 기록용 템플릿만 있어 운영 현황(방 배정, 시술 시간 등)에는 부적합
2. **모바일 최적화 미흡**: 직원들이 이동 중 빠르게 입력하기 어려움
3. **정형화 부재**: 같은 상황에서 직원마다 다른 포맷으로 기록하여 데이터 일관성 없음
4. **사용 범위 제한**: 상담 메모에서만 사용 가능, 운영현황/재고 등에서 활용 불가

### 목표
기존 VoiceNoteInput을 확장하여:
> "모바일에서 음성으로 말하면 → 상황에 맞는 정형화된 포맷으로 자동 변환 → DB 저장"

---

## 2. 범위 (Scope)

### In Scope

| 단계 | 기능 | 우선순위 |
|------|------|----------|
| **Phase 1** | VoiceNoteInput 다중 템플릿 지원 | P0 |
| **Phase 2** | 운영현황 음성 입력 (방 배정/시술 기록) | P0 |
| **Phase 3** | 상담관리 음성 입력 강화 | P1 |
| **Phase 4** | 모바일 전용 음성 퀵노트 페이지 | P1 |

### Out of Scope
- AI 기반 자연어 파싱 (STT → 구조화 자동 분류) — 현재는 템플릿 가이드 방식 유지
- 음성 파일 저장/재생 (텍스트 변환만)
- 다국어 음성 인식 (한국어 전용)
- 외부 STT 서비스 연동 (Web Speech API만 사용)

---

## 3. Phase 1: VoiceNoteInput 다중 템플릿 시스템

### 3.1 현재 구조 분석

```
VoiceNoteInput (현재)
├── inputMode: 'free' | 'template'
├── TEMPLATE_FIELDS: 상담 전용 8개 필드 (하드코딩)
├── ConsultationTemplate 인터페이스
└── templateToText(): 고정 포맷 출력
```

### 3.2 목표 구조

```
VoiceNoteInput (확장)
├── inputMode: 'free' | 'template'
├── templateType prop: 'consultation' | 'operation' | 'quickNote' | 'custom'
├── TEMPLATE_CONFIGS: 템플릿별 필드 설정
├── onComplete callback: 구조화된 데이터 반환
└── 모바일 최적화 UI
```

### 3.3 템플릿 종류

#### A. 운영현황 템플릿 (`operation`)
환자 입실/시술 기록용

| 필드 | 라벨 | 음성 안내 | 예시 |
|------|------|-----------|------|
| `patientName` | 환자명 | "환자 이름을 말씀해주세요" | "김미영" |
| `room` | 방 번호 | "몇 번 방인지 말씀해주세요" | "3번방" |
| `procedure` | 시술명 | "어떤 시술인지 말씀해주세요" | "울쎄라" |
| `doctor` | 담당 의사 | "담당 의사를 말씀해주세요" | "원장님" |
| `estimatedDuration` | 예상 소요시간 | "몇 분 정도 걸릴지 말씀해주세요" | "40분" |
| `status` | 현재 상태 | "대기, 마취, 시술, 관리 중 하나를 말씀해주세요" | "마취 중" |
| `memo` | 메모 | "추가 참고사항을 말씀해주세요" | "마취크림 도포 완료" |

출력 포맷:
```
[환자] 김미영
[방] 3번방
[시술] 울쎄라
[담당] 원장님
[예상시간] 40분
[상태] 마취 중
[메모] 마취크림 도포 완료
```

#### B. 상담 기록 템플릿 (`consultation`) — 기존 유지
기존 8개 필드 그대로 유지 (환자명/상담유형/주요호소/상담내용/권장시술/예상비용/다음단계/메모)

#### C. 퀵노트 템플릿 (`quickNote`)
빠른 상황 기록용 (3개 필드만)

| 필드 | 라벨 | 음성 안내 |
|------|------|-----------|
| `subject` | 대상 | "누구에 대한 메모인지 말씀해주세요" |
| `content` | 내용 | "내용을 말씀해주세요" |
| `priority` | 긴급도 | "일반, 중요, 긴급 중 하나를 말씀해주세요" |

---

## 4. Phase 2: 운영현황 음성 입력 통합

### 4.1 운영현황 페이지 연동
- 기존 운영현황(operations) 페이지의 "새 케이스 추가" 모달에 음성 입력 옵션 추가
- 음성 입력 완료 시 operation 템플릿 데이터 → 케이스 필드에 자동 매핑:
  - `patientName` → 케이스의 환자명
  - `room` → 케이스의 방 번호
  - `procedure` → 케이스의 시술 유형
  - `doctor` → 케이스의 담당 의사
  - `estimatedDuration` → 케이스의 예상 소요시간
  - `status` → 케이스의 초기 상태
  - `memo` → 케이스의 메모

### 4.2 상태 전이 음성 명령
- 칸반 카드에서 음성 버튼 → "시술 시작", "마취 종료" 등 간단한 음성 명령으로 상태 전환
- 이 기능은 Phase 2에서 별도 판단 (복잡도에 따라 Out of Scope 가능)

---

## 5. Phase 3: 상담관리 음성 입력 강화

### 5.1 기존 통합 개선
- 현재 상담관리 페이지의 VoiceNoteInput이 이미 작동 중
- 템플릿 완료 시 구조화된 데이터 → 상담 필드에 자동 매핑 강화:
  - `patientName` → 상담의 이름 필드
  - `consultType` → 상태 자동 변경 제안
  - `recommended` → procedure_tags 자동 태깅
  - `nextStep` → next_followup_at 설정 제안

### 5.2 타임라인 음성 메모
- 상담 타임라인에 음성으로 메모 추가 기능 강화
- 퀵노트 템플릿으로 빠른 기록 가능

---

## 6. Phase 4: 모바일 전용 음성 퀵노트 페이지

### 6.1 전용 페이지
- URL: `/admin/voice-note` (또는 `/admin/quick-note`)
- 모바일 최적화 레이아웃 (큰 버튼, 터치 친화적)
- 템플릿 선택 → 음성 입력 → 저장 흐름

### 6.2 UI 구성
```
┌─────────────────────────────┐
│  🎤 음성 노트                │
│                              │
│  ┌──────────┐ ┌──────────┐  │
│  │ 운영현황 │ │ 상담기록 │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │ 퀵노트   │ │ 자유입력 │  │
│  └──────────┘ └──────────┘  │
│                              │
│  ┌──────────────────────────┐│
│  │                          ││
│  │    [🎤 큰 마이크 버튼]    ││
│  │                          ││
│  │  "환자 이름을 말씀해주세요" ││
│  │                          ││
│  └──────────────────────────┘│
│                              │
│  진행: ████░░░░ 3/7          │
│                              │
│  [이전] [건너뛰기] [다음]     │
│                              │
│  ┌──────────────────────────┐│
│  │ [환자] 김미영             ││
│  │ [방] 3번방                ││
│  │ [시술] 울쎄라             ││
│  │ ...                      ││
│  └──────────────────────────┘│
│                              │
│  [저장]                       │
└─────────────────────────────┘
```

### 6.3 저장 흐름
- 운영현황 템플릿 → `operation_cases` 테이블에 케이스 생성
- 상담 기록 → `consultation_requests` 테이블에 노트 추가
- 퀵노트 → 새 `voice_notes` 테이블 또는 기존 타임라인에 기록

---

## 7. 데이터베이스 설계

### 신규 테이블 (Phase 4에서 필요시)

```sql
-- 음성 노트 범용 저장 (Phase 4)
CREATE TABLE voice_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL,           -- 'operation' | 'consultation' | 'quickNote'
  structured_data JSONB NOT NULL,        -- 정형화된 데이터
  raw_text TEXT,                         -- 원본 음성 텍스트
  linked_entity_type TEXT,               -- 'operation_case' | 'consultation' | null
  linked_entity_id UUID,                -- 연결된 엔티티 ID
  created_by TEXT,                       -- 작성자
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 기존 테이블 변경 — 없음
- Phase 1~3은 기존 테이블/API를 그대로 사용
- VoiceNoteInput이 구조화된 데이터를 반환하면 기존 API로 저장

---

## 8. 기술 구현 방향

### 8.1 VoiceNoteInput 리팩터링

```typescript
// 새로운 Props 인터페이스
interface VoiceNoteInputProps {
  templateType?: 'consultation' | 'operation' | 'quickNote' | 'free';
  value: string;
  onChange: (value: string) => void;
  onTemplateComplete?: (data: Record<string, string>) => void;
  // 기존 props 유지
  placeholder?: string;
  rows?: number;
  className?: string;
}

// 템플릿 설정 분리
const TEMPLATE_CONFIGS = {
  consultation: { fields: [...], label: '상담 기록' },
  operation: { fields: [...], label: '운영 현황' },
  quickNote: { fields: [...], label: '퀵노트' },
};
```

### 8.2 모바일 최적화
- 터치 타겟 최소 44px (WCAG 기준)
- 큰 마이크 버튼 (80px+)
- 스와이프 제스처로 필드 전환 (선택적)
- PWA 지원으로 홈 화면 추가 가능

---

## 9. 구현 순서 (권장)

```
Phase 1: VoiceNoteInput 다중 템플릿 (2-3시간)
├── 1-1. 템플릿 설정 구조 분리 (TEMPLATE_CONFIGS)
├── 1-2. templateType prop 추가 및 동적 필드 렌더링
├── 1-3. 기존 상담 템플릿 호환성 유지 확인
└── 1-4. 운영현황/퀵노트 템플릿 필드 정의

Phase 2: 운영현황 통합 (2-3시간)
├── 2-1. 운영현황 새 케이스 모달에 음성 입력 탭 추가
├── 2-2. 음성 템플릿 데이터 → 케이스 필드 자동 매핑
└── 2-3. 기존 수동 입력과 음성 입력 전환 UI

Phase 3: 상담관리 강화 (1-2시간)
├── 3-1. 상담 페이지의 기존 VoiceNoteInput을 새 컴포넌트로 교체
├── 3-2. 템플릿 완료 → 상담 필드 자동 채움
└── 3-3. 타임라인 메모에 퀵노트 음성 입력 추가

Phase 4: 모바일 퀵노트 페이지 (3-4시간)
├── 4-1. /admin/voice-note 페이지 생성
├── 4-2. 모바일 최적화 UI
├── 4-3. 템플릿 선택 → 입력 → 저장 플로우
└── 4-4. voice_notes 테이블 및 API (필요시)
```

---

## 10. 리스크 및 고려사항

| 리스크 | 대응 |
|--------|------|
| Web Speech API 브라우저 호환성 | Chrome/Edge 위주 사용, 미지원 시 수동 입력 fallback |
| iOS Safari 제한 | Safari에서는 연속 음성인식 제한 → 필드별 start/stop 방식 |
| 소음 환경 인식률 | 조용한 환경 권장 안내, 수동 수정 가능 |
| 음성 인식 정확도 | 의료 용어 인식률이 낮을 수 있음 → 수동 수정 UI 제공 |
| 직원 학습 곡선 | 직관적 UI + 첫 사용 시 간단한 가이드 표시 |
| 개인정보 | 음성 데이터는 브라우저에서만 처리, 서버 전송 안 함 (STT 텍스트만 저장) |

---

## 11. 성공 지표

| 지표 | 목표 |
|------|------|
| 음성 입력 사용률 | 운영현황 기록의 50%+ 음성 입력 |
| 입력 시간 단축 | 기존 대비 40% 이상 입력 시간 감소 |
| 데이터 일관성 | 정형화된 포맷 사용률 90%+ |
| 직원 만족도 | 모바일 사용 편의성 향상 |
