import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { TaskStatus } from '../types'
import { colors, radius, spacing, statusLabels } from '../theme'

export const STATUS_OPTIONS: Array<TaskStatus | ''> = ['', 'TODO', 'IN_PROGRESS', 'DONE']

interface Props {
  search: string
  onSearchChange: (value: string) => void
  status: TaskStatus | ''
  onStatusChange: (value: TaskStatus | '') => void
}

export function TaskFilters({ search, onSearchChange, status, onStatusChange }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        testID="tasks-search"
        style={styles.search}
        value={search}
        onChangeText={onSearchChange}
        placeholder="Buscar tarefa..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {STATUS_OPTIONS.map((option) => {
          const active = option === status
          const label = option === '' ? 'Todas' : statusLabels[option]
          return (
            <Pressable
              key={option === '' ? 'all' : option}
              testID={`filter-${option === '' ? 'all' : option}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onStatusChange(option)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  search: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  chips: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.text,
  },
  chipLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
})