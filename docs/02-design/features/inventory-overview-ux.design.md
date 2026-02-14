# Design: inventory-overview-ux

> 재고현황 UI/UX 개선 + 물품 사용 기록 연동 강화

## 1. 요구사항 매핑

| ID | 요구사항 | 구현 컴포넌트 | 우선순위 |
|----|---------|-------------|---------|
| FR-01 | 대시보드 통계 카드 시각 개선 | `DashboardStatsCards` (신규) | P1 |
| FR-02 | 카테고리 카드에 오늘 사용 뱃지 + 스파크라인 | `CategoryCard` (수정) | P1 |
| FR-03 | 재고현황에 오늘의 사용 기록 통합 | `TodayUsageSummary` (신규) | P0 |
| FR-04 | 품목별 사용 빈도 인사이트 | `CategoryDetailSection`, `StockCardView` (수정) | P1 |
| FR-05 | 사용 이력 시각화 강화 | `HistoryTab` (수정) | P2 |
| FR-06 | 입고 관리 우선순위 시각화 | `RestockTab` (수정) | P2 |
| FR-07 | 양방향 네비게이션 개선 | `overview/page.tsx`, `KioskView` (수정) | P1 |
| FR-08 | 실시간 데이터 동기화 | `useInventoryData` (수정) | P0 |

## 2. 컴포넌트 설계

### 2.1 `useInventoryData` 훅 확장 (FR-08)

**파일**: `src/hooks/useInventoryData.ts`

#### 추가 반환 필드

```typescript
export interface UseInventoryDataReturn {
  // ... 기존 필드 유지 ...

  // 신규 추가
  todayUsageSessions: UsageSession[];       // 오늘의 사용 세션 (전체)
  todayCategoryUsage: Map<InventoryCategory, number>;  // 카테고리별 오늘 사용 건수
  todayItemUsage: Map<string, number>;      // 품목별 오늘 사용 수량
  weeklyItemUsage: Map<string, number[]>;   // 품목별 7일간 일별 사용량 (스파크라인용)
}
```

#### 데이터 페칭 전략

```typescript
// 기존 fetchTransactions 활용 - 추가 API 호출 없음
// transactions에서 클라이언트 측에서 필터링/집계

function computeTodayUsage(transactions: InventoryTransaction[]) {
  const today = getTodayString(); // YYYY-MM-DD
  const todayTxs = transactions.filter(t =>
    t.tx_type === 'use' && t.created_at.startsWith(today)
  );

  // 카테고리별 사용 건수 (items 참조 필요)
  // 품목별 사용 수량
  // 세션 그룹핑 (DailyUsageLog의 groupIntoSessions 로직 재사용)
}

function computeWeeklyUsage(transactions: InventoryTransaction[]) {
  // 최근 7일간 일별 사용량 집계
  // Map<itemId, [day0, day1, ..., day6]> 형태
  // 스파크라인 렌더링에 사용
}
```

#### 변경 범위
- `loadData()` 내에서 transactions 로드 후 `computeTodayUsage`, `computeWeeklyUsage` 추가 호출
- `DailyUsageLog.tsx`의 `groupIntoSessions`, `buildSession` 함수를 별도 유틸로 추출하여 재사용
- 새 유틸: `src/lib/usage-session-utils.ts`

---

### 2.2 `DashboardStatsCards` (FR-01)

**파일**: `src/components/admin/inventory/DashboardStatsCards.tsx`
**대체 대상**: `CompactStatsBar` (기존 파일 유지, overview에서 import만 변경)

#### Props

```typescript
interface DashboardStatsCardsProps {
  items: InventoryItem[];
  todayCategoryUsage: Map<InventoryCategory, number>;
  alertItems: InventoryItem[];
  onAlertClick?: () => void;  // 소진 카드 클릭 → 해당 카테고리로 스크롤
}
```

#### 레이아웃 (4열 그리드)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 📦              │ │ ✅              │ │ ⚠️              │ │ 🚨              │
│ 42              │ │ 35              │ │  5              │ │  2              │
│ 총 품목         │ │ 정상 재고       │ │ 부족 경고       │ │ 긴급 소진       │
│ ──────────────  │ │ ■■■■■■■□□  83%  │ │                 │ │                 │
│ 오늘 12건 사용  │ │                 │ │ 써마지팁 외 4개  │ │ 즉시 발주 필요  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### 구현 세부사항

```typescript
// 4개 카드 정의
const cards = [
  {
    icon: '📦', // SVG 아이콘으로 대체
    label: '총 품목',
    value: stats.total,
    sub: `오늘 ${todayTotalUsageCount}건 사용`,
    color: '#6d4e42',
    bgGradient: 'from-[#faf8f7] to-white',
  },
  {
    icon: '✅',
    label: '정상 재고',
    value: stats.normal,
    sub: null,
    progress: stats.healthPercent, // 퍼센트 바
    color: '#059669',
    bgGradient: 'from-emerald-50/50 to-white',
  },
  {
    icon: '⚠️',
    label: '부족 경고',
    value: stats.low,
    sub: lowItemNames, // "써마지팁 외 N개" 형태
    color: '#d97706',
    bgGradient: 'from-amber-50/50 to-white',
    pulse: stats.low > 0,
  },
  {
    icon: '🚨',
    label: '긴급 소진',
    value: stats.out,
    sub: '즉시 발주 필요',
    color: '#dc2626',
    bgGradient: 'from-red-50/50 to-white',
    pulse: stats.out > 0,
    onClick: onAlertClick,
  },
];
```

#### 스타일 사양

| 요소 | 값 |
|------|-----|
| 그리드 | `grid grid-cols-2 lg:grid-cols-4 gap-3` |
| 카드 | `rounded-2xl border border-[#ebe7e4] p-5` |
| 숫자 | `text-3xl font-bold tabular-nums` |
| 라벨 | `text-xs text-[#a09080] font-medium` |
| 부가정보 | `text-[11px] text-[#b4988d]` |
| pulse 효과 | `animate-pulse` (비정상 카드만, 값 > 0일 때) |
| 아이콘 | SVG 40x40, `rounded-xl` 배경 |
| 정상 재고 진행바 | `ProgressBar` 컴포넌트 재사용 (StockGauge.tsx) |

---

### 2.3 `TodayUsageSummary` (FR-03)

**파일**: `src/components/admin/inventory/TodayUsageSummary.tsx`
**위치**: overview stock 탭 - DashboardStatsCards 아래, CategoryGrid 위

#### Props

```typescript
interface TodayUsageSummaryProps {
  sessions: UsageSession[];
  items: InventoryItem[];          // 품목명 참조용
  transactions: InventoryTransaction[];  // 세션 상세 펼침용
}
```

#### 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📋 오늘의 물품 사용 (2/14 금)                          3건  ▲ 접기        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  14:30  써마지 FLX 600샷        홍길동  #1234  김간호사   3개 품목   ▼     │
│         ├ 써마지 FLX 팁 -1개                                               │
│         ├ 도포용 젤 -1개                                                   │
│         └ 일회용 보호필름 -2개                                             │
│                                                                             │
│  13:15  울쎄라 눈+이마           이순신          박간호사   4개 품목   ▶    │
│                                                                             │
│  10:00  화장품: 세럼 사용                        최간호사   2개 품목   ▶    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 구현 세부사항

- `DailyUsageLog`의 세션 그룹핑 로직 재사용 (`usage-session-utils.ts`)
- 각 세션 행을 클릭하면 **사용 품목 상세**가 아코디언으로 펼쳐짐
- 세션 상세: 해당 세션의 transactions를 필터링 → 품목명 + 수량 표시
- 접기/펼치기 상태: 기본 펼침 (오늘 사용 건 <= 5건), 많으면 기본 접힘
- 빈 상태: "오늘 사용 기록이 아직 없습니다" + 키오스크 바로가기 링크

#### 확장 UsageSession 타입

```typescript
// src/lib/usage-session-utils.ts

export interface UsageSession {
  timestamp: string;
  procedureLabel: string;
  patientName: string;
  chartNumber: string;
  confirmedBy: string;
  itemCount: number;
  transactionIds: string[];  // 신규: 세션에 속한 tx ID들
}

export function groupIntoSessions(txs: InventoryTransaction[]): UsageSession[];
export function buildSession(txs: InventoryTransaction[]): UsageSession;
```

#### 스타일 사양

| 요소 | 값 |
|------|-----|
| 컨테이너 | `bg-white rounded-2xl border border-[#ebe7e4]` |
| 헤더 | `bg-[#faf8f7] px-5 py-3.5 border-b` 배경 |
| 세션 행 | `px-5 py-3 hover:bg-[#faf8f7] cursor-pointer` |
| 시간 | `text-xs font-mono text-[#b4988d] tabular-nums` w-12 |
| 시술명 | `text-sm font-bold text-[#6d4e42]` |
| 환자/간호사 | `text-xs text-[#a09080]` |
| 아코디언 상세 | `bg-[#faf8f7] px-5 py-3 ml-14` |
| 품목 리스트 | 세로 트리 라인 `border-l-2 border-[#ebe7e4]` + `pl-4` |

---

### 2.4 `CategoryCard` 수정 (FR-02)

**파일**: `src/components/admin/inventory/CategoryCard.tsx`

#### 추가 Props

```typescript
interface CategoryCardProps {
  // ... 기존 props ...
  todayUsageCount?: number;           // 오늘 이 카테고리에서 사용된 건수
  weeklySparkline?: number[];         // 7일간 일별 카테고리 사용량
  topUsedItem?: string;               // 가장 많이 사용된 품목명
}
```

#### 레이아웃 변경

```
기존:
┌─────────────────────────────┐
│ ⚙️ 디바이스팁    7 품목      │
│ ■■■■■■■□□□  재고 건강도 85% │
│ ● 정상 5  ⚠ 부족 1  🔴 소진 1│
│ 재고가치 320만원             │
└─────────────────────────────┘

변경:
┌─────────────────────────────┐
│ ⚙️ 디바이스팁    7 품목      │
│ ■■■■■■■□□□  재고 건강도 85% │
│ ● 정상 5  ⚠ 부족 1  🔴 소진 1│
│                              │
│ ┄┄╱╲╱╲╱╲╱╲┄ (7일 스파크라인)│
│ 오늘 3건 사용  |  TOP: 써마지팁│
└─────────────────────────────┘
```

#### 미니 스파크라인 SVG 구현

```typescript
function MiniSparkline({ data, width = 80, height = 20, color = '#b4988d' }: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2 || data.every(d => d === 0)) return null;

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 마지막 포인트(오늘) dot */}
      <circle
        cx={width}
        cy={height - (data[data.length - 1] / max) * (height - 4) - 2}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
```

#### "오늘 N건 사용" 뱃지

```typescript
{todayUsageCount !== undefined && todayUsageCount > 0 && (
  <div className="mt-2 pt-2 border-t border-[#f0eeec] flex items-center justify-between text-[10px]">
    <span className="text-[#b4988d] font-semibold">
      오늘 {todayUsageCount}건 사용
    </span>
    {topUsedItem && (
      <span className="text-[#a09080] truncate ml-2">
        TOP: {topUsedItem}
      </span>
    )}
  </div>
)}
```

---

### 2.5 `CategoryDetailSection` + `StockCardView` 수정 (FR-04)

#### CategoryDetailSection 변경

**파일**: `src/components/admin/inventory/CategoryDetailSection.tsx`

추가 Props:
```typescript
interface CategoryDetailSectionProps {
  // ... 기존 props ...
  todayItemUsage?: Map<string, number>;  // 품목별 오늘 사용 수량
}
```

변경점:
- `filtered` 아이템을 `StockCardView`/`StockTableView`에 전달할 때 `todayItemUsage` 함께 전달

#### StockCardView 변경

**파일**: `src/components/admin/inventory/StockCardView.tsx`

추가 Props:
```typescript
interface StockCardViewProps {
  // ... 기존 props ...
  todayItemUsage?: Map<string, number>;
}
```

각 품목 카드에 추가할 "최근 사용" 인사이트:

```
기존 카드 하단 (입고/출고 버튼 위):
┌───────────────────────────────────────┐
│ ★ 오늘 3개 사용  |  일평균 1.2/일    │
│ ─────────────────────────────────────│
│  [ 입고 ]          [ 출고 ]          │
└───────────────────────────────────────┘
```

구현:
```typescript
// burndownMap에서 dailyRate 가져오기
const dailyRate = burndownMap?.get(item.id)?.dailyRate;
const todayUsed = todayItemUsage?.get(item.id);

{(todayUsed || dailyRate) && (
  <div className="flex items-center gap-2 text-[10px] text-[#a09080] mt-2 mb-1">
    {todayUsed && todayUsed > 0 && (
      <span className="flex items-center gap-1 text-[#b4988d] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b4988d]" />
        오늘 {todayUsed}개 사용
      </span>
    )}
    {dailyRate && dailyRate > 0 && (
      <span className="ml-auto">일평균 {dailyRate.toFixed(1)}/일</span>
    )}
  </div>
)}
```

---

### 2.6 `HistoryTab` 시각화 강화 (FR-05)

**파일**: `src/components/admin/inventory/HistoryTab.tsx`

#### 추가 요소 1: 시간대별 사용 히트맵

타임라인 상단에 위치, 작은 히트맵 표시:

```
          오전(9-12)  오후(12-15)  오후(15-18)  저녁(18-21)
  월       ■■■          ■■■■■       ■■           ■
  화       ■■           ■■■         ■■■■         ■■
  수       ■■■■         ■■          ■■           ■
  ...
```

구현: transactions의 `created_at`을 요일+시간대별로 집계 → SVG rect 히트맵

```typescript
function UsageHeatmap({ transactions }: { transactions: InventoryTransaction[] }) {
  // 최근 7일간 시간대별 집계
  const HOURS = ['9-12', '12-15', '15-18', '18-21'];
  const DAYS = ['월', '화', '수', '목', '금', '토'];

  // heatData: number[][] (days x hours)
  // intensity: 0-4 레벨 → 색상 매핑
  const COLORS = ['#f6f4f2', '#e8d5cc', '#d4b5a5', '#b4988d', '#6d4e42'];

  return (
    <div className="bg-white rounded-2xl border border-[#ebe7e4] p-4 mb-4">
      <h4 className="text-xs font-bold text-[#6d4e42] mb-3">시간대별 사용 패턴</h4>
      <svg ...>
        {/* rect grid */}
      </svg>
    </div>
  );
}
```

#### 추가 요소 2: 도넛 차트 (TOP 10 대체)

기존 바 차트를 **도넛 차트 + 순위 리스트** 조합으로:

```
┌────────────────────────────────┐
│ 품목별 소모량 TOP 10           │
│                                │
│   ┌──────┐   1. 써마지팁  45  │
│   │도넛  │   2. 울쎄라팁  32  │
│   │차트  │   3. 보톡스    28  │
│   │ 총   │   4. 필러      25  │
│   │152개 │   5. ...            │
│   └──────┘                    │
└────────────────────────────────┘
```

구현: `StockGauge.tsx`의 기존 `DonutChart` 컴포넌트 재사용
- `segments`: TOP 10 품목 → DonutSegment[] 변환
- `centreValue`: 총 사용량
- `centreLabel`: '총 사용량'
- 우측에 순위 리스트 표시

색상 배분:
```typescript
const CHART_COLORS = [
  '#6d4e42', '#b4988d', '#d4b5a5', '#e8d5cc',
  '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899',
  '#10b981', '#6b7280',
];
```

---

### 2.7 `RestockTab` 우선순위 시각화 (FR-06)

**파일**: `src/components/admin/inventory/RestockTab.tsx`

#### 추가 요소 1: 카운트다운 바

기존 RestockCard에 예상 소진까지의 시각적 카운트다운 바 추가:

```
현재:
  ┌─ 써마지 FLX 팁 ─────── [소진] ─┐
  │ 디바이스팁 | 모든의료기           │
  │ ■■□□□□□□□□  2/10 개             │
  │ 약 3일 뒤 소진 예상              │
  │ 권장 발주량: 30개                │
  └──────────────────────────────────┘

변경:
  ┌─ 써마지 FLX 팁 ─────── [소진] ─┐
  │ 디바이스팁 | 모든의료기           │
  │ ■■□□□□□□□□  2/10 개             │
  │                                  │
  │ ⏱ D-3  ━━━━━━━━━━━━━━━━━━━━▓▓▓ │
  │         30일              3일 0일│
  │                                  │
  │ 권장 발주량: 30개                │
  └──────────────────────────────────┘
```

구현:
```typescript
function CountdownBar({ daysUntilEmpty, maxDays = 30 }: {
  daysUntilEmpty: number;
  maxDays?: number;
}) {
  const pct = Math.max(0, Math.min(100, (daysUntilEmpty / maxDays) * 100));
  const isCritical = daysUntilEmpty <= 7;
  const isWarning = daysUntilEmpty <= 14;

  return (
    <div className="mt-2 mb-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#6d4e42]'}`}>
          D-{daysUntilEmpty}
        </span>
        <div className="flex-1 h-2 bg-[#f0eeec] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${100 - pct}%`, marginLeft: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-[#c5b8b0]">
        <span>{maxDays}일</span>
        <span>0일</span>
      </div>
    </div>
  );
}
```

#### 추가 요소 2: 일괄 발주 체크리스트 모드

발주 추천 섹션 상단에 토글 추가:

```typescript
const [batchMode, setBatchMode] = useState(false);
const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

// 배치 모드 활성화 시:
// - 각 RestockCard 좌측에 체크박스 표시
// - 하단에 "선택한 N개 품목 일괄 입고" 스티키 바
```

---

### 2.8 양방향 네비게이션 (FR-07)

#### overview → kiosk 연결 강화

`TodayUsageSummary` 내 빈 상태에서:
```typescript
<Link href="/admin/inventory" className="...">
  키오스크에서 물품 차감하기 →
</Link>
```

#### kiosk → overview 미니 위젯

**파일**: `src/components/admin/inventory/KioskView.tsx` (하단에 추가)

```typescript
// KioskView 하단, DailyUsageLog 아래에 추가
<Link
  href="/admin/inventory/overview"
  className="mt-3 flex items-center justify-between bg-[#faf8f7] rounded-xl border border-[#ebe7e4] px-4 py-3 hover:bg-[#f6f4f2] transition-colors group"
>
  <div className="flex items-center gap-2">
    <svg className="w-4 h-4 text-[#b4988d]" ...>
      {/* chart-bar icon */}
    </svg>
    <span className="text-sm text-[#6d4e42] font-medium">재고 현황 보기</span>
  </div>
  <div className="flex items-center gap-2">
    {alertCount > 0 && (
      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
        {alertCount}개 부족
      </span>
    )}
    <svg className="w-4 h-4 text-[#c5b8b0] group-hover:text-[#b4988d] transition-colors" ...>
      {/* chevron-right */}
    </svg>
  </div>
</Link>
```

---

## 3. 파일 수정 맵

### 신규 생성 (3개)

| 파일 | 설명 | 의존성 |
|------|------|--------|
| `src/lib/usage-session-utils.ts` | 세션 그룹핑 유틸 (DailyUsageLog에서 추출) | `types/admin` |
| `src/components/admin/inventory/DashboardStatsCards.tsx` | 대시보드 통계 카드 | `StockGauge.ProgressBar`, `types/admin` |
| `src/components/admin/inventory/TodayUsageSummary.tsx` | 오늘의 사용 기록 요약 | `usage-session-utils`, `types/admin` |

### 기존 수정 (9개)

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| `useInventoryData.ts` | todayUsageSessions, todayCategoryUsage, todayItemUsage, weeklyItemUsage 추가 | 중 |
| `DailyUsageLog.tsx` | 세션 유틸 함수를 `usage-session-utils.ts`로 추출, import 변경 | 소 |
| `overview/page.tsx` | CompactStatsBar → DashboardStatsCards, TodayUsageSummary 추가, 새 props 전달 | 중 |
| `CategoryCard.tsx` | todayUsageCount, weeklySparkline, topUsedItem props + MiniSparkline 렌더링 | 소 |
| `CategoryGrid.tsx` | todayCategoryUsage, weeklyItemUsage prop 수신 → CategoryCard에 전달 | 소 |
| `CategoryDetailSection.tsx` | todayItemUsage prop 추가 → StockCardView/StockTableView 전달 | 소 |
| `StockCardView.tsx` | todayItemUsage prop 추가, "오늘 N개 사용" + "일평균" 표시 | 소 |
| `HistoryTab.tsx` | UsageHeatmap 추가, TOP 10 바 차트 → DonutChart + 순위리스트 변경 | 중 |
| `RestockTab.tsx` | CountdownBar 추가, 일괄 발주 체크리스트 모드 | 중 |

### KioskView 수정 (1개)

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| `KioskView.tsx` | 하단에 "재고 현황 보기" 링크 위젯 추가 | 소 |

---

## 4. 데이터 흐름

```
┌─ useInventoryData ─────────────────────────────────────┐
│                                                         │
│  GET /api/admin/inventory          → items              │
│  GET /api/admin/inventory/transactions?limit=200 → txs  │
│  GET /api/admin/inventory/recipes  → recipes            │
│  GET /api/admin/inventory/burndown → burndownMap        │
│                                                         │
│  ┌─ 클라이언트 계산 (신규) ─────────────────────────┐   │
│  │ computeTodayUsage(txs, items)                     │   │
│  │  → todayUsageSessions: UsageSession[]             │   │
│  │  → todayCategoryUsage: Map<Category, count>       │   │
│  │  → todayItemUsage: Map<itemId, qty>               │   │
│  │                                                    │   │
│  │ computeWeeklyUsage(txs)                           │   │
│  │  → weeklyItemUsage: Map<itemId, number[7]>        │   │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─ overview/page.tsx ────────────────────────────────────┐
│                                                         │
│  ┌─ DashboardStatsCards ─────────────────────────────┐ │
│  │  items, todayCategoryUsage, alertItems             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ TodayUsageSummary (stock 탭) ────────────────────┐ │
│  │  todayUsageSessions, items, transactions           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ CategoryGrid ────────────────────────────────────┐ │
│  │  items, todayCategoryUsage, weeklyItemUsage        │ │
│  │  └─ CategoryCard (todayUsageCount, sparkline)      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ CategoryDetailSection ───────────────────────────┐ │
│  │  items, txs, burndownMap, todayItemUsage           │ │
│  │  └─ StockCardView (todayItemUsage, burndownMap)    │ │
│  │  └─ DetailPanel (txs)                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ HistoryTab ──────────────────────────────────────┐ │
│  │  transactions, items, consumptionData              │ │
│  │  └─ UsageHeatmap (transactions)                    │ │
│  │  └─ DonutChart (consumptionData)                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ RestockTab ──────────────────────────────────────┐ │
│  │  alertItems, burndownMap, transactions             │ │
│  │  └─ RestockCard + CountdownBar                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 5. 구현 순서

```
Phase 0: 유틸 추출
  └─ usage-session-utils.ts 생성 (DailyUsageLog에서 함수 추출)
  └─ DailyUsageLog.tsx import 변경

Phase 1: 데이터 레이어 (FR-08)
  └─ useInventoryData.ts 확장 (todayUsage*, weeklyItemUsage)

Phase 2: 오늘의 사용 기록 연동 (FR-03)
  └─ TodayUsageSummary.tsx 생성
  └─ overview/page.tsx에 TodayUsageSummary 통합

Phase 3: 대시보드 카드 (FR-01)
  └─ DashboardStatsCards.tsx 생성
  └─ overview/page.tsx에서 CompactStatsBar → DashboardStatsCards 교체

Phase 4: 카테고리 카드 강화 (FR-02)
  └─ CategoryCard.tsx에 스파크라인 + 오늘 사용 뱃지
  └─ CategoryGrid.tsx props 전달

Phase 5: 품목 사용 인사이트 (FR-04)
  └─ CategoryDetailSection.tsx + StockCardView.tsx 수정

Phase 6: 사용 이력 시각화 (FR-05)
  └─ HistoryTab.tsx에 UsageHeatmap + DonutChart 적용

Phase 7: 입고 관리 개선 (FR-06)
  └─ RestockTab.tsx에 CountdownBar + 일괄 발주

Phase 8: 네비게이션 (FR-07)
  └─ KioskView.tsx에 재고 현황 링크
  └─ TodayUsageSummary 빈 상태에 키오스크 링크
```

## 6. 디자인 가이드라인

### 색상 시스템 (기존 준수)

| 용도 | 색상 | 값 |
|------|------|-----|
| Primary | 더스티 로즈 | `#b4988d` |
| Heading | 다크 브라운 | `#6d4e42` |
| Body | 차콜 | `#575756` |
| Muted | 라이트 그레이 | `#a09080` |
| BG | 오프화이트 | `#faf8f7`, `#f6f4f2` |
| Border | 라이트 | `#ebe7e4`, `#f0eeec` |
| Normal | 에메랄드 | `#34d399` / `#059669` |
| Warning | 앰버 | `#f59e0b` / `#d97706` |
| Danger | 레드 | `#ef4444` / `#dc2626` |

### 스파크라인 색상

| 카테고리 | 색상 |
|---------|------|
| device_tip | `#8b5cf6` |
| injection | `#3b82f6` |
| thread | `#f59e0b` |
| consumable | `#6b7280` |
| skincare | `#ec4899` |
| medicine | `#10b981` |
| cosmetics | `#f472b6` |

### 애니메이션

| 요소 | 효과 |
|------|------|
| 스파크라인 | `stroke-dasharray` 애니메이션 (진입 시) |
| 도넛 차트 | `strokeDashoffset` transition 700ms |
| 카운트다운 바 | width transition 500ms ease-out |
| pulse 효과 | `animate-pulse` (위험 상태만) |
| 아코디언 | max-height + opacity transition 200ms |

### 반응형 브레이크포인트

| 요소 | Mobile (<768) | Tablet (768-1024) | Desktop (1024+) |
|------|--------------|------------------|-----------------|
| DashboardStatsCards | 2열 그리드 | 4열 그리드 | 4열 그리드 |
| TodayUsageSummary | 전체 폭, 간호사 숨김 | 전체 폭 | 전체 폭 |
| CategoryGrid | 1열 | 2열 | 3열 |
| UsageHeatmap | 숨김 | 표시 | 표시 |
| DonutChart | 축소 (100px) | 기본 (140px) | 기본 (140px) |

## 7. 재사용 컴포넌트 목록

기존 `StockGauge.tsx`에서 재사용:
- `ProgressBar` → DashboardStatsCards 정상 재고 진행바
- `DonutChart` → HistoryTab TOP 10
- `MiniBar` → HistoryTab 순위 리스트 (도넛 차트 우측)

## 8. 테스트 체크리스트

- [ ] 키오스크에서 물품 차감 → overview 새로고침 시 TodayUsageSummary에 표시
- [ ] DashboardStatsCards 4개 카드 값이 정확한 집계인지 확인
- [ ] CategoryCard 스파크라인이 7일 데이터 반영
- [ ] CategoryCard "오늘 N건 사용"이 정확한 카운트
- [ ] StockCardView "오늘 N개 사용" 뱃지 정확성
- [ ] TodayUsageSummary 아코디언 펼침 시 품목 리스트 표시
- [ ] HistoryTab 히트맵이 시간대별 데이터 반영
- [ ] HistoryTab 도넛 차트 세그먼트와 순위 리스트 일치
- [ ] RestockTab 카운트다운 바 D-N 정확성
- [ ] KioskView → overview 링크 정상 동작
- [ ] TodayUsageSummary → kiosk 링크 정상 동작
- [ ] 모바일 반응형 레이아웃 정상 표시
- [ ] DailyUsageLog 기존 기능 정상 동작 (유틸 추출 후)
