import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { LoanFilterType, LoanListView } from '../../components/loans/LoanListView';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { Loan } from '../../types';

export default function LoansScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<LoanFilterType>('All');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Form State
  const [form, setForm] = useState({
    LoanNumber: '',
    UserId: '',
    BankAccountId: '',
    LoanDate: new Date().toISOString().split('T')[0],
    DueDate: '',
    LoanPeriod: '12 Months',
    LoanAmount: '150000',
    InterestRate: '9.5',
    InterestType: 'Simple' as 'Simple' | 'Compound',
    ProcessingFee: '750',
    DocumentCharge: '250',
    InsuranceCharge: '500',
    GrossWeight: '',
    NetWeight: '',
    Remarks: '',
  });

  const [selectedOrnIds, setSelectedOrnIds] = useState<string[]>([]);

  // Repayment form state
  const [payForm, setPayForm] = useState({
    Amount: '',
    PaymentDate: new Date().toISOString().split('T')[0],
    Type: 'Interest' as 'Interest' | 'Principal' | 'Part_Payment',
    Method: 'UPI' as 'UPI' | 'Net Banking' | 'Cash',
    Reference: '',
    Remarks: '',
  });

  const amount = parseFloat(form.LoanAmount) || 0;
  const procFee = parseFloat(form.ProcessingFee) || 0;
  const docCharge = parseFloat(form.DocumentCharge) || 0;
  const insCharge = parseFloat(form.InsuranceCharge) || 0;
  const rate = parseFloat(form.InterestRate) || 0;

  // Auto Calculations
  const disbursementDeductions = procFee + docCharge + insCharge;
  const netDisbursement = Math.max(0, amount - disbursementDeductions);

  // Interest calculation
  const months = parseFloat(form.LoanPeriod) || 12;
  let interest = 0;
  if (amount > 0 && rate > 0) {
    if (form.InterestType === 'Compound') {
      const monthlyRate = rate / (12 * 100);
      interest = Math.round((amount * Math.pow(1 + monthlyRate, months) - amount) * 100) / 100;
    } else {
      interest = Math.round((amount * (rate / 100) * (months / 12)) * 100) / 100;
    }
  }
  const totalCharges = interest + procFee;

  // Ornaments available for this loan contract
  const availableOrns = store.ornaments.filter((o) => {
    if (form.UserId && o.UserId && o.UserId !== form.UserId) return false;
    if (isEditing && editingLoan?.ornamentIds?.includes(o.OrnamentId)) return true;
    if (selectedOrnIds.includes(o.OrnamentId)) return true;
    return o.Status === 'Available';
  });
  const selectedOrnsList = store.ornaments.filter((o) => selectedOrnIds.includes(o.OrnamentId));
  const totalGrossWeight = selectedOrnsList.reduce((s, o) => s + (Number(o.GrossWeight) || 0), 0);
  const totalNetWeight = selectedOrnsList.reduce((s, o) => s + (Number(o.NetWeight) || Number(o.MetalWeight) || 0), 0);

  // User bank accounts & limits
  const userBanks = store.bankAccounts.filter((b) => b.UserId === form.UserId && b.Status === 'Active');
  const selectedBank = userBanks.find((b) => b.BankAccountId === form.BankAccountId) || userBanks[0];
  const maxLimit = selectedBank ? Number(selectedBank.MaxLoanAmount || 0) : 0;
  const activeLoansForBank = store.loans.filter(
    (l) =>
      l.LoanStatus === 'Active' &&
      l.UserId === form.UserId &&
      l.BankAccountId === (form.BankAccountId || selectedBank?.BankAccountId) &&
      (!isEditing || l.LoanId !== editingLoan?.LoanId)
  );
  const utilLimit = activeLoansForBank.reduce((sum, l) => sum + (Number(l.LoanAmount) || 0), 0);
  const availLimit = maxLimit > 0 ? Math.max(0, maxLimit - utilLimit) : 0;

  // Pre-calculate ornaments count map for all loans
  const ornamentsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of store.loans) {
      let count = l.ornamentIds?.length || 0;
      if (count === 0) {
        const matched = store.ornaments.filter(
          (o) =>
            (o.ReleasedLoanId && o.ReleasedLoanId === l.LoanId) ||
            (o.LoanNumber && o.LoanNumber === l.LoanNumber)
        ).length;
        count = matched > 0 ? matched : 1;
      }
      map.set(l.LoanId, count);
    }
    return map;
  }, [store.loans, store.ornaments]);

  const toggleOrnSelection = (id: string) => {
    setSelectedOrnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingLoan(null);
    setSelectedLoan(null);
    const initialUser = store.users[0]?.UserId || '';
    const initialBank = store.bankAccounts.find((b) => b.UserId === initialUser)?.BankAccountId || '';
    const date = new Date();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 12);

    setForm({
      LoanNumber: `LN-${new Date().getFullYear()}-${String(store.loans.length + 1).padStart(3, '0')}`,
      UserId: initialUser,
      BankAccountId: initialBank,
      LoanDate: date.toISOString().split('T')[0],
      DueDate: dueDate.toISOString().split('T')[0],
      LoanPeriod: '12 Months',
      LoanAmount: '150000',
      InterestRate: '9.5',
      InterestType: 'Simple',
      ProcessingFee: '750',
      DocumentCharge: '250',
      InsuranceCharge: '500',
      GrossWeight: '',
      NetWeight: '',
      Remarks: '',
    });
    const candidateInitial = store.ornaments.filter(
      (o) => o.Status === 'Available' && (!initialUser || o.UserId === initialUser)
    );
    setSelectedOrnIds(candidateInitial.slice(0, 1).map((o) => o.OrnamentId));
    setModalVisible(true);
  };

  const openEditModal = (l: Loan) => {
    setIsEditing(true);
    setEditingLoan(l);
    setSelectedLoan(l);

    let currentPledgedIds = l.ornamentIds ? [...l.ornamentIds] : [];
    if (currentPledgedIds.length === 0) {
      const userPledged = store.ornaments
        .filter((o) => o.UserId === l.UserId && (o.ReleasedLoanId === l.LoanId || o.Status === 'Pledged'))
        .map((o) => o.OrnamentId);
      if (userPledged.length > 0) {
        currentPledgedIds = userPledged;
      }
    }

    setForm({
      LoanNumber: l.LoanNumber || '',
      UserId: l.UserId || '',
      BankAccountId: l.BankAccountId || '',
      LoanDate: l.LoanDate || new Date().toISOString().split('T')[0],
      DueDate: l.DueDate || '',
      LoanPeriod: l.LoanPeriod || '12 Months',
      LoanAmount: String(l.LoanAmount || ''),
      InterestRate: String(l.InterestRate ?? '9.5'),
      InterestType: (l.InterestType as any) || 'Simple',
      ProcessingFee: String(l.ProcessingFee ?? '0'),
      DocumentCharge: String(l.DocumentCharge ?? '0'),
      InsuranceCharge: String(l.InsuranceCharge ?? '0'),
      GrossWeight: l.GrossWeight ? String(l.GrossWeight) : '',
      NetWeight: l.NetWeight ? String(l.NetWeight) : '',
      Remarks: l.Remarks || '',
    });

    setSelectedOrnIds(currentPledgedIds);
    setModalVisible(true);
  };

  const openDetailModal = (l: Loan) => {
    setSelectedLoan(l);
    router.push(`/loans/${l.LoanId}` as any);
  };

  const openPayModal = (l: Loan) => {
    setSelectedLoan(l);
    setPayForm({
      Amount: '',
      PaymentDate: new Date().toISOString().split('T')[0],
      Type: 'Interest',
      Method: 'UPI',
      Reference: '',
      Remarks: '',
    });
    setPayModalVisible(true);
  };

  const handleSaveLoan = () => {
    if (!form.UserId) {
      Alert.alert('Validation Error', 'Please select a borrower.');
      return;
    }
    if (!form.BankAccountId) {
      Alert.alert('Validation Error', 'Please select a lending bank account.');
      return;
    }
    if (selectedOrnIds.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one gold ornament to pledge.');
      return;
    }
    if (amount <= 0) {
      Alert.alert('Validation Error', 'Loan Amount must be greater than 0.');
      return;
    }
    if (availLimit > 0 && amount > availLimit) {
      Alert.alert(
        'Bank Limit Exceeded',
        `Loan Amount ₹${amount.toLocaleString()} exceeds available limit of ₹${availLimit.toLocaleString()} for ${selectedBank?.BankName}.`
      );
      return;
    }

    const finalGross = parseFloat(form.GrossWeight) > 0 ? parseFloat(form.GrossWeight) : totalGrossWeight;
    const finalNet = parseFloat(form.NetWeight) > 0 ? parseFloat(form.NetWeight) : totalNetWeight;

    if (isEditing && editingLoan) {
      store.updateLoan(editingLoan.LoanId, {
        ...form,
        LoanAmount: amount,
        InterestRate: rate,
        BankName: selectedBank?.BankName || editingLoan.BankName || 'Bank',
        GrossWeight: finalGross,
        NetWeight: finalNet,
        ProcessingFee: procFee,
        DocumentCharge: docCharge,
        InsuranceCharge: insCharge,
        TotalCharges: totalCharges,
        NetDisbursementAmount: netDisbursement,
        ornamentIds: selectedOrnIds,
      });

      Alert.alert('Success', 'Loan contract updated successfully!');
      toast.success(`Loan ${form.LoanNumber} updated successfully!`);
      setModalVisible(false);
    } else {
      store.addLoan({
        ...form,
        LoanAmount: amount,
        InterestRate: rate,
        BankName: selectedBank?.BankName || 'Bank',
        GrossWeight: finalGross,
        NetWeight: finalNet,
        ProcessingFee: procFee,
        DocumentCharge: docCharge,
        InsuranceCharge: insCharge,
        TotalCharges: totalCharges,
        NetDisbursementAmount: netDisbursement,
        ornamentIds: selectedOrnIds,
      });

      Alert.alert('Success', 'Loan contract created and ornaments pledged!');
      toast.success(`Loan ${form.LoanNumber} created successfully!`);
      setModalVisible(false);
    }
  };

  const handleSavePayment = () => {
    const payAmt = parseFloat(payForm.Amount) || 0;
    if (payAmt <= 0) {
      Alert.alert('Validation Error', 'Please enter payment amount greater than ₹0.');
      return;
    }
    if (!selectedLoan) return;

    store.addPayment({
      LoanId: selectedLoan.LoanId,
      PaymentDate: payForm.PaymentDate || new Date().toISOString().split('T')[0],
      PaymentType: payForm.Type,
      PrincipalAmount: payForm.Type === 'Principal' ? payAmt : 0,
      InterestAmount: payForm.Type === 'Interest' ? payAmt : 0,
      TotalPaidAmount: payAmt,
      PaymentMethod: payForm.Method,
      TransactionReference: payForm.Reference,
      Remarks: payForm.Remarks,
    });

    Alert.alert('Success', `Repayment of ₹${payAmt.toLocaleString()} recorded.`);
    toast.success(`Repayment of ₹${payAmt.toLocaleString()} recorded.`);
    setPayModalVisible(false);
  };

  const getUserName = (userId: string) => {
    return store.users.find((u) => u.UserId === userId)?.FullName || userId;
  };

  return (
    <View style={styles.screenWrapper}>
      {/* ─── MAIN LOANS LIST VIEW (Exact Layout matching the screenshot) ─── */}
      <LoanListView
        loans={store.loans}
        users={store.users}
        payments={store.payments}
        ornamentsCountMap={ornamentsCountMap}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoanPress={openDetailModal}
        onAddPress={isSuperAdmin ? () => router.push('/loans/new' as any) : undefined}
        onEditPress={isSuperAdmin ? openEditModal : undefined}
        onPayPress={isSuperAdmin ? openPayModal : undefined}
      />

      {/* ─── ADD / EDIT LOAN MODAL ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? `Edit Loan (${editingLoan?.LoanNumber})` : 'Originate New Loan'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Step 1: Select User */}
              <View style={styles.field}>
                <Text style={styles.label}>1. {isEditing ? 'Borrower (Locked)' : 'Select Borrower *'}</Text>
                {isEditing ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={20}
                      color={colors.primaryDark}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                      {getUserName(form.UserId)}
                    </Text>
                  </View>
                ) : store.users.length === 0 ? (
                  <View style={{ backgroundColor: colors.warningBg, padding: 10, borderRadius: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '500' }}>
                      ⚠️ No borrowers registered yet. Please add a customer in the Users tab first.
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {store.users.map((u) => (
                      <TouchableOpacity
                        key={u.UserId}
                        style={[styles.userChip, form.UserId === u.UserId && styles.userChipActive]}
                        onPress={() => {
                          const bank = store.bankAccounts.find((b) => b.UserId === u.UserId)?.BankAccountId || '';
                          setForm((p) => ({ ...p, UserId: u.UserId, BankAccountId: bank }));
                        }}
                      >
                        <Text style={[styles.userChipText, form.UserId === u.UserId && styles.userChipTextActive]}>
                          {u.FullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Step 2: Select Bank Account with headroom */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  2. Select Bank Account (Headroom: ₹{availLimit.toLocaleString()}) *
                </Text>
                {userBanks.length === 0 ? (
                  <Text style={styles.warnText}>No bank account registered for this borrower.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {userBanks.map((b) => {
                      const av = Math.max(0, (Number(b.MaxLoanAmount) || 0) - (Number(b.UtilizedLoanAmount) || 0));
                      return (
                        <TouchableOpacity
                          key={b.BankAccountId}
                          style={[styles.userChip, form.BankAccountId === b.BankAccountId && styles.userChipActive]}
                          onPress={() => setForm((p) => ({ ...p, BankAccountId: b.BankAccountId }))}
                        >
                          <Text
                            style={[
                              styles.userChipText,
                              form.BankAccountId === b.BankAccountId && styles.userChipTextActive,
                            ]}
                          >
                            {b.BankName} (Avail: ₹{av.toLocaleString()})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Step 3: Select Ornaments to Pledge */}
              <View style={styles.field}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.label}>3. Pledged Ornaments ({selectedOrnIds.length})</Text>
                  <Text style={[styles.label, { color: colors.primaryDark }]}>
                    Net Gold: {totalNetWeight.toFixed(2)}g (Gross: {totalGrossWeight.toFixed(2)}g)
                  </Text>
                </View>

                {availableOrns.length === 0 ? (
                  <Text style={styles.warnText}>No available ornaments in inventory to pledge.</Text>
                ) : (
                  availableOrns.map((o) => {
                    const checked = selectedOrnIds.includes(o.OrnamentId);
                    const isCurrentlyPledgedToThis = isEditing && editingLoan?.ornamentIds?.includes(o.OrnamentId);
                    return (
                      <TouchableOpacity
                        key={o.OrnamentId}
                        style={[styles.ornSelectRow, checked && styles.ornSelectRowActive]}
                        onPress={() => toggleOrnSelection(o.OrnamentId)}
                      >
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={checked ? colors.primaryDark : colors.textMuted}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.ornSelectTitle}>{o.OrnamentName}</Text>
                            {isCurrentlyPledgedToThis ? (
                              <View
                                style={{
                                  backgroundColor: isDark ? '#143823' : '#dcfce7',
                                  paddingHorizontal: 5,
                                  paddingVertical: 1,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success }}>Pledged</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.ornSelectSub}>
                            {o.Purity} • Net: {Number(o.NetWeight || o.MetalWeight || 0).toFixed(2)}g • Val: ₹
                            {(o.MarketValue || 0).toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Step 4: Loan Amount & Terms */}
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Loan Amount (₹) *</Text>
                  <TextInput
                    style={[styles.input, { fontWeight: '700', fontSize: 16, color: colors.primaryDark }]}
                    keyboardType="number-pad"
                    value={form.LoanAmount}
                    onChangeText={(v) => setForm((p) => ({ ...p, LoanAmount: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Interest Rate (% p.a.)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={form.InterestRate}
                    onChangeText={(v) => setForm((p) => ({ ...p, InterestRate: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Tenure</Text>
                  <TextInput
                    style={styles.input}
                    value={form.LoanPeriod}
                    onChangeText={(v) => setForm((p) => ({ ...p, LoanPeriod: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Interest Type</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Simple', 'Compound'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.statusBtn, form.InterestType === t && styles.statusBtnActive]}
                        onPress={() => setForm((p) => ({ ...p, InterestType: t }))}
                      >
                        <Text style={[styles.statusBtnText, form.InterestType === t && styles.statusBtnTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Loan Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={form.LoanDate}
                    onChangeText={(v) => setForm((p) => ({ ...p, LoanDate: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Due Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={form.DueDate}
                    onChangeText={(v) => setForm((p) => ({ ...p, DueDate: v }))}
                  />
                </View>
              </View>

              {/* Deductions & Net Disbursement */}
              <View style={styles.calcBox}>
                <Text style={styles.calcBoxTitle}>Deductions & Net Disbursement</Text>
                <View style={styles.formRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Processing Fee (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.ProcessingFee}
                      onChangeText={(v) => setForm((p) => ({ ...p, ProcessingFee: v }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Document Charge (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.DocumentCharge}
                      onChangeText={(v) => setForm((p) => ({ ...p, DocumentCharge: v }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Insurance Charge (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.InsuranceCharge}
                      onChangeText={(v) => setForm((p) => ({ ...p, InsuranceCharge: v }))}
                    />
                  </View>
                </View>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { fontWeight: '700' }]}>Net Disbursement to Borrower:</Text>
                  <Text style={[styles.calcVal, { color: colors.primaryDark, fontSize: 16 }]}>
                    ₹{netDisbursement.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Estimated Period Interest ({months} mos):</Text>
                  <Text style={styles.calcVal}>₹{interest.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Gross Weight (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={totalGrossWeight > 0 ? totalGrossWeight.toFixed(3) : '0.000'}
                    keyboardType="decimal-pad"
                    value={form.GrossWeight}
                    onChangeText={(v) => setForm((p) => ({ ...p, GrossWeight: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Net Weight (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={totalNetWeight > 0 ? totalNetWeight.toFixed(3) : '0.000'}
                    keyboardType="decimal-pad"
                    value={form.NetWeight}
                    onChangeText={(v) => setForm((p) => ({ ...p, NetWeight: v }))}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Additional notes for this loan..."
                  multiline
                  numberOfLines={2}
                  value={form.Remarks}
                  onChangeText={(v) => setForm((p) => ({ ...p, Remarks: v }))}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan}>
                <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Disburse & Pledge'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── RECORD REPAYMENT MODAL ─── */}
      <Modal visible={payModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Repayment ({selectedLoan?.LoanNumber})</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>Repayment Type</Text>
                <View style={styles.statusToggleRow}>
                  {(['Interest', 'Principal', 'Part_Payment'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.statusBtn, payForm.Type === t && styles.statusBtnActive]}
                      onPress={() => setPayForm((p) => ({ ...p, Type: t }))}
                    >
                      <Text style={[styles.statusBtnText, payForm.Type === t && styles.statusBtnTextActive]}>
                        {t.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Amount Paid (₹) *</Text>
                <TextInput
                  style={[styles.input, { fontSize: 16, fontWeight: '700', color: colors.success }]}
                  placeholder="e.g. 1500"
                  keyboardType="number-pad"
                  value={payForm.Amount}
                  onChangeText={(v) => setPayForm((p) => ({ ...p, Amount: v }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.statusToggleRow}>
                  {(['UPI', 'Net Banking', 'Cash'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.statusBtn, payForm.Method === m && styles.statusBtnActive]}
                      onPress={() => setPayForm((p) => ({ ...p, Method: m }))}
                    >
                      <Text style={[styles.statusBtnText, payForm.Method === m && styles.statusBtnTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Payment Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={payForm.PaymentDate}
                    onChangeText={(v) => setPayForm((p) => ({ ...p, PaymentDate: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Transaction Reference / UTR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. UPI/50291039120"
                    value={payForm.Reference}
                    onChangeText={(v) => setPayForm((p) => ({ ...p, Reference: v }))}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Payment notes..."
                  multiline
                  numberOfLines={2}
                  value={payForm.Remarks}
                  onChangeText={(v) => setPayForm((p) => ({ ...p, Remarks: v }))}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.success }]}
                onPress={handleSavePayment}
              >
                <Text style={styles.saveBtnText}>Save Repayment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── VIEW LOAN DETAIL MODAL ─── */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Loan Details ({selectedLoan?.LoanNumber})</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedLoan ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailName}>{selectedLoan.LoanNumber}</Text>
                  <Text style={styles.detailCode}>
                    Borrower: {getUserName(selectedLoan.UserId)} • Bank: {selectedLoan.BankName}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <Badge
                      label={selectedLoan.LoanStatus}
                      variant={selectedLoan.LoanStatus === 'Active' ? 'success' : 'info'}
                    />
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Contract Financials</Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Principal Amount:</Text> ₹{selectedLoan.LoanAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Net Disbursed:</Text> ₹
                    {(selectedLoan.NetDisbursementAmount || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Interest Rate:</Text> {selectedLoan.InterestRate}% (
                    {selectedLoan.InterestType || 'Simple'})
                  </Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Loan Period:</Text> {selectedLoan.LoanPeriod || 'N/A'}
                  </Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Loan Date → Due Date:</Text> {selectedLoan.LoanDate} ➔{' '}
                    {selectedLoan.DueDate || 'N/A'}
                  </Text>
                  <Text style={styles.detailRowText}>
                    <Text style={styles.bold}>Pledged Gold Net:</Text> {Number(selectedLoan.NetWeight || 0).toFixed(2)} g
                    (Gross: {Number(selectedLoan.GrossWeight || 0).toFixed(2)} g)
                  </Text>
                  {selectedLoan.ProcessingFee ? (
                    <Text style={styles.detailRowText}>
                      <Text style={styles.bold}>Processing Fee:</Text> ₹
                      {Number(selectedLoan.ProcessingFee).toLocaleString()}
                    </Text>
                  ) : null}
                  {selectedLoan.TotalCharges ? (
                    <Text style={styles.detailRowText}>
                      <Text style={styles.bold}>Total Charges:</Text> ₹
                      {Number(selectedLoan.TotalCharges).toLocaleString()}
                    </Text>
                  ) : null}
                  {selectedLoan.Remarks ? (
                    <Text style={styles.detailRowText}>
                      <Text style={styles.bold}>Remarks:</Text> {selectedLoan.Remarks}
                    </Text>
                  ) : null}
                </View>

                {/* Repayment History */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Repayment History</Text>
                  {(() => {
                    const loanPayments = store.payments.filter((p) => p.LoanId === selectedLoan.LoanId);
                    const totalPaid = loanPayments.reduce((s, p) => s + (p.TotalPaidAmount || 0), 0);
                    if (loanPayments.length === 0)
                      return <Text style={styles.emptyNotice}>No repayments logged for this loan.</Text>;
                    return (
                      <>
                        {loanPayments.map((p, idx) => (
                          <View key={p.PaymentId || idx} style={styles.payHistRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.payHistTitle}>
                                {p.PaymentDate} • {p.PaymentType}
                              </Text>
                              <Text style={styles.payHistSub}>
                                {p.PaymentMethod}
                                {p.TransactionReference ? ` (Ref: ${p.TransactionReference})` : ''}
                              </Text>
                              {p.PrincipalAmount > 0 || p.InterestAmount > 0 ? (
                                <Text style={styles.payHistSub}>
                                  {p.PrincipalAmount > 0 ? `Principal: ₹${p.PrincipalAmount.toLocaleString()} ` : ''}
                                  {p.InterestAmount > 0 ? `Interest: ₹${p.InterestAmount.toLocaleString()}` : ''}
                                </Text>
                              ) : null}
                              {p.Remarks ? <Text style={styles.payHistSub}>📝 {p.Remarks}</Text> : null}
                            </View>
                            <Text style={styles.payHistAmt}>+₹{p.TotalPaidAmount.toLocaleString()}</Text>
                          </View>
                        ))}
                        <View
                          style={[
                            styles.payHistRow,
                            { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
                          ]}
                        >
                          <Text style={[styles.payHistTitle, { color: colors.success }]}>Total Paid So Far</Text>
                          <Text style={[styles.payHistAmt, { color: colors.success }]}>
                            ₹{totalPaid.toLocaleString()}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              {isSuperAdmin && selectedLoan?.LoanStatus === 'Active' ? (
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: '#0284c7', flexDirection: 'row', alignItems: 'center', gap: 6 },
                  ]}
                  onPress={() => {
                    const l = selectedLoan;
                    setDetailModalVisible(false);
                    openEditModal(l);
                  }}
                >
                  <Ionicons name="pencil-outline" size={15} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Edit Loan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 580,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
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
      borderTopColor: colors.border,
      gap: 10,
    },
    cancelBtn: {
      paddingVertical: 9,
      paddingHorizontal: 16,
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
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: colors.primaryDark,
    },
    saveBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },

    // Form fields
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
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    multilineInput: {
      height: 60,
      paddingTop: 8,
      textAlignVertical: 'top',
    },
    warnText: {
      fontSize: 12,
      color: colors.warning,
      fontStyle: 'italic',
      marginTop: 2,
    },
    userChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      marginRight: 8,
      marginTop: 4,
    },
    userChipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primaryDark,
    },
    userChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    userChipTextActive: {
      color: colors.primaryDark,
      fontWeight: '700',
    },
    ornSelectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      marginBottom: 6,
    },
    ornSelectRowActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primaryDark,
    },
    ornSelectTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    ornSelectSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    statusToggleRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
      height: 42,
    },
    statusBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
    },
    statusBtnActive: {
      backgroundColor: colors.primaryDark,
    },
    statusBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusBtnTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    calcBox: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
    },
    calcBoxTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    calcLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    calcVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // Detail Modal Styles
    detailCard: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    detailName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    detailCode: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    detailSection: {
      marginBottom: 14,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailSecTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 4,
    },
    detailRowText: {
      fontSize: 12.5,
      color: colors.textPrimary,
      marginBottom: 5,
    },
    bold: {
      fontWeight: '700',
      color: colors.textSecondary,
    },
    emptyNotice: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
      paddingVertical: 4,
    },
    payHistRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 5,
    },
    payHistTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    payHistSub: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    payHistAmt: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.success,
    },
  });
