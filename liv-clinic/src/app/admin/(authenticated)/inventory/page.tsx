'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInventoryData } from '@/hooks/useInventoryData';
import KioskView from '@/components/admin/inventory/KioskView';
import CosmeticsKioskView from '@/components/admin/inventory/CosmeticsKioskView';

type KioskTab = 'procedure' | 'cosmetics';

export default function InventoryPage() {
  const { items, recipes, loading, error, loadData } = useInventoryData();
  const [activeTab, setActiveTab] = useState<KioskTab>('procedure');

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

  const activeItems = items.filter(i => i.is_active);

  return (
    <div>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-5 lg:mb-7">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] tracking-tight">
            물품 사용 기록
          </h2>
          <p className="text-xs text-[#a09080] mt-1">
            {activeTab === 'procedure'
              ? '시술 선택 → 옵션 선택 → 수량 확인 → 차감 완료'
              : '카테고리 선택 → 수량 조정 → 차감 완료'
            }
          </p>
        </div>
        <Link
          href="/admin/inventory/overview"
          className="px-4 py-2.5 bg-white border border-[#ebe7e4] text-[#6d4e42] rounded-xl text-sm font-semibold hover:bg-[#faf8f7] transition-all duration-150 flex items-center gap-2"
          style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          재고 현황 보기
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('procedure')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'procedure'
              ? 'bg-[#6d4e42] text-white shadow-md'
              : 'bg-white text-[#6d4e42] border border-[#ebe7e4] hover:bg-[#faf8f7]'
          }`}
        >
          시술 물품 사용
        </button>
        <button
          onClick={() => setActiveTab('cosmetics')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'cosmetics'
              ? 'bg-[#6d4e42] text-white shadow-md'
              : 'bg-white text-[#6d4e42] border border-[#ebe7e4] hover:bg-[#faf8f7]'
          }`}
        >
          화장품 사용
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'procedure' ? (
        <KioskView
          items={activeItems}
          recipes={recipes}
          loadData={loadData}
        />
      ) : (
        <CosmeticsKioskView
          items={activeItems}
          loadData={loadData}
        />
      )}
    </div>
  );
}
