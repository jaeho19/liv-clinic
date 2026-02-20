# Plan: nurse-request-round2

> 간호팀 2차 수정요청 — 예상소진 UI 삭제 + 마데카MD 수량 수정 + 긴급소진 UX 개선

## 1. 개요

### 배경
간호팀에서 관리자 페이지에 대한 추가 수정요청이 접수됨. 요청서의 항목 #1~#7은 이전 작업(`admin-nurse-requests-foundation`, `shot-tracking-system`)에서 이미 구현 완료(96% match rate). 이번 Plan은 **미처리 항목**과 **신규 요청**만을 대상으로 함.

### 목표
1. "예상 소진" UI 및 관련 계산 로직 **완전 삭제**
2. 마데카MD 로션 재고 수량 **데이터 정정**
3. 긴급소진 카드 클릭 시 **직접 필터링 UX 개선**
4. 슈링크 팁 기본값 중 **미확인 항목 검증** (1.5팁, V슈링크, S슈링크)

### 범위
- **포함**: 예상소진 UI/로직 제거, DB 데이터 수정, 긴급소진 UX
- **제외**: 이미 완료된 항목 #1~#7 (팁 변경, 샷 차감, 단위 변경, 레시피 수정 등)

## 2. 이전 작업 상태 (참고)

| 요청서 항목 | 내용 | 상태 |
|-------------|------|------|
| #1 울쎄라 팁 변경 + 샷 차감 | 1.5/3.0/4.5팁, 2400샷 | ✅ 완료 |
| #2 슈링크 팁 변경 + 샷 차감 | 6종 팁, 장비별 초기샷 | ✅ 완료 |
| #3 보톡스 니들 삭제 | procedure_recipes에서 제거 | ✅ 완료 |
| #4 슈링크 샷 기준값 | 4.5→20000, 3.0→12000, 2.0→15000 등 | ✅ 완료 (일부 확인 필요) |
| #5 쥬베룩 단위 변경 | 시린지→바이알 | ✅ 완료 |
| #6 써마지 소모품 추가 | 패치/플루이드/가스 | ✅ 완료 |
| #7 스컬트라 변경 | 주사용수 연동, 수액세트 단위 | ✅ 완료 |
| #8 긴급소진 UX | 직접 필터링 연결 | 🔧 검토 필요 |

## 3. 변경 항목 상세

### 3-1. "예상 소진" UI 및 로직 완전 삭제

**요청**: 예상 소진일, 일평균 사용량, 관련 모든 UI 요소 삭제

**영향 범위 (7개 파일)**:

| 파일 | 삭제 내용 |
|------|----------|
| `src/components/admin/inventory/StockCardView.tsx` | 예상 소진 뱃지 (L140-152), 일평균 표시 |
| `src/components/admin/inventory/StockTableView.tsx` | 예상 소진 컬럼 (L46), 일평균 컬럼 (L47), 해당 셀 렌더링 |
| `src/components/admin/inventory/StockDashboard.tsx` | burndown 관련 props 전달 제거 |
| `src/components/admin/inventory/CategoryDetailSection.tsx` | burndownMap prop 전달 제거 |
| `src/components/admin/inventory/RestockTab.tsx` | "약 N일 뒤 소진 예상" 텍스트 제거 |
| `src/hooks/useInventoryData.ts` | burndownMap 계산 로직 제거 |
| `src/lib/inventory-utils.ts` | `calculateBurndown()`, `BurndownResult`, `BURNDOWN_SEVERITY_CONFIG` 제거 |
| `src/app/admin/(authenticated)/inventory/overview/page.tsx` | burndownMap 관련 전달 코드 제거 |

**삭제 범위**:
- 프론트 UI: 예상 소진 뱃지, 일평균 표시, 소진 예상일 텍스트
- 계산 로직: `calculateBurndown()` 함수 및 타입
- Props 전달: burndownMap prop 체인 전체
- 테이블 컬럼: colSpan 조정 필요

**주의사항**:
- `BURNDOWN_SEVERITY_CONFIG` 중 `critical` severity는 DashboardStatsCards의 "긴급 소진" 카드에서도 사용될 수 있으므로 의존성 확인 필요
- `burndownMap`을 제거해도 `alertItems` (재고 부족 알림)은 별도 로직이므로 영향 없음

### 3-2. 마데카MD 로션 재고 수량 정정

**요청**: DB 재고 수량을 실제 수량으로 수정

| 품목 | 현재(오류) | 실제(정정) |
|------|-----------|-----------|
| 마데카MD 로션 200ml (200g) | 14개 | **19개** |
| 마데카MD 로션 500ml (500g) | 18개 | **15개** |

**구현**:
- Supabase에서 직접 SQL 실행으로 `inventory_items.current_stock` 업데이트
- 또는 migration 파일로 기록 (감사 추적용)

```sql
-- 마데카MD 재고 수량 정정
UPDATE inventory_items SET current_stock = 19
WHERE name LIKE '%마데카%200%' OR name LIKE '%마데카%200g%';

UPDATE inventory_items SET current_stock = 15
WHERE name LIKE '%마데카%500%' OR name LIKE '%마데카%500g%';
```

**확인 사항**:
- `inventory_items` 테이블에서 정확한 name 값 조회 필요 (LIKE 패턴 확인)
- 수정 후 관리자 화면 원형 재고 표시 자동 동기화 확인

### 3-3. 긴급소진 UX 개선 (#8)

**현재 구현**: `DashboardStatsCards.tsx`에서 "긴급 소진" 카드 클릭 시:
1. `stockFilter` → `'out'` 설정 (재고 0 필터)
2. `onAlertClick()` → `'restock'` 탭으로 전환

**요청**: 중간 페이지 없이 해당 물품 목록으로 바로 연결

**현재 동작 분석**:
- 클릭 → restock 탭으로 이동하는데, 이것이 "중간 페이지"처럼 느껴질 수 있음
- 개선안: 클릭 시 현재 카테고리 뷰에서 바로 재고 부족 항목만 필터링하여 표시
- restock 탭 대신 현재 탭에서 `stockFilter='out'`만 적용하는 방식으로 변경

**구현 방안**:
- `onAlertClick()` 제거 또는 탭 전환 없이 필터만 적용
- 클릭 시 스크롤하여 필터링된 목록 영역으로 이동
- "필터 해제" 버튼으로 원래 뷰 복귀

### 3-4. 슈링크 팁 기본 샷 수 확인 (미정 항목)

요청서에서 아래 팁의 기본 샷 수가 명시되지 않음:
- 1.5팁 → 현재 `DEVICE_INITIAL_SHOTS`에 12,000으로 설정됨
- V슈링크 → 현재 15,000으로 설정됨
- S슈링크 → 현재 15,000으로 설정됨

**확인 필요**: 간호팀에 정확한 값 확인 후 수정 여부 결정

## 4. 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/inventory-utils.ts` | 수정 | burndown 관련 함수/타입/상수 삭제 |
| `src/hooks/useInventoryData.ts` | 수정 | burndownMap 계산 및 반환 제거 |
| `src/components/admin/inventory/StockCardView.tsx` | 수정 | 예상 소진 뱃지 + 일평균 표시 삭제 |
| `src/components/admin/inventory/StockTableView.tsx` | 수정 | 예상 소진/일평균 컬럼 삭제, colSpan 조정 |
| `src/components/admin/inventory/CategoryDetailSection.tsx` | 수정 | burndownMap prop 제거 |
| `src/components/admin/inventory/StockDashboard.tsx` | 수정 | burndown 관련 props 제거 |
| `src/components/admin/inventory/RestockTab.tsx` | 수정 | 소진 예상일 텍스트 제거 |
| `src/components/admin/inventory/DashboardStatsCards.tsx` | 수정 | 긴급소진 클릭 동작 개선 |
| `src/app/admin/(authenticated)/inventory/overview/page.tsx` | 수정 | burndownMap 전달 제거 |
| `supabase/migrations/022_madeca_stock_correction.sql` | 신규 | 마데카MD 수량 정정 |

## 5. 구현 순서

```
1. 마데카MD 수량 정정 (migration SQL)
   ↓
2. 예상 소진 UI 삭제 (StockCardView, StockTableView)
   ↓
3. burndown 로직 제거 (inventory-utils.ts, useInventoryData.ts)
   ↓
4. Props 체인 정리 (CategoryDetailSection, StockDashboard, overview/page.tsx, RestockTab)
   ↓
5. 긴급소진 UX 개선 (DashboardStatsCards.tsx)
   ↓
6. 빌드 확인 + 수동 테스트
```

## 6. 완료 기준

- [ ] "예상 소진", "일평균", burndown 관련 UI 완전 삭제됨
- [ ] `calculateBurndown()` 함수 및 `BurndownResult` 타입 삭제됨
- [ ] burndownMap prop 체인 전체 제거됨
- [ ] 마데카MD 200g → 19개, 500g → 15개로 수정됨
- [ ] 긴급소진 카드 클릭 시 현재 카테고리 뷰에서 바로 필터링됨
- [ ] `npm run build` 에러 없음
- [ ] 재고 현황 페이지 정상 렌더링 확인

## 7. 개발자 검토 사항

1. burndown 삭제 시 다른 통계/알림 기능 영향 없는지 확인
2. `alertItems` (재고 부족 알림)은 burndown과 별도 로직이므로 영향 없을 것으로 예상
3. 마데카MD 수량 수정은 수동 입력 기반인지 자동 차감 기반인지 확인 필요
4. 향후 자동 예측 기능 재도입 가능성이 있다면 `inventory-utils.ts` 파일은 유지하고 함수만 삭제
