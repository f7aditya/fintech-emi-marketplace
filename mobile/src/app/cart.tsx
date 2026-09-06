import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '../components/AppHeader';
import CartLineItem from '../components/CartLineItem';
import EmptyState from '../components/EmptyState';
import OrderSummaryCard from '../components/OrderSummaryCard';
import { api } from '../api';
import { useCart } from '../cart';
import { formatDate, formatPaise } from '../format';
import { colors, font, radius, spacing } from '../theme';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, totals, setQuantity, removeItem, clear, hydrated } = useCart();
  const [placing, setPlacing] = useState(false);

  const firstEmi = new Date();
  firstEmi.setMonth(firstEmi.getMonth() + 1);

  async function placeOrder() {
    setPlacing(true);
    try {
      const { order } = await api.createOrder({
        items: items.map((i) => ({ variantId: i.variantId, emiPlanId: i.plan.id, quantity: i.quantity })),
      });
      // Bucket is kept until the payment succeeds, so the user can come back here
      // to adjust and a declined payment can be retried. Checkout clears it on success.
      router.push(`/checkout/${order.reference}`);
    } catch (e) {
      notify('Couldn’t start checkout', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (!hydrated) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Your bucket" showBack showCart={false} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Your bucket" showBack showCart={false} />
        <EmptyState emoji="🧺" title="Your bucket is empty" message="Add a phone and an EMI plan to see it here." />
        <View style={styles.emptyActions}>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/shop')}>
            <AppText style={styles.primaryBtnText}>Browse the Marketplace</AppText>
          </Pressable>
          <Pressable onPress={() => router.push('/orders')}>
            <AppText style={styles.link}>View past orders</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Your bucket" subtitle={`${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`} showBack showCart={false} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 150 }]}>
        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.key}>
              {idx > 0 && <View style={styles.itemDivider} />}
              <CartLineItem item={item} onQuantity={setQuantity} onRemove={removeItem} />
            </View>
          ))}
        </View>

        <Pressable onPress={clear} style={styles.clearRow}>
          <AppText style={styles.clearText}>Clear bucket</AppText>
        </Pressable>

        <OrderSummaryCard
          monthlyPaise={totals.monthlyPaise}
          downPaymentPaise={totals.downPaymentPaise}
          cashbackPaise={totals.cashbackPaise}
          totalPayablePaise={totals.totalPayablePaise}
          itemCount={totals.itemCount}
        />

        <View style={styles.scheduleCard}>
          <AppText style={styles.scheduleTitle}>Repayment schedule</AppText>
          <AppText style={styles.scheduleBody}>
            First instalment on <AppText style={styles.scheduleStrong}>{formatDate(firstEmi.toISOString())}</AppText>, then monthly.
            You can prepay any time from the 1Fi app with no charge.
          </AppText>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View>
          <AppText style={styles.ctaLabel}>Payable now</AppText>
          <AppText style={styles.ctaValue}>{formatPaise(totals.downPaymentPaise)}</AppText>
        </View>
        <Pressable style={[styles.placeBtn, placing && styles.placeBtnDisabled]} disabled={placing} onPress={placeOrder}>
          {placing ? <ActivityIndicator color="#fff" /> : <AppText style={styles.placeBtnText}>Proceed to payment</AppText>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
  },
  itemDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  clearRow: { alignSelf: 'flex-end', paddingVertical: 2 },
  clearText: { fontSize: 12, fontWeight: font.semibold, color: colors.mutedText },
  scheduleCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  scheduleTitle: { fontSize: 13, fontWeight: font.bold, color: colors.primaryDark },
  scheduleBody: { fontSize: 11.5, color: colors.bodyText, lineHeight: 17 },
  scheduleStrong: { fontWeight: font.bold, color: colors.ink },
  emptyActions: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.xxl },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: font.bold },
  link: { fontSize: 13, fontWeight: font.semibold, color: colors.primary },
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
  ctaLabel: { fontSize: 11, color: colors.mutedText },
  ctaValue: { fontSize: 16, fontWeight: font.heavy, color: colors.ink },
  placeBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: '#fff', fontSize: 14.5, fontWeight: font.bold },
});
