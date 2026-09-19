import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { User, GoldRateData } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function NewOrnamentScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const store = useAppStore();
  const users = store.users;
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    UserId: '',
    OrnamentName: '',
    OrnamentType: 'Necklace',
    Purity: '22K',
    GrossWeight: '',
    StoneWeight: '0',
    BuyingPricePerGram: '8115',
    CurrentPricePerGram: '8850',
    HallmarkNumber: '',
    Quantity: '1',
    Remarks: '',
  });

  useEffect(() => {
    if (!form.UserId && users[0]) setForm(p => ({ ...p, UserId: users[0].UserId }));
  }, [users, form.UserId]);

  const gross = parseFloat(form.GrossWeight) || 0;
  const stone = parseFloat(form.StoneWeight) || 0;
  const net = Math.max(0, gross - stone);
  const buyRate = parseFloat(form.BuyingPricePerGram) || 0;
  const curRate = parseFloat(form.CurrentPricePerGram) || 0;
  const buyingCost = Math.round(net * buyRate);
  const marketVal = Math.round(net * curRate);

  const handleSave = async () => {
    if (!form.OrnamentName.trim()) {
      Alert.alert('Validation Error', 'Ornament Name is required.');
      return;
    }
    if (gross <= 0) {
      Alert.alert('Validation Error', 'Gross Weight must be greater than 0 grams.');
      return;
    }

    setSubmitting(true);
    try {
      store.addOrnament({
        ...form,
        GrossWeight: gross,
        StoneWeight: stone,
        NetWeight: net,
        MetalWeight: net,
        BuyingPricePerGram: buyRate,
        CurrentPricePerGram: curRate,
        BuyingCost: buyingCost,
        MarketValue: marketVal,
        Quantity: parseInt(form.Quantity) || 1,
      });

      Alert.alert('Success', 'Gold ornament registered in the local vault.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="lock-closed" size={48} color={colors.warning} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Read-Only Access</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            You are logged in with read-only permissions. Pledging and adding ornaments to the vault requires SuperAdmin privileges.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.submitBtn, { alignSelf: 'center', paddingHorizontal: 24 }]}>
            <Text style={styles.submitBtnText}>Return Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Register Gold Ornament</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Customer Select */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Belongs to Customer *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {users.map(u => (
              <TouchableOpacity
                key={u.UserId}
                style={[styles.userChip, form.UserId === u.UserId && styles.userChipActive]}
                onPress={() => setForm(p => ({ ...p, UserId: u.UserId }))}
              >
                <Text style={[styles.userChipText, form.UserId === u.UserId && styles.userChipTextActive]}>
                  {u.FullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ornament Name & Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ornament Name / Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 22K Traditional Antique Gold Necklace"
            placeholderTextColor={colors.placeholder}
            value={form.OrnamentName}
            onChangeText={v => setForm(p => ({ ...p, OrnamentName: v }))}
          />
        </View>

        {/* Ornament Type & Purity */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Necklace, Bangle"
              value={form.OrnamentType}
              onChangeText={v => setForm(p => ({ ...p, OrnamentType: v }))}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Purity</Text>
            <View style={styles.purityRow}>
              {['24K', '22K', '18K'].map(k => (
                <TouchableOpacity
                  key={k}
                  style={[styles.purityBtn, form.Purity === k && styles.purityBtnActive]}
                  onPress={() => setForm(p => ({ ...p, Purity: k }))}
                >
                  <Text style={[styles.purityBtnText, form.Purity === k && styles.purityBtnTextActive]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Weight Inputs */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Gross Wt (grams) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.GrossWeight}
              onChangeText={v => setForm(p => ({ ...p, GrossWeight: v }))}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Stone Wt (grams)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.StoneWeight}
              onChangeText={v => setForm(p => ({ ...p, StoneWeight: v }))}
            />
          </View>
        </View>

        {/* Live Calculation Banner */}
        <View style={styles.calcBox}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Calculated Net Gold Weight:</Text>
            <Text style={styles.calcValue}>{net.toFixed(2)} grams</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total Buying Cost (@ ₹{buyRate}/g):</Text>
            <Text style={styles.calcValue}>₹{buyingCost.toLocaleString()}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Estimated Market Value (@ ₹{curRate}/g):</Text>
            <Text style={[styles.calcValue, { color: colors.success }]}>₹{marketVal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Pricing Rates Override */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Buying Rate/g (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={form.BuyingPricePerGram}
              onChangeText={v => setForm(p => ({ ...p, BuyingPricePerGram: v }))}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Market Rate/g (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={form.CurrentPricePerGram}
              onChangeText={v => setForm(p => ({ ...p, CurrentPricePerGram: v }))}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Hallmark Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HM916-2025"
              autoCapitalize="characters"
              value={form.HallmarkNumber}
              onChangeText={v => setForm(p => ({ ...p, HallmarkNumber: v }))}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={form.Quantity}
              onChangeText={v => setForm(p => ({ ...p, Quantity: v }))}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Vault / Locker Remarks</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Stored in Vault Box #3"
            value={form.Remarks}
            onChangeText={v => setForm(p => ({ ...p, Remarks: v }))}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Add Ornament to Vault</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  userChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  userChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  userChipTextActive: {
    color: '#ffffff',
  },
  purityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  purityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  purityBtnActive: {
    backgroundColor: '#fef08a',
    borderColor: '#ca8a04',
  },
  purityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  purityBtnTextActive: {
    color: '#854d0e',
  },
  calcBox: {
    backgroundColor: isDark ? '#261a02' : '#fefce8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#fef08a',
    marginBottom: 14,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: '#854d0e',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
