import { useRef, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'

const { width } = Dimensions.get('window')

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const slides = [
    { title: t('onboarding.slide1_title'), desc: t('onboarding.slide1_desc') },
    { title: t('onboarding.slide2_title'), desc: t('onboarding.slide2_desc') },
    { title: t('onboarding.slide3_title'), desc: t('onboarding.slide3_desc') },
  ]

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }

  const next = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true })
    } else {
      router.push('/(auth)/language')
    }
  }

  return (
    <View style={styles.container}>
      <Button
        label={t('auth.skip')}
        variant="tertiary"
        size="sm"
        onPress={() => router.push('/(auth)/language')}
        accessibilityLabel={t('auth.skip')}
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              {s.title}
            </Text>
            <Text style={styles.desc} maxFontSizeMultiplier={1.3}>
              {s.desc}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        <Button label={t('common.next')} variant="primary" size="lg" onPress={next} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base, paddingVertical: spacing[8] },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.screen, gap: spacing[4] },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.text.primary,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginVertical: spacing[4] },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.border.default },
  dotActive: { backgroundColor: colors.action.primary, width: 20 },
  footer: { paddingHorizontal: spacing.screen },
})
