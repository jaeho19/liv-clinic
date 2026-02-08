# Design: LIV 클리닉 관리자 페이지 사용 설명서

> **Feature**: admin-user-guide
> **Created**: 2026-02-08
> **Status**: Design Phase
> **Plan Reference**: `docs/01-plan/features/admin-user-guide.plan.md`

---

## 1. 산출물 설계

### 1.1 최종 산출물

| 산출물 | 경로 | 형태 | 용도 |
|--------|------|------|------|
| **HTML 사용 설명서** | `liv-clinic/public/admin-guide/index.html` | Single-page HTML | 브라우저에서 열람, 인쇄 가능 |
| **스크린샷 이미지** | `liv-clinic/public/admin-guide/screenshots/` | PNG 파일 18장 | 설명서에 삽입 |
| **Playwright 캡처 스크립트** | `screenshots/capture-admin.py` | Python 스크립트 | 스크린샷 자동 캡처 |

### 1.2 HTML 설명서 구조

```
admin-guide/
├── index.html          ← 메인 사용 설명서 (Single-Page)
└── screenshots/        ← 스크린샷 이미지 폴더
    ├── 01-login.png
    ├── 02-dashboard.png
    ├── 03-consultations-table.png
    ├── 04-consultations-edit.png
    ├── 05-operations-floormap.png
    ├── 06-operations-kanban.png
    ├── 07-inventory-stock.png
    ├── 08-inventory-use-modal.png
    ├── 09-notifications.png
    ├── 10-reports.png
    ├── 11-revenue.png
    ├── 12-events-list.png
    ├── 13-events-form.png
    ├── 14-popups.png
    ├── 15-settings-treatments.png
    ├── 16-settings-staff.png
    ├── 17-settings-audit.png
    └── 18-settings-clinic.png
```

---

## 2. HTML 설명서 상세 설계

### 2.1 페이지 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>LIV 클리닉 - 관리자 시스템 사용 설명서</title>
  <!-- 인라인 CSS (단일 파일로 배포 가능) -->
  <style>/* 전체 스타일 */</style>
</head>
<body>
  <!-- 사이드 네비게이션 (고정) -->
  <nav id="sidebar">...</nav>

  <!-- 메인 콘텐츠 -->
  <main id="content">
    <section id="overview">...</section>         <!-- 개요 -->
    <section id="login">...</section>            <!-- 로그인 -->
    <section id="dashboard">...</section>        <!-- 대시보드 -->
    <section id="consultations">...</section>    <!-- 상담관리 -->
    <section id="operations">...</section>       <!-- 운영현황 -->
    <section id="inventory">...</section>        <!-- 재고관리 -->
    <section id="notifications">...</section>    <!-- 알림관리 -->
    <section id="reports">...</section>          <!-- 리포트 -->
    <section id="revenue">...</section>          <!-- 매출관리 -->
    <section id="events">...</section>           <!-- 이벤트관리 -->
    <section id="popups">...</section>           <!-- 팝업관리 -->
    <section id="settings">...</section>         <!-- 설정 -->
    <section id="workflows">...</section>        <!-- 통합 워크플로우 -->
    <section id="role-guide">...</section>       <!-- 역할별 가이드 -->
    <section id="improvements">...</section>     <!-- 향후 개선 -->
    <section id="api-reference">...</section>    <!-- API 참조 -->
  </main>

  <!-- 인라인 JavaScript (네비게이션, 인쇄) -->
  <script>/* 네비게이션 스크롤, 인쇄 버튼 */</script>
</body>
</html>
```

### 2.2 디자인 시스템

#### 컬러 팔레트 (프로젝트 디자인 시스템 연동)
```css
:root {
  --color-primary: #b4988d;       /* 더스티 로즈 - 헤딩, 강조 */
  --color-secondary: #6d4e42;     /* 다크 브라운 - 서브 헤딩 */
  --color-bg: #fafafa;            /* 배경 */
  --color-card: #ffffff;          /* 카드 배경 */
  --color-text: #333333;          /* 본문 텍스트 */
  --color-text-light: #666666;    /* 보조 텍스트 */
  --color-border: #e5e5e5;        /* 테두리 */
  --color-success: #22c55e;       /* 성공/완료 */
  --color-warning: #f59e0b;       /* 경고/주의 */
  --color-danger: #ef4444;        /* 위험/긴급 */
  --color-info: #3b82f6;          /* 정보 */
  --color-sidebar-bg: #1f2937;    /* 사이드바 배경 */
  --color-sidebar-text: #e5e7eb;  /* 사이드바 텍스트 */
}
```

#### 타이포그래피
```css
body { font-family: 'Pretendard', -apple-system, sans-serif; }
h1 { font-size: 2rem; color: var(--color-secondary); border-bottom: 3px solid var(--color-primary); }
h2 { font-size: 1.5rem; color: var(--color-secondary); }
h3 { font-size: 1.25rem; color: var(--color-primary); }
table { border-collapse: collapse; width: 100%; }
th { background: var(--color-primary); color: white; }
```

#### 반응형 설계
```css
/* 데스크톱: 사이드바 + 메인 */
@media (min-width: 1024px) {
  #sidebar { width: 260px; position: fixed; }
  #content { margin-left: 280px; }
}

/* 태블릿/모바일: 사이드바 숨김, 햄버거 메뉴 */
@media (max-width: 1023px) {
  #sidebar { transform: translateX(-100%); }
  #sidebar.open { transform: translateX(0); }
}

/* 인쇄용 */
@media print {
  #sidebar { display: none; }
  #content { margin-left: 0; }
  .screenshot { max-width: 100%; page-break-inside: avoid; }
  section { page-break-before: always; }
}
```

### 2.3 섹션별 콘텐츠 구조

각 섹션은 동일한 패턴으로 구성:

```html
<section id="{section-id}" class="guide-section">
  <!-- 헤더 -->
  <div class="section-header">
    <h2>{아이콘} {섹션명}</h2>
    <span class="path-badge">/admin/{path}</span>
  </div>

  <!-- 요약 -->
  <div class="section-summary">
    <p>{한 줄 설명}</p>
  </div>

  <!-- 스크린샷 -->
  <div class="screenshot-container">
    <img src="screenshots/{file}.png" alt="{설명}" class="screenshot" />
    <p class="screenshot-caption">{캡션}</p>
  </div>

  <!-- 기능 테이블 -->
  <div class="feature-table">
    <h3>주요 기능</h3>
    <table>...</table>
  </div>

  <!-- 사용 팁 -->
  <div class="tips-box">
    <h3>이런 때 사용하세요</h3>
    <ul>...</ul>
  </div>

  <!-- 사용 시나리오 (아코디언) -->
  <div class="scenarios">
    <h3>사용 시나리오</h3>
    <details class="scenario">
      <summary>{시나리오 제목}</summary>
      <ol>...</ol>
    </details>
  </div>

  <!-- 연관 섹션 링크 -->
  <div class="related-sections">
    <h3>연관 기능</h3>
    <div class="link-cards">...</div>
  </div>
</section>
```

### 2.4 특수 섹션 설계

#### 통합 워크플로우 섹션
```html
<section id="workflows">
  <!-- SVG 또는 CSS 기반 플로우 다이어그램 -->
  <div class="workflow-diagram">
    <!-- 환자 전체 여정 -->
    <div class="flow-item active" data-section="consultations">상담접수</div>
    <div class="flow-arrow">→</div>
    <div class="flow-item" data-section="operations">시술진행</div>
    <div class="flow-arrow">→</div>
    <!-- ... -->
  </div>
</section>
```

#### 역할별 가이드 섹션
```html
<section id="role-guide">
  <!-- 탭으로 역할 전환 -->
  <div class="role-tabs">
    <button class="role-tab active" data-role="director">원장/실장</button>
    <button class="role-tab" data-role="reception">접수/상담</button>
    <button class="role-tab" data-role="nurse">간호사/의료진</button>
    <button class="role-tab" data-role="sysadmin">시스템 관리자</button>
  </div>
  <div class="role-content">
    <!-- 역할별 추천 메뉴, 일일 루틴, 주간 루틴 -->
  </div>
</section>
```

---

## 3. 스크린샷 캡처 설계

### 3.1 Playwright 스크립트 설계

```python
# capture-admin.py
# 사전 조건: pip install playwright && playwright install chromium
# 실행: python capture-admin.py

import asyncio
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@livps.co.kr"  # 환경변수로 관리
ADMIN_PASSWORD = "..."              # 환경변수로 관리
OUTPUT_DIR = "liv-clinic/public/admin-guide/screenshots"

PAGES = [
    {"name": "01-login",              "path": "/admin/login",           "wait": 1000},
    {"name": "02-dashboard",          "path": "/admin/dashboard",       "wait": 3000},
    {"name": "03-consultations-table","path": "/admin/consultations",   "wait": 2000},
    {"name": "05-operations-floormap","path": "/admin/operations",      "wait": 2000},
    {"name": "07-inventory-stock",    "path": "/admin/inventory",       "wait": 2000},
    {"name": "09-notifications",      "path": "/admin/notifications",   "wait": 2000},
    {"name": "10-reports",            "path": "/admin/reports",         "wait": 3000},
    {"name": "11-revenue",            "path": "/admin/revenue",         "wait": 2000},
    {"name": "12-events-list",        "path": "/admin/events",          "wait": 2000},
    {"name": "14-popups",             "path": "/admin/popups",          "wait": 2000},
    {"name": "15-settings-treatments","path": "/admin/settings",        "wait": 2000},
]
```

### 3.2 캡처 사양

| 항목 | 값 |
|------|-----|
| **뷰포트** | 1440 x 900 (데스크톱 기준) |
| **포맷** | PNG |
| **Full-page** | 일부 페이지만 (대시보드, 리포트) |
| **대기 시간** | API 로드 완료까지 2-3초 |
| **인증** | 로그인 후 쿠키 유지하며 순회 |

### 3.3 인터랙션 캡처 (추가 스크린샷)

일부 페이지는 특정 상태를 트리거 후 캡처:

| 스크린샷 | 인터랙션 |
|----------|----------|
| 04-consultations-edit | 행 클릭 → 확장 상태 |
| 06-operations-kanban | 칸반 뷰 토글 클릭 |
| 08-inventory-use-modal | "재고 사용" 버튼 클릭 → 모달 오픈 |
| 13-events-form | "새 이벤트" 클릭 → 폼 페이지 이동 |
| 16-settings-staff | "직원 관리" 탭 클릭 |
| 17-settings-audit | "감사 로그" 탭 클릭 |
| 18-settings-clinic | "기본정보" 탭 클릭 |

---

## 4. 구현 순서

### Step 1: 스크린샷 캡처 스크립트 작성
- `screenshots/capture-admin.py` 생성
- Playwright로 자동 로그인 + 페이지 순회 + 캡처
- 출력 경로: `liv-clinic/public/admin-guide/screenshots/`

### Step 2: 스크린샷 캡처 실행
- 개발 서버 실행 (`npm run dev`)
- 캡처 스크립트 실행
- 결과 확인 (18장 PNG)

### Step 3: HTML 설명서 제작
- `liv-clinic/public/admin-guide/index.html` 생성
- 인라인 CSS + JS (단일 파일 배포)
- Plan 문서의 모든 섹션 콘텐츠를 HTML로 변환
- 스크린샷 삽입
- 사이드바 네비게이션
- 인쇄 지원

### Step 4: 검증
- 모든 섹션 확인
- 스크린샷 표시 확인
- 인쇄 미리보기 확인
- 모바일 반응형 확인

---

## 5. 각 섹션 콘텐츠 명세

### 5.1 개요 (Overview) 섹션

**콘텐츠**:
- 시스템 소개 (병원 관리를 위한 통합 시스템)
- 접속 방법 (URL, 로그인)
- 전체 메뉴 구조 트리 (Plan 섹션 2)
- 시스템 요구사항 (크롬/엣지 권장)

### 5.2 로그인 (Login) 섹션

**콘텐츠**:
- 스크린샷: 로그인 폼
- 로그인 절차 (이메일 + 비밀번호)
- 비밀번호 분실 시 관리자에게 문의
- 자동 로그아웃 안내

### 5.3 대시보드 (Dashboard) 섹션

**콘텐츠**:
- 스크린샷: 전체 대시보드 화면
- 7개 KPI 카드 설명 (각각 무엇을 의미하는지)
- 7일 트렌드 차트 읽는 법
- 알림 배너 의미 및 대처법
- 오늘의 콜백 위젯 활용법
- 팁: "매일 아침 가장 먼저 확인하세요"

### 5.4 상담관리 (Consultations) 섹션

**콘텐츠**:
- 스크린샷 2장: 테이블 뷰, 인라인 편집
- 상태 흐름도 (SVG/CSS 다이어그램)
- 9개 상태 탭 설명
- 검색/필터 사용법
- 벌크 액션 사용법 (체크박스 → 일괄 처리)
- 인라인 편집 (더블클릭 또는 드롭다운)
- 음성 메모 사용법 (마이크 버튼)
- CSV 내보내기
- 팁 박스: "오늘 콜백만 보기 토글을 활용하세요"

### 5.5 운영현황 (Operations) 섹션

**콘텐츠**:
- 스크린샷 2장: 플로어맵, 칸반 보드
- 뷰 모드 전환 설명
- 케이스 등록 절차
- 상태 변경 방법 (대기 → 진행 → 완료)
- 위치 관리 (라운지 ↔ 시술실)
- 경과 시간 자동 표시
- 팁: "플로어맵으로 전체 현황, 칸반으로 흐름 관리"

### 5.6 재고관리 (Inventory) 섹션

**콘텐츠**:
- 스크린샷 2장: 재고 현황, 사용 모달
- 3탭 설명 (현황/이력/입고)
- 3뷰 모드 (테이블/카드/그룹)
- 재고 상태 구분 (정상/부족/소진)
- 알림 배너 관리
- 재고 사용 등록 (레시피 자동 로드 강조)
- 입고 처리
- 팁: "시술 전 레시피로 빠르게 사용 등록"

### 5.7 알림관리 (Notifications) 섹션

**콘텐츠**:
- 스크린샷: 메인 화면 + KPI
- 팔로업 워크플로우
- 발송 채널 (카카오/SMS/전화)
- 템플릿 관리 (하위 페이지)
- 발송 이력 조회 (하위 페이지)
- 팁: "미발송 건을 매일 처리하세요"

### 5.8 리포트 (Reports) 섹션

**콘텐츠**:
- 스크린샷: KPI + 퍼널 + 차트
- 기간 선택 방법
- 전월 비교 활성화
- 4개 KPI 카드 읽는 법 (목표 달성률 강조)
- 상담 퍼널 분석 방법
- 시술 통계 / 의사 성과
- CSV 내보내기 활용
- 팁: "월간 경영 회의 전에 CSV를 준비하세요"

### 5.9 매출관리 (Revenue) 섹션

**콘텐츠**:
- 스크린샷: 매출 트렌드 + 거래 테이블
- 기간 전환 (오늘/주/월)
- 결제 상태 흐름 (대기 → 완료 → 환불)
- 인라인 결제 처리 방법
- 환불 처리 주의사항
- 팁: "하루 마감 전 '대기' 건을 모두 처리하세요"

### 5.10 이벤트관리 (Events) 섹션

**콘텐츠**:
- 스크린샷 2장: 목록, 생성 폼
- 이벤트 생성 절차 (7단계)
- 상태 배지 설명 (진행중/종료/초안)
- 다국어 입력 (한/영)
- 주요(Featured) 이벤트 설정
- 복제 기능
- 팁: "기존 이벤트를 복제하면 빠르게 새 이벤트를 만들 수 있어요"

### 5.11 팝업관리 (Popups) 섹션

**콘텐츠**:
- 스크린샷: 팝업 목록
- 팝업 생성 절차
- 활성/비활성 관리
- 이벤트와 연동 (팁)

### 5.12 설정 (Settings) 섹션

**콘텐츠**:
- 스크린샷 4장: 시술/직원/감사/기본
- 4개 탭 각각 상세 설명
- 시술 마스터: 추가/편집/활성화 절차
- 직원 관리: 역할별 권한 설명
- 감사 로그: 필터링/검색 방법
- 기본정보: 목표 매출 설정이 리포트에 미치는 영향

### 5.13 통합 워크플로우 섹션

**콘텐츠**:
- 환자 전체 여정 플로우 다이어그램
- 이벤트 캠페인 플로우
- 재고-시술 연동 플로우
- 각 플로우의 섹션 간 링크

### 5.14 역할별 가이드 섹션

**콘텐츠**:
- 탭 기반 역할 전환
- 역할별 추천 메뉴 우선순위
- 일일 루틴 체크리스트
- 주간 루틴 체크리스트

### 5.15 향후 개선 섹션

**콘텐츠**:
- 높은/중간/낮은 우선순위별 기능 목록
- 섹션 간 연동 강화 방안

### 5.16 API 참조 섹션

**콘텐츠**:
- 28개 API 엔드포인트 테이블
- 카테고리별 분류

---

## 6. JavaScript 기능 설계

### 6.1 사이드바 네비게이션
```javascript
// 스크롤 위치에 따라 현재 섹션 하이라이트
// 섹션 클릭 시 smooth scroll
// 모바일: 햄버거 메뉴 토글
```

### 6.2 아코디언 (시나리오)
```javascript
// <details> 태그 사용 (HTML5 네이티브)
// 추가 JS 불필요
```

### 6.3 역할별 탭
```javascript
// 탭 클릭 시 콘텐츠 전환
// data-role 속성으로 매칭
```

### 6.4 인쇄 버튼
```javascript
// window.print() 호출
// @media print CSS로 레이아웃 최적화
```

### 6.5 목차 자동 생성
```javascript
// h2, h3 태그를 순회하여 사이드바 목차 자동 생성
// 중첩 리스트 형태
```

---

## 7. 접근성 설계

| 항목 | 구현 |
|------|------|
| **키보드 네비게이션** | Tab, Enter로 모든 인터랙션 가능 |
| **스크린 리더** | alt 텍스트, aria-label 적용 |
| **색상 대비** | WCAG AA 기준 충족 |
| **인쇄** | @media print로 최적화 |
| **이미지 대체 텍스트** | 모든 스크린샷에 상세 alt 제공 |

---

## 8. 파일 크기 최적화

| 항목 | 목표 |
|------|------|
| **HTML** | < 200KB (인라인 CSS/JS 포함) |
| **스크린샷 각각** | < 300KB (PNG, 1440x900) |
| **전체** | < 6MB (HTML + 18 스크린샷) |

---

## 9. 검증 기준 (Gap Analysis용)

| 항목 | 기준 | 가중치 |
|------|------|--------|
| HTML 파일 생성됨 | `public/admin-guide/index.html` 존재 | 10% |
| 스크린샷 18장 존재 | `screenshots/*.png` 18개 | 15% |
| 10개 메인 섹션 포함 | 대시보드~설정 모두 포함 | 20% |
| 각 섹션에 스크린샷 삽입 | img 태그로 연결 | 10% |
| 기능 테이블 포함 | 각 섹션에 기능 테이블 존재 | 10% |
| 사용 시나리오 포함 | details/summary 아코디언 | 10% |
| 사이드바 네비게이션 | 목차 + 스크롤 연동 | 5% |
| 반응형 (모바일/인쇄) | media query 적용 | 5% |
| 통합 워크플로우 섹션 | 3개 플로우 다이어그램 | 5% |
| 역할별 가이드 섹션 | 4개 역할 탭 | 5% |
| 향후 개선/API 참조 | 테이블 포함 | 5% |

**합격 기준**: 90% 이상

---

## 10. 대안 설계 (스크린샷 불가 시)

개발 서버를 실행할 수 없거나 Playwright가 설치되지 않은 경우:

### 대안 A: 스크린샷 없이 HTML 가이드만 생성
- 스크린샷 자리에 플레이스홀더 박스 (회색 배경 + 설명 텍스트)
- 나중에 스크린샷을 추가할 수 있도록 img src 경로는 유지

### 대안 B: 마크다운 기반 문서
- `docs/admin-user-guide.md` 생성
- GitHub 마크다운 렌더링으로 열람
- 스크린샷은 별도 추가

**권장**: Step 3 (HTML 설명서)를 먼저 완성하고, Step 1-2 (스크린샷)는 별도 실행

---

*이 Design 문서는 Plan의 요구사항을 구체적인 기술 설계로 변환한 것입니다. 구현 시 이 설계를 참조합니다.*
