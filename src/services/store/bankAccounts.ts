import { BankAccount } from '../../types';
import { api } from '../api';
import { normalizeBankAccount } from '../normalize';
import { nextId, replaceItem, restoreItem, runMutation, SaveCallbacks } from './mutation';
import { persistAll } from './persist';
import { notify, state } from './state';

export function createBankAccountActions() {
  const addBankAccount = (accData: Partial<BankAccount> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const tempId = nextId('BA', state.bankAccounts, 'BankAccountId');
    const max = Number(accData.MaxLoanAmount) || 0;
    const util = Number(accData.UtilizedLoanAmount) || 0;
    const newAcc: BankAccount = {
      BankAccountId: tempId,
      UserId: accData.UserId || state.users[0]?.UserId || 'U001',
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
    const prevIds = new Set(state.bankAccounts.map(b => b.BankAccountId));
    state.bankAccounts = [newAcc, ...state.bankAccounts];
    persistAll();
    notify();

    runMutation<BankAccount>(() => api.addBankAccount(accData), {
      callbacks,
      failureMessage: `Bank account ${newAcc.BankName || ''} was not saved`.replace('  ', ' '),
      onSaved: data => {
        state.bankAccounts = state.bankAccounts.map(b => b.BankAccountId === tempId ? { ...b, ...normalizeBankAccount(data) } : b);
        persistAll();
        notify();
      },
      undo: () => { state.bankAccounts = state.bankAccounts.filter(b => b.BankAccountId !== tempId); },
      alwaysUndo: true,
      findSaved: () => state.bankAccounts.find(b =>
        !prevIds.has(b.BankAccountId) && String(b.AccountNumber) === String(newAcc.AccountNumber) && b.UserId === newAcc.UserId),
    });

    return newAcc;
  };

  const updateBankAccount = (accId: string, updated: Partial<BankAccount> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const prev = state.bankAccounts.find(b => b.BankAccountId === accId);
    state.bankAccounts = state.bankAccounts.map(b => {
      if (b.BankAccountId === accId) {
        const merged = { ...b, ...updated, UpdatedDate: new Date().toISOString() };
        const max = Number(merged.MaxLoanAmount) || 0;
        const util = Number(merged.UtilizedLoanAmount) || 0;
        merged.AvailableLoanAmount = Math.max(0, max - util);
        return merged;
      }
      return b;
    });
    persistAll();
    notify();

    runMutation(() => api.updateBankAccount(accId, updated), {
      callbacks,
      failureMessage: `Changes to bank account ${prev?.BankName || accId} were not saved`,
      undo: () => { state.bankAccounts = replaceItem(state.bankAccounts, prev, 'BankAccountId'); },
    });
  };

  const deleteBankAccount = (accId: string, callbacks?: SaveCallbacks) => {
    const index = state.bankAccounts.findIndex(b => b.BankAccountId === accId);
    const prev = state.bankAccounts[index];
    state.bankAccounts = state.bankAccounts.filter(b => b.BankAccountId !== accId);
    persistAll();
    notify();

    runMutation(() => api.deleteBankAccount(accId), {
      callbacks,
      failureMessage: `Bank account ${prev?.BankName || accId} was not deleted`,
      undo: () => { state.bankAccounts = restoreItem(state.bankAccounts, prev, 'BankAccountId', index); },
    });
  };

  return { addBankAccount, updateBankAccount, deleteBankAccount };
}
