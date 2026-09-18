import { fireEvent, render } from '@testing-library/react-native'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

const baseTask: Task = {
  id: 1,
  title: 'Estudar React Native',
  description: 'Ler docs do Expo SDK 57',
  status: 'IN_PROGRESS',
  dueDate: '2026-09-30T00:00:00.000Z',
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

describe('TaskCard', () => {
  it('renders title and status', async () => {
    const { getByText } = await render(<TaskCard task={baseTask} onPress={jest.fn()} />)
    expect(getByText('Estudar React Native')).toBeTruthy()
    expect(getByText('Em andamento')).toBeTruthy()
  })

  it('renders description and due date', async () => {
    const { getByText } = await render(<TaskCard task={baseTask} onPress={jest.fn()} />)
    expect(getByText('Ler docs do Expo SDK 57')).toBeTruthy()
    expect(getByText(/Vence em:/)).toBeTruthy()
  })

  it('omits description when null', async () => {
    const { queryByText } = await render(<TaskCard task={{ ...baseTask, description: null }} onPress={jest.fn()} />)
    expect(queryByText('Ler docs do Expo SDK 57')).toBeNull()
  })

  it('omits due date when null', async () => {
    const { queryByText } = await render(<TaskCard task={{ ...baseTask, dueDate: null }} onPress={jest.fn()} />)
    expect(queryByText(/Vence em:/)).toBeNull()
  })

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    const { getByTestId } = await render(<TaskCard task={baseTask} onPress={onPress} testID="card" />)
    fireEvent.press(getByTestId('card'))
    expect(onPress).toHaveBeenCalled()
  })

  it('handles invalid dueDate gracefully', async () => {
    const { queryByText } = await render(<TaskCard task={{ ...baseTask, dueDate: 'invalid' }} onPress={jest.fn()} />)
    expect(queryByText(/Vence em:/)).toBeNull()
  })
})
