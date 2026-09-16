'use client';

import Link from 'next/link';
import {
  ArrowDown,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Info,
  Landmark,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import { BankRate, RATE_TERMS, RateTerm, RatesData } from '@/lib/rates';

const money = new Intl.NumberFormat('vi-VN');
const rate = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function termLabel(term: RateTerm) {
  return term === 0 ? 'KKH' : `${term} tháng`;
}

function estimateInterest(
  principal: number,
  annualRate: number,
  months: number,
) {
  return principal * (annualRate / 100) * (months / 12);
}

function RateCell({
  bank,
  term,
  highest,
}: {
  bank: BankRate;
  term: RateTerm;
  highest: number;
}) {
  const offer = bank.rates[term];
  if (!offer) return <span className="text-[#b1b2c0]">—</span>;
  const isHighest = offer.rate === highest;
  return (
    <div className="min-w-[92px]">
      <div
        className={`font-bold ${isHighest ? 'text-[#4635f3]' : 'text-[#26273a]'}`}
      >
        {rate.format(offer.rate)}%
      </div>
      <div className="mt-0.5 text-[10px] leading-4 text-[#88899a]">
        {offer.channel}
      </div>
    </div>
  );
}

export function RatesPage({ data }: { data: RatesData }) {
  const [term, setTerm] = useState<RateTerm>(12);
  const [principal, setPrincipal] = useState(data.principalVnd);
  const [query, setQuery] = useState('');

  const ranked = useMemo(
    () =>
      data.banks
        .filter((bank) => bank.rates[term])
        .sort(
          (a, b) => (b.rates[term]?.rate ?? 0) - (a.rates[term]?.rate ?? 0),
        ),
    [data.banks, term],
  );
  const filtered = useMemo(
    () =>
      data.banks.filter((bank) =>
        bank.name
          .toLocaleLowerCase('vi-VN')
          .includes(query.toLocaleLowerCase('vi-VN')),
      ),
    [data.banks, query],
  );
  const highestByTerm = useMemo(
    () =>
      Object.fromEntries(
        RATE_TERMS.map((value) => [
          value,
          Math.max(...data.banks.map((bank) => bank.rates[value]?.rate ?? -1)),
        ]),
      ) as Record<RateTerm, number>,
    [data.banks],
  );
  const best = ranked[0];
  const bestOffer = best?.rates[term];
  const topFive = ranked.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#17172a]">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#85869b]">
          <Link href="/">Trang chủ</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-[#343548]">Lãi suất</span>
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-[#17172a] px-6 py-9 text-white shadow-[0_24px_60px_rgba(24,24,48,.15)] sm:px-10 lg:px-12">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-[#c8c3ff]">
              <TrendingUp className="size-3.5" /> DỮ LIỆU THỊ TRƯỜNG
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl lg:text-[46px]">
              So sánh lãi suất tiết kiệm
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              Tra cứu lãi suất tiền gửi VND của {data.eligibleBanks} ngân hàng
              theo kỳ hạn, kênh gửi và số tiền dự kiến.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-12 top-16 size-24 rounded-full bg-[#7768ff]/20 blur-2xl" />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-[#e3e4ec] bg-white p-5 shadow-[0_10px_34px_rgba(29,28,58,.05)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6b5af2]">
                  Mức cao nhất
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Kỳ hạn {termLabel(term)}
                </h2>
              </div>
              <span className="grid size-11 place-items-center rounded-2xl bg-[#efedff] text-[#4635f3]">
                <Sparkles className="size-5" />
              </span>
            </div>
            {best && bestOffer ? (
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-5xl font-black tracking-[-.05em] text-[#4635f3]">
                    {rate.format(bestOffer.rate)}
                    <span className="ml-1 text-xl">%/năm</span>
                  </div>
                  <p className="mt-2 font-semibold">
                    {best.name}{' '}
                    <span className="font-normal text-[#77788c]">
                      · {bestOffer.channel}
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f7f8fc] px-4 py-3 sm:text-right">
                  <p className="text-xs text-[#85869b]">Tiền lãi ước tính</p>
                  <p className="mt-1 text-xl font-extrabold text-[#17172a]">
                    {money.format(
                      estimateInterest(principal, bestOffer.rate, term),
                    )}{' '}
                    đ
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-[#77788c]">
                Chưa có dữ liệu cho kỳ hạn này.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-[#e3e4ec] bg-white p-5 shadow-[0_10px_34px_rgba(29,28,58,.05)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6b5af2]">
              Tính nhanh
            </p>
            <label
              className="mt-4 block text-xs font-semibold text-[#55566a]"
              htmlFor="principal"
            >
              Số tiền gửi
            </label>
            <div className="relative mt-2">
              <Banknote className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#77788c]" />
              <Input
                id="principal"
                type="number"
                min={1_000_000}
                step={1_000_000}
                value={principal}
                onChange={(event) =>
                  setPrincipal(Math.max(0, Number(event.target.value)))
                }
                className="h-11 rounded-xl pl-10 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#77788c]">
                VND
              </span>
            </div>
            <p className="mt-4 block text-xs font-semibold text-[#55566a]">
              Kỳ hạn
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RATE_TERMS.filter((value) => value > 0).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTerm(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${term === value ? 'bg-[#4635f3] text-white' : 'bg-[#f1f2f7] text-[#5f6073] hover:bg-[#e9e7ff] hover:text-[#4635f3]'}`}
                >
                  {value}T
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl border border-[#e3e4ec] bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf9f5] text-[#078268]">
                <Landmark className="size-5" />
              </span>
              <div>
                <p className="text-xs text-[#85869b]">Top 5 ngân hàng</p>
                <h2 className="font-bold">Kỳ hạn {termLabel(term)}</h2>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {topFive.map((bank, index) => {
                const offer = bank.rates[term]!;
                return (
                  <div
                    key={bank.id}
                    className="flex items-center gap-3 rounded-2xl bg-[#f7f8fc] p-3"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${index === 0 ? 'bg-[#4635f3] text-white' : 'bg-white text-[#66677a]'}`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {bank.name}
                      </p>
                      <p className="text-[11px] text-[#8a8b9c]">
                        {offer.channel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#4635f3]">
                        {rate.format(offer.rate)}%
                      </p>
                      <p className="text-[10px] text-[#8a8b9c]">
                        {money.format(
                          estimateInterest(principal, offer.rate, term),
                        )}{' '}
                        đ
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-[#e3e4ec] bg-gradient-to-br from-[#4635f3] to-[#6757fa] p-6 text-white sm:p-8">
            <CircleDollarSign className="size-8 text-[#d3cfff]" />
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
              Đọc đúng con số trước khi gửi
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Lãi suất trực tuyến và tại quầy có thể khác nhau. Mỗi mức trong
              bảng đi kèm kênh gửi được API xác định; hãy kiểm tra lại điều kiện
              sản phẩm tại ngân hàng trước khi mở sổ.
            </p>
            <a
              href="https://taichinh.com/lai-suat"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#3528b5]"
            >
              Xem nguồn dữ liệu <ArrowDown className="size-4 -rotate-90" />
            </a>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-[#e3e4ec] bg-white shadow-[0_10px_34px_rgba(29,28,58,.04)]">
          <div className="flex flex-col gap-4 border-b border-[#ececf2] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6b5af2]">
                Bảng so sánh
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Lãi suất theo ngân hàng và kỳ hạn
              </h2>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#85869b]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 rounded-xl bg-[#f7f8fc] pl-9"
                placeholder="Tìm ngân hàng..."
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#f8f8fb] text-[11px] uppercase tracking-[.08em] text-[#77788c]">
                  <th className="sticky left-0 z-10 min-w-48 bg-[#f8f8fb] px-5 py-4 font-bold">
                    Ngân hàng
                  </th>
                  {RATE_TERMS.map((value) => (
                    <th key={value} className="px-4 py-4 font-bold">
                      {termLabel(value)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((bank) => (
                  <tr
                    key={bank.id}
                    className="border-t border-[#eeeeF3] hover:bg-[#fafaff]"
                  >
                    <td className="sticky left-0 z-10 bg-white px-5 py-4">
                      <p className="font-bold text-[#252638]">{bank.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#9293a2]">
                        <CalendarDays className="size-3" />
                        {bank.effectiveDate
                          ? new Date(bank.effectiveDate).toLocaleDateString(
                              'vi-VN',
                            )
                          : 'Đang cập nhật'}
                      </p>
                    </td>
                    {RATE_TERMS.map((value) => (
                      <td key={value} className="px-4 py-4 align-top">
                        <RateCell
                          bank={bank}
                          term={value}
                          highest={highestByTerm[value]}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-start gap-2 border-t border-[#ececf2] bg-[#fafaff] px-5 py-4 text-xs leading-5 text-[#717285]">
            <Info className="mt-0.5 size-4 shrink-0 text-[#6b5af2]" />
            <p>
              Lãi suất là %/năm; tiền lãi chỉ là ước tính theo lãi đơn và giả
              định giữ đủ kỳ hạn. Dữ liệu tham chiếu cho khoản gửi{' '}
              {money.format(data.principalVnd)} đồng, nguồn taichinh.com.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
