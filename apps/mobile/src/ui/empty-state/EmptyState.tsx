import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../button/Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  testID?: string
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID} accessibilityRole="text">
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} size="md" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  icon: { marginBottom: spacing[2] },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  action: { marginTop: spacing[2] },
})
