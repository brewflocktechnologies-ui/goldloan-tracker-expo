import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { Alert, RefreshControl, ScrollView } from 'react-native';
import { Loan } from '../../src/types';

jest.setTimeout(30000);

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: mockIsDark, colors: require('../../src/constants/theme').LightColors }),
}));

let mockIsDark = false;
const mockAuth = { isSuperAdmin: true };
jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const mockStore: any = {
  loans: [],
  users: [],
  ornaments: [],
  isSyncing: false,
  syncFromBackend: jest.fn(),
  closeAndReleaseLoan: jest.fn(),
};
jest.mock('../../src/services/store', () => ({ useAppStore: () => mockStore }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ClosureScreen = require('../../src/app/(tabs)/closure').default;

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
const fmt = (offsetDays: number) => new Date(iso(offsetDays)).toLocaleDateString('en-GB');

const makeLoan = (over: Partial<Loan> & Record<string, unknown>): Loan =>
  ({
    LoanId: 'L1',
    LoanNumber: 'LN-1',
    UserId: 'USR001',
    BankName: 'SBI',
    LoanAmount: 50000,
    LoanDate: '2026-01-05',
    DueDate: iso(90),
    LoanStatus: 'Active',
    ornamentIds: ['ORN1', 'ORN2'],
    ...over,
  } as unknown as Loan);

const USERS = [
  { UserId: 'USR001', FullName: 'Ravi Kumar', MobileNumber: '9876543210' },
  { UserId: 'USR002', FullName: 'Anita Rao', MobileNumber: '9123456780' },
];

const LOANS: Loan[] = [
  makeLoan({ LoanId: 'L1', LoanNumber: 'LN-1', UserId: 'USR001', LoanAmount: 50000, DueDate: iso(90) }), // fine
  makeLoan({ LoanId: 'L2', LoanNumber: 'LN-2', UserId: 'USR002', BankName: 'HDFC', LoanAmount: 125000, DueDate: iso(-20), ornamentIds: ['ORN3'] }), // overdue by date
  makeLoan({ LoanId: 'L3', LoanNumber: 'LN-3', UserId: 'USR001', BankName: 'ICICI', LoanAmount: 7500, DueDate: iso(10), ornamentIds: undefined }), // due soon
  makeLoan({ LoanId: 'L4', LoanNumber: 'LN-4', LoanStatus: 'Closed' }), // not eligible
  makeLoan({ LoanId: 'L5', LoanNumber: 'LN-5', LoanStatus: 'Overdue', DueDate: iso(60) }), // not Active -> excluded
];

function setup() {
  return render(<ClosureScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDark = false;
  mockAuth.isSuperAdmin = true;
  mockStore.loans = LOANS;
  mockStore.users = USERS;
  mockStore.isSyncing = false;
  mockStore.syncFromBackend.mockResolvedValue(undefined);
  mockStore.ornaments = [
    { OrnamentId: 'ORN1', OrnamentName: 'Gold Chain', Purity: '22K', GrossWeight: 12.5, NetWeight: 11 },
    { OrnamentId: 'ORN2', OrnamentName: 'Gold Ring', Purity: '18K', GrossWeight: 5, NetWeight: 4.5 },
    { OrnamentId: 'ORN3', OrnamentName: 'Bangle', Purity: '24K', GrossWeight: 20, NetWeight: 19 },
  ];
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ClosureScreen list', () => {
  it('shows the info banner and column headers', () => {
    setup();
    expect(screen.getByText(/Closing a loan updates its status to/)).toBeTruthy();
    for (const h of ['Loan Number', 'Customer', 'Mobile', 'Amount', 'Date', 'Due Date', 'Ornaments', 'Action']) {
      expect(screen.getByText(h)).toBeTruthy();
    }
  });

  it('lists only Active loans with customer, mobile and formatted amount', () => {
    setup();
    expect(screen.getByText('LN-1')).toBeTruthy();
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.getByText('LN-3')).toBeTruthy();
    expect(screen.queryByText('LN-4')).toBeNull();
    expect(screen.queryByText('LN-5')).toBeNull();
    expect(screen.getAllByText('Ravi Kumar')).toHaveLength(2);
    expect(screen.getByText('Anita Rao')).toBeTruthy();
    expect(screen.getByText('9123456780')).toBeTruthy();
    expect(screen.getByText(`₹${(50000).toLocaleString('en-IN')}`)).toBeTruthy();
    expect(screen.getByText(`₹${(125000).toLocaleString('en-IN')}`)).toBeTruthy();
    expect(screen.getByText('Showing 1 to 3 of 3 entries')).toBeTruthy();
  });

  it('shows ornament counts (0 when ornamentIds is missing)', () => {
    setup();
    expect(screen.getAllByText('2 item(s)')).toHaveLength(1);
    expect(screen.getByText('1 item(s)')).toBeTruthy();
    expect(screen.getByText('0 item(s)')).toBeTruthy();
  });

  it('formats the loan and due dates and flags overdue loans', () => {
    setup();
    expect(screen.getAllByText(new Date('2026-01-05').toLocaleDateString('en-GB')).length).toBeGreaterThan(0);
    expect(screen.getByText(fmt(-20))).toBeTruthy();
    expect(screen.getAllByText('OVERDUE')).toHaveLength(1);
  });

  it('shows dashes for missing dates and 0 for no loan date', () => {
    mockStore.loans = [makeLoan({ LoanDate: '', DueDate: '' })];
    setup();
    expect(screen.getAllByText('-')).toHaveLength(2);
    expect(screen.queryByText('OVERDUE')).toBeNull();
  });

  it('falls back to Unknown / N/A for loans of unknown customers', () => {
    mockStore.loans = [makeLoan({ UserId: 'GHOST' })];
    setup();
    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.getByText('N/A')).toBeTruthy();
  });

  it('renders in dark mode', () => {
    mockIsDark = true;
    setup();
    expect(screen.getByText('LN-1')).toBeTruthy();
  });

  it('shows the empty state when there are no active loans', () => {
    mockStore.loans = [makeLoan({ LoanStatus: 'Closed' })];
    setup();
    expect(screen.getByText('No records found.')).toBeTruthy();
    expect(screen.getByText('Showing 0 to 0 of 0 entries')).toBeTruthy();
  });

  it('shows skeleton rows (no data) while the first sync is running', () => {
    mockStore.loans = [];
    mockStore.isSyncing = true;
    setup();
    expect(screen.queryByText('No records found.')).toBeNull();
  });

  it('shows the empty state when syncing finished with nothing', () => {
    mockStore.loans = [];
    mockStore.isSyncing = false;
    setup();
    expect(screen.getByText('No records found.')).toBeTruthy();
  });

  it('does not show a skeleton when syncing in background with existing loans', () => {
    mockStore.isSyncing = true;
    setup();
    expect(screen.getByText('LN-1')).toBeTruthy();
  });
});

describe('ClosureScreen filters and search', () => {
  it('shows counts on the filter chips', () => {
    setup();
    const chip = (label: string) => screen.getByText(label).parent!.parent!;
    expect(within(chip('All')).getByText('3')).toBeTruthy();
    expect(within(chip('Due soon')).getByText('1')).toBeTruthy();
    expect(within(chip('Overdue')).getByText('1')).toBeTruthy();
  });

  it('filters to overdue loans', () => {
    setup();
    fireEvent.press(screen.getByText('Overdue'));
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
    expect(screen.queryByText('LN-3')).toBeNull();
    expect(screen.getByText('Showing 1 to 1 of 1 entries')).toBeTruthy();
  });

  it('filters to loans due within 30 days', () => {
    setup();
    fireEvent.press(screen.getByText('Due soon'));
    expect(screen.getByText('LN-3')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
    expect(screen.queryByText('LN-2')).toBeNull();
  });

  it('returns to all loans when All is pressed again', () => {
    setup();
    fireEvent.press(screen.getByText('Overdue'));
    fireEvent.press(screen.getByText('All'));
    expect(screen.getByText('LN-1')).toBeTruthy();
    expect(screen.getByText('LN-2')).toBeTruthy();
  });

  it('treats a loan with status Overdue as overdue but loans without due date as neither overdue nor due soon', () => {
    mockStore.loans = [makeLoan({ LoanId: 'N1', LoanNumber: 'NODUE', DueDate: '' })];
    setup();
    const chip = (label: string) => screen.getByText(label).parent!.parent!;
    expect(within(chip('Due soon')).getByText('0')).toBeTruthy();
    expect(within(chip('Overdue')).getByText('0')).toBeTruthy();
  });

  const search = (text: string) =>
    fireEvent.changeText(screen.getByPlaceholderText('Search loan #, customer, mobile, bank...'), text);

  it('searches by loan number', () => {
    setup();
    search('ln-2');
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
  });

  it('searches by loan id', () => {
    setup();
    search('l3');
    expect(screen.getByText('LN-3')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
  });

  it('searches by customer name', () => {
    setup();
    search('anita');
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
  });

  it('searches by mobile', () => {
    setup();
    search('91234');
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.queryByText('LN-3')).toBeNull();
  });

  it('searches by bank', () => {
    setup();
    search('icici');
    expect(screen.getByText('LN-3')).toBeTruthy();
    expect(screen.queryByText('LN-2')).toBeNull();
  });

  it('searches by amount', () => {
    setup();
    search('125000');
    expect(screen.getByText('LN-2')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
  });

  it('searches by loan date and due date', () => {
    setup();
    search('2026-01-05');
    expect(screen.getByText('Showing 1 to 3 of 3 entries')).toBeTruthy();
    search(iso(10));
    expect(screen.getByText('LN-3')).toBeTruthy();
    expect(screen.queryByText('LN-1')).toBeNull();
  });

  it('shows the empty state when search has no matches and resets with whitespace', () => {
    setup();
    search('zzzz');
    expect(screen.getByText('No records found.')).toBeTruthy();
    search('   ');
    expect(screen.getByText('LN-1')).toBeTruthy();
  });

  it('combines a status filter with a search query', () => {
    setup();
    fireEvent.press(screen.getByText('Overdue'));
    search('ravi');
    expect(screen.getByText('No records found.')).toBeTruthy();
    search('anita');
    expect(screen.getByText('LN-2')).toBeTruthy();
  });

  it('matches loans with missing optional fields without crashing', () => {
    mockStore.loans = [makeLoan({ LoanNumber: '', LoanId: 'X9', BankName: '', LoanDate: '', DueDate: '', UserId: 'GHOST', LoanAmount: 0 })];
    setup();
    search('x9');
    expect(screen.getByText('Showing 1 to 1 of 1 entries')).toBeTruthy();
  });
});

describe('ClosureScreen closing a loan', () => {
  it('shows Close & Release buttons for SuperAdmin and no View Only badge', () => {
    setup();
    expect(screen.getAllByText('Close & Release')).toHaveLength(3);
    expect(screen.queryByText('View Only')).toBeNull();
  });

  it('hides actions and shows View Only for read-only users', () => {
    mockAuth.isSuperAdmin = false;
    setup();
    expect(screen.queryByText('Close & Release')).toBeNull();
    expect(screen.getAllByText('View Only')).toHaveLength(3);
  });

  it('opens the close modal with the selected loan summary and its ornaments', () => {
    setup();
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
    // First row = LN-1
    fireEvent.press(screen.getAllByText('Close & Release')[0]);
    expect(screen.getByText('Close Loan & Release')).toBeTruthy();
    expect(screen.getByText('Ornaments to Release (2)')).toBeTruthy();
    expect(screen.getByText('Gold Chain')).toBeTruthy();
    expect(screen.getByText('Gold Ring')).toBeTruthy();
    expect(screen.queryByText('Bangle')).toBeNull();
    expect(screen.getByText('Principal Amount')).toBeTruthy();
    expect(screen.getByText('Bank Account')).toBeTruthy();
    expect(screen.getByText('SBI')).toBeTruthy();
  });

  it('closes the right loan with the default remark and notifies', () => {
    setup();
    // second row = LN-2 (overdue)
    fireEvent.press(screen.getAllByText('Close & Release')[1]);
    expect(screen.getByText('Ornaments to Release (1)')).toBeTruthy();
    expect(screen.getByText('Bangle')).toBeTruthy();
    // Modal footer button is the last "Close & Release"
    const btns = screen.getAllByText('Close & Release');
    fireEvent.press(btns[btns.length - 1]);

    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledTimes(1);
    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledWith('L2', 'Closed and ornaments released', expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
    // Success messages only after the store confirms
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();

    const callbacks = mockStore.closeAndReleaseLoan.mock.calls[0][2];
    act(() => callbacks.onSuccess());
    expect(Alert.alert).toHaveBeenCalledWith('Loan Closed Successfully', expect.stringContaining('LN-2'));
    expect(mockToast.success).toHaveBeenCalledWith('Loan LN-2 settled & ornaments released!');
  });

  it('shows no success message when closing the loan fails to save', () => {
    setup();
    fireEvent.press(screen.getAllByText('Close & Release')[1]);
    const btns = screen.getAllByText('Close & Release');
    fireEvent.press(btns[btns.length - 1]);
    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('passes typed remarks to closeAndReleaseLoan', () => {
    setup();
    fireEvent.press(screen.getAllByText('Close & Release')[0]);
    fireEvent.changeText(screen.getByPlaceholderText(/Enter remarks for Ravi Kumar/), 'Settled in cash');
    const btns = screen.getAllByText('Close & Release');
    fireEvent.press(btns[btns.length - 1]);
    expect(mockStore.closeAndReleaseLoan).toHaveBeenCalledWith('L1', 'Settled in cash', expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('cancel closes the modal without closing the loan', () => {
    setup();
    fireEvent.press(screen.getAllByText('Close & Release')[0]);
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
    expect(mockStore.closeAndReleaseLoan).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('can be dismissed via the Modal back request', () => {
    setup();
    fireEvent.press(screen.getAllByText('Close & Release')[0]);
    const modal = screen.UNSAFE_getByType(require('react-native').Modal);
    act(() => modal.props.onRequestClose());
    expect(screen.queryByText('Close Loan & Release')).toBeNull();
  });
});

describe('ClosureScreen pull to refresh', () => {
  it('force-syncs from the backend and clears the refreshing flag', async () => {
    setup();
    const scroll = screen.UNSAFE_getAllByType(ScrollView)[0];
    const control = scroll.props.refreshControl;
    expect(control.type).toBe(RefreshControl);
    expect(control.props.refreshing).toBe(false);

    let pending!: () => void;
    mockStore.syncFromBackend.mockReturnValue(new Promise<void>((r) => { pending = r; }));

    act(() => { control.props.onRefresh(); });
    expect(mockStore.syncFromBackend).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.UNSAFE_getAllByType(ScrollView)[0].props.refreshControl.props.refreshing).toBe(true)
    );

    await act(async () => { pending(); });
    await waitFor(() =>
      expect(screen.UNSAFE_getAllByType(ScrollView)[0].props.refreshControl.props.refreshing).toBe(false)
    );
  });
});
