import { describe, it, expect } from 'vitest';
import { DEFAULT_THRESHOLDS_MIN, parseThresholds, planEscalation } from '../escalation';

const MIN = 60_000;
const T0 = Date.parse('2024-01-01T01:00:00Z');

describe('parseThresholds', () => {
  it('쉼표 구분 3개를 읽는다', () => {
    expect(parseThresholds('5,12,30')).toEqual([5, 12, 30]);
    expect(parseThresholds(' 3 , 8 , 20 ')).toEqual([3, 8, 20]);
  });
  it('비었거나 개수·순서가 틀리면 기본값', () => {
    expect(parseThresholds(undefined)).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('5,12')).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('12,5,30')).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('a,b,c')).toEqual(DEFAULT_THRESHOLDS_MIN);
  });
});

describe('planEscalation', () => {
  it('기다리는 중이 아니면 null', () => {
    expect(planEscalation({ awaitingSinceMs: null, level: 0, hasAssignee: true }, T0)).toBeNull();
  });
  it('임계 미달이면 null', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 4 * MIN, level: 0, hasAssignee: true }, T0)).toBeNull();
  });
  it('5분, 담당자 있음 → 1단계, 담당자만', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 5 * MIN, level: 0, hasAssignee: true }, T0)).toEqual({
      nextLevel: 1,
      target: 'assignee',
      feed: false,
      minutes: 5,
    });
  });
  it('5분, 담당자 없음 → 1단계, 전원', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 5 * MIN, level: 0, hasAssignee: false }, T0)).toMatchObject({
      nextLevel: 1,
      target: 'all',
    });
  });
  it('12분, 담당자 있어도 → 2단계, 전원 (담당자가 답을 안 했으므로)', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 12 * MIN, level: 1, hasAssignee: true }, T0)).toEqual({
      nextLevel: 2,
      target: 'all',
      feed: false,
      minutes: 12,
    });
  });
  it('30분 → 3단계, 전원 + 피드', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 30 * MIN, level: 2, hasAssignee: true }, T0)).toEqual({
      nextLevel: 3,
      target: 'all',
      feed: true,
      minutes: 30,
    });
  });
  it('3단계 이후에는 null', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 90 * MIN, level: 3, hasAssignee: true }, T0)).toBeNull();
  });
  it('밤새 기다렸어도 한 번에 한 단계만 올린다', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 600 * MIN, level: 0, hasAssignee: false }, T0)).toMatchObject({
      nextLevel: 1,
    });
  });
  it('환경변수 임계를 쓴다', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 3 * MIN, level: 0, hasAssignee: true }, T0, [3, 8, 20])).toMatchObject({
      nextLevel: 1,
      minutes: 3,
    });
  });
});
