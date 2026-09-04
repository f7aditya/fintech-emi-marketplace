import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamilyForWeight } from '../theme';

/**
 * Drop-in replacement for RN <Text> that renders in Poppins. It reads the
 * resolved `fontWeight` from the passed style and picks the matching Poppins
 * family (RN can't weight-match @expo-google-fonts families by itself).
 * An explicit `fontFamily` in the style still wins.
 */
export default function AppText({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[{ color: colors.bodyText }, style]} />;
}
