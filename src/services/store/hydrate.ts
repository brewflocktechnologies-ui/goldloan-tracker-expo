import { BankAccount, GoldRateData, InitialSyncData, Loan, Ornament, Payment, User } from '../../types';
import { cache } from '../cache';
import { normalizeBankAccounts, normalizeLoans, normalizeOrnaments, normalizePayments, normalizeUsers } from '../normalize';
import { refreshGoldRates } from './goldRates';
import { notify, state } from './state';

/**
 * Hydrate in-memory state from L2 persistent storage (AsyncStorage) immediately on boot.
 * Delivers instant offline UI before any network requests complete.
 */
export async function hydrateFromCache() {
  if (state.isCacheHydrated) return;
  try {
    // 1. Check unified sync snapshot first (fastest, all entities in 1 read)
    const syncSnapshot = await cache.get<InitialSyncData>('initial_sync_data', true);
    let updated = false;

    if (syncSnapshot.data) {
      const d = syncSnapshot.data;
      if (Array.isArray(d.users) && d.users.length > 0) {
        state.users = normalizeUsers(d.users);
        updated = true;
      }
      if (Array.isArray(d.bankAccounts) && d.bankAccounts.length > 0) {
        state.bankAccounts = normalizeBankAccounts(d.bankAccounts);
        updated = true;
      }
      if (Array.isArray(d.ornaments) && d.ornaments.length > 0) {
        state.ornaments = normalizeOrnaments(d.ornaments);
        updated = true;
      }
      if (Array.isArray(d.loans) && d.loans.length > 0) {
        state.loans = normalizeLoans(d.loans);
        updated = true;
      }
      if (Array.isArray(d.payments) && d.payments.length > 0) {
        state.payments = normalizePayments(d.payments);
        updated = true;
      }
      if (d.goldRates) {
        state.goldRates = d.goldRates;
        updated = true;
      }
    }

    // 2. Also check individual entity caches for any missing collections
    const [cachedUsers, cachedBanks, cachedOrns, cachedLoans, cachedPayments, cachedRates] = await Promise.all([
      state.users.length === 0 ? cache.get<User[]>('users_list', true) : Promise.resolve({ data: null }),
      state.bankAccounts.length === 0 ? cache.get<BankAccount[]>('bank_accounts_all', true) : Promise.resolve({ data: null }),
      state.ornaments.length === 0 ? cache.get<Ornament[]>('ornaments_all', true) : Promise.resolve({ data: null }),
      state.loans.length === 0 ? cache.get<Loan[]>('loans_all', true) : Promise.resolve({ data: null }),
      state.payments.length === 0 ? cache.get<Payment[]>('payments_all', true) : Promise.resolve({ data: null }),
      !syncSnapshot.data?.goldRates ? cache.get<GoldRateData>('gold_rates_bangalore', true) : Promise.resolve({ data: null }),
    ]);

    if (cachedUsers.data && cachedUsers.data.length > 0) {
      state.users = normalizeUsers(cachedUsers.data);
      updated = true;
    }
    if (cachedBanks.data && cachedBanks.data.length > 0) {
      state.bankAccounts = normalizeBankAccounts(cachedBanks.data);
      updated = true;
    }
    if (cachedOrns.data && cachedOrns.data.length > 0) {
      state.ornaments = normalizeOrnaments(cachedOrns.data);
      updated = true;
    }
    if (cachedLoans.data && cachedLoans.data.length > 0) {
      state.loans = normalizeLoans(cachedLoans.data);
      updated = true;
    }
    if (cachedPayments.data && cachedPayments.data.length > 0) {
      state.payments = normalizePayments(cachedPayments.data);
      updated = true;
    }
    if (cachedRates.data) {
      state.goldRates = cachedRates.data;
      updated = true;
    }

    state.isCacheHydrated = true;
    if (updated) notify();

    // Trigger non-blocking real-time gold rates refresh on boot
    refreshGoldRates(false).catch(e => console.warn('[Store] Boot gold rates fetch:', e));
  } catch (e) {
    console.warn('[Store] hydrateFromCache warning:', e);
  }
}
