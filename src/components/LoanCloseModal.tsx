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
import { Colors, ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAppStore } from '../services/store';
import { Loan } from '../types';

interface LoanCloseModalProps {
  visible: boolean;
  loan: Loan | null;
  onClose: () => void;
  /** Called after the loan has been closed and its ornaments released. */
  onClosed?: (loan: Loan) => void;
}

/** Popup to close a loan and release its pledged ornaments. */
export function LoanCloseModal({ visible, loan, onClose, onClosed }: LoanCloseModalProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (visible) setRemarks('');
  }, [visible]);

  const selectedOrnaments = loan?.ornamentIds
    ? store.ornaments.filter((o) => loan.ornamentIds?.includes(o.OrnamentId))
    : [];
  const selectedUser = loan ? store.users.find((u) => u.UserId === loan.UserId) : null;

  const handleConfirmClose = () => {
    if (!loan) return;
    store.closeAndReleaseLoan(loan.LoanId, remarks || 'Closed and ornaments released');
    onClose();
    Alert.alert(
      'Loan Closed Successfully',
      `Loan ${loan.LoanNumber} has been successfully marked as Closed. All pledged ornaments have been released back to Available status in the vault.`
    );
    toast.success(`Loan ${loan.LoanNumber} settled & ornaments released!`);
    onClosed?.(loan);
  };

  return (
    <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={() => onClose()}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="lock-closed" size={20} color={isDark ? '#fbbf24' : colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.modalTitle}>Close Loan & Release</Text>
              <Text style={styles.modalSubtitle}>{loan?.LoanNumber}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.modalCloseBtn}
            onPress={() => onClose()}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          {/* Customer & Loan Details Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Customer</Text>
              <Text style={styles.summaryValue}>{selectedUser?.FullName || 'Unknown'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mobile</Text>
              <Text style={styles.summaryValue}>{selectedUser?.MobileNumber || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Principal Amount</Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#fbbf24' : colors.primaryDark, fontWeight: '700' }]}>
                ₹{loan?.LoanAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bank Account</Text>
              <Text style={styles.summaryValue}>{loan?.BankName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Loan Date</Text>
              <Text style={styles.summaryValue}>
                {loan?.LoanDate ? new Date(loan.LoanDate).toLocaleDateString('en-GB') : '-'}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Due Date</Text>
              <Text style={styles.summaryValue}>
                {loan?.DueDate ? new Date(loan.DueDate).toLocaleDateString('en-GB') : '-'}
              </Text>
            </View>
          </View>

          {/* Ornaments to be released */}
          <Text style={styles.sectionHeading}>
            Ornaments to Release ({selectedOrnaments.length})
          </Text>
          {selectedOrnaments.length > 0 ? (
            <View style={styles.ornamentList}>
              {selectedOrnaments.map((orn) => (
                <View key={orn.OrnamentId} style={styles.ornamentItem}>
                  <View style={styles.ornamentItemLeft}>
                    <Text style={styles.ornamentItemIcon}>💍</Text>
                    <View>
                      <Text style={styles.ornamentItemName}>{orn.OrnamentName}</Text>
                      <Text style={styles.ornamentItemDetail}>
                        {orn.Purity} • Gross: {orn.GrossWeight}g • Net: {orn.NetWeight}g
                      </Text>
                    </View>
                  </View>
                  <View style={styles.releaseTag}>
                    <Ionicons name="arrow-undo-outline" size={12} color="#16a34a" />
                    <Text style={styles.releaseTagText}>To Available</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noOrnamentsText}>No individual ornaments linked</Text>
          )}

          {/* Closure Remarks */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Closure Remarks / Settlement Notes
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder={`Enter remarks for ${selectedUser?.FullName || 'customer'}'s loan closure...`}
              placeholderTextColor={colors.placeholder}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Modal Footer Actions */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => onClose()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.confirmReleaseBtn}
            onPress={handleConfirmClose}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.confirmReleaseBtnText}>Close & Release</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 18,
    width: Platform.select({ web: '55%', default: '94%' }),
    maxWidth: 650,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: isDark ? colors.surface : '#fafafa',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: isDark ? '#271d07' : Colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: isDark ? '#fbbf24' : colors.primaryDark,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: isDark ? colors.surface : '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  ornamentList: {
    backgroundColor: isDark ? colors.surface : '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ornamentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ornamentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ornamentItemIcon: {
    fontSize: 18,
  },
  ornamentItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ornamentItemDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  releaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? '#052e16' : '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  releaseTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#4ade80' : '#15803d',
  },
  noOrnamentsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 70,
    backgroundColor: isDark ? colors.surfaceSubtle : '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: isDark ? colors.surface : '#fafafa',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: isDark ? colors.surface : '#fff',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmReleaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmReleaseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
