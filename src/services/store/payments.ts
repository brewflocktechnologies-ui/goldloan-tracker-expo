import { Payment } from '../../types';
import { api } from '../api';
import { normalizePayment } from '../normalize';
import { runMutation, SaveCallbacks } from './mutation';
import { persistAll } from './persist';
import { notify, state } from './state';

export function createPaymentActions() {
  const addPayment = (payData: Partial<Payment>, callbacks?: SaveCallbacks) => {
    const tempId = `PAY${String(state.payments.length + 1).padStart(3, '0')}`;
    const newPay: Payment = {
      PaymentId: tempId,
      LoanId: payData.LoanId || '',
      PaymentDate: payData.PaymentDate || new Date().toISOString().split('T')[0],
      PaymentType: payData.PaymentType || 'Interest',
      PrincipalAmount: Number(payData.PrincipalAmount) || 0,
      InterestAmount: Number(payData.InterestAmount) || 0,
      PenaltyAmount: Number(payData.PenaltyAmount) || 0,
      TotalPaidAmount: Number(payData.TotalPaidAmount) || 0,
      PaymentMethod: payData.PaymentMethod || 'UPI',
      TransactionReference: payData.TransactionReference || '',
      Remarks: payData.Remarks || '',
      CreatedDate: new Date().toISOString(),
    };
    const prevIds = new Set(state.payments.map(p => p.PaymentId));
    state.payments = [newPay, ...state.payments];
    persistAll();
    notify();

    runMutation<Payment>(() => api.addPayment(payData), {
      callbacks,
      failureMessage: 'Payment was not saved',
      onSaved: data => {
        state.payments = state.payments.map(p => p.PaymentId === tempId ? { ...p, ...normalizePayment(data) } : p);
        persistAll();
        notify();
      },
      undo: () => { state.payments = state.payments.filter(p => p.PaymentId !== tempId); },
      alwaysUndo: true,
      findSaved: () => state.payments.find(p =>
        !prevIds.has(p.PaymentId) && p.PaymentId !== tempId && p.LoanId === newPay.LoanId &&
        Number(p.TotalPaidAmount) === newPay.TotalPaidAmount && p.PaymentDate === newPay.PaymentDate),
    });

    return newPay;
  };

  return { addPayment };
}
