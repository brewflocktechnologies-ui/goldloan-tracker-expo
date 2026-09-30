import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatLoanDate,
  formatLoanPhone,
  getLoanStatusInfo,
} from '../../components/loans/loanUtils';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';

export default function LoanDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'Summary' | 'Payments'>('Summary');
  const [refreshing, setRefreshing] = useState(false);

  // Repayment form modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'Interest' | 'Principal' | 'Part_Payment' | 'Penalty'>('Interest');
  const [payMethod, setPayMethod] = useState<'UPI' | 'Net Banking' | 'Cash'>('Cash');
  const [payReference, setPayReference] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Find loan and borrower
  const loan = useMemo(() => {
    return store.loans.find((l) => l.LoanId === id || l.LoanNumber === id) || null;
  }, [store.loans, id]);

  const borrower = useMemo(() => {
    if (!loan || !loan.UserId) return null;
    return (
      store.users.find(
        (u) =>
          String(u.UserId) === String(loan.UserId) ||
          (u.CustomerCode && String(u.CustomerCode).toLowerCase() === String(loan.UserId).toLowerCase())
      ) || null
    );
  }, [store.users, loan]);

  const payments = useMemo(() => {
    if (!loan) return [];
    return store.payments.filter((p) => p.LoanId === loan.LoanId);
  }, [store.payments, loan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/loans' as any);
    }
  }, [router]);

  useEffect(() => {
    const onBackPress = () => {
      if (showPayModal) {
        setShowPayModal(false);
        return true;
      }
      goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showPayModal, goBack]);

  // Handle Record Payment
  const handleRecordPayment = async () => {
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a payment amount greater than ₹0.');
      return;
    }
    if (!loan) return;

    setSubmittingPay(true);
    try {
      store.addPayment({
        LoanId: loan.LoanId,
        PaymentDate: new Date().toISOString().split('T')[0],
        PaymentType: payType,
        InterestAmount: payType === 'Interest' ? amt : 0,
        PrincipalAmount: payType === 'Principal' ? amt : 0,
        PenaltyAmount: payType === 'Penalty' ? amt : 0,
        TotalPaidAmount: amt,
        PaymentMethod: payMethod,
        TransactionReference: payReference,
        Remarks: payRemarks || `Payment recorded via Mobile App`,
      });

      toast.success(`Repayment of ₹${amt.toLocaleString()} recorded.`);
      setShowPayModal(false);
      setPayAmount('');
      setPayReference('');
      setPayRemarks('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingPay(false);
    }
  };

  // Navigate to Loan Settlement / Closure
  const handleCloseAndRelease = () => {
    if (!loan) return;
    router.push({
      pathname: '/(tabs)/closure',
      params: { loanId: loan.LoanId },
    } as any);
  };

  if (!loan) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Ionicons name="document-text-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
          <Text style={styles.errorTitle}>Loan Contract Not Found</Text>
          <TouchableOpacity onPress={goBack} style={styles.backLinkBtn}>
            <Text style={styles.backLinkText}>Return to Loans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Financial Calculations matching exact formulas
  const statusInfo = getLoanStatusInfo(loan);
  const loanAmt = Number(loan.LoanAmount || 0);

  // Charges
  const procFee = Number(loan.ProcessingFee) || Math.round(loanAmt * 0.01);
  const docCharge = Number(loan.DocumentCharge) || 500;
  const insCharge = Number(loan.InsuranceCharge) || 360;
  const netDisbursed = Number(loan.NetDisbursementAmount) || Math.max(0, loanAmt - (procFee + docCharge + insCharge));

  // Interest calculation
  const months = parseFloat(loan.LoanPeriod) || 1;
  const rate = Number(loan.InterestRate) || 14;
  let totalInterest = 0;
  if (loanAmt > 0 && rate > 0) {
    if (loan.InterestType === 'Compound') {
      const monthlyRate = rate / (12 * 100);
      totalInterest = Math.round((loanAmt * Math.pow(1 + monthlyRate, months) - loanAmt) * 100) / 100;
    } else {
      totalInterest = Math.round((loanAmt * (rate / 100) * (months / 12)) * 100) / 100;
    }
  }
  const totalCharges = Number(loan.TotalCharges) || (procFee + docCharge + insCharge + totalInterest);

  // Repayments
  const totalPaid = payments.reduce((s, p) => s + (Number(p.TotalPaidAmount) || 0), 0);
  const penaltyCollected = payments.reduce((s, p) => s + (Number(p.PenaltyAmount) || 0), 0);
  const totalPayable = loanAmt + totalInterest;
  const outstandingBalance = Math.max(0, totalPayable - totalPaid + penaltyCollected);
  const paidPercent = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : 0;

  // Days to due
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = loan.DueDate ? new Date(loan.DueDate) : null;
  if (dueDateObj) dueDateObj.setHours(0, 0, 0, 0);
  const diffDays = dueDateObj ? Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Format helpers
  const fmt = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const fmtDec = (v: number) =>
    `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const borrowerName = borrower?.FullName || loan.UserId || 'Borrower';
  const borrowerPhone = formatLoanPhone(borrower?.MobileNumber || borrower?.AlternateMobileNumber || '');
  const customerCode = borrower?.CustomerCode || `CUS-${String(loan.UserId).padStart(4, '0')}`;
  const borrowerInitials = borrowerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'PD';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.rootContainer}>
        {/* ─── 1. TOP HEADER (Light Blue background with back arrow & Title) ─── */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {loan.LoanNumber}
            </Text>
            <Text style={styles.headerSubtitle}>Details of loan</Text>
          </View>
        </View>

        {/* ─── 2. HERO OUTSTANDING BALANCE CARD (White floating card) ─── */}
        <View style={styles.heroWrapper}>
          <View style={styles.balanceCard}>
            {/* Top row of card */}
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Outstanding balance</Text>

              {/* Status Badge */}
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

            {/* Outstanding Amount */}
            <Text style={styles.balanceAmount} numberOfLines={1}>
              {fmtDec(outstandingBalance)}
            </Text>

            {/* Paid Progress Row */}
            <View style={styles.paidProgressRow}>
              <Text style={styles.paidProgressText}>
                Paid {fmtDec(totalPaid)} of {fmtDec(totalPayable)}
              </Text>
              <Text style={styles.paidProgressPercent}>{paidPercent}%</Text>
            </View>

            {/* Due date status row */}
            <View style={styles.dueStatusRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={diffDays < 0 ? '#d92d20' : '#d97706'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.dueStatusText,
                  diffDays < 0 ? styles.dueStatusTextOverdue : styles.dueStatusTextActive,
                ]}
              >
                Due {formatLoanDate(loan.DueDate)} ·{' '}
                {diffDays < 0
                  ? `Overdue by ${Math.abs(diffDays)} days`
                  : diffDays === 0
                  ? 'Due today'
                  : `Due in ${diffDays} days`}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 3. SCROLLABLE BODY CONTENT ─── */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0284c7']}
              tintColor="#0284c7"
            />
          }
        >
          {/* Customer / Borrower Card */}
          <TouchableOpacity
            style={styles.borrowerCard}
            onPress={() => {
              const targetId = borrower?.UserId || loan.UserId;
              if (targetId) {
                router.push('/(tabs)/users' as any);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.borrowerAvatar}>
              <Text style={styles.borrowerAvatarText}>{borrowerInitials}</Text>
            </View>

            <View style={styles.borrowerInfo}>
              <Text style={styles.borrowerName} numberOfLines={1}>
                {borrowerName}
              </Text>
              <Text style={styles.borrowerSub} numberOfLines={1}>
                {borrowerPhone ? `${borrowerPhone} · ` : ''}
                {customerCode}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>

          {/* Tab Switcher (Summary | Payments) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Summary' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Summary')}
            >
              <Text style={[styles.tabText, activeTab === 'Summary' && styles.tabTextActive]}>
                Summary
              </Text>
              {activeTab === 'Summary' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Payments' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Payments')}
            >
              <Text style={[styles.tabText, activeTab === 'Payments' && styles.tabTextActive]}>
                Payments
              </Text>
              {activeTab === 'Payments' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* ─── TAB 1: SUMMARY ─── */}
          {activeTab === 'Summary' ? (
            <View style={styles.tabSectionContainer}>
              {/* Section 1: Loan */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Loan</Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Loan amount</Text>
                    <Text style={styles.tableValue}>{fmt(loanAmt)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Net disbursed</Text>
                    <Text style={styles.tableValue}>{fmtDec(netDisbursed)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Interest</Text>
                    <Text style={styles.tableValue}>
                      {rate}% p.a · {loan.InterestType || 'Simple'}
                    </Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Loan period</Text>
                    <Text style={styles.tableValue}>
                      {months} {months === 1 ? 'month' : 'months'}
                    </Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Loan date</Text>
                    <Text style={styles.tableValue}>{formatLoanDate(loan.LoanDate)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Due date</Text>
                    <Text style={styles.tableValue}>{formatLoanDate(loan.DueDate)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Days to due</Text>
                    <Text
                      style={[
                        styles.tableValue,
                        diffDays < 0 ? styles.overdueValue : styles.normalValue,
                      ]}
                    >
                      {diffDays < 0
                        ? `${diffDays} (overdue)`
                        : diffDays === 0
                        ? '0 (due today)'
                        : `${diffDays} days left`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Section 2: Charges */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Charges</Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Total interest</Text>
                    <Text style={styles.tableValue}>{fmtDec(totalInterest)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Processing fee</Text>
                    <Text style={styles.tableValue}>{fmt(procFee)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Document charge</Text>
                    <Text style={styles.tableValue}>{fmt(docCharge)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Insurance charge</Text>
                    <Text style={styles.tableValue}>{fmt(insCharge)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Total charges</Text>
                    <Text style={[styles.tableValue, { fontWeight: '800' }]}>{fmtDec(totalCharges)}</Text>
                  </View>
                </View>
              </View>

              {/* Section 3: Repayment */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Repayment</Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Total payable</Text>
                    <Text style={styles.tableValue}>{fmtDec(totalPayable)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Paid so far</Text>
                    <Text style={styles.tableValue}>{fmtDec(totalPaid)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Penalty collected</Text>
                    <Text style={styles.tableValue}>{fmt(penaltyCollected)}</Text>
                  </View>
                  <View style={styles.rowDivider} />

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Outstanding balance</Text>
                    <Text style={[styles.tableValue, { fontWeight: '800' }]}>
                      {fmtDec(outstandingBalance)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* ─── TAB 2: PAYMENTS ─── */
            <View style={styles.tabSectionContainer}>
              {payments.length === 0 ? (
                <View style={styles.emptyPaymentsBox}>
                  <Ionicons
                    name="receipt-outline"
                    size={42}
                    color={isDark ? '#475569' : '#cbd5e1'}
                  />
                  <Text style={styles.emptyPaymentsTitle}>No payments recorded yet</Text>
                  <Text style={styles.emptyPaymentsSub}>
                    Use the 'Record payment' button below to log cash, UPI, or bank payments.
                  </Text>
                </View>
              ) : (
                payments.map((p, index) => {
                  const paymentTitle = `${p.PaymentType || 'Repayment'} · ${fmt(p.TotalPaidAmount)}`;
                  const paymentSubtitle = `${formatLoanDate(p.PaymentDate)} · ${p.PaymentMethod || 'Cash'}`;

                  return (
                    <View key={p.PaymentId || index} style={styles.paymentCard}>
                      {/* Card Header with Rupee Icon */}
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentIconBox}>
                          <Ionicons name="cash-outline" size={18} color="#16a34a" />
                        </View>
                        <View style={styles.paymentTitleBox}>
                          <Text style={styles.paymentTitle} numberOfLines={1}>
                            {paymentTitle}
                          </Text>
                          <Text style={styles.paymentSub} numberOfLines={1}>
                            {paymentSubtitle}
                          </Text>
                        </View>
                      </View>

                      {/* Payment Breakdown Rows */}
                      <View style={styles.paymentTable}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Principal</Text>
                          <Text style={styles.paymentVal}>{fmt(p.PrincipalAmount || 0)}</Text>
                        </View>
                        <View style={styles.rowDivider} />

                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Interest</Text>
                          <Text style={styles.paymentVal}>{fmt(p.InterestAmount || 0)}</Text>
                        </View>
                        <View style={styles.rowDivider} />

                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Penalty</Text>
                          <Text style={styles.paymentVal}>{fmt(p.PenaltyAmount || 0)}</Text>
                        </View>
                        <View style={styles.rowDivider} />

                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Total paid</Text>
                          <Text style={[styles.paymentVal, { fontWeight: '800' }]}>
                            {fmt(p.TotalPaidAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.rowDivider} />

                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment method</Text>
                          <Text style={styles.paymentVal}>{p.PaymentMethod || 'Cash'}</Text>
                        </View>
                        <View style={styles.rowDivider} />

                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Transaction reference</Text>
                          <Text style={styles.paymentVal}>
                            {p.TransactionReference || '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* ─── 4. STICKY BOTTOM ACTION BAR (Both tabs) ─── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.closeReleaseBtn}
            onPress={handleCloseAndRelease}
            activeOpacity={0.8}
            accessibilityLabel="Close and Release Loan"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={isDark ? '#f8fafc' : '#0f172a'}
            />
            <Text style={styles.closeReleaseText}>Close and Release</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recordPayBtn}
            onPress={() => setShowPayModal(true)}
            activeOpacity={0.85}
            accessibilityLabel="Record Payment"
          >
            <Ionicons name="card-outline" size={17} color="#ffffff" />
            <Text style={styles.recordPayText}>Record payment</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 5. RECORD PAYMENT MODAL ─── */}
        <Modal visible={showPayModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Repayment ({loan.LoanNumber})</Text>
                <TouchableOpacity onPress={() => setShowPayModal(false)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Repayment Type */}
                <View style={styles.field}>
                  <Text style={styles.label}>Repayment Type</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Interest', 'Principal', 'Part_Payment', 'Penalty'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.statusBtn, payType === t && styles.statusBtnActive]}
                        onPress={() => setPayType(t)}
                      >
                        <Text
                          style={[styles.statusBtnText, payType === t && styles.statusBtnTextActive]}
                        >
                          {t.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.field}>
                  <Text style={styles.label}>Amount Paid (₹) *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: 16, fontWeight: '700', color: colors.success }]}
                    placeholder="e.g. 2100"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="number-pad"
                    value={payAmount}
                    onChangeText={setPayAmount}
                  />
                </View>

                {/* Payment Method */}
                <View style={styles.field}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Cash', 'UPI', 'Net Banking'] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.statusBtn, payMethod === m && styles.statusBtnActive]}
                        onPress={() => setPayMethod(m)}
                      >
                        <Text
                          style={[styles.statusBtnText, payMethod === m && styles.statusBtnTextActive]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Reference */}
                <View style={styles.field}>
                  <Text style={styles.label}>Transaction Reference / UTR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. UPI/50291039120"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={payReference}
                    onChangeText={setPayReference}
                  />
                </View>

                {/* Remarks */}
                <View style={styles.field}>
                  <Text style={styles.label}>Remarks</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Payment notes..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    multiline
                    numberOfLines={2}
                    value={payRemarks}
                    onChangeText={setPayRemarks}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: '#0284c7' }]}
                  onPress={handleRecordPayment}
                  disabled={submittingPay}
                >
                  {submittingPay ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#d8edfa',
    },
    rootContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },

    // ─── 1. TOP HEADER ───
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 10 : 6,
      paddingBottom: 8,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
    },
    backBtn: {
      padding: 6,
      marginRight: 8,
      marginLeft: -6,
    },
    headerTitles: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 11.5,
      color: isDark ? '#94a3b8' : '#475569',
      marginTop: 1,
    },

    // ─── 2. HERO BALANCE CARD ───
    heroWrapper: {
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    balanceCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      padding: 14,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.9)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    balanceTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceLabel: {
      fontSize: 11.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3.5,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 12,
    },
    badgeOverdue: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fee4e2',
    },
    badgeActive: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7',
    },
    badgeClosed: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.18)' : '#f1f5f9',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgeTextOverdue: {
      color: '#d92d20',
    },
    badgeTextActive: {
      color: '#16a34a',
    },
    badgeTextClosed: {
      color: '#64748b',
    },
    balanceAmount: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 4,
      marginBottom: 8,
      letterSpacing: -0.4,
    },
    paidProgressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    paidProgressText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    paidProgressPercent: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    dueStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dueStatusText: {
      fontSize: 11.5,
      fontWeight: '600',
    },
    dueStatusTextOverdue: {
      color: '#d92d20',
    },
    dueStatusTextActive: {
      color: '#d97706',
    },

    // ─── 3. BODY SCROLL ───
    bodyScroll: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },
    bodyContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 90,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },

    // Borrower card
    borrowerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      padding: 12,
      marginBottom: 14,
    },
    borrowerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    borrowerAvatarText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#0284c7',
    },
    borrowerInfo: {
      flex: 1,
    },
    borrowerName: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    borrowerSub: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },

    // Tab buttons
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#e2e8f0',
      marginBottom: 16,
    },
    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      position: 'relative',
    },
    tabButtonActive: {},
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    tabTextActive: {
      color: '#0284c7',
      fontWeight: '700',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 16,
      right: 16,
      height: 2.5,
      backgroundColor: '#0284c7',
      borderRadius: 2,
    },

    // Sections
    tabSectionContainer: {
      gap: 16,
    },
    sectionBlock: {},
    sectionHeading: {
      fontSize: 14.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#1e293b',
      marginBottom: 8,
    },
    tableCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    rowDivider: {
      height: 1,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
    },
    tableLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    tableValue: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    overdueValue: {
      color: '#d92d20',
      fontWeight: '700',
    },
    normalValue: {
      color: isDark ? '#f8fafc' : '#0f172a',
      fontWeight: '600',
    },

    // Payments Tab Card
    emptyPaymentsBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyPaymentsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 10,
    },
    emptyPaymentsSub: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      marginTop: 4,
    },
    paymentCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
      marginBottom: 12,
    },
    paymentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    },
    paymentIconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    paymentTitleBox: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    paymentSub: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },
    paymentTable: {},
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    paymentLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    paymentVal: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },

    // ─── 4. BOTTOM BAR ───
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#e2e8f0',
      gap: 12,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    closeReleaseBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? '#334155' : '#eaecf0',
    },
    closeReleaseText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    recordPayBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#0077c8',
    },
    recordPayText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },

    // ─── 5. MODAL ───
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 540,
      maxHeight: '90%',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#e2e8f0',
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    modalBody: {
      padding: 16,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#e2e8f0',
      gap: 10,
    },
    cancelBtn: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    saveBtn: {
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    field: {
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 4,
    },
    input: {
      height: 42,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    },
    multilineInput: {
      height: 56,
      paddingTop: 8,
      textAlignVertical: 'top',
    },
    statusToggleRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
      height: 40,
    },
    statusBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    statusBtnActive: {
      backgroundColor: '#0284c7',
    },
    statusBtnText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    statusBtnTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // Error / Empty box
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 12,
    },
    backLinkBtn: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#0284c7',
    },
    backLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
