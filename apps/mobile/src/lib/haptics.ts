import * as Haptics from 'expo-haptics'
import type { HapticKind } from '@nova/ui-tokens'

// Table des vibrations (charte p.24) → expo-haptics.
export async function haptic(kind: HapticKind): Promise<void> {
  try {
    switch (kind) {
      case 'success':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      case 'warning':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      case 'error':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      case 'selection':
        return await Haptics.selectionAsync()
      case 'light':
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      case 'medium':
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      case 'heavy':
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  } catch {
    // Haptics indisponible (émulateur) : on ignore silencieusement.
  }
}
