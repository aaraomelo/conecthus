import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotificationToast } from './NotificationToast'
import type { TaskNotification } from '../mqtt/useNotifications'

const notes: TaskNotification[] = [
  { event: 'created', taskId: 1, title: 'Tarefa nova', message: '...', at: '2026-01-01T10:00:00Z' },
  { event: 'deleted', taskId: 2, title: 'Tarefa antiga', message: '...', at: '2026-01-01T10:05:00Z' },
]

describe('NotificationToast', () => {
  it('renders nothing when there are no notifications', () => {
    render(<NotificationToast notifications={[]} onDismiss={vi.fn()} onDismissAll={vi.fn()} />)
    expect(screen.queryByTestId('notification-toasts')).not.toBeInTheDocument()
  })

  it('renders notifications with translated event labels', () => {
    render(<NotificationToast notifications={notes} onDismiss={vi.fn()} onDismissAll={vi.fn()} />)
    expect(screen.getByText('Tarefa criada')).toBeInTheDocument()
    expect(screen.getByText('Tarefa removida')).toBeInTheDocument()
    expect(screen.getByText('Tarefa nova')).toBeInTheDocument()
  })

  it('dismisses a single notification', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()

    render(<NotificationToast notifications={notes} onDismiss={onDismiss} onDismissAll={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0]!)
    expect(onDismiss).toHaveBeenCalledWith(0)
  })

  it('dismisses all notifications', async () => {
    const onDismissAll = vi.fn()
    const user = userEvent.setup()

    render(<NotificationToast notifications={notes} onDismiss={vi.fn()} onDismissAll={onDismissAll} />)

    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(onDismissAll).toHaveBeenCalledTimes(1)
  })
})