import { PricingGuide } from '@/components/sections';
import { getFxReference } from '@/lib/fxReference';

export default async function PricingPage() {
  // 참고 환산용 환율(하루 한 번). 받지 못하면 null → 환산 줄을 그리지 않는다.
  const fx = await getFxReference();
  return <PricingGuide fx={fx} />;
}
