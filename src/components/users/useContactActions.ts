import { Linking, Platform } from 'react-native';
import { useToast } from '../../context/ToastContext';

/** Call / WhatsApp / copy-code helpers for a customer, with toast feedback. */
export function useContactActions() {
  const toast = useToast();

  // Actions for Phone / WhatsApp
  // phone accepts number too: the Sheets API can return an all-digit cell as a JS number.
  const handleCallCustomer = (phone?: string | number) => {
    if (!phone) {
      toast.warning('No mobile number available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      toast.danger('Could not open phone dialer');
    });
  };

  const handleWhatsAppCustomer = (phone?: string | number) => {
    if (!phone) {
      toast.warning('No mobile number available');
      return;
    }
    const clean = String(phone).replace(/[^\d]/g, '');
    const fullNum = clean.startsWith('91') ? clean : `91${clean}`;
    Linking.openURL(`https://wa.me/${fullNum}`).catch(() => {
      toast.danger('Could not open WhatsApp');
    });
  };

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    toast.info(`Copied Code: ${code}`);
  };

  return { handleCallCustomer, handleWhatsAppCustomer, handleCopyCode };
}
