import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'

const LANG_KEY = 'nova.lang'

export default function LanguageScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const choose = async (lng: 'fr' | 'en') => {
    await i18n.changeLanguage(lng)
    await AsyncStorage.setItem(LANG_KEY, lng)
    router.push('/(auth)/phone')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('auth.choose_language')}
      </Text>
      <View style={styles.choices}>
        <Button
          label="Français"
          variant={i18n.language === 'fr' ? 'primary' : 'secondary'}
          size="lg"
          onPress={() => choose('fr')}
        />
        <Button
          label="English"
          variant={i18n.language === 'en' ? 'primary' : 'secondary'}
          size="lg"
          onPress={() => choose('en')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.screen,
    justifyContent: 'center',
    gap: spacing[8],
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.text.primary,
    textAlign: 'center',
  },
  choices: { gap: spacing[4] },
})
