import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, radius, shadow, spacing } from '../theme';
import type { Product } from '../types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} asChild>
      <Pressable style={styles.card} accessibilityRole="button">
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: product.heroImage }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.brandTag}>
            <AppText style={styles.brandTagText}>{product.brand}</AppText>
          </View>
        </View>

        <View style={styles.body}>
          <AppText style={styles.name} numberOfLines={1}>
            {product.name}
          </AppText>
          <AppText style={styles.tagline} numberOfLines={2}>
            {product.tagline}
          </AppText>

          <View style={styles.swatchRow}>
            {product.variants.slice(0, 4).map((v) => (
              <View key={v.id} style={[styles.swatch, { backgroundColor: v.color.hex }]} />
            ))}
            <AppText style={styles.variantCount}>{product.variantCount} variants</AppText>
          </View>

          <View style={styles.footer}>
            <View>
              <AppText style={styles.startingLabel}>Starting at</AppText>
              <AppText style={styles.price}>{product.startingPrice?.display}</AppText>
            </View>
            <View style={styles.emiPill}>
              <AppText style={styles.emiPillText}>No Cost EMI</AppText>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  brandTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  brandTagText: { fontSize: 11, fontWeight: font.bold, color: colors.bodyText },
  body: { padding: spacing.md, gap: 6 },
  name: { fontSize: 14.5, fontWeight: font.bold, color: colors.ink },
  tagline: { fontSize: 12, color: colors.mutedText, lineHeight: 16, minHeight: 32 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  variantCount: { fontSize: 11, color: colors.mutedText, marginLeft: 2 },
  footer: {
    marginTop: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  startingLabel: { fontSize: 10.5, color: colors.mutedText },
  price: { fontSize: 16, fontWeight: font.heavy, color: colors.ink },
  emiPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  emiPillText: { fontSize: 11, fontWeight: font.bold, color: colors.primary },
});
