import { Link } from 'react-router-dom'
import type { Task } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  task: Task
  onToggleDone?: (task: Task) => void
  onDelete?: (task: Task) => void
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('pt-BR')
}

export function TaskCard({ task, onToggleDone, onDelete }: Props) {
  const due = formatDate(task.dueDate)

  return (
    <article className="task-card" data-testid={`task-card-${task.id}`}>
      <div className="task-card__header">
        <Link to={`/tasks/${task.id}`} className="task-card__title">
          {task.title}
        </Link>
        <StatusBadge status={task.status} />
      </div>

      {task.description ? (
        <p className="task-card__desc">{task.description}</p>
      ) : null}

      <div className="task-card__footer">
        <span className="task-card__due">
          {due ? `Vence em ${due}` : 'Sem prazo definido'}
        </span>
        <div className="task-card__actions">
          {task.status !== 'DONE' && onToggleDone ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onToggleDone(task)}
              data-testid={`done-${task.id}`}
            >
              Concluir
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(task)}
              data-testid={`delete-${task.id}`}
            >
              Excluir
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}