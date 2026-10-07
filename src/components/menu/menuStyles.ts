import { Platform, StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/theme';

export const getMenuStyles = (colors: ThemeColors, isDark: boolean, isDesktop: boolean) =>
StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : '#ffffff',
  },

  // ─── Fixed Header Bar (Pinned to the top) ───
  fixedHeaderWrapper: {
    backgroundColor: isDark ? '#000000' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
    zIndex: 10,
    width: '100%',
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    maxWidth: isDesktop ? 680 : undefined,
    alignSelf: 'center',
  },
  backBtn: {
    marginRight: 14,
    padding: 4,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ─── Scroll Container (No bottom gap) ───
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20, // Tight bottom padding; removes awkward bottom gap
  },
  viewContainer: {
    width: '100%',
    maxWidth: isDesktop ? 680 : undefined,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },

  // ─── User Profile Card ───
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: isDark ? '#1e293b' : '#f0f7ff',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    marginBottom: 20,
  },
  userAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: isDark ? '#334155' : '#cbd5e1',
    marginRight: 14,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // ─── Sections ───
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuItemsGroup: {
    gap: 10,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ─── Logout Card Item ───
  logoutCard: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
  },
  logoutIconBox: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
  },

  // ─── Reports Screen Styles ───
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  reportMetricCard: {
    width: isDesktop ? '23.5%' : '48%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  reportMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  reportMetricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  statusBarsList: {
    gap: 12,
  },
  statusBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusNameLabel: {
    width: 72,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusCountVal: {
    width: 28,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bankExposureList: {
    gap: 12,
  },
  bankExposureItem: {
    gap: 6,
  },
  bankExposureLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  bankAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bankBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    overflow: 'hidden',
  },
  bankBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#0284c7',
  },
  emptyNoticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 12,
    textAlign: 'center',
  },

  // ─── Gold Rates View Styles ───
  goldRateStack: {
    gap: 12,
    marginBottom: 20,
  },
  goldRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  goldRateCard22k: {
    backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
    borderColor: '#0284c7',
    borderWidth: 1.5,
  },
  goldKaratBadge: {
    width: 44,
    height: 38,
    borderRadius: 10,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  goldKaratBadge22k: {
    backgroundColor: isDark ? '#0369a1' : '#e0f2fe',
  },
  goldKaratBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  goldKaratBadgeText22k: {
    color: isDark ? '#38bdf8' : '#0284c7',
  },
  goldRateMainCol: {
    flex: 1,
  },
  goldPriceGram: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  goldPerGram: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  goldSubDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goldTenGramCol: {
    alignItems: 'flex-end',
  },
  goldTenGramWeight: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  goldTenGramPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  refreshRatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    marginBottom: 16,
  },
  refreshRatesBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  goldRatesFooterNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },

  // ─── Settings View Styles ───
  settingsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  remindSegmentContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    gap: 12,
  },
  remindSegmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
  },
  segmentBtnSelected: {
    backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
    borderColor: '#0284c7',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentBtnTextSelected: {
    color: isDark ? '#38bdf8' : '#0284c7',
  },

  // ─── Help & Support Styles ───
  faqListContainer: {
    gap: 10,
  },
  faqItemWrapper: {
    borderRadius: 14,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  faqAnswerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ─── About View Styles ───
  aboutContentCentered: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  aboutCoinEmblem: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: isDark ? '#382504' : '#fef3c7',
    borderWidth: 4,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutAppTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? '#38bdf8' : '#0284c7',
    marginBottom: 6,
  },
  aboutVersionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  aboutDescriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },

  // ─── Logout Modal Dialog Styles (Image 1 Right) ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalBadgeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDialogTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDialogMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  modalInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? '#0c223a' : '#f0f9ff',
    borderColor: isDark ? '#0369a1' : '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  modalInfoBannerText: {
    flex: 1,
    fontSize: 12,
    color: isDark ? '#38bdf8' : '#0369a1',
    lineHeight: 16,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalLogoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export type MenuStyles = ReturnType<typeof getMenuStyles>;
