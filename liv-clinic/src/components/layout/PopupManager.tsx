'use client';

import { useState, useEffect } from 'react';
import PopupModal from './PopupModal';
import type { PopupRow } from '@/types/admin';

// ── 로컬 정적 팝업 설정 ──────────────────────────────────
// Supabase 없이도 표시할 팝업을 여기에 추가하세요.
// display_start / display_end 기간 내에만 노출됩니다.
const STATIC_POPUPS: PopupRow[] = [
  {
    id: 'feb-2026-schedule',
    title: '2월 진료일정',
    image_url: '/images/popup/feb-schedule.jpeg',
    link_url: '',
    link_target: '_self',
    display_start: '2026-01-01T00:00:00+09:00',
    display_end: '2026-02-28T23:59:59+09:00',
    is_active: true,
    width: 480,
    sort_order: 0,
    show_on_mobile: true,
    created_at: '',
    updated_at: '',
  },
];
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
      let apiPopups: PopupRow[] = [];

      // Supabase API에서 팝업 로드 시도
      try {
        const res = await fetch('/api/popups');
        if (res.ok) {
          apiPopups = await res.json();
        }
      } catch {
        // Supabase 미설정 시 무시
      }

      // 정적 팝업 + API 팝업 병합 (ID 기준 중복 제거)
      const staticPopups = getActiveStaticPopups();
      const apiIds = new Set(apiPopups.map((p) => p.id));
      const merged = [
        ...staticPopups.filter((p) => !apiIds.has(p.id)),
        ...apiPopups,
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
