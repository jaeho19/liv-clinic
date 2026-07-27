'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase-browser';
import PopupModal, { popupImageSources } from './PopupModal';
import type { PopupRow } from '@/types/admin';
import type { Locale } from '@/i18n/routing';
import { pickLocalizedStrict } from '@/lib/i18nFallback';

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
  const locale = useLocale() as Locale;
  const [popups, setPopups] = useState<PopupRow[]>([]);
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

  // 모바일 필터링: 배열 레벨에서 일괄 적용
  const mobilePopups = isMobile
    ? popups.filter((p) => p.show_on_mobile)
    : popups;

  // 로케일 필터링: 팝업은 방문자가 보는 첫 화면이라 한국어 아트워크가 그대로 뜨면
  // 외국어 방문자에게는 사이트 전체가 한국어로 읽힌다. pickLocalizedStrict는 ko로
  // 폴백하지 않으므로, ko가 아닌 로케일에서는 "해당 언어(또는 en) 이미지가 등록된
  // 팝업"만 통과한다. 오늘 기준 en/ja/zh 이미지가 하나도 없으므로 외국어에서는
  // 팝업이 뜨지 않고, 어드민 팝업관리에서 언어별 이미지를 업로드하는 즉시
  // (image_url_en / _ja / _zh 필드가 이미 존재) 해당 언어에서 자동으로 다시 노출된다.
  // ko는 기존 동작 그대로.
  const displayPopups =
    locale === 'ko'
      ? mobilePopups
      : mobilePopups.filter(
          (p) => pickLocalizedStrict(popupImageSources(p), locale) !== null
        );

  if (displayPopups.length === 0 || !visible) return null;

  const handleClose = () => {
    setVisible(false);
  };

  const handleDismissToday = () => {
    displayPopups.forEach((p) => dismissToday(p.id));
    setVisible(false);
  };

  return (
    <PopupModal
      popups={displayPopups}
      onClose={handleClose}
      onDismissToday={handleDismissToday}
    />
  );
}
