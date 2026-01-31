export default function ReportsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">리포트</h2>
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
        <p className="text-4xl mb-4">📈</p>
        <p className="text-[#575756] font-medium mb-2">리포트 (Phase 4)</p>
        <p className="text-sm text-[#8a8a8a]">
          시술별 효율 분석, 상담 전환율, 재고 소모 리포트가 준비 중입니다.
          <br />
          시간당 매출, 평균 소요시간 등 핵심 KPI를 제공합니다.
        </p>
      </div>
    </div>
  );
}
