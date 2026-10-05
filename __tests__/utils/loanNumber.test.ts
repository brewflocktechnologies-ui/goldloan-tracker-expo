import { getNextLoanNumber } from '../../src/utils/loanNumber';

describe('getNextLoanNumber', () => {
  it('starts at CMP001', () => expect(getNextLoanNumber([])).toBe('CMP001'));
  it('increments the highest CMP number, ignoring other formats', () => {
    const loans = [{ LoanNumber: 'CMP30' }, { LoanNumber: 'CMP32' }, { LoanNumber: 'LN-2026-099' }, { LoanNumber: 31 }];
    expect(getNextLoanNumber(loans)).toBe('CMP033');
  });
  it('handles gaps and lowercase', () => expect(getNextLoanNumber([{ LoanNumber: 'cmp007' }])).toBe('CMP008'));
});
