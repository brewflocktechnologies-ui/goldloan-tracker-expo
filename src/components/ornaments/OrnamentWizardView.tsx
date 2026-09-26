import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dispatch, SetStateAction } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getDriveImageUrl } from '../../services/api';
import { User } from '../../types';
import { sanitizeDecimalInput, sanitizeIntegerInput } from '../../utils/numericInput';
import { CustomerPickerModal } from './CustomerPickerModal';
import { OptionPickerModal } from './OptionPickerModal';
import { useOrnamentsStyles } from './ornamentsStyles';

export type OrnamentFormState = {
  UserId: string;
  OrnamentName: string;
  OrnamentType: string;
  OrnamentCategory: string;
  Purity: string;
  Quantity: string;
  MakerName: string;
  HallmarkNumber: string;
  GrossWeight: string;
  StoneWeight: string;
  BuyingPricePerGram: string;
  Description: string;
  Remarks: string;
  Status: 'Available' | 'Pledged';
};

export type OrnamentPickerField = 'OrnamentType' | 'OrnamentCategory' | 'Purity' | 'Status';

export type OrnamentPickerModalState = {
  visible: boolean;
  title: string;
  field: OrnamentPickerField;
  options: string[];
};

export type OrnamentValuation = {
  net: number;
  totalBuyingValue: number;
  currentGoldValueLive: number;
  marketValue: number;
  appreciation: number;
  appreciationPct: number;
  liveRate22k: number;
};

interface OrnamentWizardViewProps {
  mode: 'add' | 'edit';
  wizardStep: 1 | 2 | 3;
  form: OrnamentFormState;
  setForm: Dispatch<SetStateAction<OrnamentFormState>>;
  formImages: string[];
  submitting: boolean;
  users: User[];
  selectedUser: User | undefined;
  valuation: OrnamentValuation;
  refreshingRates: boolean;
  pickerModal: OrnamentPickerModalState;
  setPickerModal: Dispatch<SetStateAction<OrnamentPickerModalState>>;
  customerModalVisible: boolean;
  setCustomerModalVisible: Dispatch<SetStateAction<boolean>>;
  customerSearchQuery: string;
  setCustomerSearchQuery: Dispatch<SetStateAction<string>>;
  openDropdown: (field: OrnamentPickerField, title: string, options: string[]) => void;
  selectOption: (opt: string) => void;
  onBackStep: () => void;
  onNextStep: () => void;
  onSave: () => void;
  onPickImages: () => void;
  onRemoveImage: (index: number) => void;
  onRefreshRates: () => void;
}

export function OrnamentWizardView({
  mode,
  wizardStep,
  form,
  setForm,
  formImages,
  submitting,
  users,
  selectedUser,
  valuation,
  refreshingRates,
  pickerModal,
  setPickerModal,
  customerModalVisible,
  setCustomerModalVisible,
  customerSearchQuery,
  setCustomerSearchQuery,
  openDropdown,
  selectOption,
  onBackStep,
  onNextStep,
  onSave,
  onPickImages,
  onRemoveImage,
  onRefreshRates,
}: OrnamentWizardViewProps) {
  const { styles, colors, isDark } = useOrnamentsStyles();
  const { net, totalBuyingValue, currentGoldValueLive, marketValue, appreciation, appreciationPct, liveRate22k } = valuation;

  return (
    <View style={styles.subScreenContainer}>
      {/* Header */}
      <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
        <TouchableOpacity onPress={onBackStep} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{mode === 'edit' ? 'Edit Ornament' : 'Add ornaments'}</Text>
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
                    onChangeText={v => setForm(p => ({ ...p, Quantity: sanitizeIntegerInput(v) }))}
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

            <TouchableOpacity style={styles.primaryBtn} onPress={onNextStep}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Weight & Valuation */}
        {wizardStep === 2 && (
          <View>
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

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Gross Weight <Text style={styles.requiredStar}>*</Text></Text>
                  <View style={styles.unitInputBox}>
                    <TextInput
                      style={styles.unitInput}
                      keyboardType="decimal-pad"
                      placeholder="0.000"
                      value={form.GrossWeight}
                      onChangeText={v => setForm(p => ({ ...p, GrossWeight: sanitizeDecimalInput(v) }))}
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
                      onChangeText={v => setForm(p => ({ ...p, StoneWeight: sanitizeDecimalInput(v) }))}
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
                    <View style={[styles.unitBadge, styles.readonlyUnitBadge]}><Text style={styles.unitBadgeText}>g</Text></View>
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
                    <View style={[styles.unitBadge, styles.readonlyUnitBadge]}><Text style={styles.unitBadgeText}>g</Text></View>
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

            <View style={styles.card}>
              <View style={[styles.cardHeader, { alignItems: 'flex-start', gap: 10 }]}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="bar-chart-outline" size={18} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 4 }}>
                    <Text style={styles.cardTitle}>Valuation Details</Text>
                    <Text style={styles.cardSubtitle}>
                      Enter buying price and view{'\n'}auto calculated values
                    </Text>
                  </View>
                </View>
                <View style={styles.liveRateBadge}>
                  <Text style={styles.liveRateTitle}>Live Gold Rate</Text>
                  <View style={styles.liveRateSubRow}>
                    <View style={styles.liveRateDotWithPurity}>
                      <View style={styles.liveRateGreenDot} />
                      <Text style={styles.liveRatePurityText}>(22K)</Text>
                    </View>
                    <TouchableOpacity
                      onPress={onRefreshRates}
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

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Buying Price / gram <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.prefixSuffixBox}>
                  <Text style={styles.prefixText}>₹</Text>
                  <TextInput
                    style={styles.prefixInput}
                    keyboardType="numeric"
                    value={form.BuyingPricePerGram}
                    onChangeText={v => setForm(p => ({ ...p, BuyingPricePerGram: sanitizeDecimalInput(v) }))}
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
              <TouchableOpacity style={styles.backButtonSecondary} onPress={onBackStep}>
                <Text style={styles.backButtonSecondaryText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onNextStep}>
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

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                {formImages.map((imgUri, idx) => (
                  <View key={idx} style={styles.photoThumbWrapper}>
                    <Image source={{ uri: getDriveImageUrl(imgUri) || imgUri }} style={styles.photoThumbImg} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => onRemoveImage(idx)}
                    >
                      <Ionicons name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addPhotoBox} onPress={onPickImages}>
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
                  onPress={() => openDropdown('Status', 'Select Status', ['Available', 'Pledged'])}
                >
                  <Text style={styles.dropdownValue}>{form.Status}</Text>
                  <Ionicons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.backButtonSecondary} onPress={onBackStep}>
                <Text style={styles.backButtonSecondaryText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={onSave}
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

      <OptionPickerModal
        visible={pickerModal.visible}
        title={pickerModal.title}
        options={pickerModal.options}
        selectedValue={form[pickerModal.field]}
        onSelect={selectOption}
        onClose={() => setPickerModal(p => ({ ...p, visible: false }))}
        isDark={isDark}
        secondaryTextColor={colors.textSecondary}
      />

      <CustomerPickerModal
        visible={customerModalVisible}
        users={users}
        searchQuery={customerSearchQuery}
        onSearchChange={setCustomerSearchQuery}
        selectedUserId={form.UserId}
        onSelect={(userId) => {
          setForm(p => ({ ...p, UserId: userId }));
          setCustomerModalVisible(false);
          setCustomerSearchQuery('');
        }}
        onClose={() => { setCustomerModalVisible(false); setCustomerSearchQuery(''); }}
        isDark={isDark}
        secondaryTextColor={colors.textSecondary}
        placeholderColor={colors.placeholder}
      />
    </View>
  );
}
