import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Env } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { getStyles } from './dashboardStyles';

export function useDashboard() {
  const router = useRouter();
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { isReadOnly } = useAuth();
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

  return {
    router, store, colors, isDark, styles, isReadOnly, toast, refreshing, onRefresh,
    isDesktop, isTablet, isCompact, dash, rates,
    totalGoldWeight, buyingGoldValue, live22kRate, live24kRate, live18kRate,
    currentGoldValue, appreciationGains, appreciationPct, utilPercent, handleActionPress,
  };
}
