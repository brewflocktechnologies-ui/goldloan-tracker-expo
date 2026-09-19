import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  iconName,
  accentColor,
}) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const accent = accentColor || colors.primary;

  return (
    <View
      style={[
        styles.card,
        isDesktop ? styles.cardDesktop : styles.cardMobile,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
        },
      ]}
    >
      <View style={[styles.topRow, isDesktop ? styles.topRowDesktop : styles.topRowMobile]}>
        <Text
          style={[
            styles.title,
            isDesktop ? styles.titleDesktop : styles.titleMobile,
            { color: colors.textSecondary },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <View
          style={[
            styles.iconContainer,
            isDesktop ? styles.iconContainerDesktop : styles.iconContainerMobile,
            { backgroundColor: isDark ? `${accent}20` : `${accent}15` },
          ]}
        >
          <Ionicons name={iconName} size={isDesktop ? 16 : 13} color={accent} />
        </View>
      </View>
      <Text
        style={[
          styles.value,
          isDesktop ? styles.valueDesktop : styles.valueMobile,
          { color: accent },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            isDesktop ? styles.subtitleDesktop : styles.subtitleMobile,
            { color: colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardMobile: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  cardDesktop: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRowMobile: {
    marginBottom: 4,
    gap: 4,
  },
  topRowDesktop: {
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    flex: 1,
  },
  titleMobile: {
    fontSize: 9.5,
  },
  titleDesktop: {
    fontSize: 11,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerMobile: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  iconContainerDesktop: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  value: {
    fontWeight: '800',
  },
  valueMobile: {
    fontSize: 18,
    lineHeight: 22,
  },
  valueDesktop: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
  subtitleMobile: {
    fontSize: 9,
    marginTop: 2,
  },
  subtitleDesktop: {
    fontSize: 11,
    marginTop: 4,
  },
});
