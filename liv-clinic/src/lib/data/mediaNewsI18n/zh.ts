/**
 * Simplified Chinese overrides for Media & News (base: src/lib/data/mediaNewsData.ts).
 *
 * Outlet names keep each publication's own Latin rendering so the source stays
 * identifiable (Hi News · Medical Aesthetic · Issuemaker · Hemophilia Life ·
 * Medical Today · SBS Good Morning). Korean personal names use their Latin
 * romanisation rather than invented Chinese characters. Unlike en.ts, `badge`
 * must be overridden here because the base badges are Latin/Korean-facing labels.
 */
import type { MediaNewsLocaleMap } from './types';

export const ZH: MediaNewsLocaleMap = {
  // ── mediaNewsData ──
  '17': {
    badge: '学术',
    source: 'LIV资讯',
    title:
      'Kim Sooyoung 代表院长受邀在全球提升专家会议 AXA（Aptos Expert Alliance）发表演讲',
    description:
      'LIV整形外科 Kim Sooyoung 代表院长受邀出席全球线雕提升品牌 APTOS 主办的专家会议 AXA（Aptos Expert Alliance），并圆满完成演讲。',
    body: [
      '您好，这里是LIV整形外科。',
      '2026年6月20日，LIV整形外科 Kim Sooyoung 代表院长受邀出席全球线雕提升品牌 APTOS 主办的专家会议 AXA（Aptos Expert Alliance），并圆满完成演讲。',
      'AXA（Aptos Expert Alliance）是世界各国的 APTOS 大师与专家分享最新临床经验和施术心得的国际学术论坛，也是交流全球提升领域最新见解与各类临床案例的权威学术活动。',
      'Kim Sooyoung 代表院长持有 APTOS International Trainer（国际官方培训师）资格，并在本次演讲中分享了LIV整形外科的多种临床案例与线雕提升心得，与到场的医疗团队进行了富有意义的学术交流。',
      'LIV整形外科今后也将持续与国内外的医疗团队开展学术交流，以不断的研究与临床经验为基础，竭尽全力提供更安全、更精细的高端抗衰老医疗服务。',
      '谢谢。',
    ],
  },
  '16': {
    badge: '媒体采访',
    source: 'Medical Aesthetic',
    title: 'Kim Sooyoung 代表院长参与 APTOS Bio-Lifting 临床采访',
    description:
      'LIV整形外科 Kim Sooyoung 代表院长参与了医美专业媒体《Medical Aesthetic》的 APTOS Bio-Lifting 采访。该报道聚焦获得 APTOS 官方培训师认证的韩国医生在实际临床中如何运用 APTOS，Kim Sooyoung 代表院长在采访中谈到了兼顾面部结构与组织状态的精细提升设计、自然的变化，以及为每位求美者量身定制 Bio-Lifting 方案的重要性。',
    body: [
      'LIV整形外科 Kim Sooyoung 代表院长参与了医美专业媒体《Medical Aesthetic》的报道《APTOS Bio-Lifting 在韩国临床中如何应用》。',
      '该报道介绍了全球线雕提升品牌 APTOS 以官方培训师为中心在韩国市场扩大学术活动的趋势，并将 APTOS 呈现为——不只是把松弛组织向上提拉的线雕产品，而是需要依据面部结构与组织状态进行精细 vector design 的 Bio-Lifting 施术平台。',
      '作为 APTOS 官方培训师，Kim Sooyoung 代表院长强调了各产品的结构与适应症、依据组织状态的设计，以及施术 plane 与 fixation point 的重要性。尤其是 APTOS Bio-Lifting 超越单纯的物理提拉，是一种结合每位求美者的衰老形态与面部结构、为所需部位设计组织支撑与提升方向的方法，这一点与LIV整形外科的 Slow Aging 理念相契合。',
      'LIV整形外科追求自然而精致的改善，而非过度的变化。Kim Sooyoung 代表院长在采访中说明，韩国的求美者近来更重视轮廓线条的梳理、中面部与下面部的稳定改善以及自然的恢复过程，而不是过度矫正或不自然的结果。这与LIV整形外科所追求的克制的抗衰老、精细的提升与因人而异的诊疗方向一致。',
      '此外，报道还介绍了 APTOS 不仅可以单独进行提升施术，也可依据求美者的皮肤弹性、容量流失、轮廓变化等状态，与能量类设备、skin booster、填充剂、肉毒素等联合应用。LIV整形外科以面部的结构性支撑与 vector correction 为中心，同时兼顾皮肤质地、容量与表情肌的调节，持续采取整合式的抗衰老方法。',
      '本次采访体现出，Kim Sooyoung 代表院长作为 APTOS 官方培训师，为了向国内外的求美者提供更安全、更具可重复性的提升施术，正在持续拓展学术培训与临床经验。',
    ],
  },
  '15': {
    badge: '媒体采访',
    source: 'Medical Aesthetic',
    title: 'Kim Sooyoung 代表院长接受《Medical Aesthetic》专访',
    description:
      'Kim Sooyoung 代表院长接受了医美整形与医疗器械专业媒体《Medical Aesthetic》的正式专访，分享了LIV倡导的 Slow Aging 理念、全球提升品牌 APTOS 施术，以及分区定制算法方面的医学见解。',
    body: [
      '您好，这里是LIV整形外科。',
      '近日，LIV整形外科 Kim Sooyoung 代表院长接受了医美整形及医疗器械领域具有公信力的媒体《Medical Aesthetic》的正式专访与拍摄。',
      '本次专访关注引领韩国国内外医美整形市场趋势的医生。Kim Sooyoung 代表院长介绍了LIV整形外科所倡导的“Slow Aging（慢老化）”理念，并就近来在医美行业最受关注的全球提升品牌 APTOS 的施术，分享了深入的医学见解。',
      '尤其是持有 APTOS 总部官方培训师（International Trainer）资格的 Kim 院长，深入说明了 APTOS 独有的技术力与LIV整形外科按解剖层次进行的“Site-specific algorithm（分区定制算法）”相结合时所发挥的协同效应。不以人为的拉扯，而是将下垂的组织按解剖学准确地重新安置，从而引导出面部本来的立体感与优雅——LIV独有的高难度线雕提升心得，引起了现场采访团队的浓厚兴趣与赞叹。',
      '全球品牌与医美专家率先给予深度信赖并加以关注的LIV整形外科。今后也将以获得世界水准认可的精细技术力与持续的学术研究为基础，为跨越国界来到LIV的每一位来访者，树立安全而与众不同的高端抗衰老标准。',
      '本次专访的详细全文，将在官方报道发布后再次与大家分享。',
      '谢谢。',
    ],
  },
  '1': {
    badge: '全球培训师',
    source: 'Hi News',
    title: 'APTOS 官方培训师认证',
    description:
      'LIV整形外科 Kim Sooyoung 代表院长获得了全球线雕提升品牌 APTOS 总部官方培训师 International Trainer 资格。这是以临床经验与施术熟练度为基础，在提升施术领域的专业性获得认可的实例。',
  },
  '2': {
    badge: '节目出演',
    title: 'SBS Good Morning 节目出演',
    description:
      '围绕皮肤弹性、生活习惯性衰老与胶原蛋白再生等内容，分享了关于抗衰老管理的专家见解。',
  },
  '3': {
    badge: '全球项目',
    source: 'Issuemaker',
    title: 'APTOS International Program 报道',
    description:
      '作为受 APTOS 总部邀请的韩国代表医生获得介绍，并参与了与提升施术相关的国际项目。',
  },
  '4': {
    badge: '封面故事',
    source: 'Issuemaker',
    title: 'Issuemaker 封面故事',
    description:
      '报道介绍了LIV整形外科在慢老化理念、再生类施术以及新沙站扩张方面的品牌方向与诊疗理念。',
  },
  '5': {
    badge: 'ULTHERAPY PRIME',
    source: 'Hemophilia Life',
    title: 'Ultherapy-Prime 引进专访',
    description:
      '介绍了LIV整形外科在引进 Ultherapy-Prime 以及精准针对 SMAS 层进行提升方面的方法。',
  },
  '6': {
    badge: '再生护理',
    source: 'Medical Today',
    title: 'GRIDA 医学肤色匹配系统介绍',
    description:
      '报道介绍了运用52种色调与 FDA 批准色素，为瘢痕及色素减退部位进行自然肤色重建的施术。',
  },
  '7': {
    badge: '学术',
    source: 'LIV资讯',
    title: 'Kim Sooyoung 代表院长受邀在 Aesthetic Plastic Surgery Korea 发表演讲',
    description:
      'Kim Sooyoung 代表院长在大韩美容整形外科学会主办的 Aesthetic Plastic Surgery Korea 上，以“Site-specific algorithm for facial rejuvenation”为主题进行了正式受邀口头发表，介绍了依据面部解剖特征的精细分区方法与LIV独有的施术算法。',
  },
  '8': {
    badge: 'LIV资讯',
    source: 'LIV资讯',
    title: 'APTOS 全球培训师官方认证牌颁授',
    description:
      'Kim Sooyoung 代表院长获颁全球线雕提升品牌 APTOS 总部官方培训师认证牌。此次认证成为在国内外医生培训与提升施术学术活动方面进一步拓展的契机。',
  },
  '9': {
    badge: 'LIV到访',
    source: 'LIV资讯',
    title: '演员 Shim Hyung-tak 到访LIV整形外科',
    description:
      '演员 Shim Hyung-tak 到访了LIV整形外科。LIV以追求本真的健康与自然之美的 Slow Aging 护理理念为基础，提供舒适的诊疗体验。',
  },
  '10': {
    badge: 'LIV到访',
    source: 'LIV资讯',
    title: '歌手 Bae Ki-sung 与主持人 Lee Eun-bi 夫妇到访LIV整形外科',
    description:
      '歌手 Bae Ki-sung 与主持人 Lee Eun-bi 夫妇到访了LIV整形外科。LIV提供以持续管理与自然抗衰老为方向的定制护理。',
  },
  '11': {
    badge: '海外到访',
    source: 'LIV资讯',
    title: '多位中国知名网红到访LIV整形外科',
    description:
      '多位中国知名网红到访了LIV整形外科。LIV以韩国的高端抗衰老护理与自然的 Slow Aging 理念为基础，也为海外来访者提供与众不同的诊疗体验。',
  },
  '12': {
    badge: 'LIV到访',
    source: 'LIV资讯',
    title: '播音员 Lee Jin-ju 到访LIV整形外科',
    description:
      '播音员 Lee Jin-ju 到访了LIV整形外科。LIV倡导兼顾本真的端庄气质与自然肌肤弹性的 Slow Aging 护理理念。',
  },
  '13': {
    badge: '专访',
    source: 'Issuemaker',
    title: 'Issuemaker 专访',
    description:
      '报道介绍了在 Dongbu-Ichon-dong 开设首家整形外科的过程、正直的诊疗理念，以及LIV整形外科追求自然之美的方向。',
  },
  '14': {
    badge: '医学专栏',
    source: 'Medical Today',
    title: 'Medical Today 超声波强度调节专访',
    description:
      '说明了需要依据皮肤厚度与结构来调节能量强度、深度与发数分配的定制化提升方法。',
  },

  // ── featuredMediaNews (home) ──
  f9: {
    badge: '学术',
    title: '受邀在 AXA（Aptos Expert Alliance）发表演讲',
    description:
      'Kim Sooyoung 代表院长受邀出席全球线雕提升品牌 APTOS 主办的专家会议 AXA，发表了临床案例与线雕提升心得。',
  },
  f8: {
    badge: '媒体采访',
    title: 'Kim Sooyoung 代表院长参与 APTOS Bio-Lifting 临床采访',
    description:
      '参与医美专业媒体《Medical Aesthetic》的 APTOS Bio-Lifting 采访，分享了兼顾面部结构与组织状态的精细提升设计，以及为每位求美者量身定制的 Bio-Lifting 方案。',
  },
  f7: {
    badge: '媒体采访',
    title: '接受《Medical Aesthetic》专访',
    description:
      '接受医美与医疗器械专业媒体《Medical Aesthetic》的正式专访，聚焦 Slow Aging 理念与全球提升品牌 APTOS 的施术。',
  },
  f1: {
    badge: '节目出演',
    title: 'SBS Good Morning 节目出演',
    description: '分享了关于皮肤弹性、生活习惯性衰老与胶原蛋白再生的专家见解。',
  },
  f2: {
    badge: '封面故事',
    title: 'Issuemaker 封面故事',
    description: '介绍了LIV整形外科在慢老化理念、再生类施术与新沙站扩张方面的方向。',
  },
  f3: {
    badge: '全球培训师',
    title: 'APTOS 官方培训师认证',
    description:
      'Kim Sooyoung 代表院长获得了全球线雕提升品牌 APTOS 的 International Trainer 资格。',
  },
};
