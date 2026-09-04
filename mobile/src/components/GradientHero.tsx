import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, radius, spacing } from '../theme';

/**
 * The rounded violet→deep-violet gradient panel the 1Fi app uses at the top of
 * Home / Limit / EMI Dues. Pass `safeTop` on the topmost hero of a screen.
 */
export default function GradientHero({
  children,
  safeTop = false,
  style,
}: {
  children: React.ReactNode;
  safeTop?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        safeTop && { paddingTop: insets.top + spacing.lg, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
        style,
      ]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
});
