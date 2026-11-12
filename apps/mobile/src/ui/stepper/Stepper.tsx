import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fontFamilies, fontSizes, radii } from '@nova/ui-tokens'

export interface StepperStep {
  label: string
}

export interface StepperProps {
  steps: [StepperStep, StepperStep, ...StepperStep[]] // 2–4 étapes
  currentStep: number // 0-indexed
  testID?: string
}

type StepState = 'done' | 'active' | 'upcoming'

function getState(index: number, current: number): StepState {
  if (index < current) return 'done'
  if (index === current) return 'active'
  return 'upcoming'
}

const dotColors: Record<StepState, { bg: string; border: string; text: string }> = {
  done:     { bg: colors.status.success,  border: colors.status.success,  text: '#fff' },
  active:   { bg: colors.action.primary,  border: colors.action.primary,  text: '#fff' },
  upcoming: { bg: '#fff',                 border: colors.border.default,   text: colors.text.disabled },
}

const labelColors: Record<StepState, string> = {
  done:     colors.status.success,
  active:   colors.text.primary,
  upcoming: colors.text.disabled,
}

export function Stepper({ steps, currentStep, testID }: StepperProps) {
  const limited = steps.slice(0, 4)

  return (
    <View style={styles.container} testID={testID} accessibilityRole="progressbar">
      {limited.map((step, i) => {
        const state = getState(i, currentStep)
        const dot = dotColors[state]
        const isLast = i === limited.length - 1

        return (
          <React.Fragment key={i}>
            <View style={styles.stepItem}>
              <View style={[styles.dot, { backgroundColor: dot.bg, borderColor: dot.border }]}>
                {state === 'done' ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[styles.dotLabel, { color: dot.text }]}>{i + 1}</Text>
                )}
              </View>
              <Text
                style={[styles.label, { color: labelColors[state] }]}
                maxFontSizeMultiplier={1.3}
                numberOfLines={2}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: state === 'done' ? colors.status.success : colors.border.default },
                ]}
              />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontFamily: fontFamilies.headingMedium,
    fontSize: fontSizes.sm,
  },
  checkmark: {
    fontSize: 14,
    color: '#fff',
    fontFamily: fontFamilies.bodyMedium,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  line: {
    height: 2,
    flex: 0.5,
    marginTop: 15,
  },
})
