# Design: 사용가이드 AI 검색 기능

> **Feature**: guide-ai-search
> **Plan Reference**: `docs/01-plan/features/guide-ai-search.plan.md`
> **Created**: 2026-02-08
> **Status**: Design Phase

---

## 1. 설계 개요

기존 가이드 페이지(`guide/page.tsx`) 단일 파일에 검색 기능을 추가한다.
외부 API 없이 클라이언트 사이드 키워드 매칭 검색을 구현하며,
기존 Helper 컴포넌트와 디자인 시스템을 그대로 활용한다.

---

## 2. 데이터 설계

### 2.1 검색 인덱스 타입

```typescript
interface GuideSearchEntry {
  id: string;                // 고유 ID (예: 'revenue-scenario-b')
  sectionId: string;         // TOC_SECTIONS의 id ('revenue', 'inventory' 등)
  type: 'scenario' | 'feature' | 'faq' | 'tip' | 'overview';
  title: string;             // 표시 제목
  content: string;           // 발췌 내용 (검색 결과에 표시)
  keywords: string[];        // 매칭용 키워드 배열
}
```

### 2.2 검색 인덱스 데이터 (`GUIDE_SEARCH_INDEX`)

파일 상단에 `const GUIDE_SEARCH_INDEX: GuideSearchEntry[]`로 정의한다.
각 항목은 가이드 페이지의 시나리오/기능/FAQ/팁에서 추출한다.

**총 항목 수: ~50개** (14개 섹션 x 평균 3~4개 항목)

```typescript
const GUIDE_SEARCH_INDEX: GuideSearchEntry[] = [
  // ── 시스템 개요 ──
  {
    id: 'overview-access',
    sectionId: 'overview',
    type: 'overview',
    title: '접속 방법',
    content: '브라우저에서 관리자 페이지 URL/admin 접속 → 이메일/비밀번호 로그인 → 좌측 사이드바에서 메뉴 선택',
    keywords: ['접속', '로그인', '브라우저', 'URL', '사이드바', '시작', '처음'],
  },
  {
    id: 'overview-logout',
    sectionId: 'overview',
    type: 'overview',
    title: '로그아웃 방법',
    content: 'PC: 좌측 사이드바 하단 로그아웃 버튼. 모바일: ☰ 메뉴 열기 → 하단 로그아웃 버튼',
    keywords: ['로그아웃', '로그 아웃', '나가기', '종료', '퇴근'],
  },
  {
    id: 'overview-pwa',
    sectionId: 'overview',
    type: 'tip',
    title: '모바일에서 앱처럼 사용하기',
    content: 'Chrome > 메뉴 > "홈 화면에 추가" 또는 Safari > 공유 > "홈 화면에 추가"를 하면 앱 아이콘처럼 바로 접속 가능',
    keywords: ['앱', '설치', 'PWA', '홈화면', '홈 화면', '아이콘', '모바일'],
  },

  // ── 대시보드 ──
  {
    id: 'dashboard-usage',
    sectionId: 'dashboard',
    type: 'scenario',
    title: '출근 후 당일 현황 확인',
    content: '로그인 시 자동 표시. 통계 카드 클릭으로 해당 페이지 이동. 오늘의 콜백/알림 예정 확인',
    keywords: ['대시보드', '현황', '통계', '출근', '오늘', '카드', '7일', '추이'],
  },

  // ── 상담관리 ──
  {
    id: 'consult-new',
    sectionId: 'consultations',
    type: 'scenario',
    title: '신규 상담 접수 후 처리',
    content: '신규 탭에서 확인 → 상세 열기 → 담당자 배정 → 상태 변경(콜백예정/예약확정) → 메모 작성(음성 가능)',
    keywords: ['신규', '상담', '접수', '담당자', '배정', '상태', '변경', '메모'],
  },
  {
    id: 'consult-callback',
    sectionId: 'consultations',
    type: 'scenario',
    title: '콜백 처리',
    content: '콜백예정 탭 → "오늘 콜백만" 체크 → 전화 후 팔로업 결과 기록 → 다음 콜백 설정 또는 예약확정',
    keywords: ['콜백', '팔로업', '전화', '재연락', '콜백예정', '오늘'],
  },
  {
    id: 'consult-bulk',
    sectionId: 'consultations',
    type: 'scenario',
    title: '벌크(일괄) 처리',
    content: '체크박스로 여러 건 선택 → 상단 벌크 액션 바에서 상태 일괄 변경 또는 담당자 일괄 배정',
    keywords: ['벌크', '일괄', '한번에', '여러', '선택', '일괄변경'],
  },
  {
    id: 'consult-features',
    sectionId: 'consultations',
    type: 'feature',
    title: '상담관리 주요 기능',
    content: '상태 탭 필터(9개), 검색/필터, 인라인 편집, 음성 메모, 타임라인, 벌크 액션, CSV 다운로드, 실시간 알림',
    keywords: ['상담', '필터', '검색', '인라인', '편집', '타임라인', 'CSV', '다운로드', '알림'],
  },

  // ── 운영현황 ──
  {
    id: 'ops-new-case',
    sectionId: 'operations',
    type: 'scenario',
    title: '환자 입실 시 케이스 등록',
    content: '+ 새 케이스 버튼 → 수동/음성 입력 → 환자명, 시술, 담당의, 소요시간 입력 → 대기실에 케이스 생성',
    keywords: ['케이스', '등록', '입실', '환자', '새 케이스', '시술실', '운영'],
  },
  {
    id: 'ops-move-complete',
    sectionId: 'operations',
    type: 'scenario',
    title: '시술실 이동 및 완료 처리',
    content: '평면도에서 방 클릭 → 대기 케이스 시작 → 시술 완료 버튼(소요시간 자동 기록)',
    keywords: ['시술실', '이동', '완료', '평면도', '방', '시작', '소요시간'],
  },
  {
    id: 'ops-features',
    sectionId: 'operations',
    type: 'feature',
    title: '운영현황 주요 기능',
    content: '평면도(시술실 배치), 칸반보드(5단계), 통계 배지, 음성 입력, 소요시간 자동 업데이트',
    keywords: ['평면도', '칸반', '보드', '배치', '통계', '음성', '입력', '운영현황'],
  },

  // ── 재고관리 ──
  {
    id: 'inv-use',
    sectionId: 'inventory',
    type: 'scenario',
    title: '시술 후 소모품 사용 기록',
    content: '사용 기록 버튼 → 시술 레시피 선택(자동 채움) → 사용량 확인/조정 → 저장(재고 자동 차감)',
    keywords: ['사용', '기록', '소모품', '레시피', '차감', '재고', '시술'],
  },
  {
    id: 'inv-restock',
    sectionId: 'inventory',
    type: 'scenario',
    title: '부족 재고 입고 처리',
    content: '부족 재고 알림 배너 확인 → 품목 클릭(상세 패널) → 입고 버튼 → 수량/메모 입력',
    keywords: ['입고', '부족', '소진', '재고', '주문', '알림', '배너', '공급'],
  },
  {
    id: 'inv-features',
    sectionId: 'inventory',
    type: 'feature',
    title: '재고관리 주요 기능',
    content: '3개 탭(현황/사용이력/입고), 3가지 뷰(테이블/카드/그룹), 검색, 시술 레시피, 소진 예측',
    keywords: ['재고', '뷰', '테이블', '카드', '그룹', '카테고리', '예측', '소진'],
  },

  // ── 알림관리 ──
  {
    id: 'noti-send',
    sectionId: 'notifications',
    type: 'scenario',
    title: '시술 후 재방문 알림 발송',
    content: '시술 기록 추가 → 알림 주기 설정(보톡스 90일 등) → KPI 카드에서 발송 대상 확인 → 채널 선택(카카오/SMS) → 실제 발송',
    keywords: ['알림', '발송', '재방문', '카카오톡', 'SMS', '문자', '주기', '시술기록'],
  },
  {
    id: 'noti-history',
    sectionId: 'notifications',
    type: 'scenario',
    title: '발송 이력 확인',
    content: '발송 이력 버튼 → 채널/상태/기간 필터 → 이력 테이블 확인 → CSV 내보내기(선택)',
    keywords: ['발송', '이력', '히스토리', '내역', '확인', 'CSV'],
  },
  {
    id: 'noti-template',
    sectionId: 'notifications',
    type: 'scenario',
    title: '알림 템플릿 관리',
    content: '템플릿 버튼 → 새 템플릿 추가(시술명/유형/메시지) → {name},{treatment},{days},{event} 변수 활용 → 영상 URL 첨부',
    keywords: ['템플릿', '메시지', '변수', '작성', '알림문구', '영상'],
  },

  // ── 리포트 ──
  {
    id: 'report-monthly',
    sectionId: 'reports',
    type: 'scenario',
    title: '월간 실적 분석',
    content: '년/월 선택 → 전월 비교 체크 → 핵심 지표(매출, 전환율, 시술수) → 상담 퍼널, 일별 추이, 시술별/의사별 성과',
    keywords: ['리포트', '실적', '분석', '매출', '전환율', '월간', '통계', '의사별', '퍼널'],
  },

  // ── 매출관리 ──
  {
    id: 'rev-payment',
    sectionId: 'revenue',
    type: 'scenario',
    title: '시술 후 결제 처리',
    content: '미결제 탭에서 대기 건 확인 → 결제처리 버튼 → 금액/결제방법(카드/현금/이체/할부) 입력 → 결제완료',
    keywords: ['결제', '카드', '현금', '이체', '할부', '미결제', '수납'],
  },
  {
    id: 'rev-refund',
    sectionId: 'revenue',
    type: 'scenario',
    title: '환불 처리',
    content: '결제완료 건에서 환불 버튼 클릭 → 확인 팝업에서 환불 선택 → 상태가 환불로 변경',
    keywords: ['환불', '취소', '반환', '돌려', '환불처리'],
  },
  {
    id: 'rev-features',
    sectionId: 'revenue',
    type: 'feature',
    title: '매출관리 주요 기능',
    content: '기간 필터(오늘/이번주/이번달), 상태 탭(전체/결제완료/미결제/환불), 7일 추이, CSV 가져오기/내보내기',
    keywords: ['매출', 'CSV', '가져오기', '내보내기', '추이', '기간'],
  },

  // ── 환자조회 ──
  {
    id: 'patient-search',
    sectionId: 'patients',
    type: 'scenario',
    title: '재방문 환자 이력 확인',
    content: '이름/전화번호 검색(2글자 이상) → 환자 선택 → 시술이력/상담이력/알림이력/매출분석 4개 탭 확인',
    keywords: ['환자', '검색', '이력', '프로필', '재방문', '조회', '전화번호', '이름'],
  },

  // ── 음성 노트 ──
  {
    id: 'voice-ops',
    sectionId: 'voice-note',
    type: 'scenario',
    title: '모바일에서 운영현황 음성 등록',
    content: '운영 현황 템플릿 선택 → 마이크 → 환자명/방번호/시술명/담당의/소요시간 말하기 → 폼 검토/수정 → 케이스 추가',
    keywords: ['음성', '모바일', '운영', '마이크', '말하기', '녹음', '음성입력'],
  },
  {
    id: 'voice-quick',
    sectionId: 'voice-note',
    type: 'scenario',
    title: '빠른 메모 (퀵노트/자유입력)',
    content: '퀵노트(대상/내용/긴급도 3항목) 또는 자유입력 선택 → 마이크로 내용 입력 → 저장',
    keywords: ['퀵노트', '메모', '자유', '빠른', '기록', '노트'],
  },
  {
    id: 'voice-tips',
    sectionId: 'voice-note',
    type: 'tip',
    title: '음성 인식 팁',
    content: '조용한 환경, 짧고 명확하게 한 항목씩, 시술명 정확히, 숫자는 단위와 함께. iOS Chrome은 부분 지원',
    keywords: ['음성', '인식', '팁', '안돼', '안 돼', '안되', '호환', '브라우저', 'iOS', 'Safari', 'Chrome'],
  },

  // ── 이벤트관리 ──
  {
    id: 'event-create',
    sectionId: 'events',
    type: 'scenario',
    title: '새 이벤트 등록',
    content: '새 이벤트 버튼 → 제목/카테고리/시작·종료일/설명/포스터 입력 → 저장(즉시 게시) 또는 임시저장(Draft)',
    keywords: ['이벤트', '등록', '새', '만들기', '프로모션', '포스터', '게시'],
  },
  {
    id: 'event-features',
    sectionId: 'events',
    type: 'feature',
    title: '이벤트관리 주요 기능',
    content: '상태 관리(활성/종료/임시저장), 검색, 복제, 삭제(즉시 반영)',
    keywords: ['이벤트', '복제', '삭제', '상태', '활성', '종료'],
  },

  // ── 팝업관리 ──
  {
    id: 'popup-create',
    sectionId: 'popups',
    type: 'scenario',
    title: '팝업 등록 및 활성화',
    content: '새 팝업 버튼 → 제목/이미지/링크/시작·종료일/모바일 표시 여부 → 토글로 활성/비활성',
    keywords: ['팝업', '등록', '배너', '활성화', '토글', '비활성', '롤링'],
  },

  // ── 설정 ──
  {
    id: 'settings-treatment',
    sectionId: 'settings',
    type: 'feature',
    title: '시술 마스터 관리',
    content: '시술명/카테고리/가격대/소요시간/알림주기/활성 여부. 비활성화 시 선택 목록에서 숨김',
    keywords: ['시술', '마스터', '가격', '카테고리', '등록', '시술목록'],
  },
  {
    id: 'settings-staff',
    sectionId: 'settings',
    type: 'feature',
    title: '직원 관리',
    content: '이름/이메일/역할(관리자/의사/간호사/직원)/직위/활성 여부. 퇴사 시 비활성화 권장',
    keywords: ['직원', '스태프', '의사', '간호사', '역할', '계정', '퇴사'],
  },
  {
    id: 'settings-audit',
    sectionId: 'settings',
    type: 'feature',
    title: '감사 로그',
    content: '모든 관리자 작업(생성/수정/삭제/로그인/내보내기) 이력 추적. 작업유형/사용자/기간 필터',
    keywords: ['감사', '로그', '이력', '추적', '기록', '누가', '변경'],
  },
  {
    id: 'settings-clinic',
    sectionId: 'settings',
    type: 'feature',
    title: '병원 정보 설정',
    content: '병원명/전화번호/이메일/주소/카카오 채널/운영시간/점심시간/알림 설정/목표 매출',
    keywords: ['병원', '정보', '설정', '운영시간', '목표', '매출', '점심', '전화번호', '주소'],
  },

  // ── FAQ ──
  {
    id: 'faq-app',
    sectionId: 'faq',
    type: 'faq',
    title: '별도 앱을 설치해야 하나요?',
    content: '아니요. 모바일 브라우저에서 접속하면 모든 기능을 사용할 수 있습니다. 홈 화면에 추가하면 앱처럼 사용 가능',
    keywords: ['앱', '설치', '다운로드', '어플'],
  },
  {
    id: 'faq-voice',
    sectionId: 'faq',
    type: 'faq',
    title: '음성 인식이 안 돼요',
    content: '마이크 권한 확인(브라우저 주소창 자물쇠 > 권한 설정 > 마이크 허용). 인터넷 연결 필요',
    keywords: ['음성', '인식', '안돼', '안 돼', '안되', '마이크', '권한'],
  },
  {
    id: 'faq-multi',
    sectionId: 'faq',
    type: 'faq',
    title: '여러 명이 동시에 사용할 수 있나요?',
    content: '네. 각자의 기기에서 로그인하면 동시 사용 가능. 실시간 동기화 지원',
    keywords: ['동시', '접속', '여러명', '같이', '함께', '동기화'],
  },
  {
    id: 'faq-backup',
    sectionId: 'faq',
    type: 'faq',
    title: '데이터 백업은 어떻게 하나요?',
    content: '클라우드(Supabase)에 자동 저장. CSV 내보내기 기능으로 수동 백업 가능',
    keywords: ['백업', '저장', '데이터', '보관', '복구', '클라우드'],
  },
  {
    id: 'faq-noti-real',
    sectionId: 'faq',
    type: 'faq',
    title: '환자에게 알림이 실제로 발송되나요?',
    content: '네. 알림관리에서 발송 버튼을 누르면 카카오톡 또는 SMS로 실제 전송. 테스트 시 주의',
    keywords: ['발송', '실제', '카카오', 'SMS', '전송', '진짜'],
  },
  {
    id: 'faq-delete',
    sectionId: 'faq',
    type: 'faq',
    title: '삭제한 이벤트/팝업은 복구 가능한가요?',
    content: '삭제 후 복구 불가. 삭제 대신 비활성화를 권장',
    keywords: ['삭제', '복구', '되돌리기', '취소', '비활성'],
  },
  {
    id: 'faq-goal',
    sectionId: 'faq',
    type: 'faq',
    title: '리포트의 목표 매출은 어디서 설정하나요?',
    content: '설정 > 병원 정보 탭 하단의 "목표 매출" 항목에서 월 목표 금액(원) 입력',
    keywords: ['목표', '매출', '설정', '어디', '위치', '달성율'],
  },
  {
    id: 'faq-audit',
    sectionId: 'faq',
    type: 'faq',
    title: '감사 로그에는 어떤 것이 기록되나요?',
    content: '상담 상태 변경, 재고 입출고, 설정 변경, 로그인, CSV 내보내기 등 모든 관리자 작업 자동 기록',
    keywords: ['감사', '로그', '기록', '뭐가', '어떤'],
  },
];
```

---

## 3. 검색 알고리즘 설계

### 3.1 한글 조사 제거 (`removeParticles`)

```typescript
function removeParticles(text: string): string[] {
  const particles = /[은는이가을를에서도로의와과만도요까지부터마다라고처럼같이한테에게]*$/;
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(particles, ''))
    .filter(w => w.length > 0);
}
```

**입력 예**: `"환불은 어떻게 해요?"` → `["환불", "어떻게", "해"]`

### 3.2 동의어 매핑 (`SYNONYMS`)

자연어 질문에서 실제 키워드로 변환:

```typescript
const SYNONYMS: Record<string, string[]> = {
  '환불':   ['환불', '취소', '반환', '돌려'],
  '결제':   ['결제', '수납', '지불', '카드', '현금'],
  '콜백':   ['콜백', '팔로업', '재연락', '전화'],
  '로그인': ['로그인', '접속', '시작', '처음'],
  '알림':   ['알림', '발송', '카카오', 'SMS', '문자', '재방문'],
  '재고':   ['재고', '소모품', '입고', '부족', '소진'],
  '음성':   ['음성', '마이크', '말하기', '녹음', '인식'],
  '직원':   ['직원', '스태프', '의사', '간호사', '계정'],
  'CSV':    ['CSV', '내보내기', '다운로드', '가져오기', '엑셀'],
  '앱':     ['앱', '설치', '다운로드', 'PWA', '어플', '홈화면'],
  '삭제':   ['삭제', '복구', '제거', '되돌리기'],
  '설정':   ['설정', '관리', '병원정보', '운영시간'],
};
```

### 3.3 스코어링 함수 (`searchGuide`)

```typescript
function searchGuide(query: string): GuideSearchEntry[] {
  const tokens = removeParticles(query);
  if (tokens.length === 0) return [];

  // 동의어 확장
  const expandedTokens = new Set<string>();
  tokens.forEach(t => {
    expandedTokens.add(t);
    Object.entries(SYNONYMS).forEach(([, syns]) => {
      if (syns.some(s => s.includes(t) || t.includes(s))) {
        syns.forEach(s => expandedTokens.add(s));
      }
    });
  });

  const scored = GUIDE_SEARCH_INDEX.map(entry => {
    let score = 0;

    for (const token of expandedTokens) {
      // 제목 매칭 (가장 높은 가중치)
      if (entry.title.toLowerCase().includes(token)) score += 10;
      // 키워드 매칭
      if (entry.keywords.some(k => k.includes(token) || token.includes(k))) score += 5;
      // 내용 매칭
      if (entry.content.toLowerCase().includes(token)) score += 2;
    }

    // FAQ 보너스 (질문형 입력 시)
    if (entry.type === 'faq' && score > 0) score += 3;

    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.entry);
}
```

---

## 4. 컴포넌트 설계

### 4.1 새로 추가되는 컴포넌트 (page.tsx 내부 함수)

#### `GuideSearch` - 메인 검색 영역

```
위치: GuidePage 컴포넌트 내부, Header 아래 / TOC 위
```

**상태 관리**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<GuideSearchEntry[]>([]);
const [isSearching, setIsSearching] = useState(false); // 검색 모드 여부
```

**렌더링 구조**:
```
┌───────────────────────────────────────────────────────┐
│ 검색 영역 (bg-white, border, rounded-xl, p-5)         │
│                                                       │
│ 🔍 AI 검색                                            │
│ ┌───────────────────────────────────────────────┐     │
│ │ [input] placeholder="무엇이 궁금하신가요?"     │ 🔍  │
│ └───────────────────────────────────────────────┘     │
│                                                       │
│ (검색어 없을 때) 추천 태그:                            │
│ [콜백 처리] [환불 방법] [재고 입고] [음성 인식]         │
│ [CSV 내보내기] [알림 발송] [앱 설치]                    │
│                                                       │
│ (검색어 있을 때) 검색 결과:                             │
│ ┌─ 💰 매출관리 ─────────────────────────────────┐    │
│ │ 환불 처리                                      │    │
│ │ 결제완료 건에서 환불 버튼 클릭 → ...            │    │
│ │                           [섹션으로 이동 →]     │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│ (결과 없을 때)                                         │
│ 검색 결과가 없습니다. 다른 키워드로 검색해보세요.        │
└───────────────────────────────────────────────────────┘
```

#### `SearchResultCard` - 검색 결과 카드

```typescript
function SearchResultCard({ entry, onNavigate }: {
  entry: GuideSearchEntry;
  onNavigate: (sectionId: string) => void;
}) {
  const section = TOC_SECTIONS.find(s => s.id === entry.sectionId);
  const typeLabel = { scenario: '시나리오', feature: '기능', faq: 'FAQ', tip: '팁', overview: '안내' };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 hover:border-[#b4988d] transition-colors">
      {/* 헤더: 섹션 아이콘 + 섹션명 + 타입 배지 */}
      <div className="flex items-center gap-2 mb-2">
        <span>{section?.icon}</span>
        <span className="text-xs font-medium text-[#b4988d]">{section?.label}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#f6f6f6] rounded text-[#8a8a8a]">{typeLabel[entry.type]}</span>
      </div>
      {/* 제목 */}
      <p className="text-sm font-medium text-[#6d4e42] mb-1">{entry.title}</p>
      {/* 내용 발췌 */}
      <p className="text-xs text-[#575756] leading-relaxed mb-3">{entry.content}</p>
      {/* 이동 버튼 */}
      <button onClick={() => onNavigate(entry.sectionId)}
        className="text-xs text-[#b4988d] hover:text-[#6d4e42] font-medium cursor-pointer">
        해당 섹션으로 이동 →
      </button>
    </div>
  );
}
```

### 4.2 추천 검색어 태그

```typescript
const QUICK_TAGS = [
  '콜백 처리', '환불 방법', '재고 입고', '음성 인식',
  'CSV 내보내기', '알림 발송', '앱 설치', '이벤트 등록',
  '목표 매출', '감사 로그',
];
```

태그 클릭 시: `setSearchQuery(tag)` + `searchGuide(tag)` 실행

---

## 5. UI 통합 위치 및 동작 흐름

### 5.1 GuidePage 수정사항

```
기존 구조:
  Header → TOC → 섹션 1~14 → Footer

변경 후:
  Header → ★검색 영역★ → TOC → 섹션 1~14 → Footer
```

### 5.2 검색↔네비게이션 연동

```
검색 결과 카드 "해당 섹션으로 이동 →" 클릭
  ↓
scrollTo(sectionId) 호출 (기존 함수 재사용)
  ↓
setActiveSection(sectionId) 동기화
  ↓
setSearchQuery('') 검색 초기화 (선택적)
```

### 5.3 검색 시 TOC/콘텐츠 표시

- 검색어가 **비어있을 때**: TOC + 전체 콘텐츠 표시 (기존 동작 유지)
- 검색어가 **입력되어 있을 때**: 검색 결과 표시 + TOC + 전체 콘텐츠는 그대로 유지
  - 검색 결과는 가이드 콘텐츠 위에 오버레이 형태가 아닌, 인라인으로 배치
  - 사용자가 검색 후에도 스크롤하여 전체 가이드를 볼 수 있음

---

## 6. 스타일 사양

### 6.1 검색 영역

```css
/* 검색 컨테이너 */
bg-white border-2 border-[#b4988d]/20 rounded-2xl p-5 mb-8
shadow-sm hover:shadow-md transition-shadow

/* 검색 input */
w-full px-4 py-3 rounded-xl border border-[#e5e5e5]
text-sm text-[#575756] placeholder-[#c0c0c0]
focus:outline-none focus:border-[#b4988d] focus:ring-1 focus:ring-[#b4988d]/30

/* 추천 태그 */
px-3 py-1.5 rounded-full text-xs
bg-[#f6f6f6] text-[#575756]
hover:bg-[#b4988d]/10 hover:text-[#6d4e42]
cursor-pointer transition-colors
```

### 6.2 결과 카드

```css
/* 카드 */
bg-white border border-[#e5e5e5] rounded-xl p-4
hover:border-[#b4988d] transition-colors

/* 타입 배지 */
text-[10px] px-1.5 py-0.5 bg-[#f6f6f6] rounded text-[#8a8a8a]

/* 이동 버튼 */
text-xs text-[#b4988d] hover:text-[#6d4e42] font-medium
```

---

## 7. 수정 파일 목록

| 파일 | 변경 내용 | 줄 수 변화 |
|------|-----------|-----------|
| `src/app/admin/(authenticated)/guide/page.tsx` | 검색 인덱스 데이터, 검색 알고리즘, 검색 UI 컴포넌트, GuidePage에 검색 영역 삽입 | +약 350줄 |

**새로 추가되는 파일: 없음** (단일 파일 수정)

---

## 8. 구현 순서

| 순서 | 작업 | 설명 |
|------|------|------|
| 1 | `GuideSearchEntry` 타입 + `GUIDE_SEARCH_INDEX` 데이터 | 파일 상단 TOC_SECTIONS 아래에 배치 (~200줄) |
| 2 | `SYNONYMS` + `removeParticles` + `searchGuide` 함수 | 검색 로직 (~60줄) |
| 3 | `SearchResultCard` 컴포넌트 | 결과 표시 UI (~25줄) |
| 4 | `GuidePage` 수정: 상태 추가 + 검색 영역 JSX | Header와 TOC 사이에 삽입 (~65줄) |

---

## 9. 검증 시나리오 (Plan에서 정의한 10개)

| # | 입력 | 예상 Top 결과 | 검증 기준 |
|---|------|---------------|-----------|
| 1 | "환불 어떻게 해요?" | `rev-refund` | title 매칭 + keywords |
| 2 | "재고 부족" | `inv-restock` | keywords 매칭 |
| 3 | "음성 인식 안돼요" | `faq-voice` | FAQ 보너스 + keywords |
| 4 | "콜백 처리" | `consult-callback` | title + keywords |
| 5 | "목표 매출 설정" | `faq-goal` / `settings-clinic` | keywords + FAQ |
| 6 | "새 이벤트 만들기" | `event-create` | keywords 매칭 |
| 7 | "CSV" | `consult-features` / `rev-features` / `noti-history` | 복수 결과 |
| 8 | "앱 설치" | `faq-app` / `overview-pwa` | FAQ 보너스 |
| 9 | "동시 접속" | `faq-multi` | keywords 매칭 |
| 10 | "알림 발송 방법" | `noti-send` | title + keywords |

**성공 기준**: 10개 중 8개(80%) 이상 Top 3 내 정확한 결과 포함

---

## 10. 제약 및 고려사항

- **성능**: ~50개 항목 클라이언트 검색이므로 성능 문제 없음 (<1ms)
- **한글 처리**: 완벽한 형태소 분석 없이 조사 제거 + 동의어로 처리 (90% 커버리지 목표)
- **확장성**: 가이드 콘텐츠 추가 시 `GUIDE_SEARCH_INDEX`에 항목만 추가하면 됨
- **접근성**: input에 `aria-label`, 결과에 `role="list"`, 카드에 `role="listitem"` 적용
- **모바일**: 검색바와 결과 카드가 full-width로 반응형 동작 (기존 `max-w-4xl` 컨테이너 내)
