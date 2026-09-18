import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { getErrorMessage } from '../api/client'
import { deleteTask, getTask, markTaskDone } from '../api/tasks'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/Button'
import { emitTasksChanged } from '../events'
import type { RootStackParamList } from '../navigation/types'
import type { Task } from '../types'
import { colors, spacing } from '../theme'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export function TaskDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TaskDetail'>>()
  const { taskId } = route.params
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTask = useCallback(async () => {
    setError(null)
    try {
      setLoading(true)
      const res = await getTask(taskId)
      setTask(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void fetchTask()
  }, [fetchTask])

  const handleDone = async () => {
    if (!task || task.status === 'DONE') return
    setActionLoading(true)
    try {
      const res = await markTaskDone(task.id)
      setTask(res.data)
      emitTasksChanged(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Excluir tarefa', 'Tem certeza que deseja excluir esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true)
          try {
            await deleteTask(taskId)
            emitTasksChanged({ event: 'task.deleted', taskId })
            navigation.goBack()
          } catch (err) {
            setError(getErrorMessage(err))
            setActionLoading(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center} testID="task-detail-loading">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Carregando tarefa…</Text>
      </View>
    )
  }

  if (error && !task) {
    return (
      <View style={styles.center} testID="task-detail-error">
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Tentar novamente" onPress={fetchTask} testID="task-detail-retry" />
      </View>
    )
  }

  if (!task) return null

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.badgeRow}>
        <StatusBadge status={task.status} />
      </View>

      {error ? (
        <View testID="task-detail-action-error" style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.sectionValue}>{task.description || 'Sem descrição.'}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Vencimento</Text>
          <Text style={styles.metaValue}>{formatDate(task.dueDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Criada em</Text>
          <Text style={styles.metaValue}>{formatDate(task.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Editar" variant="ghost" onPress={() => navigation.navigate('TaskForm', { taskId: task.id })} testID="task-edit" />
        {task.status !== 'DONE' ? (
          <Button label={actionLoading ? 'Salvando…' : 'Marcar como concluída'} onPress={handleDone} loading={actionLoading} testID="task-done" />
        ) : null}
        <Button label="Excluir" variant="danger" onPress={handleDelete} testID="task-delete" />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    backgroundColor: colors.bg,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  badgeRow: {
    alignItems: 'flex-start',
  },
  muted: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
})
