import { ScrollView, StyleSheet, View } from 'react-native';

import AppText from './AppText';
import GradientHero from './GradientHero';
import { colors, font, radius, spacing } from '../theme';

/**
 * Lightweight on-brand screen for the app tabs that are outside this
 * assignment's scope (Home / EMI Dues / Limit / Profile). Keeps navigation and
 * the 1Fi look consistent without re-implementing the real app.
 */
export default function StubScreen({
  eyebrow,
  amount,
  amountCaption,
  note,
  children,
}: {
  eyebrow: string;
  amount: string;
  amountCaption: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GradientHero safeTop>
        <AppText style={styles.eyebrow}>{eyebrow}</AppText>
        <AppText style={styles.amount}>{amount}</AppText>
        <AppText style={styles.amountCaption}>{amountCaption}</AppText>
      </GradientHero>

      <View style={styles.card}>
        <AppText style={styles.note}>{note}</AppText>
      </View>

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: font.bold, letterSpacing: 1 },
  amount: { color: '#fff', fontSize: 30, fontWeight: font.heavy, marginTop: 6 },
  amountCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: font.medium, letterSpacing: 0.6, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  note: { fontSize: 13, color: colors.bodyText, lineHeight: 19 },
});
