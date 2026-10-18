export const KM_PER_MI = 1.609344;

export const eur = (n: number) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const SYMBOL: Record<string, string> = { USD: '$', CAD: 'CA$', KRW: '₩' };
export const money = (n: number, currency: string) =>
  SYMBOL[currency]
    ? `${SYMBOL[currency]}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
    : new Intl.NumberFormat('bg-BG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

export const num = (n: number) => new Intl.NumberFormat('bg-BG').format(n);
export const kmToMi = (km: number) => Math.round(km / KM_PER_MI);

export const dateBg = (d: Date | string | null | undefined, withTime = false) =>
  d
    ? new Intl.DateTimeFormat('bg-BG', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(d))
    : '—';

export const REGION_LABEL = { US: 'САЩ', CA: 'Канада', KR: 'Южна Корея' } as const;
export const REGION_SLUG = { US: 'usa', CA: 'canada', KR: 'south-korea' } as const;
export const SOURCE_LABEL = { COPART: 'Copart', IAAI: 'IAAI', ENCAR: 'Encar', KCAR: 'K Car', AUTOWINI: 'Autowini', OTHER: 'Друг източник' } as const;
export const CONDITION_LABEL = { NEW: 'Нов', EXCELLENT: 'Отлично', GOOD: 'Добро', FAIR: 'Задоволително', DAMAGED: 'Повреден', SALVAGE: 'Salvage' } as const;
export const STATUS_LABEL = { AVAILABLE: 'Наличен', RESERVED: 'Резервиран', SOLD: 'Продаден', ARCHIVED: 'Архивиран' } as const;
export const SALE_LABEL = { AUCTION: 'Търг', BUY_NOW: 'Buy Now' } as const;
export const INQUIRY_STATUS_LABEL = { NEW: 'Нова', IN_PROGRESS: 'В работа', QUOTED: 'Изпратена оферта', CLOSED: 'Приключена' } as const;
export const ROLE_LABEL = { ADMIN: 'Администратор', MANAGER: 'Мениджър', CUSTOMER: 'Клиент' } as const;
