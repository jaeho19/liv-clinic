# 유입 대시보드 소통·개선 4건 — 설계 (inflow-dashboard-refinements)

> 작성: 2026-08-18 · 대상: `/admin/inflow` 통계 대시보드 (2026-08-18 배포분에 대한 운영자 피드백)
> 관련: `docs/04-report/features/marketing-attribution.report.md`, `docs/02-design/features/marketing-attribution.design.md`

## 배경 — 운영자 피드백 4건과 결정

1. **용어**: "전환 퍼널"의 '퍼널'이 어렵다 → 카드 제목을 **"연락→결제 전환 흐름"**으로 교체 (사용자 선택 확정, 2026-08-18).
2. **유입 경로별 비교**: 해외 대행사(104건)·미분류(46건)가 커서 나머지 항목 차이가 안 보임 → **상위 1~2개 제외 토글** 추가 (토글 방식 확정).
3. **시술별 문의 비교**: 같은 제외 토글 적용 + 직관성 보강(현재 상위 12개 무언 절단 → "외 N개" 표기).
4. **표준화 검토 의미**: 대화로 답변 완료. 검토 탭 **빈 상태 문구에 설명 1문장 보강**.

완료 기준(사용자 선택): tsc·vitest·eslint(베이스라인 54 errors 이하)·build 통과 → 커밋 → master 머지·푸시 → Netlify 배포 확인. 이 작업과 무관한 미커밋 파일은 커밋 제외.

## 범위

- 수정: `liv-clinic/src/components/admin/inflow/InflowDashboard.tsx`, `InflowReviewTab.tsx`, `liv-clinic/src/lib/inflow/stats.ts` (+ `__tests__/stats.test.ts`)
- **무변경**: DB, i18n 메시지 파일(관리자 UI는 한국어 하드코딩), 기존 지표 산식, CSV 열, 공개 홈페이지.

## 설계

### 1. 용어 교체
- `FunnelCard`의 h3 "전환 퍼널" → **"연락→결제 전환 흐름"** (1곳). 캡션("발생일 기준 · 괄호는 직전 단계 대비 전환율")과 산식은 유지. 컴포넌트명 `FunnelCard` 등 코드 내부 명칭은 유지(최소 diff).

### 2. `splitTopGroups` 헬퍼 (stats.ts — 순수 함수)
```ts
export interface TopSplit<T> { excluded: T[]; visible: T[] }
export function splitTopGroups<T extends { contacts: number }>(rows: T[], excludeTop: number): TopSplit<T>
```
- contacts **내림차순** 상위 `excludeTop`개를 `excluded`, 나머지를 `visible`로 분리. 입력 배열을 변형하지 않고(복사본 정렬), **동률은 입력 순서 유지**(안정 분리).
- `excludeTop <= 0` → 전부 visible · `excludeTop >= rows.length` → 전부 excluded (음수·초과는 클램프).

### 3. `GroupBarCard` 상위 제외 토글 (두 비교 카드 공통)
- 카드별 독립 state `excludeTop: 0 | 1 | 2` (기본 0 = 현행과 동일 화면).
- 헤더 우측 세그먼트 컨트롤 **[전체 | 1위 제외 | 상위 2 제외]** — 기존 집계 단위(일간/주간/월간) 토글과 동일 스타일, `role="group"` + `aria-pressed`.
- `rows.length < 2`면 컨트롤 숨김. 옵션 n은 `n >= rows.length`이면 disabled.
- 제외 활성 시 막대 목록 위에 요약 줄:
  `제외됨: {라벨} {건수} · … (전체의 {P}%) · 막대는 표시 항목 기준` — P = 제외 항목 contacts 합 ÷ 전체 contacts 합(반올림).
- 막대 폭 기준 max는 **visible 최대값**으로 재스케일. 각 행의 **% 텍스트는 계속 전체(제외 포함) 기준** — 수치 왜곡 방지.
- 필터 변경 등으로 visible이 0건이 되면 "제외 후 표시할 항목이 없습니다 — '전체'를 선택하세요." 안내(자동 리셋 없음 — setState-in-effect 회피).

### 4. 시술별 카드 "외 N개" 표기
- 대시보드에서 `groupByTreatmentTag(...)` 전체 길이를 확보한 뒤 상위 12개만 표시(현행 유지)하고, 잘린 개수를 `moreCount` prop으로 전달.
- `moreCount > 0`일 때 카드 하단: `외 {N}개 항목 생략 — 상단 '문의 시술' 필터로 개별 확인 가능`.
- 유입 경로 카드는 절단이 없어(대분류 14종 + 미분류) 표기가 나타나지 않음.

### 5. 표준화 검토 탭 빈 상태 보강
- 기존 빈 상태(✓ + "표준화 검토가 필요한 항목이 없습니다.")에 설명 1문장 추가:
  `이 탭은 리드의 자유 입력 기록을 표준 분류(국내/해외 · 유입 경로 · 시술 태그)로 정리하는 곳으로, 규칙 엔진의 제안을 관리자가 확인한 행만 반영됩니다(기존 값은 덮어쓰지 않음).`
- 기존 안내("새 리드에 … 비어 있으면 여기에 다시 나타납니다")는 유지.

## 테스트 (TDD — 구현 전 작성)

`src/lib/inflow/__tests__/stats.test.ts`에 `splitTopGroups` 케이스 추가:
1. `excludeTop 0` → 전부 visible, excluded 빈 배열
2. `excludeTop 1` / `2` → contacts 상위부터 정확히 분리
3. 미정렬 입력도 contacts 기준으로 분리
4. 동률 시 입력 순서 유지(안정성)
5. `excludeTop >= rows.length` → 전부 excluded
6. 음수 → 0으로 클램프, 입력 배열 불변(비파괴)

컴포넌트 단위 테스트는 기존 관례상 부재(admin 컴포넌트 테스트 없음) — tsc·build·코드 리뷰로 갈음.

## 검증·배포 절차

1. `npx tsc --noEmit` · `npx vitest run` · `npx eslint src`(54 errors/72 warnings 베이스라인 대비 증가 0) · `npm run build`(TLS 프록시 우회 env)
2. 커밋(스펙 → 구현 순), `feature/inflow-dashboard-refinements` → master 머지 → `origin/master` 푸시
3. 배포 확인: 프로덕션 `/ko`의 Next.js buildId 변경 폴링(공개 페이지는 무변경이라 마커 대신 buildId 사용) + `/admin/login` 200 확인. 관리자 화면 내부는 자격증명이 없어 라이브 확인 불가 — 코드 검증으로 갈음.

## 승인 기록

- 2026-08-18 사용자: 용어("연락→결제 전환 흐름")·토글 방식 선택, 설계 승인("네, 진행해 주세요"), 완료 기준 커밋·배포까지 위임. 스펙 문서 리뷰 게이트는 이 대화 승인으로 갈음.
