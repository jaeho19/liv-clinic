// 라이브채팅 "연락처 먼저" 손님 화면 확인 스크립트 (스펙 2026-10-01 §4.2·§4.10).
//
// 로컬에서 빌드한 사이트(next start)를 열어 연락처 카드·말풍선 링크·오른쪽 단추 아이콘을 확인한다.
// 운영 DB·Slack 에 아무것도 쓰지 않도록 /api/chat/* 요청은 전부 이 스크립트가 가짜 응답으로 대신한다
// (서버의 채팅 라우트는 한 번도 호출되지 않는다). 분석 스크립트(GA·네이버)도 막는다.
//
// 사용: node chat-contact-card-check.mjs [baseUrl=http://localhost:3010] [shotDir=screenshots/chat-contact-first]
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
const shotDir = process.argv[3] || 'screenshots/chat-contact-first';
mkdirSync(shotDir, { recursive: true });

const SID = 'a1b2c3d4-0000-4000-8000-000000000000';
const TOKEN = '11111111-2222-4333-8444-555555555555';
const PROMO_URL = (locale) => `https://liv-clinic.net/${locale}/events/2026-10-promotion`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** /api/chat/* 를 가짜로 대신한다. 서버가 하는 일(접수 안내·이벤트 안내·연락처 저장)을 흉내 낸다. */
async function mockChatApi(page, { locale, businessHours }) {
  const state = { messages: [], hasContact: false, contactPosts: [] };
  const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
  const push = (m) =>
    state.messages.push({
      session_id: SID,
      original_lang: 'ko',
      translated_text: null,
      translated_lang: null,
      translation_status: 'success',
      translation_error: null,
      source: 'app',
      ...m,
    });
  push({ id: 'sys-1', sender: 'system', original_text: 'Hello! How can we help you today?', original_lang: locale, translation_status: 'skipped', created_at: iso(-5000) });

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
      },
    })
  );
  await page.route('**/api/chat/sessions**', (r) => {
    if (r.request().method() === 'POST') {
      return r.fulfill({
        status: 201,
        json: { sessionId: SID, sessionToken: TOKEN, visitorLocale: locale, status: 'open', createdAt: iso(), businessHours, operatorOnline: businessHours },
      });
    }
    return r.fulfill({ json: { session: { id: SID, visitor_locale: locale, status: 'open' }, hasContact: state.hasContact } });
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
    push({
      id: `a-${state.messages.length}`,
      sender: 'operator',
      source: 'auto',
      original_text: '안녕하세요, 리브성형외과입니다. 메시지 잘 받았습니다.',
      translated_text: "Hello, this is LIV Plastic Surgery. We've received your message.",
      translated_lang: locale,
      created_at: iso(5),
    });
    if (/price|how much/i.test(text)) {
      push({
        id: `h-${state.messages.length}`,
        sender: 'operator',
        source: 'auto',
        original_text: `가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다.\n${PROMO_URL(locale)}`,
        translated_text: `Our consultants will confirm the exact price and get back to you. You can see this month's promotion here:\n${PROMO_URL(locale)}`,
        translated_lang: locale,
        created_at: iso(10),
      });
    }
    const saved = /@/.test(text);
    if (saved) state.hasContact = true;
    return r.fulfill({ status: 201, json: { message: visitor, contact: { saved, hasContact: state.hasContact } } });
  });
  await page.route('**/api/chat/contact', (r) => {
    const body = r.request().postDataJSON();
    state.contactPosts.push(body);
    if (body.kind === 'click') return r.fulfill({ json: { ok: true } });
    state.hasContact = true;
    return r.fulfill({ status: 201, json: { ok: true, hasContact: true } });
  });
  return state;
}

const panelOf = (page) => page.locator('div[role="dialog"]').filter({ has: page.locator('form') });
const cardOf = (page) => panelOf(page).locator('div.relative.my-2');
const tilesOf = (page) => cardOf(page).locator('[role="group"] > *');

async function openPage(context, locale, opts) {
  const page = await context.newPage();
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
  return { page, state };
}

/** 채팅을 시작하고 첫 글을 보낸다. */
async function startAndSend(page, text) {
  await page.locator('.chat-launcher').click();
  const panel = panelOf(page);
  await panel.locator('form button[type="submit"]').click(); // Start Chat
  await panel.locator('textarea').waitFor();
  await panel.locator('textarea').fill(text);
  await panel.locator('form button[type="submit"]').click();
}

/** 패널을 닫았다 다시 연다 — 가짜 환경에는 실시간 알림이 없으므로, 이렇게 해야 자동 안내를 다시 불러온다. */
async function reopen(page) {
  await page.keyboard.press('Escape');
  await page.locator('.chat-launcher').click();
  await panelOf(page).locator('textarea').waitFor();
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  // ── 1. 영어 화면 · 영업시간 중 ──────────────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true, permissions: ['clipboard-read', 'clipboard-write'] });
    const { page, state } = await openPage(context, 'en', { businessHours: true });
    await startAndSend(page, 'How much is Ulthera?');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    check('영어: 글을 보내면 영업시간 중에도 카드가 뜬다', await card.isVisible());
    check(
      '영어: 단추 순서 WhatsApp·WeChat·LINE·Email',
      JSON.stringify(await tilesOf(page).locator('span').allInnerTexts()) === JSON.stringify(['WhatsApp', 'WeChat', 'LINE', 'Email'])
    );
    check('영어: 영업 중 안내 문구', (await card.innerText()).includes("You don't have to wait here."));
    check('영어: 처음에는 WeChat QR 이 접혀 있다', (await card.locator('img[alt="WeChat QR"]').count()) === 0);
    const waHref = await tilesOf(page).nth(0).getAttribute('href');
    check('영어: WhatsApp 단추는 병원 번호 + 코드가 든 인사말', Boolean(waHref?.startsWith('https://wa.me/821068882773?text=') && waHref.includes('A1B2C3D4')));
    check('영어: LINE 단추는 친구 추가 링크', (await tilesOf(page).nth(2).getAttribute('href')) === 'https://line.me/ti/p/VJYu9BSnsX');
    await page.screenshot({ path: path.join(shotDir, 'en-1-card.png') });

    await tilesOf(page).nth(1).click(); // WeChat
    await card.locator('img[alt="WeChat QR"]').waitFor();
    check('영어: WeChat 단추를 누르면 QR·아이디가 펼쳐진다', (await card.innerText()).includes('livps0414'));
    check('영어: 펼친 것만으로는 직원에게 알리지 않는다', state.contactPosts.length === 0);
    await card.getByRole('button', { name: 'Copy' }).click();
    await card.getByRole('button', { name: 'Copied ✓' }).waitFor({ timeout: 3000 });
    check('영어: 아이디 복사 → 클립보드에 livps0414', (await page.evaluate(() => navigator.clipboard.readText())) === 'livps0414');
    await page.waitForTimeout(300);
    check('영어: 복사하면 직원에게 알린다 (click · wechat)', JSON.stringify(state.contactPosts) === JSON.stringify([{ sessionToken: TOKEN, channel: 'wechat', kind: 'click' }]));
    await card.getByRole('button', { name: 'Copied ✓' }).click();
    await page.waitForTimeout(300);
    check('영어: 같은 단추를 다시 눌러도 한 번만 알린다', state.contactPosts.length === 1);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shotDir, 'en-2-wechat.png') });

    await tilesOf(page).nth(3).click(); // Email
    const mail = card.locator('a[href^="mailto:"]');
    await mail.waitFor();
    check('영어: 이메일 단추를 누르면 병원 주소가 펼쳐지고 WeChat 블록은 접힌다', (await mail.innerText()) === 'jaeho19@gmail.com' && (await card.locator('img[alt="WeChat QR"]').count()) === 0);
    check(
      '영어: 펼친 단추만 눌린 모양이다 (Email 펼침, WeChat 접힘)',
      (await tilesOf(page).nth(3).getAttribute('aria-expanded')) === 'true' && (await tilesOf(page).nth(1).getAttribute('aria-expanded')) === 'false'
    );
    await page.waitForTimeout(400);
    const mailHref = await mail.getAttribute('href');
    check('영어: 메일 제목에 코드가 들어간다', Boolean(mailHref?.includes(encodeURIComponent('LIV Plastic Surgery #A1B2C3D4'))));
    await page.screenshot({ path: path.join(shotDir, 'en-3-email.png') });

    // 연락처 남기기: Email 칩 → 저장 → 카드가 사라진다
    await card.getByRole('radio', { name: 'Email' }).click();
    await card.locator('input').fill('guest@example.com');
    await card.getByRole('button', { name: 'Save contact' }).click();
    await card.waitFor({ state: 'detached', timeout: 5000 });
    check('영어: 이메일을 저장하면 카드가 사라진다', (await cardOf(page).count()) === 0);
    const saved = state.contactPosts.find((p) => p.kind === 'save');
    check('영어: 저장 요청은 channel=email', saved?.channel === 'email' && saved?.handle === 'guest@example.com');

    // 자동 안내·이벤트 안내 말풍선 (다시 불러오기)
    await reopen(page);
    const link = panelOf(page).locator(`a[href="${PROMO_URL('en')}"]`);
    await link.waitFor({ timeout: 5000 });
    check('영어: 이벤트 안내의 주소는 새 창으로 여는 링크다', (await link.getAttribute('target')) === '_blank' && (await link.getAttribute('rel')) === 'noopener noreferrer');
    check('영어: 연락처가 있으면 다시 열어도 카드가 없다', (await cardOf(page).count()) === 0);
    await page.screenshot({ path: path.join(shotDir, 'en-4-bubbles.png') });
    await context.close();
  }

  // ── 2. 영어 화면 · 상담 시간 외 + ✕ 닫기 ─────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, 'en', { businessHours: false });
    await startAndSend(page, 'Hello, I want to book next week');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    check('상담 시간 외: 복귀 시각 안내(한국 시각)', (await card.innerText()).includes('(Korea time)'));
    await page.screenshot({ path: path.join(shotDir, 'en-5-offhours.png') });
    await card.getByRole('button', { name: 'Dismiss' }).click();
    check('✕ 를 누르면 카드가 사라진다', (await cardOf(page).count()) === 0);
    const stored = await page.evaluate((sid) => window.localStorage.getItem(`liv-chat-capture-dismissed:${sid}`), SID);
    check('닫은 시각을 기억한다 (12시간용)', Number(stored) > 1_700_000_000_000);
    await reopen(page);
    await page.waitForTimeout(800);
    check('닫은 뒤 다시 열어도 12시간 안에는 뜨지 않는다', (await cardOf(page).count()) === 0);
    await context.close();
  }

  // ── 3. 중국어·일본어 화면 ────────────────────────────────────────────────
  for (const [locale, firstTile, defaultChip] of [
    ['zh', 'WeChat', 'WeChat'],
    ['ja', 'LINE', 'Email'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, locale, { businessHours: true });
    await startAndSend(page, locale === 'zh' ? '超声刀多少钱？' : 'ウルセラの料金を教えてください');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    const labels = await tilesOf(page).locator('span').allInnerTexts();
    check(`${locale}: 맨 앞 단추는 ${firstTile}, 맨 뒤는 Email`, labels[0] === firstTile && labels[3] === 'Email', labels.join(' · '));
    const checkedChip = await card.locator('[role="radio"][aria-checked="true"]').innerText();
    check(`${locale}: 연락처 남기기의 기본 선택은 ${defaultChip}`, checkedChip.trim() === defaultChip);
    const qrShown = (await card.locator('img[alt="WeChat QR"]').count()) === 1;
    check(`${locale}: WeChat QR ${locale === 'zh' ? '이 펼쳐져 있다' : '은 접혀 있다'}`, locale === 'zh' ? qrShown : !qrShown);
    check(`${locale}: 칩에 LINE 이 없다`, !(await card.locator('[role="radio"]').allInnerTexts()).some((t) => t.includes('LINE')));
    await page.screenshot({ path: path.join(shotDir, `${locale}-card.png`) });
    if (locale === 'zh') {
      await card.locator('button[aria-label="WeChat QR"]').click();
      const modal = page.locator('div[role="dialog"][aria-label="WeChat QR"]');
      await modal.waitFor();
      check('zh: QR 을 누르면 크게 보기가 뜬다', await modal.isVisible());
      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'detached' });
      check('zh: 크게 보기를 닫아도 카드는 그대로다', await card.isVisible());
    }
    await context.close();
  }

  // ── 4. 사이트 오른쪽 단추(데스크톱)의 아이콘이 그대로인가 ───────────────────
  {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, 'ja', { businessHours: true });
    await page.waitForTimeout(1500); // 단추가 나타나는 애니메이션(scale 0.8 → 1)이 끝나기를 기다린다
    const lineD = await page.locator('a[data-analytics-contact="line"] svg path').getAttribute('d');
    const waD = await page.locator('a[data-analytics-contact="whatsapp"] svg path').getAttribute('d');
    check('오른쪽 LINE 단추 아이콘', Boolean(lineD?.startsWith('M19.365 9.863') && lineD.length === 1066));
    check('오른쪽 WhatsApp 단추 아이콘', Boolean(waD?.startsWith('M17.472 14.382') && waD.length === 1104));
    const box = await page.locator('a[data-analytics-contact="line"]').boundingBox();
    check('오른쪽 단추 크기 48×48', Boolean(box && Math.round(box.width) === 48 && Math.round(box.height) === 48), box ? `${box.width}×${box.height}` : '없음');
    await page.locator('.social-contact-links').screenshot({ path: path.join(shotDir, 'floating-cta.png') });
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
