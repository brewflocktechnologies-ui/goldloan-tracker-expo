import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, BackHandler } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
const mockParams: { userId?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));
jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ isSuperAdmin: true }) }));
const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const USERS = [
  { UserId: 'USR001', CustomerCode: 'CUST-101', FullName: 'Ravi Kumar', MobileNumber: '9876543210', Status: 'Active' },
  { UserId: 'USR002', CustomerCode: 'CUST-102', FullName: 'Anita Sharma', MobileNumber: '9000000002', Status: 'Active' },
  { UserId: 'USR003', CustomerCode: 'CUST-103', FullName: 'Zoya Khan', MobileNumber: '9000000003', Status: 'Inactive' },
];
const BANKS = [
  { BankAccountId: 'B1', UserId: 'USR001', BankName: 'SBI', AccountNumber: '111122223333', AccountType: 'Savings', Status: 'Active', MaxLoanAmount: 100000, UtilizedLoanAmount: 20000 },
  { BankAccountId: 'B2', UserId: 'USR001', BankName: 'HDFC Bank', AccountNumber: '444455556666', AccountType: 'Current', Status: 'Active', MaxLoanAmount: 200000, UtilizedLoanAmount: 0 },
  { BankAccountId: 'B3', UserId: 'USR001', BankName: 'Closed Bank', AccountNumber: '777788889999', Status: 'Inactive', MaxLoanAmount: 50000, UtilizedLoanAmount: 0 },
];
const ORNAMENTS = [
  { OrnamentId: 'ORN1', UserId: 'USR001', OrnamentName: 'Gold Chain', Purity: '22K', GrossWeight: 12, NetWeight: 11, MarketValue: 60000, Status: 'Available' },
];

const mockStore: any = {
  users: USERS,
  bankAccounts: BANKS,
  ornaments: ORNAMENTS,
  loans: [],
  addUser: jest.fn(),
  addBankAccount: jest.fn(),
  addOrnament: jest.fn(),
  addLoan: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NewLoanScreen = require('../../src/app/loans/new').default;

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.userId;
  mockRouter.canGoBack.mockReturnValue(true);
  mockStore.users = USERS;
  mockStore.bankAccounts = BANKS;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('NewLoanScreen — normal flow (no customer preset)', () => {
  it('starts at the customer step', () => {
    render(<NewLoanScreen />);
    expect(screen.getByText('Step 1 of 5 . Customer')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search existing customer...')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    // Inactive customers cannot be picked
    expect(screen.queryByText('Zoya Khan')).toBeNull();
  });

  it('cannot continue until a customer is chosen, then moves to the bank step', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 1 of 5 . Customer')).toBeTruthy();

    fireEvent.press(screen.getByText('Ravi Kumar'));
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
  });

  it('goes back from the bank step to the customer step', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByText('Ravi Kumar'));
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('Step 1 of 5 . Customer')).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('leaves the form from the first step', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('falls back to the loans tab when there is no history to go back to', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/loans');
  });
});

describe('NewLoanScreen — opened from a customer (userId preset)', () => {
  beforeEach(() => {
    mockParams.userId = 'USR001';
  });

  it('skips the customer step and lands on the bank step', () => {
    render(<NewLoanScreen />);
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Search existing customer...')).toBeNull();
    expect(screen.queryByText('Anita Sharma')).toBeNull();
  });

  it('shows the preset customer and their active bank accounts only', () => {
    render(<NewLoanScreen />);
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('SBI')).toBeTruthy();
    expect(screen.getByText('HDFC Bank')).toBeTruthy();
    expect(screen.queryByText('Closed Bank')).toBeNull();
  });

  it('pre-selects the first bank so Continue works straight away', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 3 of 5 . Customer')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(screen.getByText("Customer's ornaments are listed first")).toBeTruthy();
  });

  it('lets the user pick a different bank', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByText('HDFC Bank'));
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 3 of 5 . Customer')).toBeTruthy();
  });

  it('leaves the form (not the customer step) when going back from the first screen', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Search existing customer...')).toBeNull();
  });

  it('steps back to the bank step from ornaments, then leaves on the next back', () => {
    render(<NewLoanScreen />);
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 3 of 5 . Customer')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('handles the Android hardware back button the same way', () => {
    const handlers: Array<() => boolean> = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((_: string, cb: () => boolean) => {
      handlers.push(cb);
      return { remove: jest.fn() };
    }) as any);

    render(<NewLoanScreen />);
    const latest = () => handlers[handlers.length - 1];
    expect(latest()()).toBe(true);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('shows an empty message and blocks Continue when the customer has no active bank', () => {
    mockStore.bankAccounts = [];
    render(<NewLoanScreen />);
    expect(screen.getByText('No active bank accounts for this customer.')).toBeTruthy();
    fireEvent.press(screen.getByText('Continue'));
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();
  });

  it('resolves the preset customer by id even for an inactive customer', () => {
    mockParams.userId = 'USR003';
    render(<NewLoanScreen />);
    expect(screen.getByText('Step 2 of 5 . Customer')).toBeTruthy();
    expect(screen.getByText('Zoya Khan')).toBeTruthy();
  });

  it('falls back to the customer step when the preset customer does not exist', () => {
    mockParams.userId = 'NOPE';
    render(<NewLoanScreen />);
    expect(screen.getByText('Step 1 of 5 . Customer')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search existing customer...')).toBeTruthy();
  });
});
