import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, font } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ focused, name, filled }: { focused: boolean; name: IconName; filled: IconName }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.indicator, focused && styles.indicatorOn]} />
      <Ionicons
        name={focused ? filled : name}
        size={22}
        color={focused ? colors.primary : colors.mutedText}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11, fontWeight: font.medium },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: (p) => <TabIcon {...p} name="home-outline" filled="home" /> }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Shop', tabBarIcon: (p) => <TabIcon {...p} name="storefront-outline" filled="storefront" /> }}
      />
      <Tabs.Screen
        name="emi-dues"
        options={{ title: 'EMI Dues', tabBarIcon: (p) => <TabIcon {...p} name="receipt-outline" filled="receipt" /> }}
      />
      <Tabs.Screen
        name="limit"
        options={{ title: 'Limit', tabBarIcon: (p) => <TabIcon {...p} name="stats-chart-outline" filled="stats-chart" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: (p) => <TabIcon {...p} name="person-outline" filled="person" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 5,
  },
  indicatorOn: { backgroundColor: colors.primary },
});
