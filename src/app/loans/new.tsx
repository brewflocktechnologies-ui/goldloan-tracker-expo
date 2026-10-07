import { getNextLoanNumber } from '../../utils/loanNumber';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatAmountLakh, formatLoanDate, formatLoanPhone } from '../../components/loans/loanUtils';
import { ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';

// Helper to format Date object into "DD-MM-YYYY"
function formatDateDMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to convert "DD-MM-YYYY" to "YYYY-MM-DD"
function dmyToYmd(dmy: string): string {
  if (!dmy) return new Date().toISOString().split('T')[0];
  const parts = dmy.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dmy;
}

// Add months to a Date
function addMonths(baseDate: Date, months: number): Date {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function NewLoanScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const store = useAppStore();
  const toast = useToast();

  // When opened from a customer's page, the customer is already known: skip the customer step.
  const { userId: presetUserId } = useLocalSearchParams<{ userId?: string }>();
  const presetCustomer = useMemo(
    () => (presetUserId ? store.users.find((u) => String(u.UserId) === String(presetUserId)) : undefined),
    [presetUserId, store.users]
  );
  const firstStep: 1 | 2 = presetCustomer ? 2 : 1;

  // ─── Current Step State (1 to 5) ───
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(firstStep);

  // ─── Form State ───
  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    presetCustomer ? String(presetCustomer.UserId) : ''
  );
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Step 2: Bank Account
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

  // Step 3: Ornaments (Multi-select)
  const [selectedOrnamentIds, setSelectedOrnamentIds] = useState<string[]>([]);

  // Step 4: Terms & Calculation
  const today = useMemo(() => new Date(), []);
  const initialLoanNumber = useMemo(() => getNextLoanNumber(store.loans), [store.loans]);
  const loanNumberEdited = useRef(false);

  const [loanNumber, setLoanNumber] = useState<string>(initialLoanNumber);
  useEffect(() => {
    if (!loanNumberEdited.current) setLoanNumber(initialLoanNumber);
  }, [initialLoanNumber]);
  const [loanDateDMY, setLoanDateDMY] = useState<string>(formatDateDMY(today));
  const [loanPeriodMonths, setLoanPeriodMonths] = useState<number>(6);
  const [dueDateDMY, setDueDateDMY] = useState<string>(formatDateDMY(addMonths(today, 6)));
  const [loanAmount, setLoanAmount] = useState<string>('0');
  const [interestRate, setInterestRate] = useState<string>('12');
  const [interestType, setInterestType] = useState<'Simple' | 'Compound'>('Simple');
  const [processingFee, setProcessingFee] = useState<string>('0');
  const [documentCharge, setDocumentCharge] = useState<string>('500');
  const [insuranceCharge, setInsuranceCharge] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ─── Quick Add Modals ───
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  const [showAddBankModal, setShowAddBankModal] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('State Bank of India');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newIFSCCode, setNewIFSCCode] = useState<string>('');
  const [newMaxLimit, setNewMaxLimit] = useState<string>('500000');

  const [showAddOrnamentModal, setShowAddOrnamentModal] = useState<boolean>(false);
  const [newOrnamentName, setNewOrnamentName] = useState<string>('');
  const [newOrnamentPurity, setNewOrnamentPurity] = useState<'24K' | '22K' | '18K'>('22K');
  const [newGrossWeight, setNewGrossWeight] = useState<string>('');
  const [newNetWeight, setNewNetWeight] = useState<string>('');

  // Preset customer: pre-select their first active bank account (mirrors handleContinueStep1)
  useEffect(() => {
    if (!presetCustomer || selectedBankAccountId) return;
    const banks = store.bankAccounts.filter(
      (b) => String(b.UserId) === String(presetCustomer.UserId) && b.Status === 'Active'
    );
    if (banks.length > 0) setSelectedBankAccountId(banks[0].BankAccountId);
  }, [presetCustomer, store.bankAccounts, selectedBankAccountId]);

  // ─── Auto Recalculate Due Date when Period or Loan Date Changes ───
  useEffect(() => {
    try {
      const parts = loanDateDMY.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d.getTime())) {
          const nextDue = addMonths(d, loanPeriodMonths);
          setDueDateDMY(formatDateDMY(nextDue));
        }
      }
    } catch {
      // fallback
    }
  }, [loanDateDMY, loanPeriodMonths]);

  // ─── Hardware Back Button Intercept ───
  const goBack = useCallback(() => {
    if (showAddCustomerModal) {
      setShowAddCustomerModal(false);
      return;
    }
    if (showAddBankModal) {
      setShowAddBankModal(false);
      return;
    }
    if (showAddOrnamentModal) {
      setShowAddOrnamentModal(false);
      return;
    }

    if (currentStep > firstStep) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/loans' as any);
      }
    }
  }, [currentStep, firstStep, showAddCustomerModal, showAddBankModal, showAddOrnamentModal, router]);

  useEffect(() => {
    const onBackPress = () => {
      goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [goBack]);

  // ─── Lookups & Calculations ───
  // 1. Selected Customer
  const selectedCustomer = useMemo(() => {
    return store.users.find((u) => String(u.UserId) === String(selectedCustomerId)) || null;
  }, [store.users, selectedCustomerId]);

  // Calculate available limit per user (sum of available limits across active bank accounts)
  const userAvailableMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of store.users) {
      const userBanks = store.bankAccounts.filter(
        (b) => String(b.UserId) === String(u.UserId) && b.Status === 'Active'
      );
      const totalAvail = userBanks.reduce((sum, b) => {
        const max = Number(b.MaxLoanAmount) || 0;
        const uti = Number(b.UtilizedLoanAmount) || 0;
        return sum + Math.max(0, max - uti);
      }, 0);
      map.set(String(u.UserId), totalAvail);
    }
    return map;
  }, [store.users, store.bankAccounts]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const activeUsers = store.users.filter((u) => u.Status !== 'Inactive');
    if (!q) return activeUsers;
    return activeUsers.filter((u) => {
      const name = String(u.FullName || '').toLowerCase();
      const code = String(u.CustomerCode || '').toLowerCase();
      const phone = String(u.MobileNumber || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [store.users, customerSearch]);

  // 2. Bank Accounts for Selected Customer
  const customerBankAccounts = useMemo(() => {
    if (!selectedCustomerId) return [];
    return store.bankAccounts.filter(
      (b) => String(b.UserId) === String(selectedCustomerId) && b.Status === 'Active'
    );
  }, [store.bankAccounts, selectedCustomerId]);

  const selectedBankAccount = useMemo(() => {
    return customerBankAccounts.find((b) => b.BankAccountId === selectedBankAccountId) || null;
  }, [customerBankAccounts, selectedBankAccountId]);

  const bankAvailableLimit = useMemo(() => {
    if (!selectedBankAccount) return 0;
    const max = Number(selectedBankAccount.MaxLoanAmount) || 0;
    const uti = Number(selectedBankAccount.UtilizedLoanAmount) || 0;
    return Math.max(0, max - uti);
  }, [selectedBankAccount]);

  // 3. Ornaments List (Customer's first, then others)
  const availableOrnaments = useMemo(() => {
    const available = store.ornaments.filter((o) => o.Status === 'Available');
    if (!selectedCustomerId) return available;
    return [...available].sort((a, b) => {
      const aBelongs = String(a.UserId) === String(selectedCustomerId) ? 0 : 1;
      const bBelongs = String(b.UserId) === String(selectedCustomerId) ? 0 : 1;
      return aBelongs - bBelongs;
    });
  }, [store.ornaments, selectedCustomerId]);

  const selectedOrnaments = useMemo(() => {
    return store.ornaments.filter((o) => selectedOrnamentIds.includes(o.OrnamentId));
  }, [store.ornaments, selectedOrnamentIds]);

  const totalGrossWeight = useMemo(() => {
    return selectedOrnaments.reduce((s, o) => s + (Number(o.GrossWeight) || 0), 0);
  }, [selectedOrnaments]);

  const totalNetWeight = useMemo(() => {
    return selectedOrnaments.reduce((s, o) => s + (Number(o.NetWeight || o.MetalWeight) || 0), 0);
  }, [selectedOrnaments]);

  const totalMetalWeight = useMemo(() => {
    return selectedOrnaments.reduce((s, o) => s + (Number(o.MetalWeight || o.NetWeight) || 0), 0);
  }, [selectedOrnaments]);

  const gold22kRate = store.goldRates?.gold22k?.rate1g || 6500;
  const totalMarketValue = useMemo(() => {
    const valFromItems = selectedOrnaments.reduce((s, o) => s + (Number(o.MarketValue) || 0), 0);
    if (valFromItems > 0) return valFromItems;
    return Math.round(totalNetWeight * gold22kRate);
  }, [selectedOrnaments, totalNetWeight, gold22kRate]);

  // 4. Financial Calculations for Terms & Disbursement
  const parsedLoanAmount = Math.max(0, parseFloat(loanAmount) || 0);
  const parsedRate = Math.max(0, parseFloat(interestRate) || 0);
  const parsedProcessing = Math.max(0, parseFloat(processingFee) || 0);
  const parsedDocument = Math.max(0, parseFloat(documentCharge) || 0);
  const parsedInsurance = Math.max(0, parseFloat(insuranceCharge) || 0);

  // Interest for Period
  const periodInterest = useMemo(() => {
    if (parsedLoanAmount <= 0 || parsedRate <= 0) return 0;
    if (interestType === 'Compound') {
      const monthlyRate = parsedRate / (12 * 100);
      return Math.round((parsedLoanAmount * Math.pow(1 + monthlyRate, loanPeriodMonths) - parsedLoanAmount) * 100) / 100;
    }
    // Simple Interest
    return Math.round(parsedLoanAmount * (parsedRate / 100) * (loanPeriodMonths / 12) * 100) / 100;
  }, [parsedLoanAmount, parsedRate, interestType, loanPeriodMonths]);

  // Upfront charges deducted from disbursement
  const upfrontDeductions = parsedProcessing + parsedDocument + parsedInsurance;
  const netDisbursement = Math.max(0, parsedLoanAmount - upfrontDeductions);
  const totalCharges = periodInterest; // matching mockup where total charges displays estimated period charges

  // Limit after loan
  const limitAfterLoan = Math.max(0, bankAvailableLimit - parsedLoanAmount);

  // ─── Step Navigation Handlers ───
  const handleContinueStep1 = () => {
    if (!selectedCustomerId) {
      Alert.alert('Validation Error', 'Please select a customer to continue.');
      return;
    }
    // Auto-select first bank account of this customer if available
    const banks = store.bankAccounts.filter(
      (b) => String(b.UserId) === String(selectedCustomerId) && b.Status === 'Active'
    );
    if (banks.length > 0 && !selectedBankAccountId) {
      setSelectedBankAccountId(banks[0].BankAccountId);
    }
    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    if (!selectedBankAccountId) {
      Alert.alert('Validation Error', 'Please select a bank account to proceed.');
      return;
    }
    setCurrentStep(3);
  };

  const handleContinueStep3 = () => {
    if (selectedOrnamentIds.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one gold ornament to pledge.');
      return;
    }
    // Pre-fill loan amount suggested by ornaments or 0
    if (parsedLoanAmount === 0 && bankAvailableLimit > 0) {
      const suggested = Math.min(bankAvailableLimit, Math.round(totalMarketValue * 0.75));
      if (suggested > 0) {
        setLoanAmount(String(suggested));
      }
    }
    setCurrentStep(4);
  };

  const handleContinueStep4 = () => {
    if (parsedLoanAmount <= 0) {
      Alert.alert('Validation Error', 'Loan amount must be greater than ₹0.');
      return;
    }
    if (bankAvailableLimit > 0 && parsedLoanAmount > bankAvailableLimit) {
      Alert.alert(
        'Limit Exceeded',
        `The requested loan amount of ₹${parsedLoanAmount.toLocaleString()} exceeds the available limit of ₹${bankAvailableLimit.toLocaleString()} for this bank account.`
      );
      return;
    }
    setCurrentStep(5);
  };

  // ─── Create Loan Final Execution ───
  const handleCreateLoan = async () => {
    if (!selectedCustomer || !selectedBankAccount) {
      Alert.alert('Error', 'Missing customer or bank account information.');
      return;
    }
    if (selectedOrnamentIds.length === 0) {
      Alert.alert('Error', 'Please select at least one ornament.');
      return;
    }

    setSubmitting(true);
    try {
      const loanPayload = {
        LoanNumber: loanNumber.trim() || initialLoanNumber,
        UserId: selectedCustomer.UserId,
        BankAccountId: selectedBankAccount.BankAccountId,
        BankName: selectedBankAccount.BankName,
        LoanDate: dmyToYmd(loanDateDMY),
        DueDate: dmyToYmd(dueDateDMY),
        LoanPeriod: `${loanPeriodMonths} Months`,
        LoanAmount: parsedLoanAmount,
        InterestRate: parsedRate,
        InterestType: interestType,
        ProcessingFee: parsedProcessing,
        DocumentCharge: parsedDocument,
        InsuranceCharge: parsedInsurance,
        TotalCharges: totalCharges,
        NetDisbursementAmount: netDisbursement,
        GrossWeight: totalGrossWeight,
        NetWeight: totalNetWeight,
        Remarks: remarks.trim() || `Originated on ${loanDateDMY}`,
        ornamentIds: selectedOrnamentIds,
      };

      store.addLoan(loanPayload, {
        // "Created" is announced only once the sheet confirms it
        onSuccess: (saved) => {
          if (saved.LoanNumber !== loanPayload.LoanNumber) {
            toast.info(`Loan number ${loanPayload.LoanNumber} was taken; saved as ${saved.LoanNumber}`);
          }
          toast.success(`Loan contract ${saved.LoanNumber || loanPayload.LoanNumber} created successfully!`);
        },
        onError: (message) => toast.danger(`Loan ${loanPayload.LoanNumber} was not saved: ${message}`),
      });

      // Return to loans list
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/loans' as any);
      }
    } catch (e: any) {
      Alert.alert('Creation Failed', e.message || 'Unable to disburse loan contract.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Quick Add Handlers ───
  const handleQuickAddCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      Alert.alert('Validation', 'Please provide customer name and phone number.');
      return;
    }
    const cleanPhone = newCustomerPhone.replace(/[^0-9]/g, '');
    const user = store.addUser({
      FullName: newCustomerName.trim(),
      MobileNumber: cleanPhone,
      Status: 'Active',
    }, {
      onSuccess: () => toast.success(`Customer ${newCustomerName.trim()} created.`),
    });
    setSelectedCustomerId(user.UserId);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowAddCustomerModal(false);
  };

  const handleQuickAddBank = () => {
    if (!newAccountNumber.trim()) {
      Alert.alert('Validation', 'Account number is required.');
      return;
    }
    if (!selectedCustomerId) {
      Alert.alert('Validation', 'Please select a customer first.');
      return;
    }
    const acc = store.addBankAccount({
      UserId: selectedCustomerId,
      AccountHolderName: selectedCustomer?.FullName || 'Account Holder',
      BankName: newBankName.trim() || 'State Bank of India',
      AccountNumber: newAccountNumber.trim(),
      IFSCCode: newIFSCCode.trim(),
      MaxLoanAmount: parseFloat(newMaxLimit) || 500000,
    }, {
      onSuccess: () => toast.success('Bank account added.'),
    });
    setSelectedBankAccountId(acc.BankAccountId);
    setNewAccountNumber('');
    setNewIFSCCode('');
    setShowAddBankModal(false);
  };

  const handleQuickAddOrnament = () => {
    if (!newOrnamentName.trim() || !newNetWeight.trim()) {
      Alert.alert('Validation', 'Ornament name and net weight are required.');
      return;
    }
    const gw = parseFloat(newGrossWeight) || parseFloat(newNetWeight) || 0;
    const nw = parseFloat(newNetWeight) || 0;
    const mkt = Math.round(nw * gold22kRate);

    const orn = store.addOrnament({
      UserId: selectedCustomerId || undefined,
      OrnamentName: newOrnamentName.trim(),
      Purity: newOrnamentPurity,
      GrossWeight: gw,
      NetWeight: nw,
      StoneWeight: Math.max(0, gw - nw),
      MarketValue: mkt,
      Status: 'Available',
    }, {
      onSuccess: () => toast.success('Ornament added and selected.'),
    });
    setSelectedOrnamentIds((prev) => [...prev, orn.OrnamentId]);
    setNewOrnamentName('');
    setNewGrossWeight('');
    setNewNetWeight('');
    setShowAddOrnamentModal(false);
  };

  // Subtitle per step
  const stepSubtitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return 'Step 1 of 5 . Customer';
      case 2:
        return 'Step 2 of 5 . Customer';
      case 3:
        return 'Step 3 of 5 . Customer';
      case 4:
        return 'Step 4 of 5 . Customer';
      case 5:
        return 'Step 5 of 5 . Customer';
    }
  }, [currentStep]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.rootContainer}>
        {/* ─── 1. TOP HEADER (Sky-Blue with Back Button & Title) ─── */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={22} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>

            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>New Loan</Text>
              <Text style={styles.headerSubtitle}>{stepSubtitle}</Text>
            </View>
          </View>

          {/* 5-Segment Progress Bar */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  s <= currentStep ? styles.progressSegmentFilled : styles.progressSegmentEmpty,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ─── 2. SCROLLABLE STEP BODY ─── */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════════════════════════════════════════ */}
          {/* ─── STEP 1: SELECT CUSTOMER ─── */}
          {/* ══════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search existing customer..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  autoCorrect={false}
                />
                {customerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCustomerSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Customer Cards List */}
              {filteredCustomers.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={38} color="#94a3b8" />
                  <Text style={styles.emptyText}>No matching customers found.</Text>
                </View>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = String(c.UserId) === String(selectedCustomerId);
                  const available = userAvailableMap.get(String(c.UserId)) || 0;
                  const initials = (c.FullName || 'CU')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join('');

                  return (
                    <TouchableOpacity
                      key={c.UserId}
                      style={[styles.customerCard, isSelected && styles.cardSelected]}
                      onPress={() => setSelectedCustomerId(c.UserId)}
                      activeOpacity={0.8}
                    >
                      {/* Avatar */}
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>

                      {/* Info */}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {c.FullName}
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={1}>
                          {formatLoanPhone(c.MobileNumber)} · {c.CustomerCode || `CUS-${String(c.UserId).padStart(4, '0')}`}
                        </Text>
                        <Text style={styles.customerAvailText}>
                          {formatAmountLakh(available)} available
                        </Text>
                      </View>

                      {/* Radio Checkmark */}
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Add New Customer Action */}
              <TouchableOpacity
                style={styles.addButtonCard}
                onPress={() => setShowAddCustomerModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add-outline" size={16} color={isDark ? '#f8fafc' : '#0f172a'} />
                <Text style={styles.addButtonText}>Add new customer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* ─── STEP 2: SELECT BANK ACCOUNT ─── */}
          {/* ══════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              {/* Subheader: Customer & Total Available */}
              <View style={styles.step2HeaderRow}>
                <View>
                  <Text style={styles.step2HeaderLabel}>Customer</Text>
                  <Text style={styles.step2HeaderVal}>{selectedCustomer?.FullName || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.step2HeaderLabel}>Total available</Text>
                  <Text style={styles.step2HeaderGreenVal}>
                    ₹{(userAvailableMap.get(String(selectedCustomerId)) || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Bank Cards */}
              {customerBankAccounts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="business-outline" size={38} color="#94a3b8" />
                  <Text style={styles.emptyText}>No active bank accounts for this customer.</Text>
                  <Text style={styles.emptySubText}>Add a bank account to proceed with loan origination.</Text>
                </View>
              ) : (
                customerBankAccounts.map((b) => {
                  const isSelected = b.BankAccountId === selectedBankAccountId;
                  const maxLimit = Number(b.MaxLoanAmount) || 0;
                  const uti = Number(b.UtilizedLoanAmount) || 0;
                  const avail = Math.max(0, maxLimit - uti);
                  const last4 = b.AccountNumber ? String(b.AccountNumber).slice(-4) : '****';

                  return (
                    <TouchableOpacity
                      key={b.BankAccountId}
                      style={[styles.bankCard, isSelected && styles.cardSelected]}
                      onPress={() => setSelectedBankAccountId(b.BankAccountId)}
                      activeOpacity={0.8}
                    >
                      {/* Top Row: Icon + Name + Radio */}
                      <View style={styles.bankTopRow}>
                        <View style={styles.bankIconBox}>
                          <Ionicons name="business-outline" size={17} color="#0284c7" />
                        </View>
                        <View style={styles.bankTitles}>
                          <Text style={styles.bankName}>{b.BankName}</Text>
                          <Text style={styles.bankSub}>
                            {b.AccountType || 'Savings'} · **** {last4}
                          </Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                        </View>
                      </View>

                      {/* 3-Column Metrics Row */}
                      <View style={styles.bankMetricsRow}>
                        <View style={styles.bankMetricCol}>
                          <Text style={styles.metricLabel}>Maximum</Text>
                          <Text style={styles.metricVal}>{formatAmountLakh(maxLimit)}</Text>
                        </View>
                        <View style={styles.bankMetricCol}>
                          <Text style={styles.metricLabel}>Utilized</Text>
                          <Text style={styles.metricVal}>{formatAmountLakh(uti)}</Text>
                        </View>
                        <View style={styles.bankMetricCol}>
                          <Text style={styles.metricLabel}>Available</Text>
                          <Text style={styles.metricGreenVal}>{formatAmountLakh(avail)}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Add Bank Account Action */}
              <TouchableOpacity
                style={styles.addButtonCard}
                onPress={() => setShowAddBankModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
                <Text style={styles.addButtonText}>Add bank account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* ─── STEP 3: SELECT ORNAMENTS ─── */}
          {/* ══════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              {/* Subheader: Notice & Selected Count */}
              <View style={styles.step3HeaderRow}>
                <Text style={styles.step3Notice}>Customer's ornaments are listed first</Text>
                <Text style={styles.step3Count}>{selectedOrnamentIds.length} selected</Text>
              </View>

              {/* Ornaments List */}
              {availableOrnaments.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="diamond-outline" size={38} color="#94a3b8" />
                  <Text style={styles.emptyText}>No available gold ornaments found.</Text>
                  <Text style={styles.emptySubText}>Add an ornament to pledge for this loan.</Text>
                </View>
              ) : (
                availableOrnaments.map((o) => {
                  const isChecked = selectedOrnamentIds.includes(o.OrnamentId);
                  const belongsToCustomer = String(o.UserId) === String(selectedCustomerId);
                  const owner = !belongsToCustomer && o.UserId
                    ? store.users.find((u) => String(u.UserId) === String(o.UserId))
                    : null;

                  return (
                    <TouchableOpacity
                      key={o.OrnamentId}
                      style={[
                        styles.ornamentCard,
                        isChecked && styles.ornamentCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedOrnamentIds((prev) =>
                          prev.includes(o.OrnamentId)
                            ? prev.filter((id) => id !== o.OrnamentId)
                            : [...prev, o.OrnamentId]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Checkbox */}
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                      </View>

                      {/* Diamond Icon */}
                      <View style={styles.diamondIconBox}>
                        <Ionicons name="diamond-outline" size={17} color="#0284c7" />
                      </View>

                      {/* Info */}
                      <View style={styles.ornamentInfo}>
                        <Text style={styles.ornamentTitle}>{o.OrnamentName}</Text>
                        <Text style={styles.ornamentSub}>
                          {o.Purity || '22K'} · Gross {Number(o.GrossWeight || 0).toFixed(2)} g · Net{' '}
                          {Number(o.NetWeight || o.MetalWeight || 0).toFixed(2)} g
                        </Text>
                        {owner && (
                          <View style={styles.ownerNoticeRow}>
                            <Ionicons name="information-circle-outline" size={12} color="#0284c7" />
                            <Text style={styles.ownerNoticeText}>Owner: {owner.FullName}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Add Ornament Action */}
              <TouchableOpacity
                style={styles.addButtonCard}
                onPress={() => setShowAddOrnamentModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
                <Text style={styles.addButtonText}>Add ornament</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* ─── STEP 4: TERMS & CALCULATION ─── */}
          {/* ══════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              {/* Row 1: Loan number * & Loan date * */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>
                    Loan number <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={loanNumber}
                    onChangeText={(v) => {
                      loanNumberEdited.current = true;
                      setLoanNumber(v);
                    }}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>
                    Loan date <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.dateInputWrapper}>
                    <TextInput
                      style={styles.dateInput}
                      value={loanDateDMY}
                      onChangeText={setLoanDateDMY}
                      placeholder="DD-MM-YYYY"
                    />
                    <Ionicons name="calendar-outline" size={16} color="#475569" />
                  </View>
                </View>
              </View>

              {/* Loan period pills: 1 mo, 3 mo, 6 mo, 12 mo */}
              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Loan period</Text>
                <View style={styles.periodPillsRow}>
                  {[
                    { label: '1 mo', months: 1 },
                    { label: '3 mo', months: 3 },
                    { label: '6 mo', months: 6 },
                    { label: '12 mo', months: 12 },
                  ].map((p) => {
                    const isSelected = loanPeriodMonths === p.months;
                    return (
                      <TouchableOpacity
                        key={p.months}
                        style={[styles.periodPill, isSelected && styles.periodPillSelected]}
                        onPress={() => setLoanPeriodMonths(p.months)}
                      >
                        <Text style={[styles.periodPillText, isSelected && styles.periodPillTextSelected]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Due date * */}
              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>
                  Due date <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={styles.dateInput}
                    value={dueDateDMY}
                    onChangeText={setDueDateDMY}
                    placeholder="DD-MM-YYYY"
                  />
                  <Ionicons name="calendar-outline" size={16} color="#475569" />
                </View>
              </View>

              {/* Loan amount (₹) * */}
              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>
                  Loan amount (₹) <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.loanAmountInput]}
                  keyboardType="number-pad"
                  value={loanAmount}
                  onChangeText={setLoanAmount}
                  placeholder="0"
                />
                <Text style={styles.inputCaption}>
                  Available on {selectedBankAccount?.BankName || 'Bank'}: ₹{bankAvailableLimit.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.inputCaption}>
                  {totalNetWeight.toFixed(2)} g gold · worth ₹{totalMarketValue.toLocaleString('en-IN')} at 22K
                </Text>
              </View>

              {/* Row: Interest % p.a. * & Interest type */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>
                    Interest % p.a. <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={interestRate}
                    onChangeText={setInterestRate}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Interest type</Text>
                  <View style={styles.interestTypeRow}>
                    {(['Simple', 'Compound'] as const).map((t) => {
                      const isSelected = interestType === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[styles.interestTypeBtn, isSelected && styles.interestTypeBtnSelected]}
                          onPress={() => setInterestType(t)}
                        >
                          <Text
                            style={[
                              styles.interestTypeBtnText,
                              isSelected && styles.interestTypeBtnTextSelected,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Charges (deducted from disbursement) */}
              <View style={styles.formBlock}>
                <Text style={styles.chargesSectionHeading}>
                  Charges (deducted from disbursement)
                </Text>
                <View style={styles.chargesThreeColRow}>
                  <View style={styles.chargeCol}>
                    <Text style={styles.chargeColLabel}>Processing</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={processingFee}
                      onChangeText={setProcessingFee}
                    />
                  </View>
                  <View style={styles.chargeCol}>
                    <Text style={styles.chargeColLabel}>Document</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={documentCharge}
                      onChangeText={setDocumentCharge}
                    />
                  </View>
                  <View style={styles.chargeCol}>
                    <Text style={styles.chargeColLabel}>Insurance</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={insuranceCharge}
                      onChangeText={setInsuranceCharge}
                    />
                  </View>
                </View>
              </View>

              {/* Calculation Summary Card */}
              <View style={styles.calcSummaryCard}>
                <View style={styles.calcSummaryRow}>
                  <Text style={styles.calcSummaryLabel}>Interest for period</Text>
                  <Text style={styles.calcSummaryVal}>
                    ₹{periodInterest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.calcSummaryRow}>
                  <Text style={styles.calcSummaryLabel}>Total charges</Text>
                  <Text style={styles.calcSummaryVal}>
                    ₹{totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.calcSummaryRow}>
                  <Text style={styles.calcSummaryLabel}>Net disbursement</Text>
                  <Text style={[styles.calcSummaryVal, styles.calcSummaryBold]}>
                    ₹{netDisbursement.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Remarks */}
              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={[styles.textInput, styles.remarksInput]}
                  multiline
                  numberOfLines={3}
                  placeholder="Optional loan notes..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* ─── STEP 5: REVIEW & CONFIRMATION ─── */}
          {/* ══════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              {/* 1. Customer & Account Card */}
              <Text style={styles.reviewSectionTitle}>Customer & account</Text>
              <View style={styles.reviewTableCard}>
                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Customer</Text>
                  <Text style={styles.reviewValBold}>{selectedCustomer?.FullName || '—'}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Bank account</Text>
                  <Text style={styles.reviewVal}>
                    {selectedBankAccount?.BankName || 'Bank'} · ****{' '}
                    {selectedBankAccount?.AccountNumber ? String(selectedBankAccount.AccountNumber).slice(-4) : '****'}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Available bank limit</Text>
                  <Text style={styles.reviewValBold}>
                    ₹{bankAvailableLimit.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Limit after loan</Text>
                  <Text style={styles.reviewValBold}>
                    ₹{limitAfterLoan.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* 2. Pledged Gold Card */}
              <Text style={styles.reviewSectionTitle}>Pledged gold</Text>
              <View style={styles.reviewTableCard}>
                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Ornaments</Text>
                  <Text style={styles.reviewVal} numberOfLines={2}>
                    {selectedOrnaments.map((o) => o.OrnamentName).join(', ') || '—'}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Gold weight</Text>
                  <Text style={styles.reviewValBold}>{totalNetWeight.toFixed(2)} g</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Gross / Net</Text>
                  <Text style={styles.reviewValBold}>
                    {totalGrossWeight.toFixed(2)} g / {totalNetWeight.toFixed(2)} g
                  </Text>
                </View>
              </View>

              {/* 3. Terms Card */}
              <Text style={styles.reviewSectionTitle}>Terms</Text>
              <View style={styles.reviewTableCard}>
                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Loan number</Text>
                  <Text style={styles.reviewValBold}>{loanNumber}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Loan amount</Text>
                  <Text style={styles.reviewValBold}>
                    ₹{parsedLoanAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Interest</Text>
                  <Text style={styles.reviewValBold}>
                    {parsedRate}% p.a. · {interestType}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Loan period</Text>
                  <Text style={styles.reviewValBold}>{loanPeriodMonths} months</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Loan date</Text>
                  <Text style={styles.reviewVal}>{formatLoanDate(dmyToYmd(loanDateDMY))}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Due date</Text>
                  <Text style={styles.reviewVal}>{formatLoanDate(dmyToYmd(dueDateDMY))}</Text>
                </View>
              </View>

              {/* 4. Charges & Disbursement Card */}
              <Text style={styles.reviewSectionTitle}>Charges & disbursement</Text>
              <View style={styles.reviewTableCard}>
                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Processing fee</Text>
                  <Text style={styles.reviewVal}>₹{parsedProcessing}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Document charge</Text>
                  <Text style={styles.reviewVal}>₹{parsedDocument}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Insurance charge</Text>
                  <Text style={styles.reviewVal}>₹{parsedInsurance}</Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Interest for period</Text>
                  <Text style={styles.reviewVal}>
                    ₹{periodInterest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Total charges</Text>
                  <Text style={styles.reviewVal}>
                    ₹{totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.calcSummaryDivider} />

                <View style={styles.reviewTableRow}>
                  <Text style={styles.reviewLabel}>Net disbursement</Text>
                  <Text style={styles.reviewGreenVal}>
                    ₹{netDisbursement.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color="#0284c7"
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={styles.infoBannerText}>
                  Creating this loan marks {selectedOrnamentIds.length} ornament
                  {selectedOrnamentIds.length === 1 ? '' : 's'} as Pledged and uses ₹
                  {parsedLoanAmount.toLocaleString('en-IN')} of the bank limit. Interest is not deducted
                  upfront.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ─── 3. STICKY BOTTOM ACTION BAR ─── */}
        <View style={styles.bottomBar}>
          {/* Step 3 only: 3-column weight summary row */}
          {currentStep === 3 && (
            <View style={styles.step3SummaryBar}>
              <View style={styles.step3SummaryCol}>
                <Text style={styles.step3SummaryLabel}>Gross</Text>
                <Text style={styles.step3SummaryVal}>{totalGrossWeight.toFixed(2)} g</Text>
              </View>
              <View style={styles.step3SummaryCol}>
                <Text style={styles.step3SummaryLabel}>Net</Text>
                <Text style={styles.step3SummaryVal}>{totalNetWeight.toFixed(2)} g</Text>
              </View>
              <View style={styles.step3SummaryCol}>
                <Text style={styles.step3SummaryLabel}>Metal</Text>
                <Text style={styles.step3SummaryVal}>{totalMetalWeight.toFixed(2)} g</Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          {currentStep === 1 && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, !selectedCustomerId && styles.btnDisabled]}
              onPress={handleContinueStep1}
              activeOpacity={0.85}
              disabled={!selectedCustomerId}
            >
              <Text style={styles.primaryActionBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
          )}

          {currentStep === 2 && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, !selectedBankAccountId && styles.btnDisabled]}
              onPress={handleContinueStep2}
              activeOpacity={0.85}
              disabled={!selectedBankAccountId}
            >
              <Text style={styles.primaryActionBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
          )}

          {currentStep === 3 && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, selectedOrnamentIds.length === 0 && styles.btnDisabled]}
              onPress={handleContinueStep3}
              activeOpacity={0.85}
              disabled={selectedOrnamentIds.length === 0}
            >
              <Text style={styles.primaryActionBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
          )}

          {currentStep === 4 && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, parsedLoanAmount <= 0 && styles.btnDisabled]}
              onPress={handleContinueStep4}
              activeOpacity={0.85}
              disabled={parsedLoanAmount <= 0}
            >
              <Text style={styles.primaryActionBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
          )}

          {currentStep === 5 && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, submitting && styles.btnDisabled]}
              onPress={handleCreateLoan}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryActionBtnText}>Create Loan</Text>
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ─── QUICK MODAL 1: ADD CUSTOMER ─── */}
        <Modal visible={showAddCustomerModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Customer</Text>
                <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Ramesh Kumar Iyer"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Mobile Number *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10-digit mobile"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="phone-pad"
                    value={newCustomerPhone}
                    onChangeText={setNewCustomerPhone}
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddCustomerModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleQuickAddCustomer}>
                  <Text style={styles.modalSaveText}>Save Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── QUICK MODAL 2: ADD BANK ACCOUNT ─── */}
        <Modal visible={showAddBankModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Bank Account</Text>
                <TouchableOpacity onPress={() => setShowAddBankModal(false)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={newBankName}
                    onChangeText={setNewBankName}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Account Number *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Account number"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="number-pad"
                    value={newAccountNumber}
                    onChangeText={setNewAccountNumber}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    autoCapitalize="characters"
                    value={newIFSCCode}
                    onChangeText={setNewIFSCCode}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Max Loan Limit (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 500000"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="number-pad"
                    value={newMaxLimit}
                    onChangeText={setNewMaxLimit}
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddBankModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleQuickAddBank}>
                  <Text style={styles.modalSaveText}>Save Bank Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── QUICK MODAL 3: ADD ORNAMENT ─── */}
        <Modal visible={showAddOrnamentModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Ornament</Text>
                <TouchableOpacity onPress={() => setShowAddOrnamentModal(false)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Ornament Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Men's bracelet"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={newOrnamentName}
                    onChangeText={setNewOrnamentName}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Purity</Text>
                  <View style={styles.purityToggleRow}>
                    {(['24K', '22K', '18K'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.purityToggleBtn,
                          newOrnamentPurity === p && styles.purityToggleBtnActive,
                        ]}
                        onPress={() => setNewOrnamentPurity(p)}
                      >
                        <Text
                          style={[
                            styles.purityToggleText,
                            newOrnamentPurity === p && styles.purityToggleTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Gross Weight (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 14.20"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="decimal-pad"
                    value={newGrossWeight}
                    onChangeText={setNewGrossWeight}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Net Weight (g) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 14.20"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="decimal-pad"
                    value={newNetWeight}
                    onChangeText={setNewNetWeight}
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddOrnamentModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleQuickAddOrnament}>
                  <Text style={styles.modalSaveText}>Save Ornament</Text>
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
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 10 : 6,
      paddingBottom: 12,
    },
    topHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
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

    // 5-segment progress bar
    progressContainer: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 12,
      alignItems: 'center',
    },
    progressSegment: {
      flex: 1,
      height: 3.5,
      borderRadius: 2,
    },
    progressSegmentFilled: {
      backgroundColor: '#0077c8',
    },
    progressSegmentEmpty: {
      backgroundColor: isDark ? '#334155' : 'rgba(0, 119, 200, 0.16)',
    },

    // ─── 2. SCROLLABLE BODY ───
    bodyScroll: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },
    bodyContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 100,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    stepContainer: {
      gap: 12,
    },

    // Search bar
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      marginBottom: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 0,
    },

    // Customer Card
    customerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      padding: 13,
    },
    cardSelected: {
      borderColor: '#0077c8',
      borderWidth: 2,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#0284c7',
    },
    cardInfo: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    cardSub: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    customerAvailText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#16a34a',
      marginTop: 2,
    },

    // Radio Circle
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: isDark ? '#475569' : '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    radioCircleSelected: {
      backgroundColor: '#0077c8',
      borderColor: '#0077c8',
    },

    // Add button card (+ Add new customer / + Add bank account / + Add ornament)
    addButtonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingVertical: 11,
      marginTop: 4,
    },
    addButtonText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },

    // Step 2 Header
    step2HeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    step2HeaderLabel: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    step2HeaderVal: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 1,
    },
    step2HeaderGreenVal: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#16a34a',
      marginTop: 1,
    },

    // Bank Card
    bankCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      padding: 13,
    },
    bankTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bankIconBox: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    bankTitles: {
      flex: 1,
    },
    bankName: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    bankSub: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },
    bankMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#f1f5f9',
      paddingTop: 10,
      marginTop: 10,
    },
    bankMetricCol: {
      flex: 1,
    },
    metricLabel: {
      fontSize: 10.5,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    metricVal: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 2,
    },
    metricGreenVal: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#16a34a',
      marginTop: 2,
    },

    // Step 3 Ornaments
    step3HeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    step3Notice: {
      fontSize: 11.5,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    step3Count: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#0284c7',
    },
    ornamentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      padding: 12,
    },
    ornamentCardSelected: {
      backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
      borderColor: '#0077c8',
      borderWidth: 2,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: isDark ? '#475569' : '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: '#0077c8',
      borderColor: '#0077c8',
    },
    diamondIconBox: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    ornamentInfo: {
      flex: 1,
    },
    ornamentTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    ornamentSub: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    ownerNoticeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 3,
    },
    ownerNoticeText: {
      fontSize: 10.5,
      color: '#0284c7',
    },

    // Step 4 Form
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formCol: {
      flex: 1,
    },
    formBlock: {
      gap: 4,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 3,
    },
    requiredAsterisk: {
      color: '#d92d20',
      fontWeight: '700',
    },
    textInput: {
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      paddingHorizontal: 12,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    loanAmountInput: {
      fontSize: 15,
      fontWeight: '700',
    },
    inputCaption: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 3,
    },
    dateInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      paddingHorizontal: 12,
    },
    dateInput: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 0,
    },
    periodPillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    periodPill: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodPillSelected: {
      borderColor: '#0284c7',
      borderWidth: 2,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#f0f9ff',
    },
    periodPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#475569',
    },
    periodPillTextSelected: {
      color: '#0284c7',
      fontWeight: '700',
    },
    interestTypeRow: {
      flexDirection: 'row',
      gap: 6,
    },
    interestTypeBtn: {
      flex: 1,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    interestTypeBtnSelected: {
      borderColor: '#0284c7',
      borderWidth: 2,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#f0f9ff',
    },
    interestTypeBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#475569',
    },
    interestTypeBtnTextSelected: {
      color: '#0284c7',
      fontWeight: '700',
    },
    chargesSectionHeading: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 3,
    },
    chargesThreeColRow: {
      flexDirection: 'row',
      gap: 8,
    },
    chargeCol: {
      flex: 1,
    },
    chargeColLabel: {
      fontSize: 10.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 3,
    },

    // Calc Summary Card
    calcSummaryCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
    },
    calcSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    calcSummaryDivider: {
      height: 1,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
    },
    calcSummaryLabel: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    calcSummaryVal: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    calcSummaryBold: {
      fontWeight: '800',
    },
    remarksInput: {
      height: 70,
      paddingTop: 8,
      textAlignVertical: 'top',
    },

    // Step 5 Review
    reviewSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 4,
    },
    reviewTableCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
      marginBottom: 4,
    },
    reviewTableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    reviewLabel: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    reviewVal: {
      fontSize: 12.5,
      fontWeight: '500',
      color: isDark ? '#f8fafc' : '#0f172a',
      maxWidth: '65%',
      textAlign: 'right',
    },
    reviewValBold: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      maxWidth: '65%',
      textAlign: 'right',
    },
    reviewGreenVal: {
      fontSize: 13,
      fontWeight: '800',
      color: '#16a34a',
    },
    infoBanner: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.25)',
      padding: 12,
      marginTop: 4,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 16,
      color: isDark ? '#38bdf8' : '#0369a1',
    },

    // ─── 3. STICKY BOTTOM ACTION BAR ───
    bottomBar: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    step3SummaryBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 10,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    },
    step3SummaryCol: {
      alignItems: 'center',
    },
    step3SummaryLabel: {
      fontSize: 10.5,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    step3SummaryVal: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 2,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      height: 46,
      borderRadius: 12,
      backgroundColor: '#0077c8',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    primaryActionBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    btnDisabled: {
      opacity: 0.5,
    },

    // Empty Box
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    emptyText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 8,
    },
    emptySubText: {
      fontSize: 11.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 3,
      textAlign: 'center',
    },

    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#e2e8f0',
    },
    modalTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    modalBody: {
      padding: 14,
      gap: 10,
    },
    modalField: {
      gap: 4,
    },
    modalLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    modalInput: {
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 10,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    },
    purityToggleRow: {
      flexDirection: 'row',
      gap: 8,
    },
    purityToggleBtn: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    purityToggleBtnActive: {
      borderColor: '#0284c7',
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
    },
    purityToggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    purityToggleTextActive: {
      color: '#0284c7',
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#e2e8f0',
    },
    modalCancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    modalCancelText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    modalSaveBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#0077c8',
    },
    modalSaveText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
