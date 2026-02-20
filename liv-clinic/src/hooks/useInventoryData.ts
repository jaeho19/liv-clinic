'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStockStatus } from '@/types/admin';
import type {
  InventoryItem,
  InventoryTransaction,
  InventoryCategory,
  ProcedureRecipe,
} from '@/types/admin';
import { groupIntoSessions, getTodayString, type UsageSession } from '@/lib/usage-session-utils';

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

export interface UseInventoryDataReturn {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  recipes: ProcedureRecipe[];
  loading: boolean;
  error: string | null;
  alertItems: InventoryItem[];
  loadData: () => Promise<void>;
  // 오늘 사용 데이터
  todayUsageSessions: UsageSession[];
  todayCategoryUsage: Map<InventoryCategory, number>;
  todayItemUsage: Map<string, number>;
  weeklyItemUsage: Map<string, number[]>;
}

// ─── 클라이언트 계산 ─────────────────────────────
function computeTodayUsage(
  transactions: InventoryTransaction[],
  items: InventoryItem[],
) {
  const today = getTodayString();
  const todayUseTxs = transactions.filter(
    t => t.tx_type === 'use' && t.created_at.startsWith(today)
  );

  const sessions = groupIntoSessions(todayUseTxs);

  const itemMap = new Map<string, InventoryItem>();
  for (const item of items) itemMap.set(item.id, item);

  // 카테고리별 사용 건수 (세션 수가 아닌 트랜잭션 수)
  const categoryUsage = new Map<InventoryCategory, number>();
  // 품목별 사용 수량
  const itemUsage = new Map<string, number>();

  for (const tx of todayUseTxs) {
    // 품목별
    itemUsage.set(tx.item_id, (itemUsage.get(tx.item_id) || 0) + tx.quantity);
    // 카테고리별
    const item = itemMap.get(tx.item_id);
    if (item) {
      categoryUsage.set(item.category, (categoryUsage.get(item.category) || 0) + 1);
    }
  }

  return { sessions, categoryUsage, itemUsage };
}

function computeWeeklyUsage(transactions: InventoryTransaction[]): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const now = new Date();

  // 최근 7일의 날짜 문자열 (오늘 포함, 인덱스 0 = 6일 전, 인덱스 6 = 오늘)
  const dayStrings: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dayStrings.push(`${y}-${m}-${day}`);
  }

  const useTxs = transactions.filter(t => t.tx_type === 'use');

  for (const tx of useTxs) {
    const txDate = tx.created_at.substring(0, 10); // YYYY-MM-DD
    const dayIdx = dayStrings.indexOf(txDate);
    if (dayIdx === -1) continue;

    if (!result.has(tx.item_id)) {
      result.set(tx.item_id, [0, 0, 0, 0, 0, 0, 0]);
    }
    result.get(tx.item_id)![dayIdx] += tx.quantity;
  }

  return result;
}

export function useInventoryData(): UseInventoryDataReturn {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [recipes, setRecipes] = useState<ProcedureRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [itemsData, recipesData, txData] = await Promise.all([
        fetchItems(),
        fetchRecipes(),
        fetchTransactions(),
      ]);

      setItems(itemsData);
      setRecipes(recipesData);
      setTransactions(txData);
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

  // 오늘 사용 데이터 (클라이언트 계산)
  const { todayUsageSessions, todayCategoryUsage, todayItemUsage } = useMemo(() => {
    const { sessions, categoryUsage, itemUsage } = computeTodayUsage(transactions, items);
    return {
      todayUsageSessions: sessions,
      todayCategoryUsage: categoryUsage,
      todayItemUsage: itemUsage,
    };
  }, [transactions, items]);

  // 주간 사용 데이터 (스파크라인용)
  const weeklyItemUsage = useMemo(() => computeWeeklyUsage(transactions), [transactions]);

  return {
    items,
    transactions,
    recipes,
    loading,
    error,
    alertItems,
    loadData,
    todayUsageSessions,
    todayCategoryUsage,
    todayItemUsage,
    weeklyItemUsage,
  };
}
