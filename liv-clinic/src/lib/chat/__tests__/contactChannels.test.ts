import { describe, it, expect } from 'vitest';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
import {
  CAPTURE_DISMISS_TTL_MS,
  CLINIC_LINK_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  CONTACT_FORM_CHANNELS,
  STAFF_ACTIVE_WINDOW_MS,
  buildChatRefCode,
  defaultFormChannel,
  extractEmail,
  isStaffMessage,
  orderedLinkChannels,
  parseCaptureDismissedAt,
  shouldShowCaptureBlock,
  validateContactHandle,
  type CaptureBlockConditions,
} from '../contactChannels';

describe('채널 목록', () => {
  it('바로 연락하기 단추는 네 개 — whatsapp/wechat/line/email', () => {
    expect(CLINIC_LINK_CHANNELS).toEqual(['whatsapp', 'wechat', 'line', 'email']);
  });

  it('연락처 남기기에는 line이 없고 email이 있다', () => {
    expect(CONTACT_FORM_CHANNELS).toEqual(['whatsapp', 'wechat', 'email']);
  });

  it('채널 이름은 번역하지 않는다', () => {
    expect(CONTACT_CHANNEL_LABELS).toEqual({ whatsapp: 'WhatsApp', wechat: 'WeChat', line: 'LINE', email: 'Email' });
  });
});

describe('validateContactHandle', () => {
  it('WhatsApp: 국제 형식 번호 허용, 짧거나 문자는 거부', () => {
    expect(validateContactHandle('whatsapp', '+82 10-6888-2773')).toBe(true);
    expect(validateContactHandle('whatsapp', '+1 (234) 567-8900')).toBe(true);
    expect(validateContactHandle('whatsapp', '01068882773')).toBe(true);
    expect(validateContactHandle('whatsapp', '+82')).toBe(false);
    expect(validateContactHandle('whatsapp', 'not-a-number')).toBe(false);
  });

  it('WeChat/LINE: 영숫자 ID 허용, 공백/한글 거부', () => {
    expect(validateContactHandle('wechat', 'livps0414')).toBe(true);
    expect(validateContactHandle('line', 'user_name-1.x')).toBe(true);
    expect(validateContactHandle('wechat', 'ab')).toBe(false);
    expect(validateContactHandle('line', 'has space')).toBe(false);
  });

  it('Email: 주소 형식만 허용', () => {
    expect(validateContactHandle('email', 'guest@example.com')).toBe(true);
    expect(validateContactHandle('email', '  guest@example.co.jp  ')).toBe(true);
    expect(validateContactHandle('email', 'guest@example')).toBe(false);
    expect(validateContactHandle('email', 'guest example@x.com')).toBe(false);
    expect(validateContactHandle('email', `${'a'.repeat(250)}@x.com`)).toBe(false);
  });
});

describe('buildChatRefCode', () => {
  it('참조코드는 uuid 앞 8자 대문자', () => {
    expect(buildChatRefCode('a1b2c3d4-0000-0000-0000-000000000000')).toBe('A1B2C3D4');
  });
});

describe('defaultFormChannel — 연락처 남기기의 기본 선택', () => {
  it('중국어 → WeChat, 일본어 → 이메일, 그 외 → WhatsApp', () => {
    expect(defaultFormChannel('zh')).toBe('wechat');
    expect(defaultFormChannel('ja')).toBe('email');
    expect(defaultFormChannel('en')).toBe('whatsapp');
    expect(defaultFormChannel('zh-TW')).toBe('whatsapp');
    expect(defaultFormChannel('th')).toBe('whatsapp');
  });
});

describe('orderedLinkChannels — 바로 연락하기 단추 순서', () => {
  it('1순위 메신저가 맨 앞', () => {
    expect(orderedLinkChannels('ja')).toEqual(['line', 'whatsapp', 'wechat', 'email']);
    expect(orderedLinkChannels('en')).toEqual(['whatsapp', 'wechat', 'line', 'email']);
    expect(orderedLinkChannels('zh')).toEqual(['wechat', 'whatsapp', 'line', 'email']);
    expect(orderedLinkChannels('zh-TW')).toEqual(['whatsapp', 'wechat', 'line', 'email']);
  });

  it('이메일은 어느 로케일에서나 맨 뒤', () => {
    for (const locale of ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar']) {
      const order = orderedLinkChannels(locale);
      expect(order).toHaveLength(4);
      expect(order[3]).toBe('email');
      expect(new Set(order).size).toBe(4);
    }
  });
});

describe('extractEmail — 손님 글 속 이메일', () => {
  it('본문 중간의 주소를 찾는다', () => {
    expect(extractEmail('Please reply to guest@example.com thanks')).toBe('guest@example.com');
  });

  it('문장 끝 마침표는 주소에 넣지 않는다', () => {
    expect(extractEmail('My email is guest@example.com.')).toBe('guest@example.com');
    expect(extractEmail('メールは guest.name+liv@example.co.jp です。')).toBe('guest.name+liv@example.co.jp');
  });

  it('병원 자체 도메인은 제외한다', () => {
    expect(extractEmail('I wrote to info@livps.co.kr yesterday')).toBeNull();
    expect(extractEmail('sent to hello@liv-clinic.net')).toBeNull();
    expect(extractEmail('sent to hello@mail.livps.co.kr')).toBeNull();
  });

  it('카드의 병원 주소(CHAT_CONTACT_EMAIL)는 제외한다 — 대소문자 무시', () => {
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL}`)).toBeNull();
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL.toUpperCase()}`)).toBeNull();
  });

  it('병원 주소 뒤에 손님 주소가 있으면 손님 주소를 고른다', () => {
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL} from me@example.com`)).toBe('me@example.com');
  });

  it('여러 개면 첫째', () => {
    expect(extractEmail('a@example.com or b@example.com')).toBe('a@example.com');
  });

  it('없으면 null', () => {
    expect(extractEmail('How much is Ulthera?')).toBeNull();
    expect(extractEmail('my wechat is @liwei')).toBeNull();
    expect(extractEmail('')).toBeNull();
  });

  it('254자를 넘는 주소는 무시한다', () => {
    expect(extractEmail(`${'a'.repeat(250)}@example.com`)).toBeNull();
  });
});

describe('shouldShowCaptureBlock — 연락처 카드 노출 규칙', () => {
  const NOW = Date.parse('2026-10-05T03:00:00Z');
  const at = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();
  const visitor = (minutesAgo: number) => ({ sender: 'visitor', source: 'app', created_at: at(minutesAgo) });
  const staff = (minutesAgo: number, source = 'slack') => ({ sender: 'operator', source, created_at: at(minutesAgo) });
  const auto = (minutesAgo: number) => ({ sender: 'operator', source: 'auto', created_at: at(minutesAgo) });
  const system = (minutesAgo: number) => ({ sender: 'system', source: 'app', created_at: at(minutesAgo) });

  const base: CaptureBlockConditions = {
    presenceLoaded: true,
    sessionInfoLoaded: true,
    hasContact: false,
    dismissedAtMs: null,
    messages: [system(3), visitor(2), auto(2)],
    nowMs: NOW,
  };

  it('손님이 글을 남기고 기다리는 중이면 뜬다 — 영업시간과 무관하다', () => {
    expect(shouldShowCaptureBlock(base)).toBe(true);
  });

  it('presence나 세션 정보 조회가 끝나지 않았으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, presenceLoaded: false })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, sessionInfoLoaded: false })).toBe(false);
  });

  it('손님 글이 없으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [system(3)] })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, messages: [] })).toBe(false);
  });

  it('연락처가 이미 있으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, hasContact: true })).toBe(false);
  });

  it('✕로 닫은 뒤 12시간 동안은 뜨지 않고, 그 뒤에는 다시 뜬다', () => {
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - 60_000 })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - CAPTURE_DISMISS_TTL_MS + 1 })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - CAPTURE_DISMISS_TTL_MS })).toBe(true);
  });

  it('마지막이 직원 글이면(기다리는 중이 아니면) 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(30), staff(20)] })).toBe(false);
  });

  it('자동 안내와 시스템 메시지는 직원 글로 치지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(5), auto(5), system(4)] })).toBe(true);
    expect(isStaffMessage(auto(1))).toBe(false);
    expect(isStaffMessage(system(1))).toBe(false);
    expect(isStaffMessage(staff(1, 'app'))).toBe(true);
  });

  it('직원 글이 10분 안에 있으면(주고받는 중) 뜨지 않고, 10분이 지나면 다시 뜬다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(8), staff(5), visitor(1)] })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(30), staff(11), visitor(9)] })).toBe(true);
    const justInside = new Date(NOW - STAFF_ACTIVE_WINDOW_MS + 1).toISOString();
    expect(
      shouldShowCaptureBlock({
        ...base,
        messages: [visitor(30), { sender: 'operator', source: 'slack', created_at: justInside }, visitor(1)],
      })
    ).toBe(false);
  });
});

describe('parseCaptureDismissedAt', () => {
  it('저장된 시각(ms)을 읽는다', () => {
    expect(parseCaptureDismissedAt('1790000000000')).toBe(1790000000000);
  });

  it("없거나 숫자가 아니면 null, 예전 값 '1'은 아주 옛날 시각으로 읽혀 만료 처리된다", () => {
    expect(parseCaptureDismissedAt(null)).toBeNull();
    expect(parseCaptureDismissedAt('')).toBeNull();
    expect(parseCaptureDismissedAt('abc')).toBeNull();
    expect(parseCaptureDismissedAt('1')).toBe(1);
  });
});
