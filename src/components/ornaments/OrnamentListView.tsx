import { OrnamentIcon, UserIcon } from '@/components/Icon';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dispatch, SetStateAction } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDriveImageUrl } from '../../services/api';
import { Ornament } from '../../types';
import { getOrnamentCardFigures, OrnamentStatusFilter } from '../../utils/userOrnamentCalculations';
import { OptionPickerModal } from './OptionPickerModal';
import { OrnamentStatusBadge } from './OrnamentStatusBadge';
import { useOrnamentsStyles } from './ornamentsStyles';

export const ORNAMENT_SORT_OPTIONS = ['Newest First', 'Oldest First', 'Name (A-Z)', 'Name (Z-A)', 'Weight (High-Low)', 'Weight (Low-High)'];

export type { OrnamentStatusFilter };

interface OrnamentListViewProps {
  filteredOrnaments: Ornament[];
  totalCount: number;
  availableCount: number;
  pledgedCount: number;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: OrnamentStatusFilter;
  setActiveFilter: Dispatch<SetStateAction<OrnamentStatusFilter>>;
  sortOption: string;
  setSortOption: Dispatch<SetStateAction<string>>;
  sortModalVisible: boolean;
  setSortModalVisible: Dispatch<SetStateAction<boolean>>;
  refreshing: boolean;
  onRefresh: () => void;
  getLoanNumber: (orn: Ornament) => string | null;
  onCardPress: (orn: Ornament) => void;
  onAdd: () => void;
}

export function OrnamentListView({
  filteredOrnaments,
  totalCount,
  availableCount,
  pledgedCount,
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
  getLoanNumber,
  onCardPress,
  onAdd,
}: OrnamentListViewProps) {
  const { styles, colors, isDark } = useOrnamentsStyles();

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      {/* Top Header Section (Light Blue) */}
      <View style={styles.listTopSection}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Ornaments</Text>
            <Text style={styles.screenSubtitle}>Manage your users and their access.</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.totalLabel}>Total Ornaments</Text>
            <Text style={styles.totalNumber}>{String(totalCount).padStart(2, '0')}</Text>
          </View>
        </View>
      </View>

      {/* Search & Filter Section with curved background transition */}
      <View style={styles.searchCardWrapper}>
        {/* Curved bottom sheet background */}
        <View style={styles.sheetBackground} pointerEvents="none" />

        {/* Search & Filter Card */}
        <View style={styles.searchFilterCard}>
          {/* Top Row: Boxy Search Input + Outside Filter Icon */}
          <View style={styles.searchRow}>
            <View style={styles.boxySearchBox}>
              <Ionicons name="search-outline" size={22} color={isDark ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                accessibilityLabel="Search ornaments"
                placeholder="Search by name, type, hallmark or ID..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
              <OrnamentIcon
                name="filter-3"
                size={24}
                color={sortOption !== 'Newest First' ? '#0284c7' : (isDark ? '#cbd5e1' : '#475569')}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Status Filter Pills (Inside the Card) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
              onPress={() => setActiveFilter('All')}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'All' }}
            >
              <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
                All ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Available' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Available')}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'Available' }}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Available' && styles.filterPillTextActive]}>
                Available ({availableCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Pledged' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Pledged')}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'Pledged' }}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Pledged' && styles.filterPillTextActive]}>
                Pledged ({pledgedCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Ornaments Cards List (White below) */}
      <FlatList
        style={styles.cardsScrollContainer}
        contentContainerStyle={[styles.cardsScrollContent, styles.cardsList]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
        data={filteredOrnaments}
        keyExtractor={item => item.OrnamentId}
        initialNumToRender={20}
        windowSize={11}
        maxToRenderPerBatch={12}
        renderItem={({ item: orn }) => {
          const firstImg = orn.OrnamentImages ? orn.OrnamentImages.split(' | ').filter(Boolean)[0] : '';
          const directUrl = firstImg ? getDriveImageUrl(firstImg) : '';
          const isPledged = orn.Status === 'Pledged';
          const loanNum = getLoanNumber(orn);
          const { weightVal, priceVal } = getOrnamentCardFigures(orn);

          return (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() => onCardPress(orn)}
                accessibilityRole="button"
                accessibilityLabel={`Ornament ${orn.OrnamentName}`}
              activeOpacity={0.7}
            >
              {/* Left Thumbnail */}
              <View style={styles.cardLeftCol}>
                <View style={styles.thumbContainer}>
                  {directUrl ? (
                    <Image source={{ uri: directUrl }} style={styles.thumbImage} contentFit="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Ionicons name="diamond-outline" size={26} color={isDark ? '#fbbf24' : '#0284c7'} />
                    </View>
                  )}
                </View>
                {isPledged && loanNum && (
                  <View style={styles.loanBox}>
                    <Text style={styles.loanLabel}>Loan:</Text>
                    <Text style={styles.loanVal}>{loanNum}</Text>
                  </View>
                )}
              </View>

              {/* Center Details */}
              <View style={styles.cardCenterCol}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.listCardTitle} numberOfLines={1}>{orn.OrnamentName}</Text>
                  <OrnamentStatusBadge status={orn.Status} isDark={isDark} variant="badge" />
                </View>

                <Text style={styles.cardIdText}>{orn.OrnamentId}</Text>

                <View style={styles.specsRow}>
                  <Text style={styles.specsText}>{orn.Purity || '-'}  •  {orn.OrnamentType || '-'}  •  </Text>
                  <OrnamentIcon name="shield-check" size={12} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 3 }} />
                  <Text style={styles.specsText}>BIS Hallmark</Text>
                </View>

                <View style={styles.cardStatsRow}>
                  <View style={styles.statGroup}>
                    <OrnamentIcon name="moneybag" size={14} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 4 }} />
                    <Text style={styles.statWeightText}>{weightVal} g</Text>
                  </View>
                  <View style={styles.statGroup}>
                    <OrnamentIcon name="rupee-circle" size={14} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 2 }} />
                    <Text style={styles.statPriceText}>{priceVal}</Text>
                  </View>
                </View>
              </View>

              {/* Right Chevron */}
              <View style={styles.cardRightCol}>
                <UserIcon name="arrow-right" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
        <View style={styles.emptyContainer}>
              <Ionicons name="diamond-outline" size={42} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No ornaments found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or status filter</Text>
            </View>
        }
      />

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={[styles.fabBtn, { bottom: 20 }]}
        onPress={onAdd}
        activeOpacity={0.85}
        accessibilityLabel="Add ornament"
      >
        <OrnamentIcon name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      <OptionPickerModal
        visible={sortModalVisible}
        title="Sort By"
        options={ORNAMENT_SORT_OPTIONS}
        selectedValue={sortOption}
        onSelect={(opt) => { setSortOption(opt); setSortModalVisible(false); }}
        onClose={() => setSortModalVisible(false)}
        isDark={isDark}
        secondaryTextColor={colors.textSecondary}
      />
    </SafeAreaView>
  );
}
