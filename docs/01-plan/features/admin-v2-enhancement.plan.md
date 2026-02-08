# LIV 관리자 페이지 V2 기능 강화 계획서

> Feature: `admin-v2-enhancement`
> Created: 2026-02-08
> Status: Plan

---

## 1. 현재 상태 분석

### 1.1 기존 관리자 페이지 구조

| 모듈 | 경로 | 상태 | 주요 기능 |
|------|------|------|-----------|
| 대시보드 | `/admin/dashboard` | 구현됨 | KPI 카드, 최근 상담/시술 |
| 상담관리 | `/admin/consultations` | 구현됨 | 리드 상태관리, 벌크 액션, CSV 다운로드, 음성메모 |
| 알림관리 | `/admin/notifications` | 구현됨 | 시술 기록 등록, 발송 대상 목록, **발송은 DB 상태만 변경** |
| 수술관리 | `/admin/operations` | 구현됨 | 시술 케이스 등록/관리 |
| 매출관리 | `/admin/revenue` | 구현됨 | KPI, 거래내역, 7일 추이 차트 |
| 재고관리 | `/admin/inventory` | 구현됨 | 현황판(3뷰), 사용기록, 입고관리, 알림배너 |
| 리포트 | `/admin/reports` | 구현됨 | 퍼널, 시술별/의사별 통계, 일별 추이, 전월비교 |
| 설정 | `/admin/settings` | 구현됨 | 클리닉/스태프/시술/감사로그 |

### 1.2 핵심 미구현 사항

- **카카오 알림톡/SMS 실제 발송**: 현재 "발송 처리" 버튼은 DB notification_history에 기록만 남김
- **시술 주기 자동 알림 스케줄링**: notification_cycle_days 필드는 있지만 자동 발송 없음
- **매출 데이터 이중 입력 문제**: 별도 CRM 사용 중이라 LIV 관리자에 수동 입력 부담
- **상담-알림 실시간 연동**: 상담 상태 변경 시 알림 없음
- **재고 현황판 개선**: 자동 주문 불필요, 시각적 대시보드 보강 필요

---

## 2. 요구사항 정의

### 2.1 핵심 요구사항 (사용자 직접 요청)

#### FR-01: 카카오 알림톡/SMS 자동 발송 시스템
- 시술 기록 등록 시 시술별 주기에 따라 자동 알림 예약
- 시술별 알림 주기를 관리자가 설정 가능 (예: 울쎄라 90일, 보톡스 90일, 필러 180일)
- 알림 예정일에 자동으로 카카오 알림톡 또는 SMS 발송
- **외부 서비스**: NHN Cloud Alimtalk API 또는 Solapi (구 CoolSMS) 사용

#### FR-02: 매출 데이터 CSV 일괄 업로드 (CRM 연동)
- 기존 CRM에서 내보낸 CSV 파일을 LIV 관리자에 업로드
- CSV 파일 파싱 → 데이터 검증 → DB 일괄 저장
- 업로드된 매출 데이터로 리포트 자동 생성
- **활용 방안**: 시술별 매출 분석, 의사별 실적, 월별 트렌드, 고객 재방문율

#### FR-03: 상담관리 실시간 알림 연동
- 새 상담 접수 시 브라우저 알림 + 대시보드 뱃지
- 콜백 예정 시간 도래 시 실시간 알림
- 상담 이력 타임라인 (날짜별 메모, 통화 기록, 상태 변경)
- Supabase Realtime 채널 구독으로 실시간 업데이트

#### FR-04: 재고 현황판 강화
- 현재 이미 구현된 3뷰(테이블/카드/그룹) + 알림배너 유지
- 소모 속도 기반 "예상 소진일" 표시 추가
- 카테고리별 재고 현황 요약 대시보드 보강
- 자동 주문 기능은 **제외** (현황 확인 목적)

### 2.2 추가 기능 (아이디어 기반 - 우선순위별)

#### 높은 우선순위

| ID | 기능 | 설명 | 의존성 |
|----|------|------|--------|
| FR-05 | 카카오 알림톡 API 연동 | NHN Cloud 또는 Solapi API 실제 연동 | FR-01 |
| FR-06 | SMS 실제 발송 | 카카오 실패 시 SMS 폴백 | FR-05 |
| FR-07 | 환자 프로필 (간소화) | CRM과 중복 방지 - LIV에는 시술/상담 이력 조회만 | 별도 CRM 데이터 참조 |

#### 중간 우선순위

| ID | 기능 | 설명 |
|----|------|------|
| FR-08 | 비포/애프터 갤러리 관리 | 시술 전후 사진 업로드 (Supabase Storage) |
| FR-09 | 네이버 예약 연동 | 네이버 예약 API 데이터 동기화 |
| FR-10 | 카카오톡 채널 자동응답 | 카카오 채널 메시지 웹훅 수신 |
| FR-11 | 전화(CTI) 연동 | 전화 발신/수신 연동 (장기) |

#### 낮은 우선순위

| ID | 기능 | 설명 |
|----|------|------|
| FR-12 | Google Analytics 연동 | GA4 API로 대시보드에 트래픽 표시 |
| FR-13 | Naver Analytics 연동 | 네이버 애널리틱스 API |
| FR-14 | 비교 리포트 강화 | 전월/전년 비교 차트 개선 |

---

## 3. 구현 전략 및 페이즈 분할

### Phase 1: 시술 주기 자동 알림 시스템 (FR-01, FR-05, FR-06)

**목표**: 시술 기록 등록 → 주기에 따라 자동 알림 발송

#### 3.1.1 시술별 기본 주기 설정

**DB 변경**: `treatment_masters` 테이블에 컬럼 추가
```sql
ALTER TABLE treatment_masters ADD COLUMN default_cycle_days INTEGER DEFAULT NULL;
ALTER TABLE treatment_masters ADD COLUMN notification_template_id UUID REFERENCES notification_templates(id);
```

**시술별 기본 주기 예시**:
| 시술 | 카테고리 | 기본 주기 |
|------|----------|-----------|
| 울쎄라 | lifting | 90일 (3개월) |
| 써마지 FLX | lifting | 180일 (6개월) |
| 보톡스 | antiaging | 90일 (3개월) |
| 필러 | antiaging | 180~365일 |
| 피코레이저 | laser | 30일 (1개월) |
| 스킨부스터 | antiaging | 30일 (1개월) |

**설정 UI**: `/admin/settings` 페이지 시술 관리 탭에 "기본 알림 주기" 컬럼 추가

#### 3.1.2 알림 발송 API (카카오 알림톡 + SMS 폴백)

**외부 API 선택: Solapi (구 CoolSMS)**
- 카카오 알림톡 + SMS 통합 제공
- Node.js SDK 지원
- 발송당 비용: 알림톡 ~8원, SMS ~20원
- 사전에 카카오 비즈니스 채널 등록 + 템플릿 승인 필요

**API 구조**:
```
POST /api/admin/notifications/send
  → Solapi API (카카오 알림톡 우선, 실패 시 SMS 폴백)
  → notification_history에 발송 결과 기록
  → patient_treatments.notification_sent = true 업데이트
```

**환경변수**:
```env
SOLAPI_API_KEY=xxx
SOLAPI_API_SECRET=xxx
SOLAPI_SENDER_NUMBER=02-xxxx-xxxx
KAKAO_PFID=@리브성형외과     # 카카오 채널 프로필 ID
```

#### 3.1.3 자동 발송 스케줄러

**방법**: Supabase Edge Function + pg_cron (또는 Vercel Cron)
```
매일 오전 9시 실행:
1. patient_treatments에서 next_notification_at <= today 이고 notification_sent = false인 건 조회
2. 각 건에 대해 Solapi API 호출
3. 발송 결과 업데이트
4. 발송 후 다음 주기 계산하여 next_notification_at 갱신
```

**Vercel Cron (vercel.json)**:
```json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "0 0 * * *"
  }]
}
```

**작업 항목**:
- [ ] Solapi SDK 설치 및 환경변수 설정
- [ ] 카카오 비즈니스 채널 등록 + 알림톡 템플릿 승인 신청
- [ ] `POST /api/admin/notifications/send` API 구현
- [ ] `GET /api/cron/send-notifications` 크론 API 구현
- [ ] `treatment_masters.default_cycle_days` 컬럼 추가 마이그레이션
- [ ] 설정 페이지에 시술별 주기 관리 UI 추가
- [ ] 알림관리 페이지에 "자동 발송" vs "수동 발송" 구분 표시
- [ ] 발송 이력에 실제 발송 결과(성공/실패/폴백) 기록

---

### Phase 2: 매출 CSV 업로드 및 리포트 연동 (FR-02)

**목표**: CRM에서 CSV 내보내기 → LIV 관리자 업로드 → 리포트 자동 반영

#### 3.2.1 CSV 업로드 기능

**CSV 예상 포맷** (CRM에서 내보내는 형식에 맞춤):
```csv
날짜,환자명,시술명,카테고리,담당의,금액,할인,결제수단,결제상태
2026-02-01,김OO,울쎄라,lifting,김수영,3500000,500000,카드,완료
2026-02-01,이OO,보톡스,antiaging,천신혜,300000,0,현금,완료
```

**업로드 플로우**:
```
1. 매출관리 페이지에 "CSV 업로드" 버튼 추가
2. 파일 선택 → 클라이언트에서 Papa Parse로 파싱
3. 미리보기 테이블 표시 (매핑 확인)
4. 컬럼 매핑 설정 (CRM 컬럼명 → DB 컬럼명)
5. "업로드 확인" → POST /api/admin/revenue/import
6. 중복 체크 (날짜+환자명+시술명 조합)
7. 일괄 INSERT → operation_cases 테이블
```

**API 구조**:
```
POST /api/admin/revenue/import
  Body: { rows: [...], mappings: {...} }
  → 데이터 검증 → 중복 체크 → 일괄 INSERT
  → 결과 반환: { imported: 45, skipped: 3, errors: [...] }
```

#### 3.2.2 CSV 컬럼 매핑 저장

- 한번 매핑하면 `clinic_settings`에 저장하여 다음 업로드 시 자동 적용
- CRM 종류에 따라 프리셋 제공 가능

#### 3.2.3 리포트 연동 강화

CSV 업로드 데이터가 `operation_cases`에 들어가면 기존 리포트가 자동으로 반영됨 (동일 테이블 사용).

**추가 분석 기능**:
- 시술별 재방문율 (동일 환자 반복 시술 비율)
- 신규 vs 재방문 환자 비율
- 시간대별 시술 분포
- 월별 매출 트렌드 (최근 6개월)
- 고객 LTV (생애가치) 추정

**작업 항목**:
- [ ] `papa parse` 패키지 설치
- [ ] 매출관리 페이지에 CSV 업로드 UI 컴포넌트 추가
- [ ] CSV 파싱 + 미리보기 + 컬럼 매핑 UI
- [ ] `POST /api/admin/revenue/import` API 구현
- [ ] 중복 체크 로직 (날짜+환자명+시술명)
- [ ] 리포트 페이지에 재방문율/신규비율 추가

---

### Phase 3: 상담관리 실시간 알림 연동 (FR-03)

**목표**: 상담 상태 변경 실시간 반영 + 콜백 알림 + 상담 이력 타임라인

#### 3.3.1 실시간 알림 시스템

**Supabase Realtime 활용**:
```typescript
// 상담관리 페이지에서 구독
const channel = supabase
  .channel('consultation_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'consultation_requests'
  }, (payload) => {
    // 새 상담 접수 또는 상태 변경 시 UI 업데이트
    handleRealtimeUpdate(payload);
  })
  .subscribe();
```

**브라우저 알림**:
```
1. Notification API 권한 요청
2. 새 상담 접수 시 → "새 상담이 접수되었습니다: [환자명] - [시술]"
3. 콜백 시간 도래 시 → "[환자명] 콜백 예정입니다 (XX:XX)"
```

#### 3.3.2 콜백 알림 스케줄러

- 페이지 로드 시 오늘의 콜백 예정 목록 조회
- 1분마다 현재 시간 vs 콜백 예정 시간 비교
- 해당 시간 도래 시 브라우저 알림 + 화면 내 토스트 알림

#### 3.3.3 상담 이력 타임라인

**새 테이블**: `consultation_timeline`
```sql
CREATE TABLE consultation_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultation_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'status_change', 'note_added', 'call_made', 'callback_set', 'assigned'
  description TEXT NOT NULL,
  actor TEXT,                -- 변경한 담당자
  metadata JSONB,            -- 이전 상태, 새 상태 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**자동 기록**:
- 상태 변경 시 → 자동으로 타임라인에 기록
- 메모 추가/수정 시 → 기록
- 담당자 배정/변경 시 → 기록
- 콜백 설정 시 → 기록

**UI**: 상담 상세 확장 영역에 타임라인 표시 (최신순)

**작업 항목**:
- [ ] `consultation_timeline` 테이블 마이그레이션
- [ ] Supabase Realtime 채널 구독 코드 추가
- [ ] 브라우저 Notification API 연동
- [ ] 콜백 시간 체크 인터벌 (1분)
- [ ] 상담 이력 타임라인 API + UI 컴포넌트
- [ ] 상태 변경 시 자동 타임라인 기록 로직
- [ ] 대시보드에 실시간 알림 뱃지 추가

---

### Phase 4: 재고 현황판 강화 (FR-04)

**목표**: 기존 현황판에 예측 기능 추가

#### 3.4.1 예상 소진일 계산

```typescript
// 최근 30일 사용량 기준 소모 속도 계산
const recentUsage = transactions
  .filter(t => t.tx_type === 'use' && isWithin30Days(t.created_at))
  .reduce((sum, t) => sum + t.quantity, 0);

const dailyRate = recentUsage / 30;
const daysUntilEmpty = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : Infinity;
```

**표시 방법**: 각 품목 카드/테이블 행에 "예상 소진일: X일 후" 표시
- 7일 이내: 빨간색 경고
- 14일 이내: 주황색 주의
- 그 외: 초록색

#### 3.4.2 카테고리별 요약 강화

기존 `StockDashboard` 컴포넌트에 추가:
- 카테고리별 재고 금액 합계
- 최근 30일 소모 추이 미니 차트
- 발주 필요 품목 요약

**작업 항목**:
- [ ] 예상 소진일 계산 유틸리티 함수
- [ ] StockTableView/StockCardView에 소진일 표시
- [ ] StockDashboard에 카테고리별 금액/소모 추이 추가
- [ ] API에 소모 속도 데이터 포함 (transactions 기반)

---

### Phase 5: 환자 프로필 간소화 (FR-07)

**방향**: CRM과 중복을 피하고, LIV 관리자에서는 **시술/상담 통합 조회만** 제공

#### 3.5.1 환자 검색 통합 뷰

새 페이지: `/admin/patients` (또는 기존 페이지에 탭 추가)

```
환자명 또는 전화번호로 검색
  → patient_treatments 테이블에서 시술 이력 조회
  → consultation_requests 테이블에서 상담 이력 조회
  → notification_history에서 알림 발송 이력 조회
  → 통합 타임라인으로 표시
```

**핵심**: 새 DB 테이블 **불필요** - 기존 데이터를 환자 기준으로 모아서 보여주기만 함

**작업 항목**:
- [ ] 환자 검색 API (`GET /api/admin/patients/search?q=환자명`)
- [ ] 환자 통합 프로필 뷰 UI
- [ ] 시술 이력 + 상담 이력 + 알림 이력 통합 표시

---

## 4. 기술 의사결정

### 4.1 메시지 발송 서비스 선택

| 서비스 | 카카오 알림톡 | SMS | SDK | 비용 |
|--------|-------------|-----|-----|------|
| **Solapi** | O | O | Node.js | 알림톡 8원/건, SMS 20원/건 |
| NHN Cloud | O | O | REST API | 알림톡 7.5원/건, SMS 15원/건 |
| 카카오 직접 | O | X | REST API | 5원/건 (SMS 별도) |

**추천: Solapi** - 카카오+SMS 통합, Node.js SDK 편의성, 중소 규모 적합

### 4.2 실시간 알림 기술

| 방법 | 설명 | 복잡도 | 비용 |
|------|------|--------|------|
| **Supabase Realtime** | PostgreSQL LISTEN/NOTIFY 기반 | 낮음 | 무료 (기존 인프라) |
| WebSocket 직접 구현 | 별도 서버 필요 | 높음 | 서버 비용 |
| Polling (1분 간격) | 가장 단순 | 최저 | API 호출 비용 |

**추천: Supabase Realtime** - 이미 Supabase 사용 중이므로 추가 비용 없음

### 4.3 크론 잡 (자동 발송)

| 방법 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **Vercel Cron** | vercel.json에 설정 | 배포 통합, 무료 | 하루 1회 제한(무료) |
| Supabase pg_cron | DB 레벨 크론 | 정밀 스케줄링 | Edge Function 필요 |
| GitHub Actions | 별도 워크플로우 | 유연 | 관리 복잡 |

**추천: Vercel Cron** - 하루 1회 오전 발송이면 충분, 배포와 통합

### 4.4 CRM 중복 문제 해결 방향

| 기능 | CRM에서 담당 | LIV 관리자에서 담당 |
|------|-------------|-------------------|
| 환자 기본정보 | CRM (마스터) | 조회만 (CSV 업로드 시) |
| 시술 예약 | CRM | 조회 (CSV 연동) |
| 매출 기록 | CRM (마스터) | CSV 업로드로 가져오기 |
| 상담 접수 | 웹사이트 폼 → LIV | LIV (마스터) |
| 시술 기록/알림 | X | LIV (마스터) |
| 재고 관리 | X | LIV (마스터) |
| 리포트/분석 | 기본 보고서 | 고급 분석 + 시각화 |

---

## 5. 구현 순서 (로드맵)

```
Phase 1 (1주차): 시술 주기 설정 + 알림톡 API 연동
  ├── treatment_masters에 default_cycle_days 추가
  ├── Solapi SDK 연동 + 발송 API
  ├── 설정 페이지에 시술별 주기 관리 UI
  └── 자동 발송 크론 잡

Phase 2 (2주차): 매출 CSV 업로드 + 리포트 강화
  ├── CSV 업로드 UI + 파싱 + 미리보기
  ├── 매출 데이터 일괄 import API
  ├── 리포트에 재방문율/신규비율 추가
  └── 월별 트렌드 확장

Phase 3 (3주차): 상담 실시간 알림 + 타임라인
  ├── Supabase Realtime 구독
  ├── 브라우저 알림 + 콜백 체크
  ├── consultation_timeline 테이블
  └── 상담 이력 UI

Phase 4 (3주차): 재고 현황판 강화
  ├── 예상 소진일 계산/표시
  └── 카테고리 요약 보강

Phase 5 (4주차): 환자 통합 프로필 + 추가 기능
  ├── 환자 검색 통합 뷰
  ├── 비포/애프터 갤러리 (Supabase Storage)
  └── 비교 리포트 강화
```

---

## 6. 필요한 외부 서비스 사전 준비

| 항목 | 필요 작업 | 소요 시간 | 담당 |
|------|-----------|-----------|------|
| 카카오 비즈니스 채널 | 카카오 비즈니스센터에서 채널 생성 | 즉시 | 원장님 |
| 알림톡 템플릿 승인 | 카카오에 메시지 템플릿 제출 → 검수 | 1~3영업일 | 개발+원장님 |
| Solapi 계정 | solapi.com 회원가입 + API 키 발급 | 즉시 | 개발 |
| 발신번호 등록 | Solapi에 병원 전화번호 등록 | 1~2영업일 | 개발 |

---

## 7. 리스크 및 고려사항

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 카카오 템플릿 승인 지연 | 알림톡 발송 불가 | SMS 폴백으로 먼저 운영 |
| CRM CSV 포맷 불일치 | 업로드 실패 | 유연한 컬럼 매핑 UI 제공 |
| 개인정보보호법 | 환자 정보 처리 | 최소 수집, 마스킹, 감사로그 |
| 발송 비용 | 월 비용 발생 | 일 발송량 제한 + 비용 모니터링 |

---

## 8. 예상 DB 변경 사항

### 새 테이블
- `consultation_timeline` - 상담 이력 타임라인

### 컬럼 추가
- `treatment_masters.default_cycle_days` (INTEGER)
- `treatment_masters.notification_template_id` (UUID)

### 인덱스 추가
- `idx_patient_treatments_next_notification` ON patient_treatments(next_notification_at) WHERE notification_sent = false
- `idx_consultation_timeline_consultation` ON consultation_timeline(consultation_id)

---

## 9. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 알림 발송 자동화율 | 0% (수동) | 90% (자동) |
| 매출 데이터 입력 시간 | 수동 입력 | CSV 업로드 5분 |
| 상담 응답 시간 | 알림 없음 | 실시간 알림 |
| 재고 파악 시간 | 현황판 확인 | 예상 소진일 자동 표시 |
