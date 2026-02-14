# Gap Analysis: inventory-overview-ux

> Design vs Implementation 비교 분석 보고서

**분석일**: 2026-02-14
**Overall Match Rate**: **93%**
**상태**: PASS (>=90% threshold)

---

## FR별 매치율

| FR | 설명 | 매치율 | 상태 |
|----|------|:------:|:----:|
| FR-01 | DashboardStatsCards | 95% | PASS |
| FR-02 | CategoryCard sparkline+badge | 97% | PASS |
| FR-03 | TodayUsageSummary | 95% | PASS |
| FR-04 | Item usage insight | 98% | PASS |
| FR-05 | HistoryTab 시각화 | 88% | WARN |
| FR-06 | RestockTab countdown | 78% | WARN |
| FR-07 | 양방향 네비게이션 | 90% | PASS |
| FR-08 | useInventoryData 확장 | 100% | PASS |

---

## Critical Gap (1건)

| FR | 항목 | 설명 | 권장 조치 |
|----|------|------|-----------|
| FR-06 | 일괄 발주 체크리스트 모드 | Design에 `batchMode` 상태 + 체크박스 + 스티키 바 명시되었으나 미구현 | P2 우선순위이므로 후속 스프린트로 연기 가능 |

## Minor Gaps (8건)

| FR | 항목 | 설명 | 영향도 |
|----|------|------|--------|
| FR-01 | pulse 범위 | 아이콘만 pulse, 카드 전체가 아님 (ring 효과로 대체) | 낮음 |
| FR-02 | 스파크라인 투명도 | polyline에 opacity={0.6} 추가 | 무시 |
| FR-03 | 모바일 환자명 숨김 | 환자명도 sm 이하에서 숨김 (간호사만 아님) | 낮음 |
| FR-05 | DonutChart 레이아웃 | 수평 → 수직 배치 | 낮음 |
| FR-05 | DonutChart 크기 | 반응형 100/140px → 고정 130px | 낮음 |
| FR-06 | CountdownBar 임계값 | Design 7/14일 → 구현 3/7일 | 중간 |
| FR-06 | CountdownBar 방향 | 바 진행 방향 차이 | 낮음 |
| FR-07 | KioskView 경고 뱃지 | alertCount 뱃지 미포함 | 중간 |

---

## 파일 검증 결과

### 신규 파일 (3/3 생성)
- `src/lib/usage-session-utils.ts` - Design 일치
- `src/components/admin/inventory/DashboardStatsCards.tsx` - Design 일치
- `src/components/admin/inventory/TodayUsageSummary.tsx` - Design 일치

### 수정 파일 (10/10 수정)
- `useInventoryData.ts` - 4개 신규 반환 필드 추가
- `DailyUsageLog.tsx` - usage-session-utils import 변경
- `overview/page.tsx` - DashboardStatsCards + TodayUsageSummary 통합
- `CategoryCard.tsx` - sparkline + badge 추가
- `CategoryGrid.tsx` - 신규 props 전달
- `CategoryDetailSection.tsx` - todayItemUsage prop 추가
- `StockCardView.tsx` - today usage insight 추가
- `HistoryTab.tsx` - UsageHeatmap + DonutChart 추가
- `RestockTab.tsx` - CountdownBar 추가
- `KioskView.tsx` - overview 링크 위젯 추가

### 데이터 흐름 검증
모든 경로 일치: useInventoryData → overview/page → 각 컴포넌트

---

## 결론

- P0/P1 기능 (FR-01~04, FR-07, FR-08): 모두 90%+ 매치율
- P2 기능 (FR-05, FR-06): 88%, 78% - 일괄 발주 모드 미구현이 주요 원인
- 전체 93%로 통과 기준 달성
- Critical gap 1건은 P2 우선순위로 후속 처리 가능
