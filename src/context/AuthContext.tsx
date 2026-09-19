import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthSession, UserRole } from '../types';
import { api } from '../services/api';

const STORAGE_KEY_SESSION = '@goldloan_auth_session';

interface AuthContextType {
  user: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isReadOnly: boolean;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSuperAdmin: false,
  isReadOnly: false,
  role: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
        if (stored) {
          const session: AuthSession = JSON.parse(stored);
          if (session && session.token) {
            setUser(session);
            api.setSessionToken(session.token);
            import('../services/store').then(({ syncFromBackend }) => syncFromBackend(true));
          }
        }
      } catch (err) {
        console.warn('Failed to restore authentication session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();

    // Listen for 401 unauthorized / expired tokens from the API layer
    api.onUnauthorized(() => {
      console.warn('[Auth] Server rejected session token. Logging out.');
      logout();
    });
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.login(username, password);
      if (res.success && res.data) {
        const session: AuthSession = {
          username: res.data.username,
          role: res.data.role,
          token: res.data.token,
        };
        setUser(session);
        api.setSessionToken(session.token);
        await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        import('../services/store').then(({ syncFromBackend }) => syncFromBackend(true));
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials or connection error.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed unexpectedly.' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setUser(null);
      api.setSessionToken(null);
      await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
    }
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isReadOnly = user?.role === 'User';
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isReadOnly,
        role,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
