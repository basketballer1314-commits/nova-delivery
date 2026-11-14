import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { colors, radii } from '@nova/ui-tokens'

export interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  testID?: string
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = radii.sm,
  testID,
}: SkeletonProps) {
  const { t } = useTranslation()
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [opacity])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <View testID={testID} accessibilityLabel={t('a11y.loading')}>
      <Animated.View
        style={[styles.base, { width: width as number, height, borderRadius }, animStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface.subtle },
})
