import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Dimensions, Keyboard, LayoutAnimation, Platform } from 'react-native';
import LoginScreen from '../../src/app/login';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const mockLogin = jest.fn();
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

let mockIsDark = false;
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: mockIsDark,
    colors: require('../../src/constants/theme').LightColors,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }),
}));

const originalOS = Platform.OS;
let listeners: Record<string, () => void>;
let removers: jest.Mock[];

const setWidth = (width: number) => {
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 } as any);
};

const typeCreds = (user: string, pass: string) => {
  fireEvent.changeText(screen.getByPlaceholderText('Enter username'), user);
  fireEvent.changeText(screen.getByPlaceholderText('Enter password'), pass);
};

const pressSubmit = () => fireEvent.press(screen.getAllByText('Sign In')[1]);

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDark = false;
  (Platform as any).OS = 'ios';
  setWidth(390);
  listeners = {};
  removers = [];
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((evt: string, cb: () => void) => {
    listeners[evt] = cb;
    const remove = jest.fn();
    if (/keyboard(Will|Did)(Show|Hide)/.test(evt)) removers.push(remove);
    return { remove } as any;
  }) as any);
  jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});
});

afterEach(() => {
  (Platform as any).OS = originalOS;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('LoginScreen rendering', () => {
  it('renders brand, form and security note', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Goldora')).toBeTruthy();
    expect(screen.getByText('Bangalore Gold Valuation System')).toBeTruthy();
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
    expect(screen.getByText('Enter your credentials to access the portfolio')).toBeTruthy();
    expect(screen.getByText('Username')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText('256-Bit Encrypted Session Security')).toBeTruthy();
    expect(screen.getAllByText('Sign In')).toHaveLength(2);
    expect(screen.queryByText('Please enter your username.')).toBeNull();
  });

  it('renders in dark mode', () => {
    mockIsDark = true;
    render(<LoginScreen />);
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('renders desktop layout for wide screens', () => {
    setWidth(1024);
    render(<LoginScreen />);
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('masks the password by default and toggles visibility', () => {
    render(<LoginScreen />);
    const pw = () => screen.getByPlaceholderText('Enter password');
    expect(pw().props.secureTextEntry).toBe(true);
    expect(screen.getByText('eye-outline')).toBeTruthy();

    fireEvent.press(screen.getByText('eye-outline'));
    expect(pw().props.secureTextEntry).toBe(false);
    expect(screen.getByText('eye-off-outline')).toBeTruthy();

    fireEvent.press(screen.getByText('eye-off-outline'));
    expect(pw().props.secureTextEntry).toBe(true);
  });

  it('updates input values on change', () => {
    render(<LoginScreen />);
    typeCreds('alice', 'secret');
    expect(screen.getByPlaceholderText('Enter username').props.value).toBe('alice');
    expect(screen.getByPlaceholderText('Enter password').props.value).toBe('secret');
  });
});

describe('LoginScreen validation', () => {
  it('shows username error when both fields are empty', () => {
    render(<LoginScreen />);
    pressSubmit();
    expect(screen.getByText('Please enter your username.')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('treats whitespace-only username as empty', () => {
    render(<LoginScreen />);
    typeCreds('   ', 'pw');
    pressSubmit();
    expect(screen.getByText('Please enter your username.')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows password error when only username supplied', () => {
    render(<LoginScreen />);
    typeCreds('alice', '   ');
    pressSubmit();
    expect(screen.getByText('Please enter your password.')).toBeTruthy();
    expect(screen.queryByText('Please enter your username.')).toBeNull();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('clears the previous error when submitting again', async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginScreen />);
    pressSubmit();
    expect(screen.getByText('Please enter your username.')).toBeTruthy();
    typeCreds('alice', 'pw');
    pressSubmit();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    expect(screen.queryByText('Please enter your username.')).toBeNull();
  });
});

describe('LoginScreen submit', () => {
  it('logs in with trimmed credentials and navigates to tabs', async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginScreen />);
    typeCreds('  alice  ', '  secret  ');
    pressSubmit();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockLogin).toHaveBeenCalledWith('alice', 'secret');
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('submits via password keyboard "go"', async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginScreen />);
    typeCreds('alice', 'pw');
    fireEvent(screen.getByPlaceholderText('Enter password'), 'submitEditing');
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockLogin).toHaveBeenCalledWith('alice', 'pw');
  });

  it('shows server-provided error on failed login and does not navigate', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Account locked' });
    render(<LoginScreen />);
    typeCreds('alice', 'bad');
    pressSubmit();
    expect(await screen.findByText('Account locked')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText('alert-circle')).toBeTruthy();
  });

  it('shows default error when failure has no message', async () => {
    mockLogin.mockResolvedValue({ success: false });
    render(<LoginScreen />);
    typeCreds('alice', 'bad');
    pressSubmit();
    expect(await screen.findByText('Invalid username or password.')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('shows thrown error message', async () => {
    mockLogin.mockRejectedValue(new Error('Boom'));
    render(<LoginScreen />);
    typeCreds('alice', 'pw');
    pressSubmit();
    expect(await screen.findByText('Boom')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('shows network fallback when thrown error has no message', async () => {
    mockLogin.mockRejectedValue({});
    render(<LoginScreen />);
    typeCreds('alice', 'pw');
    pressSubmit();
    expect(
      await screen.findByText('Unable to connect. Please check your network.')
    ).toBeTruthy();
  });

  it('shows loading state while pending and restores afterwards', async () => {
    let resolve!: (v: any) => void;
    mockLogin.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LoginScreen />);
    typeCreds('alice', 'pw');
    pressSubmit();

    await waitFor(() => expect(screen.getAllByText('Sign In')).toHaveLength(1));
    expect(screen.queryByText('arrow-forward')).toBeNull();
    expect(screen.getByPlaceholderText('Enter username').props.editable).toBe(false);
    expect(screen.getByPlaceholderText('Enter password').props.editable).toBe(false);

    await act(async () => {
      resolve({ success: false, error: 'nope' });
    });
    expect(await screen.findByText('nope')).toBeTruthy();
    expect(screen.getAllByText('Sign In')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Enter username').props.editable).toBe(true);
  });
});

describe('LoginScreen focus and keyboard behaviour', () => {
  it('handles username submitEditing (focus password) without throwing', () => {
    render(<LoginScreen />);
    expect(() =>
      fireEvent(screen.getByPlaceholderText('Enter username'), 'submitEditing')
    ).not.toThrow();
  });

  it('schedules scroll timers on mobile field focus', () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(global, 'setTimeout');
    render(<LoginScreen />);
    spy.mockClear();
    fireEvent(screen.getByPlaceholderText('Enter username'), 'focus');
    fireEvent(screen.getByPlaceholderText('Enter password'), 'focus');
    const delays = spy.mock.calls.map(([, ms]) => ms);
    expect(delays).toContain(100);
    expect(delays).toContain(120);
    act(() => {
      jest.advanceTimersByTime(200);
    });
  });

  it('does not schedule scrolls on desktop', () => {
    jest.useFakeTimers();
    setWidth(1024);
    const spy = jest.spyOn(global, 'setTimeout');
    render(<LoginScreen />);
    spy.mockClear();
    fireEvent(screen.getByPlaceholderText('Enter username'), 'focus');
    fireEvent(screen.getByPlaceholderText('Enter password'), 'focus');
    const scrollTimers = spy.mock.calls.filter(([, ms]) => ms === 100 || ms === 120);
    expect(scrollTimers).toHaveLength(0);
  });

  it('collapses header on mobile when keyboard shows and restores on hide (iOS events)', () => {
    render(<LoginScreen />);
    expect(Object.keys(listeners).sort()).toEqual(['keyboardWillHide', 'keyboardWillShow']);

    act(() => listeners.keyboardWillShow());
    expect(LayoutAnimation.configureNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Live Cloud Server')).toBeNull();
    expect(screen.queryByText('Bangalore Gold Valuation System')).toBeNull();

    act(() => listeners.keyboardWillHide());
    expect(LayoutAnimation.configureNext).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('uses Android keyboard events', () => {
    (Platform as any).OS = 'android';
    render(<LoginScreen />);
    expect(Object.keys(listeners).sort()).toEqual(['keyboardDidHide', 'keyboardDidShow']);
    act(() => listeners.keyboardDidShow());
    expect(screen.queryByText('Live Cloud Server')).toBeNull();
    act(() => listeners.keyboardDidHide());
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('skips LayoutAnimation on web but still updates state', () => {
    (Platform as any).OS = 'web';
    render(<LoginScreen />);
    act(() => listeners.keyboardDidShow());
    expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    expect(screen.queryByText('Live Cloud Server')).toBeNull();
    act(() => listeners.keyboardDidHide());
    expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('keeps the full header on desktop when keyboard opens', () => {
    setWidth(1024);
    render(<LoginScreen />);
    act(() => listeners.keyboardWillShow());
    expect(screen.getByText('Live Cloud Server')).toBeTruthy();
  });

  it('removes keyboard listeners on unmount', () => {
    const { unmount } = render(<LoginScreen />);
    expect(removers.length).toBeGreaterThanOrEqual(2);
    unmount();
    removers.forEach((r) => expect(r).toHaveBeenCalledTimes(1));
  });

  it('enables experimental LayoutAnimation on Android at module load', () => {
    jest.isolateModules(() => {
      (Platform as any).OS = 'android';
      const rn = require('react-native');
      const fn = jest.fn();
      rn.UIManager.setLayoutAnimationEnabledExperimental = fn;
      require('../../src/app/login');
      expect(fn).toHaveBeenCalledWith(true);
    });
  });
});
