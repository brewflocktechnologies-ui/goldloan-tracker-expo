import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView as EdgeSafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Column, DataTable } from '../../components/DataTable';
import { ImageViewModal } from '../../components/ImageViewModal';
import { formatAmountLakh, formatLoanDate } from '../../components/loans/loanUtils';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { BankAccount } from '../../types';


export default function BankAccountsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const router = useRouter();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<BankAccount | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDetailMasked, setIsDetailMasked] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  const openAddModal = () => {
    router.push('/bank-accounts/form' as any);
  };

  const openEditModal = (acc: BankAccount) => {
    router.push({ pathname: '/bank-accounts/form', params: { accountId: acc.BankAccountId } } as any);
  };

  const openDetailModal = (acc: BankAccount) => {
    setSelectedAcc(acc);
    setIsDetailMasked(true);
    setDetailModalVisible(true);
  };

  const handleDelete = (acc: BankAccount) => {
    setAccountToDelete(acc);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!accountToDelete) return;
    const name = accountToDelete.BankName;
    store.deleteBankAccount(accountToDelete.BankAccountId);
    setDeleteModalVisible(false);
    setAccountToDelete(null);
    toast.danger(`Bank account "${name}" deleted successfully`);
  };

  // Table Columns exactly matching bankAccountsTable in index.html:
  // ID | Holder Name | Account No. | Bank | City | Max Loan (₹) | Utilized (₹) | Available (₹) | Status | Actions
  const columns: Column<BankAccount>[] = [
    {
      key: 'BankAccountId',
      title: 'ID',
      width: 65,
      render: (b) => <Text style={styles.idText}>#{b.BankAccountId}</Text>,
    },
    {
      key: 'AccountHolderName',
      title: 'Holder Name',
      width: 140,
      render: (b) => <Text style={styles.primaryCellText} numberOfLines={1}>{b.AccountHolderName}</Text>,
    },
    {
      key: 'AccountNumber',
      title: 'Account No.',
      width: 130,
      render: (b) => <Text style={styles.cellText} numberOfLines={1}>{b.AccountNumber}</Text>,
    },
    {
      key: 'BankName',
      title: 'Bank',
      width: 140,
      render: (b) => {
        const directUrl = getDriveImageUrl(b.PassbookImage);
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {b.PassbookImage ? (
              <TouchableOpacity onPress={() => b.PassbookImage && setPreviewImageUrl(b.PassbookImage)}>
                <Image source={{ uri: directUrl || b.PassbookImage }} style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} contentFit="cover" />
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.cellText, { fontWeight: '600', flex: 1 }]} numberOfLines={1}>{b.BankName}</Text>
          </View>
        );
      },
    },
    {
      key: 'City',
      title: 'City',
      width: 90,
      render: (b) => <Text style={styles.cellText} numberOfLines={1}>{b.City || '—'}</Text>,
    },
    {
      key: 'MaxLoanAmount',
      title: 'Max Limit (₹)',
      width: 115,
      align: 'right',
      render: (b) => <Text style={styles.cellText}>₹{(b.MaxLoanAmount || 0).toLocaleString()}</Text>,
    },
    {
      key: 'UtilizedLoanAmount',
      title: 'Utilized (₹)',
      width: 115,
      align: 'right',
      render: (b) => (
        <Text style={[styles.cellText, { color: (b.UtilizedLoanAmount || 0) > 0 ? colors.danger : colors.textSecondary }]}>
          ₹{(b.UtilizedLoanAmount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: 'AvailableLoanAmount',
      title: 'Available (₹)',
      width: 115,
      align: 'right',
      render: (b) => (
        <Text style={[styles.cellText, { fontWeight: '700', color: colors.success }]}>
          ₹{(b.AvailableLoanAmount || Math.max(0, (b.MaxLoanAmount || 0) - (b.UtilizedLoanAmount || 0))).toLocaleString()}
        </Text>
      ),
    },
    {
      key: 'Status',
      title: 'Status',
      width: 85,
      align: 'center',
      render: (b) => (
        <Badge 
          label={b.Status} 
          variant={b.Status === 'Active' ? 'success' : 'default'} 
          size="sm" 
        />
      ),
    },
    {
      key: 'Actions',
      title: 'Actions',
      width: 95,
      align: 'center',
      render: (b) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openDetailModal(b)} style={styles.actionBtn} accessibilityLabel="View Details">
            <Ionicons name="eye-outline" size={16} color="#0284c7" />
          </TouchableOpacity>
          {isSuperAdmin && (
            <>
              <TouchableOpacity onPress={() => openEditModal(b)} style={styles.actionBtn} accessibilityLabel="Edit">
                <Ionicons name="pencil-outline" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(b)} style={styles.actionBtn} accessibilityLabel="Delete">
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    },
  ];

  const activeCount = store.bankAccounts.filter(b => b.Status === 'Active').length;
  const inactiveCount = store.bankAccounts.filter(b => b.Status === 'Inactive').length;
  const bankFilterChips = [
    { label: 'All', value: 'All', count: store.bankAccounts.length },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Inactive', value: 'Inactive', count: inactiveCount },
  ];

  const customFilterPredicate = (b: BankAccount, filterVal: string) => {
    if (filterVal === 'All') return true;
    return b.Status === filterVal;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <DataTable
          forceTableView={true}
          isLoading={store.isSyncing && store.bankAccounts.length === 0}
          addButtonLabel="Add Account"
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={store.bankAccounts}
          keyExtractor={(b) => b.BankAccountId}
          filterChips={bankFilterChips}
          customFilterPredicate={customFilterPredicate}
          searchPlaceholder="Search bank, account, holder, city, status..."
          searchFilter={(b, q) => {
            const normQuery = (q || '').trim().toLowerCase();
            if (!normQuery) return true;
            const holder = (b.AccountHolderName || '').toLowerCase();
            const accNo = (b.AccountNumber || '').toLowerCase();
            const bank = (b.BankName || '').toLowerCase();
            const branch = (b.BranchName || '').toLowerCase();
            const city = (b.City || '').toLowerCase();
            const ifsc = (b.IFSCCode || '').toLowerCase();
            const id = (b.BankAccountId || '').toLowerCase();
            const status = (b.Status || '').toLowerCase();
            const upi = (b.UPI_ID || '').toLowerCase();
            const lastFour = accNo.length >= 4 ? accNo.slice(-4) : '';

            return (
              holder.includes(normQuery) ||
              accNo.includes(normQuery) ||
              lastFour.includes(normQuery) ||
              bank.includes(normQuery) ||
              branch.includes(normQuery) ||
              city.includes(normQuery) ||
              ifsc.includes(normQuery) ||
              id.includes(normQuery) ||
              status.includes(normQuery) ||
              upi.includes(normQuery)
            );
          }}
        />
      </ScrollView>

      {/* DETAIL MODAL (Matching Image 5) */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <EdgeSafeAreaView style={styles.detailSafeArea} edges={['top', 'left', 'right']}>
          <View style={styles.detailContainer}>
            {/* Top Light Blue Banner */}
            <View style={styles.detailHeaderBanner}>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.detailBackBtn}
                accessibilityLabel="Back"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>
              <View style={styles.detailHeaderTitleCol}>
                <Text style={styles.detailHeaderTitle}>Bank account</Text>
                <Text style={styles.detailHeaderSubtitle}>Details of bank account</Text>
              </View>
            </View>

            {selectedAcc && (() => {
              const selectedCustomer = store.users.find(
                (u) => String(u.UserId) === String(selectedAcc.UserId)
              );
              const customerInitials = (selectedCustomer?.FullName || selectedAcc.AccountHolderName || 'BA')
                .split(' ')
                .map((p) => p[0])
                .filter(Boolean)
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const accountLoans = store.loans.filter(
                (l) =>
                  (String(l.BankAccountId) === String(selectedAcc.BankAccountId) ||
                    String(l.UserId) === String(selectedAcc.UserId)) &&
                  l.LoanStatus !== 'Closed'
              );
              const maxLimit = selectedAcc.MaxLoanAmount || 0;
              const utilLimit = selectedAcc.UtilizedLoanAmount || 0;
              const availLimit =
                selectedAcc.AvailableLoanAmount !== undefined
                  ? selectedAcc.AvailableLoanAmount
                  : Math.max(0, maxLimit - utilLimit);
              const utilPercent =
                maxLimit > 0 ? Math.min(100, Math.round((utilLimit / maxLimit) * 100)) : 0;
              const cleanAccNo = String(selectedAcc.AccountNumber || '').replace(/\s+/g, '');
              const maskedAccDisplay = cleanAccNo.length > 4 ? `•••• ${cleanAccNo.slice(-4)}` : cleanAccNo;

              return (
                <ScrollView
                  style={styles.detailScroll}
                  contentContainerStyle={styles.detailScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Card 1: Bank Overview */}
                  <View style={styles.overviewCard}>
                    <View style={styles.overviewTopRow}>
                      <View style={styles.bankIconSquare}>
                        <MaterialCommunityIcons name="bank" size={24} color="#0284c7" />
                      </View>
                      <View style={styles.bankNameCol}>
                        <Text style={styles.detailBankNameText} numberOfLines={1}>
                          {selectedAcc.BankName}
                        </Text>
                        <Text style={styles.detailAccountTypeText}>
                          {selectedAcc.AccountType || 'Savings'} account
                        </Text>
                      </View>
                      <View style={styles.activeBadgePill}>
                        <Ionicons name="checkmark-circle-outline" size={13} color="#16a34a" />
                        <Text style={styles.activeBadgeText}>{selectedAcc.Status || 'Active'}</Text>
                      </View>
                    </View>

                    <Text style={styles.accNumberLabel}>Account number</Text>
                    <View style={styles.accNumberRow}>
                      <Text style={styles.accNumberVal}>
                        {isDetailMasked ? maskedAccDisplay : selectedAcc.AccountNumber}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setIsDetailMasked((p) => !p)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Toggle mask"
                      >
                        <Ionicons
                          name={isDetailMasked ? 'eye-outline' : 'eye-off-outline'}
                          size={18}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.overviewDivider} />

                    <View style={styles.holderRow}>
                      <View style={styles.holderAvatar}>
                        <Text style={styles.holderAvatarText}>{customerInitials}</Text>
                      </View>
                      <View style={styles.holderInfoCol}>
                        <Text style={styles.holderNameText} numberOfLines={1}>
                          {selectedCustomer?.FullName || selectedAcc.AccountHolderName}
                        </Text>
                        <Text style={styles.holderSubText} numberOfLines={1}>
                          Holder: {selectedAcc.AccountHolderName}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                    </View>
                  </View>

                  {/* Card 2: Loan Limit */}
                  <View style={styles.loanLimitCard}>
                    <View style={styles.loanLimitHeaderRow}>
                      <Text style={styles.loanLimitTitle}>Loan limit</Text>
                      <Text style={styles.loanLimitPercent}>{utilPercent}% used</Text>
                    </View>
                    <View style={styles.limitTrack}>
                      <View style={[styles.limitFill, { width: `${utilPercent}%` }]} />
                    </View>
                    <View style={styles.limitMetricsRow}>
                      <View style={styles.limitMetricCol}>
                        <Text style={styles.limitMetricLabel}>Maximum</Text>
                        <Text style={styles.limitMetricVal}>
                          ₹{maxLimit.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.limitMetricCol}>
                        <Text style={styles.limitMetricLabel}>Utilized</Text>
                        <Text style={styles.limitMetricVal}>
                          ₹{utilLimit.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.limitMetricCol}>
                        <Text style={styles.limitMetricLabel}>Available</Text>
                        <Text style={[styles.limitMetricVal, { color: '#10b981' }]}>
                          ₹{availLimit.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.limitHelperText}>
                      Utilized is the sum of active loans on this account.
                    </Text>
                  </View>

                  {/* Card 3: Bank Details */}
                  <Text style={styles.sectionHeaderTitle}>Bank details</Text>
                  <View style={styles.detailsCard}>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.tableKeyText}>Bank</Text>
                      <Text style={styles.tableValText}>{selectedAcc.BankName}</Text>
                    </View>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.tableKeyText}>Branch</Text>
                      <Text style={styles.tableValText}>{selectedAcc.BranchName || '—'}</Text>
                    </View>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.tableKeyText}>City</Text>
                      <Text style={styles.tableValText}>{selectedAcc.City || '—'}</Text>
                    </View>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.tableKeyText}>IFSC</Text>
                      <Text style={styles.tableValText}>{selectedAcc.IFSCCode || '—'}</Text>
                    </View>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.tableKeyText}>Account type</Text>
                      <Text style={styles.tableValText}>{selectedAcc.AccountType || 'Savings'}</Text>
                    </View>
                    <View style={[styles.detailTableRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.tableKeyText}>UPI ID</Text>
                      <Text style={styles.tableValText}>{selectedAcc.UPI_ID || '—'}</Text>
                    </View>
                  </View>

                  {/* Card 4: Documents */}
                  <Text style={styles.sectionHeaderTitle}>Documents</Text>
                  <TouchableOpacity
                    style={styles.documentCard}
                    onPress={() => {
                      if (selectedAcc.PassbookImage) {
                        setPreviewImageUrl(selectedAcc.PassbookImage);
                      } else {
                        toast.info('No passbook image uploaded for this account');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.docIconSquare}>
                      <Ionicons name="book-outline" size={20} color="#64748b" />
                    </View>
                    <View style={styles.docTextCol}>
                      <Text style={styles.docTitleText}>Passbook image</Text>
                      <Text style={styles.docSubText}>
                        {selectedAcc.PassbookImage ? 'Tap to view' : 'Not uploaded'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                  </TouchableOpacity>

                  {/* Card 5: Active Loans */}
                  <Text style={styles.sectionHeaderTitle}>Active loans on this account</Text>
                  {accountLoans.length === 0 ? (
                    <View style={styles.noLoansCard}>
                      <Text style={styles.noLoansText}>No active loans on this account</Text>
                    </View>
                  ) : (
                    accountLoans.map((loan) => (
                      <View key={loan.LoanId} style={styles.loanItemCard}>
                        <View style={styles.loanItemTopRow}>
                          <Text style={styles.loanItemNumber}>{loan.LoanNumber}</Text>
                          <View style={styles.activeBadgePill}>
                            <Text style={styles.activeBadgeText}>{loan.LoanStatus}</Text>
                          </View>
                        </View>
                        <Text style={styles.loanItemSubText}>
                          {formatAmountLakh(loan.LoanAmount)} · due {formatLoanDate(loan.DueDate)}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              );
            })()}

            {/* Sticky Bottom Bar with Edit Account Button */}
            <View style={styles.detailBottomBar}>
              <TouchableOpacity
                style={styles.editAccountBtn}
                onPress={() => {
                  if (selectedAcc) {
                    setDetailModalVisible(false);
                    openEditModal(selectedAcc);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={16} color="#0f172a" />
                <Text style={styles.editAccountBtnText}>Edit account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </EdgeSafeAreaView>
      </Modal>

      {/* FULL-SCREEN IMAGE PREVIEW */}
      <ImageViewModal
        visible={!!previewImageUrl}
        imageUrl={previewImageUrl}
        title="Passbook / Cheque Leaf Image"
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Bank Account"
        message={`Are you sure you want to delete account "${accountToDelete?.BankName}" (${accountToDelete?.AccountNumber})? This action cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setAccountToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 12,
    paddingBottom: 20,
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  primaryCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cellText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  field: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
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
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  userChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  userChipTextActive: {
    color: '#ffffff',
  },
  calcBox: {
    backgroundColor: isDark ? '#261a02' : '#fefce8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginTop: 4,
  },
  calcBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#854d0e',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  statusBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: '#ffffff',
  },
  detailSafeArea: {
    flex: 1,
    backgroundColor: isDark ? '#0c2238' : '#ddf4fe',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#ffffff',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  detailHeaderBanner: {
    backgroundColor: isDark ? '#0c2238' : '#ddf4fe',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  detailHeaderTitleCol: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
    letterSpacing: -0.2,
  },
  detailHeaderSubtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  detailScroll: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#ffffff',
  },
  detailScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  overviewCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 16,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankNameCol: {
    flex: 1,
  },
  detailBankNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  detailAccountTypeText: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  accNumberLabel: {
    fontSize: 11.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 14,
  },
  accNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  accNumberVal: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
    letterSpacing: 1,
  },
  eyeBtn: {
    padding: 4,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    marginVertical: 14,
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holderAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  holderInfoCol: {
    flex: 1,
  },
  holderNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  holderSubText: {
    fontSize: 11.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 1,
  },
  loanLimitCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 16,
    marginTop: 14,
  },
  loanLimitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanLimitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  loanLimitPercent: {
    fontSize: 11.5,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  limitTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
    marginVertical: 10,
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 3,
  },
  limitMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limitMetricCol: {
    flex: 1,
  },
  limitMetricLabel: {
    fontSize: 10.5,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  limitMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
    marginTop: 2,
  },
  limitHelperText: {
    fontSize: 10.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#cbd5e1' : '#0f172a',
    marginTop: 18,
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  detailTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  tableKeyText: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  tableValText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  documentCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextCol: {
    flex: 1,
  },
  docTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  docSubText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  noLoansCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 14,
  },
  noLoansText: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center',
  },
  loanItemCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 14,
    marginBottom: 8,
  },
  loanItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanItemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  loanItemSubText: {
    fontSize: 11.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 4,
  },
  detailBottomBar: {
    backgroundColor: isDark ? '#090d16' : '#ffffff',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editAccountBtn: {
    borderWidth: 1,
    borderColor: isDark ? '#f8fafc' : '#0f172a',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editAccountBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
});
