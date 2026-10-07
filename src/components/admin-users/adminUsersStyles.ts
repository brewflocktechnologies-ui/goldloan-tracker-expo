import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/theme';

export const getStyles = (colors: ThemeColors, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: isDesktop ? 24 : 12,
      gap: isDesktop ? 16 : 10,
    },
    readOnlyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#e0f2fe',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 2,
    },
    readOnlyBannerText: {
      fontSize: 12.5,
      color: isDark ? '#38bdf8' : '#0369a1',
      flex: 1,
      lineHeight: 17,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: isDesktop ? 12 : 8,
      width: '100%',
    },
    idText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    usernameCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarMini: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? '#0369a1' : '#e0f2fe',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarMiniText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#e0f2fe' : '#0369a1',
    },
    usernameText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    selfBadge: {
      backgroundColor: isDark ? '#064e3b' : '#dcfce7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    selfBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: isDark ? '#34d399' : '#15803d',
    },
    roleCellBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9999,
      gap: 4,
      alignSelf: 'flex-start',
    },
    roleCellSuper: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
      borderColor: isDark ? '#059669' : '#a7f3d0',
      borderWidth: 1,
    },
    roleCellUser: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#f0f9ff',
      borderColor: isDark ? '#0284c7' : '#bae6fd',
      borderWidth: 1,
    },
    roleCellText: {
      fontSize: 11,
      fontWeight: '700',
    },
    roleTextSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    roleTextUser: {
      color: isDark ? '#38bdf8' : '#0369a1',
    },
    permText: {
      fontSize: 12,
      fontWeight: '500',
    },
    permSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    permUser: {
      color: isDark ? '#38bdf8' : '#0369a1',
    },
    actionBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconActionBtn: {
      padding: 6,
      borderRadius: 8,
    },
    cardAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardAvatarSuper: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#ecfdf5',
      borderWidth: 1.5,
      borderColor: isDark ? '#059669' : '#10b981',
    },
    cardAvatarUser: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#f0f9ff',
      borderWidth: 1.5,
      borderColor: isDark ? '#0284c7' : '#0ea5e9',
    },
    cardAvatarText: {
      fontSize: 13,
      fontWeight: '800',
    },
    cardAvatarTextSuper: {
      color: isDark ? '#34d399' : '#059669',
    },
    cardAvatarTextUser: {
      color: isDark ? '#38bdf8' : '#0369a1',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '85%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    modalErrorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450a0a' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? '#991b1b' : '#fecaca',
      padding: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    modalErrorText: {
      fontSize: 12,
      color: '#dc2626',
      fontWeight: '600',
      flex: 1,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    inputDisabled: {
      opacity: 0.6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    },
    helperText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    rolePickerRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 10,
    },
    roleChoiceCard: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    roleChoiceCardSelected: {
      borderColor: isDark ? '#38bdf8' : colors.primaryDark,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff',
    },
    choiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    choiceTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    choiceTitleSelected: {
      color: isDark ? '#38bdf8' : colors.primaryDark,
    },
    choiceDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    statusToggleRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statusToggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    statusToggleBtnActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    statusToggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusToggleTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    submitBtn: {
      backgroundColor: isDark ? '#0284c7' : colors.primaryDark,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 10,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
  });

export type AdminUsersStyles = ReturnType<typeof getStyles>;
