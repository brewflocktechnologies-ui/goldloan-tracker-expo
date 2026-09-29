import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { User } from '../../src/types';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

let mockIsDark = false;
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: mockIsDark,
    colors: mockIsDark
      ? require('../../src/constants/theme').DarkColors
      : require('../../src/constants/theme').LightColors,
  }),
}));

let mockDims = { width: 800, height: 900, scale: 1, fontScale: 1 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDims,
}));

jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ isSuperAdmin: true }) }));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

jest.mock('../../src/services/api', () => ({
  getDriveImageUrl: jest.fn((id: string) => (id ? `https://drive.example/${id}` : '')),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const USER: User = {
  UserId: 'USR001',
  CustomerCode: 'CUST-101',
  FullName: 'Ravi Kumar',
  MobileNumber: '9876543210',
  Gender: 'Female',
  Occupation: 'Business',
  Status: 'Active',
} as User;

const mockStore: any = {
  users: [USER],
  loans: [],
  ornaments: [],
  bankAccounts: [],
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const UsersScreen = require('../../src/app/(tabs)/users').default;

const VARIANTS: [string, boolean, { width: number; height: number }][] = [
  ['light / regular', false, { width: 800, height: 900 }],
  ['dark / regular', true, { width: 800, height: 900 }],
  ['light / small + compact', false, { width: 360, height: 640 }],
  ['dark / small + compact', true, { width: 360, height: 640 }],
];

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDark = false;
  mockDims = { width: 800, height: 900, scale: 1, fontScale: 1 };
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (this: unknown, cb: any) {
    cb(0, 100, 40, 40);
  });
});
afterEach(() => jest.restoreAllMocks());

const applyVariant = (dark: boolean, dims: { width: number; height: number }) => {
  mockIsDark = dark;
  mockDims = { ...mockDims, ...dims };
};

const rootBackground = () => {
  const el = screen.UNSAFE_getAllByType(View).find(v => {
    const bg = StyleSheet.flatten(v.props.style)?.backgroundColor;
    return bg === '#090d16' || bg === '#d8edfa';
  });
  return StyleSheet.flatten(el!.props.style).backgroundColor;
};

describe.each(VARIANTS)('Users screens - %s', (_name, dark, dims) => {
  beforeEach(() => applyVariant(dark, dims));

  it('list renders the customer and the themed safe area', () => {
    render(<UsersScreen />);
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(rootBackground()).toBe(dark ? '#090d16' : '#d8edfa');
  });

  it('sort modal opens and closes through its close icon (list onClose)', () => {
    render(<UsersScreen />);
    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    expect(screen.getByText('Sort By')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Sort By')).toBeNull();
  });

  it('details switch tabs back to Profile and expose the menu actions', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    render(<UsersScreen />);
    fireEvent.press(screen.getByText('Ravi Kumar'));
    fireEvent.press(screen.getByText('Bank Accounts'));
    expect(screen.getByText('Bank Accounts (0)')).toBeTruthy();
    fireEvent.press(screen.getByText('Profile'));
    expect(screen.queryByText('Bank Accounts (0)')).toBeNull();

    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Call Customer'));
    expect(openURL).toHaveBeenCalledWith('tel:9876543210');

    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('WhatsApp Customer'));
    expect(openURL).toHaveBeenCalledWith('https://wa.me/919876543210');
    await waitFor(() => expect(mockToast.danger).not.toHaveBeenCalled());
  });

  it('form opens the State and Occupation pickers and closes them via the close icon', () => {
    render(<UsersScreen />);
    fireEvent.press(screen.getByLabelText('Add customer'));

    fireEvent.press(screen.getByText('Select state'));
    expect(screen.getByText('Select State')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Select State')).toBeNull();

    fireEvent.press(screen.getByText('Select occupation'));
    expect(screen.getByText('Select Occupation')).toBeTruthy();
    fireEvent.press(screen.getByText('Business'));
    expect(screen.queryByText('Select Occupation')).toBeNull();
    expect(screen.getByText('Business')).toBeTruthy();
  });
});
