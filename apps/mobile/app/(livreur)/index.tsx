import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'

export default function DriverDashboardScreen() {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <Text style={styles.text} maxFontSizeMultiplier={1.3}>
        {t('driver.dashboard_title')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.driver.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  text: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.driver.text,
  },
})
