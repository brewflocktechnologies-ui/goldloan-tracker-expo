import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { DashboardColors, DashboardRouter, DashboardStyles } from './types';

interface QuickActionsProps {
  styles: DashboardStyles;
  colors: DashboardColors;
  isDark: boolean;
  isDesktop: boolean;
  isReadOnly: boolean;
  router: DashboardRouter;
  handleActionPress: (route: string | { pathname: string; params?: Record<string, string> }) => void;
}

export function QuickActions({ styles, colors, isDark, isDesktop, isReadOnly, router, handleActionPress }: QuickActionsProps) {
  return (
    <>
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={isDesktop ? styles.quickActionsGridDesktop : styles.quickActionsGridMobile}>
          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress('/loans/new')} 
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "add-circle"} size={20} color={isDark ? '#38bdf8' : colors.primaryDark} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>New Loan</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Disburse collateral'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress({ pathname: '/(tabs)/users', params: { action: 'add' } })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "person-add"} size={20} color="#0284c7" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Add Customer</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Register borrower'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[isDesktop ? styles.actionCardDesktop : styles.actionCardMobile, isReadOnly && styles.actionCardDisabled]} 
            onPress={() => handleActionPress({ pathname: '/(tabs)/ornaments', params: { action: 'add' } })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name={isReadOnly ? "lock-closed" : "diamond"} size={20} color="#0369a1" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Pledge Gold</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'Admin only' : 'Deposit vault item'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={isDesktop ? styles.actionCardDesktop : styles.actionCardMobile} 
            onPress={() => router.push('/(tabs)/closure' as any)} 
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="receipt" size={20} color="#16a34a" />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>Settlements</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{isReadOnly ? 'View closures' : 'Record settlement'}</Text>
          </TouchableOpacity>
        </View>
    </>
  );
}
