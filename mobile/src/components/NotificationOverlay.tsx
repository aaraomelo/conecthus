import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { TaskNotification } from '../mqtt/useNotifications'
import { colors, radius, shadow, spacing } from '../theme'

interface Props {
  notifications: TaskNotification[]
  onDismiss: (index: number) => void
  onDismissAll: () => void
}

export function NotificationOverlay({ notifications, onDismiss, onDismissAll }: Props) {
  if (notifications.length === 0) return null

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.length > 1 ? (
        <Pressable onPress={onDismissAll} style={styles.dismissAll}>
          <Text style={styles.dismissAllLabel}>Limpar todas ({notifications.length})</Text>
        </Pressable>
      ) : null}
      {notifications.map((note, index) => (
        <View key={`${note.taskId}-${note.at}-${index}`} style={styles.card} testID="notification-card">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {note.title || 'Tarefa atualizada'}
            </Text>
            <Pressable
              testID={`dismiss-${index}`}
              accessibilityRole="button"
              accessibilityLabel="Fechar notificação"
              onPress={() => onDismiss(index)}
              style={styles.closeButton}
            >
              <Text style={styles.closeLabel}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {note.message}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    gap: spacing.sm,
    zIndex: 50,
  },
  dismissAll: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dismissAllLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  card: {
    backgroundColor: colors.text,
    borderRadius: radius,
    padding: spacing.md,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 18,
    fontWeight: '600',
  },
  cardMessage: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
})
