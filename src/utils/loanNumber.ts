export const LOAN_NUMBER_PREFIX = 'CMP';

export function getNextLoanNumber(loans: { LoanNumber?: unknown }[]): string {
  const pattern = new RegExp('^' + LOAN_NUMBER_PREFIX + '([0-9]+)$', 'i');
  const max = loans.reduce((m, l) => {
    const match = pattern.exec(String(l.LoanNumber ?? '').trim());
    const n = match ? parseInt(match[1], 10) : 0;
    return n > m ? n : m;
  }, 0);
  return `${LOAN_NUMBER_PREFIX}${String(max + 1).padStart(3, '0')}`;
}
