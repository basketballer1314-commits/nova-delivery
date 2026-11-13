'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@nova/shared'

export default function AdminLogin({ supabase }: { supabase: SupabaseClient<Database> }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('+221')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const normalized = phone.replace(/\s/g, '')

  async function send() {
    setError(null)
    if (!/^\+[0-9]{8,15}$/.test(normalized)) return setError('Format +221…')
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
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-100">
      <div className="w-[360px] rounded-lg border border-gray-200 bg-white p-32 shadow-md">
        <h1 className="font-heading text-2xl font-semibold text-navy-900">NOVA — Back-office</h1>
        <p className="mt-4 text-[14px] text-gray-600">Connexion administrateur</p>

        {step === 'phone' ? (
          <div className="mt-24 flex flex-col gap-12">
            <label className="text-[13px] text-gray-600">Téléphone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-40 rounded-sm border border-gray-200 px-12 text-[14px] tabular-nums"
            />
            <button onClick={send} disabled={busy} className="h-40 rounded-pill bg-orange-600 text-[14px] text-white disabled:opacity-50">
              Recevoir le code
            </button>
          </div>
        ) : (
          <div className="mt-24 flex flex-col gap-12">
            <label className="text-[13px] text-gray-600">Code SMS</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              className="h-40 rounded-sm border border-gray-200 px-12 text-center text-2xl tabular-nums tracking-[0.3em]"
            />
            <button onClick={verify} disabled={busy} className="h-40 rounded-pill bg-orange-600 text-[14px] text-white disabled:opacity-50">
              Se connecter
            </button>
          </div>
        )}
        {error && <p className="mt-12 text-[13px] text-error">{error}</p>}
      </div>
    </div>
  )
}
