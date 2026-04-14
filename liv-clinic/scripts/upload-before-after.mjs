import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Folder: public/images/전후사진 (relative to project root = liv-clinic/)
// Images live at C:\dev\LIV_homepage\public\images\전후사진 (workspace root, not liv-clinic)
const IMAGE_DIR = path.resolve('..', 'public', 'images', '전후사진');

// Supabase Storage keys require ASCII-only paths. Use `slug` for storage folder while
// `category` (Korean) stays in the DB row.
const items = [
  {
    file: '리프팅(덴서티 600샷 오유미 정면 [가로 1200 x 세로 600].jpg',
    category: '리프팅',
    slug: 'lifting',
    title_ko: '덴서티 600샷 - 오유미 정면',
    sort_order: 1,
  },
  {
    file: '리프팅(인모드 윤선희 정면 [가로 1200 x 세로 600].jpg',
    category: '리프팅',
    slug: 'lifting',
    title_ko: '인모드 - 윤선희 정면',
    sort_order: 2,
  },
  {
    file: '필러(목주름필러 wangjuan정면 [가로 1200 x 세로 600].jpg',
    category: '필러',
    slug: 'filler',
    title_ko: '목주름필러 - wangjuan 정면',
    sort_order: 3,
  },
  {
    file: '필러(목주름필러 wangjuan측면 [가로 1200 x 세로 600].jpg',
    category: '필러',
    slug: 'filler',
    title_ko: '목주름필러 - wangjuan 측면',
    sort_order: 4,
  },
  {
    file: '필러(어깨필러 WANG-HEXIAN [가로 1200 x 세로 600].jpg',
    category: '필러',
    slug: 'filler',
    title_ko: '어깨필러 - WANG-HEXIAN',
    sort_order: 5,
  },
  {
    file: '필러(어깨필러 ZHOU-YINGYAO [가로 1200 x 세로 600].jpg',
    category: '필러',
    slug: 'filler',
    title_ko: '어깨필러 - ZHOU-YINGYAO',
    sort_order: 6,
  },
];

async function main() {
  for (const item of items) {
    const fullPath = path.join(IMAGE_DIR, item.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Skipping (not found): ${fullPath}`);
      continue;
    }

    const buf = fs.readFileSync(fullPath);
    const ext = path.extname(item.file).slice(1) || 'jpg';
    const storagePath = `${item.slug}/${Date.now()}-${item.sort_order}.${ext}`;

    // 1) Upload to Storage
    const { error: uploadErr } = await supabase.storage
      .from('before-after')
      .upload(storagePath, buf, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: false,
      });

    if (uploadErr) {
      console.error(`Upload failed for ${item.file}:`, uploadErr.message);
      continue;
    }

    const { data: urlData } = supabase.storage.from('before-after').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 2) Insert row
    const { error: insertErr } = await supabase.from('before_after').insert({
      category: item.category,
      title_ko: item.title_ko,
      image_url: publicUrl,
      sort_order: item.sort_order,
      is_visible: true,
    });

    if (insertErr) {
      console.error(`Insert failed for ${item.file}:`, insertErr.message);
      continue;
    }

    console.log(`OK  ${item.category} / ${item.title_ko}  ->  ${storagePath}`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
