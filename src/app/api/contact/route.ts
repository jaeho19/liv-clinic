import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// 시술 옵션 매핑
const treatmentLabels: Record<string, string> = {
  'lifting-ulthera': '울쎄라피 프라임',
  'lifting-thermage': '써마지 FLX',
  'lifting-density': '덴서티',
  'lifting-inmode': '인모드',
  'lifting-shurink': '슈링크',
  'lifting-thread': '실리프팅',
  'antiaging-botox': '보톡스',
  'antiaging-filler': '필러',
  'antiaging-skinbooster': '스킨부스터',
  'laser': '레이저',
  'other': '기타 / 상담 후 결정',
};

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: '이메일 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const { name, phone, email, treatment, preferredDate, preferredTime, message } = body;

    // 유효성 검사
    if (!name || !phone || !treatment) {
      return NextResponse.json(
        { error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      );
    }

    const treatmentLabel = treatmentLabels[treatment] || treatment;
    const formattedDate = preferredDate || '미정';
    const formattedTime = preferredTime || '미정';

    // 병원으로 보내는 알림 이메일
    const { data, error } = await resend.emails.send({
      from: 'LIV 상담예약 <noreply@livps.co.kr>',
      to: [process.env.CLINIC_EMAIL || 'info@livps.co.kr'],
      subject: `[상담예약] ${name}님 - ${treatmentLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b4988d 0%, #8b7355 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
            .info-label { width: 120px; color: #888; font-size: 14px; }
            .info-value { flex: 1; font-size: 14px; color: #333; }
            .message-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>새로운 상담 예약</h1>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="info-label">이름</span>
                <span class="info-value"><strong>${name}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">연락처</span>
                <span class="info-value"><a href="tel:${phone}">${phone}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">이메일</span>
                <span class="info-value">${email || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">관심 시술</span>
                <span class="info-value"><strong>${treatmentLabel}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">희망 날짜</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">희망 시간</span>
                <span class="info-value">${formattedTime}</span>
              </div>
              ${message ? `
              <div class="message-box">
                <strong>문의 내용:</strong>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              리브성형외과 상담예약 시스템
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 고객에게 확인 이메일 보내기 (이메일이 있는 경우)
    if (email) {
      await resend.emails.send({
        from: 'LIV 성형외과 <noreply@livps.co.kr>',
        to: [email],
        subject: '[리브성형외과] 상담 예약이 접수되었습니다',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #b4988d 0%, #8b7355 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 10px 0 0; opacity: 0.9; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
              .info-box { background: #faf8f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-row { padding: 8px 0; }
              .info-label { color: #888; font-size: 13px; }
              .info-value { font-size: 15px; color: #333; margin-top: 2px; }
              .cta-button { display: inline-block; background: #b4988d; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 10px 5px; }
              .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; }
              .footer p { margin: 5px 0; font-size: 13px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>LIV 성형외과</h1>
                <p>Slow Aging, Natural Beauty</p>
              </div>
              <div class="content">
                <h2 style="color: #b4988d;">상담 예약이 접수되었습니다</h2>
                <p>${name}님, 안녕하세요.<br>리브성형외과에 상담 예약을 신청해 주셔서 감사합니다.</p>
                <p>담당자가 확인 후 <strong>1영업일 이내</strong>에 연락드리겠습니다.</p>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #333;">예약 정보</h3>
                  <div class="info-row">
                    <div class="info-label">관심 시술</div>
                    <div class="info-value"><strong>${treatmentLabel}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">희망 일시</div>
                    <div class="info-value">${formattedDate} ${formattedTime !== '미정' ? formattedTime : ''}</div>
                  </div>
                </div>

                <p>급한 문의는 전화로 연락 부탁드립니다.</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="tel:02-797-2773" class="cta-button">전화 상담: 02-797-2773</a>
                </div>
              </div>
              <div class="footer">
                <p><strong>리브성형외과</strong></p>
                <p>서울특별시 서초구 나루터로 80 자은빌딩 4층</p>
                <p>신사역 4번 출구 도보 1분</p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                  본 메일은 발신 전용입니다. 문의사항은 전화 또는 카카오톡으로 연락 부탁드립니다.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    return NextResponse.json(
      { success: true, message: '상담 예약이 접수되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
