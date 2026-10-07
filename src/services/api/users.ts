import { ApiResponse, User } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getUsers(svc: ApiTransport, forceRefresh: boolean = false): Promise<User[]> {
  const CACHE_KEY = 'users_list';

  if (!forceRefresh) {
    const cached = await cache.get<User[]>(CACHE_KEY);
    if (cached.data) return cached.data;
  }

  const res = await svc.getFromGas<User[]>('getUsers');
  if (res.success && res.data) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return res.data;
  }

  const stale = await cache.get<User[]>(CACHE_KEY, true);
  return stale.data || [];
}

export async function addUser(svc: ApiTransport, userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<User>> {
  const res = await svc.postToGas<User>('addUser', { userData });
  if (res.success) {
    await cache.invalidateEntity('users');
  }
  return res;
}

export async function updateUser(svc: ApiTransport, userId: string, userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('updateUser', { userId, userData });
  if (res.success) {
    await cache.invalidateEntity('users');
  }
  return res;
}

export async function deleteUser(svc: ApiTransport, userId: string): Promise<ApiResponse<any>> {
  const res = await svc.postToGas('deleteUser', { userId });
  if (res.success) {
    await cache.invalidateEntity('users');
  }
  return res;
}
