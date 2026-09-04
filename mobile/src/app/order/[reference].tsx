import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import EmptyState from '../../components/EmptyState';
import { api } from '../../api';
import { formatDate } from '../../format';
import { colors, font, radius, spacing } from '../../theme';
import type { Order } from '../../types';

export default function OrderScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getOrder(String(reference))
      .then((d) => alive && (setOrder(d.order), setStatus('ready')))
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [reference]);

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <AppHeader title="Order" showBack showCart={false} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (status === 'error' || !order) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Order" showBack showCart={false} />
        <EmptyState emoji="🔍" title="Order not found" message={`No order matches “${reference}”.`} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Order placed" showBack showCart={false} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.hero}>
          <View style={styles.check}>
            <AppText style={styles.checkMark}>✓</AppText>
          </View>
          <AppText style={styles.heroTitle}>Thank you! Your order is placed.</AppText>
          <AppText style={styles.heroRef}>
            Reference <AppText style={styles.heroRefStrong}>{order.reference}</AppText>
          </AppText>
          <AppText style={styles.heroSub}>Placed {formatDate(order.createdAt)} · Status {order.status}</AppText>
        </View>

        <View style={styles.card}>
          <Row label="Monthly EMI" value={order.monthly.display} strong />
          <Row label="Paid today" value={order.downPayment.display} />
          {order.cashback && <Row label="Cashback credited" value={`− ${order.cashback.display}`} positive />}
          <View style={styles.divider} />
          <Row label="Total payable over tenure" value={order.totalPayable.display} strong />
          <View style={styles.emiBanner}>
            <AppText style={styles.emiBannerText}>First instalment on {formatDate(order.firstEmiOn)}</AppText>
          </View>
        </View>

        <AppText style={styles.sectionLabel}>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</AppText>
        <View style={styles.card}>
          {order.items.map((it, idx) => (
            <View key={it.id}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.itemRow}>
                <Image source={{ uri: it.variant.image }} style={styles.itemImage} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.itemName} numberOfLines={1}>
                    {it.product.name}
                    {it.quantity > 1 ? `  × ${it.quantity}` : ''}
                  </AppText>
                  <AppText style={styles.itemVariant}>{it.variant.label}</AppText>
                  <AppText style={styles.itemPlan}>
                    {it.monthly.display}/mo × {it.plan.tenureMonths} mo · {it.plan.interestLabel}
                  </AppText>
                  <AppText style={styles.itemFund}>{it.plan.title} · {it.plan.fundName}</AppText>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/orders')}>
          <AppText style={styles.ghostBtnText}>All orders</AppText>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/shop')}>
          <AppText style={styles.primaryBtnText}>Continue shopping</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  strong,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <AppText style={[styles.rowLabel, strong && styles.rowLabelStrong]}>{label}</AppText>
      <AppText style={[styles.rowValue, strong && styles.rowValueStrong, positive && styles.rowValuePositive]}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkMark: { fontSize: 28, color: colors.success, fontWeight: font.heavy },
  heroTitle: { fontSize: 17, fontWeight: font.heavy, color: colors.ink, textAlign: 'center' },
  heroRef: { fontSize: 13, color: colors.bodyText, marginTop: 2 },
  heroRefStrong: { fontWeight: font.heavy, color: colors.primary, letterSpacing: 0.5 },
  heroSub: { fontSize: 11.5, color: colors.mutedText },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { fontSize: 12.5, color: colors.bodyText },
  rowLabelStrong: { fontWeight: font.bold, color: colors.ink },
  rowValue: { fontSize: 12.5, color: colors.bodyText },
  rowValueStrong: { fontSize: 15, fontWeight: font.heavy, color: colors.ink },
  rowValuePositive: { color: colors.success, fontWeight: font.semibold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.xs },
  emiBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emiBannerText: { fontSize: 12, fontWeight: font.semibold, color: colors.primaryDark, textAlign: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: font.bold, color: colors.mutedText, marginTop: spacing.xs },
  itemRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  itemImage: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.surface },
  itemName: { fontSize: 13.5, fontWeight: font.bold, color: colors.ink },
  itemVariant: { fontSize: 11.5, color: colors.bodyText, marginTop: 1 },
  itemPlan: { fontSize: 11, color: colors.mutedText, marginTop: 3 },
  itemFund: { fontSize: 10, color: colors.mutedText, marginTop: 1 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  ghostBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ghostBtnText: { fontSize: 14, fontWeight: font.bold, color: colors.bodyText },
  primaryBtn: {
    flex: 1.4,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: font.bold, color: '#fff' },
});
