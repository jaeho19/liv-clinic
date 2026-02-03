import fs from 'fs';
import postgres from 'postgres';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=').slice(1).join('=');
const sql = postgres(dbUrl, { ssl: 'require' });

const events = [
  {
    slug: 'aptos-thread-lifting',
    sort_order: 1,
    title_ko: '압토스 실리프팅',
    title_en: 'APTOS Thread Lifting',
    title_ja: 'APTOS スレッドリフト',
    title_zh: 'APTOS 线雕',
    description_ko: '부드러운 변화, APTOS 나미카 실리프팅으로 자연스러운 리프팅 효과를 경험하세요.',
    description_en: 'Experience natural lifting effects with APTOS NAMICA thread lifting.',
    description_ja: '自然なリフティング効果をAPTOS NAMICAスレッドリフトで体験してください。',
    description_zh: '通过APTOS NAMICA线雕体验自然提升效果。',
    poster_image: '/images/event/aptos/001.jpg',
    thumbnail_image: '/images/event/aptos/001.jpg',
    gallery_images: Array.from({length:13}, (_,i) => '/images/event/aptos/' + String(i+1).padStart(3,'0') + '.jpg'),
    start_date: '2025-01-01',
    end_date: '2099-12-31',
    category: 'lifting',
    featured: false,
    related_treatments: ['/lifting/thread'],
    is_published: true,
  },
  {
    slug: '2026-restart-january',
    sort_order: 2,
    title_ko: '2026 Re:Start. 1월 이벤트',
    title_en: '2026 Re:Start. January Event',
    title_ja: '2026 Re:Start. 1月イベント',
    title_zh: '2026 Re:Start. 1月活动',
    description_ko: '새해를 맞아 리브성형외과에서 준비한 특별 패키지! 새로운 시작을 위한 특별 할인 혜택.',
    description_en: 'Special package from LIV Plastic Surgery for the new year! Special discounts for a fresh start.',
    description_ja: '新年を迎え、リブ形成外科で準備した特別パッケージ！新しいスタートのための特別割引。',
    description_zh: '迎接新年，LIV整形外科准备的特别套餐！新起点特别优惠。',
    poster_image: '/images/event/restart-2026/001.jpeg',
    thumbnail_image: '/images/event/restart-2026/001.jpeg',
    gallery_images: Array.from({length:7}, (_,i) => '/images/event/restart-2026/' + String(i+1).padStart(3,'0') + '.jpeg'),
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    category: 'all',
    featured: false,
    related_treatments: ['/lifting/ulthera', '/antiaging/skinbooster'],
    is_published: true,
  },
  {
    slug: 'ulthera-prime-event',
    sort_order: 3,
    title_ko: '울쎄라피 프라임 이벤트',
    title_en: 'Ultherapy Prime Event',
    title_ja: 'ウルセラピープライム イベント',
    title_zh: '超声刀尊享活动',
    description_ko: 'FDA 승인 정품 울쎄라피 프라임! 전문의 직접 시술로 안전하고 확실한 리프팅 효과를 경험하세요.',
    description_en: 'FDA-approved genuine Ultherapy Prime! Experience safe and effective lifting with specialist treatment.',
    description_ja: 'FDA承認の正規ウルセラピープライム！専門医による直接施術で安全で確実なリフティング効果を体験。',
    description_zh: 'FDA认证正品超声刀尊享！专业医师亲自操作，体验安全有效的提升效果。',
    poster_image: '/images/event/ulthera-prime/001.jpg',
    thumbnail_image: '/images/event/ulthera-prime/001.jpg',
    gallery_images: Array.from({length:16}, (_,i) => '/images/event/ulthera-prime/' + String(i+1).padStart(3,'0') + '.jpg'),
    start_date: '2025-08-01',
    end_date: '2025-11-30',
    category: 'lifting',
    featured: false,
    related_treatments: ['/lifting/ulthera'],
    is_published: true,
  },
  {
    slug: 'thermage-flx-event',
    sort_order: 4,
    title_ko: '써마지 FLX',
    title_en: 'Thermage FLX',
    title_ja: 'サーマジ FLX',
    title_zh: '热玛吉 FLX',
    description_ko: '피부 탄력 관리의 정석! 써마지 FLX로 처진 피부를 탄탄하게. 눈가, 턱선 집중 케어.',
    description_en: 'The gold standard for skin elasticity! Firm sagging skin with Thermage FLX. Eye and jawline intensive care.',
    description_ja: '肌弾力ケアの定番！サーマジFLXでたるんだ肌を引き締め。目元・あごライン集中ケア。',
    description_zh: '皮肤弹力护理经典！用热玛吉FLX紧致松弛皮肤。眼周、下颌线集中护理。',
    poster_image: '/images/event/thermage-flx/001.jpg',
    thumbnail_image: '/images/event/thermage-flx/001.jpg',
    gallery_images: Array.from({length:7}, (_,i) => '/images/event/thermage-flx/' + String(i+1).padStart(3,'0') + '.jpg'),
    start_date: '2025-01-01',
    end_date: '2099-12-31',
    category: 'lifting',
    featured: false,
    related_treatments: ['/lifting/thermage'],
    is_published: true,
  },
  {
    slug: 'goodbye-ulthera',
    sort_order: 5,
    title_ko: '굿바이 울쎄라 | 울쎄라 리프팅 마지막 특가 이벤트',
    title_en: 'Goodbye Ulthera | Final Special Ulthera Lifting Event',
    title_ja: 'グッバイ ウルセラ | ウルセラリフティング最終特価イベント',
    title_zh: '告别超声刀 | 超声刀提升最后特价活动',
    description_ko: '울쎄라 리프팅 마지막 특가! 놓치면 후회할 최저가 이벤트. 지금 바로 예약하세요.',
    description_en: "Final special price for Ulthera lifting! Don't miss this lowest price event. Book now.",
    description_ja: 'ウルセラリフティング最終特価！見逃すと後悔する最低価格イベント。今すぐご予約を。',
    description_zh: '超声刀提升最后特价！错过将后悔的最低价活动。立即预约。',
    poster_image: '/images/event/goodbye-ulthera/001.jpg',
    thumbnail_image: '/images/event/goodbye-ulthera/001.jpg',
    gallery_images: Array.from({length:10}, (_,i) => '/images/event/goodbye-ulthera/' + String(i+1).padStart(3,'0') + '.jpg'),
    start_date: '2025-08-01',
    end_date: '2025-11-30',
    category: 'lifting',
    featured: false,
    related_treatments: ['/lifting/ulthera'],
    is_published: true,
  },
  {
    slug: 'density-event',
    sort_order: 6,
    title_ko: '덴서티 이벤트',
    title_en: 'Density Event',
    title_ja: 'デンシティ イベント',
    title_zh: '密度提升活动',
    description_ko: 'HIFU+RF 듀얼 리프팅! 덴서티로 탄력과 볼륨을 동시에 잡으세요. 특별 할인 진행 중.',
    description_en: 'HIFU+RF dual lifting! Achieve elasticity and volume with Density. Special discount available.',
    description_ja: 'HIFU+RFデュアルリフティング！デンシティで弾力とボリュームを同時に。特別割引実施中。',
    description_zh: 'HIFU+RF双重提升！用Density同时获得弹力和丰盈。特别折扣进行中。',
    poster_image: '/images/event/density/001.png',
    thumbnail_image: '/images/event/density/001.png',
    gallery_images: ['/images/event/density/001.png'],
    start_date: '2025-08-01',
    end_date: '2025-11-30',
    category: 'lifting',
    featured: false,
    related_treatments: ['/lifting/density'],
    is_published: true,
  },
];

async function seed() {
  for (const event of events) {
    await sql`
      INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
      VALUES (${event.slug}, ${event.sort_order}, ${event.title_ko}, ${event.title_en}, ${event.title_ja}, ${event.title_zh}, ${event.description_ko}, ${event.description_en}, ${event.description_ja}, ${event.description_zh}, ${event.poster_image}, ${event.thumbnail_image}, ${event.gallery_images}, ${event.start_date}, ${event.end_date}, ${event.category}, ${event.featured}, ${event.related_treatments}, ${event.is_published})
      ON CONFLICT (slug) DO NOTHING
    `;
    console.log('Seeded:', event.slug);
  }
  console.log('\nAll events seeded successfully!');
  await sql.end();
}

seed().catch(e => { console.error('Error:', e.message); sql.end(); process.exit(1); });
