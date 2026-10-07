import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Env } from '../../config/env';
import { DashboardColors, DashboardData, DashboardStyles } from './types';

interface BankUtilizationCardProps {
  styles: DashboardStyles;
  colors: DashboardColors;
  dash: DashboardData;
  utilPercent: number;
}

export function BankUtilizationCard({ styles, colors, dash, utilPercent }: BankUtilizationCardProps) {
  return (
        <View style={styles.bankUtilCard}>
          <View style={styles.bankUtilHeader}>
            <View style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.bankUtilTitle} numberOfLines={1}>Bank Loan Limit Utilization</Text>
              <Text style={styles.bankUtilSubText} numberOfLines={1}>Overall credit line exposure across banks</Text>
            </View>
            <View style={styles.utilPill}>
              <Text style={styles.utilPillText}>{utilPercent}% Utilized</Text>
            </View>
          </View>

          <View style={styles.utilAmountsRow}>
            <View>
              <Text style={styles.utilAmountLabel}>Total Disbursed</Text>
              <Text style={styles.utilAmountVal} numberOfLines={1}>₹{dash.totalLoanAmount.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.utilAmountLabel}>Eligible Limit ({Env.MAX_LTV_PERCENT}% LTV)</Text>
              <Text style={styles.utilAmountVal} numberOfLines={1}>₹{dash.totalEligibleLoanAmount.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${utilPercent}%` }]} />
          </View>

          <View style={styles.utilFooter}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.bankUtilSub} numberOfLines={1} ellipsizeMode="tail">
              Available credit headroom: <Text style={{ color: colors.success, fontWeight: '700' }}>₹{dash.totalAvailableLoanAmount.toLocaleString()}</Text>
            </Text>
          </View>
        </View>
  );
}
