import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const mockAuthState = { isSuperAdmin: true };
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const mockToast = {
  success: jest.fn(),
  danger: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  showToast: jest.fn(),
};
jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

jest.mock('../../src/services/api', () => ({
  getDriveImageUrl: jest.fn((id: string) => (id ? `https://drive.example/${id}` : '')),
}));

const BANK_ACCOUNTS = [
  {
    BankAccountId: 'B1',
    UserId: 'U1',
    AccountHolderName: 'Ravi Kumar',
    AccountNumber: '111122223333',
    BankName: 'SBI',
    BranchName: 'MG Road Branch',
    City: 'Bengaluru',
    IFSCCode: 'SBIN0001234',
    AccountType: 'Current',
    UPI_ID: 'ravi@sbi',
    MaxLoanAmount: 500000,
    UtilizedLoanAmount: 200000,
    AvailableLoanAmount: 300000,
    PassbookImage: 'pb1',
    Status: 'Active',
  },
  {
    BankAccountId: 'B2',
    UserId: 'U2',
    AccountHolderName: 'Anita Sharma',
    AccountNumber: '99887766',
    BankName: 'HDFC',
    MaxLoanAmount: 100000,
    UtilizedLoanAmount: 0,
    Status: 'Inactive',
  },
  {
    BankAccountId: 'B3',
    UserId: 'U3',
    AccountHolderName: 'Zoya Khan',
    AccountNumber: '1234',
    BankName: 'ICICI',
    City: 'Chennai',
    Status: 'Active',
  },
];

const USERS = [
  { UserId: 'U1', FullName: 'Ravi Kumar' },
  { UserId: 'U3', FullName: 'Zoya Khan' },
];

const LOANS = [
  { LoanId: 'L1', UserId: 'U1', BankAccountId: 'B1', LoanNumber: 'LN-ONE', LoanAmount: 50000, LoanStatus: 'Active', DueDate: '2030-01-05' },
  { LoanId: 'L2', UserId: 'U9', BankAccountId: 'B1', LoanNumber: 'LN-TWO', LoanAmount: 150000, LoanStatus: 'Overdue', DueDate: '2030-02-10' },
  { LoanId: 'L3', UserId: 'U1', BankAccountId: 'B7', LoanNumber: 'LN-CLOSED', LoanAmount: 9000, LoanStatus: 'Closed', DueDate: '2030-03-01' },
  { LoanId: 'L4', UserId: 'U2', BankAccountId: 'B9', LoanNumber: 'LN-BYUSER', LoanAmount: 7000, LoanStatus: 'Active', DueDate: '2030-04-01' },
];

const mockStore: any = {
  bankAccounts: BANK_ACCOUNTS,
  users: USERS,
  loans: LOANS,
  isSyncing: false,
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  deleteBankAccount: jest.fn(),
};
jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BankAccountsScreen = require('../../src/app/(tabs)/bank-accounts').default;

const renderScreen = () => render(<BankAccountsScreen />);
const SEARCH = 'Search bank, account, holder, city, status...';
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const loc = (n: number) => `₹${n.toLocaleString()}`;

const openDetail = (index: number) => fireEvent.press(screen.getAllByLabelText('View Details')[index]);

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.isSuperAdmin = true;
  mockStore.bankAccounts = BANK_ACCOUNTS;
  mockStore.users = USERS;
  mockStore.loans = LOANS;
  mockStore.isSyncing = false;
});

describe('BankAccountsScreen — table', () => {
  it('renders every column header', () => {
    renderScreen();
    ['ID', 'Holder Name', 'Account No.', 'Bank', 'City', 'Max Limit (₹)', 'Utilized (₹)', 'Available (₹)', 'Status', 'Actions'].forEach(
      (h) => expect(screen.getByText(h)).toBeTruthy()
    );
  });

  it('renders a row for each account with ids, holders, account numbers and banks', () => {
    renderScreen();
    expect(screen.getByText('#B1')).toBeTruthy();
    expect(screen.getByText('#B2')).toBeTruthy();
    expect(screen.getByText('#B3')).toBeTruthy();
    expect(screen.getAllByText('Ravi Kumar').length).toBe(1);
    expect(screen.getByText('111122223333')).toBeTruthy();
    expect(screen.getByText('SBI')).toBeTruthy();
    expect(screen.getByText('HDFC')).toBeTruthy();
    expect(screen.getByText('ICICI')).toBeTruthy();
    expect(screen.getByText('Showing 1 to 3 of 3 entries')).toBeTruthy();
  });

  it('shows city or a dash placeholder', () => {
    renderScreen();
    expect(screen.getByText('Bengaluru')).toBeTruthy();
    expect(screen.getByText('Chennai')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBe(1); // B2 has no city
  });

  it('shows max, utilized and available amounts, falling back to computed available / zero', () => {
    renderScreen();
    expect(screen.getByText(loc(500000))).toBeTruthy(); // B1 max
    expect(screen.getByText(loc(200000))).toBeTruthy(); // B1 utilized
    expect(screen.getByText(loc(300000))).toBeTruthy(); // B1 explicit available
    // B2: max 100000, utilized 0, available computed = 100000 (shown twice: max + available)
    expect(screen.getAllByText(loc(100000)).length).toBe(2);
    // B2 utilized and B3 max/util/available are all zero
    expect(screen.getAllByText('₹0').length).toBe(1 + 3);
  });

  it('colours utilized amount red only when > 0', () => {
    renderScreen();
    const flat = (n: any) => Object.assign({}, ...[n.props.style].flat(Infinity).filter(Boolean));
    const used = flat(screen.getByText(loc(200000)));
    const zero = flat(screen.getAllByText('₹0')[0]);
    expect(used.color).not.toBe(zero.color);
  });

  it('renders status badges', () => {
    renderScreen();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the passbook thumbnail only for accounts that have one', () => {
    renderScreen();
    const imgs = screen.UNSAFE_getAllByType(Image);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].props.source).toEqual({ uri: 'https://drive.example/pb1' });
  });

  it('opens a full-screen preview when the thumbnail is pressed and closes it again', () => {
    renderScreen();
    expect(screen.queryByText('Passbook / Cheque Leaf Image')).toBeNull();
    fireEvent.press(screen.UNSAFE_getAllByType(Image)[0]);
    expect(screen.getByText('Passbook / Cheque Leaf Image')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Passbook / Cheque Leaf Image')).toBeNull();
  });
});

describe('BankAccountsScreen — empty / loading', () => {
  it('shows the empty message with no accounts', () => {
    mockStore.bankAccounts = [];
    renderScreen();
    expect(screen.getByText('No records found.')).toBeTruthy();
    expect(screen.getByText('Showing 0 to 0 of 0 entries')).toBeTruthy();
  });

  it('shows skeleton rows (not the empty message) while syncing with no data', () => {
    mockStore.bankAccounts = [];
    mockStore.isSyncing = true;
    renderScreen();
    expect(screen.queryByText('No records found.')).toBeNull();
  });

  it('shows data, not the skeleton, when syncing but accounts exist', () => {
    mockStore.isSyncing = true;
    renderScreen();
    expect(screen.getByText('#B1')).toBeTruthy();
  });
});

describe('BankAccountsScreen — filter chips', () => {
  it('shows All / Active / Inactive chips with counts', () => {
    renderScreen();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getAllByText('Active')[0]).toBeTruthy();
    expect(screen.getAllByText('Inactive')[0]).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy(); // All count
    expect(screen.getByText('2')).toBeTruthy(); // Active
    expect(screen.getByText('1')).toBeTruthy(); // Inactive
  });

  it('filters to Inactive, then Active, then back to All', () => {
    renderScreen();
    fireEvent.press(screen.getAllByText('Inactive')[0]);
    expect(screen.getByText('#B2')).toBeTruthy();
    expect(screen.queryByText('#B1')).toBeNull();
    expect(screen.queryByText('#B3')).toBeNull();

    fireEvent.press(screen.getAllByText('Active')[0]);
    expect(screen.queryByText('#B2')).toBeNull();
    expect(screen.getByText('#B1')).toBeTruthy();
    expect(screen.getByText('#B3')).toBeTruthy();

    fireEvent.press(screen.getByText('All'));
    expect(screen.getByText('#B2')).toBeTruthy();
    expect(screen.getByText('Showing 1 to 3 of 3 entries')).toBeTruthy();
  });

  it('counts reflect the store contents', () => {
    mockStore.bankAccounts = [BANK_ACCOUNTS[1]];
    renderScreen();
    // All = 1, Active = 0, Inactive = 1
    expect(screen.getAllByText('1').length).toBe(2);
    expect(screen.getByText('0')).toBeTruthy();
  });
});

describe('BankAccountsScreen — search', () => {
  const search = (q: string) => fireEvent.changeText(screen.getByPlaceholderText(SEARCH), q);

  it.each([
    ['holder', 'zoya', ['#B3']],
    ['account number', '99887766', ['#B2']],
    ['last four digits', '3333', ['#B1']],
    ['bank', 'hdfc', ['#B2']],
    ['branch', 'mg road', ['#B1']],
    ['city', 'chennai', ['#B3']],
    ['ifsc', 'sbin0001234', ['#B1']],
    ['id', 'b2', ['#B2']],
    ['status', 'inactive', ['#B2']],
    ['upi', 'ravi@sbi', ['#B1']],
    ['case-insensitively with padding', '  ICICI  ', ['#B3']],
  ])('matches by %s', (_label, query, expected) => {
    renderScreen();
    search(query);
    const all = ['#B1', '#B2', '#B3'];
    expected.forEach((id: string) => expect(screen.getByText(id)).toBeTruthy());
    all.filter((id) => !expected.includes(id)).forEach((id) => expect(screen.queryByText(id)).toBeNull());
  });

  it('shows the empty state for no match and recovers when cleared', () => {
    renderScreen();
    search('nomatchxyz');
    expect(screen.getByText('No records found.')).toBeTruthy();
    fireEvent.press(screen.getByText('close-circle'));
    expect(screen.queryByText('No records found.')).toBeNull();
    expect(screen.getByText('#B1')).toBeTruthy();
  });

  it('combines search with the status filter', () => {
    renderScreen();
    fireEvent.press(screen.getAllByText('Inactive')[0]);
    search('sbi');
    expect(screen.getByText('No records found.')).toBeTruthy();
    search('hdfc');
    expect(screen.getByText('#B2')).toBeTruthy();
  });

  it('does not throw on accounts with missing optional fields', () => {
    mockStore.bankAccounts = [{ BankAccountId: 'B9', Status: 'Active' }];
    renderScreen();
    search('anything');
    expect(screen.getByText('No records found.')).toBeTruthy();
  });
});

describe('BankAccountsScreen — permissions & navigation', () => {
  it('super admin sees Add, Edit and Delete', () => {
    renderScreen();
    expect(screen.getByText('Add Account')).toBeTruthy();
    expect(screen.getAllByLabelText('Edit')).toHaveLength(3);
    expect(screen.getAllByLabelText('Delete')).toHaveLength(3);
    expect(screen.getAllByLabelText('View Details')).toHaveLength(3);
  });

  it('non super admin only gets View Details', () => {
    mockAuthState.isSuperAdmin = false;
    renderScreen();
    expect(screen.queryByText('Add Account')).toBeNull();
    expect(screen.queryAllByLabelText('Edit')).toHaveLength(0);
    expect(screen.queryAllByLabelText('Delete')).toHaveLength(0);
    expect(screen.getAllByLabelText('View Details')).toHaveLength(3);
  });

  it('Add Account navigates to the form', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Add Account'));
    expect(mockRouter.push).toHaveBeenCalledWith('/bank-accounts/form');
  });

  it('Edit navigates to the form with the account id', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Edit')[1]);
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/bank-accounts/form',
      params: { accountId: 'B2' },
    });
  });

  it('pull-to-refresh syncs from the backend and resets the refreshing flag', async () => {
    renderScreen();
    const scroll = screen.UNSAFE_getAllByType(ScrollView).find((s) => s.props.refreshControl)!;
    await act(async () => {
      await scroll.props.refreshControl.props.onRefresh();
    });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
    const after = screen.UNSAFE_getAllByType(ScrollView).find((s) => s.props.refreshControl)!;
    expect(after.props.refreshControl.props.refreshing).toBe(false);
  });
});

describe('BankAccountsScreen — delete flow', () => {
  it('does not show the confirm dialog initially', () => {
    renderScreen();
    expect(screen.queryByText('Delete Bank Account')).toBeNull();
  });

  it('asks for confirmation naming the bank and account number', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[0]);
    expect(screen.getByText('Delete Bank Account')).toBeTruthy();
    expect(
      screen.getByText(
        'Are you sure you want to delete account "SBI" (111122223333)? This action cannot be undone.'
      )
    ).toBeTruthy();
    expect(mockStore.deleteBankAccount).not.toHaveBeenCalled();
  });

  it('deletes the right account on confirm, toasts and closes the dialog', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[1]);
    fireEvent.press(screen.getByText('Delete Account'));
    expect(mockStore.deleteBankAccount).toHaveBeenCalledTimes(1);
    expect(mockStore.deleteBankAccount).toHaveBeenCalledWith('B2', expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(screen.queryByText('Delete Bank Account')).toBeNull();
    // Toast only after the store confirms the delete
    expect(mockToast.danger).not.toHaveBeenCalled();

    const callbacks = mockStore.deleteBankAccount.mock.calls[0][1];
    act(() => callbacks.onSuccess());
    expect(mockToast.danger).toHaveBeenCalledWith('Bank account "HDFC" deleted successfully');
  });

  it('does not toast when the delete fails to save', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[1]);
    fireEvent.press(screen.getByText('Delete Account'));
    expect(mockStore.deleteBankAccount).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Delete Bank Account')).toBeNull();
    expect(mockToast.danger).not.toHaveBeenCalled();
  });

  it('Cancel closes the dialog without deleting', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[0]);
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete Bank Account')).toBeNull();
    expect(mockStore.deleteBankAccount).not.toHaveBeenCalled();
    expect(mockToast.danger).not.toHaveBeenCalled();
  });

  it('the dialog close icon also cancels', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[0]);
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Delete Bank Account')).toBeNull();
    expect(mockStore.deleteBankAccount).not.toHaveBeenCalled();
  });

  it('a second delete after cancelling targets the newly chosen account', () => {
    renderScreen();
    fireEvent.press(screen.getAllByLabelText('Delete')[0]);
    fireEvent.press(screen.getByText('Cancel'));
    fireEvent.press(screen.getAllByLabelText('Delete')[2]);
    fireEvent.press(screen.getByText('Delete Account'));
    expect(mockStore.deleteBankAccount).toHaveBeenCalledWith('B3', expect.objectContaining({ onSuccess: expect.any(Function) }));
  });
});

describe('BankAccountsScreen — detail modal', () => {
  it('is hidden until View Details is pressed', () => {
    renderScreen();
    expect(screen.queryByText('Details of bank account')).toBeNull();
  });

  it('shows the overview: bank, type, status, masked account number and customer', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getByText('Bank account')).toBeTruthy();
    expect(screen.getByText('Details of bank account')).toBeTruthy();
    expect(screen.getByText('Current account')).toBeTruthy();
    expect(screen.getByText('•••• 3333')).toBeTruthy();
    expect(screen.getByText('Holder: Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('RK')).toBeTruthy(); // initials
  });

  it('reveals and re-hides the account number with the eye toggle', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getAllByText('111122223333')).toHaveLength(1); // table only
    fireEvent.press(screen.getByLabelText('Toggle mask'));
    expect(screen.getAllByText('111122223333')).toHaveLength(2); // table + modal
    expect(screen.queryByText('•••• 3333')).toBeNull();
    fireEvent.press(screen.getByLabelText('Toggle mask'));
    expect(screen.getByText('•••• 3333')).toBeTruthy();
  });

  it('re-masks the number when a different account is opened', () => {
    renderScreen();
    openDetail(0);
    fireEvent.press(screen.getByLabelText('Toggle mask'));
    fireEvent.press(screen.getByLabelText('Back'));
    openDetail(0);
    expect(screen.getByText('•••• 3333')).toBeTruthy();
  });

  it('shows the loan limit card with utilisation percentage and amounts', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getByText('Loan limit')).toBeTruthy();
    expect(screen.getByText('40% used')).toBeTruthy();
    // each amount appears in the table row and in the modal
    expect(screen.getAllByText(inr(500000))).toHaveLength(2);
    expect(screen.getAllByText(inr(200000))).toHaveLength(2);
    expect(screen.getAllByText(inr(300000))).toHaveLength(2);
    expect(screen.getByText('Utilized is the sum of active loans on this account.')).toBeTruthy();
  });

  it('computes available from max - utilized when not provided, and 0% for no limit', () => {
    renderScreen();
    openDetail(1); // B2: 100000 max, 0 used
    expect(screen.getByText('0% used')).toBeTruthy();
    expect(screen.getAllByText(inr(100000)).length).toBe(4); // table max+available, modal max+available
    fireEvent.press(screen.getByLabelText('Back'));
    openDetail(2); // B3: no limits at all
    expect(screen.getByText('0% used')).toBeTruthy();
    expect(screen.getAllByText('₹0').length).toBeGreaterThanOrEqual(3);
  });

  it('caps utilisation at 100%', () => {
    mockStore.bankAccounts = [{ ...BANK_ACCOUNTS[0], UtilizedLoanAmount: 900000, AvailableLoanAmount: 0 }];
    renderScreen();
    openDetail(0);
    expect(screen.getByText('100% used')).toBeTruthy();
  });

  it('lists bank details with fallbacks for missing values', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getByText('MG Road Branch')).toBeTruthy();
    expect(screen.getAllByText('Bengaluru').length).toBe(2);
    expect(screen.getByText('SBIN0001234')).toBeTruthy();
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText('ravi@sbi')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Back'));
    openDetail(1); // B2 has no branch/city/ifsc/upi/type
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4 + 1); // 4 detail rows + table city
    expect(screen.getByText('Savings')).toBeTruthy();
    expect(screen.getByText('Savings account')).toBeTruthy();
  });

  it('falls back to the holder name and its initials when no customer record exists', () => {
    renderScreen();
    openDetail(1); // U2 not in users
    expect(screen.getByText('AS')).toBeTruthy();
    expect(screen.getAllByText('Anita Sharma').length).toBeGreaterThanOrEqual(2);
  });

  it('uses the customer record full name when present', () => {
    mockStore.users = [{ UserId: 'U1', FullName: 'Ravi K Official' }];
    renderScreen();
    openDetail(0);
    expect(screen.getByText('Ravi K Official')).toBeTruthy();
    expect(screen.getByText('RK')).toBeTruthy();
    expect(screen.getByText('Holder: Ravi Kumar')).toBeTruthy();
  });

  it('falls back to the "BA" initials when there is no name at all', () => {
    mockStore.bankAccounts = [{ BankAccountId: 'B8', UserId: 'UX', BankName: 'PNB', AccountNumber: '12', Status: 'Active', AccountHolderName: '' }];
    renderScreen();
    openDetail(0);
    expect(screen.getByText('BA')).toBeTruthy();
    expect(screen.getByText('Holder:')).toBeTruthy();
  });

  it('does not mask short account numbers', () => {
    renderScreen();
    openDetail(2); // B3 '1234'
    expect(screen.getAllByText('1234').length).toBe(2); // table + modal
  });

  it('lists active loans for the account (by account id or user) and excludes closed ones', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getByText('Active loans on this account')).toBeTruthy();
    expect(screen.getByText('LN-ONE')).toBeTruthy();
    expect(screen.getByText('LN-TWO')).toBeTruthy();
    expect(screen.queryByText('LN-CLOSED')).toBeNull();
    expect(screen.queryByText('LN-BYUSER')).toBeNull();
    expect(screen.getByText('₹50,000 · due 5 Jan 2030')).toBeTruthy();
    expect(screen.getByText('₹1.50 L · due 10 Feb 2030')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('matches loans through the user id when the account id differs', () => {
    renderScreen();
    openDetail(1); // B2/U2 -> L4
    expect(screen.getByText('LN-BYUSER')).toBeTruthy();
    expect(screen.queryByText('LN-ONE')).toBeNull();
  });

  it('shows the no-loans message when none match', () => {
    renderScreen();
    openDetail(2);
    expect(screen.getByText('No active loans on this account')).toBeTruthy();
  });

  it('passbook card previews the image when uploaded', () => {
    renderScreen();
    openDetail(0);
    expect(screen.getByText('Tap to view')).toBeTruthy();
    fireEvent.press(screen.getByText('Passbook image'));
    expect(screen.getByText('Passbook / Cheque Leaf Image')).toBeTruthy();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('passbook card toasts when nothing is uploaded', () => {
    renderScreen();
    openDetail(1);
    expect(screen.getByText('Not uploaded')).toBeTruthy();
    fireEvent.press(screen.getByText('Passbook image'));
    expect(mockToast.info).toHaveBeenCalledWith('No passbook image uploaded for this account');
    expect(screen.queryByText('Passbook / Cheque Leaf Image')).toBeNull();
  });

  it('Back closes the detail modal', () => {
    renderScreen();
    openDetail(0);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.queryByText('Details of bank account')).toBeNull();
  });

  it('hardware back (onRequestClose) closes the detail modal', () => {
    renderScreen();
    openDetail(0);
    const modals = screen.UNSAFE_getAllByType(require('react-native').Modal);
    const detail = modals.find((m) => m.props.presentationStyle === 'fullScreen')!;
    act(() => detail.props.onRequestClose());
    expect(screen.queryByText('Details of bank account')).toBeNull();
  });

  it('Edit account closes the modal and opens the form for that account', () => {
    renderScreen();
    openDetail(0);
    fireEvent.press(screen.getByText('Edit account'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/bank-accounts/form',
      params: { accountId: 'B1' },
    });
    expect(screen.queryByText('Details of bank account')).toBeNull();
  });

  it('hides the Edit account button in the detail modal for a non super admin', () => {
    mockAuthState.isSuperAdmin = false;
    renderScreen();
    openDetail(0);
    expect(screen.queryByText('Edit account')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('the detail view is scoped to the selected account only', () => {
    renderScreen();
    openDetail(0);
    const modalText = within(screen.getByText('Bank details').parent!.parent!);
    expect(modalText.queryByText('HDFC')).toBeNull();
  });
});
