'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEVICE_INITIAL_SHOTS } from '@/types/admin';
import type { DeviceTipShot, DeviceShotLog, DeviceType } from '@/types/admin';

interface ShotUseMeta {
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
}

interface UseShotTrackingReturn {
  tips: DeviceTipShot[];
  logs: DeviceShotLog[];
  loading: boolean;
  error: string | null;
  registerTip: (deviceType: DeviceType, tipType: string, itemId: string) => Promise<void>;
  useShots: (tipId: string, shotsUsed: number, meta?: ShotUseMeta) => Promise<void>;
  refresh: () => Promise<void>;
}

interface TipsApiResponse {
  tips: DeviceTipShot[];
  logs: DeviceShotLog[];
}

async function fetchTips(deviceType?: DeviceType): Promise<TipsApiResponse> {
  const params = new URLSearchParams();
  if (deviceType) params.set('device_type', deviceType);
  params.set('active_only', 'false');
  params.set('include_logs', 'true');
  const res = await fetch(`/api/admin/inventory/shots?${params}`);
  if (!res.ok) throw new Error('팁 목록을 불러오지 못했습니다.');
  return res.json();
}

export function useShotTracking(deviceType?: DeviceType): UseShotTrackingReturn {
  const [tips, setTips] = useState<DeviceTipShot[]>([]);
  const [logs, setLogs] = useState<DeviceShotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTips(deviceType);
      setTips(data.tips);
      setLogs(data.logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [deviceType]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const registerTip = useCallback(async (dt: DeviceType, tipType: string, itemId: string) => {
    const initialShots = DEVICE_INITIAL_SHOTS[dt]?.[tipType];
    if (!initialShots) throw new Error(`지원하지 않는 팁: ${dt}/${tipType}`);

    const res = await fetch('/api/admin/inventory/shots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, tip_type: tipType, device_type: dt }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '팁 등록 실패');
    }
    await refresh();
  }, [refresh]);

  const useShots = useCallback(async (tipId: string, shotsUsed: number, meta?: ShotUseMeta) => {
    // Optimistic update
    setTips(prev => prev.map(t =>
      t.id === tipId
        ? {
            ...t,
            remaining_shots: Math.max(0, t.remaining_shots - shotsUsed),
            is_active: t.remaining_shots - shotsUsed > 0,
          }
        : t
    ));

    try {
      const res = await fetch('/api/admin/inventory/shots/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip_id: tipId, shots_used: shotsUsed, ...meta }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '샷 차감 실패');
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '샷 차감 실패');
      await refresh();
    }
  }, [refresh]);

  return { tips, logs, loading, error, registerTip, useShots, refresh };
}
