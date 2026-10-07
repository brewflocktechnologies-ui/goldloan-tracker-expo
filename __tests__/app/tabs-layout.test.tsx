import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockNav = { pathname: '/' };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockNav.pathname,
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'madhu' }, isSuperAdmin: true }),
}));

const mockSidebar = { collapsed: false, setCollapsed: jest.fn(), isDesktop: false };
jest.mock('../../src/context/SidebarContext', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
  useSidebar: () => mockSidebar,
}));

jest.mock('../../src/services/store', () => ({
  useAppStore: () => ({ goldRates: null, isSyncing: false, syncFromBackend: jest.fn() }),
}));

// Heavy children that are irrelevant to the layout's own behaviour.
jest.mock('../../src/components/ProfileModal', () => ({ ProfileModal: () => null }));
jest.mock('../../src/components/SidebarTrigger', () => ({ SidebarTrigger: () => null }));
jest.mock('../../src/components/ThemeToggleBtn', () => ({ ThemeToggleBtn: () => null }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TabLayout = require('../../src/app/(tabs)/_layout').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Env } = require('../../src/config/env');

const renderAt = (pathname: string) => {
  mockNav.pathname = pathname;
  return render(<TabLayout />);
};

// On mobile the shared top bar is the only place showing the brand name.
const hasTopBar = () => screen.queryByText(Env.APP_NAME) !== null;

beforeEach(() => {
  jest.clearAllMocks();
  mockSidebar.isDesktop = false;
  mockSidebar.collapsed = false;
});

describe('Tabs layout — mobile top bar', () => {
  it.each([
    ['/loans', 'Loans'],
    ['/users', 'Users'],
    ['/ornaments', 'Ornaments'],
    ['/menu', 'Menu'],
  ])('hides the top bar on the %s tab (%s)', (pathname) => {
    renderAt(pathname);
    expect(hasTopBar()).toBe(false);
  });

  it('hides the top bar on nested routes under those tabs', () => {
    renderAt('/(tabs)/loans');
    expect(hasTopBar()).toBe(false);
  });

  it.each([
    ['/', 'Dashboard'],
    ['/bank-accounts', 'Bank Accounts'],
    ['/closure', 'Closure'],
    ['/admin-users', 'Admin Users'],
  ])('keeps the top bar on the %s tab (%s)', (pathname) => {
    renderAt(pathname);
    expect(hasTopBar()).toBe(true);
    expect(screen.getByLabelText('Open user profile menu')).toBeTruthy();
  });
});

describe('Tabs layout — mobile bottom navigation', () => {
  it('shows the five bottom tabs', () => {
    renderAt('/users');
    ['Home', 'Users', 'Ornaments', 'Loans', 'Menu'].forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('navigates when a bottom tab is pressed', () => {
    renderAt('/');
    fireEvent.press(screen.getByText('Loans'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/loans');
    fireEvent.press(screen.getByText('Ornaments'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/ornaments');
    fireEvent.press(screen.getByText('Users'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/users');
  });

  it('goes home via the Home tab', () => {
    renderAt('/loans');
    fireEvent.press(screen.getByText('Home'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)');
  });

  it('navigates to the menu screen when Menu is pressed', () => {
    renderAt('/');
    fireEvent.press(screen.getByText('Menu'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/menu');
  });
});

describe('Tabs layout — desktop', () => {
  beforeEach(() => {
    mockSidebar.isDesktop = true;
  });

  it.each([
    ['/loans', 'Active Loans Portfolio'],
    ['/users', 'Customers & Borrowers'],
    ['/ornaments', 'Ornaments'],
    ['/', 'Financial Overview'],
  ])('keeps the page title bar on %s', (pathname, title) => {
    renderAt(pathname);
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    expect(screen.getByText('Sync Rates & Data')).toBeTruthy();
  });

  it('lists the sidebar navigation and does not render the mobile bottom bar', () => {
    renderAt('/loans');
    expect(screen.getByText('Bank Accounts')).toBeTruthy();
    expect(screen.getByText('Settlements')).toBeTruthy();
    expect(screen.getByText('Menu & Settings')).toBeTruthy();
  });
});
