import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { MenuStyles } from './menuStyles';

interface AboutViewProps {
  styles: MenuStyles;
}

export function AboutView({ styles }: AboutViewProps) {
  return (
    <View style={styles.viewContainer}>
      {/* Centered Golden Emblem & Info */}
      <View style={styles.aboutContentCentered}>
        <View style={styles.aboutCoinEmblem}>
          <MaterialCommunityIcons name="bank" size={46} color="#d97706" />
        </View>
        <Text style={styles.aboutAppTitle}>Gold Loan Tracker</Text>
        <Text style={styles.aboutVersionText}>Version 1.0.0</Text>
        <Text style={styles.aboutDescriptionText}>
          Gold Loan Tracker is a simple and powerful application for gold-loan business owners and operators. It helps you manage customers, bank accounts, ornaments, loans, payments, and business reports – all in one place.
        </Text>
      </View>
    </View>
  );
}
