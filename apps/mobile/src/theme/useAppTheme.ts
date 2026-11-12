import { colors } from '@nova/ui-tokens'
import { useAuth } from '../stores/auth'

// Thème dérivé du mode : le mode livreur bascule sur fond navy.
export function useAppTheme() {
  const mode = useAuth((s) => s.mode)
  const isDriver = mode === 'livreur'
  return {
    isDriver,
    background: isDriver ? colors.driver.background : colors.surface.base,
    text: isDriver ? colors.driver.text : colors.text.primary,
    textSecondary: isDriver ? colors.driver.textSecondary : colors.text.secondary,
    accent: isDriver ? colors.driver.tabActive : colors.action.primary,
  }
}
