import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const PREFIX = '@gl_cache:';

function freshCache() {
  let mod: typeof import('../../src/services/cache');
  jest.isolateModules(() => {
    mod = require('../../src/services/cache');
  });
  return mod!.cache;
}

let warnSpy: jest.SpyInstance;
beforeEach(async () => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
});
afterEach(() => {
  warnSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('cache — set / get', () => {
  it('returns what was stored', async () => {
    const cache = freshCache();
    await cache.set('users_list', [{ UserId: 'U001' }]);
    const res = await cache.get<any[]>('users_list');
    expect(res.data).toEqual([{ UserId: 'U001' }]);
    expect(res.isStale).toBe(false);
    expect(res.timestamp).toEqual(expect.any(Number));
  });

  it('returns null for a key that was never stored', async () => {
    const cache = freshCache();
    expect(await cache.get('nope')).toEqual({ data: null, isStale: false, timestamp: null });
  });

  it('persists to disk so a fresh instance (app restart) can read it', async () => {
    await freshCache().set('loans_all', [{ LoanId: 'L001' }]);
    expect(await AsyncStorage.getItem(PREFIX + 'loans_all')).toContain('L001');

    const restarted = freshCache(); // empty memory cache, same disk
    const res = await restarted.get<any[]>('loans_all');
    expect(res.data).toEqual([{ LoanId: 'L001' }]);
  });

  it('hides expired data unless stale reads are allowed', async () => {
    const cache = freshCache();
    const now = Date.now();
    await cache.set('k', 'v', 1000);
    jest.spyOn(Date, 'now').mockReturnValue(now + 5000);

    expect((await cache.get('k')).data).toBeNull();
    const stale = await cache.get<string>('k', true);
    expect(stale.data).toBe('v');
    expect(stale.isStale).toBe(true);
  });

  it('serves stale data from disk when allowed, and hides it otherwise', async () => {
    const now = Date.now();
    await freshCache().set('k', 'disk', 1000);
    jest.spyOn(Date, 'now').mockReturnValue(now + 5000);

    const restarted = freshCache();
    expect((await restarted.get('k')).data).toBeNull();
    expect((await freshCache().get<string>('k', true)).data).toBe('disk');
  });

  it('still works from memory when disk writes fail', async () => {
    const cache = freshCache();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await cache.set('k', 'v');
    expect((await cache.get('k')).data).toBe('v');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns null when the disk entry is corrupt', async () => {
    await AsyncStorage.setItem(PREFIX + 'bad', '{not json');
    const res = await freshCache().get('bad');
    expect(res.data).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('cache — invalidate', () => {
  it('removes a key from memory and disk', async () => {
    const cache = freshCache();
    await cache.set('users_list', [1]);
    await cache.invalidate('users_list');
    expect((await cache.get('users_list')).data).toBeNull();
    expect(await AsyncStorage.getItem(PREFIX + 'users_list')).toBeNull();
  });

  it('removes every key that starts with the prefix and leaves others alone', async () => {
    const cache = freshCache();
    await cache.set('bank_accounts_all', [1]);
    await cache.set('bank_accounts_U001', [2]);
    await cache.set('loans_all', [3]);
    await cache.invalidate('bank_accounts');
    expect((await cache.get('bank_accounts_all')).data).toBeNull();
    expect((await cache.get('bank_accounts_U001')).data).toBeNull();
    expect((await cache.get('loans_all')).data).toEqual([3]);
  });

  it('invalidateEntity also drops the unified snapshot and dashboard cache', async () => {
    const cache = freshCache();
    await cache.set('users_list', [1]);
    await cache.set('initial_sync_data', { users: [1] });
    await cache.set('dashboard', { total: 1 });
    await cache.set('loans_all', [2]);
    await cache.invalidateEntity('users');
    expect((await cache.get('users_list')).data).toBeNull();
    expect((await cache.get('initial_sync_data')).data).toBeNull();
    expect((await cache.get('dashboard')).data).toBeNull();
    expect((await cache.get('loans_all')).data).toEqual([2]);
  });

  it('survives a disk error while invalidating', async () => {
    const cache = freshCache();
    jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValueOnce(new Error('boom'));
    await expect(cache.invalidate('x')).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('cache — clearAll', () => {
  it('clears app cache entries but not unrelated storage keys', async () => {
    const cache = freshCache();
    await cache.set('a', 1);
    await cache.set('b', 2);
    await AsyncStorage.setItem('@goldloan_custom_gas_url', 'https://x');
    await cache.clearAll();
    expect((await cache.get('a')).data).toBeNull();
    expect((await cache.get('b')).data).toBeNull();
    expect(await AsyncStorage.getItem('@goldloan_custom_gas_url')).toBe('https://x');
  });

  it('survives a disk error', async () => {
    const cache = freshCache();
    jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValueOnce(new Error('boom'));
    await expect(cache.clearAll()).resolves.toBeUndefined();
  });
});
