import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { OrnamentDetailsView } from '../../components/ornaments/OrnamentDetailsView';
import { OrnamentListView, OrnamentStatusFilter } from '../../components/ornaments/OrnamentListView';
import { OrnamentOptionsMenuHandle } from '../../components/ornaments/OrnamentOptionsMenu';
import {
  OrnamentFormState,
  OrnamentPickerField,
  OrnamentPickerModalState,
  OrnamentWizardView,
} from '../../components/ornaments/OrnamentWizardView';
import { pickOrnamentImages } from '../../components/ornaments/pickOrnamentImages';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { Ornament } from '../../types';
import {
  calculateOrnamentValuation,
  countOrnamentsByStatus,
  filterOrnaments,
  getOrnamentLoanNumber,
  sortOrnaments,
} from '../../utils/userOrnamentCalculations';

export default function OrnamentsScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const store = useAppStore();
  const toast = useToast();
  const users = store.users;

  // View mode: 'list' | 'details' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'add' | 'edit'>('list');
  const [selectedOrn, setSelectedOrn] = useState<Ornament | null>(null);

  // List State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrnamentStatusFilter>('All');
  const [sortOption, setSortOption] = useState('Newest First');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Details State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const optionsMenuRef = useRef<OrnamentOptionsMenuHandle>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Add / Edit Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrnamentFormState>({
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
    Status: 'Available' as 'Available' | 'Pledged',
  });
  const [formImages, setFormImages] = useState<string[]>([]);
  const [pickerModal, setPickerModal] = useState<OrnamentPickerModalState>({
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

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Filter counts
  const availableCount = useMemo(() => countOrnamentsByStatus(store.ornaments, 'Available'), [store.ornaments]);
  const pledgedCount = useMemo(() => countOrnamentsByStatus(store.ornaments, 'Pledged'), [store.ornaments]);
  const totalCount = store.ornaments.length;

  // Filtered Ornaments
  const filteredOrnaments = useMemo(
    () => sortOrnaments(filterOrnaments(store.ornaments, searchQuery, activeFilter), sortOption),
    [store.ornaments, activeFilter, searchQuery, sortOption]
  );

  const getLoanNumber = (orn: Ornament) => getOrnamentLoanNumber(orn, store.loans);

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

  // Entered via a deep link/quick-action (e.g. Home dashboard "Add Ornament") requesting the add wizard directly.
  useEffect(() => {
    if (action === 'add') {
      handleAddPress();
      router.setParams({ action: undefined } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

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
      Status: orn.Status === 'Pledged' ? 'Pledged' : 'Available',
    });
    setViewMode('edit');
  };

  // Wizard Calculations
  const gross = parseFloat(form.GrossWeight) || 0;
  const stone = parseFloat(form.StoneWeight) || 0;
  const buyRate = parseFloat(form.BuyingPricePerGram) || 5800;
  const liveRate22k = store.goldRates?.gold22k?.rate1g || 7500;
  const { net, totalBuyingValue, currentGoldValueLive, marketValue, appreciation, appreciationPct } =
    calculateOrnamentValuation(gross, stone, buyRate, liveRate22k);

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
      if (optionsMenuRef.current?.isOpen()) {
        optionsMenuRef.current.close();
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
  }, [viewMode, wizardStep, pickerModal.visible, deleteModalVisible, customerModalVisible, selectedOrn]);

  const handlePickFormImage = async () => {
    const uris = await pickOrnamentImages();
    if (uris.length > 0) setFormImages(prev => [...prev, ...uris]);
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

  const openDropdown = (field: OrnamentPickerField, title: string, options: string[]) => {
    setPickerModal({ visible: true, title, field, options });
  };

  const selectOption = (opt: string) => {
    setForm(p => ({ ...p, [pickerModal.field]: opt }));
    setPickerModal(p => ({ ...p, visible: false }));
  };

  if (viewMode === 'details' && selectedOrn) {
    return (
      <OrnamentDetailsView
        selectedOrn={selectedOrn}
        setSelectedOrn={setSelectedOrn}
        activePhotoIdx={activePhotoIdx}
        setActivePhotoIdx={setActivePhotoIdx}
        optionsMenuRef={optionsMenuRef}
        deleteModalVisible={deleteModalVisible}
        setDeleteModalVisible={setDeleteModalVisible}
        liveRate22k={liveRate22k}
        onBack={() => setViewMode('list')}
        onEdit={handleEditPress}
      />
    );
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <OrnamentWizardView
        mode={viewMode}
        wizardStep={wizardStep}
        form={form}
        setForm={setForm}
        formImages={formImages}
        submitting={submitting}
        users={users}
        selectedUser={selectedUser}
        valuation={{ net, totalBuyingValue, currentGoldValueLive, marketValue, appreciation, appreciationPct, liveRate22k }}
        refreshingRates={refreshingRates}
        pickerModal={pickerModal}
        setPickerModal={setPickerModal}
        customerModalVisible={customerModalVisible}
        setCustomerModalVisible={setCustomerModalVisible}
        customerSearchQuery={customerSearchQuery}
        setCustomerSearchQuery={setCustomerSearchQuery}
        openDropdown={openDropdown}
        selectOption={selectOption}
        onBackStep={handleBackStep}
        onNextStep={handleNextStep}
        onSave={handleSaveForm}
        onPickImages={handlePickFormImage}
        onRemoveImage={handleRemoveFormImage}
        onRefreshRates={handleRefreshRates}
      />
    );
  }

  return (
    <OrnamentListView
      filteredOrnaments={filteredOrnaments}
      totalCount={totalCount}
      availableCount={availableCount}
      pledgedCount={pledgedCount}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      sortOption={sortOption}
      setSortOption={setSortOption}
      sortModalVisible={sortModalVisible}
      setSortModalVisible={setSortModalVisible}
      refreshing={refreshing}
      onRefresh={onRefresh}
      getLoanNumber={getLoanNumber}
      onCardPress={handleCardPress}
      onAdd={handleAddPress}
    />
  );
}
