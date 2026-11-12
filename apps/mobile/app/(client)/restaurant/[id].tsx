import { useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type RNBottomSheet from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { colors, fontFamilies, fontSizes, radii, spacing } from '@nova/ui-tokens'
import { BottomSheet, Button, Card, Price, Skeleton, useToast } from '../../../src/ui'
import { supabase } from '../../../src/lib/supabase'
import { useCart } from '../../../src/stores/cart'

interface MenuItem {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  available: boolean
  image_path: string | null
}
interface Category {
  id: string
  name: string
  position: number
}

function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const [{ data: resto }, { data: cats }, { data: items }] = await Promise.all([
        supabase.from('restaurants').select('id, name, logo_path').eq('id', id).single(),
        supabase.from('menu_categories').select('id, name, position').eq('restaurant_id', id).order('position'),
        supabase.from('menu_items').select('id, category_id, name, description, price, available, image_path').eq('restaurant_id', id),
      ])
      return { resto, cats: (cats ?? []) as Category[], items: (items ?? []) as MenuItem[] }
    },
  })
}

export default function RestaurantScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { show } = useToast()
  const { data, isLoading } = useRestaurant(id)
  const sheetRef = useRef<RNBottomSheet>(null)
  const [selected, setSelected] = useState<MenuItem | null>(null)

  const addItem = useCart((s) => s.addItem)
  const conflict = useCart((s) => s.conflict)
  const resolveConflict = useCart((s) => s.resolveConflict)

  const openItem = (item: MenuItem) => {
    setSelected(item)
    sheetRef.current?.expand()
  }

  const add = () => {
    if (!selected || !data?.resto) return
    addItem(id, data.resto.name, {
      menuItemId: selected.id,
      name: selected.name,
      unitPrice: selected.price,
      quantity: 1,
    })
    sheetRef.current?.close()
    show(t('restaurant.add_item', { price: `${selected.price} FCFA` }), 'success')
  }

  if (isLoading || !data?.resto) {
    return (
      <View style={styles.loading}>
        <Skeleton height={180} borderRadius={0} />
        <View style={styles.loadingBody}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={72} borderRadius={16} />
          <Skeleton height={72} borderRadius={16} />
        </View>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Image source={data.resto.logo_path ?? undefined} style={styles.hero} contentFit="cover" />
        <Text style={styles.name} maxFontSizeMultiplier={1.3}>
          {data.resto.name}
        </Text>

        {data.cats.map((cat) => {
          const items = data.items.filter((i) => i.category_id === cat.id)
          if (items.length === 0) return null
          return (
            <View key={cat.id} style={styles.section}>
              <Text style={styles.catTitle} maxFontSizeMultiplier={1.3}>
                {cat.name}
              </Text>
              {items.map((item) => (
                <Pressable key={item.id} onPress={() => openItem(item)} disabled={!item.available}>
                  <Card elevationLevel="sm">
                    <View style={[styles.itemRow, !item.available && styles.unavailable]}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} maxFontSizeMultiplier={1.3}>
                          {item.name}
                        </Text>
                        {item.description ? (
                          <Text style={styles.itemDesc} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      <Price amount={item.price} size="base" />
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )
        })}
      </ScrollView>

      {/* Fiche plat */}
      <BottomSheet ref={sheetRef} index={-1} snapPoints={['55%']} enablePanDownToClose title={selected?.name}>
        {selected ? (
          <View style={styles.sheet}>
            <Image source={selected.image_path ?? undefined} style={styles.sheetImage} contentFit="cover" />
            {selected.description ? (
              <Text style={styles.itemDesc} maxFontSizeMultiplier={1.3}>
                {selected.description}
              </Text>
            ) : null}
            <Button
              label={t('restaurant.add_item', { price: `${selected.price} FCFA` })}
              variant="primary"
              size="lg"
              onPress={add}
            />
          </View>
        ) : null}
      </BottomSheet>

      {/* Conflit mono-restaurant */}
      {conflict ? (
        <BottomSheet
          index={0}
          snapPoints={['40%']}
          enablePanDownToClose
          onClose={() => resolveConflict(false)}
          title={t('restaurant.conflict_title')}
        >
          <View style={styles.sheet}>
            <Text style={styles.itemDesc} maxFontSizeMultiplier={1.3}>
              {t('restaurant.conflict_desc')}
            </Text>
            <Button label={t('restaurant.conflict_replace')} variant="destructive" size="lg" onPress={() => resolveConflict(true)} />
            <Button label={t('restaurant.conflict_keep')} variant="secondary" size="md" onPress={() => resolveConflict(false)} />
          </View>
        </BottomSheet>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { paddingBottom: spacing[12] },
  hero: { width: '100%', height: 180, backgroundColor: colors.surface.subtle },
  name: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.text.primary,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing[4],
  },
  section: { paddingHorizontal: spacing.screen, paddingTop: spacing[4], gap: spacing[2] },
  catTitle: { fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.text.primary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  unavailable: { opacity: 0.4 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.base, color: colors.text.primary },
  itemDesc: { fontFamily: fontFamilies.body, fontSize: fontSizes.sm, color: colors.text.secondary },
  loading: { flex: 1, backgroundColor: colors.surface.base },
  loadingBody: { padding: spacing.screen, gap: spacing[3] },
  sheet: { gap: spacing[4] },
  sheetImage: { width: '100%', height: 140, borderRadius: radii.md, backgroundColor: colors.surface.subtle },
})
