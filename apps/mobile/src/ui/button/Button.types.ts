import type { PressableProps } from 'react-native'

export type ButtonVariant = 'primary' | 'parcel' | 'secondary' | 'tertiary' | 'destructive'
export type ButtonSize = 'lg' | 'md' | 'sm'

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  accessibilityLabel?: string
  testID?: string
}
