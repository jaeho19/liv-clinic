# Plan: LIV Admin Operations OS (병원 운영 OS)

> **Feature**: admin-operations-os
> **Created**: 2026-01-31
> **Status**: Draft
> **PDCA Phase**: Plan

---

## 1. 배경 (Background)

### 현재 상태
LIV 성형외과 어드민 시스템에 4개 모듈이 운영 중:
- **대시보드**: 상담 통계 카드 (오늘/미처리/이번달/이벤트/팝업)
- **상담관리**: 리드 목록, 상태 변경 (pending/contacted/completed/cancelled), 검색, CSV 내보내기
- **이벤트관리**: 이벤트 CRUD, 다국어, 이미지 업로드
- **팝업관리**: 팝업 CRUD, 노출 스케줄링

### 문제점 (회의록 기반)
1. **데이터가 보이지 않음**: 매출, 재고, 시술 시간이 엑셀/수기/머릿속에 흩어져 있음
2. **구조적 실수 발생**: 주의사항 전달 누락, 정품 스티커 체크 누락
3. **카파(capacity) 파악 불가**: 의사 추가 시 손익분기, 병목 시간대 판단 불가
4. **연결 부재**: 마케팅/수가/재고가 연결되지 않아 가성비 판단 불가

### 목표
전자차트(보험/DUR 연동)를 건드리지 않고, **별도의 운영 데이터 레이어**를 어드민에 추가하여:
> "상담(리드) → 팔로업 → 내원/케이스(운영) → 재고 차감 → 성과 대시보드"

---

## 2. 범위 (Scope)

### In Scope
| 단계 | 기능 | 우선순위 |
|------|------|----------|
| **Phase 1 (MVP)** | 상담관리 확장 - 팔로업 시스템 | P0 |
| **Phase 2** | 운영 타임라인 - 칸반 보드 | P0 |
| **Phase 3** | 재고관리 + 자동 차감 | P1 |
| **Phase 4** | 리포트 - 시술 효율/매출 분석 | P1 |
| **Phase 5** | 설정 - 시술 마스터/직원 권한 | P2 |

### Out of Scope
- 전자차트(EMR) 연동
- 주민번호/진단명/상세 의무기록 저장
- 보험/DUR 연동
- 결제/PG 연동
- 안전 체크리스트 (후순위)
- 경영 시뮬레이션 (후순위)
- 마케팅 전환율 분석 (후순위)

---

## 3. Phase 1: 상담관리 확장 (MVP)

### 3.1 기능 요구사항

#### 리드 필드 확장
| 필드 | 타입 | 설명 |
|------|------|------|
| `assignee` | text | 담당자 |
| `next_followup_at` | timestamptz | 다음 연락 예정일시 |
| `outcome` | text | 연락 결과 |
| `procedure_tags` | text[] | 관심 시술 태그 배열 |
| `budget_range` | text | 예상 예산 범위 |
| `availability` | text | 내원 가능 요일 |

#### 상태 세분화
기존: `pending | contacted | completed | cancelled`

변경:
| 상태 | 라벨 | 색상 |
|------|------|------|
| `new` | 신규 | amber |
| `callback_scheduled` | 콜백 예정 | blue |
| `no_answer` | 부재중 | orange |
| `re_contact` | 재연락 | purple |
| `reservation_confirmed` | 예약확정 | green |
| `no_show` | 노쇼 | red |
| `completed` | 완료 | emerald |
| `cancelled` | 취소 | gray |

#### "오늘 콜백" 화면
- `next_followup_at`이 오늘인 리드 자동 필터링
- 대시보드 상단에 "오늘 콜백해야 할 목록" 위젯
- 담당자별 필터 지원

### 3.2 UI 변경
- 상담관리 테이블에 `담당자`, `다음 연락`, `관심 시술` 컬럼 추가
- 상태 탭에 새 상태값 반영
- 리드 상세 패널에서 인라인 편집 (팔로업 일시, 예산, 가용 요일)
- 대시보드에 "오늘 콜백" 카드 추가

---

## 4. Phase 2: 운영 타임라인

### 4.1 기능 요구사항

#### 케이스 관리
- 상담 리드에서 "케이스 생성" 버튼으로 전환
- 케이스 카드가 단계별 이동 (칸반):
  ```
  대기 → 마취 → 시술 → 관리 → 종료
  ```
- 각 단계별 타임스탬프 버튼 (클릭 1~2번):
  - 마취 시작/종료
  - 시술 시작/종료
  - 관리 시작/종료

#### 케이스 정보
| 필드 | 타입 | 설명 |
|------|------|------|
| `lead_id` | uuid FK | 연결된 리드 |
| `visit_date` | date | 내원일 |
| `doctor` | text | 담당 의사 |
| `room` | text | 시술실 |
| `state` | enum | 대기/마취/시술/관리/종료 |
| `anesthesia_start/end` | timestamptz | 마취 시작/종료 |
| `procedure_start/end` | timestamptz | 시술 시작/종료 |
| `care_start/end` | timestamptz | 관리 시작/종료 |

### 4.2 UI
- 좌측 메뉴에 "운영현황" 추가
- 칸반 보드 형태: 5개 열 (대기/마취/시술/관리/종료)
- 각 카드에 환자명, 시술명, 경과 시간 표시
- 지연 시 색상 경고 (기본 시간 초과 시 빨간색)

---

## 5. Phase 3: 재고관리

### 5.1 기능 요구사항

#### 재고 아이템 관리
| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | text | 품목명 |
| `unit` | text | 단위 (vial, cc, ea 등) |
| `on_hand` | integer | 현재 재고량 |
| `reorder_point` | integer | 재주문 기준 |
| `expiry_date` | date | 유효기간 (optional) |

#### 시술-재고 연결 (Recipe)
- `procedures` 테이블에 `recipe` JSON 필드
- 예: 보톡스 시술 → 보톡스 1vial + 주사기 2ea
- 시술 종료 시 recipe 기준 자동 차감

#### 재고 트랜잭션
| 타입 | 설명 |
|------|------|
| `use` | 시술 사용 (자동 차감) |
| `receive` | 입고 |
| `dispose` | 폐기 |
| `adjust` | 수동 조정 |

#### 경고 시스템
- `on_hand <= reorder_point` 시 배지/색상 경고
- 대시보드에 "주문 필요" 경고 카드
- 유효기간 임박 아이템 경고 (30일 이내)

### 5.2 UI
- 좌측 메뉴에 "재고관리" 추가
- 재고 목록 테이블 (현재량/기준량/상태 표시)
- 입고/폐기 등록 모달
- 월별 소모량 차트 (간단)

---

## 6. Phase 4: 리포트

### 6.1 기능 요구사항
- 시술별 통계:
  - 평균 소요 시간
  - 평균 매출
  - **시간당 매출** (핵심 지표)
  - 월별 건수
- 상담 전환율:
  - 출처별 리드 수 → 예약 확정 → 내원 전환율
- 재고 소모 리포트:
  - 월별 소모량/금액
  - 품목별 소모 트렌드

### 6.2 UI
- 좌측 메뉴에 "리포트" 추가
- 기간 필터 (이번주/이번달/커스텀)
- 테이블 + 간단한 차트

---

## 7. Phase 5: 설정

### 7.1 기능 요구사항

#### 시술 마스터 관리
- 시술명, 기본 소요시간, 기본 가격, 재고 레시피 설정
- 카테고리: lifting, antiaging, laser, skincare

#### 직원/권한 관리
| 역할 | 권한 |
|------|------|
| `owner` | 전체 접근 + 설정 + 리포트 |
| `admin` | 전체 접근 (설정 제외) |
| `staff` | 상담/운영현황만 |

#### 감사 로그
- 모든 데이터 변경 기록 (actor, entity, action, before/after)

### 7.2 UI
- 좌측 메뉴에 "설정" 추가
- 탭: 시술 관리 / 직원 관리 / 감사 로그

---

## 8. 데이터베이스 설계 (개요)

### 신규 테이블
```
leads (consultation_requests 확장)
  + assignee, next_followup_at, outcome, procedure_tags[], budget_range, availability
  + status enum 확장

cases
  lead_id FK → leads
  visit_date, doctor, room, state
  anesthesia_start/end, procedure_start/end, care_start/end
  procedure_id FK → procedures

procedures
  name, category, default_duration_min, price_default, recipe (jsonb)

inventory_items
  name, unit, on_hand, reorder_point, expiry_date

inventory_tx
  case_id FK → cases, item_id FK → inventory_items
  qty, tx_type (use/receive/dispose/adjust)

staff
  user_id FK → auth.users, name, role (owner/admin/staff)

audit_log
  actor, entity, entity_id, action, before_data, after_data
```

### 기존 테이블 변경
- `consultation_requests`: 컬럼 추가 (기존 데이터 호환 유지)

---

## 9. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| Frontend | Next.js 16 (App Router) | 기존 프로젝트 동일 |
| Styling | Tailwind CSS 4.x | 기존 프로젝트 동일 |
| DB | Supabase (PostgreSQL) | 기존 인프라 활용 |
| Auth | Supabase Auth | 기존 인증 시스템 활용 |
| Storage | Supabase Storage | 기존 이미지 업로드 활용 |
| 상태관리 | React hooks (useState/useCallback) | 기존 패턴 유지, 과도한 추상화 지양 |
| 차트 | Recharts (필요시) | Phase 4 리포트용 |

---

## 10. 좌측 메뉴 구조 (최종)

```
LIV 관리자
홈페이지 관리 시스템
──────────────────
📊  대시보드
📋  상담관리(리드)       ← Phase 1 확장
🏥  운영현황(타임라인)   ← Phase 2 신규
📦  재고관리             ← Phase 3 신규
📈  리포트               ← Phase 4 신규
──────────────────
🎉  이벤트관리           (기존 유지)
🪟  팝업관리             (기존 유지)
──────────────────
⚙️  설정                 ← Phase 5 신규
🌐  사이트 보기
🚪  로그아웃
```

---

## 11. 동작 시나리오

### 시나리오 1: 리드 → 예약 확정
1. 환자가 홈페이지 상담 폼 제출 → `leads` 테이블에 `new` 상태로 저장
2. 상담관리에 표시 → 담당자 배정, `callback_scheduled` + `next_followup_at` 설정
3. "오늘 콜백" 화면에 자동 노출
4. 전화 후 `reservation_confirmed`으로 상태 변경

### 시나리오 2: 내원 → 시술 → 종료
1. 예약확정 리드에서 "케이스 생성" 클릭 → `cases` 생성
2. 운영현황 보드 "대기" 열에 카드 표시
3. 직원이 "마취 시작" 클릭 → 카드가 "마취" 열로 이동
4. "시술 시작" → "시술" 열, "시술 종료" → "관리" 열
5. "관리 종료" → "종료" 열

### 시나리오 3: 시술 종료 → 재고 자동 차감
1. 케이스에 연결된 procedure의 recipe 조회
2. recipe의 각 아이템에 대해 `inventory_tx` (type: `use`) 자동 생성
3. `inventory_items.on_hand` 차감
4. `on_hand <= reorder_point` 이면 대시보드 + 재고관리에서 경고

---

## 12. 보안/규정

- **저장하지 않는 정보**: 주민번호, 진단명, 상세 의무기록
- **최소 수집 원칙**: 운영에 필요한 정보만 저장 (이름, 전화번호, 시술 종류)
- **전화번호 마스킹**: 목록에서 `010-****-1234` 형태 표시 (옵션)
- **RBAC**: owner/admin/staff 역할 구분
- **감사 로그**: 모든 데이터 변경 기록 (who, what, when, before/after)
- **RLS**: Supabase Row Level Security로 테이블 접근 제어

---

## 13. 구현 순서 (권장)

```
Phase 1 (MVP): 상담관리 확장
├── 1-1. DB 스키마 변경 (consultation_requests 컬럼 추가)
├── 1-2. 상태 enum 확장 + 타입 정의
├── 1-3. 상담관리 UI 확장 (새 필드/상태/필터)
├── 1-4. "오늘 콜백" 위젯 (대시보드)
└── 1-5. 대시보드 통계 카드 업데이트

Phase 2: 운영 타임라인
├── 2-1. cases / procedures 테이블 생성
├── 2-2. 타입 정의 + API 라우트
├── 2-3. "케이스 생성" 버튼 (상담관리 → 케이스)
├── 2-4. 칸반 보드 UI
└── 2-5. 타임스탬프 버튼 + 상태 전이 로직

Phase 3: 재고관리
├── 3-1. inventory_items / inventory_tx 테이블 생성
├── 3-2. 재고 CRUD API
├── 3-3. 재고 목록 UI + 입고/폐기 모달
├── 3-4. 시술-재고 recipe 연결
└── 3-5. 자동 차감 로직 + 경고

Phase 4: 리포트
├── 4-1. 시술별 통계 쿼리
├── 4-2. 상담 전환율 쿼리
├── 4-3. 리포트 UI (테이블 + 차트)
└── 4-4. 기간 필터

Phase 5: 설정
├── 5-1. staff 테이블 + 권한 미들웨어
├── 5-2. 시술 마스터 관리 UI
├── 5-3. 직원 관리 UI
└── 5-4. 감사 로그 뷰어
```

---

## 14. 사이드바 메뉴 구분선 (운영 vs 홈페이지)

현재 사이드바가 홈페이지 관리 기능만 있으므로, 운영 기능 추가 시 시각적 구분이 필요:

```
── 병원 운영 ──
  대시보드 / 상담관리 / 운영현황 / 재고관리 / 리포트

── 홈페이지 관리 ──
  이벤트관리 / 팝업관리

── 시스템 ──
  설정 / 사이트 보기 / 로그아웃
```

---

## 15. 리스크 및 고려사항

| 리스크 | 대응 |
|--------|------|
| 기존 consultation_requests 데이터 호환 | ALTER TABLE ADD COLUMN으로 기존 데이터 유지, 새 컬럼은 nullable |
| 직원 사용 저항 | 최소 클릭 (1~2번)으로 입력, 복잡한 폼 지양 |
| 실시간성 | Supabase Realtime 구독 고려 (Phase 2 칸반에서) |
| 모바일 대응 | 태블릿/PC 우선, 운영현황은 터치 최적화 필요 |
| 개인정보 | 주민번호/진단명 절대 저장 안 함, 전화번호 마스킹 옵션 |
