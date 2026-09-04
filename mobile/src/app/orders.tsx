import { Link, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../components/AppText';

import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { api } from '../api';
import { formatDate } from '../format';
import { colors, font, radius, spacing } from '../theme';
import type { Order } from '../types';

export default function OrdersScreen() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { orders: list } = await api.listOrders();
      setOrders(list);
      setStatus('ready');
    } catch {
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

  return (
    <View style={styles.screen}>
      <AppHeader title="Your orders" showBack showCart={false} />

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : status === 'error' ? (
        <EmptyState emoji="⚠️" title="Couldn’t load orders" message="Pull to refresh once the API is reachable." />
      ) : orders.length === 0 ? (
        <>
          <EmptyState emoji="📦" title="No orders yet" message="Orders you place from the bucket show up here." />
          <View style={{ alignItems: 'center' }}>
            <Pressable style={styles.primaryBtn} onPress={() => router.replace('/shop')}>
              <AppText style={styles.primaryBtnText}>Browse the Marketplace</AppText>
            </Pressable>
          </View>
        </>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Link href={`/order/${item.reference}`} asChild>
              <Pressable style={styles.row}>
                <View style={styles.rowTop}>
                  <AppText style={styles.ref}>{item.reference}</AppText>
                  <View style={styles.statusPill}>
                    <AppText style={styles.statusText}>{item.status}</AppText>
                  </View>
                </View>
                <AppText style={styles.meta}>
                  {formatDate(item.createdAt)} · {item.itemCount} item{item.itemCount === 1 ? '' : 's'}
                </AppText>
                <AppText style={styles.names} numberOfLines={1}>
                  {item.items.map((i) => i.product.name).join(', ')}
                </AppText>
                <View style={styles.rowBottom}>
                  <AppText style={styles.monthly}>{item.monthly.display}/mo</AppText>
                  <AppText style={styles.total}>{item.totalPayable.display} total</AppText>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: 4,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 14, fontWeight: font.heavy, color: colors.primary, letterSpacing: 0.5 },
  statusPill: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { fontSize: 9.5, fontWeight: font.heavy, color: colors.success, letterSpacing: 0.4 },
  meta: { fontSize: 11.5, color: colors.mutedText },
  names: { fontSize: 12.5, color: colors.bodyText, marginTop: 2 },
  rowBottom: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  monthly: { fontSize: 14, fontWeight: font.heavy, color: colors.ink },
  total: { fontSize: 11, color: colors.mutedText },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: font.bold },
});
