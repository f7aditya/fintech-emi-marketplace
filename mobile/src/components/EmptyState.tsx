import {
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';

import { colors, font, spacing } from '../theme';

export default function EmptyState({ emoji, title, message }: { emoji: string; title: string; message: string }) {
  return (
    <View style={styles.wrap}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: font.bold, color: colors.ink, marginBottom: 4 },
  message: { fontSize: 13, color: colors.mutedText, textAlign: 'center', lineHeight: 19 },
});
