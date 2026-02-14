# Plan: inventory-overview-ux

> 재고현황 UI/UX 개선 + 물품 사용 기록 연동 강화

## 1. 개요

### 배경
현재 `/admin/inventory/overview` 재고현황 페이지는 기능적으로 완성되어 있으나, 시각적 표현력과 물품 사용 기록(`/admin/inventory`) 페이지와의 데이터 연동이 부족하다. 키오스크에서 기입한 사용 기록이 재고현황 페이지에서 실시간으로 반영되어 보여야 하며, 전반적인 데이터 시각화와 UX 흐름을 개선해야 한다.

### 목표
1. **시각적 개선**: 데이터 시각화를 강화하여 재고 상태를 한눈에 파악 가능하게
2. **사용 기록 연동**: 키오스크에서 기입한 물품 사용 기록이 재고현황에 실시간 반영
3. **UX 흐름 개선**: 두 페이지 간의 자연스러운 연결과 네비게이션

## 2. 현재 상태 분석

### 현재 구조
```
/admin/inventory          → 키오스크 뷰 (물품 사용 기록)
  - KioskView: 시술 선택 → 물품 차감
  - CosmeticsKioskView: 화장품 직접 차감
  - DailyUsageLog: 오늘의 사용 기록

/admin/inventory/overview → 재고 현황 (카테고리별 보기)
  - CompactStatsBar: 요약 통계
  - CategoryGrid → CategoryDetailSection: 카테고리 선택 → 상세 보기
  - HistoryTab: 사용 이력 타임라인
  - RestockTab: 입고 관리
```

### 현재 문제점

#### P1: 시각적 문제
- **CompactStatsBar**: 단순 텍스트 나열, 시각적 임팩트 부족
- **CategoryGrid**: 카드가 단조로움, 트렌드/변화율 정보 없음
- **HistoryTab**: TOP 10 차트가 단순 바 차트, 시간대별 분석 없음
- **RestockTab**: 발주 추천이 리스트 형태로만 제공, 우선순위 시각화 부족

#### P2: 사용 기록 연동 문제
- 키오스크에서 차감한 내용이 재고현황의 "사용 이력" 탭에서만 보임
- **재고 현황 탭(stock)에서는 오늘 사용된 기록이 직접 보이지 않음**
- CategoryDetailSection의 DetailPanel에 최근 15건 트랜잭션만 표시
- DailyUsageLog 컴포넌트가 키오스크 페이지에만 존재하고 overview에는 없음

#### P3: UX 흐름 문제
- overview → kiosk 이동 링크는 있으나, kiosk → overview 연결이 약함
- 카테고리 선택 후 상세까지의 depth가 깊어 한눈에 전체 파악 어려움
- 탭 전환 시 컨텍스트(선택한 카테고리 등) 유실

## 3. 개선 계획

### 3.1 시각 개선 (UI Designer 관점)

#### A. CompactStatsBar → Dashboard Stats Cards
**변경**: 단순 텍스트 바 → 비주얼 대시보드 카드

현재:
```
총 품목 42 | 정상 35 | 부족 5 | 소진 2 | 총 가치 1,250만원
```

개선:
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  42          │ │  35          │ │   5          │ │   2          │
│  총 품목     │ │  정상 재고   │ │  부족 경고   │ │  긴급 소진   │
│  ▔▔▔▔▔▔▔▔▔  │ │  ● 83%      │ │  ▲ +2 (전주)│ │  ▼ -1 (전주) │
│  전주 대비   │ │  ■■■■■□□    │ │  ~~~~~~~~~~~~~│ │  !! 즉시발주 │
│  +3 품목     │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

구현 포인트:
- 각 지표를 개별 카드로 분리 (4열 그리드)
- 아이콘 + 대형 숫자 + 트렌드 표시
- 비정상 카드(부족/소진)에 pulse 또는 glow 효과
- 소진 카드 클릭 시 해당 품목 리스트로 스크롤

#### B. CategoryGrid 개선
**변경**: 카테고리 카드에 미니 트렌드 정보 추가

개선 포인트:
- 카드 내에 지난 7일간 사용량 미니 스파크라인 추가
- 가장 많이 사용된 품목 1개를 카드 하단에 표시
- "오늘 N건 사용" 뱃지 추가 (키오스크 사용 기록 연동)
- 카드 호버 시 확장 프리뷰 (사용량 TOP 3 미니 리스트)

#### C. HistoryTab 시각화 강화
**변경**: 단순 타임라인 + 바 차트 → 다차원 분석 뷰

개선 포인트:
- 시간대별 사용량 히트맵 (오전/오후/야간 패턴)
- TOP 10 차트를 수평 바 → 도넛 차트 + 순위 리스트 조합으로
- 일별 사용 추이 미니 라인 차트 추가 (최근 7일)
- 시술별 그룹 뷰 옵션 추가 (키오스크 note 파싱)

#### D. RestockTab 우선순위 시각화
**변경**: 리스트 → 우선순위 매트릭스

개선 포인트:
- 긴급도(소진일수) x 중요도(사용빈도) 2축 매트릭스 뷰
- 발주 추천 카드에 "예상 소진일" 시각적 카운트다운 바
- 일괄 발주 체크리스트 모드 추가

### 3.2 사용 기록 연동 강화 (UX Designer 관점)

#### E. 재고현황 탭에 "오늘의 사용 기록" 통합
**핵심 변경**: DailyUsageLog를 overview의 stock 탭에도 표시

구현:
- CategoryGrid 상단 또는 하단에 "오늘의 물품 사용" 섹션 추가
- 기존 DailyUsageLog 컴포넌트를 재사용 (filterPrefix 없이 전체 표시)
- 세션별 그룹핑으로 "14:30 써마지 FLX 600샷 | 환자명 | 간호사" 형태
- 각 세션 클릭 시 → 사용된 물품 상세 리스트 펼침

#### F. CategoryDetailSection에 사용 빈도 인사이트 추가
**변경**: 품목 상세에 사용 빈도 정보 시각적 표시

구현:
- 각 품목 카드/행에 "일 평균 사용량" 미니 지표
- DetailPanel에 "사용 패턴" 섹션 (일별/주별 사용 차트)
- "최근 사용" 배지 표시 (오늘 사용된 품목 하이라이트)

#### G. 양방향 네비게이션 개선
**변경**: 키오스크 ↔ 재고현황 간 자연스러운 이동

구현:
- overview의 사용 기록에서 "키오스크로 차감" 버튼
- 키오스크 페이지에 "재고 현황 보기" 미니 위젯
- 재고 부족 품목 사용 시 키오스크에서 경고 + overview 바로가기

### 3.3 데이터 흐름 개선

#### H. 실시간 데이터 동기화
**변경**: 페이지 간 데이터 공유 강화

구현:
- `useInventoryData` 훅에 `lastUsageSession` 필드 추가
- overview에서 키오스크 차감 발생 시 실시간 반영 (polling 또는 refetch trigger)
- 탭 전환 시에도 선택된 카테고리 상태 유지

## 4. 수정 대상 파일

### 신규 생성
| 파일 | 설명 |
|------|------|
| `DashboardStatsCards.tsx` | 새로운 대시보드 통계 카드 (CompactStatsBar 대체) |
| `TodayUsageSummary.tsx` | overview용 오늘의 사용 기록 요약 |
| `UsagePatternChart.tsx` | 사용 패턴 미니 차트 컴포넌트 |

### 기존 수정
| 파일 | 변경 사항 |
|------|-----------|
| `overview/page.tsx` | DashboardStatsCards 교체, TodayUsageSummary 추가 |
| `CompactStatsBar.tsx` | DashboardStatsCards로 대체 (기존 파일 유지 or 삭제) |
| `CategoryCard.tsx` | 미니 스파크라인, 오늘 사용 뱃지 추가 |
| `CategoryGrid.tsx` | 오늘 사용 데이터 prop 전달 |
| `CategoryDetailSection.tsx` | 품목별 사용 빈도 인사이트 표시 |
| `DetailPanel.tsx` | 사용 패턴 차트 섹션 추가 |
| `HistoryTab.tsx` | 시간대별 히트맵, 도넛 차트 추가 |
| `RestockTab.tsx` | 우선순위 매트릭스, 카운트다운 바 |
| `useInventoryData.ts` | todayUsageSessions 데이터, 카테고리별 오늘 사용량 |
| `KioskView.tsx` | 재고 현황 바로가기 미니 위젯 |

## 5. 구현 우선순위

### Phase 1: 사용 기록 연동 (가장 핵심)
1. `useInventoryData` 훅에 오늘 사용 세션 데이터 추가
2. `TodayUsageSummary` 컴포넌트 생성 → overview stock 탭에 배치
3. `CategoryCard`에 "오늘 N건 사용" 뱃지 추가
4. `CategoryDetailSection` 품목에 "최근 사용" 하이라이트

### Phase 2: 시각 개선 - 대시보드
5. `DashboardStatsCards` 생성 (CompactStatsBar 대체)
6. `CategoryCard`에 미니 스파크라인 추가

### Phase 3: 시각 개선 - 분석 뷰
7. `HistoryTab` 시간대별 히트맵 + 도넛 차트
8. `RestockTab` 우선순위 매트릭스 + 카운트다운 바

### Phase 4: UX 흐름
9. 양방향 네비게이션 위젯
10. 탭 전환 시 상태 유지

## 6. 기술 제약

- **외부 차트 라이브러리 미사용**: 모든 차트를 SVG + Tailwind로 직접 구현
- **기존 디자인 시스템 준수**: 색상 팔레트, 폰트, 간격 규칙 유지
- **기존 API 활용**: 새 API 엔드포인트 생성 최소화, 기존 데이터로 클라이언트 계산
- **모바일 반응형**: 대시보드 카드와 차트가 모바일에서도 작동

## 7. 성공 기준

- [ ] 키오스크에서 물품 차감 후 overview에서 즉시 확인 가능
- [ ] 대시보드 통계가 시각적으로 상태를 즉각 전달
- [ ] 카테고리 카드에서 오늘 사용량 확인 가능
- [ ] 사용 이력이 시간대별/시술별로 분석 가능
- [ ] 발주 추천이 우선순위별로 시각적으로 구분
- [ ] 키오스크 ↔ 재고현황 간 자연스러운 네비게이션

## 8. 비고

- `ui-designer`, `ux-designer` 스킬을 활용하여 디자인 퀄리티 보장
- 기존 `DailyUsageLog` 컴포넌트 로직 최대한 재사용
- CompactStatsBar는 제거하지 않고 DashboardStatsCards로 교체만 진행
