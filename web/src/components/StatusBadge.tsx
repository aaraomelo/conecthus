import type { TaskStatus } from '../types'

const LABELS: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge badge--${status.toLowerCase()}`} data-testid="status-badge">
      {LABELS[status]}
    </span>
  )
}