import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as EdgeSafeAreaView } from 'react-native-safe-area-context';
import { BankAccount, Loan, User } from '../../types';
import { formatAmountLakh, formatLoanDate } from '../loans/loanUtils';
import { getBankAccountStyles } from './bankAccountsStyles';

interface BankAccountDetailModalProps {
  visible: boolean;
  styles: ReturnType<typeof getBankAccountStyles>;
  selectedAcc: BankAccount | null;
  users: User[];
  loans: Loan[];
  isSuperAdmin: boolean;
  isDetailMasked: boolean;
  setIsDetailMasked: (updater: (p: boolean) => boolean) => void;
  onClose: () => void;
  onEdit: (acc: BankAccount) => void;
  onPreviewImage: (url: string) => void;
  onNoPassbook: () => void;
}

export function BankAccountDetailModal({
  visible,
  styles,
  selectedAcc,
  users,
  loans,
  isSuperAdmin,
  isDetailMasked,
  setIsDetailMasked,
  onClose,
  onEdit,
  onPreviewImage,
  onNoPassbook,
}: BankAccountDetailModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose()}
    >
      <EdgeSafeAreaView style={styles.detailSafeArea} edges={['top', 'left', 'right']}>
        <View style={styles.detailContainer}>
          {/* Top Light Blue Banner */}
          <View style={styles.detailHeaderBanner}>
            <TouchableOpacity
              onPress={() => onClose()}
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
            const selectedCustomer = users.find(
              (u) => String(u.UserId) === String(selectedAcc.UserId)
            );
            const customerInitials =
              (selectedCustomer?.FullName || selectedAcc.AccountHolderName || '')
                .split(' ')
                .map((p) => p[0])
                .filter(Boolean)
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'BA';
            const accountLoans = loans.filter(
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
                      onPreviewImage(selectedAcc.PassbookImage);
                    } else {
                      onNoPassbook();
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
          {isSuperAdmin && (
            <View style={styles.detailBottomBar}>
              <TouchableOpacity
                style={styles.editAccountBtn}
                onPress={() => {
                  if (selectedAcc) {
                    onClose();
                    onEdit(selectedAcc);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={16} color="#0f172a" />
                <Text style={styles.editAccountBtnText}>Edit account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </EdgeSafeAreaView>
    </Modal>
  );
}
