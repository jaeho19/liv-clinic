import type { VisitorLocale } from '@/lib/chat/chatApi';
import { CONTACT_CHANNEL_LABELS, type ContactChannel } from '@/lib/chat/contactChannels';
import { SOCIAL_LINKS } from '@/lib/constants';
import type { BookingFields, ContactRef } from './booking';
import type { ReplyPromise } from './calendar';
import type { VatDisplay } from './knowledge/scope';
import type { PriceRow } from './knowledge/types';

// 손님에게 나가는 글 가운데 프로그램이 만드는 부분 (스펙 2026-10-02 chat-ai-first-response §4.5 · 부록 B). 순수 함수.
// 틀리면 안 되는 것 — 금액 줄, 금액 안내 한 줄, 가예약 요약, 확정 약속, LINE 안내, "사람인가요?"의 답 — 은 AI가 쓰지 않는다.
// en · ja · zh · zh-TW 는 원장님이 확인한 문장(스펙 부록 B) 그대로다. 나머지 6개 언어는 영어 기준문에서 옮겼다.

interface Templates {
  /** 금액 줄: "부터" 금액 */
  from: (amount: string) => string;
  /** 금액 줄: 부가세 포함 금액 */
  vatIncluded: (amount: string) => string;
  /** 금액 줄: 프로모션 표시 — until 은 그 언어의 날짜(10월 31일) */
  promoTag: (until: string) => string;
  /** 금액 줄의 이름과 금액 사이 · 가예약 요약의 항목과 값 사이 */
  sep: string;
  /** 괄호로 덧붙이는 글 — 한중일은 전각 괄호를 붙여 쓰고, 나머지는 한 칸 띄우고 반각 괄호 */
  paren: (inner: string) => string;
  caveat: string;
  vatExcludedNote: string;
  vatIncludedNote: string;
  bookingTitle: string;
  bookingTitleChanged: string;
  date: string;
  treatment: string;
  guests: string;
  guestsValue: (n: number) => string;
  name: string;
  contact: string;
  koreaTime: string;
  /** 문장 속의 "이메일" (확정 약속) */
  emailName: string;
  promiseOpen: (channel: string) => string;
  promiseClosing: (channel: string, day: string) => string;
  promiseClosed: (channel: string, day: string) => string;
  /** 다음 영업일을 모를 때 */
  promiseLater: (channel: string) => string;
  lineHint: (url: string) => string;
  identity: string;
}

const count = (n: number): string => String(n);

const TEMPLATES: Record<VisitorLocale, Templates> = {
  en: {
    from: (a) => `from ${a}`,
    vatIncluded: (a) => `${a} incl. VAT`,
    promoTag: (d) => `this month's promotion, until ${d}`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'The exact amount is decided after your consultation with the doctor.',
    vatExcludedNote: 'Prices exclude VAT.',
    vatIncludedNote: 'Prices include VAT.',
    bookingTitle: 'Tentative booking (not yet confirmed)',
    bookingTitleChanged: 'Updated tentative booking (not yet confirmed)',
    date: 'Date',
    treatment: 'Treatment',
    guests: 'Guests',
    guestsValue: count,
    name: 'Name',
    contact: 'Contact',
    koreaTime: 'Korea time',
    emailName: 'email',
    promiseOpen: (c) => `We will send your booking confirmation today via ${c}.`,
    promiseClosing: (c, d) => `We will send your booking confirmation via ${c} today if we can, otherwise on the morning of ${d}.`,
    promiseClosed: (c, d) => `We will send your booking confirmation on the morning of ${d} (Korea time) via ${c}.`,
    promiseLater: (c) => `We will send your booking confirmation via ${c} on our next business day.`,
    lineHint: (url) => `So that we can reach you on LINE, please add us and send us a message first: ${url}`,
    identity: 'An automated assistant answers first here, and our team confirms all bookings.',
  },
  ja: {
    from: (a) => `${a}〜`,
    vatIncluded: (a) => `税込 ${a}`,
    promoTag: (d) => `今月のプロモーション・${d}まで`,
    sep: '：',
    paren: (inner) => `（${inner}）`,
    caveat: '正確な金額は、医師の診察後に決まります。',
    vatExcludedNote: '表示価格は税抜です。',
    vatIncludedNote: '表示価格は税込です。',
    bookingTitle: '仮予約（まだ確定ではありません）',
    bookingTitleChanged: '仮予約の変更（まだ確定ではありません）',
    date: '日時',
    treatment: '施術',
    guests: '人数',
    guestsValue: (n) => `${n}名`,
    name: 'お名前',
    contact: 'ご連絡先',
    koreaTime: '韓国時間',
    emailName: 'メール',
    promiseOpen: (c) => `ご予約の確定は、本日中に ${c} でお知らせいたします。`,
    promiseClosing: (c, d) => `ご予約の確定は、本日中、難しい場合は ${d} の午前中に ${c} でお知らせいたします。`,
    promiseClosed: (c, d) => `ご予約の確定は、${d} の午前中（韓国時間）に ${c} でお知らせいたします。`,
    promiseLater: (c) => `ご予約の確定は、翌営業日に ${c} でお知らせいたします。`,
    lineHint: (url) => `LINEでご連絡できるよう、友だち追加のうえ、先に一言メッセージをお送りください：${url}`,
    identity: 'こちらではまず自動応答がお答えし、ご予約はすべて当院スタッフが確認いたします。',
  },
  zh: {
    from: (a) => `${a} 起`,
    vatIncluded: (a) => `含税 ${a}`,
    promoTag: (d) => `本月优惠，至${d}`,
    sep: '：',
    paren: (inner) => `（${inner}）`,
    caveat: '具体金额将在医生面诊后确定。',
    vatExcludedNote: '以上价格不含增值税。',
    vatIncludedNote: '以上价格已含增值税。',
    bookingTitle: '暂定预约（尚未确认）',
    bookingTitleChanged: '暂定预约已更新（尚未确认）',
    date: '日期',
    treatment: '项目',
    guests: '人数',
    guestsValue: (n) => `${n}位`,
    name: '姓名',
    contact: '联系方式',
    koreaTime: '韩国时间',
    emailName: '电子邮件',
    promiseOpen: (c) => `我们将在今天内通过 ${c} 告知您预约确认结果。`,
    promiseClosing: (c, d) => `我们将尽量在今天内，最迟于 ${d} 上午通过 ${c} 告知您预约确认结果。`,
    promiseClosed: (c, d) => `我们将于 ${d} 上午（韩国时间）通过 ${c} 告知您预约确认结果。`,
    promiseLater: (c) => `我们将在下一个营业日通过 ${c} 告知您预约确认结果。`,
    lineHint: (url) => `为方便通过 LINE 与您联系，请先添加我们为好友并发送一条消息：${url}`,
    identity: '这里先由自动助手为您解答，所有预约均由本院工作人员确认。',
  },
  'zh-TW': {
    from: (a) => `${a} 起`,
    vatIncluded: (a) => `含稅 ${a}`,
    promoTag: (d) => `本月優惠，至${d}`,
    sep: '：',
    paren: (inner) => `（${inner}）`,
    caveat: '確切金額將於醫師面診後確定。',
    vatExcludedNote: '以上價格未含增值稅。',
    vatIncludedNote: '以上價格已含增值稅。',
    bookingTitle: '暫定預約（尚未確認）',
    bookingTitleChanged: '暫定預約已更新（尚未確認）',
    date: '日期',
    treatment: '項目',
    guests: '人數',
    guestsValue: (n) => `${n}位`,
    name: '姓名',
    contact: '聯絡方式',
    koreaTime: '韓國時間',
    emailName: '電子郵件',
    promiseOpen: (c) => `我們將於今天內透過 ${c} 通知您預約確認結果。`,
    promiseClosing: (c, d) => `我們將盡量於今天內，最遲於 ${d} 上午透過 ${c} 通知您預約確認結果。`,
    promiseClosed: (c, d) => `我們將於 ${d} 上午（韓國時間）透過 ${c} 通知您預約確認結果。`,
    promiseLater: (c) => `我們將於下一個營業日透過 ${c} 通知您預約確認結果。`,
    lineHint: (url) => `為方便透過 LINE 與您聯絡，請先加入我們為好友並傳送一則訊息：${url}`,
    identity: '這裡先由自動助理為您解答，所有預約皆由本院人員確認。',
  },
  vi: {
    from: (a) => `từ ${a}`,
    vatIncluded: (a) => `${a} đã gồm VAT`,
    promoTag: (d) => `khuyến mãi tháng này, đến ${d}`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'Số tiền chính xác sẽ được xác định sau khi bác sĩ tư vấn.',
    vatExcludedNote: 'Giá chưa bao gồm VAT.',
    vatIncludedNote: 'Giá đã bao gồm VAT.',
    bookingTitle: 'Đặt lịch tạm thời (chưa xác nhận)',
    bookingTitleChanged: 'Đặt lịch tạm thời đã cập nhật (chưa xác nhận)',
    date: 'Ngày',
    treatment: 'Dịch vụ',
    guests: 'Số người',
    guestsValue: count,
    name: 'Tên',
    contact: 'Liên hệ',
    koreaTime: 'giờ Hàn Quốc',
    emailName: 'email',
    promiseOpen: (c) => `Chúng tôi sẽ gửi xác nhận đặt lịch cho quý khách trong hôm nay qua ${c}.`,
    promiseClosing: (c, d) =>
      `Chúng tôi sẽ gửi xác nhận đặt lịch qua ${c} trong hôm nay nếu kịp, nếu không sẽ gửi vào sáng ${d}.`,
    promiseClosed: (c, d) => `Chúng tôi sẽ gửi xác nhận đặt lịch vào sáng ${d} (giờ Hàn Quốc) qua ${c}.`,
    promiseLater: (c) => `Chúng tôi sẽ gửi xác nhận đặt lịch qua ${c} vào ngày làm việc tiếp theo.`,
    lineHint: (url) =>
      `Để chúng tôi có thể liên hệ qua LINE, vui lòng kết bạn và gửi tin nhắn cho chúng tôi trước: ${url}`,
    identity: 'Tại đây, trợ lý tự động sẽ trả lời trước và nhân viên của chúng tôi xác nhận mọi lịch hẹn.',
  },
  th: {
    from: (a) => `เริ่มต้น ${a}`,
    vatIncluded: (a) => `รวม VAT ${a}`,
    promoTag: (d) => `โปรโมชั่นเดือนนี้ ถึง ${d}`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'ยอดที่แน่นอนจะสรุปหลังปรึกษากับแพทย์',
    vatExcludedNote: 'ราคายังไม่รวม VAT',
    vatIncludedNote: 'ราคารวม VAT แล้ว',
    bookingTitle: 'การจองเบื้องต้น (ยังไม่ยืนยัน)',
    bookingTitleChanged: 'อัปเดตการจองเบื้องต้น (ยังไม่ยืนยัน)',
    date: 'วันที่',
    treatment: 'หัตถการ',
    guests: 'จำนวนคน',
    guestsValue: count,
    name: 'ชื่อ',
    contact: 'ช่องทางติดต่อ',
    koreaTime: 'เวลาเกาหลี',
    emailName: 'อีเมล',
    promiseOpen: (c) => `เราจะแจ้งยืนยันการจองภายในวันนี้ทาง ${c}`,
    promiseClosing: (c, d) => `เราจะแจ้งยืนยันการจองทาง ${c} ภายในวันนี้หากทำได้ มิฉะนั้นจะแจ้งในช่วงเช้าของ ${d}`,
    promiseClosed: (c, d) => `เราจะแจ้งยืนยันการจองในช่วงเช้าของ ${d} (เวลาเกาหลี) ทาง ${c}`,
    promiseLater: (c) => `เราจะแจ้งยืนยันการจองทาง ${c} ในวันทำการถัดไป`,
    lineHint: (url) => `เพื่อให้เราติดต่อคุณทาง LINE ได้ กรุณาเพิ่มเราเป็นเพื่อนและส่งข้อความหาเราก่อน: ${url}`,
    identity: 'ที่นี่ระบบตอบกลับอัตโนมัติจะตอบก่อน และทีมงานของเราจะยืนยันการจองทุกรายการ',
  },
  ru: {
    from: (a) => `от ${a}`,
    vatIncluded: (a) => `${a} с НДС`,
    promoTag: (d) => `акция этого месяца, до ${d}`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'Точная сумма определяется после консультации с врачом.',
    vatExcludedNote: 'Цены указаны без НДС.',
    vatIncludedNote: 'Цены указаны с НДС.',
    bookingTitle: 'Предварительная запись (ещё не подтверждена)',
    bookingTitleChanged: 'Предварительная запись обновлена (ещё не подтверждена)',
    date: 'Дата',
    treatment: 'Процедура',
    guests: 'Количество человек',
    guestsValue: count,
    name: 'Имя',
    contact: 'Контакт',
    koreaTime: 'по корейскому времени',
    emailName: 'email',
    promiseOpen: (c) => `Мы отправим подтверждение записи сегодня через ${c}.`,
    promiseClosing: (c, d) => `Мы отправим подтверждение записи через ${c} сегодня, если получится, иначе утром ${d}.`,
    promiseClosed: (c, d) => `Мы отправим подтверждение записи утром ${d} (по корейскому времени) через ${c}.`,
    promiseLater: (c) => `Мы отправим подтверждение записи через ${c} в следующий рабочий день.`,
    lineHint: (url) =>
      `Чтобы мы могли связаться с вами в LINE, пожалуйста, добавьте нас в друзья и первым отправьте сообщение: ${url}`,
    identity: 'Здесь сначала отвечает автоматический помощник, а все записи подтверждают наши сотрудники.',
  },
  fr: {
    from: (a) => `à partir de ${a}`,
    vatIncluded: (a) => `${a} TTC`,
    promoTag: (d) => `promotion du mois, jusqu’au ${d}`,
    sep: ' : ',
    paren: (inner) => ` (${inner})`,
    caveat: 'Le montant exact est fixé après la consultation avec le médecin.',
    vatExcludedNote: 'Les prix s’entendent hors TVA.',
    vatIncludedNote: 'Les prix s’entendent TVA comprise.',
    bookingTitle: 'Pré-réservation (pas encore confirmée)',
    bookingTitleChanged: 'Pré-réservation mise à jour (pas encore confirmée)',
    date: 'Date',
    treatment: 'Soin',
    guests: 'Personnes',
    guestsValue: count,
    name: 'Nom',
    contact: 'Contact',
    koreaTime: 'heure de Corée',
    emailName: 'e-mail',
    promiseOpen: (c) => `Nous vous enverrons la confirmation de réservation aujourd’hui via ${c}.`,
    promiseClosing: (c, d) =>
      `Nous vous enverrons la confirmation de réservation via ${c} aujourd’hui si possible, sinon dans la matinée du ${d}.`,
    promiseClosed: (c, d) =>
      `Nous vous enverrons la confirmation de réservation dans la matinée du ${d} (heure de Corée) via ${c}.`,
    promiseLater: (c) => `Nous vous enverrons la confirmation de réservation via ${c} le prochain jour ouvré.`,
    lineHint: (url) =>
      `Pour que nous puissions vous joindre sur LINE, merci de nous ajouter et de nous envoyer d’abord un message : ${url}`,
    identity: 'Ici, un assistant automatique répond d’abord, et notre équipe confirme toutes les réservations.',
  },
  mn: {
    from: (a) => `эхлэх үнэ ${a}`,
    vatIncluded: (a) => `НӨАТ орсон ${a}`,
    promoTag: (d) => `энэ сарын урамшуулал, ${d} хүртэл`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'Нарийн дүнг эмчийн зөвлөгөөний дараа тогтооно.',
    vatExcludedNote: 'Үнэд НӨАТ ороогүй.',
    vatIncludedNote: 'Үнэд НӨАТ орсон.',
    bookingTitle: 'Урьдчилсан захиалга (баталгаажаагүй)',
    bookingTitleChanged: 'Урьдчилсан захиалга шинэчлэгдлээ (баталгаажаагүй)',
    date: 'Огноо',
    treatment: 'Үйлчилгээ',
    guests: 'Хүний тоо',
    guestsValue: count,
    name: 'Нэр',
    contact: 'Холбоо барих',
    koreaTime: 'Солонгосын цагаар',
    emailName: 'имэйл',
    promiseOpen: (c) => `Бид захиалгын баталгаажуулалтыг өнөөдөртөө илгээнэ (${c}).`,
    promiseClosing: (c, d) =>
      `Бид захиалгын баталгаажуулалтыг боломжтой бол өнөөдөр, эс бөгөөс дараагийн ажлын өдрийн өглөө (${d}) илгээнэ (${c}).`,
    promiseClosed: (c, d) =>
      `Бид захиалгын баталгаажуулалтыг дараагийн ажлын өдрийн өглөө (${d}, Солонгосын цагаар) илгээнэ (${c}).`,
    promiseLater: (c) => `Бид захиалгын баталгаажуулалтыг дараагийн ажлын өдөр илгээнэ (${c}).`,
    lineHint: (url) =>
      `LINE-аар холбогдох боломжтой болгохын тулд биднийг найзаар нэмээд эхлээд мессеж илгээнэ үү: ${url}`,
    identity: 'Энд эхлээд автомат туслах хариулж, бүх захиалгыг манай ажилтнууд баталгаажуулдаг.',
  },
  ar: {
    from: (a) => `ابتداءً من ${a}`,
    vatIncluded: (a) => `${a} شامل ضريبة القيمة المضافة`,
    promoTag: (d) => `عرض هذا الشهر، حتى ${d}`,
    sep: ': ',
    paren: (inner) => ` (${inner})`,
    caveat: 'يُحدَّد المبلغ الدقيق بعد الاستشارة مع الطبيب.',
    vatExcludedNote: 'الأسعار لا تشمل ضريبة القيمة المضافة.',
    vatIncludedNote: 'الأسعار تشمل ضريبة القيمة المضافة.',
    bookingTitle: 'حجز مبدئي (غير مؤكَّد بعد)',
    bookingTitleChanged: 'تم تحديث الحجز المبدئي (غير مؤكَّد بعد)',
    date: 'التاريخ',
    treatment: 'الإجراء',
    guests: 'عدد الأشخاص',
    guestsValue: count,
    name: 'الاسم',
    contact: 'وسيلة التواصل',
    koreaTime: 'بتوقيت كوريا',
    emailName: 'البريد الإلكتروني',
    promiseOpen: (c) => `سنرسل لك تأكيد الحجز اليوم عبر ${c}.`,
    promiseClosing: (c, d) => `سنرسل لك تأكيد الحجز عبر ${c} اليوم إن أمكن، وإلا ففي صباح ${d}.`,
    promiseClosed: (c, d) => `سنرسل لك تأكيد الحجز في صباح ${d} (بتوقيت كوريا) عبر ${c}.`,
    promiseLater: (c) => `سنرسل لك تأكيد الحجز عبر ${c} في يوم العمل التالي.`,
    lineHint: (url) => `لكي نتمكن من التواصل معك عبر LINE، يُرجى إضافتنا وإرسال رسالة لنا أولاً: ${url}`,
    identity: 'هنا يجيب المساعد الآلي أولاً، ويؤكد فريقنا جميع الحجوزات.',
  },
};

const t = (locale: VisitorLocale): Templates => TEMPLATES[locale] ?? TEMPLATES.en;

/** 금액은 모든 언어에서 `KRW 1,170,000` 꼴로 적는다. */
export function formatKrw(amount: number): string {
  return `KRW ${amount.toLocaleString('en-US')}`;
}

/** 부가세 포함 금액 — 프로그램이 계산한다(AI는 계산하지 않는다). */
export function withVat(amount: number): number {
  return Math.round(amount * 1.1);
}

type DateStyle = 'long' | 'short' | 'monthDay';
const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
  short: { weekday: 'short', month: 'short', day: 'numeric' },
  monthDay: { month: 'short', day: 'numeric' },
};

/** 한국 날짜(YYYY-MM-DD)를 손님 언어로. 숫자는 아라비아 숫자, 달력은 서기로 고정한다(태국어·아랍어). */
export function formatDate(locale: VisitorLocale, dateKey: string, style: DateStyle): string {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, { ...DATE_OPTIONS[style], timeZone: 'UTC' }).format(
    new Date(`${dateKey}T00:00:00Z`)
  );
}

/** 금액 줄 하나: `• 이름: from KRW 1,170,000 (KRW 1,287,000 incl. VAT)` — 프로모션 줄은 이름 뒤에 `(이달 프로모션 · ~까지)` */
export function renderPriceLine(row: PriceRow, locale: VisitorLocale, vat: VatDisplay): string {
  const T = t(locale);
  const tag = row.group === 'promo' && row.validUntil ? T.paren(T.promoTag(formatDate(locale, row.validUntil, 'monthDay'))) : '';
  // 상담비 같은 '그 밖의 금액'(fee)은 적힌 금액 그대로다 — 부가세 포함 금액을 따로 계산해 붙이지 않는다
  const plain = row.group === 'fee';
  const shown = formatKrw(vat === 'included' && !plain ? withVat(row.amount) : row.amount);
  const price = row.unit === 'starting' ? T.from(shown) : shown;
  const extra = vat === 'both' && !plain ? T.paren(T.vatIncluded(formatKrw(withVat(row.amount)))) : '';
  return `• ${row.labels[locale] ?? row.labels.en}${tag}${T.sep}${price}${extra}`;
}

/** 금액 줄이 있는 답의 끝에 한 번 붙이는 안내. */
export function priceCaveat(locale: VisitorLocale, vat: VatDisplay): string {
  const T = t(locale);
  if (vat === 'excluded') return `${T.vatExcludedNote} ${T.caveat}`;
  if (vat === 'included') return `${T.vatIncludedNote} ${T.caveat}`;
  return T.caveat;
}

/** 문장 속 채널 이름 — 메신저는 브랜드명, 이메일은 그 언어의 낱말. */
export function channelName(locale: VisitorLocale, channel: ContactChannel): string {
  return channel === 'email' ? t(locale).emailName : CONTACT_CHANNEL_LABELS[channel];
}

/** 가예약 요약의 마지막 줄 — 언제 확정을 알려 드리는가 (원장님 결정 ③). */
export function promiseSentence(locale: VisitorLocale, channel: ContactChannel, promise: ReplyPromise): string {
  const T = t(locale);
  const c = channelName(locale, channel);
  if (promise.slot === 'open') return T.promiseOpen(c);
  if (!promise.nextBusinessDay) return T.promiseLater(c);
  const day = formatDate(locale, promise.nextBusinessDay, 'short');
  const sentence = promise.slot === 'closing' ? T.promiseClosing(c, day) : T.promiseClosed(c, day);
  // 줄임말로 끝나는 날짜("6 окт." · "6 oct.")가 문장 끝에 오면 마침표가 겹친다
  return sentence.replace(/\.{2,}$/, '.');
}

/** LINE 을 연락처로 남긴 손님에게 — 친구 추가 뒤 먼저 한마디 보내 달라고 한다(아이디 검색이 막혀 있을 수 있다). */
export function lineHint(locale: VisitorLocale): string {
  return t(locale).lineHint(SOCIAL_LINKS.line);
}

/** "사람인가요, AI인가요?"의 답. 고지 한 줄(CHAT_AI_NOTICE)의 서버 쪽 문장이기도 하다. */
export function identityAnswer(locale: VisitorLocale): string {
  return t(locale).identity;
}

export interface BookingBlockArgs {
  locale: VisitorLocale;
  booking: BookingFields;
  /** 확정을 알릴 연락처 (가예약에 받은 것, 없으면 세션에 저장된 것) */
  contact: ContactRef;
  /** 찬 뒤에 바뀐 것이면 true — 제목이 달라진다 */
  changed: boolean;
  promise: ReplyPromise;
  /** 요약 바로 아래 · 확정 약속 앞에 붙이는 채팅 예약 혜택 한 줄 (제안형 응대 §4.4 ②) */
  benefitLine?: string | null;
}

/** 가예약 요약 + (채팅 예약 혜택 한 줄) + 확정 약속 (+ LINE 안내). 날짜가 없으면 빈 글자 — 호출자는 가예약이 찼을 때만 부른다. */
export function renderBookingBlock(args: BookingBlockArgs): string {
  const { locale, booking: b, contact, changed, promise } = args;
  if (!b.date) return '';
  const T = t(locale);
  const when = b.time ?? b.timeNote;
  // 날짜와 시각 사이: 한중일은 한 칸, 나머지는 가운뎃점
  const join = T.sep === '：' ? ' ' : ' · ';
  const lines = [
    changed ? T.bookingTitleChanged : T.bookingTitle,
    `• ${T.date}${T.sep}${formatDate(locale, b.date, 'long')}${when ? `${join}${when}` : ''}${T.paren(T.koreaTime)}`,
  ];
  if (b.treatment) lines.push(`• ${T.treatment}${T.sep}${b.treatment}`);
  if (b.partySize) lines.push(`• ${T.guests}${T.sep}${T.guestsValue(b.partySize)}`);
  if (b.name) lines.push(`• ${T.name}${T.sep}${b.name}`);
  lines.push(`• ${T.contact}${T.sep}${CONTACT_CHANNEL_LABELS[contact.channel]} ${contact.handle}`);
  if (args.benefitLine) lines.push(args.benefitLine);
  lines.push(promiseSentence(locale, contact.channel, promise));
  if (contact.channel === 'line') lines.push(lineHint(locale));
  return lines.join('\n');
}
