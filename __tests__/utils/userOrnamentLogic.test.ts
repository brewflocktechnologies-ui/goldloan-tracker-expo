import {
  buildUserBankDisplay,
  buildUserLoanDisplay,
  calculateOrnamentFigures,
  countOrnamentsByStatus,
  filterOrnaments,
  filterUsers,
  generateCustomerCode,
  getOrnamentCardFigures,
  getOrnamentDetailFigures,
  getOrnamentLoanNumber,
  idNumber,
  sortOrnaments,
  sortUsers,
} from '../../src/utils/userOrnamentCalculations';

describe('generateCustomerCode / idNumber', () => {
  it('builds the next customer code from the current count', () => {
    expect(generateCustomerCode(0)).toBe('CUST-101');
    expect(generateCustomerCode(2)).toBe('CUST-103');
    expect(generateCustomerCode(99)).toBe('CUST-200');
  });
  it('extracts the numeric part of ids', () => {
    expect(idNumber('U012')).toBe(12);
    expect(idNumber('ORN7')).toBe(7);
    expect(idNumber('none')).toBe(0);
    expect(idNumber(undefined)).toBe(0);
  });
});

const U: any[] = [
  { UserId: 'U001', FullName: 'Ravi Kumar', CustomerCode: 'CUST-101', MobileNumber: '9876543210', City: 'Bengaluru', State: 'Karnataka', Email: 'ravi@x.com', PANNumber: 'ABCDE1234F', Status: 'Active' },
  { UserId: 'U002', FullName: 'Anita Sharma', CustomerCode: 'CUST-102', MobileNumber: '9000000002', AlternateMobileNumber: '9111111111', AadhaarNumber: '123456789012', City: 'Mysuru', State: 'Karnataka', Status: 'Inactive' },
  { UserId: 'U010', FullName: 'Zoya Khan', CustomerCode: 'CUST-103', MobileNumber: '9000000003', City: 'Chennai', State: 'Tamil Nadu', Status: 'Active' },
];

describe('filterUsers', () => {
  it('returns everyone with no query and All status', () => {
    expect(filterUsers(U, '', 'All')).toHaveLength(3);
    expect(filterUsers(U, '   ', 'All')).toHaveLength(3);
  });
  it('filters by status', () => {
    expect(filterUsers(U, '', 'Inactive').map(u => u.UserId)).toEqual(['U002']);
    expect(filterUsers(U, '', 'Active')).toHaveLength(2);
  });
  it.each([
    ['name', 'zoya', 'U010'],
    ['user id', 'u002', 'U002'],
    ['customer code', 'cust-101', 'U001'],
    ['mobile', '9000000003', 'U010'],
    ['alternate mobile', '9111111111', 'U002'],
    ['email', 'ravi@x', 'U001'],
    ['aadhaar', '1234567', 'U002'],
    ['PAN', 'abcde', 'U001'],
    ['city', 'mysuru', 'U002'],
    ['state', 'tamil', 'U010'],
  ])('matches on %s', (_label, query, expectedId) => {
    expect(filterUsers(U, query, 'All').map(u => u.UserId)).toEqual([expectedId]);
  });
  it('combines status and query', () => {
    expect(filterUsers(U, 'karnataka', 'Active').map(u => u.UserId)).toEqual(['U001']);
  });
  it('returns nothing when nothing matches', () => {
    expect(filterUsers(U, 'zzz', 'All')).toEqual([]);
  });
});

describe('sortUsers', () => {
  const stats = new Map([
    ['U001', { loanCount: 1, goldWeight: 5 }],
    ['U002', { loanCount: 3, goldWeight: 1 }],
    ['U010', { loanCount: 2, goldWeight: 9 }],
  ]);
  const ids = (opt: string) => sortUsers(U, opt, stats).map(u => u.UserId);

  it('sorts newest / oldest by numeric id', () => {
    expect(ids('Newest First')).toEqual(['U010', 'U002', 'U001']);
    expect(ids('Oldest First')).toEqual(['U001', 'U002', 'U010']);
  });
  it('sorts by name', () => {
    expect(ids('Name (A-Z)')).toEqual(['U002', 'U001', 'U010']);
    expect(ids('Name (Z-A)')).toEqual(['U010', 'U001', 'U002']);
  });
  it('sorts by loans and weight, highest first', () => {
    expect(ids('Loans (High-Low)')).toEqual(['U002', 'U010', 'U001']);
    expect(ids('Weight (High-Low)')).toEqual(['U010', 'U001', 'U002']);
  });
  it('defaults to newest first and does not mutate the input', () => {
    const copy = [...U];
    expect(ids('Unknown option')).toEqual(['U010', 'U002', 'U001']);
    expect(U).toEqual(copy);
  });
});

describe('buildUserBankDisplay', () => {
  const banks: any[] = [
    { BankAccountId: 'B1', UserId: 'U001', BankName: 'SBI', AccountNumber: '1111', AccountHolderName: 'R K', Status: 'Active', MaxLoanAmount: 100000, UtilizedLoanAmount: 25000 },
    { BankAccountId: 'B2', UserId: 'U001', Status: 'Inactive', MaxLoanAmount: 0, UtilizedLoanAmount: 0 },
    { BankAccountId: 'B3', UserId: 'U002', BankName: 'HDFC' },
  ];
  it('keeps only the customer accounts and computes limits', () => {
    const out = buildUserBankDisplay(banks, { UserId: 'U001', FullName: 'Ravi Kumar' });
    expect(out.map(b => b.BankAccountId)).toEqual(['B1', 'B2']);
    expect(out[0]).toMatchObject({ BankName: 'SBI', AvailableLoanAmount: 75000, UtilizationPercentage: 25, AccountHolderName: 'R K' });
  });
  it('shows a dash for blank fields and falls back to the customer name as holder', () => {
    const out = buildUserBankDisplay(banks, { UserId: 'U001', FullName: 'Ravi Kumar' });
    expect(out[1]).toMatchObject({
      BankName: '—', AccountType: '—', BranchName: '—', AccountNumber: '—', IFSCCode: '—', UPI_ID: '—',
      AccountHolderName: 'Ravi Kumar', Status: 'Inactive', UtilizationPercentage: 0, AvailableLoanAmount: 0,
    });
  });
});

describe('buildUserLoanDisplay', () => {
  const orns: any[] = [
    { OrnamentId: 'O1', UserId: 'U001', OrnamentImages: ' a.jpg | b.jpg', GrossWeight: 5, NetWeight: 4 },
    { OrnamentId: 'O2', UserId: 'U009', OrnamentImages: 'other.jpg', NetWeight: 3 },
  ];
  const loans: any[] = [
    { LoanId: 'L1', UserId: 'U001', LoanNumber: 'LN-1', LoanAmount: 50000, LoanStatus: 'Overdue', DueDate: '2020-01-01', ornamentIds: ['O1'], InterestRate: 12, InterestType: 'Compound' },
    { LoanId: 'L2', UserId: 'U001', LoanAmount: 1000, LoanStatus: 'Closed', ornamentIds: [], NetWeight: 7 },
    { LoanId: 'L3', UserId: 'U001', LoanAmount: 2000, LoanStatus: 'Active', ornamentIds: ['MISSING'] },
    { LoanId: 'L4', UserId: 'U002', LoanAmount: 9 },
  ];

  it('only includes the customer loans and maps statuses', () => {
    const out = buildUserLoanDisplay(loans, orns, 'U001');
    expect(out.map(l => [l.LoanId, l.Status])).toEqual([['L1', 'Overdue'], ['L2', 'Closed'], ['L3', 'Active']]);
  });
  it('fills defaults, derived figures and the ornament photo', () => {
    const [l1, l2] = buildUserLoanDisplay(loans, orns, 'U001');
    expect(l1).toMatchObject({
      LoanNumber: 'LN-1', InterestRateText: '12% p.a.', InterestType: 'Compound', OrnamentsCount: 1,
      TotalWeightGrams: 4, OutstandingAmount: 30000, OrnamentImageUri: 'a.jpg', DueBadgeType: 'overdue',
    });
    expect(l2).toMatchObject({ LoanNumber: 'LN-L2', LoanDate: '—', DueDate: '—', InterestType: 'Simple', InterestRateText: '0% p.a.', TotalWeightGrams: 7, DueBadgeText: '—' });
  });
  it('falls back to the first available ornament photo, or empty when there are none', () => {
    const [, l2] = buildUserLoanDisplay(loans, orns, 'U001');
    expect(l2.OrnamentImageUri).toBe('a.jpg');
    expect(buildUserLoanDisplay([loans[3]], [], 'U002')[0].OrnamentImageUri).toBe('');
  });
});

describe('calculateOrnamentFigures', () => {
  it('derives net, cost, market value and appreciation', () => {
    expect(calculateOrnamentFigures({ GrossWeight: 20, StoneWeight: 2, BuyingPricePerGram: 5000, CurrentPricePerGram: 5500 })).toEqual({
      gross: 20, stone: 2, metal: 18, net: 18, buyingPrice: 5000, currentPrice: 5500,
      buyingCost: 90000, marketValue: 99000, appreciationValue: 9000, appreciationPercentage: 10,
    });
  });
  it('prefers an explicit metal weight (including 0)', () => {
    expect(calculateOrnamentFigures({ GrossWeight: 20, StoneWeight: 2, MetalWeight: 15 }).net).toBe(15);
    expect(calculateOrnamentFigures({ GrossWeight: 20, MetalWeight: 0 }).net).toBe(0);
  });
  it('clamps negative net to 0, tolerates empty input and gives 0% when there is no cost', () => {
    expect(calculateOrnamentFigures({ GrossWeight: 1, StoneWeight: 5 }).net).toBe(0);
    expect(calculateOrnamentFigures({})).toMatchObject({ gross: 0, net: 0, buyingCost: 0, appreciationPercentage: 0 });
    expect(calculateOrnamentFigures({ GrossWeight: 10, CurrentPricePerGram: 5 }).appreciationPercentage).toBe(0);
  });
  it('coerces numeric strings and rounds money to 2 decimals', () => {
    const f = calculateOrnamentFigures({ GrossWeight: '3.333' as any, BuyingPricePerGram: '5555.55' as any });
    expect(f.gross).toBe(3.333);
    expect(f.buyingCost).toBe(18516.65);
  });
});

const O: any[] = [
  { OrnamentId: 'ORN001', OrnamentName: 'Gold Necklace', OrnamentType: 'Traditional', OrnamentCategory: 'Necklace', HallmarkNumber: 'HM-1', MakerName: 'Kalyan', Purity: '22K', GrossWeight: 20, Status: 'Available' },
  { OrnamentId: 'ORN002', OrnamentName: 'Bridal Bangles', OrnamentType: 'Bridal', LoanNumber: 'LN-1001', GrossWeight: 30, Status: 'Pledged' },
  { OrnamentId: 'ORN010', OrnamentName: 'Antique Ring', GrossWeight: 5, Status: 'Available' },
];

describe('countOrnamentsByStatus / filterOrnaments / sortOrnaments', () => {
  it('counts by status', () => {
    expect(countOrnamentsByStatus(O, 'Available')).toBe(2);
    expect(countOrnamentsByStatus(O, 'Pledged')).toBe(1);
  });
  it('filters by status', () => {
    expect(filterOrnaments(O, '', 'Pledged').map(o => o.OrnamentId)).toEqual(['ORN002']);
    expect(filterOrnaments(O, '', 'All')).toHaveLength(3);
  });
  it.each([
    ['name', 'bangles', 'ORN002'],
    ['id', 'orn010', 'ORN010'],
    ['type', 'traditional', 'ORN001'],
    ['category', 'necklace', 'ORN001'],
    ['hallmark', 'hm-1', 'ORN001'],
    ['maker', 'kalyan', 'ORN001'],
    ['purity', '22k', 'ORN001'],
    ['loan number', 'ln-1001', 'ORN002'],
  ])('matches on %s', (_l, q, id) => {
    expect(filterOrnaments(O, q, 'All').map(o => o.OrnamentId)).toEqual([id]);
  });
  it('sorts by id, name and weight without mutating the input', () => {
    const copy = [...O];
    const ids = (opt: string) => sortOrnaments(O, opt).map(o => o.OrnamentId);
    expect(ids('Newest First')).toEqual(['ORN010', 'ORN002', 'ORN001']);
    expect(ids('Oldest First')).toEqual(['ORN001', 'ORN002', 'ORN010']);
    expect(ids('Name (A-Z)')).toEqual(['ORN010', 'ORN002', 'ORN001']);
    expect(ids('Name (Z-A)')).toEqual(['ORN001', 'ORN002', 'ORN010']);
    expect(ids('Weight (High-Low)')).toEqual(['ORN002', 'ORN001', 'ORN010']);
    expect(ids('Weight (Low-High)')).toEqual(['ORN010', 'ORN001', 'ORN002']);
    expect(O).toEqual(copy);
  });
});

describe('getOrnamentLoanNumber', () => {
  const loans: any[] = [{ LoanNumber: 'LN-9', ornamentIds: ['ORN010'] }];
  it('prefers the ornament own loan number', () => {
    expect(getOrnamentLoanNumber(O[1], loans)).toBe('LN-1001');
  });
  it('falls back to the loan that lists the ornament', () => {
    expect(getOrnamentLoanNumber(O[2], loans)).toBe('LN-9');
  });
  it('uses a placeholder for pledged ornaments with no loan, else null', () => {
    expect(getOrnamentLoanNumber({ OrnamentId: 'X', Status: 'Pledged' } as any, [])).toBe('LN-2024-001');
    expect(getOrnamentLoanNumber({ OrnamentId: 'X', Status: 'Available' } as any, [])).toBeNull();
  });
});

describe('getOrnamentCardFigures', () => {
  it('formats weight to 3 dp and price in Indian grouping', () => {
    expect(getOrnamentCardFigures({ NetWeight: 18, TotalPrice: 1234567 } as any)).toEqual({ weightVal: '18.000', priceVal: '12,34,567' });
  });
  it('falls back through the alternative fields, then to a dash', () => {
    expect(getOrnamentCardFigures({ GrossWeight: 5, MarketValue: 900 } as any)).toEqual({ weightVal: '5.000', priceVal: '900' });
    expect(getOrnamentCardFigures({} as any)).toEqual({ weightVal: '-', priceVal: '-' });
  });
});

describe('getOrnamentDetailFigures', () => {
  it('reports weights and stored valuation figures', () => {
    const f = getOrnamentDetailFigures(
      { NetWeight: 22, MetalWeight: 22, GrossWeight: 25, StoneWeight: 3, BuyingPricePerGram: 5000, BuyingCost: 110000, EstimatedValue: 121000, MarketValue: 123200, AppreciationValue: 13200, AppreciationPercentage: 12 } as any,
      5600
    );
    expect(f).toMatchObject({
      netWt: '22.000', grossWt: '25.000', stoneWt: '3.000', metalWt: '22.000', buyPrice: 5000,
      buyTotal: 110000, estVal: 121000, mktVal: 123200, liveVal: 123200, apprVal: 13200, apprPct: 12,
    });
  });
  it('derives missing totals and appreciation from what is available', () => {
    const f = getOrnamentDetailFigures({ NetWeight: 10, BuyingPricePerGram: 5000, MarketValue: 60000 } as any, 0);
    expect(f.buyTotal).toBe(50000);
    expect(f.apprVal).toBe(10000);
    expect(f.apprPct).toBe(20);
    expect(f.liveVal).toBe(0);
  });
  it('returns nulls when there is nothing to compute from', () => {
    const f = getOrnamentDetailFigures({} as any, 5500);
    expect(f).toMatchObject({ netWt: '0.000', buyPrice: null, buyTotal: null, estVal: null, mktVal: null, liveVal: null, apprVal: null, apprPct: null });
  });
});
