import { Tabs } from 'expo-router';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'WARDROBE' }} />
      <Tabs.Screen name="outfits" options={{ title: 'OUTFITS' }} />
    </Tabs>
  );
}
