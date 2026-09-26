import { useEffect, useState } from 'react';
import { BankAccount, DashboardData, GoldRateData, InitialSyncData, Loan, Ornament, Payment, User } from '../types';
import { api } from './api';
import { calculateOrnamentFigures, generateCustomerCode } from '../utils/userOrnamentCalculations';
import { cache, CacheTTL } from './cache';

const defaultGoldRates: GoldRateData = {
  location: "Bangalore",
  updatedAt: new Date().toISOString(),
  displayDate: "Live Rates",
  gold24k: { rate1g: 8850, change: 0, direction: "up" },
  gold22k: { rate1g: 8115, change: 0, direction: "up" },
  gold18k: { rate1g: 6640, change: 0, direction: "up" },
};

// Global in-memory state so changes persist across screen transitions
let usersState: User[] = [];
let bankAccountsState: BankAccount[] = [];
let ornamentsState: Ornament[] = [];
let loansState: Loan[] = [];
let paymentsState: Payment[] = [];
let goldRatesState: GoldRateData = { ...defaultGoldRates };

let isSyncing = false;
let lastSyncedAt: string | null = null;
let lastSyncTimestamp = 0;
let hasInitialized = false;
let isCacheHydrated = false;
let syncError: string | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

/**
 * Hydrate in-memory state from L2 persistent storage (AsyncStorage) immediately on boot.
 * Delivers instant offline UI before any network requests complete.
 */
export async function hydrateFromCache() {
  if (isCacheHydrated) return;
  try {
    // 1. Check unified sync snapshot first (fastest, all entities in 1 read)
    const syncSnapshot = await cache.get<InitialSyncData>('initial_sync_data', true);
    let updated = false;

    if (syncSnapshot.data) {
      const d = syncSnapshot.data;
      if (Array.isArray(d.users) && d.users.length > 0) {
        usersState = d.users;
        updated = true;
      }
      if (Array.isArray(d.bankAccounts) && d.bankAccounts.length > 0) {
        bankAccountsState = d.bankAccounts;
        updated = true;
      }
      if (Array.isArray(d.ornaments) && d.ornaments.length > 0) {
        ornamentsState = d.ornaments;
        updated = true;
      }
      if (Array.isArray(d.loans) && d.loans.length > 0) {
        loansState = d.loans;
        updated = true;
      }
      if (Array.isArray(d.payments) && d.payments.length > 0) {
        paymentsState = d.payments;
        updated = true;
      }
      if (d.goldRates) {
        goldRatesState = d.goldRates;
        updated = true;
      }
    }

    // 2. Also check individual entity caches for any missing collections
    const [cachedUsers, cachedBanks, cachedOrns, cachedLoans, cachedPayments, cachedRates] = await Promise.all([
      usersState.length === 0 ? cache.get<User[]>('users_list', true) : Promise.resolve({ data: null }),
      bankAccountsState.length === 0 ? cache.get<BankAccount[]>('bank_accounts_all', true) : Promise.resolve({ data: null }),
      ornamentsState.length === 0 ? cache.get<Ornament[]>('ornaments_all', true) : Promise.resolve({ data: null }),
      loansState.length === 0 ? cache.get<Loan[]>('loans_all', true) : Promise.resolve({ data: null }),
      paymentsState.length === 0 ? cache.get<Payment[]>('payments_all', true) : Promise.resolve({ data: null }),
      !syncSnapshot.data?.goldRates ? cache.get<GoldRateData>('gold_rates_bangalore', true) : Promise.resolve({ data: null }),
    ]);

    if (cachedUsers.data && cachedUsers.data.length > 0) {
      usersState = cachedUsers.data;
      updated = true;
    }
    if (cachedBanks.data && cachedBanks.data.length > 0) {
      bankAccountsState = cachedBanks.data;
      updated = true;
    }
    if (cachedOrns.data && cachedOrns.data.length > 0) {
      ornamentsState = cachedOrns.data;
      updated = true;
    }
    if (cachedLoans.data && cachedLoans.data.length > 0) {
      loansState = cachedLoans.data;
      updated = true;
    }
    if (cachedPayments.data && cachedPayments.data.length > 0) {
      paymentsState = cachedPayments.data;
      updated = true;
    }
    if (cachedRates.data) {
      goldRatesState = cachedRates.data;
      updated = true;
    }

    isCacheHydrated = true;
    if (updated) notify();

    // Trigger non-blocking real-time gold rates refresh on boot
    refreshGoldRates(false).catch(e => console.warn('[Store] Boot gold rates fetch:', e));
  } catch (e) {
    console.warn('[Store] hydrateFromCache warning:', e);
  }
}

let isFetchingGoldRates = false;

/**
 * Directly refresh Bangalore live gold rates from Google Apps Script web scraper
 */
export async function refreshGoldRates(force: boolean = false): Promise<GoldRateData> {
  if (isFetchingGoldRates) return goldRatesState;
  isFetchingGoldRates = true;
  notify();
  try {
    const res = await api.getGoldRates(force);
    if (res && res.data) {
      goldRatesState = res.data;
      notify();
      return res.data;
    }
  } catch (err) {
    console.warn('[Store] refreshGoldRates error:', err);
  } finally {
    isFetchingGoldRates = false;
    notify();
  }
  return goldRatesState;
}

export async function syncFromBackend(force: boolean = false) {
  if (isSyncing && !force) return;

  // Prevent unauthenticated background calls if session token is not set yet
  if (!api.getSessionToken()) {
    return;
  }

  const now = Date.now();
  // Prevent spamming requests within 10 seconds unless user explicitly requested (e.g. pull-to-refresh)
  if (!force && now - lastSyncTimestamp < 10000) return;

  if (!isCacheHydrated) {
    await hydrateFromCache();
  }

  isSyncing = true;
  notify();

  try {
    // 1. First attempt fast unified sync (1 round trip) via GET
    const syncRes = await api.getInitialSyncData(force);
    if (syncRes.success && syncRes.data) {
      const data = syncRes.data;
      if (Array.isArray(data.users)) usersState = data.users;
      if (Array.isArray(data.bankAccounts)) bankAccountsState = data.bankAccounts;
      if (Array.isArray(data.ornaments)) ornamentsState = data.ornaments;
      if (Array.isArray(data.loans)) loansState = data.loans;
      if (Array.isArray(data.payments)) paymentsState = data.payments;
      if (data.goldRates) goldRatesState = data.goldRates;

      lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      lastSyncTimestamp = Date.now();
      syncError = null;
      notify();
      return;
    }

    // 2. Fallback: individual entity endpoints if unified sync was unavailable
    const [usersRes, banksRes, ornsRes, loansRes, paymentsRes, ratesRes] = await Promise.allSettled([
      api.getUsers(force),
      api.getBankAccounts(undefined, force),
      api.getOrnaments(undefined, force),
      api.getLoans(undefined, undefined, force),
      api.getPayments(undefined, force),
      api.getGoldRates(force),
    ]);

    if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
      usersState = usersRes.value;
    }
    if (banksRes.status === 'fulfilled' && Array.isArray(banksRes.value)) {
      bankAccountsState = banksRes.value;
    }
    if (ornsRes.status === 'fulfilled' && Array.isArray(ornsRes.value)) {
      ornamentsState = ornsRes.value;
    }
    if (loansRes.status === 'fulfilled' && Array.isArray(loansRes.value)) {
      loansState = loansRes.value;
    }
    if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value)) {
      paymentsState = paymentsRes.value;
    }
    if (ratesRes.status === 'fulfilled' && ratesRes.value.data) {
      goldRatesState = ratesRes.value.data;
    }

    lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSyncTimestamp = Date.now();
    syncError = null;
  } catch (err: any) {
    console.warn('[Store] syncFromBackend error:', err);
    syncError = err.message || 'Sync failed';
  } finally {
    isSyncing = false;
    notify();
  }
}

function calculateUserBankUtilization(userId: string, bankAccountId: string): number {
  return loansState
    .filter(l => l.UserId === userId && l.BankAccountId === bankAccountId && l.LoanStatus === 'Active')
    .reduce((sum, l) => sum + (Number(l.LoanAmount) || 0), 0);
}

export function calculateLoanPeriodInterest(params: {
  LoanAmount: number;
  InterestRate: number;
  InterestType: string;
  LoanPeriod: string;
  LoanDate?: string;
  DueDate?: string;
}): number {
  const { LoanAmount, InterestRate, InterestType, LoanPeriod, LoanDate, DueDate } = params;
  let months = 12;
  if (LoanPeriod) {
    const match = LoanPeriod.match(/(\d+)/);
    if (match) months = parseInt(match[1], 10);
  } else if (LoanDate && DueDate) {
    const start = new Date(LoanDate);
    const end = new Date(DueDate);
    const diffDays = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    months = Math.max(1, Math.round(diffDays / 30));
  }

  const monthlyRate = (InterestRate || 0) / 100;
  if (InterestType === 'Compound') {
    return Math.round(LoanAmount * (Math.pow(1 + monthlyRate, months) - 1));
  }
  return Math.round(LoanAmount * monthlyRate * months);
}

function nextId(prefix: string, list: any[], key: string): string {
  const max = list.reduce((m, item) => {
    const raw = String(item[key] || '');
    const num = parseInt(raw.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > m ? num : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);

    // Initial hydration and silent background sync on component mount
    if (!hasInitialized) {
      hasInitialized = true;
      hydrateFromCache().then(() => {
        syncFromBackend();
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getDashboardData = (): DashboardData => {
    const activeLoans = loansState.filter(l => l.LoanStatus === 'Active');
    const closedLoans = loansState.filter(l => l.LoanStatus === 'Closed');
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + (Number(l.LoanAmount) || 0), 0);

    const activeUsers = usersState.filter(u => u.Status === 'Active');
    const activeBankAccounts = bankAccountsState.filter(b => b.Status === 'Active');
    const allOrnaments = ornamentsState.filter(o => o.Status !== 'Deleted');
    const pledgedOrnaments = allOrnaments.filter(o => o.Status === 'Pledged');

    const totalEligibleLoanAmount = activeBankAccounts.reduce((sum, b) => sum + (Number(b.MaxLoanAmount) || 0), 0);
    const totalAvailableLoanAmount = activeBankAccounts.reduce((sum, b) => {
      const maxL = Number(b.MaxLoanAmount) || 0;
      const util = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return sum + Math.max(0, maxL - util);
    }, 0);

    let totalGoldWeight = 0;
    let totalBuyingGoldValue = 0;
    allOrnaments.forEach(o => {
      const metal = Number(o.MetalWeight);
      const net = Number(o.NetWeight);
      const gross = Number(o.GrossWeight) || 0;
      const weight = !isNaN(metal) && metal > 0 ? metal : (!isNaN(net) && net > 0 ? net : gross);
      totalGoldWeight += weight;

      const buyPrice = Number(o.BuyingPricePerGram) || 0;
      const buyCost = Number(o.BuyingCost) || (weight * buyPrice);
      totalBuyingGoldValue += buyCost;
    });

    const pledgedGrams = pledgedOrnaments.reduce((sum, o) => {
      const gross = Number(o.GrossWeight) || 0;
      const net = Number(o.NetWeight) || 0;
      const metal = Number(o.MetalWeight) || 0;
      return sum + (metal > 0 ? metal : (net > 0 ? net : gross));
    }, 0);

    const recentTransactions = [...paymentsState]
      .sort((a, b) => new Date(b.PaymentDate || b.CreatedDate || '').getTime() - new Date(a.PaymentDate || a.CreatedDate || '').getTime())
      .slice(0, 5);

    return {
      totalUsers: activeUsers.length,
      totalBankAccounts: activeBankAccounts.length,
      totalOrnaments: allOrnaments.length,
      pledgedOrnamentsCount: pledgedOrnaments.length,
      pledgedGrams: Math.round(pledgedGrams * 100) / 100,
      activeLoans: activeLoans.length,
      closedLoans: closedLoans.length,
      totalLoanAmount,
      totalEligibleLoanAmount,
      totalAvailableLoanAmount,
      totalGoldWeight: Math.round(totalGoldWeight * 100) / 100,
      totalBuyingGoldValue: Math.round(totalBuyingGoldValue),
      recentTransactions,
    };
  };

  // --- CRUD: Users ---

  const addUser = (userData: Partial<User> & { files?: any[] }) => {
    const tempId = nextId('U', usersState, 'UserId');
    const newUser: User = {
      UserId: tempId,
      CustomerCode: userData.CustomerCode || generateCustomerCode(usersState.length),
      FullName: userData.FullName || 'New Customer',
      FatherHusbandName: userData.FatherHusbandName || '',
      MobileNumber: userData.MobileNumber || '',
      AlternateMobileNumber: userData.AlternateMobileNumber || '',
      Email: userData.Email || '',
      DateOfBirth: userData.DateOfBirth || '',
      Gender: userData.Gender || 'Male',
      AadhaarNumber: userData.AadhaarNumber || '',
      PANNumber: userData.PANNumber || '',
      AddressLine1: userData.AddressLine1 || '',
      AddressLine2: userData.AddressLine2 || '',
      City: userData.City || 'Bengaluru',
      State: userData.State || 'Karnataka',
      Pincode: userData.Pincode || '560001',
      Occupation: userData.Occupation || '',
      CustomerPhoto: userData.CustomerPhoto || '',
      Status: (userData.Status as any) || 'Active',
      CreatedDate: new Date().toISOString(),
    };
    usersState = [newUser, ...usersState];
    cache.set('users_list', usersState, CacheTTL.LISTS);
    notify();

    api.addUser(userData).then(res => {
      if (res.success && res.data) {
        usersState = usersState.map(u => u.UserId === tempId ? { ...u, ...res.data } : u);
        cache.set('users_list', usersState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] addUser error:', err));

    return newUser;
  };

  const updateUser = (userId: string, updated: Partial<User> & { files?: any[] }) => {
    usersState = usersState.map(u => u.UserId === userId ? { ...u, ...updated, UpdatedDate: new Date().toISOString() } : u);
    cache.set('users_list', usersState, CacheTTL.LISTS);
    notify();

    api.updateUser(userId, updated).catch(err => console.warn('[Store] updateUser error:', err));
  };

  const deleteUser = (userId: string) => {
    usersState = usersState.filter(u => u.UserId !== userId);
    cache.set('users_list', usersState, CacheTTL.LISTS);
    notify();

    api.deleteUser(userId).catch(err => console.warn('[Store] deleteUser error:', err));
  };

  // --- CRUD: Bank Accounts ---

  const addBankAccount = (accData: Partial<BankAccount> & { files?: any[] }) => {
    const tempId = nextId('BA', bankAccountsState, 'BankAccountId');
    const max = Number(accData.MaxLoanAmount) || 0;
    const util = Number(accData.UtilizedLoanAmount) || 0;
    const newAcc: BankAccount = {
      BankAccountId: tempId,
      UserId: accData.UserId || usersState[0]?.UserId || 'U001',
      AccountHolderName: accData.AccountHolderName || '',
      AccountNumber: accData.AccountNumber || '',
      BankName: accData.BankName || '',
      BranchName: accData.BranchName || '',
      City: accData.City || 'Bengaluru',
      IFSCCode: accData.IFSCCode || '',
      AccountType: accData.AccountType || 'Savings',
      UPI_ID: accData.UPI_ID || '',
      PassbookImage: accData.PassbookImage || '',
      Status: (accData.Status as any) || 'Active',
      CreatedDate: new Date().toISOString(),
      MaxLoanAmount: max,
      UtilizedLoanAmount: util,
      AvailableLoanAmount: Math.max(0, max - util),
    };
    bankAccountsState = [newAcc, ...bankAccountsState];
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.addBankAccount(accData).then(res => {
      if (res.success && res.data) {
        bankAccountsState = bankAccountsState.map(b => b.BankAccountId === tempId ? { ...b, ...res.data } : b);
        cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] addBankAccount error:', err));

    return newAcc;
  };

  const updateBankAccount = (accId: string, updated: Partial<BankAccount> & { files?: any[] }) => {
    bankAccountsState = bankAccountsState.map(b => {
      if (b.BankAccountId === accId) {
        const merged = { ...b, ...updated, UpdatedDate: new Date().toISOString() };
        const max = Number(merged.MaxLoanAmount) || 0;
        const util = Number(merged.UtilizedLoanAmount) || 0;
        merged.AvailableLoanAmount = Math.max(0, max - util);
        return merged;
      }
      return b;
    });
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.updateBankAccount(accId, updated).catch(err => console.warn('[Store] updateBankAccount error:', err));
  };

  const deleteBankAccount = (accId: string) => {
    bankAccountsState = bankAccountsState.filter(b => b.BankAccountId !== accId);
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.deleteBankAccount(accId).catch(err => console.warn('[Store] deleteBankAccount error:', err));
  };

  // --- CRUD: Ornaments ---

  const addOrnament = (ornData: Partial<Ornament> & { files?: any[] }) => {
    const tempId = nextId('ORN', ornamentsState, 'OrnamentId');
    const { gross, stone, metal, net, buyingPrice, currentPrice, buyingCost, marketValue, appreciationValue, appreciationPercentage } =
      calculateOrnamentFigures(ornData);

    const newOrn: Ornament = {
      OrnamentId: tempId,
      UserId: ornData.UserId || usersState[0]?.UserId || 'U001',
      OrnamentName: ornData.OrnamentName || 'Gold Item',
      OrnamentType: ornData.OrnamentType || 'Necklace',
      OrnamentCategory: ornData.OrnamentCategory || 'Neckwear',
      Description: ornData.Description || '',
      GrossWeight: gross,
      StoneWeight: stone,
      NetWeight: net,
      MetalWeight: metal,
      Purity: ornData.Purity || '22K',
      HallmarkNumber: ornData.HallmarkNumber || '',
      Quantity: Number(ornData.Quantity) || 1,
      BuyingPricePerGram: buyingPrice,
      CurrentPricePerGram: currentPrice,
      BuyingCost: buyingCost,
      TotalPrice: buyingCost,
      MarketValue: marketValue,
      AppreciationValue: appreciationValue,
      AppreciationPercentage: appreciationPercentage,
      MakerName: ornData.MakerName || '',
      EstimatedValue: Number(ornData.EstimatedValue) || marketValue,
      OrnamentImages: ornData.OrnamentImages || '',
      Remarks: ornData.Remarks || '',
      Status: (ornData.Status as any) || 'Available',
    };
    ornamentsState = [newOrn, ...ornamentsState];
    cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
    notify();

    api.addOrnament(ornData).then(res => {
      if (res.success && res.data) {
        ornamentsState = ornamentsState.map(o => o.OrnamentId === tempId ? { ...o, ...res.data } : o);
        cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] addOrnament error:', err));

    return newOrn;
  };

  const updateOrnament = (ornId: string, updated: Partial<Ornament> & { files?: any[] }) => {
    ornamentsState = ornamentsState.map(o => {
      if (o.OrnamentId === ornId) {
        const merged = { ...o, ...updated };
        const { gross, stone, metal, net, buyingCost, marketValue, appreciationValue: apprVal, appreciationPercentage: apprPct } =
          calculateOrnamentFigures(merged);

        return {
          ...merged,
          GrossWeight: gross,
          StoneWeight: stone,
          NetWeight: net,
          MetalWeight: metal,
          BuyingCost: buyingCost,
          TotalPrice: buyingCost,
          MarketValue: marketValue,
          AppreciationValue: apprVal,
          AppreciationPercentage: apprPct,
        };
      }
      return o;
    });
    cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
    notify();

    api.updateOrnament(ornId, updated).catch(err => console.warn('[Store] updateOrnament error:', err));
  };

  const deleteOrnament = (ornId: string) => {
    ornamentsState = ornamentsState.filter(o => o.OrnamentId !== ornId);
    cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
    notify();

    api.deleteOrnament(ornId).catch(err => console.warn('[Store] deleteOrnament error:', err));
  };

  // --- CRUD: Loans ---

  const addLoan = (loanData: any) => {
    const tempId = nextId('L', loansState, 'LoanId');
    const amount = Number(loanData.LoanAmount) || 0;
    const procFee = Number(loanData.ProcessingFee) || 0;
    const docCharge = Number(loanData.DocumentCharge) || 0;
    const insCharge = Number(loanData.InsuranceCharge) || 0;
    const netDisb = amount - (procFee + docCharge + insCharge);
    const selectedOrnaments = ornamentsState.filter(o => (loanData.ornamentIds || []).includes(o.OrnamentId));
    const grossWeight = Number(loanData.GrossWeight) || selectedOrnaments.reduce((sum, o) => sum + (Number(o.GrossWeight) || 0), 0);
    const netWeight = Number(loanData.NetWeight) || selectedOrnaments.reduce((sum, o) => sum + (Number(o.MetalWeight ?? o.NetWeight) || 0), 0);
    const totalCharges = calculateLoanPeriodInterest({
      LoanAmount: amount,
      InterestRate: Number(loanData.InterestRate) || 0,
      InterestType: loanData.InterestType || 'Simple',
      LoanPeriod: loanData.LoanPeriod || '',
      LoanDate: loanData.LoanDate,
      DueDate: loanData.DueDate,
    }) + procFee;

    const newLoan: Loan = {
      LoanId: tempId,
      LoanNumber: loanData.LoanNumber || `LN-${new Date().getFullYear()}-${tempId}`,
      UserId: loanData.UserId,
      BankAccountId: loanData.BankAccountId,
      BankName: loanData.BankName || 'Bank',
      LoanDate: loanData.LoanDate || new Date().toISOString().split('T')[0],
      LoanAmount: amount,
      InterestRate: Number(loanData.InterestRate) || 9.5,
      InterestType: loanData.InterestType || 'Simple',
      LoanPeriod: loanData.LoanPeriod || '12 Months',
      GrossWeight: grossWeight,
      NetWeight: netWeight,
      ProcessingFee: procFee,
      DocumentCharge: docCharge,
      InsuranceCharge: insCharge,
      TotalCharges: Number(loanData.TotalCharges) || totalCharges,
      NetDisbursementAmount: netDisb,
      DueDate: loanData.DueDate || '',
      LoanStatus: 'Active',
      Remarks: loanData.Remarks || '',
      CreatedDate: new Date().toISOString(),
      ornamentIds: loanData.ornamentIds || [],
    };

    if (loanData.ornamentIds && loanData.ornamentIds.length > 0) {
      ornamentsState = ornamentsState.map(o => 
        loanData.ornamentIds.includes(o.OrnamentId) ? { ...o, Status: 'Pledged' } : o
      );
    }

    loansState = [newLoan, ...loansState];
    bankAccountsState = bankAccountsState.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });
    cache.set('loans_all', loansState, CacheTTL.LISTS);
    cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.addLoan(loanData).then(res => {
      if (res.success && res.data) {
        loansState = loansState.map(l => l.LoanId === tempId ? { ...l, ...res.data } : l);
        cache.set('loans_all', loansState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] addLoan error:', err));

    return newLoan;
  };

  const updateLoan = (loanId: string, updated: Partial<Loan>) => {
    const prevLoan = loansState.find(l => l.LoanId === loanId);
    loansState = loansState.map(l => l.LoanId === loanId ? { ...l, ...updated, UpdatedDate: new Date().toISOString() } : l);

    // Reconcile ornament statuses if ornamentIds were updated
    if (updated.ornamentIds) {
      const prevOrnIds = prevLoan?.ornamentIds || [];
      const newOrnIds = updated.ornamentIds || [];
      const removed = prevOrnIds.filter(id => !newOrnIds.includes(id));
      const added = newOrnIds.filter(id => !prevOrnIds.includes(id));

      if (removed.length > 0 || added.length > 0) {
        ornamentsState = ornamentsState.map(o => {
          if (removed.includes(o.OrnamentId)) {
            return { ...o, Status: 'Available', ReleasedLoanId: '', ReleaseDate: '' };
          }
          if (added.includes(o.OrnamentId)) {
            return { ...o, Status: 'Pledged' };
          }
          return o;
        });
        cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
      }
    }

    // Reconcile bank account utilization
    bankAccountsState = bankAccountsState.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });

    cache.set('loans_all', loansState, CacheTTL.LISTS);
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.updateLoan(loanId, updated).then(res => {
      if (res.success && res.data) {
        loansState = loansState.map(l => l.LoanId === loanId ? { ...l, ...res.data } : l);
        cache.set('loans_all', loansState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] updateLoan error:', err));
  };

  const closeAndReleaseLoan = (loanId: string, remarks: string) => {
    const targetLoan = loansState.find(l => l.LoanId === loanId);
    if (!targetLoan) return;

    loansState = loansState.map(l => l.LoanId === loanId ? {
      ...l,
      LoanStatus: 'Closed',
      ClosedDate: new Date().toISOString(),
      ClosureRemarks: remarks,
    } : l);

    if (targetLoan.ornamentIds && targetLoan.ornamentIds.length > 0) {
      ornamentsState = ornamentsState.map(o =>
        targetLoan.ornamentIds?.includes(o.OrnamentId) ? {
          ...o,
          Status: 'Available',
          ReleaseDate: new Date().toISOString(),
          ReleasedLoanId: loanId,
        } : o
      );
    }

    bankAccountsState = bankAccountsState.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });

    cache.set('loans_all', loansState, CacheTTL.LISTS);
    cache.set('ornaments_all', ornamentsState, CacheTTL.LISTS);
    cache.set('bank_accounts_all', bankAccountsState, CacheTTL.LISTS);
    notify();

    api.closeAndReleaseLoan(loanId, remarks).catch(err => console.warn('[Store] closeAndReleaseLoan error:', err));
  };

  // --- CRUD: Payments ---

  const addPayment = (payData: Partial<Payment>) => {
    const tempId = `PAY${String(paymentsState.length + 1).padStart(3, '0')}`;
    const newPay: Payment = {
      PaymentId: tempId,
      LoanId: payData.LoanId || '',
      PaymentDate: payData.PaymentDate || new Date().toISOString().split('T')[0],
      PaymentType: payData.PaymentType || 'Interest',
      PrincipalAmount: Number(payData.PrincipalAmount) || 0,
      InterestAmount: Number(payData.InterestAmount) || 0,
      PenaltyAmount: Number(payData.PenaltyAmount) || 0,
      TotalPaidAmount: Number(payData.TotalPaidAmount) || 0,
      PaymentMethod: payData.PaymentMethod || 'UPI',
      TransactionReference: payData.TransactionReference || '',
      Remarks: payData.Remarks || '',
      CreatedDate: new Date().toISOString(),
    };
    paymentsState = [newPay, ...paymentsState];
    cache.set('payments_all', paymentsState, CacheTTL.LISTS);
    notify();

    api.addPayment(payData).then(res => {
      if (res.success && res.data) {
        paymentsState = paymentsState.map(p => p.PaymentId === tempId ? { ...p, ...res.data } : p);
        cache.set('payments_all', paymentsState, CacheTTL.LISTS);
        notify();
      }
    }).catch(err => console.warn('[Store] addPayment error:', err));

    return newPay;
  };

  return {
    users: usersState,
    bankAccounts: bankAccountsState,
    ornaments: ornamentsState,
    loans: loansState,
    payments: paymentsState,
    goldRates: goldRatesState,
    isFetchingGoldRates,
    refreshGoldRates,
    dashboardData: getDashboardData(),
    isSyncing,
    lastSyncedAt,
    syncError,
    syncFromBackend,
    addUser,
    updateUser,
    deleteUser,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addOrnament,
    updateOrnament,
    deleteOrnament,
    addLoan,
    updateLoan,
    closeAndReleaseLoan,
    addPayment,
    calculateUserBankUtilization,
    clearCache: async () => {
      await cache.clearAll();
      await syncFromBackend(true);
    },
  };
}
