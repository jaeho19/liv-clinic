import { describe, it, expect } from 'vitest';
import {
  aiAppliesTo,
  decideAi,
  DEFAULT_AI_LIMITS,
  hasSubstance,
  isAiTestName,
  readAiLimits,
  type AiDecisionInput,
} from '../eligibility';

const BASE: AiDecisionInput = {
  mode: 'on',
  hasKey: true,
  visitorName: 'Emma',
  text: 'How much is Ulthera?',
  staffEngagedAt: null,
  sessionTurns: 0,
  dailyCalls: 0,
  limits: DEFAULT_AI_LIMITS,
};

describe('isAiTestName / aiAppliesTo', () => {
  it('이름이 ai-test 로 시작하면 시험 문의다 (대소문자·앞 공백 무시)', () => {
    expect(isAiTestName('ai-test-1002')).toBe(true);
    expect(isAiTestName('  AI-Test Emma')).toBe(true);
    expect(isAiTestName('Emma ai-test')).toBe(false);
    expect(isAiTestName('')).toBe(false);
    expect(isAiTestName(null)).toBe(false);
  });

  it('on = 모든 문의, test = 시험 문의만, off = 없음', () => {
    expect(aiAppliesTo('on', 'Emma')).toBe(true);
    expect(aiAppliesTo('on', null)).toBe(true);
    expect(aiAppliesTo('test', 'ai-test-1')).toBe(true);
    expect(aiAppliesTo('test', 'Emma')).toBe(false);
    expect(aiAppliesTo('off', 'ai-test-1')).toBe(false);
  });
});

describe('hasSubstance', () => {
  it('글자·숫자·물음표가 있으면 답할 내용이 있다', () => {
    expect(hasSubstance('hello')).toBe(true);
    expect(hasSubstance('你好')).toBe(true);
    expect(hasSubstance('10/14')).toBe(true);
    expect(hasSubstance('??')).toBe(true);
    expect(hasSubstance('？')).toBe(true);
  });

  it('이모지·문장부호·공백뿐이면 없다', () => {
    expect(hasSubstance('👍')).toBe(false);
    expect(hasSubstance('🙏🙏 !!')).toBe(false);
    expect(hasSubstance('...')).toBe(false);
    expect(hasSubstance('   ')).toBe(false);
  });
});

describe('readAiLimits', () => {
  it('환경변수가 없으면 기본값(대화당 30, 하루 300)', () => {
    expect(readAiLimits({})).toEqual({ maxReplies: 30, dailyMax: 300 });
  });

  it('숫자를 읽고, 숫자가 아니거나 1보다 작으면 기본값', () => {
    expect(readAiLimits({ CHAT_AI_MAX_REPLIES: '12', CHAT_AI_DAILY_MAX: '50' })).toEqual({ maxReplies: 12, dailyMax: 50 });
    expect(readAiLimits({ CHAT_AI_MAX_REPLIES: 'abc', CHAT_AI_DAILY_MAX: '0' })).toEqual({ maxReplies: 30, dailyMax: 300 });
    expect(readAiLimits({ CHAT_AI_MAX_REPLIES: '', CHAT_AI_DAILY_MAX: '-5' })).toEqual({ maxReplies: 30, dailyMax: 300 });
  });
});

describe('decideAi', () => {
  it('조건이 모두 맞으면 AI가 답한다', () => {
    expect(decideAi(BASE)).toEqual({ eligible: true });
  });

  it('스위치가 꺼져 있거나 시험 모드에서 시험 문의가 아니면 off', () => {
    expect(decideAi({ ...BASE, mode: 'off' })).toEqual({ eligible: false, reason: 'off' });
    expect(decideAi({ ...BASE, mode: 'test' })).toEqual({ eligible: false, reason: 'off' });
    expect(decideAi({ ...BASE, mode: 'test', visitorName: 'ai-test-1' })).toEqual({ eligible: true });
  });

  it('키가 없으면 no_key', () => {
    expect(decideAi({ ...BASE, hasKey: false })).toEqual({ eligible: false, reason: 'no_key' });
  });

  it('내용이 없는 글에는 답하지 않는다', () => {
    expect(decideAi({ ...BASE, text: '👍' })).toEqual({ eligible: false, reason: 'no_substance' });
  });

  it('직원이 맡은 대화에는 답하지 않는다', () => {
    expect(decideAi({ ...BASE, staffEngagedAt: '2026-10-02T07:00:00Z' })).toEqual({
      eligible: false,
      reason: 'staff_engaged',
    });
  });

  it('대화당 한도에 닿으면 session_cap, 하루 한도에 닿으면 daily_cap', () => {
    expect(decideAi({ ...BASE, sessionTurns: 30 })).toEqual({ eligible: false, reason: 'session_cap' });
    expect(decideAi({ ...BASE, sessionTurns: 29 })).toEqual({ eligible: true });
    expect(decideAi({ ...BASE, dailyCalls: 300 })).toEqual({ eligible: false, reason: 'daily_cap' });
  });

  it('여러 조건이 걸리면 앞의 것이 이유가 된다: off → no_key → no_substance → staff_engaged → session_cap → daily_cap', () => {
    expect(decideAi({ ...BASE, mode: 'off', hasKey: false, text: '👍' }).eligible).toBe(false);
    expect(decideAi({ ...BASE, hasKey: false, text: '👍' })).toEqual({ eligible: false, reason: 'no_key' });
    expect(decideAi({ ...BASE, text: '👍', staffEngagedAt: 'x' })).toEqual({ eligible: false, reason: 'no_substance' });
    expect(decideAi({ ...BASE, staffEngagedAt: 'x', sessionTurns: 99 })).toEqual({
      eligible: false,
      reason: 'staff_engaged',
    });
    expect(decideAi({ ...BASE, sessionTurns: 99, dailyCalls: 999 })).toEqual({ eligible: false, reason: 'session_cap' });
  });
});
