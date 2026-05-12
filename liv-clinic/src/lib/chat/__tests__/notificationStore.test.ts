import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSoundEnabled, writeSoundEnabled } from '../notificationStore';

function installLocalStorageStub(): {
  store: Map<string, string>;
  getSpy: ReturnType<typeof vi.fn>;
  setSpy: ReturnType<typeof vi.fn>;
} {
  const store = new Map<string, string>();
  const getSpy = vi.fn((key: string): string | null => store.get(key) ?? null);
  const setSpy = vi.fn((key: string, value: string): void => {
    store.set(key, value);
  });
  const localStorageMock = {
    getItem: getSpy,
    setItem: setSpy,
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((idx: number) => Array.from(store.keys())[idx] ?? null),
    get length() {
      return store.size;
    },
  };
  (globalThis as unknown as { window?: { localStorage: Storage } }).window = {
    localStorage: localStorageMock as unknown as Storage,
  };
  return { store, getSpy, setSpy };
}

function uninstallLocalStorage(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
}

describe('notificationStore', () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    uninstallLocalStorage();
    vi.restoreAllMocks();
  });

  describe('readSoundEnabled', () => {
    it('returns false when key absent (default)', () => {
      expect(readSoundEnabled()).toBe(false);
    });

    it('returns true when stored as "true"', () => {
      writeSoundEnabled(true);
      expect(readSoundEnabled()).toBe(true);
    });

    it('returns false when stored as "false" string', () => {
      writeSoundEnabled(false);
      expect(readSoundEnabled()).toBe(false);
    });

    it('returns false when localStorage throws (private mode)', () => {
      const { getSpy } = installLocalStorageStub();
      getSpy.mockImplementation(() => {
        throw new Error('SecurityError: localStorage disabled');
      });
      expect(readSoundEnabled()).toBe(false);
    });

    it('returns false when window is undefined (SSR)', () => {
      uninstallLocalStorage();
      expect(readSoundEnabled()).toBe(false);
    });
  });

  describe('writeSoundEnabled', () => {
    it('persists true as "true"', () => {
      writeSoundEnabled(true);
      const stub = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage;
      expect(stub.getItem('admin_chat_sound_enabled')).toBe('true');
    });

    it('persists false as "false"', () => {
      writeSoundEnabled(false);
      const stub = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage;
      expect(stub.getItem('admin_chat_sound_enabled')).toBe('false');
    });

    it('silent fail when setItem throws (quota / private mode)', () => {
      const { setSpy } = installLocalStorageStub();
      setSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => writeSoundEnabled(true)).not.toThrow();
    });

    it('is no-op when window is undefined (SSR)', () => {
      uninstallLocalStorage();
      expect(() => writeSoundEnabled(true)).not.toThrow();
    });
  });

  describe('roundtrip', () => {
    it('write(true) → read() === true', () => {
      writeSoundEnabled(true);
      expect(readSoundEnabled()).toBe(true);
    });

    it('write(false) → read() === false', () => {
      writeSoundEnabled(false);
      expect(readSoundEnabled()).toBe(false);
    });

    it('write(true) then write(false) → read() === false', () => {
      writeSoundEnabled(true);
      writeSoundEnabled(false);
      expect(readSoundEnabled()).toBe(false);
    });
  });
});
