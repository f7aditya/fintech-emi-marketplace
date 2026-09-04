import {
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { formatPaise } from '../format';
import { colors, font, radius, spacing } from '../theme';

type Row = { label: string; paise: number; hint?: string; strong?: boolean; positive?: boolean };

export default function OrderSummaryCard({
  monthlyPaise,
  downPaymentPaise,
  cashbackPaise,
  totalPayablePaise,
  itemCount,
}: {
  monthlyPaise: number;
  downPaymentPaise: number;
  cashbackPaise: number;
  totalPayablePaise: number;
  itemCount: number;
}) {
  const rows: Row[] = [
    { label: `Total monthly EMI (${itemCount} item${itemCount === 1 ? '' : 's'})`, paise: monthlyPaise, strong: true },
    { label: 'Due today (down payment)', paise: downPaymentPaise, hint: downPaymentPaise === 0 ? '₹0 — nothing upfront' : undefined },
  ];
  if (cashbackPaise > 0) rows.push({ label: 'Cashback (as 1Fi units)', paise: cashbackPaise, positive: true });

  return (
    <View style={styles.card}>
      <AppText style={styles.heading}>Order summary</AppText>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText style={[styles.label, r.strong && styles.labelStrong]}>{r.label}</AppText>
            {r.hint ? <AppText style={styles.hint}>{r.hint}</AppText> : null}
          </View>
          <AppText style={[styles.value, r.strong && styles.valueStrong, r.positive && styles.valuePositive]}>
            {r.positive ? '− ' : ''}
            {formatPaise(r.paise)}
          </AppText>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText style={styles.grandLabel}>Total payable over tenure</AppText>
        <AppText style={styles.grandValue}>{formatPaise(totalPayablePaise)}</AppText>
      </View>
      <AppText style={styles.note}>Net of cashback. Your instalments stay invested in the backing 1Fi fund until debited.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heading: { fontSize: 15, fontWeight: font.bold, color: colors.ink, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  label: { fontSize: 12.5, color: colors.bodyText },
  labelStrong: { fontWeight: font.semibold, color: colors.ink },
  hint: { fontSize: 10.5, color: colors.mutedText, marginTop: 1 },
  value: { fontSize: 12.5, color: colors.bodyText },
  valueStrong: { fontSize: 14, fontWeight: font.heavy, color: colors.ink },
  valuePositive: { color: colors.success, fontWeight: font.semibold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.xs },
  grandLabel: { fontSize: 13, fontWeight: font.bold, color: colors.ink },
  grandValue: { fontSize: 15, fontWeight: font.heavy, color: colors.primary },
  note: { fontSize: 10.5, color: colors.mutedText, marginTop: 4, lineHeight: 15 },
});
