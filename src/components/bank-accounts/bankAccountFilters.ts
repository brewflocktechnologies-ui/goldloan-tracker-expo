import { BankAccount } from '../../types';

export const buildBankFilterChips = (accounts: BankAccount[]) => {
  const activeCount = accounts.filter(b => b.Status === 'Active').length;
  const inactiveCount = accounts.filter(b => b.Status === 'Inactive').length;
  return [
    { label: 'All', value: 'All', count: accounts.length },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Inactive', value: 'Inactive', count: inactiveCount },
  ];
};

export const customFilterPredicate = (b: BankAccount, filterVal: string) => {
  if (filterVal === 'All') return true;
  return b.Status === filterVal;
};

export const bankAccountSearchFilter = (b: BankAccount, q: string) => {
      const normQuery = (q || '').trim().toLowerCase();
      if (!normQuery) return true;
      const holder = (b.AccountHolderName || '').toLowerCase();
      const accNo = (b.AccountNumber || '').toLowerCase();
      const bank = (b.BankName || '').toLowerCase();
      const branch = (b.BranchName || '').toLowerCase();
      const city = (b.City || '').toLowerCase();
      const ifsc = (b.IFSCCode || '').toLowerCase();
      const id = (b.BankAccountId || '').toLowerCase();
      const status = (b.Status || '').toLowerCase();
      const upi = (b.UPI_ID || '').toLowerCase();
      const lastFour = accNo.length >= 4 ? accNo.slice(-4) : '';

      return (
        holder.includes(normQuery) ||
        accNo.includes(normQuery) ||
        lastFour.includes(normQuery) ||
        bank.includes(normQuery) ||
        branch.includes(normQuery) ||
        city.includes(normQuery) ||
        ifsc.includes(normQuery) ||
        id.includes(normQuery) ||
        status.includes(normQuery) ||
        upi.includes(normQuery)
      );
};
