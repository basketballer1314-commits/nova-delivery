import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, TextField } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/stores/auth'

const RESEND_SECONDS = 60

export default function OtpScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  const verify = async () => {
    if (code.length !== 6 || !phone) return
    setError(undefined)
    setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    if (err) {
      setLoading(false)
      setError(t('errors.otp_invalid'))
      return
    }
    await useAuth.getState().loadProfile()
    setLoading(false)
    const hasName = !!useAuth.getState().profile?.full_name
    router.replace(hasName ? '/(client)' : '/(auth)/profile')
  }

  const resend = async () => {
    if (countdown > 0 || !phone) return
    await supabase.auth.signInWithOtp({ phone })
    setCountdown(RESEND_SECONDS)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('auth.otp_label')}
      </Text>
      <TextField
        label=""
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        hint={t('auth.otp_hint')}
        error={error}
        autoFocus
      />
      <Button
        label={t('auth.verify')}
        variant="primary"
        size="lg"
        loading={loading}
        disabled={code.length !== 6}
        onPress={verify}
      />
      <Button
        label={countdown > 0 ? t('auth.resend_in', { seconds: countdown }) : t('auth.resend_code')}
        variant="tertiary"
        size="md"
        disabled={countdown > 0}
        onPress={resend}
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
    gap: spacing[5],
  },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
})
