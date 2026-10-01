import 'server-only';
import { CHAT_VISITOR_LOCALES, type VisitorLocale } from './chatApi';

// 방문자 채팅 지원 로케일(SSOT) — 세션 생성 검증·번역·시스템 메시지가 모두 이 목록을 따른다.
// 목록 자체는 chatApi(클라이언트/서버 공용, 모듈 스코프 브라우저 접근 없음)가 소유하고,
// 서버 측 기존 이름(VISITOR_LOCALES)으로 재수출만 한다.
export const VISITOR_LOCALES = CHAT_VISITOR_LOCALES;
export type { VisitorLocale };
export type SystemMessageKey =
  | 'welcome'
  | 'delayedResponseNotice'
  | 'allOperatorsBusyNotice'
  | 'sessionEnded'
  | 'autoAck'
  | 'autoAckOffHours';

// chat.{key} 값을 각 locale별로 하드코딩.
// messages/*.json에서 복사한 문자열 — 런타임 파일 I/O 의존성 최소화.
const SYSTEM_MESSAGES: Record<VisitorLocale, Record<SystemMessageKey, string>> = {
  en: {
    welcome: 'Hello! How can we help you today?',
    delayedResponseNotice:
      "We're outside business hours (Weekdays 10:00–19:00, Sat 10:00–16:00 KST). Leave a message and we'll reply once we're back online. Please include your email for a faster response.",
    allOperatorsBusyNotice:
      "Our staff are momentarily away. Leave a message and we'll reply shortly.",
    sessionEnded:
      'This conversation has ended. Start a new chat for further questions.',
    autoAck: "Hello! Thank you for your message. Please hold on a moment, we'll get back to you shortly.",
    autoAckOffHours: "Hello! Thank you for your message. We're outside consultation hours right now and will reply in order once we're back.",
  },
  ja: {
    welcome: 'こんにちは！どのようなご質問でしょうか？',
    delayedResponseNotice:
      '現在、営業時間外です（平日10:00〜19:00、土曜10:00〜16:00 KST）。メッセージをお残しいただければ営業時間開始後にご返信いたします。早めの回答をご希望の場合はメールアドレスもお知らせください。',
    allOperatorsBusyNotice:
      'スタッフが少し席を外しております。メッセージをお残しください。後ほどご返信いたします。',
    sessionEnded:
      'この会話は終了しました。追加のご質問は新しいチャットを開始してください。',
    autoAck: 'こんにちは！メッセージありがとうございます。少々お待ちください。まもなくご返信いたします。',
    autoAckOffHours: 'こんにちは！メッセージありがとうございます。ただいま相談時間外のため、営業時間開始後に順番にご返信いたします。',
  },
  zh: {
    welcome: '您好！请问有什么可以帮您？',
    delayedResponseNotice:
      '现在不在营业时间内（工作日 10:00–19:00, 周六 10:00–16:00 KST）。请留言，营业时间开始后我们会回复您。如需更快回复，请同时留下您的邮箱。',
    allOperatorsBusyNotice: '客服暂时离开，请留言，我们会尽快回复。',
    sessionEnded:
      '本次对话已结束。如需进一步咨询，请开始新的对话。',
    autoAck: '您好！感谢您的留言。请稍等，我们会尽快回复您。',
    autoAckOffHours: '您好！感谢您的留言。现在是非咨询时间，我们将在营业时间内按顺序回复您。',
  },
  'zh-TW': {
    welcome: '您好！請問有什麼可以幫您？',
    delayedResponseNotice:
      '現在不在營業時間內（工作日 10:00–19:00, 週六 10:00–16:00 KST）。請留言，營業時間開始後我們會回覆您。如需更快回復，請同時留下您的郵箱。',
    allOperatorsBusyNotice: '客服暫時離開，請留言，我們會盡快回復。',
    sessionEnded:
      '本次對話已結束。如需進一步諮詢，請開始新的對話。',
    autoAck: '您好！感謝您的留言。請稍候，我們會盡快回覆您。',
    autoAckOffHours: '您好！感謝您的留言。現在是非諮詢時間，我們將在營業時間內依序回覆您。',
  },
  vi: {
    welcome: 'Xin chào! Hôm nay chúng tôi có thể giúp gì cho bạn?',
    delayedResponseNotice:
      'Hiện tại chúng tôi đang ngoài giờ làm việc (các ngày trong tuần 10:00–19:00, thứ Bảy 10:00–16:00 KST). Bạn hãy để lại tin nhắn, chúng tôi sẽ trả lời khi trực tuyến trở lại. Vui lòng để lại email của bạn để được phản hồi nhanh hơn.',
    allOperatorsBusyNotice:
      'Nhân viên của chúng tôi đang tạm thời vắng mặt. Bạn hãy để lại tin nhắn, chúng tôi sẽ trả lời trong thời gian ngắn.',
    sessionEnded:
      'Cuộc trò chuyện này đã kết thúc. Hãy bắt đầu cuộc trò chuyện mới nếu bạn có thêm câu hỏi.',
    autoAck: 'Xin chào! Cảm ơn bạn đã nhắn tin. Vui lòng đợi trong giây lát, chúng tôi sẽ trả lời bạn ngay.',
    autoAckOffHours: 'Xin chào! Cảm ơn bạn đã nhắn tin. Hiện đang ngoài giờ tư vấn, chúng tôi sẽ lần lượt trả lời trong giờ làm việc.',
  },
  th: {
    welcome: 'สวัสดี! วันนี้เราจะช่วยคุณได้อย่างไร?',
    delayedResponseNotice:
      'ขณะนี้อยู่นอกเวลาทำการ (วันธรรมดา 10:00–19:00 น., วันเสาร์ 10:00–16:00 น. KST) กรุณาฝากข้อความไว้ เราจะตอบกลับเมื่อกลับมาออนไลน์ หากต้องการคำตอบที่รวดเร็วยิ่งขึ้น กรุณาแจ้งอีเมลของคุณด้วย',
    allOperatorsBusyNotice:
      'เจ้าหน้าที่ของเราไม่อยู่ชั่วครู่ กรุณาฝากข้อความไว้ เราจะตอบกลับในไม่ช้า',
    sessionEnded:
      'บทสนทนานี้จบลงแล้ว หากมีคำถามเพิ่มเติม กรุณาเริ่มแชทใหม่',
    autoAck: 'สวัสดีค่ะ! ขอบคุณสำหรับข้อความ กรุณารอสักครู่ เราจะตอบกลับโดยเร็วที่สุด',
    autoAckOffHours: 'สวัสดีค่ะ! ขอบคุณสำหรับข้อความ ขณะนี้อยู่นอกเวลาให้คำปรึกษา เราจะตอบกลับตามลำดับในเวลาทำการค่ะ',
  },
  ru: {
    welcome: 'Здравствуйте! Чем мы можем помочь вам сегодня?',
    delayedResponseNotice:
      'Сейчас нерабочее время (будни 10:00–19:00, суббота 10:00–16:00 по корейскому времени). Оставьте сообщение, и мы ответим, как только снова будем онлайн. Укажите свой адрес электронной почты, чтобы получить ответ быстрее.',
    allOperatorsBusyNotice:
      'Наши сотрудники ненадолго отошли. Оставьте сообщение, и мы ответим в ближайшее время.',
    sessionEnded:
      'Этот разговор завершён. Для дальнейших вопросов начните новый чат.',
    autoAck: 'Здравствуйте! Спасибо за сообщение. Пожалуйста, подождите немного, мы скоро вам ответим.',
    autoAckOffHours: 'Здравствуйте! Спасибо за сообщение. Сейчас нерабочее время, мы ответим вам в порядке очереди в рабочие часы.',
  },
  fr: {
    welcome: 'Bonjour ! Comment pouvons-nous vous aider aujourd\'hui ?',
    delayedResponseNotice:
      'Nous sommes en dehors des heures d\'ouverture (en semaine 10h00–19h00, samedi 10h00–16h00 KST). Laissez-nous un message, nous répondrons dès notre retour. Indiquez votre adresse e-mail pour une réponse plus rapide.',
    allOperatorsBusyNotice:
      'Notre équipe est momentanément absente. Laissez un message, nous vous répondrons sous peu.',
    sessionEnded:
      'Cette conversation est terminée. Démarrez une nouvelle discussion pour toute autre question.',
    autoAck: 'Bonjour ! Merci pour votre message. Un instant, nous vous répondons très vite.',
    autoAckOffHours: "Bonjour ! Merci pour votre message. Nous sommes en dehors des heures de consultation et vous répondrons dans l'ordre à notre retour.",
  },
  mn: {
    welcome: 'Сайн байна уу! Бид танд яаж туслах вэ?',
    delayedResponseNotice:
      'Бид одоо ажлын цагаас гадуур байна (Даваа–Баасан 10:00–19:00, Бямба 10:00–16:00 KST). Мессеж үлдээгээрэй, бид ажлын цагт хариулна. Илүү хурдан хариу авахын тулд имэйл хаягаа үлдээнэ үү.',
    allOperatorsBusyNotice:
      'Манай ажилтан түр зуур байхгүй байна. Мессеж үлдээвэл бид удахгүй хариулна.',
    sessionEnded:
      'Энэ ярилцлага дууссан. Шинэ асуулт байвал шинээр чат эхлүүлнэ үү.',
    autoAck: 'Сайн байна уу! Мессеж үлдээсэнд баярлалаа. Түр хүлээнэ үү, бид удахгүй хариулах болно.',
    autoAckOffHours: 'Сайн байна уу! Мессеж үлдээсэнд баярлалаа. Одоо зөвлөгөөний цаг биш тул ажлын цагаар дарааллын дагуу хариулах болно.',
  },
  ar: {
    welcome: 'مرحباً! كيف يمكننا مساعدتك اليوم؟',
    delayedResponseNotice:
      'نحن خارج ساعات العمل حالياً (أيام الأسبوع 10:00–19:00، السبت 10:00–16:00 بتوقيت كوريا). اترك رسالتك وسنرد عليك عند عودتنا. يُرجى تضمين بريدك الإلكتروني للحصول على رد أسرع.',
    allOperatorsBusyNotice:
      'فريقنا غير متاح مؤقتاً. اترك رسالة وسنرد عليك قريباً.',
    sessionEnded:
      'انتهت هذه المحادثة. ابدأ محادثة جديدة لأي استفسارات أخرى.',
    autoAck: 'مرحباً! شكراً لرسالتك. يرجى الانتظار قليلاً، سنرد عليك قريباً.',
    autoAckOffHours: 'مرحباً! شكراً لرسالتك. نحن حالياً خارج ساعات الاستشارة وسنرد عليك بالترتيب عند عودتنا.',
  },
};

/**
 * 주어진 locale과 key에 해당하는 system 메시지 문자열을 반환한다.
 * 알 수 없는 locale이 들어오면 en으로 fallback.
 */
export function getChatSystemMessage(
  locale: VisitorLocale,
  key: SystemMessageKey,
): string {
  return SYSTEM_MESSAGES[locale]?.[key] ?? SYSTEM_MESSAGES.en[key];
}

// 연락처 저장 확인 — 채널 라벨/핸들 삽입이 필요해 별도 템플릿 테이블.
// 채널 라벨(WhatsApp·Email 등)은 로케일 무관.
// 2026-10-01: 카드가 영업시간 중에도 뜨므로 "영업 재개 후"가 아니라 "최대한 빨리 그쪽으로"로 바꿨다.
const CONTACT_SAVED_TEMPLATES: Record<VisitorLocale, string> = {
  en: "{channel} contact saved: {handle}. We'll reach out to you there as soon as we can.",
  ja: '{channel}の連絡先を保存しました：{handle}。できるだけ早くそちらへご連絡いたします。',
  zh: '已保存您的{channel}联系方式：{handle}。我们会尽快通过该方式联系您。',
  'zh-TW': '已儲存您的{channel}聯絡方式：{handle}。我們會盡快透過該方式與您聯絡。',
  vi: 'Đã lưu thông tin {channel} của bạn: {handle}. Chúng tôi sẽ liên hệ với bạn qua đó sớm nhất có thể.',
  th: 'บันทึกข้อมูลติดต่อ {channel} ของคุณแล้ว: {handle} เราจะติดต่อคุณทางนั้นโดยเร็วที่สุด',
  ru: 'Контакт {channel} сохранён: {handle}. Мы свяжемся с вами там как можно скорее.',
  fr: 'Contact {channel} enregistré : {handle}. Nous vous y recontacterons dès que possible.',
  mn: '{channel} холбоо барих мэдээлэл хадгалагдлаа: {handle}. Бид аль болох хурдан тэр хаягаар тантай холбогдоно.',
  ar: 'تم حفظ جهة اتصال {channel}: {handle}. سنتواصل معك عبرها في أقرب وقت ممكن.',
};

export function getContactSavedMessage(
  locale: VisitorLocale,
  channelLabel: string,
  handle: string,
): string {
  const tpl = CONTACT_SAVED_TEMPLATES[locale] ?? CONTACT_SAVED_TEMPLATES.en;
  return tpl.replace('{channel}', channelLabel).replace('{handle}', handle);
}

// 자동 첫 안내의 한국어 원문 — 관리자 화면에 "직원 답장"처럼 보이도록 original_text로 저장한다 (스펙 §4.10).
const AUTO_ACK_KO: Record<'autoAck' | 'autoAckOffHours', string> = {
  autoAck: '안녕하세요! 메시지 감사합니다. 잠시만 기다려 주세요. 곧 답변을 드리겠습니다.',
  autoAckOffHours:
    '안녕하세요! 메시지 감사합니다. 지금은 상담 시간이 아니어서 상담 시간에 순서대로 답변드리겠습니다.',
};

export function getAutoAckTexts(
  locale: VisitorLocale,
  offHours: boolean
): { ko: string; localized: string } {
  const key = offHours ? 'autoAckOffHours' : 'autoAck';
  return { ko: AUTO_ACK_KO[key], localized: getChatSystemMessage(locale, key) };
}

// ── 접수 안내 (스펙 2026-10-01 §4.1) ────────────────────────────────────────
// 새 문의의 첫 자동 안내: 예상 시간 + 연락처 요청 + 되묻기. 문장을 조합해 말풍선 하나로 보낸다.
// ja·zh·zh-TW 는 원장님이 미리보기에서 확인한 문장(스펙 부록 A) 그대로다 — 고치려면 미리보기도 함께 고친다.

export type IntakeSlot = 'open' | 'closing' | 'closed';

export type IntakeFragmentKey =
  | 'G'
  | 'S_open'
  | 'S_closing'
  | 'S_closed'
  | 'C_ask_open'
  | 'C_ask_closing'
  | 'C_ask_closed'
  | 'C_known_open'
  | 'C_known_closing'
  | 'C_known_closed'
  | 'Q'
  | 'W';

const INTAKE_FRAGMENTS_KO: Record<IntakeFragmentKey, string> = {
  G: '안녕하세요, 리브성형외과입니다. 메시지 잘 받았습니다.',
  S_open: '지금 상담 직원이 다른 손님을 안내 중이라 답변까지 10~20분쯤 걸릴 수 있습니다.',
  S_closing: '오늘 상담 시간이 곧 끝납니다.',
  S_closed: '지금은 상담 시간이 아닙니다.',
  C_ask_open:
    '기다리지 않으셔도 되도록 아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 최대한 빨리 그쪽으로 연락드리겠습니다.',
  C_ask_closing:
    '아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다.',
  C_ask_closed:
    '아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 상담 시간이 시작되는 대로 최대한 빨리 그쪽으로 연락드리겠습니다.',
  C_known_open: '남겨 주신 연락처로 오늘 안에 최대한 빨리 연락드리겠습니다.',
  C_known_closing: '남겨 주신 연락처로 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다.',
  C_known_closed: '남겨 주신 연락처로 상담 시간이 시작되는 대로 최대한 빨리 연락드리겠습니다.',
  Q: '원하시는 시술과 방문 예정일을 함께 적어 주시면 한 번에 정확히 안내드릴 수 있습니다.',
  W: '이 창을 열어 두시면 여기로도 답변드립니다.',
};

const INTAKE_FRAGMENTS: Record<VisitorLocale, Record<IntakeFragmentKey, string>> = {
  en: {
    G: "Hello, this is LIV Plastic Surgery. We've received your message.",
    S_open: 'Our consultants are assisting other guests right now, so a reply may take about 10–20 minutes.',
    S_closing: 'Our consultation hours end soon today.',
    S_closed: "We're outside consultation hours right now.",
    C_ask_open:
      "So you don't have to wait, leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there today, as soon as we can.",
    C_ask_closing:
      "Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there — today if we can, otherwise first thing on the next business day.",
    C_ask_closed:
      "Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there as soon as our consultation hours begin.",
    C_known_open: "We'll reach out to you today at the contact you left, as soon as we can.",
    C_known_closing:
      "We'll reach out to you at the contact you left — today if we can, otherwise first thing on the next business day.",
    C_known_closed: "We'll reach out to you at the contact you left as soon as our consultation hours begin.",
    Q: "If you tell us which treatment you're interested in and when you plan to visit, we can give you a complete answer in one go.",
    W: "If you keep this window open, we'll also reply here.",
  },
  ja: {
    G: 'こんにちは、LIV美容クリニックです。メッセージを受け付けました。',
    S_open: 'ただいまスタッフが他のお客様をご案内中のため、ご返信まで10〜20分ほどかかる場合がございます。',
    S_closing: '本日のご相談時間はまもなく終了いたします。',
    S_closed: 'ただいまはご相談時間外です。',
    C_ask_open:
      'お待ちいただかなくて済むよう、下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中に、できるだけ早くそちらへご連絡いたします。',
    C_ask_closing:
      '下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。',
    C_ask_closed:
      '下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。ご相談時間が始まり次第、できるだけ早くそちらへご連絡いたします。',
    C_known_open: 'お残しいただいた連絡先へ、本日中にできるだけ早くご連絡いたします。',
    C_known_closing: 'お残しいただいた連絡先へ本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。',
    C_known_closed: 'お残しいただいた連絡先へ、ご相談時間が始まり次第できるだけ早くご連絡いたします。',
    Q: 'ご希望の施術とご来院予定日をあわせてお知らせいただければ、一度で正確にご案内できます。',
    W: 'この画面を開いたままにしていただければ、こちらにもご返信いたします。',
  },
  zh: {
    G: '您好，这里是LIV整形外科。已收到您的留言。',
    S_open: '目前咨询人员正在接待其他顾客，回复可能需要10～20分钟左右。',
    S_closing: '今天的咨询时间即将结束。',
    S_closed: '现在不在咨询时间内。',
    C_ask_open:
      '为了不让您久等，请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内尽快通过该方式联系您。',
    C_ask_closing:
      '请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内联系您；如来不及，将在下一个营业日第一时间联系您。',
    C_ask_closed: '请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），咨询时间一开始，我们会尽快通过该方式联系您。',
    C_known_open: '我们会在今天之内尽快通过您留下的联系方式与您联系。',
    C_known_closing: '我们会在今天之内通过您留下的联系方式与您联系；如来不及，将在下一个营业日第一时间联系您。',
    C_known_closed: '咨询时间一开始，我们会尽快通过您留下的联系方式与您联系。',
    Q: '请一并告知您想了解的项目和预计到访日期，我们可以一次性为您准确说明。',
    W: '保持此窗口打开，我们也会在这里回复您。',
  },
  'zh-TW': {
    G: '您好，這裡是LIV整形外科。已收到您的訊息。',
    S_open: '目前諮詢人員正在接待其他顧客，回覆可能需要10～20分鐘左右。',
    S_closing: '今天的諮詢時間即將結束。',
    S_closed: '現在不在諮詢時間內。',
    C_ask_open:
      '為了不讓您久等，請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內盡快透過該方式與您聯絡。',
    C_ask_closing:
      '請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內與您聯絡；如來不及，將在下一個營業日優先與您聯絡。',
    C_ask_closed:
      '請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），諮詢時間一開始，我們會盡快透過該方式與您聯絡。',
    C_known_open: '我們會在今天之內盡快透過您留下的聯絡方式與您聯絡。',
    C_known_closing: '我們會在今天之內透過您留下的聯絡方式與您聯絡；如來不及，將在下一個營業日優先與您聯絡。',
    C_known_closed: '諮詢時間一開始，我們會盡快透過您留下的聯絡方式與您聯絡。',
    Q: '請一併告知您想了解的療程和預計到訪日期，我們可以一次為您準確說明。',
    W: '保持此視窗開啟，我們也會在這裡回覆您。',
  },
  vi: {
    G: 'Xin chào, đây là Phẫu thuật thẩm mỹ LIV. Chúng tôi đã nhận được tin nhắn của bạn.',
    S_open: 'Hiện nhân viên tư vấn đang hỗ trợ khách khác nên có thể mất khoảng 10–20 phút để trả lời.',
    S_closing: 'Giờ tư vấn hôm nay sắp kết thúc.',
    S_closed: 'Hiện đang ngoài giờ tư vấn.',
    C_ask_open:
      'Để bạn không phải chờ, hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó trong hôm nay, sớm nhất có thể.',
    C_ask_closing:
      'Hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó trong hôm nay nếu kịp, nếu không sẽ liên hệ đầu tiên vào ngày làm việc tiếp theo.',
    C_ask_closed:
      'Hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó ngay khi giờ tư vấn bắt đầu.',
    C_known_open: 'Chúng tôi sẽ liên hệ với bạn trong hôm nay qua thông tin liên hệ bạn đã để lại, sớm nhất có thể.',
    C_known_closing:
      'Chúng tôi sẽ liên hệ với bạn qua thông tin liên hệ bạn đã để lại — trong hôm nay nếu kịp, nếu không sẽ liên hệ đầu tiên vào ngày làm việc tiếp theo.',
    C_known_closed: 'Chúng tôi sẽ liên hệ với bạn qua thông tin liên hệ bạn đã để lại ngay khi giờ tư vấn bắt đầu.',
    Q: 'Nếu bạn cho chúng tôi biết dịch vụ bạn quan tâm và thời gian dự định đến, chúng tôi có thể tư vấn đầy đủ chỉ trong một lần.',
    W: 'Nếu bạn để cửa sổ này mở, chúng tôi cũng sẽ trả lời tại đây.',
  },
  th: {
    G: 'สวัสดีค่ะ ที่นี่ศัลยกรรมพลาสติกลีฟค่ะ เราได้รับข้อความของคุณแล้วค่ะ',
    S_open: 'ขณะนี้เจ้าหน้าที่กำลังดูแลลูกค้าท่านอื่นอยู่ การตอบกลับอาจใช้เวลาประมาณ 10–20 นาทีค่ะ',
    S_closing: 'เวลาให้คำปรึกษาของวันนี้ใกล้จะสิ้นสุดแล้วค่ะ',
    S_closed: 'ขณะนี้อยู่นอกเวลาให้คำปรึกษาค่ะ',
    C_ask_open:
      'เพื่อไม่ให้คุณต้องรอ กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นภายในวันนี้โดยเร็วที่สุดค่ะ',
    C_ask_closing:
      'กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นภายในวันนี้ หากไม่ทันจะติดต่อเป็นอันดับแรกในวันทำการถัดไปค่ะ',
    C_ask_closed:
      'กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นโดยเร็วที่สุดเมื่อถึงเวลาให้คำปรึกษาค่ะ',
    C_known_open: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้ภายในวันนี้โดยเร็วที่สุดค่ะ',
    C_known_closing: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้ภายในวันนี้ หากไม่ทันจะติดต่อเป็นอันดับแรกในวันทำการถัดไปค่ะ',
    C_known_closed: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้โดยเร็วที่สุดเมื่อถึงเวลาให้คำปรึกษาค่ะ',
    Q: 'หากแจ้งหัตถการที่สนใจและวันที่คาดว่าจะเข้ามา เราจะให้ข้อมูลได้ครบถ้วนในครั้งเดียวค่ะ',
    W: 'หากเปิดหน้าต่างนี้ไว้ เราจะตอบกลับที่นี่ด้วยค่ะ',
  },
  ru: {
    G: 'Здравствуйте, это клиника «ЛИВ Пластическая хирургия». Мы получили ваше сообщение.',
    S_open: 'Сейчас наши консультанты заняты с другими гостями, поэтому ответ может занять около 10–20 минут.',
    S_closing: 'Время консультаций на сегодня скоро заканчивается.',
    S_closed: 'Сейчас нерабочее время консультаций.',
    C_ask_open:
      'Чтобы вам не пришлось ждать, оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там сегодня, как можно скорее.',
    C_ask_closing:
      'Оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там — сегодня, если успеем, а если нет — первым делом в следующий рабочий день.',
    C_ask_closed:
      'Оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там, как только начнётся время консультаций.',
    C_known_open: 'Мы свяжемся с вами сегодня по оставленному вами контакту, как можно скорее.',
    C_known_closing:
      'Мы свяжемся с вами по оставленному вами контакту — сегодня, если успеем, а если нет — первым делом в следующий рабочий день.',
    C_known_closed: 'Мы свяжемся с вами по оставленному вами контакту, как только начнётся время консультаций.',
    Q: 'Если вы сообщите, какая процедура вас интересует и когда вы планируете визит, мы сможем сразу дать полный ответ.',
    W: 'Если вы оставите это окно открытым, мы ответим и здесь.',
  },
  fr: {
    G: 'Bonjour, ici LIV Chirurgie Esthétique. Nous avons bien reçu votre message.',
    S_open:
      "Nos conseillers s'occupent actuellement d'autres patients ; la réponse peut prendre environ 10 à 20 minutes.",
    S_closing: "Nos horaires de consultation se terminent bientôt aujourd'hui.",
    S_closed: 'Nous sommes actuellement en dehors des horaires de consultation.',
    C_ask_open:
      "Pour vous éviter d'attendre, laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons aujourd'hui, dès que possible.",
    C_ask_closing:
      "Laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons — aujourd'hui si possible, sinon en priorité le prochain jour ouvré.",
    C_ask_closed:
      'Laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons dès le début de nos horaires de consultation.',
    C_known_open: "Nous vous recontacterons aujourd'hui au contact que vous avez laissé, dès que possible.",
    C_known_closing:
      "Nous vous recontacterons au contact que vous avez laissé — aujourd'hui si possible, sinon en priorité le prochain jour ouvré.",
    C_known_closed:
      'Nous vous recontacterons au contact que vous avez laissé dès le début de nos horaires de consultation.',
    Q: 'Si vous nous indiquez le soin qui vous intéresse et la date prévue de votre visite, nous pourrons vous donner une réponse complète en une seule fois.',
    W: 'Si vous gardez cette fenêtre ouverte, nous vous répondrons aussi ici.',
  },
  mn: {
    G: 'Сайн байна уу, LIV Гоо Заслын Эмнэлэг байна. Таны мессежийг хүлээн авлаа.',
    S_open:
      'Одоо манай зөвлөхүүд бусад үйлчлүүлэгчид үйлчилж байгаа тул хариу өгөхөд 10–20 орчим минут шаардагдаж магадгүй.',
    S_closing: 'Өнөөдрийн зөвлөгөөний цаг удахгүй дуусна.',
    S_closed: 'Одоо зөвлөгөөний цаг биш байна.',
    C_ask_open:
      'Таныг хүлээлгэхгүйн тулд доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл бид өнөөдөртөө багтаан аль болох хурдан тэр хаягаар тантай холбогдоно.',
    C_ask_closing:
      'Доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл бид өнөөдөртөө багтаан холбогдох бөгөөд амжихгүй бол дараагийн ажлын өдөр хамгийн түрүүнд холбогдоно.',
    C_ask_closed:
      'Доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл зөвлөгөөний цаг эхэлмэгц бид аль болох хурдан тэр хаягаар тантай холбогдоно.',
    C_known_open: 'Таны үлдээсэн хаягаар бид өнөөдөртөө багтаан аль болох хурдан холбогдоно.',
    C_known_closing:
      'Таны үлдээсэн хаягаар бид өнөөдөртөө багтаан холбогдох бөгөөд амжихгүй бол дараагийн ажлын өдөр хамгийн түрүүнд холбогдоно.',
    C_known_closed: 'Таны үлдээсэн хаягаар зөвлөгөөний цаг эхэлмэгц бид аль болох хурдан холбогдоно.',
    Q: 'Сонирхож буй эмчилгээ болон ирэхээр төлөвлөж буй өдрөө хамт бичвэл бид нэг дор бүрэн хариулт өгөх боломжтой.',
    W: 'Энэ цонхыг нээлттэй үлдээвэл бид энд бас хариулна.',
  },
  ar: {
    G: 'مرحباً، معكم مستشفى ليف للتجميل. لقد استلمنا رسالتك.',
    S_open: 'مستشارونا يساعدون ضيوفاً آخرين حالياً، لذا قد يستغرق الرد نحو 10–20 دقيقة.',
    S_closing: 'ساعات الاستشارة لهذا اليوم ستنتهي قريباً.',
    S_closed: 'نحن حالياً خارج ساعات الاستشارة.',
    C_ask_open:
      'حتى لا تضطر للانتظار، اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها اليوم في أقرب وقت ممكن.',
    C_ask_closing:
      'اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها اليوم إن أمكن، وإلا فسنتواصل معك أولاً في يوم العمل التالي.',
    C_ask_closed:
      'اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها فور بدء ساعات الاستشارة.',
    C_known_open: 'سنتواصل معك اليوم عبر وسيلة التواصل التي تركتها في أقرب وقت ممكن.',
    C_known_closing:
      'سنتواصل معك عبر وسيلة التواصل التي تركتها اليوم إن أمكن، وإلا فسنتواصل معك أولاً في يوم العمل التالي.',
    C_known_closed: 'سنتواصل معك عبر وسيلة التواصل التي تركتها فور بدء ساعات الاستشارة.',
    Q: 'إذا أخبرتنا بالإجراء الذي يهمك وموعد زيارتك المتوقع، يمكننا إعطاؤك إجابة كاملة دفعة واحدة.',
    W: 'إذا أبقيت هذه النافذة مفتوحة، سنرد عليك هنا أيضاً.',
  },
};

/** 접수 안내에 들어가는 문장 키 (순수): G + S + C + Q, 영업 중일 때만 W. */
export function intakeFragmentKeys(slot: IntakeSlot, hasContact: boolean): IntakeFragmentKey[] {
  const keys: IntakeFragmentKey[] = ['G', `S_${slot}`, `C_${hasContact ? 'known' : 'ask'}_${slot}`, 'Q'];
  if (slot === 'open') keys.push('W');
  return keys;
}

/** 접수 안내 문구. ko = 관리자 화면에 보이는 원문, localized = 손님 언어. 줄바꿈으로 이은 말풍선 하나. */
export function composeIntakeTexts(
  locale: VisitorLocale,
  slot: IntakeSlot,
  hasContact: boolean
): { ko: string; localized: string } {
  const keys = intakeFragmentKeys(slot, hasContact);
  const table = INTAKE_FRAGMENTS[locale] ?? INTAKE_FRAGMENTS.en;
  return {
    ko: keys.map((k) => INTAKE_FRAGMENTS_KO[k]).join('\n'),
    localized: keys.map((k) => table[k]).join('\n'),
  };
}

// ── 이벤트 안내 (스펙 2026-10-01 §4.10) ─────────────────────────────────────
// 가격·프로모션을 물은 손님에게 "가격은 직원이 확인해 안내드린다" + 프로모션 페이지 링크를 먼저 보낸다.
// 문장에는 가격·할인율·효과를 넣지 않는다 — 그런 내용은 링크한 페이지에만 있다.
// ja·zh·zh-TW 는 원장님이 미리보기에서 확인한 문장(스펙 부록 A) 그대로다.

/** promotion = 이번 달 프로모션 상세로 갈 때, list = 이벤트 목록으로 갈 때 */
export type EventHintKind = 'promotion' | 'list';

const EVENT_HINT_KO: Record<EventHintKind, string> = {
  promotion: '가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다.',
  list: '가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 진행 중인 이벤트는 아래에서 보실 수 있습니다.',
};

const EVENT_HINT_TEXTS: Record<VisitorLocale, Record<EventHintKind, string>> = {
  en: {
    promotion: "Our consultants will confirm the exact price and get back to you. You can see this month's promotion here:",
    list: 'Our consultants will confirm the exact price and get back to you. You can see our current promotions here:',
  },
  ja: {
    promotion: '料金はスタッフが確認のうえ、正確にご案内いたします。今月のプロモーションはこちらからご覧いただけます。',
    list: '料金はスタッフが確認のうえ、正確にご案内いたします。実施中のイベントはこちらからご覧いただけます。',
  },
  zh: {
    promotion: '具体价格将由咨询人员确认后为您准确说明。本月优惠活动可在此查看：',
    list: '具体价格将由咨询人员确认后为您准确说明。目前进行中的活动可在此查看：',
  },
  'zh-TW': {
    promotion: '確切價格將由諮詢人員確認後為您準確說明。本月優惠活動可在此查看：',
    list: '確切價格將由諮詢人員確認後為您準確說明。目前進行中的活動可在此查看：',
  },
  vi: {
    promotion:
      'Nhân viên tư vấn sẽ xác nhận giá chính xác và phản hồi lại cho bạn. Bạn có thể xem chương trình khuyến mãi tháng này tại đây:',
    list: 'Nhân viên tư vấn sẽ xác nhận giá chính xác và phản hồi lại cho bạn. Bạn có thể xem các chương trình khuyến mãi hiện có tại đây:',
  },
  th: {
    promotion: 'เจ้าหน้าที่จะตรวจสอบราคาที่แน่นอนแล้วแจ้งให้ทราบอีกครั้งค่ะ ดูโปรโมชันประจำเดือนนี้ได้ที่นี่:',
    list: 'เจ้าหน้าที่จะตรวจสอบราคาที่แน่นอนแล้วแจ้งให้ทราบอีกครั้งค่ะ ดูโปรโมชันที่กำลังจัดอยู่ได้ที่นี่:',
  },
  ru: {
    promotion: 'Наши консультанты уточнят точную стоимость и ответят вам. Акцию этого месяца можно посмотреть здесь:',
    list: 'Наши консультанты уточнят точную стоимость и ответят вам. Действующие акции можно посмотреть здесь:',
  },
  fr: {
    promotion:
      'Nos conseillers vérifieront le tarif exact et reviendront vers vous. Vous pouvez consulter la promotion du mois ici :',
    list: 'Nos conseillers vérifieront le tarif exact et reviendront vers vous. Vous pouvez consulter nos offres en cours ici :',
  },
  mn: {
    promotion: 'Үнийг манай зөвлөх нягталж, танд яг таг мэдээлэл өгнө. Энэ сарын урамшууллыг эндээс үзнэ үү:',
    list: 'Үнийг манай зөвлөх нягталж, танд яг таг мэдээлэл өгнө. Одоо явагдаж буй урамшууллыг эндээс үзнэ үү:',
  },
  ar: {
    promotion: 'سيتأكد مستشارونا من السعر الدقيق ويعودون إليك. يمكنك الاطلاع على عرض هذا الشهر هنا:',
    list: 'سيتأكد مستشارونا من السعر الدقيق ويعودون إليك. يمكنك الاطلاع على عروضنا الحالية هنا:',
  },
};

/** 이벤트 안내 문구: 문장 + 줄바꿈 + 링크. ko = 관리자 화면에 보이는 원문, localized = 손님 언어. */
export function composeEventHintTexts(
  locale: VisitorLocale,
  kind: EventHintKind,
  url: string
): { ko: string; localized: string } {
  const table = EVENT_HINT_TEXTS[locale] ?? EVENT_HINT_TEXTS.en;
  return { ko: `${EVENT_HINT_KO[kind]}\n${url}`, localized: `${table[kind]}\n${url}` };
}
