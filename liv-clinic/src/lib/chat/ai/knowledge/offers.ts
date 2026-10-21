import type { VisitorLocale } from '@/lib/chat/chatApi';
import type { PriceRow } from './types';

// 제안형 응대의 근거 자료 (스펙 2026-10-12 chat-ai-guided-offers §0.2 · §4.3 · 부록 B). 순수 함수 — I/O 없음.
// 대표원장님 회신(2026-10-20, LIV_AI응대_제안규칙_작성용.xlsx)을 옮긴 것이다:
//   - 조합 제안 줄(C…): 시트 2의 15가지 시술 × 제안 ① · ② · 가격 부담. 전부 "제안 그대로".
//   - 채팅 예약 혜택(B01): 시트 1 라-2 + 보충 답 — 이 채팅으로 예약한 손님 모두 5% 할인 + 피부관리 또는 수액 1회
//     (한 분에 1회, 방문한 날 고름, 그날 결제 30만 원 이상, 첫방문 체험가 제외, 다른 사은 행사와 겹치지 않음).
//   - 시술별 사은(시트 3의 1~4번)은 "한 가지만 하자"는 답으로 없앴다. "5% 대신 사은품"(5번)도 없앴다.
// AI는 꼬리표({{C01}} · {{B01}})만 쓰고 문장은 프로그램이 넣는다 — 금액 줄과 같은 방식이다.
// 손님 언어 문장(10개 언어)은 Claude 초안이다(원어민 검수 전). 시술 이름은 홈페이지 가격표의 표기를 따랐다.

/** 채팅 예약 혜택의 무료 서비스 기준 — 그날 결제 금액(부가세 별도, 한 분 기준)이 이 금액 이상일 때 (대표원장님 2026-10-20) */
export const BENEFIT_MIN_KRW = 300_000;

/** 채팅 예약 혜택 문장의 꼬리표 */
export const BENEFIT_TAG = 'B01';

/** 제안 줄의 종류 — combo = 함께 볼 구성, light = 가격 부담을 말할 때의 저부담 대안, concern = 고민만 말한 손님 */
export type OfferKind = 'combo' | 'light' | 'concern';

/** first = 제안 ①, second = 제안 ②(관심을 더 보이면), lighter = 가격 부담을 말하면 */
export type OfferSlot = 'first' | 'second' | 'lighter';

/** 앞 문장 — 한국어(직원 · 프롬프트용)와 손님 언어 10개가 모두 있어야 한다 */
type Lead = { ko: string } & Record<VisitorLocale, string>;

export interface OfferSource {
  /** 자료 안에서 겹치지 않는 이름 — 기록(chat_ai_turns.shown_keys)에 남는다 */
  key: string;
  /** 어떤 시술을 물었을 때의 줄인가 (프롬프트용 한국어) */
  forKo: string;
  slot: OfferSlot;
  kind: OfferKind;
  /** 함께 보이는 가격 줄의 key — 오늘 모두 유효해야 이 줄을 AI에게 준다(프로모션 기간이 지나면 저절로 빠진다) */
  rowKeys: readonly string[];
  /** 앞 문장. 가격 부담 줄은 없으면 "부담이 덜한 구성으로는 다음이 있습니다:" */
  lead?: Lead;
}

export interface OfferRow extends OfferSource {
  /** 꼬리표. AI가 {{C01}} 꼴로 쓴다. 자료를 읽을 때마다 순서대로 붙인다 */
  id: string;
}

const P = (n: number): string => `promo.2026-10.${String(n).padStart(2, '0')}`;

export const OFFER_SOURCES: readonly OfferSource[] = [
  // 1 스컬트라
  {
    key: 'sculptra.first',
    forKo: '스컬트라',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(19)],
    lead: {
      ko: '스컬트라와 함께 울쎄라피 프라임 · 써마지 같은 리프팅을 같은 날 상담받으실 수 있습니다. 이번 달 구성:',
      en: "Sculptra can be combined with a lifting treatment such as Ultherapy Prime or Thermage at the same consultation. This month's set:",
      ja: 'スカルプトラと合わせて、ウルセラピープライムやサーマジなどのリフティングを同じ日にご相談いただけます。今月の構成：',
      zh: '您可以在同一天的面诊中，一并了解 Sculptra 与 Ultherapy Prime、热玛吉等提拉项目。本月组合：',
      'zh-TW': '您可以在同一天的面診中，一併了解 Sculptra 與 Ultherapy Prime、鳳凰電波等拉提療程。本月組合：',
      vi: 'Cùng với Sculptra, quý khách có thể được tư vấn thêm các liệu trình nâng cơ như Ultherapy Prime hoặc Thermage trong cùng ngày. Gói của tháng này:',
      th: 'นอกจาก Sculptra แล้ว คุณสามารถปรึกษาการยกกระชับ เช่น Ultherapy Prime หรือ Thermage ได้ในวันเดียวกัน ชุดของเดือนนี้:',
      ru: 'Вместе со Sculptra в тот же день можно проконсультироваться и о лифтинге, например Ultherapy Prime или Thermage. Набор этого месяца:',
      fr: 'Lors de la même consultation, vous pouvez aussi vous renseigner sur un lifting comme Ultherapy Prime ou Thermage en plus du Sculptra. Formule de ce mois :',
      mn: 'Sculptra-тай хамт Ultherapy Prime, Thermage зэрэг өргөлтийн эмчилгээний талаар нэг өдөр зөвлөгөө авах боломжтой. Энэ сарын багц:',
      ar: 'يمكنك مع Sculptra أن تستشير في اليوم نفسه عن علاجات الشد مثل Ultherapy Prime أو Thermage. باقة هذا الشهر:',
    },
  },
  {
    key: 'sculptra.second',
    forKo: '스컬트라',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(20)],
    lead: {
      ko: '써마지 FLX가 든 이번 달 리프팅 구성도 있습니다:',
      en: "There is also this month's lifting set with Thermage FLX:",
      ja: 'サーマジFLXが入った今月のリフティング構成もございます：',
      zh: '本月还有包含热玛吉 FLX 的提拉组合：',
      'zh-TW': '本月還有包含鳳凰電波 FLX 的拉提組合：',
      vi: 'Ngoài ra còn có gói nâng cơ của tháng này có Thermage FLX:',
      th: 'นอกจากนี้ยังมีชุดยกกระชับของเดือนนี้ที่มี Thermage FLX:',
      ru: 'Есть также лифтинг-набор этого месяца с Thermage FLX:',
      fr: 'Il existe aussi la formule lifting de ce mois avec Thermage FLX :',
      mn: 'Мөн Thermage FLX орсон энэ сарын өргөлтийн багц байна:',
      ar: 'وتتوفر أيضًا باقة الشد لهذا الشهر التي تشمل Thermage FLX:',
    },
  },
  { key: 'sculptra.lighter', forKo: '스컬트라', slot: 'lighter', kind: 'light', rowKeys: [P(12)] },
  // 2 울쎄라피 프라임
  {
    key: 'ulthera.first',
    forKo: '울쎄라피 프라임',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(19)],
    lead: {
      ko: '울쎄라피 프라임은 이번 달 온다 리프팅 · 진정팩이 함께 든 구성이 있습니다:',
      en: 'This month, Ultherapy Prime comes in a set with ONDA Lifting and a calming pack:',
      ja: 'ウルセラピープライムは、今月オンダリフティング・鎮静パックが付いた構成がございます：',
      zh: '本月 Ultherapy Prime 有搭配 ONDA 提拉和舒缓面膜的组合：',
      'zh-TW': '本月 Ultherapy Prime 有搭配 ONDA 拉提與舒緩面膜的組合：',
      vi: 'Tháng này, Ultherapy Prime có gói kèm ONDA Lifting và mặt nạ làm dịu:',
      th: 'เดือนนี้ Ultherapy Prime มีชุดที่รวม ONDA Lifting และมาสก์ปลอบประโลมผิว:',
      ru: 'В этом месяце Ultherapy Prime предлагается в наборе с ONDA Lifting и успокаивающей маской:',
      fr: 'Ce mois-ci, Ultherapy Prime est proposé dans une formule avec ONDA Lifting et un masque apaisant :',
      mn: 'Энэ сард Ultherapy Prime-д ONDA Lifting болон тайвшруулах маск багтсан багц байна:',
      ar: 'هذا الشهر، يتوفر Ultherapy Prime ضمن باقة مع ONDA Lifting وقناع مهدئ:',
    },
  },
  {
    key: 'ulthera.second',
    forKo: '울쎄라피 프라임',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(16), P(17)],
    lead: {
      ko: '울쎄라피 프라임과 써마지 FLX를 함께 받는 이번 달 구성도 있습니다:',
      en: "There is also this month's set that combines Ultherapy Prime with Thermage FLX:",
      ja: 'ウルセラピープライムとサーマジFLXを組み合わせた今月の構成もございます：',
      zh: '本月还有 Ultherapy Prime 与热玛吉 FLX 搭配的组合：',
      'zh-TW': '本月還有 Ultherapy Prime 與鳳凰電波 FLX 搭配的組合：',
      vi: 'Ngoài ra còn có gói của tháng này kết hợp Ultherapy Prime với Thermage FLX:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้ที่ทำ Ultherapy Prime ร่วมกับ Thermage FLX:',
      ru: 'Есть также набор этого месяца, сочетающий Ultherapy Prime и Thermage FLX:',
      fr: 'Il existe aussi la formule de ce mois associant Ultherapy Prime et Thermage FLX :',
      mn: 'Мөн Ultherapy Prime болон Thermage FLX-ийг хамт хийх энэ сарын багц байна:',
      ar: 'وتتوفر أيضًا باقة هذا الشهر التي تجمع بين Ultherapy Prime وThermage FLX:',
    },
  },
  {
    key: 'ulthera.lighter',
    forKo: '울쎄라피 프라임',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['ulthera.name.upperFace', 'shurink.shurinkLaser.shot300'],
  },
  // 3 써마지 (아이 써마지 포함)
  {
    key: 'thermage.first',
    forKo: '써마지 FLX (아이 써마지 포함)',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(20)],
    lead: {
      ko: '써마지 FLX는 이번 달 온다 리프팅 · LDM 관리가 함께 든 구성이 있습니다:',
      en: 'This month, Thermage FLX comes in a set with ONDA Lifting and an LDM treatment:',
      ja: 'サーマジFLXは、今月オンダリフティング・LDMケアが付いた構成がございます：',
      zh: '本月热玛吉 FLX 有搭配 ONDA 提拉和 LDM 护理的组合：',
      'zh-TW': '本月鳳凰電波 FLX 有搭配 ONDA 拉提與 LDM 護理的組合：',
      vi: 'Tháng này, Thermage FLX có gói kèm ONDA Lifting và chăm sóc LDM:',
      th: 'เดือนนี้ Thermage FLX มีชุดที่รวม ONDA Lifting และการดูแลด้วย LDM:',
      ru: 'В этом месяце Thermage FLX предлагается в наборе с ONDA Lifting и LDM-уходом:',
      fr: 'Ce mois-ci, Thermage FLX est proposé dans une formule avec ONDA Lifting et un soin LDM :',
      mn: 'Энэ сард Thermage FLX-д ONDA Lifting болон LDM арчилгаа багтсан багц байна:',
      ar: 'هذا الشهر، يتوفر Thermage FLX ضمن باقة مع ONDA Lifting وعناية LDM:',
    },
  },
  {
    key: 'thermage.second',
    forKo: '써마지 FLX (아이 써마지 포함)',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(16)],
    lead: {
      ko: '울쎄라피 프라임과 함께 받는 이번 달 구성도 있습니다:',
      en: "There is also this month's set together with Ultherapy Prime:",
      ja: 'ウルセラピープライムと組み合わせた今月の構成もございます：',
      zh: '本月还有与 Ultherapy Prime 搭配的组合：',
      'zh-TW': '本月還有與 Ultherapy Prime 搭配的組合：',
      vi: 'Ngoài ra còn có gói của tháng này làm cùng Ultherapy Prime:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้ที่ทำร่วมกับ Ultherapy Prime:',
      ru: 'Есть также набор этого месяца вместе с Ultherapy Prime:',
      fr: 'Il existe aussi la formule de ce mois avec Ultherapy Prime :',
      mn: 'Мөн Ultherapy Prime-тай хамт хийх энэ сарын багц байна:',
      ar: 'وتتوفر أيضًا باقة هذا الشهر مع Ultherapy Prime:',
    },
  },
  {
    key: 'thermage.lighter',
    forKo: '써마지 FLX (아이 써마지 포함)',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['thermage.name.eyeTip225', 'shurink.shurinkLaser.shot300'],
  },
  // 4 덴서티
  {
    key: 'density.first',
    forKo: '덴서티',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(18)],
    lead: {
      ko: '덴서티는 이번 달 온다 리프팅 · 주름 보톡스 · LDM 관리가 함께 든 구성이 있습니다:',
      en: 'This month, Density comes in a set with ONDA Lifting, wrinkle Botox and an LDM treatment:',
      ja: 'デンシティは、今月オンダリフティング・シワボトックス・LDMケアが付いた構成がございます：',
      zh: '本月 Density 有搭配 ONDA 提拉、除皱肉毒素和 LDM 护理的组合：',
      'zh-TW': '本月 Density 有搭配 ONDA 拉提、除皺肉毒與 LDM 護理的組合：',
      vi: 'Tháng này, Density có gói kèm ONDA Lifting, Botox xóa nếp nhăn và chăm sóc LDM:',
      th: 'เดือนนี้ Density มีชุดที่รวม ONDA Lifting โบท็อกซ์ลดริ้วรอย และการดูแลด้วย LDM:',
      ru: 'В этом месяце Density предлагается в наборе с ONDA Lifting, ботоксом от морщин и LDM-уходом:',
      fr: 'Ce mois-ci, Density est proposé dans une formule avec ONDA Lifting, du Botox anti-rides et un soin LDM :',
      mn: 'Энэ сард Density-д ONDA Lifting, үрчлээний ботокс, LDM арчилгаа багтсан багц байна:',
      ar: 'هذا الشهر، يتوفر Density ضمن باقة مع ONDA Lifting وبوتوكس التجاعيد وعناية LDM:',
    },
  },
  {
    key: 'density.second',
    forKo: '덴서티',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(19)],
    lead: {
      ko: '울쎄라피 프라임이 든 이번 달 리프팅 구성도 있습니다:',
      en: "There is also this month's lifting set with Ultherapy Prime:",
      ja: 'ウルセラピープライムが入った今月のリフティング構成もございます：',
      zh: '本月还有包含 Ultherapy Prime 的提拉组合：',
      'zh-TW': '本月還有包含 Ultherapy Prime 的拉提組合：',
      vi: 'Ngoài ra còn có gói nâng cơ của tháng này có Ultherapy Prime:',
      th: 'นอกจากนี้ยังมีชุดยกกระชับของเดือนนี้ที่มี Ultherapy Prime:',
      ru: 'Есть также лифтинг-набор этого месяца с Ultherapy Prime:',
      fr: 'Il existe aussi la formule lifting de ce mois avec Ultherapy Prime :',
      mn: 'Мөн Ultherapy Prime орсон энэ сарын өргөлтийн багц байна:',
      ar: 'وتتوفر أيضًا باقة الشد لهذا الشهر التي تشمل Ultherapy Prime:',
    },
  },
  { key: 'density.lighter', forKo: '덴서티', slot: 'lighter', kind: 'light', rowKeys: ['density.hiTip.shot300'] },
  // 5 슈링크 · 인모드
  {
    key: 'shurink.first',
    forKo: '슈링크 · 인모드',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(12)],
    lead: {
      ko: '슈링크 · 인모드와 함께 피부결 · 수분을 보는 수분 충전 구성을 같은 날 상담받으실 수 있습니다. 이번 달 구성:',
      en: "Together with Shurink or InMode, you can also consult on a hydration set for skin texture and moisture on the same day. This month's set:",
      ja: 'シュリンク・インモードと合わせて、肌のキメ・うるおいをケアする水分チャージ構成も同じ日にご相談いただけます。今月の構成：',
      zh: '在同一天的面诊中，除了 Shurink、InMode，也可以一并了解改善肤质与补水的水分充盈组合。本月组合：',
      'zh-TW': '在同一天的面診中，除了 Shurink、InMode，也可以一併了解改善膚質與補水的水分充盈組合。本月組合：',
      vi: 'Cùng với Shurink hoặc InMode, quý khách có thể được tư vấn thêm gói cấp ẩm cho kết cấu và độ ẩm của da trong cùng ngày. Gói của tháng này:',
      th: 'นอกจาก Shurink หรือ InMode แล้ว คุณสามารถปรึกษาชุดเติมความชุ่มชื้นสำหรับเนื้อผิวและความชุ่มชื้นได้ในวันเดียวกัน ชุดของเดือนนี้:',
      ru: 'Вместе с Shurink или InMode в тот же день можно проконсультироваться и об увлажняющем наборе для текстуры и увлажнённости кожи. Набор этого месяца:',
      fr: 'En plus de Shurink ou d’InMode, vous pouvez aussi vous renseigner le même jour sur une formule hydratation qui travaille le grain de peau et l’hydratation. Formule de ce mois :',
      mn: 'Shurink эсвэл InMode-той хамт арьсны бүтэц, чийгийг сайжруулах чийгшүүлэх багцын талаар нэг өдөр зөвлөгөө авах боломжтой. Энэ сарын багц:',
      ar: 'يمكنك مع Shurink أو InMode أن تستشير في اليوم نفسه عن باقة الترطيب لملمس البشرة ورطوبتها. باقة هذا الشهر:',
    },
  },
  {
    key: 'shurink.lighter',
    forKo: '슈링크 · 인모드',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['shurink.shurinkLaser.shot300', 'inmode.name.fx'],
  },
  // 6 실리프팅 (압토스)
  {
    key: 'thread.first',
    forKo: '실리프팅 (압토스)',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(25), P(26), P(27)],
    lead: {
      ko: '압토스 실리프팅의 이번 달 구성에는 온다 리프팅 1회가 포함되어 있습니다:',
      en: "This month's APTOS thread lifting sets include one ONDA Lifting session:",
      ja: 'アプトス糸リフトの今月の構成には、オンダリフティング1回が含まれています：',
      zh: '本月 APTOS 埋线提升组合包含一次 ONDA 提拉：',
      'zh-TW': '本月 APTOS 埋線拉提組合包含一次 ONDA 拉提：',
      vi: 'Các gói nâng chỉ APTOS của tháng này đã bao gồm 1 lần ONDA Lifting:',
      th: 'ชุดร้อยไหม APTOS ของเดือนนี้รวม ONDA Lifting 1 ครั้ง:',
      ru: 'Наборы нитевого лифтинга APTOS этого месяца включают одну процедуру ONDA Lifting:',
      fr: 'Les formules de lifting par fils APTOS de ce mois incluent une séance d’ONDA Lifting :',
      mn: 'APTOS утсан лифтингийн энэ сарын багцад ONDA Lifting 1 удаа багтсан:',
      ar: 'تشمل باقات الشد بالخيوط APTOS لهذا الشهر جلسة واحدة من ONDA Lifting:',
    },
  },
  {
    key: 'thread.second',
    forKo: '실리프팅 (압토스)',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(12)],
    lead: {
      ko: '실리프팅과 함께 수분 충전 구성을 같은 날 상담받으실 수 있습니다. 이번 달 구성:',
      en: "Together with thread lifting, you can also consult on a hydration set on the same day. This month's set:",
      ja: '糸リフトと合わせて、水分チャージ構成も同じ日にご相談いただけます。今月の構成：',
      zh: '在同一天的面诊中，也可以一并了解埋线提升与水分充盈组合。本月组合：',
      'zh-TW': '在同一天的面診中，也可以一併了解埋線拉提與水分充盈組合。本月組合：',
      vi: 'Cùng với nâng chỉ, quý khách có thể được tư vấn thêm gói cấp ẩm trong cùng ngày. Gói của tháng này:',
      th: 'นอกจากการร้อยไหมแล้ว คุณสามารถปรึกษาชุดเติมความชุ่มชื้นได้ในวันเดียวกัน ชุดของเดือนนี้:',
      ru: 'Вместе с нитевым лифтингом в тот же день можно проконсультироваться и об увлажняющем наборе. Набор этого месяца:',
      fr: 'En plus du lifting par fils, vous pouvez aussi vous renseigner le même jour sur une formule hydratation. Formule de ce mois :',
      mn: 'Утсан лифтингтэй хамт чийгшүүлэх багцын талаар нэг өдөр зөвлөгөө авах боломжтой. Энэ сарын багц:',
      ar: 'يمكنك مع الشد بالخيوط أن تستشير في اليوم نفسه عن باقة الترطيب. باقة هذا الشهر:',
    },
  },
  {
    key: 'thread.lighter',
    forKo: '실리프팅 (압토스)',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['thread.name.mint', 'thread.name.silhouette'],
  },
  // 7 보톡스 (사각턱 · 주름) — 가격 부담 칸 없음(이미 부담이 적은 시술)
  {
    key: 'botox.first',
    forKo: '보톡스 (사각턱 · 주름)',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(21)],
    lead: {
      ko: '보톡스와 함께 필러를 같은 날 상담받으시는 분도 있습니다. 이번 달 구성:',
      en: "Some visitors also consult on fillers on the same day as Botox. This month's set:",
      ja: 'ボトックスと合わせて、同じ日にフィラーをご相談される方もいらっしゃいます。今月の構成：',
      zh: '也有顾客在打肉毒素的同一天一并咨询玻尿酸填充。本月组合：',
      'zh-TW': '也有顧客在施打肉毒的同一天一併諮詢玻尿酸填充。本月組合：',
      vi: 'Có những khách hàng được tư vấn thêm filler trong cùng ngày tiêm Botox. Gói của tháng này:',
      th: 'มีผู้ที่ปรึกษาเรื่องฟิลเลอร์ในวันเดียวกับที่ทำโบท็อกซ์ด้วย ชุดของเดือนนี้:',
      ru: 'Некоторые гости в день ботокса консультируются и о филлерах. Набор этого месяца:',
      fr: 'Certains patients se renseignent aussi sur les injections de filler le jour de leur Botox. Formule de ce mois :',
      mn: 'Ботокс хийлгэх өдрөө филлерийн талаар зөвлөгөө авдаг хүмүүс ч бий. Энэ сарын багц:',
      ar: 'يستشير بعض الزوار أيضًا عن الفيلر في يوم البوتوكس نفسه. باقة هذا الشهر:',
    },
  },
  {
    key: 'botox.second',
    forKo: '보톡스 (사각턱 · 주름)',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(24)],
    lead: {
      ko: '목주름 스킨보톡스와 넥라인 필러가 함께 든 이번 달 구성도 있습니다:',
      en: "There is also this month's set with neck-line filler and skin Botox for neck lines:",
      ja: '首のシワのスキンボトックスとネックラインフィラーが入った今月の構成もございます：',
      zh: '本月还有颈纹水光肉毒素搭配颈部线条填充的组合：',
      'zh-TW': '本月還有頸紋水光肉毒搭配頸部線條填充的組合：',
      vi: 'Ngoài ra còn có gói của tháng này gồm filler đường cổ và Botox da cho nếp nhăn cổ:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้ที่รวมฟิลเลอร์ร่องคอและโบท็อกซ์ผิวลดริ้วรอยคอ:',
      ru: 'Есть также набор этого месяца с филлером для линий шеи и скин-ботоксом от морщин на шее:',
      fr: 'Il existe aussi la formule de ce mois associant un filler pour les lignes du cou et du Botox cutané des rides du cou :',
      mn: 'Мөн хүзүүний шугамын филлер болон хүзүүний үрчлээний арьсны ботокс багтсан энэ сарын багц байна:',
      ar: 'وتتوفر أيضًا باقة هذا الشهر التي تشمل فيلر خطوط الرقبة وبوتوكس الجلد لتجاعيد الرقبة:',
    },
  },
  // 8 필러
  {
    key: 'filler.first',
    forKo: '필러',
    slot: 'first',
    kind: 'combo',
    rowKeys: ['botox.botoxContour.domestic', 'botox.botoxContour.xeomin', 'botox.botoxContour.allergan'],
    lead: {
      ko: '필러와 함께 윤곽 보톡스를 같은 날 상담받으실 수 있습니다:',
      en: 'Together with fillers, you can also consult on contouring Botox on the same day:',
      ja: 'フィラーと合わせて、輪郭ボトックスも同じ日にご相談いただけます：',
      zh: '在同一天的面诊中，也可以一并了解玻尿酸填充与轮廓肉毒素：',
      'zh-TW': '在同一天的面診中，也可以一併了解玻尿酸填充與輪廓肉毒：',
      vi: 'Cùng với filler, quý khách có thể được tư vấn thêm Botox thon gọn đường nét trong cùng ngày:',
      th: 'นอกจากฟิลเลอร์แล้ว คุณสามารถปรึกษาโบท็อกซ์ปรับรูปหน้าได้ในวันเดียวกัน:',
      ru: 'Вместе с филлерами в тот же день можно проконсультироваться и о ботоксе для контура лица:',
      fr: 'En plus du filler, vous pouvez aussi vous renseigner le même jour sur le Botox de contour :',
      mn: 'Филлертэй хамт нүүрний контурын ботоксын талаар нэг өдөр зөвлөгөө авах боломжтой:',
      ar: 'يمكنك مع الفيلر أن تستشير في اليوم نفسه عن بوتوكس تحديد الوجه:',
    },
  },
  {
    key: 'filler.second',
    forKo: '필러',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(22), P(23)],
    lead: {
      ko: '프리미엄 디자인 필러의 이번 달 구성도 있습니다:',
      en: "There are also this month's premium design filler sets:",
      ja: 'プレミアムデザインフィラーの今月の構成もございます：',
      zh: '本月还有高端设计填充的组合：',
      'zh-TW': '本月還有高階設計填充的組合：',
      vi: 'Ngoài ra còn có các gói filler thiết kế cao cấp của tháng này:',
      th: 'นอกจากนี้ยังมีชุดฟิลเลอร์ดีไซน์พรีเมียมของเดือนนี้:',
      ru: 'Есть также наборы премиального дизайн-филлера этого месяца:',
      fr: 'Il existe aussi les formules de ce mois de filler design premium :',
      mn: 'Мөн энэ сарын дээд зэрэглэлийн загвар филлерийн багцууд байна:',
      ar: 'وتتوفر أيضًا باقات الفيلر التصميمي المميز لهذا الشهر:',
    },
  },
  { key: 'filler.lighter', forKo: '필러', slot: 'lighter', kind: 'light', rowKeys: ['guide.filler.domestic'] },
  // 9 리쥬란 · 스킨부스터
  {
    key: 'skinbooster.first',
    forKo: '리쥬란 · 스킨부스터',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(12), P(13)],
    lead: {
      ko: '리쥬란은 이번 달 아이리쥬란 · 물광 · LDM 관리가 함께 든 수분 충전 구성이 있습니다:',
      en: 'This month, Rejuran comes in hydration sets with Eye Rejuran, glow injections and an LDM treatment:',
      ja: 'リジュランは、今月アイリジュラン・水光注射・LDMケアが付いた水分チャージ構成がございます：',
      zh: '本月 Rejuran 有搭配 Eye Rejuran、水光针和 LDM 护理的水分充盈组合：',
      'zh-TW': '本月 Rejuran 有搭配 Eye Rejuran、水光針與 LDM 護理的水分充盈組合：',
      vi: 'Tháng này, Rejuran có các gói cấp ẩm kèm Eye Rejuran, tiêm căng bóng và chăm sóc LDM:',
      th: 'เดือนนี้ Rejuran มีชุดเติมความชุ่มชื้นที่รวม Eye Rejuran การฉีดผิวโกลว์ และการดูแลด้วย LDM:',
      ru: 'В этом месяце Rejuran предлагается в увлажняющих наборах с Eye Rejuran, инъекциями для сияния кожи и LDM-уходом:',
      fr: 'Ce mois-ci, Rejuran est proposé dans des formules hydratation avec Eye Rejuran, des injections éclat et un soin LDM :',
      mn: 'Энэ сард Rejuran-д Eye Rejuran, гэрэлтүүлэх тарилга, LDM арчилгаа багтсан чийгшүүлэх багцууд байна:',
      ar: 'هذا الشهر، يتوفر Rejuran ضمن باقات ترطيب مع Eye Rejuran وحقن النضارة وعناية LDM:',
    },
  },
  {
    key: 'skinbooster.second',
    forKo: '리쥬란 · 스킨부스터',
    slot: 'second',
    kind: 'combo',
    rowKeys: ['thermage.name.eyeTip225'],
    lead: {
      ko: '리쥬란과 아이 써마지를 같은 날 상담받으실 수도 있습니다:',
      en: 'You can also consult on Eye Thermage on the same day as Rejuran:',
      ja: 'リジュランと同じ日に、アイサーマジをご相談いただくこともできます：',
      zh: '也可以在 Rejuran 的同一天一并咨询眼部热玛吉：',
      'zh-TW': '也可以在 Rejuran 的同一天一併諮詢眼部鳳凰電波：',
      vi: 'Quý khách cũng có thể được tư vấn thêm Thermage vùng mắt trong cùng ngày với Rejuran:',
      th: 'คุณยังสามารถปรึกษา Thermage รอบดวงตาได้ในวันเดียวกับ Rejuran:',
      ru: 'В день Rejuran можно также проконсультироваться о Thermage для зоны вокруг глаз:',
      fr: 'Vous pouvez aussi vous renseigner sur le Thermage des yeux le même jour que le Rejuran :',
      mn: 'Rejuran хийлгэх өдрөө нүдний Thermage-ийн талаар зөвлөгөө авах боломжтой:',
      ar: 'يمكنك أيضًا أن تستشير عن Thermage لمنطقة العين في يوم Rejuran نفسه:',
    },
  },
  { key: 'skinbooster.lighter', forKo: '리쥬란 · 스킨부스터', slot: 'lighter', kind: 'light', rowKeys: [P(10)] },
  // 10 피부 관리 · 아쿠아필
  {
    key: 'skincare.first',
    forKo: '피부 관리 · 아쿠아필',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(10), P(12)],
    lead: {
      ko: '피부 관리와 함께 스킨부스터가 든 수분 충전 구성을 같은 날 상담받으실 수 있습니다. 이번 달 구성:',
      en: "Together with skin care, you can also consult on a hydration set with skin boosters on the same day. This month's sets:",
      ja: '肌管理と合わせて、スキンブースターが入った水分チャージ構成も同じ日にご相談いただけます。今月の構成：',
      zh: '在同一天的面诊中，也可以一并了解皮肤护理与含肌肤助推剂的水分充盈组合。本月组合：',
      'zh-TW': '在同一天的面診中，也可以一併了解皮膚護理與含肌膚助推劑的水分充盈組合。本月組合：',
      vi: 'Cùng với chăm sóc da, quý khách có thể được tư vấn thêm gói cấp ẩm có skin booster trong cùng ngày. Các gói của tháng này:',
      th: 'นอกจากการดูแลผิวแล้ว คุณสามารถปรึกษาชุดเติมความชุ่มชื้นที่มีสกินบูสเตอร์ได้ในวันเดียวกัน ชุดของเดือนนี้:',
      ru: 'Вместе с уходом за кожей в тот же день можно проконсультироваться и об увлажняющем наборе со скинбустерами. Наборы этого месяца:',
      fr: 'En plus du soin de la peau, vous pouvez aussi vous renseigner le même jour sur une formule hydratation avec skin boosters. Formules de ce mois :',
      mn: 'Арьс арчилгаатай хамт skin booster орсон чийгшүүлэх багцын талаар нэг өдөр зөвлөгөө авах боломжтой. Энэ сарын багцууд:',
      ar: 'يمكنك مع العناية بالبشرة أن تستشير في اليوم نفسه عن باقة ترطيب تشمل معززات البشرة. باقات هذا الشهر:',
    },
  },
  {
    key: 'skincare.second',
    forKo: '피부 관리 · 아쿠아필',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(14)],
    lead: {
      ko: '모공 관리가 든 이번 달 구성도 있습니다:',
      en: "There is also this month's set for pores:",
      ja: '毛穴ケアが入った今月の構成もございます：',
      zh: '本月还有针对毛孔的组合：',
      'zh-TW': '本月還有針對毛孔的組合：',
      vi: 'Ngoài ra còn có gói của tháng này dành cho lỗ chân lông:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้สำหรับดูแลรูขุมขน:',
      ru: 'Есть также набор этого месяца для пор:',
      fr: 'Il existe aussi la formule de ce mois pour les pores :',
      mn: 'Мөн нүх сүвний арчилгаатай энэ сарын багц байна:',
      ar: 'وتتوفر أيضًا باقة هذا الشهر للعناية بالمسام:',
    },
  },
  {
    key: 'skincare.lighter',
    forKo: '피부 관리 · 아쿠아필',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['trial.premiumSkincare'],
    lead: {
      ko: '처음 방문하시는 분은 첫방문 체험가로 받으실 수 있는 관리가 있습니다:',
      en: 'For a first visit, there is a one-time trial price for skin care:',
      ja: '初めてご来院の方は、初回体験価格で受けられるケアがございます：',
      zh: '首次到院的顾客，可以首次体验价接受以下护理：',
      'zh-TW': '首次到院的顧客，可以首次體驗價接受以下護理：',
      vi: 'Với lần đến đầu tiên, có liệu trình chăm sóc da với giá trải nghiệm một lần:',
      th: 'สำหรับการมาครั้งแรก มีการดูแลผิวในราคาทดลองครั้งแรก (ครั้งเดียว):',
      ru: 'Для первого визита есть уход за кожей по разовой пробной цене:',
      fr: 'Pour une première visite, un soin de la peau est proposé à un tarif découverte unique :',
      mn: 'Анх ирж буй хүмүүст нэг удаагийн туршилтын үнээр хийлгэх арьс арчилгаа байна:',
      ar: 'للزيارة الأولى، تتوفر عناية بالبشرة بسعر تجربة لمرة واحدة:',
    },
  },
  // 11 레이저 (색소 · 토닝 · 점)
  {
    key: 'laser.first',
    forKo: '레이저 (색소 · 토닝 · 점)',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(1), P(2)],
    lead: {
      ko: '색소 · 톤 레이저는 이번 달 점 제거 · 진정 관리가 함께 든 구성이 있습니다:',
      en: 'This month, pigment and tone laser treatments come in sets with mole removal and a calming treatment:',
      ja: 'シミ・トーンのレーザーは、今月ほくろ除去・鎮静ケアが付いた構成がございます：',
      zh: '本月色斑、肤色激光有搭配祛痣和镇静护理的组合：',
      'zh-TW': '本月色斑、膚色雷射有搭配除痣與鎮靜護理的組合：',
      vi: 'Tháng này, laser trị sắc tố và laser toning có các gói kèm tẩy nốt ruồi và chăm sóc làm dịu:',
      th: 'เดือนนี้ เลเซอร์รักษาเม็ดสีและปรับสีผิวมีชุดที่รวมการกำจัดไฝและการดูแลปลอบประโลมผิว:',
      ru: 'В этом месяце лазер от пигментации и для выравнивания тона предлагается в наборах с удалением родинок и успокаивающим уходом:',
      fr: 'Ce mois-ci, les lasers pigmentaires et de teint sont proposés dans des formules avec élimination des grains de beauté et un soin apaisant :',
      mn: 'Энэ сард пигмент болон арьсны өнгө жигдрүүлэх лазерт мэнгэ арилгах, тайвшруулах арчилгаа багтсан багцууд байна:',
      ar: 'هذا الشهر، يتوفر ليزر التصبغات وتوحيد لون البشرة ضمن باقات مع إزالة الشامات وعناية مهدئة:',
    },
  },
  {
    key: 'laser.second',
    forKo: '레이저 (색소 · 토닝 · 점)',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(4), P(5)],
    lead: {
      ko: 'CO2 레이저로 점 · 편평사마귀 · 비립종을 얼굴이나 목 전체로 정리하는 이번 달 구성도 있습니다:',
      en: "There are also this month's CO2 laser sets for moles, flat warts and milia across the whole face or neck:",
      ja: 'CO2レーザーで顔または首全体のほくろ・扁平イボ・稗粒腫を取る今月の構成もございます：',
      zh: '本月还有用 CO2 激光处理整个面部或颈部的痣、扁平疣、粟粒疹的组合：',
      'zh-TW': '本月還有用 CO2 雷射處理整個臉部或頸部的痣、扁平疣、粟粒疹的組合：',
      vi: 'Ngoài ra còn có các gói của tháng này dùng laser CO2 xử lý nốt ruồi, mụn cóc phẳng và mụn kê trên toàn mặt hoặc toàn cổ:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้ที่ใช้เลเซอร์ CO2 กำจัดไฝ หูดแบน และสิวข้าวสารทั่วใบหน้าหรือทั่วลำคอ:',
      ru: 'Есть также наборы этого месяца с CO2-лазером для родинок, плоских бородавок и милиумов на всём лице или всей шее:',
      fr: 'Il existe aussi les formules de ce mois au laser CO2 pour les grains de beauté, verrues planes et grains de milium sur tout le visage ou tout le cou :',
      mn: 'Мөн нүүр эсвэл хүзүүг бүхэлд нь CO2 лазераар мэнгэ, хавтгай үү, милиумаас цэвэрлэх энэ сарын багцууд байна:',
      ar: 'وتتوفر أيضًا باقات هذا الشهر بليزر CO2 للشامات والثآليل المسطحة والدخينات على كامل الوجه أو الرقبة:',
    },
  },
  { key: 'laser.lighter', forKo: '레이저 (색소 · 토닝 · 점)', slot: 'lighter', kind: 'light', rowKeys: [P(1)] },
  // 12 제모 — 제안 ① 은 없다(직원 견적). 문신 제거는 2026-10-20 에 폐지(바디 타투는 하지 않는다)
  {
    key: 'hairRemoval.second',
    forKo: '제모',
    slot: 'second',
    kind: 'combo',
    rowKeys: ['trial.armpitHairRemoval', 'trial.lipHairRemoval'],
    lead: {
      ko: '처음 방문하시는 분은 겨드랑이 · 인중 제모를 첫방문 체험가로 받으실 수 있습니다:',
      en: 'For a first visit, underarm and upper-lip hair removal are available at a one-time trial price:',
      ja: '初めてご来院の方は、ワキ・鼻下の脱毛を初回体験価格で受けられます：',
      zh: '首次到院的顾客，腋下、人中脱毛可享首次体验价：',
      'zh-TW': '首次到院的顧客，腋下、人中脫毛可享首次體驗價：',
      vi: 'Với lần đến đầu tiên, triệt lông nách và triệt lông ria mép có giá trải nghiệm một lần:',
      th: 'สำหรับการมาครั้งแรก กำจัดขนรักแร้และขนเหนือริมฝีปากได้ในราคาทดลองครั้งแรก (ครั้งเดียว):',
      ru: 'Для первого визита эпиляция подмышек и над верхней губой доступна по разовой пробной цене:',
      fr: 'Pour une première visite, l’épilation des aisselles et de la lèvre supérieure est proposée à un tarif découverte unique :',
      mn: 'Анх ирж буй хүмүүст суга болон уруулын дээд хэсгийн үс авалтыг нэг удаагийн туршилтын үнээр хийнэ:',
      ar: 'للزيارة الأولى، تتوفر إزالة شعر الإبط وما فوق الشفة العليا بسعر تجربة لمرة واحدة:',
    },
  },
  // 13 바디 (온다 · 바디보톡스 · 승모근)
  {
    key: 'body.first',
    forKo: '바디 (온다 · 바디 보톡스 · 승모근)',
    slot: 'first',
    kind: 'combo',
    rowKeys: [P(6)],
    lead: {
      ko: '바디 시술은 이번 달 온다 · 바디 보톡스가 함께 든 구성이 있습니다:',
      en: 'This month, body treatments come in a set with ONDA and body Botox:',
      ja: 'ボディ施術は、今月オンダ・ボディボトックスが付いた構成がございます：',
      zh: '本月身体项目有搭配 ONDA 和身体肉毒素的组合：',
      'zh-TW': '本月身體療程有搭配 ONDA 與身體肉毒的組合：',
      vi: 'Tháng này, các liệu trình cho cơ thể có gói kèm ONDA và Botox cơ thể:',
      th: 'เดือนนี้ หัตถการสำหรับร่างกายมีชุดที่รวม ONDA และโบท็อกซ์ร่างกาย:',
      ru: 'В этом месяце процедуры для тела предлагаются в наборе с ONDA и ботоксом для тела:',
      fr: 'Ce mois-ci, les soins du corps sont proposés dans une formule avec ONDA et du Botox corporel :',
      mn: 'Энэ сард биеийн эмчилгээнд ONDA болон биеийн ботокс багтсан багц байна:',
      ar: 'هذا الشهر، تتوفر علاجات الجسم ضمن باقة مع ONDA وبوتوكس الجسم:',
    },
  },
  {
    key: 'body.second',
    forKo: '바디 (온다 · 바디 보톡스 · 승모근)',
    slot: 'second',
    kind: 'combo',
    rowKeys: [P(8), P(9)],
    lead: {
      ko: '승모근 보톡스와 바디 온다가 든 이번 달 구성도 있습니다:',
      en: "There is also this month's set with trapezius Botox and body ONDA:",
      ja: '僧帽筋ボトックスとボディオンダが入った今月の構成もございます：',
      zh: '本月还有斜方肌肉毒素搭配身体 ONDA 的组合：',
      'zh-TW': '本月還有斜方肌肉毒搭配身體 ONDA 的組合：',
      vi: 'Ngoài ra còn có gói của tháng này gồm Botox cơ thang và Body ONDA:',
      th: 'นอกจากนี้ยังมีชุดของเดือนนี้ที่รวมโบท็อกซ์กล้ามเนื้อบ่าและ Body ONDA:',
      ru: 'Есть также набор этого месяца с ботоксом трапециевидных мышц и Body ONDA:',
      fr: 'Il existe aussi la formule de ce mois avec du Botox des trapèzes et Body ONDA :',
      mn: 'Мөн трапец булчингийн ботокс болон Body ONDA багтсан энэ сарын багц байна:',
      ar: 'وتتوفر أيضًا باقة هذا الشهر التي تشمل بوتوكس العضلة شبه المنحرفة وBody ONDA:',
    },
  },
  { key: 'body.lighter', forKo: '바디 (온다 · 바디 보톡스 · 승모근)', slot: 'lighter', kind: 'light', rowKeys: [P(8)] },
  // 14 고민만 말함 (처짐 · 탄력 · 볼륨 — 시술은 정하지 않음). 인모드도 함께 안내(대표원장님 2026-10-20)
  {
    key: 'concern.first',
    forKo: '고민만 말함 (처짐 · 탄력 · 볼륨, 시술은 정하지 않음)',
    slot: 'first',
    kind: 'concern',
    rowKeys: [P(19), P(20)],
    lead: {
      ko: '탄력 · 처짐에는 울쎄라피 프라임, 써마지 FLX, 덴서티, 슈링크, 인모드, 온다, 실리프팅 같은 시술이 있고, 이번 달에는 리프팅 구성도 있습니다:',
      en: 'For firmness and sagging, we offer treatments such as Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA and thread lifting, and this month there are also lifting sets:',
      ja: 'ハリ・たるみには、ウルセラピープライム、サーマジFLX、デンシティ、シュリンク、インモード、オンダ、糸リフトなどの施術があり、今月はリフティングの構成もございます：',
      zh: '针对紧致与松弛，我们有 Ultherapy Prime、热玛吉 FLX、Density、Shurink、InMode、ONDA、埋线提升等项目，本月也有提拉组合：',
      'zh-TW': '針對緊緻與鬆弛，我們有 Ultherapy Prime、鳳凰電波 FLX、Density、Shurink、InMode、ONDA、埋線拉提等療程，本月也有拉提組合：',
      vi: 'Đối với độ săn chắc và tình trạng chảy xệ, chúng tôi có các liệu trình như Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA và nâng chỉ, và tháng này còn có các gói nâng cơ:',
      th: 'สำหรับความกระชับและผิวหย่อนคล้อย เรามีหัตถการ เช่น Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA และการร้อยไหม และเดือนนี้ยังมีชุดยกกระชับด้วย:',
      ru: 'Для упругости и при провисании кожи у нас есть такие процедуры, как Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA и нитевой лифтинг, а в этом месяце есть и лифтинг-наборы:',
      fr: 'Pour la fermeté et le relâchement, nous proposons des soins comme Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA et le lifting par fils, et ce mois-ci il existe aussi des formules lifting :',
      mn: 'Арьсны чангалаг, унжилтад Ultherapy Prime, Thermage FLX, Density, Shurink, InMode, ONDA, утсан лифтинг зэрэг эмчилгээ байдаг бөгөөд энэ сард өргөлтийн багцууд ч байна:',
      ar: 'للشد ومعالجة الترهل، لدينا علاجات مثل Ultherapy Prime وThermage FLX وDensity وShurink وInMode وONDA والشد بالخيوط، وتتوفر هذا الشهر أيضًا باقات للشد:',
    },
  },
  {
    key: 'concern.lighter',
    forKo: '고민만 말함 (처짐 · 탄력 · 볼륨, 시술은 정하지 않음)',
    slot: 'lighter',
    kind: 'light',
    rowKeys: ['shurink.shurinkLaser.shot300', 'inmode.name.fx'],
  },
  // 15 2~3명 동행 — 동행 혜택은 채팅 예약 혜택(한 분에 1회)으로 합쳐졌다. 단체 할인은 10/2 규칙대로 직원.
];

/** 오늘 AI에게 줄 제안 줄 — 함께 보이는 가격 줄이 모두 오늘 유효한 것만, 꼬리표를 붙여 돌려준다. */
export function getOffers(rowByKey: ReadonlyMap<string, PriceRow>): OfferRow[] {
  const offers: OfferRow[] = [];
  for (const source of OFFER_SOURCES) {
    if (!source.rowKeys.every((k) => rowByKey.has(k))) continue;
    offers.push({ ...source, id: `C${String(offers.length + 1).padStart(2, '0')}` });
  }
  return offers;
}

/** AI가 쓴 글에서 제안 · 혜택 꼬리표를 찾는 식 */
export function offerTagPattern(): RegExp {
  return /\{\{(C\d{2}|B\d{2})\}\}/g;
}

const SLOT_EN: Record<OfferSlot, string> = { first: 'first suggestion', second: 'second suggestion', lighter: 'lighter option' };
const SLOT_KO: Record<OfferSlot, string> = { first: '제안 ①', second: '제안 ②', lighter: '부담 덜한 구성' };

/** 직원에게 보이는 제안 줄 이름 (Slack 요지의 "> 제안:" 줄) — `스컬트라 제안 ①` */
export function offerKo(offer: OfferSource): string {
  return `${offer.forKo} ${SLOT_KO[offer.slot]}`;
}

/** 프롬프트의 OFFER ROWS 부분 (한국어 · 영어 섞음). 함께 보이는 금액 줄의 이름을 적어 둔다 — 이미 보인 구성을 또 제안하지 않게 */
export function buildOfferText(offers: OfferRow[], rowByKey: ReadonlyMap<string, PriceRow>): string {
  const lines: string[] = [];
  let lastFor = '';
  for (const offer of offers) {
    if (offer.forKo !== lastFor) {
      lines.push(`## ${offer.forKo}`);
      lastFor = offer.forKo;
    }
    const rows = offer.rowKeys.map((k) => rowByKey.get(k)?.labelKo ?? k).join(' / ');
    lines.push(`{{${offer.id}}} ${SLOT_EN[offer.slot]} — 함께 보이는 금액 줄: ${rows}`);
  }
  return lines.join('\n');
}

// ── 손님에게 나가는 문장 ───────────────────────────────────────────────

type L10n = Record<VisitorLocale, string>;

/** 가격 부담 줄의 첫 문장 — "할인은 더 드릴 수 없다" (스펙 §4.2 R2) */
const LIGHT_PREFIX: L10n = {
  en: 'We are not able to add a further discount here.',
  ja: 'これ以上の割引はいたしかねます。',
  zh: '这里无法再给予额外折扣。',
  'zh-TW': '這裡無法再給予額外折扣。',
  vi: 'Chúng tôi không thể giảm thêm ở đây.',
  th: 'เราไม่สามารถให้ส่วนลดเพิ่มได้',
  ru: 'Дополнительную скидку здесь мы предложить не можем.',
  fr: 'Nous ne pouvons pas accorder de remise supplémentaire.',
  mn: 'Энд нэмэлт хөнгөлөлт үзүүлэх боломжгүй.',
  ar: 'لا يمكننا تقديم خصم إضافي هنا.',
};

const LIGHT_LEAD: L10n = {
  en: 'Lighter options include:',
  ja: 'ご負担の少ない構成としては、次のものがございます：',
  zh: '负担较轻的选择有：',
  'zh-TW': '負擔較輕的選擇有：',
  vi: 'Các lựa chọn nhẹ nhàng hơn gồm:',
  th: 'ตัวเลือกที่เบากว่า ได้แก่:',
  ru: 'Более доступные варианты:',
  fr: 'Options plus légères :',
  mn: 'Илүү хөнгөн сонголтууд:',
  ar: 'من الخيارات الأخف:',
};

/** 제안 줄의 마지막 문장 — 추천이 아니라 선택지라는 것을 손님에게도 보인다 (스펙 §4.3) */
const CLOSING: Record<OfferKind, L10n> = {
  combo: {
    en: 'Which combination suits you is decided by the doctor at the consultation.',
    ja: 'どの組み合わせが合うかは、医師が診察で判断します。',
    zh: '哪种搭配更合适，由医生在面诊时决定。',
    'zh-TW': '哪種搭配更合適，由醫師在面診時決定。',
    vi: 'Sự kết hợp nào phù hợp với quý khách sẽ do bác sĩ quyết định khi tư vấn.',
    th: 'แพทย์จะเป็นผู้พิจารณาว่าการผสมผสานแบบใดเหมาะกับคุณในระหว่างการปรึกษา',
    ru: 'Какое сочетание подходит именно вам, врач решает на консультации.',
    fr: 'C’est le médecin qui détermine, lors de la consultation, la combinaison qui vous convient.',
    mn: 'Танд аль хослол тохирохыг эмч зөвлөгөөний үеэр шийднэ.',
    ar: 'يحدد الطبيب أثناء الاستشارة أي مجموعة تناسبك.',
  },
  light: {
    en: 'The doctor will go through what fits your budget and your concerns at the consultation.',
    ja: 'ご予算とお悩みに合う施術は、医師が診察で一緒に確認いたします。',
    zh: '哪种项目适合您的预算和需求，医生会在面诊时与您一起确认。',
    'zh-TW': '哪種療程適合您的預算與需求，醫師會在面診時與您一起確認。',
    vi: 'Bác sĩ sẽ cùng quý khách xem lựa chọn nào phù hợp với ngân sách và mong muốn khi tư vấn.',
    th: 'แพทย์จะช่วยดูว่าตัวเลือกใดเหมาะกับงบประมาณและความต้องการของคุณในระหว่างการปรึกษา',
    ru: 'На консультации врач вместе с вами посмотрит, что подходит под ваш бюджет и задачи.',
    fr: 'Le médecin verra avec vous, lors de la consultation, ce qui correspond à votre budget et à vos attentes.',
    mn: 'Таны төсөв, хүсэлтэд аль нь тохирохыг эмч зөвлөгөөний үеэр тантай хамт харна.',
    ar: 'سيراجع الطبيب معك أثناء الاستشارة ما يناسب ميزانيتك واحتياجاتك.',
  },
  concern: {
    en: 'Which treatment suits you is decided by the doctor after seeing you in person.',
    ja: 'どの施術が合うかは、医師が直接拝見して判断します。',
    zh: '哪种项目适合您，由医生当面查看后决定。',
    'zh-TW': '哪種療程適合您，由醫師當面查看後決定。',
    vi: 'Liệu trình nào phù hợp với quý khách sẽ do bác sĩ quyết định sau khi trực tiếp thăm khám.',
    th: 'แพทย์จะพิจารณาว่าหัตถการใดเหมาะกับคุณหลังจากได้ตรวจด้วยตนเอง',
    ru: 'Какая процедура вам подходит, врач решает после очного осмотра.',
    fr: 'C’est le médecin qui détermine le soin adapté après vous avoir vu(e) en personne.',
    mn: 'Танд аль эмчилгээ тохирохыг эмч биечлэн үзсэний дараа шийднэ.',
    ar: 'يحدد الطبيب الإجراء المناسب لك بعد رؤيتك شخصيًا.',
  },
};

/** 한중일은 문장 사이를 띄우지 않는다 */
const joinSentences = (locale: VisitorLocale, a: string, b: string): string =>
  locale === 'ja' || locale === 'zh' || locale === 'zh-TW' ? `${a}${b}` : `${a} ${b}`;

/** 제안 줄의 앞 문장 (손님 언어) */
export function offerLead(offer: OfferSource, locale: VisitorLocale): string {
  const own = offer.lead?.[locale];
  if (offer.kind !== 'light') return own ?? '';
  return joinSentences(locale, LIGHT_PREFIX[locale] ?? LIGHT_PREFIX.en, own ?? LIGHT_LEAD[locale] ?? LIGHT_LEAD.en);
}

export function offerClosing(offer: OfferSource, locale: VisitorLocale): string {
  return CLOSING[offer.kind][locale] ?? CLOSING[offer.kind].en;
}

// ── 채팅 예약 혜택 (B01 · 가예약 요약 아래 줄) ──────────────────────────

/** 대화 중에 AI가 {{B01}} 로 부르는 문장 — 5% 부분 */
const FIVE_PERCENT: L10n = {
  en: 'If you book through this chat and pay at your visit, you get 5% off.',
  ja: 'このチャットから直接ご予約いただき、ご来院時にお支払いいただくと5%割引になります。',
  zh: '通过本聊天直接预约并到院付款，可享5%折扣。',
  'zh-TW': '透過本聊天直接預約並到院付款，可享5%折扣。',
  vi: 'Nếu quý khách đặt lịch qua khung chat này và thanh toán khi đến, quý khách được giảm 5%.',
  th: 'หากจองผ่านแชทนี้และชำระเงินเมื่อมาที่คลินิก จะได้รับส่วนลด 5%',
  ru: 'Если вы записываетесь через этот чат и оплачиваете при визите, вы получаете скидку 5%.',
  fr: 'Si vous réservez via ce chat et réglez lors de votre visite, vous bénéficiez de 5 % de réduction.',
  mn: 'Энэ чатаар захиалж, ирэхдээ төлбөрөө төлвөл 5% хөнгөлөлт эдэлнэ.',
  ar: 'عند الحجز عبر هذه الدردشة والدفع أثناء الزيارة، تحصل على خصم 5%.',
};

/** 가예약 요약 아래 줄 — 5% 부분 */
const BOOKED_FIVE_PERCENT: L10n = {
  en: 'Since you booked through this chat, you get 5% off when you pay at your visit.',
  ja: 'このチャットからのご予約ですので、ご来院時のお支払いが5%割引になります。',
  zh: '您通过本聊天预约，到院付款时可享5%折扣。',
  'zh-TW': '您透過本聊天預約，到院付款時可享5%折扣。',
  vi: 'Vì quý khách đặt lịch qua khung chat này, quý khách được giảm 5% khi thanh toán lúc đến.',
  th: 'เนื่องจากจองผ่านแชทนี้ จะได้รับส่วนลด 5% เมื่อชำระเงินในวันที่มา',
  ru: 'Поскольку вы записались через этот чат, при оплате во время визита вы получаете скидку 5%.',
  fr: 'Comme vous avez réservé via ce chat, vous bénéficiez de 5 % de réduction en réglant lors de votre visite.',
  mn: 'Та энэ чатаар захиалсан тул ирэхдээ төлбөр төлөхөд 5% хөнгөлөлт эдэлнэ.',
  ar: 'بما أنك حجزت عبر هذه الدردشة، تحصل على خصم 5% عند الدفع أثناء الزيارة.',
};

/** 무료 서비스 부분 — 조건(기준 금액 · 체험가 제외 · 한 분에 1회 · 방문한 날 선택)을 문장에 그대로 적는다 */
const FREE_SERVICE: Record<VisitorLocale, (min: string) => string> = {
  en: (m) =>
    `If your payment that day is ${m} or more (excl. VAT), you can also have one complimentary skin-care session or IV drip per person — you choose which on the day (first-visit trial prices excluded).`,
  ja: (m) =>
    `当日のお支払いが${m}（税別）以上の場合は、お一人様1回、スキンケアまたは点滴のいずれかもお受けいただけます。どちらにするかはご来院当日にお選びください（初回体験価格の施術は対象外です）。`,
  zh: (m) => `当天付款金额（不含增值税）达到${m}以上时，每人另可享受一次皮肤护理或输液（二选一），到院当天再选择即可（首次体验价项目除外）。`,
  'zh-TW': (m) => `當天付款金額（未稅）達${m}以上時，每人另可享一次皮膚護理或點滴（二選一），到院當天再選擇即可（首次體驗價項目除外）。`,
  vi: (m) =>
    `Nếu số tiền thanh toán trong ngày từ ${m} trở lên (chưa gồm VAT), mỗi người được thêm một lần chăm sóc da hoặc truyền dịch miễn phí — chọn vào ngày đến (không áp dụng cho giá trải nghiệm lần đầu).`,
  th: (m) =>
    `และหากยอดชำระในวันนั้นตั้งแต่ ${m} ขึ้นไป (ไม่รวม VAT) จะได้รับบริการดูแลผิวหรือน้ำเกลือวิตามินฟรี 1 ครั้งต่อท่าน โดยเลือกได้ในวันที่มา (ไม่รวมรายการราคาทดลองครั้งแรก)`,
  ru: (m) =>
    `Если сумма оплаты в этот день составляет ${m} или больше (без НДС), каждому гостю дополнительно предоставляется одна бесплатная процедура ухода за кожей или капельница — на выбор в день визита (кроме процедур по пробной цене для первого визита).`,
  fr: (m) =>
    `Si votre paiement du jour atteint ${m} ou plus (hors TVA), chaque personne bénéficie aussi d’un soin de la peau ou d’une perfusion offert, au choix le jour même (hors tarifs découverte première visite).`,
  mn: (m) =>
    `Тухайн өдрийн төлбөр ${m} буюу түүнээс дээш (НӨАТ ороогүй) бол хүн бүр арьс арчилгаа эсвэл дусал тариаг нэг удаа үнэгүй авах боломжтой — ирсэн өдрөө сонгоно (анхны айлчлалын туршилтын үнэ хамаарахгүй).`,
  ar: (m) =>
    `وإذا بلغ مبلغ الدفع في ذلك اليوم ${m} أو أكثر (غير شامل ضريبة القيمة المضافة)، يحصل كل شخص أيضًا على جلسة عناية بالبشرة أو محلول وريدي مجانًا لمرة واحدة، يتم اختيارها يوم الزيارة (باستثناء أسعار التجربة للزيارة الأولى).`,
};

const krw = (amount: number): string => `KRW ${amount.toLocaleString('en-US')}`;

/** {{B01}} 자리에 들어가는 문장. 제안형 응대가 꺼져 있으면 5%만 (10/2 와 같은 뜻) */
export function benefitSentence(locale: VisitorLocale, offersOn: boolean): string {
  const five = FIVE_PERCENT[locale] ?? FIVE_PERCENT.en;
  if (!offersOn) return five;
  const free = (FREE_SERVICE[locale] ?? FREE_SERVICE.en)(krw(BENEFIT_MIN_KRW));
  return joinSentences(locale, five, free);
}

/**
 * 가예약에 남기는 채팅 예약 혜택 (chat_bookings.benefit) — full = 5% + 무료 서비스(조건 문장까지), five = 5%만(체험가만 안내한 가예약).
 * 제안형 응대가 꺼진 대화는 남기지 않는다(null — 10/2 와 같다).
 */
export type BookingBenefit = 'five' | 'full';

/** 직원에게 보이는 혜택 — Slack 가예약 막대 · 관리자 화면 가예약 줄의 끝 */
export function benefitKo(benefit: BookingBenefit): string {
  return benefit === 'full'
    ? `혜택: 5% + 피부관리 또는 수액 1회(그날 결제 ${BENEFIT_MIN_KRW / 10_000}만 원 이상 · 방문한 날 선택)`
    : '혜택: 5%만(첫방문 체험가만 안내함)';
}

/** 가예약 요약 아래 줄. full = 무료 서비스 조건까지, five = 5%만 (체험가만 안내한 가예약 · 제안형 응대 꺼짐) */
export function benefitBookingLine(locale: VisitorLocale, mode: 'full' | 'five'): string {
  const five = BOOKED_FIVE_PERCENT[locale] ?? BOOKED_FIVE_PERCENT.en;
  if (mode === 'five') return five;
  const free = (FREE_SERVICE[locale] ?? FREE_SERVICE.en)(krw(BENEFIT_MIN_KRW));
  return joinSentences(locale, five, free);
}
