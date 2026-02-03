import type { RoomConfig, RoomType } from '@/types/admin';

// ──────────────────────────────────────────────────────────
// 방 유형별 색상 (레퍼런스 이미지 기반)
// ──────────────────────────────────────────────────────────
// 파란색 → recovery  = 관리실
// 회색   → procedure = 시술실
// 핑크   → consultation = 상담실
// 초록색 → anesthesia = 포토실
// 아이보리 → office   = 텍스트 없음

export const ROOM_TYPE_COLORS: Record<RoomType, { bg: string; border: string; text: string }> = {
  recovery:     { bg: '#93b4e0', border: '#7a9cc8', text: '#ffffff' },
  procedure:    { bg: '#b0b0b4', border: '#8e8e94', text: '#ffffff' },
  consultation: { bg: '#e8a0a0', border: '#d08080', text: '#ffffff' },
  anesthesia:   { bg: '#8fd4b4', border: '#6cba98', text: '#ffffff' },
  office:       { bg: '#ede4d4', border: '#ddd4c4', text: '#c0b8a8' },
  waiting:      { bg: '#ede4d4', border: '#ddd4c4', text: '#c0b8a8' },
  utility:      { bg: '#ede4d4', border: '#ddd4c4', text: '#c0b8a8' },
};

// ──────────────────────────────────────────────────────────
// 평면도 이미지 기반 좌표 (floormap-color.png: 2208 × 1952 px)
// ──────────────────────────────────────────────────────────
// bounds: { x, y, width, height } — 모두 이미지 대비 % 단위
// 원본 픽셀 좌표는 connected-components 분석으로 자동 탐지

const IMG_W = 2208;
const IMG_H = 1952;

/** 픽셀 → % 변환 헬퍼 */
function pxToPct(xMin: number, yMin: number, w: number, h: number) {
  return {
    x: +(xMin / IMG_W * 100).toFixed(2),
    y: +(yMin / IMG_H * 100).toFixed(2),
    width: +(w / IMG_W * 100).toFixed(2),
    height: +(h / IMG_H * 100).toFixed(2),
  };
}

export const ROOM_CONFIGS: RoomConfig[] = [

  // ═══ TOP ROW ═══════════════════════════════════════════

  // 파란색 — 관리실 1 (상단 좌측, 넓고 짧은 블록)
  { id: 'mgmt-1',  name: '관리실 1',  type: 'recovery',
    bounds: pxToPct(93, 52, 309, 150) },

  // 파란색 — 관리실 2, 3 (상단 세로 긴 블록)
  { id: 'mgmt-2',  name: '관리실 2',  type: 'recovery',
    bounds: pxToPct(531, 52, 225, 328) },
  { id: 'mgmt-3',  name: '관리실 3',  type: 'recovery',
    bounds: pxToPct(772, 52, 225, 328) },

  // 아이보리 — 상단 중앙
  { id: 'space-1',  name: '',  type: 'office',
    bounds: pxToPct(1012, 52, 249, 258) },
  { id: 'space-2',  name: '',  type: 'office',
    bounds: pxToPct(1277, 52, 246, 327) },

  // 회색 — 시술실 4 (상단 우측 큰 회색)
  { id: 'proc-4',  name: '시술실 4',  type: 'procedure',
    bounds: pxToPct(1533, 52, 315, 327) },

  // 아이보리 — 상단 우측 끝
  { id: 'space-3',  name: '',  type: 'office',
    bounds: pxToPct(1862, 204, 216, 257) },

  // ═══ LEFT COLUMN (관리실 4–8) ═══════════════════════════

  { id: 'mgmt-4',  name: '관리실 4',  type: 'recovery',
    bounds: pxToPct(88, 235, 311, 150) },
  { id: 'mgmt-5',  name: '관리실 5',  type: 'recovery',
    bounds: pxToPct(88, 419, 310, 150) },
  { id: 'mgmt-6',  name: '관리실 6',  type: 'recovery',
    bounds: pxToPct(88, 592, 310, 151) },
  { id: 'mgmt-7',  name: '관리실 7',  type: 'recovery',
    bounds: pxToPct(92, 770, 310, 150) },
  { id: 'mgmt-8',  name: '관리실 8',  type: 'recovery',
    bounds: pxToPct(92, 949, 310, 150) },

  // 파란색 — 관리실 9 (좌측 하단 대형)
  { id: 'mgmt-9',  name: '관리실 9', type: 'recovery',
    bounds: pxToPct(93, 1131, 427, 270) },

  // ═══ CENTER GRAY — 시술실 (중앙 블록) ═══════════════════

  { id: 'proc-1',  name: '시술실 1',  type: 'procedure',
    bounds: pxToPct(677, 540, 387, 408) },
  { id: 'proc-2',  name: '시술실 2',  type: 'procedure',
    bounds: pxToPct(1090, 550, 225, 327) },
  { id: 'proc-3',  name: '시술실 3',  type: 'procedure',
    bounds: pxToPct(1330, 550, 228, 327) },

  // ═══ RIGHT COLUMN ═══════════════════════════════════════

  // 아이보리 — 우측 상단
  { id: 'space-4',  name: '',  type: 'office',
    bounds: pxToPct(1748, 519, 336, 276) },

  // 초록색 — 포토실
  { id: 'photo-1', name: '포토실',    type: 'anesthesia',
    bounds: pxToPct(1764, 873, 328, 128) },

  // 핑크 — 상담실 1, 2 (우측 수직)
  { id: 'cons-1',  name: '상담실 1',  type: 'consultation',
    bounds: pxToPct(1757, 1018, 326, 211) },
  { id: 'cons-2',  name: '상담실 2',  type: 'consultation',
    bounds: pxToPct(1764, 1251, 327, 212) },

  // ═══ CENTER-LOWER (아이보리 + 상담실 3) ═════════════════

  { id: 'space-5',  name: '',  type: 'office',
    bounds: pxToPct(1089, 906, 225, 192) },
  { id: 'space-6',  name: '',  type: 'office',
    bounds: pxToPct(1330, 906, 219, 376) },
  { id: 'space-7',  name: '',  type: 'office',
    bounds: pxToPct(689, 976, 311, 201) },
  { id: 'space-8',  name: '',  type: 'office',
    bounds: pxToPct(1138, 1124, 185, 158) },

  // 핑크 — 상담실 3 (중앙 하단)
  { id: 'cons-3',  name: '상담실 3',  type: 'consultation',
    bounds: pxToPct(689, 1195, 316, 271) },

  // ═══ BOTTOM LEFT ════════════════════════════════════════

  { id: 'space-9',  name: '',  type: 'office',
    bounds: pxToPct(92, 1418, 429, 352) },
];

// 방 유형별 필터 헬퍼
export function getRoomsByType(type: RoomConfig['type']): RoomConfig[] {
  return ROOM_CONFIGS.filter((r) => r.type === type);
}
