import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'
import { useAuth } from '../../src/stores/auth'

export default function DriverProfileScreen() {
  const { t } = useTranslation()
  const profile = useAuth((s) => s.profile)
  const setMode = useAuth((s) => s.setMode)
  const signOut = useAuth((s) => s.signOut)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          {t('mode.profile')}
        </Text>
        {profile?.full_name ? (
          <Text style={styles.name} maxFontSizeMultiplier={1.3}>
            {profile.full_name}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label={t('mode.client')} variant="secondary" size="lg" onPress={() => setMode('client')} />
        <Button label={t('auth.logout')} variant="destructive" size="lg" onPress={signOut} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.driver.background,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing[12],
    justifyContent: 'space-between',
    paddingBottom: spacing[10],
  },
  header: { gap: spacing[2] },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.driver.text },
  name: { fontFamily: fontFamilies.body, fontSize: fontSizes.base, color: colors.driver.textSecondary },
  actions: { gap: spacing[3] },
})
