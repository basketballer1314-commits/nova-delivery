import React, { forwardRef } from 'react'
import { StyleSheet, Text } from 'react-native'
import RNBottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import type { BottomSheetProps as RNBottomSheetProps } from '@gorhom/bottom-sheet'
import { colors, radii, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'

export interface BottomSheetProps extends Omit<RNBottomSheetProps, 'children'> {
  title?: string
  children: React.ReactNode
}

export const BottomSheet = forwardRef<RNBottomSheet, BottomSheetProps>(
  ({ title, children, ...props }, ref) => {
    return (
      <RNBottomSheet
        ref={ref}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        {...props}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              {title}
            </Text>
          )}
          {children}
        </BottomSheetView>
      </RNBottomSheet>
    )
  },
)

BottomSheet.displayName = 'BottomSheet'

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  handle: {
    backgroundColor: colors.border.default,
    width: 40,
    height: 4,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing[8],
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
})
