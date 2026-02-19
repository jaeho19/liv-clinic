# Design: shot-tracking-system (창 4: 샷 수 추적 시스템)

> 울쎄라/슈링크 팁별 잔여 샷 추적 — API, 훅, UI, KioskView 연동 상세 설계

## 1. 아키텍처 개요

```
┌─ Frontend ─────────────────────────────────────────────────────┐
│                                                                 │
│  ShotTracker.tsx (관리 페이지)    KioskView.tsx (시술 기록)      │
│       │                                │                        │
│       └──────── useShotTracking.ts ────┘                        │
│                        │                                        │
├─ API Layer ────────────┼────────────────────────────────────────┤
│                        │                                        │
│  GET  /api/admin/inventory/shots         ← 팁 목록 + 이력      │
│  POST /api/admin/inventory/shots         ← 새 팁 등록          │
│  POST /api/admin/inventory/shots/use     ← 샷 차감             │
│                                                                 │
├─ Database ─────────────────────────────────────────────────────┤
│                                                                 │
│  device_tip_shots   ← 팁별 잔여 샷                             │
│  device_shot_logs   ← 사용 이력                                │
│  use_device_shots() ← 차감 함수 (행 잠금 + 트랜잭션)          │
└─────────────────────────────────────────────────────────────────┘
```

## 2. API 상세 설계

### 2-1. `src/app/api/admin/inventory/shots/route.ts`

#### GET — 팁 목록 조회

```typescript
// 쿼리 파라미터
interface ShotsTipsQuery {
  device_type?: 'ulthera' | 'shurink';  // 필터 (없으면 전체)
  active_only?: 'true' | 'false';       // 기본 'true'
  include_logs?: 'true' | 'false';      // 최근 이력 포함 (기본 'false')
}

// 응답
interface TipWithLogs {
  id: string;
  item_id: string;
  tip_type: string;
  device_type: 'ulthera' | 'shurink';
  initial_shots: number;
  remaining_shots: number;
  is_active: boolean;
  registered_at: string;
  exhausted_at: string | null;
  recent_logs?: DeviceShotLog[];  // include_logs=true 시 최근 10건
}

// 응답: TipWithLogs[]
```

**구현 패턴** (기존 `inventory/route.ts` 참조):
```typescript
export async function GET(request: NextRequest) {
  // 1. 인증 확인: createServerClient → auth.getUser()
  // 2. 쿼리 파라미터 파싱
  // 3. createAdminClient()
  // 4. device_tip_shots 조회 (device_type 필터, active 필터)
  // 5. include_logs=true 시 device_shot_logs LEFT JOIN (최근 10건)
  // 6. 응답 반환
}
```

**Supabase 쿼리:**
```typescript
let query = admin
  .from('device_tip_shots')
  .select('*')
  .order('registered_at', { ascending: false });

if (deviceType) query = query.eq('device_type', deviceType);
if (activeOnly) query = query.eq('is_active', true);
```

이력 포함 시:
```typescript
const { data: logs } = await admin
  .from('device_shot_logs')
  .select('*')
  .in('tip_id', tipIds)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### POST — 새 팁 등록

```typescript
// 요청 body
interface RegisterTipRequest {
  item_id: string;         // inventory_items FK (울쎄라/슈링크 장비 품목)
  tip_type: string;        // '1.5', '3.0', '4.5', '2.0', 'v슈링크', 'S슈링크'
  device_type: DeviceType; // 'ulthera' | 'shurink'
}

// 응답: DeviceTipShot (201 Created)
```

**서버 로직:**
```typescript
export async function POST(request: NextRequest) {
  // 1. 인증 확인
  // 2. body 파싱 + 유효성 검증
  // 3. DEVICE_INITIAL_SHOTS[device_type][tip_type]에서 초기값 조회
  //    → 매칭 안 되면 400 에러: "지원하지 않는 팁 종류입니다"
  // 4. device_tip_shots INSERT
  //    { item_id, tip_type, device_type, initial_shots, remaining_shots: initial_shots }
  // 5. 201 응답
}
```

**유효성:**
- `device_type`가 `'ulthera'` 또는 `'shurink'`인지 확인
- `DEVICE_INITIAL_SHOTS[device_type]`에 `tip_type` 키가 존재하는지 확인
- `item_id`가 실제 존재하는 inventory_items인지 확인 (선택적 — DB FK가 보장)

### 2-2. `src/app/api/admin/inventory/shots/use/route.ts`

#### POST — 샷 차감

```typescript
// 요청 body
interface UseShotsRequest {
  tip_id: string;
  shots_used: number;
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
}

// 응답 (201)
{ success: true, log_id: string }

// 에러 응답 (400/500)
{ error: string }
```

**서버 로직:**
```typescript
export async function POST(request: NextRequest) {
  // 1. 인증 확인
  // 2. body 파싱
  // 3. 유효성: shots_used > 0
  // 4. admin.rpc('use_device_shots', {
  //      p_tip_id: body.tip_id,
  //      p_shots_used: body.shots_used,
  //      p_patient_name: body.patient_name,
  //      p_chart_number: body.chart_number,
  //      p_procedure_area: body.procedure_area,
  //      p_note: body.note,
  //      p_created_by: user.email
  //    })
  // 5. RPC 에러 → 400 (Insufficient shots / Active tip not found)
  // 6. 성공 → 201 { success: true, log_id }
}
```

## 3. 훅 설계: `useShotTracking.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceTipShot, DeviceShotLog, DeviceType } from '@/types/admin';
import { DEVICE_INITIAL_SHOTS } from '@/types/admin';

interface ShotUseMeta {
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
}

interface UseShotTrackingReturn {
  tips: DeviceTipShot[];
  logs: DeviceShotLog[];
  loading: boolean;
  error: string | null;
  registerTip: (deviceType: DeviceType, tipType: string, itemId: string) => Promise<void>;
  useShots: (tipId: string, shotsUsed: number, meta?: ShotUseMeta) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useShotTracking(deviceType?: DeviceType): UseShotTrackingReturn {
  // ...
}
```

### 내부 구현 패턴

**fetch 함수** (기존 `useInventoryData.ts` 패턴 준수):
```typescript
async function fetchTips(deviceType?: DeviceType): Promise<DeviceTipShot[]> {
  const params = new URLSearchParams();
  if (deviceType) params.set('device_type', deviceType);
  params.set('include_logs', 'true');
  const res = await fetch(`/api/admin/inventory/shots?${params}`);
  if (!res.ok) throw new Error('팁 목록을 불러오지 못했습니다.');
  return res.json();
}
```

**Optimistic UI** (기존 `KioskView.tsx` 패턴 준수):
```typescript
const useShots = useCallback(async (tipId: string, shotsUsed: number, meta?: ShotUseMeta) => {
  // 1. Optimistic: tips 상태에서 remaining_shots 즉시 차감
  setTips(prev => prev.map(t =>
    t.id === tipId
      ? { ...t, remaining_shots: t.remaining_shots - shotsUsed }
      : t
  ));

  try {
    // 2. API 호출
    const res = await fetch('/api/admin/inventory/shots/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip_id: tipId, shots_used: shotsUsed, ...meta }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '샷 차감 실패');
    }
    // 3. 성공 → refresh로 서버 상태 동기화
    await refresh();
  } catch (e) {
    // 4. 실패 → refresh로 롤백
    setError(e instanceof Error ? e.message : '샷 차감 실패');
    await refresh();
  }
}, [refresh]);
```

**registerTip:**
```typescript
const registerTip = useCallback(async (dt: DeviceType, tipType: string, itemId: string) => {
  const initialShots = DEVICE_INITIAL_SHOTS[dt]?.[tipType];
  if (!initialShots) throw new Error(`지원하지 않는 팁: ${dt}/${tipType}`);

  const res = await fetch('/api/admin/inventory/shots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId, tip_type: tipType, device_type: dt }),
  });
  if (!res.ok) throw new Error('팁 등록 실패');
  await refresh();
}, [refresh]);
```

## 4. UI 컴포넌트 설계

### 4-1. `ShotTracker.tsx` — 관리 페이지 전체 컴포넌트

**Props:**
```typescript
interface ShotTrackerProps {
  items: InventoryItem[];  // 장비 품목 (item_id 참조용)
}
```

**내부 상태:**
```typescript
const [deviceTab, setDeviceTab] = useState<DeviceType>('ulthera');
const [showRegisterModal, setShowRegisterModal] = useState(false);
const [showUseModal, setShowUseModal] = useState<DeviceTipShot | null>(null);
const [showExhausted, setShowExhausted] = useState(false);

const { tips, logs, loading, error, registerTip, useShots, refresh } = useShotTracking(deviceTab);
```

**레이아웃 구조:**

```
┌─────────────────────────────────────────────────────────────┐
│ 헤더: "샷 추적 관리"  [울쎄라 | 슈링크]  [+ 새 팁 등록]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ 팁 카드 그리드 ─────────────────────────────────────┐   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │ │ [TipCard] │ │ [TipCard] │ │ [TipCard] │            │   │
│  │ │ 1.5팁     │ │ 3.0팁     │ │ 4.5팁     │            │   │
│  │ └──────────┘ └──────────┘ └──────────┘               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  (showExhausted) ───────────────────────────────────────    │
│  │ 소진된 팁 N개  [접기 ▼]                               │   │
│  │ [회색 TipCard] [회색 TipCard] ...                     │   │
│  └──────────────────────────────────────────────────────    │
│                                                             │
│  ┌─ 최근 사용 이력 ────────────────────────────────────┐   │
│  │ 날짜         팁       샷 수    환자     시술부위     │   │
│  │ 02.19 14:30  3.0팁   -150     홍길동   상안면       │   │
│  │ 02.19 13:00  1.5팁    -80     김철수   하안면       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4-2. TipCard 서브 컴포넌트 (ShotTracker 내부)

```typescript
interface TipCardProps {
  tip: DeviceTipShot;
  onUse: (tip: DeviceTipShot) => void;
}
```

**렌더링:**
```
┌──────────────────────────┐
│ 3.0팁              활성  │  ← tip_type + is_active 뱃지
│                          │
│  ████████████░░░░        │  ← ProgressBar (StockGauge 재사용)
│  1,200 / 2,400 (50%)     │  ← remaining / initial
│                          │
│  등록: 2026-02-15        │  ← registered_at
│                          │
│  [샷 차감]               │  ← onUse 버튼
└──────────────────────────┘
```

**게이지 색상 로직:**
- `remaining / initial > 0.4` → 녹색 (정상)
- `remaining / initial > 0` → 황색 (부족)
- `remaining === 0` → 적색 (소진)

→ 기존 `StockGauge.tsx`의 `ProgressBar` 컴포넌트를 재사용:
```tsx
<ProgressBar
  current={tip.remaining_shots}
  min={tip.initial_shots * 0.2}
  max={tip.initial_shots}
  showLabel
/>
```

### 4-3. UseModal (차감 모달)

```typescript
interface UseModalProps {
  tip: DeviceTipShot;
  onSubmit: (shotsUsed: number, meta: ShotUseMeta) => Promise<void>;
  onClose: () => void;
}
```

**레이아웃:**
```
┌────────────────────────────────┐
│ 샷 차감 — 3.0팁 (울쎄라)      │  [X]
├────────────────────────────────┤
│                                │
│ 잔여: 1,200 / 2,400           │
│ ██████████░░░░░░░░░           │
│                                │
│ 사용 샷 수: [    150    ] 샷   │  ← 숫자 입력, max=remaining
│                                │
│ ┌─────────┐ ┌────────────┐    │
│ │ 환자명   │ │ 차트번호    │   │
│ │ [홍길동] │ │ [C-001]    │   │
│ └─────────┘ └────────────┘    │
│                                │
│ 시술 부위: [상안면 ▼]          │  ← 울쎄라: 상안면/하안면/전안면/전안면+목
│                                │   슈링크: 자유 입력
│ 메모: [________________]       │
│                                │
│ ┌──────────────────────────┐   │
│ │   차감 후: 1,050 샷      │   │  ← 실시간 미리보기
│ └──────────────────────────┘   │
│                                │
│ [취소]              [차감 확인] │
└────────────────────────────────┘
```

**유효성 검증:**
- `shotsUsed > 0` — 0 이하 입력 불가
- `shotsUsed <= tip.remaining_shots` — 잔여 초과 시 입력 필드 빨간 테두리 + 에러 메시지
- 차감 확인 버튼: 위 조건 미충족 시 disabled

**시술 부위 옵션:**
- 울쎄라: `['상안면', '하안면', '전안면', '전안면+목']` (select)
- 슈링크: 자유 텍스트 입력

### 4-4. RegisterModal (팁 등록 모달)

```typescript
interface RegisterModalProps {
  deviceType: DeviceType;
  items: InventoryItem[];  // device_tip 카테고리 필터
  onSubmit: (tipType: string, itemId: string) => Promise<void>;
  onClose: () => void;
}
```

**레이아웃:**
```
┌──────────────────────────────────┐
│ 새 팁 등록 — 울쎄라              │  [X]
├──────────────────────────────────┤
│                                  │
│ 팁 종류: [3.0팁 ▼]              │  ← DEVICE_INITIAL_SHOTS[deviceType]의 키 목록
│                                  │
│ 초기 샷 수: 2,400 샷 (자동)     │  ← 선택 시 자동 표시 (읽기 전용)
│                                  │
│ 연결 품목: [울쎄라 3.0 카트리지 ▼] │  ← items 중 device_tip 카테고리
│                                  │
│ [취소]                [등록]     │
└──────────────────────────────────┘
```

**팁 종류 드롭다운:**
- 울쎄라: `1.5`, `3.0`, `4.5`
- 슈링크: `4.5`, `3.0`, `2.0`, `1.5`, `v슈링크`, `S슈링크`

→ `Object.keys(DEVICE_INITIAL_SHOTS[deviceType])`로 동적 생성

**초기 샷 수 자동 표시:**
→ `DEVICE_INITIAL_SHOTS[deviceType][selectedTipType]` 값을 읽기 전용으로 표시

### 4-5. 반응형 설계

| 요소 | PC (lg+) | Mobile (<lg) |
|------|----------|-------------|
| 팁 카드 그리드 | 3~4열 `grid-cols-3` | 1~2열 `grid-cols-1 sm:grid-cols-2` |
| 차감 모달 | 중앙 모달 (max-w-md) | 풀스크린 시트 (bottom sheet) |
| 등록 모달 | 중앙 모달 (max-w-sm) | 풀스크린 시트 |
| 이력 테이블 | 전체 컬럼 | 날짜+팁+샷수만 (환자명/부위 숨김) |
| 장비 탭 | pill 버튼 | 동일 |

**모바일 모달 패턴** (기존 프로젝트 패턴 — `DetailPanel.tsx` 참조):
```tsx
<div className="fixed inset-0 z-50 bg-black/30 flex items-end lg:items-center justify-center">
  <div className="w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto">
    {/* modal content */}
  </div>
</div>
```

## 5. KioskView 연동 설계

### 5-1. 변경 위치

`KioskView.tsx` 우측 패널의 물품 목록과 제출 버튼 사이에 **조건부 샷 차감 섹션** 삽입.

### 5-2. 조건 판정

```typescript
// 울쎄라 또는 슈링크 시술인지 판정
const isDeviceProcedure = selectedType?.id === 'ulthera' || selectedType?.id === 'shurink';
const deviceType: DeviceType | null = selectedType?.id === 'ulthera' ? 'ulthera'
  : selectedType?.id === 'shurink' ? 'shurink' : null;
```

### 5-3. 추가 상태 (KioskView 내부)

```typescript
// 기존 상태에 추가:
const [selectedTipId, setSelectedTipId] = useState<string>('');
const [shotsToUse, setShotsToUse] = useState<number>(0);
```

### 5-4. 훅 호출

```typescript
// KioskView 컴포넌트 최상위
const { tips: deviceTips, useShots, refresh: refreshShots } = useShotTracking(
  deviceType ?? undefined
);

// 활성 팁만 필터
const activeTips = useMemo(() => deviceTips.filter(t => t.is_active), [deviceTips]);
```

### 5-5. 렌더링 위치

```tsx
{/* Items list — 기존 코드 */}
{usageItems.length > 0 && (
  <div className="space-y-2">
    {usageItems.map((usage, idx) => (
      <UsageItemRow key={usage.itemId} usage={usage} index={idx} onQtyChange={handleQtyChange} />
    ))}
  </div>
)}

{/* ─── 샷 차감 섹션 (신규) ─── */}
{isDeviceProcedure && activeTips.length > 0 && (
  <div className="bg-[#faf8f7] rounded-xl p-4 border border-[#ebe7e4] space-y-3">
    <p className="text-[10px] font-semibold text-[#b4988d] uppercase tracking-wider">
      팁 샷 차감
    </p>

    {/* 팁 선택 */}
    <select
      value={selectedTipId}
      onChange={e => {
        setSelectedTipId(e.target.value);
        setShotsToUse(0);
      }}
      className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm ..."
    >
      <option value="">팁을 선택하세요</option>
      {activeTips.map(tip => (
        <option key={tip.id} value={tip.id}>
          {tip.tip_type}팁 — 잔여 {tip.remaining_shots.toLocaleString()} / {tip.initial_shots.toLocaleString()} 샷
        </option>
      ))}
    </select>

    {/* 사용 샷 수 입력 */}
    {selectedTipId && (
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#6d4e42] font-medium">사용 샷:</label>
        <input
          type="number"
          min={0}
          max={selectedTip?.remaining_shots ?? 0}
          value={shotsToUse || ''}
          onChange={e => setShotsToUse(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-28 border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm text-center ..."
        />
        <span className="text-xs text-[#a09080]">
          잔여: {(selectedTip?.remaining_shots ?? 0) - shotsToUse} 샷
        </span>
      </div>
    )}

    {/* 잔여 초과 경고 */}
    {shotsToUse > (selectedTip?.remaining_shots ?? 0) && (
      <p className="text-xs text-red-500 font-medium">잔여 샷을 초과했습니다!</p>
    )}
  </div>
)}

{/* Submit button — 기존 코드 */}
```

### 5-6. 제출 흐름 수정

```typescript
const handleSubmit = async () => {
  // 기존: 물품 차감만
  // 변경: 물품 차감 + 샷 차감 병렬 호출

  const activeItems = usageItems.filter(u => u.quantity > 0);
  const hasShots = isDeviceProcedure && selectedTipId && shotsToUse > 0;

  if (activeItems.length === 0 && !hasShots) return;

  setSubmitting(true);
  const label = getProcedureLabel(selectedType, selectedOption);

  // Optimistic UI
  setToast({ message: `${label} - 재고 차감 완료!`, type: 'success' });
  // ... 기존 초기화 + 추가 초기화
  setSelectedTipId('');
  setShotsToUse(0);

  try {
    const promises: Promise<Response>[] = [];

    // 1. 기존 물품 차감
    if (activeItems.length > 0) {
      promises.push(fetch('/api/admin/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeItems.map(u => ({ item_id: u.itemId, quantity: u.quantity })),
          patient_name: patientName.trim() || undefined,
          chart_number: chartNumber.trim() || undefined,
          confirmed_by: confirmedBy || undefined,
          note: `키오스크: ${label}`,
        }),
      }));
    }

    // 2. 샷 차감 (신규)
    if (hasShots) {
      promises.push(fetch('/api/admin/inventory/shots/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip_id: selectedTipId,
          shots_used: shotsToUse,
          patient_name: patientName.trim() || undefined,
          chart_number: chartNumber.trim() || undefined,
          procedure_area: selectedOption?.label || undefined,
          note: `키오스크: ${label}`,
        }),
      }));
    }

    const results = await Promise.all(promises);
    const allOk = results.every(r => r.ok);

    if (allOk) {
      loadData();
      refreshShots();
    } else {
      setToast({ message: '일부 처리 실패', type: 'error' });
      loadData();
      refreshShots();
    }
  } catch {
    setToast({ message: '네트워크 오류', type: 'error' });
    loadData();
    refreshShots();
  } finally {
    setSubmitting(false);
  }
};
```

### 5-7. 제출 버튼 텍스트 변경

```typescript
// 기존: `차감 완료 (${activeCount}개 품목)`
// 변경:
const buttonLabel = useMemo(() => {
  const parts: string[] = [];
  if (activeCount > 0) parts.push(`${activeCount}개 물품`);
  if (isDeviceProcedure && shotsToUse > 0) parts.push(`${shotsToUse}샷`);
  return parts.length > 0 ? `차감 완료 (${parts.join(' + ')})` : '차감 완료';
}, [activeCount, isDeviceProcedure, shotsToUse]);
```

## 6. 디자인 토큰 (프로젝트 일관성)

기존 "Quiet Luxury" 디자인 시스템 준수:

| 요소 | 값 |
|------|-----|
| 카드 배경 | `bg-white` |
| 카드 테두리 | `border border-[#ebe7e4] rounded-2xl` |
| 헤더 배경 | `bg-[#faf8f7]` |
| 주요 텍스트 | `text-[#6d4e42]` |
| 보조 텍스트 | `text-[#a09080]` |
| 레이블 | `text-[10px] font-semibold text-[#a09080] uppercase tracking-wider` |
| 선택 버튼 활성 | `bg-[#6d4e42] text-white` |
| 선택 버튼 비활성 | `bg-[#f6f4f2] text-[#575756]` |
| 게이지 정상 | `bg-emerald-400` |
| 게이지 부족 | `bg-amber-400` |
| 게이지 소진 | `bg-red-400` |
| 그림자 | `boxShadow: '0 1px 3px rgba(109,78,66,0.04)'` |
| 트랜지션 | `transition-all duration-700 ease-out` (게이지) |

## 7. 에러 처리

| 시나리오 | 프론트엔드 | 백엔드 |
|---------|-----------|--------|
| 잔여 샷 부족 | 입력 max 제한 + 경고 표시 | DB EXCEPTION → 400 |
| 비활성 팁 선택 | 활성 팁만 드롭다운에 표시 | `is_active=true` 조건 |
| 팁 등록 중복 | 등록 후 목록 refresh | DB는 중복 허용 (같은 팁 여러 개 등록 가능 — 교체 시) |
| 네트워크 오류 | toast 에러 + refresh | - |
| 인증 실패 | 401 → 로그인 리다이렉트 | `createServerClient` 인증 체크 |

## 8. 구현 순서 (6단계)

```
단계 1: shots/route.ts (GET + POST)
  └── 의존: admin.ts 타입 (완료), supabase-server/admin 라이브러리 (기존)
  └── 테스트: curl/fetch로 API 확인

단계 2: shots/use/route.ts (POST)
  └── 의존: use_device_shots() DB 함수 (완료)
  └── 테스트: curl로 차감 + remaining 확인

단계 3: useShotTracking.ts
  └── 의존: 단계 1, 2 API
  └── 테스트: 간단한 test 컴포넌트에서 훅 동작 확인

단계 4: ShotTracker.tsx
  └── 의존: 단계 3 훅, StockGauge 컴포넌트
  └── 포함: TipCard, UseModal, RegisterModal
  └── 테스트: /admin/inventory 페이지에서 독립 확인

단계 5: KioskView.tsx 연동
  └── 의존: 단계 3 훅
  └── 변경: 조건부 샷 섹션 + handleSubmit 병렬 호출
  └── 테스트: 울쎄라/슈링크 선택 → 샷 입력 → 제출 확인

단계 6: 빌드 + 수동 테스트
  └── npm run build 에러 확인
  └── 모바일/PC 양쪽 확인
```

## 9. 파일 목록 최종 정리

| # | 파일 | 유형 | 예상 LOC |
|---|------|------|---------|
| 1 | `src/app/api/admin/inventory/shots/route.ts` | 신규 | ~80 |
| 2 | `src/app/api/admin/inventory/shots/use/route.ts` | 신규 | ~50 |
| 3 | `src/hooks/useShotTracking.ts` | 신규 | ~90 |
| 4 | `src/components/admin/inventory/ShotTracker.tsx` | 신규 | ~350 |
| 5 | `src/components/admin/inventory/KioskView.tsx` | 수정 | +~80 |
| | **합계** | | **~650** |
