# Plan: 화장품 재고 키오스크 (cosmetics-kiosk)

> **Feature**: cosmetics-kiosk
> **Created**: 2026-02-14
> **Status**: Plan
> **Priority**: High

---

## 1. 요구사항 요약

화장품 재고를 기존 시술 물품 사용 기록(KioskView)과 동일한 **키오스크 방식**으로 관리한다.
화장품을 사용(출고)하면 재고에서 차감되며, Step-by-step UI로 직관적으로 조작한다.

### 초기 재고 (기준값)

| 제품명 | 용량 | 초기재고 | 서브카테고리 |
|--------|------|----------|-------------|
| 마데카MD 로션 | 100g | 15 | lotion |
| 마데카MD 로션 | 200g | 19 | lotion |
| 마데카MD 크림 | 250g | 20 | cream |
| EGF 재생크림 | 50ml | 17 | cream |
| 베리덤 쉴드 MD크림 | 35g | 11 | cream |
| 베리덤 쉴드 MD크림 | 80g | 19 | cream |
| 하라셀 수분 Set | - | 3 | set |
| 하라셀 프리미엄 Set | - | 4 | set |
| 시트팩 증정용 | - | 180 | mask |

---

## 2. 현재 구조 분석

### 기존 키오스크 (KioskView.tsx) 흐름
```
Step 1: 시술 카테고리 선택 (리프팅/안티에이징/스킨부스터)
Step 2: 시술 옵션 선택 (예: 울쎄라 전안면+목)
  → 레시피 매핑 → 자동으로 사용 물품 로드
Step 3: 수량 조정 + 환자 정보 입력
Step 4: 차감 완료 (POST /api/admin/inventory/use)
```

### 화장품 키오스크와의 차이점
- 시술 → 레시피 → 물품 매핑이 **불필요** (화장품은 직접 선택)
- 환자 정보 대신 **사용 목적/메모** 정도면 충분
- 서브카테고리별 그룹핑 (로션/크림/세트/마스크팩)

---

## 3. 구현 방안

### 3.1 UI: CosmeticsKioskView 컴포넌트

기존 `KioskView.tsx`와 **동일한 2컬럼 레이아웃**, 동일한 페이지(`/admin/inventory`)에 **탭 전환**으로 통합.

```
┌─────────────────────────────────────────────────┐
│  [시술 물품 사용] [화장품 사용]  ← 탭 전환       │
├──────────────────┬──────────────────────────────┤
│ (Left 40%)       │ (Right 60%)                  │
│                  │                              │
│ Step 1:          │ Step 2: 사용 물품             │
│ 서브카테고리 선택 │                              │
│ ┌──────────────┐ │ ┌──────────────────────────┐ │
│ │ 🧴 로션      │ │ │ 마데카MD 로션 100g       │ │
│ │ 🧴 크림      │ │ │ 재고: 15   수량: [- 1 +] │ │
│ │ 📦 세트      │ │ │                          │ │
│ │ 🎭 마스크팩  │ │ │ 마데카MD 로션 200g       │ │
│ └──────────────┘ │ │ 재고: 19   수량: [- 0 +] │ │
│                  │ └──────────────────────────┘ │
│                  │                              │
│                  │ 메모: [____________]          │
│                  │ 담당: [김수정] [김지연]       │
│                  │                              │
│                  │ [차감 완료]                   │
├──────────────────┴──────────────────────────────┤
│ 오늘의 화장품 사용 기록                          │
│ 14:30  로션 외 2건  담당: 김수정                 │
│ 10:15  크림 1건     담당: 김지연                 │
└─────────────────────────────────────────────────┘
```

**Step-by-step 흐름:**

1. **Step 1**: 서브카테고리 선택 (로션 / 크림 / 세트 / 마스크팩)
   - 선택하면 해당 카테고리의 화장품 목록이 오른쪽에 표시
   - "전체" 옵션도 제공 (모든 화장품 한눈에)
2. **Step 2**: 수량 조정 (+/- 버튼)
   - 재고 부족 시 빨간 하이라이트 (기존 KioskView와 동일)
3. **Step 3**: 메모(선택) + 담당자 선택 → 차감 완료

### 3.2 데이터: 초기 재고 시딩

Supabase DB에 화장품 아이템 9개를 **inventory_items 테이블**에 INSERT.
- `category`: `'cosmetics'`
- `sub_category`: `'lotion'` | `'cream'` | `'set'` | `'mask'`
- `current_stock`: 위 표의 초기재고 값
- `is_active`: `true`

**방법**: Admin API(`POST /api/admin/inventory`)를 활용하거나, SQL migration 스크립트 작성.

### 3.3 API: 기존 엔드포인트 재사용

| 기능 | API | 비고 |
|------|-----|------|
| 화장품 목록 조회 | `GET /api/admin/inventory?category=cosmetics` | 기존 그대로 |
| 차감 | `POST /api/admin/inventory/use` | 기존 그대로 |
| 입고 | `POST /api/admin/inventory/restock` | 기존 그대로 |
| 사용 이력 | `GET /api/admin/inventory/transactions` | 기존 그대로 |

> **핵심**: 새로운 API 엔드포인트 불필요. 기존 인프라 100% 재사용.

### 3.4 사이드바 네비게이션

현재 사이드바:
```
재고관리
  - 물품 사용 기록 (/admin/inventory)       ← 여기에 탭 추가
  - 재고 현황 (/admin/inventory/overview)
```

**변경 없음** — `/admin/inventory` 페이지 내에서 탭으로 전환.

---

## 4. 구현 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/components/admin/inventory/CosmeticsKioskView.tsx` | **신규** | 화장품 키오스크 컴포넌트 |
| `src/app/admin/(authenticated)/inventory/page.tsx` | **수정** | 탭 전환 (시술 / 화장품) 추가 |
| `seed-cosmetics.ts` (또는 SQL) | **신규** | 초기 화장품 데이터 시딩 스크립트 |

### 수정 불필요한 파일
- API 라우트: 전부 기존 그대로
- `useInventoryData.ts`: 기존 그대로 (category 필터 지원됨)
- `types/admin.ts`: cosmetics 카테고리 이미 정의됨
- `DailyUsageLog.tsx`: note 필드로 구분 가능
- `AdminSidebar.tsx`: 변경 없음

---

## 5. 구현 순서

1. **DB 시딩**: 화장품 9개 아이템을 inventory_items 테이블에 INSERT
2. **CosmeticsKioskView 컴포넌트 작성**: 서브카테고리 선택 → 수량 조정 → 차감
3. **inventory/page.tsx 수정**: 탭 전환 UI 추가 (시술 물품 / 화장품)
4. **테스트**: 화장품 차감 동작 확인

---

## 6. 리스크 & 고려사항

| 항목 | 내용 |
|------|------|
| DB 시딩 | Supabase에 직접 INSERT 필요. Admin API POST로 가능 |
| 재고 동기화 | 기존 RPC `use_inventory_item` 그대로 사용하므로 문제 없음 |
| 기존 overview 연동 | overview 페이지의 화장품 필터가 이미 작동 중 → 자동 연동 |
| DailyUsageLog | note에 "화장품: 로션 외 2건" 형태로 기록하여 구분 |

---

## 7. 성공 기준

- [ ] 화장품 9개 아이템이 DB에 등록되어 있음
- [ ] `/admin/inventory`에서 탭으로 화장품 키오스크 전환 가능
- [ ] 서브카테고리(로션/크림/세트/마스크팩) 선택 → 제품 표시
- [ ] 수량 +/- 조정 후 차감 완료 시 재고 감소
- [ ] `/admin/inventory/overview`에서 화장품 재고 확인 가능
- [ ] 오늘의 사용 기록에 화장품 차감 내역 표시
