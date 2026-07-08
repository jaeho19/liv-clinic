import 'server-only';

// 방문자 채팅 지원 로케일(SSOT) — 세션 생성 검증·번역·시스템 메시지가 모두 이 목록을 따른다.
export const VISITOR_LOCALES = ['en', 'ja', 'zh', 'fr', 'mn', 'ar'] as const;
export type VisitorLocale = (typeof VISITOR_LOCALES)[number];
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
