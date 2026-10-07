import React from 'react';
import { View, Text, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { AdminUser } from '../../types';
import { DataTable } from '../../components/DataTable';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatCard } from '../../components/StatCard';
import { getStyles } from '../../components/admin-users/adminUsersStyles';
import { useAdminUsers } from '../../components/admin-users/useAdminUsers';
import { buildAdminUserColumns } from '../../components/admin-users/adminUserColumns';
import { renderAdminUserMobileCard } from '../../components/admin-users/AdminUserMobileCard';
import { AdminUserFormModal } from '../../components/admin-users/AdminUserFormModal';

export default function AdminUsersTabScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = getStyles(colors, isDark, isDesktop);

  const { isSuperAdmin, user: currentUser } = useAuth();
  const toast = useToast();

  const {
    loading,
    refreshing,
    adminUsers,
    modalVisible,
    setModalVisible,
    isEditing,
    formUsername,
    setFormUsername,
    formPassword,
    setFormPassword,
    formRole,
    setFormRole,
    formStatus,
    setFormStatus,
    modalSubmitting,
    modalError,
    deleteModalVisible,
    setDeleteModalVisible,
    adminToDelete,
    deleting,
    onRefresh,
    totalCount,
    superAdminCount,
    userRoleCount,
    openAddModal,
    openEditModal,
    handleSubmitModal,
    handleDeletePress,
    handleConfirmDelete,
  } = useAdminUsers({ isSuperAdmin, currentUser, toast });

  const columnOptions = {
    styles,
    colors,
    isDark,
    isSuperAdmin,
    currentUsername: currentUser?.username,
    onEdit: openEditModal,
    onDelete: handleDeletePress,
  };
  const columns = buildAdminUserColumns(columnOptions);

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
            accentColor={isDark ? '#38bdf8' : colors.primaryDark}
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
            <Ionicons name="information-circle-outline" size={18} color={isDark ? '#38bdf8' : '#0369a1'} style={{ marginRight: 8 }} />
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
          renderMobileCard={(item) => renderAdminUserMobileCard(item, columnOptions)}
        />
      </ScrollView>

      {/* ADD / EDIT USER MODAL */}
      <AdminUserFormModal
        styles={styles}
        colors={colors}
        isDark={isDark}
        isSuperAdmin={isSuperAdmin}
        visible={modalVisible}
        isEditing={isEditing}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formRole={formRole}
        setFormRole={setFormRole}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        modalSubmitting={modalSubmitting}
        modalError={modalError}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitModal}
      />

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
