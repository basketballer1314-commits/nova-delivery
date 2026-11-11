import { Tabs } from 'expo-router'
import { colors } from '@nova/ui-tokens'

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.driver.background },
        tabBarActiveTintColor: colors.driver.tabActive,
        tabBarInactiveTintColor: colors.driver.tabInactive,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tableau de bord' }} />
    </Tabs>
  )
}
