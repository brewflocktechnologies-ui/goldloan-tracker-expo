import { RefreshControl, ScrollView, View } from 'react-native';
import { BankUtilizationCard } from '../../components/dashboard/BankUtilizationCard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { GoldRatesCard } from '../../components/dashboard/GoldRatesCard';
import { MetricsSection } from '../../components/dashboard/MetricsSection';
import { OfflineEmptyState } from '../../components/dashboard/OfflineEmptyState';
import { OfflineNoticeBanner } from '../../components/dashboard/OfflineNoticeBanner';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ReadOnlyBanner } from '../../components/dashboard/ReadOnlyBanner';
import { useDashboard } from '../../components/dashboard/useDashboard';
import { ValuationSection } from '../../components/dashboard/ValuationSection';

export default function DashboardScreen() {
  const {
    router, store, colors, isDark, styles, isReadOnly, toast, refreshing, onRefresh,
    isDesktop, isTablet, isCompact, dash, rates,
    totalGoldWeight, buyingGoldValue, live22kRate, live24kRate, live18kRate,
    currentGoldValue, appreciationGains, appreciationPct, utilPercent, handleActionPress,
  } = useDashboard();

  return (
    <View style={styles.screenRoot}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* ─── READ-ONLY ROLE BANNER ─── */}
        {isReadOnly && <ReadOnlyBanner styles={styles} isDark={isDark} />}

        {/* ─── OFFLINE CACHE NOTICE BANNER (When showing cached data offline) ─── */}
        {store.syncError && (store.users.length > 0 || store.loans.length > 0) ? (
          <OfflineNoticeBanner styles={styles} isDark={isDark} store={store} />
        ) : null}

        {/* ─── INITIAL SYNC SKELETON LOADER (When cache is empty & syncing) ─── */}
        {store.isSyncing && store.users.length === 0 && store.loans.length === 0 ? (
          <DashboardSkeleton styles={styles} isDark={isDark} colors={colors} isDesktop={isDesktop} />
        ) : store.users.length === 0 && store.loans.length === 0 ? (
          /* ─── EMPTY OFFLINE STATE (First run without internet) ─── */
          <OfflineEmptyState styles={styles} isDark={isDark} colors={colors} store={store} />
        ) : (
          <>
            <GoldRatesCard
              styles={styles} colors={colors} isDark={isDark} isCompact={isCompact}
              store={store} toast={toast} rates={rates}
              live22kRate={live22kRate} live24kRate={live24kRate} live18kRate={live18kRate}
            />
            <ValuationSection
              styles={styles} colors={colors} isDesktop={isDesktop} isTablet={isTablet}
              currentGoldValue={currentGoldValue} buyingGoldValue={buyingGoldValue}
              totalGoldWeight={totalGoldWeight} live22kRate={live22kRate}
              appreciationGains={appreciationGains} appreciationPct={appreciationPct}
            />
            <MetricsSection styles={styles} colors={colors} isDark={isDark} isDesktop={isDesktop} router={router} dash={dash} />
            <BankUtilizationCard styles={styles} colors={colors} dash={dash} utilPercent={utilPercent} />
            <QuickActions
              styles={styles} colors={colors} isDark={isDark} isDesktop={isDesktop}
              isReadOnly={isReadOnly} router={router} handleActionPress={handleActionPress}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
