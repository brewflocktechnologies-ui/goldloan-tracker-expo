import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView } from 'react-native';
import { BankAccountDetailModal } from '../../components/bank-accounts/BankAccountDetailModal';
import { getBankAccountColumns } from '../../components/bank-accounts/bankAccountColumns';
import {
  bankAccountSearchFilter,
  buildBankFilterChips,
  customFilterPredicate,
} from '../../components/bank-accounts/bankAccountFilters';
import { getBankAccountStyles } from '../../components/bank-accounts/bankAccountsStyles';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DataTable } from '../../components/DataTable';
import { ImageViewModal } from '../../components/ImageViewModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { BankAccount } from '../../types';


export default function BankAccountsScreen() {
  const { colors, isDark } = useTheme();
  const styles = getBankAccountStyles(colors, isDark);
  const store = useAppStore();
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const router = useRouter();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<BankAccount | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDetailMasked, setIsDetailMasked] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    await store.syncFromBackend(true);
    setRefreshing(false);
  };

  const openAddModal = () => {
    router.push('/bank-accounts/form' as any);
  };

  const openEditModal = (acc: BankAccount) => {
    router.push({ pathname: '/bank-accounts/form', params: { accountId: acc.BankAccountId } } as any);
  };

  const openDetailModal = (acc: BankAccount) => {
    setSelectedAcc(acc);
    setIsDetailMasked(true);
    setDetailModalVisible(true);
  };

  const handleDelete = (acc: BankAccount) => {
    setAccountToDelete(acc);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!accountToDelete) return;
    const name = accountToDelete.BankName;
    store.deleteBankAccount(accountToDelete.BankAccountId, {
      onSuccess: () => toast.danger(`Bank account "${name}" deleted successfully`),
    });
    setDeleteModalVisible(false);
    setAccountToDelete(null);
  };

  const columns = getBankAccountColumns({
    styles,
    colors,
    isDark,
    isSuperAdmin,
    setPreviewImageUrl,
    openDetailModal,
    openEditModal,
    handleDelete,
  });

  const bankFilterChips = buildBankFilterChips(store.bankAccounts);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <DataTable
          forceTableView={true}
          isLoading={store.isSyncing && store.bankAccounts.length === 0}
          addButtonLabel="Add Account"
          onAddPress={isSuperAdmin ? openAddModal : undefined}
          columns={columns}
          data={store.bankAccounts}
          keyExtractor={(b) => b.BankAccountId}
          filterChips={bankFilterChips}
          customFilterPredicate={customFilterPredicate}
          searchPlaceholder="Search bank, account, holder, city, status..."
          searchFilter={bankAccountSearchFilter}
        />
      </ScrollView>

      <BankAccountDetailModal
        visible={detailModalVisible}
        styles={styles}
        selectedAcc={selectedAcc}
        users={store.users}
        loans={store.loans}
        isSuperAdmin={isSuperAdmin}
        isDetailMasked={isDetailMasked}
        setIsDetailMasked={setIsDetailMasked}
        onClose={() => setDetailModalVisible(false)}
        onEdit={openEditModal}
        onPreviewImage={setPreviewImageUrl}
        onNoPassbook={() => toast.info('No passbook image uploaded for this account')}
      />

      {/* FULL-SCREEN IMAGE PREVIEW */}
      <ImageViewModal
        visible={!!previewImageUrl}
        imageUrl={previewImageUrl}
        title="Passbook / Cheque Leaf Image"
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Bank Account"
        message={`Are you sure you want to delete account "${accountToDelete?.BankName}" (${accountToDelete?.AccountNumber})? This action cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setAccountToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}
