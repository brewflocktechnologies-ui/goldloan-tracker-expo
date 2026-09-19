import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';

export function SidebarTrigger() {
  const { toggleSidebar, isDesktop, collapsed, mobileDrawerOpen } = useSidebar();
  const { colors, isDark } = useTheme();

  // If desktop: open when !collapsed, closed when collapsed
  // If mobile: open when mobileDrawerOpen, closed when !mobileDrawerOpen
  const isOpen = isDesktop ? !collapsed : mobileDrawerOpen;
  const iconColor = isDark ? '#fbbf24' : colors.primaryDark;

  return (
    <TouchableOpacity
      onPress={toggleSidebar}
      style={[
        styles.btn,
        {
          backgroundColor: isDark ? '#1e293b' : '#fffdf5',
          borderColor: isDark ? '#334155' : '#fde68a',
        },
      ]}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={isOpen ? "Collapse navigation sidebar (<<)" : "Expand navigation sidebar (>>)"}
    >
      <View style={styles.chevronGroup}>
        {isOpen ? (
          // "<<" double arrow
          <View style={styles.doubleArrow}>
            <Ionicons name="chevron-back" size={16} color={iconColor} />
            <Ionicons name="chevron-back" size={16} color={iconColor} style={styles.overlap} />
          </View>
        ) : (
          // ">>" double arrow
          <View style={styles.doubleArrow}>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
            <Ionicons name="chevron-forward" size={16} color={iconColor} style={styles.overlap} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fffdf5',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ca8a04',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    flexShrink: 0,
  },
  chevronGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  overlap: {
    marginLeft: -9,
  },
});
