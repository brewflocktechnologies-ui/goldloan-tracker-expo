import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import RootIndex from '../../src/app/index';
import RootLayout from '../../src/app/_layout';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockPathname = '/';
const mockStackScreens: any[] = [];
let mockStackProps: any = null;
let mockStatusBarProps: any = null;
let mockRedirectHref: any = null;

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stack: any = (props: any) => {
    mockStackProps = props;
    return React.createElement(View, { testID: 'stack' }, props.children);
  };
  Stack.Screen = (props: any) => {
    mockStackScreens.push(props);
    return null;
  };
  return {
    Stack,
    useRouter: () => mockRouter,
    usePathname: () => mockPathname,
    Redirect: (props: any) => {
      mockRedirectHref = props.href;
      return React.createElement(View, { testID: 'redirect' });
    },
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: (props: any) => {
    mockStatusBarProps = props;
    return null;
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) =>
      React.createElement(View, { testID: 'safe-area' }, children),
  };
});

const mockApiInit = jest.fn();
jest.mock('../../src/config/api', () => ({
  ApiConfig: { init: (...a: any[]) => mockApiInit(...a) },
}));

let mockAuth = { isAuthenticated: false, isLoading: false };
jest.mock('../../src/context/AuthContext', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useAuth: () => mockAuth,
    AuthProvider: ({ children }: any) =>
      React.createElement(View, { testID: 'auth-provider' }, children),
  };
});

let mockIsDark = false;
jest.mock('../../src/context/ThemeContext', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useTheme: () => ({ isDark: mockIsDark }),
    ThemeProvider: ({ children }: any) =>
      React.createElement(View, { testID: 'theme-provider' }, children),
  };
});

jest.mock('../../src/context/ToastContext', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ToastProvider: ({ children }: any) =>
      React.createElement(View, { testID: 'toast-provider' }, children),
  };
});

const originalOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/';
  mockAuth = { isAuthenticated: false, isLoading: false };
  mockIsDark = false;
  mockStackScreens.length = 0;
  mockStackProps = null;
  mockStatusBarProps = null;
  mockRedirectHref = null;
});

afterEach(() => {
  (Platform as any).OS = originalOS;
  delete (global as any).document;
});

// jest-expo's native environment has no DOM, so provide a minimal fake one.
const installFakeDocument = () => {
  const els: Record<string, any> = {};
  const appended: any[] = [];
  (global as any).document = {
    getElementById: (id: string) => els[id] ?? null,
    createElement: (tag: string) => ({ tag, id: '', textContent: '' }),
    head: {
      appendChild: (el: any) => {
        els[el.id] = el;
        appended.push(el);
      },
    },
  };
  return { appended };
};

describe('RootIndex', () => {
  it('shows a spinner and no redirect while auth is loading', () => {
    mockAuth = { isAuthenticated: true, isLoading: true };
    const { UNSAFE_getByType } = render(<RootIndex />);
    const { ActivityIndicator } = require('react-native');
    const spinner = UNSAFE_getByType(ActivityIndicator);
    expect(spinner.props.size).toBe('large');
    expect(spinner.props.color).toBe('#0284c7');
    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('redirects authenticated users to the tabs', () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    render(<RootIndex />);
    expect(screen.getByTestId('redirect')).toBeTruthy();
    expect(mockRedirectHref).toBe('/(tabs)');
  });

  it('redirects unauthenticated users to login', () => {
    mockAuth = { isAuthenticated: false, isLoading: false };
    render(<RootIndex />);
    expect(mockRedirectHref).toBe('/login');
  });
});

describe('RootLayout wiring', () => {
  it('nests providers: SafeArea > Theme > Toast > Auth', () => {
    render(<RootLayout />);
    const safe = screen.getByTestId('safe-area');
    const theme = screen.getByTestId('theme-provider');
    const toast = screen.getByTestId('toast-provider');
    const auth = screen.getByTestId('auth-provider');
    const stack = screen.getByTestId('stack');
    const hasAncestor = (node: any, anc: any) => {
      for (let p = node.parent; p; p = p.parent) if (p === anc) return true;
      return false;
    };
    expect(hasAncestor(theme, safe)).toBe(true);
    expect(hasAncestor(toast, theme)).toBe(true);
    expect(hasAncestor(auth, toast)).toBe(true);
    expect(hasAncestor(stack, auth)).toBe(true);
  });

  it('initialises ApiConfig exactly once on mount', () => {
    const { rerender } = render(<RootLayout />);
    rerender(<RootLayout />);
    expect(mockApiInit).toHaveBeenCalledTimes(1);
  });

  it('configures stack with hidden headers and all screens', () => {
    render(<RootLayout />);
    expect(mockStackProps.screenOptions).toEqual({ headerShown: false });
    const byName = Object.fromEntries(mockStackScreens.map((s) => [s.name, s.options]));
    expect(Object.keys(byName).sort()).toEqual(
      ['(tabs)', 'bank-accounts/form', 'loans/[id]', 'loans/new', 'login'].sort()
    );
    expect(byName['login']).toEqual({ headerShown: false });
    expect(byName['(tabs)']).toEqual({ headerShown: false });
    expect(byName['loans/[id]']).toEqual({ headerShown: false });
    expect(byName['loans/new']).toEqual({ presentation: 'modal', headerShown: false });
    expect(byName['bank-accounts/form']).toEqual({ presentation: 'modal', headerShown: false });
  });

  it('uses dark status bar content in light theme and light content in dark theme', () => {
    render(<RootLayout />);
    expect(mockStatusBarProps.style).toBe('dark');
    mockIsDark = true;
    render(<RootLayout />);
    expect(mockStatusBarProps.style).toBe('light');
  });
});

describe('RootLayout auth redirects', () => {
  it('does nothing while auth is loading', () => {
    mockAuth = { isAuthenticated: false, isLoading: true };
    mockPathname = '/loans';
    render(<RootLayout />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users on a protected route to /login', () => {
    mockPathname = '/loans';
    render(<RootLayout />);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('does not redirect unauthenticated users already on /login', () => {
    mockPathname = '/login';
    render(<RootLayout />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('redirects authenticated users on /login to the tabs', () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    mockPathname = '/login';
    render(<RootLayout />);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('leaves authenticated users on other routes alone', () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    mockPathname = '/loans';
    render(<RootLayout />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('re-evaluates when auth state or pathname changes', () => {
    mockAuth = { isAuthenticated: true, isLoading: true };
    mockPathname = '/login';
    const { rerender } = render(<RootLayout />);
    expect(mockRouter.replace).not.toHaveBeenCalled();

    mockAuth = { isAuthenticated: true, isLoading: false };
    rerender(<RootLayout />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');

    mockRouter.replace.mockClear();
    mockAuth = { isAuthenticated: false, isLoading: false };
    mockPathname = '/loans/1';
    rerender(<RootLayout />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });
});

describe('RootLayout web style injection', () => {
  it('does not inject styles on native platforms', () => {
    (Platform as any).OS = 'ios';
    const { appended } = installFakeDocument();
    render(<RootLayout />);
    expect(appended).toHaveLength(0);
  });

  it('injects the input focus reset style once on web', () => {
    (Platform as any).OS = 'web';
    const { appended } = installFakeDocument();
    const { unmount } = render(<RootLayout />);
    expect(appended).toHaveLength(1);
    expect(appended[0].id).toBe('rnw-input-focus-reset');
    expect(appended[0].textContent).toContain('outline: none !important');
    expect(appended[0].textContent).toContain('input:focus');
    unmount();

    render(<RootLayout />);
    expect(appended).toHaveLength(1);
  });

  it('skips injection when document is undefined on web', () => {
    (Platform as any).OS = 'web';
    delete (global as any).document;
    expect(() => render(<RootLayout />)).not.toThrow();
    expect(mockApiInit).toHaveBeenCalled();
  });
});
