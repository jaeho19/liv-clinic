/**
 * 화장품 초기 재고 시딩 스크립트
 * 실행: npx tsx seed-cosmetics.ts
 *
 * /api/admin/inventory POST API를 호출하여 화장품 아이템을 등록합니다.
 * 이미 등록된 경우 중복 등록 주의.
 */

const BASE_URL = 'http://localhost:3000';

const COSMETICS_ITEMS = [
  { name: '마데카MD 로션 100g', category: 'cosmetics', sub_category: 'lotion', specification: '100g', unit: '개', current_stock: 15, min_stock: 3 },
  { name: '마데카MD 로션 200g', category: 'cosmetics', sub_category: 'lotion', specification: '200g', unit: '개', current_stock: 19, min_stock: 3 },
  { name: '마데카MD 크림 250g', category: 'cosmetics', sub_category: 'cream', specification: '250g', unit: '개', current_stock: 20, min_stock: 3 },
  { name: 'EGF 재생크림 50ml', category: 'cosmetics', sub_category: 'cream', specification: '50ml', unit: '개', current_stock: 17, min_stock: 3 },
  { name: '베리덤 쉴드 MD크림 35g', category: 'cosmetics', sub_category: 'cream', specification: '35g', unit: '개', current_stock: 11, min_stock: 3 },
  { name: '베리덤 쉴드 MD크림 80g', category: 'cosmetics', sub_category: 'cream', specification: '80g', unit: '개', current_stock: 19, min_stock: 3 },
  { name: '하라셀 수분 Set', category: 'cosmetics', sub_category: 'set', unit: '세트', current_stock: 3, min_stock: 1 },
  { name: '하라셀 프리미엄 Set', category: 'cosmetics', sub_category: 'set', unit: '세트', current_stock: 4, min_stock: 1 },
  { name: '시트팩 증정용', category: 'cosmetics', sub_category: 'mask', unit: '장', current_stock: 180, min_stock: 20 },
];

async function seed() {
  console.log('=== 화장품 초기 재고 시딩 시작 ===\n');

  for (const item of COSMETICS_ITEMS) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`OK  ${item.name} (재고: ${item.current_stock}${item.unit}) - ID: ${data.id || 'created'}`);
      } else {
        const err = await res.json();
        console.log(`ERR ${item.name}: ${err.error}`);
      }
    } catch (e) {
      console.log(`ERR ${item.name}: ${e}`);
    }
  }

  console.log('\n=== 시딩 완료 ===');
}

seed();
