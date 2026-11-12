import type { Config } from 'tailwindcss'
import { primitives } from './colors'
import { boxShadows } from './elevation'

const novaPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        navy: { 900: primitives.navy900 },
        orange: {
          500: primitives.orange500,
          600: primitives.orange600,
          700: primitives.orange700,
        },
        lagune: {
          500: primitives.lagune500,
          600: primitives.lagune600,
        },
        sand: { 100: primitives.sand100 },
        gray: {
          100: primitives.gray100,
          200: primitives.gray200,
          500: primitives.gray500,
          600: primitives.gray600,
        },
        success: primitives.success,
        warning: primitives.warning,
        error: primitives.error,
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '64': '64px',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '16px',
        lg: '20px',
        xl: '28px',
        pill: '999px',
      },
      boxShadow: boxShadows,
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
}

export default novaPreset
