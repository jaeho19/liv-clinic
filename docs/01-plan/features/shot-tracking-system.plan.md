# Plan: shot-tracking-system (창 4: 샷 수 추적 시스템)

> 울쎄라/슈링크 팁별 잔여 샷 추적 UI + API + KioskView 연동

## 1. 개요

### 배경
간호팀 수정요청 #2(울쎄라 팁 샷 차감) 및 #3-2(슈링크 팁 샷 차감) 항목.
창 1(admin-nurse-requests-foundation)에서 DB 테이블(`device_tip_shots`, `device_shot_logs`)과 TypeScript 타입(`DeviceTipShot`, `DeviceShotLog`, `DEVICE_INITIAL_SHOTS`)이 이미 커밋됨.
DB 함수 `use_device_shots()`도 018 migration에 정의 완료.

### 목표
- 새 팁 등록 → 초기 샷 수 자동 설정
- 시술 시 사용 샷 입력 → 잔여 샷 차감
- 잔여 샷 실시간 표시 + 0 이하 방지
- KioskView에서 울쎄라/슈링크 선택 시 샷 차감 입력 필드 연동

### 범위
- **포함**: ShotTracker 컴포넌트, shots API, useShotTracking 훅, KioskView 연동
- **제외**: 재고 대시보드 필터(창 3), 화장품 유통기한(창 5)

## 2. 의존성 (이미 완료)

| 항목 | 위치 | 상태 |
|------|------|------|
| `device_tip_shots` 테이블 | `018_nurse_requests_schema.sql` | 완료 |
| `device_shot_logs` 테이블 | `018_nurse_requests_schema.sql` | 완료 |
| `use_device_shots()` 함수 | `018_nurse_requests_schema.sql` | 완료 |
| `DeviceTipShot` 인터페이스 | `src/types/admin.ts:560-570` | 완료 |
| `DeviceShotLog` 인터페이스 | `src/types/admin.ts:572-582` | 완료 |
| `DEVICE_INITIAL_SHOTS` 상수 | `src/types/admin.ts:585-599` | 완료 |
| `DeviceType` 타입 | `src/types/admin.ts:558` | 완료 |

## 3. 신규 생성 파일

### 3-1. `src/app/api/admin/inventory/shots/route.ts` (샷 CRUD API)

**엔드포인트:**

| Method | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/inventory/shots` | 활성 팁 목록 조회 (device_type 필터 지원) |
| POST | `/api/admin/inventory/shots` | 새 팁 등록 (초기 샷 자동 설정) |
| POST | `/api/admin/inventory/shots/use` | 샷 차감 (`use_device_shots()` RPC 호출) |

**GET 쿼리 파라미터:**
- `device_type`: `'ulthera'` | `'shurink'` (선택, 없으면 전체)
- `active_only`: `'true'` | `'false'` (기본: true)

**POST /shots 요청 body:**
```json
{
  "item_id": "uuid",
  "tip_type": "3.0",
  "device_type": "ulthera"
}
```
→ `DEVICE_INITIAL_SHOTS[device_type][tip_type]`에서 초기값 조회 → `device_tip_shots` INSERT

**POST /shots/use 요청 body:**
```json
{
  "tip_id": "uuid",
  "shots_used": 150,
  "patient_name": "홍길동",
  "chart_number": "C-001",
  "procedure_area": "상안면",
  "note": "울쎄라 3.0팁"
}
```
→ `use_device_shots()` RPC 호출

### 3-2. `src/hooks/useShotTracking.ts` (샷 데이터 훅)

```typescript
interface UseShotTrackingReturn {
  tips: DeviceTipShot[];
  loading: boolean;
  error: string | null;
  registerTip: (deviceType: DeviceType, tipType: string, itemId: string) => Promise<void>;
  useShots: (tipId: string, shotsUsed: number, meta?: ShotUseMeta) => Promise<void>;
  refresh: () => Promise<void>;
}
```

- `useShotTracking(deviceType?: DeviceType)` — 장비 타입 필터 옵션
- SWR 또는 useState+useEffect 패턴 (프로젝트 기존 패턴 따름)
- Optimistic UI: 차감 시 `remaining_shots` 즉시 반영 → 실패 시 롤백

### 3-3. `src/components/admin/inventory/ShotTracker.tsx` (메인 UI)

**구성:**

```
┌─────────────────────────────────────────────────────┐
│ 📊 샷 추적 관리                          [울쎄라|슈링크] │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ 1.5팁        │ │ 3.0팁        │ │ 4.5팁        │  │
│ │ ████████░░░  │ │ ██████░░░░░  │ │ ██████████░  │  │
│ │ 1,850/2,400  │ │ 1,200/2,400  │ │ 2,100/2,400  │  │
│ │ [차감]       │ │ [차감]       │ │ [차감]       │  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                     │
│ [+ 새 팁 등록]                                       │
│                                                     │
│ ─── 최근 사용 이력 ──────────────────────────────── │
│ 2026-02-19 14:30  3.0팁  -150샷  홍길동  상안면     │
│ 2026-02-19 13:00  1.5팁   -80샷  김철수  하안면     │
└─────────────────────────────────────────────────────┘
```

**기능 상세:**

1. **장비 탭 전환**: 울쎄라 / 슈링크 토글
2. **팁 카드 목록**: 활성 팁별 게이지바 + 잔여/초기 표시
3. **차감 모달**: 팁 선택 → 사용 샷 수 입력 + 환자명/차트번호/시술부위
4. **새 팁 등록**: 장비 타입에 따른 팁 종류 드롭다운 → 초기값 자동 설정
5. **사용 이력**: 최근 차감 이력 리스트 (device_shot_logs)
6. **0 이하 방지**: 입력 시 잔여 샷 초과 불가 + 시각적 경고
7. **소진 팁 표시**: is_active=false인 팁은 회색으로 표시 (접기/펼치기)

**반응형:**
- PC: 팁 카드 3~4열 그리드
- Mobile: 팁 카드 1~2열, 차감 시 풀스크린 모달

### 3-4. KioskView 연동 (`KioskView.tsx` 수정)

**변경 내용:**
울쎄라(`ulthera`) 또는 슈링크(`shurink`) 시술 선택 시, 기존 레시피 물품 목록 **아래에** 샷 차감 입력 영역 추가.

```
기존 KioskView 우측 패널:
┌───────────────────────────────┐
│ 울쎄라 프라임 - 상안면         │
│ 환자명 / 차트번호 / 간호사     │
│                               │
│ ─ 사용 물품 ─                  │
│ [물품1] [-] 1 [+]             │
│ [물품2] [-] 2 [+]             │
│                               │
│ ─ 팁 샷 차감 (신규) ─          │  ← 여기 추가
│ [팁 선택 ▼] 사용 샷: [___]    │
│ 잔여: 1,850 / 2,400           │
│                               │
│ [차감 완료 (2개 물품 + 샷)]    │
└───────────────────────────────┘
```

**구현 방식:**
- `selectedType?.id`가 `'ulthera'` 또는 `'shurink'`일 때 샷 차감 섹션 렌더링
- 팁 드롭다운: `useShotTracking(deviceType)`에서 활성 팁 목록
- 사용 샷 수 입력: 숫자 입력 + 잔여 표시
- 제출 시: 기존 `use_inventory_item` + `use_device_shots` 두 API 병렬 호출

## 4. 데이터 흐름

```
[KioskView 또는 ShotTracker]
  ↓ POST /api/admin/inventory/shots/use
  ↓ { tip_id, shots_used, patient_name, ... }
  ↓
[shots/use API route]
  ↓ supabase.rpc('use_device_shots', { ... })
  ↓
[DB: use_device_shots() 함수]
  ├── SELECT remaining_shots FOR UPDATE (행 잠금)
  ├── CHECK: remaining >= requested (부족 시 EXCEPTION)
  ├── UPDATE remaining_shots -= shots_used
  ├── UPDATE is_active = false (소진 시)
  └── INSERT device_shot_logs
```

## 5. 유효성 검증

| 검증 항목 | 위치 | 방법 |
|-----------|------|------|
| 사용 샷 > 0 | 프론트엔드 + API | 입력 min=1 + 서버 CHECK |
| 사용 샷 <= 잔여 샷 | 프론트엔드 + DB | 프론트: max 제한, DB: EXCEPTION |
| 초기 샷 값 일치 | API | `DEVICE_INITIAL_SHOTS` 참조 |
| 팁 활성 상태 | DB | `is_active = true` 조건 |
| 인증 확인 | API | `supabase.auth.getUser()` |

## 6. 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/admin/inventory/shots/route.ts` | 신규 | GET(팁 목록) + POST(팁 등록) |
| `src/app/api/admin/inventory/shots/use/route.ts` | 신규 | POST(샷 차감) |
| `src/hooks/useShotTracking.ts` | 신규 | 팁 데이터 + 차감 훅 |
| `src/components/admin/inventory/ShotTracker.tsx` | 신규 | 샷 추적 관리 페이지 컴포넌트 |
| `src/components/admin/inventory/KioskView.tsx` | 수정 | 울쎄라/슈링크 시 샷 차감 섹션 추가 |

## 7. 구현 순서

```
1. API: shots/route.ts (GET + POST)
   ↓
2. API: shots/use/route.ts (POST - use_device_shots RPC)
   ↓
3. Hook: useShotTracking.ts
   ↓
4. Component: ShotTracker.tsx (독립 관리 페이지)
   ↓
5. Integration: KioskView.tsx에 샷 차감 섹션 추가
   ↓
6. 빌드 확인 + 수동 테스트
```

## 8. 완료 기준

- [ ] GET /api/admin/inventory/shots → 활성 팁 목록 반환
- [ ] POST /api/admin/inventory/shots → 새 팁 등록 (초기값 자동)
- [ ] POST /api/admin/inventory/shots/use → 샷 차감 + 이력 기록
- [ ] ShotTracker: 울쎄라/슈링크 탭 전환 + 팁 카드 게이지 표시
- [ ] ShotTracker: 차감 모달 + 0 이하 방지
- [ ] ShotTracker: 새 팁 등록 폼
- [ ] KioskView: 울쎄라/슈링크 선택 시 샷 차감 입력 연동
- [ ] Mobile/PC 반응형 레이아웃 확인
- [ ] `npm run build` 에러 없음

## 9. 기존 패턴 참조

- **API 패턴**: `src/app/api/admin/inventory/use/route.ts` — 인증 + admin RPC 호출 패턴
- **UI 패턴**: `StockGauge.tsx` — 게이지바 컴포넌트 (재사용 가능)
- **Kiosk 흐름**: `KioskView.tsx:259-305` — submit 패턴 (optimistic UI)
- **훅 패턴**: `useInventoryData.ts` — fetch + state 관리 패턴
