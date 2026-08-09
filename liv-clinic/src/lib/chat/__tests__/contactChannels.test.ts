import { describe, it, expect } from 'vitest';
import {
  CONTACT_CHANNELS,
  validateContactHandle,
  buildChatRefCode,
  shouldShowCaptureBlock,
} from '../contactChannels';

describe('contactChannels', () => {
  it('채널 목록은 whatsapp/wechat/line', () => {
    expect(CONTACT_CHANNELS).toEqual(['whatsapp', 'wechat', 'line']);
  });

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

  it('참조코드는 uuid 앞 8자 대문자', () => {
    expect(buildChatRefCode('a1b2c3d4-0000-0000-0000-000000000000')).toBe('A1B2C3D4');
  });

  it('캡처 블록은 오프시간+방문자 메시지 존재+미해제일 때만 노출', () => {
    const base = {
      businessHours: false,
      visitorMessageCount: 1,
      dismissed: false,
      saved: false,
    };
    expect(shouldShowCaptureBlock(base)).toBe(true);
    expect(shouldShowCaptureBlock({ ...base, businessHours: true })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, businessHours: null })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, visitorMessageCount: 0 })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, dismissed: true })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, saved: true })).toBe(false);
  });
});
