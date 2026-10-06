import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getDriveImageUrl } from '../services/api';
import { useAppStore } from '../services/store';
import { BankAccount } from '../types';
import { FilePayload } from './ImagePickerField';


const INDIAN_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Canara Bank',
  'Bank of Baroda',
  'Indian Bank',
  'Federal Bank',
  'Kotak Mahindra Bank',
  'Union Bank of India',
  'Punjab National Bank',
  'Bank of India',
  'Central Bank of India',
  'IndusInd Bank',
  'Yes Bank',
  'IDBI Bank',
  'Indian Overseas Bank',
  'UCO Bank',
  'Punjab & Sind Bank',
];

interface BankAccountFormProps {
  onClose: () => void;
  /** Account being edited; omit to create a new one. */
  account?: BankAccount | null;
  /** When creating from a customer's page: the customer is fixed and the picker is hidden/disabled. */
  presetUserId?: string;
}

const emptyForm = (userId: string, holder: string) => ({
  UserId: userId,
  AccountHolderName: holder,
  AccountNumber: '',
  BankName: '',
  BranchName: '',
  City: 'Bengaluru',
  IFSCCode: '',
  AccountType: 'Savings' as 'Savings' | 'Current',
  UPI_ID: '',
  MaxLoanAmount: '500000',
  UtilizedLoanAmount: '0',
  PassbookImage: '',
  Status: 'Active' as 'Active' | 'Inactive',
});

export function BankAccountForm({
  onClose,
  account,
  presetUserId,
}: BankAccountFormProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const toast = useToast();

  const isEditing = !!account;
  const presetUser = useMemo(
    () => (presetUserId ? store.users.find((u) => String(u.UserId) === String(presetUserId)) : undefined),
    [presetUserId, store.users]
  );

  const [form, setForm] = useState(emptyForm('', ''));
  const [filesPayload, setFilesPayload] = useState<FilePayload[]>([]);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);

  useEffect(() => {
    setFilesPayload([]);
    setShowCustomerSheet(false);
    setShowBankSheet(false);

    if (account) {
      setForm({
        UserId: account.UserId || '',
        AccountHolderName: account.AccountHolderName || '',
        AccountNumber: String(account.AccountNumber || ''),
        BankName: account.BankName || '',
        BranchName: account.BranchName || '',
        City: account.City || 'Bengaluru',
        IFSCCode: account.IFSCCode || '',
        AccountType: (account.AccountType === 'Current' ? 'Current' : 'Savings') as 'Savings' | 'Current',
        UPI_ID: account.UPI_ID || '',
        MaxLoanAmount: String(account.MaxLoanAmount || 0),
        UtilizedLoanAmount: String(account.UtilizedLoanAmount || 0),
        PassbookImage: account.PassbookImage || '',
        Status: account.Status === 'Inactive' ? 'Inactive' : 'Active',
      });
    } else {
      const owner = presetUser || (store.users.length > 0 ? store.users[0] : undefined);
      setForm({
        ...emptyForm(owner ? String(owner.UserId) : '', owner?.FullName || ''),
        BankName: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, presetUserId]);

  const selectedUser = useMemo(() => {
    if (!form.UserId) return presetUser;
    return store.users.find((u) => String(u.UserId) === String(form.UserId)) || presetUser;
  }, [form.UserId, store.users, presetUser]);

  const maxNum = parseFloat(form.MaxLoanAmount) || 0;
  const utilNum = parseFloat(form.UtilizedLoanAmount) || 0;

  const handlePickImage = () => {
    Alert.alert(
      'Passbook Document',
      'Select a method to add passbook or cheque leaf photo:',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission required', 'Camera permission is required.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                quality: 0.7,
                base64: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setForm((p) => ({ ...p, PassbookImage: asset.uri }));
                if (asset.base64) {
                  setFilesPayload([
                    {
                      name: asset.fileName || `passbook_${Date.now()}.jpg`,
                      mimeType: asset.mimeType || 'image/jpeg',
                      base64: asset.base64,
                    },
                  ]);
                }
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to open camera');
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission required', 'Photo library permission is required.');
                  return;
                }
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                base64: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setForm((p) => ({ ...p, PassbookImage: asset.uri }));
                if (asset.base64) {
                  setFilesPayload([
                    {
                      name: asset.fileName || `passbook_${Date.now()}.jpg`,
                      mimeType: asset.mimeType || 'image/jpeg',
                      base64: asset.base64,
                    },
                  ]);
                }
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to open gallery');
            }
          },
        },
        ...(form.PassbookImage
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  setForm((p) => ({ ...p, PassbookImage: '' }));
                  setFilesPayload([]);
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const handleSave = () => {
    if (!form.AccountHolderName.trim()) {
      Alert.alert('Validation Error', 'Account Holder Name is required.');
      return;
    }
    if (!String(form.AccountNumber).trim()) {
      Alert.alert('Validation Error', 'Account Number is required.');
      return;
    }
    if (!form.BankName.trim()) {
      Alert.alert('Validation Error', 'Please select a bank.');
      return;
    }

    const payload = {
      ...form,
      MaxLoanAmount: maxNum,
      UtilizedLoanAmount: utilNum,
      files: filesPayload,
    };

    if (account) {
      store.updateBankAccount(account.BankAccountId, payload, {
        onSuccess: () => toast.success(`Bank account "${form.BankName}" updated successfully`),
      });
    } else {
      store.addBankAccount(payload, {
        onSuccess: () => toast.success(`Bank account "${form.BankName}" added successfully`),
      });
    }
    onClose();
  };

  const passbookPreviewUrl = form.PassbookImage
    ? getDriveImageUrl(form.PassbookImage) || form.PassbookImage
    : null;

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* Top Pale Blue Header Banner */}
          <View style={styles.headerBanner}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBackBtn}
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit bank account' : 'Add bank account'}
              </Text>
              <Text style={styles.headerSubtitle}>Details of loan</Text>
            </View>
          </View>

          {/* Scrollable Form Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Section: Customer information */}
            <Text style={styles.sectionHeading}>Customer information</Text>

            {/* Field: Customer* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Customer<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.selectBox, presetUser && styles.selectBoxDisabled]}
                onPress={() => {
                  if (presetUser) return;
                  setShowCustomerSheet(true);
                }}
                activeOpacity={presetUser ? 1 : 0.7}
                accessibilityLabel="Select customer"
              >
                <Text
                  style={[
                    styles.selectBoxText,
                    !selectedUser && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedUser ? selectedUser.FullName : 'Select customer'}
                </Text>
                <Ionicons
                  name={presetUser ? 'lock-closed-outline' : 'chevron-down'}
                  size={18}
                  color="#0f172a"
                />
              </TouchableOpacity>
            </View>

            {/* Field: Account holder name* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Account holder name<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={form.AccountHolderName}
                onChangeText={(v) => setForm((p) => ({ ...p, AccountHolderName: v }))}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Section: Bank information */}
            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Bank information</Text>

            {/* Field: Bank name* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Bank name<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setShowBankSheet(true)}
                activeOpacity={0.7}
                accessibilityLabel="Select bank"
              >
                <Text
                  style={[
                    styles.selectBoxText,
                    !form.BankName && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {form.BankName || 'Select bank'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Field: Account number* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Account number<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="9-18 digits"
                placeholderTextColor="#94a3b8"
                value={form.AccountNumber}
                onChangeText={(v) => setForm((p) => ({ ...p, AccountNumber: v }))}
              />
            </View>

            {/* Row: IFSC* & Branch */}
            <View style={styles.formRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  IFSC<Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  autoCapitalize="characters"
                  placeholder="SBIN0001234"
                  placeholderTextColor="#94a3b8"
                  value={form.IFSCCode}
                  onChangeText={(v) => setForm((p) => ({ ...p, IFSCCode: v.toUpperCase() }))}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Branch</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.BranchName}
                  onChangeText={(v) => setForm((p) => ({ ...p, BranchName: v }))}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Row: City & UPI ID */}
            <View style={styles.formRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.City}
                  onChangeText={(v) => setForm((p) => ({ ...p, City: v }))}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  autoCapitalize="none"
                  placeholder="name@bank"
                  placeholderTextColor="#94a3b8"
                  value={form.UPI_ID}
                  onChangeText={(v) => setForm((p) => ({ ...p, UPI_ID: v.toLowerCase() }))}
                />
              </View>
            </View>

            {/* Field: Account type* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Account type<Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    form.AccountType === 'Savings' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, AccountType: 'Savings' }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      form.AccountType === 'Savings' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Savings
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    form.AccountType === 'Current' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, AccountType: 'Current' }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      form.AccountType === 'Current' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Current
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section: Loan limit */}
            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Loan limit</Text>

            {/* Field: Maximum loan amount (₹) * */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Maximum loan amount (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 300000"
                placeholderTextColor="#94a3b8"
                value={form.MaxLoanAmount}
                onChangeText={(v) => setForm((p) => ({ ...p, MaxLoanAmount: v }))}
              />
              <Text style={styles.helperText}>
                Available = Maximum - active loans on this account.
              </Text>
            </View>

            {/* Section: Documents */}
            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Documents</Text>

            {/* Dashed Light Blue Card */}
            <TouchableOpacity
              style={styles.docUploadCard}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <View style={styles.docIconBox}>
                {passbookPreviewUrl ? (
                  <Image
                    source={{ uri: passbookPreviewUrl }}
                    style={styles.docThumb}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="camera-outline" size={24} color="#0284c7" />
                )}
              </View>
              <View style={styles.docInfoCol}>
                <Text style={styles.docTitle}>
                  {passbookPreviewUrl ? 'Passbook image selected' : 'Add passbook image'}
                </Text>
                <Text style={styles.docSubtitle}>
                  {passbookPreviewUrl ? 'Tap to change or remove' : 'Camera or gallery'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Field: Status */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    form.Status === 'Active' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, Status: 'Active' }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      form.Status === 'Active' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    form.Status === 'Inactive' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, Status: 'Inactive' }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      form.Status === 'Inactive' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: 12 + insets.bottom }]}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
              accessibilityLabel="Save account"
            >
              <Text style={styles.saveBtnText}>Save account ✓</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Selection Bottom Sheet (Image 3) */}
        <Modal
          visible={showCustomerSheet}
          animationType="fade"
          transparent
          onRequestClose={() => setShowCustomerSheet(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCustomerSheet(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.sheetCard}>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle}>Select customer</Text>
                  <View style={styles.sheetDivider} />

                  <ScrollView
                    style={styles.sheetList}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {store.users.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#64748b', fontSize: 13 }}>
                          No customers found
                        </Text>
                      </View>
                    ) : (
                      store.users.map((u) => {
                        const isSelected = String(form.UserId) === String(u.UserId);
                        const code = u.CustomerCode || u.UserId;
                        return (
                          <TouchableOpacity
                            key={u.UserId}
                            style={styles.sheetItemRow}
                            onPress={() => {
                              setForm((p) => ({
                                ...p,
                                UserId: u.UserId,
                                AccountHolderName: u.FullName,
                              }));
                              setShowCustomerSheet(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected,
                              ]}
                            >
                              {isSelected ? <View style={styles.radioDot} /> : null}
                            </View>
                            <Text style={styles.customerItemText}>
                              <Text style={styles.customerItemName}>{u.FullName}</Text>
                              <Text style={styles.customerItemCode}> · {code}</Text>
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Bank Selection Bottom Sheet (Image 4) */}
        <Modal
          visible={showBankSheet}
          animationType="fade"
          transparent
          onRequestClose={() => setShowBankSheet(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowBankSheet(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.sheetCard}>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle}>Select bank</Text>
                  <View style={styles.sheetDivider} />

                  <ScrollView
                    style={styles.sheetList}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {INDIAN_BANKS.map((bankName) => {
                      const isSelected = form.BankName === bankName;
                      return (
                        <TouchableOpacity
                          key={bankName}
                          style={styles.sheetItemRow}
                          onPress={() => {
                            setForm((p) => ({ ...p, BankName: bankName }));
                            setShowBankSheet(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected ? <View style={styles.radioDot} /> : null}
                          </View>
                          <Text style={styles.bankItemText}>{bankName}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#0c2238' : '#ddf4fe',
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    headerBanner: {
      backgroundColor: isDark ? '#0c2238' : '#ddf4fe',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    headerBackBtn: {
      padding: 4,
      marginLeft: -4,
    },
    headerTitleCol: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      marginBottom: 12,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    label: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginBottom: 6,
    },
    requiredStar: {
      color: '#ef4444',
      fontWeight: '700',
    },
    textInput: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.select({ ios: 12, default: 10 }),
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    selectBox: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectBoxDisabled: {
      opacity: 0.8,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    },
    selectBoxText: {
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
      flex: 1,
      marginRight: 8,
    },
    placeholderText: {
      color: isDark ? '#64748b' : '#94a3b8',
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 12,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    segmentBtnActive: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
      borderColor: '#0284c7',
      borderWidth: 1.5,
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#0f172a',
    },
    segmentBtnTextActive: {
      color: '#0284c7',
      fontWeight: '700',
    },
    helperText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 6,
    },
    docUploadCard: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: '#38bdf8',
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#e0f2fe',
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    docIconBox: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    docThumb: {
      width: '100%',
      height: '100%',
    },
    docInfoCol: {
      flex: 1,
    },
    docTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    docSubtitle: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    bottomBar: {
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    saveBtn: {
      backgroundColor: '#0284c7',
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffffff',
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '75%',
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
      paddingBottom: Platform.select({ ios: 30, default: 20 }),
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#64748b' : '#0f172a',
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 12,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    sheetDivider: {
      height: 1,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    sheetList: {
      maxHeight: 380,
    },
    sheetItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: isDark ? '#475569' : '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    radioCircleSelected: {
      borderColor: '#0284c7',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#0284c7',
    },
    customerItemText: {
      flex: 1,
    },
    customerItemName: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    customerItemCode: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    bankItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      flex: 1,
    },
  });
