import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dispatch, SetStateAction } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DatePickerModal } from '../DatePickerModal';
import { OptionPickerModal } from '../ornaments/OptionPickerModal';
import { INDIAN_STATES, OCCUPATION_OPTIONS } from '../../mock/userMockExtras';
import { getDriveImageUrl } from '../../services/api';
import { useUsersStyles } from './usersStyles';

export type UserFormState = {
  FullName: string;
  FatherHusbandName: string;
  CustomerCode: string;
  MobileNumber: string;
  AlternateMobileNumber: string;
  Email: string;
  DateOfBirth: string;
  Gender: 'Male' | 'Female' | 'Other';
  Occupation: string;
  AadhaarNumber: string;
  PANNumber: string;
  AddressLine1: string;
  AddressLine2: string;
  City: string;
  State: string;
  Pincode: string;
  CustomerPhoto: string;
  Status: 'Active' | 'Inactive';
};

export type UserPickerModalState = {
  visible: boolean;
  title: string;
  field: 'State' | 'Occupation';
  options: string[];
};

interface UserFormViewProps {
  mode: 'add' | 'edit';
  form: UserFormState;
  setForm: Dispatch<SetStateAction<UserFormState>>;
  submitting: boolean;
  pickerModal: UserPickerModalState;
  setPickerModal: Dispatch<SetStateAction<UserPickerModalState>>;
  dobModalVisible: boolean;
  setDobModalVisible: Dispatch<SetStateAction<boolean>>;
  onBack: () => void;
  onSave: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
}

export function UserFormView({
  mode,
  form,
  setForm,
  submitting,
  pickerModal,
  setPickerModal,
  dobModalVisible,
  setDobModalVisible,
  onBack,
  onSave,
  onPickCamera,
  onPickGallery,
}: UserFormViewProps) {
  const { styles, colors, isDark } = useUsersStyles();
  const isEdit = mode === 'edit';
  const directPhoto = form.CustomerPhoto ? getDriveImageUrl(form.CustomerPhoto) : '';

  return (
    <View style={styles.subScreenContainer}>
      {/* Header matching PDF */}
      <View style={[styles.detailHeader, { paddingTop: Platform.OS === 'android' ? 14 : 10 }]}>
        <TouchableOpacity
          onPress={onBack}
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
        {/* Photo Upload Section matching reference image */}
        <View style={styles.photoUploadCard}>
          <View style={styles.photoAvatarPreviewBox}>
            {directPhoto || form.CustomerPhoto ? (
              <Image
                source={{ uri: directPhoto || form.CustomerPhoto }}
                style={styles.photoAvatarImage}
                contentFit="cover"
              />
            ) : (
              <MaterialCommunityIcons name="image-plus" size={28} color={isDark ? '#94a3b8' : '#64748b'} />
            )}
          </View>

          <View style={styles.photoUploadInfoCol}>
            <Text style={styles.photoUploadTitle}>Add Customer Photo</Text>
            <Text style={styles.photoUploadSubtitle}>Take a photo or choose from gallery</Text>

            <View style={styles.photoButtonsRow}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={onPickCamera} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.photoActionBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoActionBtn} onPress={onPickGallery} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.photoActionBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
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
              <View style={styles.inputWithIconContainer}>
                <Ionicons name="person-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} style={styles.inputLeadingIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.placeholder}
                  value={form.FullName}
                  onChangeText={v => setForm(p => ({ ...p, FullName: v }))}
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>
                Father / Husband Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWithIconContainer}>
                <Ionicons name="person-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} style={styles.inputLeadingIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Enter name"
                  placeholderTextColor={colors.placeholder}
                  value={form.FatherHusbandName}
                  onChangeText={v => setForm(p => ({ ...p, FatherHusbandName: v }))}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Mobile Number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.prefixSuffixBox}>
              <View style={styles.mobilePrefixGroup}>
                <Ionicons name="call-outline" size={15} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 5 }} />
                <Text style={styles.prefixText}>+91</Text>
                <Ionicons name="chevron-down" size={12} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginLeft: 3 }} />
              </View>
              <View style={styles.prefixDivider} />
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
            <View style={styles.inputWithIconContainer}>
              <Ionicons name="call-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} style={styles.inputLeadingIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter Alternate mobile number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={form.AlternateMobileNumber}
                onChangeText={v => setForm(p => ({ ...p, AlternateMobileNumber: v.replace(/[^\d]/g, '') }))}
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWithIconContainer}>
                <Ionicons name="mail-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} style={styles.inputLeadingIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.Email}
                  onChangeText={v => setForm(p => ({ ...p, Email: v }))}
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.inputWithIconContainer}
                onPress={() => setDobModalVisible(true)}
                activeOpacity={0.7}
                accessibilityLabel="Choose Date of Birth"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} style={styles.inputLeadingIcon} />
                <Text
                  style={[styles.inputWithIconText, !form.DateOfBirth && styles.inputPlaceholderText]}
                  numberOfLines={1}
                >
                  {form.DateOfBirth || 'DD / MM / YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderSelectRow}>
              {(['Male', 'Female', 'Other'] as const).map(g => {
                const isSelected = form.Gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderSelectBtn, isSelected && styles.genderSelectBtnActive]}
                    onPress={() => setForm(p => ({ ...p, Gender: g }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={isSelected ? '#0284c7' : (isDark ? '#64748b' : '#cbd5e1')}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.genderSelectText, isSelected && styles.genderSelectTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
          onPress={onSave}
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

      <DatePickerModal
        visible={dobModalVisible}
        title="Select Date of Birth"
        value={form.DateOfBirth}
        isDark={isDark}
        onConfirm={dateStr => setForm(p => ({ ...p, DateOfBirth: dateStr }))}
        onClose={() => setDobModalVisible(false)}
      />
    </View>
  );
}
