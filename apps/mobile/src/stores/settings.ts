import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AccessibilityInfo } from 'react-native'

// Réglages transverses : son nouvelle course (livreur), animations réduites,
// délai d'offre réglable 45 → 60 s (charte §3).
const SOUND_KEY = 'nova.newCourseSound'
const DELAY_KEY = 'nova.offerDelaySeconds'

export const OFFER_DELAY_MIN = 45
export const OFFER_DELAY_MAX = 60

interface SettingsState {
  newCourseSound: boolean
  reduceMotion: boolean
  offerDelaySeconds: number
  init: () => Promise<void>
  setNewCourseSound: (on: boolean) => Promise<void>
  setOfferDelaySeconds: (s: number) => Promise<void>
  setReduceMotion: (on: boolean) => void
}

function clampDelay(s: number): number {
  return Math.max(OFFER_DELAY_MIN, Math.min(OFFER_DELAY_MAX, Math.round(s)))
}

export const useSettings = create<SettingsState>((set) => ({
  newCourseSound: true,
  reduceMotion: false,
  offerDelaySeconds: OFFER_DELAY_MIN,

  init: async () => {
    const [sound, delay] = await Promise.all([
      AsyncStorage.getItem(SOUND_KEY),
      AsyncStorage.getItem(DELAY_KEY),
    ])
    set({
      newCourseSound: sound == null ? true : sound === '1',
      offerDelaySeconds: delay ? clampDelay(parseInt(delay, 10)) : OFFER_DELAY_MIN,
    })
    // Animations réduites selon le réglage système.
    const reduce = await AccessibilityInfo.isReduceMotionEnabled()
    set({ reduceMotion: reduce })
    AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => set({ reduceMotion: on }))
  },

  setNewCourseSound: async (on) => {
    await AsyncStorage.setItem(SOUND_KEY, on ? '1' : '0')
    set({ newCourseSound: on })
  },
  setOfferDelaySeconds: async (s) => {
    const v = clampDelay(s)
    await AsyncStorage.setItem(DELAY_KEY, String(v))
    set({ offerDelaySeconds: v })
  },
  setReduceMotion: (on) => set({ reduceMotion: on }),
}))
