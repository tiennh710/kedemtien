import { PaymentStatus } from '@/components/payment-status';

export const metadata = { title: 'Đã hủy thanh toán' };

export default async function Page({ searchParams }: { searchParams: Promise<{ orderCode?: string }> }) { return <PaymentStatus orderCode={(await searchParams).orderCode} cancelled />; }
