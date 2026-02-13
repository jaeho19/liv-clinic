'use client';

import { useInventoryData } from '@/hooks/useInventoryData';
import KioskView from '@/components/admin/inventory/KioskView';

export default function InventoryPage() {
  const { items, recipes, loading, error, loadData } = useInventoryData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-[3px] border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin mb-4" />
          <p className="text-[#a09080] text-sm">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-medium hover:bg-[#5a3d33] transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <KioskView
      items={items.filter(i => i.is_active)}
      recipes={recipes}
      loadData={loadData}
    />
  );
}
