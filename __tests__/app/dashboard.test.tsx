import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RefreshControl } from 'react-native';

let mockWidth = 400;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 800, scale: 1, fontScale: 1 }),
}));

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

let mockIsDark = false;
jest.mock('../../src/context/ThemeContext', () => {
  const theme = jest.requireActual('../../src/constants/theme');
  return {
    useTheme: () => ({
      isDark: mockIsDark,
      colors: mockIsDark ? theme.DarkColors : theme.LightColors,
    }),
  };
});

let mockAuth = { isSuperAdmin: true, isReadOnly: false };
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

jest.mock('../../src/components/Skeleton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Skeleton: () => React.createElement(View, { testID: 'skeleton' }) };
});

const baseStore = () => ({
  users: [{ UserId: 'U1' }, { UserId: 'U2' }, { UserId: 'U3' }] as any[],
  loans: [{ LoanId: 'L1' }] as any[],
  goldRates: {
    displayDate: '01 Oct 2026',
    gold22k: { rate1g: 8000, change: 50, direction: 'up' },
    gold24k: { rate1g: 8700, change: -20, direction: 'down' },
    gold18k: { rate1g: 6500, change: 10, direction: 'up' },
  } as any,
  dashboardData: {
    totalUsers: 3,
    totalBankAccounts: 2,
    activeLoans: 4,
    totalLoanAmount: 450000,
    totalEligibleLoanAmount: 600000,
    totalAvailableLoanAmount: 150000,
    pledgedGrams: 123.456,
    pledgedOrnamentsCount: 7,
    totalGoldWeight: 100,
    totalBuyingGoldValue: 700000,
  } as any,
  syncError: null as string | null,
  isSyncing: false,
  isFetchingGoldRates: false,
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  refreshGoldRates: jest.fn().mockResolvedValue(undefined),
});

let mockStore: ReturnType<typeof baseStore> = baseStore();
jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DashboardScreen = require('../../src/app/(tabs)/index').default;

beforeEach(() => {
  jest.clearAllMocks();
  mockWidth = 400;
  mockIsDark = false;
  mockAuth = { isSuperAdmin: true, isReadOnly: false };
  mockStore = baseStore();
});

const n = (v: number) => v.toLocaleString();

describe('DashboardScreen - gold rates', () => {
  it('shows the benchmark title, date and compact (mobile) rate cards', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Bangalore Live Gold Benchmark')).toBeTruthy();
    expect(screen.getByText('01 Oct 2026')).toBeTruthy();
    expect(screen.getByText('22K Standard (916)')).toBeTruthy();
    expect(screen.getByText('24K Pure (999)')).toBeTruthy();
    expect(screen.getByText('18K Gold (750)')).toBeTruthy();
    expect(screen.getByText('Primary')).toBeTruthy();
    expect(screen.getByText('99.9%')).toBeTruthy();
    expect(screen.getByText('75.0%')).toBeTruthy();
    expect(screen.getByText(`₹${n(8000)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(8700)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(6500)}`)).toBeTruthy();
    expect(screen.getByText(`8g Sovereign: ₹${n(64000)}`)).toBeTruthy();
    expect(screen.getByText(`8g: ₹${n(69600)}`)).toBeTruthy();
    expect(screen.getByText(`8g: ₹${n(52000)}`)).toBeTruthy();
  });

  it('shows rate change deltas with direction and sign', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('+₹50')).toBeTruthy();
    expect(screen.getByText('-₹20')).toBeTruthy();
    expect(screen.getByText('+₹10')).toBeTruthy();
    expect(screen.getByText('arrow-up')).toBeTruthy();
  });

  it('uses the arrow-down and remove icons for other 22k directions', () => {
    mockStore.goldRates.gold22k = { rate1g: 8000, change: -30, direction: 'down' };
    const { unmount } = render(<DashboardScreen />);
    expect(screen.getByText('arrow-down')).toBeTruthy();
    expect(screen.getByText('-₹30')).toBeTruthy();
    unmount();
    mockStore.goldRates.gold22k = { rate1g: 8000, change: 30, direction: 'flat' };
    render(<DashboardScreen />);
    expect(screen.getByText('remove')).toBeTruthy();
  });

  it('falls back to default rates and "Updated Today" when no live rates exist', () => {
    mockStore.goldRates = null;
    render(<DashboardScreen />);
    expect(screen.getByText('Updated Today')).toBeTruthy();
    expect(screen.getByText(`₹${n(8115)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(8850)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(6640)}`)).toBeTruthy();
    expect(screen.queryByText('arrow-up')).toBeNull();
  });

  it('renders the 3-column desktop layout with 22k featured', () => {
    mockWidth = 1200;
    render(<DashboardScreen />);
    expect(screen.getByText('22K Standard (916)')).toBeTruthy();
    expect(screen.getByText('24K Pure (999)')).toBeTruthy();
    expect(screen.getByText('18K Gold (750)')).toBeTruthy();
    expect(screen.getByText(`8g Sovereign: ₹${n(64000)}`)).toBeTruthy();
    expect(screen.getByText('+₹50')).toBeTruthy();
    expect(screen.getByText('-₹20')).toBeTruthy();
    expect(screen.getByText('+₹10')).toBeTruthy();
  });

  it('desktop layout falls back to defaults without change data', () => {
    mockWidth = 1200;
    mockStore.goldRates = null;
    render(<DashboardScreen />);
    expect(screen.getByText(`₹${n(8115)}`)).toBeTruthy();
    expect(screen.queryByText('arrow-up')).toBeNull();
  });

  it('tablet width also uses the non-compact rate layout', () => {
    mockWidth = 700;
    render(<DashboardScreen />);
    expect(screen.getByText('Gold Vault Valuation')).toBeTruthy();
    expect(screen.getByText('24K Pure (999)')).toBeTruthy();
  });

  it('Live Rates pill refreshes gold rates and toasts', async () => {
    render(<DashboardScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Live Rates'));
    });
    expect(mockToast.info).toHaveBeenCalledWith('Fetching live Bangalore gold rates...');
    expect(mockStore.refreshGoldRates).toHaveBeenCalledWith(true);
    expect(mockToast.success).toHaveBeenCalledWith('Gold rates updated.');
  });

  it('shows "Updating..." while fetching rates', () => {
    mockStore.isFetchingGoldRates = true;
    render(<DashboardScreen />);
    expect(screen.getByText('Updating...')).toBeTruthy();
    expect(screen.queryByText('Live Rates')).toBeNull();
  });
});

describe('DashboardScreen - valuation and metrics', () => {
  it('computes market value, acquisition cost and appreciation', () => {
    render(<DashboardScreen />);
    // 100g * 8000 = 800,000 ; cost 700,000 ; gain 100,000 (14.3%)
    expect(screen.getByText(`₹${n(800000)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(700000)}`)).toBeTruthy();
    expect(screen.getByText(`+₹${n(100000)}`)).toBeTruthy();
    expect(screen.getByText('100.00g net wt @ ₹8000/g')).toBeTruthy();
    expect(screen.getByText('+14.3% portfolio growth')).toBeTruthy();
    expect(screen.getByText('Current Market Value')).toBeTruthy();
    expect(screen.getByText('Total Acquisition Cost')).toBeTruthy();
    expect(screen.getByText('Appreciation Gains')).toBeTruthy();
  });

  it('shows 0.0% growth when there is no acquisition cost', () => {
    mockStore.dashboardData.totalBuyingGoldValue = 0;
    render(<DashboardScreen />);
    expect(screen.getByText('+0.0% portfolio growth')).toBeTruthy();
    expect(screen.getByText(`+₹${n(800000)}`)).toBeTruthy();
  });

  it('renders a negative appreciation (note: shows a "+" before "-₹")', () => {
    mockStore.dashboardData.totalBuyingGoldValue = 900000;
    render(<DashboardScreen />);
    expect(screen.getByText(`+-₹${n(100000)}`)).toBeTruthy();
    expect(screen.getByText('+-11.1% portfolio growth')).toBeTruthy();
  });

  it('renders each operational metric card from dashboardData', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Active Customers')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Bank Accounts')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('₹450k')).toBeTruthy();
    expect(screen.getByText('4 Active Loans')).toBeTruthy();
    expect(screen.getByText('123.5g')).toBeTruthy();
    expect(screen.getByText('7 Pledged Items')).toBeTruthy();
  });

  it('metric cards navigate to their tabs', () => {
    render(<DashboardScreen />);
    fireEvent.press(screen.getByText('Active Customers'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/users');
    fireEvent.press(screen.getByText('Bank Accounts'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/bank-accounts');
    fireEvent.press(screen.getByText('4 Active Loans'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/loans');
    fireEvent.press(screen.getByText('7 Pledged Items'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/ornaments');
    expect(mockRouter.push).toHaveBeenCalledTimes(4);
  });

  it('renders metric cards and actions on desktop', () => {
    mockWidth = 1280;
    render(<DashboardScreen />);
    expect(screen.getByText('Active Customers')).toBeTruthy();
    expect(screen.getByText('7 Pledged Items')).toBeTruthy();
    expect(screen.getByText('New Loan')).toBeTruthy();
  });

  it('shows bank limit utilization figures', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('75% Utilized')).toBeTruthy();
    expect(screen.getByText(`₹${n(450000)}`)).toBeTruthy();
    expect(screen.getByText(`₹${n(600000)}`)).toBeTruthy();
    expect(screen.getByText('Eligible Limit (75% LTV)')).toBeTruthy();
    expect(screen.getByText(`₹${n(150000)}`)).toBeTruthy();
  });

  it('caps utilization at 100% and shows 0% when no eligible limit', () => {
    mockStore.dashboardData.totalLoanAmount = 900000;
    const { unmount } = render(<DashboardScreen />);
    expect(screen.getByText('100% Utilized')).toBeTruthy();
    unmount();
    mockStore.dashboardData.totalEligibleLoanAmount = 0;
    render(<DashboardScreen />);
    expect(screen.getByText('0% Utilized')).toBeTruthy();
  });
});

describe('DashboardScreen - quick actions', () => {
  it('navigates to the right routes as super admin', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Disburse collateral')).toBeTruthy();
    expect(screen.queryByText('lock-closed')).toBeNull();

    fireEvent.press(screen.getByText('New Loan'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/loans/new');

    fireEvent.press(screen.getByText('Add Customer'));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/(tabs)/users', params: { action: 'add' } });

    fireEvent.press(screen.getByText('Pledge Gold'));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/(tabs)/ornaments', params: { action: 'add' } });

    fireEvent.press(screen.getByText('Settlements'));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/closure');
    expect(screen.getByText('Record settlement')).toBeTruthy();
    expect(mockToast.warning).not.toHaveBeenCalled();
    expect(screen.queryByText('Read-Only Mode')).toBeNull();
  });

  describe('when read-only', () => {
    beforeEach(() => {
      mockAuth = { isSuperAdmin: false, isReadOnly: true };
    });

    it('shows the read-only banner and lock icons', () => {
      render(<DashboardScreen />);
      expect(screen.getByText('Read-Only Mode')).toBeTruthy();
      expect(screen.getByText('eye')).toBeTruthy();
      expect(screen.getAllByText('lock-closed')).toHaveLength(3);
      expect(screen.getAllByText('Admin only')).toHaveLength(3);
      expect(screen.getByText('View closures')).toBeTruthy();
      expect(screen.queryByText('add-circle')).toBeNull();
    });

    it('blocks create actions with a warning toast and no navigation', () => {
      render(<DashboardScreen />);
      fireEvent.press(screen.getByText('New Loan'));
      fireEvent.press(screen.getByText('Add Customer'));
      fireEvent.press(screen.getByText('Pledge Gold'));
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockToast.warning).toHaveBeenCalledTimes(3);
      expect(mockToast.warning).toHaveBeenCalledWith(expect.stringContaining('Read-Only Mode'));
    });

    it('still allows viewing settlements and metric cards', () => {
      render(<DashboardScreen />);
      fireEvent.press(screen.getByText('View closures'));
      expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/closure');
      fireEvent.press(screen.getByText('Active Customers'));
      expect(mockRouter.push).toHaveBeenLastCalledWith('/(tabs)/users');
    });
  });
});

describe('DashboardScreen - refresh, loading and offline', () => {
  it('pull-to-refresh calls syncFromBackend(true) and resets refreshing', async () => {
    render(<DashboardScreen />);
    const rc = screen.UNSAFE_getByType(RefreshControl);
    expect(rc.props.refreshing).toBe(false);
    await act(async () => {
      await rc.props.onRefresh();
    });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  });

  it('shows the skeleton loader while the first sync runs with no cache', () => {
    mockStore.users = [];
    mockStore.loans = [];
    mockStore.isSyncing = true;
    render(<DashboardScreen />);
    expect(screen.getByText('Loading portfolio data from Google Sheets...')).toBeTruthy();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(5);
    expect(screen.queryByText('Quick Actions')).toBeNull();
    expect(screen.queryByText('Unable to Connect')).toBeNull();
  });

  it('desktop skeleton renders placeholders', () => {
    mockWidth = 1200;
    mockStore.users = [];
    mockStore.loans = [];
    mockStore.isSyncing = true;
    render(<DashboardScreen />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(5);
  });

  it('shows the empty offline state with default message and retry', () => {
    mockStore.users = [];
    mockStore.loans = [];
    render(<DashboardScreen />);
    expect(screen.getByText('Unable to Connect')).toBeTruthy();
    expect(
      screen.getByText('Could not reach Google Sheets. Please check your internet connection and tap retry.')
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Retry Connection'));
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Gold Vault Valuation')).toBeNull();
  });

  it('shows the store sync error in the empty offline state', () => {
    mockStore.users = [];
    mockStore.loans = [];
    mockStore.syncError = 'Network request failed';
    render(<DashboardScreen />);
    expect(screen.getByText('Network request failed')).toBeTruthy();
    // cached-data banner only appears when cached data exists
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('shows the cached-data offline banner with a working Retry', () => {
    mockStore.syncError = 'Offline - showing cached data';
    render(<DashboardScreen />);
    expect(screen.getByText('Offline - showing cached data')).toBeTruthy();
    expect(screen.getByText('cloud-offline-outline')).toBeTruthy();
    expect(screen.getByText('Gold Vault Valuation')).toBeTruthy();
    fireEvent.press(screen.getByText('Retry'));
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
  });

  it('does not show the offline banner when there is no error', () => {
    render(<DashboardScreen />);
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('keeps showing data (no skeleton) when syncing with cached data', () => {
    mockStore.isSyncing = true;
    render(<DashboardScreen />);
    expect(screen.queryByTestId('skeleton')).toBeNull();
    expect(screen.getByText('Operational Portfolio')).toBeTruthy();
  });

  it('renders as non-empty with only loans (no users)', () => {
    mockStore.users = [];
    render(<DashboardScreen />);
    expect(screen.queryByText('Unable to Connect')).toBeNull();
    expect(screen.getByText('Quick Actions')).toBeTruthy();
  });
});

describe('DashboardScreen - empty data and themes', () => {
  it('renders zeroed dashboard numbers without crashing', () => {
    mockStore.dashboardData = {
      totalUsers: 0, totalBankAccounts: 0, activeLoans: 0, totalLoanAmount: 0,
      totalEligibleLoanAmount: 0, totalAvailableLoanAmount: 0, pledgedGrams: 0,
      pledgedOrnamentsCount: 0, totalGoldWeight: 0, totalBuyingGoldValue: 0,
    };
    mockStore.goldRates = undefined;
    render(<DashboardScreen />);
    expect(screen.getByText('₹0k')).toBeTruthy();
    expect(screen.getByText('0 Active Loans')).toBeTruthy();
    expect(screen.getByText('0.0g')).toBeTruthy();
    expect(screen.getByText('0 Pledged Items')).toBeTruthy();
    expect(screen.getByText('0.00g net wt @ ₹8115/g')).toBeTruthy();
    expect(screen.getByText('0% Utilized')).toBeTruthy();
  });

  it('tolerates missing gold weight/value fields', () => {
    mockStore.dashboardData = { ...mockStore.dashboardData, totalGoldWeight: undefined, totalBuyingGoldValue: undefined };
    render(<DashboardScreen />);
    expect(screen.getByText('0.00g net wt @ ₹8000/g')).toBeTruthy();
  });

  it('renders in dark mode (all layouts)', () => {
    mockIsDark = true;
    const { unmount } = render(<DashboardScreen />);
    expect(screen.getByText('Quick Actions')).toBeTruthy();
    unmount();

    mockWidth = 1200;
    mockAuth = { isSuperAdmin: false, isReadOnly: true };
    mockStore.syncError = 'offline';
    const r2 = render(<DashboardScreen />);
    expect(screen.getByText('Read-Only Mode')).toBeTruthy();
    expect(screen.getByText('offline')).toBeTruthy();
    r2.unmount();

    mockStore.users = [];
    mockStore.loans = [];
    mockStore.isSyncing = true;
    const r3 = render(<DashboardScreen />);
    expect(screen.getByText('Loading portfolio data from Google Sheets...')).toBeTruthy();
    r3.unmount();
    mockStore.isSyncing = false;
    render(<DashboardScreen />);
    expect(screen.getByText('Unable to Connect')).toBeTruthy();
  });
});
