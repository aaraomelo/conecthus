import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

const baseTask: Task = {
  id: 7,
  title: 'Revisar PR',
  description: 'Revisar o pull request aberto',
  status: 'IN_PROGRESS',
  dueDate: '2026-09-30T00:00:00.000Z',
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

function renderCard(task: Task, options: Partial<Record<'onToggleDone' | 'onDelete', () => void>> = {}) {
  return render(
    <MemoryRouter>
      <TaskCard task={task} onToggleDone={options.onToggleDone} onDelete={options.onDelete} />
    </MemoryRouter>,
  )
}

describe('TaskCard', () => {
  it('renders task information', () => {
    renderCard(baseTask)
    expect(screen.getByText('Revisar PR')).toBeInTheDocument()
    expect(screen.getByText('Revisar o pull request aberto')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('does not render action buttons without callbacks', () => {
    renderCard(baseTask)
    expect(screen.queryByText('Concluir')).not.toBeInTheDocument()
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
  })

  it('invokes callbacks when actions are clicked', async () => {
    const onToggleDone = vi.fn()
    const onDelete = vi.fn()
    const user = userEvent.setup()

    renderCard(baseTask, { onToggleDone, onDelete })

    await user.click(screen.getByTestId('done-7'))
    expect(onToggleDone).toHaveBeenCalledWith(baseTask)

    await user.click(screen.getByTestId('delete-7'))
    expect(onDelete).toHaveBeenCalledWith(baseTask)
  })

  it('hides the “Concluir” button for tasks already done', () => {
    renderCard({ ...baseTask, status: 'DONE' }, { onToggleDone: vi.fn() })
    expect(screen.queryByText('Concluir')).not.toBeInTheDocument()
  })
})