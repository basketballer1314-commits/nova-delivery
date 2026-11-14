import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
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
import { ToastProvider, OfflineBanner } from '../src/ui'
import { useAuth } from '../src/stores/auth'
import { useSettings } from '../src/stores/settings'
import { resolveRoute } from '../src/lib/routing'
import { queryClient, asyncStoragePersister, DAY_MS } from '../src/lib/query'
import { configureNotificationHandler, registerForPush } from '../src/lib/notifications'

SplashScreen.preventAutoHideAsync()
configureNotificationHandler()

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
  const session = useAuth((s) => s.session)
  const initSettings = useSettings((s) => s.init)
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
    initSettings()
  }, [init, initSettings])

  // Enregistre le token push dès qu'une session est active.
  useEffect(() => {
    if (session?.user.id) {
      registerForPush(session.user.id).catch(() => {})
    }
  }, [session?.user.id])

  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, initialized])

  useAuthGuard()

  if (!fontsLoaded || !initialized) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: DAY_MS }}
      >
        <ToastProvider>
          <OfflineBanner />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(client)" options={{ headerShown: false }} />
            <Stack.Screen name="(livreur)" options={{ headerShown: false }} />
            <Stack.Screen name="dev/catalogue" options={{ title: 'Catalogue UI', headerShown: true }} />
          </Stack>
          <StatusBar style="auto" />
        </ToastProvider>
      </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
