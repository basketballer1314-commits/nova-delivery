import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, TextField, useToast } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'

export default function OutOfZoneScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { show } = useToast()
  const { area } = useLocalSearchParams<{ area?: string }>()
  const [digits, setDigits] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = digits.length === 9

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    const { error } = await supabase.from('zone_waitlist').insert({
      phone: '+221' + digits,
      quartier: area || null,
    })
    setLoading(false)
    if (error) {
      show(t('errors.generic'), 'error')
      return
    }
    show(t('zone.thanks'), 'success')
    router.back()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('zone.out_title', { area: area || '…' })}
      </Text>
      <Text style={styles.desc} maxFontSizeMultiplier={1.3}>
        {t('zone.out_desc')}
      </Text>

      <View style={styles.row}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+221</Text>
        </View>
        <View style={styles.field}>
          <TextField
            label=""
            value={digits}
            onChangeText={(v) => setDigits(v.replace(/\D/g, '').slice(0, 9))}
            placeholder="77 123 45 67"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <Button
        label={t('zone.notify_me')}
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!valid}
        onPress={submit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing[12],
    gap: spacing[4],
  },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  desc: { fontFamily: fontFamilies.body, fontSize: fontSizes.base, color: colors.text.secondary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  prefix: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: 16,
    backgroundColor: colors.surface.input,
  },
  prefixText: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.base, color: colors.text.primary },
  field: { flex: 1 },
})
