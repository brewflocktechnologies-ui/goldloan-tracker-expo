import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ornament } from '../../src/types';

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
  getDriveImageUrl: jest.fn((id: string) => `https://drive.example/${id}`),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn(),
}));

const ORNAMENTS: Ornament[] = [
  {
    OrnamentId: 'ORN001',
    OrnamentName: 'Gold Necklace',
    OrnamentType: 'Traditional',
    OrnamentCategory: 'Necklace',
    Purity: '22K',
    GrossWeight: 20,
    NetWeight: 18,
    StoneWeight: 2,
    Quantity: 1,
    BuyingPricePerGram: 5000,
    BuyingCost: 90000,
    MarketValue: 99000,
    Status: 'Available',
    OrnamentImages: 'p1 | p2 | p3',
    UserId: 'USR1',
  } as Ornament,
];

const mockStore: any = {
  ornaments: ORNAMENTS,
  users: [{ UserId: 'USR1', FullName: 'Ravi Kumar', MobileNumber: '9876543210', City: 'Bengaluru' }],
  loans: [],
  goldRates: { gold22k: { rate1g: 5500 } },
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  refreshGoldRates: jest.fn(() => Promise.resolve()),
  addOrnament: jest.fn(),
  updateOrnament: jest.fn(),
  deleteOrnament: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrnamentsScreen = require('../../src/app/(tabs)/ornaments').default;

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

const rootBackground = () => {
  const el = screen.UNSAFE_getAllByType(View).find(v => {
    const bg = StyleSheet.flatten(v.props.style)?.backgroundColor;
    return bg === '#090d16' || bg === '#d8edfa';
  });
  return StyleSheet.flatten(el!.props.style).backgroundColor;
};

describe.each(VARIANTS)('Ornaments screens - %s', (_name, dark, dims) => {
  beforeEach(() => {
    mockIsDark = dark;
    mockDims = { ...mockDims, ...dims };
  });

  it('list renders themed and the sort modal closes through its close icon', () => {
    render(<OrnamentsScreen />);
    expect(screen.getByText('Gold Necklace')).toBeTruthy();
    expect(rootBackground()).toBe(dark ? '#090d16' : '#d8edfa');
    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    expect(screen.getByText('Sort By')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Sort By')).toBeNull();
  });

  it('details: pressing a thumbnail switches the main photo', () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Gold Necklace'));
    const mainUri = () => screen.UNSAFE_getAllByType(require('expo-image').Image).map(i => i.props.source?.uri);
    expect(mainUri()[0]).toBe('https://drive.example/p1');
    const thumbs = screen.UNSAFE_getAllByType(require('expo-image').Image).filter(i => i.props.source?.uri === 'https://drive.example/p3');
    fireEvent.press(thumbs[thumbs.length - 1]);
    expect(mainUri()[0]).toBe('https://drive.example/p3');
  });

  it('details: copying the id toasts, and writes to the clipboard on web', () => {
    const original = Platform.OS;
    const writeText = jest.fn();
    (Platform as any).OS = 'web';
    (globalThis as any).navigator = { clipboard: { writeText } };
    try {
      render(<OrnamentsScreen />);
      fireEvent.press(screen.getByText('Gold Necklace'));
      const ids = screen.getAllByText('ORN001');
      ids.forEach(el => fireEvent.press(el));
      expect(writeText).toHaveBeenCalledWith('ORN001');
      expect(mockToast.info).toHaveBeenCalledWith('Copied ID: ORN001');
    } finally {
      (Platform as any).OS = original;
      delete (globalThis as any).navigator;
    }
  });

  it('details menu: Copy Ornament ID toasts on native', async () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Gold Necklace'));
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Copy Ornament ID'));
    expect(mockToast.info).toHaveBeenCalledWith('Copied ID: ORN001');
  });

  it('wizard: category picker and customer picker close without selecting', async () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByLabelText('Add ornament'));

    fireEvent.press(screen.getByText('Necklace'));
    expect(screen.getByText('Select Category')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Select Category')).toBeNull();

    fireEvent.press(screen.getByText('Select Customer (Optional)'));
    expect(screen.getByText('Select Customer')).toBeTruthy();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Select Customer')).toBeNull();
    expect(screen.getByText('Select Customer (Optional)')).toBeTruthy();
    await act(async () => {});
  });
});
