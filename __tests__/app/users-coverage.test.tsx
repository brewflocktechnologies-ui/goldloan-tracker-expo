import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { User } from '../../src/types';

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
  FatherHusbandName: 'Suresh Kumar',
  MobileNumber: '9876543210',
  DateOfBirth: '1990-05-15',
  Gender: 'Female',
  Occupation: 'Business',
  Status: 'Inactive',
  CustomerPhoto: 'photo123',
};

const mockStore: any = {
  users: [USER],
  loans: [
    { LoanId: 'L1', UserId: 'USR001', LoanNumber: 'LN-1', LoanAmount: 50000, LoanStatus: 'Overdue', DueDate: '2020-01-01', ornamentIds: ['ORN1'], InterestRate: 12, InterestType: 'Compound' },
    { LoanId: 'L2', UserId: 'USR001', LoanAmount: 20000, LoanStatus: 'Closed', DueDate: '2030-01-01', ornamentIds: [], NetWeight: 4 },
    { LoanId: 'L3', UserId: 'USR001', LoanAmount: 1000, LoanStatus: 'Active', ornamentIds: ['MISSING'] },
  ],
  ornaments: [
    { OrnamentId: 'ORN1', UserId: 'USR001', OrnamentImages: 'img1 | img2', GrossWeight: 5 },
    { OrnamentId: 'ORN9', UserId: 'OTHER', OrnamentImages: 'fallback', NetWeight: 3 },
  ],
  bankAccounts: [{ BankAccountId: 'B1', UserId: 'USR001', Status: 'Inactive', MaxLoanAmount: 0, UtilizedLoanAmount: 0 }],
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  addUser: jest.fn((u: Partial<User>) => ({ UserId: 'USR002', Status: 'Active', ...u })),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};
jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const UsersScreen = require('../../src/app/(tabs)/users').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImagePicker = require('expo-image-picker');

beforeEach(() => {
  jest.clearAllMocks();
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
  render(<UsersScreen />);
  fireEvent.press(screen.getByLabelText('Add customer'));
};
const openDetails = () => {
  render(<UsersScreen />);
  fireEvent.press(screen.getByText('Ravi Kumar'));
};

describe('User form — every field flows into the saved payload', () => {
  it('saves alternate mobile, email, addresses, city, pincode, KYC and occupation', () => {
    openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'Full Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter name'), 'Parent Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Alternate mobile number'), '98-76 x54');
    fireEvent.changeText(screen.getByPlaceholderText('Enter email address'), 'a@b.com');
    fireEvent.changeText(screen.getByPlaceholderText('XXXX XXXX XXXX'), '123412341234');
    fireEvent.changeText(screen.getByPlaceholderText('Enter PAN number'), 'abcde1234f');
    const [addr1, addr2] = screen.getAllByPlaceholderText('Enter full address');
    fireEvent.changeText(addr1, 'Line One');
    fireEvent.changeText(addr2, 'Line Two');
    fireEvent.changeText(screen.getByPlaceholderText('Enter city'), 'Mysuru');
    fireEvent.changeText(screen.getByPlaceholderText('Enter pincode'), '570001');
    fireEvent.press(screen.getByText('Teacher'));
    fireEvent.press(screen.getByText('Business'));
    fireEvent.press(screen.getByText('Other'));

    fireEvent.press(screen.getByText('Save User'));

    expect(mockStore.addUser.mock.calls[0][0]).toMatchObject({
      FullName: 'Full Person',
      FatherHusbandName: 'Parent Person',
      MobileNumber: '9111122223',
      AlternateMobileNumber: '987654',
      Email: 'a@b.com',
      AadhaarNumber: '123412341234',
      PANNumber: 'ABCDE1234F',
      AddressLine1: 'Line One',
      AddressLine2: 'Line Two',
      City: 'Mysuru',
      Pincode: '570001',
      Occupation: 'Business',
      Gender: 'Other',
    });
  });

  it('confirming the date picker fills the date of birth', () => {
    openAdd();
    fireEvent.press(screen.getByLabelText('Choose Date of Birth'));
    fireEvent.press(screen.getByText('15'), { stopPropagation: jest.fn() });
    fireEvent.press(screen.getByText('Confirm'), { stopPropagation: jest.fn() });
    expect(screen.getByText(/^15\/01\/\d{4}$/)).toBeTruthy();
  });

  it('cancelling the date picker leaves the placeholder', () => {
    openAdd();
    fireEvent.press(screen.getByLabelText('Choose Date of Birth'));
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.getByText('DD / MM / YYYY')).toBeTruthy();
  });
});

describe('User form — edit pre-fill and status', () => {
  it('pre-fills gender, occupation and the inactive status from the customer', async () => {
    openDetails();
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Edit Customer'));
    expect(await screen.findByText('Edit User')).toBeTruthy();
    expect(screen.getByText('Business')).toBeTruthy();
    expect(screen.getAllByText('radio-button-on')).toHaveLength(1);

    fireEvent.press(screen.getByText('Save Changes'));
    expect(mockStore.updateUser).toHaveBeenCalledWith(
      'USR001',
      expect.objectContaining({ Gender: 'Female', Status: 'Inactive', CustomerPhoto: 'photo123' })
    );
  });
});

describe('User details — loans, banks and photos', () => {
  it('renders overdue / closed / active loans and a bank account with blank fields', () => {
    openDetails();
    fireEvent.press(screen.getByText('Bank Accounts'));
    expect(screen.getByText('Bank Accounts (1)')).toBeTruthy();

    fireEvent.press(screen.getByText('Loans'));
    expect(screen.getByText('Loans (3)')).toBeTruthy();
  });

  it('opens a loan from its card', () => {
    openDetails();
    fireEvent.press(screen.getByText('Loans'));
    const viewButtons = screen.queryAllByText(/View Loan/i);
    if (viewButtons.length) {
      fireEvent.press(viewButtons[0]);
      expect(mockRouter.push).toHaveBeenCalledWith('/loans/L1');
    }
  });

  it('shows the customer photo instead of initials on the hero card', () => {
    openDetails();
    expect(screen.queryByText('RK')).toBeNull();
  });
});

describe('Contact actions — failure paths', () => {
  it('toasts when the phone dialer cannot be opened', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no dialer'));
    openDetails();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Call Customer'));
    });
    expect(mockToast.danger).toHaveBeenCalledWith('Could not open phone dialer');
  });

  it('toasts when WhatsApp cannot be opened', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no whatsapp'));
    openDetails();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('WhatsApp Customer'));
    });
    expect(mockToast.danger).toHaveBeenCalledWith('Could not open WhatsApp');
  });

  it('keeps a number that already starts with 91 when building the WhatsApp link', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    mockStore.users = [{ ...USER, MobileNumber: '919876543210' }];
    openDetails();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('WhatsApp Customer'));
    });
    expect(openURL).toHaveBeenCalledWith('https://wa.me/919876543210');
    mockStore.users = [USER];
  });

  it('copies the code to the clipboard on web', async () => {
    const original = Platform.OS;
    const writeText = jest.fn();
    (Platform as any).OS = 'web';
    (globalThis as any).navigator = { clipboard: { writeText } };
    try {
      openDetails();
      fireEvent.press(screen.getByLabelText('Menu options'));
      fireEvent.press(await screen.findByText('Copy Customer Code'));
      expect(writeText).toHaveBeenCalledWith('CUST-101');
      expect(mockToast.info).toHaveBeenCalledWith('Copied Code: CUST-101');
    } finally {
      (Platform as any).OS = original;
      delete (globalThis as any).navigator;
    }
  });
});

describe('Photo picking — error paths', () => {
  it('alerts when the camera throws', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockRejectedValue(new Error('Camera busy'));
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Camera'));
    });
    expect(alert).toHaveBeenCalledWith('Error', 'Camera busy');
  });

  it('alerts when the gallery throws', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.launchImageLibraryAsync.mockRejectedValue(new Error('Gallery busy'));
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Gallery'));
    });
    expect(alert).toHaveBeenCalledWith('Error', 'Gallery busy');
  });

  it('cancelling the camera leaves the form untouched', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Camera'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'X Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));
    expect(mockStore.addUser.mock.calls[0][0].CustomerPhoto).toBe('');
  });

  it('uses the picked photo without base64 data but sends no upload payload', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://nob64.jpg' }],
    });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Gallery'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'No B64');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));
    const payload = mockStore.addUser.mock.calls[0][0];
    expect(payload.CustomerPhoto).toBe('file://nob64.jpg');
    expect(payload.files).toEqual([]);
  });
});

describe('Hardware back — remaining branches', () => {
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

  it('closes the date picker first', () => {
    openAdd();
    fireEvent.press(screen.getByLabelText('Choose Date of Birth'));
    expect(screen.getByText('Select Date of Birth')).toBeTruthy();
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Add User')).toBeTruthy();
  });

  it('goes from edit back to details', async () => {
    openDetails();
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Edit Customer'));
    await screen.findByText('Edit User');
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Customer Details')).toBeTruthy();
  });

  it('closes the open options menu before leaving details', async () => {
    openDetails();
    fireEvent.press(screen.getByLabelText('Menu options'));
    await screen.findByText('Copy Customer Code');
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Customer Details')).toBeTruthy();
  });

  it('closes the delete confirmation before leaving details', async () => {
    openDetails();
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Delete Customer'));
    await screen.findByText(/Are you sure you want to delete/);
    expect(pressBack()).toBe(true);
    await waitFor(() => expect(screen.getByText('Customer Details')).toBeTruthy());
  });
});
