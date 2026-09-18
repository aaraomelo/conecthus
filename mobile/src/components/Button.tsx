import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { colors, radius, spacing } from '../theme'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props {
  label: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  block?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  block = false,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].base,
        block && styles.block,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : colors.primary}
        />
      ) : (
        <Text
          style={[styles.label, variantStyles[variant].label, isDisabled && styles.labelDisabled]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelDisabled: {
    opacity: 1,
  },
})

const variantStyles = {
  primary: StyleSheet.create({
    base: { backgroundColor: colors.primary },
    label: { color: '#fff' },
  }),
  ghost: StyleSheet.create({
    base: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    label: { color: colors.text },
  }),
  danger: StyleSheet.create({
    base: { backgroundColor: colors.danger },
    label: { color: '#fff' },
  }),
}