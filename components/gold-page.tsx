'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  ChevronRight,
  Clock3,
  Coins,
  ExternalLink,
  Gem,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import type { GoldData } from '@/lib/gold';

const vnd = new Intl.NumberFormat('vi-VN');

function formatPrice(value: number) {
  return `${vnd.format(value)} đ`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function GoldPage({ data }: { data: GoldData }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedId, setSelectedId] = useState(data.prices[0]?.id ?? '');
  const selected =
    data.prices.find((item) => item.id === selectedId) ?? data.prices[0];
  const bestBuy = useMemo(
    () =>
      data.prices.reduce(
        (best, item) => (item.buy > best.buy ? item : best),
        data.prices[0],
      ),
    [data.prices],
  );
  const bestSell = useMemo(
    () =>
      data.prices.reduce(
        (best, item) => (item.sell < best.sell ? item : best),
        data.prices[0],
      ),
    [data.prices],
  );
  const averageSpread = data.prices.length
    ? data.prices.reduce((total, item) => total + item.sell - item.buy, 0) /
      data.prices.length
    : 0;

  return (
    <div className="min-h-screen bg-[#f8f8f5] text-[#17172a]">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#85869b]">
          <Link href="/">Trang chủ</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-[#343548]">Giá vàng</span>
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b2415] via-[#17140e] to-[#332813] px-6 py-9 text-white shadow-[0_24px_60px_rgba(77,56,17,.18)] sm:px-10 lg:px-12">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f3c95b]/12 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-[#f5d77f]">
              <Sparkles className="size-3.5" /> DỮ LIỆU GIÁ VÀNG SJC
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl lg:text-[46px]">
              Giá vàng hôm nay
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              So sánh giá mua vào, bán ra và chênh lệch vàng miếng SJC từ các
              thương hiệu lớn. Đơn vị: đồng/lượng.
            </p>
          </div>
          <Coins
            className="pointer-events-none absolute -right-5 -top-8 size-60 rotate-12 text-[#f3c95b]/8"
            strokeWidth={1}
          />
        </section>

        {data.prices.length ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-[#ece5d5] bg-white p-5 shadow-[0_10px_34px_rgba(64,47,16,.05)] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#fff7dd] text-[#a36e00]">
                    <ArrowUp className="size-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#999080]">
                    Bán lại tốt nhất
                  </span>
                </div>
                <p className="mt-5 text-2xl font-black tracking-tight text-[#9a6700]">
                  {formatPrice(bestBuy.buy)}
                </p>
                <p className="mt-1 text-sm font-semibold">{bestBuy.brand}</p>
                <p className="mt-3 text-xs text-[#858174]">
                  Giá thương hiệu mua vào cao nhất
                </p>
              </article>
              <article className="rounded-3xl border border-[#ece5d5] bg-white p-5 shadow-[0_10px_34px_rgba(64,47,16,.05)] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#fff7dd] text-[#a36e00]">
                    <ArrowDown className="size-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#999080]">
                    Mua vào tốt nhất
                  </span>
                </div>
                <p className="mt-5 text-2xl font-black tracking-tight text-[#9a6700]">
                  {formatPrice(bestSell.sell)}
                </p>
                <p className="mt-1 text-sm font-semibold">{bestSell.brand}</p>
                <p className="mt-3 text-xs text-[#858174]">
                  Giá bán ra thấp nhất
                </p>
              </article>
              <article className="rounded-3xl bg-[#17140e] p-5 text-white shadow-[0_14px_40px_rgba(35,27,10,.14)] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-[#f2d374]">
                    <Scale className="size-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[.1em] text-white/45">
                    Chênh lệch TB
                  </span>
                </div>
                <p className="mt-5 text-2xl font-black tracking-tight text-[#f3d274]">
                  {formatPrice(averageSpread)}
                </p>
                <p className="mt-1 text-sm font-semibold">Mua — bán</p>
                <p className="mt-3 text-xs text-white/45">
                  Trung bình từ {data.prices.length} thương hiệu
                </p>
              </article>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
              <div className="overflow-hidden rounded-3xl border border-[#ece5d5] bg-white shadow-[0_10px_34px_rgba(64,47,16,.04)]">
                <div className="border-b border-[#f0ece2] p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[.13em] text-[#a36e00]">
                    Bảng giá
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Vàng miếng SJC theo thương hiệu
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead>
                      <tr className="bg-[#faf8f2] text-[11px] uppercase tracking-[.08em] text-[#847f72]">
                        <th className="px-5 py-4">Thương hiệu</th>
                        <th className="px-5 py-4">Mua vào</th>
                        <th className="px-5 py-4">Bán ra</th>
                        <th className="px-5 py-4">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.prices.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-[#f0ece2] hover:bg-[#fffdf8]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold">{item.brand}</p>
                            <p className="mt-1 max-w-52 truncate text-[11px] text-[#918c80]">
                              {item.product}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-[#08735a]">
                              {formatPrice(item.buy)}
                            </p>
                            <p className="mt-1 text-[10px] text-[#999489]">
                              Doanh nghiệp mua
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-[#b44e3a]">
                              {formatPrice(item.sell)}
                            </p>
                            <p className="mt-1 text-[10px] text-[#999489]">
                              Doanh nghiệp bán
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-[#4b493f]">
                              {formatPrice(item.sell - item.buy)}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-[#999489]">
                              <Clock3 className="size-3" />
                              {formatTime(item.observedAt)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ece5d5] bg-white p-5 shadow-[0_10px_34px_rgba(64,47,16,.04)] sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#fff7dd] text-[#a36e00]">
                    <Calculator className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-[#8c877a]">Công cụ</p>
                    <h2 className="font-bold">Tính giá giao dịch</h2>
                  </div>
                </div>
                <label
                  className="mt-6 block text-xs font-semibold text-[#59574f]"
                  htmlFor="gold-brand"
                >
                  Thương hiệu
                </label>
                <select
                  id="gold-brand"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[#dedbd2] bg-white px-3 text-sm outline-none focus:border-[#c99b2e]"
                >
                  {data.prices.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand}
                    </option>
                  ))}
                </select>
                <label
                  className="mt-4 block text-xs font-semibold text-[#59574f]"
                  htmlFor="gold-quantity"
                >
                  Số lượng
                </label>
                <div className="relative mt-2">
                  <Gem className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c877a]" />
                  <Input
                    id="gold-quantity"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Math.max(0, Number(event.target.value)))
                    }
                    className="h-11 rounded-xl pl-10 pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#777368]">
                    lượng
                  </span>
                </div>
                {selected && (
                  <div className="mt-5 space-y-2 rounded-2xl bg-[#faf8f2] p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#777368]">
                        Nếu bán cho thương hiệu
                      </span>
                      <strong className="text-[#08735a]">
                        {formatPrice(selected.buy * quantity)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#777368]">
                        Nếu mua từ thương hiệu
                      </span>
                      <strong className="text-[#b44e3a]">
                        {formatPrice(selected.sell * quantity)}
                      </strong>
                    </div>
                    <div className="mt-3 border-t border-[#e7e1d4] pt-3 text-xs leading-5 text-[#898477]">
                      Giá tham khảo theo {quantity} lượng, chưa bao gồm phí hoặc
                      điều kiện riêng.
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-[1fr_1.5fr]">
              <div className="rounded-3xl bg-gradient-to-br from-[#b77d06] to-[#d6a631] p-6 text-white sm:p-8">
                <ShieldCheck className="size-8 text-[#fff2bd]" />
                <h2 className="mt-5 text-2xl font-extrabold">
                  Giá mua và giá bán khác nhau
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/78">
                  Giá mua vào là mức doanh nghiệp trả khi bạn bán vàng. Giá bán
                  ra là số tiền bạn trả khi mua vàng. Khoảng chênh lệch là chi
                  phí cần bù trước khi giao dịch có lãi.
                </p>
              </div>
              <div className="rounded-3xl border border-[#ece5d5] bg-white p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[.13em] text-[#a36e00]">
                  Nguồn dữ liệu
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">
                  Cập nhật tự động từ taichinh.com
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6f6c64]">
                  Trang làm mới dữ liệu mỗi 15 phút. Mỗi dòng giữ nguyên thương
                  hiệu, tên sản phẩm và thời điểm quan sát do API cung cấp.
                </p>
                <a
                  href="https://taichinh.com/api/v1/gold"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17140e] px-4 py-2.5 text-sm font-bold text-white"
                >
                  Xem API nguồn <ExternalLink className="size-4" />
                </a>
              </div>
            </section>
          </>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-[#ddd7c8] bg-white p-12 text-center">
            <Coins className="mx-auto size-9 text-[#b28a30]" />
            <h2 className="mt-4 font-bold">Chưa có dữ liệu giá vàng</h2>
            <p className="mt-2 text-sm text-[#7d796f]">
              Nguồn dữ liệu đang được cập nhật. Vui lòng thử lại sau.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-[#e8dfca] bg-[#fffaf0] px-5 py-4 text-xs leading-5 text-[#716a5b]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#ae7a0a]" />
          <p>
            Giá vàng chỉ mang tính tham khảo và có thể thay đổi trong ngày. Hãy
            xác nhận trực tiếp với thương hiệu trước khi giao dịch.
          </p>
        </div>
      </main>
    </div>
  );
}
