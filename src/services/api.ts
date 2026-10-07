import { ApiResponse } from '../types';
import * as adminUsers from './api/adminUsers';
import * as auth from './api/auth';
import * as bankAccounts from './api/bankAccounts';
import * as goldRatesApi from './api/goldRates';
import * as loans from './api/loans';
import * as ornaments from './api/ornaments';
import * as payments from './api/payments';
import * as sync from './api/sync';
import * as users from './api/users';
import { callGas } from './api/transport';
import type { ApiTransport } from './api/transport';
import { AdminUser, BankAccount, GoldRateData, InitialSyncData, Loan, Ornament, Payment, User } from '../types';

export { getDriveDirectImageUrl, getDriveImageUrl } from './api/driveUrl';
export { normalizeGoldRates } from './api/goldRates';

class ApiService implements ApiTransport {
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

  async callGas<T>(action: string, payload: any = {}, preferredMethod: 'POST' | 'GET' = 'GET'): Promise<ApiResponse<T>> {
    return callGas<T>(
      {
        sessionToken: this.sessionToken,
        getOnUnauthorized: () => this.onUnauthorizedCallback,
      },
      action,
      payload,
      preferredMethod
    );
  }

  async postToGas<T>(action: string, payload: any = {}): Promise<ApiResponse<T>> {
    return this.callGas<T>(action, payload, 'POST');
  }

  async getFromGas<T>(action: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.callGas<T>(action, params, 'GET');
  }

  // ─── UNIFIED INITIAL SYNC ───

  async getInitialSyncData(forceRefresh: boolean = false): Promise<ApiResponse<InitialSyncData>> {
    return sync.getInitialSyncData(this, forceRefresh);
  }

  // ─── DASHBOARD & RATES ───

  async getGoldRates(forceRefresh: boolean = false): Promise<{ data: GoldRateData; isCached: boolean }> {
    return goldRatesApi.getGoldRates(this, forceRefresh);
  }

  // ─── USERS / CUSTOMERS ───

  async getUsers(forceRefresh: boolean = false): Promise<User[]> {
    return users.getUsers(this, forceRefresh);
  }

  async addUser(userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<User>> {
    return users.addUser(this, userData);
  }

  async updateUser(userId: string, userData: Partial<User> & { files?: any[] }): Promise<ApiResponse<any>> {
    return users.updateUser(this, userId, userData);
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return users.deleteUser(this, userId);
  }

  // ─── BANK ACCOUNTS ───

  async getBankAccounts(userId?: string, forceRefresh: boolean = false): Promise<BankAccount[]> {
    return bankAccounts.getBankAccounts(this, userId, forceRefresh);
  }

  async addBankAccount(accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<BankAccount>> {
    return bankAccounts.addBankAccount(this, accountData);
  }

  async updateBankAccount(accountId: string, accountData: Partial<BankAccount> & { files?: any[] }): Promise<ApiResponse<any>> {
    return bankAccounts.updateBankAccount(this, accountId, accountData);
  }

  async deleteBankAccount(accountId: string): Promise<ApiResponse<any>> {
    return bankAccounts.deleteBankAccount(this, accountId);
  }

  // ─── ORNAMENTS ───

  async getOrnaments(userId?: string, forceRefresh: boolean = false): Promise<Ornament[]> {
    return ornaments.getOrnaments(this, userId, forceRefresh);
  }

  async addOrnament(ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<Ornament>> {
    return ornaments.addOrnament(this, ornamentData);
  }

  async updateOrnament(ornamentId: string, ornamentData: Partial<Ornament> & { files?: any[] }): Promise<ApiResponse<any>> {
    return ornaments.updateOrnament(this, ornamentId, ornamentData);
  }

  async deleteOrnament(ornamentId: string): Promise<ApiResponse<any>> {
    return ornaments.deleteOrnament(this, ornamentId);
  }

  // ─── LOANS ───

  async getLoans(userId?: string, status?: string, forceRefresh: boolean = false): Promise<Loan[]> {
    return loans.getLoans(this, userId, status, forceRefresh);
  }

  async addLoan(loanData: any): Promise<ApiResponse<Loan>> {
    return loans.addLoan(this, loanData);
  }

  async updateLoan(loanId: string, loanData: any): Promise<ApiResponse<any>> {
    return loans.updateLoan(this, loanId, loanData);
  }

  async closeAndReleaseLoan(loanId: string, closureRemarks: string = ''): Promise<ApiResponse<any>> {
    return loans.closeAndReleaseLoan(this, loanId, closureRemarks);
  }

  // ─── PAYMENTS ───

  async getPayments(loanId?: string, forceRefresh: boolean = false): Promise<Payment[]> {
    return payments.getPayments(this, loanId, forceRefresh);
  }

  async addPayment(paymentData: Partial<Payment>): Promise<ApiResponse<Payment>> {
    return payments.addPayment(this, paymentData);
  }

  // ─── AUTHENTICATION ───

  async login(username: string, password: string): Promise<ApiResponse<{ username: string; role: 'SuperAdmin' | 'User'; token: string }>> {
    return auth.login(this, username, password);
  }

  async logout(): Promise<ApiResponse<any>> {
    return auth.logout(this);
  }

  // ─── ADMIN USER MANAGEMENT (From Google Sheets) ───

  async getAdminUsers(forceRefresh: boolean = false): Promise<ApiResponse<AdminUser[]>> {
    return adminUsers.getAdminUsers(this, forceRefresh);
  }

  async addAdminUser(userData: { username: string; password: string; role: 'SuperAdmin' | 'User'; status?: string }): Promise<ApiResponse<AdminUser>> {
    return adminUsers.addAdminUser(this, userData);
  }

  async updateAdminUser(adminId: string, updateData: { role?: string; status?: string; password?: string }): Promise<ApiResponse<string>> {
    return adminUsers.updateAdminUser(this, adminId, updateData);
  }

  async changePassword(newPassword: string, oldPassword?: string): Promise<ApiResponse<string>> {
    return adminUsers.changePassword(this, newPassword, oldPassword);
  }

  async deleteAdminLoginUser(adminId: string): Promise<ApiResponse<string>> {
    return adminUsers.deleteAdminLoginUser(this, adminId);
  }
}

export const api = new ApiService();
