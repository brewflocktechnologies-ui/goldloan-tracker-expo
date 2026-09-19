import { Skeleton } from './Skeleton';
import { MobileCardSkeleton } from './MobileCard';
import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, LayoutChangeEvent, useWindowDimensions 
} from 'react-native';
import { Colors, ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export interface Column<T> {
  key: string;
  title: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface FilterChipItem {
  label: string;
  value: string;
  count?: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  onAddPress?: () => void;
  addButtonLabel?: string;
  title?: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  isLoading?: boolean;
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  filterChips?: FilterChipItem[];
  activeFilter?: string;
  onFilterChange?: (filterValue: string) => void;
  customFilterPredicate?: (item: T, filterValue: string) => boolean;
  forceTableView?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFilter,
  onAddPress,
  addButtonLabel = 'Add New',
  title,
  subtitle,
  headerLeft,
  isLoading = false,
  renderMobileCard,
  filterChips,
  activeFilter,
  onFilterChange,
  customFilterPredicate,
  forceTableView = false,
}: DataTableProps<T>) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768;
  const isMobile = !isDesktop;
  const showTableView = !isMobile || forceTableView;
  const styles = getStyles(colors, isDark);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [wrapperWidth, setWrapperWidth] = useState(0);

  const [internalFilter, setInternalFilter] = useState(filterChips?.[0]?.value || 'All');
  const currentFilter = activeFilter !== undefined ? activeFilter : internalFilter;

  const handleFilterChange = (val: string) => {
    if (activeFilter === undefined) {
      setInternalFilter(val);
    }
    onFilterChange?.(val);
    setPage(1);
  };

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(item => {
      // Status filter check
      if (customFilterPredicate && currentFilter && currentFilter !== 'All') {
        if (!customFilterPredicate(item, currentFilter)) {
          return false;
        }
      }

      // Search filter check
      if (!q) return true;
      if (searchFilter) {
        return searchFilter(item, q);
      }
      return Object.values(item as any).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }, [data, search, currentFilter, customFilterPredicate, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = filteredData.slice(startIdx, startIdx + pageSize);

  // Measure container layout to guarantee full width
  const handleWrapperLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && Math.abs(w - wrapperWidth) > 1) {
      setWrapperWidth(w);
    }
  };

  // Base sum of column widths
  const totalBaseWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || 120), 0);
  }, [columns]);

  // Available container width
  const effectiveContainerWidth = useMemo(() => {
    return wrapperWidth > 0 ? wrapperWidth : (screenWidth >= 768 ? Math.max(0, screenWidth - 280) : totalBaseWidth);
  }, [wrapperWidth, screenWidth, totalBaseWidth]);

  // Scaled column widths: if container is wider than totalBaseWidth, stretch columns to 100% full width
  const effectiveColWidths = useMemo(() => {
    const targetWidth = Math.max(effectiveContainerWidth, totalBaseWidth);
    if (!targetWidth || targetWidth <= totalBaseWidth) {
      return columns.map(col => col.width || 120);
    }
    const scale = targetWidth / totalBaseWidth;
    let accumulated = 0;
    return columns.map((col, idx) => {
      const baseW = col.width || 120;
      if (idx === columns.length - 1) {
        return Math.max(baseW, targetWidth - accumulated);
      }
      const scaled = Math.floor(baseW * scale);
      accumulated += scaled;
      return scaled;
    });
  }, [columns, effectiveContainerWidth, totalBaseWidth]);

  // Effective table total width (always stretches to fill container on desktop)
  const tableContentWidth = useMemo(() => {
    return Math.max(effectiveContainerWidth, totalBaseWidth);
  }, [effectiveContainerWidth, totalBaseWidth]);

  const isScrollable = effectiveContainerWidth > 0 && totalBaseWidth > effectiveContainerWidth;

  const renderFilterChips = () => {
    if (!filterChips || filterChips.length === 0) return null;
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipScroll}
      >
        {filterChips.map((chip) => {
          const isSelected = chip.value === currentFilter;
          return (
            <TouchableOpacity
              key={chip.value}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => handleFilterChange(chip.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {chip.label}
              </Text>
              {chip.count !== undefined ? (
                <View style={[styles.filterBadge, isSelected && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isSelected && styles.filterBadgeTextActive]}>
                    {chip.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Optional Top Header Row (Only if title or headerLeft is explicitly provided) */}
      {(title || headerLeft) ? (
        <View style={styles.topHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            {headerLeft}
            <View style={styles.titleWrapper}>
              {title ? <Text style={styles.sectionTitle} numberOfLines={1}>{title}</Text> : null}
              {subtitle ? <Text style={styles.sectionSub} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* Toolbar: Page size + Full-width Search + Add Button */}
      <View style={[styles.toolbar, !isDesktop && styles.toolbarMobile]}>
        {isDesktop ? (
          <>
            <View style={styles.desktopTopRow}>
              <View style={styles.pageSizeBox}>
                <Text style={styles.toolLabel}>Show</Text>
                {[5, 10, 20].map(sz => (
                  <TouchableOpacity
                    key={sz}
                    style={[styles.sizeBtn, pageSize === sz && styles.sizeBtnActive]}
                    onPress={() => { setPageSize(sz); setPage(1); }}
                  >
                    <Text style={[styles.sizeBtnText, pageSize === sz && styles.sizeBtnTextActive]}>
                      {sz}
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.toolLabel}>entries</Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  value={search}
                  onChangeText={t => { setSearch(t); setPage(1); }}
                />
                {search ? (
                  <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {onAddPress ? (
                <TouchableOpacity style={styles.addBtn} onPress={onAddPress} activeOpacity={0.8}>
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.addBtnText}>{addButtonLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {filterChips && filterChips.length > 0 && (
              <View style={styles.desktopFilterRow}>
                {renderFilterChips()}
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.toolbarMobileTopRow}>
              <View style={[styles.searchBox, { flex: 1, minWidth: 0 }]}>
                <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  value={search}
                  onChangeText={t => { setSearch(t); setPage(1); }}
                />
                {search ? (
                  <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {onAddPress ? (
                <TouchableOpacity style={styles.addBtn} onPress={onAddPress} activeOpacity={0.8}>
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.addBtnText}>{addButtonLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {filterChips && filterChips.length > 0 && (
              <View style={styles.mobileFilterWrapper}>
                {renderFilterChips()}
              </View>
            )}

            <View style={styles.mobileMetaRow}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {filteredData.length} {filteredData.length === 1 ? 'record found' : 'records found'}
                </Text>
              </View>

              <View style={styles.pageSizeBox}>
                <Text style={styles.toolLabel}>Show</Text>
                {[5, 10, 20].map(sz => (
                  <TouchableOpacity
                    key={sz}
                    style={[styles.sizeBtn, pageSize === sz && styles.sizeBtnActive]}
                    onPress={() => { setPageSize(sz); setPage(1); }}
                  >
                    <Text style={[styles.sizeBtnText, pageSize === sz && styles.sizeBtnTextActive]}>
                      {sz}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>

      {/* A horizontal table is displayed on desktop or when forced on mobile */}
      {showTableView && isScrollable && (
        <View style={styles.scrollHintBar}>
          <Ionicons name="swap-horizontal" size={13} color={Colors.primaryDark} />
          <Text style={styles.scrollHintText}>
            Scroll sideways to view all {columns.length} columns
          </Text>
        </View>
      )}

      {!showTableView ? (
        <View style={styles.mobileRecords}>
          {isLoading && data.length === 0 ? (
            Array.from({ length: 3 }).map((_, rowIndex) => (
              <MobileCardSkeleton key={`mobile_skeleton_${rowIndex}`} />
            ))
          ) : pageData.length === 0 ? (
            <View style={styles.mobileEmptyRow}>
              <Ionicons name="search-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySub}>
                {search || (currentFilter && currentFilter !== 'All')
                  ? 'No results matched your search or filters.'
                  : 'No entries available in this list.'}
              </Text>
              {(search || (currentFilter && currentFilter !== 'All')) ? (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setSearch('');
                    handleFilterChange(filterChips?.[0]?.value || 'All');
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.primaryDark} />
                  <Text style={styles.clearFilterText}>Reset Filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            pageData.map((item, rowIndex) => (
              renderMobileCard ? (
                <React.Fragment key={keyExtractor(item)}>
                  {renderMobileCard(item, rowIndex)}
                </React.Fragment>
              ) : (
                <View key={keyExtractor(item)} style={styles.mobileCard}>
                  {columns.map((col, colIndex) => (
                    <View
                      key={`${col.key}_${colIndex}`}
                      style={[
                        styles.mobileField,
                        colIndex === columns.length - 1 && styles.mobileFieldLast,
                      ]}
                    >
                      <Text style={styles.mobileFieldLabel}>{col.title}</Text>
                      <View style={[
                        styles.mobileFieldValue,
                        col.align === 'center' && styles.mobileFieldValueCenter,
                        col.align === 'right' && styles.mobileFieldValueRight,
                      ]}>
                        {col.render ? (
                          col.render(item, rowIndex)
                        ) : (
                          <Text style={styles.tdText} numberOfLines={2}>
                            {(item as any)[col.key] !== undefined && (item as any)[col.key] !== null
                              ? String((item as any)[col.key])
                              : '—'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )
            ))
          )}
        </View>
      ) : (
        <View style={styles.tableWrapper} onLayout={handleWrapperLayout}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={{ width: '100%' }}
            contentContainerStyle={{ width: '100%', minWidth: tableContentWidth, flexGrow: 1 }}
          >
            <View style={{ width: '100%', minWidth: tableContentWidth, flex: 1 }}>
            {/* Header Row */}
            <View style={[styles.headerRow, { width: tableContentWidth, minWidth: '100%' }]}>
              {columns.map((col, idx) => (
                <View 
                  key={`${col.key}_${idx}`} 
                  style={[
                    styles.th, 
                    { width: effectiveColWidths[idx] },
                    col.align === 'center' && { alignItems: 'center' },
                    col.align === 'right' && { alignItems: 'flex-end' },
                  ]}
                >
                  <Text style={styles.thText}>{col.title}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {isLoading && data.length === 0 ? (
              // ─── SHIMMER SKELETON ROWS ───
              Array.from({ length: 5 }).map((_, rIdx) => (
                <View 
                  key={`skeleton_${rIdx}`} 
                  style={[styles.tr, rIdx % 2 !== 0 && styles.trAlt, { width: tableContentWidth, minWidth: '100%' }]}
                >
                  {columns.map((col, cIdx) => (
                    <View 
                      key={`skel_${cIdx}`} 
                      style={[
                        styles.td, 
                        { width: effectiveColWidths[cIdx] },
                        col.align === 'center' && { alignItems: 'center', justifyContent: 'center' },
                        col.align === 'right' && { alignItems: 'flex-end', justifyContent: 'center' },
                      ]}
                    >
                      <Skeleton width={Math.max(40, Math.round((col.width || 120) * 0.7))} height={16} borderRadius={4} />
                    </View>
                  ))}
                </View>
              ))
            ) : pageData.length === 0 ? (
              <View style={[styles.emptyRow, { width: tableContentWidth, minWidth: '100%' }]}>
                <Text style={styles.emptyText}>No records found.</Text>
              </View>
            ) : (
              pageData.map((item, rowIdx) => {
                const isEven = rowIdx % 2 === 0;
                return (
                  <View 
                    key={keyExtractor(item)} 
                    style={[
                      styles.tr, 
                      !isEven && styles.trAlt,
                      { width: tableContentWidth, minWidth: '100%' }
                    ]}
                  >
                    {columns.map((col, idx) => (
                      <View 
                        key={`${col.key}_${idx}`} 
                        style={[
                          styles.td, 
                          { width: effectiveColWidths[idx] },
                          col.align === 'center' && { alignItems: 'center', justifyContent: 'center' },
                          col.align === 'right' && { alignItems: 'flex-end', justifyContent: 'center' },
                        ]}
                      >
                        {col.render ? (
                          col.render(item, rowIdx)
                        ) : (
                          <Text style={styles.tdText} numberOfLines={1}>
                            {(item as any)[col.key] !== undefined && (item as any)[col.key] !== null 
                              ? String((item as any)[col.key]) 
                              : '—'}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Pagination Footer */}
      <View style={styles.paginationRow}>
        <Text style={styles.pageInfoText}>
          Showing {filteredData.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + pageSize, filteredData.length)} of {filteredData.length} entries
        </Text>

        <View style={styles.pageBtns}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => setPage(p => Math.max(1, p - 1))}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? colors.textMuted : colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.pageCurText}>{currentPage} / {totalPages}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? colors.textMuted : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#d97706' : colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    flexShrink: 0,
    shadowColor: '#ca8a04',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  desktopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  desktopFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 4,
  },
  toolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  toolbarMobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  mobileFilterWrapper: {
    width: '100%',
    paddingVertical: 2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 2,
  },
  filterChipScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pageSizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toolLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sizeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : colors.surface,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : colors.border,
  },
  sizeBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  sizeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sizeBtnTextActive: {
    color: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#090d16' : colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    minWidth: 160,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    fontSize: 12,
    color: colors.textPrimary,
    padding: 0,
    flex: 1,
  },
  clearBtn: {
    padding: 2,
  },
  scrollHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDark ? '#082f49' : '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#075985' : '#dbeafe',
  },
  scrollHintText: {
    fontSize: 11,
    color: isDark ? '#38bdf8' : colors.primaryDark,
    fontWeight: '600',
  },
  tableWrapper: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 120,
  },
  mobileRecords: {
    padding: 10,
    gap: 10,
    backgroundColor: isDark ? '#0a0f1d' : '#f8fafc',
  },
  mobileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mobileField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileFieldLast: {
    borderBottomWidth: 0,
  },
  mobileFieldLabel: {
    width: '37%',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  mobileFieldValue: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  mobileFieldValueCenter: {
    alignItems: 'center',
  },
  mobileFieldValueRight: {
    alignItems: 'flex-end',
  },
  mobileEmptyRow: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    maxWidth: 260,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    paddingHorizontal: 10,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#cbd5e1' : '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  trAlt: {
    backgroundColor: isDark ? '#0a0f1d' : '#fafbfc',
  },
  td: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  tdText: {
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  emptyRow: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageInfoText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pageBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: isDark ? '#1e293b' : colors.surface,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : colors.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageCurText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
