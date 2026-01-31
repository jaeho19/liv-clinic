import type { Database } from './supabase';

// Row types
export type ConsultationRow = Database['public']['Tables']['consultation_requests']['Row'];
export type EventRow = Database['public']['Tables']['events']['Row'];
export type PopupRow = Database['public']['Tables']['popups']['Row'];

// Insert types
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type PopupInsert = Database['public']['Tables']['popups']['Insert'];

// Update types
export type ConsultationUpdate = Database['public']['Tables']['consultation_requests']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type PopupUpdate = Database['public']['Tables']['popups']['Update'];

// Consultation status (legacy - 기존 호환용)
export type ConsultationStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

// Lead status (확장된 상태)
export type LeadStatus =
  | 'new'
  | 'callback_scheduled'
  | 'no_answer'
  | 're_contact'
  | 'reservation_confirmed'
  | 'no_show'
  | 'completed'
  | 'cancelled';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: '신규',
  callback_scheduled: '콜백 예정',
  no_answer: '부재중',
  re_contact: '재연락',
  reservation_confirmed: '예약확정',
  no_show: '노쇼',
  completed: '완료',
  cancelled: '취소',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  callback_scheduled: 'bg-blue-100 text-blue-700',
  no_answer: 'bg-orange-100 text-orange-700',
  re_contact: 'bg-purple-100 text-purple-700',
  reservation_confirmed: 'bg-green-100 text-green-700',
  no_show: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

// Legacy mapping (기존 코드 호환)
export const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  ...LEAD_STATUS_LABELS,
  pending: '대기중',
  contacted: '연락완료',
};

// Procedure tags (관심 시술 태그)
export const PROCEDURE_TAG_OPTIONS = [
  '울쎄라', '써마지', '덴서티', '인모드', '슈링크', '실리프팅', '압토스',
  '보톡스', '필러', '스킨부스터',
  '색소 레이저', '혈관 레이저', '제모 레이저', '문신 제거', '피부톤 레이저',
] as const;

// Budget range options
export const BUDGET_RANGE_OPTIONS = [
  '50만원 이하',
  '50~100만원',
  '100~200만원',
  '200~300만원',
  '300만원 이상',
  '미정',
] as const;

// Event category
export type EventCategory = 'lifting' | 'antiaging' | 'laser' | 'skincare' | 'all';

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  laser: '레이저',
  skincare: '스킨케어',
  all: '전체',
};

// Event status (derived from dates)
export type EventStatus = 'active' | 'ended' | 'draft';

export function getEventStatusFromRow(event: EventRow): EventStatus {
  if (!event.is_published) return 'draft';
  const now = new Date();
  const endDate = new Date(event.end_date + 'T23:59:59');
  return now <= endDate ? 'active' : 'ended';
}

// Popup status (derived from dates and is_active)
export type PopupStatus = 'active' | 'scheduled' | 'ended' | 'disabled';

export function getPopupStatus(popup: PopupRow): PopupStatus {
  if (!popup.is_active) return 'disabled';
  const now = new Date();
  const start = new Date(popup.display_start);
  const end = new Date(popup.display_end);
  if (now < start) return 'scheduled';
  if (now > end) return 'ended';
  return 'active';
}

// Dashboard stats
export interface DashboardStats {
  consultations: {
    today: number;
    pending: number;
    thisMonth: number;
  };
  events: {
    active: number;
    total: number;
  };
  popups: {
    active: number;
    total: number;
  };
}

// Related treatments for event form
export const RELATED_TREATMENT_OPTIONS = [
  { value: '/lifting/ulthera', label: '울쎄라' },
  { value: '/lifting/thermage', label: '써마지 FLX' },
  { value: '/lifting/density', label: '덴서티' },
  { value: '/lifting/inmode', label: '인모드' },
  { value: '/lifting/shurink', label: '슈링크' },
  { value: '/lifting/thread', label: '실리프팅' },
  { value: '/lifting/aptos', label: '압토스' },
  { value: '/antiaging/botox', label: '보톡스' },
  { value: '/antiaging/filler', label: '필러' },
  { value: '/antiaging/skinbooster', label: '스킨부스터' },
  { value: '/laser', label: '레이저' },
] as const;
