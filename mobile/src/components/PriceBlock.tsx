import {
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, radius, spacing } from '../theme';
import type { Variant } from '../types';

export default function PriceBlock({ variant }: { variant: Variant }) {
  const hasDiscount = variant.discount?.paise > 0;
  return (
    <View>
      <View style={styles.row}>
        <AppText style={styles.price}>{variant.price.display}</AppText>
        {hasDiscount && (
          <>
            <AppText style={styles.mrp}>{variant.mrp.display}</AppText>
            <View style={styles.offTag}>
              <AppText style={styles.offText}>{variant.discount.percent}% off</AppText>
            </View>
          </>
        )}
      </View>
      <AppText style={styles.tax}>Inclusive of all taxes</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  price: { fontSize: 28, fontWeight: font.heavy, color: colors.ink },
  mrp: { fontSize: 15, color: colors.mutedText, textDecorationLine: 'line-through' },
  offTag: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  offText: { fontSize: 12.5, fontWeight: font.bold, color: colors.success },
  tax: { fontSize: 11.5, color: colors.mutedText, marginTop: 4 },
});
