import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TaskDetailScreen } from './TaskDetailScreen'
import * as tasksApi from '../api/tasks'

jest.mock('../api/tasks')
jest.mock('../events', () => ({ emitTasksChanged: jest.fn() }))

jest.spyOn(Alert, 'alert')

const mockedApi = tasksApi as jest.Mocked<typeof tasksApi>
const Stack = createNativeStackNavigator()
const Dummy = () => null

async function renderDetail(taskId = 1) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} initialParams={{ taskId }} />
        <Stack.Screen name="TaskForm" component={Dummy} />
        <Stack.Screen name="Tasks" component={Dummy} />
      </Stack.Navigator>
    </NavigationContainer>,
  )
}

const task = {
  id: 1,
  title: 'Tarefa detalhe',
  description: 'Descrição completa',
  status: 'TODO' as const,
  dueDate: '2026-09-30T00:00:00.000Z',
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TaskDetailScreen', () => {
  it('shows task details', async () => {
    mockedApi.getTask.mockResolvedValueOnce({ data: task } as never)
    const { getByText } = await renderDetail()
    await waitFor(() => expect(getByText('Tarefa detalhe')).toBeTruthy())
    expect(getByText('Descrição completa')).toBeTruthy()
    expect(getByText('A fazer')).toBeTruthy()
  })

  it('shows error and retry when fetch fails', async () => {
    mockedApi.getTask.mockRejectedValueOnce(new Error('Não encontrada'))
    const { getByTestId, getByText } = await renderDetail()
    await waitFor(() => expect(getByTestId('task-detail-error')).toBeTruthy())
    expect(getByText('Não encontrada')).toBeTruthy()
    mockedApi.getTask.mockResolvedValueOnce({ data: task } as never)
    fireEvent.press(getByTestId('task-detail-retry'))
    await waitFor(() => expect(getByText('Tarefa detalhe')).toBeTruthy())
  })

  it('marks task as done', async () => {
    mockedApi.getTask.mockResolvedValueOnce({ data: task } as never)
    mockedApi.markTaskDone.mockResolvedValueOnce({ data: { ...task, status: 'DONE' } } as never)
    const { getByTestId, getByText } = await renderDetail()
    await waitFor(() => expect(getByText('Tarefa detalhe')).toBeTruthy())
    fireEvent.press(getByTestId('task-done'))
    await waitFor(() => expect(mockedApi.markTaskDone).toHaveBeenCalledWith(1))
  })

  it('asks confirmation before deleting', async () => {
    mockedApi.getTask.mockResolvedValueOnce({ data: task } as never)
    mockedApi.deleteTask.mockResolvedValueOnce({} as never)
    const { getByTestId } = await renderDetail()
    await waitFor(() => expect(getByTestId('task-delete')).toBeTruthy())
    fireEvent.press(getByTestId('task-delete'))
    expect(Alert.alert).toHaveBeenCalled()
    const alertArgs = (Alert.alert as unknown as jest.Mock).mock.calls[0] as unknown[]
    const buttons = alertArgs[2] as Array<{ text: string; onPress?: () => void }>
    const confirm = buttons.find((b) => b.text === 'Excluir')
    await confirm?.onPress?.()
    await waitFor(() => expect(mockedApi.deleteTask).toHaveBeenCalledWith(1))
  })

  it('shows error when mark done fails', async () => {
    mockedApi.getTask.mockResolvedValueOnce({ data: task } as never)
    mockedApi.markTaskDone.mockRejectedValueOnce(new Error('Falha'))
    const { getByTestId, getByText } = await renderDetail()
    await waitFor(() => expect(getByTestId('task-done')).toBeTruthy())
    fireEvent.press(getByTestId('task-done'))
    await waitFor(() => expect(getByTestId('task-detail-action-error')).toBeTruthy())
    expect(getByText('Falha')).toBeTruthy()
  })
})
