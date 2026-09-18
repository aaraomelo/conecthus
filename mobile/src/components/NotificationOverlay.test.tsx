import { fireEvent, render } from '@testing-library/react-native'
import { NotificationOverlay } from './NotificationOverlay'
import type { TaskNotification } from '../mqtt/useNotifications'

const note: TaskNotification = {
  event: 'task.created',
  taskId: 1,
  title: 'Nova tarefa',
  message: 'Tarefa "Estudar" foi criada',
  at: new Date().toISOString(),
}

describe('NotificationOverlay', () => {
  it('renders nothing when empty', async () => {
    const { queryByTestId } = await render(<NotificationOverlay notifications={[]} onDismiss={jest.fn()} onDismissAll={jest.fn()} />)
    expect(queryByTestId('notification-card')).toBeNull()
  })

  it('renders notification card', async () => {
    const { getByText } = await render(<NotificationOverlay notifications={[note]} onDismiss={jest.fn()} onDismissAll={jest.fn()} />)
    expect(getByText('Nova tarefa')).toBeTruthy()
    expect(getByText('Tarefa "Estudar" foi criada')).toBeTruthy()
  })

  it('calls onDismiss when close pressed', async () => {
    const onDismiss = jest.fn()
    const { getByTestId } = await render(<NotificationOverlay notifications={[note]} onDismiss={onDismiss} onDismissAll={jest.fn()} />)
    fireEvent.press(getByTestId('dismiss-0'))
    expect(onDismiss).toHaveBeenCalledWith(0)
  })

  it('shows clear all when multiple notifications', async () => {
    const onDismissAll = jest.fn()
    const { getByText } = await render(
      <NotificationOverlay notifications={[note, { ...note, taskId: 2 }]} onDismiss={jest.fn()} onDismissAll={onDismissAll} />,
    )
    const btn = getByText(/Limpar todas/)
    fireEvent.press(btn)
    expect(onDismissAll).toHaveBeenCalled()
  })
})
