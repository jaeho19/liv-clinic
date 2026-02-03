# Design: LIV Admin Operations OS (병원 운영 OS)

> **Feature**: admin-operations-os
> **Created**: 2026-01-31
> **Status**: Draft
> **PDCA Phase**: Design
> **Plan Reference**: [admin-operations-os.plan.md](../../01-plan/features/admin-operations-os.plan.md)

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────┐
│                  Next.js App Router               │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Admin   │  │  Admin   │  │   Admin API    │  │
│  │  Pages   │──│Components│──│   Routes       │  │
│  │ (RSC/CC) │  │  (CC)    │  │ /api/admin/*   │  │
│  └────┬─────┘  └──────────┘  └───────┬────────┘  │
│       │                              │            │
│  ┌────┴──────────────────────────────┴─────────┐ │
│  │           Supabase Client Layer              │ │
│  │  supabase-browser.ts | supabase-server.ts   │ │
│  │  supabase-admin.ts (service role)           │ │
│  └──────────────────┬──────────────────────────┘ │
└─────────────────────┼───────────────────────────┘
                      │
              ┌───────┴───────┐
              │   Supabase    │
              │  PostgreSQL   │
              │  + Auth       │
              │  + Storage    │
              │  + Realtime   │
              └───────────────┘
```

### 코드 패턴 (기존 준수)
- **페이지**: `src/app/admin/(authenticated)/[feature]/page.tsx`
- **API**: `src/app/api/admin/[feature]/route.ts`
- **컴포넌트**: `src/components/admin/[Component].tsx`
- **타입**: `src/types/admin.ts`
- **인증**: API route에서 `createServerClient() → getSession()` 체크
- **DB 조작**: `createAdminClient()` (service role, server-side only)
- **클라이언트 조회**: `createClient()` (browser-side, RLS 적용)

---

## 2. 데이터베이스 상세 설계

### 2.1 기존 테이블 변경: consultation_requests

```sql
-- Phase 1: 기존 테이블에 컬럼 추가 (기존 데이터 호환)
ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS assignee text,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_outcome text,
  ADD COLUMN IF NOT EXISTS procedure_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS availability text;

-- status 값 확장 (text 타입이므로 enum 변경 불필요)
-- 기존: pending, contacted, completed, cancelled
-- 신규 추가: new, callback_scheduled, no_answer, re_contact, reservation_confirmed, no_show
-- 기존 'pending' 데이터는 'new'로 마이그레이션
UPDATE consultation_requests SET status = 'new' WHERE status = 'pending';
```

### 2.2 신규 테이블: procedures (시술 마스터)

```sql
CREATE TABLE procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- '울쎄라', '보톡스' 등
  category text NOT NULL DEFAULT 'all',        -- lifting, antiaging, laser, skincare, all
  default_duration_min integer DEFAULT 30,     -- 기본 소요시간 (분)
  price_default integer,                       -- 기본 가격 (원, nullable)
  recipe jsonb DEFAULT '[]',                   -- [{"item_id": "uuid", "qty": 2}]
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 초기 시술 데이터 삽입
INSERT INTO procedures (name, category, default_duration_min) VALUES
  ('울쎄라', 'lifting', 60),
  ('써마지 FLX', 'lifting', 45),
  ('덴서티', 'lifting', 40),
  ('인모드', 'lifting', 30),
  ('슈링크', 'lifting', 30),
  ('실리프팅', 'lifting', 90),
  ('압토스', 'lifting', 60),
  ('보톡스', 'antiaging', 15),
  ('필러', 'antiaging', 30),
  ('스킨부스터', 'antiaging', 30),
  ('색소 레이저', 'laser', 20),
  ('혈관 레이저', 'laser', 20),
  ('제모 레이저', 'laser', 30),
  ('문신 제거', 'laser', 30),
  ('피부톤 레이저', 'laser', 25);
```

### 2.3 신규 테이블: cases (케이스/내원)

```sql
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES consultation_requests(id) ON DELETE SET NULL,
  procedure_id uuid REFERENCES procedures(id) ON DELETE SET NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  doctor text,
  room text,
  state text NOT NULL DEFAULT 'waiting',
  -- state: waiting, anesthesia, procedure, care, completed
  anesthesia_start timestamptz,
  anesthesia_end timestamptz,
  procedure_start timestamptz,
  procedure_end timestamptz,
  care_start timestamptz,
  care_end timestamptz,
  patient_name text NOT NULL,                  -- 비정규화: 빠른 조회용
  patient_phone text,
  notes text,
  total_amount integer,                        -- 실제 결제 금액 (원)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cases_visit_date ON cases(visit_date);
CREATE INDEX idx_cases_state ON cases(state);
CREATE INDEX idx_cases_lead_id ON cases(lead_id);
```

### 2.4 신규 테이블: inventory_items (재고 품목)

```sql
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- '보톡스 100U', '히알루론산 1cc' 등
  unit text NOT NULL DEFAULT 'ea',             -- ea, vial, cc, ml, box
  on_hand integer NOT NULL DEFAULT 0,          -- 현재 재고
  reorder_point integer NOT NULL DEFAULT 5,    -- 재주문 기준
  cost_per_unit integer,                       -- 단가 (원, nullable)
  expiry_date date,                            -- 유효기간 (nullable)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.5 신규 테이블: inventory_tx (재고 트랜잭션)

```sql
CREATE TABLE inventory_tx (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  qty integer NOT NULL,                        -- 양수: 입고, 음수: 사용/폐기
  tx_type text NOT NULL,                       -- use, receive, dispose, adjust
  memo text,
  created_by text,                             -- 작업자 (session user email)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_tx_item_id ON inventory_tx(item_id);
CREATE INDEX idx_inventory_tx_case_id ON inventory_tx(case_id);
CREATE INDEX idx_inventory_tx_created_at ON inventory_tx(created_at);
```

### 2.6 신규 테이블: staff (직원)

```sql
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,                    -- Supabase auth.users.id
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'staff',          -- owner, admin, staff
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.7 신규 테이블: audit_log (감사 로그)

```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,                         -- 수행자 email
  entity text NOT NULL,                        -- 테이블명 (cases, inventory_items 등)
  entity_id text NOT NULL,                     -- 레코드 ID
  action text NOT NULL,                        -- create, update, delete
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

### 2.8 RLS 정책

```sql
-- 모든 신규 테이블에 RLS 활성화
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 조회 가능 (실제 권한은 API route에서 체크)
CREATE POLICY "Authenticated users can read" ON procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON inventory_tx FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON audit_log FOR SELECT TO authenticated USING (true);

-- CUD 작업은 service role (supabase-admin.ts)으로만 수행
-- → API route에서 session 체크 후 createAdminClient()로 실행
```

---

## 3. TypeScript 타입 설계

### 3.1 신규 타입 정의 (`src/types/admin.ts` 확장)

```typescript
// ── Lead (상담) 상태 확장 ──
export type LeadStatus =
  | 'new'                    // 신규
  | 'callback_scheduled'     // 콜백 예정
  | 'no_answer'              // 부재중
  | 're_contact'             // 재연락
  | 'reservation_confirmed'  // 예약확정
  | 'no_show'                // 노쇼
  | 'completed'              // 완료
  | 'cancelled';             // 취소

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: '신규',
  callback_scheduled: '콜백 예정',
  no_answer: '부재중',
  re_contact: '재연락',
  reservation_confirmed: '예약확정',
  no_show: '노쇼',
  completed: '완료',
  cancelled: '취소',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  callback_scheduled: 'bg-blue-100 text-blue-700',
  no_answer: 'bg-orange-100 text-orange-700',
  re_contact: 'bg-purple-100 text-purple-700',
  reservation_confirmed: 'bg-green-100 text-green-700',
  no_show: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

// ── Case (케이스) ──
export type CaseState = 'waiting' | 'anesthesia' | 'procedure' | 'care' | 'completed';

export const CASE_STATE_LABELS: Record<CaseState, string> = {
  waiting: '대기',
  anesthesia: '마취',
  procedure: '시술',
  care: '관리',
  completed: '종료',
};

export const CASE_STATE_COLORS: Record<CaseState, string> = {
  waiting: 'bg-gray-100 text-gray-700',
  anesthesia: 'bg-yellow-100 text-yellow-700',
  procedure: 'bg-blue-100 text-blue-700',
  care: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

// ── Inventory ──
export type InventoryTxType = 'use' | 'receive' | 'dispose' | 'adjust';

export const INVENTORY_TX_LABELS: Record<InventoryTxType, string> = {
  use: '사용',
  receive: '입고',
  dispose: '폐기',
  adjust: '조정',
};

// ── Staff Role ──
export type StaffRole = 'owner' | 'admin' | 'staff';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: '원장',
  admin: '관리자',
  staff: '직원',
};

// ── Procedure Category ──
export type ProcedureCategory = 'lifting' | 'antiaging' | 'laser' | 'skincare' | 'all';

// ── Row Types (DB 테이블 매핑) ──
export interface ProcedureRow {
  id: string;
  name: string;
  category: ProcedureCategory;
  default_duration_min: number;
  price_default: number | null;
  recipe: Array<{ item_id: string; qty: number }>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CaseRow {
  id: string;
  lead_id: string | null;
  procedure_id: string | null;
  visit_date: string;
  doctor: string | null;
  room: string | null;
  state: CaseState;
  anesthesia_start: string | null;
  anesthesia_end: string | null;
  procedure_start: string | null;
  procedure_end: string | null;
  care_start: string | null;
  care_end: string | null;
  patient_name: string;
  patient_phone: string | null;
  notes: string | null;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemRow {
  id: string;
  name: string;
  unit: string;
  on_hand: number;
  reorder_point: number;
  cost_per_unit: number | null;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTxRow {
  id: string;
  item_id: string;
  case_id: string | null;
  qty: number;
  tx_type: InventoryTxType;
  memo: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StaffRow {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 4. API 설계

### 4.1 기존 API 유지
- `GET/POST /api/admin/events`
- `PATCH/DELETE /api/admin/events/[id]`
- `GET/POST /api/admin/popups`
- `PATCH/DELETE /api/admin/popups/[id]`

### 4.2 신규 API

#### Leads (상담관리 확장)
기존 consultation_requests는 Supabase 클라이언트로 직접 조회/수정하는 패턴.
동일 패턴 유지하되, 새 필드 활용.

#### Cases (케이스)
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/cases` | 케이스 목록 (오늘 기본) |
| `POST` | `/api/admin/cases` | 케이스 생성 (리드에서 전환) |
| `PATCH` | `/api/admin/cases/[id]` | 케이스 수정 (상태 전이, 타임스탬프) |
| `DELETE` | `/api/admin/cases/[id]` | 케이스 삭제 |

**PATCH 특수 동작** - `state` 변경 시:
```
state: 'anesthesia' → anesthesia_start = now()
state: 'procedure'  → anesthesia_end = now(), procedure_start = now()
state: 'care'       → procedure_end = now(), care_start = now()
state: 'completed'  → care_end = now(), 재고 자동 차감 트리거
```

#### Procedures (시술 마스터)
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/procedures` | 시술 목록 |
| `POST` | `/api/admin/procedures` | 시술 등록 |
| `PATCH` | `/api/admin/procedures/[id]` | 시술 수정 |
| `DELETE` | `/api/admin/procedures/[id]` | 시술 삭제 |

#### Inventory (재고)
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/inventory` | 재고 품목 목록 |
| `POST` | `/api/admin/inventory` | 품목 등록 |
| `PATCH` | `/api/admin/inventory/[id]` | 품목 수정 |
| `POST` | `/api/admin/inventory/tx` | 트랜잭션 생성 (입고/폐기/조정) |
| `GET` | `/api/admin/inventory/tx` | 트랜잭션 이력 조회 |

#### Reports (리포트)
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/reports/procedures` | 시술별 통계 |
| `GET` | `/api/admin/reports/conversion` | 상담 전환율 |
| `GET` | `/api/admin/reports/inventory` | 재고 소모 리포트 |

#### Staff (직원)
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/staff` | 직원 목록 |
| `POST` | `/api/admin/staff` | 직원 등록 |
| `PATCH` | `/api/admin/staff/[id]` | 직원 수정 |

---

## 5. 파일 구조 설계

```
liv-clinic/src/
├── app/
│   ├── admin/
│   │   ├── (authenticated)/
│   │   │   ├── layout.tsx                    (기존 - 수정)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                  (기존 - 수정: 콜백 위젯 추가)
│   │   │   ├── consultations/
│   │   │   │   └── page.tsx                  (기존 - 수정: 필드/상태 확장)
│   │   │   ├── operations/                   ← Phase 2 신규
│   │   │   │   └── page.tsx                  칸반 보드
│   │   │   ├── inventory/                    ← Phase 3 신규
│   │   │   │   └── page.tsx                  재고 관리
│   │   │   ├── reports/                      ← Phase 4 신규
│   │   │   │   └── page.tsx                  리포트
│   │   │   ├── settings/                     ← Phase 5 신규
│   │   │   │   └── page.tsx                  설정 (시술/직원/로그)
│   │   │   ├── events/                       (기존 유지)
│   │   │   └── popups/                       (기존 유지)
│   ├── api/
│   │   └── admin/
│   │       ├── events/                       (기존 유지)
│   │       ├── popups/                       (기존 유지)
│   │       ├── cases/                        ← Phase 2 신규
│   │       │   ├── route.ts                  GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts              PATCH, DELETE
│   │       ├── procedures/                   ← Phase 5 신규
│   │       │   ├── route.ts                  GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts              PATCH, DELETE
│   │       ├── inventory/                    ← Phase 3 신규
│   │       │   ├── route.ts                  GET, POST (items)
│   │       │   ├── [id]/
│   │       │   │   └── route.ts              PATCH (item)
│   │       │   └── tx/
│   │       │       └── route.ts              GET, POST (transactions)
│   │       ├── reports/                      ← Phase 4 신규
│   │       │   ├── procedures/
│   │       │   │   └── route.ts
│   │       │   ├── conversion/
│   │       │   │   └── route.ts
│   │       │   └── inventory/
│   │       │       └── route.ts
│   │       └── staff/                        ← Phase 5 신규
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx                  (기존 - 수정: 메뉴 확장)
│       ├── EventForm.tsx                     (기존 유지)
│       ├── PopupForm.tsx                     (기존 유지)
│       ├── ImageUploader.tsx                 (기존 유지)
│       ├── ConfirmDialog.tsx                 (기존 유지)
│       ├── TodayCallbacks.tsx               ← Phase 1 신규
│       ├── LeadDetailPanel.tsx              ← Phase 1 신규
│       ├── CaseCard.tsx                     ← Phase 2 신규
│       ├── KanbanBoard.tsx                  ← Phase 2 신규
│       ├── KanbanColumn.tsx                 ← Phase 2 신규
│       ├── CaseCreateModal.tsx              ← Phase 2 신규
│       ├── InventoryTable.tsx               ← Phase 3 신규
│       ├── InventoryTxModal.tsx             ← Phase 3 신규
│       ├── StockAlert.tsx                   ← Phase 3 신규
│       └── ProcedureForm.tsx                ← Phase 5 신규
└── types/
    ├── admin.ts                              (기존 - 확장)
    └── supabase.ts                           (기존 - 신규 테이블 타입 추가)
```

---

## 6. UI 상세 설계

### 6.1 사이드바 (AdminSidebar.tsx 수정)

```
NAV_ITEMS 구조:

[섹션: 병원 운영]
  { href: '/admin/dashboard',      label: '대시보드',     icon: '📊' }
  { href: '/admin/consultations',  label: '상담관리',     icon: '📋' }
  { href: '/admin/operations',     label: '운영현황',     icon: '🏥' }
  { href: '/admin/inventory',      label: '재고관리',     icon: '📦' }
  { href: '/admin/reports',        label: '리포트',       icon: '📈' }

[섹션: 홈페이지 관리]
  { href: '/admin/events',         label: '이벤트관리',   icon: '🎉' }
  { href: '/admin/popups',         label: '팝업관리',     icon: '🪟' }

[섹션: 시스템]
  { href: '/admin/settings',       label: '설정',         icon: '⚙️' }
```

구분선: 각 섹션 사이에 `<div className="border-t border-[#e5e5e5] my-2">` + 섹션 라벨 표시

### 6.2 대시보드 (Phase 1 수정)

```
┌────────────────────────────────────────────────────────┐
│ 대시보드                                                │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ 오늘     │ 미처리    │ 이번달   │ 진행중   │ 재고경고   │
│ 신규상담 │ 콜백예정  │ 상담     │ 케이스   │            │
│    3     │    5     │   42    │    2     │     3      │
├──────────┴──────────┴──────────┴──────────┴────────────┤
│                                                        │
│ 📞 오늘 콜백해야 할 목록 (5건)              전체보기 > │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 김미영  010-****-5678  보톡스,필러  10:00 예정    │   │
│ │ 이수진  010-****-1234  울쎄라       14:00 예정    │   │
│ │ 박지현  010-****-9012  필러         15:30 예정    │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ 최근 상담 신청                              전체보기 > │
│ (기존 테이블 유지)                                      │
└────────────────────────────────────────────────────────┘
```

### 6.3 상담관리 (Phase 1 수정)

```
┌────────────────────────────────────────────────────────┐
│ 상담관리                                   CSV 다운로드 │
├────────────────────────────────────────────────────────┤
│ [전체] [신규] [콜백예정] [부재중] [재연락]              │
│ [예약확정] [노쇼] [완료] [취소]                        │
│                                                        │
│ [이름/전화 검색...] [담당자 필터 ▼] [오늘 콜백만 ☐]   │
├────────────────────────────────────────────────────────┤
│ ▶ 이름   전화    관심시술   담당자  다음연락  상태  접수일│
│ ─────────────────────────────────────────────────────── │
│ ▶ 김미영 010-**-5678 보톡스,필러 김간호 01/31 10:00    │
│   │                             [콜백예정▼] 01/30      │
│   ├─ 확장 패널 ──────────────────────────────────────  │
│   │  이메일: kim@...   예산: 100~200만   가용요일: 화,목│
│   │  연락결과: 보톡스 관심, 필러는 상담 후 결정          │
│   │  메모: [인라인 편집 가능]                           │
│   │  [ 🏥 케이스 생성 ]                                │
│   └──────────────────────────────────────────────────  │
└────────────────────────────────────────────────────────┘
```

### 6.4 운영현황 - 칸반 보드 (Phase 2)

```
┌────────────────────────────────────────────────────────┐
│ 운영현황  [오늘: 2026-01-31 ▼]  [+ 직접 생성]         │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  대기(2) │ 마취(1)  │ 시술(1)  │ 관리(0)  │ 종료(3)   │
├──────────┼──────────┼──────────┼──────────┼────────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │ ┌──────┐  │
│ │김미영│ │ │이수진│ │ │박지현│ │          │ │최윤아│  │
│ │울쎄라│ │ │보톡스│ │ │필러  │ │          │ │슈링크│  │
│ │대기  │ │ │15분↗│ │ │20분  │ │          │ │45분  │  │
│ │10:00 │ │ │      │ │ │      │ │          │ │      │  │
│ │[마취 │ │ │[시술 │ │ │[관리 │ │          │ │ ✅   │  │
│ │시작] │ │ │시작] │ │ │시작] │ │          │ │      │  │
│ └──────┘ │ └──────┘ │ └──────┘ │          │ └──────┘  │
│ ┌──────┐ │          │          │          │ ┌──────┐  │
│ │정하나│ │          │          │          │ │한소희│  │
│ │써마지│ │          │          │          │ │보톡스│  │
│ │대기  │ │          │          │          │ │20분  │  │
│ └──────┘ │          │          │          │ └──────┘  │
├──────────┴──────────┴──────────┴──────────┴────────────┤
│ 지연 표시: 기본 소요시간 초과 시 카드 테두리 빨간색      │
│ 경과시간 표시: 현재 단계 진입 후 경과 시간 (실시간)      │
└────────────────────────────────────────────────────────┘
```

**카드 동작:**
- 각 카드에 1개의 액션 버튼: 다음 단계로 전이
- 클릭 시 타임스탬프 자동 기록
- `completed` 전이 시 → 재고 자동 차감 (recipe 기반)

### 6.5 재고관리 (Phase 3)

```
┌────────────────────────────────────────────────────────┐
│ 재고관리                              [+ 품목 추가]     │
├────────────────────────────────────────────────────────┤
│ [전체] [부족⚠️(3)] [유효기간 임박(1)]  [검색...]       │
├────────────────────────────────────────────────────────┤
│ 품목명        단위  현재재고  기준  상태      작업      │
│ ────────────────────────────────────────────────────── │
│ 보톡스 100U   vial    3/10   🟡 부족  [입고] [이력]    │
│ 히알루론산    cc     25/10   🟢 정상  [입고] [이력]    │
│ 주사기 1cc    ea      2/20   🔴 긴급  [입고] [이력]    │
│ 리도카인      ml     50/30   🟢 정상  [입고] [이력]    │
│ 봉합사        ea     15/10   🟢 정상  [입고] [이력]    │
├────────────────────────────────────────────────────────┤
│ 이번달 소모 현황 (간단 표)                              │
│ 보톡스: 15 vial  |  히알루론산: 40 cc  |  주사기: 45 ea│
└────────────────────────────────────────────────────────┘
```

### 6.6 리포트 (Phase 4)

```
┌────────────────────────────────────────────────────────┐
│ 리포트  [이번주 ▼] [이번달] [커스텀]                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📊 시술별 효율                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 시술명    건수  평균시간  평균매출  시간당매출     │   │
│ │ 보톡스     25    15분    30만     120만/h  ★    │   │
│ │ 울쎄라     8     55분   150만     163만/h  ★★  │   │
│ │ 필러       18    28분    80만     171만/h  ★★  │   │
│ │ 써마지     12    42분   120만     171만/h  ★★  │   │
│ │ 실리프팅    4    85분   200만     141만/h  ★    │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ 📈 상담 전환율                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 출처      리드  예약확정  내원  전환율            │   │
│ │ 웹사이트   45    20      18    40%               │   │
│ │ 네이버     30    12      10    33%               │   │
│ │ 인스타     15     5       4    27%               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ 📦 재고 소모 (이번달)                                   │
│ (간단 테이블)                                           │
└────────────────────────────────────────────────────────┘
```

---

## 7. 핵심 비즈니스 로직

### 7.1 재고 자동 차감 (케이스 완료 시)

```typescript
// cases PATCH handler - state가 'completed'로 변경될 때
async function handleCaseComplete(caseId: string, admin: SupabaseClient) {
  // 1. 케이스 조회 → procedure_id 확인
  const { data: caseData } = await admin
    .from('cases').select('*, procedures(recipe)').eq('id', caseId).single();

  if (!caseData?.procedures?.recipe) return;

  // 2. recipe의 각 아이템에 대해 트랜잭션 생성 + 재고 차감
  const recipe = caseData.procedures.recipe as Array<{ item_id: string; qty: number }>;

  for (const item of recipe) {
    // inventory_tx 생성
    await admin.from('inventory_tx').insert({
      item_id: item.item_id,
      case_id: caseId,
      qty: -item.qty,      // 음수 = 사용
      tx_type: 'use',
    });

    // on_hand 차감
    await admin.rpc('decrement_inventory', {
      p_item_id: item.item_id,
      p_qty: item.qty,
    });
  }
}
```

### 7.2 Supabase RPC 함수

```sql
-- 재고 차감 함수 (atomic)
CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id uuid, p_qty integer)
RETURNS void AS $$
BEGIN
  UPDATE inventory_items
  SET on_hand = GREATEST(0, on_hand - p_qty),
      updated_at = now()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.3 "오늘 콜백" 쿼리

```typescript
// 오늘 콜백해야 할 리드 조회
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('consultation_requests')
  .select('*')
  .eq('status', 'callback_scheduled')
  .gte('next_followup_at', `${today}T00:00:00`)
  .lte('next_followup_at', `${today}T23:59:59`)
  .order('next_followup_at', { ascending: true });
```

### 7.4 케이스 상태 전이 로직

```typescript
// 상태 전이 규칙
const STATE_TRANSITIONS: Record<CaseState, CaseState | null> = {
  waiting: 'anesthesia',
  anesthesia: 'procedure',
  procedure: 'care',
  care: 'completed',
  completed: null,  // 최종 상태
};

// 상태 변경 시 자동 타임스탬프
const TIMESTAMP_MAP: Record<CaseState, Partial<CaseRow>> = {
  anesthesia: { anesthesia_start: new Date().toISOString() },
  procedure:  { anesthesia_end: new Date().toISOString(), procedure_start: new Date().toISOString() },
  care:       { procedure_end: new Date().toISOString(), care_start: new Date().toISOString() },
  completed:  { care_end: new Date().toISOString() },
};
```

---

## 8. 구현 순서 (상세)

### Phase 1: 상담관리 확장 (MVP)
```
1-1. DB 마이그레이션 SQL 작성 + 실행
     - consultation_requests 컬럼 추가
     - status 값 마이그레이션 (pending → new)
1-2. TypeScript 타입 확장
     - supabase.ts: consultation_requests Row/Insert/Update에 새 필드 추가
     - admin.ts: LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS 추가
1-3. AdminSidebar.tsx 수정
     - 섹션 구분 + 메뉴 확장 (운영/홈페이지/시스템)
1-4. consultations/page.tsx 수정
     - 상태 탭 확장 (8개 상태)
     - 테이블 컬럼 추가 (담당자, 다음 연락, 관심 시술)
     - 확장 패널에 새 필드 인라인 편집
     - 담당자 필터 추가
     - "오늘 콜백만" 체크박스
1-5. TodayCallbacks.tsx 컴포넌트 생성
     - 오늘 콜백 목록 위젯
1-6. dashboard/page.tsx 수정
     - 통계 카드 업데이트 (콜백 예정, 진행중 케이스)
     - TodayCallbacks 위젯 추가
```

### Phase 2: 운영 타임라인
```
2-1. DB: cases, procedures 테이블 생성 + 시술 초기 데이터
2-2. supabase.ts: 신규 테이블 타입 추가
2-3. API: /api/admin/cases (GET, POST, PATCH, DELETE)
2-4. API: /api/admin/procedures (GET, POST, PATCH, DELETE)
2-5. CaseCreateModal.tsx: 리드 → 케이스 전환 모달
2-6. KanbanBoard.tsx + KanbanColumn.tsx + CaseCard.tsx
2-7. operations/page.tsx: 칸반 보드 페이지
2-8. consultations/page.tsx: "케이스 생성" 버튼 추가
```

### Phase 3: 재고관리
```
3-1. DB: inventory_items, inventory_tx 테이블 생성
3-2. DB: decrement_inventory RPC 함수
3-3. supabase.ts: 타입 추가
3-4. API: /api/admin/inventory (CRUD) + /api/admin/inventory/tx
3-5. InventoryTable.tsx + InventoryTxModal.tsx + StockAlert.tsx
3-6. inventory/page.tsx
3-7. cases PATCH에 재고 자동 차감 로직 연결
3-8. dashboard에 재고 경고 카드 추가
```

### Phase 4: 리포트
```
4-1. API: /api/admin/reports/procedures (시술별 통계 쿼리)
4-2. API: /api/admin/reports/conversion (전환율 쿼리)
4-3. API: /api/admin/reports/inventory (재고 소모 쿼리)
4-4. reports/page.tsx (테이블 기반, 차트는 선택)
```

### Phase 5: 설정
```
5-1. DB: staff, audit_log 테이블 생성
5-2. API: /api/admin/staff (CRUD)
5-3. ProcedureForm.tsx: 시술 마스터 관리 UI
5-4. settings/page.tsx: 탭 (시술관리 / 직원관리 / 감사로그)
5-5. audit_log 자동 기록 미들웨어
```

---

## 9. 설계 결정 근거

| 결정 | 이유 |
|------|------|
| Supabase 직접 쿼리 (클라이언트) | 기존 consultations 패턴 유지, 별도 API 불필요한 조회에 사용 |
| API route (서버) | CUD 작업은 service role로 RLS 우회, 감사 로그 기록 필요 |
| 칸반: 드래그 없이 버튼 클릭 | 모바일/태블릿 호환성, 클릭 1~2번 원칙 준수 |
| patient_name 비정규화 | 칸반 카드에서 매번 JOIN 불필요, 빠른 렌더링 |
| recipe jsonb | 시술-재고 연결이 유동적, 정규화 불필요 |
| 전화번호 마스킹 옵션 | 기본 마스킹, owner/admin은 전체 보기 가능 |
| status를 text 유지 | 기존 테이블이 text, enum 마이그레이션 리스크 회피 |
