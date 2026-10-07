import { Loan } from '../../types';
import { getNextLoanNumber } from '../../utils/loanNumber';
import { api } from '../api';
import { normalizeLoan } from '../normalize';
import { calculateLoanPeriodInterest, calculateUserBankUtilization, recomputeBankUtilization } from './calculations';
import { nextId, replaceItem, runMutation, SaveCallbacks } from './mutation';
import { persistAll } from './persist';
import { notify, state } from './state';

export function createLoanActions() {
  const addLoan = (
    loanData: any,
    callbacks?: { onSuccess?: (loan: Loan) => void; onError?: (message: string) => void }
  ) => {
    const prevOrnaments = state.ornaments;
    const tempId = nextId('L', state.loans, 'LoanId');
    const amount = Number(loanData.LoanAmount) || 0;
    const procFee = Number(loanData.ProcessingFee) || 0;
    const docCharge = Number(loanData.DocumentCharge) || 0;
    const insCharge = Number(loanData.InsuranceCharge) || 0;
    const netDisb = amount - (procFee + docCharge + insCharge);
    const selectedOrnaments = state.ornaments.filter(o => (loanData.ornamentIds || []).includes(o.OrnamentId));
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
      LoanNumber: loanData.LoanNumber || getNextLoanNumber(state.loans),
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
      state.ornaments = state.ornaments.map(o => 
        loanData.ornamentIds.includes(o.OrnamentId) ? { ...o, Status: 'Pledged' } : o
      );
    }

    state.loans = [newLoan, ...state.loans];
    state.bankAccounts = state.bankAccounts.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });
    persistAll();
    notify();

    const prevLoanIds = new Set(state.loans.filter(l => l.LoanId !== tempId).map(l => l.LoanId));
    const startedAt = Date.now();

    runMutation<Loan>(() => api.addLoan(loanData), {
      failureMessage: 'Unable to save the loan',
      onSaved: data => {
        const saved = { ...newLoan, ...normalizeLoan(data) };
        state.loans = state.loans.map(l => l.LoanId === tempId ? saved : l);
        persistAll();
        notify();
        callbacks?.onSuccess?.(saved);
      },
      undo: () => {
        state.loans = state.loans.filter(l => l.LoanId !== tempId);
        const pledgedIds: string[] = loanData.ornamentIds || [];
        state.ornaments = state.ornaments.map(o => {
          if (!pledgedIds.includes(o.OrnamentId)) return o;
          const before = prevOrnaments.find(p => p.OrnamentId === o.OrnamentId);
          return before ? { ...o, Status: before.Status } : o;
        });
        recomputeBankUtilization();
      },
      alwaysUndo: true,
      // A lost reply or a late backend error doesn't mean the loan wasn't written: look in the sheet.
      findSaved: () => state.loans.find(l =>
        !prevLoanIds.has(l.LoanId) && l.LoanId !== tempId &&
        String(l.UserId) === String(loanData.UserId) &&
        Number(l.LoanAmount) === amount &&
        new Date(l.CreatedDate || 0).getTime() >= startedAt - 5000),
      onFound: saved => callbacks?.onSuccess?.(saved),
      // The loan form shows its own message
      onFailure: message => callbacks?.onError?.(message),
    });

    return newLoan;
  };

  const updateLoan = (loanId: string, updated: Partial<Loan>, callbacks?: SaveCallbacks) => {
    const prevLoan = state.loans.find(l => l.LoanId === loanId);
    // Ornaments whose status this change may touch, kept as they were so a failed save can restore them
    const affectedIds = new Set<string>([...(prevLoan?.ornamentIds || []), ...(updated.ornamentIds || [])]);
    const affectedOrnaments = state.ornaments.filter(o => affectedIds.has(o.OrnamentId));
    state.loans = state.loans.map(l => l.LoanId === loanId ? { ...l, ...updated, UpdatedDate: new Date().toISOString() } : l);

    // Reconcile ornament statuses if ornamentIds were updated
    if (updated.ornamentIds) {
      const prevOrnIds = prevLoan?.ornamentIds || [];
      const newOrnIds = updated.ornamentIds || [];
      const removed = prevOrnIds.filter(id => !newOrnIds.includes(id));
      const added = newOrnIds.filter(id => !prevOrnIds.includes(id));

      if (removed.length > 0 || added.length > 0) {
        state.ornaments = state.ornaments.map(o => {
          if (removed.includes(o.OrnamentId)) {
            return { ...o, Status: 'Available', ReleasedLoanId: '', ReleaseDate: '' };
          }
          if (added.includes(o.OrnamentId)) {
            return { ...o, Status: 'Pledged' };
          }
          return o;
        });
        persistAll();
      }
    }

    // Reconcile bank account utilization
    state.bankAccounts = state.bankAccounts.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });

    persistAll();
    notify();

    runMutation<Loan>(() => api.updateLoan(loanId, updated), {
      callbacks,
      failureMessage: `Changes to loan ${prevLoan?.LoanNumber || loanId} were not saved`,
      onSaved: data => {
        state.loans = state.loans.map(l => l.LoanId === loanId ? { ...l, ...normalizeLoan(data) } : l);
        persistAll();
        notify();
      },
      undo: () => {
        state.loans = replaceItem(state.loans, prevLoan, 'LoanId');
        affectedOrnaments.forEach(o => { state.ornaments = replaceItem(state.ornaments, o, 'OrnamentId'); });
        recomputeBankUtilization();
      },
    });
  };

  const closeAndReleaseLoan = (loanId: string, remarks: string, callbacks?: SaveCallbacks) => {
    const targetLoan = state.loans.find(l => l.LoanId === loanId);
    if (!targetLoan) return;
    const affectedOrnaments = state.ornaments.filter(o => targetLoan.ornamentIds?.includes(o.OrnamentId));

    state.loans = state.loans.map(l => l.LoanId === loanId ? {
      ...l,
      LoanStatus: 'Closed',
      ClosedDate: new Date().toISOString(),
      ClosureRemarks: remarks,
    } : l);

    if (targetLoan.ornamentIds && targetLoan.ornamentIds.length > 0) {
      state.ornaments = state.ornaments.map(o =>
        targetLoan.ornamentIds?.includes(o.OrnamentId) ? {
          ...o,
          Status: 'Available',
          ReleaseDate: new Date().toISOString(),
          ReleasedLoanId: loanId,
        } : o
      );
    }

    state.bankAccounts = state.bankAccounts.map(b => {
      const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
    });

    persistAll();
    notify();

    runMutation(() => api.closeAndReleaseLoan(loanId, remarks), {
      callbacks,
      failureMessage: `Loan ${targetLoan.LoanNumber || loanId} was not closed`,
      undo: () => {
        state.loans = replaceItem(state.loans, targetLoan, 'LoanId');
        affectedOrnaments.forEach(o => { state.ornaments = replaceItem(state.ornaments, o, 'OrnamentId'); });
        recomputeBankUtilization();
      },
    });
  };

  return { addLoan, updateLoan, closeAndReleaseLoan };
}
