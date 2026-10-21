import { describe, it, expect } from 'vitest';
import { EMPTY_BOOKING } from '../booking';
import {
  checkReplyText,
  cleanReply,
  MAX_REPLY_UNITS,
  parseAiOutput,
  retryFeedback,
  sanitizeBookingText,
  textUnits,
  type GuardContext,
} from '../guards';
import { CLINIC_HANDLES, CLINIC_PHONE_DIGITS, getKnowledge } from '../knowledge';
import { ALLOWED_PERCENTS } from '../knowledge/scope';
import { KNOWN_FALSE_POSITIVES, KNOWN_GAPS, MUST_FLAG, MUST_PASS, type CorpusLocale } from './guardsCorpus';

const CTX: GuardContext = {
  rowIds: new Set(['P001', 'P006', 'P045', 'M17', 'M18', 'F01', 'P101', 'P102', 'P103', 'P104']),
  allowedUrls: [
    'https://liv-clinic.net/en/pricing',
    'https://liv-clinic.net/ja/pricing',
    'https://liv-clinic.net/en/events/2026-10-promotion',
    'https://line.me/ti/p/VJYu9BSnsX',
  ],
  allowedPercents: new Set(['5']),
  allowedPhoneDigits: ['8227972773', '027972773', '821068882773', '6591234567'],
  allowedEmails: ['emma@example.com'],
  allowedHandles: ['livps0414', 'sakura_0328'],
};
const check = (reply: string, ctx: GuardContext = CTX) => checkReplyText(reply, ctx);
const codes = (reply: string) => check(reply).map((i) => i.split(':')[0]);

describe('cleanReply', () => {
  it('마크다운 기호와 이모지를 걸러 내고, 줄 머리의 - · * 는 • 로 바꾼다', () => {
    expect(cleanReply('**Hello!** 😊\n\n# Prices\n- one\n* two\n\n\n\nBye `x`  ')).toBe('Hello!\n\nPrices\n• one\n• two\n\nBye x');
  });

  it('꼬리표와 • 줄은 그대로 둔다', () => {
    expect(cleanReply('Here:\n{{P006}}\n• a')).toBe('Here:\n{{P006}}\n• a');
  });

  it('마크다운 링크는 글자와 주소로 푼다 — 대괄호·괄호가 그대로 나가지 않게', () => {
    expect(cleanReply('See the [price list](https://liv-clinic.net/en/pricing).')).toBe(
      'See the price list https://liv-clinic.net/en/pricing.'
    );
  });
});

describe('parseAiOutput — 검사 C-1', () => {
  it('JSON 을 읽어 모양을 맞춘다', () => {
    const out = parseAiOutput(
      JSON.stringify({
        reply: '**Hi** Emma',
        staff_note_ko: ' 요지  입니다 ',
        booking: { date: '2026-10-14', party_size: 2 },
        needs_staff: true,
        staff_reason_ko: '스컬트라 금액 문의',
        identity_question: false,
      })
    );
    expect(out).toEqual({
      reply: 'Hi Emma',
      staffNoteKo: '요지 입니다',
      booking: { ...EMPTY_BOOKING, date: '2026-10-14', partySize: 2 },
      needsStaff: true,
      staffReasonKo: '스컬트라 금액 문의',
      identityQuestion: false,
    });
  });

  it('빠진 항목은 기본값: 요지 빈 글자 · 직원 확인 false · 사유 null · 가예약 빈 값', () => {
    expect(parseAiOutput('{"reply":"ok"}')).toEqual({
      reply: 'ok',
      staffNoteKo: '',
      booking: EMPTY_BOOKING,
      needsStaff: false,
      staffReasonKo: null,
      identityQuestion: false,
    });
  });

  it('JSON 이 아니거나 reply 가 없거나 비면 null', () => {
    expect(parseAiOutput('Sure! Here is the answer')).toBeNull();
    expect(parseAiOutput('[]')).toBeNull();
    expect(parseAiOutput('{"staff_note_ko":"x"}')).toBeNull();
    expect(parseAiOutput('{"reply":"  😊 "}')).toBeNull();
    expect(parseAiOutput('{"reply":123}')).toBeNull();
  });

  it('정체만 물은 글이면 reply 가 비어 있어도 받는다 — 답은 프로그램이 붙인다', () => {
    expect(parseAiOutput('{"reply":"","identity_question":true}')).toMatchObject({ reply: '', identityQuestion: true });
    expect(parseAiOutput('{"reply":"","identity_question":false}')).toBeNull();
  });

  it('요지와 사유는 길이를 자른다', () => {
    const out = parseAiOutput(JSON.stringify({ reply: 'ok', staff_note_ko: '가'.repeat(500), staff_reason_ko: '나'.repeat(200) }))!;
    expect(out.staffNoteKo).toHaveLength(300);
    expect(out.staffReasonKo).toHaveLength(80);
  });
});

describe('checkReplyText — 통과하는 답', () => {
  it('꼬리표만 쓴 가격 답', () => {
    expect(
      check('Here are our prices:\n{{P006}}\n{{M18}}\nBooking through this chat gives you 5% off. What date would you prefer?')
    ).toEqual([]);
  });

  it('샷 수·용량·날짜·시각·주소·병원 전화번호·손님 연락처는 금액이 아니다', () => {
    expect(
      check(
        'Ultherapy Prime 300-400 shots or 600 shots, Rejuran 2cc. We are open 10:00-19:00 on 2026-10-14 (Oct 14). ' +
          'Call +82-2-797-2773 or WhatsApp +82 10-6888-2773. We noted your number +65 9123 4567. ' +
          'Details: https://liv-clinic.net/en/pricing'
      )
    ).toEqual([]);
  });

  it('중국어·일본어 답', () => {
    expect(check('您好！10月4日周日休诊，最近可预约10月6日或7日，营业时间为韩国时间10:00–19:00。请问您希望哪天、几点到院？')).toEqual([]);
    expect(check('10月18日は日曜のため休診です。近い診療日は10月17日（10:00～16:00）と19日です。')).toEqual([]);
  });

  it('흔한 말이 금액 · 금지 표현 · AI 낱말로 잘못 걸리지 않는다', () => {
    for (const ok of [
      "Unfortunately October 15 won't work, as we are closed that day.",
      'We have 2 wonderful options for you.',
      'We are about 50 m from Exit 4 of Sinsa Station.',
      'What date would work best for you?',
      'Perfect, thank you! Which time would you prefer?',
      'Filler is not permanent; it can be dissolved.',
      'We cannot guarantee a specific result; the doctor will explain at the consultation.',
      'The 5% benefit is applied automatically at payment.',
      'We are open on 14.10.2026 and 10-16-2026.',
      'Call +82-2-797-2773 (10:00-19:00).',
      'Your WhatsApp is +65 9123 4567. 2 guests, noted.',
      '1月1日元旦休诊。',
      '您最好提前预约。',
      '詳しくはhttps://liv-clinic.net/ja/pricingをご覧ください。',
      'Để đảm bảo có chỗ, bạn nên đặt lịch sớm.',
      'Nous vous répondrons dans les meilleurs délais.',
      'من الأفضل أن تحجز مسبقاً.',
      'We quote prices in Korean won only.',
      'Мы работаем с 10:00 до 19:00.',
      'البوتوكس متوفر في نفس اليوم.',
    ]) {
      expect(check(ok), ok).toEqual([]);
    }
  });
});

describe('checkReplyText — C-2 금액', () => {
  it('통화 표시가 붙은 숫자', () => {
    expect(codes('It is KRW 500,000.')).toEqual(['money']);
    expect(codes('약 50만 원입니다')).toEqual(['money']);
    expect(codes('价格是 46万韩元')).toEqual(['money']);
    expect(codes('15万円くらいです')).toEqual(['money']);
    expect(codes('about $350 per session')).toEqual(['money']);
    expect(codes('₩1590000 입니다')).toEqual(['money']);
    expect(codes('It costs 2400000 won')).toEqual(['money']);
  });

  it('천 단위 쉼표, 1.8M 꼴, 통화 표시 없는 긴 숫자', () => {
    expect(codes('It is 1,590,000 in total.')).toEqual(['money']);
    expect(codes('Other clinics offer 1.8M.')).toEqual(['money']);
    expect(codes('The fee is 10000.')).toEqual(['money']);
    expect(codes('Итого 1 500 000.')).toEqual(['money']);
    expect(codes('Total 2.400.000')).toEqual(['money']);
  });

  it('걸린 글자를 이유에 남긴다', () => {
    expect(check('It is KRW 500,000.')[0]).toBe('money:KRW 500,000');
  });

  it('손님이 적은 금액을 따라 써도 걸린다 — 전화번호처럼 보여도 봐주지 않는다', () => {
    // 손님: "Another clinic offers 1500000 won. Can you match it?"
    expect(codes('Yes, we can do it for 1500000 won.')).toEqual(['money']);
    expect(codes('Yes, KRW 1500000 is fine.')).toEqual(['money']);
    expect(codes('Да, 1 500 000 вон.')).toEqual(['money']);
    expect(codes('We can match 1500000.')).toEqual(['money']);
  });

  it('전각 숫자 · 아라비아 숫자 · 태국 숫자로 쓴 금액', () => {
    expect(codes('サーマジ600ショットは２４０万ウォンです。')).toEqual(['money']);
    expect(codes('KRW ２４０００００')).toEqual(['money']);
    expect(codes('السعر ٢٤٠٠٠٠٠ وون')).toEqual(['money']);
    expect(codes('ราคา ๒๔๐๐๐๐๐ วอน')).toEqual(['money']);
  });

  it('글자로 쓴 수 · 한자 숫자 · 단위 낱말 · 목록에 없던 통화', () => {
    for (const bad of [
      'It is two million four hundred thousand won.',
      'Around 780 thousand won.',
      'サーマジは二百四十万ウォンです',
      '大约两百四十万韩元',
      'Около 2,4 млн вон',
      'Khoảng 2,4 triệu won',
      'ประมาณ 2.4 ล้านวอน',
      'Environ 2,4 millions de wons',
      'Ойролцоогоор 2.4 сая вон',
      'حوالي 2.4 مليون وون',
      'حوالي 1800 دولار',
      '大约 2300 人民币',
      'Цена 780 000 ₩',
      '이백사십만 원입니다',
      'About 5k per session',
    ]) {
      expect(codes(bad), bad).toContain('money');
    }
  });
});

describe('checkReplyText — C-3 퍼센트', () => {
  it('5% 만 통과한다', () => {
    expect(check('You get 5% off.')).toEqual([]);
    expect(check('可享5％优惠')).toEqual([]);
    expect(check('直接预约可享九五折。')).toEqual([]);
    expect(check('We can offer 20% off for cash.')).toEqual(['percent:20%']);
    expect(check('10 % discount')).toEqual(['percent:10 %']);
  });

  it('소수 · 다른 문자의 퍼센트 기호 · 퍼센트 낱말 · 할인 표현', () => {
    for (const bad of [
      'A 12,5 % discount',
      '7,5% de réduction',
      '5.5% off',
      '２０％オフ',
      '20٪ خصم',
      '20 percent off',
      '百分之二十的优惠',
      '可以打八折',
      '2割引きです',
      'Giảm 20 phần trăm',
      'Скидка 20 процентов',
      '20 хувийн хөнгөлөлт',
    ]) {
      expect(codes(bad), bad).toContain('percent');
    }
  });
});

describe('checkReplyText — C-4 꼬리표', () => {
  it('없는 꼬리표, 일곱 개 이상, 깨진 꼴', () => {
    expect(check('Price:\n{{P999}}')).toEqual(['tag_unknown:P999']);
    expect(
      check('{{P001}}\n{{P006}}\n{{P045}}\n{{P101}}\n{{P102}}\n{{P103}}\n{{P104}}')
    ).toEqual(['tag_too_many:7']);
    expect(check('Price: {{P006}')).toEqual(['tag_broken']);
    expect(check('Price: {{ulthera}}')).toEqual(['tag_broken']);
  });

  it('같은 꼬리표를 두 번 써도 한 개로 센다', () => {
    expect(check('{{P001}}\n{{P001}}\n{{P006}}\n{{P045}}\n{{P101}}\n{{P102}}\n{{P103}}')).toEqual([]);
  });

  it('꼬리표 비슷한 것이 손님에게 그대로 나가지 않게 한다', () => {
    expect(codes('Price:\n{P006}')).toEqual(['tag_broken']);
    expect(codes('Price: P006')).toEqual(['tag_broken']);
    expect(codes('Price:\n[[P006]]')).toEqual(['tag_broken']);
    expect(codes('Price:\n｛｛P006｝｝')).toEqual(['tag_broken']);
  });

  it('꼬리표는 제 줄에 따로 있어야 한다 — 문장 안에 섞으면 금액 줄을 넣을 자리가 없다', () => {
    expect(check('Thermage costs {{P006}}.')).toEqual(['tag_inline']);
    expect(check('• {{P006}}\n1. {{M18}}\n- {{F01}}\n・{{P001}}')).toEqual([]);
  });

  it('이력에 넣는 표시([price line shown: …] 등)를 따라 쓰면 걸린다', () => {
    expect(codes('Here are the prices:\n[price line shown: 써마지 레이저 · 600샷]')).toEqual(['marker']);
    expect(codes('It is [amount].')).toEqual(['marker']);
    expect(codes('[our staff] We will call you.')).toEqual(['marker']);
  });
});

describe('checkReplyText — C-5 금지 표현', () => {
  it('영어', () => {
    expect(codes('This is the best treatment.')).toEqual(['banned']);
    expect(codes('We are the number 1 clinic in Seoul.')).toEqual(['banned']);
    expect(codes('Results are guaranteed.')).toEqual(['banned']);
    expect(codes('It is permanent.')).toEqual(['banned']);
    expect(codes('There are no side effects.')).toEqual(['banned']);
    expect(check('100% safe')).toEqual(['percent:100%', 'banned:100%']);
  });

  it('일본어·중국어·그 밖의 언어', () => {
    for (const bad of [
      '効果は永久に続きます',
      '副作用はありません',
      '我们保证效果',
      '无副作用',
      '没有任何副作用',
      '我们是最好的医院',
      'Kết quả được đảm bảo',
      'Cam kết hiệu quả',
      'การันตีผลลัพธ์',
      'Résultat garanti',
      'Il n’y a aucun effet secondaire',
      'Мы гарантируем результат',
      'Побочных эффектов нет',
      'نحن أفضل عيادة',
    ]) {
      expect(codes(bad), bad).toEqual(['banned']);
    }
  });

  it('정직한 부정문은 통과한다 — "영구적인가요 · 보장하나요"에 "아니다"라고 답할 수 있어야 한다', () => {
    for (const fine of [
      'Botox results are not permanent; they generally last 3–6 months. We cannot guarantee an individual result.',
      'The result does not last forever.',
      'Kết quả botox không vĩnh viễn. Chúng tôi không thể cam kết hiệu quả cho từng người.',
      'Hiệu quả không kéo dài vĩnh viễn.',
      'ผลลัพธ์ไม่ได้อยู่ถาวร เราไม่สามารถรับประกันผลลัพธ์ได้',
      'Нет, эффект ботокса не постоянный. Гарантировать результат мы не можем.',
      'L’effet du Botox n’est pas permanent. Le résultat ne peut pas être garanti.',
      'Ботоксын үр дүн байнгын биш. Үр дүнг баталгаажуулах боломжгүй.',
      'نتيجة البوتوكس ليست دائمة. لا يمكننا ضمان نتيجة محددة.',
      '热玛吉的效果不是永久的。我们不能保证效果。',
      'ウルセラの効果は永久ではなく、永久に続くわけではありません。効果を保証することはできません。',
      '효과가 영구적인 것은 아닙니다. 효과를 보장해 드릴 수는 없습니다.',
    ]) {
      expect(check(fine), fine).toEqual([]);
    }
  });

  it('부정문처럼 보여도 주장이면 걸린다 — 부정문을 지우는 식이 주장까지 지우지 않는다', () => {
    for (const bad of [
      'The effect does not fade — it lasts permanently.',
      'Don’t worry, it stays forever.',
      'Không cần lo, hiệu quả vĩnh viễn.',
      'ไม่ต้องกังวล ผลลัพธ์ถาวร',
      'Эффект не временный, а постоянный.',
      '永久に続くので心配することはありません。',
      '不是暂时的，而是永久的。',
      'Санаа зоволтгүй, үр дүн байнгын.',
      'Бид үр дүнг баталгаажуулна.',
      'لا تقلق، النتيجة دائمة.',
    ]) {
      expect(codes(bad), bad).toEqual(['banned']);
    }
    // "баталгаажуулна" 는 "확인해 드립니다"로도 쓴다 — 결과를 보장한다는 꼴만 막는다
    expect(check('Таны захиалгыг манай ажилтан баталгаажуулна.')).toEqual([]);
  });

  it('할인·프로모션 낱말은 막지 않는다', () => {
    expect(check('本月优惠如下，直接预约可享5%折扣。')).toEqual([]);
    expect(check("This month's promotion includes a discount package.")).toEqual([]);
  });
});

describe('checkReplyText — C-6 AI·봇', () => {
  it('AI·봇·자동 응대를 스스로 말하면 걸린다', () => {
    for (const bad of [
      'As an AI assistant, I can help.',
      'I am a chatbot.',
      'An automated assistant answers first.',
      'I am a large language model.',
      '我是人工智能助手',
      '我是智能助手',
      '自動応答です',
      '自動返信です',
      'Je suis une IA.',
      'Я бот.',
      'أنا الذكاء الاصطناعي',
    ]) {
      expect(codes(bad), bad).toEqual(['ai_word']);
    }
  });

  it('사람이라고 말해도 걸린다 — 정체에 대한 답은 프로그램이 붙인다', () => {
    expect(codes("Yes, I'm a real person.")).toEqual(['ai_word']);
    expect(codes('我是真人客服。')).toEqual(['ai_word']);
  });

  it('비슷하게 생긴 보통 말은 걸리지 않는다', () => {
    expect(check('The fee is automatically deducted on the day. We serve Thai visitors too.')).toEqual([]);
    expect(check('ボトックスは当日可能です')).toEqual([]);
    expect(check('Les frais sont automatiquement déduits.')).toEqual([]);
  });
});

describe('checkReplyText — C-7 주소 · C-8 전화번호', () => {
  it('자료에 없는 주소는 걸린다', () => {
    expect(check('Book here: https://liv-clinic.net/en/booking')).toEqual(['url:https://liv-clinic.net/en/booking']);
    expect(check('See www.example.com')).toEqual(['url:www.example.com']);
    expect(check('Book at liv-clinic.net/en/booking')).toEqual(['url:liv-clinic.net/en/booking']);
    expect(check('LINE: https://line.me/ti/p/VJYu9BSnsX.')).toEqual([]); // 끝의 마침표는 주소가 아니다
    expect(check('Promotion page: https://liv-clinic.net/en/events/2026-10-promotion')).toEqual([]);
  });

  it('메일 주소는 손님의 것만', () => {
    expect(check('We will write to emma@example.com.')).toEqual([]);
    expect(check('Please write to booking@liv-clinic.net.')).toEqual(['url:booking@liv-clinic.net']);
  });

  it('병원 번호·손님 번호가 아닌 전화번호는 걸린다', () => {
    expect(check('Call us at +82 2 555 1234.')).toEqual(['number:+82 2 555 1234']);
    expect(check('Call 02-797-2773.')).toEqual([]);
    expect(check('Your WhatsApp 9123 4567 is noted.')).toEqual([]); // 손님 번호의 뒷부분
    expect(codes('Call 010‑1234‑5678.')).toEqual(['number']); // U+2011 줄표
    expect(codes('Call ０１０-１２３４-５６７８.')).toEqual(['number']); // 전각 숫자
  });

  it('날짜 꼴(2026.10.14 · 2026/10/14)은 전화번호가 아니다', () => {
    expect(check('2026.10.14 또는 2026/10/16 중에서 골라 주세요')).toEqual([]);
  });
});

describe('checkReplyText — 메신저 아이디', () => {
  it('병원 아이디와 손님이 연락처로 남긴 아이디만 된다', () => {
    expect(check('Our WeChat ID is livps0414.')).toEqual([]);
    expect(check('We noted your LINE ID sakura_0328.')).toEqual([]);
    expect(check('Our WeChat ID is livps0415.')).toEqual(['handle:livps0415']);
    expect(check('Message our partner on Telegram @evil_agent.')).toEqual(['handle:evil_agent']);
    expect(check('微信号 evilagent88')).toEqual(['handle:evilagent88']);
  });

  it('"ID card" 같은 보통 말은 아이디가 아니다', () => {
    expect(check('Please bring your passport or ID card.')).toEqual([]);
    expect(check('What’s your WhatsApp number, WeChat ID, LINE ID, or email?')).toEqual([]);
  });

  it('띄어 쓴 메일 주소도 본다', () => {
    expect(codes('Write to agent @ evil-clinic.de')).toEqual(['url']);
    expect(check('We will write to emma @ example.com.')).toEqual([]);
  });
});

describe('checkReplyText — 검사가 아는 언어로 썼는가', () => {
  it('스페인어 · 독일어 · 힌디어로 쓴 답은 다시 쓰게 한다 (그 언어의 금지 표현은 목록에 없다)', () => {
    expect(check('El tratamiento es seguro y puede reservar una cita.')).toEqual(['language:es']);
    expect(check('Wir können Ihnen bitte einen Termin anbieten.')).toEqual(['language:de']);
    expect(check('इलाज सुरक्षित है।')).toEqual(['language:script']);
  });

  it('아는 언어의 답 · 사람 이름 · 그리스 글자(α)는 걸리지 않는다', () => {
    expect(check('We noted your contact. Dan and Ms. Yang are both on the booking.')).toEqual([]);
    expect(check('Density α and Ultherapy Prime are both available.')).toEqual([]);
    expect(check('Nous sommes ouverts de 10 h à 19 h, et la consultation dure 30 mn.')).toEqual([]);
  });
});

describe('checkReplyText — 날짜 · 시각을 전화번호로, 전화번호를 날짜로 읽지 않는다', () => {
  it('"+82-10-…" 의 앞부분을 날짜로 읽어 전화번호 검사를 건너뛰지 않는다', () => {
    expect(codes('You can also WhatsApp us at +82-10-6888-2733.')).toEqual(['number']);
    expect(codes('Call our agent at +44-20-7946-0958.')).toEqual(['number']);
  });

  it('점으로 쓴 시각 · 날짜의 범위는 전화번호가 아니다', () => {
    expect(check('เปิดทำการ 10.00–19.00 น.')).toEqual([]);
    expect(check('Вы будете в Сеуле 14.10–17.10, верно?')).toEqual([]);
    expect(check('The 2025-2026 holiday schedule is not registered yet.')).toEqual([]);
  });

  it('주소 바로 뒤에 전각 괄호 · 쉼표가 붙어도 주소는 거기서 끝난다', () => {
    expect(check('詳しくは https://liv-clinic.net/ja/pricing（料金ページ）をご覧ください。')).toEqual([]);
    expect(check('詳しくは https://liv-clinic.net/ja/pricing、または LINE でご確認ください。')).toEqual([]);
  });

  it('대문자로 쓴 주소 · 다른 꼴의 주소(line://)도 자료에 없으면 걸린다', () => {
    expect(codes('Https://liv-clinic.net/en/booking is where you can book.')).toEqual(['url']);
    expect(codes('Book here: line://ti/p/@evilagent')).toContain('url');
    expect(codes('Add us on LINE: lin.ee/AbCdEf1')).toEqual(['url']);
  });
});

describe('회귀 말뭉치 — 2026-10-02 독립 검토에서 나온 글', () => {
  const NOW = new Date('2026-10-02T07:20:00Z');
  const real = (locale: CorpusLocale): GuardContext => {
    const k = getKnowledge(locale, NOW);
    return {
      rowIds: new Set(k.rowById.keys()),
      allowedUrls: k.allowedUrls,
      allowedPercents: ALLOWED_PERCENTS,
      allowedPhoneDigits: CLINIC_PHONE_DIGITS,
      allowedEmails: [],
      allowedHandles: CLINIC_HANDLES,
    };
  };
  const run = (reply: string, locale: CorpusLocale = 'en') => checkReplyText(cleanReply(reply), real(locale));

  it(`걸려야 하는 글 ${MUST_FLAG.length}개가 모두 걸린다 (그때의 검사를 빠져나가던 글 + 금지 표현의 주장)`, () => {
    const passed = MUST_FLAG.filter(([, s]) => run(s).length === 0).map(([category, s]) => `${category}: ${s}`);
    expect(passed).toEqual([]);
  });

  it('보통의 답은 걸리지 않는다 (10개 언어 + 한국어)', () => {
    const flagged = MUST_PASS.flatMap(([locale, list]) => list.map((s) => [s, run(s, locale)] as const))
      .filter(([, issues]) => issues.length > 0)
      .map(([s, issues]) => `${s} → ${issues.join(' | ')}`);
    expect(flagged).toEqual([]);
    expect(MUST_PASS.reduce((n, [, list]) => n + list.length, 0)).toBeGreaterThan(400);
  });

  it('알고 있는 한계 — 식으로는 잡지 못한다. 잡게 되면 MUST_FLAG 로 옮긴다', () => {
    for (const s of KNOWN_GAPS) expect(run(s), s).toEqual([]);
  });

  it('알고 있는 잘못 걸림 — 드물어서 받아들였다. 고쳐지면 MUST_PASS 로 옮긴다', () => {
    for (const s of KNOWN_FALSE_POSITIVES) expect(run(s).length, s).toBeGreaterThan(0);
  });
});

describe('checkReplyText — C-9 길이', () => {
  it('넓은 글자는 두 칸으로 센다', () => {
    expect(textUnits('abc')).toBe(3);
    expect(textUnits('가나다')).toBe(6);
    expect(textUnits('日本語ab')).toBe(8);
  });

  it('한도를 넘으면 too_long, 꼬리표는 세지 않는다', () => {
    expect(check('a'.repeat(MAX_REPLY_UNITS))).toEqual([]);
    expect(check('a'.repeat(MAX_REPLY_UNITS + 1))).toEqual([`too_long:${MAX_REPLY_UNITS + 1}`]);
    expect(check(`${'a'.repeat(MAX_REPLY_UNITS - 10)}\n{{P006}}\n{{M18}}`)).toEqual([]);
    expect(check('가'.repeat(451))).toEqual(['too_long:902']);
  });
});

describe('sanitizeBookingText — 가예약 요약에 그대로 찍히는 칸', () => {
  const booking = { ...EMPTY_BOOKING, date: '2026-10-14', time: '14:00' };

  it('시술 · 이름 · 시간 메모에 금액 · 금지 표현 · 꼬리표가 들어 있으면 그 칸을 비운다', () => {
    const out = sanitizeBookingText(
      {
        ...booking,
        treatment: 'Thermage 600 shots - KRW 1,500,000 (best price, guaranteed, 30% off)',
        treatmentKo: '써마지 600샷',
        name: 'Emma {{P006}}',
        timeNote: 'afternoon, 20% off please',
      },
      CTX
    );
    expect(out.booking).toMatchObject({ treatment: null, name: null, timeNote: null, date: '2026-10-14', time: '14:00' });
    expect(out.booking.treatmentKo).toBe('써마지 600샷'); // 직원만 보는 칸은 그대로 둔다
    expect(out.dropped).toEqual(['treatment', 'name', 'timeNote']);
  });

  it('시각 칸도 본다 — 읽지 못한 시각은 시간 메모가 되어 요약에 찍힌다', () => {
    for (const bad of ['14:00 (20% off)', 'KRW 1,500,000 total', '{{P005}} half price', '2pm, about 2.4m', 'call +82 10 1234 5678']) {
      const out = sanitizeBookingText({ ...EMPTY_BOOKING, date: '2026-10-14', time: bad }, CTX);
      expect(out.booking.time, bad).toBeNull();
      expect(out.dropped, bad).toEqual(['time']);
    }
    for (const ok of ['14:00', '2pm', '2:30 PM', '21:00 KST', 'around 3pm', '14:00-16:00', 'afternoon', '午後2時', '14.00 น.']) {
      expect(sanitizeBookingText({ ...EMPTY_BOOKING, time: ok }, CTX).dropped, ok).toEqual([]);
    }
  });

  it('멀쩡한 값은 그대로 둔다', () => {
    const fine = { ...booking, treatment: 'Ultherapy Prime 300 shots', name: 'Emma', timeNote: 'afternoon' };
    expect(sanitizeBookingText(fine, CTX)).toEqual({ booking: fine, dropped: [] });
  });
});

describe('retryFeedback', () => {
  it('걸린 이유마다 고칠 말을 한 줄씩 만든다', () => {
    const text = retryFeedback([
      'money:KRW 5',
      'tag_unknown:P999',
      'booking_closed_day:2026-10-15',
      'json',
      'tag_inline',
      'marker:[amount]',
      'handle:evil_agent',
      'language:es',
    ]);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Your previous draft was rejected. Rewrite it and fix every point below.');
    expect(lines).toHaveLength(9);
    expect(lines[7]).toContain('messenger ID "evil_agent"');
    expect(lines[8]).toContain('VISITOR LANGUAGE');
    expect(lines[1]).toContain('"KRW 5"');
    expect(lines[2]).toContain('{{P999}}');
    expect(lines[3]).toContain('2026-10-15 is a closed day');
    expect(lines[4]).toContain('valid JSON');
    expect(lines[5]).toContain('on its own line');
    expect(lines[6]).toContain('square brackets');
  });

  it('모르는 이유도 버리지 않는다', () => {
    expect(retryFeedback(['weird:thing'])).toContain('Fix this problem: weird:thing');
  });

  it('보기로 드는 꼬리표는 실제로 없는 것이다 — 모델이 보기를 그대로 베껴도 엉뚱한 금액이 나가지 않게', () => {
    expect(retryFeedback(['money:x', 'tag_broken'])).not.toMatch(/\{\{P0[0-9][1-9]\}\}/);
  });
});
