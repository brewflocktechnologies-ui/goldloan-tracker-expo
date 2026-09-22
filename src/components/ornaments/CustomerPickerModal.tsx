import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { User } from '../../types';

interface CustomerPickerModalProps {
  visible: boolean;
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedUserId: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
  isDark: boolean;
  secondaryTextColor: string;
  placeholderColor: string;
}

export function CustomerPickerModal({
  visible,
  users,
  searchQuery,
  onSearchChange,
  selectedUserId,
  onSelect,
  onClose,
  isDark,
  secondaryTextColor,
  placeholderColor,
}: CustomerPickerModalProps) {
  const styles = getStyles(isDark);

  const q = searchQuery.trim().toLowerCase();
  const filteredCustomers = !q
    ? users
    : users.filter(u => {
        const name = (u.FullName || '').toLowerCase();
        const id = (u.UserId || '').toLowerCase();
        const phone = (u.MobileNumber || '').toLowerCase();
        const city = (u.City || '').toLowerCase();
        return name.includes(q) || id.includes(q) || phone.includes(q) || city.includes(q);
      });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.pickerBox, { maxHeight: '80%' }]}>
          <View style={styles.pickerHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="people-outline" size={20} color="#0284c7" />
              <Text style={styles.pickerTitle}>Select Customer</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.customerSearchBox}>
            <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.customerSearchInput}
              placeholder="Search by name, phone or ID..."
              placeholderTextColor={placeholderColor}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.customerPickerItem, !selectedUserId && styles.customerSelectedRow]}
            onPress={() => onSelect('')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="remove-circle-outline" size={18} color="#64748b" />
              <Text style={[styles.pickerItemText, { color: '#64748b', fontStyle: 'italic' }]}>None (No Customer)</Text>
            </View>
            {!selectedUserId && <Ionicons name="checkmark" size={18} color="#0284c7" />}
          </TouchableOpacity>

          <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
            {filteredCustomers.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>No customers found</Text>
              </View>
            ) : (
              filteredCustomers.map(u => (
                <TouchableOpacity
                  key={u.UserId}
                  style={[styles.customerPickerItem, selectedUserId === u.UserId && styles.customerSelectedRow]}
                  onPress={() => onSelect(u.UserId)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerPickerName}>{u.FullName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <Text style={styles.customerPickerMeta}>ID: {u.UserId}</Text>
                      {u.MobileNumber ? <Text style={styles.customerPickerMeta}>• {u.MobileNumber}</Text> : null}
                      {u.City ? <Text style={styles.customerPickerMeta}>• {u.City}</Text> : null}
                    </View>
                  </View>
                  {selectedUserId === u.UserId && <Ionicons name="checkmark" size={18} color="#0284c7" />}
                </TouchableOpacity>
              ))
            )}
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
  pickerItemText: { fontSize: 13, fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' },
  customerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  customerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
    paddingVertical: 2,
  },
  customerPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  customerPickerName: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#f8fafc' : '#0d172a',
  },
  customerPickerMeta: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  customerSelectedRow: {
    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
  },
});
