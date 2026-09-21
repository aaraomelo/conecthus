import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskFormPage } from './TaskFormPage'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockGet = vi.fn()
const mockDispatchEvent = vi.fn()

vi.mock('../api/tasks', () => ({
  createTask: (...args: unknown[]) => mockCreate(...args),
  updateTask: (...args: unknown[]) => mockUpdate(...args),
  getTask: (...args: unknown[]) => mockGet(...args),
}))

vi.mock('../mqtt/useNotifications', () => ({
  TASKS_CHANGED_EVENT: 'tasks-changed',
}))

vi.mock('../api/client', () => ({
  getErrorMessage: (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Erro inesperado',
}))

function renderPage(initialEntry: string = '/tasks/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks/new" element={<TaskFormPage />} />
        <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
        <Route path="/tasks/:id" element={<div>TASK_DETAIL</div>} />
        <Route path="/tasks" element={<div>TASKS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TaskFormPage', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockUpdate.mockClear()
    mockGet.mockClear()
    mockDispatchEvent.mockClear()
    window.dispatchEvent = mockDispatchEvent as typeof window.dispatchEvent
  })

  it('submits a new task with the expected payload', async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ data: { id: 1 } })
    renderPage()

    await user.type(screen.getByTestId('task-title'), 'Nova tarefa')
    await user.type(screen.getByTestId('task-description'), 'Descrição da tarefa')
    await user.click(screen.getByTestId('task-submit'))

    expect(mockCreate).toHaveBeenCalledWith({
      title: 'Nova tarefa',
      description: 'Descrição da tarefa',
      status: 'TODO',
    })
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks-changed',
        detail: { taskId: 1 },
      }),
    )
    expect(await screen.findByText('TASKS')).toBeInTheDocument()
  })

  it('edits an existing task and calls updateTask', async () => {
    mockGet.mockResolvedValue({ data: { id: 5, title: 'Escrever testes', description: 'Cobrir o formulário', status: 'IN_PROGRESS', dueDate: '2026-10-01T00:00:00.000Z' } })
    mockUpdate.mockResolvedValue({ data: { id: 5, title: 'Escrever testes', description: 'Cobrir o formulário', status: 'IN_PROGRESS', dueDate: '2026-10-01T00:00:00.000Z' } })
    const user = userEvent.setup()

    renderPage('/tasks/5/edit')

    expect(mockGet).toHaveBeenCalledWith(5)
    expect(await screen.findByTestId('task-form')).toBeInTheDocument()
    expect(screen.getByTestId('task-title')).toHaveValue('Escrever testes')
    expect(screen.getByTestId('task-status')).toHaveValue('IN_PROGRESS')
    expect(screen.getByTestId('task-due-date')).toHaveValue('2026-10-01')

    await user.clear(screen.getByTestId('task-title'))
    await user.type(screen.getByTestId('task-title'), 'Título novo')
    await user.click(screen.getByTestId('task-submit'))

    expect(mockUpdate).toHaveBeenCalledWith(5, {
      title: 'Título novo',
      description: 'Cobrir o formulário',
      status: 'IN_PROGRESS',
      dueDate: '2026-10-01',
    })
    expect(await screen.findByText('TASK_DETAIL')).toBeInTheDocument()
  })

  it('shows an error when loading the task fails', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 500, data: { message: 'Falha no servidor' } } })
    renderPage('/tasks/99/edit')

    expect(mockGet).toHaveBeenCalledWith(99)
    expect(await screen.findByTestId('task-form-error')).toHaveTextContent('Falha no servidor')
  })
})