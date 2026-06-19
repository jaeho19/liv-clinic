# Supabase 설정 가이드

## 1단계: Supabase 프로젝트 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `liv-clinic` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성 (잘 보관!)
   - **Region**: `Northeast Asia (Seoul)` (한국 서버)
   - **Pricing Plan**: `Free` (무료 플랜)
4. "Create new project" 클릭 (약 2분 소요)

---

## 2단계: 환경변수 설정

### 2-1. Supabase API 키 확인

1. Supabase 대시보드 > 프로젝트 선택
2. **Settings** (톱니바퀴 아이콘) > **API**
3. 다음 값 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 문자열)

### 2-2. `.env.local` 파일 업데이트

`liv-clinic/.env.local` 파일에 다음 내용 추가:

```bash
# Naver Maps API
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=cu36wf7hdh

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ 주의**: `.env.local` 파일은 Git에 커밋하지 마세요!

---

## 3단계: 데이터베이스 테이블 생성

### 3-1. SQL Editor 접속

1. Supabase 대시보드 > **SQL Editor** (왼쪽 메뉴)
2. "New query" 클릭

### 3-2. SQL 실행

`supabase-setup.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣기하고 **RUN** 클릭

또는 아래 내용 직접 입력:

```sql
-- consultation_requests 테이블 생성
CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password TEXT,
  phone TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  agree_privacy BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 활성화
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- INSERT 정책 (모든 사람 허용)
CREATE POLICY "Anyone can insert consultations"
  ON consultation_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can view consultations"
  ON consultation_requests
  FOR SELECT
  TO authenticated
  USING (true);
```

### 3-3. 테이블 확인

1. Supabase 대시보드 > **Table Editor** (왼쪽 메뉴)
2. `consultation_requests` 테이블 확인
3. 컬럼 확인:
   - `id` (UUID)
   - `name` (TEXT)
   - `password` (TEXT, nullable)
   - `phone` (TEXT)
   - `treatment_type` (TEXT)
   - `agree_privacy` (BOOLEAN)
   - `status` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

### 3-4. 유입 통계 테이블 생성 (어드민 > 유입 통계)

신규 연락 → 예약 → 내원 흐름을 채널/에이전시별로 기록하는 `inflow_leads` 테이블을 추가합니다.

1. Supabase 대시보드 > **SQL Editor**
2. 루트의 **`inflow-leads-table.sql`** 파일 내용을 복사하여 붙여넣고 **RUN**
3. **Table Editor**에서 `inflow_leads` 테이블 생성 확인 (RLS: 인증된 관리자 전용)
4. 어드민(`/admin/inflow`) > **유입 통계** 메뉴에서 입력/통계 사용

---

## 4단계: 개발 서버 실행 및 테스트

```bash
cd C:\dev\LIV_homepage\liv-clinic
npm run dev
```

1. http://localhost:3000/ko 접속
2. 페이지 하단의 **상담 신청** 폼 확인
3. 테스트 데이터 입력:
   - 성함: `홍길동`
   - 비밀번호: `test1234` (선택)
   - 연락처: `010-1234-5678`
   - 진료과목: `레이저 시술`
   - 개인정보 동의: 체크
4. "상담신청" 버튼 클릭
5. 성공 메시지 확인: "상담신청이 완료되었습니다"

### 4-1. Supabase에서 데이터 확인

1. Supabase 대시보드 > **Table Editor**
2. `consultation_requests` 테이블 선택
3. 방금 제출한 데이터 확인

---

## 5단계: RLS (Row Level Security) 정책

현재 설정된 정책:

### INSERT (상담 신청)
- **누구나 허용**: 익명 사용자(anon)도 상담 신청 가능
- 홈페이지 방문자가 자유롭게 상담 신청 가능

### SELECT (조회)
- **인증된 사용자만**: 관리자만 상담 신청 목록 조회 가능
- 일반 사용자는 본인이 제출한 데이터만 볼 수 없음 (프라이버시 보호)

### UPDATE/DELETE
- **인증된 사용자만**: 관리자만 상태 변경 및 삭제 가능

---

## 6단계: 관리자 인증 설정 (선택사항)

상담 신청 내역을 관리자 페이지에서 보려면 Supabase Auth 설정 필요:

### 6-1. 관리자 계정 생성

1. Supabase 대시보드 > **Authentication** > **Users**
2. "Add user" 클릭
3. 이메일/비밀번호 입력 (관리자 계정)
4. "Create user" 클릭

### 6-2. 관리자 페이지 로그인 구현

향후 `/admin/consultations` 페이지에서 Supabase Auth를 사용하여 로그인 구현

---

## 트러블슈팅

### 1. "Failed to fetch" 에러
- `.env.local` 파일의 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- 개발 서버 재시작: `npm run dev`

### 2. RLS 정책 에러
- Supabase 대시보드 > **SQL Editor**에서 `supabase-setup.sql` 다시 실행
- RLS 정책이 제대로 설정되었는지 확인

### 3. CORS 에러
- API 라우트(`/api/consultation/route.ts`)의 OPTIONS 메서드 확인
- Supabase 프로젝트 설정에서 허용된 도메인 확인

---

## 데이터베이스 스키마

```typescript
interface ConsultationRequest {
  id: string;                    // UUID
  name: string;                  // 성함
  password: string | null;       // 비밀번호 (선택)
  phone: string;                 // 연락처 (하이픈 제거된 숫자)
  treatment_type: string;        // 진료과목
  agree_privacy: boolean;        // 개인정보 동의
  status: 'pending' | 'contacted' | 'completed' | 'cancelled'; // 상태
  created_at: string;            // 생성일시 (ISO 8601)
  updated_at: string;            // 수정일시 (ISO 8601)
}
```

---

## 다음 단계

- [ ] 관리자 페이지 구현 (`/admin/consultations`)
- [ ] 상담 신청 알림 이메일 발송 (Resend API)
- [ ] 상담 신청 SMS 알림 (Twilio/알리고 등)
- [ ] 상태 관리 시스템 (pending → contacted → completed)
- [ ] 통계 대시보드 (일별/월별 상담 신청 건수)
