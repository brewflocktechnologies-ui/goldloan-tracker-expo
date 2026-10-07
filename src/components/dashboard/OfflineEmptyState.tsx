import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { DashboardColors, DashboardStore, DashboardStyles } from './types';

export function OfflineEmptyState({ styles, isDark, colors, store }: { styles: DashboardStyles; isDark: boolean; colors: DashboardColors; store: DashboardStore }) {
  return (
          <View style={styles.offlineEmptyContainer}>
            <View style={styles.offlineIconCircle}>
              <Ionicons name="cloud-offline-outline" size={36} color={isDark ? '#38bdf8' : colors.primaryDark} />
            </View>
            <Text style={styles.offlineEmptyTitle}>Unable to Connect</Text>
            <Text style={styles.offlineEmptySub}>
              {store.syncError || 'Could not reach Google Sheets. Please check your internet connection and tap retry.'}
            </Text>
            <TouchableOpacity 
              style={styles.offlineMainRetryBtn} 
              onPress={() => store.syncFromBackend(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.offlineMainRetryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
  );
}
