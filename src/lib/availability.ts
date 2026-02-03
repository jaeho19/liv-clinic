import { BUSINESS_HOURS } from './constants';

export interface AvailabilityStatus {
  isOpen: boolean;
  message: string;
}

/**
 * 현재 시간 기준으로 상담 가능 여부를 확인합니다.
 * 한국 시간 (KST, UTC+9) 기준으로 계산합니다.
 */
export function getAvailabilityStatus(): AvailabilityStatus {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  const day = koreaTime.getDay();
  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // 일요일 휴무
  if (day === 0) {
    return { isOpen: false, message: '일요일 휴무' };
  }

  // 토요일
  if (day === 6) {
    const satOpen = parseTime(BUSINESS_HOURS.saturday.open);
    const satClose = parseTime(BUSINESS_HOURS.saturday.close);

    if (currentTime >= satOpen && currentTime < satClose) {
      return { isOpen: true, message: '지금 상담 가능' };
    }
    return { isOpen: false, message: '영업 종료' };
  }

  // 평일
  const weekdayOpen = parseTime(BUSINESS_HOURS.weekday.open);
  const weekdayClose = parseTime(BUSINESS_HOURS.weekday.close);

  if (currentTime < weekdayOpen) {
    return { isOpen: false, message: '영업 전' };
  }

  if (currentTime >= weekdayOpen && currentTime < weekdayClose) {
    return { isOpen: true, message: '지금 상담 가능' };
  }

  return { isOpen: false, message: '영업 종료' };
}
