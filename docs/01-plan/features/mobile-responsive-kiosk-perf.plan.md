# Plan: 모바일 반응형 최적화 및 키오스크 속도 개선

> Feature: `mobile-responsive-kiosk-perf`
> Created: 2026-02-14
> Status: Plan Phase

---

## 1. 목표 (Objective)

LIV 클리닉 웹사이트의 **모바일 반응형 완성도 향상**과 **관리자 키오스크 UI 클릭 반응 속도 개선**을 통해:
- 모바일 사용자 경험을 프리미엄 수준으로 끌어올림
- 키오스크 터치/클릭 시 즉각적인 반응(< 100ms) 달성
- 불필요한 리렌더링과 API 지연 제거

---

## 2. 현황 분석 (Current State)

### 2-1. 모바일 반응형 (잘 되어 있는 부분)
- Viewport meta 태그 최적화 완료 (`viewport-fit=cover`, `maximum-scale=5`)
- CSS custom properties 기반 반응형 spacing (4단계 breakpoint)
- Typography 스케일링 (72px → 28px, 5단계)
- Touch target 44px 최소 사이즈 보장 (WCAG AA)
- Reduced motion 지원

### 2-2. 모바일 반응형 (개선 필요)
| 이슈 | 위치 | 심각도 |
|------|------|--------|
| Hero 섹션 동적 import 미적용 | `page.tsx` | 중 |
| 일부 이미지 `sizes` 속성 누락 | `sections/*.tsx` | 중 |
| 320px 이하 FloatingCTA 겹침 가능성 | `FloatingCTA.tsx` | 하 |
| 이미지 art direction 미적용 | `CoreValues.tsx`, `Doctor.tsx` | 중 |
| 아래쪽 섹션 코드 스플리팅 부족 | `page.tsx` | 하 |

### 2-3. 키오스크 성능 (심각한 병목)
| 이슈 | 위치 | 영향도 |
|------|------|--------|
| **API 4개 순차 호출** (Promise.all 미사용) | `useInventoryData.ts:145-153` | **높음** |
| **리스트 아이템 React.memo 미적용** | `KioskView.tsx:233-290` | **높음** |
| 트랜잭션 200건 무조건 전체 로드 | `useInventoryData.ts:22` | 중 |
| 제출 후 전체 데이터 리페치 | `KioskView.tsx:173` | 중 |
| 수량 변경 디바운싱 없음 | `KioskView.tsx:137-142` | 하 |
| computed values 메모이제이션 부족 | `KioskView.tsx:195-201` | 하 |
| CategoryGrid 빈번한 재계산 | `CategoryGrid.tsx:22-83` | 중 |

---

## 3. 개선 범위 (Scope)

### Phase A: 키오스크 클릭 속도 개선 (즉각적 체감 효과)
1. **API 병렬 호출**: `Promise.all()` 적용 → 로딩 시간 40~50% 단축
2. **컴포넌트 메모이제이션**: 시술 버튼/그룹에 `React.memo` 적용
3. **Optimistic UI**: 클릭 즉시 UI 반영, API 응답 후 확정
4. **computed values 메모이제이션**: `useMemo`로 불필요한 재계산 방지
5. **제출 후 로컬 상태 업데이트**: 전체 리페치 대신 부분 업데이트

### Phase B: 모바일 반응형 최적화
1. **이미지 최적화**: 누락된 `sizes` 속성 추가, responsive srcSet 개선
2. **코드 스플리팅 확대**: 메인 페이지 below-fold 섹션 dynamic import
3. **FloatingCTA 소형 화면 대응**: 320px 이하 레이아웃 안전성 확보
4. **터치 피드백 개선**: active state 시각적 피드백 강화

### Phase C: 추가 최적화 (선택)
1. 트랜잭션 페이지네이션/날짜 필터링
2. 번들 사이즈 분석 및 최적화
3. Admin 라우트 코드 스플리팅

---

## 4. 핵심 파일 목록 (Key Files)

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/useInventoryData.ts` | Promise.all 병렬화, 트랜잭션 필터링 |
| `src/components/admin/inventory/KioskView.tsx` | React.memo, useMemo, optimistic UI |
| `src/components/admin/inventory/CategoryGrid.tsx` | 메모이제이션 강화 |
| `src/components/admin/inventory/DailyUsageLog.tsx` | 가상 스크롤링 검토 |
| `src/app/[locale]/page.tsx` | 추가 dynamic import |
| `src/components/layout/FloatingCTA.tsx` | 소형 화면 safe area |
| `src/app/globals.css` | 터치 피드백 스타일 |
| 각 섹션 컴포넌트 | 이미지 sizes 속성 추가 |

---

## 5. 성공 기준 (Success Criteria)

| 지표 | 현재 (추정) | 목표 |
|------|------------|------|
| 키오스크 초기 로딩 | ~2-3초 | < 1초 |
| 버튼 클릭 반응 시간 | ~200-300ms (리렌더 포함) | < 100ms |
| 시술 제출 후 UI 갱신 | ~1-2초 (전체 리페치) | 즉시 (optimistic) |
| 모바일 LCP (Largest Contentful Paint) | 미측정 | < 2.5초 |
| 모바일 CLS (Cumulative Layout Shift) | 미측정 | < 0.1 |
| 320px 화면 레이아웃 깨짐 | 미확인 | 0건 |

---

## 6. 구현 순서 (Implementation Order)

```
Phase A (키오스크 속도) ──→ Phase B (모바일 반응형) ──→ Phase C (추가 최적화)
        ↓                          ↓                         ↓
   1. Promise.all            5. 이미지 sizes           8. 트랜잭션 필터
   2. React.memo             6. dynamic import         9. 번들 분석
   3. Optimistic UI          7. FloatingCTA fix       10. Admin 코드 스플리팅
   4. useMemo 강화
```

**예상 작업량**: Phase A (핵심) 1시간, Phase B 30분, Phase C (선택) 30분

---

## 7. 리스크 및 의존성

| 리스크 | 대응 방안 |
|--------|-----------|
| Optimistic UI에서 API 실패 시 롤백 필요 | 에러 발생 시 이전 상태 복원 + toast 알림 |
| React.memo 과도 적용 시 디버깅 어려움 | 리스트 아이템과 자주 변하지 않는 컴포넌트에만 적용 |
| Promise.all 하나 실패 시 전체 실패 | Promise.allSettled 또는 개별 try-catch 유지 |
| dynamic import SSR 호환성 | `ssr: false` 옵션으로 admin 컴포넌트 처리 |

---

## 8. 비고

- Phase A는 사용자가 즉각 체감할 수 있는 개선이므로 최우선 실행
- Phase B는 공개 웹사이트 품질에 직접 영향
- Phase C는 데이터 증가에 대비한 장기적 개선
