import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import AppText from '../../components/AppText';
import ProductCard from '../../components/ProductCard';
import Segmented from '../../components/Segmented';
import EmptyState from '../../components/EmptyState';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import type { Product } from '../../types';

const TABS = [
  { value: 'top-brands', label: 'Top Brands' },
  { value: 'nearby-stores', label: 'Nearby Stores' },
  { value: 'marketplace', label: '1Fi Marketplace' },
] as const;

type Tab = (typeof TABS)[number]['value'];

export default function ShopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = TABS.some((t) => t.value === params.tab) ? (params.tab as Tab) : 'top-brands';
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listProducts();
      setProducts(data.products);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const setTab = (next: Tab) => router.setParams({ tab: next });

  const listHeader = (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        style={[styles.heroGradient, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.badgeWrap}>
          <AppText style={styles.badgeIcon}>✨</AppText>
          <AppText style={styles.badgeText}>NO-COST EMIs</AppText>
        </View>
        
        <View style={styles.heroTextContent}>
          <AppText style={styles.heroTitle}>
            Shop today,{'\n'}
            <AppText style={{ fontStyle: 'italic', color: '#FFF' }}>Pay later using</AppText>{'\n'}
            Mutual funds.
          </AppText>
          <AppText style={styles.heroSubtitle}>No credit score required. No interest.{'\n'}Backed by your investments.</AppText>
        </View>
      </LinearGradient>

      <View style={styles.segmentedWrapper}>
        <Segmented options={TABS as unknown as { value: Tab; label: string }[]} value={tab} onChange={setTab} />
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <AppText style={styles.searchIcon}>🔍</AppText>
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'nearby-stores' ? "Search stores..." : "Search online stores..."}
            placeholderTextColor={colors.mutedText}
          />
        </View>
      </View>

      <View style={styles.sectionTitleRow}>
        <AppText style={styles.sectionTitle}>
          {tab === 'top-brands' ? 'Top Brands' : tab === 'nearby-stores' ? 'Nearby Stores' : '1Fi Marketplace'}
        </AppText>
        {tab === 'nearby-stores' && (
          <View style={styles.dropdownPill}>
            <AppText style={styles.dropdownText}>Select your location</AppText>
            <AppText style={styles.dropdownIcon}>⌄</AppText>
          </View>
        )}
      </View>

      {tab === 'marketplace' && (
        <View style={styles.pitchWrapper}>
          <View style={styles.pitch}>
            <View style={styles.pitchTop}>
              <AppText style={styles.pitchTitle}>Buy now, pay in EMIs backed by mutual funds</AppText>
              <Pressable onPress={() => router.push('/orders')} hitSlop={8}>
                <AppText style={styles.ordersLink}>Your orders ›</AppText>
              </Pressable>
            </View>
            <AppText style={styles.pitchBody}>
              Your money stays invested in a 1Fi fund while you pay — that&apos;s what makes No Cost EMI work in your
              favour.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={tab === 'marketplace' ? products : []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={tab === 'marketplace' ? styles.column : undefined}
        contentContainerStyle={tab === 'marketplace' ? styles.gridContent : styles.listScrollContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          tab !== 'marketplace' ? (
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState
                emoji={tab === 'top-brands' ? '🏷️' : '📍'}
                title={tab === 'top-brands' ? 'Top Brands' : 'Nearby Stores'}
                message="Coming soon. This section is intentionally left blank for the assignment."
              />
            </View>
          ) : status === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <AppText style={styles.centerText}>Loading products…</AppText>
            </View>
          ) : status === 'error' ? (
            <EmptyState
              emoji="⚠️"
              title="Couldn’t load products"
              message={`${error}\n\nMake sure the API is running and EXPO_PUBLIC_API_BASE / your LAN IP is reachable.`}
            />
          ) : null
        }
        renderItem={({ item }) =>
          tab === 'marketplace' ? (
            <View style={styles.cardCell}>
              <ProductCard product={item} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  
  heroGradient: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48, 
    overflow: 'hidden',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: font.heavy, letterSpacing: 0.5 },
  
  heroTextContent: {
    maxWidth: '70%',
    zIndex: 2,
  },
  heroTitle: { color: '#FFF', fontSize: 30, fontWeight: font.heavy, lineHeight: 36, marginBottom: spacing.sm },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18 },
  
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: 0,
    width: 200,
    height: 180,
    opacity: 0.9,
    zIndex: 1,
  },

  segmentedWrapper: {
    marginTop: -28,
    marginHorizontal: spacing.xl,
    zIndex: 10,
  },
  
  searchWrapper: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16, color: colors.mutedText, opacity: 0.6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.ink,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: font.bold, color: colors.ink },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  dropdownText: { fontSize: 13, fontWeight: font.semibold, color: colors.primaryDark },
  dropdownIcon: { fontSize: 16, color: colors.primaryDark, marginTop: -2 }, // negative margin to align the caret perfectly

  headerContainer: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
  },
  
  listScrollContent: { paddingBottom: spacing.xxl },
  
  gridContent: { paddingBottom: spacing.xxl },
  column: { gap: spacing.md, paddingHorizontal: spacing.xl },
  cardCell: { flex: 1, marginBottom: spacing.md },

  pitchWrapper: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  pitch: {
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pitchTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  ordersLink: { fontSize: 12, fontWeight: font.semibold, color: colors.primary, paddingTop: 2 },
  pitchTitle: { flex: 1, fontSize: 16, fontWeight: font.bold, color: colors.ink, lineHeight: 22 },
  pitchBody: { fontSize: 12, color: colors.bodyText, lineHeight: 17 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xxl },
  centerText: { fontSize: 13, color: colors.mutedText },
});
