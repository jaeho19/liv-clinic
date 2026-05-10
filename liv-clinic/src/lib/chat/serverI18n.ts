import 'server-only';

export type VisitorLocale = 'en' | 'ja' | 'zh';
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
