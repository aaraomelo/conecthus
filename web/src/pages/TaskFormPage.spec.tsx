import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskFormPage } from './TaskFormPage'
import type { Task } from '../types'

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
  listTasks: vi.fn(),
  markTaskDone: vi.fn(),
  deleteTask: vi.fn(),
}))

import { createTask, getTask, updateTask } from '../api/tasks'

const mockCreate = vi.mocked(createTask)
const mockGet = vi.mocked(getTask)
const mockUpdate = vi.mocked(updateTask)

const existingTask: Task = {
  id: 5,
  title: 'Escrever testes',
  description: 'Cobrir o formulário',
  status: 'IN_PROGRESS',
  dueDate: '2026-10-01T00:00:00.000Z',
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

function renderForm(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks/new" element={<TaskFormPage />} />
        <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TaskFormPage', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockGet.mockReset()
    mockUpdate.mockReset()
  })

  it('submits a new task with the expected payload', async () => {
    mockCreate.mockResolvedValue({ data: { ...existingTask, id: 9 } } as never)
    const user = userEvent.setup()

    renderForm('/tasks/new')

    await user.type(screen.getByTestId('task-title'), 'Nova tarefa')
    await user.type(screen.getByTestId('task-description'), 'Primeira versão')
    await user.selectOptions(screen.getByTestId('task-status'), 'IN_PROGRESS')
    await user.type(screen.getByTestId('task-due-date'), '2026-10-01')
    await user.click(screen.getByTestId('task-submit'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'Nova tarefa',
        description: 'Primeira versão',
        status: 'IN_PROGRESS',
        dueDate: '2026-10-01',
      })
    })
  })

  it('edits an existing task and calls updateTask', async () => {
    mockGet.mockResolvedValue({ data: existingTask } as never)
    mockUpdate.mockResolvedValue({ data: existingTask } as never)
    const user = userEvent.setup()

    renderForm('/tasks/5/edit')

    expect(await screen.findByTestId('task-form')).toBeInTheDocument()
    expect(screen.getByTestId('task-title')).toHaveValue('Escrever testes')
    expect(screen.getByTestId('task-status')).toHaveValue('IN_PROGRESS')
    expect(screen.getByTestId('task-due-date')).toHaveValue('2026-10-01')

    await user.clear(screen.getByTestId('task-title'))
    await user.type(screen.getByTestId('task-title'), 'Título novo')
    await user.click(screen.getByTestId('task-submit'))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(5, {
        title: 'Título novo',
        description: 'Cobrir o formulário',
        status: 'IN_PROGRESS',
        dueDate: '2026-10-01',
      })
    })
    expect(mockGet).toHaveBeenCalledWith(5)
  })

  it('shows an error when loading the task fails', async () => {
    mockGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Falha no servidor' } },
    })

    renderForm('/tasks/99/edit')

    expect(await screen.findByTestId('task-form-error')).toHaveTextContent('Falha no servidor')
  })
})