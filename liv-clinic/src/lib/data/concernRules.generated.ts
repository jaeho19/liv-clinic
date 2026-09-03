// 이 파일은 scripts/compile-concern-rules.mjs 가 생성합니다. 직접 수정하지 마세요.
// 원본: data/concern-rules.csv · data/concern-terms.csv · data/prep-questions.csv
import type { ConcernRule, ConcernTerm, PrepQuestion } from '@/lib/consultPrep/types';

export const CONCERN_RULES: ConcernRule[] = [
  {
    "concernId": "sagging",
    "treatmentId": "aptos",
    "displayOrder": 1,
    "reason": {
      "ko": "실을 넣어 처진 조직을 당겨 올리는 방식입니다",
      "en": "Threads are placed to lift sagging tissue",
      "ja": "糸を挿入してたるんだ組織を引き上げる方法です",
      "zh": "通过埋线提拉下垂组织"
    },
    "caution": {
      "ko": "실 종류에 따라 유지 기간이 다릅니다",
      "en": "Duration varies by thread type",
      "ja": "糸の種類により持続期間が異なります",
      "zh": "持续时间因线材种类而异"
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "sagging",
    "treatmentId": "thread",
    "displayOrder": 2,
    "reason": {
      "ko": "가는 실을 여러 개 넣어 라인을 정리합니다",
      "en": "Multiple fine threads refine the contour",
      "ja": "細い糸を複数入れてラインを整えます",
      "zh": "植入多根细线修饰轮廓"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "sagging",
    "treatmentId": "ulthera",
    "displayOrder": 3,
    "reason": {
      "ko": "초음파로 피부 깊은 층에 열을 전달합니다",
      "en": "Ultrasound delivers heat to deep skin layers",
      "ja": "超音波で皮膚の深い層に熱を伝えます",
      "zh": "超声波将热能传递至皮肤深层"
    },
    "caution": {
      "ko": "임신·수유 중에는 시술하지 않습니다",
      "en": "Not performed during pregnancy or breastfeeding",
      "ja": "妊娠中・授乳中は施術できません",
      "zh": "孕期哺乳期不可进行"
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "elasticity",
    "treatmentId": "ulthera",
    "displayOrder": 1,
    "reason": {
      "ko": "초음파로 피부 깊은 층에 열을 전달합니다",
      "en": "Ultrasound delivers heat to deep skin layers",
      "ja": "超音波で皮膚の深い層に熱を伝えます",
      "zh": "超声波将热能传递至皮肤深层"
    },
    "caution": {
      "ko": "임신·수유 중에는 시술하지 않습니다",
      "en": "Not performed during pregnancy or breastfeeding",
      "ja": "妊娠中・授乳中は施術できません",
      "zh": "孕期哺乳期不可进行"
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "elasticity",
    "treatmentId": "thermage",
    "displayOrder": 2,
    "reason": {
      "ko": "고주파로 진피층 콜라겐을 자극합니다",
      "en": "Radiofrequency stimulates collagen in the dermis",
      "ja": "高周波で真皮層のコラーゲンを刺激します",
      "zh": "射频刺激真皮层胶原蛋白"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "elasticity",
    "treatmentId": "density",
    "displayOrder": 3,
    "reason": {
      "ko": "초음파와 고주파를 함께 쓰는 장비입니다",
      "en": "Combines ultrasound and radiofrequency",
      "ja": "超音波と高周波を併用する機器です",
      "zh": "结合超声波与射频的设备"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "fundamental",
    "treatmentId": "consultOnly",
    "displayOrder": 1,
    "reason": {
      "ko": "수술적 방법은 상담에서 확인이 필요합니다",
      "en": "Surgical options require an in-person consultation",
      "ja": "外科的方法は診察での確認が必要です",
      "zh": "手术方式需面诊确认"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "fundamental",
    "treatmentId": "aptos",
    "displayOrder": 2,
    "reason": {
      "ko": "실을 넣어 처진 조직을 당겨 올리는 방식입니다",
      "en": "Threads are placed to lift sagging tissue",
      "ja": "糸を挿入してたるんだ組織を引き上げる方法です",
      "zh": "通过埋线提拉下垂组织"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "fundamental",
    "treatmentId": "ulthera",
    "displayOrder": 3,
    "reason": {
      "ko": "초음파로 피부 깊은 층에 열을 전달합니다",
      "en": "Ultrasound delivers heat to deep skin layers",
      "ja": "超音波で皮膚の深い層に熱を伝えます",
      "zh": "超声波将热能传递至皮肤深层"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "underEye",
    "treatmentId": "consultOnly",
    "displayOrder": 1,
    "reason": {
      "ko": "눈밑 지방 관련 수술은 상담에서 확인이 필요합니다",
      "en": "Under-eye fat procedures require an in-person consultation",
      "ja": "目の下の脂肪に関する手術は診察での確認が必要です",
      "zh": "眼下脂肪相关手术需面诊确认"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "underEye",
    "treatmentId": "filler",
    "displayOrder": 2,
    "reason": {
      "ko": "꺼진 부위에 볼륨을 채우는 방식입니다",
      "en": "Filler restores volume in hollow areas",
      "ja": "へこんだ部位にボリュームを補います",
      "zh": "填充凹陷部位"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "underEye",
    "treatmentId": "skinbooster",
    "displayOrder": 3,
    "reason": {
      "ko": "피부 자체의 수분과 탄력을 보충합니다",
      "en": "Boosters replenish hydration and elasticity",
      "ja": "肌自体の水分と弾力を補います",
      "zh": "补充皮肤水分与弹性"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "texture",
    "treatmentId": "skinbooster",
    "displayOrder": 1,
    "reason": {
      "ko": "피부 자체의 수분과 탄력을 보충합니다",
      "en": "Boosters replenish hydration and elasticity",
      "ja": "肌自体の水分と弾力を補います",
      "zh": "补充皮肤水分与弹性"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "texture",
    "treatmentId": "toning",
    "displayOrder": 2,
    "reason": {
      "ko": "레이저로 색소와 피부톤을 다룹니다",
      "en": "Laser addresses pigment and skin tone",
      "ja": "レーザーで色素と肌のトーンを扱います",
      "zh": "激光处理色素与肤色"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  },
  {
    "concernId": "texture",
    "treatmentId": "skincare",
    "displayOrder": 3,
    "reason": {
      "ko": "피부 상태에 맞춰 단계적으로 관리합니다",
      "en": "Care is staged to the current skin condition",
      "ja": "肌の状態に合わせて段階的にケアします",
      "zh": "根据皮肤状态分阶段护理"
    },
    "caution": {
      "ko": "",
      "en": "",
      "ja": "",
      "zh": ""
    },
    "reviewedBy": "원장,실장",
    "reviewedAt": "2026-09-10"
  }
];

export const CONCERN_TERMS: ConcernTerm[] = [
  {
    "termId": "jawline_sagging",
    "concernId": "sagging",
    "label": {
      "ko": "하악선 처짐",
      "en": "Jawline laxity",
      "ja": "フェイスラインのたるみ",
      "zh": "下颌线松弛"
    },
    "bodyArea": "lower_face"
  },
  {
    "termId": "nasolabial",
    "concernId": "sagging",
    "label": {
      "ko": "팔자주름이 깊어진 상태",
      "en": "Deepened nasolabial folds",
      "ja": "ほうれい線の深まり",
      "zh": "法令纹加深"
    },
    "bodyArea": "mid_face"
  },
  {
    "termId": "double_chin",
    "concernId": "sagging",
    "label": {
      "ko": "턱밑 이중 라인",
      "en": "Submental fullness",
      "ja": "顎下の二重ライン",
      "zh": "下巴双下颌"
    },
    "bodyArea": "lower_face"
  },
  {
    "termId": "skin_laxity",
    "concernId": "elasticity",
    "label": {
      "ko": "피부 탄력 저하",
      "en": "Reduced skin elasticity",
      "ja": "肌の弾力低下",
      "zh": "皮肤弹性下降"
    },
    "bodyArea": "full_face"
  },
  {
    "termId": "fine_lines",
    "concernId": "elasticity",
    "label": {
      "ko": "잔주름",
      "en": "Fine lines",
      "ja": "小じわ",
      "zh": "细纹"
    },
    "bodyArea": "full_face"
  },
  {
    "termId": "deep_sagging",
    "concernId": "fundamental",
    "label": {
      "ko": "심부 조직 처짐",
      "en": "Deep tissue descent",
      "ja": "深部組織のたるみ",
      "zh": "深层组织下垂"
    },
    "bodyArea": "full_face"
  },
  {
    "termId": "volume_loss",
    "concernId": "fundamental",
    "label": {
      "ko": "중안면 볼륨 저하",
      "en": "Midface volume loss",
      "ja": "中顔面のボリューム低下",
      "zh": "中面部容积流失"
    },
    "bodyArea": "mid_face"
  },
  {
    "termId": "under_eye_shadow",
    "concernId": "underEye",
    "label": {
      "ko": "눈밑 그늘",
      "en": "Under-eye shadowing",
      "ja": "目の下のくま",
      "zh": "眼下阴影"
    },
    "bodyArea": "under_eye"
  },
  {
    "termId": "under_eye_bag",
    "concernId": "underEye",
    "label": {
      "ko": "눈밑 지방 돌출",
      "en": "Under-eye fat protrusion",
      "ja": "目の下の脂肪の突出",
      "zh": "眼下脂肪突出"
    },
    "bodyArea": "under_eye"
  },
  {
    "termId": "enlarged_pores",
    "concernId": "texture",
    "label": {
      "ko": "모공이 늘어난 상태",
      "en": "Enlarged pores",
      "ja": "毛穴の開き",
      "zh": "毛孔粗大"
    },
    "bodyArea": "full_face"
  },
  {
    "termId": "rough_texture",
    "concernId": "texture",
    "label": {
      "ko": "피부결 거칠어짐",
      "en": "Rough skin texture",
      "ja": "肌のキメの粗さ",
      "zh": "肤质粗糙"
    },
    "bodyArea": "full_face"
  },
  {
    "termId": "dullness",
    "concernId": "texture",
    "label": {
      "ko": "피부톤 칙칙함",
      "en": "Dull skin tone",
      "ja": "肌のくすみ",
      "zh": "肤色暗沉"
    },
    "bodyArea": "full_face"
  }
];

export const PREP_QUESTIONS: PrepQuestion[] = [
  {
    "questionId": "q_sessions",
    "appliesTo": "*",
    "text": {
      "ko": "몇 회 정도 받아야 하나요?",
      "en": "How many sessions would I need?",
      "ja": "何回くらい受ける必要がありますか?",
      "zh": "大概需要做几次?"
    },
    "answerSource": "results"
  },
  {
    "questionId": "q_duration",
    "appliesTo": "*",
    "text": {
      "ko": "한 번에 얼마나 걸리나요?",
      "en": "How long does one session take?",
      "ja": "1回にどれくらいかかりますか?",
      "zh": "一次需要多长时间?"
    },
    "answerSource": "duration"
  },
  {
    "questionId": "q_recovery",
    "appliesTo": "*",
    "text": {
      "ko": "회복은 며칠 걸리나요?",
      "en": "How many days is the recovery?",
      "ja": "回復に何日かかりますか?",
      "zh": "恢复需要几天?"
    },
    "answerSource": "recovery"
  },
  {
    "questionId": "q_anesthesia",
    "appliesTo": "*",
    "text": {
      "ko": "마취는 어떻게 하나요?",
      "en": "What kind of anesthesia is used?",
      "ja": "麻酔はどうしますか?",
      "zh": "如何麻醉?"
    },
    "answerSource": "anesthesia"
  },
  {
    "questionId": "q_cautions",
    "appliesTo": "*",
    "text": {
      "ko": "제가 피해야 할 조건이 있나요?",
      "en": "Are there conditions that rule this out for me?",
      "ja": "私が避けるべき条件はありますか?",
      "zh": "我有需要避免的情况吗?"
    },
    "answerSource": "cautions"
  },
  {
    "questionId": "q_maintain",
    "appliesTo": "*",
    "text": {
      "ko": "효과는 얼마나 유지되나요?",
      "en": "How long do the results last?",
      "ja": "効果はどれくらい持続しますか?",
      "zh": "效果能维持多久?"
    },
    "answerSource": "results"
  },
  {
    "questionId": "q_area",
    "appliesTo": "*",
    "text": {
      "ko": "제가 신경 쓰는 부위에도 되나요?",
      "en": "Does this apply to the area I care about?",
      "ja": "私が気にしている部位にも可能ですか?",
      "zh": "我在意的部位也可以做吗?"
    },
    "answerSource": "targetAreas"
  },
  {
    "questionId": "q_fit",
    "appliesTo": "*",
    "text": {
      "ko": "저 같은 경우에 맞는 편인가요?",
      "en": "Is this generally suitable for someone like me?",
      "ja": "私のような場合に向いていますか?",
      "zh": "像我这样的情况适合吗?"
    },
    "answerSource": "idealFor"
  },
  {
    "questionId": "q_process",
    "appliesTo": "*",
    "text": {
      "ko": "시술은 어떤 순서로 진행되나요?",
      "en": "What are the steps of the procedure?",
      "ja": "施術はどんな流れで進みますか?",
      "zh": "治疗按什么流程进行?"
    },
    "answerSource": "process"
  },
  {
    "questionId": "q_thread_type",
    "appliesTo": "concern:sagging",
    "text": {
      "ko": "실 종류에 따라 뭐가 달라지나요?",
      "en": "How do the thread types differ?",
      "ja": "糸の種類で何が変わりますか?",
      "zh": "不同线材有什么区别?"
    },
    "answerSource": "benefits"
  },
  {
    "questionId": "q_texture_order",
    "appliesTo": "concern:texture",
    "text": {
      "ko": "여러 개를 받는다면 순서가 있나요?",
      "en": "If I do several, is there an order?",
      "ja": "複数受ける場合、順番はありますか?",
      "zh": "如果做多项，有先后顺序吗?"
    },
    "answerSource": "process"
  }
];
