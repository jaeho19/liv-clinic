# Plan: 재고 관리 시스템 데이터 수정

> Feature: `inventory-data-corrections`
> Created: 2026-02-14
> Status: Draft

## 1. 개요

LIV Clinic 재고 관리 시스템(`/admin/inventory`)의 화장품 사용 기록 기능과 시술물품 사용 기록 기능에서 3가지 데이터 수정을 수행합니다.

## 2. 수정 항목

### 2.1 화장품 담당자 옵션 수정

| 항목 | 내용 |
|------|------|
| **대상 파일** | `src/types/admin.ts:205` |
| **현재 값** | `['김수정', '김지연']` |
| **변경 값** | `['최이연', '김태희']` |
| **영향 범위** | `NURSE_OPTIONS` 상수는 2개 컴포넌트에서 import |

**사용처 (2곳):**
- `CosmeticsKioskView.tsx:323` — 화장품 키오스크 담당 선택 버튼
- `KioskView.tsx:488` — 시술물품 키오스크 간호사 선택 버튼

**참고:** `NURSE_OPTIONS`는 하드코딩 상수이므로 `admin.ts` 한 곳만 수정하면 두 컴포넌트 모두 반영됩니다.

### 2.2 메모란 placeholder 텍스트 변경

| 항목 | 내용 |
|------|------|
| **대상 파일** | `CosmeticsKioskView.tsx:314` |
| **현재 값** | `placeholder="사용 목적 (선택)"` |
| **변경 값** | `placeholder="환자명/차트번호"` |

**참고:**
- KioskView(시술물품)는 이미 별도 `환자명` + `차트번호` 입력 필드가 있어 해당 placeholder가 없음
- 화장품 키오스크의 메모 필드만 변경 대상

### 2.3 마데카 로션 용량(specification) 수정

| 항목 | 내용 |
|------|------|
| **대상** | Supabase `inventory_items` 테이블 |
| **현재 값** | `마데카MD 로션 100g`, `마데카MD 로션 200g` |
| **변경 값** | `마데카MD 로션 200ml`, `마데카MD 로션 500ml` |

**DB 구조:**
- `name` = `'마데카MD 로션'` (제품명)
- `specification` = `'100g'` / `'200g'` (용량 — 이 컬럼만 수정)
- `category` = `'cosmetics'`, `sub_category` = `'lotion'`

**필요 작업:**
1. SQL 마이그레이션 파일 생성 (Supabase 운영 DB에 적용)
2. 시드 파일 `015_cosmetics_seed.sql` 동기화 수정

## 3. 구현 계획

### Step 1: `NURSE_OPTIONS` 수정 (admin.ts)
```
파일: src/types/admin.ts:205
변경: ['김수정', '김지연'] → ['최이연', '김태희']
```

### Step 2: 메모 placeholder 변경 (CosmeticsKioskView.tsx)
```
파일: src/components/admin/inventory/CosmeticsKioskView.tsx:314
변경: placeholder="사용 목적 (선택)" → placeholder="환자명/차트번호"
```

### Step 3: DB 마이그레이션 SQL 작성
```sql
-- 마데카MD 로션 specification 수정
UPDATE inventory_items
SET specification = '200ml'
WHERE name = '마데카MD 로션' AND specification = '100g';

UPDATE inventory_items
SET specification = '500ml'
WHERE name = '마데카MD 로션' AND specification = '200g';
```

### Step 4: 시드 파일 동기화
```
파일: supabase/migrations/015_cosmetics_seed.sql
변경: '100g' → '200ml', '200g' → '500ml'
```

## 4. 리스크 분석

| 리스크 | 등급 | 대응 |
|--------|------|------|
| NURSE_OPTIONS 변경 시 기존 트랜잭션의 `confirmed_by` 값 불일치 | 낮음 | 기존 데이터는 과거 기록이므로 그대로 유지 |
| 마데카 로션 specification 변경 시 기존 트랜잭션 참조 | 낮음 | 트랜잭션은 `item_id`로 참조하므로 영향 없음 |
| 프론트엔드 캐시 | 낮음 | 상수 변경이므로 빌드 시 자동 반영 |

## 5. 테스트 체크리스트

- [ ] 화장품 키오스크: 담당 버튼이 "최이연", "김태희"로 표시
- [ ] 시술물품 키오스크: 간호사 버튼이 "최이연", "김태희"로 표시
- [ ] 화장품 키오스크: 메모란 placeholder가 "환자명/차트번호"로 표시
- [ ] 마데카MD 로션 항목이 "200ml", "500ml"로 표시
- [ ] 화장품 사용 기록 정상 제출 확인
- [ ] 시술물품 사용 기록 정상 제출 확인

## 6. 예상 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/admin.ts` | NURSE_OPTIONS 값 변경 |
| `src/components/admin/inventory/CosmeticsKioskView.tsx` | placeholder 텍스트 변경 |
| `supabase/migrations/016_madeca_spec_update.sql` (신규) | DB specification 수정 |
| `supabase/migrations/015_cosmetics_seed.sql` | 시드 데이터 동기화 |
