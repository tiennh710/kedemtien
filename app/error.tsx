'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
      <section className="w-full max-w-lg rounded-3xl border border-[#e1e2eb] bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff0ed] text-[#c9472f]">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#17172a]">Có lỗi xảy ra</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7083]">Trang chưa thể tải đúng lúc này. Bạn có thể thử lại mà không mất nội dung trong giỏ hàng.</p>
        <Button onClick={reset} className="mt-6 rounded-xl bg-[#4635f3] hover:bg-[#3828db]">
          <RotateCcw className="size-4" />Thử lại
        </Button>
      </section>
    </main>
  );
}
