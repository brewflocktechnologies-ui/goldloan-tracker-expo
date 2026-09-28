import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dispatch, SetStateAction } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OptionPickerModal } from '../ornaments/OptionPickerModal';
import { formatPhoneNumber, USER_SORT_OPTIONS } from '../../mock/userMockExtras';
import { getDriveImageUrl } from '../../services/api';
import { User } from '../../types';
import { getUserLastActive, UserStats, UserStatusFilter } from '../../utils/userOrnamentCalculations';
import { getAvatarColor, getInitials } from './userAvatar';
import { UserStatusBadge } from './UserStatusBadge';
import { useUsersStyles } from './usersStyles';

export type { UserStatusFilter };

interface UserListViewProps {
  filteredUsers: User[];
  userStatsMap: Map<string, UserStats>;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: UserStatusFilter;
  setActiveFilter: Dispatch<SetStateAction<UserStatusFilter>>;
  sortOption: string;
  setSortOption: Dispatch<SetStateAction<string>>;
  sortModalVisible: boolean;
  setSortModalVisible: Dispatch<SetStateAction<boolean>>;
  refreshing: boolean;
  onRefresh: () => void;
  onCardPress: (user: User) => void;
  onAdd: () => void;
}

export function UserListView({
  filteredUsers,
  userStatsMap,
  totalCount,
  activeCount,
  inactiveCount,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  sortOption,
  setSortOption,
  sortModalVisible,
  setSortModalVisible,
  refreshing,
  onRefresh,
  onCardPress,
  onAdd,
}: UserListViewProps) {
  const { styles, colors, isDark } = useUsersStyles();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {/* Top Header Section (Light Blue) matching PDF */}
      <View style={styles.listTopSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Customers</Text>
            <Text style={styles.screenSubtitle}>Manage your users and their access.</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.totalLabel}>Total Customers</Text>
            <Text style={styles.totalNumber}>{String(totalCount)}</Text>
          </View>
        </View>
      </View>

      {/* Search & Filter Card with curved background transition */}
      <View style={styles.searchCardWrapper}>
        <View style={styles.sheetBackground} pointerEvents="none" />

        <View style={styles.searchFilterCard}>
          {/* Top Search Input Row */}
          <View style={styles.searchRow}>
            <View style={styles.boxySearchBox}>
              <Ionicons
                name="search-outline"
                size={22}
                color={isDark ? '#94a3b8' : '#64748b'}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, mobile, or customer ID..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.filterIconBtn, sortOption !== 'Newest First' && styles.filterIconBtnActive]}
              activeOpacity={0.7}
              onPress={() => setSortModalVisible(true)}
              accessibilityLabel="Sort and filter options"
            >
              <MaterialIcons
                name="filter-list"
                size={24}
                color={sortOption !== 'Newest First' ? '#0284c7' : isDark ? '#cbd5e1' : '#475569'}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
              onPress={() => setActiveFilter('All')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
                All ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Active' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Active')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Active' && styles.filterPillTextActive]}>
                Active ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Inactive' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Inactive')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Inactive' && styles.filterPillTextActive]}>
                Inactive ({inactiveCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Customer Cards List */}
      <ScrollView
        style={styles.cardsScrollContainer}
        contentContainerStyle={styles.cardsScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        <View style={styles.cardsList}>
          {filteredUsers.map(user => {
            const directPhoto = user.CustomerPhoto ? getDriveImageUrl(user.CustomerPhoto) : '';
            const avatarTone = getAvatarColor(user.FullName);
            const initials = getInitials(user.FullName);
            const stats = userStatsMap.get(user.UserId) || { loanCount: 0, goldWeight: 0 };
            const lastActive = getUserLastActive(user);

            return (
              <TouchableOpacity
                key={user.UserId}
                style={styles.listCard}
                onPress={() => onCardPress(user)}
                activeOpacity={0.7}
              >
                {/* Top Section: Left (Avatar + Name & Code) | Right (Status Pill) */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    <View style={styles.avatarContainer}>
                      {directPhoto || user.CustomerPhoto ? (
                        <Image
                          source={{ uri: directPhoto || user.CustomerPhoto }}
                          style={styles.avatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.avatarInitialsBox, { backgroundColor: avatarTone.bg }]}>
                          <Text style={[styles.avatarInitialsText, { color: avatarTone.text }]}>{initials}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardIdentityCol}>
                      <Text style={styles.listCardTitle} numberOfLines={1}>{user.FullName}</Text>
                      <Text style={styles.cardIdText}>{user.CustomerCode || user.UserId}</Text>
                    </View>
                  </View>

                  <View style={styles.cardTopRight}>
                    <UserStatusBadge status={user.Status} isDark={isDark} variant="badge" showDot={false} />
                  </View>
                </View>

                {/* Bottom Section: Left (Phone & Last Active) | Right (Loans & Gold Weight + Chevron) */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.cardBottomLeftCol}>
                    <View style={styles.cardInfoRow}>
                      <Ionicons
                        name="call-outline"
                        size={15}
                        color={isDark ? '#cbd5e1' : '#334155'}
                        style={styles.cardInfoIcon}
                      />
                      <Text style={styles.cardPhoneText}>{formatPhoneNumber(user.MobileNumber)}</Text>
                    </View>

                    <View style={styles.cardInfoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color={isDark ? '#94a3b8' : '#64748b'}
                        style={styles.cardInfoIcon}
                      />
                      <Text style={styles.cardLastActiveText}>
                        {lastActive || 'Last active: —'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRightCol}>
                    <View style={styles.cardStatsCol}>
                      <View style={styles.cardStatRow}>
                        <MaterialIcons
                          name="chrome-reader-mode"
                          size={15}
                          color={isDark ? '#cbd5e1' : '#475467'}
                          style={styles.cardStatIcon}
                        />
                        <Text style={styles.cardStatText}>{stats.loanCount} Loans</Text>
                      </View>

                      <View style={styles.cardStatRow}>
                        <Image
                          source={require('../../../assets/images/gold_bars.png')}
                          style={styles.goldBarIcon}
                          contentFit="contain"
                        />
                        <Text style={styles.cardStatText}>{stats.goldWeight.toFixed(1)} g</Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? '#f8fafc' : '#0f172a'}
                      style={styles.cardChevronIcon}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={42} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or status filter</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={onAdd}
        activeOpacity={0.85}
        accessibilityLabel="Add customer"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Sort Option Modal */}
      <OptionPickerModal
        visible={sortModalVisible}
        title="Sort By"
        options={USER_SORT_OPTIONS}
        selectedValue={sortOption}
        onSelect={opt => {
          setSortOption(opt);
          setSortModalVisible(false);
        }}
        onClose={() => setSortModalVisible(false)}
        isDark={isDark}
        secondaryTextColor={colors.textSecondary}
      />
    </SafeAreaView>
  );
}
