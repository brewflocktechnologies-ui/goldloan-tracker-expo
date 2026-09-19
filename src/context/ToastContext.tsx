import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string, type?: ToastType) => void;
  success: (message: string) => void;
  danger: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<any>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacityAnim, translateYAnim]);

  const showToast = useCallback((options: ToastOptions | string, explicitType?: ToastType) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const message = typeof options === 'string' ? options : options.message;
    const type: ToastType = typeof options === 'object' && options.type ? options.type : explicitType || 'success';
    const duration = typeof options === 'object' && options.duration ? options.duration : 3200;

    setToast({ message, type });

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      dismissToast();
    }, duration);
  }, [opacityAnim, translateYAnim, dismissToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const danger = useCallback((msg: string) => showToast(msg, 'danger'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  const getIcon = (type: ToastType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'danger':
        return 'trash-outline';
      case 'warning':
        return 'alert-circle-outline';
      case 'info':
        return 'information-circle-outline';
      case 'success':
      default:
        return 'checkmark-circle';
    }
  };

  const getAccentColor = (type: ToastType) => {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#38bdf8';
      case 'success':
      default:
        return isDark ? '#4ade80' : '#16a34a';
    }
  };

  const getBgColor = (type: ToastType) => {
    if (isDark) {
      switch (type) {
        case 'danger':
          return '#2b0c10';
        case 'warning':
          return '#2b1b06';
        case 'info':
          return '#092136';
        case 'success':
        default:
          return '#092819';
      }
    } else {
      switch (type) {
        case 'danger':
          return '#fef2f2';
        case 'warning':
          return '#fffbeb';
        case 'info':
          return '#f0f9ff';
        case 'success':
        default:
          return '#f0fdf4';
      }
    }
  };

  const getBorderColor = (type: ToastType) => {
    if (isDark) {
      switch (type) {
        case 'danger':
          return '#7f1d1d';
        case 'warning':
          return '#78350f';
        case 'info':
          return '#075985';
        case 'success':
        default:
          return '#14532d';
      }
    } else {
      switch (type) {
        case 'danger':
          return '#fecaca';
        case 'warning':
          return '#fde68a';
        case 'info':
          return '#bae6fd';
        case 'success':
        default:
          return '#bbf7d0';
      }
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, danger, info, warning }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.toastPill,
              {
                backgroundColor: getBgColor(toast.type),
                borderColor: getBorderColor(toast.type),
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: getBorderColor(toast.type) }]}>
              <Ionicons name={getIcon(toast.type)} size={17} color={getAccentColor(toast.type)} />
            </View>
            <Text style={[styles.toastText, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={2}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={dismissToast} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      success: () => {},
      danger: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.select({ web: 18, default: 44 }),
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    maxWidth: 520,
    minWidth: 260,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
    marginLeft: 4,
  },
});
