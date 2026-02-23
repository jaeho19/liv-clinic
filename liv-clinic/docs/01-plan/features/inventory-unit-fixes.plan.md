# Plan: 재고 단위 및 키오스크 수정 (inventory-unit-fixes)

> **Feature**: inventory-unit-fixes
> **Created**: 2026-02-23
> **Status**: Plan

## 1. 요구사항 요약

간호팀 수정 요청 5건:

| # | 항목 | 현재 | 변경 | 영향 범위 |
|---|------|------|------|-----------|
| 1 | 쥬비덤 (4종) | unit='시린지' | unit='바이알' | DB `inventory_items` |
| 2 | 보톡스 유닛 표기 | specification='-' | 제오민/제테마더: '100u', 하이톡스: '200u', 앨러간: '50u' | DB `inventory_items` |
| 3 | 쥬베룩 볼륨/스킨 (2종) | unit='시린지' | unit='바이알' | DB `inventory_items` |
| 4 | 큐티셀 블랙 오리진 | unit='시린지' | unit='바이알' | DB `inventory_items` |
| 5 | 써마지 팁 선택창 미표시 | 옵션 선택 UI 안 뜸 | 정상 표시되도록 수정 | KioskView.tsx |

## 2. 기술 분석

### 2.1 단위/규격 변경 (항목 1~4)

- **대상 테이블**: `inventory_items`
- **변경 필드**: `unit` (단위), `specification` (규격)
- **방법**: Supabase SQL 마이그레이션 (UPDATE)
- **시드 데이터 파일**: `003_inventory_seed.sql` (참조용, 실DB는 마이그레이션으로 변경)

#### 변경 대상 상세:

**1) 쥬비덤 단위 변경 (시린지 → 바이알)**
```sql
UPDATE inventory_items SET unit = '바이알'
WHERE sub_category = 'filler_juvederm';
-- 대상: 쥬비덤 볼벨라, 볼루마, 볼리프트, 볼룩스
```

**2) 보톡스 규격(유닛) 추가**
```sql
UPDATE inventory_items SET specification = '100u' WHERE name = '제오민';
UPDATE inventory_items SET specification = '100u' WHERE name = '제테마더톡신주';
UPDATE inventory_items SET specification = '200u' WHERE name = '하이톡스';
UPDATE inventory_items SET specification = '50u' WHERE name = '앨러간';
```

**3) 쥬베룩 단위 변경 (시린지 → 바이알)**
```sql
UPDATE inventory_items SET unit = '바이알'
WHERE name IN ('쥬베룩 볼륨', '쥬베룩 스킨부스터');
```

**4) 큐티셀 블랙 오리진 단위 변경 (시린지 → 바이알)**
```sql
UPDATE inventory_items SET unit = '바이알' WHERE name = '큐티셀 블랙 오리진';
```

### 2.2 써마지 팁 선택창 미표시 (항목 5)

**현재 문제 분석:**
- `KioskView.tsx` line 252: 써마지(`thermage`)는 `options.length > 0` (4개 옵션)
- line 257-260: options가 있으면 옵션 선택 대기 → `usageItems`를 비움
- line 446: 옵션 표시 조건 = `selectedType && group.procedures.some(p => p.id === selectedType.id) && selectedType.options.length > 0`
- line 454: 개별 옵션 `hasRecipe` = `DEVICE_PROCEDURE_IDS.includes(selectedType.id) || recipes.some(...)`
- **`DEVICE_PROCEDURE_IDS`에 'thermage' 미포함** → 옵션 활성화가 순수하게 recipe 매칭에 의존
- DB에 '써마지 FLX 400', '써마지 FLX 600', '써마지 FLX 900', '아이써마지' 레시피 존재 → 이론적으로 매칭 가능

**가능한 원인:**
1. 써마지 버튼 자체가 `hasAnyRecipe=false`로 disabled됨 (recipe 이름 불일치)
2. 옵션 렌더링은 되지만 disabled 상태
3. 그룹 매칭 문제 (다른 카테고리 그룹 내 표시 조건)

**해결 방안:**
- 써마지 옵션 선택 UI가 정상 표시되는지 디버깅 및 수정
- 필요 시 써마지 레시피 이름과 PROCEDURE_CATALOG 옵션의 recipeName 일치 확인

## 3. 구현 계획

### Phase 1: DB 마이그레이션 작성
- 새 마이그레이션 파일: `024_inventory_unit_fixes.sql`
- 항목 1~4의 UPDATE 쿼리 작성
- Supabase에 적용

### Phase 2: 써마지 팁 선택창 버그 수정
- KioskView.tsx에서 써마지 옵션 표시 로직 디버깅
- 필요 시 써마지를 위한 예외 처리 또는 레시피 매칭 수정

### Phase 3: 시드 데이터 업데이트 (선택)
- `003_inventory_seed.sql` 초기값도 업데이트 (향후 재설치 대비)

## 4. 영향 분석

- **UI 변경**: 재고 현황(overview), 키오스크(KioskView) 물품 목록에서 단위 표기 변경됨
- **기존 사용 기록**: `inventory_usage_logs`의 과거 데이터는 영향 없음 (단위는 item에서 조회)
- **위험도**: 낮음 (단순 UPDATE, UI 로직 수정)
