import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import GradientHero from '../../components/GradientHero';
import { colors, font, radius, spacing } from '../../theme';

const PARTNERS = ['Apple', 'Samsung', 'OnePlus', 'Google', 'Croma', 'Vijay Sales'];
const WHY = [
  { icon: '％', title: '0% interest', body: 'Repay only what you spend.' },
  { icon: '↗', title: 'Stay invested', body: 'Funds keep growing while you pay.' },
  { icon: '⚡', title: 'Quick approvals', body: 'Limit against your mutual funds.' },
];

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GradientHero safeTop>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>LIMIT AVAILABLE</AppText>
        </View>
        <AppText style={styles.amount}>₹1,56,091</AppText>
        <AppText style={styles.amountCaption}>REMAINING TO SPEND</AppText>
        <Pressable style={styles.shopBtn} onPress={() => router.push('/shop')}>
          <AppText style={styles.shopBtnText}>Shop now</AppText>
        </Pressable>
      </GradientHero>

      <View style={styles.sectionRow}>
        <AppText style={styles.sectionLabel}>WHY PAY WITH 1FI</AppText>
      </View>
      <View style={styles.whyRow}>
        {WHY.map((w) => (
          <View key={w.title} style={styles.whyCard}>
            <AppText style={styles.whyIcon}>{w.icon}</AppText>
            <AppText style={styles.whyTitle}>{w.title}</AppText>
            <AppText style={styles.whyBody}>{w.body}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <AppText style={styles.sectionLabel}>OUR BRAND PARTNERS</AppText>
      </View>
      <View style={styles.partnerWrap}>
        {PARTNERS.map((p) => (
          <View key={p} style={styles.partnerChip}>
            <AppText style={styles.partnerText}>{p}</AppText>
          </View>
        ))}
      </View>

      <Pressable style={styles.cta} onPress={() => router.push('/shop')}>
        <AppText style={styles.ctaText}>Explore the 1Fi Marketplace</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  pillText: { color: '#fff', fontSize: 10, fontWeight: font.heavy, letterSpacing: 0.6 },
  amount: { color: '#fff', fontSize: 34, fontWeight: font.heavy, marginTop: spacing.md },
  amountCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: font.semibold, letterSpacing: 0.8, marginTop: 2 },
  shopBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2, marginTop: spacing.lg },
  shopBtnText: { color: colors.primary, fontSize: 14, fontWeight: font.bold },
  sectionRow: { marginTop: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: font.heavy, letterSpacing: 1, color: colors.primary },
  whyRow: { flexDirection: 'row', gap: spacing.md },
  whyCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: spacing.md, gap: 3 },
  whyIcon: { fontSize: 16, color: colors.primary },
  whyTitle: { fontSize: 12, fontWeight: font.bold, color: colors.ink },
  whyBody: { fontSize: 10.5, color: colors.mutedText, lineHeight: 14 },
  partnerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  partnerChip: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  partnerText: { fontSize: 12, fontWeight: font.semibold, color: colors.bodyText },
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.xs },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: font.bold },
});
