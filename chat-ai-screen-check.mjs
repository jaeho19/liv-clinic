// 라이브채팅 "AI 1차 응대" 손님 화면 확인 스크립트 (스펙 2026-10-02 chat-ai-first-response §4.10).
//
// 로컬에서 빌드한 사이트(next start)를 열어 "입력 중" 표시 · 온라인 표시 · 시간 외 안내 · 고지 한 줄 ·
// 새 글 스크롤 · 연락처 카드를 확인한다.
// 운영 DB·Slack·OpenAI 에 아무것도 닿지 않도록 /api/chat/* 요청과 실시간 연결(WebSocket)은 전부 이 스크립트가
// 가짜로 대신한다(서버의 채팅 라우트는 한 번도 호출되지 않는다). 분석 스크립트(GA·네이버)도 막는다.
//
// 사용: node chat-ai-screen-check.mjs [baseUrl=http://localhost:3010] [shotDir=screenshots/chat-ai-first-response]
// 종료코드: 0 전부 통과 / 1 실패 있음 / 3 실행 환경 없음
//
// 의존: playwright MCP 가 받아 둔 npx 캐시의 playwright-core + ms-playwright chromium (프로젝트 node_modules 불필요)

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const HOME = process.env.USERPROFILE || process.env.HOME;
const PW_CORE = path.join(HOME, 'AppData/Local/npm-cache/_npx/db89d7302a373f10/node_modules/playwright-core');
const CHROME = path.join(HOME, 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe');
if (!existsSync(PW_CORE) || !existsSync(CHROME)) {
  console.error('playwright-core 또는 chromium 경로가 없습니다:', PW_CORE, CHROME);
  process.exit(3);
}
const { chromium } = require(PW_CORE);

const base = (process.argv[2] || 'http://localhost:3010').replace(/\/$/, '');
const shotDir = process.argv[3] || 'screenshots/chat-ai-first-response';
mkdirSync(shotDir, { recursive: true });

const SID = 'a1b2c3d4-0000-4000-8000-000000000000';
const TOKEN = '11111111-2222-4333-8444-555555555555';
const NOTICE_EN = 'An automated assistant answers first here, and our team confirms all bookings.';
const OFF_HOURS_EN = "We're outside business hours";
const ONLINE_EN = "We're online";
const OFFLINE_EN = "We'll reply soon";

const PRICE_REPLY = [
  'Thermage FLX is priced by the number of shots.',
  '• Thermage Laser · 600 shots: from KRW 2,400,000 (KRW 2,640,000 incl. VAT)',
  "• Thermage FLX 600 shots + ONDA Lifting 30kJ + LDM care (this month's promotion, until Oct 31): KRW 2,200,000 (KRW 2,420,000 incl. VAT)",
  'The amounts above are approximate, not final.',
  'If you book directly through this chat and pay at your visit, a 5% discount applies.',
  'Which date would you like to visit, and how can we reach you — WhatsApp, WeChat, LINE or email?',
].join('\n');
const BOOKING_REPLY = [
  'Thank you, Emma. We have noted your request.',
  '',
  'Tentative booking (not yet confirmed)',
  '• Date: Wed, Oct 14, 2026 · 14:00 (Korea time)',
  '• Treatment: Thermage FLX',
  '• Guests: 2',
  '• Name: Emma',
  '• Contact: WhatsApp +65 9123 4567',
  'We will send your booking confirmation on the morning of Tue, Oct 6 (Korea time) via WhatsApp.',
].join('\n');

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/**
 * 실시간 연결(Supabase Realtime, Phoenix 프로토콜 1.0.0)을 가짜로 대신한다 — 운영 서버에 연결하지 않는다.
 * 돌려주는 broadcast() 로 "새 글이 왔다"는 알림을 화면에 보낸다(서버의 broadcastToSession 과 같은 꼴).
 */
async function mockRealtime(page) {
  const sockets = new Set();
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, (ws) => {
    sockets.add(ws);
    ws.onMessage((raw) => {
      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      const reply = (topic, response) =>
        ws.send(JSON.stringify({ topic, event: 'phx_reply', payload: { status: 'ok', response }, ref: msg.ref }));
      if (msg.event === 'phx_join') reply(msg.topic, { postgres_changes: [] });
      else if (msg.event === 'heartbeat') reply('phoenix', {});
      else if (msg.event === 'phx_leave') reply(msg.topic, {});
    });
    ws.onClose(() => sockets.delete(ws));
  });
  return {
    broadcast(payload) {
      for (const ws of sockets) {
        ws.send(
          JSON.stringify({
            topic: `realtime:chat:${SID}`,
            event: 'broadcast',
            payload: { type: 'broadcast', event: 'message_created', payload },
            ref: null,
          })
        );
      }
    },
  };
}

/**
 * /api/chat/* 를 가짜로 대신한다.
 *   presenceAi / sessionAi : 서버가 주는 { instantReply, assistantNotice }. null 이면 그 칸 자체를 넣지 않는다(옛 서버의 응답 꼴).
 *   businessHours          : 상담 시간 중인가
 */
async function mockChatApi(page, { locale, businessHours, presenceAi, sessionAi }) {
  const state = { messages: [], hasContact: false, sessionAi, sessionInfoCalls: 0 };
  const iso = () => new Date().toISOString();
  state.messages.push({
    id: 'sys-1',
    session_id: SID,
    sender: 'system',
    original_text: 'Hello! How can we help you today?',
    original_lang: locale,
    translated_text: null,
    translated_lang: null,
    translation_status: 'skipped',
    translation_error: null,
    source: null,
    created_at: new Date(Date.now() - 5000).toISOString(),
  });

  await page.route(/google-analytics|googletagmanager|wcs\.naver|analytics\.google/, (r) => r.abort());
  await page.route('**/api/chat/presence', (r) =>
    r.fulfill({
      json: {
        online: businessHours,
        operatorCount: 0,
        businessHours,
        nextOpenAt: businessHours ? null : '2026-10-05T01:00:00.000Z',
        schedule: {},
        source: 'businessHours',
        ...(presenceAi ?? {}),
      },
    })
  );
  await page.route('**/api/chat/sessions**', (r) => {
    if (r.request().method() === 'POST') {
      return r.fulfill({
        status: 201,
        json: {
          sessionId: SID,
          sessionToken: TOKEN,
          visitorLocale: locale,
          status: 'open',
          createdAt: iso(),
          businessHours,
          operatorOnline: businessHours,
          ...(state.sessionAi ?? {}),
        },
      });
    }
    state.sessionInfoCalls += 1;
    return r.fulfill({
      json: {
        session: { id: SID, visitor_locale: locale, status: 'open' },
        hasContact: state.hasContact,
        ...(state.sessionAi ?? {}),
      },
    });
  });
  await page.route('**/api/chat/messages**', (r) => {
    const req = r.request();
    if (req.method() === 'GET') {
      const since = new URL(req.url()).searchParams.get('since');
      return r.fulfill({ json: { messages: state.messages.filter((m) => !since || m.created_at > since) } });
    }
    const { text } = req.postDataJSON();
    const visitor = {
      id: `v-${state.messages.length}`,
      session_id: SID,
      sender: 'visitor',
      original_text: text,
      original_lang: locale,
      translated_text: '(한국어 번역)',
      translated_lang: 'ko',
      translation_status: 'success',
      translation_error: null,
      created_at: iso(),
      source: 'app',
    };
    state.messages.push(visitor);
    const body = { message: visitor, contact: { saved: false, hasContact: state.hasContact } };
    // AI가 먼저 답하는 대화에서, 글자·숫자·물음표가 있는 글에만 답이 온다 (서버의 hasSubstance 와 같은 판정)
    if (state.sessionAi) body.instantReply = Boolean(state.sessionAi.instantReply) && /[\p{L}\p{N}?？]/u.test(text);
    return r.fulfill({ status: 201, json: body });
  });
  await page.route('**/api/chat/contact', (r) => r.fulfill({ status: 201, json: { ok: true, hasContact: true } }));
  return state;
}

/** AI의 답이 도착한다 — 손님 화면으로 가는 응답에서는 출처가 'auto' 다(서버가 'ai' 를 바꿔 보낸다). */
function deliverReply(state, rt, text, { saveContact = false, locale = 'en' } = {}) {
  const id = `ai-${state.messages.length}`;
  state.messages.push({
    id,
    session_id: SID,
    sender: 'operator',
    original_text: text,
    original_lang: 'ko',
    translated_text: text,
    translated_lang: locale,
    translation_status: 'success',
    translation_error: null,
    created_at: new Date().toISOString(),
    source: 'auto',
  });
  if (saveContact) state.hasContact = true;
  rt.broadcast({ messageId: id, sender: 'operator' });
}

const panelOf = (page) => page.locator('div[role="dialog"]').filter({ has: page.locator('form') });
const bodyOf = (page) => panelOf(page).locator('div[aria-live="polite"]');
const cardOf = (page) => panelOf(page).locator('div.relative.my-2');
const typingOf = (page, label = 'Typing…') => panelOf(page).locator(`[role="status"][aria-label="${label}"]`);

async function openPage(context, locale, opts) {
  const page = await context.newPage();
  const rt = await mockRealtime(page);
  const state = await mockChatApi(page, { locale, ...opts });
  await page.goto(`${base}/${locale}`, { waitUntil: 'load' });
  // 이벤트 팝업이 떠 있으면 닫는다 (채팅 단추를 가릴 수 있다)
  const popupClose = page.locator('.z-\\[9999\\] .pointer-events-auto > button').first();
  try {
    await popupClose.waitFor({ timeout: 4000 });
    await popupClose.click();
  } catch {
    // 팝업 없음
  }
  await page.locator('.chat-launcher').click();
  await panelOf(page).waitFor();
  // presence 응답이 반영될 때까지 잠깐 기다린다
  await page.waitForTimeout(600);
  return { page, state, rt };
}

async function startChat(page) {
  const panel = panelOf(page);
  await panel.locator('form button[type="submit"]').click(); // Start Chat
  await panel.locator('textarea').waitFor();
  await page.waitForTimeout(500); // 세션 정보 조회
}

async function send(page, text) {
  const panel = panelOf(page);
  // 입력창이 든 폼만 본다 — 연락처 카드에도 폼(연락처 저장)이 있다
  const composer = panel.locator('form').filter({ has: page.locator('textarea') });
  await composer.locator('textarea').fill(text);
  await composer.locator('button[type="submit"]').click();
  await panel.getByText(text, { exact: true }).first().waitFor({ timeout: 5000 });
}

/** 스크롤 영역 안에서 그 글의 머리가 보이는가 (영역 위쪽에서의 거리, 영역 높이) */
async function topInBody(page, snippet) {
  return page.evaluate((needle) => {
    const body = document.querySelector('div[role="dialog"] div[aria-live="polite"]');
    const bubble = [...body.querySelectorAll('div.rounded-2xl')].find((el) => el.textContent.includes(needle));
    if (!bubble) return null;
    return { top: Math.round(bubble.getBoundingClientRect().top - body.getBoundingClientRect().top), height: body.clientHeight };
  }, snippet);
}

const MOBILE = { viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true };
const AI_ON = { instantReply: true, assistantNotice: false };

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  // ── 1. AI가 먼저 답하는 대화 · 상담 시간 밖 ────────────────────────────────
  {
    const context = await browser.newContext(MOBILE);
    const { page, state, rt } = await openPage(context, 'en', { businessHours: false, presenceAi: AI_ON, sessionAi: AI_ON });
    const panel = panelOf(page);
    check('시작 화면: 상담 시간 밖이어도 머리말이 "온라인"이다', (await panel.innerText()).includes(ONLINE_EN));
    check('시작 화면: 고지 한 줄은 없다(기본 꺼짐)', !(await panel.innerText()).includes(NOTICE_EN));

    await startChat(page);
    check('대화: 노란 시간 외 안내가 없다', !(await bodyOf(page).innerText()).includes(OFF_HOURS_EN));
    check('대화: 머리말이 "온라인"이다', (await panel.innerText()).includes(ONLINE_EN));

    await send(page, 'How much is Thermage?');
    await typingOf(page).waitFor({ timeout: 5000 });
    check('글을 보내면 "입력 중" 표시가 뜬다', await typingOf(page).isVisible());
    const order = await page.evaluate(() => {
      const body = document.querySelector('div[role="dialog"] div[aria-live="polite"]');
      const mine = [...body.querySelectorAll('div.rounded-2xl')].find((el) => el.textContent.includes('How much is Thermage?'));
      const typing = body.querySelector('[role="status"][aria-label]');
      return mine.getBoundingClientRect().bottom <= typing.getBoundingClientRect().top;
    });
    check('"입력 중"은 손님 글 바로 아래에 있다', order);
    await page.screenshot({ path: path.join(shotDir, 'en-1-typing.png') });

    const callsBefore = state.sessionInfoCalls;
    deliverReply(state, rt, PRICE_REPLY);
    await panel.getByText('Thermage FLX is priced by the number of shots.').waitFor({ timeout: 5000 });
    check('답이 도착하면 "입력 중"이 사라진다', (await typingOf(page).count()) === 0);
    await page.waitForTimeout(600);
    check('답이 도착하면 세션 정보를 다시 읽는다', state.sessionInfoCalls > callsBefore, `${callsBefore} → ${state.sessionInfoCalls}`);

    const card = cardOf(page);
    await card.waitFor({ timeout: 5000 });
    check('연락처가 없으면 답 아래에 연락처 카드가 뜬다', await card.isVisible());
    check('카드의 안내 줄은 평소 문구다("지금은 상담 시간이 아닙니다"가 아니다)', (await card.innerText()).includes("You don't have to wait here."));
    await page.waitForTimeout(300);
    const pos = await topInBody(page, 'Thermage FLX is priced by the number of shots.');
    check('카드가 떠 있어도 새 답의 머리가 화면 안에 보인다', Boolean(pos && pos.top >= 0 && pos.top < pos.height), pos ? `위에서 ${pos.top}px / 높이 ${pos.height}px` : '답을 찾지 못함');
    await page.screenshot({ path: path.join(shotDir, 'en-2-reply-card.png') });

    // 연락처를 준 글 → AI가 가예약 요약으로 답하고 연락처를 저장한다 → 카드가 닫힌다
    await send(page, 'Oct 14 at 2pm, 2 people. My WhatsApp is +65 9123 4567. Emma');
    await typingOf(page).waitFor({ timeout: 5000 });
    deliverReply(state, rt, BOOKING_REPLY, { saveContact: true });
    await panel.getByText('Tentative booking (not yet confirmed)').waitFor({ timeout: 5000 });
    await card.waitFor({ state: 'detached', timeout: 5000 });
    check('AI가 연락처를 저장하면 카드가 닫힌다(다시 열지 않아도)', (await cardOf(page).count()) === 0);
    check('가예약 요약이 줄바꿈 그대로 보인다', (await bodyOf(page).innerText()).includes('• Guests: 2\n• Name: Emma'));
    await page.waitForTimeout(300);
    const pos2 = await topInBody(page, 'Tentative booking (not yet confirmed)');
    check('가예약 요약이 든 답의 머리가 화면 안에 보인다', Boolean(pos2 && pos2.top >= 0 && pos2.top < pos2.height), pos2 ? `위에서 ${pos2.top}px` : '답을 찾지 못함');
    await page.screenshot({ path: path.join(shotDir, 'en-3-booking.png') });

    // 이모지뿐인 글에는 답이 오지 않는다 → "입력 중"을 켜지 않는다
    await send(page, '🙏');
    await page.waitForTimeout(800);
    check('이모지뿐인 글에는 "입력 중"이 뜨지 않는다', (await typingOf(page).count()) === 0);

    // 질문 뒤에 이모지를 덧붙여도, 앞 글의 답이 오는 중이므로 "입력 중"이 유지된다
    await send(page, 'Is parking available?');
    await typingOf(page).waitFor({ timeout: 5000 });
    await send(page, '👍');
    await page.waitForTimeout(600);
    check('질문 뒤에 이모지를 보내도 "입력 중"이 유지된다', await typingOf(page).isVisible());
    deliverReply(state, rt, 'Yes — there is free parking for 2 hours in the basement of our building.');
    await panel.getByText('Yes — there is free parking').waitFor({ timeout: 5000 });
    check('앞 글의 답이 도착하면 "입력 중"이 사라진다', (await typingOf(page).count()) === 0);
    await context.close();
  }

  // ── 2. 직원이 맡은 대화 · 상담 시간 밖 → 지금 방식 그대로 ────────────────────
  {
    const context = await browser.newContext(MOBILE);
    const { page } = await openPage(context, 'en', {
      businessHours: false,
      presenceAi: AI_ON,
      sessionAi: { instantReply: false, assistantNotice: false },
    });
    const panel = panelOf(page);
    await startChat(page);
    check('직원이 맡은 대화: 머리말이 지금처럼 "곧 답변"이다', (await panel.innerText()).includes(OFFLINE_EN) && !(await panel.innerText()).includes(ONLINE_EN));
    check('직원이 맡은 대화: 노란 시간 외 안내가 보인다', (await bodyOf(page).innerText()).includes(OFF_HOURS_EN));
    await send(page, 'Can I change my booking to Friday?');
    await page.waitForTimeout(800);
    check('직원이 맡은 대화: "입력 중"이 뜨지 않는다', (await typingOf(page).count()) === 0);
    const card = cardOf(page);
    await card.waitFor({ timeout: 5000 });
    check('직원이 맡은 대화: 카드에 복귀 시각 안내(한국 시각)', (await card.innerText()).includes('(Korea time)'));
    await page.screenshot({ path: path.join(shotDir, 'en-4-staff-engaged.png') });
    await context.close();
  }

  // ── 3. 고지 한 줄을 켰을 때 (CHAT_AI_NOTICE=on) ─────────────────────────────
  {
    const notice = { instantReply: true, assistantNotice: true };
    const context = await browser.newContext(MOBILE);
    const { page } = await openPage(context, 'en', { businessHours: true, presenceAi: notice, sessionAi: notice });
    const panel = panelOf(page);
    check('고지: 채팅 시작 화면에 한 줄이 보인다', (await panel.innerText()).includes(NOTICE_EN));
    await page.screenshot({ path: path.join(shotDir, 'en-5-notice-start.png') });
    await startChat(page);
    const body = await bodyOf(page).innerText();
    check('고지: 대화 맨 위에 한 줄이 보인다', body.trimStart().startsWith(NOTICE_EN), body.slice(0, 60).replace(/\n/g, ' / '));
    await page.screenshot({ path: path.join(shotDir, 'en-6-notice-chat.png') });
    await context.close();
  }

  // ── 4. AI가 꺼져 있을 때 (옛 서버의 응답 꼴 — 새 칸이 없다) → 지금과 똑같다 ───────
  {
    const context = await browser.newContext(MOBILE);
    const { page } = await openPage(context, 'en', { businessHours: false, presenceAi: null, sessionAi: null });
    const panel = panelOf(page);
    check('꺼짐: 시작 화면의 머리말이 지금처럼 "곧 답변"이다', (await panel.innerText()).includes(OFFLINE_EN));
    check('꺼짐: 고지 한 줄이 없다', !(await panel.innerText()).includes(NOTICE_EN));
    await startChat(page);
    check('꺼짐: 노란 시간 외 안내가 보인다', (await bodyOf(page).innerText()).includes(OFF_HOURS_EN));
    await send(page, 'How much is Thermage?');
    await page.waitForTimeout(800);
    check('꺼짐: "입력 중"이 뜨지 않는다', (await typingOf(page).count()) === 0);
    await context.close();
  }

  // ── 5. 답이 오지 않으면 30초 뒤에 "입력 중"을 지운다 ─────────────────────────
  {
    const context = await browser.newContext(MOBILE);
    const { page } = await openPage(context, 'en', { businessHours: true, presenceAi: AI_ON, sessionAi: AI_ON });
    await startChat(page);
    await send(page, 'Hello');
    await typingOf(page).waitFor({ timeout: 5000 });
    await page.waitForTimeout(25_000);
    const at25 = await typingOf(page).count();
    await page.waitForTimeout(7_000);
    check('답이 없으면 30초 뒤에 "입력 중"이 사라진다', at25 === 1 && (await typingOf(page).count()) === 0, `25초 ${at25}개 → 32초 ${await typingOf(page).count()}개`);
    await context.close();
  }

  // ── 6. 다른 언어: 읽기용 글과 방향 ──────────────────────────────────────────
  for (const [locale, label, text] of [
    ['zh', '正在输入…', '热玛吉多少钱？'],
    ['ar', 'يكتب الآن…', 'كم سعر الثيرماج؟'],
  ]) {
    const context = await browser.newContext(MOBILE);
    const { page } = await openPage(context, locale, { businessHours: true, presenceAi: AI_ON, sessionAi: AI_ON });
    await startChat(page);
    await send(page, text);
    const typing = typingOf(page, label);
    await typing.waitFor({ timeout: 5000 });
    check(`${locale}: "입력 중"의 읽기용 글이 그 언어다 (${label})`, await typing.isVisible());
    if (locale === 'ar') {
      const side = await page.evaluate(() => {
        const body = document.querySelector('div[role="dialog"] div[aria-live="polite"]');
        const t = body.querySelector('[role="status"][aria-label]').getBoundingClientRect();
        const b = body.getBoundingClientRect();
        return { fromRight: Math.round(b.right - t.right), fromLeft: Math.round(t.left - b.left) };
      });
      check('ar: "입력 중"이 오른쪽(글이 시작하는 쪽)에 붙는다', side.fromRight < side.fromLeft, `오른쪽 ${side.fromRight}px · 왼쪽 ${side.fromLeft}px`);
    }
    await page.screenshot({ path: path.join(shotDir, `${locale}-typing.png`) });
    await context.close();
  }
} catch (e) {
  check('스크립트가 끝까지 돌았다', false, e instanceof Error ? e.message.split('\n')[0] : String(e));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 통과 · 화면 사진: ${shotDir}`);
process.exit(failed ? 1 : 0);
