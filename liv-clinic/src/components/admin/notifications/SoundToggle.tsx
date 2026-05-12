'use client';

import { useNotifications } from './NotificationProvider';

export function SoundToggle() {
  const {
    soundEnabled,
    toggleSound,
    notificationPermission,
  } = useNotifications();

  const handleClick = async () => {
    // toggleSound 내부에서 사운드 토글 + OS 권한 요청(default 시)을 모두 수행
    await toggleSound();
  };

  const isDenied = notificationPermission === 'denied';

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#575756] hover:bg-[#f6f6f6] transition-colors cursor-pointer mb-1"
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? '채팅 알림 소리 끄기' : '채팅 알림 소리 켜기'}
      title={
        isDenied
          ? 'OS 알림 차단됨 — 브라우저 주소창 옆 자물쇠 아이콘 → 알림 허용으로 설정. 토스트/소리는 정상 동작합니다.'
          : soundEnabled
          ? '클릭하여 알림 소리 끄기'
          : '클릭하여 알림 소리 켜기 (브라우저 알림 권한 동시 요청)'
      }
    >
      <span className="text-base">{soundEnabled ? '🔔' : '🔕'}</span>
      <span className="flex-1 text-left">
        {soundEnabled ? '알림 소리 켜짐' : '알림 소리 켜기'}
      </span>
      {isDenied && (
        <span
          className="text-[10px] text-amber-600 font-medium"
          aria-label="OS 알림 권한 차단됨"
        >
          OS차단
        </span>
      )}
      {notificationPermission === 'granted' && soundEnabled && (
        <span
          className="text-[10px] text-emerald-600 font-medium"
          aria-label="OS 알림 활성"
        >
          OS✓
        </span>
      )}
    </button>
  );
}
