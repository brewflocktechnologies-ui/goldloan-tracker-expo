import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Modal, TextInput, Alert, SafeAreaView, Platform, RefreshControl, Linking 
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { getDriveImageUrl, api } from '../../services/api';
import { Env } from '../../config/env';
import { Ornament } from '../../types';
import { DataTable, Column } from '../../components/DataTable';
import { MobileCard } from '../../components/MobileCard';
import { Badge } from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';
import { ImagePickerField, FilePayload } from '../../components/ImagePickerField';
import { ImageViewModal } from '../../components/ImageViewModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function OrnamentsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [ornToDelete, setOrnToDelete] = useState<Ornament | null>(null);
  const [selectedOrn, setSelectedOrn] = useState<Ornament | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filesPayload, setFilesPayload] = useState<FilePayload[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Form State
  const [form, setForm] = useState({
    UserId: '',
    OrnamentName: '',
    OrnamentType: 'Necklace',
    OrnamentCategory: 'Neckwear',
    Purity: '22K',
    GrossWeight: '',
    StoneWeight: '0',
    MetalWeight: '',
    BuyingPricePerGram: '8115',
    CurrentPricePerGram: '8850',
    HallmarkNumber: '',
    Quantity: '1',
    MakerName: '',
    EstimatedValue: '',
    OrnamentImages: '',
    Description: '',
    Remarks: '',
    Status: 'Available' as 'Available' | 'Pledged' | 'Released',
  });

  // EXACT calculations from calcOrnamentWeightsAndPrices in index.html:
  const gross = parseFloat(form.GrossWeight) || 0;
  const stone = parseFloat(form.StoneWeight) || 0;
  // If MetalWeight is manually specified, use it; otherwise gross - stone
  const metal = form.MetalWeight !== '' ? (parseFloat(form.MetalWeight) || 0) : Math.max(0, gross - stone);
  const buyingPrice = parseFloat(form.BuyingPricePerGram) || 0;
  const currentPrice = parseFloat(form.CurrentPricePerGram) || 0;

  // Buying Cost = Metal Weight × Buying Price/g
  const buyingCostCalc = Math.round(metal * buyingPrice * 100) / 100;
  // Market Value = Metal Weight × Current Price/g
  const marketValCalc = Math.round(metal * currentPrice * 100) / 100;
  // Appreciation Value = Market Value - Buying Cost
  const apprValCalc = Math.round((marketValCalc - buyingCostCalc) * 100) / 100;
  // Appreciation % = (Appreciation Value / Buying Cost) × 100
  const apprPctCalc = buyingCostCalc > 0 ? Math.round(((apprValCalc / buyingCostCalc) * 100) * 100) / 100 : 0;

  // On Purity Change: auto-set Current Price from live rates (onOrnamentPurityChange from index.html)
  const handlePuritySelect = (purity: string) => {
    let rate = Env.FALLBACK_22K_RATE;
    if (purity === '24K') rate = store.goldRates?.gold24k?.rate1g || Env.FALLBACK_24K_RATE;
    else if (purity === '18K') rate = store.goldRates?.gold18k?.rate1g || Env.FALLBACK_18K_RATE;
    else rate = store.goldRates?.gold22k?.rate1g || Env.FALLBACK_22K_RATE;

    setForm(p => ({
      ...p,
      Purity: purity,
      CurrentPricePerGram: String(rate),
      BuyingPricePerGram: String(rate),
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedOrn(null);
    setFilesPayload([]);
    // Default rate from live benchmark rates in store if available
    const live22k = store.goldRates?.gold22k?.rate1g || Env.FALLBACK_22K_RATE;
    const live24k = store.goldRates?.gold24k?.rate1g || Env.FALLBACK_24K_RATE;

    setForm({
      UserId: store.users[0]?.UserId || '',
      OrnamentName: '',
      OrnamentType: 'Necklace',
      OrnamentCategory: 'Neckwear',
      Purity: '22K',
      GrossWeight: '',
      StoneWeight: '0',
      MetalWeight: '',
      BuyingPricePerGram: String(live22k),
      CurrentPricePerGram: String(live24k),
      HallmarkNumber: '',
      Quantity: '1',
      MakerName: '',
      EstimatedValue: '',
      OrnamentImages: '',
      Description: '',
      Remarks: '',
      Status: 'Available',
    });
    setModalVisible(true);
  };

  const openEditModal = (orn: Ornament) => {
    setIsEditing(true);
    setSelectedOrn(orn);
    setFilesPayload([]);
    setForm({
      UserId: orn.UserId || '',
      OrnamentName: orn.OrnamentName || '',
      OrnamentType: orn.OrnamentType || 'Necklace',
      OrnamentCategory: orn.OrnamentCategory || 'Neckwear',
      Purity: orn.Purity || '22K',
      GrossWeight: String(orn.GrossWeight || ''),
      StoneWeight: String(orn.StoneWeight || '0'),
      MetalWeight: String(orn.MetalWeight || orn.NetWeight || ''),
      BuyingPricePerGram: String(orn.BuyingPricePerGram || '0'),
      CurrentPricePerGram: String(orn.CurrentPricePerGram || '0'),
      HallmarkNumber: orn.HallmarkNumber || '',
      Quantity: String(orn.Quantity || '1'),
      MakerName: orn.MakerName || '',
      EstimatedValue: String(orn.EstimatedValue || ''),
      OrnamentImages: orn.OrnamentImages || '',
      Description: orn.Description || '',
      Remarks: orn.Remarks || '',
      Status: orn.Status === 'Pledged' ? 'Pledged' : (orn.Status === 'Released' ? 'Released' : 'Available'),
    });
    setModalVisible(true);
  };

  const openDetailModal = (orn: Ornament) => {
    setSelectedOrn(orn);
    setDetailModalVisible(true);
  };

  const handleDelete = (orn: Ornament) => {
    setOrnToDelete(orn);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!ornToDelete) return;
    const name = ornToDelete.OrnamentName;
    store.deleteOrnament(ornToDelete.OrnamentId);
    setDeleteModalVisible(false);
    setOrnToDelete(null);
    toast.danger(`Ornament "${name}" removed from vault`);
  };

  const handleSave = () => {
    if (!form.OrnamentName.trim()) {
      Alert.alert('Validation Error', 'Ornament Name is required.');
      return;
    }
    if (gross <= 0) {
      Alert.alert('Validation Error', 'Gross Weight must be greater than 0.');
      return;
    }

    if (isEditing && selectedOrn) {
      store.updateOrnament(selectedOrn.OrnamentId, {
        ...form,
        GrossWeight: gross,
        StoneWeight: stone,
        NetWeight: metal,
        MetalWeight: metal,
        BuyingPricePerGram: buyingPrice,
        CurrentPricePerGram: currentPrice,
        Quantity: parseInt(form.Quantity) || 1,
        EstimatedValue: parseFloat(form.EstimatedValue) || undefined,
        files: filesPayload,
      });
      toast.success(`Ornament "${form.OrnamentName}" updated successfully`);
    } else {
      store.addOrnament({
        ...form,
        GrossWeight: gross,
        StoneWeight: stone,
        NetWeight: metal,
        MetalWeight: metal,
        BuyingPricePerGram: buyingPrice,
        CurrentPricePerGram: currentPrice,
        Quantity: parseInt(form.Quantity) || 1,
        EstimatedValue: parseFloat(form.EstimatedValue) || undefined,
        files: filesPayload,
      });
      toast.success(`Ornament "${form.OrnamentName}" added to vault`);
    }
    setModalVisible(false);
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Available') return 'success';
    if (s === 'Pledged') return 'warning';
    if (s === 'Released') return 'info';
    return 'default';
  };

  // Table Columns matching index.html:
  // ID | Name | Type | Purity | Gross wt | Stone wt | Metal wt | Status | Buying price/grm | Total Price | Maker Name | Actions
  const columns: Column<Ornament>[] = [
    {
      key: 'OrnamentId',
      title: 'ID',
      width: 65,
      render: (o) => <Text style={styles.idText}>#{o.OrnamentId}</Text>,
    },
    {
      key: 'OrnamentName',
      title: 'Name',
      width: 165,
      render: (o) => {
        const firstImg = o.OrnamentImages ? o.OrnamentImages.split(' | ').filter(Boolean)[0] : '';
        const directUrl = firstImg ? getDriveImageUrl(firstImg) : '';
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {firstImg ? (
              <TouchableOpacity onPress={() => setPreviewImageUrl(firstImg)}>
                <Image source={{ uri: directUrl || firstImg }} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} contentFit="cover" />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryCellText} numberOfLines={1}>{o.OrnamentName}</Text>
              {o.HallmarkNumber ? <Text style={styles.subCellText} numberOfLines={1}>HM: {o.HallmarkNumber}</Text> : null}
            </View>
          </View>
        );
      },
    },
    {
      key: 'OrnamentType',
      title: 'Type',
      width: 95,
      render: (o) => <Text style={styles.cellText} numberOfLines={1}>{o.OrnamentType || 'Jewelry'}</Text>,
    },
    {
      key: 'Purity',
      title: 'Purity',
      width: 75,
      align: 'center',
      render: (o) => <Badge label={o.Purity || '22K'} variant="gold" size="sm" />,
    },
    {
      key: 'GrossWeight',
      title: 'Gross wt',
      width: 85,
      align: 'right',
      render: (o) => <Text style={styles.cellText}>{Number(o.GrossWeight || 0).toFixed(2)}g</Text>,
    },
    {
      key: 'StoneWeight',
      title: 'Stone wt',
      width: 85,
      align: 'right',
      render: (o) => <Text style={styles.cellText}>{Number(o.StoneWeight || 0).toFixed(2)}g</Text>,
    },
    {
      key: 'MetalWeight',
      title: 'Metal wt',
      width: 90,
      align: 'right',
      render: (o) => (
        <Text style={[styles.cellText, { fontWeight: '700', color: colors.primaryDark }]}>
          {Number(o.NetWeight || o.MetalWeight || 0).toFixed(2)}g
        </Text>
      ),
    },
    {
      key: 'Status',
      title: 'Status',
      width: 85,
      align: 'center',
      render: (o) => <Badge label={o.Status} variant={getStatusVariant(o.Status)} size="sm" />,
    },
    {
      key: 'BuyingPricePerGram',
      title: 'Buy Rate/g',
      width: 115,
      align: 'right',
      render: (o) => <Text style={styles.cellText}>₹{(o.BuyingPricePerGram || 0).toLocaleString()}</Text>,
    },
    {
      key: 'TotalPrice',
      title: 'Total Price',
      width: 110,
      align: 'right',
      render: (o) => (
        <Text style={[styles.cellText, { fontWeight: '700' }]}>
          ₹{(o.BuyingCost || o.TotalPrice || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      key: 'MakerName',
      title: 'Maker Name',
      width: 100,
      render: (o) => <Text style={styles.cellText} numberOfLines={1}>{o.MakerName || '—'}</Text>,
    },
    {
      key: 'Actions',
      title: 'Actions',
      width: 95,
      align: 'center',
      render: (o) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openDetailModal(o)} style={styles.actionBtn} accessibilityLabel="View Details">
            <Ionicons name="eye-outline" size={16} color="#0284c7" />
          </TouchableOpacity>
          {isSuperAdmin && (
            <>
              <TouchableOpacity onPress={() => openEditModal(o)} style={styles.actionBtn} accessibilityLabel="Edit">
                <Ionicons name="pencil-outline" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(o)} style={styles.actionBtn} accessibilityLabel="Delete">
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    },
  ];

  const availableCount = store.ornaments.filter(o => o.Status === 'Available').length;
  const pledgedCount = store.ornaments.filter(o => o.Status === 'Pledged').length;
  const releasedCount = store.ornaments.filter(o => o.Status === 'Released').length;
  const ornamentFilterChips = [
    { label: 'All', value: 'All', count: store.ornaments.length },
    { label: 'Available', value: 'Available', count: availableCount },
    { label: 'Pledged', value: 'Pledged', count: pledgedCount },
    { label: 'Released', value: 'Released', count: releasedCount },
  ];

  const customFilterPredicate = (o: Ornament, filterVal: string) => {
    if (filterVal === 'All') return true;
    return o.Status === filterVal;
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
          isLoading={store.isSyncing && store.ornaments.length === 0}
          addButtonLabel="Add Ornament"
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={store.ornaments}
          keyExtractor={(o) => o.OrnamentId}
          filterChips={ornamentFilterChips}
          customFilterPredicate={customFilterPredicate}
          searchPlaceholder="Search ornament, hallmark, maker, status..."
          searchFilter={(o, q) => {
            const normQuery = (q || '').trim().toLowerCase();
            if (!normQuery) return true;
            const name = (o.OrnamentName || '').toLowerCase();
            const id = (o.OrnamentId || '').toLowerCase();
            const type = (o.OrnamentType || '').toLowerCase();
            const category = (o.OrnamentCategory || '').toLowerCase();
            const hallmark = (o.HallmarkNumber || '').toLowerCase();
            const maker = (o.MakerName || '').toLowerCase();
            const status = (o.Status || '').toLowerCase();
            const purity = (o.Purity || '').toLowerCase();
            const gross = (o.GrossWeight || '').toString();
            const net = (o.NetWeight || o.MetalWeight || '').toString();
            const price = (o.BuyingCost || o.TotalPrice || '').toString();
            const desc = (o.Description || '').toLowerCase();

            return (
              name.includes(normQuery) ||
              id.includes(normQuery) ||
              type.includes(normQuery) ||
              category.includes(normQuery) ||
              hallmark.includes(normQuery) ||
              maker.includes(normQuery) ||
              status.includes(normQuery) ||
              purity.includes(normQuery) ||
              gross.includes(normQuery) ||
              net.includes(normQuery) ||
              price.includes(normQuery) ||
              desc.includes(normQuery)
            );
          }}
          renderMobileCard={(o) => {
            const firstImg = o.OrnamentImages ? o.OrnamentImages.split(' | ').filter(Boolean)[0] : '';
            const directUrl = firstImg ? getDriveImageUrl(firstImg) : '';
            const netWeightVal = Number(o.NetWeight || o.MetalWeight || 0).toFixed(2);
            const totalPriceVal = Number(o.BuyingCost || o.TotalPrice || 0).toLocaleString('en-IN');

            return (
              <MobileCard
                onPress={() => openDetailModal(o)}
                identifier={`#${o.OrnamentId}`}
                badges={
                  <>
                    <Badge label={o.Purity || '22K'} variant="gold" size="sm" />
                    <Badge label={o.Status} variant={getStatusVariant(o.Status)} size="sm" />
                  </>
                }
                avatar={
                  firstImg ? (
                    <TouchableOpacity onPress={() => setPreviewImageUrl(firstImg)}>
                      <Image
                        source={{ uri: directUrl || firstImg }}
                        style={styles.cardThumb}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.miniAvatar}>
                      <Ionicons name="sparkles" size={16} color="#d97706" />
                    </View>
                  )
                }
                title={o.OrnamentName}
                subtitle={o.HallmarkNumber ? `HM: ${o.HallmarkNumber}` : (o.OrnamentType || 'Jewelry')}
                metrics={[
                  {
                    label: 'Net / Metal Wt',
                    value: `${netWeightVal}g`,
                    highlighted: true,
                    color: colors.primaryDark,
                  },
                  {
                    label: 'Total Price',
                    value: `₹${totalPriceVal}`,
                    highlighted: true,
                  },
                  {
                    label: 'Gross Wt',
                    value: `${Number(o.GrossWeight || 0).toFixed(2)}g`,
                  },
                  {
                    label: 'Stone Wt',
                    value: `${Number(o.StoneWeight || 0).toFixed(2)}g`,
                  },
                  {
                    label: 'Buy Rate/g',
                    value: `₹${(o.BuyingPricePerGram || 0).toLocaleString('en-IN')}`,
                  },
                  {
                    label: 'Type',
                    value: o.OrnamentType || 'Jewelry',
                  },
                  {
                    label: 'Hallmark No.',
                    value: o.HallmarkNumber || '—',
                  },
                  {
                    label: 'Maker Name',
                    value: o.MakerName || '—',
                  },
                ]}
                viewLabel="View details"
                onViewPress={() => openDetailModal(o)}
                menuActions={isSuperAdmin ? [
                  {
                    label: 'Edit Ornament',
                    icon: 'pencil-outline',
                    onPress: () => openEditModal(o),
                  },
                  {
                    label: 'Delete Ornament',
                    icon: 'trash-outline',
                    isDestructive: true,
                    onPress: () => handleDelete(o),
                  },
                ] : undefined}
              />
            );
          }}
        />
      </ScrollView>

      {/* ADD / EDIT ORNAMENT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Gold Ornament' : 'Add Gold Ornament'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Borrower Select */}
              <View style={styles.field}>
                <Text style={styles.label}>Select Borrower *</Text>
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
                        onPress={() => setForm(p => ({ ...p, UserId: u.UserId }))}
                      >
                        <Text style={[styles.userChipText, form.UserId === u.UserId && styles.userChipTextActive]}>
                          {u.FullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Ornament Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Traditional Temple Haram"
                  value={form.OrnamentName}
                  onChangeText={v => setForm(p => ({ ...p, OrnamentName: v }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Type</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Necklace, Bangle"
                    value={form.OrnamentType}
                    onChangeText={v => setForm(p => ({ ...p, OrnamentType: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Purity</Text>
                  <View style={styles.purityRow}>
                    {['24K', '22K', '18K'].map(k => (
                      <TouchableOpacity
                        key={k}
                        style={[styles.purityBtn, form.Purity === k && styles.purityBtnActive]}
                        onPress={() => handlePuritySelect(k)}
                      >
                        <Text style={[styles.purityBtnText, form.Purity === k && styles.purityBtnTextActive]}>
                          {k}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Weight Inputs */}
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Gross Weight (g) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={form.GrossWeight}
                    onChangeText={v => setForm(p => ({ ...p, GrossWeight: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Stone Weight (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={form.StoneWeight}
                    onChangeText={v => setForm(p => ({ ...p, StoneWeight: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Metal / Net (g)</Text>
                  <TextInput
                    style={[styles.input, { fontWeight: '700', color: colors.primaryDark }]}
                    placeholder={metal.toFixed(2)}
                    keyboardType="decimal-pad"
                    value={form.MetalWeight || (metal > 0 ? metal.toFixed(2) : '')}
                    onChangeText={v => setForm(p => ({ ...p, MetalWeight: v }))}
                  />
                </View>
              </View>

              {/* Rates */}
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Buying Rate /g (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.BuyingPricePerGram}
                    onChangeText={v => setForm(p => ({ ...p, BuyingPricePerGram: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Current Rate /g (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.CurrentPricePerGram}
                    onChangeText={v => setForm(p => ({ ...p, CurrentPricePerGram: v }))}
                  />
                </View>
              </View>

              {/* Live Calculations Display Box */}
              <View style={styles.calcBox}>
                <Text style={styles.calcBoxTitle}>Automatic Valuation Formulas</Text>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Buying Cost ({metal.toFixed(2)}g × ₹{buyingPrice}):</Text>
                  <Text style={styles.calcVal}>₹{buyingCostCalc.toLocaleString()}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Market Value ({metal.toFixed(2)}g × ₹{currentPrice}):</Text>
                  <Text style={[styles.calcVal, { color: colors.success }]}>₹{marketValCalc.toLocaleString()}</Text>
                </View>
                <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: '#fef08a', paddingTop: 6, marginTop: 4 }]}>
                  <Text style={styles.calcLabel}>Appreciation Gains:</Text>
                  <Text style={[styles.calcVal, { color: apprValCalc >= 0 ? colors.success : colors.danger }]}>
                    {apprValCalc >= 0 ? '+' : ''}₹{apprValCalc.toLocaleString()} ({apprPctCalc.toFixed(2)}%)
                  </Text>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Hallmark Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. HM916-2025"
                    autoCapitalize="characters"
                    value={form.HallmarkNumber}
                    onChangeText={v => setForm(p => ({ ...p, HallmarkNumber: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Maker / Jeweler Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Tanishq, Malabar"
                    value={form.MakerName}
                    onChangeText={v => setForm(p => ({ ...p, MakerName: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Neckwear, Bangles"
                    value={form.OrnamentCategory}
                    onChangeText={v => setForm(p => ({ ...p, OrnamentCategory: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="number-pad"
                    value={form.Quantity}
                    onChangeText={v => setForm(p => ({ ...p, Quantity: v }))}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Estimated Value (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Auto: defaults to Market Value"
                  keyboardType="number-pad"
                  value={form.EstimatedValue}
                  onChangeText={v => setForm(p => ({ ...p, EstimatedValue: v }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Ornament description..."
                  multiline
                  numberOfLines={2}
                  value={form.Description}
                  onChangeText={v => setForm(p => ({ ...p, Description: v }))}
                />
              </View>

              {/* Image Picker */}
              <ImagePickerField
                multiple
                type="card"
                label="Ornament Photos / Pledged Images"
                helperText="Upload photos of ornaments or jewelry items"
                value={form.OrnamentImages}
                onChange={(urls, files) => {
                  setForm(p => ({ ...p, OrnamentImages: urls }));
                  setFilesPayload(files);
                }}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Additional remarks..."
                  multiline
                  numberOfLines={2}
                  value={form.Remarks}
                  onChangeText={v => setForm(p => ({ ...p, Remarks: v }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Available', 'Pledged', 'Released'] as const).map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, form.Status === s && styles.statusBtnActive]}
                        onPress={() => setForm(p => ({ ...p, Status: s }))}
                      >
                        <Text style={[styles.statusBtnText, form.Status === s && styles.statusBtnTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Add Ornament'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW ORNAMENT DETAIL MODAL */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ornament Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrn ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailName}>{selectedOrn.OrnamentName}</Text>
                  <Text style={styles.detailCode}>ID: {selectedOrn.OrnamentId} • {selectedOrn.OrnamentType || 'Jewelry'}</Text>
                  {selectedOrn.OrnamentCategory ? <Text style={styles.detailSubCode}>{selectedOrn.OrnamentCategory}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <Badge label={selectedOrn.Purity || '22K'} variant="gold" />
                    <Badge label={selectedOrn.Status} variant={getStatusVariant(selectedOrn.Status)} />
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Ornament Info</Text>
                  {selectedOrn.MakerName ? <Text style={styles.detailRowText}><Text style={styles.bold}>Maker:</Text> {selectedOrn.MakerName}</Text> : null}
                  {selectedOrn.HallmarkNumber ? <Text style={styles.detailRowText}><Text style={styles.bold}>Hallmark No.:</Text> {selectedOrn.HallmarkNumber}</Text> : null}
                  {selectedOrn.Quantity ? <Text style={styles.detailRowText}><Text style={styles.bold}>Quantity:</Text> {selectedOrn.Quantity}</Text> : null}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Weight Breakdown</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Gross Weight:</Text> {Number(selectedOrn.GrossWeight || 0).toFixed(2)} g</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Stone Weight:</Text> {Number(selectedOrn.StoneWeight || 0).toFixed(2)} g</Text>
                  <Text style={[styles.detailRowText, { color: colors.primaryDark, fontWeight: '700' }]}>
                    Net Metal Weight: {Number(selectedOrn.NetWeight || selectedOrn.MetalWeight || 0).toFixed(2)} g
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Valuation & Financials</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Buying Cost:</Text> ₹{(selectedOrn.BuyingCost || selectedOrn.TotalPrice || 0).toLocaleString()} (@ ₹{selectedOrn.BuyingPricePerGram}/g)</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Current Market Value:</Text> ₹{(selectedOrn.MarketValue || 0).toLocaleString()} (@ ₹{selectedOrn.CurrentPricePerGram}/g)</Text>
                  {selectedOrn.EstimatedValue ? <Text style={styles.detailRowText}><Text style={styles.bold}>Estimated Value:</Text> ₹{Number(selectedOrn.EstimatedValue).toLocaleString()}</Text> : null}
                  <Text style={[styles.detailRowText, { color: colors.success, fontWeight: '700' }]}>
                    Appreciation Gains: +₹{(selectedOrn.AppreciationValue || 0).toLocaleString()} ({selectedOrn.AppreciationPercentage?.toFixed(2)}%)
                  </Text>
                </View>

                {selectedOrn.OrnamentImages ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSecTitle}>Google Drive Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                      {selectedOrn.OrnamentImages.split(' | ').filter(Boolean).map((imgUrl, i) => {
                        const directUrl = getDriveImageUrl(imgUrl);
                        return (
                          <TouchableOpacity 
                            key={i} 
                            onPress={() => setPreviewImageUrl(imgUrl)}
                            style={{ borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
                          >
                            <Image
                              source={{ uri: directUrl || imgUrl }}
                              style={{ width: 140, height: 100, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
                              contentFit="cover"
                            />
                            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, paddingHorizontal: 4 }}>
                              <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>Tap to enlarge</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}

                {(selectedOrn.Description || selectedOrn.Remarks) ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSecTitle}>Notes</Text>
                    {selectedOrn.Description ? <Text style={styles.detailRowText}><Text style={styles.bold}>Description:</Text> {selectedOrn.Description}</Text> : null}
                    {selectedOrn.Remarks ? <Text style={styles.detailRowText}><Text style={styles.bold}>Remarks:</Text> {selectedOrn.Remarks}</Text> : null}
                  </View>
                ) : null}
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

      {/* FULL-SCREEN IMAGE PREVIEW */}
      <ImageViewModal
        visible={!!previewImageUrl}
        imageUrl={previewImageUrl}
        title="Ornament Photo Preview"
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Gold Ornament"
        message={`Are you sure you want to delete ornament "${ornToDelete?.OrnamentName}"? This will archive it and remove it from active vault stock.`}
        confirmLabel="Delete Ornament"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setOrnToDelete(null);
        }}
      />
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
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  primaryCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subCellText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
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
    maxHeight: '85%',
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
  purityRow: {
    flexDirection: 'row',
    gap: 4,
  },
  purityBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  purityBtnActive: {
    backgroundColor: '#fef08a',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  purityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  purityBtnTextActive: {
    color: isDark ? '#fbbf24' : '#854d0e',
  },
  calcBox: {
    backgroundColor: isDark ? '#261a02' : '#fefce8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginBottom: 12,
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
  detailSubCode: {
    fontSize: 11,
    color: isDark ? '#fbbf24' : '#92400e',
    marginTop: 1,
    fontStyle: 'italic',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
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
  cardThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
