import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
    Alert,
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
import { Badge } from '../../components/Badge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Column, DataTable } from '../../components/DataTable';
import { FilePayload, ImagePickerField } from '../../components/ImagePickerField';
import { ImageViewModal } from '../../components/ImageViewModal';
import { MobileCard } from '../../components/MobileCard';
import { ThemeColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getDriveImageUrl } from '../../services/api';
import { useAppStore } from '../../services/store';
import { User } from '../../types';

export default function UsersScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
    FullName: '',
    FatherHusbandName: '',
    CustomerCode: '',
    MobileNumber: '',
    AlternateMobileNumber: '',
    Email: '',
    DateOfBirth: '',
    Gender: 'Male',
    Occupation: '',
    AadhaarNumber: '',
    PANNumber: '',
    AddressLine1: '',
    AddressLine2: '',
    City: 'Bengaluru',
    State: 'Karnataka',
    Pincode: '560001',
    CustomerPhoto: '',
    Status: 'Active' as 'Active' | 'Inactive',
  });

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFilesPayload([]);
    setForm({
      FullName: '',
      FatherHusbandName: '',
      CustomerCode: `CUST-${100 + store.users.length + 1}`,
      MobileNumber: '',
      AlternateMobileNumber: '',
      Email: '',
      DateOfBirth: '',
      Gender: 'Male',
      Occupation: '',
      AadhaarNumber: '',
      PANNumber: '',
      AddressLine1: '',
      AddressLine2: '',
      City: 'Bengaluru',
      State: 'Karnataka',
      Pincode: '560001',
      CustomerPhoto: '',
      Status: 'Active',
    });
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFilesPayload([]);
    setForm({
      FullName: user.FullName || '',
      FatherHusbandName: user.FatherHusbandName || '',
      CustomerCode: user.CustomerCode || '',
      MobileNumber: user.MobileNumber || '',
      AlternateMobileNumber: user.AlternateMobileNumber || '',
      Email: user.Email || '',
      DateOfBirth: user.DateOfBirth || '',
      Gender: user.Gender || 'Male',
      Occupation: user.Occupation || '',
      AadhaarNumber: user.AadhaarNumber || '',
      PANNumber: user.PANNumber || '',
      AddressLine1: user.AddressLine1 || '',
      AddressLine2: user.AddressLine2 || '',
      City: user.City || 'Bengaluru',
      State: user.State || 'Karnataka',
      Pincode: user.Pincode || '560001',
      CustomerPhoto: user.CustomerPhoto || '',
      Status: user.Status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setModalVisible(true);
  };

  const openDetailModal = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const name = userToDelete.FullName;
    store.deleteUser(userToDelete.UserId);
    setDeleteModalVisible(false);
    setUserToDelete(null);
    toast.danger(`Customer "${name}" deleted successfully`);
  };

  const handleSave = () => {
    if (!form.FullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!form.MobileNumber.trim() || form.MobileNumber.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isEditing && selectedUser) {
      store.updateUser(selectedUser.UserId, { ...form, files: filesPayload });
      toast.success(`Customer "${form.FullName}" updated successfully`);
    } else {
      store.addUser({ ...form, files: filesPayload });
      toast.success(`Customer "${form.FullName}" registered successfully`);
    }
    setModalVisible(false);
  };

  // Table Columns: ID | Name | Mobile | Status | Actions
  const columns: Column<User>[] = [
    {
      key: 'UserId',
      title: 'ID',
      width: 65,
      render: (u) => <Text style={styles.idText}>#{u.UserId}</Text>,
    },
    {
      key: 'FullName',
      title: 'Name',
      width: 170,
      render: (u) => {
        const directUrl = getDriveImageUrl(u.CustomerPhoto);
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => u.CustomerPhoto && setPreviewImageUrl(u.CustomerPhoto)}>
              {u.CustomerPhoto ? (
                <Image source={{ uri: directUrl || u.CustomerPhoto }} style={styles.tableAvatar} contentFit="cover" />
              ) : (
                <View style={styles.tableAvatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{u.FullName.charAt(0) || 'U'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryCellText} numberOfLines={1}>{u.FullName}</Text>
              {u.CustomerCode ? <Text style={styles.subCellText} numberOfLines={1}>{u.CustomerCode}</Text> : null}
            </View>
          </View>
        );
      },
    },
    {
      key: 'MobileNumber',
      title: 'Mobile',
      width: 115,
      render: (u) => <Text style={styles.cellText} numberOfLines={1}>{u.MobileNumber}</Text>,
    },
    {
      key: 'Status',
      title: 'Status',
      width: 85,
      align: 'center',
      render: (u) => (
        <Badge 
          label={u.Status} 
          variant={u.Status === 'Active' ? 'success' : 'default'} 
          size="sm" 
        />
      ),
    },
    {
      key: 'Actions',
      title: 'Actions',
      width: 95,
      align: 'center',
      render: (u) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openDetailModal(u)} style={styles.actionBtn} accessibilityLabel="View Details">
            <Ionicons name="eye-outline" size={16} color="#0284c7" />
          </TouchableOpacity>
          {isSuperAdmin && (
            <>
              <TouchableOpacity onPress={() => openEditModal(u)} style={styles.actionBtn} accessibilityLabel="Edit">
                <Ionicons name="pencil-outline" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(u)} style={styles.actionBtn} accessibilityLabel="Delete">
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    },
  ];

  const activeCount = store.users.filter(u => u.Status === 'Active').length;
  const inactiveCount = store.users.filter(u => u.Status === 'Inactive').length;
  const userFilterChips = [
    { label: 'All', value: 'All', count: store.users.length },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Inactive', value: 'Inactive', count: inactiveCount },
  ];

  const customFilterPredicate = (u: User, filterVal: string) => {
    if (filterVal === 'All') return true;
    return u.Status === filterVal;
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
          isLoading={store.isSyncing && store.users.length === 0}
          addButtonLabel="Add User"
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={store.users}
          keyExtractor={(u) => u.UserId}
          filterChips={userFilterChips}
          customFilterPredicate={customFilterPredicate}
          searchPlaceholder="Search name, mobile, code, city, status..."
          searchFilter={(u, q) => {
            const normQuery = (q || '').trim().toLowerCase();
            if (!normQuery) return true;
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
            const status = (u.Status || '').toLowerCase();

            return (
              name.includes(normQuery) ||
              id.includes(normQuery) ||
              code.includes(normQuery) ||
              mobile.includes(normQuery) ||
              altMobile.includes(normQuery) ||
              email.includes(normQuery) ||
              aadhaar.includes(normQuery) ||
              pan.includes(normQuery) ||
              city.includes(normQuery) ||
              state.includes(normQuery) ||
              status.includes(normQuery)
            );
          }}
          renderMobileCard={(u) => {
            const directUrl = getDriveImageUrl(u.CustomerPhoto);
            const initials = (u.FullName || 'U').charAt(0).toUpperCase();

            return (
              <MobileCard
                onPress={() => openDetailModal(u)}
                identifier={`#${u.UserId}`}
                badges={
                  <Badge 
                    label={u.Status} 
                    variant={u.Status === 'Active' ? 'success' : 'default'} 
                    size="sm" 
                  />
                }
                avatar={
                  u.CustomerPhoto ? (
                    <TouchableOpacity onPress={() => u.CustomerPhoto && setPreviewImageUrl(u.CustomerPhoto)}>
                      <Image
                        source={{ uri: directUrl || u.CustomerPhoto }}
                        style={styles.cardAvatar}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cardAvatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  )
                }
                title={u.FullName}
                subtitle={u.MobileNumber}
                codeBadge={u.CustomerCode || undefined}
                metrics={[
                  {
                    label: 'Mobile Number',
                    value: u.MobileNumber || '—',
                    highlighted: true,
                    color: colors.primaryDark,
                  },
                  {
                    label: 'Customer Status',
                    value: u.Status || 'Active',
                    color: u.Status === 'Active' ? colors.success : colors.textMuted,
                    highlighted: true,
                  },
                  {
                    label: 'Customer Code',
                    value: u.CustomerCode || '—',
                  },
                  {
                    label: 'City / State',
                    value: u.City ? `${u.City}${u.State ? `, ${u.State}` : ''}` : '—',
                  },
                  {
                    label: 'Alt Mobile',
                    value: u.AlternateMobileNumber || '—',
                  },
                  {
                    label: 'Email',
                    value: u.Email || '—',
                  },
                  {
                    label: 'Aadhaar / PAN',
                    value: u.AadhaarNumber ? `•••• ${u.AadhaarNumber.slice(-4)}` : (u.PANNumber || '—'),
                  },
                ]}
                viewLabel="View details"
                onViewPress={() => openDetailModal(u)}
                menuActions={isSuperAdmin ? [
                  {
                    label: 'Edit Customer',
                    icon: 'pencil-outline',
                    onPress: () => openEditModal(u),
                  },
                  {
                    label: 'Delete Customer',
                    icon: 'trash-outline',
                    isDestructive: true,
                    onPress: () => handleDelete(u),
                  },
                ] : undefined}
              />
            );
          }}
        />
      </ScrollView>

      {/* ADD / EDIT USER MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Photo Upload */}
              <ImagePickerField
                type="avatar"
                label="Customer Photo"
                helperText="Upload passport-size profile photo"
                value={form.CustomerPhoto}
                onChange={(url, files) => {
                  setForm(p => ({ ...p, CustomerPhoto: url }));
                  setFilesPayload(files);
                }}
              />

              {/* --- Personal Info --- */}
              <Text style={styles.sectionDivider}>Personal Information</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  value={form.FullName}
                  onChangeText={v => setForm(p => ({ ...p, FullName: v }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Father / Husband Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Suresh Kumar"
                  value={form.FatherHusbandName}
                  onChangeText={v => setForm(p => ({ ...p, FatherHusbandName: v }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Customer Code</Text>
                  <TextInput
                    style={styles.input}
                    value={form.CustomerCode}
                    onChangeText={v => setForm(p => ({ ...p, CustomerCode: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={form.DateOfBirth}
                    onChangeText={v => setForm(p => ({ ...p, DateOfBirth: v }))}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.statusToggleRow}>
                  {(['Male', 'Female', 'Other'] as const).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.statusBtn, form.Gender === g && styles.statusBtnActive]}
                      onPress={() => setForm(p => ({ ...p, Gender: g }))}
                    >
                      <Text style={[styles.statusBtnText, form.Gender === g && styles.statusBtnTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={form.MobileNumber}
                    onChangeText={v => setForm(p => ({ ...p, MobileNumber: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Alternate Mobile</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={form.AlternateMobileNumber}
                    onChangeText={v => setForm(p => ({ ...p, AlternateMobileNumber: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.Email}
                    onChangeText={v => setForm(p => ({ ...p, Email: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Occupation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Business"
                    value={form.Occupation}
                    onChangeText={v => setForm(p => ({ ...p, Occupation: v }))}
                  />
                </View>
              </View>

              {/* --- KYC --- */}
              <Text style={styles.sectionDivider}>KYC & Identity</Text>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Aadhaar Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12-digit UID"
                    keyboardType="number-pad"
                    value={form.AadhaarNumber}
                    onChangeText={v => setForm(p => ({ ...p, AadhaarNumber: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>PAN Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ABCDE1234F"
                    autoCapitalize="characters"
                    value={form.PANNumber}
                    onChangeText={v => setForm(p => ({ ...p, PANNumber: v }))}
                  />
                </View>
              </View>

              {/* --- Address --- */}
              <Text style={styles.sectionDivider}>Address</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Address Line 1</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street / Area / Door No."
                  value={form.AddressLine1}
                  onChangeText={v => setForm(p => ({ ...p, AddressLine1: v }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Address Line 2</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Landmark / Colony"
                  value={form.AddressLine2}
                  onChangeText={v => setForm(p => ({ ...p, AddressLine2: v }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={form.City}
                    onChangeText={v => setForm(p => ({ ...p, City: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={form.State}
                    onChangeText={v => setForm(p => ({ ...p, State: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="560001"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={form.Pincode}
                    onChangeText={v => setForm(p => ({ ...p, Pincode: v }))}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    {(['Active', 'Inactive'] as const).map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, form.Status === s && styles.statusBtnActive]}
                        onPress={() => setForm(p => ({ ...p, Status: s }))}
                      >
                        <Text style={[styles.statusBtnText, form.Status === s && styles.statusBtnTextActive]}>{s}</Text>
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
                <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Add Customer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedUser ? (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.detailCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                  <TouchableOpacity onPress={() => selectedUser.CustomerPhoto && setPreviewImageUrl(selectedUser.CustomerPhoto)}>
                    {selectedUser.CustomerPhoto ? (
                      <Image
                        source={{ uri: getDriveImageUrl(selectedUser.CustomerPhoto) }}
                        style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.primary }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "#261a02" : colors.primarySubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryLight }}>
                        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primaryDark }}>{selectedUser.FullName.charAt(0) || 'U'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedUser.FullName}</Text>
                    <Text style={styles.detailCode}>ID: {selectedUser.UserId} • {selectedUser.CustomerCode}</Text>
                    {selectedUser.FatherHusbandName ? <Text style={styles.detailSubCode}>S/O, W/O: {selectedUser.FatherHusbandName}</Text> : null}
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                      <Badge label={selectedUser.Status} variant={selectedUser.Status === 'Active' ? 'success' : 'default'} />
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Contact Information</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Mobile:</Text> {selectedUser.MobileNumber}</Text>
                  {selectedUser.AlternateMobileNumber ? <Text style={styles.detailRowText}><Text style={styles.bold}>Alt. Mobile:</Text> {selectedUser.AlternateMobileNumber}</Text> : null}
                  {selectedUser.Email ? <Text style={styles.detailRowText}><Text style={styles.bold}>Email:</Text> {selectedUser.Email}</Text> : null}
                  {selectedUser.Occupation ? <Text style={styles.detailRowText}><Text style={styles.bold}>Occupation:</Text> {selectedUser.Occupation}</Text> : null}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Personal Details</Text>
                  {selectedUser.DateOfBirth ? <Text style={styles.detailRowText}><Text style={styles.bold}>Date of Birth:</Text> {selectedUser.DateOfBirth}</Text> : null}
                  {selectedUser.Gender ? <Text style={styles.detailRowText}><Text style={styles.bold}>Gender:</Text> {selectedUser.Gender}</Text> : null}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>KYC & Identity</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>Aadhaar:</Text> {selectedUser.AadhaarNumber || 'Not provided'}</Text>
                  <Text style={styles.detailRowText}><Text style={styles.bold}>PAN:</Text> {selectedUser.PANNumber || 'Not provided'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>Address</Text>
                  {selectedUser.AddressLine1 ? <Text style={styles.detailRowText}>{selectedUser.AddressLine1}</Text> : null}
                  {selectedUser.AddressLine2 ? <Text style={styles.detailRowText}>{selectedUser.AddressLine2}</Text> : null}
                  <Text style={styles.detailRowText}>
                    {[selectedUser.City, selectedUser.State, selectedUser.Pincode].filter(Boolean).join(', ') || 'N/A'}
                  </Text>
                </View>
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
        title="Customer Photo"
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Customer"
        message={`Are you sure you want to delete "${userToDelete?.FullName}"? This action will permanently remove this customer from the local database and sheets.`}
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setUserToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  tableAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  tableAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? "#261a02" : colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
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
    paddingBottom: 20,
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
  sectionDivider: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  cardAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
