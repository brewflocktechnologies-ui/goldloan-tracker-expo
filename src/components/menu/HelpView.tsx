import { Ionicons } from '@expo/vector-icons';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../constants/theme';
import { MenuStyles } from './menuStyles';

interface HelpViewProps {
  styles: MenuStyles;
  colors: ThemeColors;
  expandedFaq: number | null;
  setExpandedFaq: (value: number | null) => void;
}

export function HelpView({ styles, colors, expandedFaq, setExpandedFaq }: HelpViewProps) {
  const faqs = [
    {
      q: 'How is net disbursement calculated?',
      a: 'Net disbursement is calculated by deducting upfront administrative charges (Processing fee 0.5%, document charge ₹250, insurance charge ₹500) directly from the sanctioned principal loan amount.',
    },
    {
      q: 'How is available bank limit worked out?',
      a: 'Each lending bank account has an authorized Maximum Credit Limit. The available headroom is computed as Maximum Loan Limit minus the total outstanding balance of all active loans assigned to that bank account.',
    },
    {
      q: 'Can i close a loan with a balance?',
      a: 'No. Active gold loans must have their full principal and accrued interest settled before recording final closure and triggering the release of pledged physical gold ornaments from the vault.',
    },
    {
      q: 'How is gold value calculated?',
      a: 'Portfolio valuation is computed using real-time Bangalore bullion market benchmarks (22K 916 rate for jewelry standard) multiplied by the net weight of gold collateral, excluding stones.',
    },
  ];

  return (
    <View style={styles.viewContainer}>
      {/* Section: Frequently asked */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Frequently asked</Text>
        <View style={styles.faqListContainer}>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <View key={idx} style={styles.faqItemWrapper}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  activeOpacity={0.7}
                  onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'remove' : 'add'}
                    size={20}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Section: Contact support */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Contact support</Text>
        <View style={styles.contactButtonsRow}>
          {/* Call Button */}
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('tel:+919876543210')}
          >
            <Ionicons name="call-outline" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('https://wa.me/919876543210')}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={{ marginRight: 6 }} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
