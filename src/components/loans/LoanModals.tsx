import { Ionicons } from '@expo/vector-icons';
import { Dispatch, SetStateAction } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { BankAccount, Loan, Ornament } from '../../types';
import { getStyles } from './loanModalStyles';

export type LoanEditForm = {
  LoanNumber: string;
  UserId: string;
  BankAccountId: string;
  LoanDate: string;
  DueDate: string;
  LoanPeriod: string;
  LoanAmount: string;
  InterestRate: string;
  InterestType: 'Simple' | 'Compound';
  ProcessingFee: string;
  DocumentCharge: string;
  InsuranceCharge: string;
  GrossWeight: string;
  NetWeight: string;
  Remarks: string;
};

export type RepaymentForm = {
  Amount: string;
  PaymentDate: string;
  Type: 'Interest' | 'Principal' | 'Part_Payment';
  Method: 'UPI' | 'Net Banking' | 'Cash';
  Reference: string;
  Remarks: string;
};

type Styles = ReturnType<typeof getStyles>;

interface EditLoanModalProps {
  styles: Styles;
  colors: ThemeColors;
  isDark: boolean;
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  editingLoan: Loan | null;
  getUserName: (userId: string) => string;
  form: LoanEditForm;
  setForm: Dispatch<SetStateAction<LoanEditForm>>;
  availLimit: number;
  userBanks: BankAccount[];
  selectedOrnIds: string[];
  totalNetWeight: number;
  totalGrossWeight: number;
  availableOrns: Ornament[];
  toggleOrnSelection: (id: string) => void;
  netDisbursement: number;
  months: number;
  interest: number;
  handleSaveLoan: () => void;
}

export function EditLoanModal({
  styles, colors, isDark, modalVisible, setModalVisible, editingLoan, getUserName, form, setForm,
  availLimit, userBanks, selectedOrnIds, totalNetWeight, totalGrossWeight, availableOrns,
  toggleOrnSelection, netDisbursement, months, interest, handleSaveLoan,
}: EditLoanModalProps) {
  return (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit Loan ({editingLoan?.LoanNumber})
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Step 1: Select User */}
            <View style={styles.field}>
              <Text style={styles.label}>1. Borrower (Locked)</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={colors.primaryDark}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                  {getUserName(form.UserId)}
                </Text>
              </View>
            </View>

            {/* Step 2: Select Bank Account with headroom */}
            <View style={styles.field}>
              <Text style={styles.label}>
                2. Select Bank Account (Headroom: ₹{availLimit.toLocaleString()}) *
              </Text>
              {userBanks.length === 0 ? (
                <Text style={styles.warnText}>No bank account registered for this borrower.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {userBanks.map((b) => {
                    const av = Math.max(0, (Number(b.MaxLoanAmount) || 0) - (Number(b.UtilizedLoanAmount) || 0));
                    return (
                      <TouchableOpacity
                        key={b.BankAccountId}
                        style={[styles.userChip, form.BankAccountId === b.BankAccountId && styles.userChipActive]}
                        onPress={() => setForm((p) => ({ ...p, BankAccountId: b.BankAccountId }))}
                      >
                        <Text
                          style={[
                            styles.userChipText,
                            form.BankAccountId === b.BankAccountId && styles.userChipTextActive,
                          ]}
                        >
                          {b.BankName} (Avail: ₹{av.toLocaleString()})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Step 3: Select Ornaments to Pledge */}
            <View style={styles.field}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.label}>3. Pledged Ornaments ({selectedOrnIds.length})</Text>
                <Text style={[styles.label, { color: colors.primaryDark }]}>
                  Net Gold: {totalNetWeight.toFixed(2)}g (Gross: {totalGrossWeight.toFixed(2)}g)
                </Text>
              </View>

              {availableOrns.length === 0 ? (
                <Text style={styles.warnText}>No available ornaments in inventory to pledge.</Text>
              ) : (
                availableOrns.map((o) => {
                  const checked = selectedOrnIds.includes(o.OrnamentId);
                  const isCurrentlyPledgedToThis = editingLoan?.ornamentIds?.includes(o.OrnamentId);
                  return (
                    <TouchableOpacity
                      key={o.OrnamentId}
                      style={[styles.ornSelectRow, checked && styles.ornSelectRowActive]}
                      onPress={() => toggleOrnSelection(o.OrnamentId)}
                    >
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={checked ? colors.primaryDark : colors.textMuted}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.ornSelectTitle}>{o.OrnamentName}</Text>
                          {isCurrentlyPledgedToThis ? (
                            <View
                              style={{
                                backgroundColor: isDark ? '#143823' : '#dcfce7',
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success }}>Pledged</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.ornSelectSub}>
                          {o.Purity} • Net: {Number(o.NetWeight || o.MetalWeight || 0).toFixed(2)}g • Val: ₹
                          {(o.MarketValue || 0).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Step 4: Loan Amount & Terms */}
            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Loan Amount (₹) *</Text>
                <TextInput
                  style={[styles.input, { fontWeight: '700', fontSize: 16, color: colors.primaryDark }]}
                  keyboardType="number-pad"
                  value={form.LoanAmount}
                  onChangeText={(v) => setForm((p) => ({ ...p, LoanAmount: v }))}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={form.InterestRate}
                  onChangeText={(v) => setForm((p) => ({ ...p, InterestRate: v }))}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Tenure</Text>
                <TextInput
                  style={styles.input}
                  value={form.LoanPeriod}
                  onChangeText={(v) => setForm((p) => ({ ...p, LoanPeriod: v }))}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Interest Type</Text>
                <View style={styles.statusToggleRow}>
                  {(['Simple', 'Compound'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.statusBtn, form.InterestType === t && styles.statusBtnActive]}
                      onPress={() => setForm((p) => ({ ...p, InterestType: t }))}
                    >
                      <Text style={[styles.statusBtnText, form.InterestType === t && styles.statusBtnTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Loan Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={form.LoanDate}
                  onChangeText={(v) => setForm((p) => ({ ...p, LoanDate: v }))}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Due Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={form.DueDate}
                  onChangeText={(v) => setForm((p) => ({ ...p, DueDate: v }))}
                />
              </View>
            </View>

            {/* Deductions & Net Disbursement */}
            <View style={styles.calcBox}>
              <Text style={styles.calcBoxTitle}>Deductions & Net Disbursement</Text>
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Processing Fee (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.ProcessingFee}
                    onChangeText={(v) => setForm((p) => ({ ...p, ProcessingFee: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Document Charge (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.DocumentCharge}
                    onChangeText={(v) => setForm((p) => ({ ...p, DocumentCharge: v }))}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Insurance Charge (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.InsuranceCharge}
                    onChangeText={(v) => setForm((p) => ({ ...p, InsuranceCharge: v }))}
                  />
                </View>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { fontWeight: '700' }]}>Net Disbursement to Borrower:</Text>
                <Text style={[styles.calcVal, { color: colors.primaryDark, fontSize: 16 }]}>
                  ₹{netDisbursement.toLocaleString()}
                </Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Estimated Period Interest ({months} mos):</Text>
                <Text style={styles.calcVal}>₹{interest.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Gross Weight (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={totalGrossWeight > 0 ? totalGrossWeight.toFixed(3) : '0.000'}
                  keyboardType="decimal-pad"
                  value={form.GrossWeight}
                  onChangeText={(v) => setForm((p) => ({ ...p, GrossWeight: v }))}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Net Weight (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={totalNetWeight > 0 ? totalNetWeight.toFixed(3) : '0.000'}
                  keyboardType="decimal-pad"
                  value={form.NetWeight}
                  onChangeText={(v) => setForm((p) => ({ ...p, NetWeight: v }))}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Additional notes for this loan..."
                multiline
                numberOfLines={2}
                value={form.Remarks}
                onChangeText={(v) => setForm((p) => ({ ...p, Remarks: v }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface RepaymentModalProps {
  styles: Styles;
  colors: ThemeColors;
  payModalVisible: boolean;
  setPayModalVisible: (v: boolean) => void;
  selectedLoan: Loan | null;
  payForm: RepaymentForm;
  setPayForm: Dispatch<SetStateAction<RepaymentForm>>;
  handleSavePayment: () => void;
}

export function RepaymentModal({
  styles, colors, payModalVisible, setPayModalVisible, selectedLoan, payForm, setPayForm, handleSavePayment,
}: RepaymentModalProps) {
  return (
    <Modal visible={payModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Repayment ({selectedLoan?.LoanNumber})</Text>
            <TouchableOpacity onPress={() => setPayModalVisible(false)}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.field}>
              <Text style={styles.label}>Repayment Type</Text>
              <View style={styles.statusToggleRow}>
                {(['Interest', 'Principal', 'Part_Payment'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.statusBtn, payForm.Type === t && styles.statusBtnActive]}
                    onPress={() => setPayForm((p) => ({ ...p, Type: t }))}
                  >
                    <Text style={[styles.statusBtnText, payForm.Type === t && styles.statusBtnTextActive]}>
                      {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Amount Paid (₹) *</Text>
              <TextInput
                style={[styles.input, { fontSize: 16, fontWeight: '700', color: colors.success }]}
                placeholder="e.g. 1500"
                keyboardType="number-pad"
                value={payForm.Amount}
                onChangeText={(v) => setPayForm((p) => ({ ...p, Amount: v }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.statusToggleRow}>
                {(['UPI', 'Net Banking', 'Cash'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.statusBtn, payForm.Method === m && styles.statusBtnActive]}
                    onPress={() => setPayForm((p) => ({ ...p, Method: m }))}
                  >
                    <Text style={[styles.statusBtnText, payForm.Method === m && styles.statusBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Payment Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={payForm.PaymentDate}
                  onChangeText={(v) => setPayForm((p) => ({ ...p, PaymentDate: v }))}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Transaction Reference / UTR</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. UPI/50291039120"
                  value={payForm.Reference}
                  onChangeText={(v) => setPayForm((p) => ({ ...p, Reference: v }))}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Payment notes..."
                multiline
                numberOfLines={2}
                value={payForm.Remarks}
                onChangeText={(v) => setPayForm((p) => ({ ...p, Remarks: v }))}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.success }]}
              onPress={handleSavePayment}
            >
              <Text style={styles.saveBtnText}>Save Repayment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
