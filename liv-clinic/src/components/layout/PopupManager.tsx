'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import PopupModal from './PopupModal';
import type { PopupRow } from '@/types/admin';

// ── 로컬 정적 팝업 설정 ──────────────────────────────────
// Supabase 없이도 표시할 팝업을 여기에 추가하세요.
// display_start / display_end 기간 내에만 노출됩니다.
// 어드민 팝업관리에서 DB로 관리하므로 기본값은 빈 배열입니다.
const STATIC_POPUPS: PopupRow[] = [];
// ─────────────────────────────────────────────────────────

function getDismissKey(popupId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `popup_dismissed_${popupId}_${today}`;
}

function isDismissedToday(popupId: string): boolean {
  try {
    return localStorage.getItem(getDismissKey(popupId)) === '1';
  } catch {
    return false;
  }
}

function dismissToday(popupId: string): void {
  try {
    localStorage.setItem(getDismissKey(popupId), '1');
  } catch {
    // localStorage not available
  }
}

function getActiveStaticPopups(): PopupRow[] {
  const now = new Date();
  return STATIC_POPUPS.filter(
    (p) =>
      p.is_active &&
      new Date(p.display_start) <= now &&
      new Date(p.display_end) >= now
  );
}

export default function PopupManager() {
  const [popups, setPopups] = useState<PopupRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const loadPopups = async () => {
      let dbPopups: PopupRow[] = [];

      // Supabase에서 활성 팝업 직접 로드
      try {
        const supabase = createClient();
        const now = new Date().toISOString();

        const { data } = await supabase
          .from('popups')
          .select('*')
          .eq('is_active', true)
          .lte('display_start', now)
          .gte('display_end', now)
          .order('sort_order', { ascending: true });

        if (data) {
          dbPopups = data as PopupRow[];
        }
      } catch {
        // Supabase 미설정 시 무시
      }

      // 정적 팝업 + DB 팝업 병합 (ID 기준 중복 제거)
      const staticPopups = getActiveStaticPopups();
      const dbIds = new Set(dbPopups.map((p) => p.id));
      const merged = [
        ...staticPopups.filter((p) => !dbIds.has(p.id)),
        ...dbPopups,
      ];

      // 오늘 이미 닫은 팝업 제외
      const active = merged.filter((p) => !isDismissedToday(p.id));
      setPopups(active);
    };

    loadPopups();
  }, []);

  const currentPopup = popups[currentIndex];

  if (!currentPopup || !visible) return null;

  // Hide on mobile if configured
  if (isMobile && !currentPopup.show_on_mobile) {
    // Skip to next popup
    if (currentIndex < popups.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    return null;
  }

  const handleClose = () => {
    if (currentIndex < popups.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setVisible(false);
    }
  };

  const handleDismissToday = () => {
    dismissToday(currentPopup.id);
    handleClose();
  };

  return (
    <PopupModal
      popup={currentPopup}
      onClose={handleClose}
      onDismissToday={handleDismissToday}
    />
  );
}
