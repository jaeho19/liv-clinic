'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStockStatus } from '@/types/admin';
import type {
  InventoryItem,
  InventoryTransaction,
  ProcedureRecipe,
} from '@/types/admin';
import type { BurndownResult } from '@/lib/inventory-utils';

// ─── API fetch ──────────────────────────────────
async function fetchItems(): Promise<InventoryItem[]> {
  const res = await fetch('/api/admin/inventory');
  if (!res.ok) throw new Error('품목 목록을 불러오지 못했습니다.');
  return res.json();
}

async function fetchTransactions(): Promise<InventoryTransaction[]> {
  const res = await fetch('/api/admin/inventory/transactions?limit=200');
  if (!res.ok) throw new Error('사용 이력을 불러오지 못했습니다.');
  return res.json();
}

async function fetchRecipes(): Promise<ProcedureRecipe[]> {
  const res = await fetch('/api/admin/inventory/recipes');
  if (!res.ok) throw new Error('시술 레시피를 불러오지 못했습니다.');
  return res.json();
}

interface BurndownApiItem {
  itemId: string;
  dailyRate: number;
  daysUntilEmpty: number;
  estimatedDate: string;
  severity: 'safe' | 'warning' | 'critical';
}

interface BurndownApiResponse {
  items: BurndownApiItem[];
  categorySummary: { category: string; totalItems: number; totalValue: number; criticalCount: number; warningCount: number }[];
}

async function fetchBurndown(): Promise<BurndownApiResponse> {
  const res = await fetch('/api/admin/inventory/burndown');
  if (!res.ok) return { items: [], categorySummary: [] };
  return res.json();
}

export type CategorySummaryItem = BurndownApiResponse['categorySummary'][number];

export interface UseInventoryDataReturn {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  recipes: ProcedureRecipe[];
  loading: boolean;
  error: string | null;
  burndownMap: Map<string, BurndownResult>;
  categorySummary: CategorySummaryItem[];
  alertItems: InventoryItem[];
  loadData: () => Promise<void>;
}

export function useInventoryData(): UseInventoryDataReturn {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [recipes, setRecipes] = useState<ProcedureRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [burndownMap, setBurndownMap] = useState<Map<string, BurndownResult>>(new Map());
  const [categorySummary, setCategorySummary] = useState<CategorySummaryItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [itemsData, txData, recipesData, burndownData] = await Promise.all([
        fetchItems(),
        fetchTransactions(),
        fetchRecipes(),
        fetchBurndown(),
      ]);
      setItems(itemsData);
      setTransactions(txData);
      setRecipes(recipesData);

      const map = new Map<string, BurndownResult>();
      for (const bd of burndownData.items) {
        map.set(bd.itemId, {
          dailyRate: bd.dailyRate,
          daysUntilEmpty: bd.daysUntilEmpty,
          estimatedDate: bd.estimatedDate,
          severity: bd.severity,
        });
      }
      setBurndownMap(map);
      setCategorySummary(burndownData.categorySummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const alertItems = useMemo(() => {
    return items.filter(i => i.is_active && (getStockStatus(i) === 'out' || getStockStatus(i) === 'low'));
  }, [items]);

  return {
    items,
    transactions,
    recipes,
    loading,
    error,
    burndownMap,
    categorySummary,
    alertItems,
    loadData,
  };
}
