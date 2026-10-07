import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/theme';

export const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: isDark ? '#090d16' : '#f7f7f7',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 580,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalBody: {
      padding: 16,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    cancelBtn: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveBtn: {
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: colors.primaryDark,
    },
    saveBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },

    // Form fields
    field: {
      marginBottom: 12,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceSubtle,
    },
    multilineInput: {
      height: 60,
      paddingTop: 8,
      textAlignVertical: 'top',
    },
    warnText: {
      fontSize: 12,
      color: colors.warning,
      fontStyle: 'italic',
      marginTop: 2,
    },
    userChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      marginRight: 8,
      marginTop: 4,
    },
    userChipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primaryDark,
    },
    userChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    userChipTextActive: {
      color: colors.primaryDark,
      fontWeight: '700',
    },
    ornSelectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      marginBottom: 6,
    },
    ornSelectRowActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primaryDark,
    },
    ornSelectTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    ornSelectSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    statusToggleRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
      height: 42,
    },
    statusBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
    },
    statusBtnActive: {
      backgroundColor: colors.primaryDark,
    },
    statusBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusBtnTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    calcBox: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
    },
    calcBoxTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    calcLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    calcVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
