import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity, useWindowDimensions,
  View
} from 'react-native';
import { Skeleton } from '../../components/Skeleton';
import { Env } from '../../config/env';
import { Colors, ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';

export default function DashboardScreen() {
  const router = useRouter();
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { isSuperAdmin, isReadOnly } = useAuth();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = width >= 1024;
  const isTablet = width >= 640 && width < 1024;
  const isCompact = width < 540;

  const dash = store.dashboardData;
  const rates = store.goldRates;

  // Gold Valuation Calculations
  const totalGoldWeight = dash.totalGoldWeight || 0;
  const buyingGoldValue = Math.round(dash.totalBuyingGoldValue || 0);
  const live22kRate = rates?.gold22k?.rate1g || Env.FALLBACK_22K_RATE;
  const live24kRate = rates?.gold24k?.rate1g || Env.FALLBACK_24K_RATE;
  const live18kRate = rates?.gold18k?.rate1g || Env.FALLBACK_18K_RATE;
  const currentGoldValue = Math.round(totalGoldWeight * live22kRate);
  const appreciationGains = currentGoldValue - buyingGoldValue;
  const appreciationPct = buyingGoldValue > 0 ? ((appreciationGains / buyingGoldValue) * 100) : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  const utilPercent = dash.totalEligibleLoanAmount > 0 
    ? Math.min(100, Math.round((dash.totalLoanAmount / dash.totalEligibleLoanAmount) * 100)) 
    : 0;

  const handleActionPress = (route: string | { pathname: string; params?: Record<string, string> }) => {
    if (isReadOnly) {
      toast.warning('Read-Only Mode: SuperAdmin privileges required to create or modify records.');
      return;
    }
    router.push(route as any);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* ─── READ-ONLY ROLE BANNER ─── */}
        {isReadOnly && (
          <View style={styles.readOnlyNoticeBanner}>
            <Ionicons name="eye" size={16} color={isDark ? '#fbbf24' : '#b45309'} />
            <Text style={styles.readOnlyNoticeText}>
              Viewing in <Text style={{ fontWeight: '700' }}>Read-Only Mode</Text>. Adding loans, customers, gold or settling requires SuperAdmin privileges.
            </Text>
          </View>
        )}

        {/* ─── OFFLINE CACHE NOTICE BANNER (When showing cached data offline) ─── */}
        {store.syncError && (store.users.length > 0 || store.loans.length > 0) ? (
          <View style={styles.offlineNoticeBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="cloud-offline-outline" size={15} color={isDark ? '#fbbf24' : '#b45309'} />
              <Text style={styles.offlineNoticeText} numberOfLines={1}>
                {store.syncError}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => store.syncFromBackend(true)} 
              style={styles.offlineRetryPill}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.offlineRetryPillText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ─── INITIAL SYNC SKELETON LOADER (When cache is empty & syncing) ─── */}
        {store.isSyncing && store.users.length === 0 && store.loans.length === 0 ? (
          <View style={{ gap: 20 }}>
            {/* Syncing Pill Notice */}
            <View style={styles.syncNoticePill}>
              <ActivityIndicator size="small" color={isDark ? '#fbbf24' : colors.primaryDark} />
              <Text style={styles.syncNoticeText}>Loading portfolio data from Google Sheets...</Text>
            </View>

            {/* Rates Card Skeleton */}
            <View style={styles.goldRatesCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Skeleton width={200} height={20} />
                <Skeleton width={80} height={20} />
              </View>
              <View style={{ gap: 10 }}>
                <Skeleton width="100%" height={90} borderRadius={12} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Skeleton width="50%" height={80} borderRadius={12} style={{ flex: 1 }} />
                  <Skeleton width="50%" height={80} borderRadius={12} style={{ flex: 1 }} />
                </View>
              </View>
            </View>

            {/* Valuation Skeleton */}
            <Skeleton width={180} height={16} style={{ marginBottom: -8 }} />
            <View style={{ gap: 12 }}>
              <Skeleton width="100%" height={95} borderRadius={14} />
              <Skeleton width="100%" height={95} borderRadius={14} />
              <Skeleton width="100%" height={95} borderRadius={14} />
            </View>

            {/* Operational Metrics Skeleton */}
            <Skeleton width={180} height={16} style={{ marginBottom: -8 }} />
            {isDesktop ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width="25%" height={105} borderRadius={14} style={{ flex: 1 }} />
                <Skeleton width="25%" height={105} borderRadius={14} style={{ flex: 1 }} />
                <Skeleton width="25%" height={105} borderRadius={14} style={{ flex: 1 }} />
                <Skeleton width="25%" height={105} borderRadius={14} style={{ flex: 1 }} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
                <Skeleton width="48.5%" height={105} borderRadius={14} />
                <Skeleton width="48.5%" height={105} borderRadius={14} />
                <Skeleton width="48.5%" height={105} borderRadius={14} />
                <Skeleton width="48.5%" height={105} borderRadius={14} />
              </View>
            )}
          </View>
        ) : store.users.length === 0 && store.loans.length === 0 ? (
          /* ─── EMPTY OFFLINE STATE (First run without internet) ─── */
          <View style={styles.offlineEmptyContainer}>
            <View style={styles.offlineIconCircle}>
              <Ionicons name="cloud-offline-outline" size={36} color={isDark ? '#fbbf24' : colors.primaryDark} />
            </View>
            <Text style={styles.offlineEmptyTitle}>Unable to Connect</Text>
            <Text style={styles.offlineEmptySub}>
              {store.syncError || 'Could not reach Google Sheets. Please check your internet connection and tap retry.'}
            </Text>
            <TouchableOpacity 
              style={styles.offlineMainRetryBtn} 
              onPress={() => store.syncFromBackend(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.offlineMainRetryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
        {/* ─── SECTION 1: LIVE GOLD RATES (RESPONSIVE HERO ON MOBILE) ─── */}
        <View style={styles.goldRatesCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.goldBadgeIcon}>
                <Ionicons name="trending-up" size={16} color={Colors.primaryDark} />
              </View>
              <Text style={styles.cardSectionTitle} numberOfLines={1}>
                {Env.LOCATION_BENCHMARK} Live Gold Benchmark
              </Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity
                onPress={async () => {
                  toast.info('Fetching live Bangalore gold rates...');
                  await store.refreshGoldRates(true);
                  toast.success('Gold rates updated.');
                }}
                disabled={store.isFetchingGoldRates}
                style={[styles.cityPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                {store.isFetchingGoldRates ? (
                  <ActivityIndicator size="small" color={colors.primaryDark} style={{ transform: [{ scale: 0.65 }] }} />
                ) : (
                  <Ionicons name="refresh" size={11} color={colors.primaryDark} />
                )}
                <Text style={styles.cityPillText}>
                  {store.isFetchingGoldRates ? 'Updating...' : 'Live Rates'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel} numberOfLines={1}>
                {rates?.displayDate || 'Updated Today'}
              </Text>
            </View>
          </View>

          {isCompact ? (
            // ─── MOBILE RESPONSIVE LAYOUT (Featured 22K Hero + 2-Col 24K/18K) ───
            <View style={styles.ratesMobileContainer}>
              {/* Featured 22K Standard Hero Card */}
              <View style={[styles.rateBox, styles.rateBoxFeatured, styles.rateBoxHero]}>
                <View style={styles.heroHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <Text style={[styles.rateKarat, styles.rateKaratFeatured]} numberOfLines={1}>
                      22K Standard (916)
                    </Text>
                    <View style={[styles.miniBadge, { backgroundColor: isDark ? '#b45309' : colors.primaryDark }]}>
                      <Text style={[styles.miniBadgeText, { color: '#ffffff' }]}>Primary</Text>
                    </View>
                  </View>
                  <View style={[styles.sovereignBox, { backgroundColor: '#fef3c7', marginTop: 0 }]}>
                    <Text style={[styles.sovereignText, { color: '#92400e', fontWeight: '700' }]} numberOfLines={1}>
                      8g Sovereign: ₹{(live22kRate * 8).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroAmountRow}>
                  <Text style={[styles.rateAmount, styles.rateAmountFeatured]}>
                    ₹{live22kRate.toLocaleString()}
                  </Text>
                  <Text style={styles.rateUnitHero}>per 1g</Text>
                  {rates?.gold22k?.change ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8, backgroundColor: isDark ? '#143823' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Ionicons 
                        name={rates.gold22k.direction === 'up' ? 'arrow-up' : rates.gold22k.direction === 'down' ? 'arrow-down' : 'remove'} 
                        size={11} 
                        color={rates.gold22k.direction === 'up' ? colors.success : colors.danger} 
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold22k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold22k.change >= 0 ? `+₹${rates.gold22k.change}` : `-₹${Math.abs(rates.gold22k.change)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* 24K and 18K Secondary Side-by-Side */}
              <View style={styles.ratesTwoColRow}>
                {/* 24K Pure Gold */}
                <View style={[styles.rateBox, { flex: 1 }]}>
                  <View style={styles.rateBoxHeader}>
                    <Text style={styles.rateKarat} numberOfLines={1}>24K Pure (999)</Text>
                    <View style={[styles.miniBadge, { backgroundColor: '#fef08a' }]}>
                      <Text style={[styles.miniBadgeText, { color: '#854d0e' }]}>99.9%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.rateAmount} numberOfLines={1}>₹{live24kRate.toLocaleString()}</Text>
                    {rates?.gold24k?.change ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: rates.gold24k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold24k.change >= 0 ? `+₹${rates.gold24k.change}` : `-₹${Math.abs(rates.gold24k.change)}`}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rateUnit}>per 1g</Text>
                  <View style={styles.sovereignBox}>
                    <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live24kRate * 8).toLocaleString()}</Text>
                  </View>
                </View>

                {/* 18K Hallmarked */}
                <View style={[styles.rateBox, { flex: 1 }]}>
                  <View style={styles.rateBoxHeader}>
                    <Text style={styles.rateKarat} numberOfLines={1}>18K Gold (750)</Text>
                    <View style={[styles.miniBadge, { backgroundColor: '#fed7aa' }]}>
                      <Text style={[styles.miniBadgeText, { color: '#9a3412' }]}>75.0%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.rateAmount} numberOfLines={1}>₹{live18kRate.toLocaleString()}</Text>
                    {rates?.gold18k?.change ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: rates.gold18k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold18k.change >= 0 ? `+₹${rates.gold18k.change}` : `-₹${Math.abs(rates.gold18k.change)}`}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rateUnit}>per 1g</Text>
                  <View style={styles.sovereignBox}>
                    <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live18kRate * 8).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // ─── DESKTOP/TABLET 3-COLUMN ROW ───
            <View style={styles.ratesGridRow}>
              {/* 24K Pure Gold */}
              <View style={styles.rateBox}>
                <View style={styles.rateBoxHeader}>
                  <Text style={styles.rateKarat} numberOfLines={1}>24K Pure (999)</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#fef08a' }]}>
                    <Text style={[styles.miniBadgeText, { color: '#854d0e' }]}>99.9%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.rateAmount} numberOfLines={1}>₹{live24kRate.toLocaleString()}</Text>
                  {rates?.gold24k?.change ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold24k.direction === 'up' ? colors.success : colors.danger }}>
                      {rates.gold24k.change >= 0 ? `+₹${rates.gold24k.change}` : `-₹${Math.abs(rates.gold24k.change)}`}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={styles.sovereignBox}>
                  <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live24kRate * 8).toLocaleString()}</Text>
                </View>
              </View>

              {/* 22K Jewelry Standard (Featured) */}
              <View style={[styles.rateBox, styles.rateBoxFeatured]}>
                <View style={styles.rateBoxHeader}>
                  <Text style={[styles.rateKarat, { color: isDark ? '#fbbf24' : colors.primaryDark }]} numberOfLines={1}>
                    22K Standard (916)
                  </Text>
                  <View style={[styles.miniBadge, { backgroundColor: Colors.primaryDark }]}>
                    <Text style={[styles.miniBadgeText, { color: '#ffffff' }]}>Primary</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.rateAmount, styles.rateAmountFeatured]} numberOfLines={1}>
                    ₹{live22kRate.toLocaleString()}
                  </Text>
                  {rates?.gold22k?.change ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: isDark ? '#143823' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Ionicons 
                        name={rates.gold22k.direction === 'up' ? 'arrow-up' : rates.gold22k.direction === 'down' ? 'arrow-down' : 'remove'} 
                        size={11} 
                        color={rates.gold22k.direction === 'up' ? colors.success : colors.danger} 
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold22k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold22k.change >= 0 ? `+₹${rates.gold22k.change}` : `-₹${Math.abs(rates.gold22k.change)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={[styles.sovereignBox, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.sovereignText, { color: '#92400e', fontWeight: '700' }]} numberOfLines={1}>
                    8g Sovereign: ₹{(live22kRate * 8).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* 18K Hallmarked */}
              <View style={styles.rateBox}>
                <View style={styles.rateBoxHeader}>
                  <Text style={styles.rateKarat} numberOfLines={1}>18K Gold (750)</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#fed7aa' }]}>
                    <Text style={[styles.miniBadgeText, { color: '#9a3412' }]}>75.0%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.rateAmount} numberOfLines={1}>₹{live18kRate.toLocaleString()}</Text>
                  {rates?.gold18k?.change ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold18k.direction === 'up' ? colors.success : colors.danger }}>
                      {rates.gold18k.change >= 0 ? `+₹${rates.gold18k.change}` : `-₹${Math.abs(rates.gold18k.change)}`}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={styles.sovereignBox}>
                  <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live18kRate * 8).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ─── SECTION 2: GOLD VAULT VALUATION (3-COLUMN GRID) ─── */}
        <Text style={styles.sectionHeading}>Gold Vault Valuation</Text>
        <View style={[styles.valGrid, (isDesktop || isTablet) && styles.valGridRow]}>
          {/* 1. Current Market Value */}
          <View style={[styles.valCard, (isDesktop || isTablet) && { flex: 1 }]}>
            <View style={styles.valCardTop}>
              <Text style={styles.valTitle} numberOfLines={1}>Current Market Value</Text>
              <View style={[styles.valIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="diamond" size={18} color="#b45309" />
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

        {/* ─── SECTION 3: OPERATIONAL PORTFOLIO (4-COLUMN GRID ON DESKTOP) ─── */}
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
                <Ionicons name="people" size={20} color={isDark ? '#fbbf24' : colors.primaryDark} />
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
              <View style={[styles.metricIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="cash" size={20} color="#b45309" />
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

        {/* ─── SECTION 4: BANK LIMIT UTILIZATION ─── */}
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

        {/* ─── SECTION 5: QUICK ACTIONS GRID (4-IN-A-ROW ON DESKTOP, 2x2 ON MOBILE) ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={isDesktop ? styles.quickActionsGridDesktop : styles.quickActionsGridMobile}>
          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress('/loans/new')} 
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fef08a' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "add-circle"} size={20} color={isDark ? '#fbbf24' : colors.primaryDark} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>New Loan</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Disburse collateral'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress('/customers/new')} 
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "person-add"} size={20} color="#0284c7" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Add Customer</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Register borrower'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress({ pathname: '/(tabs)/ornaments', params: { action: 'add' } })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "diamond"} size={20} color="#b45309" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Pledge Gold</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Deposit vault item'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={isDesktop ? styles.actionCardDesktop : styles.actionCardMobile} 
            onPress={() => router.push('/(tabs)/closure' as any)} 
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="receipt" size={20} color="#16a34a" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Settlements</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'View closures' : 'Record settlement'}</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  syncNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: isDark ? '#1e293b' : '#fefce8',
    borderColor: isDark ? '#334155' : '#fef08a',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  syncNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#854d0e',
  },
  readOnlyNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb',
    borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : '#fde68a',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  readOnlyNoticeText: {
    flex: 1,
    fontSize: 12,
    color: isDark ? '#fde68a' : '#92400e',
    lineHeight: 16,
  },
  actionCardDisabled: {
    opacity: 0.75,
  },
  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#261a02' : '#fefce8',
    borderColor: isDark ? '#78350f' : '#fde68a',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  offlineNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#fbbf24' : '#854d0e',
    flex: 1,
  },
  offlineRetryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: isDark ? '#382504' : '#fef08a',
    borderWidth: 1,
    borderColor: isDark ? '#78350f' : '#f59e0b',
  },
  offlineRetryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#b45309',
  },
  offlineEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  offlineIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: isDark ? '#261a02' : '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  offlineEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  offlineEmptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  offlineMainRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? '#d97706' : colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
  },
  offlineMainRetryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    width: '100%',
  },
  contentDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },

  // ─── RATES CARD ───
  goldRatesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 180,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  goldBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? '#382504' : '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cityPill: {
    backgroundColor: isDark ? '#382504' : '#fef08a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  cityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#854d0e',
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
  },

  // ─── RATES LAYOUTS (MOBILE VS DESKTOP) ───
  ratesMobileContainer: {
    gap: 10,
  },
  ratesTwoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratesGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rateBox: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateBoxFeatured: {
    backgroundColor: isDark ? '#1e1a06' : '#fffbeb',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  rateBoxHero: {
    padding: 14,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  rateBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rateKarat: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    flex: 1,
  },
  rateKaratFeatured: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    flexShrink: 0,
  },
  miniBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  rateAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  rateAmountFeatured: {
    fontSize: 19,
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  rateUnit: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginBottom: 6,
  },
  rateUnitHero: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sovereignBox: {
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 2,
  },
  sovereignText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ─── VALUATION ───
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  valGrid: {
    gap: 12,
    marginBottom: 20,
  },
  valGridRow: {
    flexDirection: 'row',
  },
  valCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valCardSuccess: {
    backgroundColor: isDark ? '#052210' : '#f0fdf4',
    borderColor: isDark ? '#14532d' : '#bbf7d0',
  },
  valCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  valTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  valIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  valAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  valBadge: {
    backgroundColor: isDark ? '#1e293b' : '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  valBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: isDark ? '#fbbf24' : '#92400e',
  },

  // ─── METRICS GRID (2x2 on Mobile, 4 in a row on Desktop) ───
  metricsGridDesktop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  metricsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
    width: '100%',
  },
  metricCardDesktop: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCardMobile: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: isDark ? '#382504' : '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricVal: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    flex: 1,
  },
  metricHint: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },

  // ─── BANK UTILIZATION ───
  bankUtilCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  bankUtilHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  bankUtilTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bankUtilSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  utilPill: {
    backgroundColor: isDark ? '#082f49' : '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  utilPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#38bdf8' : '#0284c7',
  },
  utilAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  utilAmountLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  utilAmountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  barBg: {
    height: 10,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: isDark ? '#f59e0b' : colors.primaryDark,
    borderRadius: 5,
  },
  utilFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bankUtilSub: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },

  // ─── QUICK ACTIONS GRID (4-IN-A-ROW ON DESKTOP, 2x2 ON MOBILE) ───
  quickActionsGridDesktop: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  quickActionsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    width: '100%',
  },
  actionCardDesktop: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardMobile: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
});