import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { DashboardColors, DashboardData, DashboardRouter, DashboardStyles } from './types';

interface MetricsSectionProps {
  styles: DashboardStyles;
  colors: DashboardColors;
  isDark: boolean;
  isDesktop: boolean;
  router: DashboardRouter;
  dash: DashboardData;
}

export function MetricsSection({ styles, colors, isDark, isDesktop, router, dash }: MetricsSectionProps) {
  return (
    <>
        <Text style={styles.sectionHeading}>Operational Portfolio</Text>
        <View style={isDesktop ? styles.metricsGridDesktop : styles.metricsGridMobile}>
          {/* Customers */}
          <TouchableOpacity 
            style={isDesktop ? styles.metricCardDesktop : styles.metricCardMobile} 
            onPress={() => router.push('/(tabs)/users' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.metricTop}>
              <View style={styles.metricIconBox}>
                <Ionicons name="people" size={20} color={isDark ? '#38bdf8' : colors.primaryDark} />
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.metricVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {dash.totalUsers}
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Active Customers</Text>
            <Text style={styles.metricHint} numberOfLines={1}>Registered borrowers</Text>
          </TouchableOpacity>

          {/* Bank Accounts */}
          <TouchableOpacity 
            style={isDesktop ? styles.metricCardDesktop : styles.metricCardMobile} 
            onPress={() => router.push('/(tabs)/bank-accounts' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="business" size={20} color="#0284c7" />
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.metricVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {dash.totalBankAccounts}
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Bank Accounts</Text>
            <Text style={styles.metricHint} numberOfLines={1}>Linked disbursement banks</Text>
          </TouchableOpacity>

          {/* Active Loans */}
          <TouchableOpacity 
            style={isDesktop ? styles.metricCardDesktop : styles.metricCardMobile} 
            onPress={() => router.push('/(tabs)/loans' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="cash" size={20} color="#0369a1" />
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.metricVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              ₹{(dash.totalLoanAmount / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>{dash.activeLoans} Active Loans</Text>
            <Text style={styles.metricHint} numberOfLines={1}>Total disbursed capital</Text>
          </TouchableOpacity>

          {/* Pledged Ornaments */}
          <TouchableOpacity 
            style={isDesktop ? styles.metricCardDesktop : styles.metricCardMobile} 
            onPress={() => router.push('/(tabs)/ornaments' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.metricVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {dash.pledgedGrams.toFixed(1)}g
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>{dash.pledgedOrnamentsCount} Pledged Items</Text>
            <Text style={styles.metricHint} numberOfLines={1}>Secured in bank vault</Text>
          </TouchableOpacity>
        </View>
    </>
  );
}
