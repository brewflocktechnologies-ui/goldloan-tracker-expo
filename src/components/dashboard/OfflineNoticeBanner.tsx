import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { DashboardStore, DashboardStyles } from './types';

export function OfflineNoticeBanner({ styles, isDark, store }: { styles: DashboardStyles; isDark: boolean; store: DashboardStore }) {
  return (
          <View style={styles.offlineNoticeBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="cloud-offline-outline" size={15} color={isDark ? '#38bdf8' : '#0369a1'} />
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
  );
}
