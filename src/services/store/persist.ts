import { InitialSyncData } from '../../types';
import { cache, CacheTTL } from '../cache';
import { state } from './state';

/**
 * Write the current in-memory state to every cache key (unified snapshot + per-entity lists)
 * so they can never disagree. Called after each local change and again once the server call
 * settles, because the API layer invalidates cache keys after a successful mutation.
 */
export function persistAll() {
  cache.set('initial_sync_data', {
    users: state.users,
    bankAccounts: state.bankAccounts,
    ornaments: state.ornaments,
    loans: state.loans,
    payments: state.payments,
    goldRates: state.goldRates,
    timestamp: new Date().toISOString(),
  } as InitialSyncData, CacheTTL.SYNC_DATA);
  cache.set('users_list', state.users, CacheTTL.LISTS);
  cache.set('bank_accounts_all', state.bankAccounts, CacheTTL.LISTS);
  cache.set('ornaments_all', state.ornaments, CacheTTL.LISTS);
  cache.set('loans_all', state.loans, CacheTTL.LISTS);
  cache.set('payments_all', state.payments, CacheTTL.LISTS);
}
