import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAppStore } from '../services/store';
import { ThemeToggleBtn } from './ThemeToggleBtn';

export interface MobileMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  visible,
  onClose,
  onOpenProfile,
}) => {
  const { colors, isDark } = useTheme();
  const { user, isSuperAdmin, logout } = useAuth();
  const store = useAppStore();
  const toast = useToast();
  const router = useRouter();

  if (!visible) return null;

  const navigateTo = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const username = user?.username || 'User';
  const role = user?.role || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
          ]}
        >
          {/* Pull handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
            ]}
          />

          {/* User info card */}
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isSuperAdmin
                    ? isDark
                      ? 'rgba(5, 150, 105, 0.25)'
                      : '#ecfdf5'
                    : isDark
                    ? 'rgba(56, 189, 248, 0.25)'
                    : '#f0f9ff',
                  borderColor: isSuperAdmin
                    ? isDark
                      ? '#059669'
                      : '#10b981'
                    : isDark
                    ? '#0284c7'
                    : '#0ea5e9',
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: isSuperAdmin
                      ? isDark
                        ? '#34d399'
                        : '#059669'
                      : isDark
                      ? '#38bdf8'
                      : '#0369a1',
                  },
                ]}
              >
                {initials}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text
                style={[
                  styles.userName,
                  { color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
                numberOfLines={1}
              >
                {username}
              </Text>
              <Text
                style={[
                  styles.userRole,
                  {
                    color: isSuperAdmin
                      ? isDark
                        ? '#34d399'
                        : '#059669'
                      : isDark
                      ? '#38bdf8'
                      : '#0369a1',
                  },
                ]}
              >
                {isSuperAdmin ? 'SuperAdmin' : 'Read-Only'}
              </Text>
            </View>

            <ThemeToggleBtn size={16} />
          </View>

          {/* Navigation Items */}
          <View style={styles.menuList}>
            {/* TEMPORARILY DISABLED: Bank Accounts & Loan Settlement menu items. Remove this comment wrapper to restore.
            Bank Accounts
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/bank-accounts')}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={isDark ? '#38bdf8' : '#0284c7'}
                />
              </View>
              <View style={styles.itemTextCol}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                >
                  Bank Accounts
                </Text>
                <Text
                  style={[
                    styles.itemSub,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                  ]}
                >
                  Manage credit limits & balances
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? '#475569' : '#94a3b8'}
              />
            </TouchableOpacity>

            Settlements / Closure
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/closure')}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={20}
                  color={isDark ? '#34d399' : '#059669'}
                />
              </View>
              <View style={styles.itemTextCol}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                >
                  Loan Settlement & Closure
                </Text>
                <Text
                  style={[
                    styles.itemSub,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                  ]}
                >
                  Settle active loans & release vault
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? '#475569' : '#94a3b8'}
              />
            </TouchableOpacity>
            */}

            {/* Admin Users */}
            {isSuperAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/(tabs)/admin-users')}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={isDark ? '#38bdf8' : '#0284c7'}
                  />
                </View>
                <View style={styles.itemTextCol}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: isDark ? '#f8fafc' : '#0f172a' },
                    ]}
                  >
                    Staff & Admin Accounts
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      { color: isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    Manage staff credentials and access
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? '#475569' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}

            {/* Sync Rates & Data */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                toast.info('Syncing rates & data...');
                await store.syncFromBackend(true);
                toast.success('Sync complete!');
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={isDark ? '#a78bfa' : '#7c3aed'}
                />
              </View>
              <View style={styles.itemTextCol}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                >
                  Sync Rates & Data
                </Text>
                <Text
                  style={[
                    styles.itemSub,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                  ]}
                >
                  Fetch live 22K rates & update cache
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? '#475569' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Account Settings / Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onOpenProfile();
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </View>
              <View style={styles.itemTextCol}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                >
                  Account Profile
                </Text>
                <Text
                  style={[
                    styles.itemSub,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                  ]}
                >
                  Change password & security
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? '#475569' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 4 }]}
              onPress={async () => {
                onClose();
                await logout();
                router.replace('/login' as any);
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#fee2e2',
                  },
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={[styles.itemTitle, { color: '#dc2626' }]}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
