import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemeToggleBtn } from './ThemeToggleBtn';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightGroup}>
        <View style={[styles.statusTag, isDark ? styles.liveTagDark : styles.liveTag]}>
          <View style={[styles.statusDot, styles.liveDot]} />
          <Text style={[styles.statusText, isDark ? styles.liveTextDark : styles.liveText]}>
            Live
          </Text>
        </View>

        <ThemeToggleBtn size={16} />

        {onRefresh ? (
          <TouchableOpacity 
            onPress={onRefresh} 
            disabled={isRefreshing}
            style={[styles.refreshBtn, { backgroundColor: colors.surfaceSubtle }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="sync" 
              size={16} 
              color={colors.primaryDark} 
              style={isRefreshing ? styles.spinning : undefined} 
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 5,
  },
  liveTag: {
    backgroundColor: '#dcfce7',
  },
  liveTagDark: {
    backgroundColor: '#052e16',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDot: {
    backgroundColor: '#16a34a',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveText: {
    color: '#166534',
  },
  liveTextDark: {
    color: '#4ade80',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: {
    opacity: 0.5,
  },
});
