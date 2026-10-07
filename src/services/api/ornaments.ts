import { ApiResponse, Ornament } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getOrnaments(svc: ApiTransport, userId?: string, forceRefresh: boolean = false): Promise<Ornament[]> {
  const CACHE_KEY = userId ? `ornaments_${userId}` : 'ornaments_all';

  if (!forceRefresh) {
    const cached = await cache.get<Ornament[]>(CACHE_KEY);
    if (cached.data) return cached.data;
  }

  const res = await svc.getFromGas<Ornament[]>('getOrnaments', userId ? { userId } : {});
  if (res.success && Array.isArray(res.data)) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return res.data;
  }

  const stale = await cache.get<Ornament[]>(CACHE_KEY, true);
  return stale.data || [];
}

export async function addOrnament(svc: ApiTransport, ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<Ornament>> {
  const res = await svc.postToGas<Ornament>('addOrnament', { ornamentData });
  if (res.success) {
    await cache.invalidateEntity('ornaments');
  }
  return res;
}

export async function updateOrnament(svc: ApiTransport, ornamentId: string, ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('updateOrnament', { ornamentId, ornamentData });
  if (res.success) {
    await cache.invalidateEntity('ornaments');
  }
  return res;
}

export async function deleteOrnament(svc: ApiTransport, ornamentId: string): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('deleteOrnament', { ornamentId });
  if (res.success) {
    await cache.invalidateEntity('ornaments');
  }
  return res;
}
