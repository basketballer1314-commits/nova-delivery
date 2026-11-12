// Primitives
const navy900 = '#0E2A47'
const orange500 = '#FF6B35'
const orange600 = '#D04318'
const orange700 = '#A8360F'
const lagune500 = '#0FA3A3'
const lagune600 = '#0A8384'
const sand100 = '#F7F1E8'
const gray100 = '#EBEEF2'
const gray200 = '#D9DEE5'
const gray500 = '#617086'
const gray600 = '#4F5D70'
const white = '#FFFFFF'
const black = '#000000'

export const primitives = {
  navy900,
  orange500,
  orange600,
  orange700,
  lagune500,
  lagune600,
  sand100,
  gray100,
  gray200,
  gray500,
  gray600,
  white,
  black,
  success: '#0F7B45',
  warning: '#F4B400',
  error: '#C2183C',
} as const

// Rôles sémantiques
export const colors = {
  text: {
    primary: navy900,
    secondary: gray600,
    disabled: gray500,
    inverse: white,
    link: orange700,
    price: navy900,
  },
  surface: {
    base: sand100,
    card: white,
    input: white,
    overlay: `${navy900}CC`,
    subtle: gray100,
  },
  border: {
    default: gray200,
    focus: orange600,
    error: '#C2183C',
  },
  action: {
    primary: orange600,
    primaryHover: orange700,
    primaryText: white,
    parcel: lagune600,
    parcelText: white,
    secondary: gray100,
    secondaryText: navy900,
    tertiary: 'transparent',
    tertiaryText: orange600,
    destructive: '#C2183C',
    destructiveText: white,
    disabled: gray200,
    disabledText: gray500,
  },
  service: {
    food: orange500,
    foodText: navy900,
    parcel: lagune500,
    parcelText: white,
  },
  status: {
    success: '#0F7B45',
    successBg: '#E6F4ED',
    warning: '#F4B400',
    warningBg: '#FEF8E1',
    error: '#C2183C',
    errorBg: '#FBEAED',
    info: lagune500,
    infoBg: '#E6F5F5',
    pending: gray500,
    pendingBg: gray100,
  },
  brand: {
    navy: navy900,
    orange: orange500,
    lagune: lagune500,
  },
  driver: {
    background: navy900,
    tabActive: orange500,
    tabInactive: gray500,
    text: white,
    textSecondary: gray200,
    card: '#1A3D5C',
  },
} as const

export type Colors = typeof colors
