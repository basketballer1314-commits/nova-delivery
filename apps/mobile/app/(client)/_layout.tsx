import { Tabs } from 'expo-router'
import { colors } from '@nova/ui-tokens'

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface.base },
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.text.disabled,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  )
}
