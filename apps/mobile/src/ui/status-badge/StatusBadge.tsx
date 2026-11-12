import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, fontFamilies, fontSizes } from '@nova/ui-tokens'

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'pending'

export interface StatusBadgeProps {
  status: BadgeStatus
  label: string
  testID?: string
}

const config: Record<BadgeStatus, { bg: string; fg: string; dot: string }> = {
  success: { bg: colors.status.successBg, fg: colors.status.success, dot: colors.status.success },
  warning: { bg: colors.status.warningBg, fg: colors.status.warning, dot: colors.status.warning },
  error:   { bg: colors.status.errorBg,   fg: colors.status.error,   dot: colors.status.error },
  info:    { bg: colors.status.infoBg,    fg: colors.status.info,    dot: colors.status.info },
  pending: { bg: colors.status.pendingBg, fg: colors.status.pending, dot: colors.status.pending },
}

export function StatusBadge({ status, label, testID }: StatusBadgeProps) {
  const { bg, fg, dot } = config[status]

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: fg }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
  },
})
