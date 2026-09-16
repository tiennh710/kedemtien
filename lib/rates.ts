export const RATE_TERMS = [0, 1, 3, 6, 9, 12, 18, 24, 36] as const;

export type RateTerm = (typeof RATE_TERMS)[number];

type ApiOffer = {
  rate?: number;
  observed_at?: string;
  qualifiers?: {
    channel?: string | null;
    product?: string | null;
  };
  conditions?: string[];
  source?: { publisher?: string };
};

type ApiBank = {
  effective_date?: string;
  eligible_by_month?: Record<string, ApiOffer>;
  source?: { publisher?: string };
};

type RatesApiResponse = {
  eligibility?: { principal_vnd?: number };
  coverage?: { eligible_banks?: number; eligible_offers?: number };
  banks?: Record<string, ApiBank>;
};

export type BankRate = {
  id: string;
  name: string;
  effectiveDate: string | null;
  rates: Partial<
    Record<
      RateTerm,
      {
        rate: number;
        channel: string;
        product: string | null;
        conditions: string[];
      }
    >
  >;
};

export type RatesData = {
  principalVnd: number;
  eligibleBanks: number;
  eligibleOffers: number;
  fetchedAt: string;
  banks: BankRate[];
};

const bankNames: Record<string, string> = {
  baovietbank: 'BAOVIET Bank',
  bidv: 'BIDV',
  vietcombank: 'Vietcombank',
  vietinbank: 'VietinBank',
  agribank: 'Agribank',
  kienlongbank: 'KienlongBank',
  publicbank: 'Public Bank',
  standardchartered: 'Standard Chartered',
  hongleong: 'Hong Leong Bank',
  saigonbank: 'SAIGONBANK',
  cake: 'Cake by VPBank',
};

function displayName(id: string, publisher?: string) {
  if (bankNames[id]) return bankNames[id];
  if (publisher) return publisher;
  return id
    .replace(/bank$/i, ' Bank')
    .replace(/(^|[-_])\w/g, (value) =>
      value.replace(/[-_]/, ' ').toUpperCase(),
    );
}

function channelLabel(channel?: string | null) {
  if (channel === 'online') return 'Trực tuyến';
  if (channel === 'quay') return 'Tại quầy';
  return 'Chưa tách kênh';
}

export async function getRates(): Promise<RatesData> {
  const response = await fetch('https://taichinh.com/api/v1/rates', {
    next: { revalidate: 1800 },
    headers: { Accept: 'application/json' },
  });

  if (!response.ok)
    throw new Error(`Không thể tải dữ liệu lãi suất (${response.status})`);
  const data = (await response.json()) as RatesApiResponse;

  const banks = Object.entries(data.banks ?? {}).map(([id, bank]) => {
    const rates: BankRate['rates'] = {};
    for (const term of RATE_TERMS) {
      const offer = bank.eligible_by_month?.[String(term)];
      if (typeof offer?.rate !== 'number') continue;
      rates[term] = {
        rate: offer.rate,
        channel: channelLabel(offer.qualifiers?.channel),
        product: offer.qualifiers?.product ?? null,
        conditions: offer.conditions ?? [],
      };
    }
    const publisher =
      bank.source?.publisher ??
      Object.values(bank.eligible_by_month ?? {})[0]?.source?.publisher;
    return {
      id,
      name: displayName(id, publisher),
      effectiveDate: bank.effective_date ?? null,
      rates,
    };
  });

  banks.sort((a, b) => (b.rates[12]?.rate ?? -1) - (a.rates[12]?.rate ?? -1));
  return {
    principalVnd: data.eligibility?.principal_vnd ?? 100_000_000,
    eligibleBanks: data.coverage?.eligible_banks ?? banks.length,
    eligibleOffers: data.coverage?.eligible_offers ?? 0,
    fetchedAt: new Date().toISOString(),
    banks,
  };
}
