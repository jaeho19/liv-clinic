export default function InventoryPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">재고관리</h2>
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
        <p className="text-4xl mb-4">📦</p>
        <p className="text-[#575756] font-medium mb-2">재고관리 (Phase 3)</p>
        <p className="text-sm text-[#8a8a8a]">
          재고 품목 관리, 자동 차감, 재주문 경고 기능이 준비 중입니다.
          <br />
          시술 완료 시 recipe 기반으로 재고가 자동 차감됩니다.
        </p>
      </div>
    </div>
  );
}
