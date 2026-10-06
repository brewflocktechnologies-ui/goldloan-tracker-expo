jest.mock('../../src/config/api', () => ({
  ApiConfig: { getApiUrl: jest.fn(() => 'https://gas.test/exec') },
}));

jest.mock('../../src/services/cache', () => ({
  CacheTTL: { LISTS: 1000, SYNC_DATA: 1000, GOLD_RATES: 1000 },
  cache: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateEntity: jest.fn().mockResolvedValue(undefined),
  },
}));

import { api } from '../../src/services/api';
import { ApiConfig } from '../../src/config/api';
import { cache } from '../../src/services/cache';

const fetchMock = jest.fn();
const json = (body: any, ok = true, status = 200) => ({
  ok,
  status,
  text: () => Promise.resolve(JSON.stringify(body)),
});
const raw = (text: string) => ({ ok: true, status: 200, text: () => Promise.resolve(text) });

let warnSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = fetchMock;
  fetchMock.mockReset();
  (cache.get as jest.Mock).mockResolvedValue({ data: null });
  (ApiConfig.getApiUrl as jest.Mock).mockReturnValue('https://gas.test/exec');
  api.setSessionToken('tok');
  api.onUnauthorized(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warnSpy.mockRestore());

describe('api.callGas — mutations (POST)', () => {
  it('sends the full payload as a POST with action and token in the URL', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: { BankAccountId: 'BA001' } }));
    const res = await api.postToGas('addBankAccount', { accountData: { BankName: 'SBI' } });

    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('action=addBankAccount');
    expect(url).toContain('token=tok');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      action: 'addBankAccount',
      token: 'tok',
      accountData: { BankName: 'SBI' },
    });
  });

  it('never retries a failed mutation as a GET (that created blank rows)', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));
    const res = await api.postToGas('addBankAccount', { accountData: { BankName: 'SBI' } });

    expect(res).toEqual({ success: false, error: 'Network request failed' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, init]) => init?.method === 'POST')).toBe(true);
  });

  it('does not fall back to GET when the POST response is unreadable', async () => {
    fetchMock.mockResolvedValue(raw('<html>redirect</html>'));
    const res = await api.postToGas('addUser', { userData: { FullName: 'Ravi' } });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid server response');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a plain-text "Success" body as success', async () => {
    fetchMock.mockResolvedValue(raw('Success'));
    const res = await api.postToGas('addUser', {});
    expect(res.success).toBe(true);
  });

  it('reports an HTTP error without retrying', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('') });
    const res = await api.postToGas('addUser', {});
    expect(res).toEqual({ success: false, error: 'HTTP 500' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns the backend validation error as-is', async () => {
    fetchMock.mockResolvedValue(json({ success: false, error: 'FullName is required' }));
    const res = await api.postToGas('addUser', { userData: {} });
    expect(res).toEqual({ success: false, error: 'FullName is required' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('api.callGas — reads (GET)', () => {
  it('sends scalar params in the query string and drops objects', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: [] }));
    await api.getFromGas('getBankAccounts', { userId: 'U001', nested: { a: 1 }, skip: undefined });

    const [url, init] = fetchMock.mock.calls[0];
    expect(init).toBeUndefined();
    expect(url).toContain('action=getBankAccounts');
    expect(url).toContain('userId=U001');
    expect(url).toContain('token=tok');
    expect(url).not.toContain('nested');
    expect(url).not.toContain('skip');
  });

  it('falls back to POST when the GET fails (reads are safe to retry)', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('GET blocked'))
      .mockResolvedValueOnce(json({ success: true, data: ['ok'] }));
    const res = await api.getFromGas('getUsers');
    expect(res).toEqual({ success: true, data: ['ok'] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('retries with the other method when the action was dropped on redirect', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ success: false, error: 'No action specified in request' }))
      .mockResolvedValueOnce(json({ success: true, data: 1 }));
    const res = await api.getFromGas('getUsers');
    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports the final error when both methods fail', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const res = await api.getFromGas('getUsers');
    expect(res).toEqual({ success: false, error: 'offline' });
  });
});

describe('api.callGas — session handling and config', () => {
  it('fires the unauthorized callback on a 401 response', async () => {
    const onUnauthorized = jest.fn();
    api.onUnauthorized(onUnauthorized);
    fetchMock.mockResolvedValue(json({ success: false, code: 401 }));
    await api.postToGas('addUser', {});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not treat a 401 from login as an expired session', async () => {
    const onUnauthorized = jest.fn();
    api.onUnauthorized(onUnauthorized);
    fetchMock.mockResolvedValue(json({ success: false, code: 401 }));
    await api.callGas('login', {}, 'POST');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('fails fast when no backend URL is configured', async () => {
    (ApiConfig.getApiUrl as jest.Mock).mockReturnValue('');
    const res = await api.postToGas('addUser', {});
    expect(res.success).toBe(false);
    expect(res.error).toContain('not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('omits the token when logged out', async () => {
    api.setSessionToken(null);
    fetchMock.mockResolvedValue(json({ success: true }));
    await api.postToGas('login', { username: 'a' });
    expect(fetchMock.mock.calls[0][0]).not.toContain('token=');
    expect(api.getSessionToken()).toBeNull();
  });
});

describe('api — cache invalidation after mutations', () => {
  const ok = () => fetchMock.mockResolvedValue(json({ success: true, data: {} }));
  const fail = () => fetchMock.mockResolvedValue(json({ success: false, error: 'nope' }));

  it.each([
    ['addUser', () => api.addUser({ FullName: 'A' }), ['users']],
    ['updateUser', () => api.updateUser('U1', { FullName: 'B' }), ['users']],
    ['deleteUser', () => api.deleteUser('U1'), ['users']],
    ['addBankAccount', () => api.addBankAccount({ BankName: 'SBI' }), ['bank_accounts']],
    ['updateBankAccount', () => api.updateBankAccount('BA1', {}), ['bank_accounts']],
    ['deleteBankAccount', () => api.deleteBankAccount('BA1'), ['bank_accounts']],
    ['addOrnament', () => api.addOrnament({ OrnamentName: 'Ring' }), ['ornaments']],
    ['updateOrnament', () => api.updateOrnament('O1', {}), ['ornaments']],
    ['deleteOrnament', () => api.deleteOrnament('O1'), ['ornaments']],
    ['addLoan', () => api.addLoan({ LoanAmount: 1 }), ['loans']],
    ['updateLoan', () => api.updateLoan('L1', {}), ['loans']],
    ['closeAndReleaseLoan', () => api.closeAndReleaseLoan('L1', 'done'), ['loans']],
    ['addPayment', () => api.addPayment({ LoanId: 'L1' }), ['payments', 'loans']],
  ])('%s invalidates its entity cache on success only', async (_n, call, entities) => {
    fail();
    await call();
    expect(cache.invalidateEntity).not.toHaveBeenCalled();

    ok();
    await call();
    entities.forEach(e => expect(cache.invalidateEntity).toHaveBeenCalledWith(e));
  });
});

describe('api.getInitialSyncData', () => {
  const sync = { users: [{ UserId: 'U1' }], bankAccounts: [], ornaments: [], loans: [], payments: [], goldRates: null };

  it('returns the cached snapshot without hitting the network when not forced', async () => {
    (cache.get as jest.Mock).mockResolvedValue({ data: sync });
    const res = await api.getInitialSyncData(false);
    expect(res).toEqual({ success: true, data: sync, isCached: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the cache when forced, then refreshes the snapshot and every entity cache', async () => {
    (cache.get as jest.Mock).mockResolvedValue({ data: { users: [] } });
    fetchMock.mockResolvedValue(json({ success: true, data: { ...sync, goldRates: { location: 'Bangalore' } } }));

    const res = await api.getInitialSyncData(true);

    expect(res.isCached).toBe(false);
    expect(res.data!.users).toHaveLength(1);
    const keys = (cache.set as jest.Mock).mock.calls.map(c => c[0]);
    expect(keys).toEqual(
      expect.arrayContaining([
        'initial_sync_data', 'users_list', 'bank_accounts_all', 'ornaments_all', 'loans_all', 'payments_all', 'gold_rates_bangalore',
      ])
    );
  });

  it('flags stale cache as a fallback when the network fails', async () => {
    (cache.get as jest.Mock).mockImplementation((_k: string, allowStale?: boolean) =>
      Promise.resolve({ data: allowStale ? sync : null })
    );
    fetchMock.mockRejectedValue(new Error('offline'));

    const res = await api.getInitialSyncData(true);
    expect(res.success).toBe(true);
    expect(res.isCached).toBe(true);
    expect(res.isFallback).toBe(true);
  });

  it('returns the error when the network fails and nothing is cached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const res = await api.getInitialSyncData(true);
    expect(res.success).toBe(false);
    expect(res.isFallback).toBeUndefined();
  });
});

describe('api — list getters', () => {
  it.each([
    ['getUsers', () => api.getUsers(true), 'users_list'],
    ['getBankAccounts', () => api.getBankAccounts(undefined, true), 'bank_accounts_all'],
    ['getOrnaments', () => api.getOrnaments(undefined, true), 'ornaments_all'],
    ['getPayments', () => api.getPayments(undefined, true), 'payments_all'],
  ])('%s fetches fresh data when forced and caches it', async (_n, call, key) => {
    fetchMock.mockResolvedValue(json({ success: true, data: [{ id: 1 }] }));
    expect(await call()).toEqual([{ id: 1 }]);
    expect((cache.set as jest.Mock).mock.calls.map(c => c[0])).toContain(key);
  });

  it('getLoans builds a cache key per user and status', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: [] }));
    await api.getLoans('U1', 'Active', true);
    expect((cache.set as jest.Mock).mock.calls[0][0]).toBe('loans_U1_Active');
  });

  it('returns cached lists without a request when not forced', async () => {
    (cache.get as jest.Mock).mockResolvedValue({ data: [{ UserId: 'U9' }] });
    expect(await api.getUsers()).toEqual([{ UserId: 'U9' }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves stale data when the network is down, or an empty list if there is none', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    (cache.get as jest.Mock).mockImplementation((_k: string, allowStale?: boolean) =>
      Promise.resolve({ data: allowStale ? [{ UserId: 'OLD' }] : null })
    );
    expect(await api.getUsers(true)).toEqual([{ UserId: 'OLD' }]);

    (cache.get as jest.Mock).mockResolvedValue({ data: null });
    expect(await api.getUsers(true)).toEqual([]);
  });
});
