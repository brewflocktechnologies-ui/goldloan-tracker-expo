import { BankAccount, Loan, Ornament, Payment, User } from '../types';

export interface UserStats {
  loanCount: number;
  goldWeight: number;
}

export type DueBadgeType = 'normal' | 'urgent' | 'overdue';

export interface DueBadge {
  text: string;
  type: DueBadgeType;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Counts users with the given status. */
export function countUsersByStatus(users: User[], status: User['Status']): number {
  return users.filter(u => u.Status === status).length;
}

/** Loan count and total ornament weight (gross, else net) per user, keyed by UserId. */
export function buildUserStatsMap(
  users: User[],
  loans: Loan[],
  ornaments: Ornament[]
): Map<string, UserStats> {
  const map = new Map<string, UserStats>();
  users.forEach(u => {
    const loanCount = loans.filter(l => l.UserId === u.UserId).length;
    const goldWeight = ornaments
      .filter(o => o.UserId === u.UserId)
      .reduce((sum, o) => sum + Number(o.GrossWeight || o.NetWeight || 0), 0);
    map.set(u.UserId, { loanCount, goldWeight });
  });
  return map;
}

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

/** "Last active: dd Mon yyyy" from UpdatedDate, else CreatedDate; '' when neither is valid. */
export function getUserLastActive(user: Pick<User, 'UpdatedDate' | 'CreatedDate'>): string {
  for (const value of [user.UpdatedDate, user.CreatedDate]) {
    if (!value) continue;
    const d = new Date(value);
    if (!isNaN(d.getTime())) return `Last active: ${formatDate(d)}`;
  }
  return '';
}

/** Human age string e.g. " (35 years)"; '' for a missing or invalid date. */
export function calculateAge(dob?: string): string {
  if (!dob) return '';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? ` (${age} years)` : '';
}
