import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import { colors, radii, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'

export interface TextFieldProps extends TextInputProps {
  label: string
  hint?: string
  error?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  testID?: string
}

export function TextField({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  testID,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const borderCol = error ? colors.border.error : focused ? colors.border.focus : colors.border.default

  return (
    <View style={styles.wrapper} testID={testID}>
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <View style={[styles.inputRow, { borderColor: borderCol }]}>
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
        <TextInput
          style={[styles.input, iconLeft ? styles.inputWithIconLeft : undefined]}
          placeholderTextColor={colors.text.disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          maxFontSizeMultiplier={1.3}
          {...inputProps}
        />
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </View>
      {error ? (
        <Text style={styles.error} maxFontSizeMultiplier={1.3} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint} maxFontSizeMultiplier={1.3}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input,
    borderWidth: 1.5,
    borderRadius: radii.md,
    height: 52,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.text.primary,
  },
  inputWithIconLeft: { paddingLeft: 8 },
  iconLeft: { marginRight: 4 },
  iconRight: { marginLeft: 4 },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.status.error,
  },
})
