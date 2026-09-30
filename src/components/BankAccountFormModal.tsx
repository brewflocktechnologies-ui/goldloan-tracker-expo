import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAppStore } from '../services/store';
import { BankAccount } from '../types';
import { FilePayload, ImagePickerField } from './ImagePickerField';

const ACCENT = '#0284c7';

interface BankAccountFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Account being edited; omit to create a new one. */
  account?: BankAccount | null;
  /** When creating from a customer's page: the customer is fixed and the picker is hidden. */
  presetUserId?: string;
}

const emptyForm = (userId: string, holder: string) => ({
  UserId: userId,
  AccountHolderName: holder,
  AccountNumber: '',
  BankName: 'State Bank of India',
  BranchName: '',
  City: 'Bengaluru',
  IFSCCode: '',
  AccountType: 'Savings',
  UPI_ID: '',
  MaxLoanAmount: '500000',
  UtilizedLoanAmount: '0',
  PassbookImage: '',
  Status: 'Active' as 'Active' | 'Inactive',
});

export function BankAccountFormModal({ visible, onClose, account, presetUserId }: BankAccountFormModalProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();

  const isEditing = !!account;
  const presetUser = presetUserId
    ? store.users.find((u) => String(u.UserId) === String(presetUserId))
    : undefined;

  const [form, setForm] = useState(emptyForm('', ''));
  const [filesPayload, setFilesPayload] = useState<FilePayload[]>([]);

  // Re-initialise the form every time the modal opens
  useEffect(() => {
    if (!visible) return;
    setFilesPayload([]);
    if (account) {
      setForm({
        UserId: account.UserId || '',
        AccountHolderName: account.AccountHolderName || '',
        AccountNumber: account.AccountNumber || '',
        BankName: account.BankName || '',
        BranchName: account.BranchName || '',
        City: account.City || 'Bengaluru',
        IFSCCode: account.IFSCCode || '',
        AccountType: account.AccountType || 'Savings',
        UPI_ID: account.UPI_ID || '',
        MaxLoanAmount: String(account.MaxLoanAmount || 0),
        UtilizedLoanAmount: String(account.UtilizedLoanAmount || 0),
        PassbookImage: account.PassbookImage || '',
        Status: account.Status === 'Inactive' ? 'Inactive' : 'Active',
      });
    } else {
      const owner = presetUser || store.users[0];
      setForm(emptyForm(owner?.UserId || 'U001', owner?.FullName || ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, account, presetUserId]);

  const maxNum = parseFloat(form.MaxLoanAmount) || 0;
  const utilNum = parseFloat(form.UtilizedLoanAmount) || 0;
  const availableCalc = Math.max(0, maxNum - utilNum);

  const handleSave = () => {
    if (!form.AccountHolderName.trim()) {
      Alert.alert('Validation Error', 'Account Holder Name is required.');
      return;
    }
    if (!form.AccountNumber.trim()) {
      Alert.alert('Validation Error', 'Account Number is required.');
      return;
    }

    const payload = {
      ...form,
      MaxLoanAmount: maxNum,
      UtilizedLoanAmount: utilNum,
      files: filesPayload,
    };

    if (account) {
      store.updateBankAccount(account.BankAccountId, payload);
      toast.success(`Bank account "${form.BankName}" updated successfully`);
    } else {
      store.addBankAccount(payload);
      toast.success(`Bank account "${form.BankName}" added successfully`);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Borrower: fixed when opened from a customer, otherwise pick one */}
            <View style={styles.field}>
              <Text style={styles.label}>{presetUser ? 'Borrower' : 'Select Borrower *'}</Text>
              {presetUser ? (
                <View style={styles.presetBox}>
                  <Ionicons name="person-circle-outline" size={18} color={ACCENT} />
                  <Text style={styles.presetText} numberOfLines={1}>{presetUser.FullName}</Text>
                </View>
              ) : store.users.length === 0 ? (
                <View style={{ backgroundColor: colors.warningBg, padding: 10, borderRadius: 8, marginTop: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '500' }}>
                    ⚠️ No borrowers registered yet. Please add a customer in the Users tab first.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {store.users.map((u) => (
                    <TouchableOpacity
                      key={u.UserId}
                      style={[styles.userChip, form.UserId === u.UserId && styles.userChipActive]}
                      onPress={() => setForm((p) => ({ ...p, UserId: u.UserId, AccountHolderName: u.FullName }))}
                    >
                      <Text style={[styles.userChipText, form.UserId === u.UserId && styles.userChipTextActive]}>
                        {u.FullName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                value={form.AccountHolderName}
                onChangeText={(v) => setForm((p) => ({ ...p, AccountHolderName: v }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={colors.textMuted}
                  value={form.BankName}
                  onChangeText={(v) => setForm((p) => ({ ...p, BankName: v }))}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={form.AccountNumber}
                  onChangeText={(v) => setForm((p) => ({ ...p, AccountNumber: v }))}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Branch Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.BranchName}
                  onChangeText={(v) => setForm((p) => ({ ...p, BranchName: v }))}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>IFSC Code</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="characters"
                  value={form.IFSCCode}
                  onChangeText={(v) => setForm((p) => ({ ...p, IFSCCode: v }))}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={form.City}
                  onChangeText={(v) => setForm((p) => ({ ...p, City: v }))}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. name@okaxis"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={form.UPI_ID}
                  onChangeText={(v) => setForm((p) => ({ ...p, UPI_ID: v }))}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Account Type</Text>
                <View style={styles.toggleRow}>
                  {(['Savings', 'Current'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.toggleBtn, form.AccountType === t && styles.toggleBtnActive]}
                      onPress={() => setForm((p) => ({ ...p, AccountType: t }))}
                    >
                      <Text style={[styles.toggleBtnText, form.AccountType === t && styles.toggleBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.toggleRow}>
                  {(['Active', 'Inactive'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.toggleBtn, form.Status === s && styles.toggleBtnActive]}
                      onPress={() => setForm((p) => ({ ...p, Status: s }))}
                    >
                      <Text style={[styles.toggleBtnText, form.Status === s && styles.toggleBtnTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Limit Calculations */}
            <View style={styles.calcBox}>
              <Text style={styles.calcBoxTitle}>Loan Limit Calculations</Text>
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Max Loan Limit (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.MaxLoanAmount}
                    onChangeText={(v) => setForm((p) => ({ ...p, MaxLoanAmount: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Utilized Loan (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.UtilizedLoanAmount}
                    onChangeText={(v) => setForm((p) => ({ ...p, UtilizedLoanAmount: v }))}
                  />
                </View>
              </View>
              <View style={styles.calcResultRow}>
                <Text style={styles.calcResultLabel}>Calculated Available Loan Amount:</Text>
                <Text style={styles.calcResultVal}>₹{availableCalc.toLocaleString()}</Text>
              </View>
            </View>

            {/* Passbook / Cheque Leaf Image */}
            <ImagePickerField
              type="card"
              label="Passbook / Cheque Leaf Photo"
              helperText="Upload photo of bank passbook or cancelled cheque"
              value={form.PassbookImage}
              onChange={(url, files) => {
                setForm((p) => ({ ...p, PassbookImage: url }));
                setFilesPayload(files);
              }}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Add Bank'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: Platform.select({ web: '55%', default: '94%' }),
      maxWidth: 650,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    modalBody: { padding: 16 },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    field: { marginBottom: 12 },
    formRow: { flexDirection: 'row', gap: 10 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    input: {
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    presetBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      borderWidth: 1,
      borderColor: isDark ? '#0369a1' : '#bae6fd',
    },
    presetText: { flex: 1, fontSize: 13, fontWeight: '700', color: isDark ? '#7dd3fc' : '#075985' },
    userChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      marginRight: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    userChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    userChipTextActive: { color: '#ffffff' },
    toggleRow: { flexDirection: 'row', gap: 4 },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    toggleBtnActive: { backgroundColor: ACCENT },
    toggleBtnText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    toggleBtnTextActive: { color: '#ffffff' },
    calcBox: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff',
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#0c4a6e' : '#bae6fd',
      marginTop: 4,
      marginBottom: 12,
    },
    calcBoxTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#7dd3fc' : '#075985',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    calcResultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#0c4a6e' : '#bae6fd',
      paddingTop: 8,
      marginTop: 4,
    },
    calcResultLabel: { fontSize: 12, color: isDark ? '#7dd3fc' : '#075985', fontWeight: '600' },
    calcResultVal: { fontSize: 16, fontWeight: '800', color: colors.success },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    saveBtn: { backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
    saveBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  });
