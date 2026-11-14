import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, radii, spacing } from '@nova/ui-tokens'
import { Button } from '../../src/ui'
import { useAuth } from '../../src/stores/auth'
import { useSettings, OFFER_DELAY_MIN, OFFER_DELAY_MAX } from '../../src/stores/settings'
import { haptic } from '../../src/lib/haptics'

const DELAY_STEP = 5

export default function DriverProfileScreen() {
  const { t } = useTranslation()
  const profile = useAuth((s) => s.profile)
  const setMode = useAuth((s) => s.setMode)
  const signOut = useAuth((s) => s.signOut)

  const newCourseSound = useSettings((s) => s.newCourseSound)
  const setNewCourseSound = useSettings((s) => s.setNewCourseSound)
  const offerDelaySeconds = useSettings((s) => s.offerDelaySeconds)
  const setOfferDelaySeconds = useSettings((s) => s.setOfferDelaySeconds)
  const reduceMotion = useSettings((s) => s.reduceMotion)

  const changeDelay = (delta: number) => {
    void haptic('selection')
    void setOfferDelaySeconds(offerDelaySeconds + delta)
  }

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

      <View style={styles.settings}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
          {t('settings.title')}
        </Text>

        {/* Son des nouvelles courses — le livreur peut le couper (§1). */}
        <View style={styles.row} accessible accessibilityRole="switch" accessibilityState={{ checked: newCourseSound }}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              {t('settings.new_course_sound')}
            </Text>
            <Text style={styles.rowDesc} maxFontSizeMultiplier={1.3}>
              {t('settings.new_course_sound_desc')}
            </Text>
          </View>
          <Switch
            value={newCourseSound}
            onValueChange={(on) => {
              void haptic('selection')
              void setNewCourseSound(on)
            }}
            accessibilityLabel={t('settings.new_course_sound')}
            trackColor={{ true: colors.brand.orange }}
          />
        </View>

        {/* Délai d'offre réglable 45 → 60 s (§3). */}
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              {t('settings.offer_delay')}
            </Text>
            <Text style={styles.rowDesc} maxFontSizeMultiplier={1.3}>
              {t('settings.offer_delay_desc')}
            </Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepBtn, offerDelaySeconds <= OFFER_DELAY_MIN && styles.stepBtnOff]}
              disabled={offerDelaySeconds <= OFFER_DELAY_MIN}
              onPress={() => changeDelay(-DELAY_STEP)}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.decrease')}
            >
              <Text style={styles.stepSign} maxFontSizeMultiplier={1.3}>−</Text>
            </Pressable>
            <Text style={styles.stepValue} maxFontSizeMultiplier={1.3}>
              {t('settings.seconds', { seconds: offerDelaySeconds })}
            </Text>
            <Pressable
              style={[styles.stepBtn, offerDelaySeconds >= OFFER_DELAY_MAX && styles.stepBtnOff]}
              disabled={offerDelaySeconds >= OFFER_DELAY_MAX}
              onPress={() => changeDelay(DELAY_STEP)}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.increase')}
            >
              <Text style={styles.stepSign} maxFontSizeMultiplier={1.3}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Animations réduites : piloté par le système (lecture seule). */}
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              {t('settings.reduce_motion')}
            </Text>
            <Text style={styles.rowDesc} maxFontSizeMultiplier={1.3}>
              {t('settings.reduce_motion_system')}
            </Text>
          </View>
          <Text style={styles.rowState} maxFontSizeMultiplier={1.3}>
            {reduceMotion ? t('status.confirmed') : t('status.cancelled')}
          </Text>
        </View>
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
  settings: { gap: spacing[3], marginTop: spacing[6] },
  sectionTitle: {
    fontFamily: fontFamilies.headingMedium,
    fontSize: fontSizes.lg,
    color: colors.driver.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    backgroundColor: colors.driver.card,
    borderRadius: radii.md,
    padding: spacing[4],
  },
  rowText: { flex: 1, gap: spacing[1] },
  rowLabel: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.base, color: colors.driver.text },
  rowDesc: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.driver.textSecondary },
  rowState: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.sm, color: colors.driver.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { backgroundColor: colors.driver.card, borderWidth: 1, borderColor: colors.driver.textSecondary },
  stepSign: { fontFamily: fontFamilies.headingBold, fontSize: fontSizes.xl, color: colors.brand.navy },
  stepValue: {
    fontFamily: fontFamilies.price,
    fontSize: fontSizes.base,
    color: colors.driver.text,
    minWidth: 48,
    textAlign: 'center',
  },
  actions: { gap: spacing[3], marginTop: spacing[6] },
})
