import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleBtnProps {
  showLabel?: boolean;
  size?: number;
}

export function ThemeToggleBtn({ showLabel = false, size = 18 }: ThemeToggleBtnProps) {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.btn,
        {
          backgroundColor: isDark ? '#1e293b' : colors.primarySubtle,
          borderColor: isDark ? '#334155' : '#fde68a',
        },
      ]}
      activeOpacity={0.7}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={size}
        color={isDark ? '#facc15' : colors.primaryDark}
      />
      {showLabel && (
        <Text style={[styles.label, { color: isDark ? '#f8fafc' : colors.primaryDark }]}>
          {isDark ? 'Light' : 'Dark'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
