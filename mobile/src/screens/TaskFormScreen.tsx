import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { getErrorMessage } from '../api/client'
import { createTask, getTask, updateTask } from '../api/tasks'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { emitTasksChanged } from '../events'
import type { RootStackParamList } from '../navigation/types'
import type { TaskStatus } from '../types'
import { colors, spacing, statusLabels } from '../theme'

const STATUS_CHOICES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

export function TaskFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'TaskForm'>>()
  const taskId = route.params?.taskId
  const isEditing = Boolean(taskId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('TODO')
  const [dueDate, setDueDate] = useState('')
  const [loadingTask, setLoadingTask] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    let active = true
    getTask(taskId)
      .then((res) => {
        if (!active) return
        setTitle(res.data.title)
        setDescription(res.data.description ?? '')
        setStatus(res.data.status)
        setDueDate(res.data.dueDate ? res.data.dueDate.slice(0, 10) : '')
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingTask(false)
      })
    return () => {
      active = false
    }
  }, [taskId])

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('O título é obrigatório.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate.trim() || undefined,
      }
      if (isEditing && taskId) {
        await updateTask(taskId, {
          ...payload,
          description: payload.description ?? null,
          dueDate: payload.dueDate ?? null,
        })
      } else {
        await createTask(payload)
      }
      emitTasksChanged()
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingTask) {
    return (
      <View style={styles.center} testID="task-form-loading">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Carregando tarefa…</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</Text>

      {error ? (
        <View testID="task-form-error" style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextField label="Título *" value={title} onChangeText={setTitle} placeholder="Ex.: Revisar relatório" testID="task-title" />

      <TextField
        label="Descrição"
        value={description}
        onChangeText={setDescription}
        placeholder="Detalhes da tarefa"
        multiline
        testID="task-description"
      />

      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_CHOICES.map((choice) => {
            const active = choice === status
            return (
              <Pressable
                key={choice}
                testID={`status-${choice}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setStatus(choice)}
                style={[styles.statusChip, active && styles.statusChipActive]}
              >
                <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>{statusLabels[choice]}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <TextField
        label="Data de vencimento"
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="AAAA-MM-DD"
        hint="Formato: AAAA-MM-DD (opcional)"
        autoCapitalize="none"
        testID="task-duedate"
      />

      <View style={styles.actions}>
        <Button label="Cancelar" variant="ghost" onPress={() => navigation.goBack()} testID="task-cancel" />
        <View style={{ flex: 1 }}>
          <Button
            label={submitting ? 'Salvando…' : isEditing ? 'Salvar' : 'Criar tarefa'}
            onPress={handleSubmit}
            loading={submitting}
            block
            testID="task-submit"
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    backgroundColor: colors.bg,
    gap: 0,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: spacing.sm,
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
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.text,
  },
  statusLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
})
