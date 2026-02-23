import type { Database } from './supabase';

// ==========================================
// Events (이벤트)
// ==========================================

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type EventCategory = 'lifting' | 'antiaging' | 'laser' | 'skincare' | 'all';

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  laser: '레이저',
  skincare: '스킨케어',
  all: '전체',
};

export type EventStatus = 'active' | 'ended' | 'draft';

export function getEventStatusFromRow(event: EventRow): EventStatus {
  if (!event.is_published) return 'draft';
  const now = new Date();
  const endDate = new Date(event.end_date + 'T23:59:59');
  return now <= endDate ? 'active' : 'ended';
}

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
// Popups (팝업)
// ==========================================

export type PopupRow = Database['public']['Tables']['popups']['Row'];
export type PopupInsert = Database['public']['Tables']['popups']['Insert'];
export type PopupUpdate = Database['public']['Tables']['popups']['Update'];

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

// ==========================================
// Inventory (재고관리)
// ==========================================

export type InventoryCategory = 'device_tip' | 'injection' | 'thread' | 'consumable' | 'skincare' | 'medicine' | 'cosmetics' | 'sample';

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  device_tip: '장비 팁/카트리지',
  injection: '주사제',
  thread: '실리프팅',
  consumable: '소모품',
  skincare: '스킨케어',
  medicine: '약물/연고',
  cosmetics: '화장품',
  sample: '샘플 약물',
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
  // cosmetics (화장품)
  lotion: '로션',
  cream: '크림',
  serum: '앰플/세럼',
  set: '세트',
  mask: '마스크팩/시트팩',
  cosmetics_etc: '기타 화장품',
};

/** 화장품 카테고리에 해당하는 서브카테고리 목록 */
export const COSMETICS_SUBCATEGORIES = ['lotion', 'cream', 'serum', 'set', 'mask', 'cosmetics_etc'] as const;

/** 일반 재고 카테고리 (화장품 제외) */
export const GENERAL_INVENTORY_CATEGORIES: InventoryCategory[] = ['device_tip', 'injection', 'thread', 'consumable', 'skincare', 'medicine', 'sample'];

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
  is_refrigerated: boolean;
  volume_cc?: number;
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
  item?: InventoryItem;
}

export interface ProcedureRecipe {
  id: string;
  procedure_name: string;
  item_id: string;
  default_qty: number;
  note?: string;
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

export function getStockStatus(item: InventoryItem): InventoryStockStatus {
  if (item.current_stock <= 0) return 'out';
  if (item.current_stock <= item.min_stock) return 'low';
  return 'normal';
}

export const NURSE_OPTIONS = ['김지연', '김수정'] as const;
export const COSMETICS_STAFF_OPTIONS = ['최이연', '김태희'] as const;

export const PROCEDURE_NAMES = [
  '리쥬란 HB 시술',
  '리쥬란 힐러 시술',
  '리쥬란 아이 시술',
  '필러 시술 (볼벨라)',
  '필러 시술 (볼루마)',
  '필러 시술 (볼리프트)',
  '필러 시술 (볼룩스)',
  '필러 시술 (레스틸렌 DEFYNE)',
  '필러 시술 (레스틸렌 VOLYME)',
  '필러 시술 (레스틸렌 KYSSE)',
  '필러 시술 (레스틸렌 Vital)',
  '필러 시술 (레스틸렌 리프트)',
  '필러 시술 (벨로테로 소프트)',
  '필러 시술 (벨로테로 볼룸)',
  '필러 시술 (벨로테로 인텐스)',
  '필러 시술 (벨로테로 발란스)',
  '필러 시술 (벨로테로 리바이브)',
  '필러 시술 (뉴라미스 Silver)',
  '필러 시술 (뉴라미스 Volume)',
  '필러 시술 (뉴라미스 DEEP)',
  '필러 시술 (로리앙 no2)',
  '필러 시술 (로리앙 no4)',
  '필러 시술 (로리앙 no6)',
  '필러 시술 (큐티필 Fine)',
  '필러 시술 (순수필 100)',
  '보톡스 시술 (제오민)',
  '보톡스 시술 (하이톡스)',
  '보톡스 시술 (제테마더)',
  '보톡스 시술 (엘러간)',
  '써마지 FLX 600',
  '아이써마지',
  '스컬트라 시술',
  '쥬베룩 볼륨 시술',
  '쥬베룩 스킨부스터 시술',
] as const;

// ─── 시술 2단계 선택 체계 ─────────────────────
export type ProcedureCategoryId = 'lifting' | 'antiaging' | 'skinbooster';

export interface ProcedureOption {
  label: string;
  recipeName: string;
}

export interface ProcedureType {
  id: string;
  name: string;
  category: ProcedureCategoryId;
  options: ProcedureOption[];
}

export const PROCEDURE_CATEGORY_LABELS: Record<ProcedureCategoryId, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  skinbooster: '스킨부스터/기타',
};

export const PROCEDURE_CATALOG: ProcedureType[] = [
  // ─── 리프팅 ─────────────────
  {
    id: 'ulthera',
    name: '울쎄라 프라임',
    category: 'lifting',
    options: [],
  },
  {
    id: 'thermage',
    name: '써마지 FLX',
    category: 'lifting',
    options: [
      { label: '225샷 (눈가)', recipeName: '아이써마지' },
      { label: '600샷', recipeName: '써마지 FLX 600' },
    ],
  },
  {
    id: 'density',
    name: '덴서티',
    category: 'lifting',
    options: [],
  },
  {
    id: 'shurink',
    name: '슈링크',
    category: 'lifting',
    options: [],
  },
  // ─── 실리프팅 (브랜드별 분류) ─────
  {
    id: 'thread_aptos',
    name: '압토스 (APTOS)',
    category: 'lifting',
    options: [
      { label: 'visage', recipeName: '압토스 visage' },
      { label: 'light lift 500mm', recipeName: '압토스 light lift 500mm' },
      { label: 'light lift 250mm', recipeName: '압토스 light lift 250mm' },
    ],
  },
  {
    id: 'thread_mint',
    name: '민트실',
    category: 'lifting',
    options: [
      { label: '리프트업', recipeName: '민트실 리프트업' },
    ],
  },
  {
    id: 'thread_silhouette',
    name: '실루엣 소프트',
    category: 'lifting',
    options: [
      { label: '8콘', recipeName: '실루엣소프트 8콘' },
      { label: '12콘', recipeName: '실루엣소프트 12콘' },
    ],
  },
  {
    id: 'thread_neodoctor',
    name: '네오닥터 JAMBER',
    category: 'lifting',
    options: [
      { label: '23G×60', recipeName: '네오닥터 JAMBER 23G×60' },
      { label: '27G×50', recipeName: '네오닥터 JAMBER 27G×50' },
    ],
  },
  {
    id: 'thread_epiticon',
    name: '에피티콘',
    category: 'lifting',
    options: [
      { label: 'Thin', recipeName: '에피티콘 Thin' },
      { label: 'jamber 25G×50', recipeName: '에피티콘 jamber 25G×50' },
    ],
  },
  {
    id: 'thread_conseltina',
    name: '콘셀티나',
    category: 'lifting',
    options: [
      { label: '19×100', recipeName: '콘셀티나 19×100' },
      { label: '19×60', recipeName: '콘셀티나 19×60' },
      { label: '19×40', recipeName: '콘셀티나 19×40' },
    ],
  },
  // ─── 안티에이징 ─────────────
  {
    id: 'botox_xeomin',
    name: '보톡스 (제오민)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'botox_hutox',
    name: '보톡스 (하이톡스)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'botox_jetema',
    name: '보톡스 (제테마더)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'botox_allergan',
    name: '보톡스 (엘러간)',
    category: 'antiaging',
    options: [],
  },
  {
    id: 'filler_juvederm',
    name: '필러 (쥬비덤)',
    category: 'antiaging',
    options: [
      { label: '볼벨라', recipeName: '필러 시술 (볼벨라)' },
      { label: '볼루마', recipeName: '필러 시술 (볼루마)' },
      { label: '볼리프트', recipeName: '필러 시술 (볼리프트)' },
      { label: '볼룩스', recipeName: '필러 시술 (볼룩스)' },
    ],
  },
  {
    id: 'filler_restylane',
    name: '필러 (레스틸렌)',
    category: 'antiaging',
    options: [
      { label: 'DEFYNE', recipeName: '필러 시술 (레스틸렌 DEFYNE)' },
      { label: 'VOLYME', recipeName: '필러 시술 (레스틸렌 VOLYME)' },
      { label: 'KYSSE', recipeName: '필러 시술 (레스틸렌 KYSSE)' },
      { label: 'Vital', recipeName: '필러 시술 (레스틸렌 Vital)' },
      { label: '리프트', recipeName: '필러 시술 (레스틸렌 리프트)' },
    ],
  },
  {
    id: 'filler_belotero',
    name: '필러 (벨로테로)',
    category: 'antiaging',
    options: [
      { label: '소프트', recipeName: '필러 시술 (벨로테로 소프트)' },
      { label: '볼룸', recipeName: '필러 시술 (벨로테로 볼룸)' },
      { label: '인텐스', recipeName: '필러 시술 (벨로테로 인텐스)' },
      { label: '발란스', recipeName: '필러 시술 (벨로테로 발란스)' },
      { label: '리바이브', recipeName: '필러 시술 (벨로테로 리바이브)' },
    ],
  },
  {
    id: 'filler_domestic',
    name: '필러 (국산)',
    category: 'antiaging',
    options: [
      { label: '뉴라미스 Silver', recipeName: '필러 시술 (뉴라미스 Silver)' },
      { label: '뉴라미스 Volume', recipeName: '필러 시술 (뉴라미스 Volume)' },
      { label: '뉴라미스 DEEP', recipeName: '필러 시술 (뉴라미스 DEEP)' },
      { label: '로리앙 no2', recipeName: '필러 시술 (로리앙 no2)' },
      { label: '로리앙 no4', recipeName: '필러 시술 (로리앙 no4)' },
      { label: '로리앙 no6', recipeName: '필러 시술 (로리앙 no6)' },
      { label: '큐티필 Fine', recipeName: '필러 시술 (큐티필 Fine)' },
      { label: '순수필 100', recipeName: '필러 시술 (순수필 100)' },
    ],
  },
  // ─── 스킨부스터/기타 ────────
  {
    id: 'rejuran_hb',
    name: '리쥬란 HB',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'rejuran_healer',
    name: '리쥬란 힐러',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'rejuran_eye',
    name: '리쥬란 아이',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'sculptra',
    name: '스컬트라',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'juvelook_volume',
    name: '쥬베룩 볼륨',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'juvelook_skin',
    name: '쥬베룩 스킨부스터',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'rituo',
    name: '리투오',
    category: 'skinbooster',
    options: [],
  },
  {
    id: 'radiesse',
    name: '레디어스',
    category: 'skinbooster',
    options: [],
  },
];

/** 기존 PROCEDURE_NAMES(recipe name)와의 매핑 (하위 호환) */
export const PROCEDURE_RECIPE_MAP: Record<string, string> = {
  density: '덴서티',
  botox_xeomin: '보톡스 시술 (제오민)',
  botox_hutox: '보톡스 시술 (하이톡스)',
  botox_jetema: '보톡스 시술 (제테마더)',
  botox_allergan: '보톡스 시술 (엘러간)',
  rejuran_hb: '리쥬란 HB 시술',
  rejuran_healer: '리쥬란 힐러 시술',
  rejuran_eye: '리쥬란 아이 시술',
  sculptra: '스컬트라 시술',
  juvelook_volume: '쥬베룩 볼륨 시술',
  juvelook_skin: '쥬베룩 스킨부스터 시술',
  rituo: '리투오 시술',
  radiesse: '레디어스 시술',
};

export interface CategorySummary {
  category: InventoryCategory;
  totalItems: number;
  totalValue: number;
  criticalCount: number;
  warningCount: number;
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
  duration: number;
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
// Device Shot Tracking (샷 수 추적) - #2, #3-2
// ==========================================

export type DeviceType = 'ulthera' | 'shurink' | 'thermage';

export interface DeviceTipShot {
  id: string;
  item_id: string;
  tip_type: string;
  device_type: DeviceType;
  initial_shots: number;
  remaining_shots: number;
  is_active: boolean;
  registered_at: string;
  exhausted_at: string | null;
}

export interface DeviceShotLog {
  id: string;
  tip_id: string;
  shots_used: number;
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
  created_by?: string;
  created_at: string;
}

/** 장비별 팁 초기 샷 수 설정 */
export const DEVICE_INITIAL_SHOTS: Record<DeviceType, Record<string, number>> = {
  ulthera: {
    '1.5': 2400,
    '3.0': 2400,
    '4.5': 2400,
  },
  shurink: {
    '4.5': 20000,
    '3.0': 20000,
    '2.0': 20000,
    '1.5': 12000,
    'v슈링크': 15000,
    'S슈링크': 15000,
  },
  thermage: {
    '225': 225,
    '600': 600,
  },
};

// ==========================================
// Inventory Batches (배치별 유효기간) - #12, #20
// ==========================================

export interface InventoryBatch {
  id: string;
  item_id: string;
  batch_quantity: number;
  remaining_quantity: number;
  expiry_date: string | null;
  received_at: string;
  note?: string;
  created_at: string;
}
