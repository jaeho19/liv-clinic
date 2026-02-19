'use client';

import { useState } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_SUBCATEGORY_LABELS,
} from '@/types/admin';
import type { InventoryCategory } from '@/types/admin';

const ALL_CATEGORIES = Object.keys(INVENTORY_CATEGORY_LABELS) as InventoryCategory[];

const UNIT_SUGGESTIONS = ['개', '바이알', '시린지', '박스', 'ml', '병', 'EA'];

interface AddItemModalProps {
  onSubmit: (data: NewItemData) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}

export interface NewItemData {
  name: string;
  category: InventoryCategory;
  sub_category?: string;
  specification?: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  min_stock: number;
  supplier?: string;
  storage_note?: string;
  is_refrigerated: boolean;
  volume_cc?: number;
}

export default function AddItemModal({ onSubmit, onClose, submitting = false }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('injection');
  const [subCategory, setSubCategory] = useState('');
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('개');
  const [unitPrice, setUnitPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [isRefrigerated, setIsRefrigerated] = useState(false);
  const [volumeCc, setVolumeCc] = useState('');
  const [supplier, setSupplier] = useState('');

  const canSubmit = name.trim().length > 0 && unit.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      category,
      sub_category: subCategory || undefined,
      specification: specification || undefined,
      unit: unit.trim(),
      unit_price: unitPrice,
      current_stock: currentStock,
      min_stock: minStock,
      supplier: supplier || undefined,
      is_refrigerated: isRefrigerated,
      volume_cc: volumeCc ? Number(volumeCc) : undefined,
    });
  };

  // Get subcategory options for selected category
  const subCategoryOptions = Object.entries(INVENTORY_SUBCATEGORY_LABELS)
    .filter(([key]) => {
      // Simple heuristic: match by known prefixes
      const catPrefixes: Record<string, string[]> = {
        device_tip: ['ulthera', 'shurink', 'thermage', 'densify', 'potenza'],
        injection: ['filler', 'skinbooster', 'toxin', 'pn', 'exosome', 'rejuran'],
        thread: ['pdo', 'plla', 'pcl'],
        consumable: ['needle', 'syringe', 'saline', 'bandage', 'tape'],
        skincare: ['mask', 'cream', 'serum', 'cleanser'],
        medicine: ['ointment', 'oral', 'topical'],
        cosmetics: [],
        sample: [],
      };
      const prefixes = catPrefixes[category] || [];
      return prefixes.some(p => key.startsWith(p) || key.includes(p));
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div
        className="bg-white rounded-2xl border border-[#ebe7e4] w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        <div className="px-6 py-4 border-b border-[#ebe7e4] bg-emerald-50/60 sticky top-0 z-10">
          <h3 className="font-bold tracking-tight text-emerald-700">새 물품 추가</h3>
          <p className="text-sm text-[#a09080] mt-0.5">재고에 새로운 물품을 등록합니다</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 물품명 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              물품명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="물품명을 입력하세요"
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
              required
            />
          </div>

          {/* 카테고리 + 단위 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as InventoryCategory); setSubCategory(''); }}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow bg-white"
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{INVENTORY_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                단위 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  list="unit-suggestions"
                  className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
                  required
                />
                <datalist id="unit-suggestions">
                  {UNIT_SUGGESTIONS.map(u => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* 세부 분류 */}
          {subCategoryOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">세부 분류</label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow bg-white"
              >
                <option value="">선택 안함</option>
                {subCategoryOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 규격 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">규격/사양</label>
            <input
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="예: 1.5mm, 100U, 2cc"
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
            />
          </div>

          {/* 단가 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              단가 (원) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
            />
          </div>

          {/* 초기 재고 + 최소 재고 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                초기 재고 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                최소 재고 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
              />
            </div>
          </div>

          {/* 용량 + 냉장 */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">용량 (cc)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={volumeCc}
                onChange={(e) => setVolumeCc(e.target.value)}
                placeholder="기본 1cc 외"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <button
                  type="button"
                  onClick={() => setIsRefrigerated(!isRefrigerated)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${isRefrigerated ? 'bg-sky-500' : 'bg-[#d5cdc7]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isRefrigerated ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-[#575756]">냉장 보관</span>
              </label>
            </div>
          </div>

          {/* 공급사 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">공급사</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="공급사명"
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-shadow"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#ebe7e4] rounded-xl text-sm text-[#a09080] hover:bg-[#faf8f7] transition-colors cursor-pointer font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              {submitting ? '등록 중...' : '물품 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
