'use client';

import { useTranslations } from 'next-intl';
import type { MEDICAL_QA } from '@/lib/constants';

/**
 * 의료정보 Q&A 항목 (로케일 메시지 버전).
 *
 * `messages.<locale>.medical.faq`는 `MEDICAL_QA`(ko 원본)와 id·순서가 동일한
 * 번역본이며, `questionVariants`(음성검색 전용, ko 원본에만 존재)를 제외한
 * 동일한 형태를 갖는다. 그래서 타입도 원본에서 파생시켜 두 소스가 갈라지면
 * 컴파일 단계에서 드러나게 한다.
 */
export type MedicalQAItem = Pick<
  (typeof MEDICAL_QA)[number],
  'id' | 'category' | 'question' | 'shortAnswer' | 'answer' | 'relatedTreatments' | 'tags'
>;

/**
 * 로케일에 맞는 의료정보 Q&A 목록을 반환한다.
 *
 * 시술 상세 페이지의 "관련 의료정보 Q&A"는 원래 `MEDICAL_QA` 상수를 직접 읽었는데,
 * 이 상수는 한국어 전용이라 en/ja/zh 등 외국어 페이지에 한글이 그대로 노출됐다.
 * 이미 번역되어 있는 `medical.faq` 메시지를 소스로 삼아 그 누수를 막는다.
 */
export function useLocalizedMedicalQA(): readonly MedicalQAItem[] {
  const t = useTranslations('medical');
  const faq: unknown = t.raw('faq');

  return Array.isArray(faq) ? (faq as MedicalQAItem[]) : [];
}
