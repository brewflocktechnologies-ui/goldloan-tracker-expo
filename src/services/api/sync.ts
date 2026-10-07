import { ApiResponse, InitialSyncData } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';
import { normalizeGoldRates } from './goldRates';

export async function getInitialSyncData(svc: ApiTransport, forceRefresh: boolean = false): Promise<ApiResponse<InitialSyncData>> {
  const CACHE_KEY = 'initial_sync_data';

  if (!forceRefresh) {
    const cached = await cache.get<InitialSyncData>(CACHE_KEY);
    if (cached.data) {
      return { success: true, data: cached.data, isCached: true };
    }
  }

  const res = await svc.callGas<InitialSyncData>('getInitialSyncData', {}, 'GET');
  if (res.success && res.data) {
    if (res.data.goldRates) {
      res.data.goldRates = normalizeGoldRates(res.data.goldRates);
    }
    await cache.set(CACHE_KEY, res.data, CacheTTL.SYNC_DATA);
    // Pre-populate individual entity caches
    if (res.data.users) await cache.set('users_list', res.data.users, CacheTTL.LISTS);
    if (res.data.bankAccounts) await cache.set('bank_accounts_all', res.data.bankAccounts, CacheTTL.LISTS);
    if (res.data.ornaments) await cache.set('ornaments_all', res.data.ornaments, CacheTTL.LISTS);
    if (res.data.loans) await cache.set('loans_all', res.data.loans, CacheTTL.LISTS);
    if (res.data.payments) await cache.set('payments_all', res.data.payments, CacheTTL.LISTS);
    if (res.data.goldRates) await cache.set('gold_rates_bangalore', res.data.goldRates, CacheTTL.GOLD_RATES);
    return { success: true, data: res.data, isCached: false };
  }

  // Network request failed - fall back to stale cache
  const stale = await cache.get<InitialSyncData>(CACHE_KEY, true);
  if (stale.data) {
    if (stale.data.goldRates) {
      stale.data.goldRates = normalizeGoldRates(stale.data.goldRates);
    }
    return { success: true, data: stale.data, isCached: true, isFallback: true };
  }

  return res;
}
