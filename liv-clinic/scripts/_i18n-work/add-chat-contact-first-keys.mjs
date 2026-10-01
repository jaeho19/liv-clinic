/**
 * chat 네임스페이스에 "연락처 먼저" 카드 문구 10개를 11개 로케일에 넣는다
 * (docs/superpowers/specs/2026-10-01-chat-contact-first-design.md §7, 부록 A.4).
 *
 * 메시지 JSON은 줄바꿈이 섞여 있고(\r\r\n · \r\n · \n) 줄 중간에 고립된 \r 도 있어
 * 다시 직렬화하거나 정규식으로 줄을 나누면 바이트가 바뀐다. \n 만 경계로 줄을 나누고,
 * 편집 전에 라운드트립(나눈 것을 그대로 이으면 원본과 같은가)을 확인한 뒤
 * 기존 chat 키 줄(captureContactPlaceholderLine) 바로 뒤에 새 줄만 끼워 넣는다.
 *
 * 실행 (liv-clinic 폴더에서):
 *   node scripts/_i18n-work/add-chat-contact-first-keys.mjs           # 미리보기 (파일을 바꾸지 않는다)
 *   node scripts/_i18n-work/add-chat-contact-first-keys.mjs --write   # 기록
 * 이미 들어 있는 파일은 건너뛴다(다시 돌려도 안전하다).
 *
 * ko·ja·zh·zh-TW 의 여덟 문구는 원장님이 미리보기에서 확인한 것(부록 A.4) 그대로다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../../src/messages/', import.meta.url));
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const WRITE = process.argv.includes('--write');

/** 이 줄 바로 뒤에 넣는다 — chat 네임스페이스 안에 있고 11개 파일 모두 한 번씩만 나온다. */
const ANCHOR_KEY = 'captureContactPlaceholderLine';

const KEYS = [
  'captureBusyLead',
  'captureChannelsLead',
  'captureContactPlaceholderEmail',
  'captureMessengerFallback',
  'capturePrivacyNote',
  'captureWechatLead',
  'captureWechatIdLabel',
  'captureEmailLead',
  'captureCopy',
  'captureCopied',
];
/** {code} 변수가 꼭 들어 있어야 하는 키 */
const KEYS_WITH_CODE = ['captureMessengerFallback', 'captureWechatLead', 'captureEmailLead'];

const T = {
  ko: {
    captureBusyLead: '여기서 기다리지 않으셔도 됩니다. 연락처를 남겨 주시면 저희가 먼저 연락드립니다.',
    captureChannelsLead: '편한 방법으로 바로 연락하실 수 있습니다:',
    captureContactPlaceholderEmail: '이메일 주소',
    captureMessengerFallback: '그곳에서 코드 {code}를 보내 주세요. 열리지 않으면 아래에 연락처를 남겨 주세요.',
    capturePrivacyNote: '연락처는 이 문의에 답변드리는 데에만 사용합니다.',
    captureWechatLead: 'WeChat에서 이 QR을 스캔하거나 아이디를 복사해 검색해서 추가한 뒤, 코드 {code}를 보내 주세요.',
    captureWechatIdLabel: 'WeChat 아이디',
    captureEmailLead: '이 주소로 메일을 보내실 때 코드 {code}를 함께 적어 주세요.',
    captureCopy: '복사',
    captureCopied: '복사됨 ✓',
  },
  en: {
    captureBusyLead: "You don't have to wait here. Leave a contact and we'll reach out to you first.",
    captureChannelsLead: 'Reach us wherever is easiest for you:',
    captureContactPlaceholderEmail: 'Email address',
    captureMessengerFallback: "Send us the code {code} there. If it doesn't open, leave your contact below.",
    capturePrivacyNote: 'We use your contact only to reply to this inquiry.',
    captureWechatLead: 'Scan this QR code in WeChat, or copy our ID and search for it, to add us. Then send us the code {code}.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Email us at this address and include the code {code}.',
    captureCopy: 'Copy',
    captureCopied: 'Copied ✓',
  },
  ja: {
    captureBusyLead: 'こちらでお待ちいただく必要はありません。連絡先を残していただければ、こちらから先にご連絡します。',
    captureChannelsLead: 'ご都合のよい方法で直接ご連絡いただけます：',
    captureContactPlaceholderEmail: 'メールアドレス',
    captureMessengerFallback: 'そちらでコード {code} をお送りください。開かない場合は、下に連絡先をお残しください。',
    capturePrivacyNote: 'ご連絡先は、このお問い合わせへのご返信にのみ使用します。',
    captureWechatLead: 'WeChatでこのQRコードを読み取るか、IDをコピーして検索し、追加してください。その後、コード {code} をお送りください。',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'こちらのアドレスにメールをお送りください。コード {code} もあわせてご記入ください。',
    captureCopy: 'コピー',
    captureCopied: 'コピーしました ✓',
  },
  zh: {
    captureBusyLead: '您不必在这里等候。留下联系方式，我们会主动联系您。',
    captureChannelsLead: '您可以通过方便的方式直接联系我们：',
    captureContactPlaceholderEmail: '邮箱地址',
    captureMessengerFallback: '请在那里发送代码 {code}。如果无法打开，请在下方留下联系方式。',
    capturePrivacyNote: '您的联系方式仅用于回复本次咨询。',
    captureWechatLead: '请使用微信扫描二维码，或复制微信号搜索添加我们，然后发送代码 {code}。',
    captureWechatIdLabel: '微信号',
    captureEmailLead: '请发送邮件至此地址，并注明代码 {code}。',
    captureCopy: '复制',
    captureCopied: '已复制 ✓',
  },
  'zh-TW': {
    captureBusyLead: '您不必在這裡等候。留下聯絡方式，我們會主動聯絡您。',
    captureChannelsLead: '您可以透過方便的方式直接聯絡我們：',
    captureContactPlaceholderEmail: '電子郵件地址',
    captureMessengerFallback: '請在那裡傳送代碼 {code}。如果無法開啟，請在下方留下聯絡方式。',
    capturePrivacyNote: '您的聯絡方式僅用於回覆本次諮詢。',
    captureWechatLead: '請使用微信掃描 QR Code，或複製微信號搜尋加入我們，然後傳送代碼 {code}。',
    captureWechatIdLabel: '微信號',
    captureEmailLead: '請寄信至此地址，並註明代碼 {code}。',
    captureCopy: '複製',
    captureCopied: '已複製 ✓',
  },
  vi: {
    captureBusyLead: 'Bạn không cần chờ ở đây. Hãy để lại thông tin liên hệ, chúng tôi sẽ chủ động liên hệ với bạn.',
    captureChannelsLead: 'Liên hệ với chúng tôi qua kênh thuận tiện nhất cho bạn:',
    captureContactPlaceholderEmail: 'Địa chỉ email',
    captureMessengerFallback: 'Hãy gửi cho chúng tôi mã {code} tại đó. Nếu không mở được, hãy để lại thông tin liên hệ bên dưới.',
    capturePrivacyNote: 'Chúng tôi chỉ dùng thông tin liên hệ của bạn để trả lời yêu cầu này.',
    captureWechatLead: 'Quét mã QR này trong WeChat, hoặc sao chép ID của chúng tôi rồi tìm kiếm để kết bạn. Sau đó gửi cho chúng tôi mã {code}.',
    captureWechatIdLabel: 'ID WeChat',
    captureEmailLead: 'Gửi email cho chúng tôi theo địa chỉ này và ghi kèm mã {code}.',
    captureCopy: 'Sao chép',
    captureCopied: 'Đã sao chép ✓',
  },
  th: {
    captureBusyLead: 'ไม่จำเป็นต้องรอที่นี่ ฝากช่องทางติดต่อไว้ แล้วเราจะติดต่อกลับไปก่อนค่ะ',
    captureChannelsLead: 'ติดต่อเราได้ทางช่องทางที่คุณสะดวก:',
    captureContactPlaceholderEmail: 'อีเมล',
    captureMessengerFallback: 'กรุณาส่งรหัส {code} ให้เราทางนั้น หากเปิดไม่ได้ กรุณาฝากช่องทางติดต่อไว้ด้านล่าง',
    capturePrivacyNote: 'เราใช้ข้อมูลติดต่อของคุณเพื่อตอบกลับการสอบถามนี้เท่านั้น',
    captureWechatLead: 'สแกน QR โค้ดนี้ใน WeChat หรือคัดลอก ID ของเราไปค้นหาเพื่อเพิ่มเพื่อน จากนั้นส่งรหัส {code} ให้เรา',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'ส่งอีเมลมาที่อยู่นี้ และระบุรหัส {code}',
    captureCopy: 'คัดลอก',
    captureCopied: 'คัดลอกแล้ว ✓',
  },
  ru: {
    captureBusyLead: 'Вам не обязательно ждать здесь. Оставьте контакт, и мы сами свяжемся с вами.',
    captureChannelsLead: 'Свяжитесь с нами удобным для вас способом:',
    captureContactPlaceholderEmail: 'Адрес электронной почты',
    captureMessengerFallback: 'Отправьте нам там код {code}. Если не открывается, оставьте контакт ниже.',
    capturePrivacyNote: 'Мы используем ваш контакт только для ответа на этот запрос.',
    captureWechatLead: 'Отсканируйте этот QR-код в WeChat или скопируйте наш ID и найдите его, чтобы добавить нас. Затем отправьте нам код {code}.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Напишите нам на этот адрес и укажите код {code}.',
    captureCopy: 'Копировать',
    captureCopied: 'Скопировано ✓',
  },
  fr: {
    captureBusyLead: "Vous n'avez pas besoin d'attendre ici. Laissez un contact et nous vous recontacterons en premier.",
    captureChannelsLead: 'Contactez-nous par le moyen qui vous convient le mieux :',
    captureContactPlaceholderEmail: 'Adresse e-mail',
    captureMessengerFallback: "Envoyez-nous le code {code} là-bas. Si cela ne s'ouvre pas, laissez votre contact ci-dessous.",
    capturePrivacyNote: 'Nous utilisons votre contact uniquement pour répondre à cette demande.',
    captureWechatLead: 'Scannez ce QR code dans WeChat, ou copiez notre identifiant et recherchez-le pour nous ajouter. Envoyez-nous ensuite le code {code}.',
    captureWechatIdLabel: 'ID WeChat',
    captureEmailLead: 'Écrivez-nous à cette adresse en indiquant le code {code}.',
    captureCopy: 'Copier',
    captureCopied: 'Copié ✓',
  },
  mn: {
    captureBusyLead: 'Та энд хүлээх шаардлагагүй. Холбоо барих хаягаа үлдээвэл бид эхэлж тантай холбогдоно.',
    captureChannelsLead: 'Өөрт тохиромжтой сувгаар бидэнтэй холбогдоорой:',
    captureContactPlaceholderEmail: 'Имэйл хаяг',
    captureMessengerFallback: 'Тэнд бидэнд {code} кодыг илгээнэ үү. Нээгдэхгүй бол доор холбоо барих хаягаа үлдээнэ үү.',
    capturePrivacyNote: 'Таны холбоо барих мэдээллийг зөвхөн энэ лавлагаанд хариулахад ашиглана.',
    captureWechatLead: 'WeChat-аар энэ QR кодыг уншуулах эсвэл манай ID-г хуулж хайгаад биднийг нэмнэ үү. Дараа нь {code} кодыг илгээнэ үү.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Энэ хаягаар имэйл илгээхдээ {code} кодыг хамт бичнэ үү.',
    captureCopy: 'Хуулах',
    captureCopied: 'Хуулагдлаа ✓',
  },
  ar: {
    captureBusyLead: 'لا داعي للانتظار هنا. اترك وسيلة تواصل وسنتواصل معك نحن أولاً.',
    captureChannelsLead: 'تواصل معنا بالطريقة الأسهل لك:',
    captureContactPlaceholderEmail: 'عنوان البريد الإلكتروني',
    captureMessengerFallback: 'أرسل لنا الرمز {code} هناك. إذا لم يُفتح، اترك وسيلة تواصلك أدناه.',
    capturePrivacyNote: 'نستخدم وسيلة تواصلك للرد على هذا الاستفسار فقط.',
    captureWechatLead: 'امسح رمز QR هذا في WeChat، أو انسخ معرّفنا وابحث عنه لإضافتنا. ثم أرسل لنا الرمز {code}.',
    captureWechatIdLabel: 'معرّف WeChat',
    captureEmailLead: 'راسلنا على هذا العنوان واذكر الرمز {code}.',
    captureCopy: 'نسخ',
    captureCopied: 'تم النسخ ✓',
  },
};

/** \n 만 경계로 줄을 나눈다 — 각 조각은 자기 줄바꿈 바이트를 그대로 갖는다. */
function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') {
      out.push(raw.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}
const eolOf = (line) => (line.match(/\r*\n$/) || ['\n'])[0];
const indentOf = (line) => (line.match(/^[ \t]*/) || [''])[0];

// 문구 표 자체를 먼저 점검한다 — 한 언어라도 키가 빠지면 아무 파일도 건드리지 않는다.
for (const locale of LOCALES) {
  const t = T[locale];
  if (!t) throw new Error(`${locale}: 문구가 없습니다`);
  for (const key of KEYS) {
    if (typeof t[key] !== 'string' || t[key].trim() === '') throw new Error(`${locale}.${key}: 비어 있습니다`);
  }
  if (Object.keys(t).length !== KEYS.length) throw new Error(`${locale}: 키 개수가 ${KEYS.length}개가 아닙니다`);
  for (const key of KEYS_WITH_CODE) {
    if (!t[key].includes('{code}')) throw new Error(`${locale}.${key}: {code} 가 없습니다`);
  }
}

let failed = 0;
for (const locale of LOCALES) {
  const file = `${DIR}${locale}.json`;
  const raw = readFileSync(file, 'utf8');
  const lines = splitLines(raw);
  if (lines.join('') !== raw) {
    console.log(`!! ${locale}: 라운드트립 실패 — 건드리지 않음`);
    failed++;
    continue;
  }
  const before = JSON.parse(raw);
  if (before.chat?.[KEYS[0]] !== undefined) {
    console.log(`-- ${locale}: 이미 있음, 건너뜀`);
    continue;
  }

  const anchors = lines
    .map((line, index) => (line.trimStart().startsWith(`"${ANCHOR_KEY}":`) ? index : -1))
    .filter((index) => index >= 0);
  if (anchors.length !== 1 || before.chat?.[ANCHOR_KEY] === undefined) {
    console.log(`!! ${locale}: 앵커 줄을 찾지 못함 (${anchors.length}개)`);
    failed++;
    continue;
  }
  const anchor = anchors[0];
  if (!lines[anchor].replace(/\r*\n$/, '').endsWith(',')) {
    console.log(`!! ${locale}: 앵커 줄이 쉼표로 끝나지 않음`);
    failed++;
    continue;
  }

  const eol = eolOf(lines[anchor]);
  const indent = indentOf(lines[anchor]);
  const block = KEYS.map((key) => `${indent}${JSON.stringify(key)}: ${JSON.stringify(T[locale][key])},${eol}`);
  lines.splice(anchor + 1, 0, ...block);
  const out = lines.join('');

  let after;
  try {
    after = JSON.parse(out);
  } catch (err) {
    console.log(`!! ${locale}: JSON 깨짐 ${err.message}`);
    failed++;
    continue;
  }
  const valuesOk = KEYS.every((key) => after.chat[key] === T[locale][key]);
  const othersOk = Object.keys(before.chat).every((key) => after.chat[key] === before.chat[key]);
  const sizeOk = out.length === raw.length + block.join('').length;
  if (!valuesOk || !othersOk || !sizeOk) {
    console.log(`!! ${locale}: 삽입 결과 검증 실패`);
    failed++;
    continue;
  }

  console.log(`${WRITE ? '기록' : '미리보기'} ${locale} (+${block.length}줄, chat 키 ${Object.keys(after.chat).length}개)`);
  if (WRITE) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
if (failed) process.exitCode = 1;
