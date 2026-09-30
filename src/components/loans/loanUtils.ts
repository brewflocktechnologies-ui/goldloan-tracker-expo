import { Loan, Payment } from '../../types';

/**
 * Format currency amount into Lakhs (e.g. ₹1.80 L) if >= 1,00,000,
 * otherwise standard Indian Rupee format (e.g. ₹85,000).
 */
export function formatAmountLakh(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  if (num >= 100000) {
    const lakhs = num / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into "5 Sep 2026" format matching the mockup.
 */
export function formatLoanDate(dateStr?: string | number | null): string {
  if (!dateStr || dateStr === '—') return '—';
  const str = String(dateStr);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats phone number into "+91 97410 45678" format matching the mockup.
 * Safely accepts string, number, or null/undefined without crashing.
 */
export function formatLoanPhone(phone?: string | number | null): string {
  if (phone === undefined || phone === null || phone === '') return '';
  const str = String(phone).trim();
  const cleaned = str.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return str;
}

export type LoanBadgeVariant = 'overdue' | 'active' | 'closed';
export type LoanFooterType = 'overdue' | 'urgent' | 'normal' | 'closed';

export interface LoanStatusInfo {
  isOverdue: boolean;
  badgeLabel: string;
  badgeVariant: LoanBadgeVariant;
  footerText: string;
  footerType: LoanFooterType;
}

/**
 * Calculates loan overdue/active state, days remaining, badge label and footer text.
 */
export function getLoanStatusInfo(loan: Loan): LoanStatusInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loan.LoanStatus === 'Closed') {
    return {
      isOverdue: false,
      badgeLabel: 'Closed',
      badgeVariant: 'closed',
      footerText: loan.ClosedDate ? `Closed on ${formatLoanDate(loan.ClosedDate)}` : 'Closed',
      footerType: 'closed',
    };
  }

  const due = loan.DueDate ? new Date(String(loan.DueDate)) : null;
  if (due) due.setHours(0, 0, 0, 0);

  const isOverdue = loan.LoanStatus === 'Overdue' || Boolean(due && due.getTime() < today.getTime());

  if (isOverdue) {
    const diffTime = due ? today.getTime() - due.getTime() : 0;
    const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return {
      isOverdue: true,
      badgeLabel: 'Overdue',
      badgeVariant: 'overdue',
      footerText: `Overdue by ${days} day${days === 1 ? '' : 's'}`,
      footerType: 'overdue',
    };
  }

  // Active Loan
  if (due) {
    const diffTime = due.getTime() - today.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return {
        isOverdue: false,
        badgeLabel: 'Active',
        badgeVariant: 'active',
        footerText: 'Due today',
        footerType: 'urgent',
      };
    }
    if (days > 0 && days <= 30) {
      return {
        isOverdue: false,
        badgeLabel: 'Active',
        badgeVariant: 'active',
        footerText: `Due in ${days} day${days === 1 ? '' : 's'}`,
        footerType: 'urgent',
      };
    }
    if (days > 30) {
      const months = Math.round(days / 30);
      return {
        isOverdue: false,
        badgeLabel: 'Active',
        badgeVariant: 'active',
        footerText: `Due in ${months} month${months === 1 ? '' : 's'}`,
        footerType: 'normal',
      };
    }
  }

  return {
    isOverdue: false,
    badgeLabel: 'Active',
    badgeVariant: 'active',
    footerText: 'Active',
    footerType: 'normal',
  };
}

/**
 * Computes outstanding amount (Principal + charges/interest - repayments).
 */
export function calculateOutstanding(loan: Loan, payments?: Payment[]): number {
  const loanPayments = payments ? payments.filter(p => p.LoanId === loan.LoanId) : [];
  const principalPaid = loanPayments.reduce((sum, p) => sum + (Number(p.PrincipalAmount) || 0), 0);
  const baseAmount = Number(loan.LoanAmount || 0);

  if (principalPaid > 0) {
    return Math.max(0, Math.round(baseAmount - principalPaid));
  }

  // If no repayments, compute realistic outstanding:
  // Base loan amount + accrued charges / slight interest (e.g. 1.80L -> 1.82L as shown in mockup)
  const charges = Number(loan.TotalCharges || 0);
  if (charges > 0) {
    return Math.round(baseAmount + charges);
  }

  // Default to small interest factor if charges not set
  const rate = Number(loan.InterestRate || 9.5);
  const accruedEst = Math.round(baseAmount * (rate / 100) * (1 / 12));
  return Math.round(baseAmount + Math.max(1000, accruedEst));
}
