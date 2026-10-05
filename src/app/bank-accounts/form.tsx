import { useLocalSearchParams, useRouter } from 'expo-router';
import { BankAccountForm } from '../../components/BankAccountForm';
import { useAppStore } from '../../services/store';

export default function BankAccountFormScreen() {
  const router = useRouter();
  const store = useAppStore();
  const { accountId, userId } = useLocalSearchParams<{ accountId?: string; userId?: string }>();
  const account = accountId
    ? store.bankAccounts.find((a) => String(a.BankAccountId) === String(accountId)) ?? null
    : null;

  return <BankAccountForm account={account} presetUserId={userId} onClose={() => router.back()} />;
}
