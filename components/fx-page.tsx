'use client';

import Link from 'next/link';
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  Calculator,
  ChevronRight,
  Clock3,
  ExternalLink,
  Info,
  Landmark,
  Search,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import type { FxData } from '@/lib/fx';

const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

function formatTime(value: string | null) {
  if (!value) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function FxPage({ data }: { data: FxData }) {
  const [query, setQuery] = useState('');
  const [code, setCode] = useState(data.rates[0]?.code ?? 'USD');
  const [amount, setAmount] = useState(1000);
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const selected =
    data.rates.find((item) => item.code === code) ?? data.rates[0];
  const filtered = useMemo(
    () =>
      data.rates.filter((item) =>
        `${item.code} ${item.name}`
          .toLocaleLowerCase('vi-VN')
          .includes(query.toLocaleLowerCase('vi-VN')),
      ),
    [data.rates, query],
  );
  const converted = selected
    ? amount *
      (direction === 'buy'
        ? selected.sell
        : (selected.transferBuy ?? selected.cashBuy ?? 0))
    : 0;
  const usd = data.rates.find((item) => item.code === 'USD');
  const eur = data.rates.find((item) => item.code === 'EUR');
  const jpy = data.rates.find((item) => item.code === 'JPY');

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#17172a]">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#85869b]">
          <Link href="/">Trang chủ</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-[#343548]">Tỷ giá</span>
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102c45] via-[#0d253c] to-[#173e5c] px-6 py-9 text-white shadow-[0_24px_60px_rgba(16,44,69,.2)] sm:px-10 lg:px-12">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#6ed6ff]/12 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-[#8ddfff]">
              <Sparkles className="size-3.5" /> NGOẠI TỆ & VND
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl lg:text-[46px]">
              Tỷ giá ngoại tệ hôm nay
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              Tra cứu giá mua tiền mặt, mua chuyển khoản và bán ra của{' '}
              {data.rates.length} ngoại tệ tại {data.bank}.
            </p>
          </div>
          <ArrowLeftRight
            className="pointer-events-none absolute -right-4 -top-10 size-64 rotate-[-12deg] text-[#79d8ff]/8"
            strokeWidth={1}
          />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[usd, eur, jpy].filter(Boolean).map((item) => (
            <article
              key={item!.code}
              className="rounded-3xl border border-[#dfe6ed] bg-white p-5 shadow-[0_10px_34px_rgba(21,53,77,.045)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#eaf7fd] font-black text-[#16779f]">
                  {item!.code.slice(0, 1)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#919aa4]">
                  Bán ra
                </span>
              </div>
              <p className="mt-5 text-2xl font-black tracking-tight text-[#125e80]">
                {number.format(item!.sell)} đ
              </p>
              <p className="mt-1 text-sm font-semibold">
                {item!.code} · {item!.name}
              </p>
              <p className="mt-3 text-xs text-[#8a929c]">
                Mua CK:{' '}
                {item!.transferBuy
                  ? `${number.format(item!.transferBuy)} đ`
                  : '—'}
              </p>
            </article>
          ))}
          <article className="rounded-3xl bg-[#0d253c] p-5 text-white shadow-[0_14px_40px_rgba(13,37,60,.15)]">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-[#82ddff]">
                <Landmark className="size-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[.1em] text-white/45">
                NHNN
              </span>
            </div>
            <p className="mt-5 text-2xl font-black tracking-tight text-[#85ddff]">
              {data.centralUsd ? `${number.format(data.centralUsd)} đ` : '—'}
            </p>
            <p className="mt-1 text-sm font-semibold">Tỷ giá trung tâm USD</p>
            <p className="mt-3 text-xs text-white/45">
              {formatTime(data.centralObservedAt)}
            </p>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6ed] bg-white shadow-[0_10px_34px_rgba(21,53,77,.04)]">
            <div className="flex flex-col gap-4 border-b border-[#e9edf1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.13em] text-[#16779f]">
                  Bảng tỷ giá
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Ngoại tệ tại {data.bank}
                </h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87919c]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 rounded-xl bg-[#f6f8fb] pl-9"
                  placeholder="Tìm USD, EUR..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="bg-[#f7f9fb] text-[11px] uppercase tracking-[.08em] text-[#78838e]">
                    <th className="px-5 py-4">Ngoại tệ</th>
                    <th className="px-5 py-4">Mua tiền mặt</th>
                    <th className="px-5 py-4">Mua chuyển khoản</th>
                    <th className="px-5 py-4">Bán ra</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.code}
                      className="border-t border-[#e9edf1] hover:bg-[#f9fcfd]"
                    >
                      <td
                        className="px-5 py-4"
                        aria-label={`Ngoại tệ ${item.code}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-[#eaf7fd] text-xs font-black text-[#12688c]">
                            {item.code.slice(0, 1)}
                          </span>
                          <div>
                            <p className="font-extrabold">{item.code}</p>
                            <p className="text-[11px] text-[#8b949e]">
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#08735a]">
                        {item.cashBuy === null
                          ? '—'
                          : `${number.format(item.cashBuy)} đ`}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#12688c]">
                        {item.transferBuy === null
                          ? '—'
                          : `${number.format(item.transferBuy)} đ`}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-[#b44e3a]">
                          {number.format(item.sell)} đ
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-[#949ca5]">
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

          <div className="rounded-3xl border border-[#dfe6ed] bg-white p-5 shadow-[0_10px_34px_rgba(21,53,77,.04)] sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#eaf7fd] text-[#16779f]">
                <Calculator className="size-5" />
              </span>
              <div>
                <p className="text-xs text-[#84909b]">Công cụ</p>
                <h2 className="font-bold">Quy đổi ngoại tệ</h2>
              </div>
            </div>
            <label
              className="mt-6 block text-xs font-semibold text-[#555f68]"
              htmlFor="fx-currency"
            >
              Ngoại tệ
            </label>
            <select
              id="fx-currency"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e6] bg-white px-3 text-sm outline-none focus:border-[#238eb9]"
            >
              {data.rates.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
            <label
              className="mt-4 block text-xs font-semibold text-[#555f68]"
              htmlFor="fx-amount"
            >
              Số lượng
            </label>
            <div className="relative mt-2">
              <Banknote className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87919c]" />
              <Input
                id="fx-amount"
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(event) =>
                  setAmount(Math.max(0, Number(event.target.value)))
                }
                className="h-11 rounded-xl pl-10 pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6d7781]">
                {code}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('buy')}
                className={`rounded-xl px-3 py-2.5 text-xs font-bold ${direction === 'buy' ? 'bg-[#12688c] text-white' : 'bg-[#f0f4f7] text-[#68737d]'}`}
              >
                Tôi mua ngoại tệ
              </button>
              <button
                type="button"
                onClick={() => setDirection('sell')}
                className={`rounded-xl px-3 py-2.5 text-xs font-bold ${direction === 'sell' ? 'bg-[#12688c] text-white' : 'bg-[#f0f4f7] text-[#68737d]'}`}
              >
                Tôi bán ngoại tệ
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-[#f4f8fa] p-4">
              <p className="text-xs text-[#78838e]">
                Giá trị quy đổi tham khảo
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[#125e80]">
                {number.format(converted)} đ
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[#89939c]">
                {direction === 'buy'
                  ? 'Tính theo giá ngân hàng bán ra.'
                  : 'Tính theo giá ngân hàng mua chuyển khoản; nếu không có sẽ dùng giá mua tiền mặt.'}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl bg-gradient-to-br from-[#12688c] to-[#1d92bc] p-6 text-white sm:p-8">
            <Building2 className="size-8 text-[#a9e8ff]" />
            <h2 className="mt-5 text-2xl font-extrabold">
              Ba mức giá, ba tình huống
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Mua tiền mặt áp dụng khi ngân hàng nhận tiền ngoại tệ mặt; mua
              chuyển khoản áp dụng khi ngoại tệ vào tài khoản; bán ra là mức bạn
              trả để mua ngoại tệ từ ngân hàng.
            </p>
          </div>
          <div className="rounded-3xl border border-[#dfe6ed] bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-[#16779f]">
              Nguồn dữ liệu
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">
              Cập nhật tự động từ taichinh.com
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#68737d]">
              Trang làm mới mỗi 15 phút và hiển thị nguyên trạng dữ liệu công bố
              của {data.bank} cùng tỷ giá trung tâm từ Ngân hàng Nhà nước.
            </p>
            <a
              href="https://taichinh.com/api/v1/fx"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0d253c] px-4 py-2.5 text-sm font-bold text-white"
            >
              Xem API nguồn <ExternalLink className="size-4" />
            </a>
          </div>
        </section>
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-[#dbe7ed] bg-[#f0f8fb] px-5 py-4 text-xs leading-5 text-[#62727d]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#16779f]" />
          <p>
            Tỷ giá chỉ mang tính tham khảo và có thể thay đổi trong ngày. Số
            tiền thực tế phụ thuộc thời điểm giao dịch và chính sách của ngân
            hàng.
          </p>
        </div>
      </main>
    </div>
  );
}
