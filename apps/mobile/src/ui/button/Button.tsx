import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, buttonHeights, radii, fontFamilies, fontSizes } from '@nova/ui-tokens'
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types'

const bgColor: Record<ButtonVariant, string> = {
  primary: colors.action.primary,
  parcel: colors.action.parcel,
  secondary: colors.action.secondary,
  tertiary: 'transparent',
  destructive: colors.action.destructive,
}

const textColor: Record<ButtonVariant, string> = {
  primary: colors.action.primaryText,
  parcel: colors.action.parcelText,
  secondary: colors.action.secondaryText,
  tertiary: colors.action.tertiaryText,
  destructive: colors.action.destructiveText,
}

const borderColor: Record<ButtonVariant, string | undefined> = {
  primary: undefined,
  parcel: undefined,
  secondary: colors.border.default,
  tertiary: undefined,
  destructive: undefined,
}

const heights: Record<ButtonSize, number> = {
  lg: buttonHeights.lg,
  md: buttonHeights.md,
  sm: buttonHeights.sm,
}

const textSizes: Record<ButtonSize, number> = {
  lg: fontSizes.base,
  md: fontSizes.base,
  sm: fontSizes.sm,
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  accessibilityLabel,
  testID,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  const bg = isDisabled ? colors.action.disabled : bgColor[variant]
  const fg = isDisabled ? colors.action.disabledText : textColor[variant]
  const border = borderColor[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border ? 1 : 0,
          opacity: pressed && !isDisabled ? 0.85 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.row}>
          {iconLeft}
          <Text
            style={[styles.label, { color: fg, fontSize: textSizes[size] }]}
            maxFontSizeMultiplier={1.3}
          >
            {label}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fontFamilies.button,
    letterSpacing: 0.1,
  },
})
