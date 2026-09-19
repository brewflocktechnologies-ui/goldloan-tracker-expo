import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/theme';
import { Skeleton } from './Skeleton';

export interface CardMetric {
  label: string;
  value: React.ReactNode;
  color?: string;
  highlighted?: boolean;
  fullWidth?: boolean;
}

export interface CardMenuAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDestructive?: boolean;
}

export interface MobileCardProps {
  onPress?: () => void;
  // Top Row
  identifier: React.ReactNode;
  badges?: React.ReactNode;
  // Title Row
  avatar?: React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  codeBadge?: string;
  // Metric Grid (compact 2-column)
  metrics: CardMetric[];
  // Bottom Row
  viewLabel?: string;
  onViewPress?: () => void;
  primaryAction?: React.ReactNode;
  menuActions?: CardMenuAction[];
}

export function MobileCard({
  onPress,
  identifier,
  badges,
  avatar,
  title,
  subtitle,
  codeBadge,
  metrics,
  viewLabel = 'View details',
  onViewPress,
  primaryAction,
  menuActions,
}: MobileCardProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleView = () => {
    if (onViewPress) {
      onViewPress();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {/* Top Row: Primary identifier on left & status badge on right */}
        <View style={styles.topRow}>
          <View style={styles.identifierBox}>
            {typeof identifier === 'string' ? (
              <Text style={styles.identifierText} numberOfLines={1}>
                {identifier}
              </Text>
            ) : (
              identifier
            )}
          </View>
          {badges ? <View style={styles.badgesBox}>{badges}</View> : null}
        </View>

        {/* Primary Name / Title Row */}
        <View style={styles.titleRow}>
          {avatar ? <View style={styles.avatarContainer}>{avatar}</View> : null}
          <View style={styles.titleContent}>
            <View style={styles.titleWithCode}>
              {typeof title === 'string' ? (
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {codeBadge ? (
                <View style={styles.subtleCodeBadge}>
                  <Text style={styles.subtleCodeText}>{codeBadge}</Text>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              typeof subtitle === 'string' ? (
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )
            ) : null}
          </View>
        </View>

        {/* Compact 2-Column Metric Grid */}
        {metrics.length > 0 && (
          <View style={styles.metricGrid}>
            {metrics.map((metric, idx) => (
              <View key={idx} style={[styles.metricCell, metric.fullWidth && styles.metricCellFull]}>
                <Text style={styles.metricLabel} numberOfLines={1}>
                  {metric.label}
                </Text>
                <View style={styles.metricValueWrapper}>
                  {typeof metric.value === 'string' || typeof metric.value === 'number' ? (
                    <Text
                      style={[
                        styles.metricValue,
                        metric.highlighted && styles.metricValueHighlighted,
                        metric.color ? { color: metric.color } : null,
                      ]}
                      numberOfLines={1}
                    >
                      {metric.value}
                    </Text>
                  ) : (
                    metric.value
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Row: Clear 'View details' affordance + quick action + secondary menu */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.viewAffordance}
            onPress={handleView}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.viewText}>{viewLabel}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primaryDark} />
          </TouchableOpacity>

          <View style={styles.rightActions}>
            {primaryAction ? (
              <View style={styles.primaryActionWrapper}>{primaryAction}</View>
            ) : null}

            {menuActions && menuActions.length > 0 && (
              <TouchableOpacity
                style={styles.overflowBtn}
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Overflow Action Menu Modal */}
      {menuActions && menuActions.length > 0 && (
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMenuVisible(false)}
          >
            <Pressable style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {typeof title === 'string' ? title : 'Actions'}
                </Text>
              </View>

              <View style={styles.sheetActionsList}>
                {menuActions.map((action, aIdx) => (
                  <TouchableOpacity
                    key={aIdx}
                    style={[
                      styles.sheetActionItem,
                      aIdx === menuActions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setMenuVisible(false);
                      action.onPress();
                    }}
                  >
                    {action.icon && (
                      <Ionicons
                        name={action.icon}
                        size={18}
                        color={action.isDestructive ? colors.danger : colors.textPrimary}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.sheetActionLabel,
                        action.isDestructive && { color: colors.danger },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

export function MobileCardSkeleton() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.card}>
      {/* Top row skeleton */}
      <View style={styles.topRow}>
        <Skeleton width={80} height={14} borderRadius={4} />
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>

      {/* Title row skeleton */}
      <View style={styles.titleRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width={130} height={16} borderRadius={4} />
          <Skeleton width={90} height={12} borderRadius={4} />
        </View>
      </View>

      {/* 2-column metric grid skeleton */}
      <View style={styles.metricGrid}>
        <View style={styles.metricCell}>
          <Skeleton width={50} height={10} borderRadius={3} />
          <Skeleton width={75} height={14} borderRadius={4} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={50} height={10} borderRadius={3} />
          <Skeleton width={75} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Bottom row skeleton */}
      <View style={styles.bottomRow}>
        <Skeleton width={90} height={14} borderRadius={4} />
        <Skeleton width={70} height={28} borderRadius={6} />
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    identifierBox: {
      flex: 1,
      marginRight: 8,
    },
    identifierText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryDark,
      letterSpacing: 0.3,
    },
    badgesBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatarContainer: {
      flexShrink: 0,
    },
    titleContent: {
      flex: 1,
      minWidth: 0,
    },
    titleWithCode: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    titleText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    subtleCodeBadge: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    subtleCodeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    subtitleText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#eef2f6',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    metricCell: {
      width: '50%',
      paddingVertical: 4,
      paddingHorizontal: 4,
      gap: 2,
    },
    metricCellFull: {
      width: '100%',
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    metricValueWrapper: {
      minHeight: 18,
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    metricValueHighlighted: {
      fontWeight: '700',
      color: colors.primaryDark,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    viewAffordance: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    viewText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryDark,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    primaryActionWrapper: {
      flexShrink: 0,
    },
    overflowBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheetContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#475569' : '#cbd5e1',
      alignSelf: 'center',
      marginBottom: 12,
    },
    sheetHeader: {
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 6,
    },
    sheetTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    sheetActionsList: {
      gap: 2,
      marginVertical: 4,
    },
    sheetActionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    sheetActionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sheetCancelBtn: {
      marginTop: 10,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    sheetCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
