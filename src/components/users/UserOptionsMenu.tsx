import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface UserOptionsMenuHandle {
  close: () => void;
  isOpen: () => boolean;
}

interface UserOptionsMenuProps {
  isDark: boolean;
  textPrimaryColor: string;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopyId: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
}

const MENU_WIDTH = 210;
const MENU_GAP = 8;
const SCREEN_EDGE_MARGIN = 12;

export const UserOptionsMenu = forwardRef<UserOptionsMenuHandle, UserOptionsMenuProps>(
  ({ isDark, textPrimaryColor, isSuperAdmin, onEdit, onDelete, onCopyId, onCall, onWhatsApp }, ref) => {
    const styles = getStyles(isDark);
    const triggerRef = useRef<View>(null);
    const [visible, setVisible] = useState(false);
    const [anchor, setAnchor] = useState({ top: 56, right: SCREEN_EDGE_MARGIN });
    const animValue = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      close: () => setVisible(false),
      isOpen: () => visible,
    }), [visible]);

    useEffect(() => {
      if (visible) {
        animValue.setValue(0);
        Animated.timing(animValue, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    }, [visible, animValue]);

    const openMenu = () => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get('window').width;
        setAnchor({
          top: y + height + MENU_GAP,
          right: Math.max(SCREEN_EDGE_MARGIN, windowWidth - (x + width)),
        });
        setVisible(true);
      });
    };

    const closeMenu = () => setVisible(false);

    const runAction = (action?: () => void) => {
      closeMenu();
      if (action) action();
    };

    return (
      <>
        <TouchableOpacity
          ref={triggerRef}
          onPress={openMenu}
          style={styles.headerMenuBtn}
          accessibilityLabel="Menu options"
        >
          <View style={styles.menuDotsContainer}>
            <View style={styles.menuDotCircle} />
            <View style={styles.menuDotCircle} />
            <View style={styles.menuDotCircle} />
          </View>
        </TouchableOpacity>

        <Modal visible={visible} transparent animationType="fade" onRequestClose={closeMenu}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
            <Animated.View
              style={[
                styles.menuBox,
                {
                  top: anchor.top,
                  right: anchor.right,
                  opacity: animValue,
                  transform: [{ scaleY: animValue }],
                },
              ]}
            >
              {isSuperAdmin && (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => runAction(onEdit)}>
                    <Ionicons name="pencil-outline" size={18} color={textPrimaryColor} />
                    <Text style={styles.menuItemText}>Edit Customer</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}

              {onCall && (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => runAction(onCall)}>
                    <Ionicons name="call-outline" size={18} color="#0284c7" />
                    <Text style={styles.menuItemText}>Call Customer</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}

              {onWhatsApp && (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => runAction(onWhatsApp)}>
                    <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
                    <Text style={styles.menuItemText}>WhatsApp Customer</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={() => runAction(onCopyId)}>
                <Ionicons name="copy-outline" size={18} color={textPrimaryColor} />
                <Text style={styles.menuItemText}>Copy Customer Code</Text>
              </TouchableOpacity>

              {isSuperAdmin && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} onPress={() => runAction(onDelete)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Customer</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }
);

const getStyles = (isDark: boolean) => StyleSheet.create({
  headerMenuBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDotsContainer: {
    width: 20,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
  },
  menuDotCircle: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    borderWidth: 1.8,
    borderColor: isDark ? '#f8fafc' : '#0d172a',
    backgroundColor: 'transparent',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menuBox: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingVertical: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    transformOrigin: 'top',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },
  menuDivider: { height: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9' },
});
