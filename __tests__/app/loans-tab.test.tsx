import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, RefreshControl } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockTheme = { isDark: false };
const mockAuth = { isSuperAdmin: true };
const mockToast = {
  success: jest.fn(),
  danger: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  showToast: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => {
    const theme = jest.requireActual('../../src/constants/theme');
    return {
      isDark: mockTheme.isDark,
      colors: mockTheme.isDark ? theme.DarkColors || theme.LightColors : theme.LightColors,
    };
  },
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const FAR_FUTURE = '2099-01-01';

const mockStore: any = {
  loans: [],
  users: [],
  payments: [],
  ornaments: [],
  bankAccounts: [],
  syncFromBackend: jest.fn(),
  addLoan: jest.fn(),
  updateLoan: jest.fn(),
  addPayment: jest.fn(),
};

jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LoansScreen = require('../../src/app/(tabs)/loans').default;

function seedStore() {
  mockStore.users = [
    { UserId: 'USR001', FullName: 'Ravi Kumar', MobileNumber: '9876543210' },
    { UserId: 'USR002', FullName: 'Anita Sharma', MobileNumber: '9000000002' },
    { UserId: 'USR003', FullName: 'Zoya Khan', MobileNumber: '9000000003' },
  ];
  mockStore.loans = [
    {
      LoanId: 'L1',
      LoanNumber: 'LN-ACTIVE',
      UserId: 'USR001',
      BankAccountId: 'BA1',
      BankName: 'SBI',
      LoanAmount: 50000,
      InterestRate: 9.5,
      InterestType: 'Simple',
      LoanPeriod: '12 Months',
      LoanDate: '2025-01-01',
      DueDate: FAR_FUTURE,
      ProcessingFee: 750,
      DocumentCharge: 250,
      InsuranceCharge: 500,
      LoanStatus: 'Active',
      ornamentIds: ['ORN1'],
    },
    {
      LoanId: 'L2',
      LoanNumber: 'LN-OVERDUE',
      UserId: 'USR002',
      BankName: 'HDFC',
      LoanAmount: 70000,
      DueDate: '2020-01-01',
      LoanStatus: 'Overdue',
    },
    {
      LoanId: 'L3',
      LoanNumber: 'LN-CLOSED',
      UserId: 'USR003',
      BankName: 'ICICI',
      LoanAmount: 90000,
      DueDate: '2020-06-01',
      LoanStatus: 'Closed',
      ClosedDate: '2020-05-01',
    },
    {
      // Second active loan consuming bank headroom for USR001 / BA1
      LoanId: 'L4',
      LoanNumber: 'LN-OTHER',
      UserId: 'USR001',
      BankAccountId: 'BA1',
      BankName: 'SBI',
      LoanAmount: 150000,
      DueDate: FAR_FUTURE,
      LoanStatus: 'Active',
    },
  ];
  mockStore.ornaments = [
    {
      OrnamentId: 'ORN1',
      OrnamentName: 'Gold Necklace',
      UserId: 'USR001',
      Purity: '22K',
      GrossWeight: 20,
      NetWeight: 18,
      MarketValue: 99000,
      Status: 'Pledged',
    },
    {
      OrnamentId: 'ORN2',
      OrnamentName: 'Gold Ring',
      UserId: 'USR001',
      Purity: '22K',
      GrossWeight: 5,
      NetWeight: 4.5,
      MarketValue: 25000,
      Status: 'Available',
    },
  ];
  mockStore.bankAccounts = [
    {
      BankAccountId: 'BA1',
      UserId: 'USR001',
      BankName: 'SBI',
      Status: 'Active',
      MaxLoanAmount: 200000,
      UtilizedLoanAmount: 0,
    },
  ];
  mockStore.payments = [];
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockTheme.isDark = false;
  mockAuth.isSuperAdmin = true;
  mockStore.syncFromBackend = jest.fn().mockResolvedValue(undefined);
  seedStore();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  alertSpy.mockRestore();
});

function openMenu(loanNumber = 'LN-ACTIVE') {
  fireEvent.press(screen.getByLabelText(`Loan ${loanNumber}`).findByProps({ accessibilityLabel: 'More options' }));
}

function openMenuByIndex(index: number) {
  fireEvent.press(screen.getAllByLabelText('More options')[index]);
}

describe('LoansScreen - header, chips, search', () => {
  it('shows the total loan count and filter chip counts', () => {
    render(<LoansScreen />);
    expect(screen.getByText('Total Loans')).toBeTruthy();
    expect(screen.getByText('04')).toBeTruthy();
    expect(screen.getByText('All (4)')).toBeTruthy();
    expect(screen.getByText('Active (2)')).toBeTruthy();
    expect(screen.getByText('Overdue (1)')).toBeTruthy();
  });

  it('renders each loan card with borrower and bank', () => {
    render(<LoansScreen />);
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
    expect(screen.getAllByText('Ravi Kumar')).toHaveLength(2);
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
  });

  it('filters by Overdue then Active chips', () => {
    render(<LoansScreen />);
    fireEvent.press(screen.getByText('Overdue (1)'));
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();
    expect(screen.queryByText('LN-CLOSED')).toBeNull();

    fireEvent.press(screen.getByText('Active (2)'));
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
    expect(screen.getByText('LN-OTHER')).toBeTruthy();
    expect(screen.queryByText('LN-OVERDUE')).toBeNull();

    fireEvent.press(screen.getByText('All (4)'));
    expect(screen.getByText('LN-CLOSED')).toBeTruthy();
  });

  it('searches by loan number', () => {
    render(<LoansScreen />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'ln-overdue');
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();
  });

  it('searches by customer name', () => {
    render(<LoansScreen />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'zoya');
    expect(screen.getByText('LN-CLOSED')).toBeTruthy();
    expect(screen.queryByText('LN-ACTIVE')).toBeNull();
  });

  it('searches by mobile number', () => {
    render(<LoansScreen />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), '9000000002');
    expect(screen.getByText('LN-OVERDUE')).toBeTruthy();
    expect(screen.queryByText('LN-CLOSED')).toBeNull();
  });

  it('shows the empty state when nothing matches', () => {
    render(<LoansScreen />);
    fireEvent.changeText(screen.getByLabelText('Search loans'), 'nope-xyz');
    expect(screen.getByText('No loans found')).toBeTruthy();
    expect(screen.getByText('No loans matching "nope-xyz"')).toBeTruthy();
  });

  it('shows the first-loan prompt with zero loans', () => {
    mockStore.loans = [];
    render(<LoansScreen />);
    expect(screen.getByText('00')).toBeTruthy();
    expect(screen.getByText('Start by originating your first gold loan.')).toBeTruthy();
  });
});

describe('LoansScreen - navigation, FAB, refresh', () => {
  it('shows the FAB for super admin and navigates to /loans/new', () => {
    render(<LoansScreen />);
    fireEvent.press(screen.getByLabelText('Originate New Loan'));
    expect(mockRouter.push).toHaveBeenCalledWith('/loans/new');
  });

  it('hides the FAB and edit/pay actions for non-admin', () => {
    mockAuth.isSuperAdmin = false;
    render(<LoansScreen />);
    expect(screen.queryByLabelText('Originate New Loan')).toBeNull();

    openMenuByIndex(0);
    expect(screen.getByText('Copy Loan Number')).toBeTruthy();
    expect(screen.getByText('View Loan Details')).toBeTruthy();
    expect(screen.queryByText('Edit Loan Contract')).toBeNull();
    expect(screen.queryByText('Record Repayment')).toBeNull();
  });

  it('navigates to the loan detail page when a card is pressed', () => {
    render(<LoansScreen />);
    fireEvent.press(screen.getByLabelText('Loan LN-ACTIVE'));
    expect(mockRouter.push).toHaveBeenCalledWith('/loans/L1');
  });

  it('navigates to the detail page from the options menu', () => {
    render(<LoansScreen />);
    openMenuByIndex(0);
    fireEvent.press(screen.getByText('View Loan Details'));
    expect(mockRouter.push).toHaveBeenCalledWith('/loans/L1');
  });

  it('pull-to-refresh syncs from the backend', async () => {
    render(<LoansScreen />);
    const rc = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => {
      await rc.props.onRefresh();
    });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  });
});

describe('LoansScreen - edit loan modal', () => {
  function openEdit() {
    render(<LoansScreen />);
    openMenuByIndex(0);
    fireEvent.press(screen.getByText('Edit Loan Contract'));
  }

  it('opens the edit modal with locked borrower and prefilled values', () => {
    openEdit();
    expect(screen.getByText('Edit Loan (LN-ACTIVE)')).toBeTruthy();
    expect(screen.getByText('1. Borrower (Locked)')).toBeTruthy();
    expect(screen.getByDisplayValue('50000')).toBeTruthy();
    expect(screen.getByDisplayValue('9.5')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
    expect(screen.getByText('Pledged')).toBeTruthy();
    // 200000 limit - 150000 used by LN-OTHER
    expect(screen.getByText(/Headroom: ₹50,000/)).toBeTruthy();
  });

  it('saves changes through store.updateLoan and shows a toast', () => {
    openEdit();
    fireEvent.changeText(screen.getByDisplayValue('50000'), '40000');
    fireEvent.press(screen.getByText('Save Changes'));

    expect(mockStore.updateLoan).toHaveBeenCalledTimes(1);
    const [id, patch] = mockStore.updateLoan.mock.calls[0];
    expect(id).toBe('L1');
    expect(patch).toEqual(
      expect.objectContaining({
        LoanNumber: 'LN-ACTIVE',
        UserId: 'USR001',
        BankAccountId: 'BA1',
        BankName: 'SBI',
        LoanAmount: 40000,
        InterestRate: 9.5,
        ProcessingFee: 750,
        DocumentCharge: 250,
        InsuranceCharge: 500,
        NetDisbursementAmount: 38500,
        GrossWeight: 20,
        NetWeight: 18,
        ornamentIds: ['ORN1'],
        // simple interest 40000 * 9.5% * 1yr = 3800, + 750 fee
        TotalCharges: 4550,
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith('Loan LN-ACTIVE updated successfully!');
    expect(mockStore.addLoan).not.toHaveBeenCalled();
    // modal closed
    expect(screen.queryByText('Edit Loan (LN-ACTIVE)')).toBeNull();
  });

  it('uses manually entered weights over the ornament totals', () => {
    openEdit();
    fireEvent.changeText(screen.getByPlaceholderText('20.000'), '25');
    fireEvent.changeText(screen.getByPlaceholderText('18.000'), '22.5');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(mockStore.updateLoan.mock.calls[0][1]).toEqual(
      expect.objectContaining({ GrossWeight: 25, NetWeight: 22.5 })
    );
  });

  it('computes compound interest when Compound is chosen', () => {
    openEdit();
    fireEvent.press(screen.getByText('Compound'));
    fireEvent.press(screen.getByText('Save Changes'));
    const patch = mockStore.updateLoan.mock.calls[0][1];
    const monthly = 9.5 / 1200;
    const expectedInterest = Math.round((50000 * Math.pow(1 + monthly, 12) - 50000) * 100) / 100;
    expect(patch.InterestType).toBe('Compound');
    expect(patch.TotalCharges).toBeCloseTo(expectedInterest + 750, 2);
  });

  it('alerts when amount is zero', () => {
    openEdit();
    fireEvent.changeText(screen.getByDisplayValue('50000'), '0');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Loan Amount must be greater than 0.');
    expect(mockStore.updateLoan).not.toHaveBeenCalled();
  });

  it('alerts when no ornament is selected', () => {
    openEdit();
    fireEvent.press(screen.getByText('Gold Necklace'));
    expect(screen.getByText('3. Pledged Ornaments (0)')).toBeTruthy();
    fireEvent.press(screen.getByText('Save Changes'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Please select at least one gold ornament to pledge.'
    );
    expect(mockStore.updateLoan).not.toHaveBeenCalled();
  });

  it('lets an additional available ornament be selected', () => {
    openEdit();
    fireEvent.press(screen.getByText('Gold Ring'));
    expect(screen.getByText('3. Pledged Ornaments (2)')).toBeTruthy();
    fireEvent.press(screen.getByText('Save Changes'));
    expect(mockStore.updateLoan.mock.calls[0][1].ornamentIds).toEqual(['ORN1', 'ORN2']);
  });

  it('alerts when the amount exceeds the bank limit', () => {
    openEdit();
    fireEvent.changeText(screen.getByDisplayValue('50000'), '80000');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Bank Limit Exceeded',
      expect.stringContaining('exceeds available limit of ₹50,000 for SBI')
    );
    expect(mockStore.updateLoan).not.toHaveBeenCalled();
  });

  it('closes the modal on Cancel without saving', () => {
    openEdit();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Edit Loan (LN-ACTIVE)')).toBeNull();
    expect(mockStore.updateLoan).not.toHaveBeenCalled();
  });

  it('falls back to pledged ornaments of the borrower when the loan has no ornamentIds', () => {
    mockStore.loans[0].ornamentIds = undefined;
    openEdit();
    expect(screen.getByText('3. Pledged Ornaments (1)')).toBeTruthy();
  });
});

describe('LoansScreen - repayment modal', () => {
  function openPay() {
    render(<LoansScreen />);
    openMenuByIndex(0);
    fireEvent.press(screen.getByText('Record Repayment'));
  }

  it('opens the repayment modal for the selected loan', () => {
    openPay();
    expect(screen.getByText('Record Repayment (LN-ACTIVE)')).toBeTruthy();
    expect(screen.getByText('Save Repayment')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. 1500')).toBeTruthy();
  });

  it('alerts when the amount is empty', () => {
    openPay();
    fireEvent.press(screen.getByText('Save Repayment'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Please enter payment amount greater than ₹0.'
    );
    expect(mockStore.addPayment).not.toHaveBeenCalled();
  });

  it('records an interest payment (default type) with the right split', () => {
    openPay();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 1500'), '1500');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. UPI/50291039120'), 'UTR123');
    fireEvent.changeText(screen.getByPlaceholderText('Payment notes...'), 'monthly');
    fireEvent.press(screen.getByText('Save Repayment'));

    expect(mockStore.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        LoanId: 'L1',
        PaymentType: 'Interest',
        PrincipalAmount: 0,
        InterestAmount: 1500,
        TotalPaidAmount: 1500,
        PaymentMethod: 'UPI',
        TransactionReference: 'UTR123',
        Remarks: 'monthly',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith('Repayment of ₹1,500 recorded.');
    expect(screen.queryByText('Record Repayment (LN-ACTIVE)')).toBeNull();
  });

  it('records a principal payment with a different method', () => {
    openPay();
    fireEvent.press(screen.getByText('Principal'));
    fireEvent.press(screen.getByText('Cash'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 1500'), '10000');
    fireEvent.press(screen.getByText('Save Repayment'));

    expect(mockStore.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        PaymentType: 'Principal',
        PrincipalAmount: 10000,
        InterestAmount: 0,
        TotalPaidAmount: 10000,
        PaymentMethod: 'Cash',
      })
    );
  });

  it('records a part payment with no principal/interest split', () => {
    openPay();
    fireEvent.press(screen.getByText('Part Payment'));
    fireEvent.press(screen.getByText('Net Banking'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 1500'), '700');
    fireEvent.press(screen.getByText('Save Repayment'));

    expect(mockStore.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        PaymentType: 'Part_Payment',
        PrincipalAmount: 0,
        InterestAmount: 0,
        TotalPaidAmount: 700,
        PaymentMethod: 'Net Banking',
      })
    );
  });

  it('closes via Cancel without recording', () => {
    openPay();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Record Repayment (LN-ACTIVE)')).toBeNull();
    expect(mockStore.addPayment).not.toHaveBeenCalled();
  });
});

describe('LoansScreen - dark mode', () => {
  it('renders the list in dark mode', () => {
    mockTheme.isDark = true;
    render(<LoansScreen />);
    expect(screen.getByText('Total Loans')).toBeTruthy();
    expect(screen.getByText('LN-ACTIVE')).toBeTruthy();
  });

  it('renders edit and pay modals in dark mode', () => {
    mockTheme.isDark = true;
    render(<LoansScreen />);
    openMenuByIndex(0);
    fireEvent.press(screen.getByText('Edit Loan Contract'));
    expect(screen.getByText('Edit Loan (LN-ACTIVE)')).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));

    openMenuByIndex(0);
    fireEvent.press(screen.getByText('Record Repayment'));
    expect(screen.getByText('Record Repayment (LN-ACTIVE)')).toBeTruthy();
  });
});
