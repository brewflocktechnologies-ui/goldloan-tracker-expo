import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { Alert, Linking, View } from 'react-native';
import { User } from '../../src/types';

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
  getDriveImageUrl: jest.fn((id: string) => (id ? `https://drive.example/${id}` : '')),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const USERS: User[] = [
  {
    UserId: 'USR001',
    CustomerCode: 'CUST-101',
    FullName: 'Ravi Kumar',
    FatherHusbandName: 'Suresh Kumar',
    MobileNumber: '9876543210',
    AlternateMobileNumber: '9123456780',
    Email: 'ravi@example.com',
    DateOfBirth: '1990-05-15',
    Gender: 'Male',
    AadhaarNumber: '123456789012',
    PANNumber: 'ABCDE1234F',
    AddressLine1: '12 MG Road',
    AddressLine2: 'Near Park',
    City: 'Bengaluru',
    State: 'Karnataka',
    Pincode: '560001',
    Occupation: 'Teacher',
    Status: 'Active',
    UpdatedDate: '2024-03-10T10:00:00Z',
  },
  {
    UserId: 'USR002',
    CustomerCode: 'CUST-102',
    FullName: 'Anita Sharma',
    MobileNumber: '9000000002',
    City: 'Mysuru',
    State: 'Karnataka',
    Status: 'Inactive',
  },
  {
    UserId: 'USR003',
    CustomerCode: 'CUST-103',
    FullName: 'Zoya Khan',
    MobileNumber: '9000000003',
    City: 'Chennai',
    State: 'Tamil Nadu',
    Status: 'Active',
  },
];

const mockStore: any = {
  users: USERS,
  loans: [
    { LoanId: 'L1', UserId: 'USR001', LoanNumber: 'LN-1', LoanAmount: 50000, LoanStatus: 'Active', DueDate: '2030-01-01', ornamentIds: ['ORN1'], InterestRate: 12 },
    { LoanId: 'L2', UserId: 'USR001', LoanNumber: 'LN-2', LoanAmount: 20000, LoanStatus: 'Active', DueDate: '2030-01-01', ornamentIds: [], InterestRate: 12 },
    { LoanId: 'L3', UserId: 'USR003', LoanNumber: 'LN-3', LoanAmount: 10000, LoanStatus: 'Active', DueDate: '2030-01-01', ornamentIds: [], InterestRate: 12 },
  ],
  ornaments: [{ OrnamentId: 'ORN1', UserId: 'USR001', GrossWeight: 12.5, NetWeight: 11 }],
  bankAccounts: [
    { BankAccountId: 'B1', UserId: 'USR001', BankName: 'SBI', AccountNumber: '111122223333', AccountHolderName: 'Ravi Kumar', IFSCCode: 'SBIN0001', Status: 'Active', MaxLoanAmount: 100000, UtilizedLoanAmount: 20000 },
  ],
  syncFromBackend: jest.fn().mockResolvedValue(undefined),
  addUser: jest.fn((u: Partial<User>) => ({ UserId: 'USR004', Status: 'Active', ...u })),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const UsersScreen = require('../../src/app/(tabs)/users').default;

const renderScreen = () => render(<UsersScreen />);
const openDetails = (name: string) => fireEvent.press(screen.getByText(name));

beforeEach(() => {
  jest.clearAllMocks();
  // The options menu positions itself from the trigger's measured layout; the test renderer has none.
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
    this: unknown,
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    callback(0, 100, 40, 40);
  });
  mockAuthState.isSuperAdmin = true;
  mockStore.users = USERS;
});

describe('UsersScreen — list view', () => {
  it('renders the header, total count and every customer card', () => {
    renderScreen();
    expect(screen.getByText('Customers')).toBeTruthy();
    expect(screen.getByText('Total Customers')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    expect(screen.getByText('Zoya Khan')).toBeTruthy();
  });

  it('shows the customer code, formatted phone, loan count and gold weight on a card', () => {
    renderScreen();
    expect(screen.getByText('CUST-101')).toBeTruthy();
    expect(screen.getByText('+91 98765 43210')).toBeTruthy();
    expect(screen.getByText('2 Loans')).toBeTruthy();
    expect(screen.getByText('12.5 g')).toBeTruthy();
  });

  it('shows accurate counts on the All / Active / Inactive filter pills', () => {
    renderScreen();
    expect(screen.getByText('All (3)')).toBeTruthy();
    expect(screen.getByText('Active (2)')).toBeTruthy();
    expect(screen.getByText('Inactive (1)')).toBeTruthy();
  });

  it('filters by status when a pill is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Inactive (1)'));
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
    expect(screen.queryByText('Zoya Khan')).toBeNull();

    fireEvent.press(screen.getByText('Active (2)'));
    expect(screen.queryByText('Anita Sharma')).toBeNull();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();

    fireEvent.press(screen.getByText('All (3)'));
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
  });

  it('searches by name, mobile and customer code', () => {
    renderScreen();
    const input = screen.getByPlaceholderText('Search by name, mobile, or customer ID...');

    fireEvent.changeText(input, 'zoya');
    expect(screen.getByText('Zoya Khan')).toBeTruthy();
    expect(screen.queryByText('Ravi Kumar')).toBeNull();

    fireEvent.changeText(input, '9000000002');
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    expect(screen.queryByText('Zoya Khan')).toBeNull();

    fireEvent.changeText(input, 'cust-101');
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.queryByText('Anita Sharma')).toBeNull();
  });

  it('shows the empty state when nothing matches, and clears the search', () => {
    renderScreen();
    const input = screen.getByPlaceholderText('Search by name, mobile, or customer ID...');
    fireEvent.changeText(input, 'nomatchxyz');
    expect(screen.getByText('No customers found')).toBeTruthy();

    fireEvent.press(screen.getByText('close-circle'));
    expect(screen.queryByText('No customers found')).toBeNull();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
  });

  it('sorts by name from the sort modal', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    expect(screen.getByText('Sort By')).toBeTruthy();
    fireEvent.press(screen.getByText('Name (A-Z)'));

    const names = screen.getAllByText(/^(Anita Sharma|Ravi Kumar|Zoya Khan)$/).map(n => n.props.children);
    expect(names).toEqual(['Anita Sharma', 'Ravi Kumar', 'Zoya Khan']);
  });

  it('defaults to newest first (highest id on top)', () => {
    renderScreen();
    const names = screen.getAllByText(/^(Anita Sharma|Ravi Kumar|Zoya Khan)$/).map(n => n.props.children);
    expect(names).toEqual(['Zoya Khan', 'Anita Sharma', 'Ravi Kumar']);
  });

  it('pull-to-refresh syncs from the backend', async () => {
    renderScreen();
    const scroll = screen.UNSAFE_getAllByType(require('react-native').ScrollView).find(s => s.props.refreshControl);
    await act(async () => {
      await scroll!.props.refreshControl.props.onRefresh();
    });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
  });
});

describe('UsersScreen — details view', () => {
  it('opens the details page from a card and shows the hero card', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    expect(screen.getByText('Customer Details')).toBeTruthy();
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Call Customer')).toBeTruthy();
    expect(screen.getByLabelText('WhatsApp Customer')).toBeTruthy();
  });

  it('shows personal, KYC and address information on the Profile tab', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    expect(screen.getByText('Personal Information')).toBeTruthy();
    expect(screen.getByText('Suresh Kumar')).toBeTruthy();
    expect(screen.getByText('ravi@example.com')).toBeTruthy();
    expect(screen.getByText('KYC Information')).toBeTruthy();
    expect(screen.getByText('Address')).toBeTruthy();
    expect(screen.getByText('12 MG Road')).toBeTruthy();
    expect(screen.getByText('560001')).toBeTruthy();
  });

  it('masks Aadhaar and PAN, and reveals / re-hides them with the eye toggle', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    expect(screen.getByText('XXXX XXXX 9012')).toBeTruthy();
    expect(screen.getByText('XXXXXX234F')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Show Aadhaar number'));
    expect(screen.getByText('1234 5678 9012')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Hide Aadhaar number'));
    expect(screen.getByText('XXXX XXXX 9012')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Show PAN number'));
    expect(screen.getByText('ABCDE1234F')).toBeTruthy();
  });

  it('shows "—" for missing optional fields', () => {
    renderScreen();
    openDetails('Anita Sharma');
    expect(screen.queryByLabelText('Show Aadhaar number')).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(3);
  });

  it('switches to the Bank Accounts tab', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByText('Bank Accounts'));
    expect(screen.getByText('Bank Accounts (1)')).toBeTruthy();
    expect(screen.queryByText('Personal Information')).toBeNull();
  });

  it('shows an empty message on the Bank Accounts tab when there are none', () => {
    renderScreen();
    openDetails('Zoya Khan');
    fireEvent.press(screen.getByText('Bank Accounts'));
    expect(screen.getByText('No bank accounts on file')).toBeTruthy();
  });

  it('switches to the Loans tab and shows the add-loan button that opens the new loan screen', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    expect(screen.queryByLabelText('Add New Loan')).toBeNull();

    fireEvent.press(screen.getByText('Loans'));
    expect(screen.getByText('Loans (2)')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Add New Loan'));
    expect(mockRouter.push).toHaveBeenCalledWith('/loans/new');
  });

  it('shows an empty message on the Loans tab when there are none', () => {
    renderScreen();
    openDetails('Anita Sharma');
    fireEvent.press(screen.getByText('Loans'));
    expect(screen.getByText('No loans on file')).toBeTruthy();
  });

  it('goes back to the list', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Go back to customer list'));
    expect(screen.getByText('Total Customers')).toBeTruthy();
  });

  it('Call and WhatsApp buttons open the right links', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    renderScreen();
    openDetails('Ravi Kumar');

    fireEvent.press(screen.getByLabelText('Call Customer'));
    expect(openURL).toHaveBeenCalledWith('tel:9876543210');

    fireEvent.press(screen.getByLabelText('WhatsApp Customer'));
    expect(openURL).toHaveBeenCalledWith('https://wa.me/919876543210');
  });

  it('warns instead of dialling when the customer has no number', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    mockStore.users = [{ ...USERS[1], MobileNumber: '' }];
    renderScreen();
    openDetails('Anita Sharma');
    fireEvent.press(screen.getByLabelText('Call Customer'));
    expect(openURL).not.toHaveBeenCalled();
    expect(mockToast.warning).toHaveBeenCalledWith('No mobile number available');
  });

  it('super-admin can delete a customer after confirming', async () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Delete Customer'));

    expect(await screen.findByText(/Are you sure you want to delete "Ravi Kumar"/)).toBeTruthy();
    fireEvent.press(screen.getAllByText('Delete Customer').slice(-1)[0]);

    expect(mockStore.deleteUser).toHaveBeenCalledWith('USR001');
    expect(mockToast.danger).toHaveBeenCalledWith('Customer "Ravi Kumar" deleted');
    await waitFor(() => expect(screen.getByText('Total Customers')).toBeTruthy());
  });

  it('cancelling the delete confirmation keeps the customer', async () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Delete Customer'));
    fireEvent.press(await screen.findByText('Cancel'));
    expect(mockStore.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText('Customer Details')).toBeTruthy();
  });

  it('hides Edit and Delete in the menu for non super-admins', async () => {
    mockAuthState.isSuperAdmin = false;
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Menu options'));
    expect(await screen.findByText('Copy Customer Code')).toBeTruthy();
    expect(screen.queryByText('Edit Customer')).toBeNull();
    expect(screen.queryByText('Delete Customer')).toBeNull();
  });

  it('copying the customer code shows a toast', async () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Copy Customer Code'));
    expect(mockToast.info).toHaveBeenCalledWith('Copied Code: CUST-101');
  });
});

describe('UsersScreen — add form', () => {
  const openAdd = () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Add customer'));
  };

  it('opens the Add User form with a generated customer code and default values', () => {
    openAdd();
    expect(screen.getByText('Add User')).toBeTruthy();
    expect(screen.getByText('Create a new user')).toBeTruthy();
    expect(screen.getByText('Personal Information')).toBeTruthy();
    expect(screen.getByText('KYC Information')).toBeTruthy();
    expect(screen.getAllByText('Occupation').length).toBeGreaterThan(0);
    expect(screen.getByText('Save User')).toBeTruthy();
    expect(screen.getByDisplayValue('Bengaluru')).toBeTruthy();
    expect(screen.getByText('Karnataka')).toBeTruthy();
    expect(screen.getByText('Teacher')).toBeTruthy();
  });

  it('back returns to the list', () => {
    openAdd();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('Total Customers')).toBeTruthy();
  });

  it('requires a full name', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    openAdd();
    fireEvent.press(screen.getByText('Save User'));
    expect(alert).toHaveBeenCalledWith('Required Field', 'Please enter Full Name.');
    expect(mockStore.addUser).not.toHaveBeenCalled();
  });

  it('requires a valid 10-digit mobile number', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'New Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '12345');
    fireEvent.press(screen.getByText('Save User'));
    expect(alert).toHaveBeenCalledWith('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
    expect(mockStore.addUser).not.toHaveBeenCalled();
  });

  it('strips non-digits from the mobile inputs', () => {
    openAdd();
    const mobile = screen.getByPlaceholderText('Enter mobile number');
    fireEvent.changeText(mobile, '98a76-54');
    expect(mobile.props.value).toBe('987654');
  });

  it('upper-cases the PAN input', () => {
    openAdd();
    const pan = screen.getByPlaceholderText('Enter PAN number');
    fireEvent.changeText(pan, 'abcde1234f');
    expect(pan.props.value).toBe('ABCDE1234F');
  });

  it('switches gender', () => {
    openAdd();
    fireEvent.press(screen.getByText('Female'));
    expect(screen.getByText('Female')).toBeTruthy();
    expect(screen.getAllByText('radio-button-on')).toHaveLength(1);
  });

  it('picks a state from the picker modal', () => {
    openAdd();
    fireEvent.press(screen.getByText('Karnataka'));
    expect(screen.getByText('Select State')).toBeTruthy();
    fireEvent.press(screen.getByText('Maharashtra'));
    expect(screen.getByText('Maharashtra')).toBeTruthy();
  });

  it('picks an occupation from the picker modal', () => {
    openAdd();
    fireEvent.press(screen.getByText('Teacher'));
    expect(screen.getByText('Select Occupation')).toBeTruthy();
    fireEvent.press(screen.getByText('Business'));
    expect(screen.getByText('Business')).toBeTruthy();
  });

  it('opens the date-of-birth picker', () => {
    openAdd();
    expect(screen.getByText('DD / MM / YYYY')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Choose Date of Birth'));
    expect(screen.getByText('Select Date of Birth')).toBeTruthy();
  });

  it('saves a new customer and lands on their details page', () => {
    openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), '  New Person ');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));

    expect(mockStore.addUser).toHaveBeenCalledTimes(1);
    const payload = mockStore.addUser.mock.calls[0][0];
    expect(payload).toMatchObject({
      FullName: 'New Person',
      MobileNumber: '9111122223',
      City: 'Bengaluru',
      State: 'Karnataka',
      Status: 'Active',
      Gender: 'Male',
    });
    expect(payload.CustomerCode).toBe('CUST-104');
    expect(mockToast.success).toHaveBeenCalledWith('Customer "  New Person " registered successfully');
    expect(screen.getByText('Customer Details')).toBeTruthy();
  });

  it('shows an alert when saving throws', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockStore.addUser.mockImplementationOnce(() => {
      throw new Error('Sheet unavailable');
    });
    openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'New Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));
    expect(alert).toHaveBeenCalledWith('Error', 'Sheet unavailable');
    expect(screen.getByText('Add User')).toBeTruthy();
  });
});

describe('UsersScreen — edit form', () => {
  const openEdit = async () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Edit Customer'));
  };

  it('opens the Edit form pre-filled from the customer', async () => {
    await openEdit();
    expect(await screen.findByText('Edit User')).toBeTruthy();
    expect(screen.getByText('Update customer details')).toBeTruthy();
    expect(screen.getByDisplayValue('Ravi Kumar')).toBeTruthy();
    expect(screen.getByDisplayValue('Suresh Kumar')).toBeTruthy();
    expect(screen.getByDisplayValue('9876543210')).toBeTruthy();
    expect(screen.getByDisplayValue('ravi@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('12 MG Road')).toBeTruthy();
    expect(screen.getByText('15/05/1990')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('opens edit from the camera badge on the hero card', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByLabelText('Change customer photo'));
    expect(screen.getByText('Edit User')).toBeTruthy();
  });

  it('back returns to the details page, not the list', async () => {
    await openEdit();
    fireEvent.press(await screen.findByLabelText('Back'));
    expect(screen.getByText('Customer Details')).toBeTruthy();
  });

  it('saves changes, updates the store and returns to details', async () => {
    await openEdit();
    const name = await screen.findByDisplayValue('Ravi Kumar');
    fireEvent.changeText(name, 'Ravi K');
    fireEvent.press(screen.getByText('Save Changes'));

    expect(mockStore.updateUser).toHaveBeenCalledWith(
      'USR001',
      expect.objectContaining({ FullName: 'Ravi K', MobileNumber: '9876543210', files: [] })
    );
    expect(mockToast.success).toHaveBeenCalledWith('Customer "Ravi K" updated successfully');
    expect(screen.getByText('Customer Details')).toBeTruthy();
    expect(screen.getAllByText('Ravi K').length).toBeGreaterThan(0);
  });

  it('remembers the selected details tab after editing', async () => {
    renderScreen();
    openDetails('Ravi Kumar');
    fireEvent.press(screen.getByText('Bank Accounts'));
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Edit Customer'));
    fireEvent.press(await screen.findByLabelText('Back'));
    expect(screen.getByText('Bank Accounts (1)')).toBeTruthy();
  });
});

describe('UsersScreen — photo picking', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ImagePicker = require('expo-image-picker');

  const openAdd = () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Add customer'));
  };

  it('alerts when camera permission is denied', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Camera'));
    });
    expect(alert).toHaveBeenCalledWith('Permission Denied', 'Camera permission is required to capture photos.');
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('uses the captured photo and uploads it with the customer', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', base64: 'AAAA', mimeType: 'image/jpeg' }],
    });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Camera'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'Photo Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));

    const payload = mockStore.addUser.mock.calls[0][0];
    expect(payload.CustomerPhoto).toBe('file://photo.jpg');
    expect(payload.files).toEqual([expect.objectContaining({ base64: 'AAAA', mimeType: 'image/jpeg' })]);
  });

  it('picks a photo from the gallery', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://gallery.jpg', base64: 'BBBB' }],
    });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Gallery'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'Gallery Person');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));
    expect(mockStore.addUser.mock.calls[0][0].CustomerPhoto).toBe('file://gallery.jpg');
  });

  it('keeps the form unchanged when the picker is cancelled', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    openAdd();
    await act(async () => {
      fireEvent.press(screen.getByText('Gallery'));
    });
    fireEvent.changeText(screen.getByPlaceholderText('Enter full name'), 'No Photo');
    fireEvent.changeText(screen.getByPlaceholderText('Enter mobile number'), '9111122223');
    fireEvent.press(screen.getByText('Save User'));
    expect(mockStore.addUser.mock.calls[0][0].CustomerPhoto).toBe('');
  });
});

describe('UsersScreen — hardware back button', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BackHandler } = require('react-native');

  const pressBack = () => {
    const handlers = (BackHandler.addEventListener as jest.Mock).mock.calls.map(c => c[1]);
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
    renderScreen();
    expect(pressBack()).toBe(false);
  });

  it('goes from details to the list', () => {
    renderScreen();
    openDetails('Ravi Kumar');
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Total Customers')).toBeTruthy();
  });

  it('goes from add to the list', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Add customer'));
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Total Customers')).toBeTruthy();
  });

  it('closes the open picker modal first, before leaving the form', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Add customer'));
    fireEvent.press(screen.getByText('Karnataka'));
    expect(screen.getByText('Select State')).toBeTruthy();
    expect(pressBack()).toBe(true);
    expect(screen.getByText('Add User')).toBeTruthy();
  });
});
