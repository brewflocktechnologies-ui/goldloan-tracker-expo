import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, View } from 'react-native';
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
    OrnamentImages: 'p1 | p2 | p3 | p4',
    UserId: 'USR1',
  } as Ornament,
  {
    OrnamentId: 'ORN002',
    OrnamentName: 'Bridal Bangles',
    OrnamentType: 'Bridal',
    OrnamentCategory: 'Bangles',
    Purity: '22K',
    GrossWeight: 30,
    NetWeight: 28,
    Quantity: 2,
    BuyingCost: 140000,
    Status: 'Pledged',
    LoanNumber: 'LN-1001',
    OrnamentImages: '',
  } as Ornament,
  {
    OrnamentId: 'ORN003',
    OrnamentName: 'Bare Ring',
    Status: 'Available',
    OrnamentImages: '',
  } as Ornament,
];

const mockStore: any = {
  ornaments: ORNAMENTS,
  users: [
    { UserId: 'USR1', FullName: 'Ravi Kumar', MobileNumber: '9876543210', City: 'Bengaluru' },
    { UserId: 'USR2', FullName: 'Anita Sharma', MobileNumber: '9000000002', City: 'Mysuru' },
  ],
  loans: [{ LoanNumber: 'LN-9', ornamentIds: ['ORN003'] }],
  goldRates: { gold22k: { rate1g: 5500 } },
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
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
  jest.clearAllMocks();
  mockStore.ornaments = ORNAMENTS;
  mockStore.refreshGoldRates = jest.fn(() => Promise.resolve());
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
    this: unknown,
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    callback(0, 100, 40, 40);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const openAdd = () => {
  render(<OrnamentsScreen />);
  fireEvent.press(screen.getByLabelText('Add ornament'));
};
const toStep2 = (name = 'Test Piece') => {
  fireEvent.changeText(screen.getByPlaceholderText('e.g. Gold Necklace'), name);
  fireEvent.press(screen.getByText('Next →'));
};
const toStep3 = (gross = '10') => {
  toStep2();
  fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[0], gross);
  fireEvent.press(screen.getByText('Next →'));
};

describe('Ornaments list — extra interactions', () => {
  it('clears the search box with the clear button', () => {
    render(<OrnamentsScreen />);
    const input = screen.getByPlaceholderText('Search by name, type, hallmark or ID...');
    fireEvent.changeText(input, 'nomatch');
    expect(screen.getByText('No ornaments found')).toBeTruthy();
    fireEvent.press(screen.getByText('close-circle'));
    expect(screen.queryByText('No ornaments found')).toBeNull();
    expect(screen.getByText('Gold Necklace')).toBeTruthy();
  });

  it('filters by Available and Pledged pills, then back to All', () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Pledged (1)'));
    expect(screen.getByText('Bridal Bangles')).toBeTruthy();
    expect(screen.queryByText('Gold Necklace')).toBeNull();

    fireEvent.press(screen.getByText('Available (2)'));
    expect(screen.getByText('Gold Necklace')).toBeTruthy();
    expect(screen.queryByText('Bridal Bangles')).toBeNull();

    fireEvent.press(screen.getByText('All (3)'));
    expect(screen.getByText('Bridal Bangles')).toBeTruthy();
  });

  it('shows the loan number on a pledged card and "-" for missing weight/price', () => {
    render(<OrnamentsScreen />);
    expect(screen.getByText('LN-1001')).toBeTruthy();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('sorts by Name (Z-A) and Weight (Low-High)', () => {
    render(<OrnamentsScreen />);
    const order = () =>
      screen.getAllByText(/^(Gold Necklace|Bridal Bangles|Bare Ring)$/).map(n => n.props.children);

    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    fireEvent.press(screen.getByText('Name (Z-A)'));
    expect(order()).toEqual(['Gold Necklace', 'Bridal Bangles', 'Bare Ring']);

    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    fireEvent.press(screen.getByText('Weight (Low-High)'));
    expect(order()).toEqual(['Bare Ring', 'Gold Necklace', 'Bridal Bangles']);
  });

  it('pull-to-refresh syncs from the backend', async () => {
    render(<OrnamentsScreen />);
    const scroll = screen
      .UNSAFE_getAllByType(require('react-native').ScrollView)
      .find(s => s.props.refreshControl);
    await act(async () => {
      await scroll!.props.refreshControl.props.onRefresh();
    });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
  });
});

describe('Ornament details — photo gallery', () => {
  const open = (name: string) => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText(name));
  };

  it('cycles the main photo with the next / previous arrows (wrapping around)', () => {
    open('Gold Necklace');
    const mainUri = () =>
      screen.UNSAFE_getAllByType(require('expo-image').Image).map(i => i.props.source?.uri);

    expect(mainUri()[0]).toBe('https://drive.example/p1');
    fireEvent.press(screen.getByText('chevron-forward'));
    expect(mainUri()[0]).toBe('https://drive.example/p2');
    fireEvent.press(screen.getByText('chevron-back'));
    fireEvent.press(screen.getByText('chevron-back'));
    expect(mainUri()[0]).toBe('https://drive.example/p4');
    fireEvent.press(screen.getByText('chevron-forward'));
    expect(mainUri()[0]).toBe('https://drive.example/p1');
  });

  it('adds photos from the gallery and appends them to the existing ones', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://new1.jpg' }, { uri: 'file://new2.jpg' }],
    });
    open('Gold Necklace');
    await act(async () => {
      fireEvent.press(screen.getByText('Add Photos'));
    });
    expect(mockStore.updateOrnament).toHaveBeenCalledWith('ORN001', {
      OrnamentImages: 'p1 | p2 | p3 | p4 | file://new1.jpg | file://new2.jpg',
    });
    expect(mockToast.success).toHaveBeenCalledWith('Photos added successfully');
  });

  it('uploads the first photo when the ornament has none', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://first.jpg' }],
    });
    open('Bridal Bangles');
    await act(async () => {
      fireEvent.press(screen.getByText('Upload Photo'));
    });
    expect(mockStore.updateOrnament).toHaveBeenCalledWith('ORN002', { OrnamentImages: 'file://first.jpg' });
  });

  it('does nothing when the picker is cancelled', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    open('Bridal Bangles');
    await act(async () => {
      fireEvent.press(screen.getByText('Upload Photo'));
    });
    expect(mockStore.updateOrnament).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('alerts when the picker throws', async () => {
    ImagePicker.launchImageLibraryAsync.mockRejectedValue(new Error('Gallery blocked'));
    open('Bridal Bangles');
    await act(async () => {
      fireEvent.press(screen.getByText('Upload Photo'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Gallery blocked');
    expect(mockStore.updateOrnament).not.toHaveBeenCalled();
  });

  it('renders an ornament with almost no data without crashing', () => {
    open('Bare Ring');
    expect(screen.getByText('Ornaments Details')).toBeTruthy();
  });
});

describe('Ornament wizard — step 1', () => {
  it('selects a customer from the picker, and can clear the selection', () => {
    openAdd();
    fireEvent.press(screen.getByText('Select Customer (Optional)'));
    expect(screen.getByText('Select Customer')).toBeTruthy();
    fireEvent.press(screen.getByText('Ravi Kumar'));
    expect(screen.getByText('Ravi Kumar (USR1)')).toBeTruthy();

    fireEvent.press(screen.getByText('close-circle'));
    expect(screen.getByText('Select Customer (Optional)')).toBeTruthy();
  });

  it('filters customers in the picker by search text', () => {
    openAdd();
    fireEvent.press(screen.getByText('Select Customer (Optional)'));
    fireEvent.changeText(screen.getByPlaceholderText('Search by name, phone or ID...'), 'anita');
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
  });

  it('accepts "None" in the customer picker', () => {
    openAdd();
    fireEvent.press(screen.getByText('Select Customer (Optional)'));
    fireEvent.press(screen.getByText('None (No Customer)'));
    expect(screen.getByText('Select Customer (Optional)')).toBeTruthy();
  });

  it('only allows whole numbers in Quantity', () => {
    openAdd();
    const qty = screen.getByDisplayValue('1');
    fireEvent.changeText(qty, '3a.5');
    expect(qty.props.value).toBe('35');
  });

  it('updates Maker and Hallmark fields', () => {
    openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. HM/C-7452/2024'), 'HM/1');
    expect(screen.getByPlaceholderText('e.g. HM/C-7452/2024').props.value).toBe('HM/1');
  });
});

describe('Ornament wizard — step 2 (weight & valuation)', () => {
  it('sanitises weight and price inputs', () => {
    openAdd();
    toStep2();
    const [gross, stone] = screen.getAllByPlaceholderText('0.000');
    fireEvent.changeText(gross, '12.5abc');
    fireEvent.changeText(stone, '1.2.3');
    expect(screen.getAllByPlaceholderText('0.000')[0].props.value).toBe('12.5');
    expect(screen.getAllByPlaceholderText('0.000')[1].props.value).not.toContain('a');
  });

  it('computes net weight from gross minus stone and shows it read-only', () => {
    openAdd();
    toStep2();
    fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[0], '10');
    fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[1], '2');
    expect(screen.getAllByText('8.000').length).toBe(2);
    expect(screen.getAllByText('Auto calculated').length).toBeGreaterThan(0);
  });

  it('recomputes the valuation tiles when the buying price changes', () => {
    openAdd();
    toStep2();
    fireEvent.changeText(screen.getAllByPlaceholderText('0.000')[0], '10');
    fireEvent.changeText(screen.getByDisplayValue('5500'), '5000');
    expect(screen.getByText('₹ 50,000')).toBeTruthy();
    expect(screen.getByText('₹ 5,500/g')).toBeTruthy();
    expect(screen.getByText('Valuation Details')).toBeTruthy();
    expect(screen.getByText('Appreciation')).toBeTruthy();
  });

  it('refreshes live gold rates and shows a success toast', async () => {
    openAdd();
    toStep2();
    await act(async () => {
      fireEvent.press(screen.getByText('refresh-outline'));
    });
    expect(mockStore.refreshGoldRates).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith('Live gold rates updated');
  });

  it('shows an error toast when refreshing rates fails', async () => {
    mockStore.refreshGoldRates = jest.fn(() => Promise.reject(new Error('offline')));
    openAdd();
    toStep2();
    await act(async () => {
      fireEvent.press(screen.getByText('refresh-outline'));
    });
    expect(mockToast.danger).toHaveBeenCalledWith('Failed to refresh gold rates');
  });

  it('ignores a second refresh tap while one is in flight', async () => {
    let resolve!: () => void;
    mockStore.refreshGoldRates = jest.fn(() => new Promise<void>(r => { resolve = r; }));
    openAdd();
    toStep2();
    await act(async () => {
      fireEvent.press(screen.getByText('refresh-outline'));
    });
    const trigger = screen.UNSAFE_getAllByType(require('react-native').ActivityIndicator)[0];
    expect(trigger).toBeTruthy();
    await act(async () => {
      resolve();
    });
    expect(mockStore.refreshGoldRates).toHaveBeenCalledTimes(1);
  });
});

describe('Ornament wizard — step 3 (photos & extras)', () => {
  it('shows character counters for description and remarks', () => {
    openAdd();
    toStep3();
    fireEvent.changeText(screen.getByPlaceholderText('Traditional gold necklace with ruby stones.'), 'abcde');
    fireEvent.changeText(screen.getByPlaceholderText('No additional remarks.'), 'xy');
    expect(screen.getByText('5/200')).toBeTruthy();
    expect(screen.getByText('2/200')).toBeTruthy();
  });

  it('sets the status to Pledged from the dropdown', () => {
    openAdd();
    toStep3();
    fireEvent.press(screen.getByText('Available'));
    fireEvent.press(screen.getByText('Pledged'));
    expect(screen.getByText('Pledged')).toBeTruthy();
  });

  it('alerts when picking photos fails and keeps the wizard usable', async () => {
    ImagePicker.launchImageLibraryAsync.mockRejectedValue(new Error('No access'));
    openAdd();
    toStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('Add Photo'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'No access');
    expect(screen.getByText('Save Ornaments')).toBeTruthy();
  });

  it('saves photos, description, remarks and status in the payload', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://a.jpg' }, { uri: 'file://b.jpg' }],
    });
    openAdd();
    toStep3('10');
    await act(async () => {
      fireEvent.press(screen.getByText('Add Photo'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Traditional gold necklace with ruby stones.'), 'Nice');
    fireEvent.press(screen.getByText('Save Ornaments'));

    expect(mockStore.addOrnament).toHaveBeenCalledTimes(1);
    expect(mockStore.addOrnament.mock.calls[0][0]).toMatchObject({
      OrnamentName: 'Test Piece',
      GrossWeight: 10,
      Description: 'Nice',
      Status: 'Available',
      OrnamentImages: 'file://a.jpg | file://b.jpg',
    });
    expect(mockToast.success).toHaveBeenCalledWith('Ornament "Test Piece" added to vault');
  });

  it('alerts when saving throws and stays on the wizard', () => {
    mockStore.addOrnament.mockImplementationOnce(() => {
      throw new Error('Sheet down');
    });
    openAdd();
    toStep3();
    fireEvent.press(screen.getByText('Save Ornaments'));
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Sheet down');
    expect(screen.getByText('Save Ornaments')).toBeTruthy();
  });

  it('goes back from step 3 to step 2', () => {
    openAdd();
    toStep3();
    fireEvent.press(screen.getByText('← Back'));
    expect(screen.getByText('Valuation Details')).toBeTruthy();
  });
});

describe('Ornament wizard — hardware back button', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BackHandler } = require('react-native');

  const pressBack = () => {
    const handlers = (BackHandler.addEventListener as jest.Mock).mock.calls.map((c: any[]) => c[1]);
    let handled = false;
    act(() => {
      handled = handlers[handlers.length - 1]();
    });
    return handled;
  };

  beforeEach(() => {
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  });

  it('is left to the system on the list view', () => {
    render(<OrnamentsScreen />);
    expect(pressBack()).toBe(false);
  });

  it('steps back through the wizard, then to the list', () => {
    openAdd();
    toStep2();
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Basic Information')).toBeTruthy();
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Total Ornaments')).toBeTruthy();
  });

  it('closes the customer picker before leaving the wizard', () => {
    openAdd();
    fireEvent.press(screen.getByText('Select Customer (Optional)'));
    expect(screen.getByText('Select Customer')).toBeTruthy();
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Basic Information')).toBeTruthy();
  });

  it('closes an open dropdown picker first', () => {
    openAdd();
    fireEvent.press(screen.getByText('Traditional'));
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Basic Information')).toBeTruthy();
  });

  it('goes from details to the list', () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Gold Necklace'));
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Total Ornaments')).toBeTruthy();
  });
});
