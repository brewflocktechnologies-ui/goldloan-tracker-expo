import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiConfig } from '../config/api';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

export default function RootLayout() {
  useEffect(() => {
    ApiConfig.init();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'rnw-input-focus-reset';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input, textarea, select {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          input:focus, textarea:focus, select:focus {
            outline: none !important;
            box-shadow: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RootLayoutInner />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutInner() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const isLoginScreen = pathname === '/login';
    if (!isAuthenticated && !isLoginScreen) {
      router.replace('/login' as any);
    } else if (isAuthenticated && isLoginScreen) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, pathname]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="customers/new" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
        <Stack.Screen 
          name="customers/[id]" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ornaments/new" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
        <Stack.Screen 
          name="ornaments/[id]" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="loans/new" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
        <Stack.Screen 
          name="loans/[id]" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="loans/closure" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
      </Stack>
    </>
  );
}
