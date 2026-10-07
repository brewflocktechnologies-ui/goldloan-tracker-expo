import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { useAppStore } from '../../services/store';
import { MenuStyles } from './menuStyles';

interface SettingsViewProps {
  styles: MenuStyles;
  colors: ThemeColors;
  isDark: boolean;
  store: ReturnType<typeof useAppStore>;
  toast: { info: (msg: string) => void };
  router: { replace: (href: any) => void };
  fingerprintEnabled: boolean;
  setFingerprintEnabled: (value: boolean) => void;
  dueDateReminders: boolean;
  setDueDateReminders: (value: boolean) => void;
  remindDays: '1' | '3' | '7';
  setRemindDays: (value: '1' | '3' | '7') => void;
  autoSync: boolean;
  setAutoSync: (value: boolean) => void;
  isSyncingData: boolean;
  handleManualSync: () => void | Promise<void>;
  setLogoutModalVisible: (visible: boolean) => void;
}

export function SettingsView({
  styles,
  colors,
  isDark,
  store,
  toast,
  router,
  fingerprintEnabled,
  setFingerprintEnabled,
  dueDateReminders,
  setDueDateReminders,
  remindDays,
  setRemindDays,
  autoSync,
  setAutoSync,
  isSyncingData,
  handleManualSync,
  setLogoutModalVisible,
}: SettingsViewProps) {
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
}
