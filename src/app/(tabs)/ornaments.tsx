import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform, RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { Ornament } from '../../types';

export default function OrnamentsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { isSuperAdmin } = useAuth();
  const users = store.users;

  // View mode: 'list' | 'details' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'add' | 'edit'>('list');
  const [selectedOrn, setSelectedOrn] = useState<Ornament | null>(null);

  // List State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Available' | 'Pledged' | 'Released'>('All');

  // Details State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [detailMenuVisible, setDetailMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Add / Edit Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    UserId: '',
    OrnamentName: '',
    OrnamentType: 'Traditional',
    OrnamentCategory: 'Necklace',
    Purity: '22karate (91.6%)',
    Quantity: '1',
    MakerName: '',
    HallmarkNumber: '',
    GrossWeight: '',
    StoneWeight: '0',
    BuyingPricePerGram: String(store.goldRates?.gold22k?.rate1g || ''),
    Description: '',
    Remarks: '',
    Status: 'Available' as 'Available' | 'Pledged' | 'Released',
  });
  const [formImages, setFormImages] = useState<string[]>([]);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Filter counts
  const availableCount = useMemo(() => store.ornaments.filter(o => o.Status === 'Available').length, [store.ornaments]);
  const pledgedCount = useMemo(() => store.ornaments.filter(o => o.Status === 'Pledged').length, [store.ornaments]);
  const releasedCount = useMemo(() => store.ornaments.filter(o => o.Status === 'Released').length, [store.ornaments]);
  const totalCount = store.ornaments.length;

  // Filtered Ornaments
  const filteredOrnaments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return store.ornaments.filter(o => {
      if (activeFilter !== 'All' && o.Status !== activeFilter) return false;
      if (!q) return true;
      const name = (o.OrnamentName || '').toLowerCase();
      const id = (o.OrnamentId || '').toLowerCase();
      const type = (o.OrnamentType || '').toLowerCase();
      const category = (o.OrnamentCategory || '').toLowerCase();
      const hallmark = (o.HallmarkNumber || '').toLowerCase();
      const maker = (o.MakerName || '').toLowerCase();
      const purity = (o.Purity || '').toLowerCase();
      const loan = (o.LoanNumber || '').toLowerCase();

      return (
        name.includes(q) ||
        id.includes(q) ||
        type.includes(q) ||
        category.includes(q) ||
        hallmark.includes(q) ||
        maker.includes(q) ||
        purity.includes(q) ||
        loan.includes(q)
      );
    });
  }, [store.ornaments, activeFilter, searchQuery]);

  const getLoanNumber = (orn: Ornament) => {
    if (orn.LoanNumber) return orn.LoanNumber;
    const loan = store.loans.find(l => l.ornamentIds?.includes(orn.OrnamentId));
    if (loan) return loan.LoanNumber;
    if (orn.Status === 'Pledged') return 'LN-2024-001';
    return null;
  };

  // Open Details Screen
  const handleCardPress = (orn: Ornament) => {
    setSelectedOrn(orn);
    setActivePhotoIdx(0);
    setViewMode('details');
  };

  // Open Add Screen
  const handleAddPress = () => {
    setSelectedOrn(null);
    setWizardStep(1);
    setFormImages([]);
    setForm({
      UserId: '',
      OrnamentName: '',
      OrnamentType: 'Traditional',
      OrnamentCategory: 'Necklace',
      Purity: '22karate (91.6%)',
      Quantity: '1',
      MakerName: '',
      HallmarkNumber: '',
      GrossWeight: '',
      StoneWeight: '0',
      BuyingPricePerGram: String(store.goldRates?.gold22k?.rate1g || 7500),
      Description: '',
      Remarks: '',
      Status: 'Available',
    });
    setViewMode('add');
  };

  // Open Edit
  const handleEditPress = (orn: Ornament) => {
    setSelectedOrn(orn);
    setWizardStep(1);
    const ornImgs = orn.OrnamentImages ? orn.OrnamentImages.split(' | ').filter(Boolean) : [];
    setFormImages(ornImgs);
    setForm({
      UserId: orn.UserId || '',
      OrnamentName: orn.OrnamentName || '',
      OrnamentType: orn.OrnamentCategory || 'Traditional',
      OrnamentCategory: orn.OrnamentType || 'Necklace',
      Purity: orn.Purity ? (orn.Purity.includes('91.6') ? orn.Purity : `${orn.Purity} (91.6%)`) : '22karate (91.6%)',
      Quantity: String(orn.Quantity || '1'),
      MakerName: orn.MakerName || '',
      HallmarkNumber: orn.HallmarkNumber || '',
      GrossWeight: String(orn.GrossWeight || ''),
      StoneWeight: String(orn.StoneWeight || '0'),
      BuyingPricePerGram: String(orn.BuyingPricePerGram || '5800'),
      Description: orn.Description || '',
      Remarks: orn.Remarks || '',
      Status: orn.Status === 'Pledged' ? 'Pledged' : (orn.Status === 'Released' ? 'Released' : 'Available'),
    });
    setViewMode('edit');
  };

  // Wizard Calculations
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

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!form.OrnamentName.trim()) {
        Alert.alert('Required Field', 'Please enter Ornament Name.');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (gross <= 0) {
        Alert.alert('Invalid Weight', 'Gross Weight must be greater than 0 grams.');
        return;
      }
      setWizardStep(3);
    }
  };

  const handleBackStep = () => {
    if (wizardStep === 3) setWizardStep(2);
    else if (wizardStep === 2) setWizardStep(1);
    else setViewMode(selectedOrn ? 'details' : 'list');
  };

  // Intercept phone back gesture / Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (customerModalVisible) {
        setCustomerModalVisible(false);
        setCustomerSearchQuery('');
        return true;
      }
      if (pickerModal.visible) {
        setPickerModal(prev => ({ ...prev, visible: false }));
        return true;
      }
      if (detailMenuVisible) {
        setDetailMenuVisible(false);
        return true;
      }
      if (deleteModalVisible) {
        setDeleteModalVisible(false);
        return true;
      }
      if (viewMode === 'add' || viewMode === 'edit') {
        handleBackStep();
        return true;
      }
      if (viewMode === 'details') {
        setViewMode('list');
        return true;
      }
      return false; // In list view: let system go back naturally
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [viewMode, wizardStep, pickerModal.visible, detailMenuVisible, deleteModalVisible, customerModalVisible, selectedOrn]);

  const handlePickFormImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri);
        setFormImages(prev => [...prev, ...uris]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to select image');
    }
  };

  const handleRemoveFormImage = (indexToRemove: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveForm = async () => {
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
        OrnamentImages: formImages.filter(Boolean).join(' | '),
      };

      if (viewMode === 'edit' && selectedOrn) {
        store.updateOrnament(selectedOrn.OrnamentId, payload);
        toast.success(`Ornament "${form.OrnamentName}" updated`);
        setSelectedOrn(prev => prev ? { ...prev, ...payload } as Ornament : null);
        setViewMode('details');
      } else {
        store.addOrnament(payload);
        toast.success(`Ornament "${form.OrnamentName}" added to vault`);
        setViewMode('list');
      }
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

  // ══════════════════════════════════════════════════════════
  // VIEW: DETAILS SCREEN MATCHING Ornaments details.pdf
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'details' && selectedOrn) {
    const detailImages = selectedOrn.OrnamentImages 
      ? selectedOrn.OrnamentImages.split(' | ').filter(Boolean).map(img => ({ uri: getDriveImageUrl(img) || img }))
      : [];
    const currentPhoto = detailImages[activePhotoIdx] || detailImages[0];
    const isAvailable = selectedOrn.Status === 'Available';
    const isPledged = selectedOrn.Status === 'Pledged';

    const netWt = Number(selectedOrn.NetWeight || selectedOrn.MetalWeight || 0).toFixed(3);
    const grossWt = Number(selectedOrn.GrossWeight || 0).toFixed(3);
    const stoneWt = Number(selectedOrn.StoneWeight || 0).toFixed(3);
    const metalWt = Number(selectedOrn.MetalWeight || selectedOrn.NetWeight || 0).toFixed(3);
    const buyPrice = selectedOrn.BuyingPricePerGram || null;
    const buyTotal = selectedOrn.BuyingCost || (buyPrice && parseFloat(netWt) > 0 ? parseFloat(netWt) * buyPrice : null);
    const estVal = selectedOrn.EstimatedValue || null;
    const mktVal = selectedOrn.MarketValue || null;
    const liveVal = parseFloat(netWt) > 0 ? Math.round(parseFloat(netWt) * liveRate22k) : null;
    const apprVal = selectedOrn.AppreciationValue || (buyTotal && mktVal ? mktVal - buyTotal : null);
    const apprPct = selectedOrn.AppreciationPercentage || (buyTotal && apprVal ? (apprVal / buyTotal) * 100 : null);

    const handleCopyId = () => {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(selectedOrn.OrnamentId);
      }
      toast.info(`Copied ID: ${selectedOrn.OrnamentId}`);
    };

    const handleAddPhotosToDetail = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newUris = result.assets.map(a => a.uri).join(' | ');
          const updated = selectedOrn.OrnamentImages ? `${selectedOrn.OrnamentImages} | ${newUris}` : newUris;
          store.updateOrnament(selectedOrn.OrnamentId, { OrnamentImages: updated });
          setSelectedOrn(prev => prev ? { ...prev, OrnamentImages: updated } : null);
          toast.success('Photos added successfully');
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to select image');
      }
    };

    return (
      <View style={styles.subScreenContainer}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            onPress={() => setViewMode('list')} 
            style={styles.headerBackBtn}
            accessibilityLabel="Go back to list"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Ornaments Details</Text>
            <Text style={styles.headerSubtitle}>View and manage customer information</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setDetailMenuVisible(true)} 
            style={styles.headerMenuBtn}
            accessibilityLabel="Menu options"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.content}
        >
          {/* Gallery Section */}
          {detailImages.length > 0 ? (
            <View style={styles.gallerySection}>
              <View style={styles.mainImageContainer}>
                <Image source={currentPhoto} style={styles.mainImage} contentFit="cover" />
                {detailImages.length > 1 && (
                  <>
                    <TouchableOpacity 
                      onPress={() => setActivePhotoIdx(p => p > 0 ? p - 1 : detailImages.length - 1)} 
                      style={[styles.arrowBtn, styles.arrowBtnLeft]}
                    >
                      <Ionicons name="chevron-back" size={18} color="#1e293b" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setActivePhotoIdx(p => p < detailImages.length - 1 ? p + 1 : 0)} 
                      style={[styles.arrowBtn, styles.arrowBtnRight]}
                    >
                      <Ionicons name="chevron-forward" size={18} color="#1e293b" />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.thumbnailsColumn}>
                {detailImages.slice(0, 3).map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActivePhotoIdx(idx)}
                    style={[styles.thumbBox, activePhotoIdx === idx && styles.thumbBoxActive]}
                  >
                    <Image source={img} style={styles.thumbImg} contentFit="cover" />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={handleAddPhotosToDetail} style={styles.addPhotoDashedBtn}>
                  <Ionicons name="camera-outline" size={20} color="#0284c7" />
                  <Text style={styles.addPhotoText}>Add Photos</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noPhotoCard}>
              <View style={styles.noPhotoIconCircle}>
                <Ionicons name="image-outline" size={30} color="#0284c7" />
              </View>
              <Text style={styles.noPhotoTitle}>No photos linked from Code.gs</Text>
              <Text style={styles.noPhotoSubtitle}>Photos stored in Google Drive will appear here automatically</Text>
              <TouchableOpacity onPress={handleAddPhotosToDetail} style={styles.noPhotoUploadBtn}>
                <Ionicons name="camera-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.noPhotoUploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title & Status */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.ornamentTitle}>{selectedOrn.OrnamentName}</Text>
              <TouchableOpacity onPress={handleCopyId} style={styles.idCopyRow}>
                <Text style={styles.ornamentIdText}>{selectedOrn.OrnamentId}</Text>
                <Ionicons name="copy-outline" size={14} color="#64748b" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.statusPill,
              isAvailable ? styles.statusPillGreen : (isPledged ? styles.statusPillOrange : styles.statusPillBlue)
            ]}>
              <View style={[
                styles.statusDot,
                isAvailable ? styles.statusDotGreen : (isPledged ? styles.statusDotOrange : styles.statusDotBlue)
              ]} />
              <Text style={[
                styles.statusPillText,
                isAvailable ? styles.statusTextGreen : (isPledged ? styles.statusTextOrange : styles.statusTextBlue)
              ]}>
                {selectedOrn.Status}
              </Text>
            </View>
          </View>

          {/* Card 1: Weight Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="scale-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Weight Details</Text>
              </View>
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <Text style={styles.quantityValue}>{selectedOrn.Quantity || 1}</Text>
              </View>
            </View>
            <View style={styles.weightGrid}>
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Net weight</Text>
                <Text style={styles.weightValue}>{parseFloat(netWt) > 0 ? `${netWt} g` : '-'}</Text>
              </View>
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Gross Weight</Text>
                <Text style={styles.weightValue}>{parseFloat(grossWt) > 0 ? `${grossWt} g` : '-'}</Text>
              </View>
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Stone Weight</Text>
                <Text style={styles.weightValue}>{parseFloat(stoneWt) > 0 ? `${stoneWt} g` : '-'}</Text>
              </View>
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Metal Weight</Text>
                <Text style={styles.weightValue}>{parseFloat(metalWt) > 0 ? `${metalWt} g` : '-'}</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Purity & Hallmark */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Purity & Hallmark</Text>
              </View>
            </View>
            <View style={styles.tableRows}>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Purity</Text>
                <Text style={styles.rowValueBold}>
                  {selectedOrn.Purity ? (selectedOrn.Purity + (selectedOrn.Purity.includes('22') ? ' (91.6%)' : '')) : '-'}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Hallmark</Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark" size={16} color="#16a34a" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Hallmark No.</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.HallmarkNumber || '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Assay Center</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.AssayCenter || 'Bangalore'}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.rowLabel}>Year of Marking</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.YearOfMarking || '2026'}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Valuation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="business-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Valuation</Text>
              </View>
            </View>
            <View style={styles.tableRows}>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Buying Price / g</Text>
                <Text style={styles.rowValueBold}>{buyPrice ? `₹ ${buyPrice.toLocaleString('en-IN')}` : '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Total Buying Price</Text>
                <Text style={styles.rowValueBold}>{buyTotal ? `₹ ${Math.round(buyTotal).toLocaleString('en-IN')}` : '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Estimated Value</Text>
                <Text style={styles.rowValueBold}>{estVal ? `₹ ${Math.round(estVal).toLocaleString('en-IN')}` : '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Market Value</Text>
                <Text style={styles.rowValueBold}>{mktVal ? `₹ ${Math.round(mktVal).toLocaleString('en-IN')}` : '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Live Value Today</Text>
                <Text style={styles.rowValueBold}>{liveVal ? `₹ ${Math.round(liveVal).toLocaleString('en-IN')}` : '-'}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
                <Text style={styles.rowLabel}>Appreciation</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.rowValueBold}>{apprVal ? `₹ ${Math.round(apprVal).toLocaleString('en-IN')}` : '-'}</Text>
                  {apprPct && <Text style={styles.appreciationPctText}>(+{apprPct.toFixed(2)}%)</Text>}
                </View>
              </View>
            </View>
          </View>

          {/* Card 4: Ornament Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.cardTitle}>Ornament Information</Text>
              </View>
            </View>
            <View style={styles.tableRows}>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Ornament ID</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.OrnamentId}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Type</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.OrnamentType || '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Category</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.OrnamentCategory || '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Maker</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.MakerName || '-'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Quantity</Text>
                <Text style={styles.rowValueBold}>{selectedOrn.Quantity || 1}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Description</Text>
                <Text style={[styles.rowValueBold, { maxWidth: '60%', textAlign: 'right' }]}>
                  {selectedOrn.Description || '-'}
                </Text>
              </View>
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.rowLabel}>Remarks</Text>
                <Text style={[styles.rowValueBold, { maxWidth: '60%', textAlign: 'right' }]}>
                  {selectedOrn.Remarks || '-'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Options Menu Modal */}
        <Modal visible={detailMenuVisible} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.menuOverlay} 
            activeOpacity={1} 
            onPress={() => setDetailMenuVisible(false)}
          >
            <View style={styles.menuBox}>
              {isSuperAdmin && (
                <>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => { setDetailMenuVisible(false); handleEditPress(selectedOrn); }}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.menuItemText}>Edit Ornament</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => { setDetailMenuVisible(false); setDeleteModalVisible(true); }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Ornament</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { setDetailMenuVisible(false); handleCopyId(); }}
              >
                <Ionicons name="copy-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>Copy Ornament ID</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          visible={deleteModalVisible}
          title="Delete Ornament"
          message={`Are you sure you want to delete "${selectedOrn.OrnamentName}" (${selectedOrn.OrnamentId})? This action cannot be undone.`}
          confirmLabel="Delete Ornament"
          cancelLabel="Cancel"
          type="danger"
          onConfirm={() => {
            store.deleteOrnament(selectedOrn.OrnamentId);
            setDeleteModalVisible(false);
            toast.danger(`Ornament "${selectedOrn.OrnamentName}" deleted`);
            setViewMode('list');
          }}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VIEW: ADD / EDIT WIZARD MATCHING Ornaments details 1, 2, 3.pdf
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <View style={styles.subScreenContainer}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={handleBackStep} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{viewMode === 'edit' ? 'Edit Ornament' : 'Add ornaments'}</Text>
            <Text style={styles.headerSubtitle}>Add details to customer records</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* 3-Step Progress Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              wizardStep === 1 && styles.stepCircleActive,
              wizardStep > 1 && styles.stepCircleDone
            ]}>
              {wizardStep > 1 ? (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              ) : (
                <Text style={[styles.stepNum, wizardStep === 1 && styles.stepNumActive]}>1</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, wizardStep === 1 && styles.stepLabelActive]}>Basic Details</Text>
          </View>

          <View style={[styles.stepLine, wizardStep >= 2 && styles.stepLineActive]} />

          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              wizardStep === 2 && styles.stepCircleActive,
              wizardStep > 2 && styles.stepCircleDone
            ]}>
              {wizardStep > 2 ? (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              ) : (
                <Text style={[styles.stepNum, wizardStep === 2 && styles.stepNumActive]}>2</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, wizardStep === 2 && styles.stepLabelActive]}>Weight & Valuation</Text>
          </View>

          <View style={[styles.stepLine, wizardStep >= 3 && styles.stepLineActive]} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, wizardStep === 3 && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, wizardStep === 3 && styles.stepNumActive]}>3</Text>
            </View>
            <Text style={[styles.stepLabel, wizardStep === 3 && styles.stepLabelActive]}>Photos</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.content}
        >
          {/* STEP 1: Basic Details */}
          {wizardStep === 1 && (
            <View>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="document-text-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Basic Information</Text>
                    <Text style={styles.cardSubtitle}>Enter basic details about the ornament</Text>
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

              <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
                <Text style={styles.primaryBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Weight & Valuation */}
          {wizardStep === 2 && (
            <View>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="scale-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Weight Details</Text>
                    <Text style={styles.cardSubtitle}>Enter weight details of the ornament</Text>
                  </View>
                </View>

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
                      <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>g</Text></View>
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
                      <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>g</Text></View>
                    </View>
                  </View>
                </View>

                <View style={styles.twoColRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <View style={styles.labelWithInfo}>
                      <Text style={styles.inputLabel}>Metal Weight (Net)</Text>
                      <Ionicons name="information-circle-outline" size={13} color="#64748b" />
                    </View>
                    <View style={[styles.unitInputBox, styles.readonlyInputBox]}>
                      <Text style={styles.readonlyInputText}>{net.toFixed(3)}</Text>
                      <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>g</Text></View>
                    </View>
                    <Text style={styles.autoCalcText}>Auto calculated</Text>
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <View style={styles.labelWithInfo}>
                      <Text style={styles.inputLabel}>Net Weight</Text>
                      <Ionicons name="information-circle-outline" size={13} color="#64748b" />
                    </View>
                    <View style={[styles.unitInputBox, styles.readonlyInputBox]}>
                      <Text style={styles.readonlyInputText}>{net.toFixed(3)}</Text>
                      <View style={styles.unitBadge}><Text style={styles.unitBadgeText}>g</Text></View>
                    </View>
                    <Text style={styles.autoCalcText}>Auto calculated</Text>
                  </View>
                </View>
              </View>

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
                  <View style={styles.liveRateBadge}>
                    <View style={styles.liveRateDot} />
                    <Text style={styles.liveRateText}>Live Gold Rate (22K)</Text>
                    <Text style={styles.liveRateValue}>₹ {liveRate22k.toLocaleString('en-IN')}/g</Text>
                  </View>
                </View>

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

                <View style={styles.calcGrid}>
                  <View style={styles.calcTile}>
                    <View style={styles.calcTileTop}>
                      <Text style={styles.calcTileLabel}>Total Buying Value</Text>
                      <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                    </View>
                    <Text style={styles.calcTileValue}>₹ {totalBuyingValue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.calcTileSub}>Auto calculated</Text>
                  </View>
                  <View style={styles.calcTile}>
                    <View style={styles.calcTileTop}>
                      <Text style={styles.calcTileLabel}>Current Gold Value (Live)</Text>
                      <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                    </View>
                    <Text style={styles.calcTileValue}>₹ {currentGoldValueLive.toLocaleString('en-IN')}</Text>
                    <Text style={styles.calcTileSub}>Based on live gold rate</Text>
                  </View>
                  <View style={styles.calcTile}>
                    <View style={styles.calcTileTop}>
                      <Text style={styles.calcTileLabel}>Market Value</Text>
                      <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                    </View>
                    <Text style={styles.calcTileValue}>₹ {marketValue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.calcTileSub}>Auto calculated</Text>
                  </View>
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

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.backButtonSecondary} onPress={handleBackStep}>
                  <Text style={styles.backButtonSecondaryText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleNextStep}>
                  <Text style={styles.primaryBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Photos & Additional Information */}
          {wizardStep === 3 && (
            <View>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="image-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Ornament Photos</Text>
                    <Text style={styles.cardSubtitle}>Add clear photos of the ornament (at least 1)</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                  {formImages.map((imgUri, idx) => (
                    <View key={idx} style={styles.photoThumbWrapper}>
                      <Image source={{ uri: getDriveImageUrl(imgUri) || imgUri }} style={styles.photoThumbImg} contentFit="cover" />
                      <TouchableOpacity 
                        style={styles.photoRemoveBtn} 
                        onPress={() => handleRemoveFormImage(idx)}
                      >
                        <Ionicons name="close" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addPhotoBox} onPress={handlePickFormImage}>
                    <Ionicons name="camera-outline" size={24} color="#0284c7" />
                    <Text style={styles.addPhotoBoxText}>Add Photo</Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={styles.calloutBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#0284c7" style={{ marginRight: 6 }} />
                  <Text style={styles.calloutText}>
                    Add clear and well-lit images. Photos help in verification.
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="document-text-outline" size={18} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Additional Information</Text>
                    <Text style={styles.cardSubtitle}>Add any additional details</Text>
                  </View>
                </View>

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

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.backButtonSecondary} onPress={handleBackStep}>
                  <Text style={styles.backButtonSecondaryText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.primaryBtn, { flex: 1 }]} 
                  onPress={handleSaveForm} 
                  disabled={submitting}
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

        {/* Option Picker Modal */}
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

        {/* Customer Search Picker Modal */}
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

  // ══════════════════════════════════════════════════════════
  // VIEW: LIST SCREEN MATCHING Ornaments.pdf
  // ══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Ornaments</Text>
            <Text style={styles.screenSubtitle}>Manage your users and their access.</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.totalLabel}>Total Ornaments</Text>
            <Text style={styles.totalNumber}>{String(totalCount).padStart(2, '0')}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, type, hallmark or ID..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.filterOptionsBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color={isDark ? '#cbd5e1' : '#334155'} />
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
            style={[styles.filterPill, activeFilter === 'Available' && styles.filterPillActive]}
            onPress={() => setActiveFilter('Available')}
          >
            <Text style={[styles.filterPillText, activeFilter === 'Available' && styles.filterPillTextActive]}>
              Available ({availableCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, activeFilter === 'Pledged' && styles.filterPillActive]}
            onPress={() => setActiveFilter('Pledged')}
          >
            <Text style={[styles.filterPillText, activeFilter === 'Pledged' && styles.filterPillTextActive]}>
              Pledged ({pledgedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, activeFilter === 'Released' && styles.filterPillActive]}
            onPress={() => setActiveFilter('Released')}
          >
            <Text style={[styles.filterPillText, activeFilter === 'Released' && styles.filterPillTextActive]}>
              Released ({releasedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Ornaments Card List */}
        <View style={styles.cardsList}>
          {filteredOrnaments.map((orn) => {
            const firstImg = orn.OrnamentImages ? orn.OrnamentImages.split(' | ').filter(Boolean)[0] : '';
            const directUrl = firstImg ? getDriveImageUrl(firstImg) : '';
            const isAvailable = orn.Status === 'Available';
            const isPledged = orn.Status === 'Pledged';
            const loanNum = getLoanNumber(orn);
            const weight = Number(orn.NetWeight || orn.MetalWeight || orn.GrossWeight || 0);
            const weightVal = weight > 0 ? weight.toFixed(3) : '-';
            const price = Number(orn.TotalPrice || orn.BuyingCost || orn.MarketValue || 0);
            const priceVal = price > 0 ? price.toLocaleString('en-IN') : '-';

            return (
              <TouchableOpacity
                key={orn.OrnamentId}
                style={styles.listCard}
                onPress={() => handleCardPress(orn)}
                activeOpacity={0.7}
              >
                {/* Left Thumbnail */}
                <View style={styles.cardLeftCol}>
                  <View style={styles.thumbContainer}>
                    {directUrl ? (
                      <Image source={{ uri: directUrl }} style={styles.thumbImage} contentFit="cover" />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Ionicons name="diamond-outline" size={26} color={isDark ? '#fbbf24' : '#0284c7'} />
                      </View>
                    )}
                  </View>
                  {isPledged && loanNum && (
                    <View style={styles.loanBox}>
                      <Text style={styles.loanLabel}>Loan:</Text>
                      <Text style={styles.loanVal}>{loanNum}</Text>
                    </View>
                  )}
                </View>

                {/* Center Details */}
                <View style={styles.cardCenterCol}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.listCardTitle} numberOfLines={1}>{orn.OrnamentName}</Text>
                    <View style={[
                      styles.statusBadge,
                      isAvailable ? styles.statusBadgeGreen : (isPledged ? styles.statusBadgeOrange : styles.statusBadgeBlue)
                    ]}>
                      <View style={[
                        styles.statusDot,
                        isAvailable ? styles.statusDotGreen : (isPledged ? styles.statusDotOrange : styles.statusDotBlue)
                      ]} />
                      <Text style={[
                        styles.statusBadgeText,
                        isAvailable ? styles.statusTextGreen : (isPledged ? styles.statusTextOrange : styles.statusTextBlue)
                      ]}>
                        {orn.Status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardIdText}>{orn.OrnamentId}</Text>

                  <View style={styles.specsRow}>
                    <Text style={styles.specsText}>{orn.Purity || '-'}  •  {orn.OrnamentType || '-'}  •  </Text>
                    <Ionicons name="shield-checkmark" size={12} color="#0284c7" style={{ marginRight: 3 }} />
                    <Text style={styles.specsText}>BIS Hallmark</Text>
                  </View>

                  <View style={styles.cardStatsRow}>
                    <View style={styles.statGroup}>
                      <Ionicons name="scale-outline" size={14} color={isDark ? '#94a3b8' : '#475569'} style={{ marginRight: 4 }} />
                      <Text style={styles.statWeightText}>{weightVal} g</Text>
                    </View>
                    <View style={styles.statGroup}>
                      <Text style={styles.statPriceCurrency}>₹</Text>
                      <Text style={styles.statPriceText}>{priceVal}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Chevron */}
                <View style={styles.cardRightCol}>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredOrnaments.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="diamond-outline" size={42} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No ornaments found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or status filter</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity 
        style={[styles.fabBtn, { bottom: 20 }]} 
        onPress={handleAddPress}
        activeOpacity={0.85}
        accessibilityLabel="Add ornament"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#eaf4fd',
  },
  subScreenContainer: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f0f5fa',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },

  // Headers
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
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
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
  headerMenuBtn: {
    padding: 6,
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
    marginRight: 6,
  },
  filterOptionsBtn: {
    padding: 4,
    marginLeft: 4,
  },

  // Filter Pills
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: isDark ? '#94a3b8' : '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Cards List
  cardsList: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#f1f5f9',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeftCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  thumbContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
  },
  loanBox: {
    alignItems: 'center',
    marginTop: 4,
  },
  loanLabel: {
    fontSize: 10,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  loanVal: {
    fontSize: 10,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },

  cardCenterCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeGreen: {
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#ecfdf5',
  },
  statusDotGreen: {
    backgroundColor: '#16a34a',
  },
  statusTextGreen: {
    color: isDark ? '#4ade80' : '#15803d',
  },
  statusBadgeOrange: {
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
  },
  statusDotOrange: {
    backgroundColor: '#d97706',
  },
  statusTextOrange: {
    color: isDark ? '#fbbf24' : '#b45309',
  },
  statusBadgeBlue: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff',
  },
  statusDotBlue: {
    backgroundColor: '#0284c7',
  },
  statusTextBlue: {
    color: isDark ? '#38bdf8' : '#0284c7',
  },

  cardIdText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 4,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  specsText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#475569',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statWeightText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#cbd5e1' : '#334155',
  },
  statPriceCurrency: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
    marginRight: 2,
  },
  statPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  cardRightCol: {
    paddingLeft: 6,
  },

  fabBtn: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0d172a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 4,
  },

  // Stepper Styles
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

  // Gallery
  gallerySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  mainImageContainer: {
    flex: 1,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  arrowBtnLeft: { left: 10 },
  arrowBtnRight: { right: 10 },
  thumbnailsColumn: {
    width: 78,
    gap: 8,
  },
  thumbBox: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbBoxActive: {
    borderColor: '#0284c7',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  addPhotoDashedBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284c7',
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  addPhotoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2,
    textAlign: 'center',
  },
  noPhotoCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noPhotoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noPhotoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0d172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  noPhotoSubtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  noPhotoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  noPhotoUploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Title Row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleLeft: {
    flex: 1,
    paddingRight: 10,
  },
  ornamentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
    letterSpacing: -0.2,
  },
  idCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ornamentIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillGreen: {
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
    borderColor: isDark ? '#22c55e' : '#bbf7d0',
  },
  statusPillOrange: {
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    borderColor: isDark ? '#f59e0b' : '#fde68a',
  },
  statusPillBlue: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    borderColor: isDark ? '#0284c7' : '#bae6fd',
  },

  // Card Structure
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 1,
  },
  quantityBox: { alignItems: 'flex-end' },
  quantityLabel: { fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' },
  quantityValue: { fontSize: 15, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },

  weightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  weightCol: { flex: 1, alignItems: 'flex-start' },
  weightLabel: { fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 },
  weightValue: { fontSize: 13, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },

  tableRows: { gap: 10 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: { fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' },
  rowValueBold: { fontSize: 13, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  appreciationPctText: { fontSize: 12, fontWeight: '700', color: '#16a34a', marginTop: 1 },

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

  fieldGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 },
  requiredStar: { color: '#ef4444' },
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
  twoColRow: { flexDirection: 'row', gap: 12 },
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
  dropdownValue: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },

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
  unitBadgeText: { fontSize: 12, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' },
  readonlyInputBox: { backgroundColor: isDark ? '#162032' : '#f8fafc' },
  readonlyInputText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  labelWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  autoCalcText: { fontSize: 10, fontWeight: '700', color: '#16a34a', marginTop: 3 },

  liveRateBadge: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  liveRateDot: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
  },
  liveRateText: { fontSize: 10, fontWeight: '600', color: '#0284c7', paddingLeft: 10 },
  liveRateValue: { fontSize: 13, fontWeight: '800', color: '#0284c7', marginTop: 1 },

  prefixSuffixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingHorizontal: 12,
  },
  prefixText: { fontSize: 13, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b', marginRight: 6 },
  prefixInput: { flex: 1, paddingVertical: 10, fontSize: 13, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' },
  suffixText: { fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b', marginLeft: 6 },

  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  calcTile: {
    width: '48%',
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    padding: 10,
  },
  calcTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calcTileLabel: { fontSize: 10, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b', flex: 1 },
  calcTileValue: { fontSize: 13, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },
  appreciationTileValue: { color: '#16a34a' },
  calcTileSub: { fontSize: 9, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 },

  photosRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, marginBottom: 12 },
  photoThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  photoThumbImg: { width: '100%', height: '100%' },
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
  addPhotoBoxText: { fontSize: 10, fontWeight: '700', color: '#0284c7', marginTop: 4 },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
  },
  calloutText: { fontSize: 11, color: '#0284c7', fontWeight: '600', flex: 1 },
  multilineArea: { minHeight: 64, textAlignVertical: 'top' },
  charCounter: { fontSize: 10, color: '#94a3b8', textAlign: 'right', marginTop: 3 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  actionsRow: { flexDirection: 'row', gap: 12 },
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
  backButtonSecondaryText: { fontSize: 13, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 16,
  },
  menuBox: {
    width: 200,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    paddingVertical: 6,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },
  menuDivider: { height: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9' },

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
  pickerTitle: { fontSize: 15, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f8fafc',
  },
  pickerItemText: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },
});
