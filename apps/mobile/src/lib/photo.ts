import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

const MAX_BYTES = 150 * 1024 // 150 Ko

async function uriSize(uri: string): Promise<number> {
  const blob = await fetch(uri).then((r) => r.blob())
  return blob.size
}

/**
 * Ouvre la galerie, compresse l'image en WebP sous 150 Ko.
 * Renvoie l'URI locale compressée, ou null (annulé / permission refusée / trop lourde).
 */
export async function pickAndCompressWebp(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  })
  if (res.canceled || !res.assets[0]) return null

  let width = 1080
  let quality = 0.8
  let uri = res.assets[0].uri

  for (let i = 0; i < 6; i++) {
    const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], {
      compress: quality,
      format: ImageManipulator.SaveFormat.WEBP,
    })
    if ((await uriSize(out.uri)) <= MAX_BYTES) return out.uri
    quality = Math.max(0.3, quality - 0.15)
    width = Math.round(width * 0.85)
    uri = out.uri
  }
  return null
}

export function randomFileName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
}

export async function uploadAddressPhoto(userId: string, localUri: string): Promise<string | null> {
  const { supabase } = await import('./supabase')
  const path = `${userId}/${randomFileName()}`
  const arrayBuffer = await fetch(localUri).then((r) => r.arrayBuffer())
  const { error } = await supabase.storage.from('addresses').upload(path, arrayBuffer, {
    contentType: 'image/webp',
    upsert: false,
  })
  if (error) return null
  return path
}
