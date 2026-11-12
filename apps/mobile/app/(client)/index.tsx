import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { colors, fontFamilies, fontSizes, radii, spacing } from '@nova/ui-tokens'
import { Card, Chip, Skeleton, TextField } from '../../src/ui'
import { useAuth } from '../../src/stores/auth'
import { useAddress } from '../../src/stores/address'
import { supabase } from '../../src/lib/supabase'
import { greeting, firstName } from '../../src/lib/greeting'

function useNearbyRestaurants() {
  return useQuery({
    queryKey: ['restaurants', 'nearby'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, status')
        .eq('status', 'ACTIF')
        .limit(5)
      if (error) throw error
      return data
    },
  })
}

export default function ClientHomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const profile = useAuth((s) => s.profile)
  const current = useAddress((s) => s.current)
  const { data: restaurants, isLoading } = useNearbyRestaurants()

  const hello =
    greeting(new Date().getHours()) === 'morning' ? t('home.greeting_morning') : t('home.greeting_evening')
  const name = firstName(profile?.full_name)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Adresse de livraison — tout en haut */}
      <Pressable
        style={styles.addressBar}
        onPress={() => router.push('/(client)/address-book')}
        accessibilityRole="button"
        accessibilityLabel={t('home.deliver_to')}
      >
        <Text style={styles.addressLabel} maxFontSizeMultiplier={1.3}>
          {t('home.deliver_to')}
        </Text>
        <Text style={styles.addressValue} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {current
            ? current.label ?? current.quartier ?? `${current.lat.toFixed(4)}, ${current.lng.toFixed(4)}`
            : t('home.add_address')}
        </Text>
      </Pressable>

      <Text style={styles.greeting} maxFontSizeMultiplier={1.3}>
        {hello}
        {name ? ` ${name}` : ''}
      </Text>

      <TextField label="" placeholder={t('home.search_placeholder')} returnKeyType="search" />

      {/* Deux grandes tuiles */}
      <View style={styles.tiles}>
        <Pressable style={[styles.tile, { backgroundColor: colors.service.food }]} accessibilityRole="button">
          <Text style={[styles.tileTitle, { color: colors.service.foodText }]} maxFontSizeMultiplier={1.3}>
            {t('home.tile_food')}
          </Text>
          <Text style={[styles.tileDesc, { color: colors.service.foodText }]} maxFontSizeMultiplier={1.3}>
            {t('home.tile_food_desc')}
          </Text>
        </Pressable>
        <Pressable style={[styles.tile, { backgroundColor: colors.service.parcel }]} accessibilityRole="button">
          <Text style={[styles.tileTitle, { color: colors.service.parcelText }]} maxFontSizeMultiplier={1.3}>
            {t('home.tile_parcel')}
          </Text>
          <Text style={[styles.tileDesc, { color: colors.service.parcelText }]} maxFontSizeMultiplier={1.3}>
            {t('home.tile_parcel_desc')}
          </Text>
        </Pressable>
      </View>

      {/* Chips de catégories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('home.cat_all')} selected />
        <Chip label={t('home.cat_meals')} />
        <Chip label={t('home.cat_fast')} />
        <Chip label={t('home.cat_drinks')} />
        <Chip label={t('home.cat_groceries')} />
      </ScrollView>

      {/* Près de chez vous */}
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
        {t('home.near_you')}
      </Text>
      {isLoading ? (
        <View style={styles.nearList}>
          <Skeleton height={72} borderRadius={16} />
          <Skeleton height={72} borderRadius={16} />
          <Skeleton height={72} borderRadius={16} />
        </View>
      ) : (
        <View style={styles.nearList}>
          {(restaurants ?? []).map((r) => (
            <Card key={r.id} elevationLevel="sm">
              <Text style={styles.restaurantName} maxFontSizeMultiplier={1.3}>
                {r.name}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.screen, gap: spacing[4], paddingBottom: spacing[12] },
  addressBar: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: 2,
  },
  addressLabel: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.xs, color: colors.text.secondary },
  addressValue: { fontFamily: fontFamilies.heading, fontSize: fontSizes.base, color: colors.text.primary },
  greeting: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  tiles: { flexDirection: 'row', gap: spacing[3] },
  tile: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
    minHeight: 110,
    justifyContent: 'flex-end',
    gap: 2,
  },
  tileTitle: { fontFamily: fontFamilies.heading, fontSize: fontSizes.xl },
  tileDesc: { fontFamily: fontFamilies.body, fontSize: fontSizes.sm },
  chips: { gap: spacing[2], paddingVertical: spacing[1] },
  sectionTitle: { fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.text.primary },
  nearList: { gap: spacing[3] },
  restaurantName: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.base, color: colors.text.primary },
})
