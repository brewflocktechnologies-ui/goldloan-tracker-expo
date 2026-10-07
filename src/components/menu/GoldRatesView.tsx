import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Env } from '../../config/env';
import { ThemeColors } from '../../constants/theme';
import { useAppStore } from '../../services/store';
import { MenuStyles } from './menuStyles';

interface GoldRatesViewProps {
  styles: MenuStyles;
  colors: ThemeColors;
  isDark: boolean;
  store: ReturnType<typeof useAppStore>;
  toast: { info: (msg: string) => void; success: (msg: string) => void };
}

export function GoldRatesView({ styles, colors, isDark, store, toast }: GoldRatesViewProps) {
  const rates = store.goldRates;
  const r24 = rates?.gold24k?.rate1g || Env.FALLBACK_24K_RATE;
  const r22 = rates?.gold22k?.rate1g || Env.FALLBACK_22K_RATE;
  const r18 = rates?.gold18k?.rate1g || Env.FALLBACK_18K_RATE;

  return (
    <View style={styles.viewContainer}>
      {/* Rate Cards Stack */}
      <View style={styles.goldRateStack}>
        {/* 24K Pure */}
        <View style={styles.goldRateCard}>
          <View style={styles.goldKaratBadge}>
            <Text style={styles.goldKaratBadgeText}>24K</Text>
          </View>
          <View style={styles.goldRateMainCol}>
            <Text style={styles.goldPriceGram}>₹{r24.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
            <Text style={styles.goldSubDetail}>99.9% pure</Text>
          </View>
          <View style={styles.goldTenGramCol}>
            <Text style={styles.goldTenGramWeight}>10 g</Text>
            <Text style={styles.goldTenGramPrice}>₹{(r24 * 10).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* 22K Standard (Featured Active Card) */}
        <View style={[styles.goldRateCard, styles.goldRateCard22k]}>
          <View style={[styles.goldKaratBadge, styles.goldKaratBadge22k]}>
            <Text style={[styles.goldKaratBadgeText, styles.goldKaratBadgeText22k]}>22K</Text>
          </View>
          <View style={styles.goldRateMainCol}>
            <Text style={styles.goldPriceGram}>₹{r22.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
            <Text style={[styles.goldSubDetail, { color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '600' }]}>
              91.6% · used for valuation
            </Text>
          </View>
          <View style={styles.goldTenGramCol}>
            <Text style={styles.goldTenGramWeight}>10 g</Text>
            <Text style={styles.goldTenGramPrice}>₹{(r22 * 10).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* 18K Hallmarked */}
        <View style={styles.goldRateCard}>
          <View style={styles.goldKaratBadge}>
            <Text style={styles.goldKaratBadgeText}>18K</Text>
          </View>
          <View style={styles.goldRateMainCol}>
            <Text style={styles.goldPriceGram}>₹{r18.toLocaleString('en-IN')}<Text style={styles.goldPerGram}>/g</Text></Text>
            <Text style={styles.goldSubDetail}>75.0%</Text>
          </View>
          <View style={styles.goldTenGramCol}>
            <Text style={styles.goldTenGramWeight}>10 g</Text>
            <Text style={styles.goldTenGramPrice}>₹{(r18 * 10).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshRatesBtn}
        activeOpacity={0.8}
        disabled={store.isFetchingGoldRates}
        onPress={async () => {
          toast.info('Fetching live Bangalore rates...');
          await store.refreshGoldRates(true);
          toast.success('Live gold rates refreshed.');
        }}
      >
        {store.isFetchingGoldRates ? (
          <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.refreshRatesBtnText}>
          {store.isFetchingGoldRates ? 'Updating rates...' : 'Refresh rates'}
        </Text>
      </TouchableOpacity>

      {/* Note at bottom */}
      <Text style={styles.goldRatesFooterNote}>
        Gold value across the app uses the 22K rate, with 24K as fallback.
      </Text>
    </View>
  );
}
