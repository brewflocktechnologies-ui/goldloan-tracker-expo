import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { DashboardStyles } from './types';

export function ReadOnlyBanner({ styles, isDark }: { styles: DashboardStyles; isDark: boolean }) {
  return (
          <View style={styles.readOnlyNoticeBanner}>
            <Ionicons name="eye" size={16} color={isDark ? '#38bdf8' : '#0369a1'} />
            <Text style={styles.readOnlyNoticeText}>
              Viewing in <Text style={{ fontWeight: '700' }}>Read-Only Mode</Text>. Adding loans, customers, gold or settling requires SuperAdmin privileges.
            </Text>
          </View>
  );
}
