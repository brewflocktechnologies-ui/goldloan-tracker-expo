import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockLogout = jest.fn().mockResolvedValue(undefined);
let mockIsSuperAdmin = true;
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'ramesh', role: mockIsSuperAdmin ? 'SuperAdmin' : 'User' },
    isSuperAdmin: mockIsSuperAdmin,
    logout: mockLogout,
  }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const mockToast = { info: jest.fn(), success: jest.fn(), danger: jest.fn(), warning: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

jest.mock('../../src/components/ThemeToggleBtn', () => ({ ThemeToggleBtn: () => null }));

const mockStore = {
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  isSyncing: false,
};
const mockGetSyncError = jest.fn<string | null, []>(() => null);
jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
  getSyncError: () => mockGetSyncError(),
}));

jest.mock('../../src/services/api', () => ({ api: { changePassword: jest.fn() } }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ProfileModal } = require('../../src/components/ProfileModal');

const renderModal = (onClose = jest.fn()) => {
  render(<ProfileModal visible onClose={onClose} />);
  return onClose;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsSuperAdmin = true;
  mockStore.isSyncing = false;
  mockGetSyncError.mockReturnValue(null);
});

describe('ProfileModal — Sync Portfolio Data', () => {
  it('forces a sync from the sheet and confirms with a success toast', async () => {
    renderModal();
    fireEvent.press(screen.getByText('Sync Portfolio Data'));

    await waitFor(() => expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true));
    await waitFor(() =>
      expect(mockToast.success).toHaveBeenCalledWith('Portfolio data synced from Google Sheets.')
    );
    expect(mockToast.danger).not.toHaveBeenCalled();
  });

  it('shows the error instead of a success toast when the sync only served offline data', async () => {
    mockGetSyncError.mockReturnValue('Could not reach Google Sheets. Showing offline data.');
    renderModal();
    fireEvent.press(screen.getByText('Sync Portfolio Data'));

    await waitFor(() =>
      expect(mockToast.danger).toHaveBeenCalledWith('Could not reach Google Sheets. Showing offline data.')
    );
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('waits for the sync to finish before reporting the result', async () => {
    let finish: () => void = () => {};
    mockStore.syncFromBackend.mockReturnValueOnce(new Promise<void>(r => { finish = r; }));
    renderModal();
    fireEvent.press(screen.getByText('Sync Portfolio Data'));

    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.danger).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('shows progress text while a sync is running', () => {
    mockStore.isSyncing = true;
    renderModal();
    expect(screen.getByText('Synchronizing latest data...')).toBeTruthy();
  });

  it('shows the idle description when not syncing', () => {
    renderModal();
    expect(screen.getByText('Refresh gold rates & active records')).toBeTruthy();
  });
});

describe('ProfileModal — account menu', () => {
  it('shows the user and their role', () => {
    renderModal();
    expect(screen.getByText('ramesh')).toBeTruthy();
    expect(screen.getByText('SuperAdmin (Full Access)')).toBeTruthy();
  });

  it('labels a non-admin as read-only and shows the staff directory entry', () => {
    mockIsSuperAdmin = false;
    renderModal();
    expect(screen.getByText('User (Read-Only)')).toBeTruthy();
    expect(screen.getByText('Staff Accounts')).toBeTruthy();
  });

  it('opens the admin users screen and closes the modal', () => {
    const onClose = renderModal();
    fireEvent.press(screen.getByText('Manage Admin Users'));
    expect(onClose).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/admin-users');
  });
});
