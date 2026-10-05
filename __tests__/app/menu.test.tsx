import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/(tabs)/menu',
}));

const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'ramesh', role: 'SuperAdmin' },
    isSuperAdmin: true,
    logout: mockLogout,
  }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: require('../../src/constants/theme').LightColors,
  }),
}));

const mockToast = {
  info: jest.fn(),
  success: jest.fn(),
  danger: jest.fn(),
  warning: jest.fn(),
};
jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const mockStore = {
  loans: [
    { LoanId: 'L001', LoanAmount: 150000, LoanStatus: 'Active', BankName: 'Canara Bank', InterestRate: 12, DueDate: '2026-12-31' },
    { LoanId: 'L002', LoanAmount: 200000, LoanStatus: 'Active', BankName: 'State Bank of India', InterestRate: 10, DueDate: '2026-11-30' },
  ],
  payments: [
    { PaymentId: 'P001', LoanId: 'L001', TotalPaidAmount: 12000, PaymentDate: new Date().toISOString() },
  ],
  dashboardData: {
    totalLoanAmount: 350000,
    totalGoldWeight: 50,
  },
  goldRates: {
    updatedAt: new Date().toISOString(),
    gold24k: { rate1g: 11840 },
    gold22k: { rate1g: 10853 },
    gold18k: { rate1g: 8880 },
  },
  refreshGoldRates: jest.fn().mockResolvedValue({}),
  syncFromBackend: jest.fn().mockResolvedValue({}),
  isFetchingGoldRates: false,
  lastSyncedAt: '12:00 PM',
};

jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// Mock ProfileModal to keep test lightweight
jest.mock('../../src/components/ProfileModal', () => ({
  ProfileModal: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MenuScreen = require('../../src/app/(tabs)/menu').default;

describe('MenuScreen UI and Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main menu with user profile card, section titles, and action items', () => {
    render(<MenuScreen />);

    expect(screen.getByText('Menu')).toBeTruthy();
    expect(screen.getByText('Quick access to all features')).toBeTruthy();
    expect(screen.getByText('Ramesh')).toBeTruthy();
    expect(screen.getByText('Owner of Gold Loan Business')).toBeTruthy();

    expect(screen.getByText('INSIGHTS & REPORTS')).toBeTruthy();
    expect(screen.getByText('Reports')).toBeTruthy();
    expect(screen.getByText('Gold Rates')).toBeTruthy();

    expect(screen.getByText('SETTINGS & SUPPORT')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Help & Support')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
  });

  it('navigates to Reports view and displays calculated loan metrics and bank exposure', () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('Reports'));

    expect(screen.getByText('Principal outstanding')).toBeTruthy();
    expect(screen.getByText('Interest receivable')).toBeTruthy();
    expect(screen.getByText('Loans by status')).toBeTruthy();
    expect(screen.getByText('Active exposure by bank')).toBeTruthy();
    expect(screen.getByText('Canara Bank')).toBeTruthy();

    // Can go back to main menu
    fireEvent.press(screen.getByTestId('menu-back-btn'));
  });

  it('navigates to Gold Rates view, shows 24K, 22K and 18K benchmark cards, and can refresh', async () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('Gold Rates'));

    expect(screen.getByText('24K')).toBeTruthy();
    expect(screen.getByText('22K')).toBeTruthy();
    expect(screen.getByText('18K')).toBeTruthy();
    expect(screen.getByText('91.6% · used for valuation')).toBeTruthy();

    const refreshBtn = screen.getByText('Refresh rates');
    fireEvent.press(refreshBtn);

    expect(mockStore.refreshGoldRates).toHaveBeenCalled();
  });

  it('navigates to Settings view, renders security and sync options', () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('Settings'));

    expect(screen.getByText('Fingerprint unlock')).toBeTruthy();
    expect(screen.getByText('Due date reminders')).toBeTruthy();
    expect(screen.getByText('Sync automatically')).toBeTruthy();
    expect(screen.getByText('Sync now')).toBeTruthy();
  });

  it('navigates to Help & Support view, and toggles FAQ accordion item', () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('Help & Support'));

    expect(screen.getByText('Frequently asked')).toBeTruthy();
    const question = screen.getByText('How is net disbursement calculated?');
    expect(question).toBeTruthy();

    fireEvent.press(question);
    expect(screen.getByText(/administrative charges/)).toBeTruthy();

    expect(screen.getByText('Call')).toBeTruthy();
    expect(screen.getByText('WhatsApp')).toBeTruthy();
  });

  it('navigates to About view, displaying app title and description', () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('About'));

    expect(screen.getByText('Gold Loan Tracker')).toBeTruthy();
    expect(screen.getByText('Version 1.0.0')).toBeTruthy();
    expect(screen.getByText(/Gold Loan Tracker is a simple and powerful application/)).toBeTruthy();
  });

  it('opens the Logout confirmation modal when clicking Logout card, and signs out when confirmed', async () => {
    render(<MenuScreen />);

    fireEvent.press(screen.getByText('Logout'));

    expect(screen.getByText('Logout?')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to sign out from this device?')).toBeTruthy();
    expect(screen.getByText('You will need to log in again to access your account.')).toBeTruthy();

    // Confirm Logout
    const confirmLogoutButtons = screen.getAllByText('Logout');
    const modalConfirmBtn = confirmLogoutButtons[confirmLogoutButtons.length - 1];
    fireEvent.press(modalConfirmBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });
});
