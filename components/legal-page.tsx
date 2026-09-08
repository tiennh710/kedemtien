import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7f8fc]"><SiteHeader compact /><main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><Link href="/" className="text-sm font-semibold text-[#4635f3]">← Về trang chủ</Link><article className="mt-6 rounded-3xl bg-white p-7 ring-1 ring-[#e0e1ea] sm:p-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#7b6cf7]">BẢN NHÁP CẦN DUYỆT</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 text-sm text-[#858697]">Cập nhật: {updated}</p><div className="legal-copy mt-8 space-y-6 text-[15px] leading-7 text-[#555669]">{children}</div></article></main></div>;
}
