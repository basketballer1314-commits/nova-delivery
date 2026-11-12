import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
import '../src/i18n'
import { ToastProvider } from '../src/ui'
import { useAuth } from '../src/stores/auth'
import { resolveRoute } from '../src/lib/routing'

SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  anchor: '(auth)',
}

// Garde : redirige vers le bon groupe selon session / profil / mode.
function useAuthGuard() {
  const router = useRouter()
  const segments = useSegments()
  const { session, profile, mode, courierStatus, initialized } = useAuth()

  useEffect(() => {
    if (!initialized) return
    const segs = segments as string[]
    const seg0 = segs[0]
    if (seg0 === 'dev') return // écran de dev laissé libre

    const inAuth = seg0 === '(auth)'
    const hasName = !!profile?.full_name

    if (!session) {
      if (!inAuth) router.replace('/(auth)')
      return
    }
    if (!hasName) {
      if (!(inAuth && segs[1] === 'profile')) router.replace('/(auth)/profile')
      return
    }
    const target = resolveRoute({ hasSession: true, hasProfileName: true, mode, courierStatus })
    if (seg0 !== target) {
      router.replace(target === '(livreur)' ? '/(livreur)' : '/(client)')
    }
  }, [initialized, session, profile, mode, courierStatus, segments, router])
}

export default function RootLayout() {
  const init = useAuth((s) => s.init)
  const initialized = useAuth((s) => s.initialized)
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  })

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, initialized])

  useAuthGuard()

  if (!fontsLoaded || !initialized) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(client)" options={{ headerShown: false }} />
          <Stack.Screen name="(livreur)" options={{ headerShown: false }} />
          <Stack.Screen name="dev/catalogue" options={{ title: 'Catalogue UI', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </ToastProvider>
    </GestureHandlerRootView>
  )
}
