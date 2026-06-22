import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

function TabLabel({ label, focused }) {
  return (
    <View style={styles.labelWrapper}>
      <Text style={[styles.labelText, { color: focused ? colors.text : colors.muted }]}>
        {label}
      </Text>
      <View style={[styles.indicator, { opacity: focused ? 1 : 0 }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => null,
          tabBarIconStyle: styles.noIcon,
          tabBarLabel: ({ focused }) => <TabLabel label="WARDROBE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          tabBarIcon: () => null,
          tabBarIconStyle: styles.noIcon,
          tabBarLabel: ({ focused }) => <TabLabel label="OUTFITS" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(244,241,235,0.96)',
    borderTopColor: 'rgba(20,17,13,0.1)',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 82,
    elevation: 0,
  },
  noIcon: {
    display: 'none',
  },
  labelWrapper: {
    alignItems: 'center',
    paddingTop: 18,
    gap: 8,
  },
  labelText: {
    fontSize: 10,
    letterSpacing: 3.5,
    fontWeight: '600',
  },
  indicator: {
    width: 16,
    height: 1,
    backgroundColor: colors.accent,
  },
});
