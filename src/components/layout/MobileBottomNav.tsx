import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { getStyles } from './layoutStyles';
import { MOBILE_NAV_ITEMS, NavItem } from './navConfig';

interface MobileBottomNavProps {
  styles: ReturnType<typeof getStyles>;
  colors: ThemeColors;
  isDark: boolean;
  bottomInset: number;
  isRouteActive: (item: NavItem) => boolean;
  navigateTo: (item: NavItem) => void;
}

export function MobileBottomNav({ styles, colors, isDark, bottomInset, isRouteActive, navigateTo }: MobileBottomNavProps) {
  return (
        <View style={[styles.mobileBottomNav, { paddingBottom: Math.max(bottomInset, 8) }]}>
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isRouteActive(item);
            const activeColor = (item.name === 'loans' || item.name === 'menu') ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#fbbf24' : colors.primaryDark);
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
                      name={(active ? item.activeIcon : item.icon) as any}
                      size={22}
                      color={active ? activeColor : colors.textSecondary}
                    />
                  ) : (
                    <Ionicons
                      name={(active ? item.activeIcon : item.icon) as any}
                      size={21}
                      color={active ? activeColor : colors.textSecondary}
                    />
                  )}
                </View>
                <Text 
                  style={[
                    styles.bottomNavText, 
                    active && [styles.bottomNavTextActive, { color: activeColor }]
                  ]}
                  numberOfLines={1}
                >
                  {item.shortTitle}
                </Text>
                <View style={[styles.activeTabUnderline, active ? { backgroundColor: activeColor } : styles.inactiveTabUnderline]} />
              </TouchableOpacity>
            );
          })}
        </View>
  );
}
