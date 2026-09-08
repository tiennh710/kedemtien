'use client';

import Link from 'next/link';
import { CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { readJson } from '@/lib/client/api';

type Order = { status: string; delivery_status: string; amount_total: number };

export function PaymentStatus({ orderCode, cancelled = false }: { orderCode?: string; cancelled?: boolean }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderCode) && !cancelled);
  useEffect(() => {
    if (!orderCode || cancelled) return;
    let attempts = 0;
    const check = async () => { const response = await fetch(`/api/orders/status?orderCode=${encodeURIComponent(orderCode)}`); if (response.ok) { const data = await readJson<{ order: Order }>(response); setOrder(data.order); if (data.order.status === 'paid') { setLoading(false); return; } } attempts += 1; if (attempts < 12) setTimeout(check, 2500); else setLoading(false); };
    void check();
  }, [orderCode, cancelled]);
  const success = order?.status === 'paid';
  return <div className="min-h-screen bg-[#f7f8fc] px-4 py-16"><div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-[0_20px_70px_rgba(35,30,94,.1)] ring-1 ring-[#e0e1ea]">{cancelled ? <XCircle className="mx-auto size-14 text-[#b6574d]" /> : success ? <CheckCircle2 className="mx-auto size-14 text-[#078268]" /> : loading ? <Loader2 className="mx-auto size-14 animate-spin text-[#4635f3]" /> : <Clock3 className="mx-auto size-14 text-[#8a6a16]" />}<h1 className="mt-5 text-2xl font-extrabold">{cancelled ? 'Thanh toán đã hủy' : success ? 'Thanh toán thành công' : loading ? 'Đang xác nhận thanh toán' : 'Chưa nhận được xác nhận'}</h1><p className="mt-3 text-sm leading-6 text-[#6d6e80]">{cancelled ? 'Đơn chưa được thanh toán. Bạn có thể quay lại giỏ hàng khi sẵn sàng.' : success ? `Link tải đang được gửi qua email${order?.delivery_status === 'failed' ? ', nhưng email hiện gặp lỗi. Hãy đăng nhập để tải từ thư viện.' : '.'}` : 'PayOS có thể cần vài giây để gửi kết quả. Bạn cũng có thể kiểm tra email hoặc thư viện tài khoản.'}</p>{orderCode && <p className="mt-3 text-xs text-[#8c8d9d]">Mã đơn #{orderCode}</p>}<div className="mt-7 flex justify-center gap-2"><Link href="/" className="rounded-xl border border-[#dddee8] px-4 py-2.5 text-sm font-semibold">Về thư viện</Link><Link href="/tai-khoan" className="rounded-xl bg-[#4635f3] px-4 py-2.5 text-sm font-semibold text-white">Mở tài khoản</Link></div></div></div>;
}
