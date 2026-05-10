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
};

export function getRelatedTreatmentLabel(
  treatmentId: string,
  locale: string,
): { name: string; desc: string } | null {
  const map = RELATED_TREATMENTS_L10N[locale as Locale] ?? {};
  return map[treatmentId] ?? null;
}
