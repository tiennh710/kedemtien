import type { Metadata } from 'next';

import { GoldPage } from '@/components/gold-page';
import { getGoldPrices } from '@/lib/gold';

export const metadata: Metadata = {
  title: 'Giá vàng hôm nay',
  description: 'So sánh giá mua vào, bán ra vàng miếng SJC theo thương hiệu.',
};

export default async function GoldPricePage() {
  return <GoldPage data={await getGoldPrices()} />;
}
