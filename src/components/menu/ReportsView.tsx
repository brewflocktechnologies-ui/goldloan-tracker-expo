import { Text, View } from 'react-native';
import { useAppStore } from '../../services/store';
import { MenuStyles } from './menuStyles';

interface ReportsViewProps {
  styles: MenuStyles;
  store: ReturnType<typeof useAppStore>;
}

export function ReportsView({ styles, store }: ReportsViewProps) {
  const dash = store.dashboardData;
  const activeLoans = store.loans.filter((l) => l.LoanStatus === 'Active');
  const overdueLoans = store.loans.filter((l) => {
    if (l.LoanStatus !== 'Active') return false;
    const due = l.DueDate ? new Date(l.DueDate) : null;
    return due ? due < new Date() : false;
  });
  const closedLoans = store.loans.filter((l) => l.LoanStatus === 'Closed');
  const cancelledLoans = store.loans.filter((l) => l.LoanStatus === 'Cancelled');

  // Principal Outstanding in Lakhs
  const principalOut = dash.totalLoanAmount || 0;
  const principalStr = principalOut >= 100000 
    ? `₹${(principalOut / 100000).toFixed(2)} L` 
    : `₹${principalOut.toLocaleString('en-IN')}`;

  // Compute active interest receivable estimate
  const interestReceivable = activeLoans.reduce((sum, l) => {
    const amt = Number(l.LoanAmount) || 0;
    const rate = Number(l.InterestRate) || 12;
    return sum + Math.round(amt * (rate / 100) * (3 / 12));
  }, 0);

  // Current month collection calculation
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'short' });
  const currentMonthPayments = store.payments.filter((p) => {
    const d = p.PaymentDate ? new Date(p.PaymentDate) : (p.CreatedDate ? new Date(p.CreatedDate) : null);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const collectedThisMonth = currentMonthPayments.reduce((sum, p) => sum + (Number(p.TotalPaidAmount) || 0), 0);

  // Group active loans by Bank Account / Bank Name
  const bankExposureMap: Record<string, number> = {};
  activeLoans.forEach((l) => {
    const bankName = l.BankName || 'Primary Bank';
    bankExposureMap[bankName] = (bankExposureMap[bankName] || 0) + (Number(l.LoanAmount) || 0);
  });

  const bankEntries = Object.entries(bankExposureMap).sort((a, b) => b[1] - a[1]);
  const maxBankExposure = Math.max(...bankEntries.map((e) => e[1]), principalOut || 1);

  const totalLoansCount = store.loans.length || 1;

  return (
    <View style={styles.viewContainer}>
      {/* 2x2 Top Metrics Grid */}
      <View style={styles.reportGrid}>
        {/* Principal Outstanding */}
        <View style={styles.reportMetricCard}>
          <Text style={styles.reportMetricLabel}>Principal outstanding</Text>
          <Text style={styles.reportMetricVal}>{principalStr}</Text>
        </View>

        {/* Interest Receivable */}
        <View style={styles.reportMetricCard}>
          <Text style={styles.reportMetricLabel}>Interest receivable</Text>
          <Text style={styles.reportMetricVal}>₹{interestReceivable.toLocaleString('en-IN')}</Text>
        </View>

        {/* Collected this month */}
        <View style={styles.reportMetricCard}>
          <Text style={styles.reportMetricLabel}>Collected in {currentMonthName}</Text>
          <Text style={styles.reportMetricVal}>₹{collectedThisMonth.toLocaleString('en-IN')}</Text>
        </View>

        {/* Payments count */}
        <View style={styles.reportMetricCard}>
          <Text style={styles.reportMetricLabel}>Payments in {currentMonthName}</Text>
          <Text style={styles.reportMetricVal}>{currentMonthPayments.length}</Text>
        </View>
      </View>

      {/* Loans by status */}
      <View style={styles.reportCard}>
        <Text style={styles.cardHeaderTitle}>Loans by status</Text>
        <View style={styles.statusBarsList}>
          {/* Active */}
          <View style={styles.statusBarRow}>
            <Text style={styles.statusNameLabel}>Active</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { backgroundColor: '#10b981', width: `${Math.min(100, Math.round((activeLoans.length / totalLoansCount) * 100))}%` }]} />
            </View>
            <Text style={styles.statusCountVal}>{activeLoans.length}</Text>
          </View>

          {/* Overdue */}
          <View style={styles.statusBarRow}>
            <Text style={styles.statusNameLabel}>Overdue</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { backgroundColor: '#ef4444', width: `${Math.min(100, Math.round((overdueLoans.length / totalLoansCount) * 100))}%` }]} />
            </View>
            <Text style={styles.statusCountVal}>{overdueLoans.length}</Text>
          </View>

          {/* Closed */}
          <View style={styles.statusBarRow}>
            <Text style={styles.statusNameLabel}>Closed</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { backgroundColor: '#64748b', width: `${Math.min(100, Math.round((closedLoans.length / totalLoansCount) * 100))}%` }]} />
            </View>
            <Text style={styles.statusCountVal}>{closedLoans.length}</Text>
          </View>

          {/* Cancelled */}
          <View style={styles.statusBarRow}>
            <Text style={styles.statusNameLabel}>Cancelled</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { backgroundColor: '#cbd5e1', width: `${Math.min(100, Math.round((cancelledLoans.length / totalLoansCount) * 100))}%` }]} />
            </View>
            <Text style={styles.statusCountVal}>{cancelledLoans.length}</Text>
          </View>
        </View>
      </View>

      {/* Active exposure by bank */}
      <View style={styles.reportCard}>
        <Text style={styles.cardHeaderTitle}>Active exposure by bank</Text>
        <View style={styles.bankExposureList}>
          {bankEntries.length === 0 ? (
            <Text style={styles.emptyNoticeText}>No active bank exposure recorded.</Text>
          ) : (
            bankEntries.map(([name, val]) => {
              const pct = Math.min(100, Math.round((val / maxBankExposure) * 100));
              const amtStr = val >= 100000 ? `₹${(val / 100000).toFixed(2)} L` : `₹${val.toLocaleString('en-IN')}`;
              return (
                <View key={name} style={styles.bankExposureItem}>
                  <View style={styles.bankExposureLabelRow}>
                    <Text style={styles.bankNameText} numberOfLines={1}>{name}</Text>
                    <Text style={styles.bankAmountText}>{amtStr}</Text>
                  </View>
                  <View style={styles.bankBarTrack}>
                    <View style={[styles.bankBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}
