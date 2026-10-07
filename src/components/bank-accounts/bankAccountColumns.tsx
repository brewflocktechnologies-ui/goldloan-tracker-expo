import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { getDriveImageUrl } from '../../services/api';
import { BankAccount } from '../../types';
import { Badge } from '../Badge';
import { Column } from '../DataTable';
import { getBankAccountStyles } from './bankAccountsStyles';

interface BankAccountColumnsParams {
  styles: ReturnType<typeof getBankAccountStyles>;
  colors: ThemeColors;
  isDark: boolean;
  isSuperAdmin: boolean;
  setPreviewImageUrl: (url: string | null) => void;
  openDetailModal: (acc: BankAccount) => void;
  openEditModal: (acc: BankAccount) => void;
  handleDelete: (acc: BankAccount) => void;
}

// Table Columns exactly matching bankAccountsTable in index.html:
// ID | Holder Name | Account No. | Bank | City | Max Loan (₹) | Utilized (₹) | Available (₹) | Status | Actions
export const getBankAccountColumns = ({
  styles,
  colors,
  isDark,
  isSuperAdmin,
  setPreviewImageUrl,
  openDetailModal,
  openEditModal,
  handleDelete,
}: BankAccountColumnsParams): Column<BankAccount>[] => [
  {
    key: 'BankAccountId',
    title: 'ID',
    width: 65,
    render: (b) => <Text style={styles.idText}>#{b.BankAccountId}</Text>,
  },
  {
    key: 'AccountHolderName',
    title: 'Holder Name',
    width: 140,
    render: (b) => <Text style={styles.primaryCellText} numberOfLines={1}>{b.AccountHolderName}</Text>,
  },
  {
    key: 'AccountNumber',
    title: 'Account No.',
    width: 130,
    render: (b) => <Text style={styles.cellText} numberOfLines={1}>{b.AccountNumber}</Text>,
  },
  {
    key: 'BankName',
    title: 'Bank',
    width: 140,
    render: (b) => {
      const directUrl = getDriveImageUrl(b.PassbookImage);
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {b.PassbookImage ? (
            <TouchableOpacity onPress={() => b.PassbookImage && setPreviewImageUrl(b.PassbookImage)}>
              <Image source={{ uri: directUrl || b.PassbookImage }} style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} contentFit="cover" />
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.cellText, { fontWeight: '600', flex: 1 }]} numberOfLines={1}>{b.BankName}</Text>
        </View>
      );
    },
  },
  {
    key: 'City',
    title: 'City',
    width: 90,
    render: (b) => <Text style={styles.cellText} numberOfLines={1}>{b.City || '—'}</Text>,
  },
  {
    key: 'MaxLoanAmount',
    title: 'Max Limit (₹)',
    width: 115,
    align: 'right',
    render: (b) => <Text style={styles.cellText}>₹{(b.MaxLoanAmount || 0).toLocaleString()}</Text>,
  },
  {
    key: 'UtilizedLoanAmount',
    title: 'Utilized (₹)',
    width: 115,
    align: 'right',
    render: (b) => (
      <Text style={[styles.cellText, { color: (b.UtilizedLoanAmount || 0) > 0 ? colors.danger : colors.textSecondary }]}>
        ₹{(b.UtilizedLoanAmount || 0).toLocaleString()}
      </Text>
    ),
  },
  {
    key: 'AvailableLoanAmount',
    title: 'Available (₹)',
    width: 115,
    align: 'right',
    render: (b) => (
      <Text style={[styles.cellText, { fontWeight: '700', color: colors.success }]}>
        ₹{(b.AvailableLoanAmount || Math.max(0, (b.MaxLoanAmount || 0) - (b.UtilizedLoanAmount || 0))).toLocaleString()}
      </Text>
    ),
  },
  {
    key: 'Status',
    title: 'Status',
    width: 85,
    align: 'center',
    render: (b) => (
      <Badge 
        label={b.Status} 
        variant={b.Status === 'Active' ? 'success' : 'default'} 
        size="sm" 
      />
    ),
  },
  {
    key: 'Actions',
    title: 'Actions',
    width: 95,
    align: 'center',
    render: (b) => (
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => openDetailModal(b)} style={styles.actionBtn} accessibilityLabel="View Details">
          <Ionicons name="eye-outline" size={16} color="#0284c7" />
        </TouchableOpacity>
        {isSuperAdmin && (
          <>
            <TouchableOpacity onPress={() => openEditModal(b)} style={styles.actionBtn} accessibilityLabel="Edit">
              <Ionicons name="pencil-outline" size={16} color={colors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(b)} style={styles.actionBtn} accessibilityLabel="Delete">
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </>
        )}
      </View>
    ),
  },
];
