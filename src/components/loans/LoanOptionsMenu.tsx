import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Loan, User } from '../../types';
import { formatAmountLakh } from './loanUtils';

export interface LoanOptionsMenuProps {
  visible: boolean;
  loan: Loan | null;
  borrower?: User | null;
  onClose: () => void;
  onViewDetails: (loan: Loan) => void;
  onEdit?: (loan: Loan) => void;
  onPay?: (loan: Loan) => void;
}

export function LoanOptionsMenu({
  visible,
  loan,
  borrower,
  onClose,
  onViewDetails,
  onEdit,
  onPay,
}: LoanOptionsMenuProps) {
  const { colors, isDark } = useTheme();
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const router = useRouter();

  if (!loan) return null;

  const copyToClipboard = (text: string, label: string) => {
    onClose();
    if (!text || text === '—') return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    toast.success(`${label} copied`);
  };

  const borrowerName = borrower?.FullName || 'Borrower';
  const isLoanActive = loan.LoanStatus === 'Active' || loan.LoanStatus === 'Overdue';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetCard,
            { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
          ]}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
            ]}
          />

          <Text
            style={[
              styles.title,
              { color: isDark ? '#f8fafc' : '#0f172a' },
            ]}
            numberOfLines={1}
          >
            {loan.LoanNumber}
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: isDark ? '#94a3b8' : '#64748b' },
            ]}
          >
            {borrowerName} • {formatAmountLakh(loan.LoanAmount)} • {loan.LoanStatus}
          </Text>

          <View
            style={[
              styles.actionList,
              { borderTopColor: isDark ? '#334155' : '#f1f5f9' },
            ]}
          >
            {/* Copy Loan Number */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => copyToClipboard(loan.LoanNumber, 'Loan Number')}
            >
              <Ionicons
                name="copy-outline"
                size={18}
                color={isDark ? '#cbd5e1' : '#334155'}
                style={styles.actionIcon}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: isDark ? '#f8fafc' : '#1e293b' },
                ]}
              >
                Copy Loan Number
              </Text>
            </TouchableOpacity>

            {/* View Details */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                onViewDetails(loan);
              }}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color="#0284c7"
                style={styles.actionIcon}
              />
              <Text style={[styles.actionLabel, { color: '#0284c7' }]}>
                View Loan Details
              </Text>
            </TouchableOpacity>

            {/* Record Repayment */}
            {isSuperAdmin && isLoanActive && onPay ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onClose();
                  onPay(loan);
                }}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={isDark ? '#34d399' : '#059669'}
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: isDark ? '#34d399' : '#059669' },
                  ]}
                >
                  Record Repayment
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Edit Loan */}
            {isSuperAdmin && isLoanActive && onEdit ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onClose();
                  onEdit(loan);
                }}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={isDark ? '#fbbf24' : '#d97706'}
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: isDark ? '#fbbf24' : '#d97706' },
                  ]}
                >
                  Edit Loan Contract
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* View Ornaments */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                router.push('/(tabs)/ornaments' as any);
              }}
            >
              <MaterialCommunityIcons
                name="ring"
                size={18}
                color={isDark ? '#cbd5e1' : '#334155'}
                style={styles.actionIcon}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: isDark ? '#f8fafc' : '#1e293b' },
                ]}
              >
                View Ornaments (
                {loan.ornamentIds?.length || 1})
              </Text>
            </TouchableOpacity>

            {/* Settle / Close Loan */}
            {isLoanActive ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/closure' as any);
                }}
              >
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={18}
                  color={isDark ? '#cbd5e1' : '#334155'}
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: isDark ? '#f8fafc' : '#1e293b' },
                  ]}
                >
                  Loan Settlement / Closure
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.2)' } as any,
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  actionList: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
