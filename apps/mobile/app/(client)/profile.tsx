import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'
import { useAuth, selectCanBeCourier } from '../../src/stores/auth'

export default function ClientProfileScreen() {
  const { t } = useTranslation()
  const profile = useAuth((s) => s.profile)
  const setMode = useAuth((s) => s.setMode)
  const signOut = useAuth((s) => s.signOut)
  const canBeCourier = useAuth(selectCanBeCourier)

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
        {/* Bouton visible uniquement si le livreur est approuvé (courier_profiles.status = APPROUVE) */}
        {canBeCourier && (
          <Button
            label={t('mode.driver')}
            variant="secondary"
            size="lg"
            onPress={() => setMode('livreur')}
          />
        )}
        <Button label={t('auth.logout')} variant="destructive" size="lg" onPress={signOut} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing[12],
    justifyContent: 'space-between',
    paddingBottom: spacing[10],
  },
  header: { gap: spacing[2] },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  name: { fontFamily: fontFamilies.body, fontSize: fontSizes.base, color: colors.text.secondary },
  actions: { gap: spacing[3] },
})
