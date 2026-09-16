type GoldMetric = {
  value?: number;
  observed_at?: string;
  source?: {
    publisher?: string;
    product_name?: string;
  };
};

type GoldBrandApi = {
  buy?: number;
  sell?: number;
  observed_at?: string;
  metrics?: {
    buy?: GoldMetric;
    sell?: GoldMetric;
  };
};

type GoldApiResponse = {
  unit?: string;
  product?: string;
  sjc?: Record<string, GoldBrandApi>;
};

export type GoldPrice = {
  id: string;
  brand: string;
  product: string;
  buy: number;
  sell: number;
  observedAt: string;
};

export type GoldData = {
  unit: string;
  fetchedAt: string;
  prices: GoldPrice[];
};

const brandNames: Record<string, string> = {
  btmh: 'Bảo Tín Minh Hải',
  doji: 'DOJI',
  phuquy: 'Phú Quý',
  pnj: 'PNJ',
  sjc: 'SJC',
};

export async function getGoldPrices(): Promise<GoldData> {
  const response = await fetch('https://taichinh.com/api/v1/gold', {
    next: { revalidate: 900 },
    headers: { Accept: 'application/json' },
  });

  if (!response.ok)
    throw new Error(`Không thể tải dữ liệu giá vàng (${response.status})`);
  const data = (await response.json()) as GoldApiResponse;
  const prices = Object.entries(data.sjc ?? {}).flatMap(([id, item]) => {
    const buy = item.metrics?.buy?.value ?? item.buy;
    const sell = item.metrics?.sell?.value ?? item.sell;
    if (typeof buy !== 'number' || typeof sell !== 'number') return [];
    const publisher =
      item.metrics?.sell?.source?.publisher ??
      item.metrics?.buy?.source?.publisher;
    return [
      {
        id,
        brand: brandNames[id] ?? publisher ?? id.toUpperCase(),
        product:
          item.metrics?.sell?.source?.product_name ??
          item.metrics?.buy?.source?.product_name ??
          'Vàng miếng SJC',
        buy,
        sell,
        observedAt:
          item.metrics?.sell?.observed_at ??
          item.metrics?.buy?.observed_at ??
          item.observed_at ??
          new Date().toISOString(),
      },
    ];
  });

  prices.sort((a, b) => b.buy - a.buy);
  return {
    unit: data.unit ?? 'vnd_per_luong',
    fetchedAt: new Date().toISOString(),
    prices,
  };
}
