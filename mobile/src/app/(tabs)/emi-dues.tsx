import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import AppText from '../../components/AppText';
import StubScreen from '../../components/StubScreen';
import { colors, font, radius, spacing } from '../../theme';

export default function EmiDuesScreen() {
  const router = useRouter();
  return (
    <StubScreen
      eyebrow="TOTAL OUTSTANDING"
      amount="₹0"
      amountCaption="ACTIVE LOANS · 0"
      note="This is the existing 1Fi EMI Dues screen — outside this assignment's scope. Orders you place from the 1Fi Marketplace are tracked under “Your orders”.">
      <Pressable style={styles.cta} onPress={() => router.push('/orders')}>
        <AppText style={styles.ctaText}>View your Marketplace orders</AppText>
      </Pressable>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  cta: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: font.bold },
});
