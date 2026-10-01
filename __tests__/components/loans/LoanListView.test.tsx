import { fireEvent, render, screen } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Loan, User } from '../../../src/types';
import type { LoanFilterType } from '../../../src/components/loans/LoanListView';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('../../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../../src/constants/theme').LightColors }),
}));
jest.mock('../../../src/context/AuthContext', () => ({ useAuth: () => ({ isSuperAdmin: true }) }));
jest.mock('../../../src/context/ToastContext', () => ({
  useToast: () => ({ success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { LoanListView } = require('../../../src/components/loans/LoanListView');

const USERS = [
  { UserId: 'USR001', FullName: 'Ravi Kumar', MobileNumber: '9876543210' },
  { UserId: 'USR002', FullName: 'Anita Sharma', MobileNumber: '9000000002' },
  { UserId: 'USR003', FullName: 'Zoya Khan', MobileNumber: '9000000003' },
] as unknown as User[];

const FAR_FUTURE = '2099-01-01';

const LOANS = [
  { LoanId: 'L1', LoanNumber: 'LN-ACTIVE', UserId: 'USR001', BankName: 'SBI', LoanAmount: 50000, DueDate: FAR_FUTURE, LoanStatus: 'Active' },
  { LoanId: 'L2', LoanNumber: 'LN-OVERDUE', UserId: 'USR002', BankName: 'HDFC', LoanAmount: 70000, DueDate: '2020-01-01', LoanStatus: 'Overdue' },
  { LoanId: 'L3', LoanNumber: 'LN-CLOSED', UserId: 'USR003', BankName: 'ICICI', LoanAmount: 90000, DueDate: '2020-06-01', LoanStatus: 'Closed', ClosedDate: '2020-05-01' },
] as unknown as Loan[];

// Owns the search/filter state, like the Loans tab does.
function Harness({ loans = LOANS, ...rest }: Record<string, unknown>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<LoanFilterType>('All');
  return (
    <LoanListView
      loans={loans}
      users={USERS}
      payments={[]}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      refreshing={false}
      onRefresh={jest.fn()}
      onLoanPress={jest.fn()}
      {...rest}
    />
  );
}

describe('LoanListView — header and filter pills', () => {
  it('shows the title and total loan count', () => {
    render(<Harness />);
    expect(screen.getByText('Loans')).toBeTruthy();
    expect(screen.getByText('Total Loans')).toBeTruthy();
    expect(screen.getByText('03')).toBeTruthy();
  });

  it('offers only All, Active and Overdue filters with accurate counts', () => {
    render(<Harness />);
    expect(screen.getByText('All (3)')).toBeTruthy();
    expect(screen.getByText('Active (1)')).toBeTruthy();
    expect(screen.getByText('Overdue (1)')).toBeTruthy();
  });

  it('has no Closed filter pill, even when closed loans exist', () => {
    render(<Harness />);
    expect(screen.queryByText(/^Closed \(/)).toBeNull();
  });

  it('filters to overdue loans', () => {
    render(<Harness />);
    fireEvent.press(screen.getByText('Overdue (1)'));
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();
    expect(screen.queryByText('LN-CLOSED')).toBeNull();
  });

  it('filters to active loans and back to all', () => {
    render(<Harness />);
    fireEvent.press(screen.getByText('Active (1)'));
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
    expect(screen.queryByText('LN-OVERDUE')).toBeNull();

    fireEvent.press(screen.getByText('All (3)'));
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.getByText('LN-CLOSED')).toBeTruthy();
  });
});

describe('LoanListView — search, cards and actions', () => {
  it('searches by customer name', () => {
    render(<Harness />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'anita');
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();
  });

  it('searches by loan number and by bank', () => {
    render(<Harness />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'LN-CLOSED');
    expect(screen.getByText('LN-CLOSED')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Search loans'), 'sbi');
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
    expect(screen.queryByText('LN-CLOSED')).toBeNull();
  });

  it('shows an empty state for a search with no matches', () => {
    render(<Harness />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'zzz-nothing');
    expect(screen.getByText('No loans found')).toBeTruthy();
    expect(screen.getByText('No loans matching "zzz-nothing"')).toBeTruthy();
  });

  it('shows the first-loan prompt when there are no loans at all', () => {
    render(<Harness loans={[]} />);
    expect(screen.getByText('No loans found')).toBeTruthy();
    expect(screen.getByText('Start by originating your first gold loan.')).toBeTruthy();
  });

  it('shows the empty category message when a filter has no loans', () => {
    render(<Harness loans={[LOANS[0]]} />);
    fireEvent.press(screen.getByText('Overdue (0)'));
    expect(screen.getByText('No overdue loans in this category')).toBeTruthy();
  });

  it('shows the borrower, status badge and closed footer on a card', () => {
    render(<Harness />);
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByText('Closed')).toBeTruthy();
  });

  it('opens a loan when its card is pressed', () => {
    const onLoanPress = jest.fn();
    render(<Harness onLoanPress={onLoanPress} />);
    fireEvent.press(screen.getByLabelText('Loan LN-ACTIVE'));
    expect(onLoanPress).toHaveBeenCalledWith(expect.objectContaining({ LoanId: 'L1' }));
  });

  it('shows the add button only when onAddPress is provided', () => {
    const { rerender } = render(<Harness />);
    expect(screen.queryByLabelText('Originate New Loan')).toBeNull();

    const onAddPress = jest.fn();
    rerender(<Harness onAddPress={onAddPress} />);
    fireEvent.press(screen.getByLabelText('Originate New Loan'));
    expect(onAddPress).toHaveBeenCalled();
  });
});
