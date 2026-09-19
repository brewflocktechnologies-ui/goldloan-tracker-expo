import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { Loan, User, Ornament } from '../../types';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function LoanClosureScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const store = useAppStore();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [ornaments, setOrnaments] = useState<Ornament[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const lList = store.loans.filter(loan => loan.LoanStatus === 'Active');
    const uList = store.users;
    const oList = store.ornaments;
      setActiveLoans(lList);
      const uMap: Record<string, string> = {};
      uList.forEach((u: User) => {
        uMap[u.UserId] = u.FullName;
      });
      setUsers(uMap);
      setOrnaments(oList);

      if (lList.length > 0) {
        setSelectedLoanId(lList[0].LoanId);
      }
  }, [store.loans, store.users, store.ornaments]);

  const currentLoan = activeLoans.find(l => l.LoanId === selectedLoanId);
  const borrowerName = currentLoan ? (users[currentLoan.UserId] || currentLoan.UserId) : '';
  const linkedOrnaments = ornaments.filter(o => currentLoan?.ornamentIds?.includes(o.OrnamentId));

  const handleCloseLoan = async () => {
    if (!currentLoan) {
      Alert.alert('Selection', 'Please select an active loan to close.');
      return;
    }

    Alert.alert(
      'Confirm Loan Closure',
      `Are you sure you want to close ${currentLoan.LoanNumber} for ₹${currentLoan.LoanAmount.toLocaleString()} and release ${linkedOrnaments.length} pledged gold ornament(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              store.closeAndReleaseLoan(currentLoan.LoanId, remarks);

              Alert.alert('Success', `Loan ${currentLoan.LoanNumber} settled and gold ornaments released successfully!`, [
                { text: 'OK', onPress: () => router.replace('/loans') }
              ]);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="lock-closed" size={48} color={colors.warning} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Read-Only Access</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            You are logged in with read-only permissions. Closing loans and releasing vault collateral requires SuperAdmin privileges.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { alignSelf: 'center', paddingHorizontal: 24 }]}>
            <Text style={styles.closeBtnText}>Return Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Close & Release Gold Loan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step 1: Select Active Loan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Select Active Loan</Text>
          {activeLoans.length === 0 ? (
            <Text style={styles.emptyText}>No active loans available for closure.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {activeLoans.map(l => (
                <TouchableOpacity
                  key={l.LoanId}
                  style={[styles.loanChip, selectedLoanId === l.LoanId && styles.loanChipActive]}
                  onPress={() => setSelectedLoanId(l.LoanId)}
                >
                  <Text style={[styles.loanChipNum, selectedLoanId === l.LoanId && styles.loanChipNumActive]}>
                    {l.LoanNumber}
                  </Text>
                  <Text style={styles.loanChipCust}>{users[l.UserId] || l.UserId}</Text>
                  <Text style={styles.loanChipAmt}>₹{l.LoanAmount.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {currentLoan ? (
          <>
            {/* Step 2: Contract Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. Settlement Summary</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Borrower Name:</Text>
                <Text style={styles.detailVal}>{borrowerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lending Bank:</Text>
                <Text style={styles.detailVal}>{currentLoan.BankName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Principal Disbursed:</Text>
                <Text style={styles.detailVal}>₹{currentLoan.LoanAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Rate:</Text>
                <Text style={styles.detailVal}>{currentLoan.InterestRate}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Origination Date:</Text>
                <Text style={styles.detailVal}>{currentLoan.LoanDate}</Text>
              </View>
            </View>

            {/* Step 3: Ornaments to be Released */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                3. Gold Items to Release ({linkedOrnaments.length})
              </Text>
              {linkedOrnaments.length === 0 ? (
                <Text style={styles.emptyText}>No linked ornaments specified for this loan.</Text>
              ) : (
                linkedOrnaments.map((o, idx) => (
                  <View key={o.OrnamentId || idx} style={styles.ornItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ornTitle}>{o.OrnamentName}</Text>
                      <Text style={styles.ornSub}>
                        {o.Purity} • Net Wt: {Number(o.NetWeight || 0).toFixed(2)}g • Val: ₹{(o.MarketValue || 0).toLocaleString()}
                      </Text>
                    </View>
                    <Badge label="To Release" variant="info" size="sm" />
                  </View>
                ))
              )}
            </View>

            {/* Step 4: Settlement & Remarks */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>4. Closure Remarks & Signature Proof</Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="e.g. Full settlement received via RTGS. Ornaments handed over in presence of branch manager."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleCloseLoan}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  <Text style={styles.closeBtnText}>Settle Loan & Handover Gold</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
  },
  loanChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    minWidth: 140,
  },
  loanChipActive: {
    backgroundColor: isDark ? '#1e293b' : '#fffbeb',
    borderColor: colors.primary,
  },
  loanChipNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  loanChipNumActive: {
    color: colors.primaryDark,
  },
  loanChipCust: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  loanChipAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ornItem: {
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
  remarksInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    gap: 8,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
