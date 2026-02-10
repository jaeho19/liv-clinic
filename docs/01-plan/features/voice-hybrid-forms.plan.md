# Voice Hybrid Forms Planning Document

> **Summary**: 관리자 페이지에서 기본정보는 클릭/타이핑, 서술형 내용은 음성인식으로 입력하는 하이브리드 폼 시스템
>
> **Project**: LIV Plastic Surgery Admin
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-02-10
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 음성노트 기능(VoiceNoteInput)이 존재하지만, 모든 필드를 음성으로 순차 입력하는 방식이라 비효율적인 부분이 있다.
**이름, 초진/재진 같은 구조화된 정보는 클릭/타이핑**이 더 빠르고 정확하며,
**증상, 고민, 상담내용 같은 서술형 정보는 음성**이 더 편리하다.

이 기획은 입력 필드 유형에 따라 최적의 입력 방식을 혼합하는 **하이브리드 폼 시스템**과,
**미리 정의한 양식(템플릿)을 선택하면 음성으로 말한 내용이 자동으로 해당 양식에 맞게 정리**되는 기능을 구현한다.

### 1.2 Background

**현재 상태:**
- `VoiceNoteInput.tsx` 컴포넌트: Web Speech API 기반 한국어 STT
- 3개 템플릿 존재: `consultation`(8필드), `operation`(7필드), `quickNote`(3필드)
- 템플릿 모드에서는 필드를 하나씩 순서대로 음성 입력 → 비효율적
- 운영현황, 상담기록, 퀵노트 페이지에서 각각 사용 중

**문제점:**
1. 이름/초진재진 등 간단한 정보도 음성으로 입력해야 하는 불편함
2. 누가 말해도 같은 양식으로 정리되는 "스마트 양식" 부재
3. 각 페이지(운영/상담/퀵노트)별 음성 활용 전략이 불명확
4. 사용자가 직접 양식을 만들 수 없음

### 1.3 Related Documents

- 기존 계획: `docs/01-plan/features/voice-note-system.plan.md`
- 타입 정의: `src/types/voice-templates.ts`
- 컴포넌트: `src/components/admin/VoiceNoteInput.tsx`

---

## 2. Scope

### 2.1 In Scope

- [ ] **하이브리드 폼 컴포넌트**: 같은 폼 내에서 클릭/드롭다운 필드 + 음성입력 필드 혼합
- [ ] **페이지별 음성 활용 전략**: 운영/상담/퀵노트별 어떤 필드에 음성을 쓸지 정의
- [ ] **커스텀 양식 시스템**: 미리 정의한 양식을 선택하면 음성이 해당 틀에 맞게 자동 정리
- [ ] **원클릭 음성 양식**: 양식 버튼 클릭 → 즉시 음성 인식 시작 → 정해진 포맷으로 출력
- [ ] **상담기록 하이브리드 폼**: 기본정보(이름/유형)는 수동, 증상/고민/메모는 음성

### 2.2 Out of Scope

- AI 자연어 분석 (GPT/Claude API 연동으로 자동 분류) — 향후 확장
- 음성 파일 녹음/재생 — 텍스트 변환만
- 다국어 음성 인식 — 한국어 전용 유지
- 외부 STT API 연동 — Web Speech API 유지

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 하이브리드 폼: 한 폼 내에서 수동입력 필드(text/select/radio)와 음성입력 필드를 혼합 | High | Pending |
| FR-02 | 필드별 입력방식 지정: 각 필드마다 `manual`, `voice`, `both` 타입 설정 가능 | High | Pending |
| FR-03 | 음성 양식 원클릭: 양식 카드를 클릭하면 음성 인식이 자동 시작되고 서술형 필드만 순차 안내 | High | Pending |
| FR-04 | 상담기록 하이브리드: 이름/초진재진 → 타이핑/클릭, 주요호소/상담내용/메모 → 음성 | High | Pending |
| FR-05 | 커스텀 양식 정의: 관리자가 양식 이름, 필드 목록, 필드별 입력방식을 정의/저장 | Medium | Pending |
| FR-06 | 양식 선택 UI: 사용 가능한 양식 목록을 카드/버튼 형태로 표시 | Medium | Pending |
| FR-07 | 음성 필드 자동 포커스: 수동 필드 입력 완료 후 음성 필드로 자동 전환 및 안내 | Medium | Pending |
| FR-08 | 양식 결과 미리보기: 음성 입력 완료 후 정형화된 결과를 미리보기 표시 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| UX | 수동→음성 전환이 1초 이내 | 실사용 테스트 |
| Performance | 음성 인식 시작까지 500ms 이내 | 브라우저 성능 측정 |
| Accessibility | 음성 없이도 모든 필드 수동 입력 가능 | 수동 테스트 |
| Mobile | 모바일에서 원클릭 음성 양식 사용 가능 | 실기기 테스트 |

---

## 4. 페이지별 음성 활용 전략

### 4.1 상담기록 (Consultations)

**"상담 내용을 정리할 때 음성이 좋다"**

| 필드 | 입력방식 | 이유 |
|------|----------|------|
| 환자명 | `manual` (텍스트) | 정확한 이름 입력 필요 |
| 상담유형 | `manual` (드롭다운: 초진/재진/시술후관리) | 3개 선택지 → 클릭이 빠름 |
| 담당자 | `manual` (드롭다운) | 고정 옵션 → 클릭 |
| 주요 호소/고민 | **`voice`** | 환자가 말한 내용을 그대로 음성으로 기록 |
| 상담 내용 | **`voice`** | 상담 진행 내용을 자유롭게 음성 기록 |
| 권장 시술 | `both` (드롭다운 + 음성 보충) | 시술명 선택 + 추가 설명은 음성 |
| 예상 비용 | `manual` (텍스트) | 숫자 입력 → 타이핑이 정확 |
| 다음 단계 | `manual` (드롭다운: 예약확정/재연락/검토중) | 고정 옵션 |
| 메모 | **`voice`** | 자유 형식 추가 메모 |

### 4.2 운영현황 (Operations)

**"환자 입실/시술 배정은 대부분 클릭, 특이사항만 음성"**

| 필드 | 입력방식 | 이유 |
|------|----------|------|
| 환자명 | `manual` (텍스트) | 정확한 이름 |
| 방 번호 | `manual` (드롭다운/버튼) | 방 목록에서 선택 |
| 시술명 | `manual` (드롭다운) | 시술 목록에서 선택 |
| 담당 의사 | `manual` (드롭다운) | 의사 목록에서 선택 |
| 예상 소요시간 | `manual` (숫자 입력) | 숫자 → 타이핑 |
| 현재 상태 | `manual` (버튼: 대기/상담/마취/시술) | 4개 선택지 |
| 메모/특이사항 | **`voice`** | "마취크림 도포 완료", "보호자 대기 중" 등 |

### 4.3 퀵노트 (Quick Notes)

**"빠르게 음성으로 전달사항 기록"**

| 필드 | 입력방식 | 이유 |
|------|----------|------|
| 대상(누구) | `both` (드롭다운 + 직접입력) | 직원/환자 선택 또는 음성 |
| 내용 | **`voice`** | 핵심 기능 — 음성으로 빠르게 메모 |
| 긴급도 | `manual` (버튼: 일반/중요/긴급) | 3개 선택지 |

### 4.4 음성 활용 요약

```
┌──────────────────────────────────────────────────────────┐
│              음성이 효과적인 필드 유형                      │
├──────────────────────────────────────────────────────────┤
│  ✅ 음성 추천     │  환자 호소, 상담 내용, 메모, 특이사항    │
│                   │  → 서술형, 자유형식, 실시간 기록         │
├───────────────────┼──────────────────────────────────────┤
│  ❌ 수동 추천     │  이름, 방번호, 시술명, 의사, 비용, 상태  │
│                   │  → 고정 옵션, 정확한 값, 숫자           │
├───────────────────┼──────────────────────────────────────┤
│  🔄 둘 다 가능    │  권장 시술 (선택+보충), 대상(선택+직접)  │
│                   │  → 기본값 선택 후 음성으로 상세 추가     │
└───────────────────┴──────────────────────────────────────┘
```

---

## 5. 커스텀 양식(Smart Form) 시스템

### 5.1 양식 선택 흐름

```
양식 목록 화면
┌───────────────────────────────────────────┐
│  📋 양식 선택                              │
│                                            │
│  ┌────────────┐  ┌────────────┐           │
│  │ 🩺 초진상담 │  │ 🔄 재진상담 │           │
│  │ 기본+음성   │  │ 간소화     │           │
│  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐           │
│  │ 💉 시술기록 │  │ 📝 퀵메모  │           │
│  │ 배정 중심   │  │ 음성 전용   │           │
│  └────────────┘  └────────────┘           │
│  ┌────────────┐                            │
│  │ ➕ 새 양식  │                            │
│  │ 만들기      │                            │
│  └────────────┘                            │
└───────────────────────────────────────────┘
```

### 5.2 양식 클릭 후 하이브리드 입력 흐름

```
"초진상담" 양식 선택 시:
┌───────────────────────────────────────────┐
│  🩺 초진 상담 기록                          │
│                                            │
│  ── 기본 정보 (수동 입력) ──                 │
│  환자명: [__김미영__________]               │
│  상담유형: (●) 초진  ( ) 재진  ( ) 시술후   │
│  담당자: [▾ 김수영 원장]                    │
│                                            │
│  ── 상담 내용 (음성 입력) ──                 │
│  ┌──────────────────────────────────┐      │
│  │  🎤 음성 입력 시작                │      │
│  │  "주요 호소를 말씀해주세요"        │      │
│  │                                   │      │
│  │  이마 주름이 신경 쓰이시고         │      │
│  │  팔자 주름도 개선하고 싶으시대요... │      │
│  │  ░░░░░ (인식 중...)               │      │
│  └──────────────────────────────────┘      │
│  진행: ████████░░ 1/3 (호소→상담→메모)      │
│                                            │
│  ── 마무리 (수동 입력) ──                    │
│  권장시술: [▾ 울쎄라] + [▾ 보톡스]          │
│  예상비용: [__350만원________]               │
│  다음단계: (●) 예약확정  ( ) 재연락          │
│                                            │
│  [미리보기]  [저장]                          │
└───────────────────────────────────────────┘
```

### 5.3 기본 제공 양식 (Built-in)

| 양식 ID | 양식명 | 수동 필드 | 음성 필드 | 사용처 |
|---------|--------|-----------|-----------|--------|
| `first-visit` | 초진 상담 | 환자명, 상담유형, 담당자, 권장시술, 비용, 다음단계 | 주요호소, 상담내용, 메모 | 상담기록 |
| `follow-up` | 재진 상담 | 환자명(자동완성), 담당자 | 경과, 추가 요청, 메모 | 상담기록 |
| `procedure-assign` | 시술 배정 | 환자명, 방, 시술, 의사, 시간, 상태 | 메모 | 운영현황 |
| `quick-memo` | 빠른 메모 | 대상(선택), 긴급도 | 내용 | 퀵노트 |
| `post-procedure` | 시술 후 기록 | 환자명, 시술명, 담당의사 | 시술경과, 주의사항, 메모 | 상담기록 |

### 5.4 커스텀 양식 생성

관리자가 "새 양식 만들기"에서:
1. 양식 이름, 설명 입력
2. 필드 추가: 필드명 + 입력방식(`manual`/`voice`/`both`) + 필드타입(text/select/radio)
3. `select` 타입 시 옵션 목록 정의
4. 필드 순서 드래그로 조정
5. 저장 → DB `form_templates` 테이블 또는 `clinic_settings`에 JSON 저장

---

## 6. 구현 계획

### Phase 1: 하이브리드 폼 인프라 (핵심)

```
1-1. HybridFormField 컴포넌트 생성
     - inputMethod: 'manual' | 'voice' | 'both'
     - manual 렌더링: text/select/radio/number
     - voice 렌더링: 기존 VoiceNoteInput 활용 (단일필드 모드)
     - both 렌더링: manual + 음성 보조 버튼

1-2. HybridForm 컴포넌트 생성
     - formConfig: 필드 배열 (각 필드에 inputMethod 포함)
     - 수동 필드 → 음성 필드 자동 전환 로직
     - 음성 필드 순차 안내 (기존 template mode 확장)
     - 폼 결과 수집 및 콜백

1-3. 양식 타입 정의
     - FormTemplate 인터페이스 확장
     - 기본 제공 양식 5개 상수 정의
```

### Phase 2: 상담기록 하이브리드 적용

```
2-1. 상담기록 페이지에 HybridForm 통합
     - 기존 메모 편집 → 양식 선택 + 하이브리드 입력으로 확장
     - 양식 선택 모달/드로어 UI

2-2. 음성 필드 자동 포커스
     - 수동 필드 작성 완료 → "주요 호소를 말씀해주세요" 자동 안내
     - 음성 입력 완료 → 다음 음성 필드 자동 이동

2-3. 결과 미리보기 및 저장
     - 정형화된 결과 텍스트 미리보기
     - consultation_requests.notes에 저장
```

### Phase 3: 운영현황/퀵노트 적용

```
3-1. 운영현황 AddCaseModal 하이브리드 전환
     - 기존: 수동 탭 / 음성 탭 분리
     - 변경: 하이브리드 폼 1개 (대부분 수동, 메모만 음성)

3-2. 퀵노트 하이브리드 전환
     - 대상: 드롭다운 선택
     - 내용: 음성 입력 (핵심)
     - 긴급도: 버튼 선택

3-3. 음성노트 전용 페이지 업데이트
     - 기존 template 선택 → 양식(Smart Form) 선택으로 전환
     - 양식 카드 클릭 → 하이브리드 입력 시작
```

### Phase 4: 커스텀 양식 관리 (선택적)

```
4-1. 양식 관리 UI
     - /admin/settings/forms 또는 설정 내 양식 관리 섹션
     - 양식 CRUD (이름, 설명, 필드 목록)

4-2. 양식 저장
     - clinic_settings 테이블에 JSON 형태로 저장
     - 또는 form_templates 전용 테이블 생성

4-3. 양식 공유
     - 모든 직원이 동일한 양식 사용 가능
     - 양식별 사용 통계 (선택적)
```

---

## 7. 데이터 모델

### 7.1 FormTemplate 확장 타입

```typescript
interface HybridFormField {
  key: string;
  label: string;
  inputMethod: 'manual' | 'voice' | 'both';
  fieldType: 'text' | 'select' | 'radio' | 'number' | 'textarea';
  options?: string[];        // select/radio 옵션
  placeholder?: string;
  voicePrompt?: string;      // 음성 안내 문구
  required?: boolean;
}

interface SmartFormTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;             // 양식 카드 아이콘
  category: 'consultation' | 'operation' | 'quickNote' | 'custom';
  fields: HybridFormField[];
  isBuiltin: boolean;        // 기본 제공 vs 사용자 정의
  createdAt?: string;
}
```

### 7.2 DB 변경 (Phase 4에서만 필요)

```sql
-- 커스텀 양식 저장 (Phase 4)
-- 옵션 A: clinic_settings 활용 (간단)
-- settings_key = 'custom_form_templates'
-- settings_value = JSON 배열

-- 옵션 B: 전용 테이블 (확장성)
CREATE TABLE form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Success Criteria

### 8.1 Definition of Done

- [ ] 하이브리드 폼 컴포넌트가 수동+음성 필드를 한 폼에서 지원
- [ ] 상담기록에서 이름/유형은 클릭, 호소/내용은 음성으로 입력 가능
- [ ] 양식 카드 클릭 → 즉시 하이브리드 입력 시작
- [ ] 운영현황/퀵노트에도 하이브리드 폼 적용
- [ ] 음성 필드 자동 전환 및 안내 동작
- [ ] 기존 VoiceNoteInput 하위 호환성 유지

### 8.2 Quality Criteria

- [ ] 모바일에서 원클릭 양식 진입 가능
- [ ] 음성 없이도 모든 필드 수동 입력 가능 (fallback)
- [ ] 빌드 성공, 린트 에러 없음

---

## 9. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 기존 VoiceNoteInput과 하이브리드 폼 충돌 | Medium | Medium | 기존 컴포넌트를 래핑하여 확장, 기존 사용처 하위 호환 유지 |
| 수동→음성 전환 UX가 어색할 수 있음 | Medium | Medium | 명확한 시각적 구분 + 자동 전환 애니메이션 |
| 커스텀 양식 복잡도 | Low | Medium | Phase 4로 분리, 기본 양식 5개로 충분히 커버 |
| iOS Safari 음성 인식 제한 | Medium | High | 필드별 start/stop 방식, 수동 입력 fallback |
| 직원 학습 곡선 | Low | Medium | 첫 사용 시 간단한 가이드 토스트 표시 |

---

## 10. Architecture Considerations

### 10.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation | Complex architectures | ☐ |

### 10.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 컴포넌트 구조 | VoiceNoteInput 수정 / 새 HybridForm 컴포넌트 | 새 HybridForm + 기존 VoiceNoteInput 재활용 | 기존 사용처 영향 최소화 |
| 양식 저장 | clinic_settings JSON / 전용 테이블 | clinic_settings JSON (Phase 1~3) | 추가 마이그레이션 불필요 |
| 수동/음성 전환 | 탭 분리 / 인라인 혼합 | 인라인 혼합 | 자연스러운 흐름 |
| 상태관리 | React state / useReducer | useReducer | 다수 필드 상태 관리에 적합 |

### 10.3 컴포넌트 구조

```
src/components/admin/
├── VoiceNoteInput.tsx          # 기존 유지 (하위 호환)
├── hybrid-form/
│   ├── HybridForm.tsx          # 메인 하이브리드 폼 컴포넌트
│   ├── HybridFormField.tsx     # 개별 필드 (manual/voice/both 렌더링)
│   ├── FormTemplateSelector.tsx # 양식 선택 카드 UI
│   └── FormPreview.tsx         # 입력 결과 미리보기
├── voice-templates.ts → src/types/voice-templates.ts  # 기존 유지
└── smart-forms.ts → src/types/smart-forms.ts          # 새 타입 정의
```

---

## 11. Convention Prerequisites

### 11.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS styling

### 11.2 Environment Variables Needed

추가 환경변수 없음 — 기존 Supabase 설정 사용

---

## 12. Next Steps

1. [ ] Design 문서 작성 (`voice-hybrid-forms.design.md`)
2. [ ] Phase 1: HybridForm 컴포넌트 구현
3. [ ] Phase 2: 상담기록 페이지 적용
4. [ ] Phase 3: 운영현황/퀵노트 적용
5. [ ] Phase 4: 커스텀 양식 관리 (선택적)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-10 | Initial draft | Claude |
