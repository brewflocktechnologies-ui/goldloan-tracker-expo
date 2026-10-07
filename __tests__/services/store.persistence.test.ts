import type { act as ActFn, renderHook as RenderHookFn } from '@testing-library/react-native';

jest.setTimeout(20000);

let act: typeof ActFn;
let renderHook: typeof RenderHookFn;

jest.mock('../../src/services/cache', () => ({
  CacheTTL: { LISTS: 1000, SYNC_DATA: 2000 },
  cache: {
    set: jest.fn(),
    get: jest.fn().mockResolvedValue({ data: null }),
    clearAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/api', () => ({
  api: {
    getSessionToken: jest.fn(() => 'token'),
    getInitialSyncData: jest.fn(),
    getGoldRates: jest.fn(() => Promise.resolve({ data: null })),
    getUsers: jest.fn(),
    getBankAccounts: jest.fn(),
    getOrnaments: jest.fn(),
    getLoans: jest.fn(),
    getPayments: jest.fn(),
    addUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    addBankAccount: jest.fn(),
    updateBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
    addOrnament: jest.fn(),
    updateOrnament: jest.fn(),
    deleteOrnament: jest.fn(),
    addLoan: jest.fn(),
    updateLoan: jest.fn(),
    closeAndReleaseLoan: jest.fn(),
    addPayment: jest.fn(),
  },
}));

function loadStore() {
  jest.resetModules();
  process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';
  const rntl = require('@testing-library/react-native');
  act = rntl.act;
  renderHook = rntl.renderHook;
  const api = require('../../src/services/api').api;
  const cache = require('../../src/services/cache').cache;
  const store = require('../../src/services/store');

  Object.values(api).forEach((fn: any) => fn.mockReset?.());
  cache.set.mockReset();
  cache.get.mockResolvedValue({ data: null });
  api.getSessionToken.mockReturnValue('token');
  api.getGoldRates.mockResolvedValue({ data: null });
  const ok = { success: true };
  ['updateUser', 'deleteUser', 'updateBankAccount', 'deleteBankAccount', 'updateOrnament',
    'deleteOrnament', 'updateLoan', 'closeAndReleaseLoan'].forEach(n => api[n].mockResolvedValue(ok));
  ['addUser', 'addBankAccount', 'addOrnament', 'addLoan', 'addPayment'].forEach(n =>
    api[n].mockResolvedValue({ success: false }));
  return { api, cache, store };
}

const USERS = [{ UserId: 'U001', FullName: 'Ravi', Status: 'Active' }];
const BANKS = [{ BankAccountId: 'BA001', UserId: 'U001', BankName: 'SBI', Status: 'Active', MaxLoanAmount: 100000, UtilizedLoanAmount: 0 }];
const ORNS = [{ OrnamentId: 'ORN001', UserId: 'U001', OrnamentName: 'Chain', GrossWeight: 10, MetalWeight: 9, NetWeight: 9, Status: 'Available' }];
const LOANS = [{ LoanId: 'L001', LoanNumber: 'CMP001', UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 5000, LoanStatus: 'Active', ornamentIds: ['ORN001'] }];

async function setup(seed: Partial<Record<'users' | 'bankAccounts' | 'ornaments' | 'loans' | 'payments', any[]>> = {}) {
  const ctx = loadStore();
  ctx.api.getInitialSyncData.mockResolvedValue({
    success: true,
    data: { users: [], bankAccounts: [], ornaments: [], loans: [], payments: [], ...seed },
  });
  const hook = renderHook(() => ctx.store.useAppStore());
  await act(async () => {});
  await act(async () => {
    await hook.result.current.syncFromBackend(true);
  });
  ctx.cache.set.mockClear();
  return { ...ctx, hook, s: () => hook.result.current };
}

/** Last value written to a cache key. */
function lastWrite(cache: any, key: string) {
  const calls = cache.set.mock.calls.filter((c: any[]) => c[0] === key);
  return calls.length ? calls[calls.length - 1][1] : undefined;
}

/** After every mutation, the snapshot and the entity cache must both hold the same, current list. */
function expectInSync(cache: any, entityKey: string, snapshotField: string, predicate: (list: any[]) => boolean) {
  const snapshot = lastWrite(cache, 'initial_sync_data');
  expect(snapshot).toBeDefined();
  expect(predicate(snapshot[snapshotField])).toBe(true);
  expect(predicate(lastWrite(cache, entityKey))).toBe(true);
}

let warnSpy: jest.SpyInstance;
beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warnSpy.mockRestore());

describe('persistAll — snapshot and entity caches stay in sync', () => {
  it('writes the snapshot and all five entity caches on a local change', async () => {
    const { s, cache } = await setup({ users: USERS });
    act(() => {
      s().addUser({ FullName: 'New' });
    });
    const keys = cache.set.mock.calls.map((c: any[]) => c[0]);
    expect(keys).toEqual(expect.arrayContaining([
      'initial_sync_data', 'users_list', 'bank_accounts_all', 'ornaments_all', 'loans_all', 'payments_all',
    ]));
    const snapshot = lastWrite(cache, 'initial_sync_data');
    expect(Object.keys(snapshot)).toEqual(expect.arrayContaining([
      'users', 'bankAccounts', 'ornaments', 'loans', 'payments', 'goldRates', 'timestamp',
    ]));
  });

  describe('users', () => {
    it('add: new user is in the snapshot immediately and after the server reply', async () => {
      const { s, cache, api } = await setup({ users: USERS });
      api.addUser.mockResolvedValue({ success: true, data: { UserId: 'U002', FullName: 'Saved' } });
      await act(async () => {
        s().addUser({ FullName: 'Saved' });
      });
      expectInSync(cache, 'users_list', 'users', l => l.some(u => u.UserId === 'U002' && u.FullName === 'Saved'));
    });

    it('edit: updated name is persisted even though the API layer clears cache after success', async () => {
      const { s, cache } = await setup({ users: USERS });
      await act(async () => {
        s().updateUser('U001', { FullName: 'Renamed' });
      });
      expectInSync(cache, 'users_list', 'users', l => l.find(u => u.UserId === 'U001')?.FullName === 'Renamed');
    });

    it('delete: removed user is gone from the snapshot and the entity cache', async () => {
      const { s, cache } = await setup({ users: USERS });
      await act(async () => {
        s().deleteUser('U001');
      });
      expectInSync(cache, 'users_list', 'users', l => l.length === 0);
    });

    it('re-persists after the server call settles, and caches the reverted state when it fails', async () => {
      const { s, cache, api } = await setup({ users: USERS });
      api.getInitialSyncData.mockRejectedValue(new Error('offline'));
      api.updateUser.mockRejectedValue(new Error('offline'));
      await act(async () => {
        s().updateUser('U001', { FullName: 'Offline Edit' });
      });
      const snapshotWrites = cache.set.mock.calls.filter((c: any[]) => c[0] === 'initial_sync_data');
      expect(snapshotWrites.length).toBeGreaterThanOrEqual(2); // optimistic write + after settle
      // the failed edit must not survive in the cache
      expectInSync(cache, 'users_list', 'users', l => l[0].FullName === 'Ravi');
    });
  });

  describe('bank accounts', () => {
    it('add / edit / delete keep both caches current', async () => {
      const { s, cache, api } = await setup({ users: USERS, bankAccounts: BANKS });

      api.addBankAccount.mockResolvedValue({ success: true, data: { BankAccountId: 'BA002', UserId: 'U001', BankName: 'HDFC' } });
      await act(async () => {
        s().addBankAccount({ UserId: 'U001', BankName: 'HDFC', AccountNumber: '1' });
      });
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts', l => l.some(b => b.BankAccountId === 'BA002'));

      await act(async () => {
        s().updateBankAccount('BA001', { MaxLoanAmount: 250000 });
      });
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts',
        l => l.find(b => b.BankAccountId === 'BA001')?.MaxLoanAmount === 250000);

      await act(async () => {
        s().deleteBankAccount('BA001');
      });
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts', l => !l.some(b => b.BankAccountId === 'BA001'));
    });

    it('recomputes the available limit when the max or utilised amount changes', async () => {
      const { s } = await setup({ bankAccounts: BANKS });
      await act(async () => {
        s().updateBankAccount('BA001', { MaxLoanAmount: 50000, UtilizedLoanAmount: 20000 });
      });
      expect(s().bankAccounts[0].AvailableLoanAmount).toBe(30000);
    });
  });

  describe('ornaments', () => {
    it('add / edit / delete keep both caches current', async () => {
      const { s, cache, api } = await setup({ users: USERS, ornaments: ORNS });

      api.addOrnament.mockResolvedValue({ success: true, data: { OrnamentId: 'ORN002', OrnamentName: 'Ring' } });
      await act(async () => {
        s().addOrnament({ UserId: 'U001', OrnamentName: 'Ring', GrossWeight: 5 });
      });
      expectInSync(cache, 'ornaments_all', 'ornaments', l => l.some(o => o.OrnamentId === 'ORN002'));

      await act(async () => {
        s().updateOrnament('ORN001', { OrnamentName: 'Heavy Chain' });
      });
      expectInSync(cache, 'ornaments_all', 'ornaments',
        l => l.find(o => o.OrnamentId === 'ORN001')?.OrnamentName === 'Heavy Chain');

      await act(async () => {
        s().deleteOrnament('ORN001');
      });
      expectInSync(cache, 'ornaments_all', 'ornaments', l => !l.some(o => o.OrnamentId === 'ORN001'));
    });
  });

  describe('loans', () => {
    const payload = { UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 1000, ornamentIds: ['ORN001'] };

    it('add: loan, pledged ornament and bank utilisation are all persisted', async () => {
      const { s, cache, api } = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS });
      api.addLoan.mockResolvedValue({ success: true, data: { LoanId: 'L010', LoanNumber: 'CMP010', UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 1000, LoanStatus: 'Active' } });
      await act(async () => {
        s().addLoan(payload);
      });
      expectInSync(cache, 'loans_all', 'loans', l => l.some(x => x.LoanId === 'L010'));
      expectInSync(cache, 'ornaments_all', 'ornaments', l => l.find(o => o.OrnamentId === 'ORN001')?.Status === 'Pledged');
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts', l => l[0].UtilizedLoanAmount === 1000);
    });

    it('add failure: the rolled-back state is what ends up cached', async () => {
      const { s, cache, api } = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS });
      api.addLoan.mockResolvedValue({ success: false, error: 'Server is busy' });
      await act(async () => {
        s().addLoan(payload, { onError: jest.fn() });
      });
      expectInSync(cache, 'loans_all', 'loans', l => l.length === 0);
      expectInSync(cache, 'ornaments_all', 'ornaments', l => l[0].Status === 'Available');
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts', l => l[0].UtilizedLoanAmount === 0);
    });

    it('add throwing: also leaves the caches rolled back', async () => {
      const { s, cache, api } = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS });
      api.addLoan.mockRejectedValue(new Error('Network down'));
      await act(async () => {
        s().addLoan(payload, { onError: jest.fn() });
      });
      expectInSync(cache, 'loans_all', 'loans', l => l.length === 0);
    });

    it('edit: swapping ornaments updates their status and persists everything', async () => {
      const second = { OrnamentId: 'ORN002', UserId: 'U001', OrnamentName: 'Ring', Status: 'Available' };
      const { s, cache } = await setup({
        users: USERS, bankAccounts: BANKS, ornaments: [{ ...ORNS[0], Status: 'Pledged' }, second], loans: LOANS,
      });
      await act(async () => {
        s().updateLoan('L001', { ornamentIds: ['ORN002'], LoanAmount: 7000 });
      });
      expectInSync(cache, 'loans_all', 'loans', l => l[0].LoanAmount === 7000);
      expectInSync(cache, 'ornaments_all', 'ornaments', l =>
        l.find(o => o.OrnamentId === 'ORN001')?.Status === 'Available' &&
        l.find(o => o.OrnamentId === 'ORN002')?.Status === 'Pledged');
    });

    it('close and release: loan closed, ornaments freed, utilisation reset — all persisted', async () => {
      const { s, cache } = await setup({
        users: USERS,
        bankAccounts: [{ ...BANKS[0], UtilizedLoanAmount: 5000 }],
        ornaments: [{ ...ORNS[0], Status: 'Pledged' }],
        loans: LOANS,
      });
      await act(async () => {
        s().closeAndReleaseLoan('L001', 'Paid in full');
      });
      expectInSync(cache, 'loans_all', 'loans', l => l[0].LoanStatus === 'Closed' && l[0].ClosureRemarks === 'Paid in full');
      expectInSync(cache, 'ornaments_all', 'ornaments', l => l[0].Status === 'Available' && l[0].ReleasedLoanId === 'L001');
      expectInSync(cache, 'bank_accounts_all', 'bankAccounts', l => l[0].UtilizedLoanAmount === 0);
    });

    it('close and release ignores an unknown loan', async () => {
      const { s, cache, api } = await setup({ loans: LOANS });
      await act(async () => {
        s().closeAndReleaseLoan('L999', 'x');
      });
      expect(api.closeAndReleaseLoan).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('payments', () => {
    it('add: payment is in the snapshot immediately and replaced by the saved row', async () => {
      const { s, cache, api } = await setup({ loans: LOANS });
      api.addPayment.mockResolvedValue({ success: true, data: { PaymentId: 'PAY050', LoanId: 'L001', TotalPaidAmount: 500 } });
      await act(async () => {
        s().addPayment({ LoanId: 'L001', TotalPaidAmount: 500 });
      });
      expectInSync(cache, 'payments_all', 'payments',
        l => l.length === 1 && l[0].PaymentId === 'PAY050');
    });

    it('add failure: the unsaved payment is removed from state and cache', async () => {
      const { s, cache, api } = await setup({ loans: LOANS });
      api.getInitialSyncData.mockRejectedValue(new Error('offline'));
      api.addPayment.mockRejectedValue(new Error('offline'));
      await act(async () => {
        s().addPayment({ LoanId: 'L001', TotalPaidAmount: 500 });
      });
      expect(s().payments).toHaveLength(0);
      expectInSync(cache, 'payments_all', 'payments', l => l.length === 0);
    });
  });
});

describe('syncFromBackend — freshness and failure reporting', () => {
  it('always asks the backend for fresh data, even for a normal (non-forced) sync', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: { users: USERS } });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {}); // mount runs a non-forced sync
    expect(ctx.api.getInitialSyncData).toHaveBeenCalledWith(true);
    expect(ctx.api.getInitialSyncData).not.toHaveBeenCalledWith(false);
    expect(hook.result.current.users).toHaveLength(1);
  });

  it('replaces local data with the sheet, so rows deleted in the sheet disappear', async () => {
    const { s, api } = await setup({ users: [...USERS, { UserId: 'U002', FullName: 'Gone', Status: 'Active' }] });
    expect(s().users).toHaveLength(2);
    api.getInitialSyncData.mockResolvedValue({ success: true, data: { users: USERS } });
    await act(async () => {
      await s().syncFromBackend(true);
    });
    expect(s().users.map((u: any) => u.UserId)).toEqual(['U001']);
  });

  it('a fresh sync clears the error and stamps the last-synced time', async () => {
    const { s } = await setup({ users: USERS });
    expect(s().syncError).toBeNull();
    expect(s().lastSyncedAt).toBeTruthy();
    expect(typeof s().syncError === 'string').toBe(false);
  });

  it('flags an offline fallback as an error and does not claim it synced', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({
      success: true, data: { users: USERS }, isCached: true, isFallback: true,
    });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(hook.result.current.syncError).toMatch(/offline data/i);
    expect(hook.result.current.lastSyncedAt).toBeNull();
    expect(hook.result.current.users).toHaveLength(1); // cached data is still shown
    expect(ctx.store.getSyncError()).toMatch(/offline data/i);
  });

  it('getSyncError is null after a successful sync and set after a thrown one', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: { users: USERS } });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    expect(ctx.store.getSyncError()).toBeNull();

    ctx.api.getInitialSyncData.mockRejectedValue(new Error('Server exploded'));
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(ctx.store.getSyncError()).toBe('Server exploded');
  });

  it('recovers from an earlier failure on the next good sync', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockRejectedValue(new Error('down'));
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    expect(ctx.store.getSyncError()).toBe('down');

    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: { users: USERS } });
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(ctx.store.getSyncError()).toBeNull();
    expect(hook.result.current.users).toHaveLength(1);
  });
});

describe('hydrateFromCache — boot from saved data', () => {
  it('shows the saved snapshot before the network answers', async () => {
    const ctx = loadStore();
    ctx.cache.get.mockImplementation((key: string) =>
      Promise.resolve({ data: key === 'initial_sync_data' ? { users: USERS, loans: LOANS, goldRates: null } : null })
    );
    let resolveSync: (v: any) => void = () => {};
    ctx.api.getInitialSyncData.mockReturnValue(new Promise(r => { resolveSync = r; }));

    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    expect(hook.result.current.users).toHaveLength(1);
    expect(hook.result.current.loans).toHaveLength(1);

    await act(async () => {
      resolveSync({ success: true, data: { users: [], loans: [] } });
    });
    expect(hook.result.current.users).toHaveLength(0); // the sheet wins
  });

  it('falls back to the per-entity caches when there is no snapshot', async () => {
    const ctx = loadStore();
    const lists: Record<string, any> = {
      users_list: USERS, bank_accounts_all: BANKS, ornaments_all: ORNS, loans_all: LOANS,
      payments_all: [{ PaymentId: 'PAY001', LoanId: 'L001' }],
      gold_rates_bangalore: { location: 'Bangalore' },
    };
    ctx.cache.get.mockImplementation((key: string) => Promise.resolve({ data: lists[key] ?? null }));
    ctx.api.getInitialSyncData.mockReturnValue(new Promise(() => {})); // never answers

    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    const h = hook.result.current;
    expect([h.users.length, h.bankAccounts.length, h.ornaments.length, h.loans.length, h.payments.length])
      .toEqual([1, 1, 1, 1, 1]);
    expect(h.goldRates.location).toBe('Bangalore');
  });

  it('keeps working when reading the cache throws', async () => {
    const ctx = loadStore();
    ctx.cache.get.mockRejectedValue(new Error('storage broken'));
    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: { users: USERS } });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(hook.result.current.users).toHaveLength(1);
  });
});

describe('refreshGoldRates', () => {
  it('updates the rates from the API', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: {} });
    ctx.api.getGoldRates.mockResolvedValue({ data: { location: 'Mysuru' } });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    await act(async () => {
      await ctx.store.refreshGoldRates(true);
    });
    expect(hook.result.current.goldRates.location).toBe('Mysuru');
    expect(hook.result.current.isFetchingGoldRates).toBe(false);
  });

  it('keeps the current rates when the request fails', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({ success: true, data: {} });
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    ctx.api.getGoldRates.mockRejectedValue(new Error('scrape failed'));
    await act(async () => {
      await ctx.store.refreshGoldRates(true);
    });
    expect(hook.result.current.goldRates.location).toBe('Bangalore');
  });
});


describe('failed saves — revert and tell the user', () => {
  const offline = (api: any) => api.getInitialSyncData.mockRejectedValue(new Error('offline'));

  function withErrors(ctx: any) {
    const onError = jest.fn();
    ctx.store.setMutationErrorHandler(onError);
    return onError;
  }

  describe('bank accounts', () => {
    it('add: removes the temporary account when the backend rejects it', async () => {
      const ctx = await setup({ users: USERS, bankAccounts: BANKS });
      const onError = withErrors(ctx);
      ctx.api.addBankAccount.mockResolvedValue({ success: false, error: 'BankName required' });
      await act(async () => {
        ctx.s().addBankAccount({ UserId: 'U001', BankName: 'HDFC', AccountNumber: '9' });
      });
      expect(ctx.s().bankAccounts.map((b: any) => b.BankAccountId)).toEqual(['BA001']);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('BankName required'));
    });

    it('add: keeps the account if the reply was lost but the sheet has it', async () => {
      const ctx = await setup({ users: USERS, bankAccounts: BANKS });
      const onError = withErrors(ctx);
      ctx.api.addBankAccount.mockRejectedValue(new Error('reply lost'));
      ctx.api.getInitialSyncData.mockResolvedValue({
        success: true,
        data: { users: USERS, bankAccounts: [...BANKS, { BankAccountId: 'BA002', UserId: 'U001', AccountNumber: '9', BankName: 'HDFC' }] },
      });
      await act(async () => {
        ctx.s().addBankAccount({ UserId: 'U001', BankName: 'HDFC', AccountNumber: '9' });
      });
      expect(ctx.s().bankAccounts.map((b: any) => b.BankAccountId)).toEqual(['BA001', 'BA002']);
      expect(onError).not.toHaveBeenCalled();
    });

    it('edit: restores the old limit when offline', async () => {
      const ctx = await setup({ bankAccounts: BANKS });
      const onError = withErrors(ctx);
      offline(ctx.api);
      ctx.api.updateBankAccount.mockRejectedValue(new Error('x'));
      await act(async () => {
        ctx.s().updateBankAccount('BA001', { MaxLoanAmount: 999 });
      });
      expect(ctx.s().bankAccounts[0].MaxLoanAmount).toBe(100000);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('delete: brings the account back when the backend rejects it', async () => {
      const ctx = await setup({ bankAccounts: BANKS });
      ctx.api.deleteBankAccount.mockResolvedValue({ success: false, error: 'Denied' });
      await act(async () => {
        ctx.s().deleteBankAccount('BA001');
      });
      expect(ctx.s().bankAccounts.map((b: any) => b.BankAccountId)).toEqual(['BA001']);
    });
  });

  describe('loans', () => {
    const seed = { users: USERS, bankAccounts: BANKS, ornaments: ORNS, loans: LOANS };

    it('edit: restores the loan, ornament statuses and bank utilisation when offline', async () => {
      const second = { OrnamentId: 'ORN002', UserId: 'U001', OrnamentName: 'Ring', Status: 'Available' };
      const ctx = await setup({
        ...seed,
        ornaments: [{ ...ORNS[0], Status: 'Pledged' }, second],
        bankAccounts: [{ ...BANKS[0], UtilizedLoanAmount: 5000 }],
      });
      const onError = withErrors(ctx);
      offline(ctx.api);
      ctx.api.updateLoan.mockRejectedValue(new Error('x'));
      await act(async () => {
        ctx.s().updateLoan('L001', { ornamentIds: ['ORN002'], LoanAmount: 7000 });
      });
      expect(ctx.s().loans[0].LoanAmount).toBe(5000);
      expect(ctx.s().ornaments.find((o: any) => o.OrnamentId === 'ORN001')?.Status).toBe('Pledged');
      expect(ctx.s().ornaments.find((o: any) => o.OrnamentId === 'ORN002')?.Status).toBe('Available');
      expect(ctx.s().bankAccounts[0].UtilizedLoanAmount).toBe(5000);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('CMP001'));
    });

    it('edit: shows the sheet values when the backend rejects the change', async () => {
      const ctx = await setup(seed);
      ctx.api.updateLoan.mockResolvedValue({ success: false, error: 'Locked' });
      await act(async () => {
        ctx.s().updateLoan('L001', { LoanAmount: 9999 });
      });
      expect(ctx.s().loans[0].LoanAmount).toBe(5000);
    });

    it('close and release: reopens the loan and re-pledges ornaments when offline', async () => {
      const ctx = await setup({
        ...seed,
        ornaments: [{ ...ORNS[0], Status: 'Pledged' }],
        bankAccounts: [{ ...BANKS[0], UtilizedLoanAmount: 5000 }],
      });
      const onError = withErrors(ctx);
      offline(ctx.api);
      ctx.api.closeAndReleaseLoan.mockRejectedValue(new Error('x'));
      await act(async () => {
        ctx.s().closeAndReleaseLoan('L001', 'Paid');
      });
      expect(ctx.s().loans[0].LoanStatus).toBe('Active');
      expect(ctx.s().ornaments[0].Status).toBe('Pledged');
      expect(ctx.s().bankAccounts[0].UtilizedLoanAmount).toBe(5000);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('was not closed'));
    });

    it('add: keeps the loan when the backend reported failure but the sheet has it', async () => {
      const ctx = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS });
      const onError = jest.fn();
      const onSuccess = jest.fn();
      ctx.api.addLoan.mockResolvedValue({ success: false, error: 'late backend error' });
      ctx.api.getInitialSyncData.mockResolvedValue({
        success: true,
        data: {
          users: USERS, bankAccounts: BANKS, ornaments: ORNS,
          loans: [{ LoanId: 'L010', LoanNumber: 'CMP010', UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 1000, LoanStatus: 'Active', CreatedDate: new Date().toISOString() }],
        },
      });
      await act(async () => {
        ctx.s().addLoan({ UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 1000, ornamentIds: ['ORN001'] }, { onError, onSuccess });
      });
      expect(onError).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ LoanId: 'L010' }));
      expect(ctx.s().loans.map((l: any) => l.LoanId)).toEqual(['L010']);
    });

    it('add: reports through the form callback and not the global handler', async () => {
      const ctx = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS });
      const globalError = withErrors(ctx);
      const onError = jest.fn();
      ctx.api.addLoan.mockResolvedValue({ success: false, error: 'Server is busy' });
      await act(async () => {
        ctx.s().addLoan({ UserId: 'U001', BankAccountId: 'BA001', LoanAmount: 1000, ornamentIds: ['ORN001'] }, { onError });
      });
      expect(onError).toHaveBeenCalledWith('Server is busy');
      expect(globalError).not.toHaveBeenCalled();
      expect(ctx.s().loans).toHaveLength(0);
      expect(ctx.s().ornaments[0].Status).toBe('Available');
    });
  });

  describe('payments', () => {
    it('add: removes the temporary payment and tells the user when rejected', async () => {
      const ctx = await setup({ loans: LOANS });
      const onError = withErrors(ctx);
      ctx.api.addPayment.mockResolvedValue({ success: false, error: 'Loan closed' });
      await act(async () => {
        ctx.s().addPayment({ LoanId: 'L001', TotalPaidAmount: 500 });
      });
      expect(ctx.s().payments).toHaveLength(0);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Payment was not saved'));
    });
  });

  describe('error reporting', () => {
    it('falls back to console.warn when no UI handler is registered', async () => {
      const ctx = await setup({ users: USERS });
      ctx.api.deleteUser.mockResolvedValue({ success: false, error: 'Denied' });
      await act(async () => {
        ctx.s().deleteUser('U001');
      });
      expect(warnSpy).toHaveBeenCalledWith('[Store]', expect.stringContaining('was not deleted'));
    });

    it('a successful save reports nothing and leaves the change in place', async () => {
      const ctx = await setup({ users: USERS });
      const onError = withErrors(ctx);
      await act(async () => {
        ctx.s().updateUser('U001', { FullName: 'Renamed' });
      });
      expect(onError).not.toHaveBeenCalled();
      expect(ctx.s().users[0].FullName).toBe('Renamed');
    });

    it('the handler can be cleared', async () => {
      const ctx = await setup({ users: USERS });
      const onError = withErrors(ctx);
      ctx.store.setMutationErrorHandler(null);
      ctx.api.deleteUser.mockResolvedValue({ success: false });
      await act(async () => {
        ctx.s().deleteUser('U001');
      });
      expect(onError).not.toHaveBeenCalled();
    });

    it('does not report twice when the sync after a failure finds the data already correct', async () => {
      const ctx = await setup({ users: USERS });
      const onError = withErrors(ctx);
      ctx.api.updateUser.mockResolvedValue({ success: false, error: 'x' });
      await act(async () => {
        ctx.s().updateUser('U001', { FullName: 'A' });
      });
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('save callbacks — success is reported only once the backend confirms', () => {
  it.each([
    ['addUser', (s: any, cb: any) => s.addUser({ FullName: 'New' }, cb), 'addUser', { UserId: 'U002', FullName: 'New' }],
    ['updateUser', (s: any, cb: any) => s.updateUser('U001', { FullName: 'X' }, cb), 'updateUser', undefined],
    ['deleteUser', (s: any, cb: any) => s.deleteUser('U001', cb), 'deleteUser', undefined],
    ['addBankAccount', (s: any, cb: any) => s.addBankAccount({ UserId: 'U001', BankName: 'HDFC', AccountNumber: '9' }, cb), 'addBankAccount', { BankAccountId: 'BA002', UserId: 'U001', BankName: 'HDFC' }],
    ['updateBankAccount', (s: any, cb: any) => s.updateBankAccount('BA001', { MaxLoanAmount: 5 }, cb), 'updateBankAccount', undefined],
    ['deleteBankAccount', (s: any, cb: any) => s.deleteBankAccount('BA001', cb), 'deleteBankAccount', undefined],
    ['addOrnament', (s: any, cb: any) => s.addOrnament({ UserId: 'U001', OrnamentName: 'Ring' }, cb), 'addOrnament', { OrnamentId: 'ORN002', OrnamentName: 'Ring' }],
    ['updateOrnament', (s: any, cb: any) => s.updateOrnament('ORN001', { OrnamentName: 'Y' }, cb), 'updateOrnament', undefined],
    ['deleteOrnament', (s: any, cb: any) => s.deleteOrnament('ORN001', cb), 'deleteOrnament', undefined],
    ['updateLoan', (s: any, cb: any) => s.updateLoan('L001', { LoanAmount: 1 }, cb), 'updateLoan', undefined],
    ['closeAndReleaseLoan', (s: any, cb: any) => s.closeAndReleaseLoan('L001', 'done', cb), 'closeAndReleaseLoan', undefined],
    ['addPayment', (s: any, cb: any) => s.addPayment({ LoanId: 'L001', TotalPaidAmount: 5 }, cb), 'addPayment', { PaymentId: 'PAY009', LoanId: 'L001', TotalPaidAmount: 5 }],
  ])('%s: onSuccess fires after a confirmed save and not before', async (_n, call, apiName, data) => {
    const ctx = await setup({ users: USERS, bankAccounts: BANKS, ornaments: ORNS, loans: LOANS });
    let resolve: (v: any) => void = () => {};
    ctx.api[apiName].mockReturnValue(new Promise(r => { resolve = r; }));
    const onSuccess = jest.fn();
    act(() => {
      call(ctx.s(), { onSuccess });
    });
    expect(onSuccess).not.toHaveBeenCalled(); // the screen has updated, the backend has not answered yet
    await act(async () => {
      resolve({ success: true, data });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['rejected by the backend', (api: any) => api.updateUser.mockResolvedValue({ success: false, error: 'nope' })],
    ['request throws', (api: any) => api.updateUser.mockRejectedValue(new Error('offline'))],
  ])('onSuccess never fires when the save fails (%s)', async (_n, arrange) => {
    const ctx = await setup({ users: USERS });
    arrange(ctx.api);
    const onSuccess = jest.fn();
    await act(async () => {
      ctx.s().updateUser('U001', { FullName: 'X' }, { onSuccess });
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('onError replaces the global error toast for that save', async () => {
    const ctx = await setup({ users: USERS });
    const globalError = jest.fn();
    ctx.store.setMutationErrorHandler(globalError);
    ctx.api.deleteUser.mockResolvedValue({ success: false, error: 'Denied' });
    const onError = jest.fn();
    await act(async () => {
      ctx.s().deleteUser('U001', { onError });
    });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('was not deleted'));
    expect(globalError).not.toHaveBeenCalled();
  });

  it('onSuccess still fires when a lost reply turns out to have been saved', async () => {
    const ctx = await setup();
    ctx.api.addUser.mockRejectedValue(new Error('reply lost'));
    ctx.api.getInitialSyncData.mockResolvedValue({
      success: true,
      data: { users: [{ UserId: 'U007', FullName: 'Saved Anyway', Status: 'Active' }] },
    });
    const onSuccess = jest.fn();
    await act(async () => {
      ctx.s().addUser({ FullName: 'Saved Anyway' }, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ UserId: 'U007' }));
  });

  it('works without any callbacks (existing callers)', async () => {
    const ctx = await setup({ users: USERS });
    await act(async () => {
      ctx.s().updateUser('U001', { FullName: 'Plain' });
    });
    expect(ctx.s().users[0].FullName).toBe('Plain');
  });
});
