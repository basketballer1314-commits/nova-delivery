import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, TextField } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'

// Formate les chiffres sénégalais : 77 123 45 67
function formatLocal(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return parts.join(' ')
}

export default function PhoneScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const phone = '+221' + digits
  const valid = digits.length === 9

  const submit = async () => {
    if (!valid) {
      setError(t('errors.phone_invalid'))
      return
    }
    setError(undefined)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push({ pathname: '/(auth)/otp', params: { phone } })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('auth.phone_label')}
      </Text>
      <View style={styles.row}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+221</Text>
        </View>
        <View style={styles.field}>
          <TextField
            label=""
            value={formatLocal(digits)}
            onChangeText={(v) => setDigits(v.replace(/\D/g, '').slice(0, 9))}
            placeholder="77 123 45 67"
            keyboardType="phone-pad"
            hint={t('auth.phone_hint')}
            error={error}
            autoFocus
          />
        </View>
      </View>
      <Button
        label={t('auth.login')}
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
    gap: spacing[6],
  },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
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
