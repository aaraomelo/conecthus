import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TasksScreen } from './TasksScreen'
import * as tasksApi from '../api/tasks'
import { useAuth } from '../auth/auth-context'

jest.mock('../api/tasks')
jest.mock('../mqtt/useNotifications', () => ({
  useNotifications: () => ({ notifications: [], dismiss: jest.fn(), dismissAll: jest.fn() }),
}))
jest.mock('../events', () => ({
  TASKS_CHANGED_EVENT: 'conecthus:tasks-changed',
  emitTasksChanged: jest.fn(),
  onTasksChanged: jest.fn(() => jest.fn()),
}))
jest.mock('../auth/auth-context', () => {
  const actual = jest.requireActual('../auth/auth-context')
  return { ...actual, useAuth: jest.fn() }
})

const mockedTasksApi = tasksApi as jest.Mocked<typeof tasksApi>
const mockedUseAuth = useAuth as jest.Mock

const Stack = createNativeStackNavigator()
const Dummy = () => null

async function renderTasks() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="TaskDetail" component={Dummy} />
        <Stack.Screen name="TaskForm" component={Dummy} />
      </Stack.Navigator>
    </NavigationContainer>,
  )
}

const mockTask = {
  id: 1,
  title: 'Tarefa 1',
  description: 'Desc',
  status: 'TODO' as const,
  dueDate: null,
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    user: { id: 1, name: 'Ana', email: 'ana@test.com', createdAt: '', updatedAt: '' },
    logout: jest.fn().mockResolvedValue(undefined),
  })
})

describe('TasksScreen', () => {
  it('shows tasks after loading', async () => {
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [mockTask], total: 1, page: 1, pageSize: 20, totalPages: 1 },
    } as never)
    const { getByTestId, getByText } = await renderTasks()
    await waitFor(() => expect(getByTestId('tasks-list')).toBeTruthy())
    expect(getByText('Tarefa 1')).toBeTruthy()
  })

  it('shows empty state when no tasks', async () => {
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
    } as never)
    const { getByTestId } = await renderTasks()
    await waitFor(() => expect(getByTestId('tasks-empty')).toBeTruthy())
  })

  it('shows error when fetch fails', async () => {
    mockedTasksApi.listTasks.mockRejectedValue(new Error('Falha ao carregar'))
    const { getByTestId, getByText } = await renderTasks()
    await waitFor(() => expect(getByTestId('tasks-error')).toBeTruthy())
    // error message may be from getErrorMessage which wraps the error
    await waitFor(() => expect(getByText('Falha ao carregar')).toBeTruthy())
  })

  it('filters by status', async () => {
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
    } as never)
    const { getByTestId } = await renderTasks()
    await waitFor(() => expect(mockedTasksApi.listTasks).toHaveBeenCalled())
    jest.clearAllMocks()
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
    } as never)
    fireEvent.press(getByTestId('filter-DONE'))
    await waitFor(() => expect(mockedTasksApi.listTasks).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' })))
  })

  it('navigates to detail when card pressed', async () => {
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [mockTask], total: 1, page: 1, pageSize: 20, totalPages: 1 },
    } as never)
    const { getByTestId } = await renderTasks()
    await waitFor(() => expect(getByTestId('tasks-list')).toBeTruthy())
    fireEvent.press(getByTestId('task-card-1'))
  })

  it('shows pagination when totalPages > 1', async () => {
    mockedTasksApi.listTasks.mockResolvedValue({
      data: { items: [mockTask], total: 40, page: 1, pageSize: 20, totalPages: 2 },
    } as never)
    const { getByTestId } = await renderTasks()
    await waitFor(() => expect(getByTestId('page-next')).toBeTruthy())
    expect(getByTestId('page-prev')).toBeTruthy()
  })
})
