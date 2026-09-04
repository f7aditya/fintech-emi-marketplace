import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, radius, spacing } from '../theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <View style={styles.labelContainer}>
              <AppText
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {opt.label}
              </AppText>
              <View style={[styles.activeIndicator, !active && { backgroundColor: 'transparent' }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    padding: 6,
    gap: 4,
  },
  item: {
    flex: 1,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm, // slightly less bottom padding to accommodate the indicator
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.card,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // space between text and indicator
  },
  activeIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
  },
  label: { fontSize: 12, fontWeight: font.semibold, color: colors.mutedText, letterSpacing: -0.2 },
  labelActive: { color: colors.primary },
});
