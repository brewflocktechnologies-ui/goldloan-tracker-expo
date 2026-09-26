import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BankCard } from '../BankCard';
import { ConfirmModal } from '../ConfirmModal';
import { LoanCard } from '../LoanCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ExtraUserBankAccount,
  ExtraUserLoan,
  formatMaskedAadhaar,
  formatMaskedPAN,
  formatPhoneNumber,
} from '../../mock/userMockExtras';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { User } from '../../types';
import {
  calculateAge,
  calculateAvailableLimit,
  calculateDueBadge,
  calculateOutstandingAmount,
  calculateUtilizationPercentage,
  formatDisplayDOB,
} from '../../utils/calculations';
import { getAvatarColor, getInitials } from './userAvatar';
import { UserOptionsMenu, UserOptionsMenuHandle } from './UserOptionsMenu';
import { UserStatusBadge } from './UserStatusBadge';
import { useContactActions } from './useContactActions';
import { useUsersStyles } from './usersStyles';

export type UserDetailsTab = 'Profile' | 'Bank Accounts' | 'Loans';

interface UserDetailsViewProps {
  selectedUser: User;
  activeTab: UserDetailsTab;
  setActiveTab: Dispatch<SetStateAction<UserDetailsTab>>;
  showAadhaar: boolean;
  setShowAadhaar: Dispatch<SetStateAction<boolean>>;
  showPAN: boolean;
  setShowPAN: Dispatch<SetStateAction<boolean>>;
  optionsMenuRef: RefObject<UserOptionsMenuHandle | null>;
  deleteModalVisible: boolean;
  setDeleteModalVisible: Dispatch<SetStateAction<boolean>>;
  onBack: () => void;
  onEdit: (user: User) => void;
}

export function UserDetailsView({
  selectedUser,
  activeTab,
  setActiveTab,
  showAadhaar,
  setShowAadhaar,
  showPAN,
  setShowPAN,
  optionsMenuRef,
  deleteModalVisible,
  setDeleteModalVisible,
  onBack,
  onEdit,
}: UserDetailsViewProps) {
  const router = useRouter();
  const { styles, colors, isDark } = useUsersStyles();
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();
  const { handleCallCustomer, handleWhatsAppCustomer, handleCopyCode } = useContactActions();

  const directPhoto = selectedUser.CustomerPhoto ? getDriveImageUrl(selectedUser.CustomerPhoto) : '';
  const avatarTone = getAvatarColor(selectedUser.FullName);
  const initials = getInitials(selectedUser.FullName);

  // Bank accounts for this user — real data only; blank fields show '—', not a fake value.
  const userBanks = store.bankAccounts.filter(b => b.UserId === selectedUser.UserId);
  const displayBanks: ExtraUserBankAccount[] = userBanks.map(b => ({
    BankAccountId: b.BankAccountId,
    UserId: b.UserId,
    BankName: b.BankName || '—',
    AccountType: b.AccountType || '—',
    BranchName: b.BranchName || '—',
    City: b.City || '',
    PassbookImage: b.PassbookImage || '',
    AccountNumber: b.AccountNumber || '—',
    IFSCCode: b.IFSCCode || '—',
    AccountHolderName: b.AccountHolderName || selectedUser.FullName,
    UPI_ID: b.UPI_ID || '—',
    Status: b.Status === 'Inactive' ? 'Inactive' : 'Active',
    MaxLoanAmount: b.MaxLoanAmount || 0,
    UtilizedLoanAmount: b.UtilizedLoanAmount || 0,
    AvailableLoanAmount: calculateAvailableLimit(b),
    UtilizationPercentage: calculateUtilizationPercentage(b),
  }));

  // Loans for this user — real data only. DueBadgeText is computed for real from the
  // real DueDate column (was previously a hardcoded "12 days left" / "18 days overdue").
  // OutstandingAmount has no backing sheet field or payments-based calc anywhere in the
  // app yet, so it's the one value still derived rather than real — flagged "(mock)" in the UI.
  const userLoans = store.loans.filter(l => l.UserId === selectedUser.UserId);
  const displayLoans: ExtraUserLoan[] = userLoans.map(l => {
    const loanOrns = store.ornaments.filter(o => (l.ornamentIds || []).includes(o.OrnamentId));
    let firstPhoto = loanOrns.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
    if (!firstPhoto && store.ornaments.length > 0) {
      firstPhoto = store.ornaments.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
    }
    const ornCount = (l.ornamentIds || []).length || loanOrns.length;
    const isOverdue = l.LoanStatus === 'Overdue';
    const dueBadge = calculateDueBadge(l.DueDate, l.LoanStatus);
    const totalWeight = (l.NetWeight || l.GrossWeight) || loanOrns.reduce((sum, o) => sum + (o.NetWeight || o.GrossWeight || 0), 0);

    return {
      LoanId: l.LoanId,
      LoanNumber: l.LoanNumber || `LN-${l.LoanId}`,
      LoanDate: l.LoanDate || '—',
      DueDate: l.DueDate || '—',
      Status: isOverdue ? 'Overdue' : (l.LoanStatus === 'Closed' ? 'Closed' : 'Active'),
      LoanAmount: l.LoanAmount || 0,
      OutstandingAmount: calculateOutstandingAmount(l),
      DueBadgeText: dueBadge.text,
      DueBadgeType: dueBadge.type,
      OrnamentsCount: ornCount,
      TotalWeightGrams: totalWeight,
      InterestRateText: `${l.InterestRate || 0}% p.a.`,
      InterestType: l.InterestType || 'Simple',
      OrnamentImageUri: firstPhoto,
    };
  });

  return (
    <View style={styles.subScreenContainer}>
      {/* Header matching PDF */}
      <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBackBtn}
          accessibilityLabel="Go back to customer list"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Customer Details</Text>
          <Text style={styles.headerSubtitle}>View and manage customer information</Text>
        </View>
        <UserOptionsMenu
          ref={optionsMenuRef}
          isDark={isDark}
          textPrimaryColor={colors.textPrimary}
          isSuperAdmin={isSuperAdmin}
          onEdit={() => onEdit(selectedUser)}
          onDelete={() => setDeleteModalVisible(true)}
          onCopyId={() => handleCopyCode(selectedUser.CustomerCode || selectedUser.UserId)}
          onCall={() => handleCallCustomer(selectedUser.MobileNumber)}
          onWhatsApp={() => handleWhatsAppCustomer(selectedUser.MobileNumber)}
        />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.detailScrollContent}>
        {/* Hero Card matching reference design */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroAvatarWrapper}>
              {directPhoto || selectedUser.CustomerPhoto ? (
                <Image
                  source={{ uri: directPhoto || selectedUser.CustomerPhoto }}
                  style={styles.heroAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.heroAvatarInitialsBox, { backgroundColor: avatarTone.bg }]}>
                  <Text style={[styles.heroAvatarInitialsText, { color: avatarTone.text }]}>{initials}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.heroCameraBadge}
                onPress={() => onEdit(selectedUser)}
                activeOpacity={0.85}
                accessibilityLabel="Change customer photo"
              >
                <Ionicons name="camera" size={13} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.heroInfoCol}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName} numberOfLines={1}>{selectedUser.FullName}</Text>
                <UserStatusBadge status={selectedUser.Status} isDark={isDark} variant="badge" />
              </View>

              <Text style={styles.heroCodeText}>
                {selectedUser.CustomerCode || selectedUser.UserId}
              </Text>

              <View style={styles.heroDetailRow}>
                <Ionicons
                  name="call-outline"
                  size={14}
                  color={isDark ? '#94a3b8' : '#64748b'}
                  style={styles.heroDetailIcon}
                />
                <Text style={styles.heroDetailText} numberOfLines={1}>
                  {formatPhoneNumber(selectedUser.MobileNumber)}
                </Text>
              </View>

              <View style={styles.heroDetailRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={isDark ? '#94a3b8' : '#64748b'}
                  style={styles.heroDetailIcon}
                />
                <Text style={styles.heroDetailText} numberOfLines={1}>
                  {[selectedUser.City || 'Bengaluru', selectedUser.State || 'Karnataka'].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick action buttons: Call & WhatsApp */}
          <View style={styles.heroActionButtonsRow}>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => handleCallCustomer(selectedUser.MobileNumber)}
              activeOpacity={0.8}
              accessibilityLabel="Call Customer"
            >
              <Ionicons name="call-outline" size={17} color={isDark ? '#34d399' : '#10b981'} />
              <Text style={styles.heroActionBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => handleWhatsAppCustomer(selectedUser.MobileNumber)}
              activeOpacity={0.8}
              accessibilityLabel="WhatsApp Customer"
            >
              <Ionicons name="logo-whatsapp" size={17} color={isDark ? '#34d399' : '#10b981'} />
              <Text style={styles.heroActionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: Profile | Bank Accounts | Loans */}
        <View style={styles.tabsSegmentContainer}>
          <TouchableOpacity
            style={styles.tabSegmentBtn}
            onPress={() => setActiveTab('Profile')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabSegmentText, activeTab === 'Profile' && styles.tabSegmentTextActive]}>
              Profile
            </Text>
            {activeTab === 'Profile' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabSegmentBtn}
            onPress={() => setActiveTab('Bank Accounts')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabSegmentText, activeTab === 'Bank Accounts' && styles.tabSegmentTextActive]}>
              Bank Accounts
            </Text>
            {activeTab === 'Bank Accounts' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabSegmentBtn}
            onPress={() => setActiveTab('Loans')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabSegmentText, activeTab === 'Loans' && styles.tabSegmentTextActive]}>
              Loans
            </Text>
            {activeTab === 'Loans' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* TAB 1: PROFILE */}
        {activeTab === 'Profile' && (
          <View style={styles.tabContentArea}>
            {/* Section 1: Personal Information */}
            <View style={styles.profileSection}>
              <View style={styles.profileHeadingRow}>
                <View style={styles.profileIconBox}>
                  <Ionicons name="person-outline" size={17} color="#0284c7" />
                </View>
                <Text style={styles.profileSectionTitle}>Personal Information</Text>
              </View>
              <View style={styles.profileDivider} />

              <View style={styles.profileRowsList}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Full Name</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.FullName}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Father / Husband Name</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.FatherHusbandName || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Customer Code</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.CustomerCode || selectedUser.UserId}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Mobile Number</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{formatPhoneNumber(selectedUser.MobileNumber)}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Alternate Mobile Number</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>
                      {selectedUser.AlternateMobileNumber ? formatPhoneNumber(selectedUser.AlternateMobileNumber) : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Email Address</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.Email || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Date of Birth</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>
                      {selectedUser.DateOfBirth
                        ? `${formatDisplayDOB(selectedUser.DateOfBirth)}${calculateAge(selectedUser.DateOfBirth)}`
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Gender</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.Gender || 'Male'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Occupation</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.Occupation || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Status</Text>
                  <View style={styles.profileRowValueContainer}>
                    <View style={styles.profileStatusRow}>
                      <View
                        style={[
                          styles.profileStatusDot,
                          { backgroundColor: selectedUser.Status === 'Active' ? '#10b981' : '#64748b' },
                        ]}
                      />
                      <Text style={styles.profileRowValueText}>{selectedUser.Status || 'Active'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: KYC Information */}
            {(() => {
              const aadhaarRaw = selectedUser.AadhaarNumber != null ? String(selectedUser.AadhaarNumber).replace(/\s+/g, '') : '';
              const unmaskedAadhaar = aadhaarRaw ? aadhaarRaw.replace(/(\d{4})/g, '$1 ').trim() : '—';
              const maskedAadhaar = formatMaskedAadhaar(selectedUser.AadhaarNumber);

              const panRaw = selectedUser.PANNumber != null ? String(selectedUser.PANNumber).toUpperCase().trim() : '';
              const maskedPan = formatMaskedPAN(selectedUser.PANNumber);
              const unmaskedPan = panRaw || '—';

              return (
                <View style={styles.profileSection}>
                  <View style={styles.profileHeadingRow}>
                    <View style={styles.profileIconBox}>
                      <Ionicons name="shield-checkmark-outline" size={17} color="#0284c7" />
                    </View>
                    <Text style={styles.profileSectionTitle}>KYC Information</Text>
                  </View>
                  <View style={styles.profileDivider} />

                  <View style={styles.profileRowsList}>
                    <View style={styles.profileRow}>
                      <Text style={styles.profileRowLabel}>Aadhaar Number</Text>
                      <View style={styles.profileRowValueContainer}>
                        <Text style={styles.profileRowValueText}>
                          {showAadhaar ? unmaskedAadhaar : maskedAadhaar}
                        </Text>
                        {aadhaarRaw ? (
                          <TouchableOpacity
                            style={styles.privacyEyeBtn}
                            onPress={() => setShowAadhaar(!showAadhaar)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={showAadhaar ? 'Hide Aadhaar number' : 'Show Aadhaar number'}
                          >
                            <Ionicons
                              name={showAadhaar ? 'eye-off-outline' : 'eye-outline'}
                              size={18}
                              color={isDark ? '#94a3b8' : '#64748b'}
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.profileRow}>
                      <Text style={styles.profileRowLabel}>PAN Number</Text>
                      <View style={styles.profileRowValueContainer}>
                        <Text style={styles.profileRowValueText}>
                          {showPAN ? unmaskedPan : maskedPan}
                        </Text>
                        {panRaw ? (
                          <TouchableOpacity
                            style={styles.privacyEyeBtn}
                            onPress={() => setShowPAN(!showPAN)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={showPAN ? 'Hide PAN number' : 'Show PAN number'}
                          >
                            <Ionicons
                              name={showPAN ? 'eye-off-outline' : 'eye-outline'}
                              size={18}
                              color={isDark ? '#94a3b8' : '#64748b'}
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Section 3: Address */}
            <View style={[styles.profileSection, styles.profileSectionLast]}>
              <View style={styles.profileHeadingRow}>
                <View style={styles.profileIconBox}>
                  <Ionicons name="location-outline" size={17} color="#0284c7" />
                </View>
                <Text style={styles.profileSectionTitle}>Address</Text>
              </View>
              <View style={styles.profileDivider} />

              <View style={styles.profileRowsList}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Address Line 1</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.AddressLine1 || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Address Line 2</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.AddressLine2 || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>City</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.City || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>State</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.State || '—'}</Text>
                  </View>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Pincode</Text>
                  <View style={styles.profileRowValueContainer}>
                    <Text style={styles.profileRowValueText}>{selectedUser.Pincode || '—'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: BANK ACCOUNTS */}
        {activeTab === 'Bank Accounts' && (
          <View style={styles.tabContentArea}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons
                name="bank"
                size={20}
                color={isDark ? '#f8fafc' : '#0d172a'}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionHeaderTitle}>Bank Accounts ({displayBanks.length})</Text>
            </View>

            {displayBanks.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <MaterialCommunityIcons name="bank-outline" size={28} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text style={{ marginTop: 8, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                  No bank accounts on file
                </Text>
              </View>
            )}

            {displayBanks.map((acc, idx) => (
              <BankCard
                key={acc.BankAccountId || idx}
                account={acc}
                style={idx === displayBanks.length - 1 ? { marginBottom: 0 } : undefined}
              />
            ))}
          </View>
        )}

        {/* TAB 3: LOANS */}
        {activeTab === 'Loans' && (
          <View style={styles.tabContentArea}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={isDark ? '#f8fafc' : '#0d172a'}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionHeaderTitle}>Loans ({displayLoans.length})</Text>
            </View>

            {displayLoans.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={28} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text style={{ marginTop: 8, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                  No loans on file
                </Text>
              </View>
            )}

            {displayLoans.map((loan, idx) => (
              <LoanCard
                key={loan.LoanId || idx}
                loan={loan}
                onViewLoan={() => router.push(`/loans/${loan.LoanId}` as any)}
                style={idx === displayLoans.length - 1 ? { marginBottom: 0 } : undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Adding Loan */}
      {activeTab === 'Loans' && (
        <TouchableOpacity
          style={styles.loanFabBtn}
          onPress={() => router.push('/loans/new' as any)}
          activeOpacity={0.85}
          accessibilityLabel="Add New Loan"
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Customer"
        message={`Are you sure you want to delete "${selectedUser.FullName}" (${selectedUser.CustomerCode || selectedUser.UserId})? This action will permanently remove this customer from Google Sheets.`}
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={() => {
          store.deleteUser(selectedUser.UserId);
          setDeleteModalVisible(false);
          toast.danger(`Customer "${selectedUser.FullName}" deleted`);
          onBack();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}
