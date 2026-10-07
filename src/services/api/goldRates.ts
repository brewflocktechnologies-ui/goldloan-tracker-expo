import { GoldRateData } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

const defaultGoldRates: GoldRateData = {
  location: "Bangalore",
  updatedAt: new Date().toISOString(),
  displayDate: "Live Rates",
  gold24k: { rate1g: 8850, numericPrice: 8850, change: 0, direction: "flat" },
  gold22k: { rate1g: 8115, numericPrice: 8115, change: 0, direction: "flat" },
  gold18k: { rate1g: 6640, numericPrice: 6640, change: 0, direction: "flat" },
};

export function normalizeGoldRates(rawRates: any): GoldRateData {
  if (!rawRates || typeof rawRates !== 'object') {
    return defaultGoldRates;
  }

  const normalizeKarat = (item: any, fallbackRate: number) => {
    if (!item || typeof item !== 'object') {
      return { rate1g: fallbackRate, numericPrice: fallbackRate, change: 0, direction: 'flat' as const };
    }
    const rate1g = Number(item.rate1g || item.numericPrice || fallbackRate);
    const change = Number(item.change || 0);
    const dir = item.direction === 'down' ? 'down' : item.direction === 'up' ? 'up' : 'flat';
    return {
      ...item,
      rate1g,
      numericPrice: item.numericPrice ? Number(item.numericPrice) : rate1g,
      change,
      direction: dir as 'up' | 'down' | 'flat',
    };
  };

  return {
    location: rawRates.location || 'Bangalore',
    updatedAt: rawRates.updatedAt || new Date().toISOString(),
    displayDate: rawRates.displayDate || 'Live Rates',
    gold24k: normalizeKarat(rawRates.gold24k, 8850),
    gold22k: normalizeKarat(rawRates.gold22k, 8115),
    gold18k: normalizeKarat(rawRates.gold18k, 6640),
  };
}

export async function getGoldRates(svc: ApiTransport, forceRefresh: boolean = false): Promise<{ data: GoldRateData; isCached: boolean }> {
  const CACHE_KEY = 'gold_rates_bangalore';

  if (!forceRefresh) {
    const cached = await cache.get<GoldRateData>(CACHE_KEY);
    if (cached.data) {
      return { data: normalizeGoldRates(cached.data), isCached: true };
    }
  }

  const res = await svc.getFromGas<GoldRateData>('getGoldRates', { forceRefresh: forceRefresh ? 'true' : 'false' });
  if (res.success && res.data) {
    const normalized = normalizeGoldRates(res.data);
    await cache.set(CACHE_KEY, normalized, CacheTTL.GOLD_RATES);
    return { data: normalized, isCached: false };
  }

  const stale = await cache.get<GoldRateData>(CACHE_KEY, true);
  if (stale.data) {
    return { data: normalizeGoldRates(stale.data), isCached: true };
  }

  return { data: defaultGoldRates, isCached: false };
}
