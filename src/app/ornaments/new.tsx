import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { Ornament } from '../../types';

export default function NewOrnamentScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { isSuperAdmin } = useAuth();
  const store = useAppStore();
  const toast = useToast();
  const users = store.users;

  const existingOrn = useMemo(() => {
    if (!id) return null;
    return store.ornaments.find(o => o.OrnamentId === id) || null;
  }, [id, store.ornaments]);

  const isEditing = !!existingOrn;

  // Active Wizard Step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    UserId: '',
    OrnamentName: '',
    OrnamentType: 'Traditional',
    OrnamentCategory: 'Necklace',
    Purity: '22karate (91.6%)',
    Quantity: '1',
    MakerName: 'Tanishq',
    HallmarkNumber: 'HM/C-7452/2024',
    GrossWeight: '26.800',
    StoneWeight: '1.200',
    BuyingPricePerGram: '5800',
    Description: 'Traditional gold necklace with ruby stones.',
    Remarks: '',
    Status: 'Available' as 'Available' | 'Pledged' | 'Released',
  });

  // Selected Images
  const [images, setImages] = useState<string[]>([]);

  // Dropdown Picker Modal State
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    field: 'OrnamentType' | 'OrnamentCategory' | 'Purity' | 'Status';
    options: string[];
  }>({
    visible: false,
    title: '',
    field: 'OrnamentType',
    options: [],
  });

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const selectedUser = useMemo(() => {
    return users.find(u => u.UserId === form.UserId);
  }, [users, form.UserId]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const name = (u.FullName || '').toLowerCase();
      const id = (u.UserId || '').toLowerCase();
      const phone = (u.MobileNumber || '').toLowerCase();
      const city = (u.City || '').toLowerCase();
      return name.includes(q) || id.includes(q) || phone.includes(q) || city.includes(q);
    });
  }, [users, customerSearchQuery]);

  // Initialize form with existing ornament or defaults
  useEffect(() => {
    if (existingOrn) {
      setForm({
        UserId: existingOrn.UserId || '',
        OrnamentName: existingOrn.OrnamentName || '',
        OrnamentType: existingOrn.OrnamentType || 'Traditional',
        OrnamentCategory: existingOrn.OrnamentCategory || 'Necklace',
        Purity: existingOrn.Purity ? (existingOrn.Purity.includes('91.6') ? existingOrn.Purity : `${existingOrn.Purity} (91.6%)`) : '22karate (91.6%)',
        Quantity: String(existingOrn.Quantity || '1'),
        MakerName: existingOrn.MakerName || '',
        HallmarkNumber: existingOrn.HallmarkNumber || '',
        GrossWeight: String(existingOrn.GrossWeight || '0'),
        StoneWeight: String(existingOrn.StoneWeight || '0'),
        BuyingPricePerGram: String(existingOrn.BuyingPricePerGram || '5800'),
        Description: existingOrn.Description || '',
        Remarks: existingOrn.Remarks || '',
        Status: existingOrn.Status === 'Pledged' ? 'Pledged' : (existingOrn.Status === 'Released' ? 'Released' : 'Available'),
      });
      if (existingOrn.OrnamentImages) {
        setImages(existingOrn.OrnamentImages.split(' | ').filter(Boolean));
      }
    }
  }, [existingOrn]);

  // BackHandler for Android hardware back button / phone gesture
  useEffect(() => {
    const backAction = () => {
      if (customerModalVisible) {
        setCustomerModalVisible(false);
        setCustomerSearchQuery('');
        return true;
      }
      if (pickerModal.visible) {
        setPickerModal(p => ({ ...p, visible: false }));
        return true;
      }
      if (currentStep === 3) {
        setCurrentStep(2);
        return true;
      }
      if (currentStep === 2) {
        setCurrentStep(1);
        return true;
      }
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [customerModalVisible, pickerModal.visible, currentStep, router]);

  // Calculations
  const gross = parseFloat(form.GrossWeight) || 0;
  const stone = parseFloat(form.StoneWeight) || 0;
  const net = Math.max(0, gross - stone);
  const buyRate = parseFloat(form.BuyingPricePerGram) || 5800;
  const liveRate22k = store.goldRates?.gold22k?.rate1g || 7500;

  const totalBuyingValue = Math.round(net * buyRate);
  const currentGoldValueLive = Math.round(net * liveRate22k);
  const marketValue = Math.round(net * (liveRate22k > 0 ? liveRate22k * 1.0677 : 205000));
  const appreciation = marketValue - totalBuyingValue;
  const appreciationPct = totalBuyingValue > 0 ? (appreciation / totalBuyingValue) * 100 : 29.31;

  const [refreshingRates, setRefreshingRates] = useState(false);
  const handleRefreshRates = async () => {
    if (refreshingRates) return;
    setRefreshingRates(true);
    try {
      await store.refreshGoldRates();
      toast.success('Live gold rates updated');
    } catch {
      toast.danger('Failed to refresh gold rates');
    } finally {
      setRefreshingRates(false);
    }
  };

  // Validation before step transition
  const handleNext = () => {
    if (currentStep === 1) {
      if (!form.OrnamentName.trim()) {
        Alert.alert('Required Field', 'Please enter Ornament Name.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (gross <= 0) {
        Alert.alert('Invalid Weight', 'Gross Weight must be greater than 0 grams.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    else router.back();
  };

  // Image handling
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri);
        setImages(prev => [...prev, ...uris]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to select image');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save Ornament
  const handleSave = async () => {
    if (!form.OrnamentName.trim()) {
      Alert.alert('Validation Error', 'Ornament Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const purityNormalized = form.Purity.includes('24') ? '24K' : (form.Purity.includes('18') ? '18K' : '22K');

      const payload: Partial<Ornament> = {
        UserId: form.UserId || '',
        OrnamentName: form.OrnamentName.trim(),
        OrnamentType: form.OrnamentCategory || form.OrnamentType,
        OrnamentCategory: form.OrnamentType,
        Purity: purityNormalized,
        GrossWeight: gross,
        StoneWeight: stone,
        NetWeight: net,
        MetalWeight: net,
        BuyingPricePerGram: buyRate,
        CurrentPricePerGram: liveRate22k,
        BuyingCost: totalBuyingValue,
        TotalPrice: marketValue || totalBuyingValue,
        MarketValue: marketValue,
        EstimatedValue: currentGoldValueLive,
        AppreciationValue: appreciation,
        AppreciationPercentage: Math.round(appreciationPct * 100) / 100,
        HallmarkNumber: form.HallmarkNumber.trim(),
        Quantity: parseInt(form.Quantity) || 1,
        MakerName: form.MakerName.trim(),
        Description: form.Description.trim(),
        Remarks: form.Remarks.trim(),
        Status: form.Status,
        OrnamentImages: images.map(img => typeof img === 'string' ? img : '').filter(Boolean).join(' | '),
      };

      if (isEditing && existingOrn) {
        store.updateOrnament(existingOrn.OrnamentId, payload);
        toast.success(`Ornament "${form.OrnamentName}" updated successfully`);
      } else {
        store.addOrnament(payload);
        toast.success(`Ornament "${form.OrnamentName}" added to vault`);
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save ornament');
    } finally {
      setSubmitting(false);
    }
  };

  const openDropdown = (field: 'OrnamentType' | 'OrnamentCategory' | 'Purity' | 'Status', title: string, options: string[]) => {
    setPickerModal({ visible: true, title, field, options });
  };

  const selectOption = (opt: string) => {
    setForm(p => ({ ...p, [pickerModal.field]: opt }));
    setPickerModal(p => ({ ...p, visible: false }));
  };

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#d8edfa"} />
      {/* ─── TOP HEADER ─── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 12) }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Ornament' : 'Add ornaments'}</Text>
          <Text style={styles.headerSubtitle}>Add details to customer records</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* ─── 3-STEP PROGRESS STEPPER ─── */}
      <View style={styles.stepperContainer}>
        {/* Step 1 */}
        <View style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep === 1 && styles.stepCircleActive,
            currentStep > 1 && styles.stepCircleDone
          ]}>
            {currentStep > 1 ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNum, currentStep === 1 && styles.stepNumActive]}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Basic Details</Text>
        </View>

        {/* Line 1-2 */}
        <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

        {/* Step 2 */}
        <View style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep === 2 && styles.stepCircleActive,
            currentStep > 2 && styles.stepCircleDone
          ]}>
            {currentStep > 2 ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNum, currentStep === 2 && styles.stepNumActive]}>2</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Weight & Valuation</Text>
        </View>

        {/* Line 2-3 */}
        <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />

        {/* Step 3 */}
        <View style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep === 3 && styles.stepCircleActive
          ]}>
            <Text style={[styles.stepNum, currentStep === 3 && styles.stepNumActive]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>Photos</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
      >
        {/* ══════════════════════════════════════════
            STEP 1: BASIC INFORMATION
        ══════════════════════════════════════════ */}
        {currentStep === 1 && (
          <View>
            {/* Card: Basic Information */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="document-text-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Basic Information</Text>
                    <Text style={styles.cardSubtitle}>Enter basic details about the ornament</Text>
                  </View>
                </View>
              </View>

              {/* Customer Dropdown (Optional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>
                  Customer <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '400' }}>(Optional)</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.dropdownInput}
                  onPress={() => setCustomerModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 4 }}>
                    <Ionicons name="person-outline" size={16} color={selectedUser ? '#0284c7' : '#94a3b8'} />
                    <Text 
                      style={[
                        styles.dropdownValue, 
                        !selectedUser && { color: isDark ? '#94a3b8' : '#64748b', fontWeight: '400' }
                      ]}
                      numberOfLines={1}
                    >
                      {selectedUser ? `${selectedUser.FullName} (${selectedUser.UserId})` : 'Select Customer (Optional)'}
                    </Text>
                  </View>
                  {selectedUser ? (
                    <TouchableOpacity 
                      onPress={() => setForm(p => ({ ...p, UserId: '' }))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Ornament Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Ornament Name <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Gold Necklace"
                  placeholderTextColor={colors.placeholder}
                  value={form.OrnamentName}
                  onChangeText={v => setForm(p => ({ ...p, OrnamentName: v }))}
                />
              </View>

              {/* 2-Column: Type & Category */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Type <Text style={styles.requiredStar}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.dropdownInput}
                    onPress={() => openDropdown('OrnamentType', 'Select Type', ['Traditional', 'Modern', 'Antique', 'Temple', 'Bridal', 'Casual'])}
                  >
                    <Text style={styles.dropdownValue}>{form.OrnamentType}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Category <Text style={styles.requiredStar}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.dropdownInput}
                    onPress={() => openDropdown('OrnamentCategory', 'Select Category', ['Necklace', 'Bangles', 'Ring', 'Earrings', 'Chain', 'Bracelet', 'Coin', 'Pendant', 'Others'])}
                  >
                    <Text style={styles.dropdownValue}>{form.OrnamentCategory}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2-Column: Purity & Quantity */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Purity <Text style={styles.requiredStar}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.dropdownInput}
                    onPress={() => openDropdown('Purity', 'Select Purity', ['22karate (91.6%)', '24karate (99.9%)', '18karate (75%)'])}
                  >
                    <Text style={styles.dropdownValue}>{form.Purity}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity <Text style={styles.requiredStar}>*</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    value={form.Quantity}
                    onChangeText={v => setForm(p => ({ ...p, Quantity: v }))}
                  />
                </View>
              </View>

              {/* Maker / Brand */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Maker / Brand</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Tanishq"
                  placeholderTextColor={colors.placeholder}
                  value={form.MakerName}
                  onChangeText={v => setForm(p => ({ ...p, MakerName: v }))}
                />
              </View>

              {/* Hallmark Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Hallmark Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HM/C-7452/2024"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                  value={form.HallmarkNumber}
                  onChangeText={v => setForm(p => ({ ...p, HallmarkNumber: v }))}
                />
              </View>
            </View>

            {/* Step 1 Action Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════
            STEP 2: WEIGHT & VALUATION
        ══════════════════════════════════════════ */}
        {currentStep === 2 && (
          <View>
            {/* Card 1: Weight Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="scale-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Weight Details</Text>
                    <Text style={styles.cardSubtitle}>Enter weight details of the ornament</Text>
                  </View>
                </View>
              </View>

              {/* Gross Weight & Stone Weight */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Gross Weight <Text style={styles.requiredStar}>*</Text></Text>
                  <View style={styles.unitInputBox}>
                    <TextInput
                      style={styles.unitInput}
                      keyboardType="decimal-pad"
                      placeholder="0.000"
                      value={form.GrossWeight}
                      onChangeText={v => setForm(p => ({ ...p, GrossWeight: v }))}
                    />
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>g</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Stone Weight</Text>
                  <View style={styles.unitInputBox}>
                    <TextInput
                      style={styles.unitInput}
                      keyboardType="decimal-pad"
                      placeholder="0.000"
                      value={form.StoneWeight}
                      onChangeText={v => setForm(p => ({ ...p, StoneWeight: v }))}
                    />
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>g</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Metal Weight (Net) & Net Weight */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <View style={styles.labelWithInfo}>
                    <Text style={styles.inputLabel}>Metal Weight (Net)</Text>
                    <Ionicons name="information-circle-outline" size={13} color="#64748b" />
                  </View>
                  <View style={[styles.unitInputBox, styles.readonlyInputBox]}>
                    <Text style={styles.readonlyInputText}>{net.toFixed(3)}</Text>
                    <View style={[styles.unitBadge, styles.readonlyUnitBadge]}>
                      <Text style={styles.unitBadgeText}>g</Text>
                    </View>
                  </View>
                  <View style={styles.autoCalcRow}>
                    <View style={styles.autoCalcBadge}>
                      <Text style={styles.autoCalcBadgeText}>Auto calculated</Text>
                    </View>
                    <Ionicons name="lock-closed-outline" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <View style={styles.labelWithInfo}>
                    <Text style={styles.inputLabel}>Net Weight</Text>
                    <Ionicons name="information-circle-outline" size={13} color="#64748b" />
                  </View>
                  <View style={[styles.unitInputBox, styles.readonlyInputBox]}>
                    <Text style={styles.readonlyInputText}>{net.toFixed(3)}</Text>
                    <View style={[styles.unitBadge, styles.readonlyUnitBadge]}>
                      <Text style={styles.unitBadgeText}>g</Text>
                    </View>
                  </View>
                  <View style={styles.autoCalcRow}>
                    <View style={styles.autoCalcBadge}>
                      <Text style={styles.autoCalcBadgeText}>Auto calculated</Text>
                    </View>
                    <Ionicons name="lock-closed-outline" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Valuation Details */}
            <View style={styles.card}>
              <View style={[styles.cardHeader, { alignItems: 'flex-start' }]}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="bar-chart-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Valuation Details</Text>
                    <Text style={styles.cardSubtitle}>Enter buying price and view auto calculated values</Text>
                  </View>
                </View>

                {/* Live Gold Rate Badge */}
                <View style={styles.liveRateBadge}>
                  <Text style={styles.liveRateTitle}>Live Gold Rate</Text>
                  <View style={styles.liveRateSubRow}>
                    <View style={styles.liveRateDotWithPurity}>
                      <View style={styles.liveRateGreenDot} />
                      <Text style={styles.liveRatePurityText}>(22K)</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={handleRefreshRates}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {refreshingRates ? (
                        <ActivityIndicator size={11} color={isDark ? '#94a3b8' : '#64748b'} />
                      ) : (
                        <Ionicons name="refresh-outline" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.liveRateValue}>₹ {liveRate22k.toLocaleString('en-IN')}/g</Text>
                </View>
              </View>

              {/* Buying Price / gram */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Buying Price / gram <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.prefixSuffixBox}>
                  <Text style={styles.prefixText}>₹</Text>
                  <TextInput
                    style={styles.prefixInput}
                    keyboardType="numeric"
                    value={form.BuyingPricePerGram}
                    onChangeText={v => setForm(p => ({ ...p, BuyingPricePerGram: v }))}
                  />
                  <Text style={styles.suffixText}>/g</Text>
                </View>
              </View>

              {/* 2x2 Grid of Calculated Summary Cards */}
              <View style={styles.calcGrid}>
                {/* 1. Total Buying Value */}
                <View style={styles.calcTile}>
                  <View style={styles.calcTileTop}>
                    <Text style={styles.calcTileLabel}>Total Buying Value</Text>
                    <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                  </View>
                  <Text style={styles.calcTileValue}>₹ {totalBuyingValue.toLocaleString('en-IN')}</Text>
                  <Text style={styles.calcTileSub}>Auto calculated</Text>
                </View>

                {/* 2. Current Gold Value (Live) */}
                <View style={styles.calcTile}>
                  <View style={styles.calcTileTop}>
                    <Text style={styles.calcTileLabel}>Current Gold Value (Live)</Text>
                    <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                  </View>
                  <Text style={styles.calcTileValue}>₹ {currentGoldValueLive.toLocaleString('en-IN')}</Text>
                  <Text style={styles.calcTileSub}>Based on live gold rate</Text>
                </View>

                {/* 3. Market Value */}
                <View style={styles.calcTile}>
                  <View style={styles.calcTileTop}>
                    <Text style={styles.calcTileLabel}>Market Value</Text>
                    <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                  </View>
                  <Text style={styles.calcTileValue}>₹ {marketValue.toLocaleString('en-IN')}</Text>
                  <Text style={styles.calcTileSub}>Auto calculated</Text>
                </View>

                {/* 4. Appreciation */}
                <View style={styles.calcTile}>
                  <View style={styles.calcTileTop}>
                    <Text style={styles.calcTileLabel}>Appreciation</Text>
                    <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                  </View>
                  <Text style={[styles.calcTileValue, styles.appreciationTileValue]}>
                    ↗ ₹ {Math.abs(appreciation).toLocaleString('en-IN')} (+{appreciationPct.toFixed(2)}%)
                  </Text>
                  <Text style={styles.calcTileSub}>Auto calculated</Text>
                </View>
              </View>
            </View>

            {/* Bottom Navigation Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.backButtonSecondary} onPress={handleBack} activeOpacity={0.8}>
                <Text style={styles.backButtonSecondaryText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleNext} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════
            STEP 3: PHOTOS & ADDITIONAL INFORMATION
        ══════════════════════════════════════════ */}
        {currentStep === 3 && (
          <View>
            {/* Card 1: Ornament Photos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="image-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Ornament Photos</Text>
                    <Text style={styles.cardSubtitle}>Add clear photos of the ornament (at least 1)</Text>
                  </View>
                </View>
              </View>

              {/* Photo Thumbnails */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                {images.map((imgUri, idx) => (
                  <View key={idx} style={styles.photoThumbWrapper}>
                    <Image source={{ uri: getDriveImageUrl(imgUri) || imgUri }} style={styles.photoThumbImg} contentFit="cover" />
                    <TouchableOpacity 
                      style={styles.photoRemoveBtn} 
                      onPress={() => handleRemoveImage(idx)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Photo Button */}
                <TouchableOpacity style={styles.addPhotoBox} onPress={handlePickImage} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={24} color="#0284c7" />
                  <Text style={styles.addPhotoBoxText}>Add Photo</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Info Verification Callout */}
              <View style={styles.calloutBox}>
                <Ionicons name="information-circle-outline" size={18} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.calloutText}>
                  Add clear and well-lit images. Photos help in verification.
                </Text>
              </View>
            </View>

            {/* Card 2: Additional Information */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="document-text-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Additional Information</Text>
                    <Text style={styles.cardSubtitle}>Add any additional details</Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineArea]}
                  placeholder="Traditional gold necklace with ruby stones."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  value={form.Description}
                  onChangeText={v => setForm(p => ({ ...p, Description: v }))}
                />
                <Text style={styles.charCounter}>{form.Description.length}/200</Text>
              </View>

              {/* Remarks */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineArea]}
                  placeholder="No additional remarks."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                  value={form.Remarks}
                  onChangeText={v => setForm(p => ({ ...p, Remarks: v }))}
                />
                <Text style={styles.charCounter}>{form.Remarks.length}/200</Text>
              </View>

              {/* Status */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <TouchableOpacity 
                  style={styles.dropdownInput}
                  onPress={() => openDropdown('Status', 'Select Status', ['Available', 'Pledged', 'Released'])}
                >
                  <Text style={styles.dropdownValue}>{form.Status}</Text>
                  <Ionicons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Action Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.backButtonSecondary} onPress={handleBack} activeOpacity={0.8}>
                <Text style={styles.backButtonSecondaryText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 1 }]} 
                onPress={handleSave} 
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Save Ornaments</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── OPTION PICKER MODAL ─── */}
      <Modal visible={pickerModal.visible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerModal(p => ({ ...p, visible: false }))}
        >
          <View style={styles.pickerBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerModal.title}</Text>
              <TouchableOpacity onPress={() => setPickerModal(p => ({ ...p, visible: false }))}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {pickerModal.options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerItem}
                  onPress={() => selectOption(opt)}
                >
                  <Text style={styles.pickerItemText}>{opt}</Text>
                  {form[pickerModal.field] === opt && (
                    <Ionicons name="checkmark" size={18} color="#0284c7" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── CUSTOMER SEARCH PICKER MODAL ─── */}
      <Modal visible={customerModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => { setCustomerModalVisible(false); setCustomerSearchQuery(''); }}
        >
          <View style={[styles.pickerBox, { maxHeight: '80%' }]}>
            <View style={styles.pickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="people-outline" size={20} color="#0284c7" />
                <Text style={styles.pickerTitle}>Select Customer</Text>
              </View>
              <TouchableOpacity onPress={() => { setCustomerModalVisible(false); setCustomerSearchQuery(''); }}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.customerSearchBox}>
              <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.customerSearchInput}
                placeholder="Search by name, phone or ID..."
                placeholderTextColor={colors.placeholder}
                value={customerSearchQuery}
                onChangeText={setCustomerSearchQuery}
              />
              {customerSearchQuery ? (
                <TouchableOpacity onPress={() => setCustomerSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Option to clear / No Customer */}
            <TouchableOpacity
              style={[styles.customerPickerItem, !form.UserId && styles.customerSelectedRow]}
              onPress={() => {
                setForm(p => ({ ...p, UserId: '' }));
                setCustomerModalVisible(false);
                setCustomerSearchQuery('');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="remove-circle-outline" size={18} color="#64748b" />
                <Text style={[styles.pickerItemText, { color: '#64748b', fontStyle: 'italic' }]}>None (No Customer)</Text>
              </View>
              {!form.UserId && <Ionicons name="checkmark" size={18} color="#0284c7" />}
            </TouchableOpacity>

            {/* Customer List */}
            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {filteredCustomers.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>No customers found</Text>
                </View>
              ) : (
                filteredCustomers.map(u => (
                  <TouchableOpacity
                    key={u.UserId}
                    style={[styles.customerPickerItem, form.UserId === u.UserId && styles.customerSelectedRow]}
                    onPress={() => {
                      setForm(p => ({ ...p, UserId: u.UserId }));
                      setCustomerModalVisible(false);
                      setCustomerSearchQuery('');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerPickerName}>{u.FullName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Text style={styles.customerPickerMeta}>ID: {u.UserId}</Text>
                        {u.MobileNumber ? <Text style={styles.customerPickerMeta}>• {u.MobileNumber}</Text> : null}
                        {u.City ? <Text style={styles.customerPickerMeta}>• {u.City}</Text> : null}
                      </View>
                    </View>
                    {form.UserId === u.UserId && (
                      <Ionicons name="checkmark" size={18} color="#0284c7" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: isDark ? '#0f172a' : '#d8edfa',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#bfe0f2',
  },
  backBtn: {
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

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDark ? '#334155' : '#cbd5e1',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: '#0284c7',
    backgroundColor: '#0284c7',
  },
  stepCircleDone: {
    borderColor: '#0284c7',
    backgroundColor: '#0284c7',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  stepNumActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  stepLabelActive: {
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: isDark ? '#334155' : '#e2e8f0',
    marginBottom: 16,
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#0284c7',
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: isDark ? '#090d16' : '#ffffff',
  },

  // Customer Search & Dropdown
  customerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  customerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
    paddingVertical: 2,
  },
  customerPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  customerPickerName: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  customerPickerMeta: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  customerSelectedRow: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
  },

  // Card Structure
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 1,
  },

  fieldGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#cbd5e1' : '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#ef4444',
  },
  textInput: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },

  // Units
  unitInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    overflow: 'hidden',
  },
  unitInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  unitBadge: {
    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: isDark ? '#334155' : '#e2e8f0',
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  readonlyInputBox: {
    backgroundColor: isDark ? 'rgba(148, 163, 184, 0.12)' : '#e9edf5',
    borderColor: isDark ? '#334155' : '#d5dbe7',
  },
  readonlyUnitBadge: {
    backgroundColor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#e2e7f0',
    borderLeftColor: isDark ? '#334155' : '#d5dbe7',
  },
  readonlyInputText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  autoCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  autoCalcBadge: {
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e2f5ec',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  autoCalcBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: isDark ? '#34d399' : '#00b575',
  },
  autoCalcText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 3,
  },

  // Live Gold Rate Badge
  liveRateBadge: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 115,
  },
  liveRateTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  liveRateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  liveRateDotWithPurity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveRateGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveRatePurityText: {
    fontSize: 10,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  liveRateValue: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
    marginTop: 2,
  },

  prefixSuffixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingHorizontal: 12,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
    marginRight: 6,
  },
  prefixInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  suffixText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
    marginLeft: 6,
  },

  // 2x2 Calculations Grid
  calcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  calcTile: {
    width: '48%',
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    padding: 10,
  },
  calcTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  calcTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
    flex: 1,
  },
  calcTileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  appreciationTileValue: {
    color: '#16a34a',
  },
  calcTileSub: {
    fontSize: 9,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  photoThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284c7',
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBoxText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4,
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
  },
  calloutText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
    flex: 1,
  },

  multilineArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 10,
    color: isDark ? '#94a3b8' : '#94a3b8',
    textAlign: 'right',
    marginTop: 3,
  },

  // Navigation Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },

  // Modal Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f8fafc',
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
});
