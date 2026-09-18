import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTask, getTask, markTaskDone } from '../api/tasks'
import { getErrorMessage } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { TASKS_CHANGED_EVENT } from '../mqtt/useNotifications'
import type { Task } from '../types'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR')
}

export function TaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)
  const navigate = useNavigate()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTask(taskId)
      .then((response) => {
        setTask(response.data)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [taskId])

  const handleDone = async () => {
    if (!task) return
    try {
      const response = await markTaskDone(task.id)
      setTask(response.data)
      window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    try {
      await deleteTask(task.id)
      window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT))
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <p className="muted">Carregando…</p>

  if (!task) {
    return (
      <section>
        <div className="alert alert--error" role="alert">
          {error ?? 'Tarefa não encontrada.'}
        </div>
        <Link to="/tasks" className="btn btn--ghost">
          Voltar
        </Link>
      </section>
    )
  }

  return (
    <section>
      <div className="page-head">
        <h1>{task.title}</h1>
        <Link to={`/tasks/${task.id}/edit`} className="btn btn--primary">
          Editar
        </Link>
      </div>

      {error ? (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card task-detail" data-testid="task-detail">
        <div className="task-detail__meta">
          <StatusBadge status={task.status} />
          <span>Criada em {formatDate(task.createdAt)}</span>
          <span>Atualizada em {formatDate(task.updatedAt)}</span>
        </div>

        <dl className="task-detail__fields">
          <div>
            <dt>Vencimento</dt>
            <dd>{formatDate(task.dueDate) ? formatDate(task.dueDate) : '—'}</dd>
          </div>
          <div>
            <dt>Descrição</dt>
            <dd>{task.description || 'Sem descrição.'}</dd>
          </div>
        </dl>

        <div className="task-detail__actions">
          {task.status !== 'DONE' ? (
            <button type="button" className="btn btn--primary" onClick={handleDone} data-testid="detail-done">
              Marcar como concluída
            </button>
          ) : null}
          <button type="button" className="btn btn--danger" onClick={handleDelete} data-testid="detail-delete">
            Excluir
          </button>
        </div>
      </div>
    </section>
  )
}