import type { TaskNotification } from '../mqtt/useNotifications'

interface Props {
  notifications: TaskNotification[]
  onDismiss: (index: number) => void
  onDismissAll: () => void
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Tarefa criada',
  updated: 'Tarefa atualizada',
  deleted: 'Tarefa removida',
}

export function NotificationToast({ notifications, onDismiss, onDismissAll }: Props) {
  if (notifications.length === 0) return null

  return (
    <div className="toasts" data-testid="notification-toasts">
      <div className="toasts__toolbar">
        <strong>Notificações</strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDismissAll}>
          Limpar
        </button>
      </div>
      <ul className="toasts__list">
        {notifications.map((note, index) => (
          <li
            className="toast"
            key={`${note.at}-${note.taskId}-${index}`}
            data-testid={`toast-${index}`}
          >
            <div className="toast__body">
              <strong>{EVENT_LABELS[note.event] ?? note.message}</strong>
              <span>{note.title || 'Tarefa'}</span>
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Fechar"
              onClick={() => onDismiss(index)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}