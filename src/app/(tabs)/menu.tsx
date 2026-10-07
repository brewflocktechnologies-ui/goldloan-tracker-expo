import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    BackHandler,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { AboutView } from '../../components/menu/AboutView';
import { GoldRatesView } from '../../components/menu/GoldRatesView';
import { HelpView } from '../../components/menu/HelpView';
import { LogoutModal } from '../../components/menu/LogoutModal';
import { MainMenuView } from '../../components/menu/MainMenuView';
import { getMenuHeaderMeta } from '../../components/menu/menuHeader';
import { getMenuStyles } from '../../components/menu/menuStyles';
import { MenuView } from '../../components/menu/menuTypes';
import { ReportsView } from '../../components/menu/ReportsView';
import { SettingsView } from '../../components/menu/SettingsView';
import { ProfileModal } from '../../components/ProfileModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore, getSyncError } from '../../services/store';

export default function MenuScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = useMemo(() => getMenuStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);

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
  const headerMeta = useMemo(
    () => getMenuHeaderMeta(currentView, store.goldRates?.updatedAt),
    [currentView, store.goldRates?.updatedAt],
  );

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
        {currentView === 'main' && (
          <MainMenuView
            styles={styles}
            colors={colors}
            isDark={isDark}
            user={user}
            setCurrentView={setCurrentView}
            setProfileModalVisible={setProfileModalVisible}
            setLogoutModalVisible={setLogoutModalVisible}
          />
        )}
        {currentView === 'reports' && <ReportsView styles={styles} store={store} />}
        {currentView === 'gold-rates' && (
          <GoldRatesView styles={styles} colors={colors} isDark={isDark} store={store} toast={toast} />
        )}
        {currentView === 'settings' && (
          <SettingsView
            styles={styles}
            colors={colors}
            isDark={isDark}
            store={store}
            toast={toast}
            router={router}
            fingerprintEnabled={fingerprintEnabled}
            setFingerprintEnabled={setFingerprintEnabled}
            dueDateReminders={dueDateReminders}
            setDueDateReminders={setDueDateReminders}
            remindDays={remindDays}
            setRemindDays={setRemindDays}
            autoSync={autoSync}
            setAutoSync={setAutoSync}
            isSyncingData={isSyncingData}
            handleManualSync={handleManualSync}
            setLogoutModalVisible={setLogoutModalVisible}
          />
        )}
        {currentView === 'help' && (
          <HelpView styles={styles} colors={colors} expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} />
        )}
        {currentView === 'about' && <AboutView styles={styles} />}
      </ScrollView>

      {/* Logout confirmation modal */}
      <LogoutModal
        styles={styles}
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onLogout={handleLogout}
      />

      {/* User Profile Modal */}
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </View>
  );
}
