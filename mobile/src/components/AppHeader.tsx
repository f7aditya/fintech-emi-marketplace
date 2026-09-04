import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useCart } from '../cart';
import { colors, font, radius, spacing } from '../theme';

type Props = { title: string; showBack?: boolean; subtitle?: string; showCart?: boolean };

export default function AppHeader({ title, subtitle, showBack = false, showCart = true }: Props) {
  const insets = useSafeAreaInsets();
  const { totals } = useCart();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/shop'))}
            hitSlop={12}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <AppText style={styles.backIcon}>‹</AppText>
          </Pressable>
        ) : (
          <View style={styles.brandMark}>
            <AppText style={styles.brandMarkText}>1</AppText>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <AppText style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {showCart ? (
          <Pressable
            onPress={() => router.push('/cart')}
            hitSlop={10}
            style={styles.cartBtn}
            accessibilityRole="button"
            accessibilityLabel={`Bucket, ${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`}>
            <AppText style={styles.cartIcon}>🧺</AppText>
            {totals.itemCount > 0 && (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{totals.itemCount > 99 ? '99+' : totals.itemCount}</AppText>
              </View>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 30, color: colors.ink, fontWeight: font.bold },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#fff', fontWeight: font.heavy, fontSize: 16 },
  title: { fontSize: 20, fontWeight: font.heavy, color: colors.ink },
  subtitle: { fontSize: 13, color: colors.mutedText, marginTop: 1 },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: { fontSize: 18 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: font.heavy },
});
