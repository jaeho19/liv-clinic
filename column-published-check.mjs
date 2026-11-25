// 칼럼 공개 상태 점검: 서버가 그린 HTML에서 저자 줄·구조화 데이터·공유 메타·사이트맵·llms.txt 를 확인한다.
// 사용: node column-published-check.mjs <slug> [기준 주소=http://localhost:3010]
const [slug, base = 'http://localhost:3010'] = process.argv.slice(2);
// 아직 초안인 칼럼(status: draft) — 허브·사이트맵에 나오면 안 된다
const { readdirSync, readFileSync } = await import('node:fs');
const KO = new URL('./liv-clinic/content/guides/ko/', import.meta.url);
const drafts = readdirSync(KO).filter((n) => n.endsWith('.md') && /^status:s*draft/m.test(readFileSync(new URL(n, KO), 'utf8'))).map((n) => n.slice(0, -3));
const get = async (p) => {
  const r = await fetch(base + p);
  return { status: r.status, text: await r.text() };
};
const results = [];
const check = (name, ok, detail = '') => results.push({ ok, name, detail });

const page = await get(`/ko/guides/${slug}`);
check('글 페이지 200', page.status === 200, String(page.status));
const html = page.text;

// 화면 글자
// 글 머리 = <article> 안의 첫 <header>(사이트 상단 메뉴의 </header> 가 앞에 있으므로 article 뒤에서 찾는다)
const articleHead = (h) => {
  const a = h.indexOf('<article');
  return h.slice(a, h.indexOf('</header>', a));
};
const header = articleHead(html);
const headerText = header.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
check('저자 줄: 글 김수영 대표원장 (성형외과 전문의)', /글\s*김수영 대표원장 \(성형외과 전문의\)/.test(headerText));
check('저자 이름이 의료진 소개로 이어짐', /href="\/ko\/about\/staff"[^>]*rel="author"|rel="author"[^>]*href="\/ko\/about\/staff"/.test(header));
check('수정일을 화면에 적지 않음', !headerText.includes('수정일'), headerText.slice(-80));
check('읽는 시간을 화면에 적지 않음', !headerText.includes('읽는 데'));
check('서버 HTML에는 영상이 없고 사진이 먼저(LCP)', !/<video/.test(html) && /thread-lift-cover\.webp|cover\.webp/.test(html));

// 구조화 데이터
const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const article = ld.find((s) => s['@type'] === 'Article');
const webPage = ld.find((s) => s['@type'] === 'MedicalWebPage');
const faq = ld.find((s) => s['@type'] === 'FAQPage');
check('Article 있음', !!article);
check('Article.author = 원장(Physician, /about/staff#dr-kim)', article?.author?.['@id']?.endsWith('/about/staff#dr-kim') && article.author['@type'].includes('Physician'), JSON.stringify(article?.author));
check('Article.author.name = 김수영', article?.author?.name === '김수영', article?.author?.name);
check('Article.datePublished', article?.datePublished === '2026-11-20' || /^\d{4}-\d{2}-\d{2}$/.test(article?.datePublished ?? ''), article?.datePublished);
check('Article.dateModified', /^\d{4}-\d{2}-\d{2}$/.test(article?.dateModified ?? ''), article?.dateModified);
check('Article.reviewedBy = 원장', article?.reviewedBy?.['@id']?.endsWith('#dr-kim'));
check('Article.image = 공유용 JPEG', /-share\.jpg$/.test(article?.image ?? ''), article?.image);
check('MedicalWebPage.reviewedBy · lastReviewed', webPage?.reviewedBy?.['@id']?.endsWith('#dr-kim') && !!webPage?.lastReviewed, JSON.stringify({ r: webPage?.reviewedBy, l: webPage?.lastReviewed }));
check('FAQPage 질문 3개 이상', (faq?.mainEntity?.length ?? 0) >= 3, String(faq?.mainEntity?.length));

// 메타
const meta = (re) => html.match(re)?.[1];
check('robots: 색인 허용(noindex 없음)', !/<meta name="robots" content="[^"]*noindex/.test(html));
check('og:type = article', meta(/<meta property="og:type" content="([^"]+)"/) === 'article');
check('article:published_time', !!meta(/<meta property="article:published_time" content="([^"]+)"/), meta(/<meta property="article:published_time" content="([^"]+)"/));
check('article:modified_time', !!meta(/<meta property="article:modified_time" content="([^"]+)"/));
check('article:author → 의료진 소개', /about\/staff/.test(meta(/<meta property="article:author" content="([^"]+)"/) ?? ''), meta(/<meta property="article:author" content="([^"]+)"/));
check('meta author = 김수영 대표원장', /김수영/.test(meta(/<meta name="author" content="([^"]+)"/) ?? ''), meta(/<meta name="author" content="([^"]+)"/));

// 허브·사이트맵·llms.txt
const hub = await get('/ko/guides');
const hubText = hub.text.replace(/<[^>]+>/g, ' ');
check('허브 200 + 색인 허용', hub.status === 200 && !/<meta name="robots" content="[^"]*noindex/.test(hub.text));
check('허브 카드: 원장 이름, 수정일·읽는 시간 없음', hubText.includes('글 김수영 대표원장') && !hubText.includes('수정일') && !hubText.includes('읽는 데'));
check(`허브에 초안은 안 보임(초안 ${drafts.length}편)`, drafts.every((d) => !hub.text.includes(`/ko/guides/${d}`)));
const sm = await get('/sitemap.xml');
check('사이트맵에 이 칼럼', sm.text.includes(`/ko/guides/${slug}`));
check(`사이트맵에 초안 없음(초안 ${drafts.length}편)`, drafts.every((d) => !sm.text.includes(`/ko/guides/${d}`)));
const llms = await get('/llms.txt');
check('llms.txt 칼럼 구역에 이 칼럼', llms.text.includes(`/ko/guides/${slug}`) && llms.text.includes('## 칼럼'));
const robots = await get('/robots.txt');
check('robots.txt: AI 검색 로봇 허용', ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot', 'ClaudeBot', 'Google-Extended'].every((b) => robots.text.includes(`User-Agent: ${b}`)));

// 외국인 가이드는 그대로
const en = await get('/en/guides/ultherapy-cost-seoul');
const enHead = articleHead(en.text).replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ');
check('외국인 가이드는 수정일·읽는 시간·병원 이름 그대로', /Updated \d{4}-\d{2}-\d{2}/.test(enHead) && /min read/.test(enHead) && /Written by\s+LIV Plastic Surgery/.test(enHead), enHead.replace(/\s+/g, ' ').slice(-90));

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  ← ${r.detail}`}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 통과`);
process.exit(failed ? 1 : 0);
