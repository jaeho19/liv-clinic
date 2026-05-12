const SOUND_KEY = 'admin_chat_sound_enabled';

export function readSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeSoundEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_KEY, String(value));
  } catch {
    // privacy mode / quota → silent fail
  }
}
