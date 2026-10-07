import { ApiResponse, Loan } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getLoans(svc: ApiTransport, userId?: string, status?: string, forceRefresh: boolean = false): Promise<Loan[]> {
  const CACHE_KEY = `loans_${userId || 'all'}_${status || 'all'}`;

  if (!forceRefresh) {
    const cached = await cache.get<Loan[]>(CACHE_KEY);
    if (cached.data) return cached.data;
  }

  const params: Record<string, string> = {};
  if (userId) params.userId = userId;
  if (status) params.status = status;

  const res = await svc.getFromGas<Loan[]>('getLoans', params);
  if (res.success && Array.isArray(res.data)) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return res.data;
  }

  const stale = await cache.get<Loan[]>(CACHE_KEY, true);
  return stale.data || [];
}

export async function addLoan(svc: ApiTransport, loanData: any): Promise<ApiResponse<Loan>> {
  const res = await svc.postToGas<Loan>('addLoan', { loanData });
  if (res.success) {
    await cache.invalidateEntity('loans');
    await cache.invalidate('ornaments');
    await cache.invalidate('bank_accounts');
  }
  return res;
}

export async function updateLoan(svc: ApiTransport, loanId: string, loanData: any): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('updateLoan', { loanId, loanData });
  if (res.success) {
    await cache.invalidateEntity('loans');
    await cache.invalidate('ornaments');
    await cache.invalidate('bank_accounts');
  }
  return res;
}

export async function closeAndReleaseLoan(svc: ApiTransport, loanId: string, closureRemarks: string = ''): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('closeAndReleaseLoan', { loanId, closureRemarks });
  if (res.success) {
    await cache.invalidateEntity('loans');
    await cache.invalidate('ornaments');
    await cache.invalidate('bank_accounts');
  }
  return res;
}
