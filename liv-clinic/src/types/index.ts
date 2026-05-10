// 다국어 지원 로케일 — Single Source of Truth: src/i18n/routing.ts
import { LOCALES, type Locale as RoutingLocale } from '@/i18n/routing';
export type Locale = RoutingLocale;
export const locales: readonly Locale[] = LOCALES;
export const defaultLocale: Locale = 'ko';

// 시술 카테고리
export type TreatmentCategory = 'lifting' | 'antiaging' | 'laser';

// 네비게이션 메뉴 아이템
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// 의료정보 Q&A
export interface MedicalQA {
  slug: string;
  question: string;
  answer: string;
  category: 'lifting' | 'skin' | 'filler' | 'safety' | 'column';
  createdAt: string;
  relatedSlugs?: string[];
}

// 시술 정보
export interface Treatment {
  id: string;
  name: string;
  nameEn: string;
  category: TreatmentCategory;
  description: string;
  duration: string;
  anesthesia: string;
  recovery: string;
  maintenance: string;
  recommendations: string[];
}

// 의료진 정보
export interface Doctor {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  specialties: string[];
  education: string[];
  certifications: string[];
  image?: string;
}

// 장비 정보
export interface Equipment {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  manufacturer: string;
  certification?: string;
  image?: string;
}

// 상담 신청 폼 데이터
export interface ConsultationForm {
  name: string;
  phone: string;
  email?: string;
  preferredDate?: string;
  preferredTime?: string;
  treatment?: string;
  message?: string;
  privacyAgreed: boolean;
}
