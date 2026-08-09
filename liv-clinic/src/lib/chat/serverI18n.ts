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
  | 'sessionEnded';

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
  },
  ja: {
    welcome: 'こんにちは！どのようなご質問でしょうか？',
    delayedResponseNotice:
      '現在、営業時間外です（平日10:00〜19:00、土曜10:00〜16:00 KST）。メッセージをお残しいただければ営業時間開始後にご返信いたします。早めの回答をご希望の場合はメールアドレスもお知らせください。',
    allOperatorsBusyNotice:
      'スタッフが少し席を外しております。メッセージをお残しください。後ほどご返信いたします。',
    sessionEnded:
      'この会話は終了しました。追加のご質問は新しいチャットを開始してください。',
  },
  zh: {
    welcome: '您好！请问有什么可以帮您？',
    delayedResponseNotice:
      '现在不在营业时间内（工作日 10:00–19:00, 周六 10:00–16:00 KST）。请留言，营业时间开始后我们会回复您。如需更快回复，请同时留下您的邮箱。',
    allOperatorsBusyNotice: '客服暂时离开，请留言，我们会尽快回复。',
    sessionEnded:
      '本次对话已结束。如需进一步咨询，请开始新的对话。',
  },
  'zh-TW': {
    welcome: '您好！請問有什麼可以幫您？',
    delayedResponseNotice:
      '現在不在營業時間內（工作日 10:00–19:00, 週六 10:00–16:00 KST）。請留言，營業時間開始後我們會回覆您。如需更快回復，請同時留下您的郵箱。',
    allOperatorsBusyNotice: '客服暫時離開，請留言，我們會盡快回復。',
    sessionEnded:
      '本次對話已結束。如需進一步諮詢，請開始新的對話。',
  },
  vi: {
    welcome: 'Xin chào! Hôm nay chúng tôi có thể giúp gì cho bạn?',
    delayedResponseNotice:
      'Hiện tại chúng tôi đang ngoài giờ làm việc (các ngày trong tuần 10:00–19:00, thứ Bảy 10:00–16:00 KST). Bạn hãy để lại tin nhắn, chúng tôi sẽ trả lời khi trực tuyến trở lại. Vui lòng để lại email của bạn để được phản hồi nhanh hơn.',
    allOperatorsBusyNotice:
      'Nhân viên của chúng tôi đang tạm thời vắng mặt. Bạn hãy để lại tin nhắn, chúng tôi sẽ trả lời trong thời gian ngắn.',
    sessionEnded:
      'Cuộc trò chuyện này đã kết thúc. Hãy bắt đầu cuộc trò chuyện mới nếu bạn có thêm câu hỏi.',
  },
  th: {
    welcome: 'สวัสดี! วันนี้เราจะช่วยคุณได้อย่างไร?',
    delayedResponseNotice:
      'ขณะนี้อยู่นอกเวลาทำการ (วันธรรมดา 10:00–19:00 น., วันเสาร์ 10:00–16:00 น. KST) กรุณาฝากข้อความไว้ เราจะตอบกลับเมื่อกลับมาออนไลน์ หากต้องการคำตอบที่รวดเร็วยิ่งขึ้น กรุณาแจ้งอีเมลของคุณด้วย',
    allOperatorsBusyNotice:
      'เจ้าหน้าที่ของเราไม่อยู่ชั่วครู่ กรุณาฝากข้อความไว้ เราจะตอบกลับในไม่ช้า',
    sessionEnded:
      'บทสนทนานี้จบลงแล้ว หากมีคำถามเพิ่มเติม กรุณาเริ่มแชทใหม่',
  },
  ru: {
    welcome: 'Здравствуйте! Чем мы можем помочь вам сегодня?',
    delayedResponseNotice:
      'Сейчас нерабочее время (будни 10:00–19:00, суббота 10:00–16:00 по корейскому времени). Оставьте сообщение, и мы ответим, как только снова будем онлайн. Укажите свой адрес электронной почты, чтобы получить ответ быстрее.',
    allOperatorsBusyNotice:
      'Наши сотрудники ненадолго отошли. Оставьте сообщение, и мы ответим в ближайшее время.',
    sessionEnded:
      'Этот разговор завершён. Для дальнейших вопросов начните новый чат.',
  },
  fr: {
    welcome: 'Bonjour ! Comment pouvons-nous vous aider aujourd\'hui ?',
    delayedResponseNotice:
      'Nous sommes en dehors des heures d\'ouverture (en semaine 10h00–19h00, samedi 10h00–16h00 KST). Laissez-nous un message, nous répondrons dès notre retour. Indiquez votre adresse e-mail pour une réponse plus rapide.',
    allOperatorsBusyNotice:
      'Notre équipe est momentanément absente. Laissez un message, nous vous répondrons sous peu.',
    sessionEnded:
      'Cette conversation est terminée. Démarrez une nouvelle discussion pour toute autre question.',
  },
  mn: {
    welcome: 'Сайн байна уу! Бид танд яаж туслах вэ?',
    delayedResponseNotice:
      'Бид одоо ажлын цагаас гадуур байна (Даваа–Баасан 10:00–19:00, Бямба 10:00–16:00 KST). Мессеж үлдээгээрэй, бид ажлын цагт хариулна. Илүү хурдан хариу авахын тулд имэйл хаягаа үлдээнэ үү.',
    allOperatorsBusyNotice:
      'Манай ажилтан түр зуур байхгүй байна. Мессеж үлдээвэл бид удахгүй хариулна.',
    sessionEnded:
      'Энэ ярилцлага дууссан. Шинэ асуулт байвал шинээр чат эхлүүлнэ үү.',
  },
  ar: {
    welcome: 'مرحباً! كيف يمكننا مساعدتك اليوم؟',
    delayedResponseNotice:
      'نحن خارج ساعات العمل حالياً (أيام الأسبوع 10:00–19:00، السبت 10:00–16:00 بتوقيت كوريا). اترك رسالتك وسنرد عليك عند عودتنا. يُرجى تضمين بريدك الإلكتروني للحصول على رد أسرع.',
    allOperatorsBusyNotice:
      'فريقنا غير متاح مؤقتاً. اترك رسالة وسنرد عليك قريباً.',
    sessionEnded:
      'انتهت هذه المحادثة. ابدأ محادثة جديدة لأي استفسارات أخرى.',
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
// 채널 라벨(WhatsApp 등)은 브랜드명이라 로케일 무관.
const CONTACT_SAVED_TEMPLATES: Record<VisitorLocale, string> = {
  en: '{channel} contact saved: {handle}. We will message you first once we are back online.',
  ja: '{channel}の連絡先を保存しました：{handle}。営業再開後、こちらから先にご連絡いたします。',
  zh: '已保存您的{channel}联系方式：{handle}。恢复营业后我们会主动联系您。',
  'zh-TW': '已儲存您的{channel}聯絡方式：{handle}。恢復營業後我們會主動聯絡您。',
  vi: 'Đã lưu thông tin {channel} của bạn: {handle}. Chúng tôi sẽ chủ động liên hệ ngay khi làm việc trở lại.',
  th: 'บันทึกข้อมูลติดต่อ {channel} ของคุณแล้ว: {handle} เราจะติดต่อคุณทันทีเมื่อกลับมาทำการ',
  ru: 'Контакт {channel} сохранён: {handle}. Мы сами свяжемся с вами, как только снова будем онлайн.',
  fr: 'Contact {channel} enregistré : {handle}. Nous vous contacterons dès notre retour.',
  mn: '{channel} холбоо барих мэдээлэл хадгалагдлаа: {handle}. Бид ажил эхэлмэгц тантай эхэлж холбогдоно.',
  ar: 'تم حفظ جهة اتصال {channel}: {handle}. سنتواصل معك أولاً فور عودتنا.',
};

export function getContactSavedMessage(
  locale: VisitorLocale,
  channelLabel: string,
  handle: string,
): string {
  const tpl = CONTACT_SAVED_TEMPLATES[locale] ?? CONTACT_SAVED_TEMPLATES.en;
  return tpl.replace('{channel}', channelLabel).replace('{handle}', handle);
}
