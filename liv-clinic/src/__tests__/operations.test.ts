import { describe, it, expect } from 'vitest';
import {
  DOCTOR_OPTIONS,
  DURATION_OPTIONS,
  TREATMENT_TYPES,
  TREATMENT_TYPE_LABELS,
  PROCEDURE_OPTIONS_BY_TYPE,
  ROOM_TYPE_TREATMENT_MAP,
  DEFAULT_TREATMENT_CONFIGS,
  getOptionsForRoomType,
  getDefaultTreatmentForRoom,
  validateDuration,
} from '@/types/admin';
import type { TreatmentType, RoomType } from '@/types/admin';
import {
  getCaseProgress,
  getProgressColor,
  formatElapsed,
  getElapsedMinutes,
} from '@/components/admin/floormap/useElapsedTimer';

// ──────────────────────────────────────────────────────
// 1. 담당의 이름/순서 테스트
// ──────────────────────────────────────────────────────
describe('DOCTOR_OPTIONS', () => {
  it('김수영 원장이 첫 번째, 천신혜 원장이 두 번째', () => {
    expect(DOCTOR_OPTIONS[0]).toBe('김수영 원장');
    expect(DOCTOR_OPTIONS[1]).toBe('천신혜 원장');
  });

  it('기존 이름(김원장, 천원장)이 포함되지 않음', () => {
    expect(DOCTOR_OPTIONS).not.toContain('김원장');
    expect(DOCTOR_OPTIONS).not.toContain('천원장');
  });

  it('총 2명의 원장이 등록됨', () => {
    expect(DOCTOR_OPTIONS).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────
// 2. 소요 시간 5분 단위 테스트
// ──────────────────────────────────────────────────────
describe('DURATION_OPTIONS', () => {
  it('모든 옵션이 5의 배수', () => {
    DURATION_OPTIONS.forEach((d) => {
      expect(d % 5).toBe(0);
    });
  });

  it('최소값이 5분', () => {
    expect(DURATION_OPTIONS[0]).toBe(5);
  });

  it('최대값이 240분', () => {
    expect(DURATION_OPTIONS[DURATION_OPTIONS.length - 1]).toBe(240);
  });

  it('48개 옵션 (5, 10, 15, ..., 240)', () => {
    expect(DURATION_OPTIONS).toHaveLength(48);
  });
});

describe('validateDuration', () => {
  it('5분 단위는 유효', () => {
    expect(validateDuration(5)).toBe(true);
    expect(validateDuration(10)).toBe(true);
    expect(validateDuration(25)).toBe(true);
    expect(validateDuration(60)).toBe(true);
    expect(validateDuration(240)).toBe(true);
  });

  it('5분 단위가 아니면 무효', () => {
    expect(validateDuration(7)).toBe(false);
    expect(validateDuration(12)).toBe(false);
    expect(validateDuration(33)).toBe(false);
    expect(validateDuration(61)).toBe(false);
  });

  it('범위 밖 값은 무효', () => {
    expect(validateDuration(0)).toBe(false);
    expect(validateDuration(3)).toBe(false);
    expect(validateDuration(245)).toBe(false);
    expect(validateDuration(300)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────
// 3. 시술 유형에 피부관리(SKINCARE) 포함 확인
// ──────────────────────────────────────────────────────
describe('TreatmentType - SKINCARE', () => {
  it('TREATMENT_TYPES에 SKINCARE가 포함됨', () => {
    expect(TREATMENT_TYPES).toContain('SKINCARE');
  });

  it('TREATMENT_TYPE_LABELS에 피부관리 레이블이 있음', () => {
    expect(TREATMENT_TYPE_LABELS['SKINCARE']).toBe('피부관리');
  });

  it('PROCEDURE_OPTIONS_BY_TYPE에 SKINCARE 항목이 있음', () => {
    expect(PROCEDURE_OPTIONS_BY_TYPE['SKINCARE']).toBeDefined();
    expect(PROCEDURE_OPTIONS_BY_TYPE['SKINCARE'].length).toBeGreaterThan(0);
  });

  it('DEFAULT_TREATMENT_CONFIGS에 SKINCARE 설정이 있음', () => {
    const config = DEFAULT_TREATMENT_CONFIGS.find((c) => c.type === 'SKINCARE');
    expect(config).toBeDefined();
    expect(config!.defaultDurationMin).toBe(40);
  });
});

// ──────────────────────────────────────────────────────
// 4. 방 타입별 시술 옵션 필터링 테스트
// ──────────────────────────────────────────────────────
describe('getOptionsForRoomType', () => {
  it('상담실(consultation) → CONSULT만 반환', () => {
    const options = getOptionsForRoomType('consultation');
    expect(options).toEqual(['CONSULT']);
  });

  it('시술실(procedure) → PROCEDURE + ANESTHESIA 반환', () => {
    const options = getOptionsForRoomType('procedure');
    expect(options).toContain('PROCEDURE');
    expect(options).toContain('ANESTHESIA');
    expect(options).not.toContain('CONSULT');
    expect(options).not.toContain('SKINCARE');
  });

  it('관리실(recovery) → SKINCARE만 반환', () => {
    const options = getOptionsForRoomType('recovery');
    expect(options).toEqual(['SKINCARE']);
  });

  it('매핑 없는 방 타입(office, anesthesia 등) → 전체 타입 반환', () => {
    const officeOptions = getOptionsForRoomType('office');
    expect(officeOptions).toEqual(TREATMENT_TYPES);

    const anesthesiaOptions = getOptionsForRoomType('anesthesia');
    expect(anesthesiaOptions).toEqual(TREATMENT_TYPES);
  });
});

describe('getDefaultTreatmentForRoom', () => {
  it('상담실 → CONSULT', () => {
    expect(getDefaultTreatmentForRoom('consultation')).toBe('CONSULT');
  });

  it('시술실 → PROCEDURE', () => {
    expect(getDefaultTreatmentForRoom('procedure')).toBe('PROCEDURE');
  });

  it('관리실 → SKINCARE', () => {
    expect(getDefaultTreatmentForRoom('recovery')).toBe('SKINCARE');
  });
});

describe('PROCEDURE_OPTIONS_BY_TYPE', () => {
  it('모든 TreatmentType에 대해 시술 옵션이 존재', () => {
    TREATMENT_TYPES.forEach((type) => {
      expect(PROCEDURE_OPTIONS_BY_TYPE[type]).toBeDefined();
      expect(PROCEDURE_OPTIONS_BY_TYPE[type].length).toBeGreaterThan(0);
    });
  });

  it('CONSULT 시술 옵션에 상담 관련 항목 포함', () => {
    const options = PROCEDURE_OPTIONS_BY_TYPE['CONSULT'];
    expect(options).toContain('초진 상담');
    expect(options).toContain('재진 상담');
  });

  it('SKINCARE 시술 옵션에 피부관리 관련 항목 포함', () => {
    const options = PROCEDURE_OPTIONS_BY_TYPE['SKINCARE'];
    expect(options).toContain('피부관리');
  });

  it('PROCEDURE 시술 옵션에 기존 시술 항목 포함', () => {
    const options = PROCEDURE_OPTIONS_BY_TYPE['PROCEDURE'];
    expect(options).toContain('울쎄라');
    expect(options).toContain('보톡스');
    expect(options).toContain('필러');
  });
});

// ──────────────────────────────────────────────────────
// 5. 진행률 계산 테스트
// ──────────────────────────────────────────────────────
describe('getCaseProgress', () => {
  it('actualStart가 없으면 0% 진행, remaining = expected', () => {
    const result = getCaseProgress(undefined, 30);
    expect(result.percent).toBe(0);
    expect(result.elapsed).toBe(0);
    expect(result.remaining).toBe(30);
    expect(result.isOvertime).toBe(false);
    expect(result.estimatedEndTime).toBeNull();
  });

  it('방금 시작한 케이스는 0% 근처', () => {
    const now = new Date().toISOString();
    const result = getCaseProgress(now, 60);
    expect(result.percent).toBeGreaterThanOrEqual(0);
    expect(result.percent).toBeLessThan(5);
    expect(result.elapsed).toBe(0);
    expect(result.remaining).toBe(60);
    expect(result.isOvertime).toBe(false);
  });

  it('시작 후 15분 경과한 30분 케이스 → 약 50%', () => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const result = getCaseProgress(fifteenMinAgo, 30);
    expect(result.percent).toBeGreaterThanOrEqual(45);
    expect(result.percent).toBeLessThanOrEqual(55);
    expect(result.elapsed).toBe(15);
    expect(result.remaining).toBe(15);
    expect(result.isOvertime).toBe(false);
  });

  it('시작 후 60분 경과한 30분 케이스 → 초과(overtime)', () => {
    const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = getCaseProgress(sixtyMinAgo, 30);
    expect(result.percent).toBeGreaterThanOrEqual(100);
    expect(result.isOvertime).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('진행률은 150%를 초과하지 않음', () => {
    const longAgo = new Date(Date.now() - 300 * 60 * 1000).toISOString();
    const result = getCaseProgress(longAgo, 30);
    expect(result.percent).toBeLessThanOrEqual(150);
  });

  it('estimatedEndTime이 HH:mm 형식으로 반환됨', () => {
    const now = new Date().toISOString();
    const result = getCaseProgress(now, 25);
    expect(result.estimatedEndTime).not.toBeNull();
    // HH:mm 형식 확인 (한국어 locale은 "오후 2:35" 또는 "14:35" 형태)
    expect(typeof result.estimatedEndTime).toBe('string');
    expect(result.estimatedEndTime!.length).toBeGreaterThan(0);
  });

  it('예상 종료 시간이 startTime + duration 기준으로 계산됨', () => {
    // 고정 시간으로 테스트
    const startTime = new Date('2025-01-01T14:00:00+09:00');
    const result = getCaseProgress(startTime.toISOString(), 25);
    // 14:00 + 25분 = 14:25
    expect(result.estimatedEndTime).toContain('14:25');
  });
});

describe('getProgressColor', () => {
  it('0-99%: 초록색', () => {
    expect(getProgressColor(0)).toBe('#22c55e');
    expect(getProgressColor(50)).toBe('#22c55e');
    expect(getProgressColor(99)).toBe('#22c55e');
  });

  it('100-119%: 앰버(경고)', () => {
    expect(getProgressColor(100)).toBe('#f59e0b');
    expect(getProgressColor(110)).toBe('#f59e0b');
    expect(getProgressColor(119)).toBe('#f59e0b');
  });

  it('120%+: 빨간색(위험)', () => {
    expect(getProgressColor(120)).toBe('#ef4444');
    expect(getProgressColor(150)).toBe('#ef4444');
  });
});

describe('formatElapsed', () => {
  it('60분 미만은 분 단위만 표시', () => {
    expect(formatElapsed(0)).toBe('0분');
    expect(formatElapsed(15)).toBe('15분');
    expect(formatElapsed(59)).toBe('59분');
  });

  it('60분 이상은 시간+분 형식', () => {
    expect(formatElapsed(60)).toBe('1시간 0분');
    expect(formatElapsed(90)).toBe('1시간 30분');
    expect(formatElapsed(120)).toBe('2시간 0분');
  });
});

// ──────────────────────────────────────────────────────
// 6. 기본 설정 무결성 테스트
// ──────────────────────────────────────────────────────
describe('DEFAULT_TREATMENT_CONFIGS', () => {
  it('모든 기본 소요시간이 5분 단위', () => {
    DEFAULT_TREATMENT_CONFIGS.forEach((config) => {
      expect(config.defaultDurationMin % 5).toBe(0);
    });
  });

  it('4가지 유형이 모두 설정됨', () => {
    const types = DEFAULT_TREATMENT_CONFIGS.map((c) => c.type);
    expect(types).toContain('CONSULT');
    expect(types).toContain('SKINCARE');
    expect(types).toContain('ANESTHESIA');
    expect(types).toContain('PROCEDURE');
  });
});

// ──────────────────────────────────────────────────────
// 7. 시나리오 테스트 (통합)
// ──────────────────────────────────────────────────────
describe('시나리오: 상담실에서 새 케이스', () => {
  it('상담실 클릭 → CONSULT 유형만 선택 가능', () => {
    const roomType: RoomType = 'consultation';
    const options = getOptionsForRoomType(roomType);
    expect(options).toEqual(['CONSULT']);
  });

  it('기본 유형이 CONSULT', () => {
    const roomType: RoomType = 'consultation';
    const defaultType = getDefaultTreatmentForRoom(roomType);
    expect(defaultType).toBe('CONSULT');
  });

  it('시술 옵션에 초진/재진 상담이 표시됨', () => {
    const defaultType = getDefaultTreatmentForRoom('consultation');
    const procedures = PROCEDURE_OPTIONS_BY_TYPE[defaultType];
    expect(procedures).toContain('초진 상담');
    expect(procedures).toContain('재진 상담');
  });
});

describe('시나리오: 시술실에서 25분 케이스 생성 후 진행률', () => {
  it('시술실 클릭 → PROCEDURE/ANESTHESIA 유형 선택 가능', () => {
    const options = getOptionsForRoomType('procedure');
    expect(options).toContain('PROCEDURE');
    expect(options).toContain('ANESTHESIA');
    expect(options).not.toContain('CONSULT');
  });

  it('25분 케이스 생성 후 progress bar와 예상 종료 시간 계산', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const progress = getCaseProgress(fiveMinAgo, 25);

    // 5분 경과 / 25분 = 20%
    expect(progress.percent).toBeGreaterThanOrEqual(18);
    expect(progress.percent).toBeLessThanOrEqual(22);
    expect(progress.elapsed).toBe(5);
    expect(progress.remaining).toBe(20);
    expect(progress.isOvertime).toBe(false);
    expect(progress.estimatedEndTime).not.toBeNull();
  });
});

describe('시나리오: 관리실에서 피부관리 케이스', () => {
  it('관리실 클릭 → SKINCARE 유형만 선택 가능', () => {
    const options = getOptionsForRoomType('recovery');
    expect(options).toEqual(['SKINCARE']);
  });

  it('기본 유형이 SKINCARE', () => {
    expect(getDefaultTreatmentForRoom('recovery')).toBe('SKINCARE');
  });

  it('피부관리 옵션 목록이 올바르게 반환됨', () => {
    const procedures = PROCEDURE_OPTIONS_BY_TYPE['SKINCARE'];
    expect(procedures).toContain('피부관리');
    expect(procedures.length).toBeGreaterThanOrEqual(3);
  });

  it('피부관리 케이스의 진행률이 정상적으로 계산됨', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const progress = getCaseProgress(tenMinAgo, 40); // SKINCARE default: 40분
    expect(progress.percent).toBeGreaterThanOrEqual(23);
    expect(progress.percent).toBeLessThanOrEqual(27);
    expect(progress.isOvertime).toBe(false);
  });
});
