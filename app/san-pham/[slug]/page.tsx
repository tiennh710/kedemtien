import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { ProductActions } from '@/components/product-actions';
import { ProductCover } from '@/components/product-cover';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { formatVnd } from '@/lib/catalog';
import { getProductBySlug } from '@/lib/server/database';

export const dynamic = 'force-dynamic';

const getProduct = cache(getProductBySlug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: 'Không tìm thấy sản phẩm' };
  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: { title: product.title, description: product.shortDescription, images: product.coverUrl ? [product.coverUrl] : [] },
    twitter: { card: 'summary_large_image', title: product.title, description: product.shortDescription, images: product.coverUrl ? [product.coverUrl] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#17172a]">
      <SiteHeader compact />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#696a7d] hover:text-[#4635f3]"><ArrowLeft className="size-4" />Quay lại thư viện</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
          <section>
            <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-[#e0e1eb] bg-white p-3 shadow-sm"><div className="h-full overflow-hidden rounded-2xl"><ProductCover product={product} className="p-10 [&_p]:text-4xl" /></div></div>
            {product.galleryUrls.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{product.galleryUrls.slice(1).map((url) => <div key={url} className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#e1e2eb]"><Image src={url} alt={`Ảnh chi tiết ${product.title}`} fill sizes="25vw" className="object-cover" unoptimized /></div>)}</div>}
          </section>
          <section className="lg:pt-3">
            <Badge variant="secondary" className="bg-[#ece9ff] text-[#4a38c2]">{product.category}</Badge>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-4xl">{product.title}</h1>
            <p className="mt-4 text-base leading-7 text-[#656679]">{product.shortDescription}</p>
            <p className={`mt-6 text-3xl font-extrabold ${product.priceVnd === 0 ? 'text-[#078268]' : 'text-[#4635f3]'}`}>{formatVnd(product.priceVnd)}</p>
            <div className="mt-6"><ProductActions product={product} /></div>
            <div className="mt-7 grid gap-3 rounded-2xl border border-[#e0e1ea] bg-white p-5 text-sm">
              <div className="flex gap-3"><FileSpreadsheet className="mt-0.5 size-5 text-[#4635f3]" /><div><p className="font-semibold">File Excel .xlsx</p><p className="text-[#77788b]">{product.filename ?? 'File sẽ hiển thị khi admin upload'}{product.version ? ` • Phiên bản ${product.version}` : ''}</p></div></div>
              <div className="flex gap-3"><Download className="mt-0.5 size-5 text-[#4635f3]" /><div><p className="font-semibold">Tải xuống ngay</p><p className="text-[#77788b]">Link email 7 ngày hoặc tải lại trong thư viện tài khoản.</p></div></div>
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#4635f3]" /><div><p className="font-semibold">Quyền sử dụng rõ ràng</p><p className="text-[#77788b]">{product.licenseNote}</p></div></div>
            </div>
          </section>
        </div>
        <section className="mt-12 max-w-3xl rounded-3xl bg-white p-6 ring-1 ring-[#e3e4ed] sm:p-8"><h2 className="text-2xl font-bold tracking-tight">Thông tin sản phẩm</h2><p className="mt-4 whitespace-pre-line leading-7 text-[#5f6073]">{product.description}</p><div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#078268]"><CheckCircle2 className="size-5" />Giá được xác nhận lại trước khi thanh toán</div></section>
      </main>
    </div>
  );
}
