import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { PressableProps, ViewProps } from 'react-native'
import { colors, radii, elevation, spacing } from '@nova/ui-tokens'

type CardElevation = 'sm' | 'md'

interface CardBaseProps {
  children: React.ReactNode
  elevationLevel?: CardElevation
  testID?: string
}

interface PressableCardProps extends CardBaseProps, Omit<PressableProps, 'style' | 'children'> {
  onPress: PressableProps['onPress']
}

interface StaticCardProps extends CardBaseProps, Omit<ViewProps, 'style' | 'children'> {
  onPress?: never
}

export type CardProps = PressableCardProps | StaticCardProps

export function Card({ children, elevationLevel = 'sm', testID, onPress, ...rest }: CardProps) {
  const shadow = elevation[elevationLevel]
  const style = [styles.card, shadow]

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [...style, pressed && styles.pressed]}
        accessibilityRole="button"
        {...(rest as Omit<PressableProps, 'style' | 'children' | 'onPress'>)}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <View style={style} testID={testID} {...(rest as Omit<ViewProps, 'style' | 'children'>)}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  pressed: { opacity: 0.9 },
})
