import { ApiResponse, Payment } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getPayments(svc: ApiTransport, loanId?: string, forceRefresh: boolean = false): Promise<Payment[]> {
  const CACHE_KEY = loanId ? `payments_${loanId}` : 'payments_all';

  if (!forceRefresh) {
    const cached = await cache.get<Payment[]>(CACHE_KEY);
    if (cached.data) return cached.data;
  }

  const res = await svc.getFromGas<Payment[]>('getPayments', loanId ? { loanId } : {});
  if (res.success && Array.isArray(res.data)) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return res.data;
  }

  const stale = await cache.get<Payment[]>(CACHE_KEY, true);
  return stale.data || [];
}

export async function addPayment(svc: ApiTransport, paymentData: Partial<Payment>): Promise<ApiResponse<Payment>> {
  const res = await svc.postToGas<Payment>('addPayment', { paymentData });
  if (res.success) {
    await cache.invalidateEntity('payments');
    await cache.invalidateEntity('loans');
  }
  return res;
}
