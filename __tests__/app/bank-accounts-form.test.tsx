import { act, render } from '@testing-library/react-native';
import React from 'react';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };
const mockParams: { accountId?: string; userId?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

const mockForm = jest.fn((_props: any) => null);
jest.mock('../../src/components/BankAccountForm', () => ({
  BankAccountForm: (props: any) => mockForm(props),
}));

const ACCOUNTS = [
  { BankAccountId: 'B1', UserId: 'U1', BankName: 'SBI' },
  { BankAccountId: '42', UserId: 'U2', BankName: 'HDFC' },
];
const mockStore: any = { bankAccounts: ACCOUNTS };
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormScreen = require('../../src/app/bank-accounts/form').default;

const lastProps = () => mockForm.mock.calls[mockForm.mock.calls.length - 1][0];

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.accountId;
  delete mockParams.userId;
  mockStore.bankAccounts = ACCOUNTS;
});

describe('BankAccountFormScreen', () => {
  it('opens in add mode (account null, no preset user) with no params', () => {
    render(<FormScreen />);
    expect(mockForm).toHaveBeenCalledTimes(1);
    expect(lastProps().account).toBeNull();
    expect(lastProps().presetUserId).toBeUndefined();
  });

  it('resolves the account from the accountId param for editing', () => {
    mockParams.accountId = 'B1';
    render(<FormScreen />);
    expect(lastProps().account).toBe(ACCOUNTS[0]);
  });

  it('matches ids as strings (numeric-looking ids)', () => {
    mockParams.accountId = '42';
    mockStore.bankAccounts = [{ BankAccountId: 42, UserId: 'U2' }];
    render(<FormScreen />);
    expect(lastProps().account).toBe(mockStore.bankAccounts[0]);
  });

  it('passes null when the accountId is unknown', () => {
    mockParams.accountId = 'NOPE';
    render(<FormScreen />);
    expect(lastProps().account).toBeNull();
  });

  it('passes the userId param as presetUserId for add mode', () => {
    mockParams.userId = 'U7';
    render(<FormScreen />);
    expect(lastProps().account).toBeNull();
    expect(lastProps().presetUserId).toBe('U7');
  });

  it('forwards both accountId and userId when both are provided', () => {
    mockParams.accountId = 'B1';
    mockParams.userId = 'U1';
    render(<FormScreen />);
    expect(lastProps().account).toBe(ACCOUNTS[0]);
    expect(lastProps().presetUserId).toBe('U1');
  });

  it('onClose navigates back', () => {
    render(<FormScreen />);
    expect(mockRouter.back).not.toHaveBeenCalled();
    act(() => lastProps().onClose());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
