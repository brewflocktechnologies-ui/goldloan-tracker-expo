import { AdminUser, ApiResponse } from '../../types';
import { cache, CacheTTL } from '../cache';
import { ApiTransport } from './transport';

export async function getAdminUsers(svc: ApiTransport, forceRefresh: boolean = false): Promise<ApiResponse<AdminUser[]>> {
  const CACHE_KEY = 'admin_users_list';
  if (!forceRefresh) {
    const cached = await cache.get<AdminUser[]>(CACHE_KEY);
    if (cached.data) return { success: true, data: cached.data, isCached: true };
  }

  const res = await svc.callGas<AdminUser[]>('getAdminUsers', {}, 'GET');
  if (res.success && res.data) {
    await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
    return { success: true, data: res.data, isCached: false };
  }

  const stale = await cache.get<AdminUser[]>(CACHE_KEY, true);
  if (stale.data && stale.data.length > 0) {
    return { success: true, data: stale.data, isCached: true, isFallback: true };
  }

  return res;
}

export async function addAdminUser(svc: ApiTransport, userData: { username: string; password: string; role: 'SuperAdmin' | 'User'; status?: string }): Promise<ApiResponse<AdminUser>> {
  const res = await svc.callGas<AdminUser>('addAdminUser', { userData }, 'POST');
  if (res.success) {
    await cache.invalidate('admin_users_list');
  }
  return res;
}

export async function updateAdminUser(svc: ApiTransport, adminId: string, updateData: { role?: string; status?: string; password?: string }): Promise<ApiResponse<string>> {
  const res = await svc.callGas<string>('updateAdminUser', { adminId, updateData, ...updateData }, 'POST');
  if (res.success) {
    await cache.invalidate('admin_users_list');
  }
  return res;
}

export async function changePassword(svc: ApiTransport, newPassword: string, oldPassword?: string): Promise<ApiResponse<string>> {
  return svc.callGas<string>('changePassword', { newPassword, oldPassword }, 'POST');
}

export async function deleteAdminLoginUser(svc: ApiTransport, adminId: string): Promise<ApiResponse<string>> {
  const res = await svc.callGas<string>('deleteAdminLoginUser', { adminId }, 'POST');
  if (res.success) {
    await cache.invalidate('admin_users_list');
  }
  return res;
}
