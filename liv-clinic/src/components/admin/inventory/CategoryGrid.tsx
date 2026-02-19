'use client';

import { useMemo, useState } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  GENERAL_INVENTORY_CATEGORIES,
  getStockStatus,
} from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';
import type { StockFilter } from './DashboardStatsCards';
import CategoryCard from './CategoryCard';

type FilterMode = 'all' | 'general' | 'cosmetics';

interface CategoryGridProps {
  items: InventoryItem[];
  selectedCategory: InventoryCategory | null;
  onSelectCategory: (cat: InventoryCategory | null) => void;
  todayCategoryUsage?: Map<InventoryCategory, number>;
  weeklyItemUsage?: Map<string, number[]>;
  todayItemUsage?: Map<string, number>;
  stockFilter?: StockFilter;
}

export default function CategoryGrid({
  items,
  selectedCategory,
  onSelectCategory,
  todayCategoryUsage,
  weeklyItemUsage,
  todayItemUsage,
  stockFilter,
}: CategoryGridProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const activeItems = useMemo(() => items.filter(i => i.is_active), [items]);

  const categories = useMemo(() => {
    const map = new Map<InventoryCategory, InventoryItem[]>();
    for (const item of activeItems) {
      if (stockFilter && stockFilter !== 'all') {
        const status = getStockStatus(item);
        if (stockFilter !== status) continue;
      }
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }

    const allCats: InventoryCategory[] = [...GENERAL_INVENTORY_CATEGORIES, 'cosmetics'];
    return allCats
      .filter(cat => {
        if (!map.has(cat)) return false;
        if (filterMode === 'general') return cat !== 'cosmetics';
        if (filterMode === 'cosmetics') return cat === 'cosmetics';
        return true;
      })
      .map(cat => ({
        category: cat,
        label: INVENTORY_CATEGORY_LABELS[cat],
        items: map.get(cat)!,
      }));
  }, [activeItems, filterMode, stockFilter]);

  // 카테고리별 주간 스파크라인 계산 (해당 카테고리 품목의 일별 합산)
  const categorySparklines = useMemo(() => {
    if (!weeklyItemUsage) return new Map<InventoryCategory, number[]>();

    const result = new Map<InventoryCategory, number[]>();
    for (const cat of categories) {
      const sparkline = [0, 0, 0, 0, 0, 0, 0];
      for (const item of cat.items) {
        const weekly = weeklyItemUsage.get(item.id);
        if (weekly) {
          for (let i = 0; i < 7; i++) sparkline[i] += weekly[i];
        }
      }
      result.set(cat.category, sparkline);
    }
    return result;
  }, [categories, weeklyItemUsage]);

  // 카테고리별 가장 많이 사용된 품목
  const categoryTopItems = useMemo(() => {
    if (!todayItemUsage) return new Map<InventoryCategory, string>();

    const result = new Map<InventoryCategory, string>();
    for (const cat of categories) {
      let maxQty = 0;
      let topName = '';
      for (const item of cat.items) {
        const qty = todayItemUsage.get(item.id) || 0;
        if (qty > maxQty) {
          maxQty = qty;
          topName = item.name;
        }
      }
      if (topName) result.set(cat.category, topName);
    }
    return result;
  }, [categories, todayItemUsage]);

  const FILTERS: { id: FilterMode; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'general', label: '일반' },
    { id: 'cosmetics', label: '화장품' },
  ];

  return (
    <div>
      {/* Filter toggle */}
      <div className="flex gap-0.5 bg-[#f6f4f2] p-1 rounded-xl w-fit mb-5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterMode(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
              filterMode === f.id
                ? 'bg-white text-[#6d4e42] shadow-sm'
                : 'text-[#a09080] hover:text-[#575756]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map(cat => (
          <CategoryCard
            key={cat.category}
            category={cat.category}
            label={cat.label}
            items={cat.items}
            isSelected={selectedCategory === cat.category}
            onClick={() => onSelectCategory(selectedCategory === cat.category ? null : cat.category)}
            todayUsageCount={todayCategoryUsage?.get(cat.category)}
            weeklySparkline={categorySparklines.get(cat.category)}
            topUsedItem={categoryTopItems.get(cat.category)}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-[#a09080]">
          <p className="text-sm">해당 필터에 품목이 없습니다</p>
        </div>
      )}
    </div>
  );
}
