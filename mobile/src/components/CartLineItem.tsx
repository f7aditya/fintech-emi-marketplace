import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import type { CartItem } from '../cart';
import { formatPaise } from '../format';
import { colors, font, radius, spacing } from '../theme';
import QuantityStepper from './QuantityStepper';

type Props = {
  item: CartItem;
  onQuantity: (key: string, next: number) => void;
  onRemove: (key: string) => void;
};

export default function CartLineItem({ item, onQuantity, onRemove }: Props) {
  const { plan } = item;
  return (
    <View style={styles.row}>
      <Link href={`/products/${item.productSlug}`} asChild>
        <Pressable>
          <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={120} />
        </Pressable>
      </Link>

      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <AppText style={styles.name} numberOfLines={1}>
            {item.productName}
          </AppText>
          <Pressable onPress={() => onRemove(item.key)} hitSlop={8}>
            <AppText style={styles.remove}>Remove</AppText>
          </Pressable>
        </View>

        <AppText style={styles.variant}>{item.variantLabel}</AppText>

        <AppText style={styles.plan} numberOfLines={2}>
          {plan.monthly.display}/mo × {plan.tenureMonths} mo · {plan.interestLabel}
          {'\n'}
          <AppText style={styles.fund}>{plan.title} · {plan.fundName}</AppText>
        </AppText>

        {plan.cashback && (
          <AppText style={styles.cashback}>🎁 {plan.cashback.display} cashback{item.quantity > 1 ? ` × ${item.quantity}` : ''}</AppText>
        )}

        <View style={styles.bottomRow}>
          <QuantityStepper value={item.quantity} onChange={(n) => onQuantity(item.key, n)} />
          <View style={{ alignItems: 'flex-end' }}>
            <AppText style={styles.lineMonthly}>{formatPaise(plan.monthly.paise * item.quantity)}/mo</AppText>
            <AppText style={styles.lineTotal}>{formatPaise(plan.totalPayable.paise * item.quantity)} total</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  image: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.surface },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontSize: 14, fontWeight: font.bold, color: colors.ink },
  remove: { fontSize: 11.5, fontWeight: font.semibold, color: colors.danger },
  variant: { fontSize: 12, color: colors.bodyText, marginTop: 1 },
  plan: { fontSize: 11.5, color: colors.mutedText, marginTop: 4, lineHeight: 16 },
  fund: { fontSize: 10.5, color: colors.mutedText },
  cashback: { fontSize: 11, fontWeight: font.semibold, color: colors.success, marginTop: 4 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  lineMonthly: { fontSize: 13, fontWeight: font.heavy, color: colors.ink },
  lineTotal: { fontSize: 10.5, color: colors.mutedText, marginTop: 1 },
});
