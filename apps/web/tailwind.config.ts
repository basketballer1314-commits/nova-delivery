import type { Config } from 'tailwindcss'
import novaPreset from '@nova/ui-tokens/tailwind'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [novaPreset as Config],
  theme: { extend: {} },
  plugins: [],
}

export default config
