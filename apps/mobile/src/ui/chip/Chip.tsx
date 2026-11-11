import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, fontFamilies, fontSizes } from '@nova/ui-tokens'

export interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  onDismiss?: () => void
  testID?: string
}

export function Chip({ label, selected = false, onPress, onDismiss, testID }: ChipProps) {
  const bg = selected ? colors.action.primary : colors.surface.subtle
  const fg = selected ? colors.action.primaryText : colors.text.primary
  const borderCol = selected ? colors.action.primary : colors.border.default

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg, borderColor: borderCol, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: fg }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          accessibilityLabel={`Retirer ${label}`}
          hitSlop={8}
          style={styles.dismiss}
        >
          <View style={[styles.dismissDot, { backgroundColor: fg }]} />
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    minHeight: 36,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
  },
  dismiss: { justifyContent: 'center', alignItems: 'center', width: 16, height: 16 },
  dismissDot: { width: 8, height: 8, borderRadius: 4 },
})
