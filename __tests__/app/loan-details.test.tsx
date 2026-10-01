import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
const mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const mockAuthState = { isSuperAdmin: true };
jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => mockAuthState }));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const USER = {
  UserId: 'USR001',
  CustomerCode: 'CUST-101',
  FullName: 'Ravi Kumar',
  MobileNumber: '9876543210',
};

const ACTIVE_LOAN = {
  LoanId: 'L1',
  LoanNumber: 'LN-1',
  UserId: 'USR001',
  BankName: 'SBI',
  LoanAmount: 100000,
  InterestRate: 12,
  InterestType: 'Simple',
  LoanPeriod: '6',
  LoanDate: '2026-01-05',
  DueDate: '2099-07-05',
  LoanStatus: 'Active',
  ornamentIds: ['ORN1'],
};

const mockStore: any = {
  loans: [ACTIVE_LOAN],
  users: [USER],
  ornaments: [{ OrnamentId: 'ORN1', OrnamentName: 'Gold Chain', Purity: '22K', GrossWeight: 12, NetWeight: 11 }],
  payments: [],
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  addPayment: jest.fn(),
  closeAndReleaseLoan: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LoanDetailScreen = require('../../src/app/loans/[id]').default;

const renderScreen = (id = 'L1') => {
  mockParams.id = id;
  return render(<LoanDetailScreen />);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.canGoBack.mockReturnValue(true);
  mockAuthState.isSuperAdmin = true;
  mockStore.loans = [ACTIVE_LOAN];
  mockStore.users = [USER];
  mockStore.payments = [];
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('LoanDetailScreen — header and summary', () => {
  it('shows a not-found state that returns to the loans tab', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    renderScreen('NOPE');
    expect(screen.getByText('Loan Contract Not Found')).toBeTruthy();
    fireEvent.press(screen.getByText('Return to Loans'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/loans');
  });

  it('shows the loan number, subtitle and borrower card', () => {
    renderScreen();
    expect(screen.getByText('LN-1')).toBeTruthy();
    expect(screen.getByText('Details of loan')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('+91 98765 43210 · CUST-101')).toBeTruthy();
    expect(screen.getByText('RK')).toBeTruthy();
  });

  it('can be found by loan number as well as id', () => {
    renderScreen('LN-1');
    expect(screen.getByText('Details of loan')).toBeTruthy();
  });

  it('shows an Active status badge and the days left', () => {
    renderScreen();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/Due in \d+ days/)).toBeTruthy();
  });

  it('shows an Overdue status badge and how late it is', () => {
    mockStore.loans = [{ ...ACTIVE_LOAN, DueDate: '2020-01-01' }];
    renderScreen();
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByText(/Overdue by \d+ days/)).toBeTruthy();
  });

  it('shows the loan, charges and repayment sections with computed interest', () => {
    renderScreen();
    expect(screen.getByText('Loan amount')).toBeTruthy();
    expect(screen.getByText('₹1,00,000')).toBeTruthy();
    expect(screen.getByText('12% p.a · Simple')).toBeTruthy();
    expect(screen.getByText('6 months')).toBeTruthy();
    expect(screen.getByText('Charges')).toBeTruthy();
    // 100000 * 12% * 6/12
    expect(screen.getByText('Total interest')).toBeTruthy();
    expect(screen.getAllByText('₹6,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Repayment')).toBeTruthy();
    expect(screen.getByText('Total payable')).toBeTruthy();
  });

  it('counts recorded payments against the outstanding balance', () => {
    mockStore.payments = [
      { PaymentId: 'P1', LoanId: 'L1', PaymentType: 'Interest', TotalPaidAmount: 6000, InterestAmount: 6000, PaymentMethod: 'UPI', PaymentDate: '2026-02-05' },
    ];
    renderScreen();
    expect(screen.getByText('Paid ₹6,000.00 of ₹1,06,000.00')).toBeTruthy();
    expect(screen.getByText('6%')).toBeTruthy();
  });
});

describe('LoanDetailScreen — payments tab', () => {
  it('shows an empty state when there are no payments', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Payments'));
    expect(screen.getByText('No payments recorded yet')).toBeTruthy();
  });

  it('lists this loan\'s payments only', () => {
    mockStore.payments = [
      { PaymentId: 'P1', LoanId: 'L1', PaymentType: 'Interest', TotalPaidAmount: 2100, InterestAmount: 2100, PaymentMethod: 'UPI', TransactionReference: 'UTR123', PaymentDate: '2026-02-05' },
      { PaymentId: 'P2', LoanId: 'OTHER', PaymentType: 'Principal', TotalPaidAmount: 9999, PrincipalAmount: 9999, PaymentMethod: 'Cash', PaymentDate: '2026-02-06' },
    ];
    renderScreen();
    fireEvent.press(screen.getByText('Payments'));
    expect(screen.getByText('Interest · ₹2,100')).toBeTruthy();
    expect(screen.getByText('UTR123')).toBeTruthy();
    expect(screen.queryByText('Principal · ₹9,999')).toBeNull();
  });
});

describe('LoanDetailScreen — borrower link', () => {
  it('opens that customer\'s page in the Users tab', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Ravi Kumar'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/users',
      params: { userId: 'USR001' },
    });
  });

  it('falls back to the loan\'s user id when the borrower record is missing', () => {
    mockStore.users = [];
    renderScreen();
    fireEvent.press(screen.getByText('USR001'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/users',
      params: { userId: 'USR001' },
    });
  });

  it('goes back from the header arrow', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe('LoanDetailScreen — close and release popup', () => {
  it('opens the popup on the same screen instead of navigating away', () => {
    renderScreen();
    expect(screen.queryByText('Close Loan & Release')).toBeNull();

    fireEvent.press(screen.getByLabelText('Close and Release Loan'));

    expect(screen.getByText('Close Loan & Release')).toBeTruthy();
    expect(screen.getByText('Ornaments to Release (1)')).toBeTruthy();
    expect(screen.getByText('Gold Chain')).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('closes and releases the loan when confirmed', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Close and Release Loan'));
    fireEvent.press(screen.getByText('Close & Release'));

    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledWith('L1', 'Closed and ornaments released');
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
  });

  it('dismisses the popup from Cancel without closing the loan', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Close and Release Loan'));
    fireEvent.press(screen.getByText('Cancel'));

    expect(screen.queryByText('Close Loan & Release')).toBeNull();
    expect(mockStore.closeAndReleaseLoan).not.toHaveBeenCalled();
  });

  it('refuses read-only users with a toast and no popup', () => {
    mockAuthState.isSuperAdmin = false;
    renderScreen();
    fireEvent.press(screen.getByLabelText('Close and Release Loan'));

    expect(mockToast.danger).toHaveBeenCalledWith('Closing a loan requires SuperAdmin access');
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
  });
});

describe('LoanDetailScreen — closed loans', () => {
  beforeEach(() => {
    mockStore.loans = [{ ...ACTIVE_LOAN, LoanStatus: 'Closed', ClosedDate: '2026-03-01' }];
  });

  it('shows the Closed badge', () => {
    renderScreen();
    expect(screen.getByText('Closed')).toBeTruthy();
  });

  it('hides both Close and Release and Record payment', () => {
    renderScreen();
    expect(screen.queryByLabelText('Close and Release Loan')).toBeNull();
    expect(screen.queryByLabelText('Record Payment')).toBeNull();
    expect(screen.queryByText('Close and Release')).toBeNull();
    expect(screen.queryByText('Record payment')).toBeNull();
  });

  it('still lets you browse the summary and payments', () => {
    renderScreen();
    expect(screen.getByText('Loan amount')).toBeTruthy();
    fireEvent.press(screen.getByText('Payments'));
    expect(screen.getByText('No payments recorded yet')).toBeTruthy();
  });
});

describe('LoanDetailScreen — open loans keep both actions', () => {
  it('shows Close and Release and Record payment for active and overdue loans', () => {
    renderScreen();
    expect(screen.getByLabelText('Close and Release Loan')).toBeTruthy();
    expect(screen.getByLabelText('Record Payment')).toBeTruthy();
  });

  it('shows them for overdue loans too', () => {
    mockStore.loans = [{ ...ACTIVE_LOAN, LoanStatus: 'Overdue' }];
    renderScreen();
    expect(screen.getByLabelText('Close and Release Loan')).toBeTruthy();
    expect(screen.getByLabelText('Record Payment')).toBeTruthy();
  });
});

describe('LoanDetailScreen — record payment', () => {
  const openPayModal = () => fireEvent.press(screen.getByLabelText('Record Payment'));

  it('opens the repayment form for this loan', () => {
    renderScreen();
    openPayModal();
    expect(screen.getByText('Record Repayment (LN-1)')).toBeTruthy();
    expect(screen.getByText('Amount Paid (₹) *')).toBeTruthy();
  });

  it('rejects a zero amount', () => {
    renderScreen();
    openPayModal();
    fireEvent.press(screen.getByText('Save Payment'));
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a payment amount greater than ₹0.');
    expect(mockStore.addPayment).not.toHaveBeenCalled();
  });

  it('records an interest payment and closes the form', () => {
    renderScreen();
    openPayModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 2100'), '2100');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. UPI/50291039120'), 'UTR777');
    fireEvent.press(screen.getByText('UPI'));
    fireEvent.press(screen.getByText('Save Payment'));

    expect(mockStore.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        LoanId: 'L1',
        PaymentType: 'Interest',
        InterestAmount: 2100,
        PrincipalAmount: 0,
        PenaltyAmount: 0,
        TotalPaidAmount: 2100,
        PaymentMethod: 'UPI',
        TransactionReference: 'UTR777',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('2,100'));
    expect(screen.queryByText('Record Repayment (LN-1)')).toBeNull();
  });

  it('attributes the amount to principal when Principal is chosen', () => {
    renderScreen();
    openPayModal();
    fireEvent.press(screen.getByText('Principal'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 2100'), '5000');
    fireEvent.press(screen.getByText('Save Payment'));

    expect(mockStore.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({ PaymentType: 'Principal', PrincipalAmount: 5000, InterestAmount: 0 })
    );
  });

  it('dismisses the form with Cancel', () => {
    renderScreen();
    openPayModal();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Record Repayment (LN-1)')).toBeNull();
    expect(mockStore.addPayment).not.toHaveBeenCalled();
  });
});
