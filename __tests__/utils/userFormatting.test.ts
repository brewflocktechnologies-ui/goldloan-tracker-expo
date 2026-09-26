import {
  formatMaskedAadhaar,
  formatMaskedPAN,
  formatPhoneNumber,
} from '../../src/mock/userMockExtras';
import {
  buildUserStatsMap,
  calculateAge,
  countUsersByStatus,
  formatDisplayDOB,
  formatInputDOB,
  getUserLastActive,
} from '../../src/utils/calculations';

describe('formatPhoneNumber', () => {
  it('formats a 10-digit number with +91', () => {
    expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210');
  });
  it('accepts numbers (Sheets returns numeric cells as numbers)', () => {
    expect(formatPhoneNumber(9876543210)).toBe('+91 98765 43210');
  });
  it('normalises numbers already prefixed with 91', () => {
    expect(formatPhoneNumber('919876543210')).toBe('+91 98765 43210');
  });
  it('returns an em dash for empty values', () => {
    expect(formatPhoneNumber('')).toBe('—');
    expect(formatPhoneNumber(undefined)).toBe('—');
  });
});

describe('formatMaskedAadhaar', () => {
  it('shows only the last 4 digits', () => {
    expect(formatMaskedAadhaar('123456789012')).toBe('XXXX XXXX 9012');
    expect(formatMaskedAadhaar('1234 5678 9012')).toBe('XXXX XXXX 9012');
    expect(formatMaskedAadhaar(123456789012)).toBe('XXXX XXXX 9012');
  });
  it('returns an em dash when missing or too short', () => {
    expect(formatMaskedAadhaar('')).toBe('—');
    expect(formatMaskedAadhaar('12')).toBe('—');
  });
});

describe('formatMaskedPAN', () => {
  it('shows only the last 4 characters', () => {
    expect(formatMaskedPAN('ABCDE1234F')).toBe('XXXXXX234F');
    expect(formatMaskedPAN('abcde1234f')).toBe('XXXXXX234F');
  });
  it('masks short values fully and returns an em dash when empty', () => {
    expect(formatMaskedPAN('ABC')).toBe('XXX');
    expect(formatMaskedPAN('')).toBe('—');
  });
});

describe('date-of-birth helpers', () => {
  it('formatDisplayDOB renders "D Mon YYYY"', () => {
    expect(formatDisplayDOB('1990-05-15')).toBe('15 May 1990');
    expect(formatDisplayDOB('15/05/1990')).toBe('15 May 1990');
  });
  it('formatInputDOB renders DD/MM/YYYY for editing', () => {
    expect(formatInputDOB('1990-05-15')).toBe('15/05/1990');
    expect(formatInputDOB('')).toBe('');
  });
  it('calculateAge returns "(N years)" or empty', () => {
    const y = new Date().getFullYear() - 30;
    expect(calculateAge(`${y}-01-01`)).toMatch(/^ \(\d+ years\)$/);
    expect(calculateAge('')).toBe('');
    expect(calculateAge('not a date')).toBe('');
  });
});

describe('customer stats helpers', () => {
  const users: any[] = [
    { UserId: 'U1', Status: 'Active' },
    { UserId: 'U2', Status: 'Inactive' },
    { UserId: 'U3', Status: 'Active' },
  ];

  it('countUsersByStatus counts each status', () => {
    expect(countUsersByStatus(users, 'Active')).toBe(2);
    expect(countUsersByStatus(users, 'Inactive')).toBe(1);
    expect(countUsersByStatus([], 'Active')).toBe(0);
  });

  it('buildUserStatsMap totals loans and gold weight per user', () => {
    const map = buildUserStatsMap(
      users,
      [{ UserId: 'U1' }, { UserId: 'U1' }, { UserId: 'U3' }] as any,
      [
        { UserId: 'U1', GrossWeight: 10 },
        { UserId: 'U1', NetWeight: 5 },
        { UserId: 'U2', GrossWeight: 99 },
      ] as any
    );
    expect(map.get('U1')).toEqual({ loanCount: 2, goldWeight: 15 });
    expect(map.get('U2')).toEqual({ loanCount: 0, goldWeight: 99 });
    expect(map.get('U3')).toEqual({ loanCount: 1, goldWeight: 0 });
  });

  it('getUserLastActive prefers UpdatedDate, falls back to CreatedDate, else empty', () => {
    expect(getUserLastActive({ UpdatedDate: '2024-03-10T10:00:00Z' })).toMatch(/^Last active: /);
    expect(getUserLastActive({ CreatedDate: '2024-01-01T00:00:00Z' })).toMatch(/^Last active: /);
    expect(getUserLastActive({})).toBe('');
    expect(getUserLastActive({ UpdatedDate: 'garbage' })).toBe('');
  });
});
