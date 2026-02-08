/**
 * Solapi (구 CoolSMS) SDK 래퍼
 * 카카오 알림톡 + SMS 폴백 발송
 */

interface SendResult {
  success: boolean;
  messageId?: string;
  channel: 'kakao' | 'sms';
  fallbackUsed: boolean;
  error?: string;
}

interface SendNotificationParams {
  to: string;
  templateId?: string;
  variables?: Record<string, string>;
  smsMessage: string;
}

/**
 * 카카오 알림톡 발송 (실패 시 SMS 폴백)
 *
 * Solapi SDK가 설치되지 않은 경우 SMS만 시도합니다.
 * 환경변수가 없는 경우 시뮬레이션 모드로 동작합니다.
 */
export async function sendNotification(params: SendNotificationParams): Promise<SendResult> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;
  const pfId = process.env.KAKAO_PFID;

  // 환경변수 미설정 시 시뮬레이션 모드
  if (!apiKey || !apiSecret || !senderNumber) {
    console.log('[Solapi] 시뮬레이션 모드 - 환경변수 미설정');
    console.log(`[Solapi] to: ${params.to}, message: ${params.smsMessage.slice(0, 50)}...`);
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
      channel: 'kakao',
      fallbackUsed: false,
    };
  }

  try {
    // Solapi REST API 호출 (SDK 대신 fetch 사용 - 의존성 최소화)
    const timestamp = Date.now().toString();
    const { createHmac, randomBytes } = await import('crypto');
    const salt = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', apiSecret)
      .update(timestamp + salt)
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
    };

    // 카카오 알림톡 시도 (pfId가 있는 경우만)
    if (pfId && params.templateId) {
      try {
        const kakaoBody = {
          message: {
            to: params.to.replace(/-/g, ''),
            from: senderNumber.replace(/-/g, ''),
            kakaoOptions: {
              pfId,
              templateId: params.templateId,
              variables: params.variables || {},
            },
          },
        };

        const kakaoRes = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers,
          body: JSON.stringify(kakaoBody),
        });

        if (kakaoRes.ok) {
          const data = await kakaoRes.json();
          return {
            success: true,
            messageId: data.groupId || data.messageId,
            channel: 'kakao',
            fallbackUsed: false,
          };
        }
        // 카카오 실패 → SMS 폴백으로 진행
        console.log('[Solapi] 카카오 알림톡 실패, SMS 폴백 시도');
      } catch {
        console.log('[Solapi] 카카오 알림톡 에러, SMS 폴백 시도');
      }
    }

    // SMS 발송
    const smsBody = {
      message: {
        to: params.to.replace(/-/g, ''),
        from: senderNumber.replace(/-/g, ''),
        text: params.smsMessage,
      },
    };

    const smsRes = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(smsBody),
    });

    if (smsRes.ok) {
      const data = await smsRes.json();
      return {
        success: true,
        messageId: data.groupId || data.messageId,
        channel: 'sms',
        fallbackUsed: !!pfId && !!params.templateId,
      };
    }

    const errData = await smsRes.json().catch(() => ({}));
    return {
      success: false,
      channel: 'sms',
      fallbackUsed: !!pfId && !!params.templateId,
      error: (errData as Record<string, string>).errorMessage || `SMS 발송 실패 (${smsRes.status})`,
    };
  } catch (err) {
    return {
      success: false,
      channel: 'sms',
      fallbackUsed: false,
      error: err instanceof Error ? err.message : '알 수 없는 발송 오류',
    };
  }
}

/**
 * 메시지 템플릿 변수 치환
 * {{변수명}} 형태를 실제 값으로 교체
 */
export function buildMessageFromTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
}
