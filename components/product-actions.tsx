'use client';

import Link from 'next/link';
import { Check, ShoppingBag } from 'lucide-react';

import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import type { CatalogProduct } from '@/lib/catalog';

export function ProductActions({ product }: { product: CatalogProduct }) {
  const { add, has } = useCart();
  const inCart = has(product.id);
  if (product.demo) return <div className="rounded-xl bg-[#f1efff] px-4 py-3 text-sm font-medium text-[#5140c4]">Đây là sản phẩm minh họa. Hãy upload file thật trong trang quản trị để mở bán.</div>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button onClick={() => add({ id: product.id, slug: product.slug, title: product.title, priceVnd: product.priceVnd, coverTone: product.coverTone })} disabled={inCart} className="h-11 rounded-xl bg-[#4635f3] hover:bg-[#3929d7]">
        {inCart ? <Check /> : <ShoppingBag />}{inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ'}
      </Button>
      <Link href="/gio-hang" className="flex h-11 items-center justify-center rounded-xl border border-[#dcdde8] bg-white px-4 text-sm font-semibold hover:bg-[#f7f8fc]">Đi tới giỏ hàng</Link>
    </div>
  );
}
