import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { GoldRateData } from '../types';

interface GoldRateTickerProps {
  rates: GoldRateData | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const GoldRateTicker: React.FC<GoldRateTickerProps> = ({ rates, onRefresh, isLoading }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  if (!rates) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trending-up" size={16} color={colors.primary} />
          <Text style={styles.headerTitle}>Live Gold Rates ({rates.location})</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={14} color={colors.textSecondary} />
          <Text style={styles.refreshText}>{isLoading ? 'Updating...' : rates.displayDate}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ratesRow}>
        {/* 24K */}
        <View style={styles.rateCard}>
          <View style={styles.purityBadge24k}>
            <Text style={styles.purityText}>24K Pure</Text>
          </View>
          <Text style={styles.ratePrice}>₹{rates.gold24k.rate1g.toLocaleString()}</Text>
          <Text style={styles.rateUnit}>/ gram</Text>
          <View style={styles.changeRow}>
            <Ionicons 
              name={rates.gold24k.direction === 'up' ? 'arrow-up' : rates.gold24k.direction === 'down' ? 'arrow-down' : 'remove'} 
              size={12} 
              color={rates.gold24k.direction === 'up' ? colors.success : colors.danger} 
            />
            <Text style={[styles.changeText, { color: rates.gold24k.direction === 'up' ? colors.success : colors.danger }]}>
              {rates.gold24k.change >= 0 ? `+₹${rates.gold24k.change}` : `-₹${Math.abs(rates.gold24k.change)}`}
            </Text>
          </View>
        </View>

        {/* 22K (Standard Jewelry) */}
        <View style={[styles.rateCard, styles.rateCardFeatured]}>
          <View style={styles.purityBadge22k}>
            <Text style={styles.purityTextFeatured}>22K Standard</Text>
          </View>
          <Text style={[styles.ratePrice, styles.ratePriceFeatured]}>₹{rates.gold22k.rate1g.toLocaleString()}</Text>
          <Text style={styles.rateUnit}>/ gram</Text>
          <View style={styles.changeRow}>
            <Ionicons 
              name={rates.gold22k.direction === 'up' ? 'arrow-up' : rates.gold22k.direction === 'down' ? 'arrow-down' : 'remove'} 
              size={12} 
              color={rates.gold22k.direction === 'up' ? colors.success : colors.danger} 
            />
            <Text style={[styles.changeText, { color: rates.gold22k.direction === 'up' ? colors.success : colors.danger }]}>
              {rates.gold22k.change >= 0 ? `+₹${rates.gold22k.change}` : `-₹${Math.abs(rates.gold22k.change)}`}
            </Text>
          </View>
        </View>

        {/* 18K */}
        <View style={styles.rateCard}>
          <View style={styles.purityBadge18k}>
            <Text style={styles.purityText}>18K Hallmarked</Text>
          </View>
          <Text style={styles.ratePrice}>₹{rates.gold18k.rate1g.toLocaleString()}</Text>
          <Text style={styles.rateUnit}>/ gram</Text>
          <View style={styles.changeRow}>
            <Ionicons 
              name={rates.gold18k.direction === 'up' ? 'arrow-up' : rates.gold18k.direction === 'down' ? 'arrow-down' : 'remove'} 
              size={12} 
              color={rates.gold18k.direction === 'up' ? colors.success : colors.danger} 
            />
            <Text style={[styles.changeText, { color: rates.gold18k.direction === 'up' ? colors.success : colors.danger }]}>
              {rates.gold18k.change >= 0 ? `+₹${rates.gold18k.change}` : `-₹${Math.abs(rates.gold18k.change)}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#111827' : '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#fde68a',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#854d0e',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateCard: {
    flex: 1,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
  },
  rateCardFeatured: {
    borderColor: colors.primary,
    backgroundColor: isDark ? '#261a02' : '#fffdf5',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  purityBadge24k: {
    backgroundColor: isDark ? '#382504' : '#fef08a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  purityBadge22k: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  purityBadge18k: {
    backgroundColor: isDark ? '#3d1d05' : '#fed7aa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  purityText: {
    fontSize: 10,
    fontWeight: '700',
    color: isDark ? '#facc15' : '#713f12',
  },
  purityTextFeatured: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratePriceFeatured: {
    color: colors.primaryDark,
    fontSize: 16,
  },
  rateUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
