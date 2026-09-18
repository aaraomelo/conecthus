import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskDetailPage } from './TaskDetailPage'
import type { Task } from '../types'

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
  listTasks: vi.fn(),
  markTaskDone: vi.fn(),
  deleteTask: vi.fn(),
}))

import { deleteTask, getTask, markTaskDone } from '../api/tasks'

const mockGet = vi.mocked(getTask)
const mockDone = vi.mocked(markTaskDone)
const mockDelete = vi.mocked(deleteTask)

const task: Task = {
  id: 5,
  title: 'Escrever testes',
  description: 'Cobrir o fluxo completo',
  status: 'TODO',
  dueDate: '2026-10-01T00:00:00.000Z',
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

function renderDetail(initialEntry = '/tasks/5') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/tasks" element={<div>LISTA</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockDone.mockReset()
    mockDelete.mockReset()
  })

  it('renders the full task information', async () => {
    mockGet.mockResolvedValue({ data: task } as never)

    renderDetail()

    expect(await screen.findByTestId('task-detail')).toBeInTheDocument()
    expect(screen.getByText('Escrever testes')).toBeInTheDocument()
    expect(screen.getByText('Cobrir o fluxo completo')).toBeInTheDocument()
    expect(screen.getByText('A fazer')).toBeInTheDocument()

    const dueLabel = screen.getByText('Vencimento')
    const dueValue = dueLabel.closest('div')?.querySelector('dd')
    expect(dueValue).toHaveTextContent(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('marks a task as done', async () => {
    mockGet.mockResolvedValue({ data: task } as never)
    mockDone.mockResolvedValue({ data: { ...task, status: 'DONE' } } as never)
    const user = userEvent.setup()

    renderDetail()
    await screen.findByTestId('task-detail')

    await user.click(screen.getByTestId('detail-done'))
    expect(mockDone).toHaveBeenCalledWith(5)
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.queryByTestId('detail-done')).not.toBeInTheDocument()
  })

  it('deletes a task after confirmation and navigates back', async () => {
    mockGet.mockResolvedValue({ data: task } as never)
    mockDelete.mockResolvedValue({ data: undefined } as never)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    renderDetail()
    await screen.findByTestId('task-detail')

    await user.click(screen.getByTestId('detail-delete'))
    expect(await screen.findByText('LISTA')).toBeInTheDocument()
    expect(mockDelete).toHaveBeenCalledWith(5)
  })

  it('does not delete without confirmation', async () => {
    mockGet.mockResolvedValue({ data: task } as never)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    renderDetail()
    await screen.findByTestId('task-detail')

    await user.click(screen.getByTestId('detail-delete'))
    expect(mockDelete).not.toHaveBeenCalled()
  })
})