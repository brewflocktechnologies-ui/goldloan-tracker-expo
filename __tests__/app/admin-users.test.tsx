import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { AdminUser } from '../../src/types';

jest.setTimeout(30000);
let mockWidth = 400;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 900, scale: 2, fontScale: 1 }),
}));

let mockIsDark = false;
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: mockIsDark, colors: require('../../src/constants/theme').LightColors }),
}));

const mockAuth: { isSuperAdmin: boolean; user: { username: string } | null } = {
  isSuperAdmin: true,
  user: { username: 'Admin' },
};
jest.mock('../../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn(), showToast: jest.fn() };
jest.mock('../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

jest.mock('../../src/services/api', () => ({
  api: {
    getAdminUsers: jest.fn(),
    addAdminUser: jest.fn(),
    updateAdminUser: jest.fn(),
    deleteAdminLoginUser: jest.fn(),
  },
}));
jest.mock('../../src/services/cache', () => ({ cache: { get: jest.fn() } }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { api } = require('../../src/services/api');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { cache } = require('../../src/services/cache');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdminUsersScreen = require('../../src/app/(tabs)/admin-users').default;

const USERS: AdminUser[] = [
  { AdminId: 'ADM001', Username: 'admin', Role: 'SuperAdmin', Status: 'Active' },
  { AdminId: 'ADM002', Username: 'staff1', Role: 'User', Status: 'Active' },
  { AdminId: 'ADM003', Username: 'staff2', Role: 'User', Status: 'Inactive' },
];

async function setup() {
  const utils = render(<AdminUsersScreen />);
  await waitFor(() => expect(api.getAdminUsers).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText('staff1')).toBeTruthy());
  return utils;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
  mockWidth = 400;
  mockIsDark = false;
  mockAuth.isSuperAdmin = true;
  mockAuth.user = { username: 'Admin' }; // differs in case on purpose
  cache.get.mockResolvedValue({ data: null, isStale: false, timestamp: null });
  api.getAdminUsers.mockResolvedValue({ success: true, data: USERS });
  api.addAdminUser.mockResolvedValue({ success: true });
  api.updateAdminUser.mockResolvedValue({ success: true });
  api.deleteAdminLoginUser.mockResolvedValue({ success: true });
});

describe('AdminUsersScreen loading', () => {
  it('fetches users (non-forced) and shows KPI counts', async () => {
    await setup();
    expect(api.getAdminUsers).toHaveBeenCalledWith(false);
    const kpi = (title: string, value: string) => {
      let n: any = screen.getAllByText(title)[0];
      while (n && within(n).queryAllByText(value).length === 0) n = n.parent;
      return n;
    };
    // The first ancestor of each title that contains the value is that KPI card itself
    expect(within(kpi('Total Admins', '3')).queryByText('SuperAdmin')).toBeNull();
    expect(within(kpi('SuperAdmin', '1')).queryByText('Total Admins')).toBeNull();
    expect(within(kpi('View-Only', '2')).queryByText('SuperAdmin')).toBeNull();
  });

  it('uses the long KPI titles on desktop', async () => {
    mockWidth = 1024;
    await setup();
    expect(screen.getByText('Total Admin Accounts')).toBeTruthy();
    expect(screen.getByText('SuperAdmin (Full Access)')).toBeTruthy();
    expect(screen.getByText('View-Only Users')).toBeTruthy();
  });

  it('hydrates instantly from cache before the network responds', async () => {
    let resolveApi!: (v: unknown) => void;
    api.getAdminUsers.mockReturnValue(new Promise((r) => { resolveApi = r; }));
    cache.get.mockResolvedValue({ data: USERS, isStale: true, timestamp: 1 });
    render(<AdminUsersScreen />);
    await waitFor(() => expect(screen.getByText('staff1')).toBeTruthy());
    expect(cache.get).toHaveBeenCalledWith('admin_users_list', true);
    await act(async () => { resolveApi({ success: true, data: USERS }); });
  });

  it('ignores an empty cache entry', async () => {
    cache.get.mockResolvedValue({ data: [], isStale: false, timestamp: 1 });
    await setup();
    expect(screen.getByText('staff1')).toBeTruthy();
  });

  it('shows a danger toast with the API error when loading fails', async () => {
    api.getAdminUsers.mockResolvedValue({ success: false, error: 'Backend down' });
    render(<AdminUsersScreen />);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Backend down'));
    expect(screen.getByText('No records found')).toBeTruthy();
  });

  it('falls back to a generic message when the API gives no error text', async () => {
    api.getAdminUsers.mockResolvedValue({ success: false });
    render(<AdminUsersScreen />);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Failed to load admin users.'));
  });

  it('shows a danger toast when the request throws', async () => {
    api.getAdminUsers.mockRejectedValue(new Error('Network down'));
    render(<AdminUsersScreen />);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Network down'));
  });

  it('uses the default message when the thrown error has no message', async () => {
    api.getAdminUsers.mockRejectedValue({});
    render(<AdminUsersScreen />);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Error fetching admin users.'));
  });

  it('shows skeleton cards while the first load is pending', async () => {
    api.getAdminUsers.mockReturnValue(new Promise(() => {}));
    render(<AdminUsersScreen />);
    await flush();
    expect(screen.queryByText('No records found')).toBeNull();
    expect(screen.queryByText('staff1')).toBeNull();
  });

  it('force-refreshes via pull to refresh', async () => {
    await setup();
    api.getAdminUsers.mockClear();
    const control = screen.UNSAFE_getAllByType(ScrollView)[0].props.refreshControl;
    expect(control.type).toBe(RefreshControl);
    await act(async () => { await control.props.onRefresh(); });
    expect(api.getAdminUsers).toHaveBeenCalledWith(true);
    expect(screen.UNSAFE_getAllByType(ScrollView)[0].props.refreshControl.props.refreshing).toBe(false);
  });
});

describe('AdminUsersScreen mobile cards', () => {
  it('renders a card per user with role, status and permissions', async () => {
    await setup();
    expect(screen.getByText('#ADM001')).toBeTruthy();
    expect(screen.getByText('#ADM002')).toBeTruthy();
    expect(screen.getByText('👑 SuperAdmin (Full Access)')).toBeTruthy();
    expect(screen.getAllByText('👁 Read-Only User')).toHaveLength(2);
    expect(screen.getByText('Full System Access')).toBeTruthy();
    expect(screen.getAllByText('View Only (Read-Only)')).toHaveLength(2);
    expect(screen.getByText('Current Active User')).toBeTruthy();
    expect(screen.getAllByText('Staff Login')).toHaveLength(2);
    expect(screen.getByText('AD')).toBeTruthy();
    expect(screen.getAllByText('ST')).toHaveLength(2);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
  });

  it('SuperAdmin sees Add User and Edit user on every card', async () => {
    await setup();
    expect(screen.getByText('Add User')).toBeTruthy();
    expect(screen.getAllByText('Edit user')).toHaveLength(3);
    expect(screen.queryByText(/Staff Directory:/)).toBeNull();
  });

  it('pressing an editable card body opens the edit modal', async () => {
    await setup();
    fireEvent.press(screen.getByText('staff2'));
    expect(screen.getByText('Edit User (staff2)')).toBeTruthy();
  });

  it('opens the edit modal from the card view link and pre-fills the form', async () => {
    await setup();
    fireEvent.press(screen.getAllByText('Edit user')[1]);
    expect(screen.getByText('Edit User (staff1)')).toBeTruthy();
    expect(screen.getByDisplayValue('staff1')).toBeTruthy();
    expect(screen.getByText('Username cannot be altered after creation.')).toBeTruthy();
    expect(screen.getByText('New Password (Optional)')).toBeTruthy();
    expect(screen.getByPlaceholderText('Leave blank to keep existing password').props.value).toBe('');
    expect(screen.getByText('Save Changes')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter login username').props.editable).toBe(false);
  });

  it('read-only user: banner shown, no Add button, only own card is editable', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'staff1' };
    await setup();
    expect(screen.getByText(/Staff Directory:/)).toBeTruthy();
    expect(screen.queryByText('Add User')).toBeNull();
    expect(screen.getAllByText('Change Password')).toHaveLength(1);
    expect(screen.queryByText('Edit user')).toBeNull();
    expect(screen.getByText('Current Active User')).toBeTruthy();
  });

  it('read-only user sees non-editable cards for others (no menu, no link action)', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = null; // no current user: nothing is self
    await setup();
    expect(screen.queryByText('Change Password')).toBeNull();
    expect(screen.queryByText('Edit user')).toBeNull();
    // pressing the card itself does nothing
    fireEvent.press(screen.getByText('staff1'));
    expect(screen.queryByText(/Change Password \(/)).toBeNull();
    expect(screen.queryByText('Add New Admin / User')).toBeNull();
  });

  it('read-only user editing own account via card shows password-only form', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'staff1' };
    await setup();
    fireEvent.press(screen.getByText('Change Password'));
    expect(screen.getByText('Change Password (staff1)')).toBeTruthy();
    expect(screen.getByText('New Password *')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your new password')).toBeTruthy();
    expect(screen.getByText('Enter your new password and click Save to update.')).toBeTruthy();
    expect(screen.getByText('Update Password')).toBeTruthy();
    expect(screen.getByText('Assigned Role')).toBeTruthy();
    expect(screen.getByText('User (Role changes must be made by a SuperAdmin)')).toBeTruthy();
    // only the 3 card metric labels remain; no Status toggle in the modal
    expect(screen.getAllByText('Status')).toHaveLength(3);
    expect(screen.queryByText('Account Role & Access Level *')).toBeNull();
  });

});

/** Open the three-dot menu of a given card by its title. */
function openCardMenu(title: string) {
  const { Modal } = require('react-native');
  // The i-th card's overflow button: find card root via title text
  const titleNode = screen.getByText(title);
  let node: any = titleNode;
  // climb to the TouchableOpacity card (has onPress and style card) containing an ellipsis button
  while (node && !(node.props && node.props.activeOpacity === 0.7 && node.props.onPress && hasEllipsis(node))) {
    node = node.parent;
  }
  const buttons = node.findAll(
    (n: any) => n.props && n.props.hitSlop && n.props.onPress && typeof n.type !== 'string'
  );
  act(() => buttons[0].props.onPress());
  return Modal;
}
function hasEllipsis(node: any) {
  return node.findAll((n: any) => n.props && n.props.hitSlop && n.props.onPress).length > 0;
}

describe('AdminUsersScreen card overflow menu', () => {
  it('SuperAdmin: Edit / Reset Password and Delete Account for another user', async () => {
    await setup();
    openCardMenu('staff1');
    expect(screen.getByText('Edit / Reset Password')).toBeTruthy();
    expect(screen.getByText('Delete Account')).toBeTruthy();

    fireEvent.press(screen.getByText('Edit / Reset Password'));
    expect(screen.getByText('Edit User (staff1)')).toBeTruthy();
  });

  it('SuperAdmin: choosing Delete Account opens the confirm dialog', async () => {
    await setup();
    openCardMenu('staff1');
    fireEvent.press(screen.getByText('Delete Account'));
    expect(screen.getByText('Delete Login User')).toBeTruthy();
    expect(screen.getByText(/delete the login account for 'staff1'/)).toBeTruthy();
  });

  it('SuperAdmin: own card menu has no delete option', async () => {
    await setup();
    openCardMenu('admin');
    expect(screen.getByText('Edit / Reset Password')).toBeTruthy();
    expect(screen.queryByText('Delete Account')).toBeNull();
  });

  it('regular user: own card menu says Change Password', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'staff2' };
    await setup();
    openCardMenu('staff2');
    expect(screen.getAllByText('Change Password').length).toBeGreaterThan(1);
    expect(screen.queryByText('Delete Account')).toBeNull();
  });
});

describe('AdminUsersScreen desktop table', () => {
  beforeEach(() => { mockWidth = 1024; });

  it('renders headers and rows with roles, permissions and status', async () => {
    await setup();
    for (const h of ['Admin ID', 'Username', 'Assigned Role', 'Permission Level', 'Account Status', 'Actions']) {
      expect(screen.getByText(h)).toBeTruthy();
    }
    expect(screen.getByText('ADM002')).toBeTruthy();
    expect(screen.getByText('Full Access (Read/Write/Delete)')).toBeTruthy();
    expect(screen.getAllByText('Read-Only (View Only)')).toHaveLength(2);
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('SuperAdmin')).toBeTruthy();
    expect(screen.getAllByText('User')).toHaveLength(2);
    expect(screen.getByText('Inactive')).toBeTruthy();
  });

  it('renders in dark mode', async () => {
    mockIsDark = true;
    await setup();
    expect(screen.getByText('staff1')).toBeTruthy();
  });

  it('SuperAdmin gets edit on all rows and delete on all but self', async () => {
    await setup();
    expect(screen.getAllByLabelText('Edit User')).toHaveLength(2);
    expect(screen.getAllByLabelText('Change Password')).toHaveLength(1); // self row
    expect(screen.getAllByLabelText('Delete Account')).toHaveLength(2);
  });

  it('read-only user can only change own password and cannot delete', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'STAFF1' };
    await setup();
    expect(screen.getAllByLabelText('Change Password')).toHaveLength(1);
    expect(screen.queryByLabelText('Edit User')).toBeNull();
    expect(screen.queryByLabelText('Delete Account')).toBeNull();
    // Other two rows show a dash placeholder
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText('Add User')).toBeNull();
  });

  it('opens add modal from the Add User button', async () => {
    await setup();
    fireEvent.press(screen.getByText('Add User'));
    expect(screen.getByText('Add New Admin / User')).toBeTruthy();
  });

  it('opens edit modal from the pencil button', async () => {
    await setup();
    fireEvent.press(screen.getAllByLabelText('Edit User')[0]);
    expect(screen.getByText('Edit User (staff1)')).toBeTruthy();
  });

  it('deleting from the table uses the confirm dialog', async () => {
    await setup();
    fireEvent.press(screen.getAllByLabelText('Delete Account')[0]);
    expect(screen.getByText('Delete Login User')).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete Login User')).toBeNull();
    expect(api.deleteAdminLoginUser).not.toHaveBeenCalled();
  });

});

describe('AdminUsersScreen search', () => {
  const search = (t: string) => fireEvent.changeText(screen.getByPlaceholderText('Search username, ID, role or status...'), t);

  it('filters by username', async () => {
    await setup();
    search('STAFF2');
    expect(screen.getByText('staff2')).toBeTruthy();
    expect(screen.queryByText('staff1')).toBeNull();
  });

  it('filters by admin id, role and status', async () => {
    await setup();
    search('adm003');
    expect(screen.getByText('staff2')).toBeTruthy();
    expect(screen.queryByText('staff1')).toBeNull();
    search('superadmin');
    expect(screen.getByText('admin')).toBeTruthy();
    expect(screen.queryByText('staff2')).toBeNull();
    search('inactive');
    expect(screen.getByText('staff2')).toBeTruthy();
    expect(screen.queryByText('admin')).toBeNull();
  });

  it('shows empty state with no matches', async () => {
    await setup();
    search('nobody');
    expect(screen.getByText('No records found')).toBeTruthy();
  });
});

describe('AdminUsersScreen add user', () => {
  const openAdd = async () => {
    await setup();
    fireEvent.press(screen.getByText('Add User'));
  };

  it('opens a blank form with default User role and Active status', async () => {
    await openAdd();
    expect(screen.getByText('Add New Admin / User')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter login username').props.value).toBe('');
    expect(screen.getByPlaceholderText('Enter password').props.value).toBe('');
    expect(screen.getByText('Password *')).toBeTruthy();
    expect(screen.getByText('Create User')).toBeTruthy();
    expect(screen.queryByText('Username cannot be altered after creation.')).toBeNull();
    expect(screen.getByText('Account Role & Access Level *')).toBeTruthy();
    expect(screen.getByText('Read-only. Can inspect loans, customers & vault, but cannot create, edit, or delete records.')).toBeTruthy();
  });

  it('requires a username', async () => {
    await openAdd();
    fireEvent.press(screen.getByText('Create User'));
    expect(screen.getByText('Username is required.')).toBeTruthy();
    expect(api.addAdminUser).not.toHaveBeenCalled();
  });

  it('treats whitespace-only username as missing', async () => {
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), '   ');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));
    expect(screen.getByText('Username is required.')).toBeTruthy();
  });

  it('requires a password', async () => {
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'newbie');
    fireEvent.press(screen.getByText('Create User'));
    expect(screen.getByText('Password is required for new accounts.')).toBeTruthy();
    expect(api.addAdminUser).not.toHaveBeenCalled();
  });

  it('creates a user with trimmed values, default role and status', async () => {
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), '  newbie ');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), ' secret1 ');
    fireEvent.press(screen.getByText('Create User'));

    await waitFor(() =>
      expect(api.addAdminUser).toHaveBeenCalledWith({ username: 'newbie', password: 'secret1', role: 'User', status: 'Active' })
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("User 'newbie' created with role 'User'."));
    // list is force-reloaded and modal closes
    await waitFor(() => expect(api.getAdminUsers).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText('Add New Admin / User')).toBeNull();
  });

  it('creates a SuperAdmin with Inactive status when selected', async () => {
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'boss');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getAllByText('SuperAdmin').slice(-1)[0]);
    fireEvent.press(screen.getAllByText('Inactive').slice(-1)[0]);
    // switch back and forth to cover both role/status selectors
    fireEvent.press(screen.getAllByText('User').slice(-1)[0]);
    fireEvent.press(screen.getAllByText('SuperAdmin').slice(-1)[0]);
    fireEvent.press(screen.getByText('Create User'));

    await waitFor(() =>
      expect(api.addAdminUser).toHaveBeenCalledWith({ username: 'boss', password: 'pw', role: 'SuperAdmin', status: 'Inactive' })
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("User 'boss' created with role 'SuperAdmin'."));
  });

  it('shows the API error inside the modal and keeps it open', async () => {
    api.addAdminUser.mockResolvedValue({ success: false, error: 'Username already exists' });
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'dup');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));
    expect(await screen.findByText('Username already exists')).toBeTruthy();
    expect(screen.getByText('Add New Admin / User')).toBeTruthy();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('falls back to a generic create error', async () => {
    api.addAdminUser.mockResolvedValue({ success: false });
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'dup');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));
    expect(await screen.findByText('Failed to create user.')).toBeTruthy();
  });

  it('shows the thrown error message', async () => {
    api.addAdminUser.mockRejectedValue(new Error('Boom'));
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'dup');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));
    expect(await screen.findByText('Boom')).toBeTruthy();
  });

  it('falls back to a generic message for thrown errors without text', async () => {
    api.addAdminUser.mockRejectedValue({});
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'dup');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));
    expect(await screen.findByText('Unexpected submission error.')).toBeTruthy();
  });

  it('disables inputs and shows a spinner while submitting', async () => {
    let resolveAdd!: (v: unknown) => void;
    api.addAdminUser.mockReturnValue(new Promise((r) => { resolveAdd = r; }));
    await openAdd();
    fireEvent.changeText(screen.getByPlaceholderText('Enter login username'), 'slow');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'pw');
    fireEvent.press(screen.getByText('Create User'));

    await waitFor(() => expect(screen.queryByText('Create User')).toBeNull());
    expect(screen.getByPlaceholderText('Enter password').props.editable).toBe(false);

    await act(async () => { resolveAdd({ success: true }); });
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('clears a previous error when the form is reopened', async () => {
    await openAdd();
    fireEvent.press(screen.getByText('Create User'));
    expect(screen.getByText('Username is required.')).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Add New Admin / User')).toBeNull();
    fireEvent.press(screen.getByText('Add User'));
    expect(screen.queryByText('Username is required.')).toBeNull();
  });

  it('closes via the X button', async () => {
    await openAdd();
    fireEvent.press(screen.getByText('close'));
    expect(screen.queryByText('Add New Admin / User')).toBeNull();
  });
});

describe('AdminUsersScreen edit user', () => {
  const openEdit = async (name = 'staff1') => {
    await setup();
    const idx = USERS.findIndex((u) => u.Username === name);
    fireEvent.press(screen.getAllByText('Edit user')[idx]);
  };

  it('SuperAdmin update sends role and status without password when left blank', async () => {
    await openEdit('staff1');
    fireEvent.press(screen.getAllByText('SuperAdmin').slice(-1)[0]);
    fireEvent.press(screen.getAllByText('Inactive').slice(-1)[0]);
    fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() =>
      expect(api.updateAdminUser).toHaveBeenCalledWith('ADM002', { role: 'SuperAdmin', status: 'Inactive' })
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("User 'staff1' updated successfully."));
    await waitFor(() => expect(api.getAdminUsers).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText('Edit User (staff1)')).toBeNull();
  });

  it('pre-selects the existing status of an inactive user', async () => {
    await openEdit('staff2');
    fireEvent.press(screen.getByText('Save Changes'));
    await waitFor(() =>
      expect(api.updateAdminUser).toHaveBeenCalledWith('ADM003', { role: 'User', status: 'Inactive' })
    );
  });

  it('SuperAdmin password reset sends the trimmed password and a password toast', async () => {
    await openEdit('staff1');
    fireEvent.changeText(screen.getByPlaceholderText('Leave blank to keep existing password'), '  newpass ');
    fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() =>
      expect(api.updateAdminUser).toHaveBeenCalledWith('ADM002', { role: 'User', status: 'Active', password: 'newpass' })
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("Password updated successfully for 'staff1'."));
  });

  it('shows the API error when update fails and keeps modal open', async () => {
    api.updateAdminUser.mockResolvedValue({ success: false, error: 'Cannot demote last admin' });
    await openEdit('admin');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(await screen.findByText('Cannot demote last admin')).toBeTruthy();
    expect(screen.getByText('Edit User (admin)')).toBeTruthy();
  });

  it('falls back to a generic update error', async () => {
    api.updateAdminUser.mockResolvedValue({ success: false });
    await openEdit('staff1');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(await screen.findByText('Failed to update user.')).toBeTruthy();
  });

  it('shows a thrown update error', async () => {
    api.updateAdminUser.mockRejectedValue(new Error('Timeout'));
    await openEdit('staff1');
    fireEvent.press(screen.getByText('Save Changes'));
    expect(await screen.findByText('Timeout')).toBeTruthy();
  });

  it('regular user must enter a new password', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'staff1' };
    await setup();
    fireEvent.press(screen.getByText('Change Password'));
    fireEvent.press(screen.getByText('Update Password'));
    expect(screen.getByText('Please enter a new password.')).toBeTruthy();
    expect(api.updateAdminUser).not.toHaveBeenCalled();
  });

  it('regular user updates only the password (no role / status sent)', async () => {
    mockAuth.isSuperAdmin = false;
    mockAuth.user = { username: 'staff1' };
    await setup();
    fireEvent.press(screen.getByText('Change Password'));
    fireEvent.changeText(screen.getByPlaceholderText('Enter your new password'), 'mine123');
    fireEvent.press(screen.getByText('Update Password'));

    await waitFor(() => expect(api.updateAdminUser).toHaveBeenCalledWith('ADM002', { password: 'mine123' }));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("Password updated successfully for 'staff1'."));
  });
});

describe('AdminUsersScreen delete user', () => {
  const openDelete = async (name = 'staff1') => {
    await setup();
    openCardMenu(name);
    fireEvent.press(screen.getByText('Delete Account'));
  };

  it('deletes after confirmation, toasts, closes dialog and reloads', async () => {
    await openDelete('staff2');
    expect(screen.getByText(/delete the login account for 'staff2'/)).toBeTruthy();
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);

    await waitFor(() => expect(api.deleteAdminLoginUser).toHaveBeenCalledWith('ADM003'));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("Account for 'staff2' removed."));
    await waitFor(() => expect(api.getAdminUsers).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText('Delete Login User')).toBeNull();
  });

  it('cancel keeps the account', async () => {
    await openDelete('staff1');
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete Login User')).toBeNull();
    expect(api.deleteAdminLoginUser).not.toHaveBeenCalled();
  });

  it('dismisses via the dialog close icon / back request', async () => {
    await openDelete('staff1');
    const { Modal } = require('react-native');
    const modals = screen.UNSAFE_getAllByType(Modal);
    const confirm = modals.find((m: any) => m.props.visible && m.props.onRequestClose);
    act(() => confirm!.props.onRequestClose());
    expect(screen.queryByText('Delete Login User')).toBeNull();
  });

  it('shows the API error as a toast and leaves the dialog open', async () => {
    api.deleteAdminLoginUser.mockResolvedValue({ success: false, error: 'Forbidden' });
    await openDelete('staff1');
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Forbidden'));
    expect(screen.getByText('Delete Login User')).toBeTruthy();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('falls back to a generic delete error', async () => {
    api.deleteAdminLoginUser.mockResolvedValue({ success: false });
    await openDelete('staff1');
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Failed to delete account.'));
  });

  it('toasts a thrown delete error', async () => {
    api.deleteAdminLoginUser.mockRejectedValue(new Error('Offline'));
    await openDelete('staff1');
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Offline'));
  });

  it('uses a generic message for thrown delete errors without text', async () => {
    api.deleteAdminLoginUser.mockRejectedValue({});
    await openDelete('staff1');
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);
    await waitFor(() => expect(mockToast.danger).toHaveBeenCalledWith('Error deleting account.'));
  });

  it('shows Deleting... label while the request is in flight', async () => {
    let resolveDel!: (v: unknown) => void;
    api.deleteAdminLoginUser.mockReturnValue(new Promise((r) => { resolveDel = r; }));
    await openDelete('staff1');
    fireEvent.press(screen.getAllByText('Delete Account').slice(-1)[0]);
    expect(await screen.findByText('Deleting...')).toBeTruthy();
    await act(async () => { resolveDel({ success: true }); });
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });
});
