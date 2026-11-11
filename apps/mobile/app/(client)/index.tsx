import { StyleSheet, Text, View } from 'react-native'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'

export default function ClientHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text} maxFontSizeMultiplier={1.3}>
        Accueil client
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
  },
  text: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.text.primary,
  },
})
