import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Modal, TextInput, Alert, SafeAreaView, Platform, RefreshControl 
} from 'react-native';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { Loan, Payment } from '../../types';
import { DataTable, Column } from '../../components/DataTable';
import { MobileCard } from '../../components/MobileCard';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function LoansScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
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

  // Auto Calculations (exact calculateLoanCharges and calculateLoanPeriodInterest from index.html)
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

  // Ornaments available for loan
  const availableOrns = store.ornaments.filter(o => o.Status === 'Available' || o.Status === 'Released');
  const selectedOrnsList = store.ornaments.filter(o => selectedOrnIds.includes(o.OrnamentId));
  const totalGrossWeight = selectedOrnsList.reduce((s, o) => s + (Number(o.GrossWeight) || 0), 0);
  const totalNetWeight = selectedOrnsList.reduce((s, o) => s + (Number(o.NetWeight) || Number(o.MetalWeight) || 0), 0);

  // User bank accounts & limits
  const userBanks = store.bankAccounts.filter(b => b.UserId === form.UserId && b.Status === 'Active');
  const selectedBank = userBanks.find(b => b.BankAccountId === form.BankAccountId) || userBanks[0];
  const maxLimit = selectedBank ? Number(selectedBank.MaxLoanAmount || 0) : 0;
  const utilLimit = selectedBank ? Number(selectedBank.UtilizedLoanAmount || 0) : 0;
  const availLimit = Math.max(0, maxLimit - utilLimit);

  const toggleOrnSelection = (id: string) => {
    setSelectedOrnIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setSelectedLoan(null);
    const initialUser = store.users[0]?.UserId || '';
    const initialBank = store.bankAccounts.find(b => b.UserId === initialUser)?.BankAccountId || '';
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
    setSelectedOrnIds(availableOrns.slice(0, 1).map(o => o.OrnamentId));
    setModalVisible(true);
  };

  const openDetailModal = (l: Loan) => {
    setSelectedLoan(l);
    setDetailModalVisible(true);
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
    return store.users.find(u => u.UserId === userId)?.FullName || userId;
  };

  // Table Columns matching index.html:
  // ID | User | Bank Name | Loan Date | Amount (₹) | Gross Weight | Net Weight | Due Date | Status | Actions
  const columns: Column<Loan>[] = [
    {
      key: 'LoanNumber',
      title: 'ID / Number',
      width: 115,
      render: (l) => (
        <View>
          <Text style={styles.primaryCellText} numberOfLines={1}>{l.LoanNumber}</Text>
          <Text style={styles.idText} numberOfLines={1}>{l.LoanId}</Text>
        </View>
      ),
    },
    {
      key: 'UserId',
      title: 'Borrower',
      width: 135,
      render: (l) => <Text style={styles.cellText} numberOfLines={1}>{getUserName(l.UserId)}</Text>,
    },
    {
      key: 'BankName',
      title: 'Bank',
      width: 120,
      render: (l) => <Text style={[styles.cellText, { fontWeight: '600' }]} numberOfLines={1}>{l.BankName}</Text>,
    },
    {
      key: 'LoanDate',
      title: 'Date',
      width: 95,
      render: (l) => <Text style={styles.cellText} numberOfLines={1}>{l.LoanDate}</Text>,
    },
    {
      key: 'LoanAmount',
      title: 'Amount (₹)',
      width: 115,
      align: 'right',
      render: (l) => (
        <Text style={[styles.cellText, { fontWeight: '700', color: colors.primaryDark }]}>
          ₹{(l.LoanAmount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: 'GrossWeight',
      title: 'Gross Wt',
      width: 90,
      align: 'right',
      render: (l) => <Text style={styles.cellText}>{Number(l.GrossWeight || 0).toFixed(2)}g</Text>,
    },
    {
      key: 'NetWeight',
      title: 'Net Wt',
      width: 90,
      align: 'right',
      render: (l) => (
        <Text style={[styles.cellText, { fontWeight: '700', color: isDark ? '#fbbf24' : '#854d0e' }]}>
          {Number(l.NetWeight || 0).toFixed(2)}g
        </Text>
      ),
    },
    {
      key: 'DueDate',
      title: 'Due Date',
      width: 95,
      render: (l) => <Text style={styles.cellText} numberOfLines={1}>{l.DueDate || '—'}</Text>,
    },
    {
      key: 'LoanStatus',
      title: 'Status',
      width: 85,
      align: 'center',
      render: (l) => (
        <Badge 
          label={l.LoanStatus} 
          variant={l.LoanStatus === 'Active' ? 'success' : (l.LoanStatus === 'Closed' ? 'info' : 'danger')} 
          size="sm" 
        />
      ),
    },
    {
      key: 'Actions',
      title: 'Actions',
      width: 95,
      align: 'center',
      render: (l) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openDetailModal(l)} style={styles.actionBtn} accessibilityLabel="View Details">
            <Ionicons name="eye-outline" size={16} color="#0284c7" />
          </TouchableOpacity>
          {isSuperAdmin && l.LoanStatus === 'Active' ? (
            <TouchableOpacity onPress={() => openPayModal(l)} style={styles.actionBtn} accessibilityLabel="Record Repayment">
              <Ionicons name="card-outline" size={16} color={colors.primaryDark} />
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    },
  ];

  const isLoanOverdue = (l: Loan) => {
    if (l.LoanStatus === 'Overdue') return true;
    if (l.LoanStatus === 'Active' && l.DueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(l.DueDate) < today;
    }
    return false;
  };

  const overdueCount = store.loans.filter(isLoanOverdue).length;
  const activeCount = store.loans.filter(l => l.LoanStatus === 'Active' && !isLoanOverdue(l)).length;
  const closedCount = store.loans.filter(l => l.LoanStatus === 'Closed').length;
  const loanFilterChips = [
    { label: 'All', value: 'All', count: store.loans.length },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Closed', value: 'Closed', count: closedCount },
    { label: 'Overdue', value: 'Overdue', count: overdueCount },
  ];

  const customFilterPredicate = (l: Loan, filterVal: string) => {
    if (filterVal === 'All') return true;
    if (filterVal === 'Overdue') return isLoanOverdue(l);
    if (filterVal === 'Active') return l.LoanStatus === 'Active' && !isLoanOverdue(l);
    if (filterVal === 'Closed') return l.LoanStatus === 'Closed';
    return l.LoanStatus === filterVal;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <DataTable
          forceTableView={true}
          isLoading={store.isSyncing && store.loans.length === 0}
          addButtonLabel="Add Loan"
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={store.loans}
          keyExtractor={(l) => l.LoanId}
          filterChips={loanFilterChips}
          customFilterPredicate={customFilterPredicate}
          searchPlaceholder="Search loan #, borrower, bank, status..."
          searchFilter={(l, q) => {
            const normQuery = (q || '').trim().toLowerCase();
            if (!normQuery) return true;
            const borrowerName = getUserName(l.UserId).toLowerCase();
            const loanNo = (l.LoanNumber || '').toLowerCase();
            const loanId = (l.LoanId || '').toLowerCase();
            const bank = (l.BankName || '').toLowerCase();
            const status = (l.LoanStatus || '').toLowerCase();
            const amount = (l.LoanAmount || '').toString();
            const loanDate = (l.LoanDate || '').toLowerCase();
            const dueDate = (l.DueDate || '').toLowerCase();
            const netWeight = (l.NetWeight || '').toString();

            return (
              loanNo.includes(normQuery) ||
              loanId.includes(normQuery) ||
              borrowerName.includes(normQuery) ||
              bank.includes(normQuery) ||
              status.includes(normQuery) ||
              amount.includes(normQuery) ||
              loanDate.includes(normQuery) ||
              dueDate.includes(normQuery) ||
              netWeight.includes(normQuery)
            );
          }}
          renderMobileCard={(l) => {
            const overdue = isLoanOverdue(l);
            const borrower = getUserName(l.UserId);
            const statusVariant = overdue ? 'danger' : (l.LoanStatus === 'Active' ? 'success' : (l.LoanStatus === 'Closed' ? 'info' : 'default'));
            const statusLabel = overdue ? 'Overdue' : l.LoanStatus;

            return (
              <MobileCard
                onPress={() => openDetailModal(l)}
                identifier={
                  <Text style={styles.idText} numberOfLines={1}>
                    <Text style={{ fontWeight: '700', color: colors.primaryDark, fontSize: 13 }}>{l.LoanNumber}</Text>
                    {l.LoanId ? <Text style={{ color: colors.textMuted, fontSize: 11 }}> (#{l.LoanId})</Text> : null}
                  </Text>
                }
                badges={
                  <Badge label={statusLabel} variant={statusVariant} size="sm" />
                }
                avatar={
                  <View style={styles.miniAvatar}>
                    <Ionicons name="person" size={15} color={colors.primaryDark} />
                  </View>
                }
                title={borrower}
                subtitle={l.BankName ? `Lender: ${l.BankName}` : undefined}
                metrics={[
                  {
                    label: 'Loan Amount',
                    value: `₹${(l.LoanAmount || 0).toLocaleString('en-IN')}`,
                    highlighted: true,
                    color: colors.primaryDark,
                  },
                  {
                    label: 'Due Date',
                    value: l.DueDate || '—',
                    color: overdue ? colors.danger : undefined,
                  },
                  {
                    label: 'Net Weight',
                    value: `${Number(l.NetWeight || 0).toFixed(2)}g`,
                    color: isDark ? '#fbbf24' : '#854d0e',
                    highlighted: true,
                  },
                  {
                    label: 'Gross Weight',
                    value: `${Number(l.GrossWeight || 0).toFixed(2)}g`,
                  },
                  {
                    label: 'Origination Date',
                    value: l.LoanDate || '—',
                  },
                  {
                    label: 'Lending Bank',
                    value: l.BankName || '—',
                  },
                ]}
                viewLabel="View details"
                onViewPress={() => openDetailModal(l)}
                primaryAction={
                  isSuperAdmin && l.LoanStatus === 'Active' ? (
                    <TouchableOpacity
                      style={styles.payQuickBtn}
                      onPress={() => openPayModal(l)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="card-outline" size={13} color="#ffffff" />
                      <Text style={styles.payQuickBtnText}>Pay</Text>
                    </TouchableOpacity>
                  ) : undefined
                }
              />
            );
          }}
        />
      </ScrollView>

      {/* ADD LOAN MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Originate New Loan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Step 1: Select User */}
              <View style={styles.field}>
                <Text style={styles.label}>1. Select Borrower *</Text>
                {store.users.length === 0 ? (
                  <View style={{ backgroundColor: colors.warningBg, padding: 10, borderRadius: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '500' }}>
                      ⚠️ No borrowers registered yet. Please add a customer in the Users tab first.
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {store.users.map(u => (
                      <TouchableOpacity
                        key={u.UserId}
                        style={[styles.userChip, form.UserId === u.UserId && styles.userChipActive]}
                        onPress={() => {
                          const bank = store.bankAccounts.find(b => b.UserId === u.UserId)?.BankAccountId || '';
                          setForm(p => ({ ...p, UserId: u.UserId, BankAccountId: bank }));
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

              {/* Step 2: Select Bank Account with available limit check */}
              <View style={styles.field}>
                <Text style={styles.label}>2. Select Bank Account (Headroom: ₹{availLimit.toLocaleString()}) *</Text>
                {userBanks.length === 0 ? (
                  <Text style={styles.warnText}>No bank account registered for this borrower.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {userBanks.map(b => {
                      const av = Math.max(0, (Number(b.MaxLoanAmount) || 0) - (Number(b.UtilizedLoanAmount) || 0));
                      return (
                        <TouchableOpacity
                          key={b.BankAccountId}
                          style={[styles.userChip, form.BankAccountId === b.BankAccountId && styles.userChipActive]}
                          onPress={() => setForm(p => ({ ...p, BankAccountId: b.BankAccountId }))}
                        >
                          <Text style={[styles.userChipText, form.BankAccountId === b.BankAccountId && styles.userChipTextActive]}>
                            {b.BankName} (Avail: ₹{av.toLocaleString()})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Step 3: Select Ornaments to Pledge with automatic weight sync (syncLoanOrnamentWeights from index.html) */}
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
                  availableOrns.map(o => {
                    const checked = selectedOrnIds.includes(o.OrnamentId);
                    return (
                      <TouchableOpacity
                        key={o.OrnamentId}
                        style={[styles.ornSelectRow, checked && styles.ornSelectRowActive]}
                        onPress={() => toggleOrnSelection(o.OrnamentId)}
                      >
                        <Ionicons 
                          name={checked ? "checkbox" : "square-outline"} 
                          size={20} 
                          color={checked ? colors.primaryDark : colors.textMuted} 
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.ornSelectTitle}>{o.OrnamentName}</Text>
                          <Text style={styles.ornSelectSub}>
                            {o.Purity} • Net: {Number(o.NetWeight || o.MetalWeight || 0).toFixed(2)}g • Val: ₹{(o.MarketValue || 0).toLocaleString()}
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
                    onChangeText={v => setForm(p => ({ ...p, LoanAmount: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Interest Rate (% p.a.)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={form.InterestRate}
                    onChangeText={v => setForm(p => ({ ...p, InterestRate: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Tenure</Text>
                  <TextInput
                    style={styles.input}
                    value={form.LoanPeriod}
                    onChangeText={v => setForm(p => ({ ...p, LoanPeriod: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Interest Type</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Simple', 'Compound'] as const).map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.statusBtn, form.InterestType === t && styles.statusBtnActive]}
                        onPress={() => setForm(p => ({ ...p, InterestType: t }))}
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
                    onChangeText={v => setForm(p => ({ ...p, LoanDate: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Due Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={form.DueDate}
                    onChangeText={v => setForm(p => ({ ...p, DueDate: v }))}
                  />
                </View>
              </View>

              {/* Charges & Net Disbursement Box (calculateLoanCharges from index.html) */}
              <View style={styles.calcBox}>
                <Text style={styles.calcBoxTitle}>Deductions & Net Disbursement</Text>
                <View style={styles.formRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Processing Fee (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.ProcessingFee}
                      onChangeText={v => setForm(p => ({ ...p, ProcessingFee: v }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Document Charge (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.DocumentCharge}
                      onChangeText={v => setForm(p => ({ ...p, DocumentCharge: v }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Insurance Charge (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={form.InsuranceCharge}
                      onChangeText={v => setForm(p => ({ ...p, InsuranceCharge: v }))}
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
                    onChangeText={v => setForm(p => ({ ...p, GrossWeight: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Net Weight (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={totalNetWeight > 0 ? totalNetWeight.toFixed(3) : '0.000'}
                    keyboardType="decimal-pad"
                    value={form.NetWeight}
                    onChangeText={v => setForm(p => ({ ...p, NetWeight: v }))}
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
                  onChangeText={v => setForm(p => ({ ...p, Remarks: v }))}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan}>
                <Text style={styles.saveBtnText}>Disburse & Pledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RECORD REPAYMENT MODAL */}
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
                  {(['Interest', 'Principal', 'Part_Payment'] as const).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.statusBtn, payForm.Type === t && styles.statusBtnActive]}
                      onPress={() => setPayForm(p => ({ ...p, Type: t }))}
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
                  onChangeText={v => setPayForm(p => ({ ...p, Amount: v }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.statusToggleRow}>
                  {(['UPI', 'Net Banking', 'Cash'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.statusBtn, payForm.Method === m && styles.statusBtnActive]}
                      onPress={() => setPayForm(p => ({ ...p, Method: m }))}
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
                    onChangeText={v => setPayForm(p => ({ ...p, PaymentDate: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Transaction Reference / UTR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. UPI/50291039120"
                    value={payForm.Reference}
                    onChangeText={v => setPayForm(p => ({ ...p, Reference: v }))}
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
                  onChangeText={v => setPayForm(p => ({ ...p, Remarks: v }))}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.success }]} onPress={handleSavePayment}>
                <Text style={styles.saveBtnText}>Save Repayment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW LOAN DETAIL MODAL WITH PAYMENTS TABLE */}
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
                  <Text style={styles.detailCode}>Borrower: {getUserName(selectedLoan.UserId)} • Bank: {selectedLoan.BankName}</Text>
                  <View style={{ marginTop: 6 }}>
                    <Badge label={selectedLoan.LoanStatus} variant={selectedLoan.LoanStatus === 'Active' ? 'success' : 'info'} />
                  </View>
                </View>


                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Contract Financials</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Principal Amount:</Text> ₹{selectedLoan.LoanAmount.toLocaleString()}</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Net Disbursed:</Text> ₹{(selectedLoan.NetDisbursementAmount || 0).toLocaleString()}</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Interest Rate:</Text> {selectedLoan.InterestRate}% ({selectedLoan.InterestType || 'Simple'})</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Loan Period:</Text> {selectedLoan.LoanPeriod || 'N/A'}</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Loan Date → Due Date:</Text> {selectedLoan.LoanDate} ➔ {selectedLoan.DueDate || 'N/A'}</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Pledged Gold Net:</Text> {Number(selectedLoan.NetWeight || 0).toFixed(2)} g (Gross: {Number(selectedLoan.GrossWeight || 0).toFixed(2)} g)</Text>
                  {selectedLoan.ProcessingFee ? <Text style={styles.detailRowText}><Text style={styles.bold}>Processing Fee:</Text> ₹{Number(selectedLoan.ProcessingFee).toLocaleString()}</Text> : null}
                  {selectedLoan.TotalCharges ? <Text style={styles.detailRowText}><Text style={styles.bold}>Total Charges:</Text> ₹{Number(selectedLoan.TotalCharges).toLocaleString()}</Text> : null}
                  {selectedLoan.Remarks ? <Text style={styles.detailRowText}><Text style={styles.bold}>Remarks:</Text> {selectedLoan.Remarks}</Text> : null}
                </View>

                {/* Payments Table (paymentsDetailTable from index.html: Date | Type | Method | Principal | Interest | Total Paid) */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Repayment History</Text>
                  {(() => {
                    const loanPayments = store.payments.filter(p => p.LoanId === selectedLoan.LoanId);
                    const totalPaid = loanPayments.reduce((s, p) => s + (p.TotalPaidAmount || 0), 0);
                    if (loanPayments.length === 0) return <Text style={styles.emptyNotice}>No repayments logged for this loan.</Text>;
                    return (
                      <>
                        {loanPayments.map((p, idx) => (
                          <View key={p.PaymentId || idx} style={styles.payHistRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.payHistTitle}>{p.PaymentDate} • {p.PaymentType}</Text>
                              <Text style={styles.payHistSub}>{p.PaymentMethod}{p.TransactionReference ? ` (Ref: ${p.TransactionReference})` : ''}</Text>
                              {(p.PrincipalAmount > 0 || p.InterestAmount > 0) ? (
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
                        <View style={[styles.payHistRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                          <Text style={[styles.payHistTitle, { color: colors.success }]}>Total Paid So Far</Text>
                          <Text style={[styles.payHistAmt, { color: colors.success }]}>₹{totalPaid.toLocaleString()}</Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.saveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 12,
    paddingBottom: 80,
  },
  idText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  primaryCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cellText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: Platform.select({ web: '55%', default: '94%' }),
    maxWidth: 650,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
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
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  userChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  userChipTextActive: {
    color: '#ffffff',
  },
  warnText: {
    fontSize: 12,
    color: colors.warning,
    fontStyle: 'italic',
  },
  ornSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
  },
  ornSelectRowActive: {
    backgroundColor: isDark ? '#1e293b' : '#fffbeb',
    borderColor: colors.primary,
  },
  ornSelectTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ornSelectSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  calcBox: {
    backgroundColor: isDark ? '#261a02' : '#fefce8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginTop: 4,
    gap: 4,
  },
  calcBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : '#854d0e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: isDark ? '#fbbf24' : '#854d0e',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  statusBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: '#ffffff',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailCard: {
    backgroundColor: isDark ? '#1e293b' : '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginBottom: 14,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '800',
    color: isDark ? '#fbbf24' : '#713f12',
  },
  detailCode: {
    fontSize: 12,
    color: isDark ? '#facc15' : '#a16207',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 14,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },
  detailSecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  detailRowText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyNotice: {
    fontSize: 12,
    color: colors.textMuted,
  },
  payHistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  payHistTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  payHistSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  payHistAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  payQuickBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
