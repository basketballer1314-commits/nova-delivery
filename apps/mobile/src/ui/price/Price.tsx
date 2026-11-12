import React from 'react'
import { Text } from 'react-native'
import type { TextProps } from 'react-native'
import { colors, fontFamilies, fontSizes } from '@nova/ui-tokens'

export interface PriceProps extends Omit<TextProps, 'children'> {
  amount: number
  size?: 'sm' | 'base' | 'lg' | 'xl'
  color?: string
}

// Espace insécable Unicode U+00A0
const NBSP = ' '

function formatFcfa(amount: number): string {
  // "4 500 FCFA" avec espace insécable entre milliers et avant FCFA
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return `${formatted}${NBSP}FCFA`
}

const sizes: Record<NonNullable<PriceProps['size']>, number> = {
  sm:   fontSizes.sm,
  base: fontSizes.base,
  lg:   fontSizes.lg,
  xl:   fontSizes['2xl'],
}

export function Price({ amount, size = 'base', color, style, ...rest }: PriceProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fontFamilies.price,
          fontSize: sizes[size],
          color: color ?? colors.text.price,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
      maxFontSizeMultiplier={1.3}
      accessibilityLabel={`${amount} francs CFA`}
      {...rest}
    >
      {formatFcfa(amount)}
    </Text>
  )
}
