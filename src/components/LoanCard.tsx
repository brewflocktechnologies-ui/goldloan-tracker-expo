import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ExtraUserLoan } from '../mock/userMockExtras';
import { getDriveImageUrl } from '../services/api';

export interface LoanCardProps {
  loan: ExtraUserLoan;
  onPress?: () => void;
  onViewLoan?: () => void;
  hideMenu?: boolean;
}

export function LoanCard({
  loan,
  onPress,
  onViewLoan,
  hideMenu = false,
}: LoanCardProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive breakpoint: small screens (< 460px) like phones
  const isSmall = windowWidth < 460;
  const isTiny = windowWidth < 360;
  const styles = getStyles(isDark, isSmall, isTiny);

  const [menuVisible, setMenuVisible] = useState(false);

  const isOverdue = loan.Status === 'Overdue';
  const isClosed = loan.Status === 'Closed';
  const isActive = loan.Status === 'Active';

  // Format date display (e.g. 10 Jan 2024)
  const formatDisplayDate = (d?: string) => {
    if (!d || d === '—') return '—';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d;
    const day = parsed.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
  };

  const handleView = () => {
    if (onViewLoan) {
      onViewLoan();
    } else if (onPress) {
      onPress();
    } else {
      router.push(`/loans/${loan.LoanId}` as any);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    setMenuVisible(false);
    if (!text || text === '—') return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    toast.success(`${label} copied`);
  };

  // Parse interest rate text (e.g. "12% p.a.")
  let rateDisplay = loan.InterestRateText || '12% p.a.';
  if (rateDisplay.includes('(')) {
    rateDisplay = rateDisplay.split('(')[0].trim();
  }
  if (!rateDisplay.includes('p.a.')) {
    rateDisplay = `${rateDisplay} p.a.`;
  }

  const interestTypeDisplay = `(${loan.InterestType || 'Simple'})`;

  // Ornament thumbnail URL
  const directPhotoUrl = loan.OrnamentImageUri ? getDriveImageUrl(loan.OrnamentImageUri) : null;
  const hasExtraOrnaments = loan.OrnamentsCount > 1;

  return (
    <>
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.88}
        onPress={handleView}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.loanNumberTitle} numberOfLines={1} ellipsizeMode="tail">
              {loan.LoanNumber}
            </Text>
            <Text style={styles.loanDateText} numberOfLines={1}>
              {formatDisplayDate(loan.LoanDate)}
            </Text>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Status Pill Badge */}
            <View
              style={[
                styles.statusBadge,
                isOverdue
                  ? styles.statusBadgeOverdue
                  : isClosed
                  ? styles.statusBadgeClosed
                  : styles.statusBadgeActive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isOverdue
                    ? styles.statusDotOverdue
                    : isClosed
                    ? styles.statusDotClosed
                    : styles.statusDotActive,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isOverdue
                    ? styles.statusTextOverdue
                    : isClosed
                    ? styles.statusTextClosed
                    : styles.statusTextActive,
                ]}
                numberOfLines={1}
              >
                {loan.Status}
              </Text>
            </View>

            {/* Three Dots Menu */}
            {!hideMenu && (
              <TouchableOpacity
                style={styles.menuTriggerBtn}
                onPress={() => setMenuVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="More loan options"
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#475569'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Middle Section: Thumbnail + Financial Metrics */}
        <View style={styles.middleSectionRow}>
          {/* Ornament Thumbnail */}
          <View style={styles.thumbWrapper}>
            {directPhotoUrl ? (
              <Image
                source={{ uri: directPhotoUrl }}
                style={styles.thumbImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.thumbFallback}>
                <MaterialCommunityIcons name="ring" size={isSmall ? 24 : 28} color="#d97706" />
              </View>
            )}

            {/* Multi-ornament badge (+1, +2...) */}
            {hasExtraOrnaments && (
              <View style={styles.thumbCountBadge}>
                <Text style={styles.thumbCountBadgeText}>
                  +{loan.OrnamentsCount - 1}
                </Text>
              </View>
            )}
          </View>

          {/* 3-Column Financial Metrics matching reference image */}
          <View style={styles.metricsColsContainer}>
            {/* Column 1: Loan Amount */}
            <View style={styles.metricCol}>
              <Text
                style={styles.metricLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Loan Amount
              </Text>
              <Text
                style={styles.metricVal}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                ₹ {loan.LoanAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Column 2: Outstanding (mock) */}
            <View style={styles.metricCol}>
              <Text
                style={styles.metricLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                Outstanding (mock)
              </Text>
              <Text
                style={styles.metricVal}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                ₹ {loan.OutstandingAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Column 3: Due Date */}
            <View style={styles.metricCol}>
              <Text
                style={styles.metricLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Due Date
              </Text>
              <Text
                style={styles.dueDateVal}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {formatDisplayDate(loan.DueDate)}
              </Text>
              {loan.DueBadgeText && loan.DueBadgeText !== '—' ? (
                <Text
                  style={[
                    styles.dueSubText,
                    isOverdue ? styles.dueSubTextOverdue : styles.dueSubTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {loan.DueBadgeText}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.dividerLine} />

        {/* Bottom Row: Attributes + View Loan Action */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomAttributesGroup}>
            {/* Ornaments Count */}
            <View style={styles.bottomMetricItem}>
              <Ionicons
                name="time-outline"
                size={isTiny ? 12 : (isSmall ? 13 : 14)}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              <View style={styles.bottomMetricStacked}>
                <Text style={styles.bottomMetricValText} numberOfLines={1}>
                  {loan.OrnamentsCount}
                </Text>
                <Text style={styles.bottomMetricSubText} numberOfLines={1}>
                  {isTiny ? 'orn' : (isSmall ? 'orns' : 'ornaments')}
                </Text>
              </View>
            </View>

            {/* Total Weight */}
            <View style={styles.bottomMetricItem}>
              <Ionicons
                name="bag-handle-outline"
                size={isTiny ? 12 : (isSmall ? 13 : 14)}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              <Text style={styles.bottomWeightValText} numberOfLines={1}>
                {Number(loan.TotalWeightGrams || 0).toFixed(isTiny ? 1 : 2)} g
              </Text>
            </View>

            {/* Interest Rate */}
            <View style={styles.bottomMetricItem}>
              <MaterialCommunityIcons
                name="percent-circle-outline"
                size={isTiny ? 13 : (isSmall ? 14 : 15)}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              <View style={styles.bottomMetricStacked}>
                <Text style={styles.bottomMetricValText} numberOfLines={1}>
                  {rateDisplay}
                </Text>
                {!isTiny && (
                  <Text style={styles.bottomMetricSubText} numberOfLines={1}>
                    {interestTypeDisplay}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* View Loan -> Action */}
          <TouchableOpacity
            style={styles.viewLoanBtn}
            onPress={handleView}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewLoanText}>View Loan</Text>
            <Ionicons name="arrow-forward" size={isSmall ? 12 : 13} color="#0284c7" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Overflow Action Menu Modal */}
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
              {loan.LoanNumber}
            </Text>
            <Text style={styles.sheetSubtitle}>
              ₹ {loan.LoanAmount.toLocaleString('en-IN')} • {loan.Status}
            </Text>

            <View style={styles.sheetActionList}>
              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => copyToClipboard(loan.LoanNumber, 'Loan Number')}
              >
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#334155'}
                  style={styles.sheetActionIcon}
                />
                <Text style={styles.sheetActionLabel}>Copy Loan Number</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => {
                  setMenuVisible(false);
                  handleView();
                }}
              >
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color="#0284c7"
                  style={styles.sheetActionIcon}
                />
                <Text style={[styles.sheetActionLabel, { color: '#0284c7' }]}>
                  View Loan Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/ornaments' as any);
                }}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#334155'}
                  style={styles.sheetActionIcon}
                />
                <Text style={styles.sheetActionLabel}>View Ornaments ({loan.OrnamentsCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/closure' as any);
                }}
              >
                <Ionicons
                  name="receipt-outline"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#334155'}
                  style={styles.sheetActionIcon}
                />
                <Text style={styles.sheetActionLabel}>Loan Settlement / Closure</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function getStyles(isDark: boolean, isSmall: boolean, isTiny: boolean) {
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
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleCol: {
      flex: 1,
      marginRight: 8,
    },
    loanNumberTitle: {
      fontSize: isSmall ? 15 : 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
    },
    loanDateText: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
      fontWeight: '500',
    },
    headerRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 0,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 14,
      borderWidth: 1.2,
      flexShrink: 0,
    },
    statusBadgeActive: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.06)',
      borderColor: '#22c55e',
    },
    statusBadgeOverdue: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)',
      borderColor: '#ef4444',
    },
    statusBadgeClosed: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.12)' : '#f1f5f9',
      borderColor: '#64748b',
    },
    statusDot: {
      width: 5.5,
      height: 5.5,
      borderRadius: 3,
    },
    statusDotActive: {
      backgroundColor: '#16a34a',
    },
    statusDotOverdue: {
      backgroundColor: '#ef4444',
    },
    statusDotClosed: {
      backgroundColor: '#64748b',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusTextActive: {
      color: '#16a34a',
    },
    statusTextOverdue: {
      color: '#ef4444',
    },
    statusTextClosed: {
      color: '#64748b',
    },
    menuTriggerBtn: {
      padding: 3,
      marginLeft: 1,
    },

    // Middle Section
    middleSectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isSmall ? 12 : 16,
      marginBottom: isSmall ? 12 : 14,
    },
    thumbWrapper: {
      width: isTiny ? 48 : (isSmall ? 54 : 64),
      height: isTiny ? 48 : (isSmall ? 54 : 64),
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1e293b' : '#fef3c7',
      position: 'relative',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#fde68a',
      flexShrink: 0,
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    thumbFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#fffbeb',
    },
    thumbCountBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      borderRadius: 4,
      paddingHorizontal: 3,
      paddingVertical: 1,
    },
    thumbCountBadgeText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '700',
    },

    // 3-Column Financial Metrics matching reference image
    metricsColsContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginLeft: isTiny ? 8 : (isSmall ? 10 : 14),
      gap: isTiny ? 3 : (isSmall ? 5 : 8),
      minWidth: 0,
    },
    metricCol: {
      flex: 1,
      minWidth: 0,
    },
    metricLabel: {
      fontSize: isTiny ? 9.5 : (isSmall ? 10.5 : 11.5),
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: '500',
    },
    metricVal: {
      fontSize: isTiny ? 12 : (isSmall ? 13 : 14.5),
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: isSmall ? 2 : 4,
      letterSpacing: -0.2,
    },
    dueDateVal: {
      fontSize: isTiny ? 11 : (isSmall ? 12 : 13),
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: isSmall ? 2 : 4,
      letterSpacing: -0.2,
    },
    dueSubText: {
      fontSize: isTiny ? 9.5 : (isSmall ? 10.5 : 11),
      fontWeight: '600',
      marginTop: 2,
    },
    dueSubTextActive: {
      color: '#16a34a',
    },
    dueSubTextOverdue: {
      color: '#ef4444',
    },

    // Divider
    dividerLine: {
      height: 1,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      marginTop: isSmall ? 10 : 12,
      marginBottom: isSmall ? 10 : 12,
    },

    // Bottom Row
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    bottomAttributesGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTiny ? 6 : (isSmall ? 8 : 14),
      flex: 1,
      minWidth: 0,
      flexWrap: 'nowrap',
    },
    bottomMetricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      flexShrink: 0,
    },
    bottomMetricStacked: {
      justifyContent: 'center',
    },
    bottomMetricValText: {
      fontSize: isTiny ? 10.5 : (isSmall ? 11.5 : 12),
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      lineHeight: isSmall ? 12 : 13,
    },
    bottomMetricSubText: {
      fontSize: isTiny ? 8.5 : (isSmall ? 9 : 9.5),
      color: isDark ? '#94a3b8' : '#64748b',
      lineHeight: isSmall ? 10 : 11,
    },
    bottomWeightValText: {
      fontSize: isTiny ? 10.5 : (isSmall ? 11.5 : 12),
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    viewLoanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 2,
      flexShrink: 0,
    },
    viewLoanText: {
      fontSize: isTiny ? 11.5 : (isSmall ? 12 : 13),
      fontWeight: '700',
      color: '#0284c7',
    },

    // Modal
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
  });
}
