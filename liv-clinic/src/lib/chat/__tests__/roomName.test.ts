import { describe, it, expect } from 'vitest';
import {
  anonymousRoomLabel,
  isDatedRoomName,
  legacyAsciiSlug,
  legacyRoomName,
  roomCode6,
  roomDateLabel,
  roomNameCandidates,
  ROOM_NAME_MAX,
  slugifyRoomName,
} from '../roomName';

const SESSION_ID = '11111111-2222-3333-4444-555555555555';
// 2026-10-01(목) 16:40 KST
const AT = '2026-10-01T07:40:00Z';

describe('roomDateLabel — 한국 시각의 날짜', () => {
  it('월·일을 두 자리로 맞춘다', () => {
    expect(roomDateLabel(AT)).toBe('10월01일');
    expect(roomDateLabel('2026-01-05T03:00:00Z')).toBe('01월05일');
  });
  it('UTC 15:00은 한국의 다음 날이다', () => {
    expect(roomDateLabel('2026-09-30T14:59:59Z')).toBe('09월30일');
    expect(roomDateLabel('2026-09-30T15:00:00Z')).toBe('10월01일');
  });
  it('Date 객체도 받는다', () => {
    expect(roomDateLabel(new Date(AT))).toBe('10월01일');
  });
  it('읽을 수 없는 시각이면 지금 날짜로 대신한다 (NaN 글자가 이름에 들어가지 않게)', () => {
    expect(roomDateLabel('not-a-date')).toMatch(/^\d{2}월\d{2}일$/);
  });
});

describe('slugifyRoomName — 손님 이름을 방 이름 조각으로', () => {
  it('라틴 이름은 소문자-하이픈', () => {
    expect(slugifyRoomName('Thu Nguyen')).toBe('thu-nguyen');
  });
  it('라틴 글자의 악센트를 벗긴다', () => {
    expect(slugifyRoomName('Nguyễn Thị Thu')).toBe('nguyen-thi-thu');
    expect(slugifyRoomName('José Ñandú')).toBe('jose-nandu');
  });
  it('악센트를 벗겨도 ASCII가 안 되는 라틴 글자를 바꾼다', () => {
    expect(slugifyRoomName('Đặng Thị')).toBe('dang-thi');
    expect(slugifyRoomName('Søren Æbelø')).toBe('soren-aebelo');
    expect(slugifyRoomName('Straße')).toBe('strasse');
  });
  it('기호·연속 공백을 하이픈 하나로 줄이고 앞뒤를 자른다', () => {
    expect(slugifyRoomName("  John  O'Brien!! ")).toBe('john-o-brien');
    expect(slugifyRoomName('a_b.c')).toBe('a-b-c');
  });
  it('한자·가나·한글·키릴·태국어·아랍어는 그대로 둔다', () => {
    expect(slugifyRoomName('山田 花子')).toBe('山田-花子');
    expect(slugifyRoomName('ありがとう タナカ')).toBe('ありがとう-タナカ');
    expect(slugifyRoomName('김하늘')).toBe('김하늘');
    expect(slugifyRoomName('Мария Иванова')).toBe('мария-иванова');
    expect(slugifyRoomName('สมชาย')).toBe('สมชาย');
    expect(slugifyRoomName('محمد')).toBe('محمد');
  });
  it('전각 영문·숫자와 반각 가나를 보통 글자로 바꾼다', () => {
    expect(slugifyRoomName('Ｅｍｍａ　２')).toBe('emma-2');
    expect(slugifyRoomName('ｶﾞｲ')).toBe('ガイ');
  });
  it('여러 글자가 섞여도 된다', () => {
    expect(slugifyRoomName('Emma 王')).toBe('emma-王');
  });
  it('그림 글자는 버린다. 글자가 하나도 안 남으면 빈 글자', () => {
    expect(slugifyRoomName('Emma😊')).toBe('emma');
    expect(slugifyRoomName('😊')).toBe('');
    expect(slugifyRoomName('!!!')).toBe('');
    expect(slugifyRoomName('   ')).toBe('');
  });
  it('null·빈 값은 빈 글자', () => {
    expect(slugifyRoomName(null)).toBe('');
    expect(slugifyRoomName(undefined)).toBe('');
    expect(slugifyRoomName('')).toBe('');
  });
  it('30글자에서 자르고 끝의 하이픈을 없앤다', () => {
    expect(slugifyRoomName('abcdefghij abcdefghij abcdefgh ijk')).toBe('abcdefghij-abcdefghij-abcdefgh');
    expect(slugifyRoomName('가'.repeat(40))).toBe('가'.repeat(30));
  });
  it('Slack이 거부하는 글자(대문자·공백·마침표·따옴표)가 남지 않는다', () => {
    for (const name of ['Emma Smith', "O'Brien", 'emma.smith', 'ÉMILIE', 'МАРИЯ']) {
      expect(slugifyRoomName(name)).toMatch(/^[^A-ZÉМ\s.'"]+$/);
    }
    expect(slugifyRoomName('МАРИЯ')).toBe('мария');
  });
});

describe('anonymousRoomLabel — 이름을 안 적은 손님', () => {
  it('열 개 로케일의 한국어 이름 + 손님', () => {
    expect(anonymousRoomLabel('en')).toBe('영어손님');
    expect(anonymousRoomLabel('ja')).toBe('일본어손님');
    expect(anonymousRoomLabel('zh')).toBe('중국어손님');
    expect(anonymousRoomLabel('zh-TW')).toBe('중국어번체손님');
    expect(anonymousRoomLabel('vi')).toBe('베트남어손님');
    expect(anonymousRoomLabel('th')).toBe('태국어손님');
    expect(anonymousRoomLabel('ru')).toBe('러시아어손님');
    expect(anonymousRoomLabel('fr')).toBe('프랑스어손님');
    expect(anonymousRoomLabel('mn')).toBe('몽골어손님');
    expect(anonymousRoomLabel('ar')).toBe('아랍어손님');
  });
  it('모르는 로케일은 로케일 글자 그대로', () => {
    expect(anonymousRoomLabel('xx')).toBe('xx손님');
    expect(anonymousRoomLabel('pt-BR')).toBe('pt-br손님');
  });
});

describe('roomNameCandidates — 방을 만들 때 차례로 시도할 이름', () => {
  it('날짜-이름 → -2 → -3 → -참조코드', () => {
    expect(
      roomNameCandidates({ visitorName: 'Thu Nguyen', visitorLocale: 'vi', sessionId: SESSION_ID, at: AT })
    ).toEqual([
      '10월01일-thu-nguyen',
      '10월01일-thu-nguyen-2',
      '10월01일-thu-nguyen-3',
      '10월01일-thu-nguyen-111111',
    ]);
  });
  it('이름이 없으면 언어로 부른다', () => {
    expect(roomNameCandidates({ visitorName: null, visitorLocale: 'en', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-영어손님'
    );
  });
  it('글자가 하나도 안 남는 이름도 언어로 부른다', () => {
    expect(roomNameCandidates({ visitorName: '😊', visitorLocale: 'zh-TW', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-중국어번체손님'
    );
  });
  it('한자 이름은 그대로 쓴다', () => {
    expect(roomNameCandidates({ visitorName: '山田花子', visitorLocale: 'ja', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-山田花子'
    );
  });
  it('가장 긴 이름(60자)에도 80글자를 넘지 않는다', () => {
    const names = roomNameCandidates({ visitorName: '가'.repeat(60), visitorLocale: 'en', sessionId: SESSION_ID, at: AT });
    for (const n of names) expect(Array.from(n).length).toBeLessThanOrEqual(ROOM_NAME_MAX);
  });
});

describe('예전 이름 꼴 — Slack이 새 이름을 거부할 때만 쓴다', () => {
  it('roomCode6: 세션 ID 앞 6자, 소문자', () => {
    expect(roomCode6('A1B2C3D4-0000-0000-0000-000000000000')).toBe('a1b2c3');
  });
  it('legacyAsciiSlug: ASCII만 남기고 16자', () => {
    expect(legacyAsciiSlug('Nguyễn Thị Thu')).toBe('nguyen-thi-thu');
    expect(legacyAsciiSlug('abcdefghijklmno pqrstu')).toBe('abcdefghijklmno');
    expect(legacyAsciiSlug('山田太郎')).toBe('');
    expect(legacyAsciiSlug(null)).toBe('');
  });
  it('legacyRoomName: chat-이름-참조코드6자', () => {
    expect(legacyRoomName({ visitorName: 'Thu Nguyen', visitorLocale: 'vi', sessionId: SESSION_ID })).toBe(
      'chat-thu-nguyen-111111'
    );
  });
  it('legacyRoomName: ASCII로 못 만드는 이름은 로케일로 대신한다', () => {
    expect(legacyRoomName({ visitorName: '山田', visitorLocale: 'zh-TW', sessionId: SESSION_ID })).toBe(
      'chat-zh-tw-111111'
    );
  });
});

describe('isDatedRoomName — 이미 새 꼴인 방인가', () => {
  it('NN월NN일- 로 시작하면 새 꼴', () => {
    expect(isDatedRoomName('10월01일-emma')).toBe(true);
    expect(isDatedRoomName('09월14일-영어손님-2')).toBe(true);
  });
  it('예전 꼴·빈 값은 아니다', () => {
    expect(isDatedRoomName('chat-emma-167954')).toBe(false);
    expect(isDatedRoomName('')).toBe(false);
    expect(isDatedRoomName(null)).toBe(false);
  });
});
