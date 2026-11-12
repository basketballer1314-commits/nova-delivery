import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors, fontFamilies, fontSizes, radii, spacing } from '@nova/ui-tokens'
import { Button, TextField, useToast } from '../../src/ui'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/stores/auth'
import { useAddress } from '../../src/stores/address'
import { pickAndCompressWebp, uploadAddressPhoto } from '../../src/lib/photo'

// Centre par défaut : Mbour.
const DEFAULT_REGION: Region = {
  latitude: 14.42,
  longitude: -16.96,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export default function AddressScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { show } = useToast()
  const setCurrent = useAddress((s) => s.setCurrent)

  const [coord, setCoord] = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude })
  const [quartier, setQuartier] = useState('')
  const [landmark, setLandmark] = useState('')
  const [floorGate, setFloorGate] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const addPhoto = async () => {
    const uri = await pickAndCompressWebp()
    if (uri) setPhotoUri(uri)
    else show(t('errors.generic'), 'error')
  }

  const save = async () => {
    const userId = useAuth.getState().session?.user.id
    if (!userId) return
    setSaving(true)

    // Contrôle de zone côté serveur.
    const { data: zoneId, error: zoneErr } = await supabase.rpc('check_zone', {
      _lat: coord.latitude,
      _lng: coord.longitude,
    })
    if (zoneErr) {
      setSaving(false)
      show(t('errors.generic'), 'error')
      return
    }
    if (zoneId == null) {
      setSaving(false)
      router.push({ pathname: '/(client)/out-of-zone', params: { area: quartier } })
      return
    }

    let photoPath: string | null = null
    if (photoUri) photoPath = await uploadAddressPhoto(userId, photoUri)

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: null,
        quartier: quartier || null,
        landmark_description: landmark || null,
        floor_gate: floorGate || null,
        zone_id: zoneId,
        photo_path: photoPath,
        location: `SRID=4326;POINT(${coord.longitude} ${coord.latitude})`,
      })
      .select('id')
      .single()

    setSaving(false)
    if (error || !data) {
      show(t('errors.generic'), 'error')
      return
    }

    setCurrent({
      id: data.id,
      label: null,
      quartier: quartier || null,
      lat: coord.latitude,
      lng: coord.longitude,
      zoneId,
    })
    router.back()
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {t('address.title')}
      </Text>

      <View style={styles.mapWrap}>
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={DEFAULT_REGION}>
          <Marker
            draggable
            coordinate={coord}
            onDragEnd={(e) => setCoord(e.nativeEvent.coordinate)}
          />
        </MapView>
      </View>
      <Text style={styles.hint} maxFontSizeMultiplier={1.3}>
        {t('address.move_pin')}
      </Text>

      <TextField label={t('address.quartier')} value={quartier} onChangeText={setQuartier} />
      <TextField
        label={t('address.landmark')}
        value={landmark}
        onChangeText={setLandmark}
        placeholder={t('address.landmark_placeholder')}
        multiline
      />
      <TextField label={t('address.floor_gate')} value={floorGate} onChangeText={setFloorGate} />

      <Button
        label={photoUri ? t('address.photo_added') : t('address.add_photo')}
        variant={photoUri ? 'secondary' : 'tertiary'}
        size="md"
        onPress={addPhoto}
      />

      <Button label={t('address.save')} variant="primary" size="lg" loading={saving} onPress={save} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing.screen, gap: spacing[4], paddingBottom: spacing[12] },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes['2xl'], color: colors.text.primary },
  mapWrap: { height: 260, borderRadius: radii.lg, overflow: 'hidden' },
  map: { flex: 1 },
  hint: { fontFamily: fontFamilies.body, fontSize: fontSizes.sm, color: colors.text.secondary },
})
