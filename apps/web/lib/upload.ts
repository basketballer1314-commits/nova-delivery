'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'

// Convertit un fichier image en WebP (canvas) côté client.
export async function toWebp(file: File, maxSize = 1024, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponible')
  ctx.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality))
  if (!blob) throw new Error('conversion WebP échouée')
  return blob
}

// Upload dans le bucket public « menu », chemin <restaurant_id>/<item_id>-<ts>.webp.
// La RLS storage vérifie l'appartenance au restaurant (dossier = restaurant_id).
export async function uploadMenuPhoto(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const blob = await toWebp(file)
  const path = `${restaurantId}/${itemId}-${Date.now()}.webp`
  const { error } = await supabase.storage.from('menu').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw error
  return path
}

export function menuPhotoUrl(supabase: SupabaseClient<Database>, path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('menu').getPublicUrl(path).data.publicUrl
}
