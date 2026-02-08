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

// ==========================================
// Operations (운영현황) - 칸반 보드
// ==========================================

export type OperationStage = 'waiting' | 'anesthesia' | 'procedure' | 'recovery' | 'completed';

export const OPERATION_STAGES: OperationStage[] = [
  'waiting', 'anesthesia', 'procedure', 'recovery', 'completed',
];

export const OPERATION_STAGE_LABELS: Record<OperationStage, string> = {
  waiting: '대기',
  anesthesia: '마취',
  procedure: '시술',
  recovery: '회복',
  completed: '종료',
};

export const OPERATION_STAGE_COLORS: Record<OperationStage, { bg: string; text: string; border: string }> = {
  waiting: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  anesthesia: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  procedure: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  recovery: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  completed: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export const DOCTOR_OPTIONS = ['김수영 원장', '천신혜 원장'] as const;

export interface PatientCase {
  id: string;
  name: string;
  phone: string;
  procedure: string;
  doctor: string;
  stage: OperationStage;
  stageEnteredAt: string; // ISO datetime
  createdAt: string;      // ISO datetime
  memo?: string;
  roomId?: string;        // 평면도 방 ID
}

// ==========================================
// Floor Map (평면도 뷰)
// ==========================================

export type RoomType = 'procedure' | 'recovery' | 'waiting' | 'anesthesia' | 'consultation' | 'office' | 'utility';

export interface RoomBounds {
  x: number;      // left %
  y: number;      // top %
  width: number;  // width %
  height: number; // height %
}

export interface RoomConfig {
  id: string;
  name: string;
  type: RoomType;
  bounds: RoomBounds;
  capacity?: number;
}

export interface TimeThreshold {
  stage: OperationStage;
  warningMinutes: number;
  criticalMinutes: number;
}

export type OperationsViewMode = 'kanban' | 'floormap';

export interface FloorMapFilters {
  stages: OperationStage[];
  doctors: string[];
}

// V2 filters
export interface FloorMapFiltersV2 {
  treatmentTypes: TreatmentType[];
  doctors: string[];
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  procedure: '시술실',
  recovery: '관리실',
  waiting: '대기실',
  anesthesia: '포토실',
  consultation: '상담실',
  office: '',
  utility: '',
};

export const DEFAULT_TIME_THRESHOLDS: TimeThreshold[] = [
  { stage: 'waiting', warningMinutes: 30, criticalMinutes: 60 },
  { stage: 'anesthesia', warningMinutes: 20, criticalMinutes: 40 },
  { stage: 'procedure', warningMinutes: 60, criticalMinutes: 120 },
  { stage: 'recovery', warningMinutes: 30, criticalMinutes: 60 },
  { stage: 'completed', warningMinutes: 999, criticalMinutes: 999 },
];

export const FLOOR_STAGE_COLORS: Record<OperationStage, { fill: string; border: string; text: string }> = {
  waiting:    { fill: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  anesthesia: { fill: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  procedure:  { fill: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  recovery:   { fill: '#dcfce7', border: '#22c55e', text: '#166534' },
  completed:  { fill: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
};

// ==========================================
// Operations V2 - Case Management (케이스 관리)
// ==========================================

export type TreatmentType = 'CONSULT' | 'SKINCARE' | 'ANESTHESIA' | 'PROCEDURE';

export const TREATMENT_TYPES: TreatmentType[] = ['CONSULT', 'SKINCARE', 'ANESTHESIA', 'PROCEDURE'];

export const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  CONSULT: '상담',
  SKINCARE: '피부관리',
  ANESTHESIA: '마취',
  PROCEDURE: '시술',
};

export const TREATMENT_TYPE_ICONS: Record<TreatmentType, string> = {
  CONSULT: '\uD83D\uDCAC',
  SKINCARE: '\u2728',
  ANESTHESIA: '\uD83D\uDC89',
  PROCEDURE: '\u26A1',
};

export const TREATMENT_TYPE_FLOOR_COLORS: Record<TreatmentType, { fill: string; border: string; text: string }> = {
  CONSULT:    { fill: '#f3f4f6', border: '#6b7280', text: '#374151' },
  SKINCARE:   { fill: '#dcfce7', border: '#22c55e', text: '#166534' },
  ANESTHESIA: { fill: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  PROCEDURE:  { fill: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
};

export type CaseStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  WAITING: '대기',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export type CaseLocation = 'ROOM' | 'LOUNGE' | 'OTHER';

export const CASE_LOCATION_LABELS: Record<CaseLocation, string> = {
  ROOM: '방 내',
  LOUNGE: '대기실',
  OTHER: '기타',
};

// ==========================================
// Payment (결제/매출)
// ==========================================

export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER' | 'MIXED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: '카드',
  CASH: '현금',
  TRANSFER: '이체',
  MIXED: '복합',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: '미결제',
  COMPLETED: '결제완료',
  REFUNDED: '환불',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-red-100 text-red-700',
};

export interface OperationCase {
  id: string;
  roomId: string;
  patientName: string;
  phoneNumber?: string;
  treatmentType: TreatmentType;
  status: CaseStatus;
  location: CaseLocation;
  doctor: string;
  procedure: string;
  actualStart?: string;       // ISO datetime
  expectedDurationMin: number;
  createdAt: string;          // ISO datetime
  memo?: string;
  parentCaseId?: string;      // linked case (마취 → 시술)
  priceKrw?: number | null;
  discountKrw?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
}

export interface TreatmentConfig {
  type: TreatmentType;
  label: string;
  defaultDurationMin: number;
}

export const DEFAULT_TREATMENT_CONFIGS: TreatmentConfig[] = [
  { type: 'CONSULT',    label: '상담',     defaultDurationMin: 20 },
  { type: 'SKINCARE',   label: '피부관리', defaultDurationMin: 40 },
  { type: 'ANESTHESIA', label: '마취',     defaultDurationMin: 30 },
  { type: 'PROCEDURE',  label: '시술',     defaultDurationMin: 60 },
];

// Room type → allowed treatment types
export const ROOM_TYPE_TREATMENT_MAP: Partial<Record<RoomType, TreatmentType[]>> = {
  consultation: ['CONSULT'],
  procedure: ['PROCEDURE', 'ANESTHESIA'],
  recovery: ['SKINCARE'],
};

// Procedure options grouped by treatment type
export const PROCEDURE_OPTIONS_BY_TYPE: Record<TreatmentType, readonly string[]> = {
  CONSULT: ['초진 상담', '재진 상담', '수술 상담', '시술 상담'],
  SKINCARE: ['피부관리', '재생관리', '보습관리', '리프팅관리', '모공관리'],
  ANESTHESIA: ['수면마취', '국소마취', '도포마취'],
  PROCEDURE: PROCEDURE_TAG_OPTIONS,
};

// Duration presets (5-min increments: 5, 10, 15, ..., 240)
export const DURATION_OPTIONS: number[] = Array.from({ length: 48 }, (_, i) => (i + 1) * 5);

/** Get allowed treatment types for a given room type */
export function getOptionsForRoomType(roomType: RoomType): TreatmentType[] {
  return ROOM_TYPE_TREATMENT_MAP[roomType] || [...TREATMENT_TYPES];
}

/** Get default treatment type for a given room type */
export function getDefaultTreatmentForRoom(roomType: RoomType): TreatmentType {
  const options = getOptionsForRoomType(roomType);
  return options[0] || 'PROCEDURE';
}

/** Validate duration is a 5-min increment between 5 and 240 */
export function validateDuration(minutes: number): boolean {
  return minutes >= 5 && minutes <= 240 && minutes % 5 === 0;
}

// ==========================================
// Inventory (재고관리)
// ==========================================

export type InventoryCategory = 'device_tip' | 'injection' | 'thread' | 'consumable' | 'skincare' | 'medicine';

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  device_tip: '장비 팁/카트리지',
  injection: '주사제',
  thread: '실리프팅',
  consumable: '소모품',
  skincare: '스킨케어',
  medicine: '약물/연고',
};

export const INVENTORY_SUBCATEGORY_LABELS: Record<string, string> = {
  // device_tip
  ulthera: '울쎄라',
  thermage: '써마지',
  density: '덴서티',
  potenza: '포텐자',
  shurink: '슈링크',
  // injection
  botox: '보톡스',
  filler: '필러',
  filler_restylane: '레스틸렌',
  filler_belotero: '벨로테로',
  filler_juvederm: '쥬비덤',
  filler_domestic: '국산필러',
  skinbooster: '스킨부스터',
  contouring: '윤곽주사',
  // thread
  silhouette: '실루엣소프트',
  mint: '민트실',
  neodoctor: '네오닥터',
  epiticon: '에피티콘',
  conseltina: '콘셀티나',
  aptos: '압토스',
  // consumable
  needle: '니들',
  cannula: '케뉼라',
  syringe: '주사기',
  iv_fluid: '수액',
  gauze: '거즈',
  disinfection: '소독',
  foam: '폼/드레싱',
  glove: '글러브/기타',
  anesthesia: '마취제',
  gel: '젤',
  basic: '기본 소모품',
  // skincare
  aftercare: '시술 후 케어',
  // medicine
  controlled: '향정신성',
  drug: '약물',
  ointment: '연고',
  grida: '그리다',
};

export type InventoryStockStatus = 'normal' | 'low' | 'out';

export type InventoryTxType = 'use' | 'restock' | 'adjust' | 'dispose';

export const INVENTORY_TX_LABELS: Record<InventoryTxType, string> = {
  use: '사용',
  restock: '입고',
  adjust: '조정',
  dispose: '폐기',
};

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  sub_category?: string;
  specification?: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
  supplier?: string;
  storage_note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  tx_type: InventoryTxType;
  quantity: number;
  patient_name?: string;
  chart_number?: string;
  note?: string;
  confirmed_by?: string;
  created_by?: string;
  created_at: string;
  // joined
  item?: InventoryItem;
}

export interface ProcedureRecipe {
  id: string;
  procedure_name: string;
  item_id: string;
  default_qty: number;
  note?: string;
  // joined
  item?: InventoryItem;
}

export interface InventoryCount {
  id: string;
  item_id: string;
  count_type: string;
  counted_qty: number;
  system_qty: number;
  difference: number;
  counted_by?: string;
  counted_at: string;
}

// Legacy compat alias
export interface StockLog {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  createdAt: string;
}

export function getStockStatus(item: InventoryItem): InventoryStockStatus {
  if (item.current_stock <= 0) return 'out';
  if (item.current_stock <= item.min_stock) return 'low';
  return 'normal';
}

// 간호사 옵션
export const NURSE_OPTIONS = ['김수정', '김지연'] as const;

// 시술 레시피 목록 (시술명)
export const PROCEDURE_NAMES = [
  '리쥬란 HB 시술',
  '리쥬란 힐러 시술',
  '리쥬란 아이 시술',
  '필러 시술 (볼벨라)',
  '필러 시술 (볼루마)',
  '필러 시술 (볼리프트)',
  '필러 시술 (볼룩스)',
  '보톡스 시술 (제오민)',
  '보톡스 시술 (하이톡스)',
  '보톡스 시술 (제테마더)',
  '써마지 FLX 600',
  '써마지 FLX 900',
  '아이써마지',
  '스컬트라 시술',
  '쥬베룩 볼륨 시술',
  '쥬베룩 스킨부스터 시술',
] as const;

// ==========================================
// Reports (리포트)
// ==========================================

export type ReportPeriodType = 'monthly' | 'weekly';

export interface ConsultationFunnelData {
  total: number;
  contacted: number;
  reserved: number;
  completed: number;
  noShow: number;
}

export interface ProcedureStat {
  name: string;
  category: string;
  count: number;
  revenue: number;
}

export interface DoctorStat {
  name: string;
  consultations: number;
  procedures: number;
  revenue: number;
  conversionRate: number;
}

export interface DailyTrend {
  date: string;
  consultations: number;
  procedures: number;
}

// ==========================================
// Settings (설정)
// ==========================================

export type TreatmentMasterCategory = 'lifting' | 'antiaging' | 'laser' | 'skincare';

export const TREATMENT_MASTER_CATEGORY_LABELS: Record<TreatmentMasterCategory, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  laser: '레이저',
  skincare: '스킨케어',
};

export interface TreatmentMaster {
  id: string;
  name: string;
  category: TreatmentMasterCategory;
  priceRange: string;
  duration: number; // minutes
  isActive: boolean;
  defaultCycleDays: number | null;
  notificationTemplateId: string | null;
}

export type StaffRole = 'owner' | 'admin' | 'staff';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: '원장',
  admin: '관리자',
  staff: '스태프',
};

export const STAFF_ROLE_COLORS: Record<StaffRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
};

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  position: string;
  isActive: boolean;
  createdAt: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'export';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  login: '로그인',
  export: '내보내기',
};

export interface AuditLog {
  id: string;
  userName: string;
  action: AuditAction;
  target: string;
  detail: string;
  createdAt: string;
}

// ==========================================
// Notifications (알림관리)
// ==========================================

export type PatientTreatmentRow = Database['public']['Tables']['patient_treatments']['Row'];
export type PatientTreatmentInsert = Database['public']['Tables']['patient_treatments']['Insert'];
export type NotificationTemplateRow = Database['public']['Tables']['notification_templates']['Row'];
export type NotificationTemplateInsert = Database['public']['Tables']['notification_templates']['Insert'];
export type NotificationHistoryRow = Database['public']['Tables']['notification_history']['Row'];
export type NotificationHistoryInsert = Database['public']['Tables']['notification_history']['Insert'];

export type NotificationChannel = 'kakao' | 'sms' | 'call';

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  kakao: '카카오톡',
  sms: '문자',
  call: '전화',
};

export type NotificationSendStatus = 'sent' | 'failed' | 'skipped';

export const NOTIFICATION_STATUS_LABELS: Record<NotificationSendStatus, string> = {
  sent: '발송완료',
  failed: '실패',
  skipped: '건너뜀',
};

export const NOTIFICATION_STATUS_COLORS: Record<NotificationSendStatus, string> = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
};

export type TemplateType = 'aftercare' | 'revisit';

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  aftercare: '사후관리',
  revisit: '재방문 안내',
};

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

// ==========================================
// V2 Enhancement Types
// ==========================================

// Phase 1: Notification Send Result
export type NotificationSendResult = 'sent' | 'failed' | 'fallback_sms';

// Phase 2: CSV Import
export interface CsvColumnMapping {
  date: string;
  patientName: string;
  procedureName: string;
  category?: string;
  doctor: string;
  priceKrw: string;
  discountKrw?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
  batchId: string;
}

// Phase 3: Consultation Timeline
export type TimelineEventType =
  | 'status_change'
  | 'note_added'
  | 'callback_set'
  | 'assigned'
  | 'call_made'
  | 'tag_added'
  | 'budget_updated';

export interface ConsultationTimelineEntry {
  id: string;
  consultationId: string;
  eventType: TimelineEventType;
  description: string;
  actor: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  status_change: '상태 변경',
  note_added: '메모 추가',
  callback_set: '콜백 설정',
  assigned: '담당자 배정',
  call_made: '통화',
  tag_added: '태그 추가',
  budget_updated: '예산 수정',
};

export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  status_change: '🔄',
  note_added: '📝',
  callback_set: '📞',
  assigned: '👤',
  call_made: '☎️',
  tag_added: '🏷️',
  budget_updated: '💰',
};

// Phase 4: Inventory Burndown
export interface InventoryBurndown {
  itemId: string;
  name: string;
  currentStock: number;
  dailyRate: number;
  daysUntilEmpty: number;
  estimatedDate: string;
  severity: 'safe' | 'warning' | 'critical';
}

export interface CategorySummary {
  category: InventoryCategory;
  totalItems: number;
  totalValue: number;
  criticalCount: number;
  warningCount: number;
}

// Phase 5: Patient Profile
export interface PatientSearchResult {
  name: string;
  phone: string;
  treatmentCount: number;
  consultationCount: number;
  lastVisit: string;
  totalSpent: number;
}

export interface PatientProfile {
  patient: { name: string; phone: string };
  treatments: PatientTreatmentRow[];
  consultations: ConsultationRow[];
  notifications: NotificationHistoryRow[];
  revenue: {
    totalSpent: number;
    visitCount: number;
    avgPerVisit: number;
    procedures: { name: string; count: number; total: number }[];
  };
}
