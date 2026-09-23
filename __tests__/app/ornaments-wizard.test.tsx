import React from 'react';
import { Alert, View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Ornament } from '../../src/types';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ isSuperAdmin: true }),
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

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn(),
}));

const EXISTING_ORNAMENT: Ornament = {
  OrnamentId: 'ORN020',
  OrnamentName: 'Classic Chain',
  OrnamentType: 'Traditional',
  OrnamentCategory: 'Necklace',
  Description: '',
  GrossWeight: 12,
  NetWeight: 12,
  MetalWeight: 12,
  StoneWeight: 0,
  Purity: '22K',
  HallmarkNumber: 'HM-020',
  Quantity: 1,
  BuyingPricePerGram: 5200,
  CurrentPricePerGram: 5500,
  BuyingCost: 62400,
  MarketValue: 66600,
  MakerName: 'Kalyan',
  OrnamentImages: '',
  Remarks: '',
  Status: 'Available',
  UserId: '',
} as Ornament;

const mockStore = {
  ornaments: [EXISTING_ORNAMENT],
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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImagePicker = require('expo-image-picker');

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  // The options menu positions itself off of the trigger's measured layout, which
  // the test renderer never actually lays out — stub it to fire synchronously.
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
    this: unknown,
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    callback(0, 100, 40, 40);
  });
});

afterEach(() => {
  alertSpy.mockRestore();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function openAddWizard() {
  render(<OrnamentsScreen />);
  fireEvent.press(screen.getByLabelText('Add ornament'));
}

function fillStep1AndAdvance(name = 'Test Bangle') {
  fireEvent.changeText(screen.getByPlaceholderText('e.g. Gold Necklace'), name);
  fireEvent.press(screen.getByText('Next →'));
}

function fillStep2AndAdvance(grossWeight = '10') {
  fireEvent.changeText(
    screen.getAllByPlaceholderText('0.000')[0], // Gross Weight is the first unit input
    grossWeight
  );
  fireEvent.press(screen.getByText('Next →'));
}

describe('OrnamentsScreen (add wizard)', () => {
  it('opens on step 1 (Basic Details) from the FAB with empty fields', () => {
    openAddWizard();

    expect(screen.getByText('Add ornaments')).toBeTruthy();
    expect(screen.getByText('Basic Information')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Gold Necklace').props.value).toBe('');
  });

  it('blocks advancing past step 1 without an Ornament Name', () => {
    openAddWizard();
    fireEvent.press(screen.getByText('Next →'));

    expect(alertSpy).toHaveBeenCalledWith('Required Field', 'Please enter Ornament Name.');
    expect(screen.getByText('Basic Information')).toBeTruthy(); // still on step 1
  });

  it('lets the user pick Type, Category and Purity from their dropdowns', () => {
    openAddWizard();

    fireEvent.press(screen.getByText('Traditional')); // default Type value, opens "Select Type"
    expect(screen.getByText('Select Type')).toBeTruthy();
    fireEvent.press(screen.getByText('Bridal'));
    expect(screen.getByText('Bridal')).toBeTruthy();

    fireEvent.press(screen.getByText('Necklace')); // default Category value, opens "Select Category"
    expect(screen.getByText('Select Category')).toBeTruthy();
    fireEvent.press(screen.getByText('Ring'));
    expect(screen.getByText('Ring')).toBeTruthy();

    fireEvent.press(screen.getByText('22karate (91.6%)')); // default Purity value
    expect(screen.getByText('Select Purity')).toBeTruthy();
    fireEvent.press(screen.getByText('24karate (99.9%)'));
    expect(screen.getByText('24karate (99.9%)')).toBeTruthy();
  });

  it('advances to step 2 (Weight & Valuation) once a name is entered', () => {
    openAddWizard();
    fillStep1AndAdvance();

    expect(screen.getByText('Weight Details')).toBeTruthy();
    expect(screen.queryByText('Basic Information')).toBeNull();
  });

  it('blocks advancing past step 2 without a positive Gross Weight', () => {
    openAddWizard();
    fillStep1AndAdvance();
    fireEvent.press(screen.getByText('Next →'));

    expect(alertSpy).toHaveBeenCalledWith('Invalid Weight', 'Gross Weight must be greater than 0 grams.');
    expect(screen.getByText('Weight Details')).toBeTruthy(); // still on step 2
  });

  it('auto-calculates Net Weight and the valuation tiles from Gross Weight and the live rate', () => {
    openAddWizard();
    fillStep1AndAdvance();
    fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[0], '10');

    // net = 10 - 0(stone) = 10; buyRate defaults to the live rate (5500), so Total Buying
    // Value and Current Gold Value (Live) both land on the same figure.
    expect(screen.getAllByText('10.000')).toHaveLength(2); // Metal Weight + Net Weight (readonly)
    expect(screen.getAllByText('₹ 55,000')).toHaveLength(2);
    expect(screen.getByText('₹ 58,724')).toBeTruthy(); // Market Value = round(10 * 5500 * 1.0677)
    expect(screen.getByText('↗ ₹ 3,724 (+6.77%)')).toBeTruthy(); // Appreciation
  });

  it('advances to step 3 (Photos) once Gross Weight is set', () => {
    openAddWizard();
    fillStep1AndAdvance();
    fillStep2AndAdvance('10');

    expect(screen.getByText('Ornament Photos')).toBeTruthy();
    expect(screen.queryByText('Weight Details')).toBeNull();
  });

  it('adds a photo via the image picker and can remove it again', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo1.jpg' }],
    });

    openAddWizard();
    fillStep1AndAdvance();
    fillStep2AndAdvance('10');

    fireEvent.press(screen.getByText('Add Photo'));
    await waitFor(() => expect(screen.getByText('close')).toBeTruthy()); // the photo's remove button

    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('close')).toBeNull();
  });

  it('navigates back a step at a time, and back to the list from step 1', () => {
    openAddWizard();
    fillStep1AndAdvance();
    fillStep2AndAdvance('10');
    expect(screen.getByText('Ornament Photos')).toBeTruthy();

    fireEvent.press(screen.getByText('← Back'));
    expect(screen.getByText('Weight Details')).toBeTruthy();

    fireEvent.press(screen.getByText('← Back'));
    expect(screen.getByText('Basic Information')).toBeTruthy();

    fireEvent.press(screen.getByText('arrow-back'));
    expect(screen.getByText('Ornaments')).toBeTruthy(); // back on the list screen
  });

  it('saves a new ornament with the expected payload and returns to the list', () => {
    openAddWizard();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Gold Necklace'), 'Test Bangle');
    // Type/Category are stored swapped into OrnamentType/OrnamentCategory on save
    // (this mirrors the existing handleEditPress prefill logic) — Type='Bridal', Category='Ring'.
    fireEvent.press(screen.getByText('Traditional'));
    fireEvent.press(screen.getByText('Bridal'));
    fireEvent.press(screen.getByText('Necklace'));
    fireEvent.press(screen.getByText('Ring'));
    fireEvent.press(screen.getByText('22karate (91.6%)'));
    fireEvent.press(screen.getByText('24karate (99.9%)'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tanishq'), 'Test Maker');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. HM/C-7452/2024'), 'HM/TEST/1');
    fireEvent.press(screen.getByText('Next →'));

    fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[0], '10');
    fireEvent.press(screen.getByText('Next →'));

    fireEvent.changeText(
      screen.getByPlaceholderText('Traditional gold necklace with ruby stones.'),
      'A lovely bangle'
    );
    fireEvent.changeText(screen.getByPlaceholderText('No additional remarks.'), 'Handle with care');
    fireEvent.press(screen.getByText('Available')); // Status dropdown, opens "Select Status"
    fireEvent.press(screen.getByText('Pledged'));

    fireEvent.press(screen.getByText('Save Ornaments'));

    expect(mockStore.addOrnament).toHaveBeenCalledWith(
      expect.objectContaining({
        OrnamentName: 'Test Bangle',
        OrnamentType: 'Ring', // swapped: comes from the Category field
        OrnamentCategory: 'Bridal', // swapped: comes from the Type field
        Purity: '24K',
        GrossWeight: 10,
        StoneWeight: 0,
        NetWeight: 10,
        BuyingPricePerGram: 5500,
        BuyingCost: 55000,
        MarketValue: 58724,
        HallmarkNumber: 'HM/TEST/1',
        MakerName: 'Test Maker',
        Description: 'A lovely bangle',
        Remarks: 'Handle with care',
        Status: 'Pledged',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith('Ornament "Test Bangle" added to vault');
    expect(screen.getByText('Ornaments')).toBeTruthy(); // back on the list screen
  });
});

describe('OrnamentsScreen (edit wizard)', () => {
  async function openEditWizard() {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Classic Chain'));
    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Edit Ornament')).toBeTruthy());
    fireEvent.press(screen.getByText('Edit Ornament'));
  }

  it('prefills the form from the selected ornament (Type/Category shown swapped, matching existing prefill logic)', async () => {
    await openEditWizard();

    expect(screen.getByText('Edit Ornament')).toBeTruthy();
    expect(screen.getByDisplayValue('Classic Chain')).toBeTruthy();
    expect(screen.getByDisplayValue('HM-020')).toBeTruthy();
    expect(screen.getByDisplayValue('Kalyan')).toBeTruthy();
    // handleEditPress swaps OrnamentType/OrnamentCategory the same way handleSaveForm does,
    // so the Type dropdown shows the original Category ("Necklace") and vice versa.
    expect(screen.getByText('Necklace')).toBeTruthy();
    expect(screen.getByText('Traditional')).toBeTruthy();
  });

  it('saves the edited ornament via updateOrnament and returns to the details view', async () => {
    await openEditWizard();

    fireEvent.changeText(screen.getByDisplayValue('Classic Chain'), 'Classic Chain Updated');
    fireEvent.press(screen.getByText('Next →'));
    fireEvent.press(screen.getByText('Next →'));
    fireEvent.press(screen.getByText('Save Ornaments'));

    expect(mockStore.updateOrnament).toHaveBeenCalledWith(
      'ORN020',
      expect.objectContaining({ OrnamentName: 'Classic Chain Updated' })
    );
    expect(mockToast.success).toHaveBeenCalledWith('Ornament "Classic Chain Updated" updated');
    expect(screen.getByText('Ornaments Details')).toBeTruthy(); // back on the details screen
  });
});
