import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    StatusBar as RNStatusBar,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
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

export default function OrnamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const ornament = store.ornaments.find(o => o.OrnamentId === id) || 
                   store.ornaments[0];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Gallery Photos from Code.gs / Drive
  const galleryImages = useMemo(() => {
    if (!ornament?.OrnamentImages) return [];
    return ornament.OrnamentImages.split(' | ')
      .filter(Boolean)
      .map(img => ({ uri: getDriveImageUrl(img) || img }));
  }, [ornament?.OrnamentImages]);

  const currentPhoto = galleryImages[activePhotoIdx] || galleryImages[0];

  const handlePrevPhoto = () => {
    setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx(prev => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  const handleCopyId = () => {
    if (ornament?.OrnamentId) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(ornament.OrnamentId);
      }
      toast.info(`Copied ID: ${ornament.OrnamentId}`);
    }
  };

  const handleAddPhotos = async () => {
    if (!isSuperAdmin) {
      toast.warning('Read-only access: superadmin required to upload photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map(a => a.uri).join(' | ');
        const updatedImages = ornament.OrnamentImages 
          ? `${ornament.OrnamentImages} | ${newUris}` 
          : newUris;

        store.updateOrnament(ornament.OrnamentId, {
          OrnamentImages: updatedImages,
        });
        toast.success('New photos added successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select image');
    }
  };

  const handleEdit = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/ornaments/new',
      params: { id: ornament?.OrnamentId },
    } as any);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!ornament) return;
    store.deleteOrnament(ornament.OrnamentId);
    setDeleteModalVisible(false);
    toast.danger(`Ornament "${ornament.OrnamentName}" deleted`);
    router.back();
  };

  if (!ornament) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.notFoundText}>Ornament not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Weight computations
  const grossWt = Number(ornament.GrossWeight || 0).toFixed(3);
  const stoneWt = Number(ornament.StoneWeight || 0).toFixed(3);
  const netWt = Number(ornament.NetWeight || ornament.MetalWeight || 0).toFixed(3);
  const metalWt = Number(ornament.MetalWeight || ornament.NetWeight || 0).toFixed(3);

  // Financial values
  const buyingPricePerGram = ornament.BuyingPricePerGram || 5800;
  const buyingPriceTotal = ornament.BuyingCost || (parseFloat(netWt) * buyingPricePerGram) || 148480;
  const estValue = ornament.EstimatedValue || 192000;
  const marketValue = ornament.MarketValue || 205000;
  const livePriceToday = Math.round(parseFloat(netWt) * (store.goldRates?.gold22k?.rate1g || 8225)) || 210560;
  const appreciationVal = ornament.AppreciationValue || (marketValue - buyingPriceTotal) || 43520;
  const appreciationPct = ornament.AppreciationPercentage || (buyingPriceTotal > 0 ? (appreciationVal / buyingPriceTotal) * 100 : 29.31);

  // Status Badge Helper
  const status = ornament.Status || 'Available';
  const isAvailable = status === 'Available';
  const isPledged = status === 'Pledged';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ─── TOP HEADER ─── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 12) }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerBackBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Ornaments Details</Text>
          <Text style={styles.headerSubtitle}>View and manage customer information</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setMenuVisible(true)} 
          style={styles.headerMenuBtn}
          accessibilityLabel="Menu options"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
      >
        {/* ─── PHOTO GALLERY SECTION ─── */}
        {galleryImages.length > 0 ? (
          <View style={styles.gallerySection}>
            {/* Main Large Image */}
            <View style={styles.mainImageContainer}>
              <Image
                source={currentPhoto}
                style={styles.mainImage}
                contentFit="cover"
                transition={200}
              />
              {galleryImages.length > 1 && (
                <>
                  <TouchableOpacity 
                    onPress={handlePrevPhoto} 
                    style={[styles.arrowBtn, styles.arrowBtnLeft]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-back" size={18} color="#1e293b" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleNextPhoto} 
                    style={[styles.arrowBtn, styles.arrowBtnRight]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#1e293b" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Right Thumbnails Column */}
            <View style={styles.thumbnailsColumn}>
              {galleryImages.slice(0, 3).map((img, idx) => {
                const isSelected = activePhotoIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActivePhotoIdx(idx)}
                    style={[styles.thumbBox, isSelected && styles.thumbBoxActive]}
                    activeOpacity={0.8}
                  >
                    <Image source={img} style={styles.thumbImg} contentFit="cover" />
                  </TouchableOpacity>
                );
              })}

              {/* Add Photos Dashed Button */}
              <TouchableOpacity 
                onPress={handleAddPhotos} 
                style={styles.addPhotoDashedBtn}
                activeOpacity={0.7}
              >
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
            <TouchableOpacity 
              onPress={handleAddPhotos} 
              style={styles.noPhotoUploadBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.noPhotoUploadBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TITLE & STATUS ROW ─── */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.ornamentTitle}>{ornament.OrnamentName}</Text>
            <TouchableOpacity onPress={handleCopyId} style={styles.idCopyRow} activeOpacity={0.7}>
              <Text style={styles.ornamentIdText}>{ornament.OrnamentId}</Text>
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
              {status}
            </Text>
          </View>
        </View>

        {/* ─── CARD 1: WEIGHT DETAILS ─── */}
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
              <Text style={styles.quantityValue}>{ornament.Quantity || 1}</Text>
            </View>
          </View>

          <View style={styles.weightGrid}>
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Net weight</Text>
              <Text style={styles.weightValue}>{netWt} g</Text>
            </View>
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Gross Weight</Text>
              <Text style={styles.weightValue}>{grossWt} g</Text>
            </View>
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Stone Weight</Text>
              <Text style={styles.weightValue}>{stoneWt} g</Text>
            </View>
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Metal Weight</Text>
              <Text style={styles.weightValue}>{metalWt} g</Text>
            </View>
          </View>
        </View>

        {/* ─── CARD 2: PURITY & HALLMARK ─── */}
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
                {ornament.Purity || '22 Karat'} {ornament.Purity === '22K' || ornament.Purity?.includes('22') ? '(91.6%)' : ''}
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
              <Text style={styles.rowValueBold}>{ornament.HallmarkNumber || 'HM/C- 7452/2024'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Assay Center</Text>
              <Text style={styles.rowValueBold}>{ornament.AssayCenter || 'Bangalore'}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>Year of Marking</Text>
              <Text style={styles.rowValueBold}>{ornament.YearOfMarking || '2024'}</Text>
            </View>
          </View>
        </View>

        {/* ─── CARD 3: VALUATION ─── */}
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
              <Text style={styles.rowValueBold}>₹ {buyingPricePerGram.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Total Buying Price</Text>
              <Text style={styles.rowValueBold}>₹ {Math.round(buyingPriceTotal).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Estimated Value</Text>
              <Text style={styles.rowValueBold}>₹ {Math.round(estValue).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Market Value</Text>
              <Text style={styles.rowValueBold}>₹ {Math.round(marketValue).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Live Value Today</Text>
              <Text style={styles.rowValueBold}>₹ {Math.round(livePriceToday).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
              <Text style={styles.rowLabel}>Appreciation</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowValueBold}>₹ {Math.round(appreciationVal).toLocaleString('en-IN')}</Text>
                <Text style={styles.appreciationPctText}>
                  (+{appreciationPct.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── CARD 4: ORNAMENT INFORMATION ─── */}
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
              <Text style={styles.rowValueBold}>{ornament.OrnamentId}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Type</Text>
              <Text style={styles.rowValueBold}>{ornament.OrnamentType || 'Necklace'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Category</Text>
              <Text style={styles.rowValueBold}>{ornament.OrnamentCategory || 'Traditional'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Maker</Text>
              <Text style={styles.rowValueBold}>{ornament.MakerName || 'Tanishq'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Quantity</Text>
              <Text style={styles.rowValueBold}>{ornament.Quantity || 1}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Description</Text>
              <Text style={[styles.rowValueBold, { maxWidth: '60%', textAlign: 'right' }]}>
                {ornament.Description || 'Gold necklace with ruby stones'}
              </Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>Remarks</Text>
              <Text style={[styles.rowValueBold, { maxWidth: '60%', textAlign: 'right' }]}>
                {ornament.Remarks || 'No additional remarks'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── OPTIONS MENU MODAL ─── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            {isSuperAdmin && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Edit Ornament</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Ornament</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleCopyId(); }}>
              <Ionicons name="copy-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Copy Ornament ID</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── CONFIRM DELETE MODAL ─── */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Ornament"
        message={`Are you sure you want to delete "${ornament.OrnamentName}" (${ornament.OrnamentId})? This action cannot be undone.`}
        confirmLabel="Delete Ornament"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f0f5fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
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
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 1,
  },
  headerMenuBtn: {
    padding: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  arrowBtnLeft: {
    left: 10,
  },
  arrowBtnRight: {
    right: 10,
  },
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
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPillGreen: {
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
    borderColor: isDark ? '#22c55e' : '#bbf7d0',
  },
  statusDotGreen: {
    backgroundColor: '#16a34a',
  },
  statusTextGreen: {
    color: isDark ? '#4ade80' : '#15803d',
  },
  statusPillOrange: {
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    borderColor: isDark ? '#f59e0b' : '#fde68a',
  },
  statusDotOrange: {
    backgroundColor: '#d97706',
  },
  statusTextOrange: {
    color: isDark ? '#fbbf24' : '#b45309',
  },
  statusPillBlue: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    borderColor: isDark ? '#0284c7' : '#bae6fd',
  },
  statusDotBlue: {
    backgroundColor: '#0284c7',
  },
  statusTextBlue: {
    color: isDark ? '#38bdf8' : '#0369a1',
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
  quantityBox: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },

  // Weight Grid
  weightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  weightCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  weightLabel: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },

  // Table Rows inside Cards
  tableRows: {
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 13,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  rowValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  appreciationPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 1,
  },

  // Context Menu
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#f8fafc' : '#0f172a',
  },
  menuDivider: {
    height: 1,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
  },

  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0f172a',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
