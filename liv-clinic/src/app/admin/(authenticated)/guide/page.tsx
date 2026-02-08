'use client';

import { useState } from 'react';

/* ─── Helper Components ───────────────────────────── */

function StepItem({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 mb-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#b4988d] text-white flex items-center justify-center text-xs font-bold">{number}</div>
      <div>
        <p className="text-sm font-medium text-[#6d4e42]">{title}</p>
        <p className="text-xs text-[#8a8a8a] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#faf8f6] border border-[#ebe7e4] rounded-xl p-4 my-4">
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0">💡</span>
        <div className="text-xs text-[#6d4e42] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-4">
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0">⚠️</span>
        <div className="text-xs text-amber-800 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-[#e5e5e5] my-10" />;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[#faf8f7] transition-colors">
        <span className="text-sm font-medium text-[#6d4e42]">{q}</span>
        <svg className={`w-4 h-4 text-[#8a8a8a] transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4"><p className="text-xs text-[#575756] leading-relaxed">{a}</p></div>}
    </div>
  );
}

function ScenarioCard({ icon, when, where, result }: { icon: string; when: string; where: string; result: string }) {
  return (
    <div className="bg-[#f6f6f6] rounded-xl p-4 mb-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-[#8a8a8a] mb-1">언제</p>
          <p className="text-xs font-medium text-[#575756]">{when}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8a8a] mb-1">어디서</p>
          <p className="text-xs font-medium text-[#575756]">{icon} {where}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8a8a] mb-1">결과</p>
          <p className="text-xs font-medium text-[#575756]">{result}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureTable({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden my-4">
      {items.map((item, i) => (
        <div key={i} className={`flex gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-[#f0f0f0]' : ''}`}>
          <span className="text-xs font-medium text-[#6d4e42] w-28 flex-shrink-0">{item.label}</span>
          <span className="text-xs text-[#575756]">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── TOC Data ────────────────────────────────────── */

const TOC_SECTIONS = [
  { id: 'overview', label: '시스템 개요', icon: '🏠' },
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'consultations', label: '상담관리', icon: '📋' },
  { id: 'operations', label: '운영현황', icon: '🏥' },
  { id: 'inventory', label: '재고관리', icon: '📦' },
  { id: 'notifications', label: '알림관리', icon: '🔔' },
  { id: 'reports', label: '리포트', icon: '📈' },
  { id: 'revenue', label: '매출관리', icon: '💰' },
  { id: 'patients', label: '환자조회', icon: '👤' },
  { id: 'voice-note', label: '음성 노트', icon: '🎤' },
  { id: 'events', label: '이벤트관리', icon: '🎉' },
  { id: 'popups', label: '팝업관리', icon: '🪟' },
  { id: 'settings', label: '설정', icon: '⚙️' },
  { id: 'faq', label: '자주 묻는 질문', icon: '❓' },
];

/* ─── Main Page ───────────────────────────────────── */

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#b4988d]/10 rounded-xl flex items-center justify-center"><span className="text-xl">📖</span></div>
          <div>
            <h1 className="text-xl font-bold text-[#6d4e42]">LIV 관리자 사용 가이드</h1>
            <p className="text-xs text-[#8a8a8a]">병원 운영 관리 시스템 전체 기능 안내</p>
          </div>
        </div>
      </div>

      {/* TOC */}
      <div className="bg-[#faf8f7] rounded-xl p-5 mb-10 border border-[#ebe7e4]">
        <p className="text-xs font-semibold text-[#b4988d] uppercase tracking-wider mb-3">목차</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {TOC_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${activeSection === s.id ? 'bg-[#b4988d]/10 text-[#6d4e42] font-medium' : 'text-[#575756] hover:bg-white'}`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 1. OVERVIEW                                     */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="overview">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-4">시스템 개요</h2>
        <p className="text-sm text-[#575756] mb-6 leading-relaxed">
          LIV 관리자 시스템은 병원의 <strong>상담 접수부터 시술, 결제, 재고, 리포트</strong>까지 전체 운영을 관리하는 통합 플랫폼입니다.
          별도 앱 설치 없이 <strong>모바일/데스크톱 브라우저</strong>에서 접속하여 사용합니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 text-center">
            <span className="text-2xl block mb-2">🔄</span>
            <p className="text-xs font-semibold text-[#6d4e42] mb-1">환자 라이프사이클</p>
            <p className="text-[10px] text-[#8a8a8a]">상담 → 예약 → 시술 → 결제 → 재방문 알림</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 text-center">
            <span className="text-2xl block mb-2">📱</span>
            <p className="text-xs font-semibold text-[#6d4e42] mb-1">모바일 최적화</p>
            <p className="text-[10px] text-[#8a8a8a]">음성 노트, 운영현황 등 모바일에서도 편리하게</p>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 text-center">
            <span className="text-2xl block mb-2">⚡</span>
            <p className="text-xs font-semibold text-[#6d4e42] mb-1">실시간 업데이트</p>
            <p className="text-[10px] text-[#8a8a8a]">상담 접수, 운영 현황이 실시간으로 반영</p>
          </div>
        </div>

        {/* Access methods */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-3">접속 방법</h3>
          <div className="space-y-2 text-xs text-[#575756]">
            <p><strong>1.</strong> 브라우저에서 <code className="bg-[#f6f6f6] px-1.5 py-0.5 rounded text-[#b4988d]">관리자 페이지 URL/admin</code> 접속</p>
            <p><strong>2.</strong> 이메일/비밀번호로 로그인</p>
            <p><strong>3.</strong> 좌측 사이드바에서 원하는 메뉴 선택</p>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mt-4">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-3">로그아웃 방법</h3>
          <div className="space-y-2 text-xs text-[#575756]">
            <p><strong>PC:</strong> 좌측 사이드바 하단의 <code className="bg-[#f6f6f6] px-1.5 py-0.5 rounded text-[#b4988d]">로그아웃</code> 버튼 클릭</p>
            <p><strong>모바일:</strong> 좌측 상단 ☰ 메뉴 열기 → 하단 <code className="bg-[#f6f6f6] px-1.5 py-0.5 rounded text-[#b4988d]">로그아웃</code> 버튼 클릭</p>
          </div>
        </div>

        <TipBox>
          <strong>모바일에서 앱처럼 사용하기:</strong> Chrome &gt; 메뉴 &gt; &quot;홈 화면에 추가&quot; 또는 Safari &gt; 공유 &gt; &quot;홈 화면에 추가&quot;를 하면
          앱 아이콘처럼 바로 접속할 수 있습니다.
        </TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 2. DASHBOARD                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="dashboard">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">📊 대시보드</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">병원 운영 현황을 한눈에 파악하는 메인 화면</p>

        <ScenarioCard icon="📊" when="출근 후 당일 현황 확인" where="대시보드" result="오늘의 상담/시술/콜백 현황 확인" />

        <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">주요 기능</h3>
        <FeatureTable items={[
          { label: '오늘의 통계', desc: '당일 상담 수, 시술 수, 콜백 예정, 알림, 활성 이벤트/팝업 수를 카드로 표시' },
          { label: '7일 추이', desc: '최근 7일간 상담/시술 건수를 막대 그래프로 시각화' },
          { label: '오늘의 콜백', desc: '오늘 콜백 예정인 상담 건 목록 (클릭하면 상담관리로 이동)' },
          { label: '최근 상담', desc: '최근 5건의 상담 내역 테이블 (모바일에서는 카드 형태)' },
        ]} />

        <div className="mb-6">
          <StepItem number={1} title="대시보드 확인" desc="로그인하면 자동으로 대시보드가 표시됩니다." />
          <StepItem number={2} title="통계 카드 클릭" desc="각 통계 카드를 클릭하면 해당 페이지로 바로 이동합니다." />
          <StepItem number={3} title="콜백 리스트 확인" desc="오늘 콜백 예정 건이 있으면 목록이 표시됩니다. 클릭하여 상담 상세로 이동합니다." />
        </div>

        <TipBox>매일 출근 후 대시보드에서 <strong>오늘의 콜백</strong>과 <strong>알림 예정</strong>을 먼저 확인하세요. 놓치기 쉬운 콜백과 알림을 바로 처리할 수 있습니다.</TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 3. CONSULTATIONS                                */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="consultations">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">📋 상담관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">상담 접수, 상태 관리, 메모, 콜백 추적까지 상담 전체 라이프사이클 관리</p>

        {/* Scenario A */}
        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 신규 상담 접수 후 처리</h3>
        <ScenarioCard icon="📋" when="신규 상담 접수 알림이 올 때" where="상담관리" result="상담 상태 업데이트 및 담당자 배정" />
        <div className="mb-6">
          <StepItem number={1} title="신규 상담 확인" desc="실시간 알림으로 새 상담이 자동 표시됩니다. '신규' 탭에서 확인하세요." />
          <StepItem number={2} title="상담 상세 열기" desc="상담 건을 클릭하면 상세 정보가 펼쳐집니다." />
          <StepItem number={3} title="담당자 배정" desc="'담당자' 칸을 클릭하여 담당 직원을 선택합니다." />
          <StepItem number={4} title="상태 변경" desc="상태 드롭다운에서 '콜백예정', '예약확정' 등으로 변경합니다. 변경 이력은 타임라인에 자동 기록됩니다." />
          <StepItem number={5} title="메모 작성" desc="메모 영역을 클릭하여 상담 내용을 기록합니다. 음성 입력도 가능합니다." />
        </div>

        {/* Scenario B */}
        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 콜백 처리</h3>
        <ScenarioCard icon="📋" when="예정된 콜백 시간이 됐을 때" where="상담관리 &gt; 콜백예정 탭" result="콜백 결과 기록 및 상태 업데이트" />
        <div className="mb-6">
          <StepItem number={1} title="콜백예정 탭 선택" desc="상단 탭에서 '콜백예정'을 선택합니다." />
          <StepItem number={2} title="'오늘 콜백만' 체크" desc="체크하면 오늘 콜백 예정인 건만 필터링됩니다." />
          <StepItem number={3} title="전화 후 결과 기록" desc="해당 상담 건을 열고 '팔로업 결과'에 통화 내용을 기록합니다." />
          <StepItem number={4} title="다음 콜백 설정 또는 상태 변경" desc="재연락이 필요하면 '다음 팔로업'에 날짜를 설정하고, 예약이 확정되면 상태를 '예약확정'으로 변경합니다." />
        </div>

        {/* Scenario C */}
        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 C: 벌크 처리</h3>
        <div className="mb-6">
          <StepItem number={1} title="체크박스로 여러 건 선택" desc="목록에서 처리할 상담 건들을 체크합니다." />
          <StepItem number={2} title="벌크 액션 선택" desc="상단에 나타나는 벌크 액션 바에서 '상태 일괄 변경' 또는 '담당자 일괄 배정'을 선택합니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">주요 기능 요약</h3>
        <FeatureTable items={[
          { label: '상태 탭 필터', desc: '전체, 신규, 콜백예정, 부재, 재연락, 예약확정, 노쇼, 완료, 취소 (9개 탭)' },
          { label: '검색/필터', desc: '이름/전화번호 검색, 담당자 필터, 오늘 콜백만 필터' },
          { label: '인라인 편집', desc: '담당자, 다음 팔로업, 예산, 가능일, 메모, 시술태그 등 클릭하여 바로 편집' },
          { label: '음성 메모', desc: '메모 필드에서 상담기록/퀵노트 템플릿으로 음성 입력 가능' },
          { label: '타임라인', desc: '상태 변경, 메모 추가 등 모든 이력이 자동 기록' },
          { label: '벌크 액션', desc: '여러 건 선택 후 상태/담당자 일괄 변경' },
          { label: 'CSV 다운로드', desc: '전체 상담 데이터를 CSV로 내보내기' },
          { label: '실시간 알림', desc: '브라우저 알림 허용 시 새 상담/콜백 도래 알림' },
        ]} />

        <TipBox>
          <strong>브라우저 알림을 켜두세요.</strong> 상담관리 페이지 상단의 알림 토글을 활성화하면,
          새 상담이 접수되거나 콜백 시간이 되면 브라우저 알림이 뜹니다. 다른 페이지에 있어도 놓치지 않습니다.
        </TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 4. OPERATIONS                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="operations">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">🏥 운영현황</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">실시간 환자 동선 관리 - 평면도, 칸반보드, 케이스 라이프사이클</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 환자 입실 시 케이스 등록</h3>
        <ScenarioCard icon="🏥" when="환자가 도착하여 시술실 배정할 때" where="운영현황" result="평면도에 환자 케이스 표시" />
        <div className="mb-6">
          <StepItem number={1} title="+ 새 케이스 버튼 클릭" desc="우측 상단의 '새 케이스' 버튼을 누릅니다." />
          <StepItem number={2} title="수동 입력 또는 음성 입력 선택" desc="수동 입력 탭에서 직접 입력하거나, 음성 입력 탭에서 말로 등록합니다." />
          <StepItem number={3} title="환자 정보 입력" desc="환자명, 시술 유형, 담당의, 예상 소요시간 등을 입력합니다." />
          <StepItem number={4} title="케이스 추가" desc="추가 버튼을 누르면 대기실(라운지)에 케이스가 생성됩니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 시술실 이동 및 완료 처리</h3>
        <div className="mb-6">
          <StepItem number={1} title="평면도에서 방 클릭" desc="환자가 들어갈 시술실을 클릭합니다." />
          <StepItem number={2} title="대기 중인 케이스 시작" desc="해당 방에서 대기 중인 케이스의 '시작' 버튼을 누릅니다." />
          <StepItem number={3} title="시술 완료 처리" desc="시술이 끝나면 '완료' 버튼을 누릅니다. 소요시간이 자동 기록됩니다." />
        </div>

        <FeatureTable items={[
          { label: '평면도', desc: '실제 클리닉 배치를 반영한 시술실/상담실 배치. 방별 환자 현황 실시간 표시' },
          { label: '칸반보드', desc: '대기 → 상담 → 마취 → 시술/피부관리 → 완료 5단계 칸반 뷰' },
          { label: '통계 배지', desc: '상단에 진행중/대기/완료/전체 건수 실시간 표시' },
          { label: '음성 입력', desc: '음성 입력 탭에서 환자명, 시술, 담당의 등을 말로 등록 (자동 매핑)' },
          { label: '소요시간', desc: '케이스 시작부터 경과 시간 30초마다 자동 업데이트' },
        ]} />

        <TipBox>
          <strong>모바일에서도 사용 가능합니다.</strong> 음성 노트 페이지에서 &quot;운영 현황&quot; 템플릿을 선택하면
          모바일에서도 음성으로 케이스를 등록할 수 있습니다.
        </TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 5. INVENTORY                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="inventory">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">📦 재고관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">의료 소모품 재고 현황, 사용 기록, 입고 관리</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 시술 후 소모품 사용 기록</h3>
        <ScenarioCard icon="📦" when="시술 완료 후 사용한 소모품을 기록할 때" where="재고관리" result="재고 차감 및 사용 이력 기록" />
        <div className="mb-6">
          <StepItem number={1} title="'사용 기록' 버튼 클릭" desc="상단의 '사용 기록' 버튼을 누릅니다." />
          <StepItem number={2} title="시술 레시피 선택 (선택사항)" desc="시술명을 선택하면 해당 시술에 필요한 소모품이 자동으로 채워집니다." />
          <StepItem number={3} title="사용량 확인 및 조정" desc="자동 채워진 수량을 확인하고 필요시 조정합니다." />
          <StepItem number={4} title="기록 저장" desc="저장하면 해당 품목의 재고가 자동 차감됩니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 부족 재고 입고 처리</h3>
        <div className="mb-6">
          <StepItem number={1} title="부족 재고 알림 확인" desc="상단 알림 배너에 부족/소진 품목이 표시됩니다." />
          <StepItem number={2} title="해당 품목 클릭" desc="목록에서 품목을 클릭하면 우측에 상세 패널이 열립니다." />
          <StepItem number={3} title="'입고' 버튼 클릭" desc="상세 패널 또는 입고관리 탭에서 입고 처리합니다." />
          <StepItem number={4} title="입고 수량 및 메모 입력" desc="수량과 메모(공급업체, 인보이스 등)를 입력합니다." />
        </div>

        <FeatureTable items={[
          { label: '3개 탭', desc: '재고현황 / 사용이력 / 입고관리' },
          { label: '3가지 뷰', desc: '테이블(정렬 가능), 카드(그리드), 그룹(카테고리별)' },
          { label: '검색/필터', desc: '품목명/공급업체 검색, 카테고리 필터, 상태 필터(정상/부족/소진)' },
          { label: '시술 레시피', desc: '시술별 소모품 세트 자동 채움 (울쎄라 → 젤, 카트리지 등)' },
          { label: '소진 예측', desc: '일일 사용량 기반 며칠 후 소진 예측 (상세 패널)' },
          { label: '알림 배너', desc: '부족/소진 품목 수 배너 (닫기 가능, 재표시)' },
        ]} />

        <TipBox>
          <strong>시술 레시피를 활용하세요.</strong> 사용 기록 시 시술을 선택하면 소모품이 자동으로 채워집니다.
          매번 수동으로 입력할 필요 없이 빠르게 기록할 수 있습니다.
        </TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 6. NOTIFICATIONS                                */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="notifications">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">🔔 알림관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">환자 시술 기록 및 재방문 알림 발송 (카카오톡/SMS)</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 시술 후 재방문 알림 발송</h3>
        <ScenarioCard icon="🔔" when="시술 후 환자 기록을 남기고 재방문 알림을 설정할 때" where="알림관리" result="설정일에 자동 알림 발송" />
        <div className="mb-6">
          <StepItem number={1} title="시술 기록 추가" desc="'+ 시술 기록' 버튼 → 환자명, 전화번호, 시술명, 카테고리, 담당의, 시술일, 알림 주기(일) 입력" />
          <StepItem number={2} title="알림 주기 설정" desc="예: 보톡스 90일, 써마지 365일. 시술일 + 주기일 후 자동 알림 예정됩니다." />
          <StepItem number={3} title="발송 대상 확인" desc="KPI 카드에서 오늘 발송 대상, 미발송 건수, 이번 주 예정을 확인합니다." />
          <StepItem number={4} title="알림 발송" desc="발송 예정 목록에서 '발송 처리' 클릭 → 채널(카카오톡/SMS) 선택 → 담당자 입력 → '실제 발송' 클릭" />
        </div>

        {/* Scenario B: History */}
        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 발송 이력 확인</h3>
        <ScenarioCard icon="🔔" when="이전 발송 결과를 확인하거나 CSV로 내보낼 때" where="알림관리 &gt; 발송 이력" result="채널별/상태별 발송 내역 조회 및 다운로드" />
        <div className="mb-6">
          <StepItem number={1} title="'발송 이력' 버튼 클릭" desc="알림관리 페이지 상단 우측의 '발송 이력' 버튼을 클릭합니다." />
          <StepItem number={2} title="필터 설정" desc="채널(카카오톡/문자/전화), 상태(발송완료/실패/건너뜀), 기간(시작일~종료일)으로 필터링합니다." />
          <StepItem number={3} title="이력 테이블 확인" desc="환자명, 전화번호, 시술, 채널, 상태, 담당자, 발송일시, 메모가 표 형태로 표시됩니다." />
          <StepItem number={4} title="CSV 내보내기 (선택)" desc="우측 상단 'CSV 내보내기' 버튼으로 필터링된 이력을 다운로드합니다." />
        </div>

        {/* Scenario C: Templates */}
        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 C: 알림 템플릿 관리</h3>
        <ScenarioCard icon="🔔" when="발송 메시지를 시술별로 미리 작성해두고 싶을 때" where="알림관리 &gt; 템플릿" result="시술별 맞춤 알림 메시지 템플릿 관리" />
        <div className="mb-6">
          <StepItem number={1} title="'템플릿' 버튼 클릭" desc="알림관리 페이지 상단 우측의 '템플릿' 버튼을 클릭합니다." />
          <StepItem number={2} title="새 템플릿 추가" desc="'+ 템플릿 추가' 버튼 → 시술명, 유형(재방문 안내/사후관리), 제목, 메시지 내용을 입력합니다." />
          <StepItem number={3} title="변수 활용" desc={'메시지에 {name}(환자명), {treatment}(시술명), {days}(경과일), {event}(진행중 이벤트) 변수를 넣으면 발송 시 자동 치환됩니다.'} />
          <StepItem number={4} title="영상 URL 첨부 (선택)" desc="YouTube 등 관리 영상 URL을 첨부하면 알림과 함께 전송됩니다." />
          <StepItem number={5} title="활성/비활성 관리" desc="사용하지 않는 템플릿은 비활성화하여 숨길 수 있습니다. 삭제도 가능합니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">주요 기능 요약</h3>
        <FeatureTable items={[
          { label: '시술 기록', desc: '환자별 시술 이력 및 재방문 주기 관리 (환자명, 전화번호, 시술명, 담당의, 주기)' },
          { label: '알림 발송', desc: '카카오톡 우선 발송, 실패 시 SMS 자동 전환 (Solapi 연동). 건너뛰기도 가능' },
          { label: 'KPI 카드', desc: '오늘 발송 대상, 미발송 건수, 이번 주 예정 건수 표시' },
          { label: '발송 이력', desc: '채널/상태/기간 필터, 환자명 검색, CSV 내보내기, 페이지네이션 (20건씩)' },
          { label: '템플릿', desc: '시술별 재방문 안내/사후관리 메시지 템플릿 (변수 치환, 영상 URL, 활성/비활성 관리)' },
          { label: '미발송 경고', desc: '발송 예정이지만 아직 안 보낸 건수 경고 배너' },
        ]} />

        <WarningBox>
          <strong>알림 발송은 실제 환자에게 전송됩니다.</strong> 테스트 목적이 아닌 경우에만 발송 버튼을 누르세요.
          발송 전 환자 전화번호가 정확한지 반드시 확인하세요.
        </WarningBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 7. REPORTS                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="reports">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">📈 리포트</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">월별 실적 분석 - 매출, 전환율, 시술 통계, 의사별 성과</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오: 월간 실적 분석</h3>
        <ScenarioCard icon="📈" when="월말/월초 실적을 분석할 때" where="리포트" result="매출, 전환율, 시술별/의사별 성과 확인" />
        <div className="mb-6">
          <StepItem number={1} title="년/월 선택" desc="상단에서 분석할 년도와 월을 선택합니다." />
          <StepItem number={2} title="전월 비교 체크" desc="'전월 비교'를 체크하면 전월 대비 증감율(%)이 표시됩니다." />
          <StepItem number={3} title="핵심 지표 확인" desc="월 매출(목표 대비 %), 전환율, 총 시술 수, 건당 평균 매출을 확인합니다." />
          <StepItem number={4} title="상세 분석" desc="상담 퍼널(단계별 전환율), 일별 추이, 시술별 통계, 의사별 성과를 확인합니다." />
          <StepItem number={5} title="CSV 내보내기" desc="필요시 'CSV 다운로드' 버튼으로 데이터를 내보냅니다." />
        </div>

        <FeatureTable items={[
          { label: 'KPI 카드', desc: '월 매출(목표 대비 %), 전환율, 총 시술 수, 건당 평균 매출' },
          { label: '상담 퍼널', desc: '전체 → 연락완료 → 예약 → 완료 → 노쇼 (단계별 전환율)' },
          { label: '일별 추이', desc: '최근 7~30일 상담/시술 건수 막대 그래프' },
          { label: '시술 통계', desc: '시술별 매출 순위 테이블' },
          { label: '의사별 성과', desc: '상담 수, 시술 수, 매출, 전환율 카드' },
          { label: '전월 비교', desc: '전월 대비 증감율(%) 표시' },
        ]} />
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 8. REVENUE                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="revenue">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">💰 매출관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">결제 처리, 환불, 매출 추이, CSV 가져오기/내보내기</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 시술 후 결제 처리</h3>
        <ScenarioCard icon="💰" when="환자 시술이 완료되어 결제할 때" where="매출관리" result="결제 완료 처리 및 매출 반영" />
        <div className="mb-6">
          <StepItem number={1} title="미결제 건 확인" desc="상태 탭에서 '미결제'를 선택하여 결제 대기 건을 확인합니다." />
          <StepItem number={2} title="결제 처리 클릭" desc="해당 건의 '결제처리' 버튼을 클릭합니다." />
          <StepItem number={3} title="금액 및 결제방법 입력" desc="결제 금액과 방법(카드/현금/이체/할부)을 선택합니다." />
          <StepItem number={4} title="결제 완료" desc="확인 버튼을 누르면 '결제완료' 상태로 변경됩니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 환불 처리</h3>
        <div className="mb-4">
          <StepItem number={1} title="결제완료 건에서 환불 클릭" desc="결제완료 상태인 건의 '환불' 버튼을 클릭합니다." />
          <StepItem number={2} title="환불 확인" desc="확인 팝업에서 '환불'을 선택하면 상태가 '환불'로 변경됩니다." />
        </div>

        <FeatureTable items={[
          { label: '기간 필터', desc: '오늘 / 이번주 / 이번달 빠른 전환' },
          { label: '상태 탭', desc: '전체, 결제완료, 미결제, 환불 (4개 탭)' },
          { label: '7일 추이', desc: '최근 7일간 매출 추이 막대 그래프' },
          { label: 'CSV 가져오기', desc: '엑셀/CSV 파일로 거래 데이터 일괄 등록' },
          { label: 'CSV 내보내기', desc: '필터링된 거래 데이터 다운로드' },
          { label: '인라인 편집', desc: '미결제 건의 금액, 할인, 결제방법을 바로 입력' },
        ]} />
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 9. PATIENTS                                     */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="patients">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">👤 환자조회</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">환자 통합 프로필 - 시술이력, 상담이력, 알림이력, 매출분석</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오: 재방문 환자 이력 확인</h3>
        <ScenarioCard icon="👤" when="환자가 재방문하여 이전 이력을 확인할 때" where="환자조회" result="전체 시술/상담/결제 이력 확인" />
        <div className="mb-6">
          <StepItem number={1} title="환자 검색" desc="이름 또는 전화번호로 검색합니다 (2글자 이상)." />
          <StepItem number={2} title="환자 선택" desc="검색 결과에서 환자를 클릭하면 우측에 프로필이 표시됩니다." />
          <StepItem number={3} title="탭별 이력 확인" desc="시술이력, 상담이력, 알림이력, 매출분석(시술별) 4개 탭으로 전체 이력을 확인합니다." />
        </div>

        <FeatureTable items={[
          { label: '통합 프로필', desc: '총 결제액, 방문 횟수, 건당 평균 결제액 KPI 카드' },
          { label: '시술이력', desc: '날짜, 시술명, 담당의, 알림주기, 발송상태' },
          { label: '상담이력', desc: '날짜, 시술태그, 상태, 담당자, 상담내용' },
          { label: '알림이력', desc: '발송일, 채널(카카오/SMS), 발송상태' },
          { label: '매출분석', desc: '시술별 결제 건수, 총액, 건당 평균, 비율 차트' },
        ]} />
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 10. VOICE NOTE                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="voice-note">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">🎤 음성 노트</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">모바일에서 음성으로 빠르게 기록 - 운영현황, 상담, 퀵노트, 자유입력</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 A: 모바일에서 운영현황 음성 등록</h3>
        <ScenarioCard icon="🎤" when="모바일에서 환자 케이스를 음성으로 등록할 때" where="음성 노트 &gt; 운영 현황" result="운영현황에 케이스 자동 생성" />
        <div className="mb-6">
          <StepItem number={1} title="'운영 현황' 템플릿 선택" desc="음성 노트 페이지에서 '운영 현황' 카드를 탭합니다." />
          <StepItem number={2} title="음성으로 정보 입력" desc="마이크 버튼 → 환자명, 방번호, 시술명, 담당의, 소요시간 순서대로 말합니다." />
          <StepItem number={3} title="확인/수정 폼 검토" desc="음성 인식 결과가 폼에 자동으로 채워집니다. 잘못된 부분을 수동으로 수정합니다." />
          <StepItem number={4} title="케이스 추가" desc="'케이스 추가' 버튼을 누르면 운영현황에 반영됩니다." />
        </div>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오 B: 빠른 메모 (퀵노트/자유입력)</h3>
        <ScenarioCard icon="🎤" when="이동 중 빠르게 메모할 때" where="음성 노트" result="정형화된 메모 저장" />
        <div className="mb-4">
          <StepItem number={1} title="퀵노트 또는 자유 입력 선택" desc="퀵노트는 대상/내용/긴급도 3항목, 자유입력은 형식 없이 녹음합니다." />
          <StepItem number={2} title="마이크로 내용 입력" desc="마이크 버튼을 누르고 말합니다." />
          <StepItem number={3} title="저장" desc="내용 확인 후 '저장' 버튼을 누릅니다." />
        </div>

        <FeatureTable items={[
          { label: '4가지 템플릿', desc: '운영현황(7항목), 상담기록(8항목), 퀵노트(3항목), 자유입력' },
          { label: '자동 매핑', desc: '시술명, 담당의, 방번호 등을 기존 데이터에서 자동 매칭' },
          { label: '모바일 최적화', desc: '큰 터치 버튼, 단계별 가이드, 진행률 표시' },
          { label: '타임라인 연동', desc: '상담 타임라인에서도 마이크 버튼으로 음성 메모 추가 가능' },
        ]} />

        <h3 className="text-sm font-semibold text-[#6d4e42] mt-6 mb-2">음성 인식 팁</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
              <h4 className="text-xs font-semibold text-[#6d4e42]">이렇게 하세요</h4>
            </div>
            <ul className="space-y-1 text-[11px] text-[#575756]">
              <li>• 조용한 환경에서 사용</li>
              <li>• 짧고 명확하게 한 항목씩</li>
              <li>• 시술명은 정확한 이름으로 (&quot;울쎄라&quot;, &quot;써마지&quot;)</li>
              <li>• 숫자는 단위와 함께 (&quot;40분&quot;, &quot;3번 방&quot;)</li>
            </ul>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xs">✗</span>
              <h4 className="text-xs font-semibold text-[#6d4e42]">이렇게 하지 마세요</h4>
            </div>
            <ul className="space-y-1 text-[11px] text-[#575756]">
              <li>• 시끄러운 곳에서 사용 지양</li>
              <li>• 여러 항목을 한번에 길게 말하기</li>
              <li>• 인식 완료 전 다음 버튼 급히 누르기</li>
              <li>• 다른 사람이 동시에 말하기</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mt-4">
          <h4 className="text-xs font-semibold text-[#6d4e42] mb-2">브라우저 호환성</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-center p-2 bg-green-50 rounded-lg"><p className="font-medium">Android Chrome</p><p className="text-green-600">지원</p></div>
            <div className="text-center p-2 bg-green-50 rounded-lg"><p className="font-medium">iOS Safari 14.5+</p><p className="text-green-600">지원</p></div>
            <div className="text-center p-2 bg-green-50 rounded-lg"><p className="font-medium">PC Chrome</p><p className="text-green-600">지원</p></div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg"><p className="font-medium">iOS Chrome</p><p className="text-yellow-600">부분 지원</p></div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 11. EVENTS                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="events">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">🎉 이벤트관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">홈페이지에 표시되는 프로모션/이벤트 콘텐츠 관리</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오: 새 이벤트 등록</h3>
        <ScenarioCard icon="🎉" when="새로운 프로모션을 홈페이지에 게시할 때" where="이벤트관리" result="홈페이지 이벤트 페이지에 즉시 반영" />
        <div className="mb-6">
          <StepItem number={1} title="'새 이벤트' 버튼 클릭" desc="이벤트관리 페이지 상단의 '새 이벤트' 버튼을 누릅니다." />
          <StepItem number={2} title="이벤트 정보 입력" desc="제목, 카테고리, 시작/종료일, 설명, 포스터 이미지 등을 입력합니다." />
          <StepItem number={3} title="저장 또는 임시저장" desc="바로 게시하려면 저장, 나중에 게시하려면 임시저장(Draft)합니다." />
        </div>

        <FeatureTable items={[
          { label: '상태 관리', desc: '활성(초록), 종료(회색), 임시저장(노란) 상태 자동 판별' },
          { label: '검색', desc: '제목으로 이벤트 검색' },
          { label: '복제', desc: '기존 이벤트를 복사하여 새 이벤트 임시저장으로 생성' },
          { label: '삭제', desc: '확인 팝업 후 삭제 (홈페이지에서 즉시 제거)' },
          { label: '즉시 반영', desc: '저장 즉시 홈페이지 이벤트 페이지에 반영됩니다' },
        ]} />
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 12. POPUPS                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="popups">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">🪟 팝업관리</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">홈페이지 메인 팝업 배너 관리 (자동 롤링)</p>

        <h3 className="text-sm font-semibold text-[#b4988d] mb-2">시나리오: 팝업 등록 및 활성화</h3>
        <ScenarioCard icon="🪟" when="홈페이지에 공지/프로모션 팝업을 띄울 때" where="팝업관리" result="홈페이지 메인에 팝업 표시" />
        <div className="mb-6">
          <StepItem number={1} title="'새 팝업' 버튼 클릭" desc="팝업관리 페이지 상단의 '새 팝업' 버튼을 누릅니다." />
          <StepItem number={2} title="팝업 정보 입력" desc="제목, 이미지, 링크, 시작/종료일, 모바일 표시 여부를 설정합니다." />
          <StepItem number={3} title="활성화" desc="목록에서 토글 스위치로 팝업을 활성화/비활성화합니다." />
        </div>

        <FeatureTable items={[
          { label: '상태 배지', desc: '활성, 예정, 종료, 비활성 상태 자동 판별' },
          { label: '활성화 토글', desc: '목록에서 바로 활성/비활성 전환' },
          { label: '모바일 플래그', desc: '모바일에서 팝업 숨김 여부 설정' },
          { label: '자동 롤링', desc: '활성 팝업이 여러 개면 자동으로 롤링 표시' },
        ]} />
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 13. SETTINGS                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="settings">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-1">⚙️ 설정</h2>
        <p className="text-xs text-[#8a8a8a] mb-4">시술 마스터, 직원 관리, 감사 로그, 병원 정보 설정</p>

        {/* Tab 1: Treatment Master */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">탭 1: 시술 마스터</h3>
          <p className="text-xs text-[#575756] mb-3">병원에서 제공하는 시술 목록, 가격, 소요시간, 알림 주기를 관리합니다.</p>
          <FeatureTable items={[
            { label: '시술 등록', desc: '시술명, 카테고리, 가격대, 소요시간(분), 알림주기(일), 활성 여부' },
            { label: '카테고리 필터', desc: '전체/리프팅/안티에이징/레이저/피부관리/주사/상담/기타' },
            { label: '활성 토글', desc: '비활성화하면 다른 페이지에서 선택 목록에 표시되지 않음' },
          ]} />
        </div>

        {/* Tab 2: Staff */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">탭 2: 직원 관리</h3>
          <p className="text-xs text-[#575756] mb-3">관리자, 의사, 간호사, 직원 계정 및 역할을 관리합니다.</p>
          <FeatureTable items={[
            { label: '직원 등록', desc: '이름, 이메일, 역할(관리자/의사/간호사/직원), 직위, 활성 여부' },
            { label: '역할 배지', desc: '관리자(빨강), 의사(파랑), 간호사(초록), 직원(회색)' },
            { label: '활성 토글', desc: '퇴사 등의 경우 비활성화 (삭제 대신)' },
          ]} />
        </div>

        {/* Tab 3: Audit */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">탭 3: 감사 로그</h3>
          <p className="text-xs text-[#575756] mb-3">모든 관리자 작업(생성/수정/삭제/로그인/내보내기) 이력을 추적합니다.</p>
          <FeatureTable items={[
            { label: '필터', desc: '작업유형, 사용자, 시작일~종료일로 필터링' },
            { label: '자동 기록', desc: '상담 수정, 재고 변경, 설정 변경 등이 자동 기록' },
            { label: 'CSV 내보내기', desc: '필터링된 감사 로그 다운로드' },
          ]} />
        </div>

        {/* Tab 4: Clinic Info */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#6d4e42] mb-2">탭 4: 병원 정보</h3>
          <p className="text-xs text-[#575756] mb-3">병원 기본 정보, 운영시간, 알림 설정, 목표 매출을 관리합니다.</p>
          <FeatureTable items={[
            { label: '기본 정보', desc: '병원명, 전화번호, 이메일, 주소, 카카오 채널' },
            { label: '운영시간', desc: '평일, 토요일, 일요일, 점심시간' },
            { label: '알림 설정', desc: '콜백 리마인더, 재고 부족 알림, 새 상담 알림 토글' },
            { label: '목표 매출', desc: '월 목표 매출(원) - 리포트 대시보드에서 달성율로 표시' },
          ]} />
        </div>

        <TipBox>
          <strong>목표 매출을 설정하세요.</strong> 설정 &gt; 병원 정보 탭에서 월 목표 매출을 입력하면,
          리포트 페이지에서 목표 대비 달성율(%)이 자동으로 계산됩니다.
        </TipBox>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/* 14. FAQ                                         */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="faq">
        <h2 className="text-lg font-bold text-[#6d4e42] mb-4">자주 묻는 질문</h2>
        <div className="space-y-3">
          <FaqItem q="별도 앱을 설치해야 하나요?" a="아니요. 모바일 브라우저(Chrome/Safari)에서 관리자 페이지에 접속하면 모든 기능을 사용할 수 있습니다. 홈 화면에 추가하면 앱처럼 사용할 수도 있습니다." />
          <FaqItem q="음성 인식이 안 돼요." a="마이크 권한이 허용되어 있는지 확인해주세요. 브라우저 주소창 옆 자물쇠 아이콘 > 권한 설정에서 마이크를 '허용'으로 변경합니다. 인터넷 연결도 필요합니다." />
          <FaqItem q="여러 명이 동시에 사용할 수 있나요?" a="네. 각자의 기기에서 로그인하면 동시 사용 가능합니다. 상담관리, 운영현황 등은 실시간으로 동기화됩니다." />
          <FaqItem q="데이터 백업은 어떻게 하나요?" a="데이터는 클라우드(Supabase)에 자동 저장됩니다. 추가로 각 페이지의 CSV 내보내기 기능을 활용하여 수동 백업할 수 있습니다." />
          <FaqItem q="환자에게 알림이 실제로 발송되나요?" a="네. 알림관리에서 '발송' 버튼을 누르면 카카오톡 또는 SMS로 실제 전송됩니다. 테스트 시 주의하세요." />
          <FaqItem q="삭제한 이벤트/팝업은 복구 가능한가요?" a="삭제 시 확인 팝업이 뜨며, 삭제 후에는 복구할 수 없습니다. 삭제 대신 비활성화를 권장합니다." />
          <FaqItem q="리포트의 목표 매출은 어디서 설정하나요?" a="설정 > 병원 정보 탭 하단의 '목표 매출' 항목에서 월 목표 금액(원)을 입력합니다." />
          <FaqItem q="감사 로그에는 어떤 것이 기록되나요?" a="상담 상태 변경, 재고 입출고, 설정 변경, 로그인, CSV 내보내기 등 모든 관리자 작업이 자동으로 기록됩니다." />
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pb-8 text-center">
        <p className="text-xs text-[#c0c0c0]">LIV 관리자 시스템 사용 가이드 · v2.0</p>
      </div>
    </div>
  );
}
