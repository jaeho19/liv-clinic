# Plan: 어드민 페이지 대폭 축소 (admin-overhaul)

> **작성일**: 2026-02-13
> **근거**: 직원 회의 (2026-02-12) + 대표 지시사항
> **핵심 방침**: 환자관리는 VEGAS에서. 어드민은 재고관리 + 홈페이지 관리만.

---

## 1. 개편 방향

**Before**: 14개 메뉴 (상담, 운영, 재고, 알림, 리포트, Analytics, 매출, 환자, 음성노트, 이벤트, 팝업, 설정, 가이드, 대시보드)

**After**: 5개 메뉴만 남기기

```
재고관리 (2개)                홈페이지 관리 (3개)
├── 재고 대시보드             ├── 이벤트관리
└── 키오스크 모드              ├── 팝업관리
                              └── Analytics
설정 (1개)
└── 설정
```

---

## 2. 유지 대상 (5개 섹션)

| # | 메뉴 | 경로 | 비고 |
|---|------|------|------|
| 1 | 재고관리 | `/admin/inventory` | 메인 기능 + 화장품 카테고리 추가 |
| 2 | 키오스크 | `/admin/inventory/kiosk` | 현장 재고 차감용 |
| 3 | 이벤트관리 | `/admin/events` (+new, edit) | 홈페이지 이벤트 |
| 4 | 팝업관리 | `/admin/popups` (+new, edit) | 홈페이지 팝업 |
| 5 | Analytics | `/admin/analytics` | 홈페이지 방문 분석 |
| 6 | 설정 | `/admin/settings` | 직원, 시술 마스터, 병원 정보 |

### 유지 API (16개)
```
inventory/         → route.ts, [id]/route.ts, stats, transactions, restock, use, recipes, burndown (8개)
events/            → route.ts, [id]/route.ts (2개)
popups/            → route.ts, [id]/route.ts (2개)
analytics/google/  → route.ts (1개)
settings/          → clinic, staff, staff/[id], treatments, treatments/[id], audit-logs (6개 - 필요시 정리)
```

### 유지 컴포넌트
```
admin/AdminLayoutClient.tsx     ← 레이아웃
admin/AdminSidebar.tsx          ← 사이드바 (메뉴 대폭 축소)
admin/EventForm.tsx             ← 이벤트 폼
admin/PopupForm.tsx             ← 팝업 폼
admin/ImageUploader.tsx         ← 이미지 업로드 (이벤트/팝업에서 사용)
admin/ConfirmDialog.tsx         ← 삭제 확인 (이벤트/팝업에서 사용)
admin/inventory/*               ← 재고 컴포넌트 전체 (9개)
```

### 유지 Lib/Types
```
lib/supabase-server.ts, supabase-browser.ts, supabase-admin.ts
lib/inventory-utils.ts
lib/ga4-client.ts, ga4-queries.ts
lib/eventApi.ts                 ← 퍼블릭 이벤트 페이지에서도 사용
types/admin.ts                  ← 정리 필요 (사용하지 않는 타입 제거)
types/supabase.ts, analytics.ts, index.ts
```

---

## 3. 제거 대상 (총 52개 파일)

### 3-1. 페이지 제거 (10개)

| 제거 메뉴 | 파일 | 제거 이유 |
|-----------|------|-----------|
| 대시보드 | `dashboard/page.tsx` | 재고 대시보드가 랜딩 페이지 역할 |
| 상담관리 | `consultations/page.tsx` | VEGAS에서 관리 |
| 운영현황 | `operations/page.tsx` | VEGAS에서 관리 |
| 알림관리 | `notifications/page.tsx` | VEGAS 가예약으로 충분 |
| 알림 템플릿 | `notifications/templates/page.tsx` | 위와 동일 |
| 알림 히스토리 | `notifications/history/page.tsx` | 위와 동일 |
| 리포트 | `reports/page.tsx` | 불필요 |
| 매출관리 | `revenue/page.tsx` | 다른 시스템에서 관리 |
| 환자조회 | `patients/page.tsx` | VEGAS에서 관리 |
| 음성 노트 | `voice-note/page.tsx` | 불필요 |
| 사용 가이드 | `guide/page.tsx` | 5개 메뉴로 축소되어 불필요 |

### 3-2. API 라우트 제거 (20개)

```
# 상담
api/admin/consultations/[id]/timeline/route.ts

# 운영
api/admin/operations/route.ts
api/admin/operations/[id]/route.ts

# 알림 (5개)
api/admin/notifications/today/route.ts
api/admin/notifications/complete/route.ts
api/admin/notifications/send/route.ts
api/admin/notifications/history/route.ts
api/admin/notification-templates/route.ts
api/admin/notification-templates/[id]/route.ts

# 리포트
api/admin/reports/route.ts

# 매출 (3개)
api/admin/revenue/route.ts
api/admin/revenue/mapping/route.ts
api/admin/revenue/import/route.ts

# 환자 (5개)
api/admin/patients/search/route.ts
api/admin/patients/profile/route.ts
api/admin/patients/photos/route.ts
api/admin/patients/photos/[id]/route.ts
api/admin/patient-treatments/route.ts
api/admin/patient-treatments/[id]/route.ts

# 크론 (알림 발송)
api/cron/send-notifications/route.ts
```

### 3-3. 컴포넌트 제거 (17개)

```
# 단일 컴포넌트 (5개)
admin/TodayCallbacks.tsx
admin/ConsultationTimeline.tsx
admin/VoiceNoteInput.tsx
admin/CsvUploadModal.tsx
admin/PatientPhotoGallery.tsx

# floormap 폴더 전체 (7개)
admin/floormap/FloorMap.tsx
admin/floormap/RoomOverlay.tsx
admin/floormap/RoomDetailPanel.tsx
admin/floormap/RoomTooltip.tsx
admin/floormap/StatusLegend.tsx
admin/floormap/ViewToggle.tsx
admin/floormap/roomConfig.ts
admin/floormap/useElapsedTimer.ts

# hybrid-form 폴더 전체 (4개)
admin/hybrid-form/HybridForm.tsx
admin/hybrid-form/FormTemplateSelector.tsx
admin/hybrid-form/FormPreview.tsx
admin/hybrid-form/VoiceFieldRecorder.tsx
```

### 3-4. Hooks 제거 (3개)
```
hooks/useConsultationRealtime.ts
hooks/useCallbackChecker.ts
hooks/useBrowserNotification.ts
```

### 3-5. Lib/Types 제거 (3개)
```
lib/solapi.ts                    ← SMS API (알림과 함께 제거)
types/voice-templates.ts         ← 음성 노트 타입
types/smart-forms.ts             ← 하이브리드 폼 타입
```

### 3-6. 테스트 제거 (1개)
```
__tests__/operations.test.ts
```

---

## 4. 수정 대상

### 4-1. AdminSidebar.tsx — 메뉴 대폭 축소

```typescript
// Before: 14개 메뉴
// After: 6개 메뉴

const NAV_SECTIONS: NavSection[] = [
  {
    title: '재고관리',
    items: [
      { href: '/admin/inventory', label: '재고 현황', icon: '📦' },
    ],
  },
  {
    title: '홈페이지 관리',
    items: [
      { href: '/admin/events', label: '이벤트관리', icon: '🎉' },
      { href: '/admin/popups', label: '팝업관리', icon: '🪟' },
      { href: '/admin/analytics', label: 'Analytics', icon: '🌐' },
    ],
  },
  {
    title: '시스템',
    items: [
      { href: '/admin/settings', label: '설정', icon: '⚙️' },
    ],
  },
];
```

### 4-2. admin/page.tsx — 리다이렉트 대상 변경

```
/admin → /admin/inventory (기존: /admin/dashboard)
```

### 4-3. types/admin.ts — 미사용 타입 정리

제거 대상 타입 (사용하는 파일이 모두 삭제됨):
- `ConsultationRow`, `LeadStatus`, `LEAD_STATUS_*`, `CONSULTATION_STATUS_*`
- `OperationCase`, `CaseStatus`, `RoomConfig`, `RoomType`, `FloorMapFiltersV2`
- `OperationsViewMode`, `TREATMENT_TYPE_FLOOR_COLORS`, `TREATMENT_TYPE_ICONS`, `TREATMENT_TYPE_LABELS`
- `PatientTreatmentRow`, `NotificationChannel`, `NOTIFICATION_*`
- `NotificationTemplateRow`, `TemplateType`, `TEMPLATE_TYPE_LABELS`
- `NotificationHistoryRow`, `NotificationSendStatus`

유지 타입:
- `EventRow`, `EventCategory`, `EVENT_CATEGORY_LABELS`, `getEventStatusFromRow`, `RELATED_TREATMENT_OPTIONS`
- `PopupRow`, `getPopupStatus`
- `InventoryItem`, `InventoryCategory`, `InventoryTransaction`, `InventoryTxType`
- `INVENTORY_CATEGORY_LABELS`, `INVENTORY_SUBCATEGORY_LABELS`, `INVENTORY_TX_LABELS`, `getStockStatus`

---

## 5. 신규 기능: 화장품 재고관리

### 현재 재고 카테고리 구조
기존: `injectable` (보톡스/필러), `device_consumable`, `skincare`, `other`

### 추가/강화할 내용
- **화장품(cosmetics) 카테고리** 추가 또는 기존 `skincare` 카테고리 활용
- 화장품 전용 서브카테고리: 클렌저, 선크림, 앰플, 마스크팩, 기타
- 판매 재고 vs 시술 소모품 구분 플래그
- 화장품은 박스 단위 입출고 지원

### 구현 방식
1. `types/admin.ts`에 `InventoryCategory`에 `cosmetics` 추가
2. 서브카테고리 라벨 추가
3. 재고 대시보드에 화장품 탭/필터 추가
4. 키오스크 모드에 화장품 카테고리 표시

---

## 6. 실행 순서

| 단계 | 작업 | 파일 수 |
|------|------|---------|
| **Step 1** | 사이드바 메뉴 축소 + 리다이렉트 변경 | 2개 수정 |
| **Step 2** | 페이지 파일 삭제 (10개) | 10개 삭제 |
| **Step 3** | API 라우트 삭제 (20개) | 20개 삭제 |
| **Step 4** | 컴포넌트 삭제 (17개) | 17개 삭제 |
| **Step 5** | Hooks, Lib, Types 파일 삭제 (7개) | 7개 삭제 |
| **Step 6** | `types/admin.ts` 미사용 타입 정리 | 1개 수정 |
| **Step 7** | 화장품 카테고리 추가 (types + UI) | 2~3개 수정 |
| **Step 8** | 빌드 테스트 (`npm run build`) | 검증 |

---

## 7. 리스크 및 주의사항

| 항목 | 대응 |
|------|------|
| DB 테이블 | **삭제하지 않음** — 코드만 제거, 데이터 보존 |
| `types/consultation.ts` | **삭제 금지** — 퍼블릭 상담 폼에서 사용 중 |
| `lib/eventApi.ts` | **삭제 금지** — 퍼블릭 이벤트 페이지에서 사용 중 |
| `ImageUploader.tsx` | **삭제 금지** — 이벤트/팝업 폼에서 사용 중 |
| `ConfirmDialog.tsx` | **삭제 금지** — 이벤트/팝업 목록에서 사용 중 |
| `hooks/index.ts` | 수정 불필요 — 삭제 대상 hooks는 여기서 export 안 함 |
| 빌드 깨짐 | Step 8에서 반드시 검증 |

---

## 8. 최종 결과 요약

| 항목 | Before | After | 삭제율 |
|------|--------|-------|--------|
| 사이드바 메뉴 | 14개 | 5개 | -64% |
| 페이지 파일 | 26개 | 15개 | -42% |
| API 엔드포인트 | 38개 | 19개 | -50% |
| 컴포넌트 | 32개 | 15개 | -53% |
| 전체 삭제 파일 | — | **52개** | — |
