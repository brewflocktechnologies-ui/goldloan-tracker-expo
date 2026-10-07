import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Env } from '../../config/env';
import { Colors } from '../../constants/theme';
import { DashboardColors, DashboardStore, DashboardStyles, DashboardToast, GoldRates } from './types';

interface GoldRatesCardProps {
  styles: DashboardStyles;
  colors: DashboardColors;
  isDark: boolean;
  isCompact: boolean;
  store: DashboardStore;
  toast: DashboardToast;
  rates: GoldRates;
  live22kRate: number;
  live24kRate: number;
  live18kRate: number;
}

export function GoldRatesCard({ styles, colors, isDark, isCompact, store, toast, rates, live22kRate, live24kRate, live18kRate }: GoldRatesCardProps) {
  return (
        <View style={styles.goldRatesCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.goldBadgeIcon}>
                <Ionicons name="trending-up" size={16} color={Colors.primaryDark} />
              </View>
              <Text style={styles.cardSectionTitle} numberOfLines={1}>
                {Env.LOCATION_BENCHMARK} Live Gold Benchmark
              </Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity
                onPress={async () => {
                  toast.info('Fetching live Bangalore gold rates...');
                  await store.refreshGoldRates(true);
                  toast.success('Gold rates updated.');
                }}
                disabled={store.isFetchingGoldRates}
                style={[styles.cityPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                {store.isFetchingGoldRates ? (
                  <ActivityIndicator size="small" color={colors.primaryDark} style={{ transform: [{ scale: 0.65 }] }} />
                ) : (
                  <Ionicons name="refresh" size={11} color={colors.primaryDark} />
                )}
                <Text style={styles.cityPillText}>
                  {store.isFetchingGoldRates ? 'Updating...' : 'Live Rates'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel} numberOfLines={1}>
                {rates?.displayDate || 'Updated Today'}
              </Text>
            </View>
          </View>

          {isCompact ? (
            // ─── MOBILE RESPONSIVE LAYOUT (Featured 22K Hero + 2-Col 24K/18K) ───
            <View style={styles.ratesMobileContainer}>
              {/* Featured 22K Standard Hero Card */}
              <View style={[styles.rateBox, styles.rateBoxFeatured, styles.rateBoxHero]}>
                <View style={styles.heroHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <Text style={[styles.rateKarat, styles.rateKaratFeatured]} numberOfLines={1}>
                      22K Standard (916)
                    </Text>
                    <View style={[styles.miniBadge, { backgroundColor: isDark ? '#0284c7' : colors.primaryDark }]}>
                      <Text style={[styles.miniBadgeText, { color: '#ffffff' }]}>Primary</Text>
                    </View>
                  </View>
                  <View style={[styles.sovereignBox, { backgroundColor: '#e0f2fe', marginTop: 0 }]}>
                    <Text style={[styles.sovereignText, { color: '#0369a1', fontWeight: '700' }]} numberOfLines={1}>
                      8g Sovereign: ₹{(live22kRate * 8).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroAmountRow}>
                  <Text style={[styles.rateAmount, styles.rateAmountFeatured]}>
                    ₹{live22kRate.toLocaleString()}
                  </Text>
                  <Text style={styles.rateUnitHero}>per 1g</Text>
                  {rates?.gold22k?.change ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8, backgroundColor: isDark ? '#143823' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Ionicons 
                        name={rates.gold22k.direction === 'up' ? 'arrow-up' : rates.gold22k.direction === 'down' ? 'arrow-down' : 'remove'} 
                        size={11} 
                        color={rates.gold22k.direction === 'up' ? colors.success : colors.danger} 
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold22k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold22k.change >= 0 ? `+₹${rates.gold22k.change}` : `-₹${Math.abs(rates.gold22k.change)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* 24K and 18K Secondary Side-by-Side */}
              <View style={styles.ratesTwoColRow}>
                {/* 24K Pure Gold */}
                <View style={[styles.rateBox, { flex: 1 }]}>
                  <View style={styles.rateBoxHeader}>
                    <Text style={styles.rateKarat} numberOfLines={1}>24K Pure (999)</Text>
                    <View style={[styles.miniBadge, { backgroundColor: '#e0f2fe' }]}>
                      <Text style={[styles.miniBadgeText, { color: '#0369a1' }]}>99.9%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.rateAmount} numberOfLines={1}>₹{live24kRate.toLocaleString()}</Text>
                    {rates?.gold24k?.change ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: rates.gold24k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold24k.change >= 0 ? `+₹${rates.gold24k.change}` : `-₹${Math.abs(rates.gold24k.change)}`}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rateUnit}>per 1g</Text>
                  <View style={styles.sovereignBox}>
                    <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live24kRate * 8).toLocaleString()}</Text>
                  </View>
                </View>

                {/* 18K Hallmarked */}
                <View style={[styles.rateBox, { flex: 1 }]}>
                  <View style={styles.rateBoxHeader}>
                    <Text style={styles.rateKarat} numberOfLines={1}>18K Gold (750)</Text>
                    <View style={[styles.miniBadge, { backgroundColor: '#fed7aa' }]}>
                      <Text style={[styles.miniBadgeText, { color: '#9a3412' }]}>75.0%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.rateAmount} numberOfLines={1}>₹{live18kRate.toLocaleString()}</Text>
                    {rates?.gold18k?.change ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: rates.gold18k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold18k.change >= 0 ? `+₹${rates.gold18k.change}` : `-₹${Math.abs(rates.gold18k.change)}`}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rateUnit}>per 1g</Text>
                  <View style={styles.sovereignBox}>
                    <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live18kRate * 8).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // ─── DESKTOP/TABLET 3-COLUMN ROW ───
            <View style={styles.ratesGridRow}>
              {/* 24K Pure Gold */}
              <View style={styles.rateBox}>
                <View style={styles.rateBoxHeader}>
                  <Text style={styles.rateKarat} numberOfLines={1}>24K Pure (999)</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={[styles.miniBadgeText, { color: '#0369a1' }]}>99.9%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.rateAmount} numberOfLines={1}>₹{live24kRate.toLocaleString()}</Text>
                  {rates?.gold24k?.change ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold24k.direction === 'up' ? colors.success : colors.danger }}>
                      {rates.gold24k.change >= 0 ? `+₹${rates.gold24k.change}` : `-₹${Math.abs(rates.gold24k.change)}`}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={styles.sovereignBox}>
                  <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live24kRate * 8).toLocaleString()}</Text>
                </View>
              </View>

              {/* 22K Jewelry Standard (Featured) */}
              <View style={[styles.rateBox, styles.rateBoxFeatured]}>
                <View style={styles.rateBoxHeader}>
                  <Text style={[styles.rateKarat, { color: isDark ? '#38bdf8' : colors.primaryDark }]} numberOfLines={1}>
                    22K Standard (916)
                  </Text>
                  <View style={[styles.miniBadge, { backgroundColor: Colors.primaryDark }]}>
                    <Text style={[styles.miniBadgeText, { color: '#ffffff' }]}>Primary</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.rateAmount, styles.rateAmountFeatured]} numberOfLines={1}>
                    ₹{live22kRate.toLocaleString()}
                  </Text>
                  {rates?.gold22k?.change ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: isDark ? '#143823' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Ionicons 
                        name={rates.gold22k.direction === 'up' ? 'arrow-up' : rates.gold22k.direction === 'down' ? 'arrow-down' : 'remove'} 
                        size={11} 
                        color={rates.gold22k.direction === 'up' ? colors.success : colors.danger} 
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold22k.direction === 'up' ? colors.success : colors.danger }}>
                        {rates.gold22k.change >= 0 ? `+₹${rates.gold22k.change}` : `-₹${Math.abs(rates.gold22k.change)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={[styles.sovereignBox, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.sovereignText, { color: '#0369a1', fontWeight: '700' }]} numberOfLines={1}>
                    8g Sovereign: ₹{(live22kRate * 8).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* 18K Hallmarked */}
              <View style={styles.rateBox}>
                <View style={styles.rateBoxHeader}>
                  <Text style={styles.rateKarat} numberOfLines={1}>18K Gold (750)</Text>
                  <View style={[styles.miniBadge, { backgroundColor: '#fed7aa' }]}>
                    <Text style={[styles.miniBadgeText, { color: '#9a3412' }]}>75.0%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.rateAmount} numberOfLines={1}>₹{live18kRate.toLocaleString()}</Text>
                  {rates?.gold18k?.change ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: rates.gold18k.direction === 'up' ? colors.success : colors.danger }}>
                      {rates.gold18k.change >= 0 ? `+₹${rates.gold18k.change}` : `-₹${Math.abs(rates.gold18k.change)}`}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.rateUnit}>per 1g</Text>
                <View style={styles.sovereignBox}>
                  <Text style={styles.sovereignText} numberOfLines={1}>8g: ₹{(live18kRate * 8).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
  );
}
