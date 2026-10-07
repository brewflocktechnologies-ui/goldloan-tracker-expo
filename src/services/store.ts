import { useEffect, useState } from 'react';
import { createBankAccountActions } from './store/bankAccounts';
import { getDashboardData } from './store/dashboard';
import { refreshGoldRates } from './store/goldRates';
import { hydrateFromCache } from './store/hydrate';
import { createLoanActions } from './store/loans';
import { createOrnamentActions } from './store/ornaments';
import { createPaymentActions } from './store/payments';
import { listeners, state } from './store/state';
import { syncFromBackend } from './store/sync';
import { createUserActions } from './store/users';

export { refreshGoldRates } from './store/goldRates';
export { getSyncError, syncFromBackend } from './store/sync';
export { setMutationErrorHandler } from './store/mutation';
export type { SaveCallbacks } from './store/mutation';

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);

    // Initial hydration and silent background sync on component mount
    if (!state.hasInitialized) {
      state.hasInitialized = true;
      hydrateFromCache().then(() => {
        syncFromBackend();
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const { addUser, updateUser, deleteUser } = createUserActions();
  const { addBankAccount, updateBankAccount, deleteBankAccount } = createBankAccountActions();
  const { addOrnament, updateOrnament, deleteOrnament } = createOrnamentActions();
  const { addLoan, updateLoan, closeAndReleaseLoan } = createLoanActions();
  const { addPayment } = createPaymentActions();

  return {
    users: state.users,
    bankAccounts: state.bankAccounts,
    ornaments: state.ornaments,
    loans: state.loans,
    payments: state.payments,
    goldRates: state.goldRates,
    isFetchingGoldRates: state.isFetchingGoldRates,
    refreshGoldRates,
    dashboardData: getDashboardData(),
    isSyncing: state.isSyncing,
    lastSyncedAt: state.lastSyncedAt,
    syncError: state.syncError,
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
  };
}
