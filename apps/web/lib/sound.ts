'use client'

// Alerte sonore via WebAudio (aucun fichier binaire). Les navigateurs bloquent
// l'audio sans geste utilisateur → on crée/débloque le contexte sur le bouton
// « Activer le son », puis on répète le bip jusqu'à l'action.
let ctx: AudioContext | null = null
let timer: ReturnType<typeof setInterval> | null = null

export function unlockSound(): boolean {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    beep() // bip de confirmation
    return true
  } catch {
    return false
  }
}

function beep() {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.36)
}

// Répète l'alerte jusqu'à stopAlert().
export function startAlert() {
  if (!ctx || timer) return
  beep()
  timer = setInterval(beep, 2500)
}

export function stopAlert() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function isSoundReady(): boolean {
  return ctx !== null && ctx.state === 'running'
}
