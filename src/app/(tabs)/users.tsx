import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { UserDetailsTab, UserDetailsView } from '../../components/users/UserDetailsView';
import { UserFormState, UserFormView, UserPickerModalState } from '../../components/users/UserFormView';
import { UserListView, UserStatusFilter } from '../../components/users/UserListView';
import { UserOptionsMenuHandle } from '../../components/users/UserOptionsMenu';
import { useCustomerPhotoPicker } from '../../components/users/useCustomerPhotoPicker';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { User } from '../../types';
import {
  buildUserStatsMap,
  countUsersByStatus,
  filterUsers,
  formatInputDOB,
  generateCustomerCode,
  sortUsers,
} from '../../utils/userOrnamentCalculations';

export default function UsersScreen() {
  const store = useAppStore();
  const toast = useToast();

  // View mode: 'list' | 'details' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'add' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // List State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserStatusFilter>('All');
  const [sortOption, setSortOption] = useState('Newest First');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Details State
  const [activeTab, setActiveTab] = useState<UserDetailsTab>('Profile');
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPAN, setShowPAN] = useState(false);
  const optionsMenuRef = useRef<UserOptionsMenuHandle>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Add / Edit State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UserFormState>({
    FullName: '',
    FatherHusbandName: '',
    CustomerCode: '',
    MobileNumber: '',
    AlternateMobileNumber: '',
    Email: '',
    DateOfBirth: '',
    Gender: 'Male' as 'Male' | 'Female' | 'Other',
    Occupation: '',
    AadhaarNumber: '',
    PANNumber: '',
    AddressLine1: '',
    AddressLine2: '',
    City: 'Bengaluru',
    State: 'Karnataka',
    Pincode: '560041',
    CustomerPhoto: '',
    Status: 'Active' as 'Active' | 'Inactive',
  });
  const [filesPayload, setFilesPayload] = useState<any[]>([]);

  // Picker Modal State (for State, Occupation, Gender)
  const [pickerModal, setPickerModal] = useState<UserPickerModalState>({
    visible: false,
    title: '',
    field: 'State',
    options: [],
  });
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const { handlePickCamera, handlePickGallery } = useCustomerPhotoPicker(setForm, setFilesPayload);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  // Filter counts
  const totalCount = store.users.length;
  const activeCount = useMemo(() => countUsersByStatus(store.users, 'Active'), [store.users]);
  const inactiveCount = useMemo(() => countUsersByStatus(store.users, 'Inactive'), [store.users]);

  // Map users to loan count and gold weight
  const userStatsMap = useMemo(
    () => buildUserStatsMap(store.users, store.loans, store.ornaments),
    [store.users, store.loans, store.ornaments]
  );

  // Filtered & Sorted Users
  const filteredUsers = useMemo(
    () => sortUsers(filterUsers(store.users, searchQuery, activeFilter), sortOption, userStatsMap),
    [store.users, activeFilter, searchQuery, sortOption, userStatsMap]
  );

  // Back Button Navigation
  useEffect(() => {
    const onBackPress = () => {
      if (dobModalVisible) {
        setDobModalVisible(false);
        return true;
      }
      if (pickerModal.visible) {
        setPickerModal(p => ({ ...p, visible: false }));
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
      if (viewMode === 'add') {
        setViewMode('list');
        return true;
      }
      if (viewMode === 'edit') {
        setViewMode(selectedUser ? 'details' : 'list');
        return true;
      }
      if (viewMode === 'details') {
        setViewMode('list');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [viewMode, selectedUser, pickerModal.visible, dobModalVisible, deleteModalVisible]);

  // Open Details Screen
  const handleCardPress = (user: User) => {
    setSelectedUser(user);
    setActiveTab('Profile');
    setShowAadhaar(false);
    setShowPAN(false);
    setViewMode('details');
  };

  // Open Add Screen
  const handleAddPress = () => {
    setSelectedUser(null);
    setFilesPayload([]);
    const generatedCode = generateCustomerCode(store.users.length);
    setForm({
      FullName: '',
      FatherHusbandName: '',
      CustomerCode: generatedCode,
      MobileNumber: '',
      AlternateMobileNumber: '',
      Email: '',
      DateOfBirth: '',
      Gender: 'Male',
      Occupation: 'Teacher',
      AadhaarNumber: '',
      PANNumber: '',
      AddressLine1: '',
      AddressLine2: '',
      City: 'Bengaluru',
      State: 'Karnataka',
      Pincode: '560041',
      CustomerPhoto: '',
      Status: 'Active',
    });
    setViewMode('add');
  };

  // Open Edit Screen
  const handleEditPress = (user: User) => {
    setSelectedUser(user);
    setFilesPayload([]);
    setForm({
      FullName: user.FullName || '',
      FatherHusbandName: user.FatherHusbandName || '',
      CustomerCode: user.CustomerCode || user.UserId || '',
      MobileNumber: user.MobileNumber || '',
      AlternateMobileNumber: user.AlternateMobileNumber || '',
      Email: user.Email || '',
      DateOfBirth: formatInputDOB(user.DateOfBirth),
      Gender: (user.Gender as any) || 'Male',
      Occupation: user.Occupation || 'Teacher',
      AadhaarNumber: user.AadhaarNumber || '',
      PANNumber: user.PANNumber || '',
      AddressLine1: user.AddressLine1 || '',
      AddressLine2: user.AddressLine2 || '',
      City: user.City || 'Bengaluru',
      State: user.State || 'Karnataka',
      Pincode: user.Pincode || '560041',
      CustomerPhoto: user.CustomerPhoto || '',
      Status: user.Status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setViewMode('edit');
  };

  // Save User
  const handleSaveForm = async () => {
    if (!form.FullName.trim()) {
      Alert.alert('Required Field', 'Please enter Full Name.');
      return;
    }
    const cleanMobile = form.MobileNumber.replace(/[^\d]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<User> = {
        FullName: form.FullName.trim(),
        FatherHusbandName: form.FatherHusbandName.trim(),
        CustomerCode: form.CustomerCode.trim(),
        MobileNumber: cleanMobile,
        AlternateMobileNumber: form.AlternateMobileNumber.trim(),
        Email: form.Email.trim(),
        DateOfBirth: form.DateOfBirth.trim(),
        Gender: form.Gender,
        Occupation: form.Occupation.trim(),
        AadhaarNumber: form.AadhaarNumber.trim(),
        PANNumber: form.PANNumber.trim(),
        AddressLine1: form.AddressLine1.trim(),
        AddressLine2: form.AddressLine2.trim(),
        City: form.City.trim(),
        State: form.State.trim(),
        Pincode: form.Pincode.trim(),
        CustomerPhoto: form.CustomerPhoto,
        Status: form.Status,
      };

      if (viewMode === 'edit' && selectedUser) {
        store.updateUser(selectedUser.UserId, { ...payload, files: filesPayload });
        toast.success(`Customer "${form.FullName}" updated successfully`);
        setSelectedUser(prev => (prev ? ({ ...prev, ...payload } as User) : null));
        setViewMode('details');
      } else {
        const newUser = store.addUser({ ...payload, files: filesPayload });
        toast.success(`Customer "${form.FullName}" registered successfully`);
        setSelectedUser(newUser);
        setViewMode('details');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (viewMode === 'details' && selectedUser) {
    return (
      <UserDetailsView
        selectedUser={selectedUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAadhaar={showAadhaar}
        setShowAadhaar={setShowAadhaar}
        showPAN={showPAN}
        setShowPAN={setShowPAN}
        optionsMenuRef={optionsMenuRef}
        deleteModalVisible={deleteModalVisible}
        setDeleteModalVisible={setDeleteModalVisible}
        onBack={() => setViewMode('list')}
        onEdit={handleEditPress}
      />
    );
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <UserFormView
        mode={viewMode}
        form={form}
        setForm={setForm}
        submitting={submitting}
        pickerModal={pickerModal}
        setPickerModal={setPickerModal}
        dobModalVisible={dobModalVisible}
        setDobModalVisible={setDobModalVisible}
        onBack={() => setViewMode(viewMode === 'edit' && selectedUser ? 'details' : 'list')}
        onSave={handleSaveForm}
        onPickCamera={handlePickCamera}
        onPickGallery={handlePickGallery}
      />
    );
  }

  return (
    <UserListView
      filteredUsers={filteredUsers}
      userStatsMap={userStatsMap}
      totalCount={totalCount}
      activeCount={activeCount}
      inactiveCount={inactiveCount}
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
      onCardPress={handleCardPress}
      onAdd={handleAddPress}
    />
  );
}
