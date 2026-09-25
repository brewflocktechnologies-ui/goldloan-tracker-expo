import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BankCard } from '../../components/BankCard';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LoanCard } from '../../components/LoanCard';
import { OptionPickerModal } from '../../components/ornaments/OptionPickerModal';
import { UserOptionsMenu, UserOptionsMenuHandle } from '../../components/users/UserOptionsMenu';
import { UserStatusBadge } from '../../components/users/UserStatusBadge';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  ExtraUserBankAccount,
  ExtraUserLoan,
  formatMaskedAadhaar,
  formatMaskedPAN,
  formatPhoneNumber,
  INDIAN_STATES,
  OCCUPATION_OPTIONS,
  USER_SORT_OPTIONS
} from '../../mock/userMockExtras';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { User } from '../../types';
import {
  buildUserStatsMap,
  calculateAge,
  calculateAvailableLimit,
  calculateDueBadge,
  calculateOutstandingAmount,
  calculateUtilizationPercentage,
  countUsersByStatus,
  formatDisplayDOB,
  formatInputDOB,
  getUserLastActive,
} from '../../utils/calculations';

// Avatar initial colors for visual consistency
const AVATAR_COLORS = [
  { bg: '#e6f8ee', text: '#07ba80' }, // Mint (matching design)
  { bg: '#e0f2fe', text: '#0284c7' }, // Sky
  { bg: '#fef3c7', text: '#d97706' }, // Amber
  { bg: '#dcfce7', text: '#16a34a' }, // Green
  { bg: '#f3e8ff', text: '#9333ea' }, // Purple
  { bg: '#fee2e2', text: '#dc2626' }, // Rose
  { bg: '#ffedd5', text: '#ea580c' }, // Orange
  { bg: '#ccfbf1', text: '#0d9488' }, // Teal
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function UsersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 460;
  const styles = getStyles(colors, isDark, isSmall);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  // View mode: 'list' | 'details' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'add' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // List State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortOption, setSortOption] = useState('Newest First');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Details State
  const [activeTab, setActiveTab] = useState<'Profile' | 'Bank Accounts' | 'Loans'>('Profile');
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPAN, setShowPAN] = useState(false);
  const optionsMenuRef = useRef<UserOptionsMenuHandle>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Add / Edit State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    FullName: '',
    FatherHusbandName: '',
    CustomerCode: '',
    MobileNumber: '',
    AlternateMobileNumber: '',
    Email: '',
    DateOfBirth: '',
    Gender: 'Male' as 'Male' | 'Female' | 'Other',
    Occupation: '',
    AadhaarNumber: '',
    PANNumber: '',
    AddressLine1: '',
    AddressLine2: '',
    City: 'Bengaluru',
    State: 'Karnataka',
    Pincode: '560041',
    CustomerPhoto: '',
    Status: 'Active' as 'Active' | 'Inactive',
  });
  const [filesPayload, setFilesPayload] = useState<any[]>([]);

  // Picker Modal State (for State, Occupation, Gender)
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    field: 'State' | 'Occupation';
    options: string[];
  }>({
    visible: false,
    title: '',
    field: 'State',
    options: [],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Filter counts
  const totalCount = store.users.length;
  const activeCount = useMemo(() => countUsersByStatus(store.users, 'Active'), [store.users]);
  const inactiveCount = useMemo(() => countUsersByStatus(store.users, 'Inactive'), [store.users]);

  // Map users to loan count and gold weight
  const userStatsMap = useMemo(
    () => buildUserStatsMap(store.users, store.loans, store.ornaments),
    [store.users, store.loans, store.ornaments]
  );

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = store.users.filter(u => {
      if (activeFilter !== 'All' && u.Status !== activeFilter) return false;
      if (!q) return true;

      const name = (u.FullName || '').toLowerCase();
      const id = (u.UserId || '').toLowerCase();
      const code = (u.CustomerCode || '').toLowerCase();
      const mobile = (u.MobileNumber || '').toLowerCase();
      const altMobile = (u.AlternateMobileNumber || '').toLowerCase();
      const email = (u.Email || '').toLowerCase();
      const aadhaar = (u.AadhaarNumber || '').toLowerCase();
      const pan = (u.PANNumber || '').toLowerCase();
      const city = (u.City || '').toLowerCase();
      const state = (u.State || '').toLowerCase();

      return (
        name.includes(q) ||
        id.includes(q) ||
        code.includes(q) ||
        mobile.includes(q) ||
        altMobile.includes(q) ||
        email.includes(q) ||
        aadhaar.includes(q) ||
        pan.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    });

    const idNum = (u: User) => parseInt(String(u.UserId || '').replace(/\D/g, ''), 10) || 0;

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'Oldest First':
          return idNum(a) - idNum(b);
        case 'Name (A-Z)':
          return (a.FullName || '').localeCompare(b.FullName || '');
        case 'Name (Z-A)':
          return (b.FullName || '').localeCompare(a.FullName || '');
        case 'Loans (High-Low)': {
          const lA = userStatsMap.get(a.UserId)?.loanCount || 0;
          const lB = userStatsMap.get(b.UserId)?.loanCount || 0;
          return lB - lA;
        }
        case 'Weight (High-Low)': {
          const wA = userStatsMap.get(a.UserId)?.goldWeight || 0;
          const wB = userStatsMap.get(b.UserId)?.goldWeight || 0;
          return wB - wA;
        }
        case 'Newest First':
        default:
          return idNum(b) - idNum(a);
      }
    });
  }, [store.users, activeFilter, searchQuery, sortOption, userStatsMap]);

  // Back Button Navigation
  useEffect(() => {
    const onBackPress = () => {
      if (pickerModal.visible) {
        setPickerModal(p => ({ ...p, visible: false }));
        return true;
      }
      if (optionsMenuRef.current?.isOpen()) {
        optionsMenuRef.current.close();
        return true;
      }
      if (deleteModalVisible) {
        setDeleteModalVisible(false);
        return true;
      }
      if (viewMode === 'add') {
        setViewMode('list');
        return true;
      }
      if (viewMode === 'edit') {
        setViewMode(selectedUser ? 'details' : 'list');
        return true;
      }
      if (viewMode === 'details') {
        setViewMode('list');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [viewMode, selectedUser, pickerModal.visible, deleteModalVisible]);

  // Open Details Screen
  const handleCardPress = (user: User) => {
    setSelectedUser(user);
    setActiveTab('Profile');
    setShowAadhaar(false);
    setShowPAN(false);
    setViewMode('details');
  };

  // Open Add Screen
  const handleAddPress = () => {
    setSelectedUser(null);
    setFilesPayload([]);
    const generatedCode = `CUST-${String(100 + store.users.length + 1).padStart(3, '0')}`;
    setForm({
      FullName: '',
      FatherHusbandName: '',
      CustomerCode: generatedCode,
      MobileNumber: '',
      AlternateMobileNumber: '',
      Email: '',
      DateOfBirth: '',
      Gender: 'Male',
      Occupation: 'Teacher',
      AadhaarNumber: '',
      PANNumber: '',
      AddressLine1: '',
      AddressLine2: '',
      City: 'Bengaluru',
      State: 'Karnataka',
      Pincode: '560041',
      CustomerPhoto: '',
      Status: 'Active',
    });
    setViewMode('add');
  };

  // Open Edit Screen
  const handleEditPress = (user: User) => {
    setSelectedUser(user);
    setFilesPayload([]);
    setForm({
      FullName: user.FullName || '',
      FatherHusbandName: user.FatherHusbandName || '',
      CustomerCode: user.CustomerCode || user.UserId || '',
      MobileNumber: user.MobileNumber || '',
      AlternateMobileNumber: user.AlternateMobileNumber || '',
      Email: user.Email || '',
      DateOfBirth: formatInputDOB(user.DateOfBirth),
      Gender: (user.Gender as any) || 'Male',
      Occupation: user.Occupation || 'Teacher',
      AadhaarNumber: user.AadhaarNumber || '',
      PANNumber: user.PANNumber || '',
      AddressLine1: user.AddressLine1 || '',
      AddressLine2: user.AddressLine2 || '',
      City: user.City || 'Bengaluru',
      State: user.State || 'Karnataka',
      Pincode: user.Pincode || '560041',
      CustomerPhoto: user.CustomerPhoto || '',
      Status: user.Status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setViewMode('edit');
  };

  // Take photo with camera
  const handlePickCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setForm(p => ({ ...p, CustomerPhoto: asset.uri }));
        if (asset.base64) {
          setFilesPayload([
            {
              name: `avatar_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              base64: asset.base64,
            },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to capture photo');
    }
  };

  // Choose photo from gallery
  const handlePickGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setForm(p => ({ ...p, CustomerPhoto: asset.uri }));
        if (asset.base64) {
          setFilesPayload([
            {
              name: `avatar_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              base64: asset.base64,
            },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select photo');
    }
  };

  // Save User
  const handleSaveForm = async () => {
    if (!form.FullName.trim()) {
      Alert.alert('Required Field', 'Please enter Full Name.');
      return;
    }
    const cleanMobile = form.MobileNumber.replace(/[^\d]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<User> = {
        FullName: form.FullName.trim(),
        FatherHusbandName: form.FatherHusbandName.trim(),
        CustomerCode: form.CustomerCode.trim(),
        MobileNumber: cleanMobile,
        AlternateMobileNumber: form.AlternateMobileNumber.trim(),
        Email: form.Email.trim(),
        DateOfBirth: form.DateOfBirth.trim(),
        Gender: form.Gender,
        Occupation: form.Occupation.trim(),
        AadhaarNumber: form.AadhaarNumber.trim(),
        PANNumber: form.PANNumber.trim(),
        AddressLine1: form.AddressLine1.trim(),
        AddressLine2: form.AddressLine2.trim(),
        City: form.City.trim(),
        State: form.State.trim(),
        Pincode: form.Pincode.trim(),
        CustomerPhoto: form.CustomerPhoto,
        Status: form.Status,
      };

      if (viewMode === 'edit' && selectedUser) {
        store.updateUser(selectedUser.UserId, { ...payload, files: filesPayload });
        toast.success(`Customer "${form.FullName}" updated successfully`);
        setSelectedUser(prev => (prev ? ({ ...prev, ...payload } as User) : null));
        setViewMode('details');
      } else {
        const newUser = store.addUser({ ...payload, files: filesPayload });
        toast.success(`Customer "${form.FullName}" registered successfully`);
        setSelectedUser(newUser);
        setViewMode('details');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Actions for Phone / WhatsApp
  // phone accepts number too: the Sheets API can return an all-digit cell as a JS number.
  const handleCallCustomer = (phone?: string | number) => {
    if (!phone) {
      toast.warning('No mobile number available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      toast.danger('Could not open phone dialer');
    });
  };

  const handleWhatsAppCustomer = (phone?: string | number) => {
    if (!phone) {
      toast.warning('No mobile number available');
      return;
    }
    const clean = String(phone).replace(/[^\d]/g, '');
    const fullNum = clean.startsWith('91') ? clean : `91${clean}`;
    Linking.openURL(`https://wa.me/${fullNum}`).catch(() => {
      toast.danger('Could not open WhatsApp');
    });
  };

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    toast.info(`Copied Code: ${code}`);
  };

  // ══════════════════════════════════════════════════════════
  // VIEW: DETAILS SCREEN MATCHING Users Screen.pdf
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'details' && selectedUser) {
    const directPhoto = selectedUser.CustomerPhoto ? getDriveImageUrl(selectedUser.CustomerPhoto) : '';
    const avatarTone = getAvatarColor(selectedUser.FullName);
    const initials = (selectedUser.FullName || 'U')
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    // Bank accounts for this user — real data only; blank fields show '—', not a fake value.
    const userBanks = store.bankAccounts.filter(b => b.UserId === selectedUser.UserId);
    const displayBanks: ExtraUserBankAccount[] = userBanks.map(b => ({
      BankAccountId: b.BankAccountId,
      UserId: b.UserId,
      BankName: b.BankName || '—',
      AccountType: b.AccountType || '—',
      BranchName: b.BranchName || '—',
      City: b.City || '',
      PassbookImage: b.PassbookImage || '',
      AccountNumber: b.AccountNumber || '—',
      IFSCCode: b.IFSCCode || '—',
      AccountHolderName: b.AccountHolderName || selectedUser.FullName,
      UPI_ID: b.UPI_ID || '—',
      Status: b.Status === 'Inactive' ? 'Inactive' : 'Active',
      MaxLoanAmount: b.MaxLoanAmount || 0,
      UtilizedLoanAmount: b.UtilizedLoanAmount || 0,
      AvailableLoanAmount: calculateAvailableLimit(b),
      UtilizationPercentage: calculateUtilizationPercentage(b),
    }));

    // Loans for this user — real data only. DueBadgeText is computed for real from the
    // real DueDate column (was previously a hardcoded "12 days left" / "18 days overdue").
    // OutstandingAmount has no backing sheet field or payments-based calc anywhere in the
    // app yet, so it's the one value still derived rather than real — flagged "(mock)" in the UI.
    const userLoans = store.loans.filter(l => l.UserId === selectedUser.UserId);
    const displayLoans: ExtraUserLoan[] = userLoans.map(l => {
      const loanOrns = store.ornaments.filter(o => (l.ornamentIds || []).includes(o.OrnamentId));
      let firstPhoto = loanOrns.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
      if (!firstPhoto && store.ornaments.length > 0) {
        firstPhoto = store.ornaments.find(o => o.OrnamentImages)?.OrnamentImages?.split('|')?.[0]?.trim() || '';
      }
      const ornCount = (l.ornamentIds || []).length || loanOrns.length;
      const isOverdue = l.LoanStatus === 'Overdue';
      const dueBadge = calculateDueBadge(l.DueDate, l.LoanStatus);
      const totalWeight = (l.NetWeight || l.GrossWeight) || loanOrns.reduce((sum, o) => sum + (o.NetWeight || o.GrossWeight || 0), 0);

      return {
        LoanId: l.LoanId,
        LoanNumber: l.LoanNumber || `LN-${l.LoanId}`,
        LoanDate: l.LoanDate || '—',
        DueDate: l.DueDate || '—',
        Status: isOverdue ? 'Overdue' : (l.LoanStatus === 'Closed' ? 'Closed' : 'Active'),
        LoanAmount: l.LoanAmount || 0,
        OutstandingAmount: calculateOutstandingAmount(l),
        DueBadgeText: dueBadge.text,
        DueBadgeType: dueBadge.type,
        OrnamentsCount: ornCount,
        TotalWeightGrams: totalWeight,
        InterestRateText: `${l.InterestRate || 0}% p.a.`,
        InterestType: l.InterestType || 'Simple',
        OrnamentImageUri: firstPhoto,
      };
    });

    return (
      <View style={styles.subScreenContainer}>
        {/* Header matching PDF */}
        <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={styles.headerBackBtn}
            accessibilityLabel="Go back to customer list"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Customer Details</Text>
            <Text style={styles.headerSubtitle}>View and manage customer information</Text>
          </View>
          <UserOptionsMenu
            ref={optionsMenuRef}
            isDark={isDark}
            textPrimaryColor={colors.textPrimary}
            isSuperAdmin={isSuperAdmin}
            onEdit={() => handleEditPress(selectedUser)}
            onDelete={() => setDeleteModalVisible(true)}
            onCopyId={() => handleCopyCode(selectedUser.CustomerCode || selectedUser.UserId)}
            onCall={() => handleCallCustomer(selectedUser.MobileNumber)}
            onWhatsApp={() => handleWhatsAppCustomer(selectedUser.MobileNumber)}
          />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.detailScrollContent}>
          {/* Hero Card matching PDF */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              {directPhoto || selectedUser.CustomerPhoto ? (
                <Image
                  source={{ uri: directPhoto || selectedUser.CustomerPhoto }}
                  style={styles.heroAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.heroAvatarInitialsBox, { backgroundColor: avatarTone.bg }]}>
                  <Text style={[styles.heroAvatarInitialsText, { color: avatarTone.text }]}>{initials}</Text>
                </View>
              )}

              <View style={styles.heroInfoCol}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName} numberOfLines={1}>{selectedUser.FullName}</Text>
                  <UserStatusBadge status={selectedUser.Status} isDark={isDark} variant="pill" />
                </View>

                <Text style={styles.heroCodeText}>
                  {selectedUser.CustomerCode || selectedUser.UserId}
                </Text>
                <Text style={styles.heroPhoneText}>
                  {formatPhoneNumber(selectedUser.MobileNumber)}
                </Text>
                <Text style={styles.heroLocationText} numberOfLines={1}>
                  {[selectedUser.City || 'Bengaluru', selectedUser.State || 'Karnataka'].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>

            {/* Quick action buttons: Call & WhatsApp */}
            <View style={styles.heroActionButtonsRow}>
              <TouchableOpacity
                style={styles.heroCallBtn}
                onPress={() => handleCallCustomer(selectedUser.MobileNumber)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.heroCallBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroWhatsAppBtn}
                onPress={() => handleWhatsAppCustomer(selectedUser.MobileNumber)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.heroWhatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Switcher: Profile | Bank Accounts | Loans */}
          <View style={styles.tabsSegmentContainer}>
            <TouchableOpacity
              style={styles.tabSegmentBtn}
              onPress={() => setActiveTab('Profile')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, activeTab === 'Profile' && styles.tabSegmentTextActive]}>
                Profile
              </Text>
              {activeTab === 'Profile' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabSegmentBtn}
              onPress={() => setActiveTab('Bank Accounts')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, activeTab === 'Bank Accounts' && styles.tabSegmentTextActive]}>
                Bank Accounts
              </Text>
              {activeTab === 'Bank Accounts' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabSegmentBtn}
              onPress={() => setActiveTab('Loans')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, activeTab === 'Loans' && styles.tabSegmentTextActive]}>
                Loans
              </Text>
              {activeTab === 'Loans' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* TAB 1: PROFILE */}
          {activeTab === 'Profile' && (
            <View style={styles.tabContentArea}>
              {/* Section 1: Personal Information */}
              <View style={styles.profileSection}>
                <View style={styles.profileHeadingRow}>
                  <View style={styles.profileIconBox}>
                    <Ionicons name="person-outline" size={17} color="#0284c7" />
                  </View>
                  <Text style={styles.profileSectionTitle}>Personal Information</Text>
                </View>
                <View style={styles.profileDivider} />

                <View style={styles.profileRowsList}>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Full Name</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.FullName}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Father / Husband Name</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.FatherHusbandName || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Customer Code</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.CustomerCode || selectedUser.UserId}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Mobile Number</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{formatPhoneNumber(selectedUser.MobileNumber)}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Alternate Mobile Number</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>
                        {selectedUser.AlternateMobileNumber ? formatPhoneNumber(selectedUser.AlternateMobileNumber) : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Email Address</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.Email || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Date of Birth</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>
                        {selectedUser.DateOfBirth
                          ? `${formatDisplayDOB(selectedUser.DateOfBirth)}${calculateAge(selectedUser.DateOfBirth)}`
                          : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Gender</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.Gender || 'Male'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Occupation</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.Occupation || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Status</Text>
                    <View style={styles.profileRowValueContainer}>
                      <View style={styles.profileStatusRow}>
                        <View
                          style={[
                            styles.profileStatusDot,
                            { backgroundColor: selectedUser.Status === 'Active' ? '#10b981' : '#64748b' },
                          ]}
                        />
                        <Text style={styles.profileRowValueText}>{selectedUser.Status || 'Active'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 2: KYC Information */}
              {(() => {
                const aadhaarRaw = selectedUser.AadhaarNumber != null ? String(selectedUser.AadhaarNumber).replace(/\s+/g, '') : '';
                const unmaskedAadhaar = aadhaarRaw ? aadhaarRaw.replace(/(\d{4})/g, '$1 ').trim() : '—';
                const maskedAadhaar = formatMaskedAadhaar(selectedUser.AadhaarNumber);

                const panRaw = selectedUser.PANNumber != null ? String(selectedUser.PANNumber).toUpperCase().trim() : '';
                const maskedPan = formatMaskedPAN(selectedUser.PANNumber);
                const unmaskedPan = panRaw || '—';

                return (
                  <View style={styles.profileSection}>
                    <View style={styles.profileHeadingRow}>
                      <View style={styles.profileIconBox}>
                        <Ionicons name="shield-checkmark-outline" size={17} color="#0284c7" />
                      </View>
                      <Text style={styles.profileSectionTitle}>KYC Information</Text>
                    </View>
                    <View style={styles.profileDivider} />

                    <View style={styles.profileRowsList}>
                      <View style={styles.profileRow}>
                        <Text style={styles.profileRowLabel}>Aadhaar Number</Text>
                        <View style={styles.profileRowValueContainer}>
                          <Text style={styles.profileRowValueText}>
                            {showAadhaar ? unmaskedAadhaar : maskedAadhaar}
                          </Text>
                          {aadhaarRaw ? (
                            <TouchableOpacity
                              style={styles.privacyEyeBtn}
                              onPress={() => setShowAadhaar(!showAadhaar)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel={showAadhaar ? 'Hide Aadhaar number' : 'Show Aadhaar number'}
                            >
                              <Ionicons
                                name={showAadhaar ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color={isDark ? '#94a3b8' : '#64748b'}
                              />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.profileRow}>
                        <Text style={styles.profileRowLabel}>PAN Number</Text>
                        <View style={styles.profileRowValueContainer}>
                          <Text style={styles.profileRowValueText}>
                            {showPAN ? unmaskedPan : maskedPan}
                          </Text>
                          {panRaw ? (
                            <TouchableOpacity
                              style={styles.privacyEyeBtn}
                              onPress={() => setShowPAN(!showPAN)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel={showPAN ? 'Hide PAN number' : 'Show PAN number'}
                            >
                              <Ionicons
                                name={showPAN ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color={isDark ? '#94a3b8' : '#64748b'}
                              />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Section 3: Address */}
              <View style={[styles.profileSection, styles.profileSectionLast]}>
                <View style={styles.profileHeadingRow}>
                  <View style={styles.profileIconBox}>
                    <Ionicons name="location-outline" size={17} color="#0284c7" />
                  </View>
                  <Text style={styles.profileSectionTitle}>Address</Text>
                </View>
                <View style={styles.profileDivider} />

                <View style={styles.profileRowsList}>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Address Line 1</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.AddressLine1 || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Address Line 2</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.AddressLine2 || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>City</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.City || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>State</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.State || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileRow}>
                    <Text style={styles.profileRowLabel}>Pincode</Text>
                    <View style={styles.profileRowValueContainer}>
                      <Text style={styles.profileRowValueText}>{selectedUser.Pincode || '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: BANK ACCOUNTS */}
          {activeTab === 'Bank Accounts' && (
            <View style={styles.tabContentArea}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons
                  name="bank"
                  size={20}
                  color={isDark ? '#f8fafc' : '#0d172a'}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sectionHeaderTitle}>Bank Accounts ({displayBanks.length})</Text>
              </View>

              {displayBanks.length === 0 && (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="bank-outline" size={28} color={isDark ? '#475569' : '#cbd5e1'} />
                  <Text style={{ marginTop: 8, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                    No bank accounts on file
                  </Text>
                </View>
              )}

              {displayBanks.map((acc, idx) => (
                <BankCard
                  key={acc.BankAccountId || idx}
                  account={acc}
                  style={idx === displayBanks.length - 1 ? { marginBottom: 0 } : undefined}
                />
              ))}
            </View>
          )}

          {/* TAB 3: LOANS */}
          {activeTab === 'Loans' && (
            <View style={styles.tabContentArea}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={isDark ? '#f8fafc' : '#0d172a'}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sectionHeaderTitle}>Loans ({displayLoans.length})</Text>
              </View>

              {displayLoans.length === 0 && (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={28} color={isDark ? '#475569' : '#cbd5e1'} />
                  <Text style={{ marginTop: 8, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                    No loans on file
                  </Text>
                </View>
              )}

              {displayLoans.map((loan, idx) => (
                <LoanCard
                  key={loan.LoanId || idx}
                  loan={loan}
                  onViewLoan={() => router.push(`/loans/${loan.LoanId}` as any)}
                  style={idx === displayLoans.length - 1 ? { marginBottom: 0 } : undefined}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button for Adding Loan */}
        {activeTab === 'Loans' && (
          <TouchableOpacity
            style={styles.loanFabBtn}
            onPress={() => router.push('/loans/new' as any)}
            activeOpacity={0.85}
            accessibilityLabel="Add New Loan"
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={deleteModalVisible}
          title="Delete Customer"
          message={`Are you sure you want to delete "${selectedUser.FullName}" (${selectedUser.CustomerCode || selectedUser.UserId})? This action will permanently remove this customer from Google Sheets.`}
          confirmLabel="Delete Customer"
          cancelLabel="Cancel"
          type="danger"
          onConfirm={() => {
            store.deleteUser(selectedUser.UserId);
            setDeleteModalVisible(false);
            toast.danger(`Customer "${selectedUser.FullName}" deleted`);
            setViewMode('list');
          }}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VIEW: ADD / EDIT SCREEN MATCHING Users Screen.pdf
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'add' || viewMode === 'edit') {
    const isEdit = viewMode === 'edit';
    const directPhoto = form.CustomerPhoto ? getDriveImageUrl(form.CustomerPhoto) : '';

    return (
      <View style={styles.subScreenContainer}>
        {/* Header matching PDF */}
        <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
          <TouchableOpacity
            onPress={() => setViewMode(isEdit && selectedUser ? 'details' : 'list')}
            style={styles.headerBackBtn}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit User' : 'Add User'}</Text>
            <Text style={styles.headerSubtitle}>{isEdit ? 'Update customer details' : 'Create a new user'}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
          {/* Photo Upload Section matching PDF */}
          <View style={styles.photoUploadCard}>
            <View style={styles.photoAvatarPreviewBox}>
              {directPhoto || form.CustomerPhoto ? (
                <Image
                  source={{ uri: directPhoto || form.CustomerPhoto }}
                  style={styles.photoAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={38} color="#94a3b8" />
              )}
            </View>

            <Text style={styles.photoUploadTitle}>Add Customer Photo</Text>
            <Text style={styles.photoUploadSubtitle}>Take a photo or choose from gallery</Text>

            <View style={styles.photoButtonsRow}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickCamera} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.photoActionBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickGallery} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.photoActionBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 1: Personal Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="person-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.placeholder}
                  value={form.FullName}
                  onChangeText={v => setForm(p => ({ ...p, FullName: v }))}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Father / Husband Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter name"
                  placeholderTextColor={colors.placeholder}
                  value={form.FatherHusbandName}
                  onChangeText={v => setForm(p => ({ ...p, FatherHusbandName: v }))}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>
                Mobile Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.prefixSuffixBox}>
                <Text style={styles.prefixText}>+91</Text>
                <TextInput
                  style={styles.prefixInput}
                  placeholder="Enter mobile number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.MobileNumber}
                  onChangeText={v => setForm(p => ({ ...p, MobileNumber: v.replace(/[^\d]/g, '') }))}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Alternate Mobile</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Alternate mobile number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={form.AlternateMobileNumber}
                onChangeText={v => setForm(p => ({ ...p, AlternateMobileNumber: v.replace(/[^\d]/g, '') }))}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.Email}
                  onChangeText={v => setForm(p => ({ ...p, Email: v }))}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="DD / MM / YYYY"
                  placeholderTextColor={colors.placeholder}
                  value={form.DateOfBirth}
                  onChangeText={v => setForm(p => ({ ...p, DateOfBirth: v }))}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderSelectRow}>
                {(['Male', 'Female', 'Other'] as const).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderSelectBtn, form.Gender === g && styles.genderSelectBtnActive]}
                    onPress={() => setForm(p => ({ ...p, Gender: g }))}
                  >
                    <Text style={[styles.genderSelectText, form.Gender === g && styles.genderSelectTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Section 2: KYC Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>KYC Information</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Aadhaar Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={14}
                  value={form.AadhaarNumber}
                  onChangeText={v => setForm(p => ({ ...p, AadhaarNumber: v }))}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>PAN Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter PAN number"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                  maxLength={10}
                  value={form.PANNumber}
                  onChangeText={v => setForm(p => ({ ...p, PANNumber: v.toUpperCase() }))}
                />
              </View>
            </View>
          </View>

          {/* Section 3: Address */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="home-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Address</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Address 1</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full address"
                placeholderTextColor={colors.placeholder}
                value={form.AddressLine1}
                onChangeText={v => setForm(p => ({ ...p, AddressLine1: v }))}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Address 2</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full address"
                placeholderTextColor={colors.placeholder}
                value={form.AddressLine2}
                onChangeText={v => setForm(p => ({ ...p, AddressLine2: v }))}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter city"
                  placeholderTextColor={colors.placeholder}
                  value={form.City}
                  onChangeText={v => setForm(p => ({ ...p, City: v }))}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TouchableOpacity
                  style={styles.dropdownInput}
                  onPress={() =>
                    setPickerModal({
                      visible: true,
                      title: 'Select State',
                      field: 'State',
                      options: INDIAN_STATES,
                    })
                  }
                >
                  <Text style={styles.dropdownValue}>{form.State || 'Select state'}</Text>
                  <Ionicons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter pincode"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                value={form.Pincode}
                onChangeText={v => setForm(p => ({ ...p, Pincode: v }))}
              />
            </View>
          </View>

          {/* Section 4: Occupation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="briefcase-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Occupation</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Occupation</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() =>
                  setPickerModal({
                    visible: true,
                    title: 'Select Occupation',
                    field: 'Occupation',
                    options: OCCUPATION_OPTIONS,
                  })
                }
              >
                <Text style={styles.dropdownValue}>{form.Occupation || 'Select Occupation'}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSaveForm}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Save User'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <OptionPickerModal
          visible={pickerModal.visible}
          title={pickerModal.title}
          options={pickerModal.options}
          selectedValue={form[pickerModal.field]}
          onSelect={opt => {
            setForm(p => ({ ...p, [pickerModal.field]: opt }));
            setPickerModal(p => ({ ...p, visible: false }));
          }}
          onClose={() => setPickerModal(p => ({ ...p, visible: false }))}
          isDark={isDark}
          secondaryTextColor={colors.textSecondary}
        />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VIEW: LIST SCREEN MATCHING Users Screen.pdf
  // ══════════════════════════════════════════════════════════
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {/* Top Header Section (Light Blue) matching PDF */}
      <View style={styles.listTopSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Customers</Text>
            <Text style={styles.screenSubtitle}>Manage your users and their access.</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.totalLabel}>Total Customers</Text>
            <Text style={styles.totalNumber}>{String(totalCount)}</Text>
          </View>
        </View>
      </View>

      {/* Search & Filter Card with curved background transition */}
      <View style={styles.searchCardWrapper}>
        <View style={styles.sheetBackground} pointerEvents="none" />

        <View style={styles.searchFilterCard}>
          {/* Top Search Input Row */}
          <View style={styles.searchRow}>
            <View style={styles.boxySearchBox}>
              <Ionicons
                name="search-outline"
                size={22}
                color={isDark ? '#94a3b8' : '#64748b'}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, mobile, or customer ID..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.filterIconBtn, sortOption !== 'Newest First' && styles.filterIconBtnActive]}
              activeOpacity={0.7}
              onPress={() => setSortModalVisible(true)}
              accessibilityLabel="Sort and filter options"
            >
              <MaterialIcons
                name="filter-list"
                size={24}
                color={sortOption !== 'Newest First' ? '#0284c7' : isDark ? '#cbd5e1' : '#475569'}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
              onPress={() => setActiveFilter('All')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
                All ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Active' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Active')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Active' && styles.filterPillTextActive]}>
                Active ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Inactive' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Inactive')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Inactive' && styles.filterPillTextActive]}>
                Inactive ({inactiveCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Customer Cards List */}
      <ScrollView
        style={styles.cardsScrollContainer}
        contentContainerStyle={styles.cardsScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        <View style={styles.cardsList}>
          {filteredUsers.map(user => {
            const directPhoto = user.CustomerPhoto ? getDriveImageUrl(user.CustomerPhoto) : '';
            const avatarTone = getAvatarColor(user.FullName);
            const initials = (user.FullName || 'U')
              .split(' ')
              .map(w => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const stats = userStatsMap.get(user.UserId) || { loanCount: 0, goldWeight: 0 };
            const lastActive = getUserLastActive(user);

            return (
              <TouchableOpacity
                key={user.UserId}
                style={styles.listCard}
                onPress={() => handleCardPress(user)}
                activeOpacity={0.7}
              >
                {/* Top Section: Left (Avatar + Name & Code) | Right (Status Pill) */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    <View style={styles.avatarContainer}>
                      {directPhoto || user.CustomerPhoto ? (
                        <Image
                          source={{ uri: directPhoto || user.CustomerPhoto }}
                          style={styles.avatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.avatarInitialsBox, { backgroundColor: avatarTone.bg }]}>
                          <Text style={[styles.avatarInitialsText, { color: avatarTone.text }]}>{initials}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardIdentityCol}>
                      <Text style={styles.listCardTitle} numberOfLines={1}>{user.FullName}</Text>
                      <Text style={styles.cardIdText}>{user.CustomerCode || user.UserId}</Text>
                    </View>
                  </View>

                  <View style={styles.cardTopRight}>
                    <UserStatusBadge status={user.Status} isDark={isDark} variant="badge" showDot={false} />
                  </View>
                </View>

                {/* Bottom Section: Left (Phone & Last Active) | Right (Loans & Gold Weight + Chevron) */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.cardBottomLeftCol}>
                    <View style={styles.cardInfoRow}>
                      <Ionicons
                        name="call-outline"
                        size={15}
                        color={isDark ? '#cbd5e1' : '#334155'}
                        style={styles.cardInfoIcon}
                      />
                      <Text style={styles.cardPhoneText}>{formatPhoneNumber(user.MobileNumber)}</Text>
                    </View>

                    <View style={styles.cardInfoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color={isDark ? '#94a3b8' : '#64748b'}
                        style={styles.cardInfoIcon}
                      />
                      <Text style={styles.cardLastActiveText}>
                        {lastActive || 'Last active: —'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRightCol}>
                    <View style={styles.cardStatsCol}>
                      <View style={styles.cardStatRow}>
                        <MaterialIcons
                          name="chrome-reader-mode"
                          size={15}
                          color={isDark ? '#cbd5e1' : '#475467'}
                          style={styles.cardStatIcon}
                        />
                        <Text style={styles.cardStatText}>{stats.loanCount} Loans</Text>
                      </View>

                      <View style={styles.cardStatRow}>
                        <Image
                          source={require('../../../assets/images/gold_bars.png')}
                          style={styles.goldBarIcon}
                          contentFit="contain"
                        />
                        <Text style={styles.cardStatText}>{stats.goldWeight.toFixed(1)} g</Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? '#f8fafc' : '#0f172a'}
                      style={styles.cardChevronIcon}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={42} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or status filter</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={handleAddPress}
        activeOpacity={0.85}
        accessibilityLabel="Add customer"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Sort Option Modal */}
      <OptionPickerModal
        visible={sortModalVisible}
        title="Sort By"
        options={USER_SORT_OPTIONS}
        selectedValue={sortOption}
        onSelect={opt => {
          setSortOption(opt);
          setSortModalVisible(false);
        }}
        onClose={() => setSortModalVisible(false)}
        isDark={isDark}
        secondaryTextColor={colors.textSecondary}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean, isSmall: boolean = false) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#d8edfa',
    },
    subScreenContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    content: {
      paddingHorizontal: isSmall ? 12 : 16,
      paddingTop: 16,
      paddingBottom: 40,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    detailScrollContent: {
      paddingHorizontal: isSmall ? 12 : 16,
      paddingTop: 14,
      paddingBottom: 20,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },

    // Header (Top Section)
    listTopSection: {
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      paddingTop: 4,
    },
    headerLeft: {
      flex: 1,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      letterSpacing: -0.4,
    },
    screenSubtitle: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#475569',
      marginTop: 2,
    },
    headerRight: {
      alignItems: 'flex-end',
      paddingLeft: 10,
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#334155',
    },
    totalNumber: {
      fontSize: 30,
      fontWeight: '800',
      color: '#0284c7',
      marginTop: -2,
    },

    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 14 : 10,
      paddingBottom: 12,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#bfe0f2',
    },
    headerBackBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerTitles: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },

    // Search & Filter Card (matches Ornaments & Blueprint)
    searchCardWrapper: {
      position: 'relative',
      paddingTop: 4,
      paddingBottom: 10,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
    },
    sheetBackground: {
      position: 'absolute',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },
    searchFilterCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      padding: 14,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.8)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    boxySearchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      height: 52,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 8,
    },
    clearBtn: {
      padding: 4,
      marginRight: 2,
    },
    filterIconBtn: {
      padding: 8,
      marginLeft: 10,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterIconBtnActive: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    },

    // Filter Pills
    filterPillsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
    },
    filterPill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterPillActive: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7',
    },
    filterPillText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    filterPillTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // Customer Cards List
    cardsScrollContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    cardsScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    cardsList: {
      gap: 12,
    },
    listCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e8ecf4',
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 1.5,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTopLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
      marginRight: 12,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitialsBox: {
      width: '100%',
      height: '100%',
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitialsText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cardIdentityCol: {
      justifyContent: 'center',
      flex: 1,
    },
    listCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    cardIdText: {
      fontSize: 12.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    cardTopRight: {
      alignSelf: 'flex-start',
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
    },
    cardBottomLeftCol: {
      gap: 7,
      flex: 1,
      justifyContent: 'center',
    },
    cardInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardInfoIcon: {
      marginRight: 7,
    },
    cardPhoneText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    cardLastActiveText: {
      fontSize: 12,
      fontWeight: '400',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    cardBottomRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    cardStatsCol: {
      gap: 7,
      alignItems: 'flex-start',
    },
    cardStatRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardStatIcon: {
      marginRight: 6,
    },
    goldBarIcon: {
      width: 17,
      height: 13,
      marginRight: 6,
    },
    cardStatText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#1e293b',
    },
    cardChevronIcon: {
      marginLeft: 14,
    },

    // Hero Card in Customer Details
    heroCard: {
      backgroundColor: isDark ? '#0f172a' : '#e0f2fe',
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#bae6fd',
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 14,
    },
    heroAvatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: '#0284c7',
    },
    heroAvatarInitialsBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#0284c7',
    },
    heroAvatarInitialsText: {
      fontSize: 24,
      fontWeight: '800',
    },
    heroInfoCol: {
      flex: 1,
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 2,
    },
    heroName: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      flex: 1,
    },
    heroCodeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0284c7',
      marginBottom: 2,
    },
    heroPhoneText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
      marginBottom: 2,
    },
    heroLocationText: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    heroActionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heroCallBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 22,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#bae6fd',
    },
    heroCallBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#0284c7',
    },
    heroWhatsAppBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 22,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#bbf7d0',
    },
    heroWhatsAppBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#16a34a',
    },

    // Tabs Underline Switcher
    tabsSegmentContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    tabSegmentBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    tabSegmentBtnActive: {},
    tabSegmentText: {
      fontSize: 13.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    tabSegmentTextActive: {
      color: '#0284c7',
      fontWeight: '700',
    },
    activeTabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 10,
      right: 10,
      height: 3,
      backgroundColor: '#0284c7',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    tabContentArea: {
      gap: 0,
    },

    // Profile Flat Sections (No card, heading with underline and content below)
    profileSection: {
      marginBottom: 20,
    },
    profileSectionLast: {
      marginBottom: 0,
    },
    profileHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileSectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginLeft: 10,
    },
    profileDivider: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#e5e7eb',
      marginTop: 10,
      marginBottom: 14,
    },
    profileRowsList: {
      gap: 6,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 28,
      paddingVertical: 4,
    },
    profileRowLabel: {
      width: 170,
      fontSize: 13.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    profileRowValueContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profileRowValueText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    privacyEyeBtn: {
      padding: 4,
      marginLeft: 8,
    },
    profileStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },

    // Common Cards & Key-Value Lists
    card: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    keyValList: {
      gap: 10,
    },
    keyValRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#f8fafc',
    },
    keyText: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      flex: 1,
    },
    valText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      textAlign: 'right',
      flex: 1.2,
    },

    // Bank Accounts Tab Styles
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    bankCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    bankCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bankNameCol: {
      gap: 2,
    },
    bankNameTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    bankAccountType: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    bankBranchText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    bankInfoGrid: {
      gap: 8,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      marginBottom: 12,
    },
    bankInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankInfoLabel: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    bankInfoValue: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    bankLimitBox: {
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    bankLimitAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    bankUtilizedBigText: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0284c7',
    },
    bankPercentText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#0284c7',
      borderRadius: 4,
    },
    limitColumnsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    limitCol: {
      flex: 1,
    },
    limitColLabel: {
      fontSize: 10.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 2,
    },
    limitColVal: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },

    // Loans Tab Styles
    loanCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    loanCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    loanNumberTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    loanDateText: {
      fontSize: 11.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },
    loanStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    loanStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    loanStatusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    loanMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      marginBottom: 12,
    },
    loanMetricCol: {
      flex: 1,
    },
    loanMetricLabel: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 3,
    },
    loanMetricVal: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    duePillBadge: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    duePillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    loanOrnamentsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    ornThumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ornThumbBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? '#0f172a' : '#fef3c7',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    ornCountMiniBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: '#0284c7',
      borderRadius: 6,
      paddingHorizontal: 3,
      paddingVertical: 1,
    },
    ornCountMiniBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: '#ffffff',
    },
    ornCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    ornWeightText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#d97706',
    },
    interestRateTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    },
    interestRateText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#0284c7',
    },
    viewLoanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      gap: 4,
    },
    viewLoanBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#0284c7',
    },
    loanFabBtn: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
        } as any,
      }),
    },

    // Add / Edit Screen Styles
    photoUploadCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    },
    photoAvatarPreviewBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#0284c7',
    },
    photoAvatarImage: {
      width: '100%',
      height: '100%',
    },
    photoUploadTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      marginBottom: 2,
    },
    photoUploadSubtitle: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 14,
    },
    photoButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    photoActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd',
    },
    photoActionBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#0284c7',
    },

    // Form Inputs
    twoColRow: {
      flexDirection: 'row',
      gap: 10,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      marginBottom: 6,
    },
    requiredStar: {
      color: '#ef4444',
    },
    textInput: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    prefixSuffixBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
    },
    prefixText: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
      marginRight: 6,
    },
    prefixInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    dropdownInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    dropdownValue: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    genderSelectRow: {
      flexDirection: 'row',
      gap: 8,
    },
    genderSelectBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    genderSelectBtnActive: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7',
    },
    genderSelectText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    genderSelectTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    submitBtn: {
      backgroundColor: '#0284c7',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      marginBottom: 30,
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Floating Action Button
    fabBtn: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 13,
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 4,
      textAlign: 'center',
    },
  });
