// Edge Function "send-push" — envoie une notification push via l'API Expo Push.
// Déclenchée par un trigger Postgres (pg_net) à l'insertion d'une ligne
// public.notifications (sauf type 'sms'). Textes charte p.23 : titre ≤ 40,
// corps ≤ 90 (qui / quoi / quand). Secret partagé vérifié (x-push-secret).
import { serviceClient, json } from '../_shared/supabase.ts'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const TITLE_MAX = 40
const BODY_MAX = 90

function clamp(s: string | null | undefined, max: number): string {
  const t = (s ?? '').trim()
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…'
}

interface PushRequest {
  notification_id?: string
  user_id: string
  title?: string
  body?: string
  data?: Record<string, unknown>
}

Deno.serve(async (req) => {
  // Secret partagé (appel serveur uniquement).
  const expected = Deno.env.get('PUSH_HOOK_SECRET')
  if (expected && req.headers.get('x-push-secret') !== expected) {
    return json({ error: 'non autorisé' }, 401)
  }

  let body: PushRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'json invalide' }, 400)
  }
  if (!body.user_id) return json({ error: 'user_id manquant' }, 400)

  const db = serviceClient()

  // Idempotence : ne pas renvoyer une notification déjà poussée.
  if (body.notification_id) {
    const { data: n } = await db
      .from('notifications')
      .select('id, pushed_at')
      .eq('id', body.notification_id)
      .maybeSingle()
    if (n?.pushed_at) return json({ reused: true })
  }

  const { data: tokens } = await db
    .from('push_tokens')
    .select('token')
    .eq('user_id', body.user_id)
    .eq('platform', 'expo')
  if (!tokens || tokens.length === 0) return json({ sent: 0 })

  const messages = tokens.map((t) => ({
    to: t.token,
    title: clamp(body.title, TITLE_MAX),
    body: clamp(body.body, BODY_MAX),
    sound: 'default',
    priority: 'high',
    channelId: 'default',
    data: body.data ?? {},
  }))

  let sent = 0
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    })
    if (res.ok) sent = messages.length
  } catch (_e) {
    return json({ error: 'echec envoi push' }, 502)
  }

  if (body.notification_id) {
    await db.from('notifications').update({ pushed_at: new Date().toISOString() }).eq('id', body.notification_id)
  }

  return json({ sent })
})
