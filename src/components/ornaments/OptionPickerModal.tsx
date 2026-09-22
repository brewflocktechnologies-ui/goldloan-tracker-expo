import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (option: string) => void;
  onClose: () => void;
  isDark: boolean;
  secondaryTextColor: string;
}

export function OptionPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  isDark,
  secondaryTextColor,
}: OptionPickerModalProps) {
  const styles = getStyles(isDark);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerBox}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {options.map(opt => (
              <TouchableOpacity key={opt} style={styles.pickerItem} onPress={() => onSelect(opt)}>
                <Text style={styles.pickerItemText}>{opt}</Text>
                {selectedValue === opt && <Ionicons name="checkmark" size={18} color="#0284c7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  pickerTitle: { fontSize: 15, fontWeight: '800', color: isDark ? '#f8fafc' : '#0d172a' },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f8fafc',
  },
  pickerItemText: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },
});
