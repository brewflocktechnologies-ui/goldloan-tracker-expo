import { ApiResponse } from '../../types';
import { ApiTransport } from './transport';

export async function login(svc: ApiTransport, username: string, password: string): Promise<ApiResponse<{ username: string; role: 'SuperAdmin' | 'User'; token: string }>> {
  return svc.callGas('login', { username, password }, 'POST');
}

export async function logout(svc: ApiTransport): Promise<ApiResponse<any>> {
  const token = svc.getSessionToken();
  return svc.callGas('logout', { token }, 'POST');
}
