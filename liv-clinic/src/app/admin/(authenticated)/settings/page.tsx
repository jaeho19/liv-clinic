export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">설정</h2>
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="text-[#575756] font-medium mb-2">설정 (Phase 5)</p>
        <p className="text-sm text-[#8a8a8a]">
          시술 마스터 관리, 직원/권한 관리, 감사 로그 뷰어가 준비 중입니다.
          <br />
          owner/admin/staff 역할 기반 접근 제어를 제공합니다.
        </p>
      </div>
    </div>
  );
}
