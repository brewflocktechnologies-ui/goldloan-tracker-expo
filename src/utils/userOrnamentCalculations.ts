/**
 * All calculation / derivation logic for customers (users) and ornaments in one place:
 * counts, stats, valuation maths, date-of-birth helpers, search + sort, and the shaping of
 * raw sheet records into the figures the screens display. Pure functions only — no React,
 * no store, no I/O — so they are trivially unit-testable.
 */
import type { ExtraUserBankAccount, ExtraUserLoan } from '../mock/userMockExtras';
import type { BankAccount, Loan, Ornament, User } from '../types';
import { calculateAvailableLimit, calculateDueBadge, calculateOutstandingAmount, calculateUtilizationPercentage } from './calculations';

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

export interface UserStats {
  loanCount: number;
  goldWeight: number;
}

export type UserStatusFilter = 'All' | 'Active' | 'Inactive';

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

/** Default customer code for the next customer, e.g. 2 existing customers -> "CUST-103". */
export function generateCustomerCode(existingCount: number): string {
  return `CUST-${100 + existingCount + 1}`;
}

/** Numeric part of an id such as "U012" -> 12 (0 when there are no digits). */
export function idNumber(id?: string): number {
  return parseInt(String(id || '').replace(/\D/g, ''), 10) || 0;
}

/** Filters customers by status and a free-text query across the searchable columns. */
export function filterUsers(users: User[], query: string, statusFilter: UserStatusFilter): User[] {
  const q = query.trim().toLowerCase();
  return users.filter(u => {
    if (statusFilter !== 'All' && u.Status !== statusFilter) return false;
    if (!q) return true;

    const name = (u.FullName || '').toLowerCase();
    const id = (u.UserId || '').toLowerCase();
    const code = (u.CustomerCode || '').toLowerCase();
    const mobile = (u.MobileNumber || '').toLowerCase();
    const altMobile = (u.AlternateMobileNumber || '').toLowerCase();
    const email = (u.Email || '').toLowerCase();
    const aadhaar = (u.AadhaarNumber || '').toLowerCase();
    const pan = (u.PANNumber || '').toLowerCase();
    const city = (u.City || '').toLowerCase();
    const state = (u.State || '').toLowerCase();

    return (
      name.includes(q) ||
      id.includes(q) ||
      code.includes(q) ||
      mobile.includes(q) ||
      altMobile.includes(q) ||
      email.includes(q) ||
      aadhaar.includes(q) ||
      pan.includes(q) ||
      city.includes(q) ||
      state.includes(q)
    );
  });
}

/** Returns a sorted copy of the customers for one of the USER_SORT_OPTIONS. */
export function sortUsers(users: User[], sortOption: string, statsMap: Map<string, UserStats>): User[] {
  return [...users].sort((a, b) => {
    switch (sortOption) {
      case 'Oldest First':
        return idNumber(a.UserId) - idNumber(b.UserId);
      case 'Name (A-Z)':
        return (a.FullName || '').localeCompare(b.FullName || '');
      case 'Name (Z-A)':
        return (b.FullName || '').localeCompare(a.FullName || '');
      case 'Loans (High-Low)': {
        const lA = statsMap.get(a.UserId)?.loanCount || 0;
        const lB = statsMap.get(b.UserId)?.loanCount || 0;
        return lB - lA;
      }
      case 'Weight (High-Low)': {
        const wA = statsMap.get(a.UserId)?.goldWeight || 0;
        const wB = statsMap.get(b.UserId)?.goldWeight || 0;
        return wB - wA;
      }
      case 'Newest First':
      default:
        return idNumber(b.UserId) - idNumber(a.UserId);
    }
  });
}

/** Bank accounts of one customer, shaped for display — blank fields show '—', not a fake value. */
export function buildUserBankDisplay(
  bankAccounts: BankAccount[],
  user: Pick<User, 'UserId' | 'FullName'>
): ExtraUserBankAccount[] {
  return bankAccounts
    .filter(b => b.UserId === user.UserId)
    .map(b => ({
      BankAccountId: b.BankAccountId,
      UserId: b.UserId,
      BankName: b.BankName || '—',
      AccountType: b.AccountType || '—',
      BranchName: b.BranchName || '—',
      City: b.City || '',
      PassbookImage: b.PassbookImage || '',
      AccountNumber: b.AccountNumber || '—',
      IFSCCode: b.IFSCCode || '—',
      AccountHolderName: b.AccountHolderName || user.FullName,
      UPI_ID: b.UPI_ID || '—',
      Status: b.Status === 'Inactive' ? 'Inactive' : 'Active',
      MaxLoanAmount: b.MaxLoanAmount || 0,
      UtilizedLoanAmount: b.UtilizedLoanAmount || 0,
      AvailableLoanAmount: calculateAvailableLimit(b),
      UtilizationPercentage: calculateUtilizationPercentage(b),
    }));
}

/**
 * Loans of one customer, shaped for display. DueBadgeText is computed from the real DueDate;
 * OutstandingAmount has no backing sheet field yet so it is still derived (flagged "(mock)" in the UI).
 */
export function buildUserLoanDisplay(
  loans: Loan[],
  ornaments: Ornament[],
  userId: string
): ExtraUserLoan[] {
  return loans
    .filter(l => l.UserId === userId)
    .map(l => {
      const loanOrns = ornaments.filter(o => (l.ornamentIds || []).includes(o.OrnamentId));
      let firstPhoto = loanOrns.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
      if (!firstPhoto && ornaments.length > 0) {
        firstPhoto = ornaments.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
      }
      const ornCount = (l.ornamentIds || []).length || loanOrns.length;
      const isOverdue = l.LoanStatus === 'Overdue';
      const dueBadge = calculateDueBadge(l.DueDate, l.LoanStatus);
      const totalWeight =
        l.NetWeight || l.GrossWeight || loanOrns.reduce((sum, o) => sum + (o.NetWeight || o.GrossWeight || 0), 0);

      return {
        LoanId: l.LoanId,
        LoanNumber: l.LoanNumber || `LN-${l.LoanId}`,
        LoanDate: l.LoanDate || '—',
        DueDate: l.DueDate || '—',
        Status: isOverdue ? 'Overdue' : l.LoanStatus === 'Closed' ? 'Closed' : 'Active',
        LoanAmount: l.LoanAmount || 0,
        OutstandingAmount: calculateOutstandingAmount(l),
        DueBadgeText: dueBadge.text,
        DueBadgeType: dueBadge.type,
        OrnamentsCount: ornCount,
        TotalWeightGrams: totalWeight,
        InterestRateText: `${l.InterestRate || 0}% p.a.`,
        InterestType: l.InterestType || 'Simple',
        OrnamentImageUri: firstPhoto,
      };
    });
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

/**
 * Safely parses any date string (ISO, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, or timestamp)
 * extracting calendar day, month, and year independent of timezone shifts.
 */
export function parseDateString(dateStr?: string): { day: number; month: number; year: number } | null {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '' || dateStr === '—') {
    return null;
  }
  const clean = dateStr.trim();

  // 1. DD/MM/YYYY or DD-MM-YYYY (e.g. 14/03/1990 or 14-03-1990)
  const ddmmyyyy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10);
    const year = parseInt(ddmmyyyy[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
      return { day, month, year };
    }
  }

  // 2. YYYY-MM-DD (e.g. 1990-03-14 or 1990-03-14T00:00:00.000Z)
  // Extract calendar numbers directly from the date prefix to prevent timezone shifting
  const yyyymmdd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10);
    const day = parseInt(yyyymmdd[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
      return { day, month, year };
    }
  }

  // 3. Fallback: JS Date parse (e.g. "Wed Mar 14 1990 ...")
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  }

  return null;
}

/** Formats a date string cleanly as e.g. "14 Mar 1990", stripping any timezone/time. */
export function formatDisplayDOB(dateStr?: string): string {
  const parsed = parseDateString(dateStr);
  if (!parsed) {
    // Strip any timezone / time part if it couldn't be parsed
    return (dateStr || '—').split('T')[0].split(' ')[0] || '—';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parsed.day} ${months[parsed.month - 1]} ${parsed.year}`;
}

/** Formats date into DD/MM/YYYY for input editing fields, removing time/timezone */
export function formatInputDOB(dateStr?: string): string {
  const parsed = parseDateString(dateStr);
  if (!parsed) return dateStr || '';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year}`;
}

/** Human age string e.g. " (35 years)"; '' for a missing or invalid date. */
export function calculateAge(dob?: string): string {
  const parsed = parseDateString(dob);
  if (!parsed) return '';
  const today = new Date();
  let age = today.getFullYear() - parsed.year;
  const m = today.getMonth() + 1 - parsed.month;
  if (m < 0 || (m === 0 && today.getDate() < parsed.day)) age--;
  return age > 0 ? ` (${age} years)` : '';
}

// ═══════════════════════════════════════════════════════════
// ORNAMENTS
// ═══════════════════════════════════════════════════════════

export type OrnamentStatusFilter = 'All' | 'Available' | 'Pledged';

export interface OrnamentValuation {
  net: number;
  totalBuyingValue: number;
  currentGoldValueLive: number;
  marketValue: number;
  appreciation: number;
  appreciationPct: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Wizard valuation preview. Market value trends above the live 22K rate; the 1.0677 multiplier
 * and the 205000/29.31 fallbacks reproduce the figures used across the ornament forms and detail
 * screens when a live rate isn't available yet.
 */
export function calculateOrnamentValuation(
  grossWeight: number,
  stoneWeight: number,
  buyingPricePerGram: number,
  liveRate22k: number
): OrnamentValuation {
  const net = Math.max(0, grossWeight - stoneWeight);
  const totalBuyingValue = Math.round(net * buyingPricePerGram);
  const currentGoldValueLive = Math.round(net * liveRate22k);
  const marketValue = Math.round(net * (liveRate22k > 0 ? liveRate22k * 1.0677 : 205000));
  const appreciation = marketValue - totalBuyingValue;
  const appreciationPct = totalBuyingValue > 0 ? (appreciation / totalBuyingValue) * 100 : 29.31;

  return { net, totalBuyingValue, currentGoldValueLive, marketValue, appreciation, appreciationPct };
}

export interface OrnamentFigures {
  gross: number;
  stone: number;
  metal: number;
  net: number;
  buyingPrice: number;
  currentPrice: number;
  buyingCost: number;
  marketValue: number;
  appreciationValue: number;
  appreciationPercentage: number;
}

/**
 * Stored figures for an ornament record: net weight (explicit metal weight, else gross − stone,
 * never below 0), buying cost, market value and appreciation, money rounded to 2 decimals.
 * Used when an ornament is added or updated in the store.
 */
export function calculateOrnamentFigures(
  input: Partial<Pick<Ornament, 'GrossWeight' | 'StoneWeight' | 'MetalWeight' | 'BuyingPricePerGram' | 'CurrentPricePerGram'>>
): OrnamentFigures {
  const gross = Number(input.GrossWeight) || 0;
  const stone = Number(input.StoneWeight) || 0;
  const metal =
    input.MetalWeight !== undefined && input.MetalWeight !== null
      ? Number(input.MetalWeight)
      : Math.max(0, gross - stone);
  const net = metal;
  const buyingPrice = Number(input.BuyingPricePerGram) || 0;
  const currentPrice = Number(input.CurrentPricePerGram) || 0;
  const buyingCost = round2(net * buyingPrice);
  const marketValue = round2(net * currentPrice);
  const appreciationValue = round2(marketValue - buyingCost);
  const appreciationPercentage = buyingCost > 0 ? round2((appreciationValue / buyingCost) * 100) : 0;

  return {
    gross, stone, metal, net, buyingPrice, currentPrice,
    buyingCost, marketValue, appreciationValue, appreciationPercentage,
  };
}

/** Counts ornaments with the given status. */
export function countOrnamentsByStatus(ornaments: Ornament[], status: Ornament['Status']): number {
  return ornaments.filter(o => o.Status === status).length;
}

/** Filters ornaments by status and a free-text query across the searchable columns. */
export function filterOrnaments(ornaments: Ornament[], query: string, statusFilter: OrnamentStatusFilter): Ornament[] {
  const q = query.trim().toLowerCase();
  return ornaments.filter(o => {
    if (statusFilter !== 'All' && o.Status !== statusFilter) return false;
    if (!q) return true;
    const name = (o.OrnamentName || '').toLowerCase();
    const id = (o.OrnamentId || '').toLowerCase();
    const type = (o.OrnamentType || '').toLowerCase();
    const category = (o.OrnamentCategory || '').toLowerCase();
    const hallmark = (o.HallmarkNumber || '').toLowerCase();
    const maker = (o.MakerName || '').toLowerCase();
    const purity = (o.Purity || '').toLowerCase();
    const loan = (o.LoanNumber || '').toLowerCase();

    return (
      name.includes(q) ||
      id.includes(q) ||
      type.includes(q) ||
      category.includes(q) ||
      hallmark.includes(q) ||
      maker.includes(q) ||
      purity.includes(q) ||
      loan.includes(q)
    );
  });
}

/** Returns a sorted copy of the ornaments for one of the ornament sort options. */
export function sortOrnaments(ornaments: Ornament[], sortOption: string): Ornament[] {
  return [...ornaments].sort((a, b) => {
    switch (sortOption) {
      case 'Oldest First':
        return idNumber(a.OrnamentId) - idNumber(b.OrnamentId);
      case 'Name (A-Z)':
        return (a.OrnamentName || '').localeCompare(b.OrnamentName || '');
      case 'Name (Z-A)':
        return (b.OrnamentName || '').localeCompare(a.OrnamentName || '');
      case 'Weight (High-Low)':
        return (b.GrossWeight || 0) - (a.GrossWeight || 0);
      case 'Weight (Low-High)':
        return (a.GrossWeight || 0) - (b.GrossWeight || 0);
      case 'Newest First':
      default:
        return idNumber(b.OrnamentId) - idNumber(a.OrnamentId);
    }
  });
}

/** The loan number an ornament is pledged under: its own, else the loan that lists it, else a placeholder when pledged. */
export function getOrnamentLoanNumber(orn: Ornament, loans: Loan[]): string | null {
  if (orn.LoanNumber) return orn.LoanNumber;
  const loan = loans.find(l => l.ornamentIds?.includes(orn.OrnamentId));
  if (loan) return loan.LoanNumber;
  if (orn.Status === 'Pledged') return 'LN-2024-001';
  return null;
}

/** Weight and price text shown on an ornament list card ('-' when unknown). */
export function getOrnamentCardFigures(orn: Ornament): { weightVal: string; priceVal: string } {
  const weight = Number(orn.NetWeight || orn.MetalWeight || orn.GrossWeight || 0);
  const price = Number(orn.TotalPrice || orn.BuyingCost || orn.MarketValue || 0);
  return {
    weightVal: weight > 0 ? weight.toFixed(3) : '-',
    priceVal: price > 0 ? price.toLocaleString('en-IN') : '-',
  };
}

/** Weights (3 dp text) and valuation figures shown on the ornament details page. */
export function getOrnamentDetailFigures(orn: Ornament, liveRate22k: number) {
  const netWt = Number(orn.NetWeight || orn.MetalWeight || 0).toFixed(3);
  const grossWt = Number(orn.GrossWeight || 0).toFixed(3);
  const stoneWt = Number(orn.StoneWeight || 0).toFixed(3);
  const metalWt = Number(orn.MetalWeight || orn.NetWeight || 0).toFixed(3);
  const buyPrice = orn.BuyingPricePerGram || null;
  const buyTotal = orn.BuyingCost || (buyPrice && parseFloat(netWt) > 0 ? parseFloat(netWt) * buyPrice : null);
  const estVal = orn.EstimatedValue || null;
  const mktVal = orn.MarketValue || null;
  const liveVal = parseFloat(netWt) > 0 ? Math.round(parseFloat(netWt) * liveRate22k) : null;
  const apprVal = orn.AppreciationValue || (buyTotal && mktVal ? mktVal - buyTotal : null);
  const apprPct = orn.AppreciationPercentage || (buyTotal && apprVal ? (apprVal / buyTotal) * 100 : null);

  return { netWt, grossWt, stoneWt, metalWt, buyPrice, buyTotal, estVal, mktVal, liveVal, apprVal, apprPct };
}
