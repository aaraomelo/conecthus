import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Task } from '../types'
import { colors, radius, shadow, spacing } from '../theme'
import { StatusBadge } from './StatusBadge'

export function formatDueDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('pt-BR')
}

interface Props {
  task: Task
  onPress: () => void
  testID?: string
}

export function TaskCard({ task, onPress, testID }: Props) {
  const due = formatDueDate(task.dueDate)
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
        </Text>
        <StatusBadge status={task.status} />
      </View>
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}
      {due ? (
        <Text style={[styles.due, task.status !== 'DONE' && styles.duePending]}>
          Vence em: {due}
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
  due: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  duePending: {
    color: colors.warning,
  },
})