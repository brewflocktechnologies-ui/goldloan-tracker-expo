import { StyleSheet, Text, View } from 'react-native';

export type OrnamentStatusValue = 'Available' | 'Pledged' | 'Released' | string;

interface OrnamentStatusBadgeProps {
  status: OrnamentStatusValue;
  isDark: boolean;
  // 'badge': compact pill used on list cards. 'pill': larger bordered pill used on the details header.
  variant?: 'badge' | 'pill';
}

const STATUS_TONES = {
  Available: {
    dot: '#16a34a',
    badgeBg: (isDark: boolean) => (isDark ? 'rgba(34, 197, 94, 0.15)' : '#ecfdf5'),
    pillBg: (isDark: boolean) => (isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7'),
    pillBorder: (isDark: boolean) => (isDark ? '#22c55e' : '#bbf7d0'),
    text: (isDark: boolean) => (isDark ? '#4ade80' : '#15803d'),
  },
  Pledged: {
    dot: '#d97706',
    badgeBg: (isDark: boolean) => (isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'),
    pillBg: (isDark: boolean) => (isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7'),
    pillBorder: (isDark: boolean) => (isDark ? '#f59e0b' : '#fde68a'),
    text: (isDark: boolean) => (isDark ? '#fbbf24' : '#b45309'),
  },
  Released: {
    dot: '#0284c7',
    badgeBg: (isDark: boolean) => (isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff'),
    pillBg: (isDark: boolean) => (isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe'),
    pillBorder: (isDark: boolean) => (isDark ? '#0284c7' : '#bae6fd'),
    text: (isDark: boolean) => (isDark ? '#38bdf8' : '#0284c7'),
  },
} as const;

function getTone(status: OrnamentStatusValue) {
  if (status === 'Available') return STATUS_TONES.Available;
  if (status === 'Pledged') return STATUS_TONES.Pledged;
  return STATUS_TONES.Released;
}

export function OrnamentStatusBadge({ status, isDark, variant = 'badge' }: OrnamentStatusBadgeProps) {
  const tone = getTone(status);
  const isPill = variant === 'pill';

  return (
    <View
      style={[
        styles.base,
        isPill ? styles.pill : styles.badge,
        { backgroundColor: isPill ? tone.pillBg(isDark) : tone.badgeBg(isDark) },
        isPill ? { borderColor: tone.pillBorder(isDark) } : null,
      ]}
    >
      <View style={[isPill ? styles.dotPill : styles.dotBadge, { backgroundColor: tone.dot }]} />
      <Text style={[isPill ? styles.textPill : styles.textBadge, { color: tone.text(isDark) }]}>
        {status}
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
