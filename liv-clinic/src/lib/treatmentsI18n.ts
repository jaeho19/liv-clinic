/**
 * Locale-specific overrides for TREATMENTS data.
 *
 * The base TREATMENTS object in `./constants.ts` is Korean-only.
 * This file provides per-locale overrides for fields the user reads
 * (targetAreas, idealFor, cautions, faqs, process, duration, anesthesia,
 * recovery, results) so non-Korean locale pages render in their own language.
 *
 * Usage: call `getLocalizedTreatment(base, locale)` in a detail component.
 * Missing keys fall back to the base (Korean) value, so /ko keeps working.
 */

type FAQ = { q: string; shortA?: string; a: string };
type ProcessStep = { step: number; title: string; desc: string };

export interface TreatmentL10n {
  tagline?: string;
  shortDesc?: string;
  targetAreas?: readonly string[];
  idealFor?: readonly string[];
  cautions?: readonly string[];
  duration?: string;
  anesthesia?: string;
  recovery?: string;
  results?: string;
  process?: readonly ProcessStep[];
  faqs?: readonly FAQ[];
}

import type { Locale } from '@/i18n/routing';

type LocaleMap = Record<string, TreatmentL10n>;

// ----- Chinese (zh) -----
const ZH: LocaleMap = {
  ulthera: {
    tagline: 'FDA认证超声提升 – 从深层开始紧致',
    shortDesc: '获美国FDA和韩国食药处批准，HIFU提升的全球标准',
    targetAreas: ['额头', '眼周', '面颊', '下颌线', '颈部'],
    idealFor: [
      '希望非手术提升的人',
      '皮肤松弛、弹力下降烦恼者',
      '希望自然变化者',
      '希望无需恢复期的治疗者',
    ],
    cautions: [
      '治疗后可能出现轻微肿胀、潮红',
      '依照部位可能出现暂时性感觉异常',
      '孕妇、哺乳期女性不可进行治疗',
      '治疗部位有金属植入物者需先咨询',
    ],
    duration: '60-90分钟',
    anesthesia: '麻醉霜（30分钟）',
    recovery: '即刻可恢复日常生活',
    results: '3-6个月逐渐改善，持续1-2年',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态，制定治疗方案' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '麻醉', desc: '涂抹麻醉霜，确保舒适治疗' },
      { step: 4, title: '治疗', desc: '借助DeepSEE实时可视化进行精准治疗' },
      { step: 5, title: '结束', desc: '镇静治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: '超声刀Prime治疗疼不疼？',
        shortA: '涂麻醉霜后进行，多数人可以承受。',
        a: '治疗前会涂抹麻醉霜，大部分人可以承受。对疼痛敏感的顾客可以额外进行疼痛控制。',
      },
      {
        q: '什么时候开始出现效果？',
        shortA: '治疗后立即+3~6个月渐进改善。',
        a: '治疗后即可感受到轻微提升效果，随着胶原蛋白再生，3-6个月内逐渐改善。',
      },
      {
        q: '超声刀Prime和热玛吉的区别是什么？',
        shortA: '超声刀Prime为超声波(HIFU)，热玛吉为射频(RF)。',
        a: '超声刀Prime使用HIFU（超声波），热玛吉使用RF（射频）能量。超声刀Prime擅长深层提升，热玛吉擅长整体弹力改善。两者并用可产生协同效果。',
      },
    ],
  },
  thermage: {
    tagline: '第四代高端射频提升',
    shortDesc: '全球公认的高频提升精品',
    targetAreas: ['全脸', '眼周', '颈部', '身体'],
    idealFor: [
      '皮肤弹力下降烦恼者',
      '希望改善细纹者',
      '希望自然渐进式改变者',
      '希望无麻醉治疗者',
    ],
    cautions: [
      '治疗后可能出现暂时性潮红',
      '佩戴心脏起搏器者不可进行治疗',
      '孕妇、哺乳期女性不可进行治疗',
      '治疗部位有金属植入物者需咨询',
    ],
    duration: '45-60分钟',
    anesthesia: '无需麻醉（振动技术减少疼痛）',
    recovery: '即刻可恢复日常生活',
    results: '即刻改善弹力，3-6个月胶原蛋白再生',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态，制定治疗方案' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '标记', desc: '在治疗部位标记网格' },
      { step: 4, title: '治疗', desc: '利用AccuREP技术传递定制能量' },
      { step: 5, title: '结束', desc: '镇静治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: '热玛吉FLX与旧版本的区别是什么？',
        shortA: 'AccuREP技术自动调节能量，速度快25%。',
        a: '第四代FLX通过AccuREP技术自动调节与皮肤状态匹配的能量，治疗时间缩短25%，疼痛感也减少。',
      },
      {
        q: '治疗周期是多久？',
        shortA: '建议每年1~2次。',
        a: '一般建议每年1-2次。依皮肤状态可能有所不同，通过咨询决定。',
      },
      {
        q: '热玛吉也可以做眼周治疗吗？',
        shortA: '是的，可以使用热玛吉眼部专用探头。',
        a: '可以。热玛吉Eye（眼部）是针对眼周的专用探头，对眼皮与眼下弹力改善非常有效。',
      },
    ],
  },
  onda: {
    tagline: '微波塑形',
    targetAreas: ['面部（脸颊·下颌线）', '双下巴', '腹部', '腰侧', '大腿', '手臂'],
    idealFor: [
      '弹力下降与局部脂肪同时存在者',
      '希望无恢复期改善者',
      '希望面部与身体一同管理者',
    ],
    cautions: [
      '妊娠中或哺乳期请在咨询时务必告知',
      '装有心脏起搏器或体内金属植入物请在咨询时务必告知',
      '治疗部位有炎症、感染、伤口请在咨询时务必告知',
      '有未受控糖尿病等基础疾病请在咨询时务必告知',
    ],
    duration: '面部15-30分钟 / 身体每个部位约10分钟',
    anesthesia: '无需麻醉',
    recovery: '无恢复期（治疗后即可恢复日常生活）',
    results: '4-12周内逐渐显现（存在个体差异）',
    process: [
      { step: 1, title: '咨询', desc: '确认皮肤与皮下脂肪状态，决定治疗部位' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '准备', desc: '标记治疗部位并做治疗准备' },
      { step: 4, title: '治疗', desc: '使用微波手具依部位进行治疗' },
      { step: 5, title: '结束', desc: '整理治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: 'ONDA是射频(RF)治疗吗？',
        shortA: '不是。ONDA使用2.45GHz微波。',
        a: '不是。ONDA是使用2.45GHz微波能量的设备。与RF（射频）、HIFU（超声波）在能量种类以及主要作用的皮肤层次上不同。',
      },
      {
        q: '会痛吗？需要麻醉吗？',
        shortA: '无需麻醉，感受被报告为类似温热按摩。',
        a: 'ONDA无需麻醉即可进行。治疗中的感受被报告为类似温热按摩的程度，手具的接触冷却（约5°C）可保护皮肤表面。',
      },
      {
        q: '效果什么时候出现？',
        shortA: '并非即刻，4~12周内逐渐显现。',
        a: 'ONDA的效果并非即刻出现。受损的脂肪被巨噬细胞逐渐清除，效果在4-12周内逐渐显现，存在个体差异。',
      },
    ],
  },
  density: {
    targetAreas: ['额头', '眼周', '面颊', '下颌线', '颈部'],
    idealFor: [
      '希望复合型提升效果者',
      '希望即刻效果与长期改善并存者',
      '对既有提升治疗不满意者',
    ],
    cautions: [
      '治疗后可能出现轻微肿胀、潮红',
      '根据皮肤状况需咨询是否可接受治疗',
      '孕妇、哺乳期女性不可进行治疗',
    ],
    duration: '40-60分钟',
    anesthesia: '麻醉霜（可选）',
    recovery: '即刻可恢复日常生活',
    results: '即刻提升 + 3-6个月胶原蛋白再生',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态，制定治疗方案' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '麻醉', desc: '必要时涂抹麻醉霜' },
      { step: 4, title: '治疗', desc: '进行RF射频提升治疗' },
      { step: 5, title: '结束', desc: '镇静治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: 'Densiti和超声刀Prime、热玛吉有什么区别？',
        shortA: 'Densiti是性价比高的入门级射频提升设备。',
        a: 'Densiti与热玛吉同属射频(RF)提升类，但具有更合理的价格和更低疼痛，适合开始进行提升管理。与超声刀Prime、舒颜萃等HIFU类设备联合使用可实现跨层复合弹力治疗。',
      },
      {
        q: '治疗间隔多久比较好？',
        shortA: '建议3~6个月间隔。',
        a: '一般建议每3-6个月进行一次治疗，依皮肤状态调整。',
      },
    ],
  },
  inmode: {
    targetAreas: ['下巴下方', '脸颊', '面部轮廓', '双下巴', '深层面颊'],
    idealFor: [
      '希望减少下巴脂肪并加强弹力者',
      '希望改善脸颊提升及面部轮廓者',
      '希望改善双下巴、深层面颊者',
      '希望促进胶原蛋白再生并改善细纹者',
    ],
    cautions: [
      '治疗后可能出现轻微肿胀、潮红',
      '根据皮肤状况需咨询是否可接受治疗',
      '孕妇、哺乳期女性不可进行治疗',
    ],
    duration: '30-60分钟',
    anesthesia: '无麻醉或麻醉霜',
    recovery: '即刻可恢复日常生活',
    results: '即刻弹力 + 渐进式胶原蛋白再生',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态并选择适合的探头' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '麻醉', desc: '依治疗种类进行局部麻醉' },
      { step: 4, title: '治疗', desc: '使用所选探头进行定制化治疗' },
      { step: 5, title: '结束', desc: '镇静治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: 'InMode适合什么样的人？',
        shortA: '面部脂肪多或皮肤松弛复合烦恼者。',
        a: '推荐给脸部脂肪较多或皮肤松弛复合烦恼的顾客。能同时刺激脂肪层和真皮层，可期待提升与瘦脸双重效果。',
      },
      {
        q: '和热玛吉并用效果更好吗？',
        shortA: '是的，射频协同效应可提供更强的弹力改善。',
        a: '是的，InMode与热玛吉并用可以通过射频协同效应获得更强的弹力改善。',
      },
    ],
  },
  shurink: {
    targetAreas: ['额头', '眼周', '面颊', '下颌线', '颈部'],
    idealFor: [
      '首次进行提升治疗者',
      '希望治疗时间短者',
      '希望以合理价格进行提升者',
      '希望定期维护管理者',
    ],
    cautions: [
      '治疗后可能出现轻微潮红',
      '敏感肌肤需先咨询',
      '孕妇、哺乳期女性不可进行治疗',
    ],
    duration: '30-45分钟',
    anesthesia: '麻醉霜（可选）',
    recovery: '即刻可恢复日常生活',
    results: '2-4周后开始见效，3个月达到最大效果',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态，制定治疗方案' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '麻醉', desc: '可选的麻醉霜' },
      { step: 4, title: '治疗', desc: '依部位选用合适探头进行治疗' },
      { step: 5, title: '结束', desc: '镇静治疗部位并提供护理指导' },
    ],
    faqs: [
      {
        q: '超声刀Prime和舒颜萃的区别？',
        shortA: '同为HIFU，但舒颜萃更适合性价比的日常维护。',
        a: '两者都基于HIFU原理。超声刀Prime具备DeepSEE可视化技术，可到达更深层；舒颜萃治疗快速、价格合理，适合定期管理。',
      },
      {
        q: '治疗周期如何安排？',
        shortA: '3~6个月间隔，适合维护性治疗。',
        a: '通常建议每3-6个月治疗一次，也适合作为超声刀Prime或热玛吉之间的维护治疗。',
      },
    ],
  },
  thread: {
    targetAreas: ['面颊', '法令纹', '下颌线', '颈部'],
    idealFor: [
      '希望即刻提升效果者',
      '希望改善面部松弛者',
      '希望V脸轮廓者',
      '希望同时获得提升与胶原蛋白促进者',
    ],
    cautions: [
      '治疗后可能出现肿胀、瘀青',
      '约1-2周需避免过度表情及按摩',
      '孕妇、哺乳期女性不可进行治疗',
    ],
    duration: '30-60分钟',
    anesthesia: '局部麻醉',
    recovery: '1-7天（依部位而异）',
    results: '即刻提升 + 6-12个月胶原蛋白促进',
    process: [
      { step: 1, title: '咨询', desc: '分析面部松弛程度及目标设计' },
      { step: 2, title: '麻醉', desc: '进行局部麻醉' },
      { step: 3, title: '设计', desc: '标记线雕走向' },
      { step: 4, title: '治疗', desc: '用可吸收线完成提升' },
      { step: 5, title: '结束', desc: '压迫止血并提供护理指导' },
    ],
    faqs: [
      {
        q: '线雕的效果维持多久？',
        shortA: '提升效果维持6-12个月，胶原蛋白促进更持久。',
        a: '提升效果通常持续6-12个月，线材融化后胶原蛋白促进效果可持续更长时间。',
      },
      {
        q: '线雕后会有异物感吗？',
        shortA: '初期轻微异物感，2-4周内消失。',
        a: '治疗初期可能有轻微异物感，2-4周内逐渐消失，恢复自然感觉。',
      },
    ],
  },
  botox: {
    targetAreas: ['额头', '眉间', '眼周', '方脸咬肌', '嘴角', '斜方肌', '小腿'],
    idealFor: [
      '表情纹烦恼者',
      '希望瘦脸、缩小斜方肌者',
      '希望快速便捷治疗者',
      '希望预防性抗衰老的年轻人',
    ],
    cautions: [
      '治疗当天避免饮酒、泡澡',
      '禁止按摩治疗部位',
      '孕妇、哺乳期及神经肌肉疾病者不可治疗',
    ],
    duration: '10-20分钟',
    anesthesia: '无麻醉或麻醉霜（按需）',
    recovery: '即刻可恢复日常生活',
    results: '3-7天后开始见效，维持3-6个月',
    process: [
      { step: 1, title: '咨询', desc: '分析皱纹并沟通理想效果' },
      { step: 2, title: '洁面', desc: '卸妆及消毒' },
      { step: 3, title: '麻醉', desc: '必要时涂抹麻醉霜' },
      { step: 4, title: '标记', desc: '标记治疗点位' },
      { step: 5, title: '治疗', desc: '精细针头注射肉毒素' },
      { step: 6, title: '结束', desc: '交代注意事项' },
    ],
    faqs: [
      {
        q: '打肉毒素后表情会不自然吗？',
        shortA: '适量治疗可保持自然表情。',
        a: '正确的部位与适量注射可保持自然表情并只改善皱纹。过量可能出现不自然，所以由熟练医师进行治疗非常重要。',
      },
      {
        q: '肉毒素效果维持多久？',
        shortA: '个体差异，通常维持3~6个月。',
        a: '存在个体差异，通常维持3-6个月。定期治疗可使肌肉弱化，效果更持久。',
      },
      {
        q: '不同品牌的肉毒素有差异吗？',
        shortA: '各品牌起效时间、扩散、持续时间不同。',
        a: '不同产品在起效时间、扩散度、持续时间上存在差异，需要根据部位和目的选择合适的产品。',
      },
    ],
  },
  filler: {
    targetAreas: ['额头', '太阳穴', '鼻', '苹果肌', '法令纹', '侧脸', '下巴', '卧蚕', '嘴唇', '眉毛'],
    idealFor: [
      '希望填充凹陷体积者',
      '法令纹、口周纹烦恼者',
      '希望提升鼻、下巴轮廓者',
      '希望增加唇部体积者',
    ],
    cautions: [
      '治疗后可能出现瘀青、肿胀',
      '禁止按摩、按压治疗部位',
      '3日内避免剧烈运动及泡澡',
      '极少数可能出现血管栓塞，必须由熟练医师治疗',
    ],
    duration: '20-40分钟',
    anesthesia: '麻醉霜或神经阻滞麻醉',
    recovery: '即刻 ~ 3天（依部位而异）',
    results: '即刻见效，维持6-24个月（依产品而异）',
    process: [
      { step: 1, title: '咨询', desc: '分析面部轮廓，制定治疗方案' },
      { step: 2, title: '洁面', desc: '卸妆及消毒' },
      { step: 3, title: '麻醉', desc: '涂抹麻醉霜或神经阻滞' },
      { step: 4, title: '治疗', desc: '依部位注射合适的填充剂' },
      { step: 5, title: '结束', desc: '塑形并提供护理指导' },
    ],
    faqs: [
      {
        q: '玻尿酸会结块或不自然吗？',
        shortA: '适量+熟练医师可保持自然。',
        a: '使用正品玻尿酸、适量注射，加上具备解剖学知识的医师，可以获得自然的效果。过量治疗可能不自然，因此适量治疗非常重要。',
      },
      {
        q: '玻尿酸注射后可以立即恢复日常吗？',
        shortA: '大多数可即刻恢复日常。',
        a: '大多数人可以即刻恢复日常生活。但依治疗部位可能出现瘀青或肿胀，重要日程前建议预留时间。',
      },
      {
        q: '玻尿酸可以溶解吗？',
        shortA: '可以用玻尿酸酶安全溶解。',
        a: '透明质酸填充剂可用透明质酸酶溶解。当效果不满意或出现并发症时，可以安全地移除。',
      },
    ],
  },
  skinbooster: {
    targetAreas: ['全脸', '颈部', '手背'],
    idealFor: [
      '皮肤干燥、缺水烦恼者',
      '皮肤弹力下降、细纹烦恼者',
      '肤色暗沉、缺少活力者',
      '希望激光治疗后再生皮肤者',
    ],
    cautions: [
      '治疗后可能留有微针痕迹、泛红',
      '治疗当天避免化妆、饮酒',
      '彻底防晒',
      '建议以2-4周为周期进行3-4次治疗',
    ],
    duration: '30-45分钟',
    anesthesia: '麻醉霜',
    recovery: '1-3天（微针痕迹）',
    results: '2-4周后见效，建议3-4次为一疗程',
    process: [
      { step: 1, title: '咨询', desc: '分析皮肤状态并选择产品' },
      { step: 2, title: '洁面', desc: '卸妆并整理皮肤' },
      { step: 3, title: '麻醉', desc: '涂抹麻醉霜' },
      { step: 4, title: '治疗', desc: '通过精细针或仪器注入' },
      { step: 5, title: '结束', desc: '镇静护理及防晒' },
    ],
    faqs: [
      {
        q: '皮肤助推剂和水光针一样吗？',
        shortA: '相似但皮肤助推剂成分更多样。',
        a: '概念相似，但皮肤助推剂包含更多种成分（透明质酸、多聚核苷酸等）。水光针主要以透明质酸为基础进行补水。',
      },
      {
        q: '什么时候开始见效？',
        shortA: '即刻水润感 + 2~4周后弹力光泽改善。',
        a: '治疗后即可感受到水润感，2-4周后开始出现弹力、光泽改善。为达最佳效果，建议以2-4周间隔进行3-4次治疗。',
      },
      {
        q: '哪种产品比较好？',
        shortA: '依皮肤状态与目标经咨询选择。',
        a: '丽珠兰、菲洛嘉、逆时针等多种产品可选，需根据皮肤状态与治疗目标经咨询后决定。',
      },
    ],
  },
};

// ----- English (en) -----
const EN: LocaleMap = {
  ulthera: {
    targetAreas: ['Forehead', 'Eye area', 'Cheeks', 'Jawline', 'Neck'],
    idealFor: [
      'Those seeking non-surgical lifting',
      'Those concerned with sagging skin and reduced elasticity',
      'Those seeking natural-looking results',
      'Those wanting no downtime',
    ],
    cautions: [
      'Mild swelling or redness may appear after treatment',
      'Temporary sensory changes possible depending on area',
      'Not for pregnant or breastfeeding individuals',
      'Consultation needed if metal implants are present in the treatment area',
    ],
    duration: '60-90 minutes',
    anesthesia: 'Topical anesthetic cream (30 min)',
    recovery: 'Immediate return to daily life',
    results: 'Gradual improvement over 3-6 months, lasts 1-2 years',
    process: [
      { step: 1, title: 'Consultation', desc: 'Skin analysis and treatment planning' },
      { step: 2, title: 'Cleansing', desc: 'Remove makeup and prepare skin' },
      { step: 3, title: 'Anesthesia', desc: 'Topical cream applied for comfort' },
      { step: 4, title: 'Treatment', desc: 'Precision treatment guided by DeepSEE' },
      { step: 5, title: 'Aftercare', desc: 'Soothe the area and explain aftercare' },
    ],
    faqs: [
      {
        q: 'Is the Ultherapy Prime treatment painful?',
        shortA: 'With topical anesthetic, most tolerate it well.',
        a: 'We apply topical anesthetic cream before the treatment, so most people tolerate it well. Additional pain management is available for sensitive patients.',
      },
      {
        q: 'When do the results appear?',
        shortA: 'Immediate effect + gradual 3-6 months.',
        a: 'Some immediate lifting effect is felt, then gradual improvement over 3-6 months as collagen regenerates.',
      },
      {
        q: 'What is the difference between Ultherapy Prime and Thermage?',
        shortA: 'Ultherapy uses HIFU (ultrasound), Thermage uses RF.',
        a: 'Ultherapy Prime uses HIFU (ultrasound) and reaches deep lifting layers. Thermage uses RF (radiofrequency) and improves overall elasticity. Combining both produces synergistic effects.',
      },
    ],
  },
  thermage: {
    targetAreas: ['Whole face', 'Eye area', 'Neck', 'Body'],
    idealFor: [
      'Those concerned with reduced skin elasticity',
      'Those wanting fine line improvement',
      'Those seeking natural, gradual change',
      'Those preferring no anesthesia',
    ],
    cautions: [
      'Temporary redness may appear after treatment',
      'Not for patients with pacemakers',
      'Not for pregnant or breastfeeding individuals',
      'Consultation needed if metal implants are present in the treatment area',
    ],
    duration: '45-60 minutes',
    anesthesia: 'No anesthesia (vibration reduces discomfort)',
    recovery: 'Immediate return to daily life',
    results: 'Immediate elasticity improvement, collagen regeneration over 3-6 months',
    process: [
      { step: 1, title: 'Consultation', desc: 'Skin analysis and treatment planning' },
      { step: 2, title: 'Cleansing', desc: 'Remove makeup and prepare skin' },
      { step: 3, title: 'Marking', desc: 'Apply treatment grid to target area' },
      { step: 4, title: 'Treatment', desc: 'Personalized energy via AccuREP' },
      { step: 5, title: 'Aftercare', desc: 'Soothe the area and explain aftercare' },
    ],
    faqs: [
      {
        q: 'How is Thermage FLX different from earlier versions?',
        shortA: 'AccuREP auto-tunes energy; 25% faster.',
        a: 'The 4th-gen FLX uses AccuREP to automatically match energy to skin impedance, shortens treatment time by 25%, and reduces discomfort.',
      },
      {
        q: 'How often should I receive treatment?',
        shortA: 'We recommend 1-2 sessions per year.',
        a: 'Typically 1-2 times per year. The exact cadence depends on skin condition — decided through consultation.',
      },
      {
        q: 'Can Thermage be used on the eye area?',
        shortA: 'Yes — Thermage Eye tip treats eye area.',
        a: 'Yes. Thermage Eye uses a dedicated tip for the eye area and is effective for eyelid and under-eye elasticity.',
      },
    ],
  },
  onda: {
    tagline: 'Microwave Contouring',
    targetAreas: ['Face (cheeks, jawline)', 'Double chin', 'Abdomen', 'Flanks', 'Thighs', 'Arms'],
    idealFor: [
      'Those with both reduced elasticity and localized fat',
      'Those seeking improvement without downtime',
      'Those who want to treat the face and body together',
    ],
    cautions: [
      'Please tell us during the consultation if you are pregnant or breastfeeding',
      'Please tell us during the consultation if you have a pacemaker or metal implants in your body',
      'Please tell us during the consultation if the treatment area has inflammation, infection, or open wounds',
      'Please tell us during the consultation if you have an underlying condition such as uncontrolled diabetes',
    ],
    duration: 'Face 15-30 minutes / about 10 minutes per body area',
    anesthesia: 'No anesthesia required',
    recovery: 'No downtime (return to daily life right after the treatment)',
    results: 'Appears gradually over 4-12 weeks (varies by individual)',
    process: [
      { step: 1, title: 'Consultation', desc: 'Check skin and subcutaneous fat condition, decide the treatment areas' },
      { step: 2, title: 'Cleansing', desc: 'Remove makeup and prepare the skin' },
      { step: 3, title: 'Preparation', desc: 'Mark the treatment area and prepare for the session' },
      { step: 4, title: 'Treatment', desc: 'Area-by-area treatment with the microwave handpiece' },
      { step: 5, title: 'Aftercare', desc: 'Settle the treated area and explain aftercare' },
    ],
    faqs: [
      {
        q: 'Is ONDA an RF (radiofrequency) treatment?',
        shortA: 'No. ONDA uses 2.45 GHz microwave energy.',
        a: 'No. ONDA is a device that uses 2.45 GHz microwave energy. It differs from RF (radiofrequency) and HIFU (ultrasound) in the type of energy used and in the layers it mainly acts on.',
      },
      {
        q: 'Is it painful? Is anesthesia needed?',
        shortA: 'It is performed without anesthesia, and is reported to feel similar to a warm massage.',
        a: 'ONDA is performed without anesthesia. The sensation during the treatment is reported to be similar to a warm massage, and the contact cooling of the handpiece (about 5°C) protects the skin surface.',
      },
      {
        q: 'When do the results appear?',
        shortA: 'Not immediately — they appear gradually over 4-12 weeks.',
        a: 'ONDA does not produce immediate results. As the damaged fat is gradually cleared by macrophages, changes appear over 4-12 weeks, and results vary from person to person.',
      },
    ],
  },
};

// ----- Japanese (ja) -----
const JA: LocaleMap = {
  ulthera: {
    targetAreas: ['額', '目もと', '頬', 'フェイスライン', '首'],
    idealFor: [
      '手術なしでリフティングを希望される方',
      'たるみ・弾力低下にお悩みの方',
      '自然な変化を望まれる方',
      'ダウンタイムなしで施術を受けたい方',
    ],
    cautions: [
      '施術後に軽度の腫れ・赤みが出ることがあります',
      '部位により一時的な感覚異常が出ることがあります',
      '妊婦・授乳中の方は施術不可です',
      '施術部位に金属インプラントがある場合は要相談',
    ],
    duration: '60-90分',
    anesthesia: '麻酔クリーム（30分）',
    recovery: 'すぐに日常復帰可能',
    results: '3-6ヶ月かけて徐々に改善、1-2年持続',
    process: [
      { step: 1, title: 'カウンセリング', desc: '肌状態の分析と施術計画' },
      { step: 2, title: '洗顔', desc: 'メイク除去と肌の整え' },
      { step: 3, title: '麻酔', desc: '快適な施術のため麻酔クリーム塗布' },
      { step: 4, title: '施術', desc: 'DeepSEEで確認しながら精密施術' },
      { step: 5, title: 'アフターケア', desc: '鎮静と注意事項の案内' },
    ],
    faqs: [
      {
        q: 'ウルセラプライム施術は痛みますか？',
        shortA: '麻酔クリーム使用で多くの方が我慢できる程度です。',
        a: '事前に麻酔クリームを塗布するため大半の方が我慢できる程度です。痛みに敏感な方には追加のコントロールが可能です。',
      },
      {
        q: '効果はいつから現れますか？',
        shortA: '施術直後＋3~6ヶ月で徐々に改善。',
        a: '施術直後にも軽いリフティング感を感じられ、コラーゲン再生に伴い3-6ヶ月かけて徐々に改善します。',
      },
      {
        q: 'ウルセラプライムとサーマジの違いは？',
        shortA: 'ウルセラ=超音波(HIFU)、サーマジ=高周波(RF)。',
        a: 'ウルセラプライムはHIFU（超音波）、サーマジはRF（高周波）を使います。ウルセラは深層のリフティング、サーマジは全体的な弾力改善に効果的で、併用でシナジーが期待できます。',
      },
    ],
  },
  thermage: {
    targetAreas: ['顔全体', '目もと', '首', 'ボディ'],
    idealFor: [
      '肌弾力の低下が気になる方',
      '小じわ改善を希望される方',
      '自然で段階的な変化を望まれる方',
      '無麻酔施術を希望される方',
    ],
    cautions: [
      '施術後に一時的な赤みが出ることがあります',
      'ペースメーカー装着者は施術不可',
      '妊婦・授乳中の方は施術不可',
      '金属インプラント部位は要相談',
    ],
    duration: '45-60分',
    anesthesia: '無麻酔（振動技術で痛み軽減）',
    recovery: 'すぐに日常復帰可能',
    results: '即時の弾力改善、3-6ヶ月のコラーゲン再生',
    process: [
      { step: 1, title: 'カウンセリング', desc: '肌状態の分析と施術計画' },
      { step: 2, title: '洗顔', desc: 'メイク除去と肌の整え' },
      { step: 3, title: 'マーキング', desc: '施術部位にグリッド表示' },
      { step: 4, title: '施術', desc: 'AccuREP技術でカスタマイズ照射' },
      { step: 5, title: 'アフターケア', desc: '鎮静と注意事項の案内' },
    ],
    faqs: [
      {
        q: 'サーマジFLXと旧世代の違いは？',
        shortA: 'AccuREPで自動調整、25%高速化。',
        a: '第4世代FLXはAccuREPで肌に合わせたエネルギーを自動調整し、施術時間が25%短縮、痛みも軽減しました。',
      },
      {
        q: '施術間隔はどのくらい？',
        shortA: '年1~2回の施術を推奨。',
        a: '通常は年1-2回を推奨します。肌状態により異なるためカウンセリングで決定します。',
      },
      {
        q: '目もとにも施術できますか？',
        shortA: 'はい、サーマジアイ専用チップで可能です。',
        a: 'はい、サーマジアイは目もと専用のチップで、まぶたや目の下の弾力改善に効果的です。',
      },
    ],
  },
  onda: {
    tagline: 'マイクロ波コンタリング',
    targetAreas: ['顔（頬・フェイスライン）', '二重あご', '腹部', '脇腹', '太もも', '腕'],
    idealFor: [
      '弾力低下と部分的な脂肪の両方が気になる方',
      'ダウンタイムなしで改善を希望される方',
      '顔とボディを一緒にケアしたい方',
    ],
    cautions: [
      '妊娠中・授乳中の場合はカウンセリング時に必ずお知らせください',
      'ペースメーカーや体内金属インプラントがある場合はカウンセリング時に必ずお知らせください',
      '施術部位に炎症・感染・傷がある場合はカウンセリング時に必ずお知らせください',
      'コントロールされていない糖尿病などの基礎疾患がある場合はカウンセリング時に必ずお知らせください',
    ],
    duration: '顔15-30分 / ボディは1部位あたり約10分',
    anesthesia: '麻酔不要',
    recovery: 'ダウンタイムなし（施術直後から日常生活可能）',
    results: '4-12週間かけて徐々に現れます（個人差あり）',
    process: [
      { step: 1, title: 'カウンセリング', desc: '肌と皮下脂肪の状態を確認し、施術部位を決定' },
      { step: 2, title: '洗顔', desc: 'メイク除去と肌の整え' },
      { step: 3, title: '準備', desc: '施術部位のマーキングと施術準備' },
      { step: 4, title: '施術', desc: 'マイクロ波ハンドピースで部位ごとに施術' },
      { step: 5, title: 'アフターケア', desc: '施術部位を整えアフターケアを案内' },
    ],
    faqs: [
      {
        q: 'オンダは高周波（RF）施術ですか？',
        shortA: 'いいえ。オンダは2.45GHzのマイクロ波を使用します。',
        a: 'いいえ。オンダは2.45GHzのマイクロ波エネルギーを使用する機器です。RF（高周波）やHIFU（超音波）とは、エネルギーの種類と主に作用する層が異なります。',
      },
      {
        q: '痛みますか？麻酔は必要ですか？',
        shortA: '麻酔なしで行い、温かいマッサージに近い感覚と報告されています。',
        a: 'オンダは麻酔なしで行います。施術中の感覚は温かいマッサージに近い程度と報告されており、ハンドピースの接触冷却（約5°C）が皮膚表面を保護します。',
      },
      {
        q: '効果はいつ現れますか？',
        shortA: '即時ではなく、4~12週間かけて徐々に現れます。',
        a: 'オンダの効果は即時には現れません。ダメージを受けた脂肪がマクロファージによって徐々に処理されるのに伴い、4-12週間かけて段階的に現れ、個人差があります。',
      },
    ],
  },
};

// ----- French (fr) -----
// Standard French (France), medical-tourism oriented. Glossary: see docs/02-design/features/i18n-treatments-fr-mn-ar.design.md §3
const FR: LocaleMap = {
  ulthera: {
    targetAreas: ['Front', 'Contour des yeux', 'Joues', 'Mâchoire', 'Cou'],
    idealFor: [
      'Personnes recherchant un lifting non chirurgical',
      'Personnes préoccupées par le relâchement cutané et la perte d\'élasticité',
      'Personnes recherchant un résultat naturel',
      'Personnes ne souhaitant aucun temps d\'arrêt',
    ],
    cautions: [
      'De légers gonflements ou rougeurs peuvent apparaître après le traitement',
      'Des troubles sensoriels temporaires sont possibles selon la zone',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
      'Consultation requise en cas d\'implants métalliques dans la zone traitée',
    ],
    duration: '60-90 minutes',
    anesthesia: 'Crème anesthésiante topique (30 min)',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Amélioration progressive sur 3-6 mois, durée 1-2 ans',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse de la peau et planification du traitement' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Anesthésie', desc: 'Application de crème anesthésiante pour le confort' },
      { step: 4, title: 'Traitement', desc: 'Traitement de précision guidé par DeepSEE en temps réel' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'Le traitement Ultherapy Prime est-il douloureux ?',
        shortA: 'Avec la crème anesthésiante, la plupart le tolèrent bien.',
        a: 'Nous appliquons une crème anesthésiante topique avant le traitement, ce qui le rend tolérable pour la plupart des patients. Une gestion supplémentaire de la douleur est disponible pour les patients sensibles.',
      },
      {
        q: 'Quand les résultats apparaissent-ils ?',
        shortA: 'Effet immédiat + amélioration progressive sur 3-6 mois.',
        a: 'Un léger effet de lifting est ressenti immédiatement, puis une amélioration progressive sur 3-6 mois à mesure que le collagène se régénère.',
      },
      {
        q: 'Quelle est la différence entre Ultherapy Prime et Thermage ?',
        shortA: 'Ultherapy utilise les HIFU (ultrasons), Thermage utilise les RF.',
        a: 'Ultherapy Prime utilise les HIFU (ultrasons) et atteint les couches profondes de lifting. Thermage utilise les RF (radiofréquence) et améliore l\'élasticité globale. Combiner les deux produit des effets synergiques.',
      },
    ],
  },
  thermage: {
    targetAreas: ['Visage entier', 'Contour des yeux', 'Cou', 'Corps'],
    idealFor: [
      'Personnes préoccupées par la perte d\'élasticité cutanée',
      'Personnes souhaitant améliorer les ridules',
      'Personnes recherchant un changement naturel et progressif',
      'Personnes préférant un traitement sans anesthésie',
    ],
    cautions: [
      'Des rougeurs temporaires peuvent apparaître après le traitement',
      'Contre-indiqué pour les porteurs de stimulateur cardiaque',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
      'Consultation requise en cas d\'implants métalliques dans la zone traitée',
    ],
    duration: '45-60 minutes',
    anesthesia: 'Sans anesthésie (la technologie vibratoire réduit l\'inconfort)',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Amélioration immédiate de l\'élasticité, régénération du collagène sur 3-6 mois',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse de la peau et planification du traitement' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Marquage', desc: 'Application d\'une grille de traitement sur la zone cible' },
      { step: 4, title: 'Traitement', desc: 'Énergie personnalisée via la technologie AccuREP' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'En quoi Thermage FLX diffère-t-il des versions précédentes ?',
        shortA: 'AccuREP ajuste automatiquement l\'énergie ; 25 % plus rapide.',
        a: 'La 4e génération FLX utilise AccuREP pour adapter automatiquement l\'énergie à l\'impédance cutanée, raccourcit le temps de traitement de 25 % et réduit l\'inconfort.',
      },
      {
        q: 'À quelle fréquence faut-il faire le traitement ?',
        shortA: 'Nous recommandons 1 à 2 séances par an.',
        a: 'Généralement 1 à 2 fois par an. La cadence exacte dépend de l\'état de la peau et est déterminée lors de la consultation.',
      },
      {
        q: 'Thermage peut-il être utilisé sur le contour des yeux ?',
        shortA: 'Oui, Thermage Eye traite le contour des yeux.',
        a: 'Oui. Thermage Eye utilise un embout dédié au contour des yeux et est efficace pour l\'élasticité des paupières et des cernes.',
      },
    ],
  },
  onda: {
    tagline: 'Contouring par micro-ondes',
    targetAreas: ['Visage (joues, mâchoire)', 'Double menton', 'Abdomen', 'Flancs', 'Cuisses', 'Bras'],
    idealFor: [
      'Personnes présentant à la fois une perte d\'élasticité et des amas graisseux localisés',
      'Personnes souhaitant une amélioration sans temps d\'arrêt',
      'Personnes souhaitant traiter le visage et le corps ensemble',
    ],
    cautions: [
      'Merci de nous informer lors de la consultation en cas de grossesse ou d\'allaitement',
      'Merci de nous informer lors de la consultation en cas de stimulateur cardiaque ou d\'implants métalliques dans le corps',
      'Merci de nous informer lors de la consultation en cas d\'inflammation, d\'infection ou de plaie dans la zone à traiter',
      'Merci de nous informer lors de la consultation en cas de pathologie sous-jacente, comme un diabète non équilibré',
    ],
    duration: 'Visage 15-30 minutes / environ 10 minutes par zone corporelle',
    anesthesia: 'Aucune anesthésie nécessaire',
    recovery: 'Aucun temps d\'arrêt (reprise des activités quotidiennes juste après le traitement)',
    results: 'Apparition progressive sur 4-12 semaines (variable selon les personnes)',
    process: [
      { step: 1, title: 'Consultation', desc: 'Évaluation de la peau et de la graisse sous-cutanée, choix des zones à traiter' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Préparation', desc: 'Marquage de la zone à traiter et préparation de la séance' },
      { step: 4, title: 'Traitement', desc: 'Traitement zone par zone avec la pièce à main à micro-ondes' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone traitée et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'ONDA est-il un traitement par radiofréquence (RF) ?',
        shortA: 'Non. ONDA utilise des micro-ondes à 2,45 GHz.',
        a: 'Non. ONDA est un appareil qui utilise une énergie micro-ondes à 2,45 GHz. Il se distingue de la RF (radiofréquence) et des HIFU (ultrasons) par le type d\'énergie employé et par les couches sur lesquelles il agit principalement.',
      },
      {
        q: 'Est-ce douloureux ? Une anesthésie est-elle nécessaire ?',
        shortA: 'Le traitement se fait sans anesthésie ; la sensation est décrite comme proche d\'un massage chaud.',
        a: 'ONDA se pratique sans anesthésie. La sensation pendant le traitement est décrite comme proche d\'un massage chaud, et le refroidissement par contact de la pièce à main (environ 5 °C) protège la surface de la peau.',
      },
      {
        q: 'Quand les résultats apparaissent-ils ?',
        shortA: 'Pas immédiatement : progressivement sur 4-12 semaines.',
        a: 'Les résultats d\'ONDA ne sont pas immédiats. À mesure que les cellules graisseuses altérées sont éliminées progressivement par les macrophages, les changements apparaissent sur 4 à 12 semaines, avec des variations selon les personnes.',
      },
    ],
  },
  density: {
    targetAreas: ['Front', 'Contour des yeux', 'Joues', 'Mâchoire', 'Cou'],
    idealFor: [
      'Personnes recherchant un effet lifting combiné',
      'Personnes souhaitant un effet immédiat associé à une amélioration à long terme',
      'Personnes insatisfaites des traitements de lifting précédents',
    ],
    cautions: [
      'De légers gonflements ou rougeurs peuvent apparaître après le traitement',
      'Consultation requise selon l\'état de la peau pour confirmer l\'éligibilité',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
    ],
    duration: '40-60 minutes',
    anesthesia: 'Crème anesthésiante (en option)',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Lifting immédiat + régénération du collagène sur 3-6 mois',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse de la peau et planification du traitement' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Anesthésie', desc: 'Application de crème anesthésiante si nécessaire' },
      { step: 4, title: 'Traitement', desc: 'Lifting par radiofréquence RF' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'En quoi Densiti diffère-t-il d\'Ultherapy Prime et de Thermage ?',
        shortA: 'Densiti est un appareil RF d\'entrée de gamme avec un excellent rapport qualité-prix.',
        a: 'Densiti appartient à la catégorie du lifting par radiofréquence (RF) comme Thermage, mais offre un prix plus accessible et moins d\'inconfort, idéal pour débuter une gestion du lifting. Combiné aux appareils HIFU comme Ultherapy Prime ou Shurink, il permet un traitement d\'élasticité multi-couches.',
      },
      {
        q: 'Quel intervalle entre les traitements est recommandé ?',
        shortA: 'Un intervalle de 3 à 6 mois est recommandé.',
        a: 'Un traitement tous les 3 à 6 mois est généralement recommandé, à ajuster selon l\'état de la peau.',
      },
    ],
  },
  inmode: {
    targetAreas: ['Sous le menton', 'Joues', 'Contour du visage', 'Double menton', 'Joues profondes'],
    idealFor: [
      'Personnes souhaitant réduire la graisse du menton et renforcer l\'élasticité',
      'Personnes souhaitant améliorer le lifting des joues et le contour du visage',
      'Personnes souhaitant améliorer le double menton et les joues profondes',
      'Personnes souhaitant favoriser la régénération du collagène et atténuer les ridules',
    ],
    cautions: [
      'De légers gonflements ou rougeurs peuvent apparaître après le traitement',
      'Consultation requise selon l\'état de la peau pour confirmer l\'éligibilité',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
    ],
    duration: '30-60 minutes',
    anesthesia: 'Sans anesthésie ou crème anesthésiante',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Élasticité immédiate + régénération progressive du collagène',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse de la peau et sélection de l\'embout adapté' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Anesthésie', desc: 'Anesthésie locale selon le type de traitement' },
      { step: 4, title: 'Traitement', desc: 'Traitement personnalisé avec l\'embout sélectionné' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'À qui InMode convient-il ?',
        shortA: 'Aux personnes ayant un excès de graisse faciale ou un relâchement cutané combinés.',
        a: 'Recommandé aux patients présentant à la fois un excès de graisse faciale et un relâchement cutané. InMode stimule simultanément la couche graisseuse et le derme, offrant un double effet lifting et amincissement.',
      },
      {
        q: 'Est-il plus efficace combiné avec Thermage ?',
        shortA: 'Oui, la synergie RF offre une amélioration d\'élasticité accrue.',
        a: 'Oui, combiner InMode avec Thermage permet d\'obtenir une amélioration d\'élasticité supérieure grâce à la synergie des deux technologies RF.',
      },
    ],
  },
  shurink: {
    targetAreas: ['Front', 'Contour des yeux', 'Joues', 'Mâchoire', 'Cou'],
    idealFor: [
      'Personnes recevant un traitement lifting pour la première fois',
      'Personnes souhaitant un traitement de courte durée',
      'Personnes recherchant un lifting à un prix raisonnable',
      'Personnes souhaitant un entretien régulier',
    ],
    cautions: [
      'De légères rougeurs peuvent apparaître après le traitement',
      'Consultation préalable requise pour les peaux sensibles',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
    ],
    duration: '30-45 minutes',
    anesthesia: 'Crème anesthésiante (en option)',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Premiers effets visibles à 2-4 semaines, résultat maximal à 3 mois',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse de la peau et planification du traitement' },
      { step: 2, title: 'Nettoyage', desc: 'Démaquillage et préparation de la peau' },
      { step: 3, title: 'Anesthésie', desc: 'Crème anesthésiante en option' },
      { step: 4, title: 'Traitement', desc: 'Sélection de l\'embout adapté à chaque zone' },
      { step: 5, title: 'Soins après', desc: 'Apaisement de la zone et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'Quelle est la différence entre Ultherapy Prime et Shurink ?',
        shortA: 'Les deux sont HIFU, mais Shurink offre un meilleur rapport qualité-prix pour l\'entretien.',
        a: 'Les deux reposent sur la technologie HIFU. Ultherapy Prime dispose de la visualisation DeepSEE et atteint des couches plus profondes ; Shurink est plus rapide, à prix raisonnable, et idéal pour une gestion régulière.',
      },
      {
        q: 'Quel est le cycle de traitement ?',
        shortA: 'Intervalle de 3 à 6 mois, idéal pour l\'entretien.',
        a: 'Un traitement tous les 3 à 6 mois est généralement recommandé. Shurink convient également comme traitement d\'entretien entre des séances Ultherapy Prime ou Thermage.',
      },
    ],
  },
  thread: {
    targetAreas: ['Joues', 'Sillons nasogéniens', 'Mâchoire', 'Cou'],
    idealFor: [
      'Personnes recherchant un effet lifting immédiat',
      'Personnes souhaitant améliorer le relâchement facial',
      'Personnes recherchant un contour en V',
      'Personnes souhaitant à la fois un lifting et une stimulation du collagène',
    ],
    cautions: [
      'Un gonflement ou des ecchymoses peuvent apparaître après le traitement',
      'Éviter les expressions excessives et les massages pendant environ 1 à 2 semaines',
      'Contre-indiqué pour les femmes enceintes ou allaitantes',
    ],
    duration: '30-60 minutes',
    anesthesia: 'Anesthésie locale',
    recovery: '1-7 jours (selon la zone)',
    results: 'Lifting immédiat + stimulation du collagène sur 6-12 mois',
    process: [
      { step: 1, title: 'Consultation', desc: 'Analyse du degré de relâchement et conception de l\'objectif' },
      { step: 2, title: 'Anesthésie', desc: 'Anesthésie locale' },
      { step: 3, title: 'Conception', desc: 'Marquage du tracé des fils' },
      { step: 4, title: 'Traitement', desc: 'Lifting avec des fils résorbables' },
      { step: 5, title: 'Soins après', desc: 'Compression hémostatique et conseils post-traitement' },
    ],
    faqs: [
      {
        q: 'Combien de temps durent les effets du lifting par fils ?',
        shortA: 'L\'effet lifting dure 6-12 mois, la stimulation du collagène est plus longue.',
        a: 'L\'effet lifting dure généralement 6-12 mois. Une fois les fils résorbés, la stimulation du collagène prolonge les bénéfices au-delà.',
      },
      {
        q: 'Y a-t-il une sensation de corps étranger après le traitement ?',
        shortA: 'Une légère sensation initiale qui disparaît en 2-4 semaines.',
        a: 'Une légère sensation de corps étranger peut apparaître les premiers jours et disparaît progressivement en 2 à 4 semaines, restaurant une sensation naturelle.',
      },
    ],
  },
};

// ----- Mongolian (mn, Cyrillic) -----
// Khalkha Mongolian in Cyrillic. Foreign technical names: Cyrillic transliteration + English in parentheses on first mention.
const MN: LocaleMap = {
  ulthera: {
    targetAreas: ['Дух', 'Нүдний эргэн тойрон', 'Хацар', 'Эрүүний шугам', 'Хүзүү'],
    idealFor: [
      'Мэс заслын бус лифтинг хүсэж буй хүмүүс',
      'Арьс уналт, уян хатан байдал буурахад санаа зовж буй хүмүүс',
      'Байгалийн өөрчлөлт хүсэж буй хүмүүс',
      'Сэргэх хугацаа шаардахгүй эмчилгээ хүсэж буй хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа бага зэргийн хавдар, улайлт гарч болно',
      'Хэсгээс хамаарч түр зуурын мэдрэхүйн өөрчлөлт гарч болно',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
      'Эмчилгээний хэсэгт металл суулгац байгаа тохиолдолд урьдчилан зөвлөгөө шаардлагатай',
    ],
    duration: '60-90 минут',
    anesthesia: 'Мэдээ алдуулах тос (30 минут)',
    recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
    results: '3-6 сарын турш аажмаар сайжирч, 1-2 жил үргэлжилнэ',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж эмчилгээний төлөвлөгөө гаргах' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Мэдээгүйжүүлэлт', desc: 'Тав тухтай эмчилгээний төлөө мэдээ алдуулах тос түрхэх' },
      { step: 4, title: 'Эмчилгээ', desc: 'DeepSEE-ээр харж нарийн эмчилгээ хийх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж сэргээлтийн заавар өгөх' },
    ],
    faqs: [
      {
        q: 'Ultherapy Prime (Ультерапи Прайм) эмчилгээ өвдөх үү?',
        shortA: 'Мэдээ алдуулах тосоор ихэнх хүн тэвчиж чадна.',
        a: 'Эмчилгээний өмнө мэдээ алдуулах тос түрхдэг тул ихэнх хүн тэвчиж чадна. Өвдөлтөд мэдрэмтгий хүмүүст нэмэлт өвдөлт намдаах боломжтой.',
      },
      {
        q: 'Үр дүн хэзээнээс гарч эхлэх вэ?',
        shortA: 'Эмчилгээний дараа шууд + 3~6 сарын аажмаар сайжралт.',
        a: 'Эмчилгээний дараа бага зэргийн лифтинг мэдрэгдэж, коллагены сэргэлтийн дагуу 3-6 сарын турш аажмаар сайжирна.',
      },
      {
        q: 'Ultherapy Prime болон Thermage хоёрын ялгаа юу вэ?',
        shortA: 'Ultherapy нь ультра-авиа (HIFU), Thermage нь радио давтамж (RF).',
        a: 'Ultherapy Prime нь HIFU (ультра-авиа) ашиглаж гүн давхаргад хүрч лифтинг хийдэг бол Thermage нь RF (радио давтамж) энергиэр ерөнхий уян хатан байдлыг сайжруулдаг. Хосолж ашиглавал нөхөн нэмэгдэх үр дүн гарна.',
      },
    ],
  },
  thermage: {
    targetAreas: ['Бүх нүүр', 'Нүдний эргэн тойрон', 'Хүзүү', 'Бие'],
    idealFor: [
      'Арьсны уян хатан байдал буурахад санаа зовж буй хүмүүс',
      'Жижиг үрчлээг сайжруулахыг хүсэж буй хүмүүс',
      'Байгалийн, аажмаар өөрчлөлт хүсэж буй хүмүүс',
      'Мэдээгүйжүүлэлтгүй эмчилгээ хүсэж буй хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа түр зуурын улайлт гарч болно',
      'Зүрхний хэмнэлзүүлэгчтэй хүмүүст эмчилгээ хийх боломжгүй',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
      'Эмчилгээний хэсэгт металл суулгац байгаа тохиолдолд зөвлөгөө шаардлагатай',
    ],
    duration: '45-60 минут',
    anesthesia: 'Мэдээгүйжүүлэлтгүй (доргионы технологиор өвдөлт багасгана)',
    recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
    results: 'Шууд уян хатан байдал сайжирч, 3-6 сард коллаген сэргэнэ',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж эмчилгээний төлөвлөгөө гаргах' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Тэмдэглэгээ', desc: 'Эмчилгээний хэсэгт тор тэмдэглэх' },
      { step: 4, title: 'Эмчилгээ', desc: 'AccuREP технологиор тохирсон энерги өгөх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж заавар өгөх' },
    ],
    faqs: [
      {
        q: 'Thermage FLX (Термаж FLX) хуучин хувилбараас ямар ялгаатай вэ?',
        shortA: 'AccuREP энерги автоматаар тохируулдаг, 25% хурдан.',
        a: '4-р үеийн FLX нь AccuREP технологиор арьсанд тохирсон энергийг автоматаар тохируулж, эмчилгээний хугацааг 25%-иар богиносгож, өвдөлтийг бууруулсан.',
      },
      {
        q: 'Эмчилгээний давтамж хэр байх вэ?',
        shortA: 'Жилд 1-2 удаа эмчилгээ хийхийг зөвлөж байна.',
        a: 'Ерөнхийдөө жилд 1-2 удаа санал болгодог. Арьсны төлөв байдлаас хамаарч өөр өөр байх тул зөвлөгөөгөөр тогтооно.',
      },
      {
        q: 'Thermage нүдний эргэн тойрон ашиглаж болох уу?',
        shortA: 'Тийм, Thermage Eye тусгай үзүүрээр боломжтой.',
        a: 'Тийм, Thermage Eye нь нүдний эргэн тойрон зориулсан тусгай үзүүртэй бөгөөд зовхи, нүдний доорх уян хатан байдлыг сайжруулахад үр дүнтэй.',
      },
    ],
  },
  onda: {
    tagline: 'Микро долгионы контуринг',
    targetAreas: ['Нүүр (хацар, эрүүний шугам)', 'Давхар эрүү', 'Хэвлий', 'Хажуу тал', 'Гуя', 'Гар'],
    idealFor: [
      'Уян хатан байдал буурсан бөгөөд хэсэгчилсэн өөх хуримтлагдсан хүмүүс',
      'Сэргэх хугацаагүйгээр сайжруулалт хүсэж буй хүмүүс',
      'Нүүр болон биеийг хамтад нь арчлахыг хүсэж буй хүмүүс',
    ],
    cautions: [
      'Жирэмсэн эсвэл хөхүүл байгаа бол зөвлөгөөний үеэр заавал мэдэгдэнэ үү',
      'Зүрхний хэмнэлзүүлэгч, биед металл суулгацтай бол зөвлөгөөний үеэр заавал мэдэгдэнэ үү',
      'Эмчилгээний хэсэгт үрэвсэл, халдвар, шарх байгаа бол зөвлөгөөний үеэр заавал мэдэгдэнэ үү',
      'Хяналтгүй чихрийн шижин зэрэг суурь өвчтэй бол зөвлөгөөний үеэр заавал мэдэгдэнэ үү',
    ],
    duration: 'Нүүр 15-30 минут / биеийн хэсэг тус бүр ойролцоогоор 10 минут',
    anesthesia: 'Мэдээгүйжүүлэлт шаардлагагүй',
    recovery: 'Сэргэх хугацаагүй (эмчилгээний дараа шууд өдөр тутмын амьдралд эргэн орно)',
    results: '4-12 долоо хоногийн турш аажмаар илэрнэ (хүн бүрд харилцан адилгүй)',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьс болон арьсан доорх өөхний байдлыг шалгаж, эмчилгээний хэсгийг тогтоох' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Бэлтгэл', desc: 'Эмчилгээний хэсгийг тэмдэглэж бэлтгэх' },
      { step: 4, title: 'Эмчилгээ', desc: 'Микро долгионы хандпистаар хэсэг тус бүрээр эмчилгээ хийх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг цэгцэлж арчилгааны заавар өгөх' },
    ],
    faqs: [
      {
        q: 'ONDA (Онда) нь радио давтамжийн (RF) эмчилгээ мөн үү?',
        shortA: 'Үгүй. ONDA нь 2.45GHz микро долгион ашигладаг.',
        a: 'Үгүй. ONDA нь 2.45GHz микро долгионы энерги ашигладаг төхөөрөмж юм. RF (радио давтамж), HIFU (ультра-авиа)-аас энергийн төрөл болон гол үйлчлэх давхаргаараа ялгаатай.',
      },
      {
        q: 'Өвдөх үү? Мэдээгүйжүүлэлт хэрэгтэй юу?',
        shortA: 'Мэдээгүйжүүлэлтгүй хийдэг, дулаан иллэгтэй төстэй мэдрэмж гэж тэмдэглэгддэг.',
        a: 'ONDA-г мэдээгүйжүүлэлтгүйгээр хийдэг. Эмчилгээний үеийн мэдрэмжийг дулаан иллэгтэй төстэй хэмээн тэмдэглэсэн бөгөөд хандпистын хүрэлцээт хөргөлт (ойролцоогоор 5°C) арьсны гадаргууг хамгаална.',
      },
      {
        q: 'Үр дүн хэзээ илрэх вэ?',
        shortA: 'Шууд биш, 4~12 долоо хоногийн турш аажмаар илэрнэ.',
        a: 'ONDA-ийн үр дүн шууд илэрдэггүй. Гэмтсэн өөхийг макрофаг эсүүд аажмаар зайлуулах явцад өөрчлөлт 4-12 долоо хоногийн турш аажмаар илэрч, хүн бүрд харилцан адилгүй байна.',
      },
    ],
  },
  density: {
    targetAreas: ['Дух', 'Нүдний эргэн тойрон', 'Хацар', 'Эрүүний шугам', 'Хүзүү'],
    idealFor: [
      'Хосолсон лифтинг үр дүн хүсэж буй хүмүүс',
      'Шууд үр дүн ба урт хугацааны сайжралтыг хослуулахыг хүсэж буй хүмүүс',
      'Өмнөх лифтинг эмчилгээнд сэтгэл хангалуун бус хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа бага зэргийн хавдар, улайлт гарч болно',
      'Арьсны төлөв байдлаас хамаарч эмчилгээ хийх боломжтой эсэхийг зөвлөгөөгөөр тогтооно',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
    ],
    duration: '40-60 минут',
    anesthesia: 'Мэдээ алдуулах тос (сонголтоор)',
    recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
    results: 'Шууд лифтинг + 3-6 сарын коллаген сэргэлт',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж эмчилгээний төлөвлөгөө гаргах' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Мэдээгүйжүүлэлт', desc: 'Шаардлагатай тохиолдолд мэдээ алдуулах тос түрхэх' },
      { step: 4, title: 'Эмчилгээ', desc: 'RF радио давтамжийн лифтинг эмчилгээ' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж заавар өгөх' },
    ],
    faqs: [
      {
        q: 'Densiti (Денсити) нь Ultherapy Prime, Thermage-ээс юугаараа ялгаатай вэ?',
        shortA: 'Densiti нь зардал багатай эхлэл RF лифтинг төхөөрөмж.',
        a: 'Densiti нь Thermage-тай адил RF (радио давтамжийн) лифтинг ангилалд багтдаг боловч илүү боломжийн үнэ, бага өвдөлттэй тул лифтинг эмчилгээг эхлүүлэхэд тохиромжтой. Ultherapy Prime, Shurink зэрэг HIFU төхөөрөмжтэй хослуулан давхар уян хатан эмчилгээ хийж болно.',
      },
      {
        q: 'Эмчилгээний хоорондох завсар хэр байх вэ?',
        shortA: '3~6 сарын завсар санал болгож байна.',
        a: 'Ерөнхийдөө 3-6 сар тутамд нэг эмчилгээ хийхийг зөвлөж, арьсны төлөв байдлаас хамаарч тохируулна.',
      },
    ],
  },
  inmode: {
    targetAreas: ['Эрүүний доод хэсэг', 'Хацар', 'Нүүрний хэлбэр', 'Давхар эрүү', 'Гүн хацар'],
    idealFor: [
      'Эрүүний өөхийг багасгаж уян хатан байдлыг нэмэгдүүлэхийг хүсэж буй хүмүүс',
      'Хацрын лифтинг ба нүүрний хэлбэр сайжруулахыг хүсэж буй хүмүүс',
      'Давхар эрүү, гүн хацрын асуудлыг сайжруулахыг хүсэж буй хүмүүс',
      'Коллагены сэргэлтийг идэвхжүүлж жижиг үрчлээг сайжруулахыг хүсэж буй хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа бага зэргийн хавдар, улайлт гарч болно',
      'Арьсны төлөв байдлаас хамаарч эмчилгээ хийх боломжтой эсэхийг зөвлөгөөгөөр тогтооно',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
    ],
    duration: '30-60 минут',
    anesthesia: 'Мэдээгүйжүүлэлтгүй эсвэл мэдээ алдуулах тос',
    recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
    results: 'Шууд уян хатан байдал + аажмаар коллагены сэргэлт',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж тохирсон үзүүр сонгох' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Мэдээгүйжүүлэлт', desc: 'Эмчилгээний төрлөөс хамаарч хэсэгчилсэн мэдээгүйжүүлэлт' },
      { step: 4, title: 'Эмчилгээ', desc: 'Сонгосон үзүүрээр захиалгат эмчилгээ хийх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж заавар өгөх' },
    ],
    faqs: [
      {
        q: 'InMode (ИнМоуд) хэн бэлэн вэ?',
        shortA: 'Нүүрний өөх ихтэй эсвэл арьс уналт хосолсон асуудалтай хүмүүст.',
        a: 'Нүүрэндээ өөх ихтэй, арьс уналт зэрэг хосолсон асуудалтай үйлчлүүлэгчдэд санал болгодог. Өөхний давхарга ба дермисийн давхаргыг нэгэн зэрэг идэвхжүүлж лифтинг ба нарийсгах хос үр дүнг үзүүлнэ.',
      },
      {
        q: 'Thermage-тай хослуулбал илүү үр дүнтэй юу?',
        shortA: 'Тийм, RF синерги нэмэгдсэн уян хатан байдлыг өгнө.',
        a: 'Тийм, InMode-ийг Thermage-тай хослуулбал хоёр RF технологийн синергигээр илүү хүчтэй уян хатан байдлыг олж авах боломжтой.',
      },
    ],
  },
  shurink: {
    targetAreas: ['Дух', 'Нүдний эргэн тойрон', 'Хацар', 'Эрүүний шугам', 'Хүзүү'],
    idealFor: [
      'Лифтинг эмчилгээг анх удаа хийх хүмүүс',
      'Эмчилгээний хугацаа богино байхыг хүсэж буй хүмүүс',
      'Боломжийн үнээр лифтинг хийхийг хүсэж буй хүмүүс',
      'Тогтмол арчилгаа хийхийг хүсэж буй хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа бага зэргийн улайлт гарч болно',
      'Мэдрэмтгий арьстай хүмүүс урьдчилан зөвлөгөө шаардлагатай',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
    ],
    duration: '30-45 минут',
    anesthesia: 'Мэдээ алдуулах тос (сонголтоор)',
    recovery: 'Шууд өдөр тутмын амьдралд эргэн орох боломжтой',
    results: '2-4 долоо хоногийн дараа үр дүн харагдаж, 3 сард дээд хэмжээнд хүрнэ',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Арьсны төлөв байдлыг шинжилж эмчилгээний төлөвлөгөө гаргах' },
      { step: 2, title: 'Цэвэрлэгээ', desc: 'Гоо сайхны бүтээгдэхүүн арилгаж арьсыг бэлдэх' },
      { step: 3, title: 'Мэдээгүйжүүлэлт', desc: 'Сонголтоор мэдээ алдуулах тос' },
      { step: 4, title: 'Эмчилгээ', desc: 'Хэсэгт тохирсон үзүүрийг сонгож эмчилгээ хийх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Эмчилгээний хэсгийг тайвшруулж заавар өгөх' },
    ],
    faqs: [
      {
        q: 'Ultherapy Prime болон Shurink (Шүрэнк) ямар ялгаатай вэ?',
        shortA: 'Хоёулаа HIFU, гэхдээ Shurink нь өдөр тутмын арчилгаанд тохиромжтой үнэтэй.',
        a: 'Хоёр төхөөрөмж хоёулаа HIFU зарчимд тулгуурладаг. Ultherapy Prime нь DeepSEE харагдах технологитой, гүн давхаргад хүрдэг. Shurink нь хурдан, үнийн хувьд боломжийн тул тогтмол арчилгаанд тохиромжтой.',
      },
      {
        q: 'Эмчилгээний давтамж яаж тогтоох вэ?',
        shortA: '3~6 сарын завсар, арчилгааны эмчилгээнд тохиромжтой.',
        a: 'Ерөнхийдөө 3-6 сар тутамд нэг удаа санал болгож, Ultherapy Prime эсвэл Thermage хоорондох арчилгааны эмчилгээ болгон ашиглах боломжтой.',
      },
    ],
  },
  thread: {
    targetAreas: ['Хацар', 'Хамар амны нугарал', 'Эрүүний шугам', 'Хүзүү'],
    idealFor: [
      'Шууд лифтинг үр дүн хүсэж буй хүмүүс',
      'Нүүрний уналтыг сайжруулахыг хүсэж буй хүмүүс',
      'V хэлбэрийн контур хүсэж буй хүмүүс',
      'Лифтинг болон коллагены идэвхжүүлэлтийг хосолж хүсэж буй хүмүүс',
    ],
    cautions: [
      'Эмчилгээний дараа хавдар, хөхрөлт гарч болно',
      '1-2 долоо хоног хэт их нүүрний хөдөлгөөн, иллэгийг хязгаарлах хэрэгтэй',
      'Жирэмсэн эх, хөхүүл эхэд эмчилгээ хийх боломжгүй',
    ],
    duration: '30-60 минут',
    anesthesia: 'Хэсэгчилсэн мэдээгүйжүүлэлт',
    recovery: '1-7 хоног (хэсгээс хамаарч)',
    results: 'Шууд лифтинг + 6-12 сарын коллагены идэвхжүүлэлт',
    process: [
      { step: 1, title: 'Зөвлөгөө', desc: 'Нүүрний уналтын хэмжээг шинжилж зорилтот дизайн гаргах' },
      { step: 2, title: 'Мэдээгүйжүүлэлт', desc: 'Хэсэгчилсэн мэдээгүйжүүлэлт хийх' },
      { step: 3, title: 'Дизайн', desc: 'Утсан лифтингийн чиглэлийг тэмдэглэх' },
      { step: 4, title: 'Эмчилгээ', desc: 'Шингээгдэх утсаар лифтинг хийх' },
      { step: 5, title: 'Дараах арчилгаа', desc: 'Цусыг зогсооход дарж заавар өгөх' },
    ],
    faqs: [
      {
        q: 'Утсан лифтингийн (Thread lifting) үр дүн хэр удаан үргэлжлэх вэ?',
        shortA: 'Лифтинг үр дүн 6-12 сар, коллагены идэвхжүүлэлт илүү удаан.',
        a: 'Лифтинг үр дүн ерөнхийдөө 6-12 сар үргэлжилнэ. Утас уусаны дараа ч коллагены идэвхжүүлэлтийн үр дүн илүү удаан үргэлжлэнэ.',
      },
      {
        q: 'Утсан лифтингийн дараа гадны мэдрэмж байх уу?',
        shortA: 'Эхэн үед бага зэрэг, 2-4 долоо хоногт алга болно.',
        a: 'Эмчилгээний эхэн үед бага зэргийн гадны мэдрэмж байж болох ч 2-4 долоо хоногийн дотор аажмаар алга болж, байгалийн мэдрэмжээ сэргээнэ.',
      },
    ],
  },
};

// ----- Arabic (ar, MSA, RTL) -----
// Modern Standard Arabic. Western numerals (60-90) used per international medical convention.
const AR: LocaleMap = {
  ulthera: {
    targetAreas: ['الجبهة', 'محيط العين', 'الخدود', 'خط الفك', 'الرقبة'],
    idealFor: [
      'الباحثون عن شد غير جراحي',
      'المعانون من ترهل الجلد وفقدان المرونة',
      'الراغبون في نتائج طبيعية',
      'الراغبون في علاج بدون فترة نقاهة',
    ],
    cautions: [
      'قد يظهر تورم خفيف أو احمرار بعد العلاج',
      'قد تحدث تغيرات حسية مؤقتة حسب المنطقة',
      'غير مناسب للحوامل أو المرضعات',
      'يتطلب استشارة في حالة وجود زرعات معدنية في منطقة العلاج',
    ],
    duration: '60-90 دقيقة',
    anesthesia: 'كريم مخدر موضعي (30 دقيقة)',
    recovery: 'العودة الفورية إلى الحياة اليومية',
    results: 'تحسن تدريجي على مدى 3-6 أشهر، يستمر 1-2 سنة',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل البشرة وتخطيط العلاج' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التخدير', desc: 'تطبيق كريم مخدر للراحة' },
      { step: 4, title: 'العلاج', desc: 'علاج دقيق بتوجيه نظام DeepSEE في الوقت الفعلي' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'هل علاج ألثرابي برايم (Ultherapy Prime) مؤلم؟',
        shortA: 'مع الكريم المخدر، يتحمله معظم المرضى.',
        a: 'نقوم بتطبيق كريم مخدر موضعي قبل العلاج، فيتحمله معظم الناس. كما تتوفر إدارة إضافية للألم للمرضى الحساسين.',
      },
      {
        q: 'متى تظهر النتائج؟',
        shortA: 'تأثير فوري + تحسن تدريجي على مدى 3-6 أشهر.',
        a: 'يُلاحظ تأثير شد طفيف فوراً بعد العلاج، ثم يتحسن تدريجياً خلال 3-6 أشهر مع تجدد الكولاجين.',
      },
      {
        q: 'ما الفرق بين ألثرابي برايم وثيرماج (Thermage)؟',
        shortA: 'ألثرابي يستخدم HIFU (الموجات فوق الصوتية)، وثيرماج يستخدم RF.',
        a: 'يستخدم ألثرابي برايم تقنية HIFU (الموجات فوق الصوتية المركزة) ويصل إلى طبقات الشد العميقة، بينما يستخدم ثيرماج تقنية RF (الترددات الراديوية) ويُحسّن المرونة الكلية. يُحقق الجمع بينهما تأثيراً تآزرياً.',
      },
    ],
  },
  thermage: {
    targetAreas: ['الوجه بأكمله', 'محيط العين', 'الرقبة', 'الجسم'],
    idealFor: [
      'المعانون من انخفاض مرونة البشرة',
      'الراغبون في تحسين الخطوط الدقيقة',
      'الراغبون في تغير طبيعي وتدريجي',
      'المفضلون لعلاج بدون تخدير',
    ],
    cautions: [
      'قد يظهر احمرار مؤقت بعد العلاج',
      'غير مناسب لمرضى منظم ضربات القلب',
      'غير مناسب للحوامل أو المرضعات',
      'يتطلب استشارة في حالة وجود زرعات معدنية في منطقة العلاج',
    ],
    duration: '45-60 دقيقة',
    anesthesia: 'بدون تخدير (تقنية الاهتزاز تُقلل من الإحساس بالألم)',
    recovery: 'العودة الفورية إلى الحياة اليومية',
    results: 'تحسن فوري في المرونة، وتجدد الكولاجين على مدى 3-6 أشهر',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل البشرة وتخطيط العلاج' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التحديد', desc: 'تطبيق شبكة العلاج على المنطقة المستهدفة' },
      { step: 4, title: 'العلاج', desc: 'طاقة مخصصة عبر تقنية AccuREP' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'كيف يختلف ثيرماج FLX عن الإصدارات السابقة؟',
        shortA: 'تقنية AccuREP تُعدّل الطاقة تلقائياً، أسرع بنسبة 25%.',
        a: 'يستخدم الجيل الرابع FLX تقنية AccuREP لمطابقة الطاقة تلقائياً مع مقاومة البشرة، ويُقلل وقت العلاج بنسبة 25% ويُخفف الإحساس بالألم.',
      },
      {
        q: 'ما هو الفاصل الزمني المُوصى به بين العلاجات؟',
        shortA: 'نوصي بجلسة إلى جلستين سنوياً.',
        a: 'عموماً 1-2 مرة سنوياً. يعتمد الإيقاع الدقيق على حالة البشرة، ويُحدَّد خلال الاستشارة.',
      },
      {
        q: 'هل يمكن استخدام ثيرماج على محيط العين؟',
        shortA: 'نعم، يستخدم Thermage Eye قطعة مخصصة لمحيط العين.',
        a: 'نعم. يستخدم Thermage Eye قطعة مخصصة لمحيط العين، وهو فعّال لتحسين مرونة الجفون وما تحت العينين.',
      },
    ],
  },
  onda: {
    tagline: 'نحت بالموجات الميكروية',
    targetAreas: ['الوجه (الخدود، خط الفك)', 'الذقن المزدوج', 'البطن', 'الخاصرتان', 'الفخذان', 'الذراعان'],
    idealFor: [
      'من يعانون من انخفاض المرونة مع تجمعات دهنية موضعية',
      'الراغبون في تحسّن دون فترة نقاهة',
      'الراغبون في العناية بالوجه والجسم معاً',
    ],
    cautions: [
      'يُرجى إخبارنا أثناء الاستشارة في حال الحمل أو الرضاعة',
      'يُرجى إخبارنا أثناء الاستشارة في حال وجود منظم لضربات القلب أو زرعات معدنية في الجسم',
      'يُرجى إخبارنا أثناء الاستشارة في حال وجود التهاب أو عدوى أو جرح في منطقة العلاج',
      'يُرجى إخبارنا أثناء الاستشارة في حال وجود مرض مزمن مثل السكري غير المنضبط',
    ],
    duration: 'الوجه 15-30 دقيقة / حوالي 10 دقائق لكل منطقة من الجسم',
    anesthesia: 'لا يتطلب تخديراً',
    recovery: 'بدون فترة نقاهة (العودة إلى الحياة اليومية مباشرة بعد العلاج)',
    results: 'تظهر تدريجياً على مدى 4-12 أسبوعاً (تختلف من شخص لآخر)',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تقييم حالة البشرة والدهون تحت الجلد وتحديد مناطق العلاج' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التحضير', desc: 'تحديد منطقة العلاج والتحضير للجلسة' },
      { step: 4, title: 'العلاج', desc: 'علاج كل منطقة بقطعة اليد العاملة بالموجات الميكروية' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة المعالجة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'هل ONDA (أوندا) علاج بالترددات الراديوية (RF)؟',
        shortA: 'لا. يستخدم أوندا موجات ميكروية بتردد 2.45 غيغاهرتز.',
        a: 'لا. أوندا جهاز يستخدم طاقة الموجات الميكروية بتردد 2.45 غيغاهرتز. ويختلف عن RF (الترددات الراديوية) وHIFU (الموجات فوق الصوتية) في نوع الطاقة وفي الطبقات التي يعمل عليها بشكل رئيسي.',
      },
      {
        q: 'هل هو مؤلم؟ وهل يتطلب تخديراً؟',
        shortA: 'يُجرى بدون تخدير، ويُوصف الإحساس بأنه قريب من مساج دافئ.',
        a: 'يُجرى أوندا بدون تخدير. ويُوصف الإحساس أثناء الجلسة بأنه قريب من مساج دافئ، كما يحمي التبريد التلامسي لقطعة اليد (حوالي 5 درجات مئوية) سطح البشرة.',
      },
      {
        q: 'متى تظهر النتائج؟',
        shortA: 'ليست فورية، بل تظهر تدريجياً على مدى 4-12 أسبوعاً.',
        a: 'نتائج أوندا ليست فورية. فمع إزالة الخلايا الدهنية المتضررة تدريجياً بواسطة البلاعم، تظهر التغيرات على مدى 4 إلى 12 أسبوعاً، وتختلف من شخص لآخر.',
      },
    ],
  },
  density: {
    targetAreas: ['الجبهة', 'محيط العين', 'الخدود', 'خط الفك', 'الرقبة'],
    idealFor: [
      'الباحثون عن تأثير شد مُركب',
      'الراغبون في الجمع بين التأثير الفوري والتحسن طويل الأمد',
      'غير الراضين عن علاجات الشد السابقة',
    ],
    cautions: [
      'قد يظهر تورم خفيف أو احمرار بعد العلاج',
      'يتطلب استشارة حسب حالة البشرة للتأكد من الأهلية',
      'غير مناسب للحوامل أو المرضعات',
    ],
    duration: '40-60 دقيقة',
    anesthesia: 'كريم مخدر (اختياري)',
    recovery: 'العودة الفورية إلى الحياة اليومية',
    results: 'شد فوري + تجدد الكولاجين على مدى 3-6 أشهر',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل البشرة وتخطيط العلاج' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التخدير', desc: 'تطبيق كريم مخدر عند الحاجة' },
      { step: 4, title: 'العلاج', desc: 'شد بتقنية الترددات الراديوية RF' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'ما الفرق بين دنسيتي (Densiti) وألثرابي برايم وثيرماج؟',
        shortA: 'دنسيتي جهاز RF اقتصادي للبدء بإدارة الشد.',
        a: 'ينتمي دنسيتي إلى فئة الشد بالترددات الراديوية (RF) مثل ثيرماج، لكنه يُقدّم سعراً أكثر معقولية وألماً أقل، مما يجعله مناسباً للبدء بإدارة الشد. وعند دمجه مع أجهزة HIFU مثل ألثرابي برايم أو شورينك، يُحقق علاجاً مُركباً للمرونة عبر طبقات متعددة.',
      },
      {
        q: 'ما هو الفاصل الزمني المُوصى به بين العلاجات؟',
        shortA: 'يُوصى بفاصل 3-6 أشهر.',
        a: 'يُوصى عادةً بجلسة كل 3-6 أشهر، مع تعديلها حسب حالة البشرة.',
      },
    ],
  },
  inmode: {
    targetAreas: ['تحت الذقن', 'الخدود', 'كنتور الوجه', 'الذقن المزدوج', 'الخدود العميقة'],
    idealFor: [
      'الراغبون في تقليل دهون الذقن وتعزيز المرونة',
      'الراغبون في تحسين شد الخدود وكنتور الوجه',
      'الراغبون في تحسين الذقن المزدوج والخدود العميقة',
      'الراغبون في تعزيز تجدد الكولاجين وتحسين الخطوط الدقيقة',
    ],
    cautions: [
      'قد يظهر تورم خفيف أو احمرار بعد العلاج',
      'يتطلب استشارة حسب حالة البشرة للتأكد من الأهلية',
      'غير مناسب للحوامل أو المرضعات',
    ],
    duration: '30-60 دقيقة',
    anesthesia: 'بدون تخدير أو كريم مخدر',
    recovery: 'العودة الفورية إلى الحياة اليومية',
    results: 'مرونة فورية + تجدد تدريجي للكولاجين',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل حالة البشرة واختيار القطعة المناسبة' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التخدير', desc: 'تخدير موضعي حسب نوع العلاج' },
      { step: 4, title: 'العلاج', desc: 'علاج مخصص بالقطعة المختارة' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'لمن يُناسب علاج إن مود (InMode)؟',
        shortA: 'للأشخاص الذين يعانون من دهون وجهية وترهل جلدي مُجتمعَين.',
        a: 'يُوصى به للمرضى الذين يعانون من زيادة دهون الوجه وترهل الجلد معاً. يُحفّز InMode طبقة الدهون والأدمة معاً، مُحققاً تأثيراً مزدوجاً للشد وتنحيف الوجه.',
      },
      {
        q: 'هل دمجه مع ثيرماج يُعطي نتائج أفضل؟',
        shortA: 'نعم، التآزر بين تقنيتي RF يُحسّن المرونة بشكل أكبر.',
        a: 'نعم، دمج إن مود مع ثيرماج يُحقق تحسناً أكبر في المرونة بفضل تآزر تقنيتي الترددات الراديوية.',
      },
    ],
  },
  shurink: {
    targetAreas: ['الجبهة', 'محيط العين', 'الخدود', 'خط الفك', 'الرقبة'],
    idealFor: [
      'الذين يخضعون لعلاج شد لأول مرة',
      'الراغبون في علاج قصير المدة',
      'الباحثون عن شد بسعر معقول',
      'الراغبون في الصيانة الدورية',
    ],
    cautions: [
      'قد يظهر احمرار خفيف بعد العلاج',
      'يتطلب استشارة مسبقة لأصحاب البشرة الحساسة',
      'غير مناسب للحوامل أو المرضعات',
    ],
    duration: '30-45 دقيقة',
    anesthesia: 'كريم مخدر (اختياري)',
    recovery: 'العودة الفورية إلى الحياة اليومية',
    results: 'تظهر النتائج الأولى بعد 2-4 أسابيع، وتصل الذروة في 3 أشهر',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل البشرة وتخطيط العلاج' },
      { step: 2, title: 'التنظيف', desc: 'إزالة المكياج وتحضير البشرة' },
      { step: 3, title: 'التخدير', desc: 'كريم مخدر اختياري' },
      { step: 4, title: 'العلاج', desc: 'اختيار القطعة المناسبة لكل منطقة' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'تهدئة المنطقة وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'ما الفرق بين ألثرابي برايم وشورينك (Shurink)؟',
        shortA: 'كلاهما HIFU، لكن شورينك يُقدّم قيمة أفضل للصيانة.',
        a: 'يعتمد كلاهما على تقنية HIFU. يتميز ألثرابي برايم بتقنية الرؤية DeepSEE ويصل إلى طبقات أعمق، بينما شورينك أسرع وبسعر معقول، مناسب للإدارة الدورية.',
      },
      {
        q: 'ما هو دورة العلاج؟',
        shortA: 'فاصل 3-6 أشهر، مناسب للعلاج التحفيظي.',
        a: 'يُوصى عادةً بجلسة كل 3-6 أشهر. يُعدّ شورينك أيضاً مناسباً كعلاج صيانة بين جلسات ألثرابي برايم أو ثيرماج.',
      },
    ],
  },
  thread: {
    targetAreas: ['الخدود', 'الخطوط الأنفية الشفوية', 'خط الفك', 'الرقبة'],
    idealFor: [
      'الراغبون في تأثير شد فوري',
      'الراغبون في تحسين ترهل الوجه',
      'الباحثون عن كنتور على شكل V',
      'الراغبون في الشد وتحفيز الكولاجين معاً',
    ],
    cautions: [
      'قد يظهر تورم أو كدمات بعد العلاج',
      'يجب تجنب التعابير المُفرطة والتدليك لمدة 1-2 أسبوع',
      'غير مناسب للحوامل أو المرضعات',
    ],
    duration: '30-60 دقيقة',
    anesthesia: 'تخدير موضعي',
    recovery: '1-7 أيام (حسب المنطقة)',
    results: 'شد فوري + تحفيز الكولاجين على مدى 6-12 شهراً',
    process: [
      { step: 1, title: 'الاستشارة', desc: 'تحليل درجة الترهل وتصميم الهدف' },
      { step: 2, title: 'التخدير', desc: 'تخدير موضعي' },
      { step: 3, title: 'التصميم', desc: 'رسم اتجاه الخيوط' },
      { step: 4, title: 'العلاج', desc: 'الشد بخيوط قابلة للذوبان' },
      { step: 5, title: 'الرعاية بعد العلاج', desc: 'الضغط لوقف النزيف وشرح الرعاية اللاحقة' },
    ],
    faqs: [
      {
        q: 'كم تدوم نتائج شد الخيوط (Thread lifting)؟',
        shortA: 'تأثير الشد يدوم 6-12 شهراً، وتحفيز الكولاجين أطول.',
        a: 'يدوم تأثير الشد عادةً 6-12 شهراً. وبعد ذوبان الخيوط، يستمر تأثير تحفيز الكولاجين لفترة أطول.',
      },
      {
        q: 'هل يوجد إحساس بجسم غريب بعد العلاج؟',
        shortA: 'إحساس طفيف في البداية، يختفي خلال 2-4 أسابيع.',
        a: 'قد يظهر إحساس طفيف بجسم غريب في الأيام الأولى، ويختفي تدريجياً خلال 2-4 أسابيع، مما يُعيد الإحساس الطبيعي.',
      },
    ],
  },
};

const MAPS: Partial<Record<Locale, LocaleMap>> = {
  ko: {}, // ko uses constants.ts as-is
  en: EN,
  zh: ZH,
  ja: JA,
  // Phase 1 신규 locale: 메시지 파일 번역 1차 완료 후 LocaleMap 추가 예정.
  // 현 시점은 ko fallback (constants.ts의 한국어 baseline) 동작.
  'zh-TW': {},
  vi: {},
  th: {},
  ru: {},
  // i18n-treatments-fr-mn-ar (2026-05-11): 6 lifting treatments per locale. Antiaging uses messages/*.json directly.
  fr: FR,
  mn: MN,
  ar: AR,
};

/**
 * Merges the base (Korean) treatment data with locale-specific overrides.
 * Fields present in the locale override win; otherwise fall back to base.
 */
export function getLocalizedTreatment<T extends TreatmentL10n>(
  base: T,
  treatmentId: string,
  locale: string,
): T & TreatmentL10n {
  const localeMap = MAPS[locale as Locale] ?? {};
  const override = localeMap[treatmentId];
  if (!override) return base;
  return { ...base, ...override };
}

/**
 * Localized "Related Treatments" name/description for zh only.
 * For other locales, components can continue using base Korean names.
 */
export const RELATED_TREATMENTS_L10N: Partial<Record<Locale, Record<string, { name: string; desc: string }>>> = {
  ko: {},
  en: {},
  zh: {
    ulthera: { name: '超声刀Prime', desc: '获美国FDA和韩国食药处批准，HIFU提升的全球标准' },
    thermage: { name: '热玛吉FLX', desc: '全球公认的高频提升精品' },
    shurink: { name: '舒颜萃', desc: '合理的超声弹力疗程' },
    thread: { name: '线雕提升', desc: '用可吸收线完成V脸提升' },
    inmode: { name: 'InMode', desc: '利用RF能量同时减脂和提升' },
    density: { name: 'Densiti', desc: '利用高频(RF)能量实现均匀光滑的提升' },
    botox: { name: '肉毒素', desc: '自然的皱纹改善与轮廓整理' },
    filler: { name: '玻尿酸', desc: '用透明质酸填充的自然体积' },
    skinbooster: { name: '皮肤助推剂', desc: '真皮层注射改善水分、再生与弹力' },
    laser: { name: '激光中心', desc: '多种激光治疗提升肌肤状态' },
  },
  ja: {},
  fr: {
    ulthera: { name: 'Ultherapy Prime', desc: 'Standard mondial du lifting HIFU, approuvé par la FDA américaine et la KFDA' },
    thermage: { name: 'Thermage FLX', desc: 'Le summum reconnu mondialement du lifting par radiofréquence' },
    shurink: { name: 'Shurink Universe', desc: 'Soin d\'élasticité ultrasonique au rapport qualité-prix raisonnable' },
    thread: { name: 'Lifting par fils', desc: 'Lifting en V avec fils résorbables' },
    inmode: { name: 'InMode', desc: 'Réduction de graisse et lifting simultanés grâce à l\'énergie RF' },
    density: { name: 'Densiti', desc: 'Lifting uniforme et lisse grâce à l\'énergie RF haute fréquence' },
    botox: { name: 'Botox', desc: 'Amélioration naturelle des rides et affinage du contour' },
    filler: { name: 'Acide hyaluronique', desc: 'Volume naturel par injection d\'acide hyaluronique' },
    skinbooster: { name: 'Skinbooster', desc: 'Injection dermique pour hydratation, régénération et élasticité' },
    laser: { name: 'Centre laser', desc: 'Diverses thérapies laser pour améliorer l\'état de la peau' },
  },
  mn: {
    ulthera: { name: 'Ultherapy Prime (Ультерапи Прайм)', desc: 'АНУ-ын FDA болон Солонгосын KFDA-ээс зөвшөөрөгдсөн HIFU лифтингийн дэлхийн стандарт' },
    thermage: { name: 'Thermage FLX (Термаж FLX)', desc: 'Радио давтамжийн лифтингийн дэлхийн нэр хүндтэй шилдэг бүтээгдэхүүн' },
    shurink: { name: 'Shurink Universe (Шүрэнк Юниверс)', desc: 'Хүртээмжтэй үнэтэй ультра-авианы уян хатан эмчилгээ' },
    thread: { name: 'Утсан лифтинг (Thread lifting)', desc: 'Шингээгдэх утсаар V-хэлбэрийн лифтинг' },
    inmode: { name: 'InMode (ИнМоуд)', desc: 'RF энергийг ашиглан өөхний бууралт болон лифтингийг нэгэн зэрэг' },
    density: { name: 'Densiti (Денсити)', desc: 'Өндөр давтамжийн (RF) энергийг ашиглан тэгш гөлгөр лифтинг' },
    botox: { name: 'Ботокс (Botox)', desc: 'Үрчлээний байгалийн сайжралт ба контур засвар' },
    filler: { name: 'Филлер (Filler)', desc: 'Гиалуроны хүчилээр байгалийн эзлэхүүн' },
    skinbooster: { name: 'Скинбүүстер (Skinbooster)', desc: 'Чийгшил, сэргэлт, уян хатан байдлыг сайжруулах дермисийн тарилга' },
    laser: { name: 'Лазер төв (Laser Center)', desc: 'Арьсны төлөв сайжруулах олон төрлийн лазер эмчилгээ' },
  },
  ar: {
    ulthera: { name: 'ألثرابي برايم (Ultherapy Prime)', desc: 'المعيار العالمي للشد بتقنية HIFU، معتمد من إدارة الغذاء والدواء الأمريكية والكورية' },
    thermage: { name: 'ثيرماج FLX (Thermage FLX)', desc: 'الجوهرة المعترف بها عالمياً لشد البشرة بالترددات الراديوية' },
    shurink: { name: 'شورينك يونيفرس (Shurink Universe)', desc: 'علاج مرونة بالموجات فوق الصوتية بسعر معقول' },
    thread: { name: 'شد الخيوط', desc: 'شد على شكل V بخيوط قابلة للذوبان' },
    inmode: { name: 'إن مود (InMode)', desc: 'تقليل الدهون والشد في آن واحد بطاقة الترددات الراديوية' },
    density: { name: 'دنسيتي (Densiti)', desc: 'شد متجانس وناعم بطاقة الترددات الراديوية العالية' },
    botox: { name: 'البوتوكس', desc: 'تحسين طبيعي للتجاعيد وتنسيق الكنتور' },
    filler: { name: 'الفيلر / حمض الهيالورونيك', desc: 'حجم طبيعي بحقن حمض الهيالورونيك' },
    skinbooster: { name: 'سكين بوستر', desc: 'حقن في الأدمة لتحسين الترطيب والتجديد والمرونة' },
    laser: { name: 'مركز الليزر', desc: 'علاجات ليزر متنوعة لتحسين حالة البشرة' },
  },
};

export function getRelatedTreatmentLabel(
  treatmentId: string,
  locale: string,
): { name: string; desc: string } | null {
  const map = RELATED_TREATMENTS_L10N[locale as Locale] ?? {};
  return map[treatmentId] ?? null;
}
