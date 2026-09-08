import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
      <section className="w-full max-w-lg rounded-3xl border border-[#e1e2eb] bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#efedff] text-[#4635f3]">
          <FileQuestion className="size-6" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#6d5cf5]">Lỗi 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17172a]">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7083]">Liên kết có thể đã thay đổi hoặc sản phẩm chưa được xuất bản.</p>
        <Link href="/" className={buttonVariants({ className: 'mt-6 rounded-xl bg-[#4635f3] hover:bg-[#3828db]' })}>
          <ArrowLeft className="size-4" />Về thư viện
        </Link>
      </section>
    </main>
  );
}
