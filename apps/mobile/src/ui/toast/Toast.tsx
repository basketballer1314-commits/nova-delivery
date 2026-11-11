import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { colors, fontFamilies, fontSizes, radii, spacing, elevation } from '@nova/ui-tokens'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
  actionLabel?: string
  onAction?: () => void
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, actionLabel?: string, onAction?: () => void) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => undefined })

const variantColors: Record<ToastVariant, { bg: string; text: string; action: string }> = {
  success: { bg: colors.status.success,  text: '#fff', action: '#fff' },
  error:   { bg: colors.status.error,    text: '#fff', action: '#fff' },
  warning: { bg: colors.status.warning,  text: colors.text.primary, action: colors.text.primary },
  info:    { bg: colors.status.info,     text: '#fff', action: '#fff' },
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const translateY = useSharedValue(-80)
  const opacity = useSharedValue(0)
  const { bg, text, action } = variantColors[toast.variant]

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })

    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss, translateY, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg }, animStyle, elevation.md]}>
      <Text style={[styles.message, { color: text }]} maxFontSizeMultiplier={1.3} numberOfLines={2}>
        {toast.message}
      </Text>
      <View style={styles.actions}>
        {toast.actionLabel && toast.onAction && (
          <Pressable
            onPress={() => { toast.onAction?.(); onDismiss() }}
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
          >
            <Text style={[styles.actionText, { color: action }]}>{toast.actionLabel}</Text>
          </Pressable>
        )}
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Fermer">
          <Text style={[styles.actionText, { color: action }]}>Annuler</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counter = useRef(0)

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info', actionLabel?: string, onAction?: () => void) => {
      const id = `toast-${++counter.current}`
      setToasts((prev) => [...prev.slice(-2), { id, message, variant, actionLabel, onAction }])
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: spacing.screen,
    right: spacing.screen,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  message: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
  },
  actions: { flexDirection: 'row', gap: 12 },
  actionText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.sm,
  },
})
