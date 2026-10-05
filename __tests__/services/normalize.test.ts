import { normalizeBankAccount, normalizeLoan, normalizeUser } from '../../src/services/normalize';

describe('normalize', () => {
  it('stringifies numeric-looking user fields from Sheets', () => {
    const u: any = normalizeUser({ UserId: 'U1', MobileNumber: 9876543210, AadhaarNumber: 123412341234, Pincode: 560001 } as any);
    expect(u.MobileNumber).toBe('9876543210');
    expect(u.AadhaarNumber).toBe('123412341234');
    expect(u.Pincode).toBe('560001');
    expect(() => u.MobileNumber.toLowerCase()).not.toThrow();
  });

  it('stringifies account numbers and numbers-ifies limits', () => {
    const b: any = normalizeBankAccount({ AccountNumber: 999900001111, MaxLoanAmount: '300000', UtilizedLoanAmount: '', AvailableLoanAmount: '' } as any);
    expect(b.AccountNumber).toBe('999900001111');
    expect(b.MaxLoanAmount).toBe(300000);
    expect(b.UtilizedLoanAmount).toBe(0);
    expect(b.AvailableLoanAmount).toBeUndefined();
  });

  it('coerces loan amounts and leaves missing keys alone', () => {
    const l: any = normalizeLoan({ LoanNumber: 1001, LoanAmount: '50000', InterestRate: '1.5' } as any);
    expect(l.LoanNumber).toBe('1001');
    expect(l.LoanAmount).toBe(50000);
    expect('ProcessingFee' in l).toBe(false);
  });
});
