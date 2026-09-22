import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, Easing,
  Image,
  Platform, StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileModal } from '../../components/ProfileModal';
import { SidebarTrigger } from '../../components/SidebarTrigger';
import { ThemeToggleBtn } from '../../components/ThemeToggleBtn';
import { Env } from '../../config/env';
import { Colors, ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';

interface NavItem {
  name: string;
  route: string;
  title: string;
  shortTitle: string;
  icon: string;
  activeIcon: string;
  iconSet?: 'Ionicons' | 'MaterialCommunityIcons';
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'index',
    route: '/(tabs)',
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    icon: 'pie-chart-outline',
    activeIcon: 'pie-chart',
  },
  {
    name: 'users',
    route: '/(tabs)/users',
    title: 'Customers',
    shortTitle: 'Customers',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    name: 'bank-accounts',
    route: '/(tabs)/bank-accounts',
    title: 'Bank Accounts',
    shortTitle: 'Banks',
    icon: 'business-outline',
    activeIcon: 'business',
  },
  {
    name: 'ornaments',
    route: '/(tabs)/ornaments',
    title: 'Ornaments',
    shortTitle: 'Ornaments',
    icon: 'ring',
    activeIcon: 'ring',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    name: 'loans',
    route: '/(tabs)/loans',
    title: 'Active Loans',
    shortTitle: 'Loans',
    icon: 'cash-outline',
    activeIcon: 'cash',
  },
  {
    name: 'closure',
    route: '/(tabs)/closure',
    title: 'Settlements',
    shortTitle: 'Closure',
    icon: 'checkmark-done-circle-outline',
    activeIcon: 'checkmark-done-circle',
  },
];

const TAB_METADATA: Record<string, { title: string; subtitle: string }> = {
  index: {
    title: 'Financial Overview',
    subtitle: 'Real-time portfolio valuation & gold vault status',
  },
  users: {
    title: 'Customers & Borrowers',
    subtitle: 'KYC profiles, pledged assets & credit tracking',
  },
  'bank-accounts': {
    title: 'Lending Bank Accounts',
    subtitle: 'Manage credit limits, lenders & utilized balances',
  },
  ornaments: {
    title: 'Ornaments',
    subtitle: 'Physical inventory, karat purity & ornament details',
  },
  loans: {
    title: 'Active Loans Portfolio',
    subtitle: 'Disbursements, interest tenure & repayments',
  },
  closure: {
    title: 'Loan Closure & Settlements',
    subtitle: 'Settle active loans & release vault collateral',
  },
  'admin-users': {
    title: 'Staff & Admin Accounts',
    subtitle: 'Configure staff roles, read-only permissions & access credentials',
  },
};

export default function TabLayout() {
  return (
    <SidebarProvider>
      <TabLayoutInner />
    </SidebarProvider>
  );
}

function TabLayoutInner() {
  const router = useRouter();
  const pathname = usePathname();
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const { user, isSuperAdmin } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const desktopNavItems = React.useMemo(() => {
    return [
      ...NAV_ITEMS,
      {
        name: 'admin-users',
        route: '/(tabs)/admin-users',
        title: isSuperAdmin ? 'Admin Users' : 'Staff Accounts',
        shortTitle: isSuperAdmin ? 'Admins' : 'Staff',
        icon: 'shield-checkmark-outline' as const,
        activeIcon: 'shield-checkmark' as const,
      },
    ];
  }, [isSuperAdmin]);

  const currentTabKey = (() => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/') return 'index';
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/');
    for (const key of ['admin-users', 'bank-accounts', 'ornaments', 'loans', 'closure', 'users']) {
      if (segments.includes(key) || pathname.includes(`/${key}`)) return key;
    }
    return 'index';
  })();

  const activeTabMeta = React.useMemo(() => {
    if (currentTabKey === 'admin-users') {
      return {
        title: isSuperAdmin ? 'Admin User Management' : 'Staff & Admin Accounts',
        subtitle: isSuperAdmin
          ? 'Configure staff roles, read-only permissions & access credentials'
          : 'Staff account directory and assigned permissions',
      };
    }
    return TAB_METADATA[currentTabKey] || TAB_METADATA.index;
  }, [currentTabKey, isSuperAdmin]);
  const insets = useSafeAreaInsets();
  const { collapsed, setCollapsed, isDesktop } = useSidebar();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const live22kRate = store.goldRates?.gold22k?.rate1g;

  // ─── ACCURATE SAFE AREA INSETS (PREVENTS NOTIFICATION OVERLAP) ───
  const statusBarHeight = Platform.OS === 'android'
    ? Math.max(insets.top, RNStatusBar.currentHeight || 28)
    : insets.top;
  const bottomInset = insets.bottom;

  // On desktop, don't pad for status bar; on mobile, pad safely
  const appTopPadding = isDesktop ? 0 : statusBarHeight;

  // ─── DESKTOP SIDEBAR SMOOTH ANIMATION ───
  const sidebarWidthAnim = useRef(new Animated.Value(collapsed ? 68 : 240)).current;

  useEffect(() => {
    Animated.timing(sidebarWidthAnim, {
      toValue: collapsed ? 68 : 240,
      duration: 240,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [collapsed]);

  const textOpacity = sidebarWidthAnim.interpolate({
    inputRange: [68, 120, 240],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const isRouteActive = (item: NavItem) => {
    if (item.name === 'index') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
    }
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/');
    return segments.includes(item.name);
  };

  const navigateTo = (item: NavItem) => {
    if (item.name === 'index') {
      router.push('/(tabs)' as any);
    } else {
      router.push(`/(tabs)/${item.name}` as any);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: appTopPadding, paddingBottom: isDesktop ? bottomInset : 0 }]}>
      <View style={styles.mainContainer}>
        {/* ─── DESKTOP COLLAPSIBLE SIDEBAR WITH SMOOTH ANIMATION ─── */}
        {isDesktop && (
          <Animated.View style={[styles.desktopSidebar, { width: sidebarWidthAnim }]}>
            {/* Clean Sidebar Header */}
            <View style={styles.desktopSidebarHeader}>
              <View style={styles.desktopBrandRow}>
                <Image
                  source={require('../../../assets/Logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Animated.View style={[styles.desktopBrandTextWrapper, { opacity: textOpacity }]}>
                  <Text style={styles.brandTitle} numberOfLines={1}>{Env.APP_NAME}</Text>
                  <Text style={styles.brandSub} numberOfLines={1}>{Env.APP_SUBTITLE}</Text>
                </Animated.View>
              </View>
            </View>

            {/* Navigation Menu Links */}
            <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent}>
              {desktopNavItems.map((item) => {
                const active = isRouteActive(item);
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => navigateTo(item)}
                    style={[
                      styles.desktopNavItem,
                      active && styles.navItemActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    {active && <View style={styles.activePillIndicator} />}
                    <View style={styles.desktopNavIconBox}>
                      {item.iconSet === 'MaterialCommunityIcons' ? (
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={active ? (isDark ? '#fbbf24' : colors.primaryDark) : colors.textSecondary}
                        />
                      ) : (
                        <Ionicons
                          name={(active ? item.activeIcon : item.icon) as any}
                          size={20}
                          color={active ? (isDark ? '#fbbf24' : colors.primaryDark) : colors.textSecondary}
                        />
                      )}
                    </View>
                    <Animated.View style={[styles.desktopNavTextWrapper, { opacity: textOpacity }]}>
                      <Text 
                        style={[styles.navText, active && styles.navTextActive]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer / Gold Rate Ticker */}
            {!collapsed ? (
              <Animated.View style={[styles.sidebarFooter, { opacity: textOpacity }]}>
                {live22kRate ? (
                  <View style={styles.goldTickerCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="trending-up" size={14} color={Colors.primaryDark} />
                      <Text style={styles.tickerTitle}>{Env.LOCATION_BENCHMARK} 22K</Text>
                    </View>
                    <Text style={styles.tickerRate}>₹{live22kRate.toLocaleString()} <Text style={styles.tickerUnit}>/g</Text></Text>
                  </View>
                ) : null}
                <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
                  <ThemeToggleBtn showLabel size={15} />
                </View>
                <TouchableOpacity 
                  onPress={() => setCollapsed(true)} 
                  style={styles.collapseFooterBtn}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={14} color={Colors.textMuted} />
                    <Ionicons name="chevron-back" size={14} color={Colors.textMuted} style={{ marginLeft: -8 }} />
                  </View>
                  <Text style={styles.collapseFooterText}>{"Collapse (<<)"}</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <>
                <View style={{ alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <ThemeToggleBtn size={15} />
                </View>
                <TouchableOpacity 
                  onPress={() => setCollapsed(false)} 
                  style={styles.expandRailBtn}
                  accessibilityLabel="Expand sidebar"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#fbbf24' : colors.primaryDark} />
                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#fbbf24' : colors.primaryDark} style={{ marginLeft: -8 }} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        {/* ─── TAB SCREENS CONTENT ─── */}
        <View style={styles.screensWrapper}>
          {/* ─── GLOBAL SHARED TOP NAVIGATION BAR ─── */}
          <View style={[styles.topBar, isDesktop && styles.topBarDesktop]}>
            {isDesktop ? (
              /* Desktop: Sidebar Trigger + Page Title & Subtitle */
              <View style={styles.topBarTitleGroup}>
                <SidebarTrigger />
                <View style={styles.topBarTextWrapper}>
                  <Text style={styles.pageTitle} numberOfLines={1}>{activeTabMeta.title}</Text>
                  <Text style={styles.pageSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    {activeTabMeta.subtitle}
                  </Text>
                </View>
              </View>
            ) : (
              /* Mobile: Brand Logo + Company Name & Subtitle */
              <View style={styles.mobileTopBarBrandGroup}>
                <Image
                  source={require('../../../assets/Logo.png')}
                  style={styles.mobileBrandLogo}
                  resizeMode="contain"
                />
                <View style={styles.mobileBrandTextWrapper}>
                  <Text style={styles.mobileBrandTitle} numberOfLines={1}>
                    {Env.APP_NAME}
                  </Text>
                  <Text style={styles.mobileBrandSub} numberOfLines={1} ellipsizeMode="tail">
                    {Env.APP_SUBTITLE}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.topBarActions}>
              {isDesktop && (
                <>
                  <ThemeToggleBtn size={15} />
                  <TouchableOpacity 
                    onPress={() => store.syncFromBackend(true)} 
                    style={styles.refreshActionBtn} 
                    activeOpacity={0.7}
                    disabled={store.isSyncing}
                  >
                    {store.isSyncing ? (
                      <ActivityIndicator size="small" color={isDark ? '#fbbf24' : colors.primaryDark} />
                    ) : (
                      <Ionicons name="refresh" size={15} color={isDark ? '#fbbf24' : colors.primaryDark} />
                    )}
                    <Text style={styles.refreshActionText}>
                      {store.isSyncing ? 'Syncing...' : 'Sync Rates & Data'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Profile Avatar / Menu Button */}
              <TouchableOpacity
                onPress={() => setProfileModalVisible(true)}
                style={styles.profileActionBtn}
                activeOpacity={0.7}
                accessibilityLabel="Open user profile menu"
              >
                <View style={[styles.profileAvatar, isSuperAdmin ? styles.profileAvatarSuper : styles.profileAvatarUser]}>
                  <Text style={[styles.profileAvatarText, isSuperAdmin ? styles.profileAvatarTextSuper : styles.profileAvatarTextUser]}>
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                {isDesktop && (
                  <View style={styles.profileTextWrapper}>
                    <Text style={styles.profileUsername} numberOfLines={1}>
                      {user?.username || 'Account'}
                    </Text>
                    <Text style={[styles.profileRoleTag, isSuperAdmin ? styles.roleSuperText : styles.roleUserText]} numberOfLines={1}>
                      {isSuperAdmin ? 'SuperAdmin' : 'Read-Only'}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Screen Content Tabs */}
          <View style={{ flex: 1 }}>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
              }}
            >
              <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
              <Tabs.Screen name="users" options={{ title: 'Users' }} />
              <Tabs.Screen name="bank-accounts" options={{ title: 'Banks' }} />
              <Tabs.Screen name="ornaments" options={{ title: 'Ornaments' }} />
              <Tabs.Screen name="loans" options={{ title: 'Loans' }} />
              <Tabs.Screen name="closure" options={{ title: 'Closure' }} />
              <Tabs.Screen name="admin-users" options={{ title: 'Admins' }} />
            </Tabs>
          </View>

          {/* ─── MOBILE BOTTOM NAVIGATION BAR (WhatsApp / YouTube style) ─── */}
          {!isDesktop && (
            <View style={[styles.mobileBottomNav, { paddingBottom: Math.max(bottomInset, 8) }]}>
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item);
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => navigateTo(item)}
                    style={styles.bottomNavItem}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.bottomNavIconWrapper, active && styles.bottomNavIconWrapperActive]}>
                      {item.iconSet === 'MaterialCommunityIcons' ? (
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={active ? (isDark ? '#fbbf24' : colors.primaryDark) : colors.textSecondary}
                        />
                      ) : (
                        <Ionicons
                          name={(active ? item.activeIcon : item.icon) as any}
                          size={21}
                          color={active ? (isDark ? '#fbbf24' : colors.primaryDark) : colors.textSecondary}
                        />
                      )}
                    </View>
                    <Text 
                      style={[
                        styles.bottomNavText, 
                        active && styles.bottomNavTextActive
                      ]}
                      numberOfLines={1}
                    >
                      {item.shortTitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Profile & Account Modal */}
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  screensWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ─── GLOBAL TOP NAVIGATION BAR ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  topBarDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  topBarTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 160,
  },
  topBarTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ─── MOBILE TOP BAR BRANDING ───
  mobileTopBarBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mobileBrandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
  },
  mobileBrandTextWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mobileBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  mobileBrandSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : colors.primarySubtle,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fde68a',
    flexShrink: 0,
  },
  refreshActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarSuper: {
    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5',
    borderWidth: 1,
    borderColor: isDark ? '#059669' : '#10b981',
  },
  profileAvatarUser: {
    backgroundColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#fffbeb',
    borderWidth: 1,
    borderColor: isDark ? '#d97706' : '#f59e0b',
  },
  profileAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileAvatarTextSuper: {
    color: isDark ? '#34d399' : '#059669',
  },
  profileAvatarTextUser: {
    color: isDark ? '#fbbf24' : '#b45309',
  },
  profileTextWrapper: {
    marginRight: 4,
  },
  profileUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileRoleTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleSuperText: {
    color: isDark ? '#34d399' : '#059669',
  },
  roleUserText: {
    color: isDark ? '#fbbf24' : '#b45309',
  },

  // ─── DESKTOP SIDEBAR ───
  desktopSidebar: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopSidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  desktopBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  desktopBrandTextWrapper: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginLeft: 10,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    position: 'relative',
    minHeight: 42,
    overflow: 'hidden',
    width: '100%',
  },
  desktopNavIconBox: {
    width: 52,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  desktopNavTextWrapper: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    paddingRight: 8,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brandSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // ─── NAV ITEMS ───
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  desktopNavItemActive: {
    backgroundColor: isDark ? '#261a02' : colors.primarySubtle,
  },
  navItemActive: {
    backgroundColor: isDark ? '#261a02' : colors.primarySubtle,
  },
  activePillIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: isDark ? '#f59e0b' : colors.primaryDark,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  navTextActive: {
    color: isDark ? '#fbbf24' : colors.primaryDark,
    fontWeight: '800',
  },

  // ─── SIDEBAR FOOTER ───
  sidebarFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  goldTickerCard: {
    backgroundColor: isDark ? '#1e293b' : '#fefce8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginBottom: 10,
  },
  tickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  tickerRate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  tickerUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  collapseFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  collapseFooterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  expandRailBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // ─── MOBILE BOTTOM NAVIGATION (WhatsApp / YouTube style) ───
  mobileBottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 20,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    minWidth: 0,
  },
  bottomNavIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIconWrapperActive: {
    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.16)' : 'rgba(217, 119, 6, 0.12)',
  },
  bottomNavText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  bottomNavTextActive: {
    fontWeight: '800',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
});