import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { ThemeColors } from '../../constants/theme';
import { AdminUsersStyles } from './adminUsersStyles';

interface AdminUserFormModalProps {
  styles: AdminUsersStyles;
  colors: ThemeColors;
  isDark: boolean;
  isSuperAdmin: boolean;
  visible: boolean;
  isEditing: boolean;
  formUsername: string;
  setFormUsername: (v: string) => void;
  formPassword: string;
  setFormPassword: (v: string) => void;
  formRole: UserRole;
  setFormRole: (v: UserRole) => void;
  formStatus: 'Active' | 'Inactive';
  setFormStatus: (v: 'Active' | 'Inactive') => void;
  modalSubmitting: boolean;
  modalError: string | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function AdminUserFormModal({
  styles,
  colors,
  isDark,
  isSuperAdmin,
  visible,
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
  onClose,
  onSubmit,
}: AdminUserFormModalProps) {
  return (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEditing ? (isSuperAdmin ? `Edit User (${formUsername})` : `Change Password (${formUsername})`) : 'Add New Admin / User'}
          </Text>
          <TouchableOpacity onPress={() => onClose()} style={styles.modalCloseBtn}>
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
                      color={formRole === 'User' ? (isDark ? '#38bdf8' : '#0369a1') : colors.textMuted}
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
                  color={formRole === 'SuperAdmin' ? (isDark ? '#34d399' : '#059669') : (isDark ? '#38bdf8' : '#0369a1')}
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
            onPress={() => onClose()}
            disabled={modalSubmitting}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, modalSubmitting && styles.submitBtnDisabled]}
            onPress={onSubmit}
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
  );
}
