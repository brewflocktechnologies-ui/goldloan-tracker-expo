import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Ornament } from '../../src/types';
import { LightColors } from '../../src/constants/theme';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

// Mutable so individual tests can flip the role without re-mocking the module.
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
  getDriveImageUrl: jest.fn((id: string) => `https://drive.example/${id}`),
}));

const SINGLE_PHOTO_ORNAMENT: Ornament = {
  OrnamentId: 'ORN010',
  OrnamentName: 'Heritage Necklace',
  OrnamentType: 'Traditional',
  OrnamentCategory: 'Necklace',
  Description: 'A fine antique necklace',
  GrossWeight: 25,
  NetWeight: 22,
  MetalWeight: 22,
  StoneWeight: 3,
  Purity: '22K',
  HallmarkNumber: 'HM/C-100',
  Quantity: 2,
  BuyingPricePerGram: 5000,
  CurrentPricePerGram: 5600,
  BuyingCost: 110000,
  TotalPrice: 123200,
  MarketValue: 123200,
  AppreciationValue: 13200,
  AppreciationPercentage: 12,
  MakerName: 'Tanishq',
  EstimatedValue: 120000,
  OrnamentImages: '',
  Remarks: 'Kept safely',
  Status: 'Available',
  UserId: '',
} as Ornament;

const GALLERY_ORNAMENT: Ornament = {
  ...SINGLE_PHOTO_ORNAMENT,
  OrnamentId: 'ORN011',
  OrnamentName: 'Twin Bangles',
  OrnamentImages: 'img1.jpg | img2.jpg',
} as Ornament;

const mockStore = {
  ornaments: [SINGLE_PHOTO_ORNAMENT, GALLERY_ORNAMENT],
  users: [],
  loans: [],
  goldRates: { gold22k: { rate1g: 5500 } },
  syncFromBackend: jest.fn(),
  refreshGoldRates: jest.fn(() => Promise.resolve()),
  addOrnament: jest.fn(),
  updateOrnament: jest.fn(),
  deleteOrnament: jest.fn(),
};

jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrnamentsScreen = require('../../src/app/(tabs)/ornaments').default;

beforeEach(() => {
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
    this: unknown,
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    callback(0, 100, 40, 40);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  mockAuthState.isSuperAdmin = true;
  mockToast.success.mockClear();
  mockToast.danger.mockClear();
  mockToast.info.mockClear();
  mockStore.deleteOrnament.mockClear();
  mockStore.updateOrnament.mockClear();
});

function openDetails(ornamentName: string) {
  render(<OrnamentsScreen />);
  fireEvent.press(screen.getByText(ornamentName));
}

describe('OrnamentsScreen (details view)', () => {
  it('renders header, title, status and every info card with correct values', () => {
    openDetails('Heritage Necklace');

    expect(screen.getByText('Ornaments Details')).toBeTruthy();
    expect(screen.getByText('Heritage Necklace')).toBeTruthy();
    // Appears twice: the title's copy-id row, and the "Ornament ID" row in the info card.
    expect(screen.getAllByText('ORN010')).toHaveLength(2);
    expect(screen.getByText('Available')).toBeTruthy();

    // Weight Details — Net weight and Metal Weight are both 22 in this fixture.
    expect(screen.getAllByText('22.000 g')).toHaveLength(2);
    expect(screen.getByText('25.000 g')).toBeTruthy(); // Gross Weight
    expect(screen.getByText('3.000 g')).toBeTruthy(); // Stone Weight
    // Quantity is shown twice: the Weight Details header badge, and the info card row.
    expect(screen.getAllByText('2')).toHaveLength(2);

    // Purity & Hallmark (defaults for AssayCenter/YearOfMarking are applied when unset)
    expect(screen.getByText('22K (91.6%)')).toBeTruthy();
    expect(screen.getByText('HM/C-100')).toBeTruthy();
    expect(screen.getByText('Bangalore')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();

    // Valuation
    expect(screen.getByText('₹ 5,000')).toBeTruthy(); // Buying Price / g
    expect(screen.getByText('₹ 1,10,000')).toBeTruthy(); // Total Buying Price (BuyingCost)
    expect(screen.getByText('₹ 1,20,000')).toBeTruthy(); // Estimated Value
    expect(screen.getByText('₹ 1,23,200')).toBeTruthy(); // Market Value
    expect(screen.getByText('₹ 1,21,000')).toBeTruthy(); // Live Value Today (22g * 5500 live rate)
    expect(screen.getByText('₹ 13,200')).toBeTruthy(); // Appreciation value
    expect(screen.getByText('(+12.00%)')).toBeTruthy();

    // Ornament Information
    expect(screen.getByText('Traditional')).toBeTruthy();
    expect(screen.getByText('Necklace')).toBeTruthy();
    expect(screen.getByText('Tanishq')).toBeTruthy();
    expect(screen.getByText('A fine antique necklace')).toBeTruthy();
    expect(screen.getByText('Kept safely')).toBeTruthy();
  });

  it('shows the "no photos" state and an Upload Photo action when there are no images', () => {
    openDetails('Heritage Necklace');

    expect(screen.getByText('No photos linked from Code.gs')).toBeTruthy();
    expect(screen.getByText('Upload Photo')).toBeTruthy();
  });

  it('shows the multi-photo gallery with nav arrows and Add Photos when images exist', () => {
    openDetails('Twin Bangles');

    expect(screen.queryByText('No photos linked from Code.gs')).toBeNull();
    expect(screen.getByText('Add Photos')).toBeTruthy();
    expect(screen.getByText('chevron-back')).toBeTruthy();
    expect(screen.getByText('chevron-forward')).toBeTruthy();
  });

  it('copies the ornament id and shows a toast', () => {
    openDetails('Heritage Necklace');

    // The first match is the title's copy-id row (a touchable); the second is the
    // read-only "Ornament ID" row further down the info card.
    fireEvent.press(screen.getAllByText('ORN010')[0]);
    expect(mockToast.info).toHaveBeenCalledWith('Copied ID: ORN010');
  });

  it('navigates back to the list view from the details header', () => {
    openDetails('Heritage Necklace');

    fireEvent.press(screen.getByLabelText('Go back to list'));
    expect(screen.getByText('Ornaments')).toBeTruthy();
  });

  it('hides Edit/Delete for a non super-admin and only offers Copy Ornament ID', async () => {
    mockAuthState.isSuperAdmin = false;
    openDetails('Heritage Necklace');

    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Copy Ornament ID')).toBeTruthy());
    expect(screen.queryByText('Edit Ornament')).toBeNull();
    expect(screen.queryByText('Delete Ornament')).toBeNull();
  });

  it('opens the Edit wizard prefilled from the selected ornament', async () => {
    openDetails('Heritage Necklace');

    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Edit Ornament')).toBeTruthy());
    fireEvent.press(screen.getByText('Edit Ornament'));

    expect(screen.getByText('Edit Ornament')).toBeTruthy(); // wizard header title
    expect(screen.getByDisplayValue('Heritage Necklace')).toBeTruthy();
  });

  it('deletes the ornament after confirming and returns to the list', async () => {
    openDetails('Heritage Necklace');

    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Delete Ornament')).toBeTruthy());
    fireEvent.press(screen.getByText('Delete Ornament'));

    expect(
      screen.getByText('Are you sure you want to delete "Heritage Necklace" (ORN010)? This action cannot be undone.')
    ).toBeTruthy();

    // The confirm button's icon is "trash" (the menu item / header use "trash-outline"),
    // so this presses the modal's confirm action unambiguously.
    fireEvent.press(screen.getByText('trash'));

    expect(mockStore.deleteOrnament).toHaveBeenCalledWith('ORN010');
    expect(mockToast.danger).toHaveBeenCalledWith('Ornament "Heritage Necklace" deleted');
    expect(screen.getByText('Ornaments')).toBeTruthy();
  });

  it('cancels the delete confirmation without deleting', async () => {
    openDetails('Heritage Necklace');

    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Delete Ornament')).toBeTruthy());
    fireEvent.press(screen.getByText('Delete Ornament'));

    fireEvent.press(screen.getByText('Cancel'));

    expect(mockStore.deleteOrnament).not.toHaveBeenCalled();
    expect(screen.getByText('Ornaments Details')).toBeTruthy();
  });
});
