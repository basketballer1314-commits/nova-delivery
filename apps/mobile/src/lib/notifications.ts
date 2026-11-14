import * as Notifications from 'expo-notifications'
import { AndroidImportance } from 'expo-notifications'
import type { PermissionResponse } from 'expo-modules-core'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { useSettings } from '../stores/settings'
import { haptic } from './haptics'

// Charte p.23 : maximum 2 notifications par commande côté client.
const MAX_PER_ORDER = 2
const COUNT_KEY = 'nova.notifCounts'

async function orderNotifCount(orderId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    return map[orderId] ?? 0
  } catch {
    return 0
  }
}
async function bumpOrderNotif(orderId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[orderId] = (map[orderId] ?? 0) + 1
    await AsyncStorage.setItem(COUNT_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

// Affiche la notification en avant-plan, en respectant la limite par commande.
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const orderId = (notification.request.content.data?.order_id as string | undefined) ?? null
      let allow = true
      if (orderId) {
        const count = await orderNotifCount(orderId)
        if (count >= MAX_PER_ORDER) allow = false
        else await bumpOrderNotif(orderId)
      }
      return {
        shouldShowBanner: allow,
        shouldShowList: allow,
        shouldPlaySound: allow,
        shouldSetBadge: false,
      }
    },
  })
}

// Enregistre le token Expo dans public.push_tokens.
export async function registerForPush(userId: string): Promise<string | null> {
  // Le type PermissionResponse ré-exporté par expo ne résout pas ses membres
  // dans ce monorepo ; on l'annote depuis expo-modules-core (même objet runtime).
  let perm = (await Notifications.getPermissionsAsync()) as PermissionResponse
  if (!perm.granted && perm.canAskAgain) {
    perm = (await Notifications.requestPermissionsAsync()) as PermissionResponse
  }
  if (!perm.granted) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId
  const resp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  const token = resp.data
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: 'expo' },
    { onConflict: 'token' },
  )
  return token
}

// Nouvelle course (livreur) : vibration forte + son, que le livreur peut couper.
export async function notifyNewCourse(title: string, body: string): Promise<void> {
  await haptic('heavy')
  const soundOn = useSettings.getState().newCourseSound
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: soundOn ? 'default' : undefined },
    trigger: null,
  })
}
