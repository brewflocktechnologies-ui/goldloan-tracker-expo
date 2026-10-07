import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { EditLoanModal, RepaymentModal } from '../../components/loans/LoanModals';
import { getStyles } from '../../components/loans/loanModalStyles';
import { LoanFilterType, LoanListView } from '../../components/loans/LoanListView';
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
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
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
    if (editingLoan?.ornamentIds?.includes(o.OrnamentId)) return true;
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
      l.LoanId !== editingLoan?.LoanId
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

  const openEditModal = (l: Loan) => {
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

    if (!editingLoan) return;

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
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Loan contract updated successfully!');
        toast.success(`Loan ${form.LoanNumber} updated successfully!`);
      },
    });

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
    }, {
      onSuccess: () => {
        Alert.alert('Success', `Repayment of ₹${payAmt.toLocaleString()} recorded.`);
        toast.success(`Repayment of ₹${payAmt.toLocaleString()} recorded.`);
      },
    });

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

      {/* ─── EDIT LOAN MODAL ─── */}
      <EditLoanModal
        styles={styles} colors={colors} isDark={isDark}
        modalVisible={modalVisible} setModalVisible={setModalVisible}
        editingLoan={editingLoan} getUserName={getUserName}
        form={form} setForm={setForm} availLimit={availLimit} userBanks={userBanks}
        selectedOrnIds={selectedOrnIds} totalNetWeight={totalNetWeight} totalGrossWeight={totalGrossWeight}
        availableOrns={availableOrns} toggleOrnSelection={toggleOrnSelection}
        netDisbursement={netDisbursement} months={months} interest={interest}
        handleSaveLoan={handleSaveLoan}
      />

      {/* ─── RECORD REPAYMENT MODAL ─── */}
      <RepaymentModal
        styles={styles} colors={colors}
        payModalVisible={payModalVisible} setPayModalVisible={setPayModalVisible}
        selectedLoan={selectedLoan} payForm={payForm} setPayForm={setPayForm}
        handleSavePayment={handleSavePayment}
      />


    </View>
  );
}
