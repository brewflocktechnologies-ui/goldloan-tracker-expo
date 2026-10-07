import { state } from './state';

export function recomputeBankUtilization() {
  state.bankAccounts = state.bankAccounts.map(b => {
    const utilized = calculateUserBankUtilization(b.UserId, b.BankAccountId);
    return { ...b, UtilizedLoanAmount: utilized, AvailableLoanAmount: Math.max(0, b.MaxLoanAmount - utilized) };
  });
}

export function calculateUserBankUtilization(userId: string, bankAccountId: string): number {
  return state.loans
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
