/**
 * consultPrep 네임스페이스를 11개 로케일에 삽입한다.
 *
 * 메시지 JSON은 줄 중간에 고립된 \r 이 있어(예: ko.json 의 chat.promoCta 줄)
 * 정규식 줄 분할이 바이트를 삼킨다. \n 만 경계로 삼고, 편집 전에
 * 라운드트립을 반드시 확인한다.
 *
 * 1차 지원 언어(ko/en/ja/zh) 외 7개 로케일에는 en 문구를 넣는다 —
 * 그 로케일에서는 진입점을 노출하지 않으므로 화면에 뜨지 않고,
 * verify:i18n 의 키 정합성만 만족시키면 된다.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'D:/dev/LIV_homepage/liv-clinic/src/messages/';
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const WRITE = process.argv.includes('--write');

const T = {
  ko: {
    title: '상담 준비 카드', step1Title: '이 고민이 맞으신가요?',
    step2Title: '어떻게 보이는 게 제일 신경 쓰이세요?',
    step2Placeholder: '예) 웃을 때 턱선이 흐려 보여요 / 오후만 되면 처져 보여요 / 사진에서 나이 들어 보여요',
    step2Required: '한 줄만 적어주세요 (2자 이상)',
    step3Title: '언제까지 필요하세요?',
    step3None: '특별한 일정 없음', step3Wedding: '자녀 결혼식', step3Meeting: '상견례',
    step3Reunion: '동창회·모임', step3Holiday: '명절', step3Stay: '한국 체류 기간',
    next: '다음', back: '이전', submit: '결과 보기', loading: '정리하고 있습니다',
    card1Title: '말씀하신 건 보통 이렇게 부릅니다',
    card2Title: '이 부위를 다루는 시술',
    card3Title: '상담에서 물어보세요',
    card4Title: '참고',
    lowConfidence: '조금 더 자세히 적어주시면 정확해집니다.',
    consultOnly: '상담에서 확인이 필요합니다',
    labelDuration: '소요시간', labelAnesthesia: '마취', labelRecovery: '회복', labelCautions: '주의사항',
    disclaimer: '이 안내는 진단이 아니며, 상담을 준비하기 위한 참고 자료입니다. 개인차가 있으며 실제 시술 여부와 방법은 의료진 상담으로 결정됩니다.',
    ctaInquiry: '이대로 상담 문의하기',
    error: '잠시 후 다시 시도해주세요.',
  },
  en: {
    title: 'Consultation Prep', step1Title: 'Is this your concern?',
    step2Title: 'What bothers you most about how it looks?',
    step2Placeholder: 'e.g. My jawline blurs when I smile / It looks saggy by afternoon / I look older in photos',
    step2Required: 'Please write one line (2+ characters)',
    step3Title: 'By when do you need this?',
    step3None: 'No particular date', step3Wedding: "My child's wedding", step3Meeting: 'Family meeting',
    step3Reunion: 'Reunion or gathering', step3Holiday: 'Holiday', step3Stay: 'Stay in Korea',
    next: 'Next', back: 'Back', submit: 'See result', loading: 'Organizing',
    card1Title: 'What you described is usually called',
    card2Title: 'Treatments that address this area',
    card3Title: 'Ask these at your consultation',
    card4Title: 'Reference',
    lowConfidence: 'A little more detail would make this more accurate.',
    consultOnly: 'Needs to be confirmed at consultation',
    labelDuration: 'Duration', labelAnesthesia: 'Anesthesia', labelRecovery: 'Recovery', labelCautions: 'Cautions',
    disclaimer: 'This is not a diagnosis. It is reference material to help you prepare for a consultation. Results vary by individual, and whether and how a procedure is performed is decided through consultation with medical staff.',
    ctaInquiry: 'Send this as an inquiry',
    error: 'Please try again in a moment.',
  },
  ja: {
    title: 'カウンセリング準備カード', step1Title: 'このお悩みで合っていますか?',
    step2Title: '見た目でいちばん気になるのはどこですか?',
    step2Placeholder: '例) 笑うとフェイスラインがぼやける / 午後になるとたるんで見える / 写真で老けて見える',
    step2Required: '一行だけ書いてください (2文字以上)',
    step3Title: 'いつまでに必要ですか?',
    step3None: '特に予定なし', step3Wedding: '子どもの結婚式', step3Meeting: '顔合わせ',
    step3Reunion: '同窓会・集まり', step3Holiday: '連休', step3Stay: '韓国滞在期間',
    next: '次へ', back: '戻る', submit: '結果を見る', loading: '整理しています',
    card1Title: 'おっしゃった内容は通常こう呼ばれます',
    card2Title: 'この部位を扱う施術',
    card3Title: 'カウンセリングで聞いてみてください',
    card4Title: '参考',
    lowConfidence: 'もう少し詳しく書いていただくと正確になります。',
    consultOnly: '診察での確認が必要です',
    labelDuration: '所要時間', labelAnesthesia: '麻酔', labelRecovery: '回復', labelCautions: '注意事項',
    disclaimer: 'この案内は診断ではなく、カウンセリングを準備するための参考資料です。個人差があり、実際の施術の可否と方法は医療スタッフとの相談で決まります。',
    ctaInquiry: 'この内容で相談する',
    error: 'しばらくしてからもう一度お試しください。',
  },
  zh: {
    title: '面诊准备卡', step1Title: '是这个困扰吗?',
    step2Title: '外观上最在意的是什么?',
    step2Placeholder: '例) 笑起来下颌线模糊 / 到下午就显得松弛 / 照片里显老',
    step2Required: '请写一行 (2个字以上)',
    step3Title: '需要在什么时候之前?',
    step3None: '没有特别安排', step3Wedding: '子女婚礼', step3Meeting: '双方家长见面',
    step3Reunion: '同学会·聚会', step3Holiday: '假期', step3Stay: '在韩停留期间',
    next: '下一步', back: '上一步', submit: '查看结果', loading: '整理中',
    card1Title: '您描述的情况通常这样称呼',
    card2Title: '处理该部位的项目',
    card3Title: '面诊时可以这样问',
    card4Title: '参考',
    lowConfidence: '再写详细一些会更准确。',
    consultOnly: '需要面诊确认',
    labelDuration: '所需时间', labelAnesthesia: '麻醉', labelRecovery: '恢复', labelCautions: '注意事项',
    disclaimer: '本内容并非诊断，仅为准备面诊的参考资料。个体差异存在，是否进行以及如何进行由医疗人员面诊决定。',
    ctaInquiry: '就以此内容咨询',
    error: '请稍后再试。',
  },
};

function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') { out.push(raw.slice(start, i + 1)); start = i + 1; }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}
const body = (l) => l.replace(/\r*\n$/, '');
const eol = (l) => (l.match(/\r*\n$/) || ['\n'])[0];

let failed = 0;
for (const L of LOCALES) {
  const file = `${DIR}${L}.json`;
  const raw = readFileSync(file, 'utf8');
  if (splitLines(raw).join('') !== raw) { console.log(`!! ${L}: 라운드트립 실패`); failed++; continue; }
  if (JSON.parse(raw).consultPrep) { console.log(`-- ${L}: 이미 있음, 건너뜀`); continue; }

  const lines = splitLines(raw);
  // 최상위 "pricing": { 앞에 넣는다 (위치는 무관하나 결정적이어야 한다)
  const anchor = lines.findIndex((l) => body(l) === '  "pricing": {');
  if (anchor < 0) { console.log(`!! ${L}: 앵커 없음`); failed++; continue; }

  const e = eol(lines[anchor]);
  const t = T[L] ?? T.en;
  const entries = Object.entries(t);
  const block = [
    `  "consultPrep": {${e}`,
    ...entries.map(([k, v], i) =>
      `    ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < entries.length - 1 ? ',' : ''}${e}`),
    `  },${e}`,
  ];
  lines.splice(anchor, 0, ...block);

  const out = lines.join('');
  try { JSON.parse(out); } catch (err) { console.log(`!! ${L}: JSON 깨짐 ${err.message}`); failed++; continue; }
  console.log(`${WRITE ? '기록' : '미리보기'} ${L} (+${block.length}줄)`);
  if (WRITE) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
