/**
 * chat 네임스페이스에 AI 1차 응대의 손님 화면 문구 2개를 11개 로케일에 넣는다
 * (docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md §4.10 · §7).
 *   typing          : "입력 중" 표시의 화면 읽기용 글
 *   assistantNotice : 고지 한 줄 (CHAT_AI_NOTICE=on 일 때만 보인다 — 기본 꺼짐).
 *                     손님이 "사람인가요?"라고 물었을 때 프로그램이 붙이는 문장
 *                     (src/lib/chat/ai/replyTemplates.ts 의 identity)과 같은 문장이다.
 *
 * 메시지 JSON은 줄바꿈이 섞여 있고(\r\r\n · \r\n · \n) 줄 중간에 고립된 \r 도 있어
 * 다시 직렬화하거나 정규식으로 줄을 나누면 바이트가 바뀐다. \n 만 경계로 줄을 나누고,
 * 편집 전에 라운드트립(나눈 것을 그대로 이으면 원본과 같은가)을 확인한 뒤
 * 기존 chat 키 줄(translationFailed) 바로 뒤에 새 줄만 끼워 넣는다.
 *
 * 실행 (liv-clinic 폴더에서):
 *   node scripts/_i18n-work/add-chat-ai-keys.mjs           # 미리보기 (파일을 바꾸지 않는다)
 *   node scripts/_i18n-work/add-chat-ai-keys.mjs --write   # 기록
 * 이미 들어 있는 파일은 건너뛴다(다시 돌려도 안전하다).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../../src/messages/', import.meta.url));
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const WRITE = process.argv.includes('--write');

/** 이 줄 바로 뒤에 넣는다 — chat 네임스페이스 안에 있고 11개 파일 모두 한 번씩만 나온다. */
const ANCHOR_KEY = 'translationFailed';

const KEYS = ['typing', 'assistantNotice'];

const T = {
  ko: {
    typing: '입력 중…',
    assistantNotice: '이곳에서는 자동 응대가 먼저 답하고, 예약은 모두 병원에서 확인합니다.',
  },
  en: {
    typing: 'Typing…',
    assistantNotice: 'An automated assistant answers first here, and our team confirms all bookings.',
  },
  ja: {
    typing: '入力中…',
    assistantNotice: 'こちらではまず自動応答がお答えし、ご予約はすべて当院スタッフが確認いたします。',
  },
  zh: {
    typing: '正在输入…',
    assistantNotice: '这里先由自动助手为您解答，所有预约均由本院工作人员确认。',
  },
  'zh-TW': {
    typing: '正在輸入…',
    assistantNotice: '這裡先由自動助理為您解答，所有預約皆由本院人員確認。',
  },
  vi: {
    typing: 'Đang nhập…',
    assistantNotice: 'Tại đây, trợ lý tự động sẽ trả lời trước và nhân viên của chúng tôi xác nhận mọi lịch hẹn.',
  },
  th: {
    typing: 'กำลังพิมพ์…',
    assistantNotice: 'ที่นี่ระบบตอบกลับอัตโนมัติจะตอบก่อน และทีมงานของเราจะยืนยันการจองทุกรายการ',
  },
  ru: {
    typing: 'Печатает…',
    assistantNotice: 'Здесь сначала отвечает автоматический помощник, а все записи подтверждают наши сотрудники.',
  },
  fr: {
    typing: 'Écrit…',
    assistantNotice: 'Ici, un assistant automatique répond d’abord, et notre équipe confirme toutes les réservations.',
  },
  mn: {
    typing: 'Бичиж байна…',
    assistantNotice: 'Энд эхлээд автомат туслах хариулж, бүх захиалгыг манай ажилтнууд баталгаажуулдаг.',
  },
  ar: {
    typing: 'يكتب الآن…',
    assistantNotice: 'هنا يجيب المساعد الآلي أولاً، ويؤكد فريقنا جميع الحجوزات.',
  },
};

/** \n 만 경계로 줄을 나눈다 — 각 조각은 자기 줄바꿈 바이트를 그대로 갖는다. */
function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') {
      out.push(raw.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}
const eolOf = (line) => (line.match(/\r*\n$/) || ['\n'])[0];
const indentOf = (line) => (line.match(/^[ \t]*/) || [''])[0];

// 문구 표 자체를 먼저 점검한다 — 한 언어라도 키가 빠지면 아무 파일도 건드리지 않는다.
for (const locale of LOCALES) {
  const t = T[locale];
  if (!t) throw new Error(`${locale}: 문구가 없습니다`);
  for (const key of KEYS) {
    if (typeof t[key] !== 'string' || t[key].trim() === '') throw new Error(`${locale}.${key}: 비어 있습니다`);
  }
  if (Object.keys(t).length !== KEYS.length) throw new Error(`${locale}: 키 개수가 ${KEYS.length}개가 아닙니다`);
}

let failed = 0;
for (const locale of LOCALES) {
  const file = `${DIR}${locale}.json`;
  const raw = readFileSync(file, 'utf8');
  const lines = splitLines(raw);
  if (lines.join('') !== raw) {
    console.log(`!! ${locale}: 라운드트립 실패 — 건드리지 않음`);
    failed++;
    continue;
  }
  const before = JSON.parse(raw);
  if (before.chat?.[KEYS[0]] !== undefined) {
    console.log(`-- ${locale}: 이미 있음, 건너뜀`);
    continue;
  }

  // 같은 이름의 키가 다른 네임스페이스에도 있을 수 있다 — chat 블록 안의 줄만 본다.
  const chatStart = lines.findIndex((line) => line.replace(/\r*\n$/, '') === '  "chat": {');
  const chatEnd = lines.findIndex((line, index) => index > chatStart && /^  \}/.test(line));
  const anchors = lines
    .map((line, index) =>
      index > chatStart && index < chatEnd && line.trimStart().startsWith(`"${ANCHOR_KEY}":`) ? index : -1
    )
    .filter((index) => index >= 0);
  if (chatStart < 0 || chatEnd < 0 || anchors.length !== 1 || before.chat?.[ANCHOR_KEY] === undefined) {
    console.log(`!! ${locale}: 앵커 줄을 찾지 못함 (${anchors.length}개)`);
    failed++;
    continue;
  }
  const anchor = anchors[0];
  if (!lines[anchor].replace(/\r*\n$/, '').endsWith(',')) {
    console.log(`!! ${locale}: 앵커 줄이 쉼표로 끝나지 않음`);
    failed++;
    continue;
  }

  const eol = eolOf(lines[anchor]);
  const indent = indentOf(lines[anchor]);
  const block = KEYS.map((key) => `${indent}${JSON.stringify(key)}: ${JSON.stringify(T[locale][key])},${eol}`);
  lines.splice(anchor + 1, 0, ...block);
  const out = lines.join('');

  let after;
  try {
    after = JSON.parse(out);
  } catch (err) {
    console.log(`!! ${locale}: JSON 깨짐 ${err.message}`);
    failed++;
    continue;
  }
  const valuesOk = KEYS.every((key) => after.chat[key] === T[locale][key]);
  const othersOk = Object.keys(before.chat).every((key) => after.chat[key] === before.chat[key]);
  const sizeOk = out.length === raw.length + block.join('').length;
  if (!valuesOk || !othersOk || !sizeOk) {
    console.log(`!! ${locale}: 삽입 결과 검증 실패`);
    failed++;
    continue;
  }

  console.log(`${WRITE ? '기록' : '미리보기'} ${locale} (+${block.length}줄, chat 키 ${Object.keys(after.chat).length}개)`);
  if (WRITE) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
if (failed) process.exitCode = 1;
