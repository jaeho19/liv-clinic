import { Metadata } from 'next';
import { SITE_INFO } from './constants';
import { LOCALES, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';

// Base URL for the site
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';

// 다국어 병원명 매핑 (11 locale, i18n-glossary 합의) — LocalBusiness/AggregateRating 스키마 공용
export const CLINIC_NAME_BY_LOCALE: Record<string, string> = {
  ko: '리브성형외과',
  en: 'LIV Plastic Surgery',
  ja: 'LIV美容クリニック',
  zh: 'LIV整形外科',
  'zh-TW': 'LIV整形外科',
  vi: 'Phẫu thuật Thẩm mỹ LIV',
  th: 'ศัลยกรรมความงาม LIV',
  ru: 'Пластическая хирургия LIV',
  fr: 'LIV Chirurgie Esthétique',
  mn: 'LIV Гоо Заслын Эмнэлэг',
  ar: 'مستشفى ليف للتجميل',
};

/**
 * Clinic name to print in metadata / JSON-LD for a locale.
 *
 * Korean visitors keep the Korean name; every other locale gets its own
 * localized name from CLINIC_NAME_BY_LOCALE (English for unmapped locales), so
 * no Korean clinic name leaks into non-ko <meta> tags or structured data.
 *
 * Locale is optional and defaults to the Korean name, keeping every existing
 * call site byte-identical if it does not yet thread a locale through.
 */
export function getSiteName(locale?: string): string {
  if (!locale) return SITE_INFO.name;
  return CLINIC_NAME_BY_LOCALE[locale] ?? SITE_INFO.nameEn;
}

/** Clinic names in the other languages we publish, used for schema alternateName. */
const ALT_CLINIC_NAMES = [SITE_INFO.nameEn, 'LIV美容クリニック', 'リブ形成外科', 'LIV整形外科'] as const;

/**
 * alternateName list for the LocalBusiness entity.
 * ko keeps the historical full list (incl. the Korean name); other locales list
 * only the non-Korean names, minus whatever is already the primary `name`.
 */
function buildAlternateNames(locale: string, name: string): string[] {
  if (locale === 'ko') return [...ALT_CLINIC_NAMES, SITE_INFO.name];
  return ALT_CLINIC_NAMES.filter((alt) => alt !== name);
}

/**
 * Build hreflang alternates map from LOCALE_META — keeps SEO in sync with routing.ts.
 * Adds x-default → /en so crawlers have an unambiguous fallback locale.
 */
export function buildHreflangMap(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      LOCALES.map((code) => [LOCALE_META[code].hreflang, `${BASE_URL}/${code}${path}`]),
    ),
    'x-default': `${BASE_URL}/en${path}`,
  };
}

// Default SEO configuration
export const defaultSEO = {
  siteName: SITE_INFO.name,
  siteNameEn: SITE_INFO.nameEn,
  slogan: SITE_INFO.slogan,
};

// Locale-specific metadata (다국어 검색 최적화 강화)
export const seoConfig: Record<string, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  ko: {
    title: '리브성형외과 | 수술 없는 프리미엄 안티에이징 신사역',
    description: '울쎄라피 프라임, 써마지 FLX 공식 인증 병원. 중력을 넘어선 아름다움, Anti-Gravity 리프팅 솔루션. 신사역 4번 출구 도보 1분. 보톡스, 필러, 스킨부스터, 실리프팅, 레이저 토닝 전문 클리닉.',
    keywords: [
      // 병원명 및 지역
      '리브성형외과', 'LIV성형외과', '신사역 피부과', '신사역 성형외과', '신사동 피부과',
      '강남 피부과', '강남 성형외과', '압구정 피부과', '서울 피부과',
      // 리프팅 시술
      '울쎄라피', '울쎄라피 프라임', '울쎄라 가격', '울쎄라 효과', '울쎄라 병원',
      '써마지', '써마지 FLX', '써마지 가격', '써마지 효과', '써마지 병원',
      '실리프팅', '압토스 실리프팅', 'PDO 실리프팅', '실리프팅 가격',
      '비수술 리프팅', '비수술 안면거상', 'HIFU 리프팅', '고주파 리프팅',
      // 안티에이징 시술
      '보톡스', '보톡스 가격', '이마 보톡스', '턱 보톡스', '주름 보톡스',
      '필러', '필러 가격', '코 필러', '입술 필러', '팔자주름 필러',
      '스킨부스터', '쥬베룩', '리쥬란', '물광주사',
      // 레이저 시술
      '레이저 토닝', '피코 레이저', '클래리티 II', '제모 레이저',
      '기미 치료', '색소 치료', '홍조 치료', '모공 치료',
      // 일반 키워드
      '안티에이징', '피부 탄력', '주름 개선', '프리미엄 피부과', '피부관리'
    ],
  },
  en: {
    title: 'LIV Plastic Surgery | Premium Non-surgical Anti-aging Seoul Korea',
    description: 'Official Ultherapy Prime & Thermage FLX certified clinic in Seoul, Korea. Beyond Gravity, Anti-Gravity lifting solution. 1 min from Sinsa Station Exit 4, Gangnam. Botox, Filler, Skin Booster, Thread Lift, Laser specialists.',
    keywords: [
      // Clinic name & location
      'LIV Plastic Surgery', 'LIV Clinic Seoul', 'Seoul dermatology', 'Seoul plastic surgery',
      'Gangnam clinic', 'Gangnam dermatology', 'Sinsa station clinic', 'Korea beauty clinic',
      // Lifting treatments
      'Ultherapy Korea', 'Ultherapy Prime Seoul', 'Ultherapy cost Korea', 'Ultherapy before after',
      'Thermage Korea', 'Thermage FLX Seoul', 'Thermage cost Korea', 'Thermage before after',
      'thread lift Korea', 'APTOS thread lift', 'PDO thread lift Seoul', 'thread lift cost',
      'non-surgical facelift Korea', 'HIFU lifting Seoul', 'RF lifting Korea',
      // Anti-aging treatments
      'Botox Seoul', 'Botox Korea', 'Botox cost Korea', 'forehead Botox Seoul',
      'filler Seoul', 'filler Korea', 'dermal filler cost', 'nose filler Seoul',
      'skin booster Korea', 'Juvelook Korea', 'Rejuran Korea', 'water glow injection',
      // Laser treatments
      'laser toning Seoul', 'Pico laser Korea', 'Clarity II laser', 'laser hair removal Seoul',
      'melasma treatment Korea', 'pigmentation treatment Seoul', 'rosacea treatment Korea',
      // General keywords
      'anti-aging Seoul', 'skin tightening Korea', 'wrinkle treatment Seoul', 'K-beauty clinic',
      'medical tourism Korea', 'best dermatologist Seoul', 'celebrity clinic Korea',
      // Landmark + intent keywords (2026-09 research: Garosu-gil, same-price, English-speaking)
      'Garosu-gil skin clinic', 'Sinsa Garosu-gil clinic', 'skin clinic Seoul English', 'same price for foreigners Korea clinic'
    ],
  },
  ja: {
    title: 'LIV美容クリニック | ソウル新沙・カロスキルの美容皮膚科 非手術アンチエイジング',
    description: 'ウルセラプライム・サーマクール（サーマジFLX）公式認証クリニック。新沙駅4番出口徒歩1分、カロスキルすぐ。日本語相談対応、料金は韓国人と同一。ボトックス・フィラー・スキンブースター・糸リフト・レーザー専門。',
    keywords: [
      // クリニック名・地域
      'リブ形成外科', 'LIV形成外科', 'ソウル皮膚科', 'ソウル美容クリニック',
      '江南クリニック', '江南皮膚科', '新沙洞クリニック', '韓国美容クリニック',
      // リフティング施術
      'ウルセラ韓国', 'ウルセラプライム', 'ウルセラ料金', 'ウルセラ効果',
      'サーマジ韓国', 'サーマジFLX', 'サーマジ料金', 'サーマジ効果',
      '糸リフト韓国', 'APTOS糸リフト', 'PDO糸リフト', '糸リフト料金',
      '非手術フェイスリフト', 'HIFUリフティング', '高周波リフティング',
      // アンチエイジング施術
      'ボトックス韓国', 'ボトックスソウル', 'ボトックス料金', '額ボトックス',
      'フィラー韓国', 'フィラーソウル', 'ヒアルロン酸注入', '鼻フィラー',
      'スキンブースター韓国', 'ジュベルック', 'リジュラン', '水光注射',
      // レーザー施術
      'レーザートーニング', 'ピコレーザー韓国', 'クラリティII', '医療脱毛韓国',
      '肝斑治療韓国', 'シミ治療ソウル', '赤み治療', '毛穴治療',
      // 一般キーワード
      'アンチエイジング韓国', '肌引き締め', 'しわ改善', 'Kビューティー',
      '韓国医療観光', '韓国美容整形', '芸能人御用達クリニック',
      // 実際の日本語検索語（2026-09 調査: サーマクール表記・カロスキル・美容皮膚科）
      '韓国 サーマクール 料金', '韓国 ウルセラ 値段', '新沙 美容皮膚科 日本語', 'カロスキル 皮膚科', '江南 美容皮膚科 日本語対応'
    ],
  },
  'zh-TW': {
    title: 'LIV整形外科 | 首爾新沙·林蔭道 醫美抗衰診所（音波拉提·鳳凰電波）',
    description: '音波拉提（Ultherapy Prime）、鳳凰電波（Thermage FLX）官方認證診所。新沙站4號出口步行1分鐘、林蔭道旁。提供中文諮詢，外國人與韓國人同價。專精肉毒桿菌素、玻尿酸、水光針、埋線拉提、雷射療程。',
    keywords: [
      // 醫院名稱與地區
      'LIV整形外科', 'LIV醫美', '首爾皮膚科', '首爾整形醫院',
      '江南醫美', '江南皮膚科', '新沙洞診所', '韓國醫美診所',
      // 拉提療程
      '音波拉提韓國', 'Ultherapy Prime', '音波拉提價格', '音波拉提效果',
      '電波拉提韓國', 'Thermage FLX', '電波拉提價格', '電波拉提效果',
      '埋線拉提韓國', 'APTOS埋線', 'PDO埋線', '埋線拉提價格',
      '非手術拉皮', 'HIFU拉提', '射頻拉提',
      // 抗老療程
      '肉毒桿菌素韓國', '肉毒桿菌素首爾', '玻尿酸韓國', '玻尿酸首爾',
      '水光針韓國', 'Juvelook', 'Rejuran', '水光注射',
      // 雷射療程
      '雷射淨膚', '皮秒雷射韓國', 'Clarity II雷射', '雷射除毛韓國',
      '肝斑治療韓國', '色斑治療首爾', '泛紅治療', '毛孔治療',
      // 一般關鍵字
      '抗老首爾', '肌膚緊緻', '除皺治療', 'K-beauty',
      '韓國醫療觀光', '首爾高階醫美',
      // 台灣·香港 실제 검색어 (2026-09 조사: 鳳凰電波·林蔭道·除刺青·中文)
      '韓國 音波拉提 價格', '韓國 電波拉提 價格', '鳳凰電波 韓國', '首爾 醫美 中文', '林蔭道 醫美', '首爾 除刺青'
    ],
  },
  vi: {
    title: 'Phẫu thuật Thẩm mỹ LIV | Trẻ hóa cao cấp không phẫu thuật tại Sinsa, Seoul',
    description: 'Phòng khám được chứng nhận chính thức Ultherapy Prime và Thermage FLX tại Seoul, Hàn Quốc. Vẻ đẹp vượt trọng lực — giải pháp nâng cơ Anti-Gravity. Cách ga Sinsa lối ra số 4 một phút đi bộ. Chuyên Botox, filler, skin booster, căng chỉ và laser.',
    keywords: [
      'Phẫu thuật Thẩm mỹ LIV', 'phòng khám Seoul', 'thẩm mỹ Hàn Quốc',
      'nâng cơ không phẫu thuật Seoul', 'Ultherapy Hàn Quốc', 'Thermage Seoul',
      'Botox Seoul', 'filler Hàn Quốc', 'skin booster', 'căng chỉ Hàn Quốc',
      'trẻ hóa cao cấp Seoul', 'du lịch y tế Hàn Quốc', 'phòng khám K-beauty',
      'HIFU Hàn Quốc', 'nâng cơ RF', 'trẻ hóa da Seoul',
      'ga Sinsa', 'phòng khám Gangnam', 'căng da mặt không phẫu thuật',
      'laser Pico Hàn Quốc', 'điều trị nám Hàn Quốc',
    ],
  },
  th: {
    title: 'ศัลยกรรมความงาม LIV | ชะลอวัยระดับพรีเมียมแบบไม่ผ่าตัด ย่านชินซา โซล',
    description: 'คลินิกที่ได้รับการรับรองอย่างเป็นทางการจาก Ultherapy Prime และ Thermage FLX ในกรุงโซล ประเทศเกาหลี ความงามที่เหนือแรงโน้มถ่วง ด้วยโซลูชันยกกระชับ Anti-Gravity เดินเพียง 1 นาทีจากสถานีชินซา ทางออก 4 เชี่ยวชาญโบท็อกซ์ ฟิลเลอร์ สกินบูสเตอร์ ร้อยไหม และเลเซอร์',
    keywords: [
      'ศัลยกรรมความงาม LIV', 'คลินิกโซล', 'ศัลยกรรมเกาหลี',
      'ยกกระชับหน้าไม่ผ่าตัด โซล', 'Ultherapy เกาหลี', 'Thermage โซล',
      'โบท็อกซ์ โซล', 'ฟิลเลอร์ เกาหลี', 'สกินบูสเตอร์', 'ร้อยไหม เกาหลี',
      'ชะลอวัยระดับพรีเมียม โซล', 'ท่องเที่ยวเชิงการแพทย์ เกาหลี', 'คลินิก K-beauty',
      'HIFU เกาหลี', 'ยกกระชับด้วยคลื่นวิทยุ RF', 'ฟื้นฟูผิว โซล',
      'สถานีชินซา', 'คลินิกกังนัม', 'ยกกระชับผิวหน้าโดยไม่ผ่าตัด',
      'พิโคเลเซอร์ เกาหลี', 'รักษาฝ้า เกาหลี',
    ],
  },
  ru: {
    title: 'Пластическая хирургия LIV | Премиальное безоперационное омоложение в Синса, Сеул',
    description: 'Официально сертифицированная клиника Ultherapy Prime и Thermage FLX в Сеуле, Корея. Красота вне гравитации — решение для лифтинга Anti-Gravity. 1 минута пешком от станции Синса, выход 4. Специалисты по ботоксу, филлерам, скинбустерам, нитевому лифтингу и лазерным процедурам.',
    keywords: [
      'Пластическая хирургия LIV', 'клиника в Сеуле', 'эстетическая медицина Кореи',
      'безоперационный лифтинг Сеул', 'Ultherapy Корея', 'Thermage Сеул',
      'ботокс Сеул', 'филлеры Корея', 'скинбустер', 'нитевой лифтинг Корея',
      'премиальное омоложение Сеул', 'медицинский туризм в Корее', 'клиника K-beauty',
      'HIFU Корея', 'RF-лифтинг', 'омоложение лица Сеул',
      'станция Синса', 'клиника Каннам', 'подтяжка лица без операции',
      'пикосекундный лазер Корея', 'лечение мелазмы Корея',
    ],
  },
  zh: {
    title: 'LIV整形外科 | 首尔新沙高端非手术抗衰老',
    description: '超声刀Prime、热玛吉FLX官方认证医院。超越重力的美丽，Anti-Gravity提升解决方案。新沙站4号出口步行1分钟。肉毒素、玻尿酸、水光针、埋线提升、激光专业。',
    keywords: [
      // 医院名称和地区
      'LIV整形外科', 'LIV医美', '首尔皮肤科', '首尔整形医院',
      '江南医美', '江南皮肤科', '新沙洞诊所', '韩国美容医院',
      // 提升项目
      '超声刀韩国', '超声刀Prime', '超声刀价格', '超声刀效果',
      '热玛吉韩国', '热玛吉FLX', '热玛吉价格', '热玛吉效果',
      '埋线提升韩国', 'APTOS埋线', 'PDO埋线', '埋线价格',
      '非手术面部提升', 'HIFU提升', '射频提升',
      // 抗衰老项目
      '肉毒素韩国', '肉毒素首尔', '肉毒素价格', '额头肉毒素',
      '玻尿酸韩国', '玻尿酸首尔', '玻尿酸填充', '鼻子玻尿酸',
      '水光针韩国', 'Juvelook', 'Rejuran婴儿针', '水光注射',
      // 激光项目
      '激光美白', '皮秒激光韩国', 'Clarity II激光', '激光脱毛韩国',
      '黄褐斑治疗韩国', '色斑治疗首尔', '红血丝治疗', '毛孔治疗',
      // 一般关键词
      '抗衰老首尔', '皮肤紧致', '祛皱治疗', 'K美容',
      '韩国医疗旅游', '韩国医美', '明星同款诊所', '首尔高端医美'
    ],
  },
  fr: {
    title: 'LIV Chirurgie Esthétique | Anti-âge premium non chirurgical à Sinsa Séoul',
    description: 'Clinique officielle certifiée Ultherapy Prime et Thermage FLX à Séoul, Corée. Solution de lifting Anti-Gravity au-delà de la gravité. À 1 min de la station Sinsa sortie 4. Spécialistes Botox, fillers, skin boosters, fils tenseurs, laser.',
    keywords: [
      'LIV Chirurgie Esthétique', 'clinique Séoul', 'chirurgie esthétique Corée',
      'lifting non chirurgical Séoul', 'Ultherapy Corée', 'Thermage Séoul',
      'Botox Séoul', 'filler Corée', 'skin booster', 'fils tenseurs Corée',
      'anti-âge premium Séoul', 'tourisme médical Corée', 'clinique K-beauty',
      'HIFU Corée', 'radiofréquence visage', 'rajeunissement Séoul',
      'station Sinsa', 'Gangnam clinique', 'lifting visage sans chirurgie',
    ],
  },
  mn: {
    title: 'LIV Гоо Заслын Эмнэлэг | Шинса дахь премиум мэс заслын бус залуужуулалт',
    description: 'Ultherapy Prime, Thermage FLX-ийн албан ёсны баталгаажуулсан эмнэлэг. Таталцлаас давсан гоо сайхан, Anti-Gravity лифтинг шийдэл. Шинса метроны 4-р гарцаас 1 минутын зайтай.',
    keywords: [
      'LIV гоо заслын эмнэлэг', 'Сөүл лазер', 'Солонгос мэс заслын бус залуужуулалт',
      'Ultherapy Солонгос', 'Thermage Сөүл', 'Ботокс Солонгос', 'Филлер',
      'Утсан лифтинг', 'HIFU лифтинг', 'RF лифтинг',
      'Премиум залуужуулалт', 'Анагаах ухааны аялал жуулчлал Солонгос',
      'Шинса', 'Каннам', 'Солонгос гоо сайхны эмнэлэг', 'K-beauty',
    ],
  },
  ar: {
    title: 'مستشفى ليف للتجميل | مكافحة الشيخوخة المتقدمة بدون جراحة في سيول',
    description: 'مستشفى معتمد رسمياً لـ Ultherapy Prime و Thermage FLX في سيول، كوريا. حل شد بشرة Anti-Gravity متجاوزاً الجاذبية. على بُعد دقيقة واحدة من محطة سينسا، المخرج 4. متخصصون في البوتوكس والفيلر وحقن البشرة والخيوط والليزر.',
    keywords: [
      'مستشفى ليف للتجميل', 'تجميل كوريا', 'شد الوجه بدون جراحة سيول',
      'ألثيرابي كوريا', 'ثيرماج سيول', 'بوتوكس كوريا', 'فيلر سيول',
      'حقن البشرة', 'خيوط شد الوجه', 'HIFU كوريا',
      'مكافحة الشيخوخة سيول', 'السياحة العلاجية كوريا', 'عيادة K-beauty',
      'محطة سينسا', 'عيادة جانغنام', 'شد بدون جراحة',
    ],
  },
};

// ============================================
// Structured-data localization (JSON-LD)
//
// Same map-per-locale pattern as CLINIC_NAME_BY_LOCALE: every human-readable
// value that ends up inside a JSON-LD block has one entry per locale, so no
// Korean string can leak into a foreign visitor's structured data.
//
// HARD CONSTRAINT: the `ko` entries below must stay byte-identical to what the
// site shipped before this map existed. They are the historical values, moved
// verbatim — do not "clean them up" (the ko service descriptions are
// deliberately still the legacy multi-language blobs).
// ============================================

/** Human-readable JSON-LD values that must exist in every published locale. */
interface SchemaL10n {
  /** PostalAddress parts (postalCode/addressCountry are locale-independent). */
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
  };
  /** memberOf names — index-aligned with MEMBER_SOCIETIES. */
  societies: string[];
  /** hasCredential names — index-aligned with EQUIPMENT_CREDENTIALS. */
  credentials: string[];
  /** knowsAbout keyword list for the clinic entity. */
  knowsAbout: string[];
  /** availableService alternateName/description — index-aligned with SERVICE_BASE. */
  services: { alternateName: string[]; description: string }[];
  /** ReserveAction result name ("상담 예약"). */
  reservationWord: string;
  /** Physician hasOccupation.name. */
  physicianOccupation: string;
  /** Clinic-wide expertise appended to a physician's own specialties. */
  physicianExpertise: string[];
}

/**
 * Korean postal address — the local-format address Google's local-SEO guidance
 * expects for the Korean market. Kept for `ko` only.
 */
const KO_ADDRESS = {
  streetAddress: '나루터로 80 자은빌딩 4층',
  addressLocality: '서초구',
  addressRegion: '서울특별시',
} as const;

/**
 * Romanized address for every non-Korean locale, decomposed from
 * SITE_INFO.address.en (the clinic's own official romanization).
 *
 * Deliberately Latin script in all foreign locales rather than transliterated
 * per language: a postal address must stay deliverable and matchable against
 * Google Business Profile, and we have no sourced CJK/Cyrillic/Arabic rendering
 * of the building name to use instead of inventing one.
 */
const ROMANIZED_ADDRESS = {
  streetAddress: '4F, Jaeun Building, 80 Naruteo-ro',
  addressLocality: 'Seocho-gu',
  addressRegion: 'Seoul',
} as const;

/** memberOf entries — locale-independent parts (order fixed; names come from SCHEMA_L10N). */
const MEMBER_SOCIETIES: { url?: string }[] = [
  { url: 'https://www.ksaps.or.kr/' },
  { url: 'https://www.plasticsurgery.or.kr/' },
  {},
  {},
];

/** hasCredential entries — locale-independent parts (issuer stays untranslated: legal entity names). */
const EQUIPMENT_CREDENTIALS: { issuer: string; issuerUrl: string }[] = [
  { issuer: 'Merz Aesthetics', issuerUrl: 'https://merz.co.kr/' },
  { issuer: 'Solta Medical (Bausch Health)', issuerUrl: 'https://www.thermage.co.kr/' },
  { issuer: 'APTOS International', issuerUrl: 'https://aptos.global/' },
];

/** availableService entries — locale-independent parts (procedure `name` stays canonical/English). */
const SERVICE_BASE: { name: string }[] = [
  { name: 'Ultherapy Prime HIFU Lifting' },
  { name: 'Thermage FLX' },
  { name: 'APTOS Thread Lifting' },
  { name: 'Botox' },
  { name: 'Dermal Filler' },
  { name: 'Skin Booster' },
  { name: 'Laser Toning' },
  { name: 'Pico Laser' },
];

const SCHEMA_L10N: Record<string, SchemaL10n> = {
  ko: {
    address: { ...KO_ADDRESS },
    societies: [
      '대한성형외과의사회',
      '대한성형외과학회',
      '대한미용성형외과학회',
      '최소침습성형외과학회(MIPS)',
    ],
    credentials: [
      '울쎄라피 프라임 정품 인증',
      '써마지 FLX 파트너 인증',
      'APTOS 공식 인증 (KR0062025)',
    ],
    // ko keeps the historical 4-language keyword list verbatim (byte-identity).
    knowsAbout: [
      // 한국어 (Korean)
      'HIFU 리프팅', 'RF 고주파 리프팅', '비수술 안티에이징',
      '울쎄라피 프라임', '써마지 FLX', '보톡스', '필러', '스킨부스터',
      '실리프팅', '레이저 토닝', '피코 레이저', '주름 개선', '피부 탄력',
      // English
      'HIFU lifting', 'RF lifting', 'non-surgical anti-aging',
      'Ultherapy Prime', 'Thermage FLX', 'Botox', 'dermal filler', 'skin booster',
      'thread lift', 'laser toning', 'Pico laser', 'wrinkle treatment', 'skin tightening',
      'Korean beauty clinic', 'K-beauty medical', 'Seoul aesthetic clinic',
      // 日本語 (Japanese)
      'HIFUリフティング', '高周波リフティング', '非手術アンチエイジング',
      'ウルセラプライム', 'サーマジFLX', 'ボトックス', 'フィラー', 'スキンブースター',
      '糸リフト', 'レーザートーニング', 'ピコレーザー', 'しわ改善', '肌引き締め',
      '韓国美容クリニック', 'Kビューティー医療',
      // 中文 (Chinese)
      'HIFU提升', '射频提升', '非手术抗衰老',
      '超声刀Prime', '热玛吉FLX', '肉毒素', '玻尿酸', '水光针',
      '埋线提升', '激光美白', '皮秒激光', '祛皱', '皮肤紧致',
      '韩国医美', 'K美容医疗', '首尔美容诊所',
    ],
    // ko keeps the historical pre-concatenated descriptions verbatim (byte-identity).
    services: [
      {
        alternateName: ['울쎄라피 프라임', 'ウルセラプライム', '超声刀Prime'],
        description: 'FDA 승인 고강도 집속 초음파 리프팅 | FDA-approved High-Intensity Focused Ultrasound | FDA承認HIFU',
      },
      {
        alternateName: ['써마지 FLX', 'サーマジFLX', '热玛吉FLX'],
        description: '4세대 프리미엄 고주파 리프팅 | 4th Gen Premium RF Lifting | 第4世代RF',
      },
      {
        alternateName: ['압토스 실리프팅', 'APTOS糸リフト', 'APTOS埋线提升'],
        description: '글로벌 인증 PDO/PCL 실리프팅 | Global Certified PDO/PCL Thread | 全球认证PDO/PCL埋线',
      },
      {
        alternateName: ['보톡스', 'ボトックス', '肉毒素'],
        description: '주름 개선 및 윤곽 시술 | Wrinkle & Contour Treatment | しわ改善・輪郭',
      },
      {
        alternateName: ['필러', 'フィラー', '玻尿酸'],
        description: '볼륨 및 윤곽 개선 | Volume & Contour Enhancement | ボリューム・輪郭',
      },
      {
        alternateName: ['스킨부스터', 'スキンブースター', '水光针'],
        description: '피부 보습 및 탄력 개선 | Skin Hydration & Elasticity | 保湿・弾力',
      },
      {
        alternateName: ['레이저 토닝', 'レーザートーニング', '激光美白'],
        description: '색소 치료 및 피부톤 개선 | Pigmentation & Skin Tone | 色素・美白',
      },
      {
        alternateName: ['피코 레이저', 'ピコレーザー', '皮秒激光'],
        description: '기미/잡티/문신 제거 | Melasma/Spots/Tattoo Removal | シミ・タトゥー除去',
      },
    ],
    reservationWord: '상담 예약',
    physicianOccupation: '성형외과 전문의',
    physicianExpertise: [
      'HIFU 리프팅',
      'RF 고주파 리프팅',
      '비수술 안티에이징',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  en: {
    address: { ...ROMANIZED_ADDRESS },
    // Society names reuse the renderings already published in
    // messages/en.json → sections.doctor.credentialsList, except the two the
    // message files do not cover (see the report accompanying this change).
    societies: [
      'Korean Association of Plastic Surgeons',
      'Korean Society of Plastic and Reconstructive Surgeons',
      'Korean Society of Aesthetic Plastic Surgery',
      'Society of Minimally Invasive Plastic Surgery (MIPS)',
    ],
    credentials: [
      'Ultherapy Prime Authentic Device Certification',
      'Thermage FLX Partner Certification',
      'APTOS Official Certification (KR0062025)',
    ],
    knowsAbout: [
      'HIFU lifting', 'RF lifting', 'non-surgical anti-aging',
      'Ultherapy Prime', 'Thermage FLX', 'Botox', 'dermal filler', 'skin booster',
      'thread lift', 'laser toning', 'Pico laser', 'wrinkle treatment', 'skin tightening',
      'Korean beauty clinic', 'K-beauty medical', 'Seoul aesthetic clinic',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'FDA-approved high-intensity focused ultrasound lifting' },
      { alternateName: ['Thermage FLX'], description: '4th-generation premium RF lifting' },
      { alternateName: ['APTOS Thread Lift'], description: 'Globally certified PDO/PCL thread lift' },
      { alternateName: ['Botox'], description: 'Wrinkle and facial contour treatment' },
      { alternateName: ['Dermal Filler'], description: 'Volume and contour enhancement' },
      { alternateName: ['Skin Booster'], description: 'Skin hydration and elasticity improvement' },
      { alternateName: ['Laser Toning'], description: 'Pigmentation treatment and skin tone improvement' },
      { alternateName: ['Pico Laser'], description: 'Melasma, blemish and tattoo removal' },
    ],
    reservationWord: 'Consultation Booking',
    physicianOccupation: 'Plastic Surgery Specialist',
    physicianExpertise: [
      'HIFU lifting',
      'RF lifting',
      'non-surgical anti-aging',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  ja: {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      '大韓形成外科医師会',
      '大韓形成外科学会',
      '大韓美容形成外科学会',
      '最小侵襲形成外科学会(MIPS)',
    ],
    credentials: [
      'ウルセラプライム 正規品認証',
      'サーマジFLX パートナー認証',
      'APTOS 公式認証 (KR0062025)',
    ],
    knowsAbout: [
      'HIFUリフティング', '高周波リフティング', '非手術アンチエイジング',
      'ウルセラプライム', 'サーマジFLX', 'ボトックス', 'フィラー', 'スキンブースター',
      '糸リフト', 'レーザートーニング', 'ピコレーザー', 'しわ改善', '肌引き締め',
      '韓国美容クリニック', 'Kビューティー医療', 'ソウル美容クリニック',
    ],
    services: [
      { alternateName: ['ウルセラプライム'], description: 'FDA承認の高密度焦点式超音波リフティング' },
      { alternateName: ['サーマジFLX'], description: '第4世代プレミアム高周波リフティング' },
      { alternateName: ['APTOS糸リフト'], description: 'グローバル認証PDO/PCL糸リフト' },
      { alternateName: ['ボトックス'], description: 'しわ改善・輪郭治療' },
      { alternateName: ['フィラー'], description: 'ボリューム・輪郭の改善' },
      { alternateName: ['スキンブースター'], description: '肌の保湿・弾力の改善' },
      { alternateName: ['レーザートーニング'], description: '色素治療・肌トーンの改善' },
      { alternateName: ['ピコレーザー'], description: 'シミ・くすみ・タトゥーの除去' },
    ],
    reservationWord: 'カウンセリング予約',
    physicianOccupation: '形成外科専門医',
    physicianExpertise: [
      'HIFUリフティング',
      '高周波リフティング',
      '非手術アンチエイジング',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  zh: {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      '大韩整形外科医师会',
      '大韩整形外科学会',
      '大韩美容整形外科学会',
      '微创整形外科学会(MIPS)',
    ],
    credentials: [
      '超声刀Prime 正品认证',
      '热玛吉FLX 合作伙伴认证',
      'APTOS 官方认证 (KR0062025)',
    ],
    knowsAbout: [
      'HIFU提升', '射频提升', '非手术抗衰老',
      '超声刀Prime', '热玛吉FLX', '肉毒素', '玻尿酸', '水光针',
      '埋线提升', '激光美白', '皮秒激光', '祛皱', '皮肤紧致',
      '韩国医美', 'K美容医疗', '首尔美容诊所',
    ],
    services: [
      { alternateName: ['超声刀Prime'], description: 'FDA批准的高强度聚焦超声提升' },
      { alternateName: ['热玛吉FLX'], description: '第四代高端射频提升' },
      { alternateName: ['APTOS埋线提升'], description: '全球认证PDO/PCL埋线提升' },
      { alternateName: ['肉毒素'], description: '祛皱及面部轮廓塑造' },
      { alternateName: ['玻尿酸'], description: '填充塑形与轮廓改善' },
      { alternateName: ['水光针'], description: '皮肤补水与弹性改善' },
      { alternateName: ['激光美白'], description: '色素治疗与肤色改善' },
      { alternateName: ['皮秒激光'], description: '黄褐斑、色斑及纹身去除' },
    ],
    reservationWord: '咨询预约',
    physicianOccupation: '整形外科专科医生',
    physicianExpertise: [
      'HIFU提升',
      '射频提升',
      '非手术抗衰老',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  'zh-TW': {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      '大韓整形外科醫師會',
      '大韓整形外科學會',
      '大韓美容整形外科學會',
      '微創整形外科學會(MIPS)',
    ],
    credentials: [
      'Ultherapy Prime 正品認證',
      'Thermage FLX 合作夥伴認證',
      'APTOS 官方認證 (KR0062025)',
    ],
    knowsAbout: [
      'HIFU拉提', '射頻拉提', '非手術抗老',
      'Ultherapy Prime', 'Thermage FLX', '肉毒桿菌素', '玻尿酸', '水光針',
      '埋線拉提', '雷射淨膚', '皮秒雷射', '除皺', '肌膚緊緻',
      '韓國醫美', 'K-beauty 醫療', '首爾醫美診所',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'FDA 核准的高強度聚焦超音波拉提' },
      { alternateName: ['Thermage FLX'], description: '第四代高階射頻拉提' },
      { alternateName: ['APTOS埋線拉提'], description: '全球認證PDO/PCL埋線拉提' },
      { alternateName: ['肉毒桿菌素'], description: '除皺及臉部輪廓雕塑' },
      { alternateName: ['玻尿酸'], description: '填充塑形與輪廓改善' },
      { alternateName: ['水光針'], description: '肌膚保濕與彈性改善' },
      { alternateName: ['雷射淨膚'], description: '色素治療與膚色改善' },
      { alternateName: ['皮秒雷射'], description: '黑斑、色斑及刺青去除' },
    ],
    reservationWord: '諮詢預約',
    physicianOccupation: '整形外科專科醫師',
    physicianExpertise: [
      'HIFU拉提',
      '射頻拉提',
      '非手術抗老',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  vi: {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      'Hội Bác sĩ Phẫu thuật Thẩm mỹ Hàn Quốc',
      'Hiệp hội bác sĩ phẫu thuật thẩm mỹ và tái tạo Hàn Quốc',
      'Hiệp hội Phẫu thuật Thẩm mỹ Hàn Quốc',
      'Hiệp hội Phẫu thuật Thẩm mỹ Xâm lấn Tối thiểu (MIPS)',
    ],
    credentials: [
      'Chứng nhận chính hãng Ultherapy Prime',
      'Chứng nhận đối tác Thermage FLX',
      'Chứng nhận chính thức APTOS (KR0062025)',
    ],
    knowsAbout: [
      'Nâng cơ HIFU', 'Nâng cơ RF', 'Trẻ hóa không phẫu thuật',
      'Ultherapy Prime', 'Thermage FLX', 'Botox', 'Filler', 'Skin booster',
      'Căng chỉ', 'Laser toning', 'Laser Pico', 'Điều trị nếp nhăn', 'Săn chắc da',
      'Thẩm mỹ Hàn Quốc', 'Du lịch y tế Hàn Quốc', 'Phòng khám thẩm mỹ Seoul',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'Nâng cơ bằng sóng siêu âm hội tụ cường độ cao được FDA phê duyệt' },
      { alternateName: ['Thermage FLX'], description: 'Nâng cơ bằng sóng RF cao cấp thế hệ thứ 4' },
      { alternateName: ['Căng chỉ APTOS'], description: 'Căng chỉ PDO/PCL được chứng nhận toàn cầu' },
      { alternateName: ['Botox'], description: 'Điều trị nếp nhăn và tạo đường nét khuôn mặt' },
      { alternateName: ['Filler'], description: 'Tăng thể tích và cải thiện đường nét' },
      { alternateName: ['Skin Booster'], description: 'Cấp ẩm và cải thiện độ đàn hồi cho da' },
      { alternateName: ['Laser Toning'], description: 'Điều trị sắc tố và cải thiện tông da' },
      { alternateName: ['Laser Pico'], description: 'Xóa nám, đốm nâu và hình xăm' },
    ],
    reservationWord: 'Đặt lịch tư vấn',
    physicianOccupation: 'Bác sĩ chuyên khoa Phẫu thuật Thẩm mỹ',
    physicianExpertise: [
      'Nâng cơ HIFU',
      'Nâng cơ RF',
      'Trẻ hóa không phẫu thuật',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  th: {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      'สมาคมแพทย์ศัลยกรรมตกแต่งแห่งเกาหลี',
      'สมาคมศัลยแพทย์ตกแต่งและศัลยกรรมแห่งเกาหลี',
      'สมาคมศัลยกรรมตกแต่งความงามแห่งเกาหลี',
      'สมาคมศัลยกรรมตกแต่งแบบบาดเจ็บน้อย (MIPS)',
    ],
    credentials: [
      'การรับรองเครื่องแท้ Ultherapy Prime',
      'การรับรองพันธมิตร Thermage FLX',
      'การรับรองอย่างเป็นทางการจาก APTOS (KR0062025)',
    ],
    knowsAbout: [
      'ยกกระชับ HIFU', 'ยกกระชับ RF', 'ชะลอวัยแบบไม่ผ่าตัด',
      'Ultherapy Prime', 'Thermage FLX', 'โบท็อกซ์', 'ฟิลเลอร์', 'สกินบูสเตอร์',
      'ร้อยไหม', 'เลเซอร์โทนนิ่ง', 'พิโคเลเซอร์', 'รักษาริ้วรอย', 'กระชับผิว',
      'คลินิกความงามเกาหลี', 'ท่องเที่ยวเชิงการแพทย์เกาหลี', 'คลินิกความงามโซล',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'การยกกระชับด้วยคลื่นอัลตราซาวด์โฟกัสความเข้มสูงที่ได้รับการรับรองจาก FDA' },
      { alternateName: ['Thermage FLX'], description: 'การยกกระชับด้วยคลื่นวิทยุ RF ระดับพรีเมียม เจเนอเรชันที่ 4' },
      { alternateName: ['ร้อยไหม APTOS'], description: 'การร้อยไหม PDO/PCL ที่ได้รับการรับรองระดับสากล' },
      { alternateName: ['โบท็อกซ์'], description: 'การรักษาริ้วรอยและปรับรูปหน้า' },
      { alternateName: ['ฟิลเลอร์'], description: 'เพิ่มวอลุ่มและปรับรูปหน้า' },
      { alternateName: ['สกินบูสเตอร์'], description: 'เพิ่มความชุ่มชื้นและความยืดหยุ่นของผิว' },
      { alternateName: ['เลเซอร์โทนนิ่ง'], description: 'รักษาเม็ดสีและปรับสีผิวให้สม่ำเสมอ' },
      { alternateName: ['พิโคเลเซอร์'], description: 'กำจัดฝ้า จุดด่างดำ และรอยสัก' },
    ],
    reservationWord: 'จองคิวปรึกษา',
    physicianOccupation: 'แพทย์เฉพาะทางศัลยกรรมตกแต่ง',
    physicianExpertise: [
      'ยกกระชับ HIFU',
      'ยกกระชับ RF',
      'ชะลอวัยแบบไม่ผ่าตัด',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  ru: {
    address: { ...ROMANIZED_ADDRESS },
    societies: [
      'Корейская ассоциация пластических хирургов',
      'Корейское общество пластических и реконструктивных хирургов',
      'Корейское общество эстетической пластической хирургии',
      'Общество минимально инвазивной пластической хирургии (MIPS)',
    ],
    credentials: [
      'Сертификат подлинности Ultherapy Prime',
      'Партнёрский сертификат Thermage FLX',
      'Официальный сертификат APTOS (KR0062025)',
    ],
    knowsAbout: [
      'HIFU-лифтинг', 'RF-лифтинг', 'безоперационное омоложение',
      'Ultherapy Prime', 'Thermage FLX', 'ботокс', 'филлеры', 'скинбустеры',
      'нитевой лифтинг', 'лазерный тонинг', 'пикосекундный лазер', 'коррекция морщин', 'подтяжка кожи',
      'корейская эстетическая клиника', 'медицинский туризм в Корее', 'эстетическая клиника в Сеуле',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'Лифтинг сфокусированным ультразвуком высокой интенсивности, одобренный FDA' },
      { alternateName: ['Thermage FLX'], description: 'Премиальный RF-лифтинг 4-го поколения' },
      { alternateName: ['Нитевой лифтинг APTOS'], description: 'Нитевой лифтинг PDO/PCL с международной сертификацией' },
      { alternateName: ['Ботокс'], description: 'Коррекция морщин и контуров лица' },
      { alternateName: ['Филлер'], description: 'Восполнение объёма и коррекция контуров' },
      { alternateName: ['Скинбустер'], description: 'Увлажнение кожи и повышение упругости' },
      { alternateName: ['Лазерный тонинг'], description: 'Лечение пигментации и выравнивание тона кожи' },
      { alternateName: ['Пикосекундный лазер'], description: 'Удаление мелазмы, пигментных пятен и татуировок' },
    ],
    reservationWord: 'Запись на консультацию',
    physicianOccupation: 'Врач — специалист по пластической хирургии',
    physicianExpertise: [
      'HIFU-лифтинг',
      'RF-лифтинг',
      'безоперационное омоложение',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  fr: {
    address: { ...ROMANIZED_ADDRESS },
    // messages/fr.json → sections.doctor.credentialsList currently publishes the
    // society names in English; reused verbatim so the JSON-LD matches the page.
    societies: [
      'Korean Association of Plastic Surgeons',
      'Korean Society of Plastic and Reconstructive Surgeons',
      'Korean Society of Aesthetic Plastic Surgery',
      'Society of Minimally Invasive Plastic Surgery (MIPS)',
    ],
    credentials: [
      'Certification d’authenticité Ultherapy Prime',
      'Certification partenaire Thermage FLX',
      'Certification officielle APTOS (KR0062025)',
    ],
    knowsAbout: [
      'Lifting HIFU', 'Lifting par radiofréquence', 'Anti-âge non chirurgical',
      'Ultherapy Prime', 'Thermage FLX', 'Botox', 'Fillers', 'Skin boosters',
      'Fils tenseurs', 'Laser toning', 'Laser Pico', 'Traitement des rides', 'Raffermissement cutané',
      'Clinique esthétique coréenne', 'Tourisme médical en Corée', 'Clinique esthétique à Séoul',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'Lifting par ultrasons focalisés de haute intensité approuvé par la FDA' },
      { alternateName: ['Thermage FLX'], description: 'Lifting par radiofréquence premium de 4e génération' },
      { alternateName: ['Fils tenseurs APTOS'], description: 'Lifting par fils PDO/PCL certifiés à l’international' },
      { alternateName: ['Botox'], description: 'Traitement des rides et du contour du visage' },
      { alternateName: ['Filler'], description: 'Restauration du volume et du contour' },
      { alternateName: ['Skin booster'], description: 'Hydratation de la peau et amélioration de l’élasticité' },
      { alternateName: ['Laser toning'], description: 'Traitement de la pigmentation et amélioration du teint' },
      { alternateName: ['Laser Pico'], description: 'Élimination du mélasma, des taches et des tatouages' },
    ],
    reservationWord: 'Prise de rendez-vous',
    physicianOccupation: 'Médecin spécialiste en chirurgie plastique',
    physicianExpertise: [
      'Lifting HIFU',
      'Lifting par radiofréquence',
      'Anti-âge non chirurgical',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  mn: {
    address: { ...ROMANIZED_ADDRESS },
    // messages/mn.json → sections.doctor.credentialsList currently publishes the
    // society names in English; reused verbatim so the JSON-LD matches the page.
    societies: [
      'Korean Association of Plastic Surgeons',
      'Korean Society of Plastic and Reconstructive Surgeons',
      'Korean Society of Aesthetic Plastic Surgery',
      'Society of Minimally Invasive Plastic Surgery (MIPS)',
    ],
    credentials: [
      'Ultherapy Prime жинхэнэ бүтээгдэхүүний баталгаа',
      'Thermage FLX түншийн баталгаа',
      'APTOS албан ёсны баталгаа (KR0062025)',
    ],
    knowsAbout: [
      'HIFU лифтинг', 'RF лифтинг', 'мэс заслын бус залуужуулалт',
      'Ultherapy Prime', 'Thermage FLX', 'Ботокс', 'Филлер', 'Скин бустер',
      'Утсан лифтинг', 'Лазер тонинг', 'Пико лазер', 'Үрчлээ засах', 'Арьс чангаруулах',
      'Солонгосын гоо заслын эмнэлэг', 'Солонгос дахь эмчилгээний аялал', 'Сөүл дэх гоо заслын эмнэлэг',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'FDA-гийн зөвшөөрсөн өндөр эрчимтэй фокуслосон хэт авиан лифтинг' },
      { alternateName: ['Thermage FLX'], description: '4-р үеийн премиум RF лифтинг' },
      { alternateName: ['APTOS утсан лифтинг'], description: 'Олон улсын баталгаатай PDO/PCL утсан лифтинг' },
      { alternateName: ['Ботокс'], description: 'Үрчлээ засах, нүүрний хэлбэр тодруулах' },
      { alternateName: ['Филлер'], description: 'Эзэлхүүн нэмэх, хэлбэр сайжруулах' },
      { alternateName: ['Скин бустер'], description: 'Арьсны чийгшил, уян хатан чанарыг сайжруулах' },
      { alternateName: ['Лазер тонинг'], description: 'Пигмент эмчилгээ, арьсны өнгө жигдрүүлэх' },
      { alternateName: ['Пико лазер'], description: 'Сэвх, толбо, шивээс арилгах' },
    ],
    reservationWord: 'Зөвлөгөө захиалах',
    physicianOccupation: 'Гоо заслын мэс заслын нарийн мэргэжлийн эмч',
    physicianExpertise: [
      'HIFU лифтинг',
      'RF лифтинг',
      'мэс заслын бус залуужуулалт',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },

  ar: {
    address: { ...ROMANIZED_ADDRESS },
    // messages/ar.json → sections.doctor.credentialsList currently publishes the
    // society names in English; reused verbatim so the JSON-LD matches the page.
    societies: [
      'Korean Association of Plastic Surgeons',
      'Korean Society of Plastic and Reconstructive Surgeons',
      'Korean Society of Aesthetic Plastic Surgery',
      'Society of Minimally Invasive Plastic Surgery (MIPS)',
    ],
    credentials: [
      'شهادة أصالة جهاز Ultherapy Prime',
      'شهادة شريك Thermage FLX',
      'شهادة APTOS الرسمية (KR0062025)',
    ],
    knowsAbout: [
      'شد بتقنية هايفو', 'شد بالترددات الراديوية', 'مكافحة الشيخوخة بدون جراحة',
      'Ultherapy Prime', 'Thermage FLX', 'بوتوكس', 'فيلر', 'حقن نضارة البشرة',
      'خيوط شد الوجه', 'تفتيح بالليزر', 'ليزر بيكو', 'علاج التجاعيد', 'شد البشرة',
      'عيادة تجميل كورية', 'السياحة العلاجية في كوريا', 'عيادة تجميل في سيول',
    ],
    services: [
      { alternateName: ['Ultherapy Prime'], description: 'شد بالموجات فوق الصوتية المركزة عالية الكثافة معتمد من إدارة الغذاء والدواء الأمريكية (FDA)' },
      { alternateName: ['Thermage FLX'], description: 'شد بالترددات الراديوية من الجيل الرابع بمستوى بريميوم' },
      { alternateName: ['خيوط APTOS'], description: 'شد بالخيوط PDO/PCL المعتمدة عالميًا' },
      { alternateName: ['بوتوكس'], description: 'علاج التجاعيد ونحت ملامح الوجه' },
      { alternateName: ['فيلر'], description: 'تعزيز الحجم وتحسين الملامح' },
      { alternateName: ['حقن نضارة البشرة'], description: 'ترطيب البشرة وتحسين مرونتها' },
      { alternateName: ['تفتيح بالليزر'], description: 'علاج التصبغات وتحسين لون البشرة' },
      { alternateName: ['ليزر بيكو'], description: 'إزالة الكلف والبقع والوشوم' },
    ],
    reservationWord: 'حجز استشارة',
    physicianOccupation: 'طبيب متخصص في الجراحة التجميلية',
    physicianExpertise: [
      'شد بتقنية هايفو',
      'شد بالترددات الراديوية',
      'مكافحة الشيخوخة بدون جراحة',
      'Ultherapy Prime',
      'Thermage FLX',
    ],
  },
};

/**
 * JSON-LD locale data for a locale.
 *
 * An absent locale falls back to `en`, never `ko` — a missing entry must not be
 * able to ship Korean structured data to a foreign visitor. `undefined` still
 * means "Korean" so legacy call sites that never threaded a locale through keep
 * their historical output byte-for-byte.
 */
function getSchemaL10n(locale?: string): SchemaL10n {
  if (!locale) return SCHEMA_L10N.ko;
  return SCHEMA_L10N[locale] ?? SCHEMA_L10N.en;
}

/** PostalAddress node — Korean address for ko, romanized for every other locale. */
function buildPostalAddress(locale?: string) {
  const { streetAddress, addressLocality, addressRegion } = getSchemaL10n(locale).address;
  return {
    '@type': 'PostalAddress',
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode: SITE_INFO.postalCode,
    addressCountry: 'KR',
  };
}

// Generate metadata for a page
export function generatePageMetadata({
  locale,
  title,
  description,
  keywords,
  path = '',
  images = [],
}: {
  locale: string;
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  // Unknown locale → en, never ko: a locale without its own entry must not ship
  // a Korean <title>/description/keywords to a foreign visitor.
  const config = seoConfig[locale] || seoConfig.en;
  const pageTitle = title || config.title;
  const pageDescription = description || config.description;
  const pageKeywords = keywords || config.keywords;
  const url = `${BASE_URL}/${locale}${path}`;
  const siteName = getSiteName(locale);

  const defaultImage = {
    url: `${BASE_URL}/images/og-image.jpg`,
    width: 1200,
    height: 800, // matches the actual og-image.jpg pixel dimensions
    alt: siteName,
  };

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords.join(', '),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: buildHreflangMap(path),
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName,
      locale: LOCALE_META[locale as Locale]?.ogLocale ?? 'en_US',
      type: 'website',
      images: images.length > 0 ? images : [defaultImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: images.length > 0 ? images.map(img => img.url) : [defaultImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Site verification lives in a single source of truth: the hardcoded
    // <meta> tags in [locale]/layout.tsx head. NEXT_PUBLIC_GOOGLE_VERIFICATION
    // is unset, so an env-based verification field here would only emit an
    // empty duplicate — omitted to avoid the duplication.
  };
}

// Schema.org structured data for LocalBusiness (확장된 버전 - E-E-A-T 강화 + 다국어)
export function generateLocalBusinessSchema(locale: string = 'ko') {
  // 다국어 설명 — locale별 seoConfig.description 사용, 미정의 시 en fallback
  const description = seoConfig[locale]?.description ?? seoConfig.en.description;

  // 다국어 병원명 — 11개 locale 모두 매핑 (i18n-glossary 합의)
  const name = CLINIC_NAME_BY_LOCALE[locale] ?? 'LIV Plastic Surgery';

  // 주소·학회·인증·키워드·시술 설명 등 사람이 읽는 값은 전부 locale별 매핑에서 가져온다.
  const l10n = getSchemaL10n(locale);

  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'MedicalOrganization'],
    '@id': `${BASE_URL}/#organization`,
    name,
    alternateName: buildAlternateNames(locale, name),
    description,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/og-image.jpg`,
    telephone: SITE_INFO.phone,
    email: SITE_INFO.email,
    address: buildPostalAddress(locale),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_INFO.coordinates.lat,
      longitude: SITE_INFO.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    priceRange: '$$$$',
    currenciesAccepted: 'KRW',
    paymentAccepted: 'Cash, Credit Card',
    areaServed: {
      '@type': 'City',
      name: 'Seoul',
    },
    sameAs: [
      'https://www.instagram.com/livps_official/',
      'https://blog.naver.com/liv_clinic',
      'https://pf.kakao.com/_hgFwn',
    ],
    medicalSpecialty: [
      'Dermatology',
      'Plastic Surgery',
      'Anti-aging Medicine',
    ],

    // 학회 소속 (권위 신호 강화) — 학회명은 locale별 매핑에서 (SCHEMA_L10N.societies)
    memberOf: MEMBER_SOCIETIES.map((society, i) => ({
      '@type': 'Organization',
      name: l10n.societies[i],
      ...(society.url ? { url: society.url } : {}),
    })),

    // 장비 인증 (신뢰도 강화) — 인증명은 locale별, 발급 기관명(법인명)은 원문 유지
    hasCredential: EQUIPMENT_CREDENTIALS.map((credential, i) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: l10n.credentials[i],
      issuedBy: {
        '@type': 'Organization',
        name: credential.issuer,
        url: credential.issuerUrl,
      },
    })),

    // AI가 인식할 전문 분야 키워드 (locale별 단일 언어)
    knowsAbout: l10n.knowsAbout,

    availableService: SERVICE_BASE.map((service, i) => ({
      '@type': 'MedicalProcedure',
      name: service.name,
      alternateName: l10n.services[i].alternateName,
      procedureType: 'NoninvasiveProcedure',
      description: l10n.services[i].description,
    })),

    // AI 커머스 대비: 예약 액션
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/contact`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: l10n.reservationWord,
      },
    },
  };
}

// Schema.org structured data for FAQ
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Schema.org structured data for Medical Procedure
export function generateMedicalProcedureSchema(
  treatment: {
    name: string;
    nameEn: string;
    description: string;
    duration: string;
  },
  opts?: { locale?: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.name,
    alternateName: treatment.nameEn,
    description: treatment.description,
    procedureType: 'NoninvasiveProcedure',
    howPerformed: treatment.description,
    preparation: '마취 크림 도포 (필요시)',
    followup: '시술 후 관리 안내',
    status: 'ActiveActionStatus',
    bodyLocation: 'Face',
    provider: {
      '@type': 'MedicalBusiness',
      name: getSiteName(opts?.locale),
      url: BASE_URL,
    },
  };
}

// Schema.org structured data for BreadcrumbList
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

// ============================================
// SEO/AEO/GEO 최적화 스키마 (2025 트렌드 대응)
// ============================================

// 의료진 타입 정의
interface PhysicianData {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  specialty: string;
  philosophy?: string;
  image?: string;
  education: string[];
  experience: string[];
  certifications: string[];
  specialties: string[];
  publications?: {
    type: string;
    title: string;
    authors?: string;
    journal?: string;
    year: number;
    details?: string;
    institution?: string;
    degree?: string;
  }[];
  presentations?: {
    title: string;
    conference: string;
    year: number;
    type: string;
  }[];
}

// Schema.org Physician 스키마 (E-E-A-T 신호 강화)
export function generatePhysicianSchema(doctor: PhysicianData, opts?: { locale?: string }) {
  const l10n = getSchemaL10n(opts?.locale);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${BASE_URL}/about/staff#${doctor.id}`,
    name: doctor.name,
    alternateName: doctor.nameEn,
    image: doctor.image ? `${BASE_URL}${doctor.image}` : undefined,
    jobTitle: doctor.title,
    description: doctor.philosophy,
    medicalSpecialty: ['Plastic Surgery', 'Dermatology', 'Anti-aging Medicine'],

    // 근무지 주소 (Google Rich Results 요구사항)
    address: buildPostalAddress(opts?.locale),

    // 소속 병원 연결
    worksFor: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
      name: getSiteName(opts?.locale),
    },

    // 학력
    alumniOf: doctor.education.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu,
    })),

    // 자격증/인증
    hasCredential: doctor.certifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'professional',
      name: cert,
    })),

    // 전문 분야 (AI가 인식할 수 있는 키워드) — 병원 공통 전문 분야는 locale별 매핑에서
    knowsAbout: [
      ...doctor.specialties,
      ...l10n.physicianExpertise,
    ],

    // 경력 사항
    hasOccupation: {
      '@type': 'Occupation',
      name: l10n.physicianOccupation,
      occupationalCategory: 'Physician',
      description: doctor.experience.join(', '),
    },
  };

  // SCI 논문이 있는 경우 학술 활동 추가
  if (doctor.publications && doctor.publications.length > 0) {
    const sciPublications = doctor.publications.filter(p => p.type === 'sci');
    if (sciPublications.length > 0) {
      schema.performerIn = sciPublications.map(pub => ({
        '@type': 'ScholarlyArticle',
        headline: pub.title,
        author: pub.authors?.split(',').map(author => ({
          '@type': 'Person',
          name: author.trim(),
        })),
        datePublished: pub.year.toString(),
        publisher: {
          '@type': 'Organization',
          name: pub.journal,
        },
        about: {
          '@type': 'MedicalProcedure',
          procedureType: 'NoninvasiveProcedure',
        },
      }));
    }
  }

  return schema;
}

// 학술 논문 스키마 (개별 논문용)
export function generateScholarlyArticleSchema(publication: {
  title: string;
  authors: string;
  journal: string;
  year: number;
  details?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: publication.title,
    author: publication.authors.split(',').map(author => ({
      '@type': 'Person',
      name: author.trim(),
    })),
    datePublished: publication.year.toString(),
    publisher: {
      '@type': 'Organization',
      name: publication.journal,
    },
    isPartOf: {
      '@type': 'Periodical',
      name: publication.journal,
    },
    about: {
      '@type': 'MedicalEntity',
      name: 'Aesthetic Medicine',
    },
  };
}

// WebSite 스키마 (검색 액션 포함 - AI 검색 최적화)
export function generateWebSiteSchema(locale?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: getSiteName(locale),
    alternateName: SITE_INFO.nameEn,
    url: BASE_URL,
    // locale별 설명. locale 미지정(레거시 호출부)은 기존대로 ko, 미정의 locale은 en.
    description: locale
      ? (seoConfig[locale]?.description ?? seoConfig.en.description)
      : seoConfig.ko.description,
    inLanguage: [
      'ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW', 'vi-VN', 'th-TH', 'ru-RU',
      'fr-FR', 'mn-MN', 'ar',
    ],
    publisher: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
    },
    // AI 검색 액션 지원
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/medical?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// WebPage 스키마 (AI 오버뷰 최적화)
export function generateWebPageSchema(page: {
  path: string;
  title: string;
  description: string;
  locale: string;
  type?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: { name: string; url: string }[];
  // ProfilePage용 mainEntity (의료진 등 프로필 페이지에서 사용)
  mainEntity?: { '@id': string }[];
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': page.type || 'WebPage',
    '@id': `${BASE_URL}/${page.locale}${page.path}`,
    name: page.title,
    description: page.description,
    url: `${BASE_URL}/${page.locale}${page.path}`,
    datePublished: page.datePublished || '2024-01-01',
    dateModified: page.dateModified || new Date().toISOString().split('T')[0],
    inLanguage: LOCALE_META[page.locale as Locale]?.hreflang ?? 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    },
    breadcrumb: page.breadcrumbs ? {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${BASE_URL}${item.url}`,
      })),
    } : undefined,
    // 음성검색 최적화 (Speakable)
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.hero-title', '.main-description', '.short-answer', '.faq-answer'],
    },
  };

  // ProfilePage 타입일 때 mainEntity 추가 (Google Rich Results 요구사항)
  if (page.type === 'ProfilePage' && page.mainEntity && page.mainEntity.length > 0) {
    schema.mainEntity = page.mainEntity;
  }

  return schema;
}

// 음성검색 최적화 FAQ 스키마 (shortAnswer + questionVariants 지원)
interface VoiceOptimizedQA {
  id: string;
  category: string;
  question: string;
  questionVariants?: string[];
  shortAnswer: string;
  answer: string;
  relatedTreatments: string[];
  tags: string[];
}

export function generateVoiceOptimizedFAQSchema(
  faqs: VoiceOptimizedQA[],
  opts?: { name?: string; description?: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${BASE_URL}/medical#faq`,
    name: opts?.name ?? '리브성형외과 의료정보 Q&A',
    description: opts?.description ?? '울쎄라, 써마지, 보톡스, 필러 등 미용 시술에 대한 자주 묻는 질문과 답변',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      // 질문 변형 (음성검색 다양한 패턴 지원)
      alternateName: faq.questionVariants,
      acceptedAnswer: {
        '@type': 'Answer',
        // 음성검색용 짧은 답변 + 상세 답변
        text: `${faq.shortAnswer} ${faq.answer}`,
        // Speakable 지정 (AI가 읽어줄 부분)
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: '.short-answer',
        },
      },
      // 관련 시술 연결
      about: faq.relatedTreatments.length > 0 ? faq.relatedTreatments.map(treatment => ({
        '@type': 'MedicalProcedure',
        name: treatment,
      })) : undefined,
    })),
    // FAQ 페이지 전체에 대한 Speakable
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.short-answer', '.faq-question'],
    },
  };
}

// 시술별 MedicalService 스키마 (AI 커머스 대비 - ReserveAction 포함)
interface TreatmentData {
  id: string;
  category: string;
  name: string;
  nameEn: string;
  description: string;
  shortDesc?: string;
  duration: string;
  anesthesia?: string;
  recovery?: string;
  targetAreas?: readonly string[];
  benefits?: readonly { readonly title: string; readonly desc: string }[];
  faqs?: readonly { readonly q: string; readonly a: string }[];
}

export function generateMedicalServiceSchema(
  treatment: TreatmentData,
  opts?: { reservationWord?: string; locale?: string },
) {
  const reservationWord = opts?.reservationWord ?? '상담 예약';
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    '@id': `${BASE_URL}/${treatment.category}/${treatment.id}`,
    name: treatment.name,
    alternateName: treatment.nameEn,
    description: treatment.description,
    procedureType: 'NoninvasiveProcedure',
    howPerformed: treatment.description,
    preparation: treatment.anesthesia || '마취 크림 도포 (필요시)',
    followup: treatment.recovery || '시술 후 관리 안내',
    bodyLocation: treatment.targetAreas?.join(', ') || 'Face',

    // 비용은 상담 후 결정 — MonetaryAmount.value에 비수치 문자열을 넣으면
    // 스키마 위반이므로 통화만 명시하고 value는 생략한다.
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'KRW',
    },

    // 제공 기관
    provider: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
      name: getSiteName(opts?.locale),
    },

    // AI 커머스 핵심: 예약 액션
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/contact?treatment=${treatment.id}`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: `${treatment.name} ${reservationWord}`,
      },
    },

    // 관련 FAQ 연결 (음성검색 최적화)
    mainEntity: treatment.faqs?.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),

    // 시술 장점/특징
    additionalProperty: treatment.benefits?.map(benefit => ({
      '@type': 'PropertyValue',
      name: benefit.title,
      value: benefit.desc,
    })),
  };
}

// HowTo 스키마 (시술 과정 - AI 오버뷰 최적화)
interface TreatmentProcess {
  name: string;
  nameEn: string;
  description: string;
  duration: string;
  process: { step: number; title: string; desc: string }[];
}

export function generateHowToSchema(
  treatment: TreatmentProcess,
  opts?: { processWord?: string },
) {
  const processWord = opts?.processWord ?? '시술 과정';
  // duration에서 숫자만 추출 (예: "60-90분" -> "60")
  const durationMatch = treatment.duration.match(/\d+/);
  const durationMinutes = durationMatch ? durationMatch[0] : '60';

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${treatment.name} ${processWord}`,
    description: treatment.description,
    totalTime: `PT${durationMinutes}M`,
    step: treatment.process.map((step) => ({
      '@type': 'HowToStep',
      position: step.step,
      name: step.title,
      text: step.desc,
    })),
    tool: [{
      '@type': 'HowToTool',
      name: treatment.nameEn,
    }],
    // 제공 기관
    performer: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
    },
  };
}

// 통합 스키마 생성 유틸리티 (페이지별로 필요한 스키마 조합)
export function generatePageSchemas(options: {
  locale?: string;
  includeOrganization?: boolean;
  includeWebSite?: boolean;
  physician?: PhysicianData;
  treatment?: TreatmentData;
  treatmentProcess?: TreatmentProcess;
  faqs?: VoiceOptimizedQA[];
  webPage?: Parameters<typeof generateWebPageSchema>[0];
}) {
  const schemas: object[] = [];

  if (options.includeOrganization) {
    schemas.push(generateLocalBusinessSchema(options.locale));
  }

  if (options.includeWebSite) {
    schemas.push(generateWebSiteSchema(options.locale));
  }

  if (options.physician) {
    schemas.push(generatePhysicianSchema(options.physician, { locale: options.locale }));
  }

  if (options.treatment) {
    schemas.push(generateMedicalServiceSchema(options.treatment, { locale: options.locale }));
  }

  if (options.treatmentProcess) {
    schemas.push(generateHowToSchema(options.treatmentProcess));
  }

  if (options.faqs && options.faqs.length > 0) {
    schemas.push(generateVoiceOptimizedFAQSchema(options.faqs));
  }

  if (options.webPage) {
    schemas.push(generateWebPageSchema(options.webPage));
  }

  return schemas;
}

// ============================================
// 환자 후기 집계 스키마 (AggregateRating + Review)
// ============================================

/** 집계 스키마에 필요한 최소 후기 필드 (온사이트·게시 후기만 전달할 것). */
interface OnsiteReviewInput {
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}

/**
 * MedicalBusiness AggregateRating 스키마 (온사이트·게시 후기 전용).
 *
 * 정책(하드): 온사이트·게시 후기가 3개 미만이면 `null`을 반환하여 별점 스키마를
 * 아예 방출하지 않는다. `@id`는 generateLocalBusinessSchema와 동일한
 * `${BASE_URL}/#organization`을 사용하여 동일 엔티티로 병합되게 한다.
 *
 * - ratingValue: 전달된 모든 온사이트·게시 후기 평균(소수 1자리)
 * - reviewCount: 온사이트·게시 후기 총 개수
 * - review: 가장 최근 3개 (reviewBody는 약 200자로 절삭)
 */
export function generateReviewsAggregateSchema(
  onsitePublished: OnsiteReviewInput[],
  locale: string,
) {
  if (onsitePublished.length < 3) return null;

  const name = CLINIC_NAME_BY_LOCALE[locale] ?? SITE_INFO.name;

  const count = onsitePublished.length;
  // (user-submitted strings flow into this schema — serialize with safeJsonLd)
  const average = onsitePublished.reduce((sum, review) => sum + review.rating, 0) / count;
  const ratingValue = Math.round(average * 10) / 10;

  const mostRecent = [...onsitePublished]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${BASE_URL}/#organization`,
    name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    },
    review: mostRecent.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author_name,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody:
        review.content.length > 200 ? `${review.content.slice(0, 200)}…` : review.content,
      datePublished: review.created_at.slice(0, 10),
    })),
  };
}

/**
 * Serialize a JSON-LD object for <script> injection.
 * Escapes `<` (blocks `</script>` breakout from user-submitted strings)
 * and U+2028/U+2029 (invalid in inline JS).
 */
export function safeJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
