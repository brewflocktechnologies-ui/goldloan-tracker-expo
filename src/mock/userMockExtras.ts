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
 * Derives or mocks last active date for customer card
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

  // Consistent mock fallback based on user id hash
  const daysAgo = (Math.abs(hashString(user.UserId || user.FullName || '1')) % 14) + 1;
  const mockDate = new Date(2025, 8, Math.max(1, 15 - daysAgo));
  return `Last active: ${mockDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
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
 * Formats Aadhaar as XXXX XXXX 1234
 */
export function formatMaskedAadhaar(aadhaar?: string | number): string {
  if (!aadhaar) return 'XXXX XXXX 1234';
  const clean = String(aadhaar).replace(/\s+/g, '');
  if (clean.length >= 4) {
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
  return 'XXXX XXXX 1234';
}

/**
 * Formats PAN e.g. ABCDE1234F
 */
export function formatMaskedPAN(pan?: string | number): string {
  if (!pan) return 'ABCDE1234F';
  return String(pan).toUpperCase();
}

/**
 * Formats phone with +91 prefix.
 * Accepts a number too: numeric-looking cells (like a 10-digit mobile number)
 * often come back from the Google Sheets API as a JS number, not a string.
 */
export function formatPhoneNumber(phone?: string | number): string {
  if (!phone) return '+91 98765 43210';
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

/**
 * Mock Bank Accounts fallback matching the Users Screen.pdf blueprint
 * If the user has bank accounts in Google Sheets, those will be preferred.
 */
export function getMockUserBankAccounts(userId: string, userName?: string): ExtraUserBankAccount[] {
  const cleanName = userName || 'Priya Sharma';
  const slug = cleanName.toLowerCase().replace(/[^a-z]/g, '.');

  return [
    {
      BankAccountId: `BA-${userId}-01`,
      UserId: userId,
      BankName: 'State Bank of India',
      AccountType: 'Savings Account',
      BranchName: 'Main Branch, Bengaluru',
      AccountNumber: 'XXXX XXXX 1234',
      IFSCCode: 'SBIN0001234',
      AccountHolderName: cleanName,
      UPI_ID: `${slug}@sbi`,
      Status: 'Active',
      MaxLoanAmount: 500000,
      UtilizedLoanAmount: 250000,
      AvailableLoanAmount: 250000,
      UtilizationPercentage: 50,
    },
    {
      BankAccountId: `BA-${userId}-02`,
      UserId: userId,
      BankName: 'HDFC Bank',
      AccountType: 'Current Account',
      BranchName: 'Indiranagar, Bengaluru',
      AccountNumber: 'XXXX XXXX 5678',
      IFSCCode: 'HDFC0004321',
      AccountHolderName: cleanName,
      UPI_ID: `${slug}@hdfcbank`,
      Status: 'Active',
      MaxLoanAmount: 300000,
      UtilizedLoanAmount: 120000,
      AvailableLoanAmount: 180000,
      UtilizationPercentage: 40,
    },
  ];
}

/**
 * Mock Loans fallback matching the Users Screen.pdf blueprint
 * If the user has loans in Google Sheets, those will be preferred.
 */
export function getMockUserLoans(userId: string): ExtraUserLoan[] {
  return [
    {
      LoanId: `L-${userId}-01`,
      LoanNumber: 'LN 2024 001',
      LoanDate: '10 Jan 2024',
      DueDate: '10 Jul 2024',
      Status: 'Active',
      LoanAmount: 200000,
      OutstandingAmount: 120000,
      DueBadgeText: '12 days left',
      DueBadgeType: 'normal',
      OrnamentsCount: 3,
      TotalWeightGrams: 48.200,
      InterestRateText: '12% p.a. (Simple)',
    },
    {
      LoanId: `L-${userId}-02`,
      LoanNumber: 'LN 2024 002',
      LoanDate: '15 Feb 2024',
      DueDate: '15 May 2024',
      Status: 'Overdue',
      LoanAmount: 150000,
      OutstandingAmount: 90000,
      DueBadgeText: '18 days overdue',
      DueBadgeType: 'overdue',
      OrnamentsCount: 2,
      TotalWeightGrams: 32.600,
      InterestRateText: '14% p.a. (Simple)',
    },
  ];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
