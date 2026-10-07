import { api } from '../api';
import { normalizeBankAccounts, normalizeLoans, normalizeOrnaments, normalizePayments, normalizeUsers } from '../normalize';
import { hydrateFromCache } from './hydrate';
import { notify, state } from './state';

export const getSyncError = () => state.syncError;

export async function syncFromBackend(force: boolean = false) {
  if (state.isSyncing && !force) return;

  // Prevent unauthenticated background calls if session token is not set yet
  if (!api.getSessionToken()) {
    return;
  }

  const now = Date.now();
  // Prevent spamming requests within 10 seconds unless user explicitly requested (e.g. pull-to-refresh)
  if (!force && now - state.lastSyncTimestamp < 10000) return;

  if (!state.isCacheHydrated) {
    await hydrateFromCache();
  }

  state.isSyncing = true;
  notify();

  try {
    // 1. First attempt fast unified sync (1 round trip) via GET
    // Always revalidate against the sheet (cache only paints the UI instantly on boot);
    // trusting the 30-min snapshot here hid rows added/removed outside or before a reload.
    const syncRes = await api.getInitialSyncData(true);
    if (syncRes.success && syncRes.data) {
      const data = syncRes.data;
      if (Array.isArray(data.users)) state.users = normalizeUsers(data.users);
      if (Array.isArray(data.bankAccounts)) state.bankAccounts = normalizeBankAccounts(data.bankAccounts);
      if (Array.isArray(data.ornaments)) state.ornaments = normalizeOrnaments(data.ornaments);
      if (Array.isArray(data.loans)) state.loans = normalizeLoans(data.loans);
      if (Array.isArray(data.payments)) state.payments = normalizePayments(data.payments);
      if (data.goldRates) state.goldRates = data.goldRates;

      if (syncRes.isFallback) {
        // Network/backend failed and we only got the stale cache: don't pretend it's fresh.
        state.syncError = 'Could not reach Google Sheets. Showing offline data.';
      } else {
        state.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        state.lastSyncTimestamp = Date.now();
        state.syncError = null;
      }
      notify();
      return;
    }

    // 2. Fallback: individual entity endpoints if unified sync was unavailable
    const [usersRes, banksRes, ornsRes, loansRes, paymentsRes, ratesRes] = await Promise.allSettled([
      api.getUsers(force),
      api.getBankAccounts(undefined, force),
      api.getOrnaments(undefined, force),
      api.getLoans(undefined, undefined, force),
      api.getPayments(undefined, force),
      api.getGoldRates(force),
    ]);

    if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
      state.users = normalizeUsers(usersRes.value);
    }
    if (banksRes.status === 'fulfilled' && Array.isArray(banksRes.value)) {
      state.bankAccounts = normalizeBankAccounts(banksRes.value);
    }
    if (ornsRes.status === 'fulfilled' && Array.isArray(ornsRes.value)) {
      state.ornaments = normalizeOrnaments(ornsRes.value);
    }
    if (loansRes.status === 'fulfilled' && Array.isArray(loansRes.value)) {
      state.loans = normalizeLoans(loansRes.value);
    }
    if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value)) {
      state.payments = normalizePayments(paymentsRes.value);
    }
    if (ratesRes.status === 'fulfilled' && ratesRes.value.data) {
      state.goldRates = ratesRes.value.data;
    }

    state.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.lastSyncTimestamp = Date.now();
    state.syncError = null;
  } catch (err: any) {
    console.warn('[Store] syncFromBackend error:', err);
    state.syncError = err.message || 'Sync failed';
  } finally {
    state.isSyncing = false;
    notify();
  }
}
