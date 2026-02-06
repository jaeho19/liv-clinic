-- ============================================
-- 010: Seed Events from Constants
-- constants.ts의 하드코딩된 이벤트를 DB로 마이그레이션
-- 관리자에서 이벤트 삭제 시 홈페이지에 즉시 반영되도록 함
-- ============================================

-- 1. 압토스 실리프팅
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  'aptos-thread-lifting', 1,
  '압토스 실리프팅', 'APTOS Thread Lifting', 'APTOS スレッドリフト', 'APTOS 线雕',
  '부드러운 변화, APTOS 나미카 실리프팅으로 자연스러운 리프팅 효과를 경험하세요.',
  'Experience natural lifting effects with APTOS NAMICA thread lifting.',
  '自然なリフティング効果をAPTOS NAMICAスレッドリフトで体験してください。',
  '通过APTOS NAMICA线雕体验自然提升效果。',
  '/images/event/aptos/001.jpg', '/images/event/aptos/001.jpg',
  ARRAY['/images/event/aptos/001.jpg','/images/event/aptos/002.jpg','/images/event/aptos/003.jpg','/images/event/aptos/004.jpg','/images/event/aptos/005.jpg','/images/event/aptos/006.jpg','/images/event/aptos/007.jpg','/images/event/aptos/008.jpg','/images/event/aptos/009.jpg','/images/event/aptos/010.jpg','/images/event/aptos/011.jpg','/images/event/aptos/012.jpg','/images/event/aptos/013.jpg'],
  '2025-01-01', '2099-12-31', 'lifting', false,
  ARRAY['/lifting/thread'], true
)
ON CONFLICT (slug) DO NOTHING;

-- 2. 2026 Re:Start 1월 이벤트
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  '2026-restart-january', 2,
  '2026 Re:Start. 1월 이벤트', '2026 Re:Start. January Event', '2026 Re:Start. 1月イベント', '2026 Re:Start. 1月活动',
  '새해를 맞아 리브성형외과에서 준비한 특별 패키지! 새로운 시작을 위한 특별 할인 혜택.',
  'Special package from LIV Plastic Surgery for the new year! Special discounts for a fresh start.',
  '新年を迎え、リブ形成外科で準備した特別パッケージ！新しいスタートのための特別割引。',
  '迎接新年，LIV整形外科准备的特别套餐！新起点特别优惠。',
  '/images/event/restart-2026/001.jpeg', '/images/event/restart-2026/001.jpeg',
  ARRAY['/images/event/restart-2026/001.jpeg','/images/event/restart-2026/002.jpeg','/images/event/restart-2026/003.jpeg','/images/event/restart-2026/004.jpeg','/images/event/restart-2026/005.jpeg','/images/event/restart-2026/006.jpeg','/images/event/restart-2026/007.jpeg'],
  '2026-01-01', '2026-01-31', 'all', false,
  ARRAY['/lifting/ulthera', '/antiaging/skinbooster'], true
)
ON CONFLICT (slug) DO NOTHING;

-- 3. 울쎄라피 프라임 이벤트
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  'ulthera-prime-event', 3,
  '울쎄라피 프라임 이벤트', 'Ultherapy Prime Event', 'ウルセラピープライム イベント', '超声刀尊享活动',
  'FDA 승인 정품 울쎄라피 프라임! 전문의 직접 시술로 안전하고 확실한 리프팅 효과를 경험하세요.',
  'FDA-approved genuine Ultherapy Prime! Experience safe and effective lifting with specialist treatment.',
  'FDA承認の正規ウルセラピープライム！専門医による直接施術で安全で確実なリフティング効果を体験。',
  'FDA认证正品超声刀尊享！专业医师亲自操作，体验安全有效的提升效果。',
  '/images/event/ulthera-prime/001.jpg', '/images/event/ulthera-prime/001.jpg',
  ARRAY['/images/event/ulthera-prime/001.jpg','/images/event/ulthera-prime/002.jpg','/images/event/ulthera-prime/003.jpg','/images/event/ulthera-prime/004.jpg','/images/event/ulthera-prime/005.jpg','/images/event/ulthera-prime/006.jpg','/images/event/ulthera-prime/007.jpg','/images/event/ulthera-prime/008.jpg','/images/event/ulthera-prime/009.jpg','/images/event/ulthera-prime/010.jpg','/images/event/ulthera-prime/011.jpg','/images/event/ulthera-prime/012.jpg','/images/event/ulthera-prime/013.jpg','/images/event/ulthera-prime/014.jpg','/images/event/ulthera-prime/015.jpg','/images/event/ulthera-prime/016.jpg'],
  '2025-08-01', '2025-11-30', 'lifting', false,
  ARRAY['/lifting/ulthera'], true
)
ON CONFLICT (slug) DO NOTHING;

-- 4. 써마지 FLX
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  'thermage-flx-event', 4,
  '써마지 FLX', 'Thermage FLX', 'サーマジ FLX', '热玛吉 FLX',
  '피부 탄력 관리의 정석! 써마지 FLX로 처진 피부를 탄탄하게. 눈가, 턱선 집중 케어.',
  'The gold standard for skin elasticity! Firm sagging skin with Thermage FLX. Eye and jawline intensive care.',
  '肌弾力ケアの定番！サーマジFLXでたるんだ肌を引き締め。目元・あごライン集中ケア。',
  '皮肤弹力护理经典！用热玛吉FLX紧致松弛皮肤。眼周、下颌线集中护理。',
  '/images/event/thermage-flx/001.jpg', '/images/event/thermage-flx/001.jpg',
  ARRAY['/images/event/thermage-flx/001.jpg','/images/event/thermage-flx/002.jpg','/images/event/thermage-flx/003.jpg','/images/event/thermage-flx/004.jpg','/images/event/thermage-flx/005.jpg','/images/event/thermage-flx/006.jpg','/images/event/thermage-flx/007.jpg'],
  '2025-01-01', '2099-12-31', 'lifting', false,
  ARRAY['/lifting/thermage'], true
)
ON CONFLICT (slug) DO NOTHING;

-- 5. 굿바이 울쎄라
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  'goodbye-ulthera', 5,
  '굿바이 울쎄라 | 울쎄라 리프팅 마지막 특가 이벤트', 'Goodbye Ulthera | Final Special Ulthera Lifting Event', 'グッバイ ウルセラ | ウルセラリフティング最終特価イベント', '告别超声刀 | 超声刀提升最后特价活动',
  '울쎄라 리프팅 마지막 특가! 놓치면 후회할 최저가 이벤트. 지금 바로 예약하세요.',
  'Final special price for Ulthera lifting! Don''t miss this lowest price event. Book now.',
  'ウルセラリフティング最終特価！見逃すと後悔する最低価格イベント。今すぐご予約を。',
  '超声刀提升最后特价！错过将后悔的最低价活动。立即预约。',
  '/images/event/goodbye-ulthera/001.jpg', '/images/event/goodbye-ulthera/001.jpg',
  ARRAY['/images/event/goodbye-ulthera/001.jpg','/images/event/goodbye-ulthera/002.jpg','/images/event/goodbye-ulthera/003.jpg','/images/event/goodbye-ulthera/004.jpg','/images/event/goodbye-ulthera/005.jpg','/images/event/goodbye-ulthera/006.jpg','/images/event/goodbye-ulthera/007.jpg','/images/event/goodbye-ulthera/008.jpg','/images/event/goodbye-ulthera/009.jpg','/images/event/goodbye-ulthera/010.jpg'],
  '2025-08-01', '2025-11-30', 'lifting', false,
  ARRAY['/lifting/ulthera'], true
)
ON CONFLICT (slug) DO NOTHING;

-- 6. 덴서티 이벤트
INSERT INTO public.events (slug, sort_order, title_ko, title_en, title_ja, title_zh, description_ko, description_en, description_ja, description_zh, poster_image, thumbnail_image, gallery_images, start_date, end_date, category, featured, related_treatments, is_published)
VALUES (
  'density-event', 6,
  '덴서티 이벤트', 'Density Event', 'デンシティ イベント', '密度提升活动',
  'HIFU+RF 듀얼 리프팅! 덴서티로 탄력과 볼륨을 동시에 잡으세요. 특별 할인 진행 중.',
  'HIFU+RF dual lifting! Achieve elasticity and volume with Density. Special discount available.',
  'HIFU+RFデュアルリフティング！デンシティで弾力とボリュームを同時に。特別割引実施中。',
  'HIFU+RF双重提升！用Density同时获得弹力和丰盈。特别折扣进行中。',
  '/images/event/density/001.png', '/images/event/density/001.png',
  ARRAY['/images/event/density/001.png'],
  '2025-08-01', '2025-11-30', 'lifting', false,
  ARRAY['/lifting/density'], true
)
ON CONFLICT (slug) DO NOTHING;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
