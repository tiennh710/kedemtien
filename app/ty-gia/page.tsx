import type { Metadata } from 'next';

import { FxPage } from '@/components/fx-page';
import { getFxRates } from '@/lib/fx';

export const metadata: Metadata = {
  title: 'Tỷ giá ngoại tệ hôm nay',
  description: 'Tra cứu tỷ giá mua tiền mặt, mua chuyển khoản và bán ngoại tệ.',
};

export default async function ExchangeRatesPage() {
  return <FxPage data={await getFxRates()} />;
}
