// Edge Function "send-sms" — branchée sur le Send SMS Hook de Supabase Auth.
// Reçoit l'OTP généré par GoTrue et l'envoie via un SmsProvider.
// Rate limit : 5 demandes par numéro et par heure (table public.sms_send_log).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { getSmsProvider } from './sms-provider.ts'

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 heure

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface SendSmsPayload {
  user: { phone: string }
  sms: { otp: string }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const raw = await req.text()

  // Vérifie la signature du hook (Standard Webhooks) si le secret est configuré.
  const secret = Deno.env.get('SEND_SMS_HOOK_SECRET')
  let payload: SendSmsPayload
  try {
    if (secret) {
      const wh = new Webhook(secret.replace('v1,whsec_', ''))
      payload = wh.verify(raw, Object.fromEntries(req.headers)) as SendSmsPayload
    } else {
      payload = JSON.parse(raw) as SendSmsPayload
    }
  } catch (_e) {
    return json({ error: 'signature invalide' }, 401)
  }

  const phone = payload.user?.phone
  const otp = payload.sms?.otp
  if (!phone || !otp) {
    return json({ error: 'payload incomplet' }, 400)
  }

  // Rate limit : 5 / numéro / heure.
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count, error: countErr } = await supabase
    .from('sms_send_log')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', since)

  if (countErr) {
    return json({ error: 'erreur rate limit' }, 500)
  }
  if ((count ?? 0) >= RATE_LIMIT) {
    return json({ error: 'trop de demandes, réessayez plus tard' }, 429)
  }

  // Envoi.
  try {
    const provider = getSmsProvider()
    await provider.send(phone, `NOVA : votre code de vérification est ${otp}`)
  } catch (_e) {
    return json({ error: 'echec envoi sms' }, 502)
  }

  await supabase.from('sms_send_log').insert({ phone })

  return json({ success: true })
})
