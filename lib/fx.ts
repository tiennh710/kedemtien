type FxMetric = {
  value?: number;
  observed_at?: string;
  source?: { publisher?: string };
};

type FxRateApi = {
  cash_buy?: number;
  transfer_buy?: number;
  sell?: number;
  observed_at?: string;
  metrics?: {
    cash_buy?: FxMetric;
    transfer_buy?: FxMetric;
    sell?: FxMetric;
  };
};

type FxApiResponse = {
  bank?: string;
  rates?: Record<string, FxRateApi>;
  sbv_central_usd?: FxMetric;
};

export type FxRate = {
  code: string;
  name: string;
  cashBuy: number | null;
  transferBuy: number | null;
  sell: number;
  observedAt: string;
};

export type FxData = {
  bank: string;
  centralUsd: number | null;
  centralObservedAt: string | null;
  rates: FxRate[];
};

const currencyNames: Record<string, string> = {
  AUD: 'Đô la Úc',
  CAD: 'Đô la Canada',
  CHF: 'Franc Thụy Sĩ',
  CNY: 'Nhân dân tệ',
  DKK: 'Krone Đan Mạch',
  EUR: 'Euro',
  GBP: 'Bảng Anh',
  HKD: 'Đô la Hồng Kông',
  INR: 'Rupee Ấn Độ',
  JPY: 'Yên Nhật',
  KRW: 'Won Hàn Quốc',
  KWD: 'Dinar Kuwait',
  MYR: 'Ringgit Malaysia',
  NOK: 'Krone Na Uy',
  RUB: 'Rúp Nga',
  SAR: 'Riyal Ả Rập',
  SEK: 'Krona Thụy Điển',
  SGD: 'Đô la Singapore',
  THB: 'Baht Thái',
  USD: 'Đô la Mỹ',
};

const featuredOrder = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD', 'CNY', 'KRW'];

export async function getFxRates(): Promise<FxData> {
  const response = await fetch('https://taichinh.com/api/v1/fx', {
    next: { revalidate: 900 },
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error(`Không thể tải dữ liệu tỷ giá (${response.status})`);
  const data = (await response.json()) as FxApiResponse;

  const rates = Object.entries(data.rates ?? {}).flatMap(([key, item]) => {
    const sell = item.metrics?.sell?.value ?? item.sell;
    if (typeof sell !== 'number') return [];
    const code = key.toUpperCase();
    return [
      {
        code,
        name: currencyNames[code] ?? code,
        cashBuy: item.metrics?.cash_buy?.value ?? item.cash_buy ?? null,
        transferBuy:
          item.metrics?.transfer_buy?.value ?? item.transfer_buy ?? null,
        sell,
        observedAt:
          item.metrics?.sell?.observed_at ??
          item.observed_at ??
          new Date().toISOString(),
      },
    ];
  });
  rates.sort((a, b) => {
    const ai = featuredOrder.indexOf(a.code);
    const bi = featuredOrder.indexOf(b.code);
    return (
      (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.code.localeCompare(b.code)
    );
  });

  return {
    bank:
      data.bank === 'vietcombank' ? 'Vietcombank' : (data.bank ?? 'Ngân hàng'),
    centralUsd: data.sbv_central_usd?.value ?? null,
    centralObservedAt: data.sbv_central_usd?.observed_at ?? null,
    rates,
  };
}
