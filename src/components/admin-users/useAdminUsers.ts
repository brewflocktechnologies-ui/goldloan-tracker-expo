import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { cache } from '../../services/cache';
import { AdminUser, UserRole } from '../../types';

interface UseAdminUsersOptions {
  isSuperAdmin: boolean;
  currentUser: { username?: string } | null | undefined;
  toast: {
    success: (m: string) => void;
    danger: (m: string) => void;
    warning: (m: string) => void;
  };
}

export function useAdminUsers({ isSuperAdmin, currentUser, toast }: UseAdminUsersOptions) {
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

  return {
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
  };
}
