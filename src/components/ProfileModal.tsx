import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../services/store';
import { ThemeColors } from '../constants/theme';
import { ThemeToggleBtn } from './ThemeToggleBtn';
import { ConfirmModal } from './ConfirmModal';

import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TextInput } from 'react-native';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { user, isSuperAdmin, logout } = useAuth();
  const store = useAppStore();
  const toast = useToast();

  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Change Password state
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const username = user?.username || 'User';
  const role = user?.role || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  const handleManageUsers = () => {
    onClose();
    router.push('/(tabs)/admin-users' as any);
  };

  const handleOpenChangePassword = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError(null);
    setChangePasswordVisible(true);
  };

  const handleSubmitPasswordChange = async () => {
    setPassError(null);
    const trimmedNew = newPassword.trim();
    if (!trimmedNew) {
      setPassError('New password cannot be empty.');
      return;
    }
    if (trimmedNew.length < 4) {
      setPassError('Password should be at least 4 characters long.');
      return;
    }
    if (trimmedNew !== confirmPassword.trim()) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await api.changePassword(trimmedNew, oldPassword.trim() || undefined);
      if (res.success) {
        toast.success('Password changed successfully.');
        setChangePasswordVisible(false);
      } else {
        setPassError(res.error || 'Failed to change password.');
      }
    } catch (e: any) {
      setPassError(e.message || 'Error changing password.');
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleLogoutPress = () => {
    setConfirmLogoutVisible(true);
  };

  const handleConfirmLogout = async () => {
    setConfirmLogoutVisible(false);
    setLoggingOut(true);
    try {
      await logout();
      onClose();
      router.replace('/login' as any);
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.userInfoRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>{username}</Text>
                  <View style={[styles.roleBadge, isSuperAdmin ? styles.roleBadgeSuper : styles.roleBadgeUser]}>
                    <Ionicons
                      name={isSuperAdmin ? 'shield-checkmark' : 'eye'}
                      size={11}
                      color={isSuperAdmin ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fbbf24' : '#b45309')}
                    />
                    <Text style={[styles.roleText, isSuperAdmin ? styles.roleTextSuper : styles.roleTextUser]}>
                      {isSuperAdmin ? 'SuperAdmin (Full Access)' : 'User (Read-Only)'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {/* Admin Users Directory */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleManageUsers}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                  <Ionicons name="people" size={18} color={isDark ? '#34d399' : '#059669'} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>
                    {isSuperAdmin ? 'Manage Admin Users' : 'Staff Accounts'}
                  </Text>
                  <Text style={styles.menuItemSub}>
                    {isSuperAdmin ? 'Add staff, reset passwords & set roles' : 'View admin users & assigned roles'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Change Password */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleOpenChangePassword}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}>
                  <Ionicons name="key-outline" size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Change Password</Text>
                  <Text style={styles.menuItemSub}>Update your account login password</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Sync Live Rates & Data */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  store.syncFromBackend(true);
                }}
                disabled={store.isSyncing}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
                  {store.isSyncing ? (
                    <ActivityIndicator size="small" color={isDark ? '#60a5fa' : '#2563eb'} />
                  ) : (
                    <Ionicons name="refresh" size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
                  )}
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Sync Portfolio Data</Text>
                  <Text style={styles.menuItemSub}>
                    {store.isSyncing ? 'Synchronizing latest data...' : 'Refresh gold rates & active records'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Theme Switcher */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#3b1d54' : '#faf5ff' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#c084fc' : '#9333ea'} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Appearance Theme</Text>
                  <Text style={styles.menuItemSub}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                </View>
                <ThemeToggleBtn size={16} />
              </View>
            </View>

            {/* Logout Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogoutPress}
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 420 }]}>
            <View style={styles.header}>
              <Text style={styles.userName}>Change Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 14, gap: 12 }}>
              {passError ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', padding: 10, borderRadius: 10 }}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>{passError}</Text>
                </View>
              ) : null}

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  Current Password (Optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: colors.textPrimary,
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.placeholder}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  New Password *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: colors.textPrimary,
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  Confirm New Password *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: colors.textPrimary,
                  }}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setChangePasswordVisible(false)}
                disabled={passSubmitting}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, backgroundColor: isDark ? '#fbbf24' : colors.primaryDark }}
                onPress={handleSubmitPasswordChange}
                disabled={passSubmitting}
              >
                {passSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#1e293b' : '#ffffff' }}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={confirmLogoutVisible}
        title="Sign Out"
        message="Are you sure you want to sign out of Goldora? Your session token will be invalidated."
        confirmLabel="Yes, Sign Out"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogoutVisible(false)}
      />
    </>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#b45309' : '#fef08a',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#d97706' : '#eab308',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#fef3c7' : '#854d0e',
    },
    userMeta: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 9999,
      marginTop: 4,
      alignSelf: 'flex-start',
      gap: 4,
    },
    roleBadgeSuper: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
      borderColor: isDark ? '#059669' : '#a7f3d0',
      borderWidth: 1,
    },
    roleBadgeUser: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fffbeb',
      borderColor: isDark ? '#d97706' : '#fde68a',
      borderWidth: 1,
    },
    roleText: {
      fontSize: 10,
      fontWeight: '700',
    },
    roleTextSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    roleTextUser: {
      color: isDark ? '#fbbf24' : '#b45309',
    },
    closeBtn: {
      padding: 6,
      borderRadius: 8,
    },
    menuContainer: {
      paddingVertical: 12,
      gap: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      gap: 12,
    },
    menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    menuItemSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#fee2e2',
    },
    logoutText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#dc2626',
    },
  });
