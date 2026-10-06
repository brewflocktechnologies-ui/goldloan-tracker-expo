import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

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
const { BankAccountForm } = require('../../src/components/BankAccountForm');

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
  const props = { onClose: jest.fn(), ...overrides };
  const utils = render(<BankAccountForm {...props} />);
  return { props, ...utils };
}

const typeAccountNumber = (value: string) =>
  fireEvent.changeText(screen.getByPlaceholderText('9-18 digits'), value);
const pickBank = (name: string) => {
  fireEvent.press(screen.getByLabelText('Select bank'));
  fireEvent.press(screen.getByText(name));
};
const save = () => fireEvent.press(screen.getByLabelText('Save account'));

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.users = USERS;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('BankAccountForm — add', () => {
  it('shows the add form with defaults', () => {
    setup();
    expect(screen.getByText('Add bank account')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByDisplayValue('Bengaluru')).toBeTruthy();
    expect(screen.getByDisplayValue('500000')).toBeTruthy();
    expect(screen.getByText('Select bank')).toBeTruthy();
  });

  it('pre-selects the first customer and lets you switch via the picker', () => {
    setup();
    expect(screen.getByDisplayValue('Ravi Kumar')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select customer'));
    fireEvent.press(screen.getByText('Anita Sharma'));
    expect(screen.getByDisplayValue('Anita Sharma')).toBeTruthy();
    expect(screen.queryByDisplayValue('Ravi Kumar')).toBeNull();
  });

  it('locks the customer when opened for a preset customer', () => {
    setup({ presetUserId: 'USR002' });
    expect(screen.getByDisplayValue('Anita Sharma')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select customer'));
    expect(screen.queryByText('Select customer', { exact: true })).toBeNull();
  });

  it('requires an account holder name', () => {
    setup();
    fireEvent.changeText(screen.getByDisplayValue('Ravi Kumar'), '   ');
    save();
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Account Holder Name is required.');
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });

  it('requires an account number', () => {
    setup();
    save();
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Account Number is required.');
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });

  it('requires a bank', () => {
    setup();
    typeAccountNumber('123456789012');
    save();
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please select a bank.');
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });

  it('adds the account with numeric limits, toasts and closes', () => {
    const { props } = setup({ presetUserId: 'USR002' });
    typeAccountNumber('123456789012');
    pickBank('HDFC Bank');
    save();

    expect(mockStore.addBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        UserId: 'USR002',
        AccountHolderName: 'Anita Sharma',
        AccountNumber: '123456789012',
        BankName: 'HDFC Bank',
        MaxLoanAmount: 500000,
        UtilizedLoanAmount: 0,
        Status: 'Active',
        AccountType: 'Savings',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    // Success toast only after the store confirms the save
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    const callbacks = mockStore.addBankAccount.mock.calls[0][1];
    act(() => callbacks.onSuccess());
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('added'));
  });

  it('does not toast success when the add fails to save', () => {
    const { props } = setup({ presetUserId: 'USR002' });
    typeAccountNumber('123456789012');
    pickBank('HDFC Bank');
    save();
    expect(mockStore.addBankAccount).toHaveBeenCalledTimes(1);
    // onSuccess is never invoked (save failed)
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it('toggles account type and status', () => {
    setup({ presetUserId: 'USR001' });
    typeAccountNumber('555566667777');
    pickBank('Axis Bank');
    fireEvent.press(screen.getByText('Current'));
    fireEvent.press(screen.getByText('Inactive'));
    save();
    expect(mockStore.addBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({ AccountType: 'Current', Status: 'Inactive' }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('closes without saving from the header back button', () => {
    const { props } = setup();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
  });
});

describe('BankAccountForm — edit', () => {
  it('pre-fills the form from the account being edited', () => {
    setup({ account: EXISTING });
    expect(screen.getByText('Edit bank account')).toBeTruthy();
    expect(screen.getByDisplayValue('999900001111')).toBeTruthy();
    expect(screen.getByText('HDFC Bank')).toBeTruthy();
    expect(screen.getByDisplayValue('MG Road')).toBeTruthy();
    expect(screen.getByDisplayValue('anita@okaxis')).toBeTruthy();
    expect(screen.getByDisplayValue('300000')).toBeTruthy();
  });

  it('accepts a numeric account number from the backend', () => {
    setup({ account: { ...EXISTING, AccountNumber: 999900001111 } });
    expect(screen.getByDisplayValue('999900001111')).toBeTruthy();
  });

  it('updates the existing account instead of adding a new one', () => {
    const { props } = setup({ account: EXISTING });
    pickBank('ICICI Bank');
    save();

    expect(mockStore.updateBankAccount).toHaveBeenCalledWith(
      'B1',
      expect.objectContaining({ BankName: 'ICICI Bank', MaxLoanAmount: 300000, UtilizedLoanAmount: 100000, Status: 'Inactive' }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(mockStore.addBankAccount).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    const callbacks = mockStore.updateBankAccount.mock.calls[0][2];
    act(() => callbacks.onSuccess());
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('updated'));
  });
});
