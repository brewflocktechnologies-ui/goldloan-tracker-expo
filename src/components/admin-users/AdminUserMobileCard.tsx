import React from 'react';
import { View, Text } from 'react-native';
import { AdminUser } from '../../types';
import { MobileCard } from '../MobileCard';
import { Badge } from '../Badge';
import { ThemeColors } from '../../constants/theme';
import { AdminUsersStyles } from './adminUsersStyles';

interface AdminUserMobileCardOptions {
  styles: AdminUsersStyles;
  colors: ThemeColors;
  isSuperAdmin: boolean;
  currentUsername?: string;
  onEdit: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
}

export function renderAdminUserMobileCard(
  item: AdminUser,
  { styles, colors, isSuperAdmin, currentUsername, onEdit, onDelete }: AdminUserMobileCardOptions,
) {
    const isSuper = item.Role === 'SuperAdmin';
    const isSelf = item.Username.toLowerCase() === (currentUsername || '').toLowerCase();
    const canEdit = isSuperAdmin || isSelf;

    return (
      <MobileCard
        onPress={canEdit ? () => onEdit(item) : undefined}
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
        onViewPress={canEdit ? () => onEdit(item) : undefined}
        menuActions={canEdit ? [
          {
            label: isSelf && !isSuperAdmin ? 'Change Password' : 'Edit / Reset Password',
            icon: 'pencil-outline' as const,
            onPress: () => onEdit(item),
          },
          ...(isSuperAdmin && !isSelf
            ? [
                {
                  label: 'Delete Account',
                  icon: 'trash-outline' as const,
                  isDestructive: true,
                  onPress: () => onDelete(item),
                },
              ]
            : []),
        ] : []}
      />
    );
}
