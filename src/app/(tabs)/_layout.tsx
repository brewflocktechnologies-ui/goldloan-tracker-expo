import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, Easing,
  Image,
  Platform, StatusBar as RNStatusBar,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileBottomNav } from '../../components/layout/MobileBottomNav';
import { getStyles } from '../../components/layout/layoutStyles';
import { NAV_ITEMS, NavItem, TAB_METADATA } from '../../components/layout/navConfig';
import { ProfileModal } from '../../components/ProfileModal';
import { SidebarTrigger } from '../../components/SidebarTrigger';
import { ThemeToggleBtn } from '../../components/ThemeToggleBtn';
import { Env } from '../../config/env';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';

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
    for (const key of ['admin-users', 'bank-accounts', 'ornaments', 'loans', 'closure', 'users', 'menu']) {
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
                          name={(active ? item.activeIcon : item.icon) as any}
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
          {!isDesktop && ['loans', 'users', 'ornaments', 'menu'].includes(currentTabKey) ? null : (
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
          )}

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
              <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
            </Tabs>
          </View>

          {/* ─── MOBILE BOTTOM NAVIGATION BAR (WhatsApp / YouTube style matching mockup) ─── */}
          {!isDesktop && (
            <MobileBottomNav
              styles={styles} colors={colors} isDark={isDark} bottomInset={bottomInset}
              isRouteActive={isRouteActive} navigateTo={navigateTo}
            />
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
