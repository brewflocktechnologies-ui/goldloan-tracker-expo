import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Loan, Payment, User } from '../../types';
import { getLoansStyles } from './loansStyles';
import {
    calculateOutstanding,
    formatAmountLakh,
    formatLoanDate,
    formatLoanPhone,
    getLoanStatusInfo,
} from './loanUtils';

export interface LoanCardItemProps {
  loan: Loan;
  borrower?: User | null;
  payments?: Payment[];
  ornamentsCount?: number;
  onPress: (loan: Loan) => void;
  onMenuPress: (loan: Loan) => void;
}

export function LoanCardItem({
  loan,
  borrower,
  payments,
  ornamentsCount,
  onPress,
  onMenuPress,
}: LoanCardItemProps) {
  const { colors, isDark } = useTheme();
  const styles = getLoansStyles(colors, isDark);

  const statusInfo = getLoanStatusInfo(loan);
  const outstandingAmt = calculateOutstanding(loan, payments);
  const borrowerName = borrower?.FullName || loan.UserId || 'Borrower';
  const borrowerPhone = formatLoanPhone(borrower?.MobileNumber || borrower?.AlternateMobileNumber || '');

  const ornsCount = ornamentsCount ?? (loan.ornamentIds?.length || 1);
  const bankName = loan.BankName || 'Bank';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress(loan)}
      accessibilityRole="button"
      accessibilityLabel={`Loan ${loan.LoanNumber}`}
    >
      {/* ─── ROW 1: Loan # + Status Badge + 3-Dots Menu ─── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeftPillGroup}>
          <Text style={styles.loanNumber} numberOfLines={1}>
            {loan.LoanNumber}
          </Text>

          {/* Status Badge right next to Loan Number */}
          <View
            style={[
              styles.badge,
              statusInfo.badgeVariant === 'overdue' && styles.badgeOverdue,
              statusInfo.badgeVariant === 'active' && styles.badgeActive,
              statusInfo.badgeVariant === 'closed' && styles.badgeClosed,
            ]}
          >
            <Ionicons
              name={
                statusInfo.badgeVariant === 'overdue'
                  ? 'alert-circle-outline'
                  : statusInfo.badgeVariant === 'closed'
                  ? 'checkmark-done-circle-outline'
                  : 'checkmark-circle-outline'
              }
              size={12}
              color={
                statusInfo.badgeVariant === 'overdue'
                  ? '#d92d20'
                  : statusInfo.badgeVariant === 'closed'
                  ? '#64748b'
                  : '#16a34a'
              }
            />
            <Text
              style={[
                styles.badgeText,
                statusInfo.badgeVariant === 'overdue' && styles.badgeTextOverdue,
                statusInfo.badgeVariant === 'active' && styles.badgeTextActive,
                statusInfo.badgeVariant === 'closed' && styles.badgeTextClosed,
              ]}
            >
              {statusInfo.badgeLabel}
            </Text>
          </View>
        </View>

        {/* Kebab Menu (3 dots) */}
        <TouchableOpacity
          style={styles.menuTrigger}
          onPress={() => onMenuPress(loan)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="More options"
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
        </TouchableOpacity>
      </View>

      {/* ─── ROW 2: Customer Name + Phone Number ─── */}
      <View style={styles.customerRow}>
        <Text style={styles.customerName} numberOfLines={1}>
          {borrowerName}
        </Text>

        {borrowerPhone ? (
          <View style={styles.phoneContainer}>
            <Ionicons
              name="call-outline"
              size={12}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
            <Text style={styles.phoneText} numberOfLines={1}>
              {borrowerPhone}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ─── ROW 3: 3 Columns of Metrics ─── */}
      <View style={styles.metricsRow}>
        {/* Column 1: Loan amount */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            Loan amount
          </Text>
          <Text style={styles.metricValueAmount} numberOfLines={1}>
            {formatAmountLakh(loan.LoanAmount)}
          </Text>
        </View>

        {/* Column 2: Outstanding */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            Outstanding
          </Text>
          <Text style={styles.metricValueOutstanding} numberOfLines={1}>
            {formatAmountLakh(outstandingAmt)}
          </Text>
        </View>

        {/* Column 3: Due date */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            Due date
          </Text>
          <Text style={styles.metricValueDate} numberOfLines={1}>
            {formatLoanDate(loan.DueDate)}
          </Text>
        </View>
      </View>

      {/* ─── DIVIDER LINE ─── */}
      <View style={styles.cardDivider} />

      {/* ─── ROW 4: Bank/Ornaments (Left) + Status/Due in (Right) ─── */}
      <View style={styles.footerRow}>
        <View style={styles.bankGroup}>
          <MaterialCommunityIcons
            name="bank-outline"
            size={14}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
          <Text style={styles.bankText} numberOfLines={1}>
            {bankName} · {ornsCount} {ornsCount === 1 ? 'ornament' : 'ornaments'}
          </Text>
        </View>

        <Text
          style={[
            styles.statusText,
            statusInfo.footerType === 'overdue' && styles.statusTextOverdue,
            statusInfo.footerType === 'urgent' && styles.statusTextUrgent,
            statusInfo.footerType === 'normal' && styles.statusTextNormal,
            statusInfo.footerType === 'closed' && styles.statusTextClosed,
          ]}
          numberOfLines={1}
        >
          {statusInfo.footerText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
