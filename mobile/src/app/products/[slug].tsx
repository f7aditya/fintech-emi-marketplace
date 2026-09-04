import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '../../components/AppHeader';
import EmiPlanCard from '../../components/EmiPlanCard';
import EmptyState from '../../components/EmptyState';
import PriceBlock from '../../components/PriceBlock';
import VariantSelector from '../../components/VariantSelector';
import { api } from '../../api';
import { useCart } from '../../cart';
import { colors, font, radius, shadow, spacing } from '../../theme';
import type { Product } from '../../types';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { addItem, has } = useCart();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [product, setProduct] = useState<Product | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    api
      .getProduct(String(slug))
      .then((data) => {
        if (!alive) return;
        const def = data.product.variants.find((v) => v.isDefault) ?? data.product.variants[0];
        setProduct(data.product);
        setVariantId(def?.id ?? null);
        setStatus('ready');
      })
      .catch((e: Error & { status?: number }) => {
        if (!alive) return;
        setErrorStatus(e.status ?? null);
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) ?? null,
    [product, variantId],
  );

  // Pre-select the recommended plan whenever the variant changes.
  useEffect(() => {
    if (!variant?.emiPlans?.length) return;
    const rec = variant.emiPlans.find((p) => p.isRecommended) ?? variant.emiPlans[0];
    setPlanId(rec.id);
  }, [variant]);

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <AppHeader title="Loading…" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (status === 'error' || !product || !variant) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Product" showBack />
        <EmptyState
          emoji={errorStatus === 404 ? '🔍' : '⚠️'}
          title={errorStatus === 404 ? 'Product not found' : 'Something went wrong'}
          message={errorStatus === 404 ? `No product matches “${slug}”.` : 'Please try again in a moment.'}
        />
      </View>
    );
  }

  const plan = variant.emiPlans?.find((p) => p.id === planId) ?? null;
  const inBucket = plan ? has(variant.id, plan.id) : false;

  return (
    <View style={styles.screen}>
      <AppHeader title="Pay using 1Fi" subtitle={product.name} showBack />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.hero}>
          <Image source={{ uri: variant.image }} style={styles.heroImage} contentFit="cover" transition={150} />
        </View>

        <View style={styles.thumbRow}>
          {product.variants.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setVariantId(v.id)}
              style={[styles.thumb, v.id === variantId && styles.thumbActive]}>
              <Image source={{ uri: v.image }} style={styles.thumbImage} contentFit="cover" />
            </Pressable>
          ))}
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.ratingRow}>
            <View style={styles.brandChip}>
              <AppText style={styles.brandChipText}>{product.brand}</AppText>
            </View>
            <AppText style={styles.rating}>
              ★ {product.rating.toFixed(1)}{' '}
              <AppText style={styles.ratingCount}>({product.ratingCount.toLocaleString('en-IN')})</AppText>
            </AppText>
          </View>
          <AppText style={styles.name}>{product.name}</AppText>
          <AppText style={styles.tagline}>{product.tagline}</AppText>
          <AppText style={styles.selected}>
            Selected: <AppText style={styles.selectedStrong}>{variant.label}</AppText> ·{' '}
            <AppText style={{ color: variant.inStock ? colors.success : colors.danger }}>
              {variant.inStock ? 'In stock' : 'Out of stock'}
            </AppText>
          </AppText>
        </View>

        <View style={styles.card}>
          <PriceBlock variant={variant} />
          <View style={styles.divider} />
          <AppText style={styles.sectionKicker}>SELECT YOUR VARIANT</AppText>
          <VariantSelector
            variants={product.variants}
            selectedId={variant.id}
            onSelect={setVariantId}
            productName={product.name}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <AppText style={styles.sectionKicker}>CHOOSE AN EMI PLAN</AppText>
            <AppText style={styles.sectionMeta}>{variant.emiPlans?.length ?? 0} plans</AppText>
          </View>
          <View style={{ gap: spacing.sm }}>
            {variant.emiPlans?.map((p) => (
              <EmiPlanCard key={p.id} plan={p} selected={p.id === planId} onSelect={setPlanId} />
            ))}
          </View>

          {plan && (
            <View style={styles.confirm}>
              <AppText style={styles.confirmBody}>
                {plan.monthly.display}/mo × {plan.tenureMonths} months · down payment {plan.downPayment.display} · total{' '}
                {plan.totalPayable.display}
                {plan.cashback ? ` · ${plan.cashback.display} cashback` : ''}.
              </AppText>
              <AppText style={styles.confirmMuted}>Backed by {plan.fundName}.</AppText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>About this product</AppText>
          <AppText style={styles.about}>{product.description}</AppText>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.ctaSummary}>
          <AppText style={styles.ctaMonthly}>{plan?.monthly.display ?? variant.price.display}</AppText>
          <AppText style={styles.ctaSub}>{plan ? `/mo × ${plan.tenureMonths} mo` : 'one-time'}</AppText>
        </View>
        <Pressable
          disabled={!plan || !variant.inStock}
          onPress={() => {
            if (!plan) return;
            if (!inBucket) addItem({ product, variant, plan });
            router.push('/cart');
          }}
          style={[styles.ctaButton, (!plan || !variant.inStock) && styles.ctaButtonDisabled]}>
          <AppText style={styles.ctaButtonText}>
            {!variant.inStock ? 'Out of stock' : inBucket ? 'In your bucket · View' : 'Proceed with selected plan'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    ...shadow.card,
  },
  heroImage: { width: '100%', height: '100%' },
  thumbRow: { flexDirection: 'row', gap: spacing.sm },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: '100%', height: '100%' },
  titleBlock: { gap: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandChip: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  brandChipText: { fontSize: 11, fontWeight: font.bold, color: colors.bodyText },
  rating: { fontSize: 12.5, color: colors.star, fontWeight: font.semibold },
  ratingCount: { color: colors.mutedText, fontWeight: font.regular },
  name: { fontSize: 22, fontWeight: font.heavy, color: colors.ink },
  tagline: { fontSize: 13, color: colors.mutedText, lineHeight: 18 },
  selected: { fontSize: 12.5, color: colors.bodyText, marginTop: 2 },
  selectedStrong: { fontWeight: font.semibold, color: colors.ink },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.card,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: font.bold, color: colors.ink },
  sectionKicker: { fontSize: 11, fontWeight: font.bold, letterSpacing: 1, color: colors.mutedText },
  sectionMeta: { fontSize: 11.5, color: colors.mutedText },
  about: { fontSize: 13, color: colors.bodyText, lineHeight: 20 },
  confirm: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#B7E4C7',
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    gap: 3,
  },
  confirmTitle: { fontSize: 13.5, fontWeight: font.bold, color: '#0B6B3A' },
  confirmBody: { fontSize: 12.5, color: '#125C36', lineHeight: 18 },
  confirmMuted: { fontSize: 11.5, color: '#2C7A54', lineHeight: 17 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  ctaSummary: { minWidth: 92 },
  ctaMonthly: { fontSize: 16, fontWeight: font.heavy, color: colors.ink },
  ctaSub: { fontSize: 11, color: colors.mutedText },
  ctaButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  ctaButtonDisabled: { backgroundColor: colors.mutedText, opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontSize: 14.5, fontWeight: font.bold },
});
