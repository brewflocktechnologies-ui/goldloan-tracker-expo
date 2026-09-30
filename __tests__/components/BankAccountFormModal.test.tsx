import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

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

const USERS = [
  { UserId: 'USR001', FullName: 'Ravi Kumar' },
  { UserId: 'USR002', FullName: 'Anita Sharma' },
];
const mockStore: any = {
  users: USERS,
  addBankAccount: jest.fn(),
  updateBankAccount: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BankAccountFormModal } = require('../../src/components/BankAccountFormModal');

const EXISTING = {
  BankAccountId: 'B1',
  UserId: 'USR002',
  AccountHolderName: 'Anita Sharma',
  AccountNumber: '999900001111',
  BankName: 'HDFC Bank',
  BranchName: 'MG Road',
  City: 'Mysuru',
  IFSCCode: 'HDFC0001',
  AccountType: 'Current',
  UPI_ID: 'anita@okaxis',
  MaxLoanAmount: 300000,
  UtilizedLoanAmount: 100000,
  PassbookImage: '',
  Status: 'Inactive',
};

function setup(overrides: Record<string, unknown> = {}) {
  const props = { visible: true, onClose: jest.fn(), ...overrides };
  const utils = render(<BankAccountFormModal {...props} />);
  return { props, ...utils };
}

// The first still-empty text input in an add form is the Account Number field.
const typeAccountNumber = (value: string) => fireEvent.changeText(screen.getAllByDisplayValue('')[0], value);

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.users = USERS;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('BankAccountFormModal — add', () => {
  it('renders nothing when not visible', () => {
    setup({ visible: false });
    expect(screen.queryByText('Add Bank Account')).toBeNull();
  });

  it('shows the add form with defaults and a borrower picker', () => {
    setup();
    expect(screen.getByText('Add Bank Account')).toBeTruthy();
    expect(screen.getByText('Select Borrower *')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('Anita Sharma')).toBeTruthy();
    expect(screen.getByDisplayValue('State Bank of India')).toBeTruthy();
    expect(screen.getByDisplayValue('Bengaluru')).toBeTruthy();
    expect(screen.getByText('Add Bank')).toBeTruthy();
  });

  it('pre-selects the first customer and follows the borrower chip', () => {
    setup();
    expect(screen.getByDisplayValue('Ravi Kumar')).toBeTruthy();
    fireEvent.press(screen.getByText('Anita Sharma'));
    expect(screen.getByDisplayValue('Anita Sharma')).toBeTruthy();
    expect(screen.queryByDisplayValue('Ravi Kumar')).toBeNull();
  });

  it('warns when no customers exist yet', () => {
    mockStore.users = [];
    setup();
    expect(screen.getByText(/No borrowers registered yet/)).toBeTruthy();
  });

  it('fixes the customer and hides the picker when opened for a preset customer', () => {
    setup({ presetUserId: 'USR002' });
    expect(screen.getByText('Borrower')).toBeTruthy();
    expect(screen.queryByText('Select Borrower *')).toBeNull();
    expect(screen.getByDisplayValue('Anita Sharma')).toBeTruthy();
    // The other customers are not offered as choices.
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
  });

  it('requires an account holder name', () => {
    setup();
    fireEvent.changeText(screen.getByDisplayValue('Ravi Kumar'), '   ');
    fireEvent.press(screen.getByText('Add Bank'));
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Account Holder Name is required.');
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });

  it('requires an account number', () => {
    setup();
    fireEvent.press(screen.getByText('Add Bank'));
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Account Number is required.');
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });

  it('adds the account with numeric limits, toasts and closes', () => {
    const { props } = setup({ presetUserId: 'USR002' });
    typeAccountNumber('123456789012');
    fireEvent.press(screen.getByText('Add Bank'));

    expect(mockStore.addBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        UserId: 'USR002',
        AccountHolderName: 'Anita Sharma',
        AccountNumber: '123456789012',
        BankName: 'State Bank of India',
        MaxLoanAmount: 500000,
        UtilizedLoanAmount: 0,
        Status: 'Active',
        AccountType: 'Savings',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('added'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('recalculates the available limit as the limits change', () => {
    setup();
    expect(screen.getByText(`₹${(500000).toLocaleString()}`)).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue('500000'), '200000');
    fireEvent.changeText(screen.getByDisplayValue('0'), '50000');
    expect(screen.getByText(`₹${(150000).toLocaleString()}`)).toBeTruthy();
  });

  it('never shows a negative available limit', () => {
    setup();
    fireEvent.changeText(screen.getByDisplayValue('0'), '900000');
    expect(screen.getByText('₹0')).toBeTruthy();
  });

  it('toggles account type and status', () => {
    setup({ presetUserId: 'USR001' });
    typeAccountNumber('555566667777');
    fireEvent.press(screen.getByText('Current'));
    fireEvent.press(screen.getByText('Inactive'));
    fireEvent.press(screen.getByText('Add Bank'));
    expect(mockStore.addBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({ AccountType: 'Current', Status: 'Inactive' })
    );
  });

  it('closes without saving from Cancel and from the header close icon', () => {
    const { props } = setup();
    fireEvent.press(screen.getByText('Cancel'));
    fireEvent.press(screen.getByLabelText('Close'));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });
});

describe('BankAccountFormModal — edit', () => {
  it('pre-fills the form from the account being edited', () => {
    setup({ account: EXISTING });
    expect(screen.getByText('Edit Bank Account')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
    expect(screen.getByDisplayValue('999900001111')).toBeTruthy();
    expect(screen.getByDisplayValue('HDFC Bank')).toBeTruthy();
    expect(screen.getByDisplayValue('MG Road')).toBeTruthy();
    expect(screen.getByDisplayValue('anita@okaxis')).toBeTruthy();
    expect(screen.getByDisplayValue('300000')).toBeTruthy();
    expect(screen.getByDisplayValue('100000')).toBeTruthy();
    expect(screen.getByText(`₹${(200000).toLocaleString()}`)).toBeTruthy();
  });

  it('updates the existing account instead of adding a new one', () => {
    const { props } = setup({ account: EXISTING });
    fireEvent.changeText(screen.getByDisplayValue('HDFC Bank'), 'ICICI Bank');
    fireEvent.press(screen.getByText('Save Changes'));

    expect(mockStore.updateBankAccount).toHaveBeenCalledWith(
      'B1',
      expect.objectContaining({ BankName: 'ICICI Bank', MaxLoanAmount: 300000, UtilizedLoanAmount: 100000, Status: 'Inactive' })
    );
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('updated'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('re-initialises when reopened in add mode', () => {
    const { rerender, props } = setup({ account: EXISTING });
    expect(screen.getByDisplayValue('HDFC Bank')).toBeTruthy();

    rerender(<BankAccountFormModal {...props} visible={false} account={null} />);
    rerender(<BankAccountFormModal {...props} visible account={null} />);
    expect(screen.getByText('Add Bank Account')).toBeTruthy();
    expect(screen.queryByDisplayValue('HDFC Bank')).toBeNull();
    expect(screen.getByDisplayValue('State Bank of India')).toBeTruthy();
  });
});
