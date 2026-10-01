import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { Loan } from '../../src/types';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const mockStore: any = {
  users: [{ UserId: 'USR001', FullName: 'Ravi Kumar', MobileNumber: '9876543210' }],
  ornaments: [
    { OrnamentId: 'ORN1', OrnamentName: 'Gold Chain', Purity: '22K', GrossWeight: 12.5, NetWeight: 11 },
    { OrnamentId: 'ORN2', OrnamentName: 'Gold Ring', Purity: '18K', GrossWeight: 5, NetWeight: 4.5 },
    { OrnamentId: 'ORN3', OrnamentName: 'Not Pledged Bangle', Purity: '22K', GrossWeight: 20, NetWeight: 19 },
  ],
  closeAndReleaseLoan: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { LoanCloseModal } = require('../../src/components/LoanCloseModal');

const LOAN = {
  LoanId: 'L1',
  LoanNumber: 'LN-1',
  UserId: 'USR001',
  BankName: 'SBI',
  LoanAmount: 50000,
  LoanDate: '2026-01-05',
  DueDate: '2026-07-05',
  LoanStatus: 'Active',
  ornamentIds: ['ORN1', 'ORN2'],
} as unknown as Loan;

function setup(overrides: Record<string, unknown> = {}) {
  const props = { visible: true, loan: LOAN, onClose: jest.fn(), onClosed: jest.fn(), ...overrides };
  const utils = render(<LoanCloseModal {...props} />);
  return { props, ...utils };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('LoanCloseModal', () => {
  it('renders nothing when not visible', () => {
    setup({ visible: false });
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
  });

  it('shows the loan and customer summary', () => {
    setup();
    expect(screen.getByText('Close Loan & Release')).toBeTruthy();
    expect(screen.getByText('LN-1')).toBeTruthy();
    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('9876543210')).toBeTruthy();
    expect(screen.getByText('SBI')).toBeTruthy();
    expect(screen.getByText(`₹${(50000).toLocaleString('en-IN')}`)).toBeTruthy();
  });

  it('lists only the ornaments pledged to this loan', () => {
    setup();
    expect(screen.getByText('Ornaments to Release (2)')).toBeTruthy();
    expect(screen.getByText('Gold Chain')).toBeTruthy();
    expect(screen.getByText('Gold Ring')).toBeTruthy();
    expect(screen.queryByText('Not Pledged Bangle')).toBeNull();
    expect(screen.getAllByText('To Available')).toHaveLength(2);
  });

  it('shows an empty message when no ornaments are linked', () => {
    setup({ loan: { ...LOAN, ornamentIds: [] } });
    expect(screen.getByText('Ornaments to Release (0)')).toBeTruthy();
    expect(screen.getByText('No individual ornaments linked')).toBeTruthy();
  });

  it('falls back to Unknown when the borrower cannot be found', () => {
    setup({ loan: { ...LOAN, UserId: 'GHOST' } });
    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.getByText('N/A')).toBeTruthy();
  });

  it('closes the loan with a default remark, then notifies', () => {
    const { props } = setup();
    fireEvent.press(screen.getByText('Close & Release'));

    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledWith('L1', 'Closed and ornaments released');
    expect(props.onClose).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Loan Closed Successfully', expect.stringContaining('LN-1'));
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('LN-1'));
    expect(props.onClosed).toHaveBeenCalledWith(LOAN);
  });

  it('passes the typed remarks to the store', () => {
    setup();
    fireEvent.changeText(screen.getByPlaceholderText(/Enter remarks for Ravi Kumar/), 'Paid in full via RTGS');
    fireEvent.press(screen.getByText('Close & Release'));
    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledWith('L1', 'Paid in full via RTGS');
  });

  it('cancels without closing the loan', () => {
    const { props } = setup();
    fireEvent.press(screen.getByText('Cancel'));
    expect(props.onClose).toHaveBeenCalled();
    expect(mockStore.closeAndReleaseLoan).not.toHaveBeenCalled();
    expect(props.onClosed).not.toHaveBeenCalled();
  });

  it('does nothing on confirm when there is no loan', () => {
    const { props } = setup({ loan: null });
    fireEvent.press(screen.getByText('Close & Release'));
    expect(mockStore.closeAndReleaseLoan).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('clears the remarks each time it is reopened', () => {
    const { rerender, props } = setup();
    fireEvent.changeText(screen.getByPlaceholderText(/Enter remarks/), 'old note');
    expect(screen.getByDisplayValue('old note')).toBeTruthy();

    rerender(<LoanCloseModal {...props} visible={false} />);
    rerender(<LoanCloseModal {...props} visible />);
    expect(screen.queryByDisplayValue('old note')).toBeNull();
  });
});
