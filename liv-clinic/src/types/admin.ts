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

// Consultation status
export type ConsultationStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending: '대기중',
  contacted: '연락완료',
  completed: '완료',
  cancelled: '취소',
};

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
