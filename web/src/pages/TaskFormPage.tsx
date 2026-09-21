import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTask, getTask, updateTask } from '../api/tasks'
import { getErrorMessage } from '../api/client'
import { TASKS_CHANGED_EVENT } from '../mqtt/useNotifications'
import { createTaskSchema, type CreateTaskValues } from '../features/tasks/taskFormSchema'
import type { TaskStatus } from '../types'

export function TaskFormPage() {
  const { id } = useParams()
  const taskId = id ? Number(id) : undefined
  const isEdit = Boolean(taskId)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', status: 'TODO', dueDate: '' },
    mode: 'onTouched',
  })

  useEffect(() => {
    if (!taskId) return
    let active = true
    getTask(taskId)
      .then((response) => {
        if (!active) return
        const task = response.data
        setValue('title', task.title)
        setValue('description', task.description ?? '')
        setValue('status', task.status)
        setValue('dueDate', task.dueDate ? task.dueDate.slice(0, 10) : '')
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
  }, [taskId, setValue])

  const onSubmit = async (data: CreateTaskValues) => {
    setError(null)
    setSaving(true)
    try {
      const input = {
        title: data.title.trim(),
        status: data.status ?? 'TODO',
        ...(data.description !== undefined ? { description: data.description.trim() || undefined } : {}),
        ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      }
      const saved = isEdit && taskId ? await updateTask(taskId, input) : await createTask(input)
      window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT, { detail: { taskId: saved.data.id } }))
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

      <form className="card form" onSubmit={handleSubmit(onSubmit)} data-testid="task-form">
        {error ? (
          <div className="alert alert--error" role="alert" data-testid="task-form-error">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span>Título *</span>
          <input
            {...register('title')}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'task-title-error' : undefined}
            data-testid="task-title"
          />
          {errors.title ? (
            <span id="task-title-error" className="field__error" role="alert">
              {errors.title.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea
            rows={4}
            {...register('description')}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'task-description-error' : undefined}
            data-testid="task-description"
          />
          {errors.description ? (
            <span id="task-description-error" className="field__error" role="alert">
              {errors.description.message}
            </span>
          ) : null}
        </label>

        <div className="form__row">
          <label className="field">
            <span>Status</span>
            <select
              {...register('status')}
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? 'task-status-error' : undefined}
              data-testid="task-status"
            >
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
            </select>
            {errors.status ? (
              <span id="task-status-error" className="field__error" role="alert">
                {errors.status.message}
              </span>
            ) : null}
          </label>

          <label className="field">
            <span>Vencimento</span>
            <input
              type="date"
              {...register('dueDate')}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
              data-testid="task-due-date"
            />
            {errors.dueDate ? (
              <span id="task-due-date-error" className="field__error" role="alert">
                {errors.dueDate.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="form__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
            data-testid="task-submit"
          >
            {isSubmitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </section>
  )
}