import { BankAccount, Loan, Ornament, Payment, User } from '../types';

// Google Sheets returns numeric-looking cells (mobile, Aadhaar, account no.) as numbers and
// blank numeric cells as '', so coerce at the boundary to match the declared types.

const toStr = (v: unknown) => (v === null || v === undefined ? v : String(v));
const toNum = (v: unknown) => {
  if (v === null || v === undefined || v === '') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};

function coerce<T>(row: T, strings: string[], numbers: string[], optionalNumbers: string[] = []): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = { ...(row as any) };
  for (const k of strings) if (k in out) out[k] = toStr(out[k]);
  for (const k of numbers) if (k in out) out[k] = out[k] === '' || out[k] == null ? 0 : toNum(out[k]);
  for (const k of optionalNumbers) if (k in out) out[k] = out[k] === '' ? undefined : toNum(out[k]);
  return out;
}

export const normalizeUser = (u: User): User =>
  coerce(
    u,
    ['UserId', 'CustomerCode', 'FullName', 'FatherHusbandName', 'MobileNumber', 'AlternateMobileNumber', 'Email',
      'DateOfBirth', 'Gender', 'AadhaarNumber', 'PANNumber', 'AddressLine1', 'AddressLine2', 'City', 'State',
      'Pincode', 'Occupation', 'CustomerPhoto', 'Status', 'CreatedDate', 'UpdatedDate'],
    []
  );

export const normalizeBankAccount = (b: BankAccount): BankAccount =>
  coerce(
    b,
    ['BankAccountId', 'UserId', 'AccountHolderName', 'AccountNumber', 'BankName', 'BranchName', 'City', 'IFSCCode',
      'AccountType', 'UPI_ID', 'PassbookImage', 'Status', 'CreatedDate', 'UpdatedDate'],
    ['MaxLoanAmount', 'UtilizedLoanAmount'],
    ['AvailableLoanAmount']
  );

export const normalizeOrnament = (o: Ornament): Ornament =>
  coerce(
    o,
    ['OrnamentId', 'UserId', 'OrnamentName', 'OrnamentType', 'OrnamentCategory', 'Description', 'Purity',
      'HallmarkNumber', 'MakerName', 'OrnamentImages', 'Remarks', 'Status', 'ReleaseDate', 'ReleasedLoanId',
      'AssayCenter', 'YearOfMarking', 'LoanNumber'],
    ['GrossWeight', 'NetWeight', 'StoneWeight', 'Quantity', 'BuyingPricePerGram', 'CurrentPricePerGram',
      'BuyingCost', 'MarketValue'],
    ['MetalWeight', 'TotalPrice', 'AppreciationValue', 'AppreciationPercentage', 'EstimatedValue']
  );

export const normalizeLoan = (l: Loan): Loan =>
  coerce(
    l,
    ['LoanId', 'LoanNumber', 'UserId', 'BankAccountId', 'BankName', 'LoanDate', 'InterestType', 'LoanPeriod',
      'DueDate', 'LoanStatus', 'Remarks', 'CreatedDate', 'UpdatedDate', 'ClosedDate', 'ClosureRemarks'],
    ['LoanAmount', 'InterestRate', 'ProcessingFee', 'DocumentCharge', 'InsuranceCharge', 'TotalCharges',
      'NetDisbursementAmount'],
    ['GrossWeight', 'NetWeight']
  );

export const normalizePayment = (p: Payment): Payment =>
  coerce(
    p,
    ['PaymentId', 'LoanId', 'PaymentDate', 'PaymentType', 'PaymentMethod', 'TransactionReference', 'Remarks',
      'CreatedDate'],
    ['PrincipalAmount', 'InterestAmount', 'PenaltyAmount', 'TotalPaidAmount']
  );

const list = <T>(fn: (x: T) => T) => (rows: T[]) => rows.map(fn);
export const normalizeUsers = list(normalizeUser);
export const normalizeBankAccounts = list(normalizeBankAccount);
export const normalizeOrnaments = list(normalizeOrnament);
export const normalizeLoans = list(normalizeLoan);
export const normalizePayments = list(normalizePayment);
