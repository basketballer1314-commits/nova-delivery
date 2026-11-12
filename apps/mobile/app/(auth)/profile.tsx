import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, TextField } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/stores/auth'

export default function CreateProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('errors.required'))
      return
    }
    const userId = useAuth.getState().session?.user.id
    if (!userId) return
    setLoading(true)
    const { error: err } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', userId)
    if (err) {
      setLoading(false)
      setError(err.message)
      return
    }
    await useAuth.getState().loadProfile()
    setLoading(false)
    router.replace('/(client)')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('auth.create_profile_title')}
      </Text>
      <TextField
        label={t('auth.name_label')}
        value={name}
        onChangeText={setName}
        placeholder={t('auth.name_placeholder')}
        autoCapitalize="words"
        error={error}
        autoFocus
      />
      <Button
        label={t('auth.finish')}
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!name.trim()}
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
    gap: spacing[5],
  },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
})
