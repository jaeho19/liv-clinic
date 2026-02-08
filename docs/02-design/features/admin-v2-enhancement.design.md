# Design: LIV Admin V2 기능 강화

> **Feature**: admin-v2-enhancement
> **Created**: 2026-02-08
> **Status**: Draft
> **PDCA Phase**: Design
> **Plan Reference**: [admin-v2-enhancement.plan.md](../../01-plan/features/admin-v2-enhancement.plan.md)

---

## 1. 아키텍처 개요

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js App Router                        │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Admin Pages │  │  Components  │  │    API Routes         │ │
│  │  (RSC/CC)  │──│   (CC)       │──│  /api/admin/*         │ │
│  └─────┬──────┘  └──────────────┘  └──────────┬───────────┘ │
│        │                                       │             │
│  ┌─────┴───────────────────────────────────────┴──────────┐ │
│  │              Supabase Client Layer                      │ │
│  │  supabase-browser.ts │ supabase-server.ts              │ │
│  │  supabase-admin.ts (service role)                      │ │
│  └──────────┬────────────────────────────┬────────────────┘ │
│             │                            │                   │
│  ┌──────────┴──────────┐   ┌─────────────┴───────────────┐ │
│  │ Supabase Realtime   │   │   Vercel Cron               │ │
│  │ (consultation       │   │   /api/cron/send-            │ │
│  │  changes channel)   │   │    notifications             │ │
│  └─────────────────────┘   └──────────────┬──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                    ┌────────┴────────┐
                                    │   Solapi API    │
                                    │  (카카오 알림톡  │
                                    │   + SMS 폴백)   │
                                    └─────────────────┘
```

### 코드 패턴 (기존 준수)

| 패턴 | 위치 | 설명 |
|------|------|------|
| 페이지 | `src/app/admin/(authenticated)/[feature]/page.tsx` | Server/Client Component |
| API | `src/app/api/admin/[feature]/route.ts` | Route Handler |
| 크론 API | `src/app/api/cron/[job]/route.ts` | Vercel Cron 전용 |
| 컴포넌트 | `src/components/admin/[Component].tsx` | 재사용 컴포넌트 |
| 타입 | `src/types/admin.ts` | 타입 정의 |
| DB 타입 | `src/types/supabase.ts` | Supabase 자동생성 기반 |
| 인증 | `createServerClient()` → `getSession()` | API route 진입점 |
| DB 조작 | `createAdminClient()` (service role) | Server-side only |
| 클라이언트 조회 | `createClient()` (browser) | RLS 적용 |

---

## 2. 데이터베이스 상세 설계

### 2.1 마이그레이션: `011_treatment_cycle_notification.sql`

```sql
-- treatment_masters에 시술별 기본 알림 주기 추가
ALTER TABLE treatment_masters
  ADD COLUMN IF NOT EXISTS default_cycle_days INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_template_id UUID REFERENCES notification_templates(id);

COMMENT ON COLUMN treatment_masters.default_cycle_days IS '시술별 기본 재방문 알림 주기 (일 수)';
COMMENT ON COLUMN treatment_masters.notification_template_id IS '시술별 기본 알림 템플릿 FK';

-- 시술별 기본 주기 시드 데이터
UPDATE treatment_masters SET default_cycle_days = 90
  WHERE name IN ('울쎄라', '보톡스');
UPDATE treatment_masters SET default_cycle_days = 180
  WHERE name IN ('써마지 FLX', '필러');
UPDATE treatment_masters SET default_cycle_days = 30
  WHERE name IN ('스킨부스터', '피코레이저');

-- notification_history에 발송 결과 상세 필드 추가
ALTER TABLE notification_history
  ADD COLUMN IF NOT EXISTS solapi_message_id TEXT,
  ADD COLUMN IF NOT EXISTS solapi_status TEXT,
  ADD COLUMN IF NOT EXISTS fallback_channel TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN notification_history.solapi_message_id IS 'Solapi API 응답 메시지 ID';
COMMENT ON COLUMN notification_history.solapi_status IS 'Solapi 발송 결과 상태';
COMMENT ON COLUMN notification_history.fallback_channel IS '폴백 채널 (kakao 실패 시 sms)';

-- 자동 발송 대상 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_patient_treatments_pending_notification
  ON patient_treatments (next_notification_at)
  WHERE notification_sent = false AND next_notification_at IS NOT NULL;

-- patient_treatments에 자동/수동 구분 필드
ALTER TABLE patient_treatments
  ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT true;

COMMENT ON COLUMN patient_treatments.auto_send IS 'true=자동발송 대상, false=수동만';
```

### 2.2 마이그레이션: `012_consultation_timeline.sql`

```sql
-- 상담 이력 타임라인 테이블
CREATE TABLE IF NOT EXISTS consultation_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE consultation_timeline IS '상담 상태 변경/메모 이력 타임라인';

-- event_type 값: status_change, note_added, callback_set, assigned, call_made, tag_added, budget_updated

CREATE INDEX IF NOT EXISTS idx_consultation_timeline_consultation_id
  ON consultation_timeline (consultation_id);

CREATE INDEX IF NOT EXISTS idx_consultation_timeline_created_at
  ON consultation_timeline (created_at DESC);

-- Supabase Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_timeline;
```

### 2.3 마이그레이션: `013_revenue_import.sql`

```sql
-- operation_cases에 CSV 임포트 추적 필드 추가
ALTER TABLE operation_cases
  ADD COLUMN IF NOT EXISTS import_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual';

COMMENT ON COLUMN operation_cases.import_batch_id IS 'CSV 일괄 업로드 배치 ID';
COMMENT ON COLUMN operation_cases.import_source IS '데이터 소스: manual | csv_import';

-- 중복 체크용 인덱스 (날짜+환자명+시술명)
CREATE INDEX IF NOT EXISTS idx_operation_cases_dedup
  ON operation_cases (created_at, patient_name, procedure_name);

-- CSV 매핑 설정 저장 (clinic_settings에 JSON으로)
-- clinic_settings.csv_column_mapping JSONB 필드 추가
ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS csv_column_mapping JSONB DEFAULT '{}';

COMMENT ON COLUMN clinic_settings.csv_column_mapping IS 'CRM CSV 컬럼 매핑 설정';
```

### 2.4 supabase.ts 타입 업데이트 (추가 필요 필드)

```typescript
// treatment_masters에 추가
treatment_masters: {
  Row: {
    // ... 기존 필드
    default_cycle_days: number | null      // NEW
    notification_template_id: string | null // NEW
  }
  Insert: {
    // ... 기존 필드
    default_cycle_days?: number | null
    notification_template_id?: string | null
  }
  Update: {
    // ... 기존 필드
    default_cycle_days?: number | null
    notification_template_id?: string | null
  }
}

// notification_history에 추가
notification_history: {
  Row: {
    // ... 기존 필드
    solapi_message_id: string | null   // NEW
    solapi_status: string | null       // NEW
    fallback_channel: string | null    // NEW
    error_message: string | null       // NEW
  }
}

// patient_treatments에 추가
patient_treatments: {
  Row: {
    // ... 기존 필드
    auto_send: boolean                 // NEW
  }
}

// operation_cases에 추가
operation_cases: {
  Row: {
    // ... 기존 필드
    import_batch_id: string | null     // NEW
    import_source: string              // NEW
  }
}

// clinic_settings에 추가
clinic_settings: {
  Row: {
    // ... 기존 필드
    csv_column_mapping: Json           // NEW
  }
}

// 새 테이블 추가
consultation_timeline: {
  Row: {
    id: string
    consultation_id: string
    event_type: string
    description: string
    actor: string | null
    old_value: string | null
    new_value: string | null
    metadata: Json
    created_at: string
  }
  Insert: {
    id?: string
    consultation_id: string
    event_type: string
    description: string
    actor?: string | null
    old_value?: string | null
    new_value?: string | null
    metadata?: Json
    created_at?: string
  }
  Update: {
    id?: string
    consultation_id?: string
    event_type?: string
    description?: string
    actor?: string | null
    old_value?: string | null
    new_value?: string | null
    metadata?: Json
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'consultation_timeline_consultation_id_fkey'
      columns: ['consultation_id']
      referencedRelation: 'consultation_requests'
      referencedColumns: ['id']
    }
  ]
}
```

---

## 3. Phase 1: 시술 주기 자동 알림 시스템

### 3.1 API 설계

#### 3.1.1 `POST /api/admin/notifications/send` — 실제 발송

**Request**:
```typescript
interface NotificationSendRequest {
  patient_treatment_id: string;
  channel: 'kakao' | 'sms';     // 1차 발송 채널
  template_id?: string;          // notification_templates.id
  sent_by: string;               // 발송자 이름
}
```

**Response (성공)**:
```json
{
  "success": true,
  "messageId": "solapi-msg-xxxxx",
  "channel": "kakao",
  "fallbackUsed": false
}
```

**Response (카카오 실패 → SMS 폴백)**:
```json
{
  "success": true,
  "messageId": "solapi-msg-yyyyy",
  "channel": "sms",
  "fallbackUsed": true,
  "originalError": "카카오 알림톡 수신 거부"
}
```

**Response (전체 실패)**:
```json
{
  "success": false,
  "error": "발송 실패: 수신번호 오류",
  "channel": "kakao"
}
```

**처리 흐름**:
```
1. session 체크 (createServerClient)
2. patient_treatment_id로 환자 정보 조회 (phone, treatment_name 등)
3. template_id로 메시지 템플릿 조회 (또는 기본 메시지 생성)
4. Solapi API 호출: 카카오 알림톡 우선
   4a. 성공 → notification_history INSERT (status='sent', channel='kakao')
   4b. 실패 → SMS 폴백 시도
       4b-1. SMS 성공 → notification_history INSERT (status='sent', fallback_channel='sms')
       4b-2. SMS 실패 → notification_history INSERT (status='failed', error_message)
5. 성공 시: patient_treatments.notification_sent = true 업데이트
6. 결과 반환
```

#### 3.1.2 `GET /api/cron/send-notifications` — 자동 발송 크론

**인증**: Vercel Cron 전용 (CRON_SECRET 검증)

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "0 0 * * *"  // 매일 UTC 00:00 = KST 09:00
  }]
}
```

**처리 흐름**:
```
1. CRON_SECRET 헤더 검증
2. patient_treatments에서 조건 조회:
   - next_notification_at <= NOW()
   - notification_sent = false
   - auto_send = true
3. 각 건에 대해:
   a. 연결된 treatment_masters에서 notification_template_id 조회
   b. 해당 템플릿으로 Solapi API 호출 (카카오 → SMS 폴백)
   c. notification_history에 결과 기록
   d. 성공 시: notification_sent = true
   e. 다음 주기 계산: next_notification_at = NOW() + notification_cycle_days
      (반복 알림이 아닌 경우: notification_sent = true로 종료)
4. 결과 요약 반환: { total, sent, failed }
```

#### 3.1.3 `PATCH /api/admin/settings/treatments/[id]` — 시술 주기 설정

**Request**:
```typescript
interface TreatmentCycleUpdateRequest {
  default_cycle_days?: number | null;
  notification_template_id?: string | null;
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "울쎄라",
  "category": "lifting",
  "default_cycle_days": 90,
  "notification_template_id": "uuid-or-null"
}
```

### 3.2 Solapi 연동 모듈

#### 파일: `src/lib/solapi.ts`

```typescript
import SolapiMessageService from 'solapi';

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

interface SendResult {
  success: boolean;
  messageId?: string;
  channel: 'kakao' | 'sms';
  fallbackUsed: boolean;
  error?: string;
}

/**
 * 카카오 알림톡 발송 (실패 시 SMS 폴백)
 */
export async function sendNotification(params: {
  to: string;           // 수신자 전화번호
  templateId: string;   // 카카오 알림톡 템플릿 ID
  variables: Record<string, string>;  // 템플릿 변수
  smsMessage: string;   // SMS 폴백 메시지
}): Promise<SendResult> {
  const { to, templateId, variables, smsMessage } = params;
  const from = process.env.SOLAPI_SENDER_NUMBER!;
  const pfId = process.env.KAKAO_PFID!;

  try {
    // 1차: 카카오 알림톡
    const result = await messageService.send({
      to,
      from,
      kakaoOptions: {
        pfId,
        templateId,
        variables,
      },
    });
    return {
      success: true,
      messageId: result.groupId,
      channel: 'kakao',
      fallbackUsed: false,
    };
  } catch {
    // 2차: SMS 폴백
    try {
      const smsResult = await messageService.send({
        to,
        from,
        text: smsMessage,
      });
      return {
        success: true,
        messageId: smsResult.groupId,
        channel: 'sms',
        fallbackUsed: true,
      };
    } catch (smsError) {
      return {
        success: false,
        channel: 'sms',
        fallbackUsed: true,
        error: smsError instanceof Error ? smsError.message : 'SMS 발송 실패',
      };
    }
  }
}

/**
 * 메시지 템플릿 변수 치환
 */
export function buildMessageFromTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
}
```

### 3.3 환경변수

```env
# Solapi (카카오 알림톡 + SMS)
SOLAPI_API_KEY=xxx
SOLAPI_API_SECRET=xxx
SOLAPI_SENDER_NUMBER=02-xxxx-xxxx

# 카카오 비즈니스 채널
KAKAO_PFID=@리브성형외과

# Vercel Cron 인증
CRON_SECRET=xxx
```

### 3.4 UI 변경사항

#### 설정 페이지 (시술 관리 탭) — 주기 컬럼 추가

기존 `settings/page.tsx` 시술 관리 테이블에 컬럼 추가:

| 시술명 | 카테고리 | 가격대 | 소요시간 | **기본 알림 주기** | **알림 템플릿** | 상태 | 액션 |
|--------|----------|--------|----------|-------------------|----------------|------|------|

- "기본 알림 주기" 컬럼: 인라인 number input (일 수) + "일" 라벨
- "알림 템플릿" 컬럼: select dropdown (notification_templates에서 조회)
- 저장: `PATCH /api/admin/settings/treatments/[id]`

#### 알림관리 페이지 — 자동/수동 구분 + 실제 발송

기존 `notifications/page.tsx` 변경사항:

1. **발송 대상 목록에 "자동/수동" 배지 표시**
   - `auto_send = true` → 파란색 배지 "자동"
   - `auto_send = false` → 회색 배지 "수동"

2. **"발송 처리" 버튼 → "실제 발송" 버튼으로 변경**
   - 기존: DB notification_history에 기록만
   - 변경: `POST /api/admin/notifications/send` 호출 → Solapi API → DB 기록
   - 발송 결과 토스트: "카카오 알림톡 발송 완료" / "SMS 폴백 발송" / "발송 실패"

3. **발송 이력에 결과 상세 표시**
   - 채널: 카카오 / SMS / 폴백SMS
   - Solapi 상태: 성공 / 실패 + 에러 메시지

### 3.5 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/lib/solapi.ts` | **NEW** | Solapi SDK 래퍼 |
| `src/app/api/admin/notifications/send/route.ts` | **NEW** | 실제 발송 API |
| `src/app/api/cron/send-notifications/route.ts` | **NEW** | 자동 발송 크론 |
| `src/app/api/admin/settings/treatments/[id]/route.ts` | **NEW** | 개별 시술 PATCH |
| `src/app/admin/(authenticated)/notifications/page.tsx` | MODIFY | 실제 발송 + 자동/수동 배지 |
| `src/app/admin/(authenticated)/settings/page.tsx` | MODIFY | 시술 주기/템플릿 컬럼 |
| `src/types/supabase.ts` | MODIFY | 새 필드 타입 추가 |
| `src/types/admin.ts` | MODIFY | TreatmentMaster 인터페이스 확장 |
| `vercel.json` | **NEW** or MODIFY | 크론 설정 |
| `supabase/migrations/011_treatment_cycle_notification.sql` | **NEW** | DB 마이그레이션 |

---

## 4. Phase 2: 매출 CSV 업로드 및 리포트 연동

### 4.1 API 설계

#### 4.1.1 `POST /api/admin/revenue/import` — CSV 일괄 임포트

**Request**:
```typescript
interface CsvImportRequest {
  rows: CsvRow[];
  mappings: CsvColumnMapping;
  skipDuplicates: boolean;  // true면 중복 건 스킵, false면 에러
}

interface CsvRow {
  [key: string]: string;  // CRM CSV의 원본 컬럼명 → 값
}

interface CsvColumnMapping {
  date: string;           // "날짜" or "Date" 등 CRM 컬럼명
  patientName: string;    // "환자명"
  procedureName: string;  // "시술명"
  category?: string;      // "카테고리"
  doctor: string;         // "담당의"
  priceKrw: string;       // "금액"
  discountKrw?: string;   // "할인"
  paymentMethod?: string; // "결제수단"
  paymentStatus?: string; // "결제상태"
}
```

**Response**:
```json
{
  "imported": 45,
  "skipped": 3,
  "errors": [
    { "row": 7, "field": "priceKrw", "message": "숫자가 아님: 'abc'" },
    { "row": 12, "field": "date", "message": "날짜 형식 오류: '2026/13/01'" }
  ],
  "batchId": "import-20260208-143000"
}
```

**처리 흐름**:
```
1. session 체크
2. mappings 기반으로 각 row를 operation_cases 형식으로 변환
   - date → created_at (ISO format 변환, KST timezone)
   - patientName → patient_name
   - procedureName → procedure_name
   - priceKrw → price_krw (숫자 변환, 쉼표 제거)
   - discountKrw → discount_krw
   - paymentMethod → payment_method (매핑: '카드'→'CARD', '현금'→'CASH', '이체'→'TRANSFER')
   - paymentStatus → payment_status (매핑: '완료'→'COMPLETED', '미결제'→'PENDING')
3. 각 row 검증:
   - 필수: date, patientName, procedureName, doctor, priceKrw
   - priceKrw: 양수 숫자
   - date: 유효한 날짜
4. 중복 체크: 동일 (date, patient_name, procedure_name) 조합
   - skipDuplicates=true: 스킵 + skipped 카운트
   - skipDuplicates=false: 에러 반환
5. 일괄 INSERT (import_batch_id, import_source='csv_import' 설정)
6. 결과 반환
```

#### 4.1.2 `GET /api/admin/revenue/mapping` — 매핑 설정 조회

**Response**:
```json
{
  "mapping": {
    "date": "날짜",
    "patientName": "환자명",
    "procedureName": "시술명",
    "doctor": "담당의",
    "priceKrw": "금액",
    "discountKrw": "할인",
    "paymentMethod": "결제수단",
    "paymentStatus": "결제상태"
  }
}
```

#### 4.1.3 `PUT /api/admin/revenue/mapping` — 매핑 설정 저장

**Request**:
```json
{
  "mapping": { "date": "날짜", "patientName": "환자명", ... }
}
```

저장 위치: `clinic_settings.csv_column_mapping`

### 4.2 UI 설계

#### CsvUploadModal 컴포넌트

```
┌─────────────────────────────────────────────────┐
│  CSV 매출 데이터 업로드                    [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Step 1: 파일 선택                              │
│  ┌─────────────────────────────────────────┐   │
│  │  📁 CSV 파일을 드래그하거나 클릭하세요  │   │
│  │     (UTF-8, EUC-KR 자동 감지)          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Step 2: 컬럼 매핑                              │
│  ┌──────────────┬──────────────────────────┐   │
│  │ LIV 필드     │ CSV 컬럼 (드롭다운)     │   │
│  ├──────────────┼──────────────────────────┤   │
│  │ 날짜 *       │ [날짜           ▾]      │   │
│  │ 환자명 *     │ [환자명         ▾]      │   │
│  │ 시술명 *     │ [시술명         ▾]      │   │
│  │ 담당의 *     │ [담당의         ▾]      │   │
│  │ 금액 *       │ [금액           ▾]      │   │
│  │ 할인         │ [할인           ▾]      │   │
│  │ 결제수단     │ [결제수단       ▾]      │   │
│  │ 결제상태     │ [결제상태       ▾]      │   │
│  └──────────────┴──────────────────────────┘   │
│  [✓ 이 매핑을 기본값으로 저장]                  │
│                                                 │
│  Step 3: 미리보기 (처음 5행)                    │
│  ┌─────────────────────────────────────────┐   │
│  │ 날짜       환자명  시술명   금액   상태 │   │
│  │ 2/1  김OO  울쎄라  3,500,000  완료     │   │
│  │ 2/1  이OO  보톡스    300,000  완료     │   │
│  │ ...                                     │   │
│  └─────────────────────────────────────────┘   │
│  총 48행 | 예상 매출 합계: ₩42,300,000         │
│                                                 │
│  [✓ 중복 건 자동 스킵]                          │
│                                                 │
│  [취소]                  [업로드 확인 (48건)]   │
└─────────────────────────────────────────────────┘
```

**상태 관리**:
```typescript
type UploadStep = 'select' | 'mapping' | 'preview' | 'uploading' | 'result';

interface CsvUploadState {
  step: UploadStep;
  file: File | null;
  parsedRows: Record<string, string>[];
  csvColumns: string[];           // CSV 파일의 컬럼명 목록
  mappings: CsvColumnMapping;
  saveMappingAsDefault: boolean;
  skipDuplicates: boolean;
  result: ImportResult | null;
}
```

**위치**: 매출관리 페이지 (`revenue/page.tsx`) 상단에 "CSV 업로드" 버튼 추가
- 기존 기간 필터 옆에 배치

### 4.3 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/components/admin/CsvUploadModal.tsx` | **NEW** | CSV 업로드 모달 (3단계) |
| `src/app/api/admin/revenue/import/route.ts` | **NEW** | CSV 임포트 API |
| `src/app/api/admin/revenue/mapping/route.ts` | **NEW** | 매핑 설정 CRUD |
| `src/app/admin/(authenticated)/revenue/page.tsx` | MODIFY | 업로드 버튼 추가 |
| `src/types/supabase.ts` | MODIFY | operation_cases, clinic_settings 필드 추가 |
| `supabase/migrations/013_revenue_import.sql` | **NEW** | DB 마이그레이션 |

### 4.4 패키지 의존성

```bash
npm install papaparse
npm install -D @types/papaparse
```

- `papaparse`: CSV 파싱 (클라이언트 사이드, 브라우저에서 실행)
- 인코딩 감지: Papa Parse의 `encoding` 옵션으로 EUC-KR/UTF-8 자동 처리

---

## 5. Phase 3: 상담관리 실시간 알림 연동

### 5.1 Supabase Realtime 구독

#### 파일: `src/hooks/useConsultationRealtime.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';

interface RealtimeCallbacks {
  onInsert: (row: ConsultationRow) => void;
  onUpdate: (row: ConsultationRow) => void;
  onDelete: (id: string) => void;
}

export function useConsultationRealtime(callbacks: RealtimeCallbacks) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('consultation_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacks.onInsert(payload.new as ConsultationRow)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacks.onUpdate(payload.new as ConsultationRow)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'consultation_requests' },
        (payload) => callbacks.onDelete(payload.old.id)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);
}
```

### 5.2 브라우저 알림 시스템

#### 파일: `src/hooks/useBrowserNotification.ts`

```typescript
export function useBrowserNotification() {
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  };

  return { requestPermission, showNotification };
}
```

### 5.3 콜백 알림 체커

#### 파일: `src/hooks/useCallbackChecker.ts`

```typescript
export function useCallbackChecker(
  consultations: ConsultationRow[],
  onCallbackDue: (consultation: ConsultationRow) => void
) {
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      consultations
        .filter((c) =>
          c.status === 'callback_scheduled' &&
          c.next_followup_at &&
          new Date(c.next_followup_at) <= now
        )
        .forEach(onCallbackDue);
    }, 60_000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [consultations]);
}
```

### 5.4 상담 타임라인 API

#### `GET /api/admin/consultations/[id]/timeline`

**Response**:
```json
{
  "timeline": [
    {
      "id": "uuid",
      "eventType": "status_change",
      "description": "신규 → 콜백 예정",
      "actor": "김수정",
      "oldValue": "new",
      "newValue": "callback_scheduled",
      "createdAt": "2026-02-08T10:30:00+09:00"
    },
    {
      "id": "uuid",
      "eventType": "note_added",
      "description": "통화 메모: 울쎄라 관심, 2월 중 방문 희망",
      "actor": "김수정",
      "createdAt": "2026-02-08T10:31:00+09:00"
    }
  ]
}
```

#### `POST /api/admin/consultations/[id]/timeline`

**Request**:
```json
{
  "eventType": "note_added",
  "description": "통화 메모: 보톡스 가격 문의",
  "actor": "김지연"
}
```

### 5.5 상담관리 페이지 변경

기존 `consultations/page.tsx`에 추가할 사항:

1. **Realtime 구독**: `useConsultationRealtime` 훅으로 목록 자동 갱신
2. **브라우저 알림**: 새 상담 접수 시 "새 상담: [환자명] - [시술]" 알림
3. **콜백 알림**: 예정 시간 도래 시 "콜백 알림: [환자명] [시간]" 토스트
4. **타임라인 패널**: 상담 행 클릭/확장 시 우측 또는 하단에 타임라인 표시
5. **자동 타임라인 기록**: 상태 변경, 메모 수정, 담당자 배정 시 자동 POST

```
┌──────────────────────────────────────────────────────────────┐
│ 상담관리                               [🔔 알림 ON] [검색]  │
├──────────────────────────────────────────────────────────────┤
│ [전체] [신규 3] [콜백예정 2] [부재중] [예약확정] [완료]      │
├──────────────────────────────────────────────────────────────┤
│ □ 김OO  울쎄라  신규     김수정  2/8 10:00  ▼              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 📋 상담 타임라인                                     │    │
│ │                                                      │    │
│ │ 2/8 10:30  상태변경: 신규 → 콜백 예정  (김수정)     │    │
│ │ 2/8 10:31  메모: 울쎄라 관심, 2월 중 방문 희망      │    │
│ │ 2/8 09:00  접수됨 (웹사이트)                        │    │
│ └──────────────────────────────────────────────────────┘    │
│ □ 이OO  보톡스  콜백예정  김지연  2/8 14:00               │
│ □ 박OO  필러    부재중    -       2/7 16:30               │
└──────────────────────────────────────────────────────────────┘
```

### 5.6 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/hooks/useConsultationRealtime.ts` | **NEW** | Supabase Realtime 구독 |
| `src/hooks/useBrowserNotification.ts` | **NEW** | 브라우저 Notification API |
| `src/hooks/useCallbackChecker.ts` | **NEW** | 콜백 시간 체크 인터벌 |
| `src/components/admin/ConsultationTimeline.tsx` | **NEW** | 타임라인 UI |
| `src/app/api/admin/consultations/[id]/timeline/route.ts` | **NEW** | 타임라인 CRUD |
| `src/app/admin/(authenticated)/consultations/page.tsx` | MODIFY | Realtime + 알림 + 타임라인 |
| `src/types/supabase.ts` | MODIFY | consultation_timeline 테이블 |
| `src/types/admin.ts` | MODIFY | 타임라인 타입 정의 |
| `supabase/migrations/012_consultation_timeline.sql` | **NEW** | DB 마이그레이션 |

---

## 6. Phase 4: 재고 현황판 강화

### 6.1 예상 소진일 계산 로직

#### 파일: `src/lib/inventory-utils.ts`

```typescript
interface BurndownResult {
  dailyRate: number;         // 일평균 사용량
  daysUntilEmpty: number;    // 예상 소진 남은 일수
  estimatedDate: string;     // 예상 소진 날짜 (YYYY-MM-DD)
  severity: 'safe' | 'warning' | 'critical';
}

/**
 * 최근 30일 사용 이력 기반 소진일 계산
 */
export function calculateBurndown(
  currentStock: number,
  recentTransactions: { tx_type: string; quantity: number; created_at: string }[],
  lookbackDays: number = 30
): BurndownResult {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const usage = recentTransactions
    .filter((t) => t.tx_type === 'use' && new Date(t.created_at) >= cutoff)
    .reduce((sum, t) => sum + t.quantity, 0);

  const dailyRate = usage / lookbackDays;

  if (dailyRate <= 0) {
    return {
      dailyRate: 0,
      daysUntilEmpty: Infinity,
      estimatedDate: '-',
      severity: 'safe',
    };
  }

  const daysUntilEmpty = Math.floor(currentStock / dailyRate);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysUntilEmpty);

  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    daysUntilEmpty,
    estimatedDate: estimatedDate.toISOString().split('T')[0],
    severity: daysUntilEmpty <= 7 ? 'critical' : daysUntilEmpty <= 14 ? 'warning' : 'safe',
  };
}
```

### 6.2 API 변경

#### `GET /api/admin/inventory/burndown` — 소진 예측 데이터

**Response**:
```json
{
  "items": [
    {
      "itemId": "uuid",
      "name": "울쎄라 4.5mm 카트리지",
      "currentStock": 12,
      "dailyRate": 0.8,
      "daysUntilEmpty": 15,
      "estimatedDate": "2026-02-23",
      "severity": "warning"
    }
  ],
  "categorySummary": [
    {
      "category": "device_tip",
      "totalItems": 8,
      "totalValue": 12500000,
      "criticalCount": 1,
      "warningCount": 2
    }
  ]
}
```

### 6.3 UI 변경

#### StockTableView / StockCardView 확장

각 품목에 소진 예측 컬럼/배지 추가:

| 품목명 | 현재 재고 | 최소 재고 | **예상 소진** | **일평균 사용** | 상태 |
|--------|-----------|-----------|--------------|----------------|------|
| 울쎄라 4.5mm | 12 | 5 | **15일 후** (2/23) | 0.8/일 | ⚠️ |
| 써마지 팁 | 30 | 10 | 45일 후 | 0.67/일 | ✅ |

색상 규칙:
- `safe` (14일+): 초록 배지
- `warning` (7~14일): 주황 배지
- `critical` (7일 이하): 빨강 배지 + 깜빡임

#### StockDashboard 카테고리 요약 강화

```
┌──────────────────────────────────────────────────────┐
│ 재고 현황 요약                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  장비 팁/카트리지     주사제          실리프팅        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 8개 품목     │  │ 12개 품목    │  │ 6개 품목   │ │
│  │ ₩12,500,000  │  │ ₩8,200,000   │  │ ₩3,100,000 │ │
│  │ ⚠️ 주의 2개  │  │ ✅ 정상      │  │ 🔴 긴급 1  │ │
│  │ ▁▂▃▅▆▇ 추이 │  │ ▇▆▅▃▂▁ 추이 │  │ ▇▆▅▃▂▁    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
│  소모품             스킨케어          약물/연고       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ ...          │  │ ...          │  │ ...        │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 6.4 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/lib/inventory-utils.ts` | **NEW** | 소진일 계산 유틸리티 |
| `src/app/api/admin/inventory/burndown/route.ts` | **NEW** | 소진 예측 API |
| `src/components/admin/inventory/StockTableView.tsx` | MODIFY | 소진일 컬럼 추가 |
| `src/components/admin/inventory/StockCardView.tsx` | MODIFY | 소진일 배지 추가 |
| `src/components/admin/inventory/StockDashboard.tsx` | MODIFY | 카테고리 금액/추이 추가 |

---

## 7. Phase 5: 환자 통합 프로필

### 7.1 API 설계

#### `GET /api/admin/patients/search?q={query}`

환자명 또는 전화번호로 검색. 여러 테이블을 교차 조회.

**Response**:
```json
{
  "patients": [
    {
      "name": "김OO",
      "phone": "010-1234-5678",
      "treatmentCount": 5,
      "consultationCount": 2,
      "lastVisit": "2026-02-01",
      "totalSpent": 8500000
    }
  ]
}
```

#### `GET /api/admin/patients/profile?name={name}&phone={phone}`

특정 환자의 통합 프로필 조회.

**Response**:
```json
{
  "patient": {
    "name": "김OO",
    "phone": "010-1234-5678"
  },
  "treatments": [
    {
      "id": "uuid",
      "treatmentName": "울쎄라",
      "doctor": "김수영 원장",
      "treatedAt": "2026-02-01",
      "notificationSent": true
    }
  ],
  "consultations": [
    {
      "id": "uuid",
      "status": "completed",
      "procedureTags": ["울쎄라", "보톡스"],
      "createdAt": "2026-01-15"
    }
  ],
  "notifications": [
    {
      "id": "uuid",
      "channel": "kakao",
      "status": "sent",
      "sentAt": "2026-01-20"
    }
  ],
  "revenue": {
    "totalSpent": 8500000,
    "visitCount": 5,
    "avgPerVisit": 1700000,
    "procedures": [
      { "name": "울쎄라", "count": 2, "total": 6000000 },
      { "name": "보톡스", "count": 3, "total": 2500000 }
    ]
  }
}
```

### 7.2 UI 설계

기존 페이지에 탭 추가 방식이 아닌, 새 페이지로 구현:
`/admin/patients`

```
┌──────────────────────────────────────────────────────────────┐
│ 환자 프로필 조회                                             │
├──────────────────────────────────────────────────────────────┤
│ 🔍 [환자명 또는 전화번호 검색...                    ] [검색] │
│                                                              │
│ ┌─────────────────────────────┬──────────────────────────┐  │
│ │ 검색 결과                   │ 환자 프로필: 김OO         │  │
│ │                             │ 📞 010-1234-5678          │  │
│ │ ● 김OO  010-1234-5678     │                            │  │
│ │   시술 5회 | ₩8,500,000   │ ── 시술 이력 ──           │  │
│ │                             │ 2/1  울쎄라   김수영원장  │  │
│ │ ● 김OO  010-9876-5432     │ 1/5  보톡스   천신혜원장  │  │
│ │   시술 2회 | ₩1,200,000   │ 12/1 울쎄라   김수영원장  │  │
│ │                             │                            │  │
│ │                             │ ── 상담 이력 ──           │  │
│ │                             │ 1/15 울쎄라,보톡스 완료   │  │
│ │                             │                            │  │
│ │                             │ ── 알림 발송 ──           │  │
│ │                             │ 1/20 카카오 알림톡 발송   │  │
│ │                             │                            │  │
│ │                             │ ── 매출 요약 ──           │  │
│ │                             │ 총 매출: ₩8,500,000       │  │
│ │                             │ 방문 5회 | 평균 ₩1,700K   │  │
│ └─────────────────────────────┴──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/app/admin/(authenticated)/patients/page.tsx` | **NEW** | 환자 프로필 페이지 |
| `src/app/api/admin/patients/search/route.ts` | **NEW** | 환자 검색 API |
| `src/app/api/admin/patients/profile/route.ts` | **NEW** | 환자 통합 프로필 API |

---

## 8. admin.ts 타입 확장

```typescript
// ==========================================
// V2 Enhancement Types
// ==========================================

// Phase 1: Treatment Cycle Notification
export interface TreatmentMaster {
  id: string;
  name: string;
  category: TreatmentMasterCategory;
  priceRange: string;
  duration: number;
  isActive: boolean;
  defaultCycleDays: number | null;            // NEW
  notificationTemplateId: string | null;       // NEW
}

export type NotificationSendResult = 'sent' | 'failed' | 'fallback_sms';

// Phase 2: CSV Import
export interface CsvColumnMapping {
  date: string;
  patientName: string;
  procedureName: string;
  category?: string;
  doctor: string;
  priceKrw: string;
  discountKrw?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
  batchId: string;
}

// Phase 3: Consultation Timeline
export type TimelineEventType =
  | 'status_change'
  | 'note_added'
  | 'callback_set'
  | 'assigned'
  | 'call_made'
  | 'tag_added'
  | 'budget_updated';

export interface ConsultationTimelineEntry {
  id: string;
  consultationId: string;
  eventType: TimelineEventType;
  description: string;
  actor: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  status_change: '상태 변경',
  note_added: '메모 추가',
  callback_set: '콜백 설정',
  assigned: '담당자 배정',
  call_made: '통화',
  tag_added: '태그 추가',
  budget_updated: '예산 수정',
};

export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  status_change: '🔄',
  note_added: '📝',
  callback_set: '📞',
  assigned: '👤',
  call_made: '☎️',
  tag_added: '🏷️',
  budget_updated: '💰',
};

// Phase 4: Inventory Burndown
export interface InventoryBurndown {
  itemId: string;
  name: string;
  currentStock: number;
  dailyRate: number;
  daysUntilEmpty: number;
  estimatedDate: string;
  severity: 'safe' | 'warning' | 'critical';
}

export interface CategorySummary {
  category: InventoryCategory;
  totalItems: number;
  totalValue: number;
  criticalCount: number;
  warningCount: number;
}

// Phase 5: Patient Profile
export interface PatientSearchResult {
  name: string;
  phone: string;
  treatmentCount: number;
  consultationCount: number;
  lastVisit: string;
  totalSpent: number;
}

export interface PatientProfile {
  patient: { name: string; phone: string };
  treatments: PatientTreatmentRow[];
  consultations: ConsultationRow[];
  notifications: NotificationHistoryRow[];
  revenue: {
    totalSpent: number;
    visitCount: number;
    avgPerVisit: number;
    procedures: { name: string; count: number; total: number }[];
  };
}
```

---

## 9. 전체 파일 변경 요약

### 새 파일 (16개)

| # | 파일 | Phase | 설명 |
|---|------|-------|------|
| 1 | `src/lib/solapi.ts` | P1 | Solapi SDK 래퍼 |
| 2 | `src/lib/inventory-utils.ts` | P4 | 재고 소진 계산 |
| 3 | `src/app/api/admin/notifications/send/route.ts` | P1 | 실제 발송 API |
| 4 | `src/app/api/cron/send-notifications/route.ts` | P1 | 자동 발송 크론 |
| 5 | `src/app/api/admin/settings/treatments/[id]/route.ts` | P1 | 시술 개별 PATCH |
| 6 | `src/app/api/admin/revenue/import/route.ts` | P2 | CSV 임포트 |
| 7 | `src/app/api/admin/revenue/mapping/route.ts` | P2 | 매핑 설정 |
| 8 | `src/app/api/admin/consultations/[id]/timeline/route.ts` | P3 | 타임라인 CRUD |
| 9 | `src/app/api/admin/inventory/burndown/route.ts` | P4 | 소진 예측 |
| 10 | `src/app/api/admin/patients/search/route.ts` | P5 | 환자 검색 |
| 11 | `src/app/api/admin/patients/profile/route.ts` | P5 | 환자 프로필 |
| 12 | `src/hooks/useConsultationRealtime.ts` | P3 | Realtime 구독 |
| 13 | `src/hooks/useBrowserNotification.ts` | P3 | 브라우저 알림 |
| 14 | `src/hooks/useCallbackChecker.ts` | P3 | 콜백 체커 |
| 15 | `src/components/admin/CsvUploadModal.tsx` | P2 | CSV 업로드 모달 |
| 16 | `src/components/admin/ConsultationTimeline.tsx` | P3 | 타임라인 컴포넌트 |

### 새 페이지 (1개)

| # | 파일 | Phase | 설명 |
|---|------|-------|------|
| 1 | `src/app/admin/(authenticated)/patients/page.tsx` | P5 | 환자 프로필 |

### 수정 파일 (8개)

| # | 파일 | Phase | 변경사항 |
|---|------|-------|----------|
| 1 | `src/types/supabase.ts` | P1-5 | 새 테이블/필드 타입 |
| 2 | `src/types/admin.ts` | P1-5 | V2 타입 정의 추가 |
| 3 | `src/app/admin/(authenticated)/notifications/page.tsx` | P1 | 실제 발송 + 자동/수동 |
| 4 | `src/app/admin/(authenticated)/settings/page.tsx` | P1 | 시술 주기 컬럼 |
| 5 | `src/app/admin/(authenticated)/revenue/page.tsx` | P2 | CSV 업로드 버튼 |
| 6 | `src/app/admin/(authenticated)/consultations/page.tsx` | P3 | Realtime + 타임라인 |
| 7 | `src/components/admin/inventory/StockTableView.tsx` | P4 | 소진일 표시 |
| 8 | `src/components/admin/inventory/StockDashboard.tsx` | P4 | 카테고리 요약 |

### DB 마이그레이션 (3개)

| # | 파일 | 내용 |
|---|------|------|
| 1 | `011_treatment_cycle_notification.sql` | treatment_masters 확장, notification_history 확장, 인덱스 |
| 2 | `012_consultation_timeline.sql` | consultation_timeline 테이블, Realtime 활성화 |
| 3 | `013_revenue_import.sql` | operation_cases 임포트 필드, clinic_settings 매핑 |

### 패키지 의존성

| 패키지 | 용도 | Phase |
|--------|------|-------|
| `solapi` | 카카오 알림톡 + SMS 발송 | P1 |
| `papaparse` | CSV 파싱 (클라이언트) | P2 |
| `@types/papaparse` | PapaParse 타입 (devDep) | P2 |

### 환경변수

| 변수 | 용도 | Phase |
|------|------|-------|
| `SOLAPI_API_KEY` | Solapi API 인증 | P1 |
| `SOLAPI_API_SECRET` | Solapi API 인증 | P1 |
| `SOLAPI_SENDER_NUMBER` | 발신번호 | P1 |
| `KAKAO_PFID` | 카카오 채널 프로필 ID | P1 |
| `CRON_SECRET` | Vercel Cron 인증 | P1 |

---

## 10. 구현 순서 및 의존성

```
Phase 1 (시술 알림)
  ├── 1a. DB 마이그레이션 011 실행
  ├── 1b. supabase.ts / admin.ts 타입 업데이트
  ├── 1c. src/lib/solapi.ts 생성
  ├── 1d. settings 시술 주기 UI + PATCH API
  ├── 1e. notifications/send API (실제 발송)
  ├── 1f. notifications 페이지 수정 (실제 발송 연결)
  └── 1g. cron/send-notifications API + vercel.json

Phase 2 (매출 CSV) — Phase 1과 독립
  ├── 2a. DB 마이그레이션 013 실행
  ├── 2b. papaparse 설치
  ├── 2c. revenue/import API
  ├── 2d. revenue/mapping API
  ├── 2e. CsvUploadModal 컴포넌트
  └── 2f. revenue 페이지에 업로드 버튼

Phase 3 (상담 Realtime) — Phase 1, 2와 독립
  ├── 3a. DB 마이그레이션 012 실행
  ├── 3b. useConsultationRealtime 훅
  ├── 3c. useBrowserNotification 훅
  ├── 3d. useCallbackChecker 훅
  ├── 3e. consultations/[id]/timeline API
  ├── 3f. ConsultationTimeline 컴포넌트
  └── 3g. consultations 페이지 통합

Phase 4 (재고 강화) — Phase 1, 2, 3과 독립
  ├── 4a. src/lib/inventory-utils.ts
  ├── 4b. inventory/burndown API
  ├── 4c. StockTableView 소진일 컬럼
  └── 4d. StockDashboard 카테고리 요약

Phase 5 (환자 프로필) — Phase 1~4 완료 후
  ├── 5a. patients/search API
  ├── 5b. patients/profile API
  └── 5c. patients 페이지 UI
```

> Phase 1~4는 **독립적으로 병렬 진행 가능**. Phase 5만 이전 Phase의 데이터에 의존.

---

## 11. 보안 고려사항

| 항목 | 대응 |
|------|------|
| Solapi API 키 노출 | 서버 사이드 (API route / cron)에서만 사용. 환경변수로 관리 |
| Cron API 무단 호출 | `CRON_SECRET` 헤더 검증 필수 |
| CSV 인젝션 | 파싱 후 모든 문자열 값에서 `=`, `+`, `-`, `@` 시작 문자 제거 |
| 환자 정보 마스킹 | 브라우저 알림 제목에 환자명 부분 마스킹 (김O영) |
| 개인정보 보호 | patient_treatments, consultation에 대한 감사로그 기록 |
| XSS 방지 | CSV 데이터 INSERT 시 HTML 태그 이스케이프 |
