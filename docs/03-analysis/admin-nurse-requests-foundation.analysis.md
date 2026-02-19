# Gap Analysis: admin-nurse-requests-foundation

> Date: 2026-02-19
> Match Rate: **100%** (after fix)
> Design: `docs/02-design/features/admin-nurse-requests-foundation.design.md`

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Schema (018 migration) | 100% | PASS |
| Data Changes (019 migration) | 100% | PASS |
| TypeScript Types (admin.ts) | 100% | PASS |
| Component Updates | 100% | PASS (after fix) |
| **Overall** | **100%** | **PASS** |

---

## Matched Items (29/29)

### Schema
- device_tip_shots: 모든 컬럼, CHECK, 인덱스 3개
- device_shot_logs: 모든 컬럼, CHECK, 인덱스 2개
- inventory_batches: 모든 컬럼, CHECK, 인덱스 2개
- inventory_items: category CHECK 확장 (sample), is_refrigerated, volume_cc
- RLS 정책 3개 테이블
- use_device_shots() 함수 (p_note 파라미터 추가 개선)

### Data Changes
- 단위 변경 3건 (쥬베룩, 수액세트, 모야랩)
- 냉장 표기 (storage_note LIKE '%냉장%')
- 용량 표기 (리쥬란힐러 2cc, EPTQ 3cc)
- 보톡스 니들 레시피 삭제
- 써마지 소모품 4개 레시피 × 3종 = 12건 추가
- 스컬트라 주사용수 연동
- 실리프팅 기존 4개 삭제 + 브랜드별 13개 신규 레시피

### TypeScript
- InventoryCategory 'sample' 추가
- InventoryItem 필드 2개 추가
- PROCEDURE_CATALOG 실리프팅 6개 브랜드 분리
- 슈링크 이름 변경 (유니버스 제거)
- 신규 인터페이스 3개 + DeviceType + DEVICE_INITIAL_SHOTS

### Components
- CategoryCard.tsx: CATEGORY_COLORS, CATEGORY_ICONS에 sample 추가
- StockDashboard.tsx: CATEGORY_COLORS에 sample 추가
- StockGroupView.tsx: CATEGORY_ICONS, order 배열에 sample 추가

---

## Fixed Gaps

| Gap | Fix | Impact |
|-----|-----|--------|
| StockGroupView.tsx order 배열에 'sample' 누락 | order 배열에 'sample' 추가 | Low - 그룹 뷰에서 샘플 카테고리 표시 |

## Implementation Improvements (Design 대비 개선)

| 항목 | 개선 내용 |
|------|----------|
| device_tip_shots CHECK | initial_shots > 0, remaining_shots >= 0 제약 추가 |
| device_tip_shots 인덱스 | item_id 인덱스 추가 (FK 조인 성능) |
| use_device_shots() p_note | note 파라미터 추가 (device_shot_logs.note와 연동) |
| use_device_shots() exhausted_at | ELSE NULL → ELSE exhausted_at (기존값 보존) |
