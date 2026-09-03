import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sanitizeStorageFolder } from '@/lib/storageFolder';

// 슬러그를 입력하기 전에 이미지를 먼저 올리면 `folder`가 비어 temp/ 로 떨어진다.
// 저장이 확정되는 시점에 정식 폴더로 옮기고 새 URL을 돌려준다.
//
// 왜 서버 라우트인가: storage.objects 에 authenticated 용 UPDATE 정책이 없어서
// (INSERT/DELETE/SELECT 만 있음) 브라우저 세션으로는 move() 가 거부된다.
// service role 은 RLS를 우회하므로 여기서만 처리한다.

const ALLOWED_BUCKETS = ['events', 'popups', 'before-after'] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

const TEMP_PREFIX = 'temp/';
const PUBLIC_SEGMENT = '/storage/v1/object/public/';

const isAllowedBucket = (value: unknown): value is AllowedBucket =>
  typeof value === 'string' && (ALLOWED_BUCKETS as readonly string[]).includes(value);

/** 공개 URL에서 이 버킷의 오브젝트 경로를 뽑는다. 다른 호스트/버킷이면 null. */
function objectPathOf(url: string, bucket: string): string | null {
  const marker = `${PUBLIC_SEGMENT}${bucket}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const raw = url.slice(at + marker.length).split('?')[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { bucket, folder, urls } = body as { bucket?: unknown; folder?: unknown; urls?: unknown };

  if (!isAllowedBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }
  if (typeof folder !== 'string' || !Array.isArray(urls)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const target = sanitizeStorageFolder(folder);
  // 목적지가 그대로 temp면 옮길 이유가 없다 (폴더명을 만들 재료가 없는 경우).
  if (target === 'temp') return NextResponse.json({ map: {} });

  const admin = createAdminClient();
  const map: Record<string, string> = {};

  for (const url of urls) {
    if (typeof url !== 'string') continue;
    const path = objectPathOf(url, bucket);
    if (!path || !path.startsWith(TEMP_PREFIX)) continue;

    const fileName = path.slice(TEMP_PREFIX.length);
    if (!fileName || fileName.includes('/')) continue;   // temp 바로 아래 파일만
    const nextPath = `${target}/${fileName}`;

    const { error } = await admin.storage.from(bucket).move(path, nextPath);
    // 실패해도 저장 자체를 막지 않는다 — 옛 URL이 그대로 유효하다.
    if (error) continue;

    const { data } = admin.storage.from(bucket).getPublicUrl(nextPath);
    map[url] = data.publicUrl;
  }

  return NextResponse.json({ map });
}
