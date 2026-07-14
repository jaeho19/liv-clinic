/**
 * Japanese overrides for Media & News (base: src/lib/data/mediaNewsData.ts).
 *
 * Outlet names keep each publication's own Latin rendering so the source stays
 * identifiable (Hi News · Medical Aesthetic · Issuemaker · Hemophilia Life ·
 * Medical Today · SBS Good Morning). Unlike en.ts, `badge` must be overridden
 * here because the base badges are Latin/Korean-facing labels.
 */
import type { MediaNewsLocaleMap } from './types';

export const JA: MediaNewsLocaleMap = {
  // ── mediaNewsData ──
  '17': {
    badge: '学術',
    source: 'LIVニュース',
    title:
      'キム・スヨン代表院長、グローバルリフティング専門家カンファレンスAXA（Aptos Expert Alliance）に招待され発表',
    description:
      'リブ形成外科のキム・スヨン代表院長が、グローバル糸リフティングブランドAPTOSが主催した専門家カンファレンスAXA（Aptos Expert Alliance）に招待され、発表を成功裏に終えました。',
    body: [
      'こんにちは。リブ形成外科です。',
      '2026年6月20日、リブ形成外科のキム・スヨン代表院長が、グローバル糸リフティングブランドAPTOSが主催した専門家カンファレンスAXA（Aptos Expert Alliance）に招待され、発表を成功裏に終えました。',
      'AXA（Aptos Expert Alliance）は、世界各国のAPTOSマスターおよび専門家が最新の臨床経験と施術ノウハウを共有する国際学術フォーラムであり、グローバルなリフティング分野の最新の知見とさまざまな臨床症例を分かち合う権威ある学術行事です。',
      'キム・スヨン代表院長はAPTOS International Trainer（国際公式トレーナー）の資格を保有しており、今回の発表ではリブ形成外科のさまざまな臨床症例と糸リフティングのノウハウを共有し、参加した医療陣と有意義な学術交流の時間を持ちました。',
      'リブ形成外科は今後も国内にとどまらず世界の医療陣との学術交流を続け、絶え間ない研究と臨床経験をもとに、より安全で精緻なプレミアム・アンチエイジング医療サービスを提供できるよう最善を尽くしてまいります。',
      'ありがとうございます。',
    ],
  },
  '16': {
    badge: 'メディア取材',
    source: 'Medical Aesthetic',
    title: 'キム・スヨン代表院長、APTOS Bio-Lifting 臨床インタビューに参加',
    description:
      'リブ形成外科のキム・スヨン代表院長が、美容医学専門メディア『Medical Aesthetic』のAPTOS Bio-Liftingインタビューに参加しました。今回の記事は、APTOS公式トレーナーとして認証を受けた韓国の医療陣が実際の臨床現場でAPTOSをどのように活用しているかを取り上げた内容で、キム・スヨン代表院長は顔の構造と組織の状態を考慮した精密なリフティングデザイン、自然な変化、患者一人ひとりに合わせたBio-Liftingアプローチの重要性を伝えました。',
    body: [
      'リブ形成外科のキム・スヨン代表院長が、美容医学専門メディア『Medical Aesthetic』の記事「APTOS Bio-Liftingは韓国の臨床現場でどのように活用されているか」に参加しました。',
      '今回の記事は、グローバル糸リフティングブランドAPTOSが韓国市場で公式トレーナーを中心とした学術活動を拡大している流れを取り上げ、APTOSを単にたるんだ組織を引き上げる糸リフティング製品ではなく、顔の構造と組織の状態に応じて精緻なvector designが必要となるBio-Lifting施術プラットフォームとして紹介しました。',
      'キム・スヨン代表院長はAPTOS公式トレーナーとして、製品ごとの構造と適応、組織の状態に応じたデザイン、施術のplaneとfixation pointの重要性を強調しました。特にAPTOS Bio-Liftingは、単なる物理的なリフティングを超えて、患者一人ひとりの老化の様相と顔の構造を考慮し、必要な部位に組織の支持とリフティングの方向を設計するアプローチであるという点で、リブ形成外科のSlow Aging哲学と通じ合っています。',
      'リブ形成外科は、過度な変化よりも自然で洗練された改善を目指しています。キム・スヨン代表院長はインタビューを通じて、韓国の患者は最近、過矯正や不自然な結果よりも、フェイスラインの整え、中顔面と下顔面の安定した改善、自然な回復の過程を重視していると説明しました。これは、リブ形成外科が追求する節度あるアンチエイジング、精密なリフティング、個人に合わせた診療の方向とも一致します。',
      'また、APTOSは単独のリフティング施術だけでなく、肌の弾力、ボリュームの低下、フェイスラインの変化など患者の状態に応じて、エネルギーベースの機器、スキンブースター、フィラー、ボツリヌストキシンなどと併用して活用できる施術として紹介されました。リブ形成外科は、顔の構造的な支持とvector correctionを中心に、肌の質感やボリューム、表情筋のコントロールも併せて考慮する統合的なアンチエイジングのアプローチを続けています。',
      '今回のインタビューは、キム・スヨン代表院長がAPTOS公式トレーナーとして、国内外の患者により安全で再現性のあるリフティング施術を提供するために、学術的な教育と臨床経験を継続的に広げていることを示す事例です。',
    ],
  },
  '15': {
    badge: 'メディア取材',
    source: 'Medical Aesthetic',
    title: 'キム・スヨン代表院長、「Medical Aesthetic」インタビューを実施',
    description:
      'キム・スヨン代表院長が、美容形成・医療機器の専門メディア「Medical Aesthetic」と公式インタビューを行いました。リブが目指すSlow Aging哲学と、グローバルリフティングブランドAPTOSの施術、部位別のオーダーメイド・アルゴリズムに関する医学的な知見を伝えました。',
    body: [
      'こんにちは、リブ形成外科です。',
      '先ごろ、リブ形成外科のキム・スヨン代表院長が、美容形成および医療機器分野で信頼される報道機関「Medical Aesthetic」と公式インタビューおよび記事撮影を行いました。',
      '国内外の美容形成市場のトレンドを牽引する医療陣に注目する今回のインタビューで、キム・スヨン代表院長は、リブ形成外科が目指す「Slow Aging（スロー・エイジング）」哲学とともに、近ごろメディカル業界で最も注目されているグローバルリフティングブランド「APTOS」の施術について、踏み込んだ医学的な知見を伝えました。',
      '特にAPTOS本社の公式トレーナー（International Trainer）資格を保有するキム院長は、APTOS独自の卓越した技術力が、リブ形成外科の解剖学的な層別アプローチである「Site-specific algorithm（部位別オーダーメイド・アルゴリズム）」と出会ったときに発揮されるシナジー効果を、掘り下げて説明しました。人為的に引っ張るのではなく、組織のたるみを解剖学的に正確に再配置し、本来の立体感と優雅さを引き出すリブならではの高難度の糸リフティングのノウハウは、現場の取材チームから大きな関心と感嘆を集めました。',
      'グローバルブランドと医療美容の専門家がまず深い信頼を寄せ、注目するリブ形成外科。今後も世界水準として認められた精密な技術力と絶え間ない学術研究をもとに、国境を越えてリブを訪れてくださるすべての方に、安全で他にはないプレミアム・アンチエイジングの基準を示してまいります。',
      '本インタビューの詳しい全文は、今後の公式記事の掲載に合わせて改めて共有いたします。',
      'ありがとうございます。',
    ],
  },
  '1': {
    badge: 'グローバルトレーナー',
    source: 'Hi News',
    title: 'APTOS公式トレーナー認定',
    description:
      'リブ形成外科のキム・スヨン代表院長が、グローバル糸リフティングブランドAPTOSの本社公式トレーナー、International Trainerの資格を取得しました。臨床経験と施術の習熟度をもとに、リフティング施術における専門性が認められた事例です。',
  },
  '2': {
    badge: '放送出演',
    title: 'SBS Good Morning 出演',
    description:
      '肌の弾力、生活習慣による老化、コラーゲンの再生に関する内容を中心に、アンチエイジングのケアについて専門家としての見解を伝えました。',
  },
  '3': {
    badge: 'グローバルプログラム',
    source: 'Issuemaker',
    title: 'APTOS International Program 報道',
    description:
      'APTOS本社に招かれた韓国代表の医療陣として紹介され、リフティング施術に関する国際プログラムに参加しました。',
  },
  '4': {
    badge: 'カバーストーリー',
    source: 'Issuemaker',
    title: 'Issuemaker カバーストーリー',
    description:
      'スローエイジングの哲学、再生施術、新沙駅への拡張に関するリブ形成外科のブランドの方向性と診療哲学が紹介されました。',
  },
  '5': {
    badge: 'ULTHERAPY PRIME',
    source: 'Hemophilia Life',
    title: 'Ultherapy-Prime 導入インタビュー',
    description:
      'Ultherapy-Primeの導入と、精密なSMASをターゲットとしたリフティングに対するリブ形成外科のアプローチを紹介しました。',
  },
  '6': {
    badge: '再生ケア',
    source: 'Medical Today',
    title: 'GRIDA メディカル・トーンマッチングシステムの紹介',
    description:
      '52種類の色調とFDA承認の色素を活用した、傷あとや色素の薄い部位の自然なトーン再建施術が紹介されました。',
  },
  '7': {
    badge: '学術',
    source: 'LIVニュース',
    title: 'キム・スヨン代表院長、Aesthetic Plastic Surgery Korea 招待講演',
    description:
      'キム・スヨン代表院長が、大韓美容形成外科学会のAesthetic Plastic Surgery Koreaにて「Site-specific algorithm for facial rejuvenation」をテーマに公式招待の口演発表を行いました。顔の解剖学的な特性に応じた精密な部位別アプローチと、リブならではの施術アルゴリズムを紹介しました。',
  },
  '8': {
    badge: 'LIVニュース',
    source: 'LIVニュース',
    title: 'APTOSグローバルトレーナー公式認定盾の授与',
    description:
      'キム・スヨン代表院長が、グローバル糸リフティングブランドAPTOSの本社公式トレーナー認定盾を授与されました。今回の認定は、国内外の医療陣の教育とリフティング施術分野における学術活動を広げる契機となりました。',
  },
  '9': {
    badge: 'LIV来院',
    source: 'LIVニュース',
    title: '俳優のシム・ヒョンタク様、リブ形成外科にご来院',
    description:
      '俳優のシム・ヒョンタク様がリブ形成外科をご訪問されました。リブは、本来の健やかさと自然な美しさを目指すSlow Agingケアの哲学をもとに、心地よい診療体験を提供します。',
  },
  '10': {
    badge: 'LIV来院',
    source: 'LIVニュース',
    title: '歌手のペ・ギソン様＆ショーホストのイ・ウンビ様ご夫妻、リブ形成外科にご来院',
    description:
      '歌手のペ・ギソン様とショーホストのイ・ウンビ様ご夫妻がリブ形成外科をご訪問されました。リブは、こつこつと続けるケアと自然なアンチエイジングを目指すオーダーメイドのケアを提供します。',
  },
  '11': {
    badge: '海外からの来院',
    source: 'LIVニュース',
    title: '中国の著名インフルエンサーの皆様、リブ形成外科にご来院',
    description:
      '中国の著名なインフルエンサーの皆様がリブ形成外科をご訪問されました。リブは、韓国のプレミアム・アンチエイジングケアと自然なSlow Agingの哲学をもとに、海外のお客様にも他にはない診療体験を提供します。',
  },
  '12': {
    badge: 'LIV来院',
    source: 'LIVニュース',
    title: 'アナウンサーのイ・ジンジュ様、リブ形成外科にご来院',
    description:
      'アナウンサーのイ・ジンジュ様がリブ形成外科をご訪問されました。リブは、本来の端正さと自然な肌の弾力を考慮したSlow Agingケアの哲学を目指しています。',
  },
  '13': {
    badge: 'インタビュー',
    source: 'Issuemaker',
    title: 'Issuemaker インタビュー',
    description:
      '東部二村洞で初となる形成外科の開院の過程と、正直な診療哲学、自然な美しさを目指すリブ形成外科の方向性が紹介されました。',
  },
  '14': {
    badge: 'メディカルコラム',
    source: 'Medical Today',
    title: 'Medical Today 超音波の強度調節インタビュー',
    description:
      '皮膚の厚さと構造に応じて、エネルギーの強度、深さ、ショットの配分を調節するオーダーメイドのリフティングアプローチについて説明しました。',
  },

  // ── featuredMediaNews (home) ──
  f9: {
    badge: '学術',
    title: 'AXA（Aptos Expert Alliance）招待発表',
    description:
      'キム・スヨン代表院長が、グローバル糸リフティングブランドAPTOS主催の専門家カンファレンスAXAに招待され、臨床症例と糸リフティングのノウハウを発表しました。',
  },
  f8: {
    badge: 'メディア取材',
    title: 'キム・スヨン代表院長、APTOS Bio-Lifting 臨床インタビューに参加',
    description:
      '美容医学専門メディア『Medical Aesthetic』のAPTOS Bio-Liftingインタビューに参加し、顔の構造と組織の状態を考慮した精密なリフティングデザインと、患者一人ひとりに合わせたBio-Liftingアプローチを伝えました。',
  },
  f7: {
    badge: 'メディア取材',
    title: '「Medical Aesthetic」インタビューを実施',
    description:
      '美容・医療機器の専門メディア「Medical Aesthetic」と公式インタビューを行い、Slow Aging哲学とグローバルリフティングAPTOSの施術に光を当てました。',
  },
  f1: {
    badge: '放送出演',
    title: 'SBS Good Morning 出演',
    description:
      '肌の弾力、生活習慣による老化、コラーゲンの再生について専門家としての見解を伝えました。',
  },
  f2: {
    badge: 'カバーストーリー',
    title: 'Issuemaker カバーストーリー',
    description:
      'スローエイジングの哲学、再生施術、新沙駅への拡張に関するリブ形成外科の方向性を紹介しました。',
  },
  f3: {
    badge: 'グローバルトレーナー',
    title: 'APTOS公式トレーナー認定',
    description:
      'キム・スヨン代表院長が、グローバル糸リフティングブランドAPTOSのInternational Trainerの資格を取得しました。',
  },
};
