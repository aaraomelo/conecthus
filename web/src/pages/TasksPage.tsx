import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteTask, listTasks, markTaskDone } from '../api/tasks'
import { getErrorMessage } from '../api/client'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters } from '../components/TaskFilters'
import { TASKS_CHANGED_EVENT } from '../mqtt/useNotifications'
import type { Task, TaskListResponse, TaskQuery } from '../types'

export function TasksPage() {
  const [filters, setFilters] = useState<TaskQuery>({})
  const [data, setData] = useState<TaskListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener(TASKS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, handler)
  }, [refresh])

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await listTasks(filters)
        setData(response.data)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [filters, revision])

  const handleToggleDone = async (task: Task) => {
    try {
      await markTaskDone(task.id)
      refresh()
    } catch {
      // mantém a lista como está; próximo fetch reflete o estado real
    }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    try {
      await deleteTask(task.id)
      refresh()
    } catch {
      // mantém a lista como está
    }
  }

  const handlePage = (page: number) => setFilters((prev) => ({ ...prev, page }))

  const isEmpty = Boolean(data && data.items.length === 0 && !loading)

  return (
    <section>
      <div className="page-head">
        <h1>Minhas tarefas</h1>
        <Link to="/tasks/new" className="btn btn--primary">
          Nova tarefa
        </Link>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} />

      {error ? (
        <div className="alert alert--error" role="alert" data-testid="tasks-error">
          {error}
        </div>
      ) : null}

      {loading && !data ? <p className="muted">Carregando…</p> : null}

      {isEmpty ? (
        <div className="empty-state" data-testid="tasks-empty">
          <p>Nenhuma tarefa encontrada.</p>
          <Link to="/tasks/new" className="btn btn--primary">
            Criar a primeira tarefa
          </Link>
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="task-list" data-testid="task-list">
          {data.items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <nav className="pagination" aria-label="Paginação">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={data.page <= 1}
            onClick={() => handlePage(data.page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {data.page} de {data.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={data.page >= data.totalPages}
            onClick={() => handlePage(data.page + 1)}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </section>
  )
}