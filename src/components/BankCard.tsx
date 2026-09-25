import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ExtraUserBankAccount } from '../mock/userMockExtras';
import { getDriveImageUrl } from '../services/api';
import { BankAccount } from '../types';

export interface BankCardProps {
  account: BankAccount | ExtraUserBankAccount;
  onPress?: () => void;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onImagePress?: (imageUrl: string) => void;
  hideMenu?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BankCard({
  account,
  onPress,
  onViewDetails,
  onEdit,
  onDelete,
  onImagePress,
  hideMenu = false,
  style,
}: BankCardProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 460;
  const styles = getStyles(isDark, isSmall);

  const [isMasked, setIsMasked] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  // Normalizing account values
  const bankName = account.BankName || 'Bank';
  const accountHolder = account.AccountHolderName || '—';
  const accountNumber = account.AccountNumber || '';
  const ifscCode = account.IFSCCode || '—';
  const upiId = account.UPI_ID || '—';
  const status = account.Status || 'Active';
  const isActive = status === 'Active';

  // Format Account Type
  const rawType = account.AccountType || 'Savings';
  const accountType = rawType.toLowerCase().includes('account')
    ? rawType
    : `${rawType} Account`;

  // Branch & City label (e.g. "• Main Branch, Bengaluru")
  const branch = account.BranchName?.trim() || '';
  const city = (account as any).City?.trim() || '';
  let branchLocation = '';
  if (branch && city) {
    branchLocation = `• ${branch}, ${city}`;
  } else if (branch) {
    branchLocation = `• ${branch}`;
  } else if (city) {
    branchLocation = `• ${city}`;
  }

  // Masked Account Number formatting
  const getDisplayAccountNumber = () => {
    if (!accountNumber) return '—';
    if (!isMasked) {
      // Formatted with groups of 4: "1234 5678 1234"
      return accountNumber.replace(/(.{4})/g, '$1 ').trim();
    }
    const cleanNum = accountNumber.replace(/\s+/g, '');
    const last4 = cleanNum.slice(-4);
    if (cleanNum.length <= 4) {
      return `XXXX ${cleanNum}`;
    }
    return `XXXX  XXXX  ${last4}`;
  };

  // Financial calculations
  const maxLoan = account.MaxLoanAmount || 0;
  const utilizedLoan = account.UtilizedLoanAmount || 0;
  const availableLoan =
    account.AvailableLoanAmount !== undefined
      ? account.AvailableLoanAmount
      : Math.max(0, maxLoan - utilizedLoan);

  const utilPercentage =
    (account as ExtraUserBankAccount).UtilizationPercentage !== undefined
      ? (account as ExtraUserBankAccount).UtilizationPercentage
      : maxLoan > 0
      ? Math.min(100, Math.round((utilizedLoan / maxLoan) * 100))
      : 0;

  // Copy helpers
  const copyToClipboard = (text: string, label: string) => {
    setMenuVisible(false);
    if (!text || text === '—') return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    toast.success(`${label} copied`);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.cardContainer, style]}
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Bank Logo */}
          <BankLogoBadge
            bankName={bankName}
            passbookImage={account.PassbookImage}
            onImagePress={onImagePress}
          />

          {/* Bank Name & Branch Details */}
          <View style={styles.bankTitleCol}>
            <Text style={styles.bankNameText} numberOfLines={1}>
              {bankName}
            </Text>
            <Text style={styles.accountTypeText}>{accountType}</Text>
            {branchLocation ? (
              <Text style={styles.branchLocationText} numberOfLines={1}>
                {branchLocation}
              </Text>
            ) : null}
          </View>

          {/* Right: Status Pill & Menu Icon */}
          <View style={styles.headerRightCol}>
            <View
              style={[
                styles.statusPill,
                isActive ? styles.statusPillActive : styles.statusPillInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isActive ? styles.statusDotActive : styles.statusDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isActive ? styles.statusTextActive : styles.statusTextInactive,
                ]}
              >
                {status}
              </Text>
            </View>

            {!hideMenu && (
              <TouchableOpacity
                style={styles.menuTriggerBtn}
                onPress={() => setMenuVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="More options"
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#0f172a'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Middle Tabular Account Info */}
        <View style={styles.accountDetailsGrid}>
          {/* Account Number Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number</Text>
            <View style={styles.detailValueContainer}>
              <Text style={[styles.detailValueText, styles.monospaceText]}>
                {getDisplayAccountNumber()}
              </Text>
              {accountNumber ? (
                <TouchableOpacity
                  onPress={() => setIsMasked(prev => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={isMasked ? 'Reveal account number' : 'Hide account number'}
                >
                  <Ionicons
                    name={isMasked ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* IFSC Code Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>IFSC Code</Text>
            <View style={styles.detailValueContainer}>
              <Text style={[styles.detailValueText, styles.monospaceText]}>
                {ifscCode}
              </Text>
            </View>
          </View>

          {/* Account Holder Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Holder</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValueText}>{accountHolder}</Text>
            </View>
          </View>

          {/* UPI ID Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UPI ID</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValueText}>{upiId}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerLine} />

        {/* 3-Column Loan Limits */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text
              style={styles.metricAmountText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              ₹ {maxLoan.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1} ellipsizeMode="tail">
              Max Loan Amount
            </Text>
          </View>

          <View style={styles.metricCol}>
            <Text
              style={styles.metricAmountText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              ₹ {utilizedLoan.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1} ellipsizeMode="tail">
              Utilized Amount
            </Text>
          </View>

          <View style={styles.metricCol}>
            <Text
              style={[styles.metricAmountText, styles.availableAmountText]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              ₹ {availableLoan.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1} ellipsizeMode="tail">
              Available Limit
            </Text>
          </View>
        </View>

        {/* Progress Bar & Utilized Percentage */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, utilPercentage))}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentageText}>
            {utilPercentage}% utilized
          </Text>
        </View>
      </TouchableOpacity>

      {/* 3-Dots Action Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {bankName}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {accountNumber ? `•••• ${accountNumber.slice(-4)}` : 'Bank Account'}
            </Text>

            <View style={styles.sheetActionList}>
              {accountNumber ? (
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => copyToClipboard(accountNumber, 'Account number')}
                >
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={isDark ? '#cbd5e1' : '#334155'}
                    style={styles.sheetActionIcon}
                  />
                  <Text style={styles.sheetActionLabel}>Copy Account Number</Text>
                </TouchableOpacity>
              ) : null}

              {ifscCode && ifscCode !== '—' ? (
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => copyToClipboard(ifscCode, 'IFSC Code')}
                >
                  <Ionicons
                    name="barcode-outline"
                    size={18}
                    color={isDark ? '#cbd5e1' : '#334155'}
                    style={styles.sheetActionIcon}
                  />
                  <Text style={styles.sheetActionLabel}>Copy IFSC Code</Text>
                </TouchableOpacity>
              ) : null}

              {upiId && upiId !== '—' ? (
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => copyToClipboard(upiId, 'UPI ID')}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={18}
                    color={isDark ? '#cbd5e1' : '#334155'}
                    style={styles.sheetActionIcon}
                  />
                  <Text style={styles.sheetActionLabel}>Copy UPI ID</Text>
                </TouchableOpacity>
              ) : null}

              {onViewDetails ? (
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    setMenuVisible(false);
                    onViewDetails();
                  }}
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color="#0284c7"
                    style={styles.sheetActionIcon}
                  />
                  <Text style={[styles.sheetActionLabel, { color: '#0284c7' }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              ) : null}

              {onEdit ? (
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit();
                  }}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={isDark ? '#cbd5e1' : '#334155'}
                    style={styles.sheetActionIcon}
                  />
                  <Text style={styles.sheetActionLabel}>Edit Account</Text>
                </TouchableOpacity>
              ) : null}

              {onDelete ? (
                <TouchableOpacity
                  style={[styles.sheetActionBtn, styles.destructiveActionBtn]}
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete();
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#ef4444"
                    style={styles.sheetActionIcon}
                  />
                  <Text style={[styles.sheetActionLabel, styles.destructiveText]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * Bank Logo / Emblem component
 * Draws iconic State Bank of India keyhole geometry or branded colors for other banks
 */
function BankLogoBadge({
  bankName,
  passbookImage,
  onImagePress,
}: {
  bankName: string;
  passbookImage?: string;
  onImagePress?: (url: string) => void;
}) {
  const norm = (bankName || '').toLowerCase();
  const directUrl = passbookImage ? getDriveImageUrl(passbookImage) : null;

  if (passbookImage && directUrl) {
    return (
      <TouchableOpacity
        disabled={!onImagePress}
        onPress={() => onImagePress?.(passbookImage)}
        activeOpacity={0.8}
        style={styles.logoWrapper}
      >
        <Image
          source={{ uri: directUrl }}
          style={styles.passbookThumb}
          contentFit="cover"
        />
      </TouchableOpacity>
    );
  }

  // SBI - Official Keyhole Logo in Brand Blue (#0082c8)
  if (norm.includes('state bank') || norm.includes('sbi')) {
    return (
      <View style={styles.sbiLogoContainer}>
        {/* Center keyhole circle */}
        <View style={styles.sbiInnerCircle} />
        {/* Keyhole vertical slit */}
        <View style={styles.sbiKeyholeSlit} />
      </View>
    );
  }

  // Major Indian Banks Colors
  let bgColor = '#0284c7';
  if (norm.includes('hdfc')) {
    bgColor = '#004c8f';
  } else if (norm.includes('icici')) {
    bgColor = '#c84824';
  } else if (norm.includes('axis')) {
    bgColor = '#97144d';
  } else if (norm.includes('baroda') || norm.includes('bob')) {
    bgColor = '#f26522';
  } else if (norm.includes('punjab') || norm.includes('pnb')) {
    bgColor = '#a20025';
  } else if (norm.includes('canara')) {
    bgColor = '#0083ca';
  } else if (norm.includes('kotak')) {
    bgColor = '#ed1c24';
  }

  return (
    <View style={[styles.genericBankLogo, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name="bank" size={22} color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  passbookThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sbiLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0082c8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sbiInnerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
  },
  sbiKeyholeSlit: {
    position: 'absolute',
    bottom: 0,
    width: 3.5,
    height: 16,
    backgroundColor: '#ffffff',
  },
  genericBankLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function getStyles(isDark: boolean, isSmall: boolean) {
  return StyleSheet.create({
    cardContainer: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      padding: isSmall ? 13 : 18,
      marginBottom: 14,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
        } as any,
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bankTitleCol: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    bankNameText: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
    },
    accountTypeText: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    branchLocationText: {
      fontSize: 12.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    headerRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 14,
    },
    statusPillActive: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
    },
    statusPillInactive: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDotActive: {
      backgroundColor: '#16a34a',
    },
    statusDotInactive: {
      backgroundColor: '#64748b',
    },
    statusText: {
      fontSize: 11.5,
      fontWeight: '600',
    },
    statusTextActive: {
      color: isDark ? '#4ade80' : '#16a34a',
    },
    statusTextInactive: {
      color: isDark ? '#cbd5e1' : '#64748b',
    },
    menuTriggerBtn: {
      padding: 4,
      marginLeft: 2,
    },
    accountDetailsGrid: {
      marginTop: 18,
      gap: 9,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailLabel: {
      width: isSmall ? 115 : 135,
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    detailValueContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailValueText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    monospaceText: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
      letterSpacing: 0.3,
    },
    eyeBtn: {
      padding: 2,
    },
    dividerLine: {
      height: 1,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      marginVertical: 14,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 6,
    },
    metricCol: {
      flex: 1,
      minWidth: 0,
    },
    metricAmountText: {
      fontSize: isSmall ? 14 : 15.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
    },
    availableAmountText: {
      color: '#10b981',
    },
    metricLabelText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 4,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      gap: 12,
    },
    progressBarBg: {
      flex: 1,
      height: 6,
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#0284c7',
      borderRadius: 3,
    },
    progressPercentageText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },

    // Action Menu Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    sheetCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      padding: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        android: { elevation: 8 },
        web: { boxShadow: '0 8px 30px rgba(0,0,0,0.2)' } as any,
      }),
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#475569' : '#cbd5e1',
      alignSelf: 'center',
      marginBottom: 12,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      textAlign: 'center',
    },
    sheetSubtitle: {
      fontSize: 12.5,
      color: isDark ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      marginTop: 2,
      marginBottom: 16,
    },
    sheetActionList: {
      borderTopWidth: 1,
      borderColor: isDark ? '#334155' : '#f1f5f9',
      paddingTop: 8,
      gap: 2,
    },
    sheetActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    sheetActionIcon: {
      marginRight: 12,
    },
    sheetActionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#f8fafc' : '#1e293b',
    },
    destructiveActionBtn: {
      marginTop: 4,
    },
    destructiveText: {
      color: '#ef4444',
    },
  });
}
