import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { Check } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, durations, easingBezier } from '@nova/ui-tokens'
import { useSettings } from '../../stores/settings'

// Animation « livrée » : le point orange grossit puis devient une coche.
// Respecte « animations réduites » (affichage immédiat de la coche).
export function DeliveredCheck({ size = 72, onDone }: { size?: number; onDone?: () => void }) {
  const { t } = useTranslation()
  const reduceMotion = useSettings((s) => s.reduceMotion)
  const scale = useSharedValue(reduceMotion ? 1 : 0.2)
  const check = useSharedValue(reduceMotion ? 1 : 0)
  const bezier = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3])

  useEffect(() => {
    if (reduceMotion) {
      onDone?.()
      return
    }
    scale.value = withSequence(
      withTiming(1.15, { duration: durations.slow, easing: bezier }),
      withTiming(1, { duration: durations.fast, easing: bezier }),
    )
    check.value = withTiming(1, { duration: durations.base, easing: bezier }, (finished) => {
      if (finished && onDone) runOnJS(onDone)()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: check.value }] }))

  return (
    <View accessibilityRole="image" accessibilityLabel={t('a11y.delivered')}>
      <Animated.View
        style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }, dotStyle]}
      >
        <Animated.View style={checkStyle}>
          <Check size={size * 0.5} color={colors.surface.base} weight="bold" />
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
