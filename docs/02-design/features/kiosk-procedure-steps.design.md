# Design: 키오스크 시술 2단계 선택 + 일별 사용 기록

> Feature: `kiosk-procedure-steps`
> Plan: `docs/01-plan/features/kiosk-procedure-steps.plan.md`
> Created: 2026-02-14
> Status: Draft

---

## 1. 데이터 구조 설계

### 1-1. PROCEDURE_CATALOG (types/admin.ts에 추가)

```typescript
// ─── 시술 2단계 선택 체계 ─────────────────────
export type ProcedureCategoryId = 'lifting' | 'antiaging' | 'skinbooster';

export interface ProcedureOption {
  label: string;         // UI 표시 텍스트 ('600샷', '전안면')
  recipeName: string;    // procedure_recipes.procedure_name과 매칭
}

export interface ProcedureType {
  id: string;            // 고유 식별자 ('thermage', 'ulthera')
  name: string;          // 표시명 ('써마지 FLX', '울쎄라 프라임')
  category: ProcedureCategoryId;
  options: ProcedureOption[];  // 빈 배열 = 직접 매칭 (name이 곧 recipeName)
}

export const PROCEDURE_CATEGORY_LABELS: Record<ProcedureCategoryId, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  skinbooster: '스킨부스터/기타',
};

export const PROCEDURE_CATALOG: ProcedureType[] = [
  // ─── 리프팅 ─────────────────
  {
    id: 'ulthera',
    name: '울쎄라 프라임',
    category: 'lifting',
    options: [
      { label: '상안면', recipeName: '울쎄라 상안면' },
      { label: '하안면', recipeName: '울쎄라 하안면' },
      { label: '전안면', recipeName: '울쎄라 전안면' },
      { label: '전안면+목', recipeName: '울쎄라 전안면+목' },
    ],
  },
  {
    id: 'thermage',
    name: '써마지 FLX',
    category: 'lifting',
    options: [
      { label: '225샷 (눈가)', recipeName: '아이써마지' },
      { label: '400샷', recipeName: '써마지 FLX 400' },
      { label: '600샷', recipeName: '써마지 FLX 600' },
      { label: '900샷', recipeName: '써마지 FLX 900' },
    ],
  },
  {
    id: 'density',
    name: '덴서티',
    category: 'lifting',
    options: [],  // 옵션 없음 → name으로 직접 매칭
  },
  {
    id: 'shurink',
    name: '슈링크 유니버스',
    category: 'lifting',
    options: [
      { label: '1.5mm', recipeName: '슈링크 1.5mm' },
      { label: '3.0mm', recipeName: '슈링크 3.0mm' },
      { label: '4.5mm', recipeName: '슈링크 4.5mm' },
      { label: '6.0/9.0mm', recipeName: '슈링크 6.0mm' },
    ],
  },
  {
    id: 'inmode_forma',
    name: '인모드 포르마',
    category: 'lifting',
    options: [],
  },
  {
    id: 'inmode_morpheus',
    name: '인모드 모피어스8',
    category: 'lifting',
    options: [],
  },
  {
    id: 'thread',
    name: '실리프팅',
    category: 'lifting',
    options: [
      { label: 'PDO', recipeName: '실리프팅 PDO' },
      { label: 'PLLA', recipeName: '실리프팅 PLLA' },
      { label: 'PCL', recipeName: '실리프팅 PCL' },
      { label: 'APTOS', recipeName: '실리프팅 APTOS' },
    ],
  },

  // ─── 안티에이징 ─────────────
  {
    id: 'botox_xeomin',
    name: '보톡스 (제오민)',
    category: 'antiaging',
    options: [],  // 기존 '보톡스 시술 (제오민)' 매칭
  },
  {
    id: 'botox_hutox',
    name: '보톡스 (하이톡스)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'botox_jetema',
    name: '보톡스 (제테마더)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'filler_volbella',
    name: '필러 (볼벨라)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'filler_voluma',
    name: '필러 (볼루마)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'filler_volift',
    name: '필러 (볼리프트)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'filler_volux',
    name: '필러 (볼룩스)',
    category: 'antiaging',
    options: [],
  },

  // ─── 스킨부스터/기타 ────────
  {
    id: 'rejuran_hb',
    name: '리쥬란 HB',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'rejuran_healer',
    name: '리쥬란 힐러',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'rejuran_eye',
    name: '리쥬란 아이',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'sculptra',
    name: '스컬트라',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'juvelook_volume',
    name: '쥬베룩 볼륨',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'juvelook_skin',
    name: '쥬베룩 스킨부스터',
    category: 'skinbooster',
    options: [],
  },
];
```

### 1-2. Recipe 매칭 로직

```typescript
// KioskView 내 헬퍼 함수
function getRecipeName(procedure: ProcedureType, option?: ProcedureOption): string {
  // 옵션이 있으면 옵션의 recipeName 사용
  if (option) return option.recipeName;
  // 옵션이 없으면(options=[]) 기존 PROCEDURE_NAMES에서 매칭 시도
  // name 기반으로 fuzzy 매칭 or 직접 매핑 테이블 사용
  return PROCEDURE_RECIPE_MAP[procedure.id] ?? procedure.name;
}

// 기존 PROCEDURE_NAMES와의 매핑 (하위 호환)
const PROCEDURE_RECIPE_MAP: Record<string, string> = {
  density: '덴서티',
  inmode_forma: '인모드 포르마',
  inmode_morpheus: '인모드 모피어스8',
  botox_xeomin: '보톡스 시술 (제오민)',
  botox_hutox: '보톡스 시술 (하이톡스)',
  botox_jetema: '보톡스 시술 (제테마더)',
  filler_volbella: '필러 시술 (볼벨라)',
  filler_voluma: '필러 시술 (볼루마)',
  filler_volift: '필러 시술 (볼리프트)',
  filler_volux: '필러 시술 (볼룩스)',
  rejuran_hb: '리쥬란 HB 시술',
  rejuran_healer: '리쥬란 힐러 시술',
  rejuran_eye: '리쥬란 아이 시술',
  sculptra: '스컬트라 시술',
  juvelook_volume: '쥬베룩 볼륨 시술',
  juvelook_skin: '쥬베룩 스킨부스터 시술',
};
```

> **핵심**: 기존 DB의 `procedure_recipes.procedure_name`을 변경하지 않음. `PROCEDURE_RECIPE_MAP`으로 새 ID와 기존 recipe name을 연결.

---

## 2. 컴포넌트 설계

### 2-1. KioskView.tsx (수정)

#### State 변경

```typescript
// 기존
const [selectedProcedure, setSelectedProcedure] = useState('');

// 변경
const [selectedType, setSelectedType] = useState<ProcedureType | null>(null);
const [selectedOption, setSelectedOption] = useState<ProcedureOption | null>(null);
// selectedProcedure(string)은 제거. recipeName은 selectedType+selectedOption에서 도출
```

#### 좌측 패널 UI 흐름

```
┌─────────────────────────────────────┐
│ 시술 선택                            │
│ 시술을 탭하면 물품이 자동으로 로드됩니다 │
├─────────────────────────────────────┤
│                                     │
│ 리프팅                               │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ 울쎄라 프라임 │ │ ★써마지 FLX │    │  ← 1단계: 시술 선택
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ 덴서티       │ │ 슈링크 유니버스│   │
│ └─────────────┘ └─────────────┘    │
│                                     │
│ ┌ 써마지 FLX 옵션 ────────────────┐ │  ← 2단계: 옵션 pill
│ │ [225샷] [400샷] [★600샷] [900샷]│ │     (인라인, 선택 시술 바로 아래)
│ └─────────────────────────────────┘ │
│                                     │
│ 안티에이징                           │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ 보톡스(제오민)│ │ 필러(볼벨라) │   │
│ └─────────────┘ └─────────────┘    │
│ ...                                 │
└─────────────────────────────────────┘
```

#### 선택 로직 pseudo-code

```typescript
function handleSelectType(proc: ProcedureType) {
  if (selectedType?.id === proc.id) {
    // 같은 시술 다시 클릭 → 선택 해제
    setSelectedType(null);
    setSelectedOption(null);
    setUsageItems([]);
    return;
  }

  setSelectedType(proc);
  setSelectedOption(null);

  if (proc.options.length === 0) {
    // 옵션 없는 시술 → 바로 물품 로드
    const recipeName = PROCEDURE_RECIPE_MAP[proc.id] ?? proc.name;
    loadRecipeItems(recipeName);
  } else {
    // 옵션 있는 시술 → 물품 초기화, 2단계 대기
    setUsageItems([]);
  }
}

function handleSelectOption(option: ProcedureOption) {
  setSelectedOption(option);
  loadRecipeItems(option.recipeName);
}

function loadRecipeItems(recipeName: string) {
  const recipeItems = recipes
    .filter(r => r.procedure_name === recipeName)
    .map(r => {
      const item = items.find(i => i.id === r.item_id);
      return { itemId: r.item_id, itemName: item?.name || r.item_id, ... };
    });
  setUsageItems(recipeItems);
}
```

#### 우측 패널 헤더 변경

```typescript
// 기존: selectedProcedure || '사용 물품'
// 변경:
const displayName = selectedType
  ? selectedOption
    ? `${selectedType.name} - ${selectedOption.label}`  // "써마지 FLX - 600샷"
    : selectedType.name                                  // "덴서티"
  : '사용 물품';
```

#### Submit 시 note 변경

```typescript
// 기존: note: `키오스크: ${selectedProcedure}`
// 변경:
const procedureLabel = selectedOption
  ? `${selectedType!.name} ${selectedOption.label}`  // "써마지 FLX 600샷"
  : selectedType!.name;                               // "덴서티"
note: `키오스크: ${procedureLabel}`;
```

### 2-2. DailyUsageLog.tsx (신규)

#### Props

```typescript
interface DailyUsageLogProps {
  onRefreshNeeded?: () => void;  // 부모에게 데이터 리프레시 요청 (optional)
}
```

#### 자체 데이터 fetch

```typescript
// 당일 트랜잭션만 독립 fetch (키오스크 데이터와 분리)
const today = new Date().toISOString().split('T')[0]; // '2026-02-14'
const url = `/api/admin/inventory/transactions?type=use&dateFrom=${today}&dateTo=${today}&limit=50`;
```

#### UI 구조

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 오늘의 사용 기록 (2/14 금)                              5건   │
├──────────────────────────────────────────────────────────────────┤
│ 14:30  써마지 FLX 600샷  홍길동  차트#1234  김수정   3개 품목    │
│ 13:15  울쎄라 전안면      김철수  차트#5678  김지연   5개 품목    │
│ 11:00  보톡스 (제오민)    이영희  차트#9012  김수정   2개 품목    │
│ ...                                                              │
├──────────────────────────────────────────────────────────────────┤
│ 기록이 없으면: "오늘 사용 기록이 아직 없습니다"                    │
└──────────────────────────────────────────────────────────────────┘
```

#### 그룹핑 로직

같은 시점(created_at이 수 초 내)에 생성된 트랜잭션은 하나의 "시술 세션"으로 그룹핑:

```typescript
interface UsageSession {
  timestamp: string;      // created_at (가장 빠른 것)
  procedureLabel: string; // note에서 "키오스크: " 제거한 값
  patientName: string;
  chartNumber: string;
  confirmedBy: string;
  itemCount: number;      // 그룹 내 트랜잭션 수
  transactions: InventoryTransaction[];
}

function groupTransactionsIntoSessions(txs: InventoryTransaction[]): UsageSession[] {
  // 1. created_at 기준 정렬 (내림차순)
  // 2. 동일 patient_name + 10초 이내 → 같은 세션
  // 3. 각 세션에서 note의 "키오스크: " 접두어 제거하여 procedureLabel 추출
}
```

#### 자동 갱신 메커니즘

```typescript
// 1. 초기 로드 시 fetch
// 2. refetchKey prop이 변경되면 re-fetch (부모가 차감 성공 후 key 증가)
// 3. 자정 감지: 1분마다 날짜 체크, 날짜 변경 시 자동 re-fetch

interface DailyUsageLogProps {
  refetchKey: number;  // 부모가 차감 성공 시 +1
}
```

### 2-3. 파일 구조 요약

```
src/
├── types/admin.ts
│   ├── PROCEDURE_CATALOG (추가)
│   ├── PROCEDURE_RECIPE_MAP (추가)
│   ├── ProcedureType, ProcedureOption (추가)
│   └── PROCEDURE_NAMES (유지 - 하위 호환)
│
├── components/admin/inventory/
│   ├── KioskView.tsx (수정)
│   │   ├── state: selectedType, selectedOption
│   │   ├── 좌측: 카테고리 → 시술 → 옵션(pill) 2단계
│   │   ├── 우측: 물품 + 차감 (기존 유지)
│   │   └── 하단: <DailyUsageLog refetchKey={...} />
│   │
│   └── DailyUsageLog.tsx (신규)
│       ├── 자체 fetch (당일 transactions)
│       ├── 세션 그룹핑
│       └── 자정 자동 갱신
│
└── hooks/useInventoryData.ts (변경 없음)
```

---

## 3. API 설계

### 변경 없음

| API | 용도 | 비고 |
|-----|------|------|
| `POST /api/admin/inventory/use` | 물품 사용 차감 | body 변경 없음 |
| `GET /api/admin/inventory/transactions` | 이력 조회 | `?type=use&dateFrom=...&dateTo=...` 기존 지원 |
| `GET /api/admin/inventory/recipes` | 레시피 조회 | 변경 없음 |

### DB 변경 없음

- `inventory_items` 테이블: 변경 없음
- `inventory_transactions` 테이블: 변경 없음 (일별 로그는 기존 데이터로 조회)
- `procedure_recipes` 테이블: 변경 없음 (새 옵션의 recipe는 관리자가 등록)

> **참고**: 울쎄라 부위별, 슈링크 카트리지별 등 신규 옵션의 recipe가 DB에 없을 수 있음. 이 경우 해당 옵션은 "레시피 미등록" 상태로 비활성화됨 (기존 로직과 동일).

---

## 4. 구현 순서

| 순서 | 작업 | 파일 | 예상 규모 |
|------|------|------|-----------|
| 1 | `PROCEDURE_CATALOG`, `PROCEDURE_RECIPE_MAP` 상수 추가 | `types/admin.ts` | +80줄 |
| 2 | `DailyUsageLog.tsx` 컴포넌트 생성 | `components/admin/inventory/` | +120줄 |
| 3 | `KioskView.tsx` 2단계 선택 + 하단 로그 통합 | `components/admin/inventory/` | ~100줄 변경 |
| 4 | 빌드 검증 | `npm run build` | - |

---

## 5. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|-----------|
| 옵션이 있는 시술에서 옵션 미선택 상태 | 우측 패널에 "옵션을 선택하세요" 안내 |
| 새 옵션의 recipe가 DB에 없음 | 옵션 pill 비활성화 + "(미등록)" 표시 |
| 당일 사용 기록 0건 | "오늘 사용 기록이 아직 없습니다" 빈 상태 |
| 자정 넘김 | 1분 간격 타이머로 날짜 변경 감지 → 자동 re-fetch |
| 같은 시술 연속 클릭 | 토글 (선택 해제) |
| 모바일 (768px 이하) | 좌측/우측 세로 스택, 하단 로그 접기/펼치기 |

---

## 6. 디자인 토큰 (기존 시스템 준수)

| 요소 | 값 |
|------|-----|
| 카드 배경 | `bg-white`, `border border-[#ebe7e4]` |
| 선택된 시술 | `bg-[#6d4e42] text-white` |
| 옵션 pill (기본) | `bg-[#f6f4f2] text-[#575756] rounded-full px-3 py-1.5` |
| 옵션 pill (선택) | `bg-[#6d4e42] text-white rounded-full` |
| 옵션 pill (미등록) | `opacity-40 cursor-not-allowed` |
| 로그 행 | `bg-[#faf8f7] rounded-lg p-3` |
| 로그 시간 | `text-[#b4988d] font-mono text-xs` |
| 로그 시술명 | `text-[#6d4e42] font-bold text-sm` |
| 로그 환자명/간호사 | `text-[#a09080] text-xs` |
