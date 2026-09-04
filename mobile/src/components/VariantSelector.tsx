import { Pressable, StyleSheet, View } from 'react-native';

import AppText from './AppText';
import { colors, font, radius, spacing } from '../theme';
import type { Variant } from '../types';

type Props = {
  variants: Variant[];
  selectedId: string;
  onSelect: (id: string) => void;
  productName?: string;
};

/**
 * Full-width radio rows, matching the "Pay using 1Fi" reference screen:
 * one row per variant with a title, a sub-line and the price on the right.
 */
export default function VariantSelector({ variants, selectedId, onSelect, productName }: Props) {
  return (
    <View style={{ gap: spacing.sm }}>
      {variants.map((v) => {
        const active = v.id === selectedId;
        return (
          <Pressable
            key={v.id}
            onPress={() => onSelect(v.id)}
            style={[styles.row, active && styles.rowActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}>
            <View style={[styles.radio, active && styles.radioOn]}>{active ? <View style={styles.radioDot} /> : null}</View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <View style={[styles.swatch, { backgroundColor: v.color.hex }]} />
                <AppText style={[styles.title, active && styles.titleActive]}>{v.label}</AppText>
              </View>
              <AppText style={styles.sub}>
                {productName ? `${productName} · ` : ''}
                {v.storage}
                {v.inStock ? '' : ' · Out of stock'}
              </AppText>
            </View>

            <AppText style={[styles.price, active && styles.titleActive]}>{v.price.display}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.15)' },
  title: { fontSize: 13.5, fontWeight: font.bold, color: colors.ink },
  titleActive: { color: colors.primary },
  sub: { fontSize: 11, color: colors.mutedText, marginTop: 3 },
  price: { fontSize: 13.5, fontWeight: font.bold, color: colors.ink },
});
