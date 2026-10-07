import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MenuStyles } from './menuStyles';

interface LogoutModalProps {
  styles: MenuStyles;
  visible: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}

export function LogoutModal({ styles, visible, onClose, onLogout }: LogoutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose()}
    >
      <Pressable style={styles.modalOverlay} onPress={() => onClose()}>
        <Pressable style={styles.modalDialogCard} onPress={(e) => e.stopPropagation()}>
          {/* Circular Red Exit Badge */}
          <View style={styles.modalBadgeCircle}>
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
          </View>

          {/* Modal Title & Message */}
          <Text style={styles.modalDialogTitle}>Logout?</Text>
          <Text style={styles.modalDialogMessage}>
            Are you sure you want to sign out from this device?
          </Text>

          {/* Blue Info Banner */}
          <View style={styles.modalInfoBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#0284c7" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.modalInfoBannerText}>
              You will need to log in again to access your account.
            </Text>
          </View>

          {/* Actions: Cancel & Logout */}
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => onClose()}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalLogoutBtn}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.modalLogoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
