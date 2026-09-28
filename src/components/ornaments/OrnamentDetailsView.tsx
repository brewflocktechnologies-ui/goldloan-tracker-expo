import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ConfirmModal } from '../ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { Ornament } from '../../types';
import { getOrnamentDetailFigures } from '../../utils/userOrnamentCalculations';
import { OrnamentOptionsMenu, OrnamentOptionsMenuHandle } from './OrnamentOptionsMenu';
import { OrnamentStatusBadge } from './OrnamentStatusBadge';
import { pickOrnamentImages } from './pickOrnamentImages';
import { useOrnamentsStyles } from './ornamentsStyles';

interface OrnamentDetailsViewProps {
  selectedOrn: Ornament;
  setSelectedOrn: Dispatch<SetStateAction<Ornament | null>>;
  activePhotoIdx: number;
  setActivePhotoIdx: Dispatch<SetStateAction<number>>;
  optionsMenuRef: RefObject<OrnamentOptionsMenuHandle | null>;
  deleteModalVisible: boolean;
  setDeleteModalVisible: Dispatch<SetStateAction<boolean>>;
  liveRate22k: number;
  onBack: () => void;
  onEdit: (orn: Ornament) => void;
}

export function OrnamentDetailsView({
  selectedOrn,
  setSelectedOrn,
  activePhotoIdx,
  setActivePhotoIdx,
  optionsMenuRef,
  deleteModalVisible,
  setDeleteModalVisible,
  liveRate22k,
  onBack,
  onEdit,
}: OrnamentDetailsViewProps) {
  const { styles, colors, isDark } = useOrnamentsStyles();
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const detailImages = selectedOrn.OrnamentImages
    ? selectedOrn.OrnamentImages.split(' | ').filter(Boolean).map(img => ({ uri: getDriveImageUrl(img) || img }))
    : [];
  const currentPhoto = detailImages[activePhotoIdx] || detailImages[0];

  const { netWt, grossWt, stoneWt, metalWt, buyPrice, buyTotal, estVal, mktVal, liveVal, apprVal, apprPct } =
    getOrnamentDetailFigures(selectedOrn, liveRate22k);

  const handleCopyId = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(selectedOrn.OrnamentId);
    }
    toast.info(`Copied ID: ${selectedOrn.OrnamentId}`);
  };

  const handleAddPhotosToDetail = async () => {
    const uris = await pickOrnamentImages();
    if (uris.length === 0) return;
    const newUris = uris.join(' | ');
    const updated = selectedOrn.OrnamentImages ? `${selectedOrn.OrnamentImages} | ${newUris}` : newUris;
    store.updateOrnament(selectedOrn.OrnamentId, { OrnamentImages: updated });
    setSelectedOrn(prev => prev ? { ...prev, OrnamentImages: updated } : null);
    toast.success('Photos added successfully');
  };

  return (
    <View style={styles.subScreenContainer}>
      {/* Header */}
      <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBackBtn}
          accessibilityLabel="Go back to list"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Ornaments Details</Text>
          <Text style={styles.headerSubtitle}>View and manage customer information</Text>
        </View>
        <OrnamentOptionsMenu
          ref={optionsMenuRef}
          isDark={isDark}
          textPrimaryColor={colors.textPrimary}
          isSuperAdmin={isSuperAdmin}
          onEdit={() => onEdit(selectedOrn)}
          onDelete={() => setDeleteModalVisible(true)}
          onCopyId={handleCopyId}
        />
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

          <OrnamentStatusBadge status={selectedOrn.Status} isDark={isDark} variant="pill" />
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
              <Text style={[styles.weightLabel, styles.netWeightLabel]}>Net weight</Text>
              <Text style={[styles.weightValue, styles.netWeightValue]}>{parseFloat(netWt) > 0 ? `${netWt} g` : '-'}</Text>
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
          onBack();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}
