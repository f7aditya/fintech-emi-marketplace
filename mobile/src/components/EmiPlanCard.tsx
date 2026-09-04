import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, radius, spacing } from '../theme';
import type { EmiPlan } from '../types';

type Props = { plan: EmiPlan; selected: boolean; onSelect: (id: string) => void };

export default function EmiPlanCard({ plan, selected, onSelect }: Props) {
  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.headRow}>
          <AppText style={styles.monthly}>
            {plan.monthly.display}
            <AppText style={styles.perMonth}> / mo</AppText>
          </AppText>
          <AppText style={styles.tenure}>× {plan.tenureMonths} months</AppText>
          {plan.isRecommended && (
            <View style={styles.recTag}>
              <AppText style={styles.recText}>RECOMMENDED</AppText>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <AppText style={styles.meta}>
            Interest: <AppText style={styles.metaStrong}>{plan.interestLabel}</AppText>
          </AppText>
          <AppText style={styles.meta}>
            Down: <AppText style={styles.metaStrong}>{plan.downPayment.display}</AppText>
          </AppText>
          <AppText style={styles.meta}>
            Total: <AppText style={styles.metaStrong}>{plan.totalPayable.display}</AppText>
          </AppText>
        </View>

        {plan.cashback && (
          <View style={styles.cashback}>
            <AppText style={styles.cashbackText}>
              🎁 {plan.cashback.display} cashback — {plan.cashback.note}
            </AppText>
          </View>
        )}

        <AppText style={styles.fund}>
          Backed by <AppText style={styles.fundName}>{plan.fundName}</AppText> · via {plan.provider}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: '#F7F9FF' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  headRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  monthly: { fontSize: 15, fontWeight: font.heavy, color: colors.ink },
  perMonth: { fontSize: 12.5, fontWeight: font.medium, color: colors.mutedText },
  tenure: { fontSize: 12.5, color: colors.mutedText },
  recTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  recText: { fontSize: 9.5, fontWeight: font.heavy, color: '#fff', letterSpacing: 0.4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 6 },
  meta: { fontSize: 11.5, color: colors.mutedText },
  metaStrong: { color: colors.bodyText, fontWeight: font.semibold },
  cashback: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  cashbackText: { fontSize: 11.5, fontWeight: font.semibold, color: colors.success },
  fund: { fontSize: 10.5, color: colors.mutedText, marginTop: spacing.sm },
  fundName: { color: colors.bodyText, fontWeight: font.medium },
});
