import { User } from '../types';

export interface ExtraUserBankAccount {
  BankAccountId: string;
  UserId: string;
  BankName: string;
  AccountType: string;
  BranchName: string;
  AccountNumber: string;
  IFSCCode: string;
  AccountHolderName: string;
  UPI_ID: string;
  Status: 'Active' | 'Inactive';
  MaxLoanAmount: number;
  UtilizedLoanAmount: number;
  AvailableLoanAmount: number;
  UtilizationPercentage: number;
}

export interface ExtraUserLoan {
  LoanId: string;
  LoanNumber: string;
  LoanDate: string;
  DueDate: string;
  Status: 'Active' | 'Overdue' | 'Closed';
  LoanAmount: number;
  OutstandingAmount: number;
  DueBadgeText: string;
  DueBadgeType: 'normal' | 'urgent' | 'overdue';
  OrnamentsCount: number;
  TotalWeightGrams: number;
  InterestRateText: string;
  OrnamentImageUri?: string;
}

export const OCCUPATION_OPTIONS = [
  'Teacher',
  'Business',
  'IT Professional',
  'Doctor',
  'Advocate',
  'Engineer',
  'Government Employee',
  'Self Employed',
  'Farmer',
  'Homemaker',
  'Retired',
  'Other',
];

export const INDIAN_STATES = [
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Telangana',
  'Kerala',
  'Andhra Pradesh',
  'Delhi',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Goa',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
  'Other',
];

export const USER_SORT_OPTIONS = [
  'Newest First',
  'Oldest First',
  'Name (A-Z)',
  'Name (Z-A)',
  'Loans (High-Low)',
  'Weight (High-Low)',
];

/**
 * Derives the last active date for a customer card from real Users sheet
 * columns (UpdatedDate / CreatedDate). Returns '' when neither is set —
 * callers should hide the row rather than show a fabricated date.
 */
export function getUserLastActive(user: User): string {
  if (user.UpdatedDate) {
    const d = new Date(user.UpdatedDate);
    if (!isNaN(d.getTime())) {
      return `Last active: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }
  if (user.CreatedDate) {
    const d = new Date(user.CreatedDate);
    if (!isNaN(d.getTime())) {
      return `Last active: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }
  return '';
}

/**
 * Calculates human age string e.g. " (35 years)"
 */
export function calculateAge(dob?: string): string {
  if (!dob) return '';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? ` (${age} years)` : '';
}

/**
 * Formats Aadhaar as XXXX XXXX 1234. Returns '—' when the sheet cell is
 * empty — AadhaarNumber is a real column, so there's no real value to fake.
 */
export function formatMaskedAadhaar(aadhaar?: string | number): string {
  if (!aadhaar) return '—';
  const clean = String(aadhaar).replace(/\s+/g, '');
  if (clean.length >= 4) {
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
  return '—';
}

/**
 * Formats PAN e.g. ABCDE1234F. Returns '—' when the sheet cell is empty.
 */
export function formatMaskedPAN(pan?: string | number): string {
  if (!pan) return '—';
  return String(pan).toUpperCase();
}

/**
 * Formats phone with +91 prefix. Returns '—' when the sheet cell is empty.
 * Accepts a number too: numeric-looking cells (like a 10-digit mobile number)
 * often come back from the Google Sheets API as a JS number, not a string.
 */
export function formatPhoneNumber(phone?: string | number): string {
  if (!phone) return '—';
  const value = String(phone);
  const clean = value.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.length > 10 && clean.startsWith('91')) {
    const rest = clean.slice(2);
    return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  return value.startsWith('+91') ? value : `+91 ${value}`;
}

