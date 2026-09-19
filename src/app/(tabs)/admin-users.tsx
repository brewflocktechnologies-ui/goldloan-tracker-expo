import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { cache } from '../../services/cache';
import { AdminUser, UserRole } from '../../types';
import { DataTable, Column } from '../../components/DataTable';
import { MobileCard } from '../../components/MobileCard';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatCard } from '../../components/StatCard';
import { ThemeColors } from '../../constants/theme';

export default function AdminUsersTabScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = getStyles(colors, isDark, isDesktop);

  const router = useRouter();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('User');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async (force: boolean = false) => {
    try {
      const res = await api.getAdminUsers(force);
      if (res.success && res.data) {
        setAdminUsers(res.data);
      } else {
        toast.danger(res.error || 'Failed to load admin users.');
      }
    } catch (e: any) {
      toast.danger(e.message || 'Error fetching admin users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 0ms instant cache hydration
    cache.get<AdminUser[]>('admin_users_list', true).then(cached => {
      if (cached.data && cached.data.length > 0) {
        setAdminUsers(cached.data);
        setLoading(false);
      }
    });
    loadUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers(true);
  };

  // KPIs
  const totalCount = adminUsers.length;
  const superAdminCount = adminUsers.filter(a => a.Role === 'SuperAdmin').length;
  const userRoleCount = adminUsers.filter(a => a.Role === 'User').length;

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedAdminId(null);
    setFormUsername('');
    setFormPassword('');
    setFormRole('User'); // Default to User role
    setFormStatus('Active');
    setModalError(null);
    setModalVisible(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setIsEditing(true);
    setSelectedAdminId(admin.AdminId);
    setFormUsername(admin.Username);
    setFormPassword(''); // blank means unchanged
    setFormRole(admin.Role || 'User');
    setFormStatus(admin.Status === 'Active' ? 'Active' : 'Inactive');
    setModalError(null);
    setModalVisible(true);
  };

  const handleSubmitModal = async () => {
    setModalError(null);
    const trimmedUser = formUsername.trim();
    const trimmedPass = formPassword.trim();

    if (!isEditing && !trimmedUser) {
      setModalError('Username is required.');
      return;
    }
    if (!isEditing && !trimmedPass) {
      setModalError('Password is required for new accounts.');
      return;
    }

    if (isEditing && !isSuperAdmin && !trimmedPass) {
      setModalError('Please enter a new password.');
      return;
    }

    setModalSubmitting(true);
    try {
      if (isEditing && selectedAdminId) {
        const updatePayload: { role?: string; status?: string; password?: string } = {};
        if (isSuperAdmin) {
          updatePayload.role = formRole;
          updatePayload.status = formStatus;
        }
        if (trimmedPass) {
          updatePayload.password = trimmedPass;
        }

        const res = await api.updateAdminUser(selectedAdminId, updatePayload);
        if (res.success) {
          toast.success(trimmedPass ? `Password updated successfully for '${trimmedUser}'.` : `User '${trimmedUser}' updated successfully.`);
          setModalVisible(false);
          await loadUsers(true);
        } else {
          setModalError(res.error || 'Failed to update user.');
        }
      } else {
        const res = await api.addAdminUser({
          username: trimmedUser,
          password: trimmedPass,
          role: formRole,
          status: formStatus,
        });
        if (res.success) {
          toast.success(`User '${trimmedUser}' created with role '${formRole}'.`);
          setModalVisible(false);
          await loadUsers(true);
        } else {
          setModalError(res.error || 'Failed to create user.');
        }
      }
    } catch (e: any) {
      setModalError(e.message || 'Unexpected submission error.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeletePress = (admin: AdminUser) => {
    if (admin.Username.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      toast.warning('You cannot delete your own active account.');
      return;
    }
    setAdminToDelete(admin);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteAdminLoginUser(adminToDelete.AdminId);
      if (res.success) {
        toast.success(`Account for '${adminToDelete.Username}' removed.`);
        setDeleteModalVisible(false);
        setAdminToDelete(null);
        await loadUsers(true);
      } else {
        toast.danger(res.error || 'Failed to delete account.');
      }
    } catch (e: any) {
      toast.danger(e.message || 'Error deleting account.');
    } finally {
      setDeleting(false);
    }
  };

  // Columns for Desktop DataTable
  const columns: Column<AdminUser>[] = [
    {
      title: 'Admin ID',
      key: 'AdminId',
      width: 110,
      render: (item) => (
        <Text style={styles.idText} numberOfLines={1}>{item.AdminId}</Text>
      ),
    },
    {
      title: 'Username',
      key: 'Username',
      width: 160,
      render: (item) => (
        <View style={styles.usernameCell}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{item.Username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.usernameText} numberOfLines={1}>{item.Username}</Text>
          {item.Username.toLowerCase() === (currentUser?.username || '').toLowerCase() ? (
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>You</Text>
            </View>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Assigned Role',
      key: 'Role',
      width: 140,
      render: (item) => {
        const isSuper = item.Role === 'SuperAdmin';
        return (
          <View style={[styles.roleCellBadge, isSuper ? styles.roleCellSuper : styles.roleCellUser]}>
            <Ionicons
              name={isSuper ? 'shield-checkmark' : 'eye'}
              size={12}
              color={isSuper ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fbbf24' : '#b45309')}
            />
            <Text style={[styles.roleCellText, isSuper ? styles.roleTextSuper : styles.roleTextUser]}>
              {item.Role}
            </Text>
          </View>
        );
      },
    },
    {
      title: 'Permission Level',
      key: 'Permissions',
      width: 180,
      render: (item) => {
        const isSuper = item.Role === 'SuperAdmin';
        return (
          <Text style={[styles.permText, isSuper ? styles.permSuper : styles.permUser]}>
            {isSuper ? 'Full Access (Read/Write/Delete)' : 'Read-Only (View Only)'}
          </Text>
        );
      },
    },
    {
      title: 'Account Status',
      key: 'Status',
      width: 110,
      render: (item) => (
        <Badge
          label={item.Status}
          variant={item.Status === 'Active' ? 'success' : 'default'}
          size="sm"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'Actions',
      width: 130,
      align: 'center',
      render: (item) => {
        const isSelf = item.Username.toLowerCase() === (currentUser?.username || '').toLowerCase();
        const canEdit = isSuperAdmin || isSelf;
        const canDelete = isSuperAdmin && !isSelf;

        if (!canEdit && !canDelete) {
          return <Text style={{ fontSize: 11, color: colors.textMuted }}>—</Text>;
        }

        return (
          <View style={styles.actionBtnRow}>
            {canEdit && (
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}
                onPress={() => openEditModal(item)}
                accessibilityLabel={isSelf ? "Change Password" : "Edit User"}
              >
                <Ionicons name="pencil" size={14} color={isDark ? '#60a5fa' : '#2563eb'} />
              </TouchableOpacity>
            )}

            {canDelete ? (
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2' }]}
                onPress={() => handleDeletePress(item)}
                accessibilityLabel="Delete Account"
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      },
    },
  ];

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* KPI Stat Cards */}
        <View style={styles.kpiRow}>
          <StatCard
            title={isDesktop ? "Total Admin Accounts" : "Total Admins"}
            value={totalCount}
            iconName="people"
            accentColor={isDark ? '#fbbf24' : colors.primaryDark}
          />
          <StatCard
            title={isDesktop ? "SuperAdmin (Full Access)" : "SuperAdmin"}
            value={superAdminCount}
            iconName="shield-checkmark"
            accentColor={colors.success}
          />
          <StatCard
            title={isDesktop ? "View-Only Users" : "View-Only"}
            value={userRoleCount}
            iconName="eye"
            accentColor={colors.primary}
          />
        </View>

        {/* Notice for staff users */}
        {!isSuperAdmin && (
          <View style={styles.readOnlyBanner}>
            <Ionicons name="information-circle-outline" size={18} color={isDark ? '#fbbf24' : '#b45309'} style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyBannerText}>
              Staff Directory: You are viewing staff accounts. You can edit and update your own account password by clicking the edit icon on your row. Adding new users or changing roles requires SuperAdmin privileges.
            </Text>
          </View>
        )}

        {/* User Accounts DataTable: Desktop Table / Mobile Cards */}
        <DataTable
          isLoading={loading}
          addButtonLabel={isSuperAdmin ? "Add User" : undefined}
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={adminUsers}
          keyExtractor={(item) => item.AdminId}
          searchPlaceholder="Search username, ID, role or status..."
          searchFilter={(item, q) => {
            const query = q.toLowerCase();
            return (
              item.Username.toLowerCase().includes(query) ||
              item.AdminId.toLowerCase().includes(query) ||
              item.Role.toLowerCase().includes(query) ||
              item.Status.toLowerCase().includes(query)
            );
          }}
          renderMobileCard={(item) => {
            const isSuper = item.Role === 'SuperAdmin';
            const isSelf = item.Username.toLowerCase() === (currentUser?.username || '').toLowerCase();
            const canEdit = isSuperAdmin || isSelf;

            return (
              <MobileCard
                onPress={canEdit ? () => openEditModal(item) : undefined}
                identifier={`#${item.AdminId}`}
                badges={
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Badge
                      label={item.Role}
                      variant={isSuper ? 'gold' : 'warning'}
                      size="sm"
                    />
                    <Badge
                      label={item.Status}
                      variant={item.Status === 'Active' ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                }
                avatar={
                  <View style={[styles.cardAvatarCircle, isSuper ? styles.cardAvatarSuper : styles.cardAvatarUser]}>
                    <Text style={[styles.cardAvatarText, isSuper ? styles.cardAvatarTextSuper : styles.cardAvatarTextUser]}>
                      {item.Username.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                }
                title={item.Username}
                subtitle={isSuper ? '👑 SuperAdmin (Full Access)' : '👁 Read-Only User'}
                metrics={[
                  {
                    label: 'Permissions',
                    value: isSuper ? 'Full System Access' : 'View Only (Read-Only)',
                    highlighted: true,
                    color: isSuper ? colors.success : colors.warning,
                  },
                  {
                    label: 'Status',
                    value: item.Status,
                  },
                  {
                    label: 'Account Type',
                    value: isSelf ? 'Current Active User' : 'Staff Login',
                  },
                ]}
                viewLabel={canEdit ? (isSelf && !isSuperAdmin ? "Change Password" : "Edit user") : undefined}
                onViewPress={canEdit ? () => openEditModal(item) : undefined}
                menuActions={canEdit ? [
                  {
                    label: isSelf && !isSuperAdmin ? 'Change Password' : 'Edit / Reset Password',
                    icon: 'pencil-outline' as const,
                    onPress: () => openEditModal(item),
                  },
                  ...(isSuperAdmin && !isSelf
                    ? [
                        {
                          label: 'Delete Account',
                          icon: 'trash-outline' as const,
                          isDestructive: true,
                          onPress: () => handleDeletePress(item),
                        },
                      ]
                    : []),
                ] : []}
              />
            );
          }}
        />
      </ScrollView>

      {/* ADD / EDIT USER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? (isSuperAdmin ? `Edit User (${formUsername})` : `Change Password (${formUsername})`) : 'Add New Admin / User'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {modalError ? (
                <View style={styles.modalErrorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              ) : null}

              {/* Username field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={[styles.input, isEditing && styles.inputDisabled]}
                  placeholder="Enter login username"
                  placeholderTextColor={colors.placeholder}
                  value={formUsername}
                  onChangeText={setFormUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isEditing && !modalSubmitting}
                />
                {isEditing ? (
                  <Text style={styles.helperText}>Username cannot be altered after creation.</Text>
                ) : null}
              </View>

              {/* Password field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {isEditing ? (isSuperAdmin ? 'New Password (Optional)' : 'New Password *') : 'Password *'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={isEditing ? (isSuperAdmin ? 'Leave blank to keep existing password' : 'Enter your new password') : 'Enter password'}
                  placeholderTextColor={colors.placeholder}
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!modalSubmitting}
                />
                {isEditing ? (
                  <Text style={styles.helperText}>
                    {isSuperAdmin ? 'Only enter a password if resetting it.' : 'Enter your new password and click Save to update.'}
                  </Text>
                ) : null}
              </View>

              {/* Role Selection (Visible/Editable for SuperAdmin, Read-only badge for regular user) */}
              {isSuperAdmin ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Role & Access Level *</Text>
                  <View style={styles.rolePickerRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleChoiceCard,
                        formRole === 'User' && styles.roleChoiceCardSelected,
                      ]}
                      onPress={() => setFormRole('User')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.choiceHeader}>
                        <Ionicons
                          name="eye"
                          size={18}
                          color={formRole === 'User' ? (isDark ? '#fbbf24' : '#b45309') : colors.textMuted}
                        />
                        <Text style={[styles.choiceTitle, formRole === 'User' && styles.choiceTitleSelected]}>
                          User
                        </Text>
                      </View>
                      <Text style={styles.choiceDesc}>
                        Read-only. Can inspect loans, customers & vault, but cannot create, edit, or delete records.
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleChoiceCard,
                        formRole === 'SuperAdmin' && styles.roleChoiceCardSelected,
                      ]}
                      onPress={() => setFormRole('SuperAdmin')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.choiceHeader}>
                        <Ionicons
                          name="shield-checkmark"
                          size={18}
                          color={formRole === 'SuperAdmin' ? (isDark ? '#34d399' : '#059669') : colors.textMuted}
                        />
                        <Text style={[styles.choiceTitle, formRole === 'SuperAdmin' && styles.choiceTitleSelected]}>
                          SuperAdmin
                        </Text>
                      </View>
                      <Text style={styles.choiceDesc}>
                        Full administrative access. Can perform all mutations, disbursements, loan settlements & manage users.
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Assigned Role</Text>
                  <View style={[styles.roleCellBadge, formRole === 'SuperAdmin' ? styles.roleCellSuper : styles.roleCellUser, { marginTop: 4 }]}>
                    <Ionicons
                      name={formRole === 'SuperAdmin' ? 'shield-checkmark' : 'eye'}
                      size={12}
                      color={formRole === 'SuperAdmin' ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fbbf24' : '#b45309')}
                    />
                    <Text style={[styles.roleCellText, formRole === 'SuperAdmin' ? styles.roleTextSuper : styles.roleTextUser]}>
                      {formRole} (Role changes must be made by a SuperAdmin)
                    </Text>
                  </View>
                </View>
              )}

              {/* Status Picker (Only SuperAdmin can change status) */}
              {isSuperAdmin ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Active', 'Inactive'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusToggleBtn, formStatus === s && styles.statusToggleBtnActive]}
                        onPress={() => setFormStatus(s)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.statusToggleText, formStatus === s && styles.statusToggleTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={modalSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, modalSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmitModal}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>{isEditing ? (isSuperAdmin ? 'Save Changes' : 'Update Password') : 'Create User'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Login User"
        message={`Are you sure you want to delete the login account for '${adminToDelete?.Username}'? They will no longer be able to log in.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Account'}
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: isDesktop ? 24 : 12,
      gap: isDesktop ? 16 : 10,
    },
    readOnlyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef08a',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 2,
    },
    readOnlyBannerText: {
      fontSize: 12.5,
      color: isDark ? '#fbbf24' : '#92400e',
      flex: 1,
      lineHeight: 17,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: isDesktop ? 12 : 8,
      width: '100%',
    },
    idText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    usernameCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarMini: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? '#b45309' : '#fef08a',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarMiniText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#fef3c7' : '#854d0e',
    },
    usernameText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    selfBadge: {
      backgroundColor: isDark ? '#064e3b' : '#dcfce7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    selfBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: isDark ? '#34d399' : '#15803d',
    },
    roleCellBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9999,
      gap: 4,
      alignSelf: 'flex-start',
    },
    roleCellSuper: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
      borderColor: isDark ? '#059669' : '#a7f3d0',
      borderWidth: 1,
    },
    roleCellUser: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fffbeb',
      borderColor: isDark ? '#d97706' : '#fde68a',
      borderWidth: 1,
    },
    roleCellText: {
      fontSize: 11,
      fontWeight: '700',
    },
    roleTextSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    roleTextUser: {
      color: isDark ? '#fbbf24' : '#b45309',
    },
    permText: {
      fontSize: 12,
      fontWeight: '500',
    },
    permSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    permUser: {
      color: isDark ? '#fbbf24' : '#b45309',
    },
    actionBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconActionBtn: {
      padding: 6,
      borderRadius: 8,
    },
    cardAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardAvatarSuper: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5',
      borderWidth: 1.5,
      borderColor: isDark ? '#059669' : '#10b981',
    },
    cardAvatarUser: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#fffbeb',
      borderWidth: 1.5,
      borderColor: isDark ? '#d97706' : '#f59e0b',
    },
    cardAvatarText: {
      fontSize: 13,
      fontWeight: '800',
    },
    cardAvatarTextSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    cardAvatarTextUser: {
      color: isDark ? '#fbbf24' : '#b45309',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    modalErrorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450a0a' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? '#991b1b' : '#fecaca',
      padding: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    modalErrorText: {
      fontSize: 12,
      color: '#dc2626',
      fontWeight: '600',
      flex: 1,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    inputDisabled: {
      opacity: 0.6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    },
    helperText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    rolePickerRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 10,
    },
    roleChoiceCard: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    roleChoiceCardSelected: {
      borderColor: isDark ? '#fbbf24' : colors.primaryDark,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
    },
    choiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    choiceTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    choiceTitleSelected: {
      color: isDark ? '#fbbf24' : colors.primaryDark,
    },
    choiceDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    statusToggleRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statusToggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    statusToggleBtnActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    statusToggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusToggleTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    submitBtn: {
      backgroundColor: isDark ? '#d97706' : colors.primaryDark,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 10,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
