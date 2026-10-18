import type { Region, Source, SaleType, Condition } from '@/generated/prisma/enums';

/** Общ стандартизиран модел — frontend-ът работи само с него, независимо от доставчика. */
export type NormalizedVehicle = {
  source: Source;
  sourceId: string; // уникален ID при доставчика
  region: Region;
  make: string;
  model: string;
  trim?: string;
  year: number;
  vin?: string;
  lotNumber?: string;
  platform?: string;
  saleType: SaleType;
  currency: 'USD' | 'CAD' | 'KRW' | 'EUR';
  currentBid?: number;
  buyNowPrice?: number;
  auctionDate?: Date;
  location: string;
  country: string;
  odometerKm: number;
  engine: string;
  fuel: string;
  transmission: string;
  drive: string;
  bodyType: string;
  color: string;
  condition: Condition;
  primaryDamage?: string;
  secondaryDamage?: string;
  runsAndDrives: boolean;
  hasKeys: boolean;
  description: string;
  features?: string[];
  images: string[];
  history?: { date: Date; type: string; description: string; odometerKm?: number; source?: string }[];
};

/** Списък с обяви; `complete` е true, когато са получени ВСИЧКИ обяви по филтъра (позволява архивиране на изчезналите). */
export type Listings = NormalizedVehicle[] & { complete?: boolean };

export interface ProviderAdapter {
  id: Source;
  name: string;
  regions: Region[];
  /** true, ако има лицензиран достъп (URL + ключ в средата). */
  isConfigured(): boolean;
  /** Извлича обяви от лицензиран API/фийд и ги превръща в общия модел. */
  fetchListings(opts?: { since?: Date; limit?: number }): Promise<Listings>;
  /** По избор: снимки от страницата на конкретна обява, когато списъкът не ги съдържа. */
  fetchImages?(sourceId: string): Promise<string[]>;
}

export class ProviderNotConfigured extends Error {
  constructor(public provider: string) {
    super(`${provider}: липсват API URL/ключ. Доставчикът не е конфигуриран.`);
  }
}
