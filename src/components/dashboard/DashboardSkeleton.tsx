import { ActivityIndicator, Text, View } from 'react-native';
import { Skeleton } from '../Skeleton';
import { DashboardColors, DashboardStyles } from './types';

export function DashboardSkeleton({ styles, isDark, colors, isDesktop }: { styles: DashboardStyles; isDark: boolean; colors: DashboardColors; isDesktop: boolean }) {
  return (
          <View style={{ gap: 20 }}>
            {/* Syncing Pill Notice */}
            <View style={styles.syncNoticePill}>
              <ActivityIndicator size="small" color={isDark ? '#38bdf8' : colors.primaryDark} />
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
  );
}
