import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors, toggleTheme: jest.fn() }),
}));

const mockAuth: any = {
  user: { username: 'madhu', role: 'SuperAdmin' },
  isSuperAdmin: true,
  logout: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const mockStore = { syncFromBackend: jest.fn().mockResolvedValue(undefined) };
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MobileMenuModal } = require('../../src/components/MobileMenuModal');

function setup(overrides: Record<string, unknown> = {}) {
  const props = { visible: true, onClose: jest.fn(), onOpenProfile: jest.fn(), ...overrides };
  render(<MobileMenuModal {...props} />);
  return props;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.isSuperAdmin = true;
  mockAuth.user = { username: 'madhu', role: 'SuperAdmin' };
});

describe('MobileMenuModal', () => {
  it('renders nothing when not visible', () => {
    setup({ visible: false });
    expect(screen.queryByText('Sign Out')).toBeNull();
  });

  it('shows the signed-in user and role', () => {
    setup();
    expect(screen.getByText('madhu')).toBeTruthy();
    expect(screen.getByText('MA')).toBeTruthy();
    expect(screen.getByText('SuperAdmin')).toBeTruthy();
  });

  it('labels non-super-admins as Read-Only', () => {
    mockAuth.isSuperAdmin = false;
    setup();
    expect(screen.getByText('Read-Only')).toBeTruthy();
  });

  it('does not list Bank Accounts or Loan Settlement & Closure (temporarily disabled)', () => {
    setup();
    expect(screen.queryByText('Bank Accounts')).toBeNull();
    expect(screen.queryByText('Loan Settlement & Closure')).toBeNull();
    expect(screen.queryByText('Settlements / Closure')).toBeNull();
  });

  it('lists the remaining menu items', () => {
    setup();
    expect(screen.getByText('Staff & Admin Accounts')).toBeTruthy();
    expect(screen.getByText('Sync Rates & Data')).toBeTruthy();
    expect(screen.getByText('Account Profile')).toBeTruthy();
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('hides Staff & Admin Accounts from non-super-admins', () => {
    mockAuth.isSuperAdmin = false;
    setup();
    expect(screen.queryByText('Staff & Admin Accounts')).toBeNull();
  });

  it('navigates to the admin users tab and closes the menu', () => {
    const props = setup();
    fireEvent.press(screen.getByText('Staff & Admin Accounts'));
    expect(props.onClose).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/admin-users');
  });

  it('syncs rates and data with progress toasts', async () => {
    setup();
    fireEvent.press(screen.getByText('Sync Rates & Data'));
    expect(mockToast.info).toHaveBeenCalledWith('Syncing rates & data...');
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Sync complete!'));
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
  });

  it('opens the profile modal and closes the menu', () => {
    const props = setup();
    fireEvent.press(screen.getByText('Account Profile'));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onOpenProfile).toHaveBeenCalled();
  });

  it('signs out and returns to the login screen', async () => {
    const props = setup();
    fireEvent.press(screen.getByText('Sign Out'));
    expect(props.onClose).toHaveBeenCalled();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(mockAuth.logout).toHaveBeenCalled();
  });
});
