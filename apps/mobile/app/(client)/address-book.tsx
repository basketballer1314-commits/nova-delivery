import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, Card, Chip, EmptyState, Skeleton } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'
import { useAddress } from '../../src/stores/address'

function useMyAddresses() {
  return useQuery({
    queryKey: ['addresses', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_addresses')
      if (error) throw error
      return data
    },
  })
}

export default function AddressBookScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const setCurrent = useAddress((s) => s.setCurrent)
  const { data: addresses, isLoading } = useMyAddresses()

  const choose = (a: NonNullable<typeof addresses>[number]) => {
    setCurrent({ id: a.id, label: a.label, quartier: a.quartier, lat: a.lat, lng: a.lng, zoneId: a.zone_id })
    router.back()
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('address.book_title')}
      </Text>

      {/* Libellés rapides */}
      <View style={styles.labels}>
        <Chip label={t('address.label_home')} />
        <Chip label={t('address.label_work')} />
        <Chip label={t('address.label_hotel')} />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={64} borderRadius={16} />
          <Skeleton height={64} borderRadius={16} />
        </View>
      ) : (addresses ?? []).length === 0 ? (
        <EmptyState
          title={t('address.empty')}
          actionLabel={t('home.add_address')}
          onAction={() => router.push('/(client)/address')}
        />
      ) : (
        <View style={styles.list}>
          {(addresses ?? []).map((a) => (
            <Pressable key={a.id} onPress={() => choose(a)} accessibilityRole="button">
              <Card elevationLevel="sm">
                <Text style={styles.name} maxFontSizeMultiplier={1.3}>
                  {a.label ?? a.quartier ?? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`}
                </Text>
                {a.quartier ? (
                  <Text style={styles.sub} maxFontSizeMultiplier={1.3}>
                    {a.quartier}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <Button
        label={t('home.add_address')}
        variant="primary"
        size="lg"
        onPress={() => router.push('/(client)/address')}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.screen, gap: spacing[4], paddingBottom: spacing[12] },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  labels: { flexDirection: 'row', gap: spacing[2] },
  list: { gap: spacing[3] },
  name: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.base, color: colors.text.primary },
  sub: { fontFamily: fontFamilies.body, fontSize: fontSizes.sm, color: colors.text.secondary },
})
