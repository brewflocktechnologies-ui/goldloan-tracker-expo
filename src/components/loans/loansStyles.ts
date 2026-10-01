import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/theme';

export const getLoansStyles = (
  colors: ThemeColors,
  isDark: boolean,
  isSmall: boolean = false,
  isCompact: boolean = false
) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#d8edfa',
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },

    // ─── TOP HERO HEADER (Light Blue background matching screenshot) ───
    heroSection: {
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 2,
    },
    heroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isCompact ? 4 : 8,
    },
    heroLeft: {
      flex: 1,
      paddingRight: 12,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      letterSpacing: -0.4,
    },
    heroSubtitle: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#475569',
      marginTop: 1,
    },
    heroRight: {
      alignItems: 'flex-end',
      paddingLeft: 8,
    },
    totalLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#1e293b',
    },
    totalNumber: {
      fontSize: 24,
      fontWeight: '800',
      color: '#0284c7',
      marginTop: -2,
    },

    // ─── SEARCH & FILTER CARD WITH CURVED TRANSITION ───
    searchCardWrapper: {
      position: 'relative',
      paddingTop: 2,
      paddingBottom: 6,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
    },
    sheetBackground: {
      position: 'absolute',
      top: isCompact ? 44 : 54,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    searchFilterCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      padding: isCompact ? 8 : 10,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.85)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      height: isCompact ? 40 : 46,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 0,
    },
    clearBtn: {
      padding: 4,
    },

    // ─── FILTER PILLS ───
    filterPillsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isCompact ? 6 : 8,
      gap: 8,
      flexGrow: 1,
      paddingVertical: 2,
    },
    filterPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    },
    filterPillActive: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7',
    },
    filterPillText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    filterPillTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // ─── CARD LIST ───
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 90,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },

    // ─── LOAN CARD ───
    card: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#f0f3f6',
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    // Card Row 1: Loan # + Badge + Kebab Menu
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeftPillGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    loanNumber: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3.5,
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 12,
    },
    badgeOverdue: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fee4e2',
    },
    badgeActive: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7',
    },
    badgeClosed: {
      backgroundColor: isDark ? 'rgba(100, 116, 139, 0.18)' : '#f1f5f9',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgeTextOverdue: {
      color: '#d92d20',
    },
    badgeTextActive: {
      color: '#16a34a',
    },
    badgeTextClosed: {
      color: '#64748b',
    },
    menuTrigger: {
      padding: 4,
      marginRight: -4,
    },

    // Card Row 2: Customer Name + Phone
    customerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    customerName: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#e2e8f0' : '#334155',
      flex: 1,
      marginRight: 8,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    phoneText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#475569',
    },

    // Card Row 3: 3-Column Metrics
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 10,
      marginBottom: 10,
    },
    metricCol: {
      flex: 1,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    metricValueAmount: {
      fontSize: 14.5,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 3,
      letterSpacing: -0.2,
    },
    metricValueOutstanding: {
      fontSize: 14.5,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 3,
      letterSpacing: -0.2,
    },
    metricValueDate: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 3,
      letterSpacing: -0.1,
    },

    // Divider Line
    cardDivider: {
      height: 1,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      marginBottom: 8,
    },

    // Card Row 4: Bank/Ornaments + Status
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      marginRight: 8,
    },
    bankText: {
      fontSize: 11.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    statusText: {
      fontSize: 11.5,
      fontWeight: '700',
      flexShrink: 0,
    },
    statusTextOverdue: {
      color: '#d92d20',
    },
    statusTextUrgent: {
      color: '#b45309',
    },
    statusTextNormal: {
      color: '#16a34a',
    },
    statusTextClosed: {
      color: '#64748b',
    },

    // ─── FLOATING ACTION BUTTON (FAB) ───
    fabButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#0077c8',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0077c8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 99,
    },

    // ─── EMPTY STATE ───
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginTop: 12,
    },
    emptySub: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      marginTop: 4,
    },
  });
