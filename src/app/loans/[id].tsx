import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { Loan, User, Ornament, Payment } from '../../types';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function LoanDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useAppStore();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [borrower, setBorrower] = useState<User | null>(null);
  const [ornaments, setOrnaments] = useState<Ornament[]>([]);
  const [loading, setLoading] = useState(true);

  // Repayment form state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'Interest' | 'Principal' | 'Part_Payment'>('Interest');
  const [payMethod, setPayMethod] = useState<'UPI' | 'Net Banking' | 'Cash'>('UPI');
  const [submittingPay, setSubmittingPay] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const allLoans = store.loans;
      const allUsers = store.users;
      const allOrns = store.ornaments;
      const foundLoan = allLoans.find(l => l.LoanId === id);
      setLoan(foundLoan || null);
      if (foundLoan) {
        const foundUser = allUsers.find(u => u.UserId === foundLoan.UserId);
        setBorrower(foundUser || null);
        const linkedOrns = allOrns.filter(o => foundLoan.ornamentIds?.includes(o.OrnamentId));
        setOrnaments(linkedOrns);
      }
    } catch (e) {
      console.error('Error loading loan details:', e);
    } finally {
      setLoading(false);
    }
  }, [id, store.loans, store.users, store.ornaments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordPayment = async () => {
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) {
      Alert.alert('Validation', 'Please enter a payment amount greater than ₹0.');
      return;
    }
    setSubmittingPay(true);
    try {
      store.addPayment({
        LoanId: id,
        PaymentDate: new Date().toISOString().split('T')[0],
        PaymentType: payType,
        InterestAmount: payType === 'Interest' ? amt : 0,
        PrincipalAmount: payType === 'Principal' ? amt : 0,
        TotalPaidAmount: amt,
        PaymentMethod: payMethod,
        Remarks: `Repayment recorded via Expo app`,
      });

      Alert.alert('Payment Saved', `Repayment of ₹${amt.toLocaleString()} recorded.`);
      setShowPayModal(false);
      setPayAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingPay(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Loan contract not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{loan.LoanNumber}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Main Contract Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.loanNumber}>{loan.LoanNumber}</Text>
              <Text style={styles.borrowerName}>{borrower?.FullName || 'Borrower'}</Text>
            </View>
            <Badge label={loan.LoanStatus} variant={loan.LoanStatus === 'Active' ? 'success' : 'info'} />
          </View>

          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Loan Amount</Text>
              <Text style={styles.metaValPrimary}>₹{loan.LoanAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Interest Rate</Text>
              <Text style={styles.metaVal}>{loan.InterestRate}% p.a.</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Lending Bank</Text>
              <Text style={styles.metaVal}>{loan.BankName}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaVal}>{loan.DueDate || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Disbursed Amount</Text>
              <Text style={styles.metaVal}>₹{loan.NetDisbursementAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Charges Deducted</Text>
              <Text style={styles.metaVal}>₹{loan.TotalCharges.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnPrimary]} 
            onPress={() => setShowPayModal(!showPayModal)}
          >
            <Ionicons name="card" size={18} color="#ffffff" />
            <Text style={styles.actionBtnPrimaryText}>
              {showPayModal ? 'Cancel Payment' : 'Record Repayment'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnOutline]} 
            onPress={() => router.push('/loans/closure')}
          >
            <Ionicons name="checkmark-done" size={18} color={isDark ? '#fbbf24' : colors.primaryDark} />
            <Text style={styles.actionBtnOutlineText}>Close & Release</Text>
          </TouchableOpacity>
        </View>

        {/* Record Repayment Form Inline */}
        {showPayModal ? (
          <View style={styles.payBox}>
            <Text style={styles.payBoxTitle}>Record Repayment for {loan.LoanNumber}</Text>

            <View style={styles.payTypeRow}>
              {(['Interest', 'Principal', 'Part_Payment'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.payTypeBtn, payType === t && styles.payTypeBtnActive]}
                  onPress={() => setPayType(t)}
                >
                  <Text style={[styles.payTypeBtnText, payType === t && styles.payTypeBtnTextActive]}>
                    {t.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.payInput}
              placeholder="Amount Paid (₹)"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <View style={styles.payTypeRow}>
              {(['UPI', 'Net Banking', 'Cash'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.payTypeBtn, payMethod === m && styles.payTypeBtnActive]}
                  onPress={() => setPayMethod(m)}
                >
                  <Text style={[styles.payTypeBtnText, payMethod === m && styles.payTypeBtnTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.confirmPayBtn} 
              onPress={handleRecordPayment}
              disabled={submittingPay}
            >
              {submittingPay ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmPayBtnText}>Save Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Pledged Ornaments */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pledged Gold Items ({ornaments.length})</Text>
          {ornaments.length === 0 ? (
            <Text style={styles.emptyNotice}>No ornaments mapped directly to this contract.</Text>
          ) : (
            ornaments.map((o, idx) => (
              <View key={o.OrnamentId || idx} style={styles.ornRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ornTitle}>{o.OrnamentName}</Text>
                  <Text style={styles.ornSub}>
                    {o.Purity} • Net Wt: {Number(o.NetWeight || 0).toFixed(2)}g • Val: ₹{(o.MarketValue || 0).toLocaleString()}
                  </Text>
                </View>
                <Badge label="Pledged" variant="warning" size="sm" />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  loanNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  borrowerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaValPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primaryDark,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnOutlineText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  payBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  payTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  payTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payTypeBtnActive: {
    backgroundColor: '#fef08a',
    borderColor: '#ca8a04',
  },
  payTypeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  payTypeBtnTextActive: {
    color: '#854d0e',
    fontWeight: '700',
  },
  payInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  confirmPayBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmPayBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyNotice: {
    fontSize: 13,
    color: colors.textMuted,
  },
  ornRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ornTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ornSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
