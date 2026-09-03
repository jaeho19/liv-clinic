// STEP 6 보조 — 육안 확인에 쓸 페이지 목록을 DB에서 뽑는다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/06b-pages.mjs
import { pg, PUBLIC_PREFIX } from './lib.mjs'

const c = await pg()

// 다국어 갤러리/포스터가 실제로 채워진 이벤트를 우선 고른다 (4개 언어 확인에 의미 있는 행)
const { rows } = await c.query(`
  select id, title_ko as title,
         coalesce(cardinality(gallery_images),0)    as g_ko,
         coalesce(cardinality(gallery_images_en),0) as g_en,
         coalesce(cardinality(gallery_images_ja),0) as g_ja,
         coalesce(cardinality(gallery_images_zh),0) as g_zh,
         (poster_image    like '%' || $1 || '%') as p_ko,
         (poster_image_en like '%' || $1 || '%') as p_en
  from events
  order by (coalesce(cardinality(gallery_images_en),0) > 0) desc,
           coalesce(cardinality(gallery_images),0) desc
  limit 8`, [PUBLIC_PREFIX])

console.log('이벤트 (다국어 갤러리 보유 순)')
for (const r of rows) {
  console.log(`  ${String(r.id).padEnd(38)} ko:${r.g_ko} en:${r.g_en} ja:${r.g_ja} zh:${r.g_zh}  poster ko:${r.p_ko ? 'Y' : '-'} en:${r.p_en ? 'Y' : '-'}  ${r.title ?? ''}`)
}

const { rows: pop } = await c.query(
  `select id, coalesce(title,'') as title, is_active from popups where image_url like '%' || $1 || '%' order by is_active desc limit 6`, [PUBLIC_PREFIX])
console.log('\n팝업')
for (const p of pop) console.log(`  ${String(p.id).padEnd(38)} active:${p.is_active}  ${p.title}`)

await c.end()
