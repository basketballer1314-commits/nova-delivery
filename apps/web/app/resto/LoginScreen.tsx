'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'
import type { Dict, Lang } from '../../lib/i18n'

// Connexion par téléphone (OTP SMS). E.164 (+221…).
export default function LoginScreen({
  supabase,
  dict,
  lang,
  setLang,
}: {
  supabase: SupabaseClient<Database>
  dict: Dict
  lang: Lang
  setLang: (l: Lang) => void
}) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('+221')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalized = phone.replace(/\s/g, '')
  const phoneValid = /^\+[0-9]{8,15}$/.test(normalized)

  async function sendCode() {
    setError(null)
    if (!phoneValid) {
      setError('Format +221…')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  async function verify() {
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ phone: normalized, token: code.trim(), type: 'sms' })
    setBusy(false)
    if (error) setError(error.message)
    // succès → onAuthStateChange met à jour la session dans le provider
  }

  return (
    <div className="flex min-h-screen flex-col justify-center gap-24 p-20">
      <div className="flex justify-end">
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="h-40 rounded-pill border border-gray-200 px-16 font-body text-16 text-gray-600"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      <h1 className="font-heading text-4xl font-semibold text-navy-900">{dict.appName}</h1>
      <p className="font-body text-16 text-gray-600">{dict.loginTitle}</p>

      {step === 'phone' ? (
        <div className="flex flex-col gap-16">
          <label className="font-body text-16 text-gray-600">{dict.phoneLabel}</label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-56 rounded-md border border-gray-200 bg-white px-16 font-body text-16 tabular-nums"
            placeholder="+221 77 000 00 00"
          />
          <button
            onClick={sendCode}
            disabled={busy || !phoneValid}
            className="h-56 rounded-pill bg-orange-600 font-heading text-16 text-white disabled:opacity-50"
          >
            {dict.sendCode}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <label className="font-body text-16 text-gray-600">{dict.codeLabel}</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-56 rounded-md border border-gray-200 bg-white px-16 text-center font-body text-4xl tabular-nums tracking-[0.3em]"
            placeholder="______"
            maxLength={6}
          />
          <button
            onClick={verify}
            disabled={busy || code.trim().length < 4}
            className="h-56 rounded-pill bg-orange-600 font-heading text-16 text-white disabled:opacity-50"
          >
            {dict.verify}
          </button>
          <button onClick={sendCode} disabled={busy} className="h-40 font-body text-16 text-orange-700">
            {dict.resend}
          </button>
        </div>
      )}

      {error && <p className="font-body text-16 text-error">{error}</p>}
    </div>
  )
}
