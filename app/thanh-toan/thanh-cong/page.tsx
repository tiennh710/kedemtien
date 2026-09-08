import { PaymentStatus } from '@/components/payment-status';

export const metadata = { title: 'Kết quả thanh toán' };

export default async function Page({ searchParams }: { searchParams: Promise<{ orderCode?: string }> }) { return <PaymentStatus orderCode={(await searchParams).orderCode} />; }
