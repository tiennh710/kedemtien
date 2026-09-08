'use client';

import Link from 'next/link';
import { FileSpreadsheet, Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';

type User = { email: string; isAdmin: boolean } | null;

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { items } = useCart();
  const [user, setUser] = useState<User>(null);
  useEffect(() => {
    fetch('/api/auth/session').then((response) => response.json()).then((data) => setUser(data.user ?? null)).catch(() => undefined);
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e8f1] bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-[1560px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {!compact && <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở danh mục"><Menu /></Button>}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[#4635f3] text-white shadow-[0_8px_22px_rgba(70,53,243,.25)]"><FileSpreadsheet className="size-5" strokeWidth={2.2} /></span>
          <span className="text-[15px] font-extrabold tracking-[-0.025em] sm:text-base">KẺ ĐẾM <span className="text-[#4635f3]">TIỀN</span></span>
        </Link>
        <Link href="/#san-pham" className="ml-auto hidden items-center gap-2 rounded-xl bg-[#f7f8fc] px-3 py-2 text-sm text-[#77788c] transition hover:text-[#4635f3] md:flex lg:ml-8 lg:w-full lg:max-w-md">
          <Search className="size-4" />
          Tìm mẫu Excel...
        </Link>
        <nav className="ml-auto flex items-center gap-1 md:ml-0" aria-label="Tài khoản và giỏ hàng">
          {user?.isAdmin && <Link href="/admin" className="hidden rounded-lg px-2.5 py-2 text-sm font-semibold text-[#4635f3] hover:bg-[#efedff] sm:block">Quản trị</Link>}
          <Link href={user ? '/tai-khoan' : '/dang-nhap'} className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-[#f5f5fa] sm:flex"><UserRound className="size-4" />{user ? 'Tài khoản' : 'Đăng nhập'}</Link>
          <Link href="/gio-hang" className="relative flex h-10 items-center gap-2 rounded-xl border border-[#e3e4ed] px-3 text-sm font-medium hover:bg-[#f7f8fc]">
            <ShoppingBag className="size-4" /><span className="hidden sm:inline">Giỏ hàng</span><span className="grid size-5 place-items-center rounded-full bg-[#4635f3] text-[11px] font-bold text-white">{items.length}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
