import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getErrorMessage } from '../api/client'
import { listTasks } from '../api/tasks'
import { useAuth } from '../auth/auth-context'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters } from '../components/TaskFilters'
import { NotificationOverlay } from '../components/NotificationOverlay'
import { onTasksChanged } from '../events'
import { useNotifications } from '../mqtt/useNotifications'
import type { RootStackParamList } from '../navigation/types'
import type { Task, TaskListResponse, TaskStatus } from '../types'
import { colors, spacing } from '../theme'

export function TasksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [meta, setMeta] = useState<Omit<TaskListResponse, 'items'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { notifications, dismiss, dismissAll } = useNotifications(user?.id)

  const fetchTasks = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setError(null)
      try {
        if (!opts?.silent) setLoading(true)
        const res = await listTasks({ status, search: search || undefined, page })
        setTasks(res.data.items)
        setMeta({
          total: res.data.total,
          page: res.data.page,
          pageSize: res.data.pageSize,
          totalPages: res.data.totalPages,
        })
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [status, search, page],
  )

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useFocusEffect(
    useCallback(() => {
      void fetchTasks({ silent: true })
    }, [fetchTasks]),
  )

  useEffect(() => {
    const unsub = onTasksChanged(() => {
      void fetchTasks({ silent: true })
    })
    return unsub
  }, [fetchTasks])

  useEffect(() => {
    setPage(1)
  }, [status, search])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    void fetchTasks({ silent: true })
  }, [fetchTasks])

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable testID="logout-button" onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>Sair</Text>
        </Pressable>
      ),
    })
  }, [navigation])

  return (
    <View style={styles.container}>
      <View style={styles.filtersWrap}>
        <TaskFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />
      </View>

      {error ? (
        <View testID="tasks-error" style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center} testID="tasks-loading">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.mutedText}>Carregando tarefas…</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center} testID="tasks-empty">
          <Text style={styles.emptyTitle}>Nenhuma tarefa encontrada</Text>
          <Text style={styles.mutedText}>Crie sua primeira tarefa para começar.</Text>
        </View>
      ) : (
        <FlatList
          testID="tasks-list"
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
              testID={`task-card-${item.id}`}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {meta && meta.totalPages > 1 ? (
        <View style={styles.pagination}>
          <Text style={styles.paginationLabel}>
            Página {meta.page} de {meta.totalPages} · {meta.total} tarefas
          </Text>
          <View style={styles.paginationActions}>
            <Pressable
              testID="page-prev"
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonLabel}>Anterior</Text>
            </Pressable>
            <Pressable
              testID="page-next"
              disabled={page >= (meta.totalPages ?? 1)}
              onPress={() => setPage((p) => p + 1)}
              style={[styles.pageButton, page >= (meta.totalPages ?? 1) && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonLabel}>Próxima</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.fabWrap}>
        <Pressable
          testID="fab-new-task"
          accessibilityRole="button"
          onPress={() => navigation.navigate('TaskForm', {})}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Text style={styles.fabLabel}>+ Nova tarefa</Text>
        </Pressable>
      </View>

      <NotificationOverlay notifications={notifications} onDismiss={dismiss} onDismissAll={dismissAll} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filtersWrap: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorBox: {
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 96,
  },
  pagination: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  paginationLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  paginationActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pageButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageButtonDisabled: {
    opacity: 0.45,
  },
  pageButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fabWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoutLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
})
