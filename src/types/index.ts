// Data models for the Goldora application

export interface User {
  UserId: string;
  CustomerCode?: string;
  FullName: string;
  FatherHusbandName?: string;
  MobileNumber: string;
  AlternateMobileNumber?: string;
  Email?: string;
  DateOfBirth?: string;
  Gender?: string;
  AadhaarNumber?: string;
  PANNumber?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  State?: string;
  Pincode?: string;
  Occupation?: string;
  CustomerPhoto?: string;
  Status: "Active" | "Inactive" | "Deleted";
  CreatedDate?: string;
  UpdatedDate?: string;
}

export interface BankAccount {
  BankAccountId: string;
  UserId: string;
  AccountHolderName: string;
  AccountNumber: string;
  BankName: string;
  BranchName?: string;
  City?: string;
  IFSCCode?: string;
  AccountType?: string;
  UPI_ID?: string;
  PassbookImage?: string;
  Status: "Active" | "Inactive" | "Deleted";
  CreatedDate?: string;
  UpdatedDate?: string;
  MaxLoanAmount: number;
  UtilizedLoanAmount: number;
  AvailableLoanAmount?: number;
}

export interface Ornament {
  OrnamentId: string;
  UserId?: string;
  OrnamentName: string;
  OrnamentType?: string;
  OrnamentCategory?: string;
  Description?: string;
  GrossWeight: number;
  NetWeight: number;
  MetalWeight?: number;
  StoneWeight: number;
  Purity: string; // "24K" | "22K" | "18K"
  HallmarkNumber?: string;
  Quantity: number;
  BuyingPricePerGram: number;
  CurrentPricePerGram: number;
  BuyingCost: number;
  TotalPrice?: number;
  MarketValue: number;
  AppreciationValue?: number;
  AppreciationPercentage?: number;
  MakerName?: string;
  EstimatedValue?: number;
  OrnamentImages?: string; // separated by " | "
  Remarks?: string;
  Status: "Available" | "Pledged" | "Released" | "Deleted";
  ReleaseDate?: string;
  ReleasedLoanId?: string;
}

export interface Loan {
  LoanId: string;
  LoanNumber: string;
  UserId: string;
  BankAccountId: string;
  BankName: string;
  LoanDate: string;
  LoanAmount: number;
  InterestRate: number;
  InterestType: "Simple" | "Compound";
  LoanPeriod: string; // e.g. "6 Months", "12 Months"
  GrossWeight?: number;
  NetWeight?: number;
  ProcessingFee: number;
  DocumentCharge: number;
  InsuranceCharge: number;
  TotalCharges: number;
  NetDisbursementAmount: number;
  DueDate: string;
  LoanStatus: "Active" | "Closed" | "Overdue" | "Cancelled";
  Remarks?: string;
  CreatedDate?: string;
  UpdatedDate?: string;
  ClosedDate?: string;
  ClosureRemarks?: string;
  ornamentIds?: string[];
}

export interface Payment {
  PaymentId: string;
  LoanId: string;
  PaymentDate: string;
  PaymentType: "Interest" | "Principal" | "Full_Settlement" | "Part_Payment";
  PrincipalAmount: number;
  InterestAmount: number;
  PenaltyAmount: number;
  TotalPaidAmount: number;
  PaymentMethod: "UPI" | "Net Banking" | "Cash" | "Cheque";
  TransactionReference?: string;
  Remarks?: string;
  CreatedDate?: string;
}

export interface DashboardData {
  totalUsers: number;
  totalBankAccounts: number;
  totalOrnaments: number;
  pledgedOrnamentsCount: number;
  pledgedGrams: number;
  activeLoans: number;
  closedLoans: number;
  totalLoanAmount: number;
  totalEligibleLoanAmount: number;
  totalAvailableLoanAmount: number;
  totalGoldWeight: number;
  totalBuyingGoldValue: number;
  recentTransactions: Payment[];
}

export interface GoldRateItem {
  rate1g: number;
  numericPrice?: number;
  price?: string;
  change: number;
  changeStr?: string;
  direction: "up" | "down" | "flat";
  formattedBadge?: string;
}

export interface GoldRateData {
  location: string;
  updatedAt: string;
  displayDate: string;
  gold24k: GoldRateItem;
  gold22k: GoldRateItem;
  gold18k: GoldRateItem;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isCached?: boolean;
  isFallback?: boolean;
}

export interface InitialSyncData {
  users: User[];
  bankAccounts: BankAccount[];
  ornaments: Ornament[];
  loans: Loan[];
  payments: Payment[];
  goldRates: GoldRateData | null;
  adminUsers?: AdminUser[];
  timestamp?: string;
}

export type UserRole = 'SuperAdmin' | 'User';

export interface AdminUser {
  AdminId: string;
  Username: string;
  Role: UserRole;
  Status: 'Active' | 'Inactive' | 'Deleted';
}

export interface AuthSession {
  username: string;
  role: UserRole;
  token: string;
}

