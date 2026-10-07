import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { MenuStyles } from './menuStyles';
import { MenuView } from './menuTypes';

interface MainMenuViewProps {
  styles: MenuStyles;
  colors: ThemeColors;
  isDark: boolean;
  user: { username?: string } | null | undefined;
  setCurrentView: (view: MenuView) => void;
  setProfileModalVisible: (visible: boolean) => void;
  setLogoutModalVisible: (visible: boolean) => void;
}

export function MainMenuView({
  styles,
  colors,
  isDark,
  user,
  setCurrentView,
  setProfileModalVisible,
  setLogoutModalVisible,
}: MainMenuViewProps) {
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
}
