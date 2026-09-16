import type { Metadata } from 'next';

import { RatesPage } from '@/components/rates-page';
import { getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: 'Lãi suất tiết kiệm',
  description:
    'So sánh lãi suất tiết kiệm VND theo ngân hàng, kỳ hạn và kênh gửi.',
};

export default async function InterestRatesPage() {
  return <RatesPage data={await getRates()} />;
}
