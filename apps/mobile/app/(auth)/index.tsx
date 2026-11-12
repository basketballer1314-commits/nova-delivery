import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'

export default function LaunchScreen() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          {t('auth.welcome_title')}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          {t('auth.welcome_subtitle')}
        </Text>
      </View>
      <Button
        label={t('auth.get_started')}
        variant="primary"
        size="lg"
        onPress={() => router.push('/(auth)/onboarding')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing[10],
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
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
