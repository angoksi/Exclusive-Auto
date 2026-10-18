import type { Region } from '@/generated/prisma/enums';

/**
 * Конфигурация на калкулатора. Всички стойности се редактират от админ панела (Setting "pricing").
 * ВАЖНО: стойностите по подразбиране са ориентировъчни и трябва да бъдат потвърдени
 * с митнически брокер и актуалните тарифи/договори преди публикуване.
 */
export type FeeTier = { upTo: number | null; percent: number; fixed: number }; // upTo в валутата на покупката
export type PricingConfig = {
  fx: Record<string, number>; // единица валута -> EUR
  fxUpdatedAt: string;
  auctionFees: Record<string, { label: string; currency: string; tiers: FeeTier[]; flat: number }>; // flat = гейт/експ. такси
  inland: Record<Region, number>; // EUR, транспорт до пристанище
  sea: Record<Region, Record<string, number>>; // EUR, по дестинация
  destinations: Record<string, string>;
  insuranceRate: number; // % от стойността за застраховане
  dutyRate: Record<Region, number>; // % мито върху митническата стойност
  vatRate: number;
  customsFees: number; // EUR, брокер + декларации
  portFees: number; // EUR, терминални такси
  portFeesInVatBase: boolean;
  commission: Record<Region, { percent: number; min: number }>;
  extras: { id: string; label: string; price: number }[];
  disclaimer: string;
};

export const DEFAULT_PRICING: PricingConfig = {
  fx: { EUR: 1, USD: 0.92, CAD: 0.67, KRW: 0.00067 },
  fxUpdatedAt: '2026-01-01',
  auctionFees: {
    COPART: {
      label: 'Copart (примерна таблица)',
      currency: 'USD',
      flat: 160,
      tiers: [
        { upTo: 1000, percent: 0, fixed: 150 },
        { upTo: 5000, percent: 6, fixed: 100 },
        { upTo: 15000, percent: 5, fixed: 200 },
        { upTo: null, percent: 4, fixed: 400 },
      ],
    },
    IAAI: {
      label: 'IAAI (примерна таблица)',
      currency: 'USD',
      flat: 170,
      tiers: [
        { upTo: 1000, percent: 0, fixed: 160 },
        { upTo: 5000, percent: 6, fixed: 110 },
        { upTo: 15000, percent: 5, fixed: 210 },
        { upTo: null, percent: 4, fixed: 410 },
      ],
    },
    KOREA: { label: 'Корейски дилър / платформа', currency: 'KRW', flat: 600000, tiers: [{ upTo: null, percent: 0, fixed: 0 }] },
    OTHER: { label: 'Друг източник / частна продажба', currency: 'USD', flat: 0, tiers: [{ upTo: null, percent: 0, fixed: 0 }] },
  },
  inland: { US: 450, CA: 650, KR: 180 },
  sea: {
    US: { varna: 1350, burgas: 1350, constanta: 1250 },
    CA: { varna: 1500, burgas: 1500, constanta: 1400 },
    KR: { varna: 1450, burgas: 1450, constanta: 1350 },
  },
  destinations: { varna: 'Варна', burgas: 'Бургас', constanta: 'Констанца (RO) + транспорт' },
  insuranceRate: 1.5,
  dutyRate: { US: 10, CA: 10, KR: 0 },
  vatRate: 20,
  customsFees: 280,
  portFees: 220,
  portFeesInVatBase: true,
  commission: { US: { percent: 4, min: 900 }, CA: { percent: 4, min: 900 }, KR: { percent: 4, min: 900 } },
  extras: [
    { id: 'inspection', label: 'Допълнителна инспекция и видеоотчет', price: 120 },
    { id: 'homologation', label: 'Документи за хомологация / сертификат за съответствие', price: 250 },
    { id: 'registration', label: 'Съдействие при регистрация в КАТ', price: 150 },
    { id: 'storage', label: 'Складиране до 30 дни', price: 200 },
    { id: 'cleaning', label: 'Почистване и подготовка за предаване', price: 90 },
  ],
  disclaimer:
    'Изчислението е ориентировъчно и не представлява обвързваща оферта. Мито, ДДС, такси и курсове зависят от тарифната класификация, произхода и датата на декларирането. Окончателната цена се потвърждава писмено от консултант.',
};

export type CalcInput = {
  region: Region;
  price: number; // във валутата на покупката
  currency: string;
  platform: string; // ключ в auctionFees
  auctionFeeOverride?: number | null; // във валутата на покупката
  inlandOverride?: number | null; // EUR
  seaOverride?: number | null; // EUR
  destination: string;
  insurance: boolean;
  originProof: boolean; // за KR — доказателство за преференциален произход (ЕС–Корея ССТ)
  extras: string[];
};

export type CalcLine = { key: string; label: string; amount: number; note?: string; group: 'vehicle' | 'transport' | 'tax' | 'service' };
export type CalcResult = { lines: CalcLine[]; customsValue: number; vatBase: number; total: number; currencyRate: number };

const r = (n: number) => Math.round(n);

export function auctionFee(price: number, key: string, cfg: PricingConfig) {
  const f = cfg.auctionFees[key] ?? cfg.auctionFees.OTHER;
  const tier = f.tiers.find((t) => t.upTo === null || price <= t.upTo) ?? f.tiers[f.tiers.length - 1];
  return { fee: price * (tier.percent / 100) + tier.fixed + f.flat, currency: f.currency };
}

export function calculateImport(input: CalcInput, cfg: PricingConfig): CalcResult {
  const fx = (cur: string) => cfg.fx[cur] ?? 1;
  const rate = fx(input.currency);
  const vehicle = input.price * rate;

  const auto = auctionFee(input.price, input.platform, cfg);
  // ръчно зададена такса е във валутата на покупката; автоматичната — във валутата на таблицата
  const auctionEur = input.auctionFeeOverride != null ? input.auctionFeeOverride * rate : auto.fee * fx(auto.currency);

  const inland = input.inlandOverride ?? cfg.inland[input.region];
  const sea = input.seaOverride ?? cfg.sea[input.region][input.destination] ?? Object.values(cfg.sea[input.region])[0];
  const insurance = input.insurance ? (vehicle + auctionEur + inland + sea) * (cfg.insuranceRate / 100) : 0;

  // Митническа стойност (CIF): цена + такси на търга + транспорт до границата на ЕС + застраховка
  const customsValue = vehicle + auctionEur + inland + sea + insurance;
  const dutyPct = input.region === 'KR' && !input.originProof ? cfg.dutyRate.US : cfg.dutyRate[input.region];
  const duty = customsValue * (dutyPct / 100);
  const vatBase = customsValue + duty + (cfg.portFeesInVatBase ? cfg.portFees : 0);
  const vat = vatBase * (cfg.vatRate / 100);

  const c = cfg.commission[input.region];
  const commission = Math.max(c.min, vehicle * (c.percent / 100));
  const extras = cfg.extras.filter((e) => input.extras.includes(e.id));
  const extrasSum = extras.reduce((s, e) => s + e.price, 0);

  const lines: CalcLine[] = [
    { key: 'vehicle', group: 'vehicle', label: 'Цена на автомобила', amount: r(vehicle) },
    { key: 'auction', group: 'vehicle', label: 'Такси на платформата / дилъра', amount: r(auctionEur) },
    { key: 'inland', group: 'transport', label: 'Транспорт до пристанище', amount: r(inland) },
    { key: 'sea', group: 'transport', label: 'Международен транспорт', amount: r(sea) },
    { key: 'insurance', group: 'transport', label: 'Застраховка', amount: r(insurance), note: input.insurance ? `${cfg.insuranceRate}% от стойността` : 'Не е избрана' },
    { key: 'duty', group: 'tax', label: 'Мито', amount: r(duty), note: `${dutyPct}% върху митническата стойност (${r(customsValue)} €)` },
    { key: 'vat', group: 'tax', label: 'ДДС', amount: r(vat), note: `${cfg.vatRate}% върху ${r(vatBase)} €` },
    { key: 'fees', group: 'tax', label: 'Митнически и пристанищни такси', amount: r(cfg.customsFees + cfg.portFees) },
    { key: 'commission', group: 'service', label: 'Комисиона на компанията', amount: r(commission) },
    ...extras.map((e) => ({ key: `x-${e.id}`, group: 'service' as const, label: e.label, amount: r(e.price) })),
  ];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, customsValue: r(customsValue), vatBase: r(vatBase), total, currencyRate: rate };
}

export function platformKeyFor(source: string, region: Region) {
  if (region === 'KR') return 'KOREA';
  return source === 'COPART' || source === 'IAAI' ? source : 'OTHER';
}

export const REGION_CURRENCY: Record<Region, string> = { US: 'USD', CA: 'CAD', KR: 'KRW' };
