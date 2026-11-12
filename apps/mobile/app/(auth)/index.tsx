import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'

export default function WelcomeScreen() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('auth.welcome_title')}
      </Text>
      <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
        {t('auth.welcome_subtitle')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing[3],
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})
