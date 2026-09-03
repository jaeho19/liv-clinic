import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRows } from '../compile-concern-rules.mjs';

const TREATMENT_IDS = new Set(['aptos', 'ulthera', 'thread']);

const okRule = {
  concern_id: 'sagging', treatment_id: 'aptos', display_order: '1',
  reason_ko: '설명', reason_en: 'r', reason_ja: 'r', reason_zh: 'r',
  caution_ko: '', caution_en: '', caution_ja: '', caution_zh: '',
  reviewed_by: '원장,실장', reviewed_at: '2026-09-10',
};

test('정상 규칙 행은 통과한다', () => {
  const errors = validateRows({ rules: [okRule], terms: [], questions: [] }, TREATMENT_IDS);
  assert.deepEqual(errors, []);
});

test('reviewed_by가 비면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reviewed_by: '' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /reviewed_by/);
});

test('reviewed_by가 허용값이 아니면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reviewed_by: '김원장' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.match(errors[0], /reviewed_by/);
});

test('treatment_id가 TREATMENTS에 없으면 실패한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, treatment_id: '없는시술' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.match(errors[0], /treatment_id/);
});

test('consultOnly는 TREATMENTS에 없어도 통과한다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, treatment_id: 'consultOnly' }], terms: [], questions: [] }, TREATMENT_IDS);
  assert.deepEqual(errors, []);
});

test('answer_source가 허용 목록 밖이면 실패한다', () => {
  const q = {
    question_id: 'q1', applies_to: '*',
    text_ko: 'a', text_en: 'a', text_ja: 'a', text_zh: 'a',
    answer_source: 'price',
  };
  const errors = validateRows({ rules: [], terms: [], questions: [q] }, TREATMENT_IDS);
  assert.match(errors[0], /answer_source/);
});

test('reason_ko만 있고 번역이 비면 경고이지 오류가 아니다', () => {
  const errors = validateRows(
    { rules: [{ ...okRule, reason_en: '', reason_ja: '', reason_zh: '' }], terms: [], questions: [] },
    TREATMENT_IDS);
  assert.deepEqual(errors, []);
});
