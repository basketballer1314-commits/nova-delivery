import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import { Button, Card, Skeleton, TextField } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'
import { useAddress } from '../../src/stores/address'
import { restaurantOpenState, type Hour } from '../../src/lib/hours'

interface RestaurantRow {
  id: string
  name: string
  zone_id: number | null
  prep_time_minutes: number
  rating_avg: number | null
  rating_count: number
  restaurant_hours: Hour[]
}

function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants', 'list'],
    queryFn: async (): Promise<RestaurantRow[]> => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, zone_id, prep_time_minutes, rating_avg, rating_count, restaurant_hours(weekday, open_time, close_time)')
        .eq('status', 'ACTIF')
        .order('rating_avg', { ascending: false, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as unknown as RestaurantRow[]
    },
  })
}

// Frais de livraison food depuis la zone de l'adresse courante.
function useDeliveryFees(fromZone: number | null) {
  return useQuery({
    enabled: fromZone != null,
    queryKey: ['zone_prices', 'food', fromZone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone_prices')
        .select('to_zone, price')
        .eq('service', 'food')
        .eq('from_zone', fromZone!)
        .is('valid_to', null)
      if (error) throw error
      const map: Record<number, number> = {}
      for (const r of data ?? []) map[r.to_zone] = r.price
      return map
    },
  })
}

export default function RestaurantsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const current = useAddress((s) => s.current)
  const [search, setSearch] = useState('')
  const { data: restaurants, isLoading } = useRestaurants()
  const { data: fees } = useDeliveryFees(current?.zoneId ?? null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return restaurants ?? []
    return (restaurants ?? []).filter((r) => r.name.toLowerCase().includes(q))
  }, [restaurants, search])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('restaurant.list_title')}
      </Text>
      <TextField
        label=""
        value={search}
        onChangeText={setSearch}
        placeholder={t('restaurant.search_placeholder')}
        returnKeyType="search"
      />

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={96} borderRadius={16} />
          <Skeleton height={96} borderRadius={16} />
          <Skeleton height={96} borderRadius={16} />
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty} maxFontSizeMultiplier={1.3}>
          {t('restaurant.empty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {filtered.map((r) => {
            const state = restaurantOpenState(r.restaurant_hours ?? [], new Date())
            const fee = r.zone_id != null && fees ? fees[r.zone_id] : undefined
            return (
              <Pressable
                key={r.id}
                disabled={!state.open}
                onPress={() => router.push(`/(client)/restaurant/${r.id}`)}
                accessibilityRole="button"
              >
                <Card elevationLevel="sm">
                  <View style={[styles.rowCard, !state.open && styles.closedCard]}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.name} maxFontSizeMultiplier={1.3}>
                        {r.name}
                      </Text>
                      <Text style={styles.meta} maxFontSizeMultiplier={1.3}>
                        {r.rating_avg != null ? `★ ${r.rating_avg} (${r.rating_count})` : t('restaurant.no_rating')}
                        {'  ·  '}
                        {t('restaurant.prep_minutes', { minutes: r.prep_time_minutes })}
                        {fee != null ? `  ·  ${t('restaurant.delivery_fee', { amount: `${fee} FCFA` })}` : ''}
                      </Text>
                      {!state.open && state.opensAt ? (
                        <Text style={styles.closed} maxFontSizeMultiplier={1.3}>
                          {t('restaurant.opens_at', { time: state.opensAt })}
                        </Text>
                      ) : null}
                    </View>
                    {!state.open ? (
                      <Button label={t('restaurant.schedule')} variant="secondary" size="sm" disabled onPress={() => {}} />
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.screen, gap: spacing[4], paddingBottom: spacing[12] },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  list: { gap: spacing[3] },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  closedCard: { opacity: 0.5 },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontFamily: fontFamilies.heading, fontSize: fontSizes.base, color: colors.text.primary },
  meta: { fontFamily: fontFamilies.body, fontSize: fontSizes.sm, color: colors.text.secondary },
  closed: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.xs, color: colors.status.warning },
  empty: { fontFamily: fontFamilies.body, fontSize: fontSizes.base, color: colors.text.secondary, textAlign: 'center', marginTop: spacing[8] },
})
