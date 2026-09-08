'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3, BriefcaseBusiness, Calculator, ChevronRight, FolderKanban, LayoutDashboard, Search, ShoppingBag, Sparkles, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { ProductCover } from '@/components/product-cover';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CatalogProduct } from '@/lib/catalog';
import { formatVnd } from '@/lib/catalog';

const categoryIcons = [LayoutDashboard, WalletCards, BriefcaseBusiness, Calculator, FolderKanban, BarChart3];

export function Marketplace({ products }: { products: CatalogProduct[] }) {
  const { add, has } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const categories = useMemo(() => Array.from(new Map(products.map((product) => [product.categorySlug, product.category])).entries()), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.title} ${product.shortDescription} ${product.category}`.toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN'));
    const matchesCategory = category === 'all' || product.categorySlug === category;
    const matchesPrice = priceFilter === 'all' || (priceFilter === 'free' ? product.priceVnd === 0 : product.priceVnd > 0);
    return matchesSearch && matchesCategory && matchesPrice;
  }), [products, search, category, priceFilter]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#17172a]">
      <SiteHeader />
      <div className="mx-auto grid max-w-[1560px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="sticky top-17 hidden h-[calc(100vh-4.25rem)] border-r border-[#e6e7ef] bg-white px-4 py-7 lg:block">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9bad]">Khám phá</p>
          <nav className="mt-3 space-y-1" aria-label="Danh mục sản phẩm">
            {[['all', 'Tất cả mẫu'] as const, ...categories].map(([slug, name], index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return <button type="button" onClick={() => setCategory(slug)} key={slug} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${category === slug ? 'bg-[#efedff] text-[#4635f3]' : 'text-[#5f6073] hover:bg-[#f6f6fb] hover:text-[#27283a]'}`}><Icon className="size-4" />{name}</button>;
            })}
          </nav>
          <div className="mt-8 rounded-2xl bg-[#17172a] p-4 text-white">
            <Sparkles className="size-5 text-[#b8adff]" /><p className="mt-3 text-sm font-semibold">Cần một file riêng?</p><p className="mt-1 text-xs leading-5 text-white/60">Chọn một mẫu có sẵn hoặc gửi yêu cầu tư vấn.</p>
            <a href="mailto:hello@kedemtien.vn" className="mt-4 block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-[#17172a]">Gửi yêu cầu</a>
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#85869b]"><span>Trang chủ</span><ChevronRight className="size-3.5" /><span className="text-[#343548]">Mẫu Excel</span></div>
          <section className="relative overflow-hidden rounded-3xl bg-[#4635f3] px-6 py-8 text-white shadow-[0_24px_60px_rgba(70,53,243,.18)] sm:px-10 lg:flex lg:items-end lg:justify-between lg:px-12 lg:py-10">
            <div className="relative z-10 max-w-2xl"><Badge className="mb-4 bg-white/14 text-white ring-1 ring-white/20">THƯ VIỆN EXCEL THỰC CHIẾN</Badge><h1 className="text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl lg:text-[46px]">Làm ít hơn. <span className="text-[#c9c3ff]">Tính nhanh hơn.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base">Những mẫu Excel được thiết kế kỹ lưỡng cho tài chính, kinh doanh và quản lý — tải xuống và dùng ngay.</p></div>
            <Button onClick={() => document.querySelector('#san-pham')?.scrollIntoView({ behavior: 'smooth' })} className="relative z-10 mt-6 h-11 rounded-xl bg-white px-4 text-[#2f23b8] hover:bg-white/90 lg:mt-0">Khám phá bộ sưu tập<ArrowRight /></Button>
            <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border border-white/15" /><div className="pointer-events-none absolute right-20 top-16 size-24 rounded-full bg-white/5 blur-xl" />
          </section>

          <section id="san-pham" className="mt-8 scroll-mt-24">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6d5cf5]">Chọn đúng công cụ</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Mẫu dành cho bạn</h2></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#85869b]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-xl bg-white pl-9" placeholder="Tìm theo tên hoặc nhu cầu..." aria-label="Tìm kiếm mẫu Excel" /></div>
                <div className="flex gap-2 overflow-x-auto pb-1">{(['all', 'free', 'paid'] as const).map((value) => <Button key={value} onClick={() => setPriceFilter(value)} size="sm" variant={priceFilter === value ? 'default' : 'outline'} className={priceFilter === value ? 'rounded-full bg-[#4635f3] px-4' : 'rounded-full bg-white px-4'}>{value === 'all' ? 'Tất cả' : value === 'free' ? 'Miễn phí' : 'Trả phí'}</Button>)}</div>
              </div>
            </div>

            {filtered.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((product) => <article key={product.id} className="group overflow-hidden rounded-2xl border border-[#e3e4ec] bg-white p-2 shadow-[0_8px_28px_rgba(29,28,58,.045)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(45,40,110,.1)]">
                <Link href={`/san-pham/${product.slug}`} className="relative block aspect-[16/10] overflow-hidden rounded-xl"><ProductCover product={product} /><span className="absolute right-3 top-3 rounded-full bg-white/82 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.1em] text-[#45465a] shadow-sm backdrop-blur">{product.demo ? 'SẢN PHẨM MẪU' : product.priceVnd === 0 ? 'MIỄN PHÍ' : 'XLSX'}</span></Link>
                <div className="px-2 pb-2 pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b8c9d]">{product.category}</p><Link href={`/san-pham/${product.slug}`} className="mt-1 block line-clamp-1 text-[15px] font-semibold text-[#222336] hover:text-[#4635f3]">{product.title}</Link><div className="mt-3 flex items-center justify-between"><span className={`text-sm font-bold ${product.priceVnd === 0 ? 'text-[#078268]' : 'text-[#4635f3]'}`}>{formatVnd(product.priceVnd)}</span><Button disabled={Boolean(product.demo) || has(product.id)} onClick={() => add({ id: product.id, slug: product.slug, title: product.title, priceVnd: product.priceVnd, coverTone: product.coverTone })} size="icon-sm" variant="ghost" className="rounded-full text-[#56576b]" aria-label={`Thêm ${product.title} vào giỏ`}><ShoppingBag /></Button></div></div>
              </article>)}
            </div> : <div className="mt-5 rounded-2xl border border-dashed border-[#d7d8e4] bg-white p-12 text-center"><p className="font-semibold">Chưa tìm thấy mẫu phù hợp</p><p className="mt-1 text-sm text-[#77788c]">Hãy thử từ khóa hoặc bộ lọc khác.</p></div>}
            {products.some((product) => product.demo) && <div className="mt-6 rounded-2xl border border-[#dcd8ff] bg-[#f1efff] px-5 py-4 text-sm text-[#4c3bbd]"><strong>Đây là dữ liệu minh họa.</strong> Đăng nhập bằng email admin để upload sản phẩm `.xlsx` thật; dữ liệu mẫu sẽ tự ẩn khi có sản phẩm được xuất bản.</div>}
          </section>

          <section className="mt-12 grid overflow-hidden rounded-3xl bg-[#17172a] text-white lg:grid-cols-2">
            <div className="flex flex-col justify-center p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#afa6ff]">KẺ ĐẾM TIỀN</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Biến bảng tính thành lợi thế công việc</h2><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Mỗi mẫu tập trung giải quyết một việc cụ thể, có ảnh xem trước, mô tả rõ ràng và file được giao an toàn sau thanh toán.</p></div>
            <Image
              src="/og.png"
              alt="Kẻ Đếm Tiền — Mẫu Excel thực chiến"
              width={1200}
              height={630}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full min-h-56 w-full object-cover"
              unoptimized
            />
          </section>

          <footer className="mt-10 flex flex-col gap-4 border-t border-[#e2e3eb] py-7 text-xs text-[#747587] sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Kẻ Đếm Tiền. Mẫu Excel thực chiến.</p><nav className="flex flex-wrap gap-4"><Link href="/dieu-khoan">Điều khoản</Link><Link href="/rieng-tu">Riêng tư</Link><Link href="/ban-quyen">Bản quyền</Link><Link href="/hoan-tien">Hoàn tiền</Link></nav></footer>
        </main>
      </div>
    </div>
  );
}
