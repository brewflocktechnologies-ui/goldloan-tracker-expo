import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminUser } from '../../types';
import { Column } from '../DataTable';
import { Badge } from '../Badge';
import { ThemeColors } from '../../constants/theme';
import { AdminUsersStyles } from './adminUsersStyles';

interface AdminUserColumnsOptions {
  styles: AdminUsersStyles;
  colors: ThemeColors;
  isDark: boolean;
  isSuperAdmin: boolean;
  currentUsername?: string;
  onEdit: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
}

export function buildAdminUserColumns({
  styles,
  colors,
  isDark,
  isSuperAdmin,
  currentUsername,
  onEdit,
  onDelete,
}: AdminUserColumnsOptions): Column<AdminUser>[] {
  return [
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
        {item.Username.toLowerCase() === (currentUsername || '').toLowerCase() ? (
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
            color={isSuper ? (isDark ? '#34d399' : '#059669') : (isDark ? '#38bdf8' : '#0369a1')}
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
      const isSelf = item.Username.toLowerCase() === (currentUsername || '').toLowerCase();
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
              onPress={() => onEdit(item)}
              accessibilityLabel={isSelf ? "Change Password" : "Edit User"}
            >
              <Ionicons name="pencil" size={14} color={isDark ? '#60a5fa' : '#2563eb'} />
            </TouchableOpacity>
          )}

          {canDelete ? (
            <TouchableOpacity
              style={[styles.iconActionBtn, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2' }]}
              onPress={() => onDelete(item)}
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
}
