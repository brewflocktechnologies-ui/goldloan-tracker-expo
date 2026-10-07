import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/theme';

export const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  screensWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ─── GLOBAL TOP NAVIGATION BAR ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  topBarDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  topBarTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 160,
  },
  topBarTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ─── MOBILE TOP BAR BRANDING ───
  mobileTopBarBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mobileBrandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
  },
  mobileBrandTextWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mobileBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  mobileBrandSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : colors.primarySubtle,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fde68a',
    flexShrink: 0,
  },
  refreshActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarSuper: {
    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5',
    borderWidth: 1,
    borderColor: isDark ? '#059669' : '#10b981',
  },
  profileAvatarUser: {
    backgroundColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#fffbeb',
    borderWidth: 1,
    borderColor: isDark ? '#d97706' : '#f59e0b',
  },
  profileAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileAvatarTextSuper: {
    color: isDark ? '#34d399' : '#059669',
  },
  profileAvatarTextUser: {
    color: isDark ? '#fbbf24' : '#b45309',
  },
  profileTextWrapper: {
    marginRight: 4,
  },
  profileUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileRoleTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleSuperText: {
    color: isDark ? '#34d399' : '#059669',
  },
  roleUserText: {
    color: isDark ? '#fbbf24' : '#b45309',
  },

  // ─── DESKTOP SIDEBAR ───
  desktopSidebar: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopSidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  desktopBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  desktopBrandTextWrapper: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginLeft: 10,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    position: 'relative',
    minHeight: 42,
    overflow: 'hidden',
    width: '100%',
  },
  desktopNavIconBox: {
    width: 52,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  desktopNavTextWrapper: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    paddingRight: 8,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brandSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // ─── NAV ITEMS ───
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: isDark ? '#261a02' : colors.primarySubtle,
  },
  activePillIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: isDark ? '#f59e0b' : colors.primaryDark,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  navTextActive: {
    color: isDark ? '#fbbf24' : colors.primaryDark,
    fontWeight: '800',
  },

  // ─── SIDEBAR FOOTER ───
  sidebarFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  goldTickerCard: {
    backgroundColor: isDark ? '#1e293b' : '#fefce8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginBottom: 10,
  },
  tickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  tickerRate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  tickerUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  collapseFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  collapseFooterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  expandRailBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // ─── MOBILE BOTTOM NAVIGATION (WhatsApp / YouTube style) ───
  mobileBottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 20,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    minWidth: 0,
  },
  bottomNavIconWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIconWrapperActive: {
    backgroundColor: 'transparent',
  },
  bottomNavText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  bottomNavTextActive: {
    fontWeight: '800',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  activeTabUnderline: {
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: isDark ? '#fbbf24' : colors.primaryDark,
    marginTop: 3,
  },
  inactiveTabUnderline: {
    backgroundColor: 'transparent',
  },
});
