/**
 * Traditional Chinese (Taiwan) overrides for Media & News
 * (base: src/lib/data/mediaNewsData.ts).
 *
 * Outlet names keep each publication's own Latin rendering so the source stays
 * identifiable (Hi News · Medical Aesthetic · Issuemaker · Hemophilia Life ·
 * Medical Today · SBS Good Morning). Korean personal names use their Latin
 * romanisation rather than invented Chinese characters. Wording follows Taiwan
 * usage (拉提 / 埋線拉提 · 超音波 · 客製化 · 演算法 · 醫療器材 · 報導).
 * Unlike en.ts, `badge` must be overridden here because the base badges are
 * Latin/Korean-facing labels.
 */
import type { MediaNewsLocaleMap } from './types';

export const ZH_TW: MediaNewsLocaleMap = {
  // ── mediaNewsData ──
  '17': {
    badge: '學術',
    source: 'LIV資訊',
    title:
      'Kim Sooyoung 代表院長受邀於全球拉提專家會議 AXA（Aptos Expert Alliance）發表演講',
    description:
      'LIV整形外科 Kim Sooyoung 代表院長受邀出席全球埋線拉提品牌 APTOS 主辦的專家會議 AXA（Aptos Expert Alliance），並圓滿完成發表。',
    body: [
      '您好，這裡是LIV整形外科。',
      '2026年6月20日，LIV整形外科 Kim Sooyoung 代表院長受邀出席全球埋線拉提品牌 APTOS 主辦的專家會議 AXA（Aptos Expert Alliance），並圓滿完成發表。',
      'AXA（Aptos Expert Alliance）是世界各國的 APTOS 大師與專家分享最新臨床經驗與療程心得的國際學術論壇，也是交流全球拉提領域最新見解與各類臨床案例的權威學術活動。',
      'Kim Sooyoung 代表院長持有 APTOS International Trainer（國際官方培訓師）資格，並在本次發表中分享了LIV整形外科的多種臨床案例與埋線拉提心得，與出席的醫療團隊進行了深具意義的學術交流。',
      'LIV整形外科今後也將持續與國內外的醫療團隊進行學術交流，以不斷的研究與臨床經驗為基礎，竭盡全力提供更安全、更精細的頂級抗老化醫療服務。',
      '謝謝。',
    ],
  },
  '16': {
    badge: '媒體採訪',
    source: 'Medical Aesthetic',
    title: 'Kim Sooyoung 代表院長參與 APTOS Bio-Lifting 臨床採訪',
    description:
      'LIV整形外科 Kim Sooyoung 代表院長參與了醫美專業媒體《Medical Aesthetic》的 APTOS Bio-Lifting 採訪。該篇報導聚焦取得 APTOS 官方培訓師認證的韓國醫師在實際臨床現場如何運用 APTOS，Kim Sooyoung 代表院長在採訪中談到兼顧臉部結構與組織狀態的精細拉提設計、自然的變化，以及為每位患者量身打造 Bio-Lifting 方案的重要性。',
    body: [
      'LIV整形外科 Kim Sooyoung 代表院長參與了醫美專業媒體《Medical Aesthetic》的報導〈APTOS Bio-Lifting 在韓國臨床現場如何運用〉。',
      '該篇報導介紹全球埋線拉提品牌 APTOS 以官方培訓師為中心、在韓國市場擴大學術活動的趨勢，並將 APTOS 呈現為——不只是把鬆弛組織向上拉提的埋線產品，而是需要依臉部結構與組織狀態進行精細 vector design 的 Bio-Lifting 療程平台。',
      '身為 APTOS 官方培訓師，Kim Sooyoung 代表院長強調了各項產品的結構與適應症、依組織狀態進行的設計，以及療程 plane 與 fixation point 的重要性。尤其 APTOS Bio-Lifting 超越單純的物理性拉提，而是結合每位患者的老化型態與臉部結構，為所需部位設計組織支撐與拉提方向的方法，這一點與LIV整形外科的 Slow Aging 理念相互契合。',
      'LIV整形外科追求自然而精緻的改善，而非過度的變化。Kim Sooyoung 代表院長在採訪中說明，韓國患者近來更重視臉部線條的整理、中臉與下臉的穩定改善以及自然的恢復過程，而不是過度矯正或不自然的結果。這與LIV整形外科所追求的節制的抗老化、精細的拉提與因人而異的診療方向一致。',
      '此外，報導也介紹 APTOS 不僅可單獨進行拉提療程，亦可依患者的皮膚彈性、容積流失、臉部線條變化等狀態，與能量型儀器、skin booster、填充劑、肉毒桿菌素等合併運用。LIV整形外科以臉部的結構性支撐與 vector correction 為中心，同時兼顧皮膚質地、容積與表情肌的調節，持續採取整合式的抗老化方法。',
      '本次採訪顯示，Kim Sooyoung 代表院長身為 APTOS 官方培訓師，為了向國內外患者提供更安全、更具再現性的拉提療程，正持續拓展學術培訓與臨床經驗。',
    ],
  },
  '15': {
    badge: '媒體採訪',
    source: 'Medical Aesthetic',
    title: 'Kim Sooyoung 代表院長接受《Medical Aesthetic》專訪',
    description:
      'Kim Sooyoung 代表院長接受了醫美整形與醫療器材專業媒體《Medical Aesthetic》的正式專訪，分享了LIV倡導的 Slow Aging 理念、全球拉提品牌 APTOS 療程，以及分區客製化演算法方面的醫學見解。',
    body: [
      '您好，這裡是LIV整形外科。',
      '近日，LIV整形外科 Kim Sooyoung 代表院長接受了醫美整形及醫療器材領域具公信力的媒體《Medical Aesthetic》的正式專訪與拍攝。',
      '本次專訪關注引領韓國國內外醫美整形市場趨勢的醫師。Kim Sooyoung 代表院長介紹了LIV整形外科所倡導的「Slow Aging」理念，並就近來在醫美業界最受矚目的全球拉提品牌 APTOS 的療程，分享了深入的醫學見解。',
      '尤其持有 APTOS 原廠官方培訓師（International Trainer）資格的 Kim 院長，深入說明了 APTOS 獨有的技術與LIV整形外科依解剖層次進行的「Site-specific algorithm（分區客製化演算法）」結合時所發揮的加乘效果。不以人為的拉扯，而是依解剖學將下垂的組織準確地重新定位，從而引導出臉部原本的立體感與優雅——LIV獨有的高難度埋線拉提心得，引起了現場採訪團隊的高度興趣與讚嘆。',
      '全球品牌與醫美專家率先給予深度信賴並加以關注的LIV整形外科。今後也將以獲得世界水準肯定的精細技術與持續的學術研究為基礎，為跨越國境來到LIV的每一位貴賓，樹立安全而與眾不同的頂級抗老化標準。',
      '本次專訪的詳細全文，將在官方報導發布後再次與大家分享。',
      '謝謝。',
    ],
  },
  '1': {
    badge: '全球培訓師',
    source: 'Hi News',
    title: 'APTOS 官方培訓師認證',
    description:
      'LIV整形外科 Kim Sooyoung 代表院長取得了全球埋線拉提品牌 APTOS 原廠官方培訓師 International Trainer 資格。這是以臨床經驗與療程熟練度為基礎，在拉提療程領域的專業性獲得肯定的實例。',
  },
  '2': {
    badge: '節目出演',
    title: 'SBS Good Morning 節目出演',
    description:
      '以皮膚彈性、生活習慣造成的老化與膠原蛋白再生等內容為中心，分享了關於抗老化管理的專業見解。',
  },
  '3': {
    badge: '全球專案',
    source: 'Issuemaker',
    title: 'APTOS International Program 報導',
    description:
      '獲介紹為受 APTOS 原廠邀請的韓國代表醫師，並參與了與拉提療程相關的國際專案。',
  },
  '4': {
    badge: '封面故事',
    source: 'Issuemaker',
    title: 'Issuemaker 封面故事',
    description:
      '報導介紹了LIV整形外科在 Slow Aging 理念、再生類療程以及新沙站擴點方面的品牌方向與診療理念。',
  },
  '5': {
    badge: 'ULTHERAPY PRIME',
    source: 'Hemophilia Life',
    title: 'Ultherapy-Prime 引進專訪',
    description:
      '介紹了LIV整形外科在引進 Ultherapy-Prime 以及精準針對 SMAS 層進行拉提方面的做法。',
  },
  '6': {
    badge: '再生護理',
    source: 'Medical Today',
    title: 'GRIDA 醫學膚色配對系統介紹',
    description:
      '報導介紹了運用52種色調與 FDA 核准色素，為疤痕及色素減退部位進行自然膚色重建的療程。',
  },
  '7': {
    badge: '學術',
    source: 'LIV資訊',
    title: 'Kim Sooyoung 代表院長受邀於 Aesthetic Plastic Surgery Korea 發表演講',
    description:
      'Kim Sooyoung 代表院長在大韓美容整形外科學會主辦的 Aesthetic Plastic Surgery Korea 上，以「Site-specific algorithm for facial rejuvenation」為題進行了正式受邀口頭發表，介紹了依臉部解剖特徵的精細分區方法與LIV獨有的療程演算法。',
  },
  '8': {
    badge: 'LIV資訊',
    source: 'LIV資訊',
    title: 'APTOS 全球培訓師官方認證牌匾頒授',
    description:
      'Kim Sooyoung 代表院長獲頒全球埋線拉提品牌 APTOS 原廠官方培訓師認證牌匾。本次認證成為在國內外醫師培訓與拉提療程學術活動方面進一步拓展的契機。',
  },
  '9': {
    badge: 'LIV到訪',
    source: 'LIV資訊',
    title: '演員 Shim Hyung-tak 到訪LIV整形外科',
    description:
      '演員 Shim Hyung-tak 到訪了LIV整形外科。LIV以追求本身的健康與自然之美的 Slow Aging 護理理念為基礎，提供舒適的診療體驗。',
  },
  '10': {
    badge: 'LIV到訪',
    source: 'LIV資訊',
    title: '歌手 Bae Ki-sung 與節目主持人 Lee Eun-bi 夫婦到訪LIV整形外科',
    description:
      '歌手 Bae Ki-sung 與節目主持人 Lee Eun-bi 夫婦到訪了LIV整形外科。LIV提供以持續管理與自然抗老化為方向的客製化護理。',
  },
  '11': {
    badge: '海外到訪',
    source: 'LIV資訊',
    title: '多位中國知名網紅到訪LIV整形外科',
    description:
      '多位中國知名網紅到訪了LIV整形外科。LIV以韓國的頂級抗老化護理與自然的 Slow Aging 理念為基礎，也為海外貴賓提供與眾不同的診療體驗。',
  },
  '12': {
    badge: 'LIV到訪',
    source: 'LIV資訊',
    title: '主播 Lee Jin-ju 到訪LIV整形外科',
    description:
      '主播 Lee Jin-ju 到訪了LIV整形外科。LIV倡導兼顧本身的端莊氣質與自然肌膚彈性的 Slow Aging 護理理念。',
  },
  '13': {
    badge: '專訪',
    source: 'Issuemaker',
    title: 'Issuemaker 專訪',
    description:
      '報導介紹了在 Dongbu-Ichon-dong 開設第一家整形外科的過程、正直的診療理念，以及LIV整形外科追求自然之美的方向。',
  },
  '14': {
    badge: '醫學專欄',
    source: 'Medical Today',
    title: 'Medical Today 超音波強度調節專訪',
    description:
      '說明了需依皮膚厚度與結構調節能量強度、深度與發數分配的客製化拉提方法。',
  },

  // ── featuredMediaNews (home) ──
  f9: {
    badge: '學術',
    title: '受邀於 AXA（Aptos Expert Alliance）發表演講',
    description:
      'Kim Sooyoung 代表院長受邀出席全球埋線拉提品牌 APTOS 主辦的專家會議 AXA，發表了臨床案例與埋線拉提心得。',
  },
  f8: {
    badge: '媒體採訪',
    title: 'Kim Sooyoung 代表院長參與 APTOS Bio-Lifting 臨床採訪',
    description:
      '參與醫美專業媒體《Medical Aesthetic》的 APTOS Bio-Lifting 採訪，分享了兼顧臉部結構與組織狀態的精細拉提設計，以及為每位患者量身打造的 Bio-Lifting 方案。',
  },
  f7: {
    badge: '媒體採訪',
    title: '接受《Medical Aesthetic》專訪',
    description:
      '接受醫美與醫療器材專業媒體《Medical Aesthetic》的正式專訪，聚焦 Slow Aging 理念與全球拉提品牌 APTOS 的療程。',
  },
  f1: {
    badge: '節目出演',
    title: 'SBS Good Morning 節目出演',
    description: '分享了關於皮膚彈性、生活習慣造成的老化與膠原蛋白再生的專業見解。',
  },
  f2: {
    badge: '封面故事',
    title: 'Issuemaker 封面故事',
    description: '介紹了LIV整形外科在 Slow Aging 理念、再生類療程與新沙站擴點方面的方向。',
  },
  f3: {
    badge: '全球培訓師',
    title: 'APTOS 官方培訓師認證',
    description:
      'Kim Sooyoung 代表院長取得了全球埋線拉提品牌 APTOS 的 International Trainer 資格。',
  },
};
