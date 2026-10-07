import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { DashboardColors, DashboardStyles } from './types';

interface ValuationSectionProps {
  styles: DashboardStyles;
  colors: DashboardColors;
  isDesktop: boolean;
  isTablet: boolean;
  currentGoldValue: number;
  buyingGoldValue: number;
  totalGoldWeight: number;
  live22kRate: number;
  appreciationGains: number;
  appreciationPct: number;
}

export function ValuationSection({ styles, colors, isDesktop, isTablet, currentGoldValue, buyingGoldValue, totalGoldWeight, live22kRate, appreciationGains, appreciationPct }: ValuationSectionProps) {
  return (
    <>
        <Text style={styles.sectionHeading}>Gold Vault Valuation</Text>
        <View style={[styles.valGrid, (isDesktop || isTablet) && styles.valGridRow]}>
          {/* 1. Current Market Value */}
          <View style={[styles.valCard, (isDesktop || isTablet) && { flex: 1 }]}>
            <View style={styles.valCardTop}>
              <Text style={styles.valTitle} numberOfLines={1}>Current Market Value</Text>
              <View style={[styles.valIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="diamond" size={18} color="#0369a1" />
              </View>
            </View>
            <Text style={styles.valAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              ₹{currentGoldValue.toLocaleString()}
            </Text>
            <View style={styles.valBadge}>
              <Text style={styles.valBadgeText} numberOfLines={1} ellipsizeMode="tail">
                {totalGoldWeight.toFixed(2)}g net wt @ ₹{live22kRate}/g
              </Text>
            </View>
          </View>

          {/* 2. Total Buying Cost */}
          <View style={[styles.valCard, (isDesktop || isTablet) && { flex: 1 }]}>
            <View style={styles.valCardTop}>
              <Text style={styles.valTitle} numberOfLines={1}>Total Acquisition Cost</Text>
              <View style={[styles.valIconBox, { backgroundColor: '#e2e8f0' }]}>
                <Ionicons name="wallet" size={18} color="#475569" />
              </View>
            </View>
            <Text style={styles.valAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              ₹{buyingGoldValue.toLocaleString()}
            </Text>
            <View style={[styles.valBadge, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.valBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                Historical purchase benchmark
              </Text>
            </View>
          </View>

          {/* 3. Unrealized Appreciation */}
          <View style={[styles.valCard, styles.valCardSuccess, (isDesktop || isTablet) && { flex: 1 }]}>
            <View style={styles.valCardTop}>
              <Text style={[styles.valTitle, { color: '#166534' }]} numberOfLines={1}>Appreciation Gains</Text>
              <View style={[styles.valIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="trending-up" size={18} color="#16a34a" />
              </View>
            </View>
            <Text style={[styles.valAmount, { color: '#15803d' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              +{appreciationGains >= 0 ? '₹' : '-₹'}{Math.abs(appreciationGains).toLocaleString()}
            </Text>
            <View style={[styles.valBadge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.valBadgeText, { color: '#166534' }]} numberOfLines={1}>
                +{appreciationPct.toFixed(1)}% portfolio growth
              </Text>
            </View>
          </View>
        </View>
    </>
  );
}
