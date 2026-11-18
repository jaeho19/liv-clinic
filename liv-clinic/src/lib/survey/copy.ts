import type { PartId, RatingQuestionId, SurveyLocale, TreatmentId } from './questions';

/**
 * 만족도 설문 화면 문구 (ko·en·ja·zh·zh-TW).
 *
 * messages/*.json 에 넣지 않는다 — 설문은 5개 언어만 쓰는데 messages 는 11개 로케일 키를 맞춰야 빌드가 통과하고,
 * 그 파일들은 줄바꿈 형식이 섞여 있어 재직렬화하면 안 된다. 문항은 내국인 기준(대표원장 2026-11-18)이고,
 * 외국어 화면은 같은 문항을 옮긴 것이다. 키가 언어마다 같은지는 __tests__/copy.test.ts 가 확인한다.
 *
 * 문장 안의 {n}·{answered}·{total}·{days} 는 화면에서 숫자로 바꾼다.
 */

export interface TreatmentCopy {
  label: string;
  /** 괄호 안 설명(장비 이름 등). 없으면 빈 문자열 */
  detail: string;
}

export interface SurveyCopy {
  metaTitle: string;
  brand: string;
  title: string;
  intro: string;
  meta: string;
  giftLine: string;
  required: string;
  optional: string;
  progress: string;
  sections: { start: string; overall: string; comment: string };
  firstVisit: { question: string; yes: string; no: string };
  treatments: {
    question: string;
    hint: string;
    items: Record<TreatmentId, TreatmentCopy>;
    otherPlaceholder: string;
  };
  /** 1점~5점 순서 */
  scale: readonly [string, string, string, string, string];
  parts: Record<PartId, { title: string; subtitle: string }>;
  questions: Record<RatingQuestionId, string>;
  skipPart: string;
  skippedNote: string;
  unskipPart: string;
  recommend: { question: string; low: string; high: string };
  comment: { question: string; placeholder: string; privacy: string };
  submit: string;
  submitting: string;
  requiredError: string;
  missingSummary: string;
  networkError: string;
  done: {
    title: string;
    body: string;
    giftTitle: string;
    giftHow: string;
    giftValid: string;
    capture: string;
    noCode: string;
  };
  already: { title: string; body: string };
}

const ko: SurveyCopy = {
  metaTitle: '만족도 설문 | 리브성형외과',
  brand: '리브성형외과',
  title: '만족도 설문',
  intro: '리브성형외과를 찾아 주셔서 감사합니다. 더 나은 진료를 위해 솔직한 의견을 들려주세요.',
  meta: '15문항 · 2분 · 이름과 연락처는 받지 않아요',
  giftLine: '응답을 마치시면 작은 답례품을 드립니다.',
  required: '필수',
  optional: '선택',
  progress: '{answered}/{total} 답함',
  sections: { start: '오늘의 방문', overall: '종합 평가', comment: '자유 의견' },
  firstVisit: {
    question: '오늘이 리브성형외과 첫 방문이신가요?',
    yes: '처음이에요',
    no: '다시 방문했어요',
  },
  treatments: {
    question: '오늘 받으신 시술을 모두 골라 주세요.',
    hint: '여러 개 고를 수 있어요.',
    items: {
      lifting_device: { label: '리프팅 장비', detail: '울쎄라피 프라임·써마지 FLX·덴서티·인모드·온다·슈링크' },
      thread_lift: { label: '실리프팅', detail: '압토스 등' },
      botox: { label: '보톡스', detail: '' },
      filler: { label: '필러', detail: '' },
      skin_booster: { label: '스킨부스터', detail: '' },
      laser: { label: '레이저', detail: '기미·색소·피부톤·홍조' },
      hair_removal: { label: '제모', detail: '' },
      skincare: { label: '스킨케어', detail: '피부관리' },
      consult_only: { label: '상담만 받음', detail: '' },
      other: { label: '기타', detail: '' },
    },
    otherPlaceholder: '시술 이름을 적어 주세요',
  },
  scale: ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'],
  parts: {
    desk: { title: '데스크 코디네이터', subtitle: '예약·접수·수납' },
    counselor: { title: '상담실장', subtitle: '상담·비용 안내' },
    doctor: { title: '담당 원장', subtitle: '진료·설명' },
    nurse: { title: '간호사', subtitle: '시술' },
    skincare: { title: '피부관리사', subtitle: '피부관리' },
    facility: { title: '병원 시설', subtitle: '' },
  },
  questions: {
    desk_kind: '데스크 코디네이터가 친절하게 맞아 주었다.',
    desk_flow: '예약·접수·수납이 빠르고 편리했다.',
    counsel_fit: '상담실장이 내 고민에 꼭 필요한 시술 위주로 권해 주었다.',
    counsel_cost: '상담실장이 시술 비용을 결제 전에 분명하게 안내해 주었다.',
    doctor_explain: '담당 원장님이 내 상태를 직접 보고 이해하기 쉽게 설명해 주었다.',
    doctor_risk: '담당 원장님이 시술 효과와 생길 수 있는 부작용을 미리 알려 주었다.',
    nurse_kind: '간호사가 친절하게 대해 주었다.',
    nurse_pain: '간호사가 시술 중 통증과 불편을 잘 살펴 주었다.',
    skin_kind: '피부관리사가 친절하게 대해 주었다.',
    skin_care: '피부관리사가 관리를 꼼꼼하게 해 주었다.',
    facility_clean: '병원이 청결하고 쾌적했다.',
  },
  skipPart: '오늘 만나지 않았어요',
  skippedNote: '이 파트는 건너뜁니다.',
  unskipPart: '다시 답하기',
  recommend: {
    question: '가족이나 지인에게 리브성형외과를 추천하시겠습니까?',
    low: '전혀 추천 안 함',
    high: '꼭 추천함',
  },
  comment: {
    question: '좋았던 점, 아쉬웠던 점, 칭찬하고 싶은 직원이 있다면 적어 주세요.',
    placeholder: '자유롭게 적어 주세요',
    privacy: '이름·연락처는 적지 말아 주세요.',
  },
  submit: '제출하기',
  submitting: '보내는 중…',
  requiredError: '꼭 답해 주셔야 하는 문항이에요.',
  missingSummary: '꼭 답해야 하는 문항 {n}개가 남았어요.',
  networkError: '보내지 못했어요. 잠시 뒤 다시 눌러 주세요.',
  done: {
    title: '소중한 의견 감사합니다',
    body: '보내 주신 의견은 직원 교육과 진료 개선에만 씁니다.',
    giftTitle: '답례품 번호',
    giftHow: '데스크에 이 번호를 보여 주시면 작은 답례품을 드려요. 오늘 받지 못하셨다면 다음 방문 때 보여 주세요.',
    giftValid: '{days}일 안에 한 번 쓸 수 있어요',
    capture: '이 화면을 캡처해 두시면 편해요.',
    noCode: '답례품 번호를 만들지 못했어요. 데스크에 이 화면을 보여 주세요.',
  },
  already: {
    title: '이미 응답해 주셨어요',
    body: '참여해 주셔서 감사합니다. 받으신 답례품 번호를 다시 보여 드릴게요.',
  },
};

const en: SurveyCopy = {
  metaTitle: 'Satisfaction Survey | LIV Plastic Surgery',
  brand: 'LIV Plastic Surgery',
  title: 'Satisfaction Survey',
  intro: 'Thank you for visiting LIV Plastic Surgery. Please share your honest feedback so we can keep improving our care.',
  meta: '15 questions · 2 minutes · No name or contact details',
  giftLine: 'A small thank-you gift awaits you when you finish.',
  required: 'Required',
  optional: 'Optional',
  progress: '{answered}/{total} answered',
  sections: { start: 'Your visit today', overall: 'Overall', comment: 'Comments' },
  firstVisit: {
    question: 'Is today your first visit to LIV Plastic Surgery?',
    yes: 'First visit',
    no: "I've been here before",
  },
  treatments: {
    question: 'Which treatments did you receive today?',
    hint: 'Select all that apply.',
    items: {
      lifting_device: { label: 'Lifting devices', detail: 'Ultherapy Prime, Thermage FLX, Density, InMode, Onda, Shurink' },
      thread_lift: { label: 'Thread lift', detail: 'Aptos, etc.' },
      botox: { label: 'Botox', detail: '' },
      filler: { label: 'Filler', detail: '' },
      skin_booster: { label: 'Skin booster', detail: '' },
      laser: { label: 'Laser', detail: 'melasma, pigmentation, skin tone, redness' },
      hair_removal: { label: 'Hair removal', detail: '' },
      skincare: { label: 'Skin care', detail: 'facial treatment' },
      consult_only: { label: 'Consultation only', detail: '' },
      other: { label: 'Other', detail: '' },
    },
    otherPlaceholder: 'Name of the treatment',
  },
  scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  parts: {
    desk: { title: 'Front desk coordinator', subtitle: 'Booking, check-in & payment' },
    counselor: { title: 'Consultation manager', subtitle: 'Consultation & pricing' },
    doctor: { title: 'Your doctor', subtitle: 'Examination & explanation' },
    nurse: { title: 'Nurse', subtitle: 'Treatment' },
    skincare: { title: 'Skin care specialist', subtitle: 'Skin care' },
    facility: { title: 'Clinic facilities', subtitle: '' },
  },
  questions: {
    desk_kind: 'The front desk coordinator greeted me warmly.',
    desk_flow: 'Booking, check-in and payment were quick and easy.',
    counsel_fit: 'The consultation manager recommended only the treatments I really needed.',
    counsel_cost: 'The consultation manager explained the cost clearly before I paid.',
    doctor_explain: 'My doctor examined me in person and explained things in a way I could understand.',
    doctor_risk: 'My doctor told me about the expected results and possible side effects in advance.',
    nurse_kind: 'The nurse treated me kindly.',
    nurse_pain: 'The nurse paid attention to my pain and comfort during the treatment.',
    skin_kind: 'The skin care specialist treated me kindly.',
    skin_care: 'The skin care specialist was thorough.',
    facility_clean: 'The clinic was clean and comfortable.',
  },
  skipPart: "I didn't see them today",
  skippedNote: 'This section will be skipped.',
  unskipPart: 'Answer this section',
  recommend: {
    question: 'How likely are you to recommend LIV Plastic Surgery to family or friends?',
    low: 'Not at all likely',
    high: 'Extremely likely',
  },
  comment: {
    question: 'Tell us what you liked, what could be better, or any staff member you would like to thank.',
    placeholder: 'Write freely',
    privacy: 'Please do not include names or contact details.',
  },
  submit: 'Submit',
  submitting: 'Sending…',
  requiredError: 'Please answer this question.',
  missingSummary: '{n} required question(s) still need an answer.',
  networkError: "We couldn't send your answers. Please try again in a moment.",
  done: {
    title: 'Thank you for your feedback',
    body: 'Your answers are used only for staff training and improving our care.',
    giftTitle: 'Gift code',
    giftHow: "Show this code at the front desk to receive a small thank-you gift. If you can't pick it up today, show it on your next visit.",
    giftValid: 'Valid for {days} days · one use only',
    capture: 'Tip: take a screenshot of this screen.',
    noCode: "We couldn't create a gift code. Please show this screen at the front desk.",
  },
  already: {
    title: "You've already answered",
    body: 'Thank you for taking part. Here is your gift code again.',
  },
};

const ja: SurveyCopy = {
  metaTitle: '満足度アンケート | LIV美容クリニック',
  brand: 'LIV美容クリニック',
  title: '満足度アンケート',
  intro: 'LIV美容クリニックにご来院いただきありがとうございます。より良い診療のため、率直なご意見をお聞かせください。',
  meta: '全15問・約2分・お名前やご連絡先は伺いません',
  giftLine: '回答を終えた方に、ささやかなお礼の品をお渡しします。',
  required: '必須',
  optional: '任意',
  progress: '{answered}/{total} 回答済み',
  sections: { start: '本日のご来院', overall: '総合評価', comment: 'ご意見' },
  firstVisit: {
    question: '本日がLIV美容クリニックへの初めてのご来院ですか？',
    yes: '初めて',
    no: '再来院',
  },
  treatments: {
    question: '本日受けられた施術をすべてお選びください。',
    hint: '複数選択できます。',
    items: {
      lifting_device: { label: 'リフティング機器', detail: 'ウルセラピープライム・サーマジFLX・Density・インモード・Onda・Shurink' },
      thread_lift: { label: '糸リフト', detail: 'アプトスなど' },
      botox: { label: 'ボトックス', detail: '' },
      filler: { label: 'ヒアルロン酸フィラー', detail: '' },
      skin_booster: { label: 'スキンブースター', detail: '' },
      laser: { label: 'レーザー', detail: 'シミ・色素・肌トーン・赤み' },
      hair_removal: { label: '脱毛', detail: '' },
      skincare: { label: 'スキンケア', detail: 'フェイシャル' },
      consult_only: { label: 'カウンセリングのみ', detail: '' },
      other: { label: 'その他', detail: '' },
    },
    otherPlaceholder: '施術名をご記入ください',
  },
  scale: ['まったくそう思わない', 'そう思わない', 'どちらともいえない', 'そう思う', 'とてもそう思う'],
  parts: {
    desk: { title: '受付コーディネーター', subtitle: '予約・受付・会計' },
    counselor: { title: 'カウンセラー', subtitle: 'カウンセリング・費用案内' },
    doctor: { title: '担当医師', subtitle: '診察・説明' },
    nurse: { title: '看護師', subtitle: '施術' },
    skincare: { title: 'エステティシャン', subtitle: 'スキンケア' },
    facility: { title: '院内設備', subtitle: '' },
  },
  questions: {
    desk_kind: '受付コーディネーターが親切に迎えてくれた。',
    desk_flow: '予約・受付・会計がスムーズで便利だった。',
    counsel_fit: 'カウンセラーが私の悩みに本当に必要な施術を中心に勧めてくれた。',
    counsel_cost: 'カウンセラーが支払い前に費用をはっきり説明してくれた。',
    doctor_explain: '担当医師が私の状態を直接診て、分かりやすく説明してくれた。',
    doctor_risk: '担当医師が施術の効果と起こりうる副作用を事前に説明してくれた。',
    nurse_kind: '看護師が親切に対応してくれた。',
    nurse_pain: '看護師が施術中の痛みや不快感に気を配ってくれた。',
    skin_kind: 'エステティシャンが親切に対応してくれた。',
    skin_care: 'エステティシャンが丁寧にケアしてくれた。',
    facility_clean: '院内が清潔で快適だった。',
  },
  skipPart: '本日は該当なし',
  skippedNote: 'この項目はスキップします。',
  unskipPart: '回答する',
  recommend: {
    question: 'ご家族やご友人にLIV美容クリニックを勧めたいと思いますか？',
    low: 'まったく勧めない',
    high: 'ぜひ勧めたい',
  },
  comment: {
    question: '良かった点、改善してほしい点、褒めたいスタッフがいればご記入ください。',
    placeholder: 'ご自由にお書きください',
    privacy: 'お名前やご連絡先は書かないでください。',
  },
  submit: '送信する',
  submitting: '送信中…',
  requiredError: 'この質問は回答必須です。',
  missingSummary: '未回答の必須質問が{n}問あります。',
  networkError: '送信できませんでした。少し時間をおいてもう一度お試しください。',
  done: {
    title: 'ご協力ありがとうございました',
    body: 'いただいたご意見は、スタッフ教育と診療の改善にのみ使います。',
    giftTitle: 'お礼の品の番号',
    giftHow: '受付でこの番号をお見せいただくと、ささやかなお礼の品をお渡しします。本日受け取れなかった場合は、次回ご来院時にお見せください。',
    giftValid: '{days}日間有効・1回のみ使用できます',
    capture: 'この画面をスクリーンショットで保存しておくと便利です。',
    noCode: '番号を発行できませんでした。受付でこの画面をお見せください。',
  },
  already: {
    title: 'すでにご回答いただいています',
    body: 'ご協力ありがとうございます。お礼の品の番号をもう一度表示します。',
  },
};

const zh: SurveyCopy = {
  metaTitle: '满意度调查 | LIV整形外科',
  brand: 'LIV整形外科',
  title: '满意度调查',
  intro: '感谢您光临LIV整形外科。为了提供更好的诊疗，请告诉我们您真实的想法。',
  meta: '共15题 · 约2分钟 · 不收集姓名和联系方式',
  giftLine: '完成问卷后，我们将送上一份小礼品。',
  required: '必答',
  optional: '选填',
  progress: '已答 {answered}/{total}',
  sections: { start: '今天的到访', overall: '总体评价', comment: '意见' },
  firstVisit: {
    question: '今天是您第一次来LIV整形外科吗？',
    yes: '第一次',
    no: '再次到访',
  },
  treatments: {
    question: '请选择您今天接受的所有项目。',
    hint: '可多选。',
    items: {
      lifting_device: { label: '提升仪器', detail: '超声刀Prime·热玛吉FLX·Density·InMode·Onda·Shurink' },
      thread_lift: { label: '线雕提升', detail: 'Aptos等' },
      botox: { label: '肉毒素', detail: '' },
      filler: { label: '玻尿酸', detail: '' },
      skin_booster: { label: '水光针', detail: '' },
      laser: { label: '激光', detail: '色斑·色素·肤色·泛红' },
      hair_removal: { label: '脱毛', detail: '' },
      skincare: { label: '皮肤管理', detail: '面部护理' },
      consult_only: { label: '仅咨询', detail: '' },
      other: { label: '其他', detail: '' },
    },
    otherPlaceholder: '请填写项目名称',
  },
  scale: ['非常不同意', '不同意', '一般', '同意', '非常同意'],
  parts: {
    desk: { title: '前台协调员', subtitle: '预约·接待·结账' },
    counselor: { title: '咨询师', subtitle: '咨询·费用说明' },
    doctor: { title: '主治医生', subtitle: '诊疗·说明' },
    nurse: { title: '护士', subtitle: '治疗' },
    skincare: { title: '皮肤管理师', subtitle: '皮肤管理' },
    facility: { title: '医院环境', subtitle: '' },
  },
  questions: {
    desk_kind: '前台协调员热情地接待了我。',
    desk_flow: '预约、登记和结账快捷方便。',
    counsel_fit: '咨询师针对我的困扰，只推荐了我真正需要的项目。',
    counsel_cost: '咨询师在付款前清楚地说明了费用。',
    doctor_explain: '主治医生亲自查看了我的状况，并解释得通俗易懂。',
    doctor_risk: '主治医生事先告知了治疗效果和可能出现的副作用。',
    nurse_kind: '护士待我亲切。',
    nurse_pain: '护士在治疗中细心关注我的疼痛和不适。',
    skin_kind: '皮肤管理师待我亲切。',
    skin_care: '皮肤管理师护理得很细致。',
    facility_clean: '医院干净舒适。',
  },
  skipPart: '今天没有接触过',
  skippedNote: '此部分将跳过。',
  unskipPart: '重新作答',
  recommend: {
    question: '您会向家人或朋友推荐LIV整形外科吗？',
    low: '完全不会',
    high: '一定会',
  },
  comment: {
    question: '请写下您满意的地方、希望改进的地方，或想表扬的员工。',
    placeholder: '请随意填写',
    privacy: '请勿填写姓名或联系方式。',
  },
  submit: '提交',
  submitting: '提交中…',
  requiredError: '此题为必答题。',
  missingSummary: '还有{n}道必答题未作答。',
  networkError: '提交失败，请稍后再试。',
  done: {
    title: '感谢您的宝贵意见',
    body: '您的意见仅用于员工培训和改进诊疗。',
    giftTitle: '礼品编号',
    giftHow: '请在前台出示此编号领取小礼品。如果今天没能领取，下次到访时出示即可。',
    giftValid: '{days}天内有效 · 仅限使用一次',
    capture: '建议截图保存此页面。',
    noCode: '未能生成礼品编号，请在前台出示此页面。',
  },
  already: {
    title: '您已经提交过了',
    body: '感谢您的参与，再次为您显示礼品编号。',
  },
};

const zhTW: SurveyCopy = {
  metaTitle: '滿意度問卷 | LIV整形外科',
  brand: 'LIV整形外科',
  title: '滿意度問卷',
  intro: '感謝您蒞臨LIV整形外科。為了提供更好的診療，請告訴我們您真實的想法。',
  meta: '共15題 · 約2分鐘 · 不收集姓名與聯絡方式',
  giftLine: '完成問卷後，我們將送上一份小禮物。',
  required: '必填',
  optional: '選填',
  progress: '已答 {answered}/{total}',
  sections: { start: '今天的來訪', overall: '整體評價', comment: '意見' },
  firstVisit: {
    question: '今天是您第一次來LIV整形外科嗎？',
    yes: '第一次',
    no: '再次來訪',
  },
  treatments: {
    question: '請選擇您今天接受的所有療程。',
    hint: '可複選。',
    items: {
      lifting_device: { label: '拉提儀器', detail: '音波拉提 Prime・鳳凰電波 FLX・Density・InMode・Onda・Shurink' },
      thread_lift: { label: '埋線拉提', detail: 'Aptos等' },
      botox: { label: '肉毒桿菌素', detail: '' },
      filler: { label: '玻尿酸', detail: '' },
      skin_booster: { label: '水光針', detail: '' },
      laser: { label: '雷射', detail: '斑點・色素・膚色・泛紅' },
      hair_removal: { label: '除毛', detail: '' },
      skincare: { label: '皮膚管理', detail: '臉部保養' },
      consult_only: { label: '僅諮詢', detail: '' },
      other: { label: '其他', detail: '' },
    },
    otherPlaceholder: '請填寫療程名稱',
  },
  scale: ['非常不同意', '不同意', '普通', '同意', '非常同意'],
  parts: {
    desk: { title: '櫃台協調員', subtitle: '預約・報到・結帳' },
    counselor: { title: '諮詢師', subtitle: '諮詢・費用說明' },
    doctor: { title: '主治醫師', subtitle: '診療・說明' },
    nurse: { title: '護理師', subtitle: '療程' },
    skincare: { title: '皮膚管理師', subtitle: '皮膚管理' },
    facility: { title: '院內環境', subtitle: '' },
  },
  questions: {
    desk_kind: '櫃台協調員親切地接待了我。',
    desk_flow: '預約、報到和結帳快速又方便。',
    counsel_fit: '諮詢師針對我的困擾，只推薦我真正需要的療程。',
    counsel_cost: '諮詢師在付款前清楚說明了費用。',
    doctor_explain: '主治醫師親自檢視我的狀況，並說明得淺顯易懂。',
    doctor_risk: '主治醫師事先告知了療程效果和可能的副作用。',
    nurse_kind: '護理師待我親切。',
    nurse_pain: '護理師在療程中細心留意我的疼痛與不適。',
    skin_kind: '皮膚管理師待我親切。',
    skin_care: '皮膚管理師保養得很仔細。',
    facility_clean: '院內乾淨舒適。',
  },
  skipPart: '今天沒有接觸到',
  skippedNote: '此部分將略過。',
  unskipPart: '重新作答',
  recommend: {
    question: '您會向家人或朋友推薦LIV整形外科嗎？',
    low: '完全不會',
    high: '一定會',
  },
  comment: {
    question: '請寫下您滿意的地方、希望改進的地方，或想表揚的員工。',
    placeholder: '請自由填寫',
    privacy: '請勿填寫姓名或聯絡方式。',
  },
  submit: '送出',
  submitting: '送出中…',
  requiredError: '此題為必填。',
  missingSummary: '還有{n}題必填題尚未作答。',
  networkError: '送出失敗，請稍後再試。',
  done: {
    title: '感謝您的寶貴意見',
    body: '您的意見僅用於員工培訓與改善診療。',
    giftTitle: '禮物編號',
    giftHow: '請在櫃台出示此編號領取小禮物。若今天未能領取，下次來訪時出示即可。',
    giftValid: '{days}天內有效・限用一次',
    capture: '建議截圖保存此頁面。',
    noCode: '無法產生禮物編號，請在櫃台出示此頁面。',
  },
  already: {
    title: '您已經填寫過了',
    body: '感謝您的參與，再次為您顯示禮物編號。',
  },
};

export const SURVEY_COPY: Record<SurveyLocale, SurveyCopy> = {
  ko,
  en,
  ja,
  zh,
  'zh-TW': zhTW,
};

/** 언어 바꾸기 단추 — 각 언어로 자기 이름을 적는다. */
export const SURVEY_LANGUAGE_NAMES: Record<SurveyLocale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
  'zh-TW': '繁體中文',
};

/** '{n}개' 같은 자리표시를 값으로 바꾼다. */
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
