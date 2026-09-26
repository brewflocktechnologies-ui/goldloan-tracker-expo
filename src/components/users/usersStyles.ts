import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export const getUsersStyles = (colors: ThemeColors, isDark: boolean, isSmall: boolean = false, isCompact: boolean = false) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#d8edfa',
    },
    subScreenContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    content: {
      paddingHorizontal: isSmall ? 12 : 16,
      paddingTop: 16,
      paddingBottom: 16,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },
    detailScrollContent: {
      paddingHorizontal: isSmall ? 12 : 16,
      paddingTop: 14,
      paddingBottom: 20,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    },

    // Header (Top Section)
    listTopSection: {
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      paddingHorizontal: 16,
      paddingTop: isCompact ? 4 : 10,
      paddingBottom: 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isCompact ? 8 : 16,
      paddingTop: 4,
    },
    headerLeft: {
      flex: 1,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      letterSpacing: -0.4,
    },
    screenSubtitle: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#475569',
      marginTop: 2,
    },
    headerRight: {
      alignItems: 'flex-end',
      paddingLeft: 10,
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#334155',
    },
    totalNumber: {
      fontSize: 30,
      fontWeight: '800',
      color: '#0284c7',
      marginTop: -2,
    },

    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 14 : 10,
      paddingBottom: 12,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#bfe0f2',
    },
    headerBackBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerTitles: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },

    // Search & Filter Card (matches Ornaments & Blueprint)
    searchCardWrapper: {
      position: 'relative',
      paddingTop: 4,
      paddingBottom: 10,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#0f172a' : '#d8edfa',
    },
    sheetBackground: {
      position: 'absolute',
      top: isCompact ? 52 : 64,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },
    searchFilterCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 20,
      padding: isCompact ? 10 : 14,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.8)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isCompact ? 8 : 12,
    },
    boxySearchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      height: isCompact ? 44 : 52,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 8,
    },
    clearBtn: {
      padding: 4,
      marginRight: 2,
    },
    filterIconBtn: {
      padding: 8,
      marginLeft: 10,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterIconBtnActive: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    },

    // Filter Pills
    filterPillsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexGrow: 1,
      paddingVertical: 2,
    },
    filterPill: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
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

    // Customer Cards List
    cardsScrollContainer: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    cardsScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: isDark ? '#090d16' : '#ffffff',
    },
    cardsList: {
      gap: isCompact ? 8 : 12,
    },
    listCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e8ecf4',
      paddingHorizontal: 16,
      paddingVertical: isCompact ? 10 : 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 1.5,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTopLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
      marginRight: 12,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitialsBox: {
      width: '100%',
      height: '100%',
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitialsText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cardIdentityCol: {
      justifyContent: 'center',
      flex: 1,
    },
    listCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    cardIdText: {
      fontSize: 12.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    cardTopRight: {
      alignSelf: 'flex-start',
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: isCompact ? 10 : 14,
    },
    cardBottomLeftCol: {
      gap: 7,
      flex: 1,
      justifyContent: 'center',
    },
    cardInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardInfoIcon: {
      marginRight: 7,
    },
    cardPhoneText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    cardLastActiveText: {
      fontSize: 12,
      fontWeight: '400',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    cardBottomRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    cardStatsCol: {
      gap: 7,
      alignItems: 'flex-start',
    },
    cardStatRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardStatIcon: {
      marginRight: 6,
    },
    goldBarIcon: {
      width: 17,
      height: 13,
      marginRight: 6,
    },
    cardStatText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#1e293b',
    },
    cardChevronIcon: {
      marginLeft: 14,
    },

    // Hero Card in Customer Details
    heroCard: {
      backgroundColor: isDark ? '#0f172a' : '#e0f2fe',
      borderRadius: 22,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#bae6fd',
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 4,
    },
    heroAvatarWrapper: {
      position: 'relative',
      width: 74,
      height: 74,
    },
    heroAvatarImage: {
      width: 74,
      height: 74,
      borderRadius: 37,
    },
    heroAvatarInitialsBox: {
      width: 74,
      height: 74,
      borderRadius: 37,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatarInitialsText: {
      fontSize: 24,
      fontWeight: '800',
    },
    heroCameraBadge: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    heroInfoCol: {
      flex: 1,
      justifyContent: 'center',
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 3,
    },
    heroName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      flex: 1,
    },
    heroCodeText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    heroDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    heroDetailIcon: {
      marginRight: 1,
    },
    heroDetailText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    heroActionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
    },
    heroActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      height: 42,
      borderWidth: 1.5,
      borderColor: isDark ? '#059669' : '#10b981',
      ...Platform.select({
        ios: {
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    heroActionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#34d399' : '#10b981',
    },

    // Tabs Underline Switcher
    tabsSegmentContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    tabSegmentBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    tabSegmentBtnActive: {},
    tabSegmentText: {
      fontSize: 13.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    tabSegmentTextActive: {
      color: '#0284c7',
      fontWeight: '700',
    },
    activeTabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 10,
      right: 10,
      height: 3,
      backgroundColor: '#0284c7',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    tabContentArea: {
      gap: 0,
    },

    // Profile Flat Sections (No card, heading with underline and content below)
    profileSection: {
      marginBottom: 20,
    },
    profileSectionLast: {
      marginBottom: 0,
    },
    profileHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileSectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginLeft: 10,
    },
    profileDivider: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#e5e7eb',
      marginTop: 10,
      marginBottom: 14,
    },
    profileRowsList: {
      gap: 6,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 28,
      paddingVertical: 4,
    },
    profileRowLabel: {
      width: 170,
      fontSize: 13.5,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    profileRowValueContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profileRowValueText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    privacyEyeBtn: {
      padding: 4,
      marginLeft: 8,
    },
    profileStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },

    // Common Cards & Key-Value Lists
    card: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    keyValList: {
      gap: 10,
    },
    keyValRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#f8fafc',
    },
    keyText: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      flex: 1,
    },
    valText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
      textAlign: 'right',
      flex: 1.2,
    },

    // Bank Accounts Tab Styles
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    bankCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    bankCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bankNameCol: {
      gap: 2,
    },
    bankNameTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    bankAccountType: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    bankBranchText: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    bankInfoGrid: {
      gap: 8,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      marginBottom: 12,
    },
    bankInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankInfoLabel: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    bankInfoValue: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    bankLimitBox: {
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    bankLimitAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    bankUtilizedBigText: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0284c7',
    },
    bankPercentText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#0284c7',
      borderRadius: 4,
    },
    limitColumnsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    limitCol: {
      flex: 1,
    },
    limitColLabel: {
      fontSize: 10.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 2,
    },
    limitColVal: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },

    // Loans Tab Styles
    loanCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    loanCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    loanNumberTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0d172a',
    },
    loanDateText: {
      fontSize: 11.5,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },
    loanStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    loanStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    loanStatusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    loanMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      marginBottom: 12,
    },
    loanMetricCol: {
      flex: 1,
    },
    loanMetricLabel: {
      fontSize: 11,
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 3,
    },
    loanMetricVal: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    duePillBadge: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    duePillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    loanOrnamentsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    ornThumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ornThumbBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? '#0f172a' : '#fef3c7',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    ornCountMiniBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: '#0284c7',
      borderRadius: 6,
      paddingHorizontal: 3,
      paddingVertical: 1,
    },
    ornCountMiniBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: '#ffffff',
    },
    ornCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    ornWeightText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#d97706',
    },
    interestRateTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
    },
    interestRateText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#0284c7',
    },
    viewLoanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      gap: 4,
    },
    viewLoanBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#0284c7',
    },
    loanFabBtn: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
        } as any,
      }),
    },

    // Add / Edit Screen Styles
    photoUploadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#e0f2fe',
      borderRadius: 22,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#bae6fd',
      gap: 16,
    },
    photoAvatarPreviewBox: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photoAvatarImage: {
      width: '100%',
      height: '100%',
    },
    photoUploadInfoCol: {
      flex: 1,
      justifyContent: 'center',
    },
    photoUploadTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      marginBottom: 2,
    },
    photoUploadSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 10,
    },
    photoButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    photoActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1.5,
      borderColor: '#0284c7',
    },
    photoActionBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0284c7',
    },

    // Form Inputs
    twoColRow: {
      flexDirection: 'row',
      gap: 10,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      marginBottom: 6,
    },
    requiredStar: {
      color: '#ef4444',
    },
    textInput: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    inputWithIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      height: 44,
    },
    inputLeadingIcon: {
      marginRight: 8,
    },
    inputWithIcon: {
      flex: 1,
      height: '100%',
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 0,
    },
    inputWithIconText: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '500',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    inputPlaceholderText: {
      color: isDark ? '#64748b' : '#94a3b8',
      fontWeight: '400',
    },
    prefixSuffixBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 10,
      height: 44,
    },
    mobilePrefixGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 8,
    },
    prefixDivider: {
      width: 1,
      height: 22,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      marginRight: 10,
    },
    prefixText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    prefixInput: {
      flex: 1,
      height: '100%',
      fontSize: 13.5,
      color: isDark ? '#f8fafc' : '#0f172a',
      paddingVertical: 0,
    },
    dropdownInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    dropdownValue: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    genderSelectRow: {
      flexDirection: 'row',
      gap: 10,
    },
    genderSelectBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 42,
      borderRadius: 12,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    genderSelectBtnActive: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
      borderColor: '#0284c7',
      borderWidth: 1.5,
    },
    genderSelectText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    genderSelectTextActive: {
      color: isDark ? '#38bdf8' : '#0f172a',
      fontWeight: '700',
    },
    submitBtn: {
      backgroundColor: '#0284c7',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      marginBottom: 0,
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Floating Action Button
    fabBtn: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0284c7',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 13,
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 4,
      textAlign: 'center',
    },
  });

/** Themed Users-screen styles shared by the list, details and form views. */
export function useUsersStyles() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmall = width < 460;
  // Short phones only fit ~2 cards under the header, so tighten the vertical spacing there.
  const isCompact = height < 700;
  const styles = useMemo(
    () => getUsersStyles(colors, isDark, isSmall, isCompact),
    [colors, isDark, isSmall, isCompact]
  );
  return { styles, colors, isDark };
}
