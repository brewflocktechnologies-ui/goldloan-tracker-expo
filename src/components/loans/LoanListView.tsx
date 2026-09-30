import { Ionicons } from '@expo/vector-icons';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Loan, Payment, User } from '../../types';
import { LoanCardItem } from './LoanCardItem';
import { LoanOptionsMenu } from './LoanOptionsMenu';
import { getLoansStyles } from './loansStyles';
import { getLoanStatusInfo } from './loanUtils';

export type LoanFilterType = 'All' | 'Active' | 'Overdue' | 'Closed';

export interface LoanListViewProps {
  loans: Loan[];
  users: User[];
  payments: Payment[];
  ornamentsCountMap?: Map<string, number>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: LoanFilterType;
  setActiveFilter: Dispatch<SetStateAction<LoanFilterType>>;
  refreshing: boolean;
  onRefresh: () => void;
  onLoanPress: (loan: Loan) => void;
  onAddPress?: () => void;
  onEditPress?: (loan: Loan) => void;
  onPayPress?: (loan: Loan) => void;
}

export function LoanListView({
  loans,
  users,
  payments,
  ornamentsCountMap,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  refreshing,
  onRefresh,
  onLoanPress,
  onAddPress,
  onEditPress,
  onPayPress,
}: LoanListViewProps) {
  const { colors, isDark } = useTheme();
  const styles = getLoansStyles(colors, isDark);

  const [menuLoan, setMenuLoan] = useState<Loan | null>(null);

  // Map users by UserId for fast lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      map.set(u.UserId, u);
    }
    return map;
  }, [users]);

  // Compute status counts across all loans
  const { allCount, activeCount, overdueCount, closedCount } = useMemo(() => {
    let act = 0;
    let ovd = 0;
    let cls = 0;
    for (const l of loans) {
      const info = getLoanStatusInfo(l);
      if (info.badgeVariant === 'overdue') {
        ovd++;
      } else if (info.badgeVariant === 'closed') {
        cls++;
      } else {
        act++;
      }
    }
    return {
      allCount: loans.length,
      activeCount: act,
      overdueCount: ovd,
      closedCount: cls,
    };
  }, [loans]);

  // Filtered and searched loans
  const filteredLoans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return loans.filter((l) => {
      const info = getLoanStatusInfo(l);

      // Status filter
      if (activeFilter === 'Active' && (info.badgeVariant !== 'active' || info.isOverdue)) {
        return false;
      }
      if (activeFilter === 'Overdue' && !info.isOverdue) {
        return false;
      }
      if (activeFilter === 'Closed' && info.badgeVariant !== 'closed') {
        return false;
      }

      // Search query filter
      if (!query) return true;

      const borrower = userMap.get(l.UserId);
      const borrowerName = (borrower?.FullName || '').toLowerCase();
      const borrowerPhone = (borrower?.MobileNumber || borrower?.AlternateMobileNumber || '').toLowerCase();
      const loanNo = (l.LoanNumber || '').toLowerCase();
      const loanId = (l.LoanId || '').toLowerCase();
      const bank = (l.BankName || '').toLowerCase();
      const amountStr = (l.LoanAmount || '').toString();

      return (
        loanNo.includes(query) ||
        loanId.includes(query) ||
        borrowerName.includes(query) ||
        borrowerPhone.includes(query) ||
        bank.includes(query) ||
        amountStr.includes(query)
      );
    });
  }, [loans, activeFilter, searchQuery, userMap]);

  const filterChips: { label: string; value: LoanFilterType; count: number }[] = [
    { label: 'All', value: 'All', count: allCount },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Overdue', value: 'Overdue', count: overdueCount },
  ];

  const borrowerForMenu = menuLoan ? userMap.get(menuLoan.UserId) : null;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* ─── 1. TOP HERO SECTION (Light blue matching screenshot) ─── */}
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Loans</Text>
              <Text style={styles.heroSubtitle}>Track and manage gold loans</Text>
            </View>

            <View style={styles.heroRight}>
              <Text style={styles.totalLabel}>Total Loans</Text>
              <Text style={styles.totalNumber}>
                {String(allCount).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 2. SEARCH & FILTER CARD WITH CURVED TRANSITION ─── */}
        <View style={styles.searchCardWrapper}>
          <View style={styles.sheetBackground} pointerEvents="none" />

          <View style={styles.searchFilterCard}>
            {/* Search Input Box */}
            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={20}
                color={isDark ? '#94a3b8' : '#64748b'}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                accessibilityLabel="Search loans"
                placeholder="Loan number, customer or mobile..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={isDark ? '#94a3b8' : '#94a3b8'}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsContainer}
            >
              {filterChips.map((chip) => {
                const isActive = activeFilter === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                    ]}
                    onPress={() => setActiveFilter(chip.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                      ]}
                    >
                      {chip.label} ({chip.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ─── 3. LOAN CARDS FLATLIST ─── */}
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.LoanId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0284c7']}
              tintColor="#0284c7"
            />
          }
          renderItem={({ item }) => {
            const borrower = userMap.get(item.UserId);
            const ornCount =
              ornamentsCountMap?.get(item.LoanId) ??
              item.ornamentIds?.length ??
              1;

            return (
              <LoanCardItem
                loan={item}
                borrower={borrower}
                payments={payments}
                ornamentsCount={ornCount}
                onPress={onLoanPress}
                onMenuPress={(l) => setMenuLoan(l)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={44}
                color={isDark ? '#475569' : '#cbd5e1'}
              />
              <Text style={styles.emptyTitle}>No loans found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No loans matching "${searchQuery}"`
                  : activeFilter !== 'All'
                  ? `No ${activeFilter.toLowerCase()} loans in this category`
                  : 'Start by originating your first gold loan.'}
              </Text>
            </View>
          }
        />

        {/* ─── 4. FLOATING ACTION BUTTON (FAB) ─── */}
        {onAddPress && (
          <TouchableOpacity
            style={styles.fabButton}
            onPress={onAddPress}
            activeOpacity={0.85}
            accessibilityLabel="Originate New Loan"
          >
            <Ionicons name="add" size={30} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* ─── 5. THREE-DOTS OVERFLOW MENU ─── */}
        <LoanOptionsMenu
          visible={Boolean(menuLoan)}
          loan={menuLoan}
          borrower={borrowerForMenu}
          onClose={() => setMenuLoan(null)}
          onViewDetails={(l) => onLoanPress(l)}
          onEdit={onEditPress}
          onPay={onPayPress}
        />
      </View>
    </SafeAreaView>
  );
}
