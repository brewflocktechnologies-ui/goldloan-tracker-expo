import { BankAccount, Loan, Payment } from '../types';

export type DueBadgeType = 'normal' | 'urgent' | 'overdue';

export interface DueBadge {
    text: string;
    type: DueBadgeType;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Remaining loan limit on a bank account: Max − Utilized, never below 0. */
export function calculateAvailableLimit(bank: Pick<BankAccount, 'MaxLoanAmount' | 'UtilizedLoanAmount'>): number {
    return Math.max(0, (bank.MaxLoanAmount || 0) - (bank.UtilizedLoanAmount || 0));
}

/** Utilized ÷ Max as a rounded percentage; 0 when there is no limit. */
export function calculateUtilizationPercentage(
    bank: Pick<BankAccount, 'MaxLoanAmount' | 'UtilizedLoanAmount'>
): number {
    return bank.MaxLoanAmount > 0 ? Math.round((bank.UtilizedLoanAmount / bank.MaxLoanAmount) * 100) : 0;
}

/**
 * Days-left / overdue badge computed from the real DueDate. Returns '—' when
 * the date is missing or invalid.
 */
export function calculateDueBadge(dueDate?: string, loanStatus?: string): DueBadge {
    const badge: DueBadge = { text: '—', type: 'normal' };
    if (!dueDate) return badge;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return badge;

    const diffDays = Math.ceil((due.getTime() - Date.now()) / MS_PER_DAY);
    if (diffDays < 0 || loanStatus === 'Overdue') {
        return { text: `${Math.abs(diffDays)} days overdue`, type: 'overdue' };
    }
    return { text: `${diffDays} days left`, type: diffDays <= 7 ? 'urgent' : 'normal' };
}

/**
 * Outstanding principal. When the loan's payments are supplied it is
 * LoanAmount − Σ PrincipalAmount; otherwise it falls back to the placeholder
 * LoanAmount × 0.6 that the UI labels "(mock)".
 */
export function calculateOutstandingAmount(loan: Pick<Loan, 'LoanAmount'>, payments?: Payment[]): number {
    const amount = loan.LoanAmount || 0;
    if (!payments) return Math.round(amount * 0.6);
    const paid = payments.reduce((sum, p) => sum + (Number(p.PrincipalAmount) || 0), 0);
    return Math.max(0, Math.round(amount - paid));
}
