/**
 * 물품 표시명 반환. volume_cc가 있으면 "이름 Ncc" 형태로 반환.
 * 예: { name: '리쥬란 힐러', volume_cc: 2 } → '리쥬란 힐러 2cc'
 */
export function getDisplayName(item: { name: string; volume_cc?: number | null }): string {
  if (item.volume_cc && item.volume_cc > 0) {
    return `${item.name} ${item.volume_cc}cc`;
  }
  return item.name;
}
