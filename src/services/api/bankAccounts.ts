import { ApiResponse, BankAccount } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getBankAccounts(svc: ApiTransport, userId?: string, forceRefresh: boolean = false): Promise<BankAccount[]> {
  const CACHE_KEY = userId ? `bank_accounts_${userId}` : 'bank_accounts_all';

  if (!forceRefresh) {
    const cached = await cache.get<BankAccount[]>(CACHE_KEY);
    if (cached.data) return cached.data;
  }

  const res = await svc.getFromGas<BankAccount[]>('getBankAccounts', userId ? { userId } : {});
  if (res.success && Array.isArray(res.data)) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return res.data;
  }

  const stale = await cache.get<BankAccount[]>(CACHE_KEY, true);
  return stale.data || [];
}

export async function addBankAccount(svc: ApiTransport, accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<BankAccount>> {
  const res = await svc.postToGas<BankAccount>('addBankAccount', { accountData });
  if (res.success) {
    await cache.invalidateEntity('bank_accounts');
  }
  return res;
}

export async function updateBankAccount(svc: ApiTransport, accountId: string, accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('updateBankAccount', { accountId, accountData });
  if (res.success) {
    await cache.invalidateEntity('bank_accounts');
  }
  return res;
}

export async function deleteBankAccount(svc: ApiTransport, accountId: string): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('deleteBankAccount', { accountId });
  if (res.success) {
    await cache.invalidateEntity('bank_accounts');
  }
  return res;
}
