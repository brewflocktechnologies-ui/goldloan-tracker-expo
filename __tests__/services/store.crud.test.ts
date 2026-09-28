import type { act as ActFn, renderHook as RenderHookFn } from '@testing-library/react-native';

// resetModules gives every test its own React instance, so the renderer must be re-required
// from the same registry as the store (mixing instances breaks hooks).
let act: typeof ActFn;
let renderHook: typeof RenderHookFn;

// The store keeps its state in module-level variables, so every test loads a fresh copy.
jest.mock('../../src/services/cache', () => ({
  CacheTTL: { LISTS: 1000 },
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
    addOrnament: jest.fn(),
    updateOrnament: jest.fn(),
    deleteOrnament: jest.fn(),
  },
}));

type StoreModule = typeof import('../../src/services/store');

function loadStore() {
  jest.resetModules();
  // RNTL registers its auto-cleanup hooks on import, which isn't allowed from inside a test.
  process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rntl = require('@testing-library/react-native');
  act = rntl.act;
  renderHook = rntl.renderHook;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const api = require('../../src/services/api').api;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cache = require('../../src/services/cache').cache;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const store: StoreModule = require('../../src/services/store');

  api.getSessionToken.mockReturnValue('token');
  api.getGoldRates.mockResolvedValue({ data: null });
  api.addUser.mockResolvedValue({ success: false });
  api.updateUser.mockResolvedValue({ success: true });
  api.deleteUser.mockResolvedValue({ success: true });
  api.addOrnament.mockResolvedValue({ success: false });
  api.updateOrnament.mockResolvedValue({ success: true });
  api.deleteOrnament.mockResolvedValue({ success: true });

  return { api, cache, store };
}

async function setup(seed: { users?: any[]; ornaments?: any[] } = {}) {
  const ctx = loadStore();
  const hook = renderHook(() => ctx.store.useAppStore());
  // let the mount effect (cache hydration + background sync) settle
  await act(async () => {});
  if (seed.users || seed.ornaments) {
    ctx.api.getInitialSyncData.mockResolvedValue({
      success: true,
      data: { users: seed.users || [], ornaments: seed.ornaments || [] },
    });
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
  }
  return { ...ctx, hook, store$: () => hook.result.current };
}

let warnSpy: jest.SpyInstance;
beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

const USERS = [
  { UserId: 'U001', FullName: 'Ravi Kumar', MobileNumber: '9876543210', Status: 'Active' },
  { UserId: 'U003', FullName: 'Anita Sharma', MobileNumber: '9000000002', Status: 'Inactive' },
];

const ORNAMENTS = [
  {
    OrnamentId: 'ORN001', UserId: 'U001', OrnamentName: 'Chain', GrossWeight: 10, StoneWeight: 1,
    MetalWeight: 9, NetWeight: 9, BuyingPricePerGram: 5000, CurrentPricePerGram: 6000, Status: 'Available',
  },
  { OrnamentId: 'ORN007', UserId: 'U003', OrnamentName: 'Ring', GrossWeight: 4, StoneWeight: 0, Status: 'Pledged' },
  { OrnamentId: 'ORN008', UserId: 'U003', OrnamentName: 'Old', GrossWeight: 1, Status: 'Deleted' },
];

describe('store — users CRUD', () => {
  describe('addUser', () => {
    it('adds a customer at the top with sensible defaults and a generated id', async () => {
      const { store$, hook } = await setup();
      let created: any;
      act(() => {
        created = store$().addUser({ FullName: 'New Person', MobileNumber: '9111122223' });
      });
      expect(created).toMatchObject({
        UserId: 'U001',
        FullName: 'New Person',
        MobileNumber: '9111122223',
        Gender: 'Male',
        City: 'Bengaluru',
        State: 'Karnataka',
        Pincode: '560001',
        Status: 'Active',
      });
      expect(created.CustomerCode).toBe('CUST-101');
      expect(created.CreatedDate).toBeTruthy();
      expect(hook.result.current.users[0].UserId).toBe('U001');
    });

    it('numbers ids after the highest existing id (not the list length)', async () => {
      const { store$ } = await setup({ users: USERS });
      let created: any;
      act(() => {
        created = store$().addUser({ FullName: 'Next' });
      });
      expect(created.UserId).toBe('U004');
      expect(created.CustomerCode).toBe('CUST-103');
    });

    it('keeps a supplied customer code, status and photo; falls back to "New Customer"', async () => {
      const { store$ } = await setup();
      let a: any;
      let b: any;
      act(() => {
        a = store$().addUser({ FullName: 'X', CustomerCode: 'CUST-777', Status: 'Inactive', CustomerPhoto: 'file://p.jpg' });
        b = store$().addUser({});
      });
      expect(a).toMatchObject({ CustomerCode: 'CUST-777', Status: 'Inactive', CustomerPhoto: 'file://p.jpg' });
      expect(b.FullName).toBe('New Customer');
    });

    it('is visible to components immediately (optimistic) and persisted to the cache', async () => {
      const { store$, cache } = await setup();
      act(() => {
        store$().addUser({ FullName: 'Cached' });
      });
      expect(store$().users).toHaveLength(1);
      expect(cache.set).toHaveBeenCalledWith('users_list', expect.arrayContaining([expect.objectContaining({ FullName: 'Cached' })]), 1000);
    });

    it('sends the original form data (including files) to the backend', async () => {
      const { store$, api } = await setup();
      const files = [{ name: 'a.jpg', base64: 'AAA' }];
      act(() => {
        store$().addUser({ FullName: 'With Photo', files });
      });
      expect(api.addUser).toHaveBeenCalledWith({ FullName: 'With Photo', files });
    });

    it('merges the server response over the temporary record on success', async () => {
      const { store$, api } = await setup();
      api.addUser.mockResolvedValue({ success: true, data: { UserId: 'U900', CustomerPhoto: 'https://drive/photo' } });
      await act(async () => {
        store$().addUser({ FullName: 'Server Person' });
      });
      expect(store$().users).toHaveLength(1);
      expect(store$().users[0]).toMatchObject({ UserId: 'U900', FullName: 'Server Person', CustomerPhoto: 'https://drive/photo' });
    });

    it('keeps the local record when the backend reports failure', async () => {
      const { store$, api } = await setup();
      api.addUser.mockResolvedValue({ success: false });
      await act(async () => {
        store$().addUser({ FullName: 'Local Only' });
      });
      expect(store$().users[0]).toMatchObject({ UserId: 'U001', FullName: 'Local Only' });
    });

    it('keeps the local record and only warns when the request rejects', async () => {
      const { store$, api } = await setup();
      api.addUser.mockRejectedValue(new Error('network'));
      await act(async () => {
        store$().addUser({ FullName: 'Offline' });
      });
      expect(store$().users).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith('[Store] addUser error:', expect.any(Error));
    });
  });

  describe('updateUser', () => {
    it('merges changes into just that customer and stamps UpdatedDate', async () => {
      const { store$, api } = await setup({ users: USERS });
      act(() => {
        store$().updateUser('U001', { FullName: 'Ravi K', City: 'Mysuru' });
      });
      const [ravi, anita] = store$().users;
      expect(ravi).toMatchObject({ UserId: 'U001', FullName: 'Ravi K', City: 'Mysuru', MobileNumber: '9876543210' });
      expect(ravi.UpdatedDate).toBeTruthy();
      expect(anita.FullName).toBe('Anita Sharma');
      expect(anita.UpdatedDate).toBeUndefined();
      expect(api.updateUser).toHaveBeenCalledWith('U001', { FullName: 'Ravi K', City: 'Mysuru' });
    });

    it('persists to the cache', async () => {
      const { store$, cache } = await setup({ users: USERS });
      cache.set.mockClear();
      act(() => {
        store$().updateUser('U001', { FullName: 'Changed' });
      });
      expect(cache.set).toHaveBeenCalledWith('users_list', expect.any(Array), 1000);
    });

    it('does nothing to the list for an unknown id', async () => {
      const { store$ } = await setup({ users: USERS });
      act(() => {
        store$().updateUser('U999', { FullName: 'Ghost' });
      });
      expect(store$().users.map(u => u.FullName)).toEqual(['Ravi Kumar', 'Anita Sharma']);
    });

    it('keeps the local change and only warns when the request rejects', async () => {
      const { store$, api } = await setup({ users: USERS });
      api.updateUser.mockRejectedValue(new Error('boom'));
      await act(async () => {
        store$().updateUser('U001', { FullName: 'Edited Offline' });
      });
      expect(store$().users[0].FullName).toBe('Edited Offline');
      expect(warnSpy).toHaveBeenCalledWith('[Store] updateUser error:', expect.any(Error));
    });
  });

  describe('deleteUser', () => {
    it('removes only that customer and tells the backend', async () => {
      const { store$, api } = await setup({ users: USERS });
      act(() => {
        store$().deleteUser('U001');
      });
      expect(store$().users.map(u => u.UserId)).toEqual(['U003']);
      expect(api.deleteUser).toHaveBeenCalledWith('U001');
    });

    it('persists to the cache', async () => {
      const { store$, cache } = await setup({ users: USERS });
      cache.set.mockClear();
      act(() => {
        store$().deleteUser('U003');
      });
      expect(cache.set).toHaveBeenCalledWith('users_list', [expect.objectContaining({ UserId: 'U001' })], 1000);
    });

    it('is a no-op for an unknown id', async () => {
      const { store$ } = await setup({ users: USERS });
      act(() => {
        store$().deleteUser('U999');
      });
      expect(store$().users).toHaveLength(2);
    });

    it('keeps the local delete and only warns when the request rejects', async () => {
      const { store$, api } = await setup({ users: USERS });
      api.deleteUser.mockRejectedValue(new Error('nope'));
      await act(async () => {
        store$().deleteUser('U001');
      });
      expect(store$().users).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith('[Store] deleteUser error:', expect.any(Error));
    });
  });
});

describe('store — ornaments CRUD', () => {
  describe('addOrnament', () => {
    it('derives net weight, cost, market value and appreciation from the inputs', async () => {
      const { store$ } = await setup({ users: USERS });
      let created: any;
      act(() => {
        created = store$().addOrnament({
          OrnamentName: 'Bangle',
          UserId: 'U003',
          GrossWeight: 20,
          StoneWeight: 2,
          BuyingPricePerGram: 5000,
          CurrentPricePerGram: 5500,
          Quantity: 3,
        });
      });
      expect(created).toMatchObject({
        OrnamentId: 'ORN001',
        UserId: 'U003',
        GrossWeight: 20,
        StoneWeight: 2,
        NetWeight: 18,
        MetalWeight: 18,
        BuyingCost: 90000,
        TotalPrice: 90000,
        MarketValue: 99000,
        EstimatedValue: 99000,
        AppreciationValue: 9000,
        AppreciationPercentage: 10,
        Quantity: 3,
        Status: 'Available',
        Purity: '22K',
      });
    });

    it('uses an explicit MetalWeight instead of gross minus stone', async () => {
      const { store$ } = await setup();
      let created: any;
      act(() => {
        created = store$().addOrnament({ GrossWeight: 20, StoneWeight: 2, MetalWeight: 15, BuyingPricePerGram: 1000 });
      });
      expect(created.NetWeight).toBe(15);
      expect(created.BuyingCost).toBe(15000);
    });

    it('never produces a negative net weight', async () => {
      const { store$ } = await setup();
      let created: any;
      act(() => {
        created = store$().addOrnament({ GrossWeight: 2, StoneWeight: 5 });
      });
      expect(created.NetWeight).toBe(0);
    });

    it('reports 0% appreciation when there is no buying cost', async () => {
      const { store$ } = await setup();
      let created: any;
      act(() => {
        created = store$().addOrnament({ GrossWeight: 10, CurrentPricePerGram: 5000 });
      });
      expect(created.BuyingCost).toBe(0);
      expect(created.AppreciationPercentage).toBe(0);
    });

    it('rounds money values to 2 decimals', async () => {
      const { store$ } = await setup();
      let created: any;
      act(() => {
        created = store$().addOrnament({ GrossWeight: 3.333, BuyingPricePerGram: 5555.55 });
      });
      expect(created.BuyingCost).toBe(18516.65);
    });

    it('fills defaults and falls back to the first customer when none is given', async () => {
      const { store$ } = await setup({ users: USERS });
      let created: any;
      act(() => {
        created = store$().addOrnament({});
      });
      expect(created).toMatchObject({
        UserId: 'U001',
        OrnamentName: 'Gold Item',
        OrnamentType: 'Necklace',
        Quantity: 1,
        OrnamentImages: '',
        Status: 'Available',
      });
    });

    it('numbers ids after the highest existing id', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      let created: any;
      act(() => {
        created = store$().addOrnament({ OrnamentName: 'Next' });
      });
      expect(created.OrnamentId).toBe('ORN009');
      expect(store$().ornaments[0].OrnamentId).toBe('ORN009');
    });

    it('persists to the cache and sends the original data to the backend', async () => {
      const { store$, cache, api } = await setup();
      const data = { OrnamentName: 'Sent', files: [{ name: 'x.jpg' }] };
      act(() => {
        store$().addOrnament(data);
      });
      expect(cache.set).toHaveBeenCalledWith('ornaments_all', expect.any(Array), 1000);
      expect(api.addOrnament).toHaveBeenCalledWith(data);
    });

    it('merges the server response over the temporary record on success', async () => {
      const { store$, api } = await setup();
      api.addOrnament.mockResolvedValue({ success: true, data: { OrnamentId: 'ORN555', OrnamentImages: 'drive-id' } });
      await act(async () => {
        store$().addOrnament({ OrnamentName: 'Synced' });
      });
      expect(store$().ornaments).toHaveLength(1);
      expect(store$().ornaments[0]).toMatchObject({ OrnamentId: 'ORN555', OrnamentName: 'Synced', OrnamentImages: 'drive-id' });
    });

    it('keeps the local record and only warns when the request rejects', async () => {
      const { store$, api } = await setup();
      api.addOrnament.mockRejectedValue(new Error('network'));
      await act(async () => {
        store$().addOrnament({ OrnamentName: 'Offline' });
      });
      expect(store$().ornaments).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith('[Store] addOrnament error:', expect.any(Error));
    });
  });

  describe('updateOrnament', () => {
    it('recalculates cost, market value and appreciation when prices change', async () => {
      const { store$, api } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().updateOrnament('ORN001', { BuyingPricePerGram: 4000, CurrentPricePerGram: 6000 });
      });
      const orn = store$().ornaments.find(o => o.OrnamentId === 'ORN001')!;
      expect(orn).toMatchObject({
        BuyingCost: 36000,
        TotalPrice: 36000,
        MarketValue: 54000,
        AppreciationValue: 18000,
        AppreciationPercentage: 50,
        OrnamentName: 'Chain',
      });
      expect(api.updateOrnament).toHaveBeenCalledWith('ORN001', { BuyingPricePerGram: 4000, CurrentPricePerGram: 6000 });
    });

    it('derives net weight from gross minus stone when there is no metal weight', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().updateOrnament('ORN007', { GrossWeight: 10, StoneWeight: 2.5, BuyingPricePerGram: 1000 });
      });
      const orn = store$().ornaments.find(o => o.OrnamentId === 'ORN007')!;
      expect(orn.NetWeight).toBe(7.5);
      expect(orn.BuyingCost).toBe(7500);
    });

    it('keeps an explicit metal weight even if gross changes', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().updateOrnament('ORN001', { GrossWeight: 50 });
      });
      const orn = store$().ornaments.find(o => o.OrnamentId === 'ORN001')!;
      expect(orn.GrossWeight).toBe(50);
      expect(orn.NetWeight).toBe(9);
    });

    it('updates photos and status without touching other ornaments', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().updateOrnament('ORN001', { OrnamentImages: 'a | b', Status: 'Pledged' });
      });
      const list = store$().ornaments;
      expect(list.find(o => o.OrnamentId === 'ORN001')).toMatchObject({ OrnamentImages: 'a | b', Status: 'Pledged' });
      expect(list.find(o => o.OrnamentId === 'ORN007')!.Status).toBe('Pledged');
      expect(list.find(o => o.OrnamentId === 'ORN007')!.OrnamentName).toBe('Ring');
    });

    it('leaves the list alone for an unknown id', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().updateOrnament('ORN999', { OrnamentName: 'Ghost' });
      });
      expect(store$().ornaments.map(o => o.OrnamentName)).toEqual(['Chain', 'Ring', 'Old']);
    });

    it('keeps the local change and only warns when the request rejects', async () => {
      const { store$, api } = await setup({ ornaments: ORNAMENTS });
      api.updateOrnament.mockRejectedValue(new Error('boom'));
      await act(async () => {
        store$().updateOrnament('ORN001', { OrnamentName: 'Renamed' });
      });
      expect(store$().ornaments.find(o => o.OrnamentId === 'ORN001')!.OrnamentName).toBe('Renamed');
      expect(warnSpy).toHaveBeenCalledWith('[Store] updateOrnament error:', expect.any(Error));
    });
  });

  describe('deleteOrnament', () => {
    it('removes only that ornament and tells the backend', async () => {
      const { store$, api, cache } = await setup({ ornaments: ORNAMENTS });
      cache.set.mockClear();
      act(() => {
        store$().deleteOrnament('ORN001');
      });
      expect(store$().ornaments.map(o => o.OrnamentId)).toEqual(['ORN007', 'ORN008']);
      expect(api.deleteOrnament).toHaveBeenCalledWith('ORN001');
      expect(cache.set).toHaveBeenCalledWith('ornaments_all', expect.any(Array), 1000);
    });

    it('is a no-op for an unknown id', async () => {
      const { store$ } = await setup({ ornaments: ORNAMENTS });
      act(() => {
        store$().deleteOrnament('ORN999');
      });
      expect(store$().ornaments).toHaveLength(3);
    });

    it('keeps the local delete and only warns when the request rejects', async () => {
      const { store$, api } = await setup({ ornaments: ORNAMENTS });
      api.deleteOrnament.mockRejectedValue(new Error('nope'));
      await act(async () => {
        store$().deleteOrnament('ORN001');
      });
      expect(store$().ornaments).toHaveLength(2);
      expect(warnSpy).toHaveBeenCalledWith('[Store] deleteOrnament error:', expect.any(Error));
    });
  });
});

describe('store — sync and derived data', () => {
  it('loads users and ornaments from the unified sync endpoint', async () => {
    const { store$ } = await setup({ users: USERS, ornaments: ORNAMENTS });
    expect(store$().users).toHaveLength(2);
    expect(store$().ornaments).toHaveLength(3);
    expect(store$().syncError).toBeNull();
    expect(store$().lastSyncedAt).toBeTruthy();
  });

  it('skips syncing when there is no session token', async () => {
    const ctx = loadStore();
    ctx.api.getSessionToken.mockReturnValue(null);
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(ctx.api.getInitialSyncData).not.toHaveBeenCalled();
  });

  it('falls back to the individual endpoints when the unified sync is unavailable', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockResolvedValue({ success: false });
    ctx.api.getUsers.mockResolvedValue(USERS);
    ctx.api.getBankAccounts.mockResolvedValue([]);
    ctx.api.getOrnaments.mockResolvedValue(ORNAMENTS);
    ctx.api.getLoans.mockResolvedValue([]);
    ctx.api.getPayments.mockResolvedValue([]);
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(hook.result.current.users).toHaveLength(2);
    expect(hook.result.current.ornaments).toHaveLength(3);
  });

  it('records the error message when a sync throws', async () => {
    const ctx = loadStore();
    ctx.api.getInitialSyncData.mockRejectedValue(new Error('Server exploded'));
    const hook = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    await act(async () => {
      await hook.result.current.syncFromBackend(true);
    });
    expect(hook.result.current.syncError).toBe('Server exploded');
    expect(hook.result.current.isSyncing).toBe(false);
  });

  it('counts ornaments in the dashboard, excluding deleted ones', async () => {
    const { store$ } = await setup({ ornaments: ORNAMENTS });
    expect(store$().dashboardData.totalOrnaments).toBe(2);
    expect(store$().dashboardData.pledgedOrnamentsCount).toBe(1);
  });

  it('shares changes between two mounted components', async () => {
    const ctx = loadStore();
    const a = renderHook(() => ctx.store.useAppStore());
    const b = renderHook(() => ctx.store.useAppStore());
    await act(async () => {});
    act(() => {
      a.result.current.addUser({ FullName: 'Shared' });
    });
    expect(b.result.current.users.map(u => u.FullName)).toEqual(['Shared']);
  });
});
