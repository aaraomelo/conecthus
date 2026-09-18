import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createTask, getTask, updateTask } from '../api/tasks'
import { getErrorMessage } from '../api/client'
import { TASKS_CHANGED_EVENT } from '../mqtt/useNotifications'
import type { CreateTaskInput, TaskFormValues, TaskStatus } from '../types'

const EMPTY: TaskFormValues = { title: '', description: '', status: 'TODO', dueDate: '' }

function toInput(values: TaskFormValues): CreateTaskInput {
  const input: CreateTaskInput = { title: values.title.trim(), status: values.status }
  if (values.description.trim()) input.description = values.description.trim()
  if (values.dueDate) input.dueDate = values.dueDate
  return input
}

export function TaskFormPage() {
  const { id } = useParams()
  const taskId = id ? Number(id) : undefined
  const isEdit = Boolean(taskId)
  const navigate = useNavigate()

  const [values, setValues] = useState<TaskFormValues>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    let active = true
    getTask(taskId)
      .then((response) => {
        if (!active) return
        const task = response.data
        setValues({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        })
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [taskId])

  const patch = (partial: Partial<TaskFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const input = toInput(values)
      const saved = isEdit && taskId ? await updateTask(taskId, input) : await createTask(input)
      window.dispatchEvent(
        new CustomEvent(TASKS_CHANGED_EVENT, { detail: { taskId: saved.data.id } }),
      )
      navigate(isEdit && taskId ? `/tasks/${taskId}` : '/tasks', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section data-testid="task-form-loading">
        <p className="muted">Carregando…</p>
      </section>
    )
  }

  return (
    <section>
      <div className="page-head">
        <h1>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</h1>
        <Link to="/tasks" className="btn btn--ghost">
          Voltar
        </Link>
      </div>

      <form className="card form" onSubmit={handleSubmit} data-testid="task-form">
        {error ? (
          <div className="alert alert--error" role="alert" data-testid="task-form-error">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span>Título *</span>
          <input
            required
            value={values.title}
            onChange={(event) => patch({ title: event.target.value })}
            data-testid="task-title"
          />
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea
            rows={4}
            value={values.description}
            onChange={(event) => patch({ description: event.target.value })}
            data-testid="task-description"
          />
        </label>

        <div className="form__row">
          <label className="field">
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) => patch({ status: event.target.value as TaskStatus })}
              data-testid="task-status"
            >
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
            </select>
          </label>

          <label className="field">
            <span>Vencimento</span>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) => patch({ dueDate: event.target.value })}
              data-testid="task-due-date"
            />
          </label>
        </div>

        <div className="form__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
            data-testid="task-submit"
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </section>
  )
}