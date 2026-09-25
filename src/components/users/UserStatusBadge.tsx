import { StyleSheet, Text, View } from 'react-native';

export type UserStatusValue = 'Active' | 'Inactive' | string;

interface UserStatusBadgeProps {
  status: UserStatusValue;
  isDark: boolean;
  // 'badge': compact pill used on list cards. 'pill': larger bordered pill used on the details hero card.
  variant?: 'badge' | 'pill';
  showDot?: boolean;
}

const STATUS_TONES = {
  Active: {
    dot: '#10b981',
    badgeBg: (isDark: boolean) => (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'),
    pillBg: (isDark: boolean) => (isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7'),
    pillBorder: (isDark: boolean) => (isDark ? '#22c55e' : '#bbf7d0'),
    text: (isDark: boolean) => (isDark ? '#34d399' : '#059669'),
  },
  Inactive: {
    dot: '#64748b',
    badgeBg: (isDark: boolean) => (isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9'),
    pillBg: (isDark: boolean) => (isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9'),
    pillBorder: (isDark: boolean) => (isDark ? '#64748b' : '#e2e8f0'),
    text: (isDark: boolean) => (isDark ? '#cbd5e1' : '#475569'),
  },
} as const;

function getTone(status: UserStatusValue) {
  if (status === 'Active') return STATUS_TONES.Active;
  return STATUS_TONES.Inactive;
}

export function UserStatusBadge({ status, isDark, variant = 'badge', showDot = true }: UserStatusBadgeProps) {
  const tone = getTone(status);
  const isPill = variant === 'pill';

  return (
    <View
      style={[
        styles.base,
        isPill ? styles.pill : styles.badge,
        !showDot && styles.noDotBadge,
        { backgroundColor: isPill ? tone.pillBg(isDark) : tone.badgeBg(isDark) },
        isPill ? { borderColor: tone.pillBorder(isDark) } : null,
      ]}
    >
      {showDot && (
        <View style={[isPill ? styles.dotPill : styles.dotBadge, { backgroundColor: tone.dot }]} />
      )}
      <Text style={[isPill ? styles.textPill : styles.textBadge, { color: tone.text(isDark) }]}>
        {status || 'Active'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  noDotBadge: {
    gap: 0,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  pill: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPill: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  textBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  textPill: {
    fontSize: 12,
    fontWeight: '700',
  },
});
