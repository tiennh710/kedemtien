'use client';

import Link from 'next/link';
import { Download, FileSpreadsheet, Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog';
import { apiError, readJson } from '@/lib/client/api';

type Item = { order_item_id: number; title_snapshot: string; price_snapshot: number; order_code: number; paid_at: number; original_filename: string; size_bytes: number; version: number };
type AccountData = { user: { email: string; isAdmin: boolean }; items: Item[] };

export function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  useEffect(() => { fetch('/api/account').then(async (response) => { const body = await readJson<AccountData | { error?: string }>(response); if (response.status === 401) { window.location.assign('/dang-nhap?returnTo=/tai-khoan'); return; } if (!response.ok || !('user' in body)) throw new Error(apiError(body, 'Không thể tải thư viện.')); setData(body); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Không thể tải thư viện.')); }, []);

  async function download(orderItemId: number) {
    setDownloading(orderItemId); setError('');
    try { const response = await fetch('/api/account/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderItemId }) }); const body = await readJson<{ url?: string; error?: string }>(response); if (!response.ok || !body.url) throw new Error(apiError(body, 'Không thể tạo link tải.')); window.location.assign(body.url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải file.'); }
    finally { setDownloading(null); }
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }

  return <div className="min-h-screen bg-[#f7f8fc]"><SiteHeader compact /><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#4635f3]">THƯ VIỆN CỦA TÔI</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">File Excel đã sở hữu</h1><p className="mt-2 text-sm text-[#717284]">{data?.user.email}</p></div><div className="flex gap-2">{data?.user.isAdmin && <Link href="/admin" className="rounded-xl bg-[#ece9ff] px-4 py-2.5 text-sm font-semibold text-[#4635f3]">Trang quản trị</Link>}<Button onClick={logout} variant="outline" className="h-10 bg-white"><LogOut />Đăng xuất</Button></div></div>
    {!data && !error && <div className="mt-12 flex items-center justify-center text-sm text-[#737487]"><Loader2 className="mr-2 animate-spin" />Đang tải thư viện...</div>}{error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{data && !data.items.length && <div className="mt-8 rounded-3xl border border-dashed border-[#d7d8e3] bg-white p-12 text-center"><FileSpreadsheet className="mx-auto size-9 text-[#9293a4]" /><p className="mt-4 font-semibold">Bạn chưa có file nào</p><Link href="/" className="mt-4 inline-flex rounded-xl bg-[#4635f3] px-4 py-2.5 text-sm font-semibold text-white">Khám phá thư viện</Link></div>}
    {data && data.items.length > 0 && <div className="mt-8 grid gap-3">{data.items.map((item) => <article key={item.order_item_id} className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#e1e2eb] sm:flex-row sm:items-center"><div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#ece9ff] text-[#4635f3]"><FileSpreadsheet /></div><div className="min-w-0 flex-1"><h2 className="font-semibold">{item.title_snapshot}</h2><p className="mt-1 text-xs text-[#797a8c]">{item.original_filename} • Phiên bản {item.version} • Đơn #{item.order_code}</p></div><div className="sm:text-right"><p className="text-sm font-bold text-[#4635f3]">{formatVnd(item.price_snapshot)}</p><Button disabled={downloading === item.order_item_id} onClick={() => download(item.order_item_id)} size="sm" className="mt-2 bg-[#4635f3]"><Download />Tải file</Button></div></article>)}</div>}
  </main></div>;
}
