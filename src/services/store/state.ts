import { BankAccount, GoldRateData, Loan, Ornament, Payment, User } from '../../types';

const defaultGoldRates: GoldRateData = {
  location: "Bangalore",
  updatedAt: new Date().toISOString(),
  displayDate: "Live Rates",
  gold24k: { rate1g: 8850, change: 0, direction: "up" },
  gold22k: { rate1g: 8115, change: 0, direction: "up" },
  gold18k: { rate1g: 6640, change: 0, direction: "up" },
};

type MutationErrorHandler = (message: string) => void;

/**
 * Global in-memory state so changes persist across screen transitions.
 * Lives in exactly one module (as properties of one object) so every store module
 * reads and writes the same values.
 */
export const state = {
  users: [] as User[],
  bankAccounts: [] as BankAccount[],
  ornaments: [] as Ornament[],
  loans: [] as Loan[],
  payments: [] as Payment[],
  goldRates: { ...defaultGoldRates } as GoldRateData,

  isSyncing: false,
  lastSyncedAt: null as string | null,
  lastSyncTimestamp: 0,
  hasInitialized: false,
  isCacheHydrated: false,
  syncError: null as string | null,
  isFetchingGoldRates: false,
  mutationErrorHandler: null as MutationErrorHandler | null,
};

export const listeners = new Set<() => void>();

export function notify() {
  listeners.forEach(fn => fn());
}
