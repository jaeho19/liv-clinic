// 공용 유틸 — 환경변수 로딩, Supabase/PG 클라이언트, 스토리지 목록
//
// 이 PC는 TLS 가로채기 프록시 뒤에 있어 Node fetch가 막힌다.
// 스크립트는 반드시 NODE_TLS_REJECT_UNAUTHORIZED=0 으로 실행할 것.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const LIV = 'D:/dev/LIV_homepage/liv-clinic'
export const require_ = createRequire(`${LIV}/package.json`)

// .env.local 에는 GOOGLE_PRIVATE_KEY 같은 여러 줄 따옴표 값이 있어
// 한 줄 정규식으로 파싱하면 조용히 null이 된다. 따옴표 상태를 추적하며 읽는다.
export function loadEnv(path = `${LIV}/.env.local`) {
  const src = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  const env = {}
  let i = 0
  while (i < src.length) {
    const eol = src.indexOf('\n', i)
    const line = (eol === -1 ? src.slice(i) : src.slice(i, eol)).replace(/\r$/, '')
    i = eol === -1 ? src.length : eol + 1
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1)
    const q = val[0]
    if (q === '"' || q === "'") {
      val = val.slice(1)
      // 닫는 따옴표를 만날 때까지 줄을 계속 이어붙인다
      let closed = val.includes(q)
      while (!closed && i < src.length) {
        const nEol = src.indexOf('\n', i)
        const next = (nEol === -1 ? src.slice(i) : src.slice(i, nEol)).replace(/\r$/, '')
        i = nEol === -1 ? src.length : nEol + 1
        val += '\n' + next
        closed = next.includes(q)
      }
      val = val.slice(0, val.lastIndexOf(q))
      if (q === '"') val = val.replace(/\\n/g, '\n')
    } else {
      val = val.trim()
    }
    env[key] = val
  }
  return env
}

export const env = loadEnv()
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
export const BUCKETS = ['events', 'popups', 'before-after']
export const PUBLIC_PREFIX = '/storage/v1/object/public/'

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 .env.local 에서 읽지 못했다')
}

export function db() {
  const { createClient } = require_('@supabase/supabase-js')
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function pg() {
  const { Client } = require_('pg')
  const c = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()
  return c
}

// list()는 한 번에 100개까지, 폴더는 id === null 로 내려온다
export async function listAll(client, bucket, prefix = '') {
  const out = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client.storage
      .from(bucket).list(prefix, { limit: 100, offset })
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`)
    if (!data.length) break
    for (const it of data) {
      const path = prefix ? `${prefix}/${it.name}` : it.name
      if (it.id === null) out.push(...await listAll(client, bucket, path))
      else out.push({
        path,
        size: Number(it.metadata?.size ?? 0),
        mime: it.metadata?.mimetype ?? '',
      })
    }
    if (data.length < 100) break
  }
  return out
}

// 동시 실행 풀 — 233개를 순차로 돌리면 느리고, 무제한이면 서버가 끊는다
export async function pool(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      results[idx] = await fn(items[idx], idx)
    }
  }))
  return results
}

export const mb = (bytes) => (bytes / 1048576).toFixed(1)

export function publicUrl(bucket, path) {
  return `${SUPABASE_URL}${PUBLIC_PREFIX}${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`
}

export const CACHE_MAX_AGE = '31536000'   // 1년

// URL 검증 — HEAD를 쓰면 안 된다.
// Supabase/Cloudflare는 HEAD 응답에 항상 `cache-control: no-cache`를 붙여서
// 정상 업로드도 실패로 보인다. 1바이트 Range GET이면 실제 헤더가 그대로 오고
// 전송량도 사실상 0이다.
export async function checkUrl(url, { expectWebp = true } = {}) {
  let res
  try {
    res = await fetch(url, { headers: { Range: 'bytes=0-0' } })
  } catch (e) {
    return { ok: false, reason: 'FETCH', detail: e.message }
  }
  if (res.status !== 200 && res.status !== 206) {
    return { ok: false, reason: String(res.status), detail: '' }
  }
  const ct = res.headers.get('content-type') ?? ''
  const cc = res.headers.get('cache-control') ?? ''
  if (expectWebp && !ct.includes('webp')) return { ok: false, reason: 'NOT-WEBP', detail: ct }
  if (!cc.includes(`max-age=${CACHE_MAX_AGE}`)) return { ok: false, reason: 'CACHE', detail: cc }
  const size = Number((res.headers.get('content-range') ?? '').split('/')[1] ?? 0)
  return { ok: true, size }
}
