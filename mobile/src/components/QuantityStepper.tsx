import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, radius } from '../theme';

type Props = { value: number; min?: number; max?: number; onChange: (next: number) => void };

export default function QuantityStepper({ value, min = 1, max = 10, onChange }: Props) {
  const Btn = ({ label, delta, disabled }: { label: string; delta: number; disabled: boolean }) => (
    <Pressable
      onPress={() => onChange(value + delta)}
      disabled={disabled}
      hitSlop={6}
      style={[styles.btn, disabled && styles.btnDisabled]}
      accessibilityRole="button"
      accessibilityLabel={delta > 0 ? 'Increase quantity' : 'Decrease quantity'}>
      <AppText style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label}</AppText>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <Btn label="−" delta={-1} disabled={value <= min} />
      <AppText style={styles.value}>{value}</AppText>
      <Btn label="+" delta={1} disabled={value >= max} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  btn: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: font.bold, color: colors.primary, lineHeight: 18 },
  btnTextDisabled: { color: colors.mutedText },
  value: { minWidth: 30, textAlign: 'center', fontSize: 13, fontWeight: font.bold, color: colors.ink },
});
