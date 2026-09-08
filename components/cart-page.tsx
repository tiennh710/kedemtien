'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVnd } from '@/lib/catalog';

export function CartPage() {
  const { items, remove, clear } = useCart();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/auth/session').then((r) => r.json()).then((d) => d.user?.email && setEmail(d.user.email)).catch(() => undefined); }, []);
  const total = items.reduce((sum, item) => sum + item.priceVnd, 0);

  async function checkout(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, productIds: items.map((item) => item.id) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo đơn hàng.');
      if (data.kind === 'payos') { window.location.href = data.checkoutUrl; return; }
      clear();
      setMessage(data.delivery === 'sent' ? `Đã gửi link tải cho ${email}.` : 'Đơn miễn phí đã tạo. Email chưa gửi được; hãy đăng nhập để tải trong thư viện.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  }

  return <div className="min-h-screen bg-[#f7f8fc]"><SiteHeader compact /><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6c7f] hover:text-[#4635f3]"><ArrowLeft className="size-4" />Tiếp tục chọn mẫu</Link><h1 className="mt-6 text-3xl font-extrabold tracking-tight">Giỏ hàng của bạn</h1>
    {!items.length ? <div className="mt-8 rounded-3xl border border-dashed border-[#d7d8e3] bg-white p-12 text-center"><ShoppingBag className="mx-auto size-9 text-[#8d8ea0]" /><p className="mt-4 font-semibold">Giỏ hàng đang trống</p><Link href="/" className="mt-4 inline-flex rounded-xl bg-[#4635f3] px-4 py-2.5 text-sm font-semibold text-white">Xem thư viện</Link>{message && <p className="mt-4 text-sm text-[#4a38c2]">{message}</p>}</div> : <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="space-y-3">{items.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#e2e3eb]"><div className="grid size-16 shrink-0 place-items-center rounded-xl bg-[#ece9ff] font-bold text-[#4635f3]">XLSX</div><div className="min-w-0 flex-1"><Link href={`/san-pham/${item.slug}`} className="font-semibold hover:text-[#4635f3]">{item.title}</Link><p className={`mt-1 text-sm font-bold ${item.priceVnd === 0 ? 'text-[#078268]' : 'text-[#4635f3]'}`}>{formatVnd(item.priceVnd)}</p></div><Button onClick={() => remove(item.id)} variant="ghost" size="icon" aria-label={`Xóa ${item.title}`}><Trash2 /></Button></article>)}</section>
      <form onSubmit={checkout} className="h-fit rounded-3xl bg-white p-6 ring-1 ring-[#e0e1ea]"><h2 className="text-lg font-bold">Tóm tắt đơn</h2><div className="mt-4 flex justify-between text-sm text-[#696a7d]"><span>{items.length} sản phẩm</span><span>{formatVnd(total)}</span></div><div className="my-4 border-t border-[#e5e6ed]" /><div className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-[#4635f3]">{formatVnd(total)}</span></div><label className="mt-6 block text-sm font-semibold" htmlFor="checkout-email">Email nhận file</label><Input id="checkout-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 h-11" placeholder="ban@example.com" /><p className="mt-2 text-xs leading-5 text-[#7b7c8d]">Sản phẩm miễn phí không cần OTP. Link tải được gửi tới email này.</p><Button disabled={loading} type="submit" className="mt-5 h-11 w-full rounded-xl bg-[#4635f3]">{loading && <Loader2 className="animate-spin" />}{total === 0 ? 'Nhận file miễn phí' : 'Thanh toán qua PayOS'}</Button>{message && <p className="mt-3 text-sm text-[#b34a3b]">{message}</p>}</form></div>}
  </main></div>;
}
