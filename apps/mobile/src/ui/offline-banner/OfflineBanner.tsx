import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { useReachability } from '../../lib/reachability'

// Bandeau « Pas de connexion » navy, affiché tant que l'appareil est hors ligne.
export function OfflineBanner() {
  const online = useReachability()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  if (online) return null

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + spacing[2] }]}
      accessibilityRole="alert"
      accessibilityLabel={t('offline.banner')}
    >
      <Text style={styles.text} maxFontSizeMultiplier={1.3}>
        {t('offline.banner')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.driver.background,
    paddingBottom: spacing[2],
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.driver.text,
  },
})
