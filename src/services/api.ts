import { ApiConfig } from '../config/api';
import { cache, CacheTTL } from './cache';
import { 
  User, BankAccount, Ornament, Loan, Payment, 
  DashboardData, GoldRateData, ApiResponse, InitialSyncData, AdminUser 
} from '../types';

/**
 * Helper to convert Google Drive sharing links to direct image thumbnail URLs
 * for rendering inside React Native Image and expo-image components.
 */
export function getDriveDirectImageUrl(driveUrl?: string | null): string | undefined {
  if (!driveUrl) return undefined;
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return driveUrl;
}

export const getDriveImageUrl = getDriveDirectImageUrl;

const emptyDashboardData: DashboardData = {
  totalUsers: 0,
  totalBankAccounts: 0,
  totalOrnaments: 0,
  pledgedOrnamentsCount: 0,
  pledgedGrams: 0,
  activeLoans: 0,
  closedLoans: 0,
  totalLoanAmount: 0,
  totalEligibleLoanAmount: 0,
  totalAvailableLoanAmount: 0,
  totalGoldWeight: 0,
  totalBuyingGoldValue: 0,
  recentTransactions: [],
};

const defaultGoldRates: GoldRateData = {
  location: "Bangalore",
  updatedAt: new Date().toISOString(),
  displayDate: "Live Rates",
  gold24k: { rate1g: 8850, change: 0, direction: "up" },
  gold22k: { rate1g: 8115, change: 0, direction: "up" },
  gold18k: { rate1g: 6640, change: 0, direction: "up" },
};

class ApiService {
  /**
   * Helper to convert Google Drive sharing links to direct image thumbnail URLs
   */
  getDriveImageUrl = getDriveDirectImageUrl;

  private sessionToken: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  onUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  /**
   * Universal HTTP request to Google Apps Script Web App
   * Always appends action query parameter to preserve action during Google redirects.
   * Uses GET for queries and POST for mutations with automatic fallback.
   */
  async callGas<T>(action: string, payload: any = {}, preferredMethod: 'POST' | 'GET' = 'GET'): Promise<ApiResponse<T>> {
    const baseUrl = ApiConfig.getApiUrl();
    if (!baseUrl) {
      return { success: false, error: "Google Apps Script Web App URL not configured." };
    }

    const methods: ('GET' | 'POST')[] = preferredMethod === 'GET' ? ['GET', 'POST'] : ['POST', 'GET'];

    // Automatically attach active session token if present
    const token = this.sessionToken;
    const enrichedPayload = token && !payload.token ? { token, ...payload } : payload;

    for (const method of methods) {
      try {
        let response: Response;
        const separator = baseUrl.includes('?') ? '&' : '?';

        if (method === 'POST') {
          // Always keep action and token in URL query so Google 302 redirect preserves them
          const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
          const urlWithAction = `${baseUrl}${separator}action=${encodeURIComponent(action)}${tokenParam}`;
          response = await fetch(urlWithAction, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action, ...enrichedPayload }),
          });
        } else {
          // For GET, append action and any scalar payload properties as query parameters
          const queryParams: Record<string, string> = { action };
          for (const [k, v] of Object.entries(enrichedPayload)) {
            if (v !== undefined && v !== null && typeof v !== 'object') {
              queryParams[k] = String(v);
            }
          }
          const query = new URLSearchParams(queryParams).toString();
          response = await fetch(`${baseUrl}${separator}${query}`);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            // Check for unauthorized / expired session token
            if (token && parsed.code === 401 && action !== 'login' && action !== 'logout') {
              console.warn(`[API] 401 Unauthorized encountered on action "${action}".`);
              if (this.onUnauthorizedCallback) {
                this.onUnauthorizedCallback();
              }
            }

            // If response indicates action was dropped on redirect, try the fallback method!
            if (parsed.success === false && parsed.error === 'No action specified in request') {
              console.warn(`[API] ${method} returned 'No action specified in request', attempting fallback method...`);
              continue;
            }
            return parsed;
          }
        } catch {
          if (text.includes('Success') || text.includes('success')) {
            return { success: true, data: text as any };
          }
          if (method === methods[methods.length - 1]) {
            return { success: false, error: `Invalid server response: ${text.slice(0, 100)}` };
          }
        }
      } catch (err: any) {
        if (method === methods[methods.length - 1]) {
          return { success: false, error: err.message || 'Network request failed.' };
        }
      }
    }

    return { success: false, error: 'Failed to communicate with Google Sheets backend.' };
  }

  async postToGas<T>(action: string, payload: any = {}): Promise<ApiResponse<T>> {
    return this.callGas<T>(action, payload, 'POST');
  }

  async getFromGas<T>(action: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.callGas<T>(action, params, 'GET');
  }

  // ─── UNIFIED INITIAL SYNC ───

  /**
   * Fetch all app data in a single unified round-trip from Google Sheets with intelligent caching
   */
  async getInitialSyncData(forceRefresh: boolean = false): Promise<ApiResponse<InitialSyncData>> {
    const CACHE_KEY = 'initial_sync_data';

    if (!forceRefresh) {
      const cached = await cache.get<InitialSyncData>(CACHE_KEY);
      if (cached.data) {
        return { success: true, data: cached.data, isCached: true };
      }
    }

    const res = await this.callGas<InitialSyncData>('getInitialSyncData', {}, 'GET');
    if (res.success && res.data) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.SYNC_DATA);
      // Pre-populate individual entity caches
      if (res.data.users) await cache.set('users_list', res.data.users, CacheTTL.LISTS);
      if (res.data.bankAccounts) await cache.set('bank_accounts_all', res.data.bankAccounts, CacheTTL.LISTS);
      if (res.data.ornaments) await cache.set('ornaments_all', res.data.ornaments, CacheTTL.LISTS);
      if (res.data.loans) await cache.set('loans_all', res.data.loans, CacheTTL.LISTS);
      if (res.data.payments) await cache.set('payments_all', res.data.payments, CacheTTL.LISTS);
      if (res.data.goldRates) await cache.set('gold_rates_bangalore', res.data.goldRates, CacheTTL.GOLD_RATES);
      if (res.data.adminUsers) await cache.set('admin_users_list', res.data.adminUsers, CacheTTL.LISTS);
      return { success: true, data: res.data, isCached: false };
    }

    // Network request failed - fall back to stale cache
    const stale = await cache.get<InitialSyncData>(CACHE_KEY, true);
    if (stale.data) {
      return { success: true, data: stale.data, isCached: true, isFallback: true };
    }

    return res;
  }

  // ─── DASHBOARD & RATES ───

  async getDashboardData(forceRefresh: boolean = false): Promise<{ data: DashboardData; isCached: boolean }> {
    const CACHE_KEY = 'dashboard_kpis';

    if (!forceRefresh) {
      const cached = await cache.get<DashboardData>(CACHE_KEY);
      if (cached.data) {
        return { data: cached.data, isCached: true };
      }
    }

    const res = await this.getFromGas<DashboardData>('getDashboardData');
    if (res.success && res.data) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.DASHBOARD);
      return { data: res.data, isCached: false };
    }

    // Fallback to stale cache if network fails
    const stale = await cache.get<DashboardData>(CACHE_KEY, true);
    if (stale.data) {
      return { data: stale.data, isCached: true };
    }

    return { data: emptyDashboardData, isCached: false };
  }

  async getGoldRates(forceRefresh: boolean = false): Promise<{ data: GoldRateData; isCached: boolean }> {
    const CACHE_KEY = 'gold_rates_bangalore';

    if (!forceRefresh) {
      const cached = await cache.get<GoldRateData>(CACHE_KEY);
      if (cached.data) {
        return { data: cached.data, isCached: true };
      }
    }

    const res = await this.getFromGas<GoldRateData>('getGoldRates');
    if (res.success && res.data) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.GOLD_RATES);
      return { data: res.data, isCached: false };
    }

    const stale = await cache.get<GoldRateData>(CACHE_KEY, true);
    if (stale.data) {
      return { data: stale.data, isCached: true };
    }

    return { data: defaultGoldRates, isCached: false };
  }

  // ─── USERS / CUSTOMERS ───

  async getUsers(forceRefresh: boolean = false): Promise<User[]> {
    const CACHE_KEY = 'users_list';

    if (!forceRefresh) {
      const cached = await cache.get<User[]>(CACHE_KEY);
      if (cached.data) return cached.data;
    }

    const res = await this.getFromGas<User[]>('getUsers');
    if (res.success && res.data) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
      return res.data;
    }

    const stale = await cache.get<User[]>(CACHE_KEY, true);
    return stale.data || [];
  }

  async addUser(userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<User>> {
    const res = await this.postToGas<User>('addUser', { userData });
    if (res.success) {
      await cache.invalidateEntity('users');
    }
    return res;
  }

  async updateUser(userId: string, userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<any>> {
    const res = await this.postToGas('updateUser', { userId, userData });
    if (res.success) {
      await cache.invalidateEntity('users');
    }
    return res;
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    const res = await this.postToGas('deleteUser', { userId });
    if (res.success) {
      await cache.invalidateEntity('users');
    }
    return res;
  }

  // ─── BANK ACCOUNTS ───

  async getBankAccounts(userId?: string, forceRefresh: boolean = false): Promise<BankAccount[]> {
    const CACHE_KEY = userId ? `bank_accounts_${userId}` : 'bank_accounts_all';

    if (!forceRefresh) {
      const cached = await cache.get<BankAccount[]>(CACHE_KEY);
      if (cached.data) return cached.data;
    }

    const res = await this.getFromGas<BankAccount[]>('getBankAccounts', userId ? { userId } : {});
    if (res.success && Array.isArray(res.data)) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
      return res.data;
    }

    const stale = await cache.get<BankAccount[]>(CACHE_KEY, true);
    return stale.data || [];
  }

  async addBankAccount(accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<BankAccount>> {
    const res = await this.postToGas<BankAccount>('addBankAccount', { accountData });
    if (res.success) {
      await cache.invalidateEntity('bank_accounts');
    }
    return res;
  }

  async updateBankAccount(accountId: string, accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<any>> {
    const res = await this.postToGas('updateBankAccount', { accountId, accountData });
    if (res.success) {
      await cache.invalidateEntity('bank_accounts');
    }
    return res;
  }

  async deleteBankAccount(accountId: string): Promise<ApiResponse<any>> {
    const res = await this.postToGas('deleteBankAccount', { accountId });
    if (res.success) {
      await cache.invalidateEntity('bank_accounts');
    }
    return res;
  }

  // ─── ORNAMENTS ───

  async getOrnaments(userId?: string, forceRefresh: boolean = false): Promise<Ornament[]> {
    const CACHE_KEY = userId ? `ornaments_${userId}` : 'ornaments_all';

    if (!forceRefresh) {
      const cached = await cache.get<Ornament[]>(CACHE_KEY);
      if (cached.data) return cached.data;
    }

    const res = await this.getFromGas<Ornament[]>('getOrnaments', userId ? { userId } : {});
    if (res.success && Array.isArray(res.data)) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
      return res.data;
    }

    const stale = await cache.get<Ornament[]>(CACHE_KEY, true);
    return stale.data || [];
  }

  async getAvailableOrnaments(): Promise<Ornament[]> {
    const res = await this.getFromGas<Ornament[]>('getAvailableOrnaments');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  async addOrnament(ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<Ornament>> {
    const res = await this.postToGas<Ornament>('addOrnament', { ornamentData });
    if (res.success) {
      await cache.invalidateEntity('ornaments');
    }
    return res;
  }

  async updateOrnament(ornamentId: string, ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<any>> {
    const res = await this.postToGas('updateOrnament', { ornamentId, ornamentData });
    if (res.success) {
      await cache.invalidateEntity('ornaments');
    }
    return res;
  }

  async deleteOrnament(ornamentId: string): Promise<ApiResponse<any>> {
    const res = await this.postToGas('deleteOrnament', { ornamentId });
    if (res.success) {
      await cache.invalidateEntity('ornaments');
    }
    return res;
  }

  async deleteOrnamentImage(ornamentId: string, imageUrl: string): Promise<ApiResponse<any>> {
    const res = await this.postToGas('deleteOrnamentImage', { ornamentId, imageUrl });
    if (res.success) {
      await cache.invalidateEntity('ornaments');
    }
    return res;
  }

  // ─── LOANS ───

  async getLoans(userId?: string, status?: string, forceRefresh: boolean = false): Promise<Loan[]> {
    const CACHE_KEY = `loans_${userId || 'all'}_${status || 'all'}`;

    if (!forceRefresh) {
      const cached = await cache.get<Loan[]>(CACHE_KEY);
      if (cached.data) return cached.data;
    }

    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    if (status) params.status = status;

    const res = await this.getFromGas<Loan[]>('getLoans', params);
    if (res.success && Array.isArray(res.data)) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
      return res.data;
    }

    const stale = await cache.get<Loan[]>(CACHE_KEY, true);
    return stale.data || [];
  }

  async addLoan(loanData: any): Promise<ApiResponse<Loan>> {
    const res = await this.postToGas<Loan>('addLoan', { loanData });
    if (res.success) {
      await cache.invalidateEntity('loans');
      await cache.invalidate('ornaments');
      await cache.invalidate('bank_accounts');
    }
    return res;
  }

  async updateLoan(loanId: string, loanData: any): Promise<ApiResponse<any>> {
    const res = await this.postToGas('updateLoan', { loanId, loanData });
    if (res.success) {
      await cache.invalidateEntity('loans');
      await cache.invalidate('ornaments');
      await cache.invalidate('bank_accounts');
    }
    return res;
  }

  async closeAndReleaseLoan(loanId: string, closureRemarks: string = ''): Promise<ApiResponse<any>> {
    const res = await this.postToGas('closeAndReleaseLoan', { loanId, closureRemarks });
    if (res.success) {
      await cache.invalidateEntity('loans');
      await cache.invalidate('ornaments');
      await cache.invalidate('bank_accounts');
    }
    return res;
  }

  async getActiveLoansForClosure(): Promise<Loan[]> {
    const res = await this.getFromGas<Loan[]>('getActiveLoansForClosure');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  async getLoanDetails(loanId: string): Promise<ApiResponse<any>> {
    return this.getFromGas('getLoanDetails', { loanId });
  }

  // ─── PAYMENTS ───

  async getPayments(loanId?: string, forceRefresh: boolean = false): Promise<Payment[]> {
    const CACHE_KEY = loanId ? `payments_${loanId}` : 'payments_all';

    if (!forceRefresh) {
      const cached = await cache.get<Payment[]>(CACHE_KEY);
      if (cached.data) return cached.data;
    }

    const res = await this.getFromGas<Payment[]>('getPayments', loanId ? { loanId } : {});
    if (res.success && Array.isArray(res.data)) {
      await cache.set(CACHE_KEY, res.data, CacheTTL.LISTS);
      return res.data;
    }

    const stale = await cache.get<Payment[]>(CACHE_KEY, true);
    return stale.data || [];
  }

  async addPayment(paymentData: Partial<Payment>): Promise<ApiResponse<Payment>> {
    const res = await this.postToGas<Payment>('addPayment', { paymentData });
    if (res.success) {
      await cache.invalidateEntity('payments');
      await cache.invalidateEntity('loans');
    }
    return res;
  }

  // ─── AUTHENTICATION ───

  async login(username: string, password: string): Promise<ApiResponse<{ username: string; role: 'SuperAdmin' | 'User'; token: string }>> {
    return this.callGas('login', { username, password }, 'POST');
  }

  async logout(): Promise<ApiResponse<any>> {
    const token = this.sessionToken;
    return this.callGas('logout', { token }, 'POST');
  }

  // ─── ADMIN USER MANAGEMENT (From Google Sheets) ───

  async getAdminUsers(forceRefresh: boolean = false): Promise<ApiResponse<AdminUser[]>> {
    const CACHE_KEY = 'admin_users_list';
    if (!forceRefresh) {
      const cached = await cache.get<AdminUser[]>(CACHE_KEY);
      if (cached.data) return { success: true, data: cached.data, isCached: true };
    }

    const res = await this.callGas<AdminUser[]>('getAdminUsers', {}, 'GET');
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

  async addAdminUser(userData: { username: string; password: string; role: 'SuperAdmin' | 'User'; status?: string }): Promise<ApiResponse<AdminUser>> {
    const res = await this.callGas<AdminUser>('addAdminUser', { userData }, 'POST');
    if (res.success) {
      await cache.invalidate('admin_users_list');
    }
    return res;
  }

  async updateAdminUser(adminId: string, updateData: { role?: string; status?: string; password?: string }): Promise<ApiResponse<string>> {
    const res = await this.callGas<string>('updateAdminUser', { adminId, updateData, ...updateData }, 'POST');
    if (res.success) {
      await cache.invalidate('admin_users_list');
    }
    return res;
  }

  async changePassword(newPassword: string, oldPassword?: string): Promise<ApiResponse<string>> {
    return this.callGas<string>('changePassword', { newPassword, oldPassword }, 'POST');
  }

  async deleteAdminLoginUser(adminId: string): Promise<ApiResponse<string>> {
    const res = await this.callGas<string>('deleteAdminLoginUser', { adminId }, 'POST');
    if (res.success) {
      await cache.invalidate('admin_users_list');
    }
    return res;
  }
}

export const api = new ApiService();
api.getDriveImageUrl = getDriveDirectImageUrl;
