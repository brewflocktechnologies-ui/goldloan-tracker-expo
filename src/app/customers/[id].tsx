import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { User, BankAccount, Ornament, Loan } from '../../types';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useAppStore();

  const [user, setUser] = useState<User | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [ornaments, setOrnaments] = useState<Ornament[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Bank Account Form State
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    BankName: 'State Bank of India',
    AccountNumber: '',
    IFSCCode: '',
    MaxLoanAmount: '500000',
  });
  const [submittingBank, setSubmittingBank] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const users = store.users;
      const banks = store.bankAccounts.filter(bank => bank.UserId === id);
      const orns = store.ornaments.filter(ornament => ornament.UserId === id);
      const loanList = store.loans.filter(loan => loan.UserId === id);
      const found = users.find(u => u.UserId === id);
      setUser(found || null);
      setBankAccounts(banks);
      setOrnaments(orns);
      setLoans(loanList);
    } catch (e) {
      console.error('Error loading customer detail:', e);
    } finally {
      setLoading(false);
    }
  }, [id, store.users, store.bankAccounts, store.ornaments, store.loans]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddBank = async () => {
    if (!bankForm.AccountNumber.trim() || !bankForm.BankName.trim()) {
      Alert.alert('Validation Error', 'Bank Name and Account Number are required.');
      return;
    }
    setSubmittingBank(true);
    try {
      store.addBankAccount({
        UserId: id,
        AccountHolderName: user?.FullName || 'Account Holder',
        BankName: bankForm.BankName,
        AccountNumber: bankForm.AccountNumber,
        IFSCCode: bankForm.IFSCCode,
        MaxLoanAmount: parseFloat(bankForm.MaxLoanAmount) || 0,
      });
      setShowAddBank(false);
      setBankForm({ BankName: 'State Bank of India', AccountNumber: '', IFSCCode: '', MaxLoanAmount: '500000' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingBank(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.notFoundText}>Customer not found</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
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
        <Text style={styles.headerTitle}>Customer Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{user.FullName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.nameLarge}>{user.FullName}</Text>
          {user.CustomerCode ? (
            <Badge label={user.CustomerCode} variant="gold" />
          ) : null}

          <View style={styles.profileInfoList}>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={14} color={isDark ? '#fbbf24' : colors.primaryDark} />
              <Text style={styles.infoText}>{user.MobileNumber}</Text>
            </View>
            {user.Email ? (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{user.Email}</Text>
              </View>
            ) : null}
            {user.AddressLine1 ? (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{user.AddressLine1}, {user.City} {user.Pincode}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="card" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>Aadhaar: {user.AadhaarNumber || 'N/A'} • PAN: {user.PANNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Bank Accounts Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bank Accounts ({bankAccounts.length})</Text>
            <TouchableOpacity onPress={() => setShowAddBank(!showAddBank)}>
              <Text style={styles.addBtnText}>{showAddBank ? 'Cancel' : '+ Add Bank'}</Text>
            </TouchableOpacity>
          </View>

          {showAddBank ? (
            <View style={styles.addBankBox}>
              <Text style={styles.formSubtitle}>New Bank Account for {user.FullName}</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Bank Name (e.g. HDFC Bank, SBI)"
                value={bankForm.BankName}
                onChangeText={v => setBankForm(p => ({ ...p, BankName: v }))}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Account Number"
                keyboardType="number-pad"
                value={bankForm.AccountNumber}
                onChangeText={v => setBankForm(p => ({ ...p, AccountNumber: v }))}
              />
              <TextInput
                style={styles.formInput}
                placeholder="IFSC Code"
                autoCapitalize="characters"
                value={bankForm.IFSCCode}
                onChangeText={v => setBankForm(p => ({ ...p, IFSCCode: v }))}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Max Loan Limit (₹)"
                keyboardType="number-pad"
                value={bankForm.MaxLoanAmount}
                onChangeText={v => setBankForm(p => ({ ...p, MaxLoanAmount: v }))}
              />
              <TouchableOpacity 
                style={styles.saveBankBtn} 
                onPress={handleAddBank}
                disabled={submittingBank}
              >
                {submittingBank ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBankBtnText}>Save Account</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {bankAccounts.length === 0 ? (
            <Text style={styles.emptyNotice}>No bank account added yet.</Text>
          ) : (
            bankAccounts.map((acc, idx) => {
              const maxL = acc.MaxLoanAmount || 0;
              const util = acc.UtilizedLoanAmount || 0;
              const avail = Math.max(0, maxL - util);
              const pct = maxL > 0 ? Math.min(100, (util / maxL) * 100) : 0;

              return (
                <View key={acc.BankAccountId || idx} style={styles.bankItem}>
                  <View style={styles.bankTop}>
                    <Text style={styles.bankTitle}>{acc.BankName}</Text>
                    <Text style={styles.accNum}>•••• {acc.AccountNumber.slice(-4)}</Text>
                  </View>

                  <View style={styles.utilRow}>
                    <Text style={styles.utilText}>Utilized: ₹{util.toLocaleString()} / ₹{maxL.toLocaleString()}</Text>
                    <Text style={[styles.utilText, { fontWeight: '700', color: colors.success }]}>
                      Avail: ₹{avail.toLocaleString()}
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: pct > 80 ? colors.danger : colors.primary }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Customer's Loans */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loans ({loans.length})</Text>
          {loans.length === 0 ? (
            <Text style={styles.emptyNotice}>No active or past loans found.</Text>
          ) : (
            loans.map((l, idx) => (
              <TouchableOpacity 
                key={l.LoanId || idx} 
                style={styles.loanItem}
                onPress={() => router.push(`/loans/${l.LoanId}` as any)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.loanItemNumber}>{l.LoanNumber}</Text>
                  <Text style={styles.loanItemBank}>{l.BankName} • ₹{l.LoanAmount.toLocaleString()}</Text>
                </View>
                <Badge label={l.LoanStatus} variant={l.LoanStatus === 'Active' ? 'success' : 'info'} size="sm" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Customer's Ornaments */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pledged / Stored Ornaments ({ornaments.length})</Text>
          {ornaments.length === 0 ? (
            <Text style={styles.emptyNotice}>No ornaments linked to this customer.</Text>
          ) : (
            ornaments.map((o, idx) => (
              <View key={o.OrnamentId || idx} style={styles.ornItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ornTitle}>{o.OrnamentName}</Text>
                  <Text style={styles.ornSub}>
                    {o.Purity} • Net Wt: {Number(o.NetWeight || 0).toFixed(2)}g • Val: ₹{(o.MarketValue || 0).toLocaleString()}
                  </Text>
                </View>
                <Badge label={o.Status} variant={o.Status === 'Pledged' ? 'warning' : 'success'} size="sm" />
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
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#facc15',
  },
  avatarTextLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#854d0e',
  },
  nameLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  profileInfoList: {
    width: '100%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  emptyNotice: {
    fontSize: 13,
    color: colors.textMuted,
    marginVertical: 6,
  },
  addBankBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  formSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  saveBankBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBankBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  bankItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  accNum: {
    fontSize: 12,
    color: colors.textMuted,
  },
  utilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  utilText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  loanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loanItemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loanItemBank: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
});
