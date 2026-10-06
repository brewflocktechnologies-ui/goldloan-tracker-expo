import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { ProfileModal } from '../../components/ProfileModal';
import { Env } from '../../config/env';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore, getSyncError } from '../../services/store';

type MenuView = 'main' | 'reports' | 'gold-rates' | 'settings' | 'help' | 'about';

export default function MenuScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = useMemo(() => getStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);

  const { user, logout } = useAuth();
  const store = useAppStore();
  const toast = useToast();

  const [currentView, setCurrentView] = useState<MenuView>('main');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Settings state
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [remindDays, setRemindDays] = useState<'1' | '3' | '7'>('3');
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncingData, setIsSyncingData] = useState(false);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ScrollView ref for resetting scroll to top when changing views
  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll position to top whenever currentView changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentView]);

  // Handle hardware Android back button
  useEffect(() => {
    const onBackPress = () => {
      if (logoutModalVisible) {
        setLogoutModalVisible(false);
        return true;
      }
      if (currentView !== 'main') {
        setCurrentView('main');
        return true;
      }
      router.push('/(tabs)' as any);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentView, logoutModalVisible, router]);

  const handleBack = useCallback(() => {
    if (currentView !== 'main') {
      setCurrentView('main');
    } else {
      router.push('/(tabs)' as any);
    }
  }, [currentView, router]);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    toast.info('Signing out...');
    await logout();
    router.replace('/login' as any);
  };

  const handleManualSync = async () => {
    try {
      setIsSyncingData(true);
      toast.info('Syncing portfolio data & live rates...');
      await store.syncFromBackend(true);
      const syncError = getSyncError();
      if (syncError) toast.danger(syncError);
      else toast.success('Sync complete! All records up to date.');
    } catch {
      toast.danger('Sync failed. Please check internet.');
    } finally {
      setIsSyncingData(false);
    }
  };

  // ─── Fixed Header Metadata ───
  const headerMeta = useMemo(() => {
    switch (currentView) {
      case 'reports':
        return {
          title: 'Reports',
          subtitle: 'As of today',
        };
      case 'gold-rates':
        const timeStr = store.goldRates?.updatedAt
          ? new Date(store.goldRates.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '12:00';
        return {
          title: 'Gold rates',
          subtitle: `Last update today at ${timeStr}`,
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: undefined,
        };
      case 'help':
        return {
          title: 'Help & Support',
          subtitle: undefined,
        };
      case 'about':
        return {
          title: 'About',
          subtitle: undefined,
        };
      case 'main':
      default:
        return {
          title: 'Menu',
          subtitle: 'Quick access to all features',
        };
    }
  }, [currentView, store.goldRates?.updatedAt]);

  // ─────────────────────────────────────────────────────────────
  // 1. MAIN MENU VIEW
  // ─────────────────────────────────────────────────────────────
  const renderMainView = () => {
    const displayName = user?.username ? (user.username.charAt(0).toUpperCase() + user.username.slice(1)) : 'Ramesh Kumar';
    const email = `${(user?.username || 'ramesh').toLowerCase()}@example.com`;

    return (
      <View style={styles.viewContainer}>
        {/* User Card */}
        <TouchableOpacity
          style={styles.userCard}
          activeOpacity={0.8}
          onPress={() => setProfileModalVisible(true)}
        >
          <View style={styles.userAvatarContainer}>
            <Image
              source={require('../../../assets/Logo.png')}
              style={styles.userAvatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userRole} numberOfLines={1}>Owner of Gold Loan Business</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Section 1: Insights & Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INSIGHTS & REPORTS</Text>
          <View style={styles.menuItemsGroup}>
            {/* Reports */}
            <TouchableOpacity
              style={styles.menuItemCard}
              activeOpacity={0.7}
              onPress={() => setCurrentView('reports')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
                <Ionicons name="document-text-outline" size={22} color={isDark ? '#34d399' : '#10b981'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Reports</Text>
                <Text style={styles.menuItemSub}>View reports and analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Gold Rates */}
            <TouchableOpacity
              style={styles.menuItemCard}
              activeOpacity={0.7}
              onPress={() => setCurrentView('gold-rates')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
                <Ionicons name="trending-up-outline" size={22} color={isDark ? '#f87171' : '#ef4444'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Gold Rates</Text>
                <Text style={styles.menuItemSub}>View and update live gold rates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Settings & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS & SUPPORT</Text>
          <View style={styles.menuItemsGroup}>
            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItemCard}
              activeOpacity={0.7}
              onPress={() => setCurrentView('settings')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
                <Ionicons name="settings-outline" size={22} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Settings</Text>
                <Text style={styles.menuItemSub}>App preferences and configurations</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              style={styles.menuItemCard}
              activeOpacity={0.7}
              onPress={() => setCurrentView('help')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff' }]}>
                <Ionicons name="help-circle-outline" size={22} color={isDark ? '#38bdf8' : '#0ea5e9'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Help & Support</Text>
                <Text style={styles.menuItemSub}>FAQs and support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* About */}
            <TouchableOpacity
              style={styles.menuItemCard}
              activeOpacity={0.7}
              onPress={() => setCurrentView('about')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff' }]}>
                <Ionicons name="information-circle-outline" size={22} color={isDark ? '#a78bfa' : '#8b5cf6'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>About</Text>
                <Text style={styles.menuItemSub}>App version, privacy policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Logout Card */}
            <TouchableOpacity
              style={[styles.menuItemCard, styles.logoutCard]}
              activeOpacity={0.7}
              onPress={() => setLogoutModalVisible(true)}
            >
              <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Logout</Text>
                <Text style={styles.menuItemSub}>Sign out from this device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 2. REPORTS VIEW
  // ─────────────────────────────────────────────────────────────
  const renderReportsView = () => {
    const dash = store.dashboardData;
    const activeLoans = store.loans.filter((l) => l.LoanStatus === 'Active');
    const overdueLoans = store.loans.filter((l) => {
      if (l.LoanStatus !== 'Active') return false;
      const due = l.DueDate ? new Date(l.DueDate) : null;
      return due ? due < new Date() : false;
    });
    const closedLoans = store.loans.filter((l) => l.LoanStatus === 'Closed');
    const cancelledLoans = store.loans.filter((l) => l.LoanStatus === 'Cancelled');

    // Principal Outstanding in Lakhs
    const principalOut = dash.totalLoanAmount || 0;
    const principalStr = principalOut >= 100000 
      ? `₹${(principalOut / 100000).toFixed(2)} L` 
      : `₹${principalOut.toLocaleString('en-IN')}`;

    // Compute active interest receivable estimate
    const interestReceivable = activeLoans.reduce((sum, l) => {
      const amt = Number(l.LoanAmount) || 0;
      const rate = Number(l.InterestRate) || 12;
      return sum + Math.round(amt * (rate / 100) * (3 / 12));
    }, 0);

    // Current month collection calculation
    const now = new Date();
    const currentMonthName = now.toLocaleString('default', { month: 'short' });
    const currentMonthPayments = store.payments.filter((p) => {
      const d = p.PaymentDate ? new Date(p.PaymentDate) : (p.CreatedDate ? new Date(p.CreatedDate) : null);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const collectedThisMonth = currentMonthPayments.reduce((sum, p) => sum + (Number(p.TotalPaidAmount) || 0), 0);

    // Group active loans by Bank Account / Bank Name
    const bankExposureMap: Record<string, number> = {};
    activeLoans.forEach((l) => {
      const bankName = l.BankName || 'Primary Bank';
      bankExposureMap[bankName] = (bankExposureMap[bankName] || 0) + (Number(l.LoanAmount) || 0);
    });

    const bankEntries = Object.entries(bankExposureMap).sort((a, b) => b[1] - a[1]);
    const maxBankExposure = Math.max(...bankEntries.map((e) => e[1]), principalOut || 1);

    const totalLoansCount = store.loans.length || 1;

    return (
      <View style={styles.viewContainer}>
        {/* 2x2 Top Metrics Grid */}
        <View style={styles.reportGrid}>
          {/* Principal Outstanding */}
          <View style={styles.reportMetricCard}>
            <Text style={styles.reportMetricLabel}>Principal outstanding</Text>
            <Text style={styles.reportMetricVal}>{principalStr}</Text>
          </View>

          {/* Interest Receivable */}
          <View style={styles.reportMetricCard}>
            <Text style={styles.reportMetricLabel}>Interest receivable</Text>
            <Text style={styles.reportMetricVal}>₹{interestReceivable.toLocaleString('en-IN')}</Text>
          </View>

          {/* Collected this month */}
          <View style={styles.reportMetricCard}>
            <Text style={styles.reportMetricLabel}>Collected in {currentMonthName}</Text>
            <Text style={styles.reportMetricVal}>₹{collectedThisMonth.toLocaleString('en-IN')}</Text>
          </View>

          {/* Payments count */}
          <View style={styles.reportMetricCard}>
            <Text style={styles.reportMetricLabel}>Payments in {currentMonthName}</Text>
            <Text style={styles.reportMetricVal}>{currentMonthPayments.length}</Text>
          </View>
        </View>

        {/* Loans by status */}
        <View style={styles.reportCard}>
          <Text style={styles.cardHeaderTitle}>Loans by status</Text>
          <View style={styles.statusBarsList}>
            {/* Active */}
            <View style={styles.statusBarRow}>
              <Text style={styles.statusNameLabel}>Active</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: '#10b981', width: `${Math.min(100, Math.round((activeLoans.length / totalLoansCount) * 100))}%` }]} />
              </View>
              <Text style={styles.statusCountVal}>{activeLoans.length}</Text>
            </View>

            {/* Overdue */}
            <View style={styles.statusBarRow}>
              <Text style={styles.statusNameLabel}>Overdue</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: '#ef4444', width: `${Math.min(100, Math.round((overdueLoans.length / totalLoansCount) * 100))}%` }]} />
              </View>
              <Text style={styles.statusCountVal}>{overdueLoans.length}</Text>
            </View>

            {/* Closed */}
            <View style={styles.statusBarRow}>
              <Text style={styles.statusNameLabel}>Closed</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: '#64748b', width: `${Math.min(100, Math.round((closedLoans.length / totalLoansCount) * 100))}%` }]} />
              </View>
              <Text style={styles.statusCountVal}>{closedLoans.length}</Text>
            </View>

            {/* Cancelled */}
            <View style={styles.statusBarRow}>
              <Text style={styles.statusNameLabel}>Cancelled</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: '#cbd5e1', width: `${Math.min(100, Math.round((cancelledLoans.length / totalLoansCount) * 100))}%` }]} />
              </View>
              <Text style={styles.statusCountVal}>{cancelledLoans.length}</Text>
            </View>
          </View>
        </View>

        {/* Active exposure by bank */}
        <View style={styles.reportCard}>
          <Text style={styles.cardHeaderTitle}>Active exposure by bank</Text>
          <View style={styles.bankExposureList}>
            {bankEntries.length === 0 ? (
              <Text style={styles.emptyNoticeText}>No active bank exposure recorded.</Text>
            ) : (
              bankEntries.map(([name, val]) => {
                const pct = Math.min(100, Math.round((val / maxBankExposure) * 100));
                const amtStr = val >= 100000 ? `₹${(val / 100000).toFixed(2)} L` : `₹${val.toLocaleString('en-IN')}`;
                return (
                  <View key={name} style={styles.bankExposureItem}>
                    <View style={styles.bankExposureLabelRow}>
                      <Text style={styles.bankNameText} numberOfLines={1}>{name}</Text>
                      <Text style={styles.bankAmountText}>{amtStr}</Text>
                    </View>
                    <View style={styles.bankBarTrack}>
                      <View style={[styles.bankBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 3. GOLD RATES VIEW
  // ─────────────────────────────────────────────────────────────
  const renderGoldRatesView = () => {
    const rates = store.goldRates;
    const r24 = rates?.gold24k?.rate1g || Env.FALLBACK_24K_RATE;
    const r22 = rates?.gold22k?.rate1g || Env.FALLBACK_22K_RATE;
    const r18 = rates?.gold18k?.rate1g || Env.FALLBACK_18K_RATE;

    return (
      <View style={styles.viewContainer}>
        {/* Rate Cards Stack */}
        <View style={styles.goldRateStack}>
          {/* 24K Pure */}
          <View style={styles.goldRateCard}>
            <View style={styles.goldKaratBadge}>
              <Text style={styles.goldKaratBadgeText}>24K</Text>
            </View>
            <View style={styles.goldRateMainCol}>
              <Text style={styles.goldPriceGram}>₹{r24.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
              <Text style={styles.goldSubDetail}>99.9% pure</Text>
            </View>
            <View style={styles.goldTenGramCol}>
              <Text style={styles.goldTenGramWeight}>10 g</Text>
              <Text style={styles.goldTenGramPrice}>₹{(r24 * 10).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* 22K Standard (Featured Active Card) */}
          <View style={[styles.goldRateCard, styles.goldRateCard22k]}>
            <View style={[styles.goldKaratBadge, styles.goldKaratBadge22k]}>
              <Text style={[styles.goldKaratBadgeText, styles.goldKaratBadgeText22k]}>22K</Text>
            </View>
            <View style={styles.goldRateMainCol}>
              <Text style={styles.goldPriceGram}>₹{r22.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
              <Text style={[styles.goldSubDetail, { color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '600' }]}>
                91.6% · used for valuation
              </Text>
            </View>
            <View style={styles.goldTenGramCol}>
              <Text style={styles.goldTenGramWeight}>10 g</Text>
              <Text style={styles.goldTenGramPrice}>₹{(r22 * 10).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* 18K Hallmarked */}
          <View style={styles.goldRateCard}>
            <View style={styles.goldKaratBadge}>
              <Text style={styles.goldKaratBadgeText}>18K</Text>
            </View>
            <View style={styles.goldRateMainCol}>
              <Text style={styles.goldPriceGram}>₹{r18.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
              <Text style={styles.goldSubDetail}>75.0%</Text>
            </View>
            <View style={styles.goldTenGramCol}>
              <Text style={styles.goldTenGramWeight}>10 g</Text>
              <Text style={styles.goldTenGramPrice}>₹{(r18 * 10).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshRatesBtn}
          activeOpacity={0.8}
          disabled={store.isFetchingGoldRates}
          onPress={async () => {
            toast.info('Fetching live Bangalore rates...');
            await store.refreshGoldRates(true);
            toast.success('Live gold rates refreshed.');
          }}
        >
          {store.isFetchingGoldRates ? (
            <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
          )}
          <Text style={styles.refreshRatesBtnText}>
            {store.isFetchingGoldRates ? 'Updating rates...' : 'Refresh rates'}
          </Text>
        </TouchableOpacity>

        {/* Note at bottom */}
        <Text style={styles.goldRatesFooterNote}>
          Gold value across the app uses the 22K rate, with 24K as fallback.
        </Text>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 4. SETTINGS VIEW
  // ─────────────────────────────────────────────────────────────
  const renderSettingsView = () => {
    return (
      <View style={styles.viewContainer}>
        {/* Section: Security */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          <View style={styles.menuItemsGroup}>
            {/* Fingerprint unlock */}
            <View style={styles.settingsRowItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff' }]}>
                <Ionicons name="finger-print-outline" size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Fingerprint unlock</Text>
                <Text style={styles.menuItemSub}>Unlock without typing your password</Text>
              </View>
              <Switch
                value={fingerprintEnabled}
                onValueChange={setFingerprintEnabled}
                trackColor={{ false: '#cbd5e1', true: isDark ? '#0284c7' : '#0284c7' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Lock app now */}
            <TouchableOpacity
              style={styles.settingsRowItem}
              activeOpacity={0.7}
              onPress={() => {
                toast.info('App locked. Please enter credentials.');
                router.replace('/login' as any);
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff' }]}>
                <Ionicons name="lock-closed-outline" size={22} color={isDark ? '#c084fc' : '#a855f7'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Lock app now</Text>
                <Text style={styles.menuItemSub}>Secure your app immediately</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* End session */}
            <TouchableOpacity
              style={styles.settingsRowItem}
              activeOpacity={0.7}
              onPress={() => setLogoutModalVisible(true)}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
                <Ionicons name="time-outline" size={22} color={isDark ? '#f87171' : '#ef4444'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>End session</Text>
                <Text style={styles.menuItemSub}>Sign out from this device only</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reminders</Text>
          <View style={styles.menuItemsGroup}>
            {/* Due date reminders */}
            <View style={styles.settingsRowItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff' }]}>
                <Ionicons name="notifications-outline" size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Due date reminders</Text>
                <Text style={styles.menuItemSub}>Notify for due and overdue loans</Text>
              </View>
              <Switch
                value={dueDateReminders}
                onValueChange={setDueDateReminders}
                trackColor={{ false: '#cbd5e1', true: isDark ? '#0284c7' : '#0284c7' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Segmented Remind before due date */}
            <View style={styles.remindSegmentContainer}>
              <Text style={styles.remindSegmentLabel}>Remind before due date</Text>
              <View style={styles.segmentedRow}>
                {(['1', '3', '7'] as const).map((d) => {
                  const selected = remindDays === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.segmentBtn, selected && styles.segmentBtnSelected]}
                      onPress={() => setRemindDays(d)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentBtnText, selected && styles.segmentBtnTextSelected]}>
                        {d} {d === '1' ? 'day' : 'days'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Section: Data & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data & Sync</Text>
          <View style={styles.menuItemsGroup}>
            {/* Sync automatically */}
            <View style={styles.settingsRowItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
                <Ionicons name="cloud-outline" size={22} color={isDark ? '#34d399' : '#10b981'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Sync automatically</Text>
                <Text style={styles.menuItemSub}>When connection returns</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#cbd5e1', true: isDark ? '#0284c7' : '#0284c7' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Sync now */}
            <TouchableOpacity
              style={styles.settingsRowItem}
              activeOpacity={0.7}
              disabled={isSyncingData}
              onPress={handleManualSync}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff' }]}>
                <Ionicons name="sync-outline" size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Sync now</Text>
                <Text style={styles.menuItemSub}>
                  {store.lastSyncedAt ? `Last synced at ${store.lastSyncedAt}` : 'All changes synced'}
                </Text>
              </View>
              {isSyncingData ? (
                <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
              ) : (
                <Ionicons name="refresh" size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 5. HELP & SUPPORT VIEW
  // ─────────────────────────────────────────────────────────────
  const renderHelpView = () => {
    const faqs = [
      {
        q: 'How is net disbursement calculated?',
        a: 'Net disbursement is calculated by deducting upfront administrative charges (Processing fee 0.5%, document charge ₹250, insurance charge ₹500) directly from the sanctioned principal loan amount.',
      },
      {
        q: 'How is available bank limit worked out?',
        a: 'Each lending bank account has an authorized Maximum Credit Limit. The available headroom is computed as Maximum Loan Limit minus the total outstanding balance of all active loans assigned to that bank account.',
      },
      {
        q: 'Can i close a loan with a balance?',
        a: 'No. Active gold loans must have their full principal and accrued interest settled before recording final closure and triggering the release of pledged physical gold ornaments from the vault.',
      },
      {
        q: 'How is gold value calculated?',
        a: 'Portfolio valuation is computed using real-time Bangalore bullion market benchmarks (22K 916 rate for jewelry standard) multiplied by the net weight of gold collateral, excluding stones.',
      },
    ];

    return (
      <View style={styles.viewContainer}>
        {/* Section: Frequently asked */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Frequently asked</Text>
          <View style={styles.faqListContainer}>
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <View key={idx} style={styles.faqItemWrapper}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    activeOpacity={0.7}
                    onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                  >
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <Ionicons
                      name={isExpanded ? 'remove' : 'add'}
                      size={20}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswerText}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Section: Contact support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact support</Text>
          <View style={styles.contactButtonsRow}>
            {/* Call Button */}
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <Ionicons name="call-outline" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>

            {/* WhatsApp Button */}
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://wa.me/919876543210')}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={{ marginRight: 6 }} />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 6. ABOUT VIEW
  // ─────────────────────────────────────────────────────────────
  const renderAboutView = () => {
    return (
      <View style={styles.viewContainer}>
        {/* Centered Golden Emblem & Info */}
        <View style={styles.aboutContentCentered}>
          <View style={styles.aboutCoinEmblem}>
            <MaterialCommunityIcons name="bank" size={46} color="#d97706" />
          </View>
          <Text style={styles.aboutAppTitle}>Gold Loan Tracker</Text>
          <Text style={styles.aboutVersionText}>Version 1.0.0</Text>
          <Text style={styles.aboutDescriptionText}>
            Gold Loan Tracker is a simple and powerful application for gold-loan business owners and operators. It helps you manage customers, bank accounts, ornaments, loans, payments, and business reports – all in one place.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ─── FIXED TOP SECTION (PINNED AT THE TOP, NEVER SCROLLS AWAY) ─── */}
      <View style={styles.fixedHeaderWrapper}>
        <View style={styles.fixedHeaderContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            testID="menu-back-btn"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{headerMeta.title}</Text>
            {headerMeta.subtitle ? (
              <Text style={styles.headerSubtitle}>{headerMeta.subtitle}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ─── SCROLLABLE CONTENT (AUTO RESETS TO TOP ON TAB SWITCH) ─── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentView === 'main' && renderMainView()}
        {currentView === 'reports' && renderReportsView()}
        {currentView === 'gold-rates' && renderGoldRatesView()}
        {currentView === 'settings' && renderSettingsView()}
        {currentView === 'help' && renderHelpView()}
        {currentView === 'about' && renderAboutView()}
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────
          LOGOUT CONFIRMATION MODAL (Matching Image 1 Right Exactly)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModalVisible(false)}>
          <Pressable style={styles.modalDialogCard} onPress={(e) => e.stopPropagation()}>
            {/* Circular Red Exit Badge */}
            <View style={styles.modalBadgeCircle}>
              <Ionicons name="log-out-outline" size={26} color="#ef4444" />
            </View>

            {/* Modal Title & Message */}
            <Text style={styles.modalDialogTitle}>Logout?</Text>
            <Text style={styles.modalDialogMessage}>
              Are you sure you want to sign out from this device?
            </Text>

            {/* Blue Info Banner */}
            <View style={styles.modalInfoBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#0284c7" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.modalInfoBannerText}>
                You will need to log in again to access your account.
              </Text>
            </View>

            {/* Actions: Cancel & Logout */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalLogoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* User Profile Modal */}
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#ffffff',
    },

    // ─── Fixed Header Bar (Pinned to the top) ───
    fixedHeaderWrapper: {
      backgroundColor: isDark ? '#000000' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
      zIndex: 10,
      width: '100%',
    },
    fixedHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      width: '100%',
      maxWidth: isDesktop ? 680 : undefined,
      alignSelf: 'center',
    },
    backBtn: {
      marginRight: 14,
      padding: 4,
    },
    headerTitles: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // ─── Scroll Container (No bottom gap) ───
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 14,
      paddingBottom: 20, // Tight bottom padding; removes awkward bottom gap
    },
    viewContainer: {
      width: '100%',
      maxWidth: isDesktop ? 680 : undefined,
      alignSelf: 'center',
      paddingHorizontal: 20,
    },

    // ─── User Profile Card ───
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 18,
      backgroundColor: isDark ? '#1e293b' : '#f0f7ff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      marginBottom: 20,
    },
    userAvatarContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      overflow: 'hidden',
      backgroundColor: isDark ? '#334155' : '#cbd5e1',
      marginRight: 14,
    },
    userAvatarImage: {
      width: '100%',
      height: '100%',
    },
    userMeta: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    userRole: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 1,
    },
    userEmail: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // ─── Sections ───
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 10,
      paddingLeft: 4,
    },
    menuItemsGroup: {
      gap: 10,
    },
    menuItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    menuIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    menuItemTextCol: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    menuItemSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // ─── Logout Card Item ───
    logoutCard: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
    },
    logoutIconBox: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
    },

    // ─── Reports Screen Styles ───
    reportGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 18,
    },
    reportMetricCard: {
      width: isDesktop ? '23.5%' : '48%',
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    reportMetricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    reportMetricVal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    reportCard: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      marginBottom: 16,
    },
    cardHeaderTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 14,
    },
    statusBarsList: {
      gap: 12,
    },
    statusBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statusNameLabel: {
      width: 72,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    statusCountVal: {
      width: 28,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    bankExposureList: {
      gap: 12,
    },
    bankExposureItem: {
      gap: 6,
    },
    bankExposureLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    bankAmountText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    bankBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      overflow: 'hidden',
    },
    bankBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#0284c7',
    },
    emptyNoticeText: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingVertical: 12,
      textAlign: 'center',
    },

    // ─── Gold Rates View Styles ───
    goldRateStack: {
      gap: 12,
      marginBottom: 20,
    },
    goldRateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    goldRateCard22k: {
      backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
      borderColor: '#0284c7',
      borderWidth: 1.5,
    },
    goldKaratBadge: {
      width: 44,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    goldKaratBadge22k: {
      backgroundColor: isDark ? '#0369a1' : '#e0f2fe',
    },
    goldKaratBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    goldKaratBadgeText22k: {
      color: isDark ? '#38bdf8' : '#0284c7',
    },
    goldRateMainCol: {
      flex: 1,
    },
    goldPriceGram: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    goldPerGram: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    goldSubDetail: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    goldTenGramCol: {
      alignItems: 'flex-end',
    },
    goldTenGramWeight: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    goldTenGramPrice: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    refreshRatesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      marginBottom: 16,
    },
    refreshRatesBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    goldRatesFooterNote: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      paddingHorizontal: 20,
    },

    // ─── Settings View Styles ───
    settingsRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    remindSegmentContainer: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      gap: 12,
    },
    remindSegmentLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    },
    segmentBtnSelected: {
      backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
      borderColor: '#0284c7',
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    segmentBtnTextSelected: {
      color: isDark ? '#38bdf8' : '#0284c7',
    },

    // ─── Help & Support Styles ───
    faqListContainer: {
      gap: 10,
    },
    faqItemWrapper: {
      borderRadius: 14,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      overflow: 'hidden',
    },
    faqQuestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      gap: 12,
    },
    faqQuestionText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    faqAnswerContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 4,
    },
    faqAnswerText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    contactButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    contactBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    contactBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // ─── About View Styles ───
    aboutContentCentered: {
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 16,
    },
    aboutCoinEmblem: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: isDark ? '#382504' : '#fef3c7',
      borderWidth: 4,
      borderColor: '#f59e0b',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    aboutAppTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#38bdf8' : '#0284c7',
      marginBottom: 6,
    },
    aboutVersionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 20,
    },
    aboutDescriptionText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 420,
    },

    // ─── Logout Modal Dialog Styles (Image 1 Right) ───
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalDialogCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 22,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      padding: 22,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    modalBadgeCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalDialogTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalDialogMessage: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    modalInfoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
      borderColor: isDark ? '#0369a1' : '#bae6fd',
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      width: '100%',
    },
    modalInfoBannerText: {
      flex: 1,
      fontSize: 12,
      color: isDark ? '#38bdf8' : '#0369a1',
      lineHeight: 16,
      fontWeight: '600',
    },
    modalButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalLogoutBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#dc2626',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalLogoutBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
