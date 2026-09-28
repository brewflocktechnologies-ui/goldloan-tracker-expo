import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { parseDateString } from '../utils/userOrnamentCalculations';

interface DatePickerModalProps {
  visible: boolean;
  title?: string;
  value?: string; // DD/MM/YYYY or YYYY-MM-DD
  onConfirm: (dateStr: string) => void;
  onClose: () => void;
  isDark?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePickerModal({
  visible,
  title = 'Select Date of Birth',
  value,
  onConfirm,
  onClose,
  isDark = false,
}: DatePickerModalProps) {
  const currentYear = new Date().getFullYear();

  // State for currently selected date
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0-indexed (0 to 11)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear - 25);

  // View mode: 'calendar' (days grid) or 'year-month' (quick year & month picker)
  const [viewMode, setViewMode] = useState<'calendar' | 'year-month'>('calendar');

  // Initialize from value when modal becomes visible
  useEffect(() => {
    if (visible) {
      setViewMode('calendar');
      const parsed = parseDateString(value);
      if (parsed) {
        setSelectedDay(parsed.day);
        setSelectedMonth(parsed.month - 1);
        setSelectedYear(parsed.year);
      } else {
        // Default to reasonable adult birth year (~25 years ago)
        setSelectedDay(null);
        setSelectedMonth(0);
        setSelectedYear(currentYear - 25);
      }
    }
  }, [visible, value, currentYear]);

  // Days in month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 for Sunday

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(p => p - 1);
    } else {
      setSelectedMonth(p => p - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(p => p + 1);
    } else {
      setSelectedMonth(p => p + 1);
    }
  };

  const handleConfirm = () => {
    if (selectedDay) {
      const dd = String(selectedDay).padStart(2, '0');
      const mm = String(selectedMonth + 1).padStart(2, '0');
      onConfirm(`${dd}/${mm}/${selectedYear}`);
    }
    onClose();
  };

  const handleClear = () => {
    onConfirm('');
    onClose();
  };

  const styles = getStyles(isDark);

  // Generate list of selectable years (from 1930 to current year)
  const yearsList: number[] = [];
  for (let y = currentYear; y >= 1930; y--) {
    yearsList.push(y);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Ionicons name="calendar" size={20} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          {/* Current Selection Preview Badge */}
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>SELECTED DATE</Text>
            <Text style={styles.previewValue}>
              {selectedDay
                ? `${selectedDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                : 'Select a day from calendar'}
            </Text>
          </View>

          {/* Month / Year Navigator Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handlePrevMonth}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthYearSelectorBtn}
              onPress={() => setViewMode(p => (p === 'calendar' ? 'year-month' : 'calendar'))}
              activeOpacity={0.7}
            >
              <Text style={styles.monthYearText}>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>
              <Ionicons
                name={viewMode === 'year-month' ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#0284c7"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handleNextMonth}
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
          </View>

          {/* Mode 1: Month / Year Quick Selector Grid */}
          {viewMode === 'year-month' ? (
            <View style={styles.quickPickerContainer}>
              <Text style={styles.quickPickerSectionTitle}>Select Month</Text>
              <View style={styles.monthsGrid}>
                {SHORT_MONTHS.map((m, idx) => {
                  const isCurrent = selectedMonth === idx;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthGridItem, isCurrent && styles.monthGridItemActive]}
                      onPress={() => {
                        setSelectedMonth(idx);
                        setViewMode('calendar');
                      }}
                    >
                      <Text style={[styles.monthGridText, isCurrent && styles.monthGridTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.quickPickerSectionTitle, { marginTop: 12 }]}>Select Year</Text>
              <ScrollView
                style={styles.yearsScrollView}
                contentContainerStyle={styles.yearsScrollContent}
                showsVerticalScrollIndicator
              >
                {yearsList.map(y => {
                  const isCurrent = selectedYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearGridItem, isCurrent && styles.yearGridItemActive]}
                      onPress={() => {
                        setSelectedYear(y);
                        setViewMode('calendar');
                      }}
                    >
                      <Text style={[styles.yearGridText, isCurrent && styles.yearGridTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            /* Mode 2: Calendar Days Grid */
            <View style={styles.calendarContainer}>
              {/* Day of week headers */}
              <View style={styles.weekDaysRow}>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <View key={d} style={styles.weekDayCol}>
                    <Text
                      style={[
                        styles.weekDayText,
                        idx === 0 && { color: isDark ? '#f87171' : '#dc2626' }, // Sunday in red
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days grid */}
              <View style={styles.daysGrid}>
                {/* Empty cells for leading days */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCell} />
                ))}

                {/* Days in current month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  const isSunday = (firstDayOfWeek + idx) % 7 === 0;

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[styles.dayCell, isSelected && styles.dayCellActive]}
                      onPress={() => setSelectedDay(dayNum)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSunday && styles.sundayText,
                          isSelected && styles.dayTextActive,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Footer Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <View style={styles.footerRightButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, !selectedDay && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!selectedDay}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    previewBox: {
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#e0f2fe',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    previewLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: '#0284c7',
      marginBottom: 2,
    },
    previewValue: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginBottom: 8,
    },
    navArrowBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    monthYearSelectorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    monthYearText: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },

    // Mode 1: Quick Picker
    quickPickerContainer: {
      height: 250,
      paddingTop: 4,
    },
    quickPickerSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: 6,
    },
    monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    monthGridItem: {
      width: '23%',
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    monthGridItemActive: {
      backgroundColor: '#0284c7',
      borderColor: '#0284c7',
    },
    monthGridText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    monthGridTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    yearsScrollView: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 10,
    },
    yearsScrollContent: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      padding: 8,
    },
    yearGridItem: {
      width: '23%',
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    },
    yearGridItemActive: {
      backgroundColor: '#0284c7',
    },
    yearGridText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    yearGridTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // Mode 2: Calendar Day Grid
    calendarContainer: {
      minHeight: 250,
    },
    weekDaysRow: {
      flexDirection: 'row',
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
      paddingBottom: 4,
    },
    weekDayCol: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 1,
      borderRadius: 18,
    },
    dayCellActive: {
      backgroundColor: '#0284c7',
    },
    dayText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    sundayText: {
      color: isDark ? '#f87171' : '#dc2626',
    },
    dayTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // Footer
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    clearBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    clearBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    footerRightButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    confirmBtn: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: '#0284c7',
    },
    confirmBtnDisabled: {
      backgroundColor: isDark ? '#334155' : '#94a3b8',
    },
    confirmBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
}
