import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native'
import { colors, spacing } from '../theme'

interface Props {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secure?: boolean
  keyboardType?: KeyboardTypeOptions
  multiline?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  hint?: string
  testID?: string
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  multiline,
  autoCapitalize,
  hint,
  testID,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
  },
})