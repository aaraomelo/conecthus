import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import type { Task, TaskListResponse } from './types'

vi.mock('./api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
}))

vi.mock('./api/tasks', () => ({
  createTask: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
  listTasks: vi.fn(),
  markTaskDone: vi.fn(),
  deleteTask: vi.fn(),
}))

vi.mock('./mqtt/useNotifications', () => ({
  TASKS_CHANGED_EVENT: 'conecthus:tasks-changed',
  useNotifications: () => ({
    notifications: [],
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
}))

import { listTasks } from './api/tasks'

const mockList = vi.mocked(listTasks)

const user = { id: 1, name: 'Ana', email: 'ana@example.com', createdAt: '', updatedAt: '' }

const task: Task = {
  id: 1,
  title: 'Estudar NestJS',
  description: 'Ler a documentação oficial',
  status: 'IN_PROGRESS',
  dueDate: null,
  userId: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

const page: TaskListResponse = {
  items: [task],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
}

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App routing and guards', () => {
  it('redirects unauthenticated users to the login page', () => {
    localStorage.clear()

    renderApp('/tasks')

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('redirects authenticated users away from the login page', async () => {
    localStorage.setItem('conecthus.user', JSON.stringify(user))
    localStorage.setItem('conecthus.token', 'token-123')
    mockList.mockResolvedValue({ data: page } as never)

    renderApp('/login')

    expect(await screen.findByTestId('task-list')).toBeInTheDocument()
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument()
  })

  it('renders the task list for authenticated users', async () => {
    localStorage.setItem('conecthus.user', JSON.stringify(user))
    localStorage.setItem('conecthus.token', 'token-123')
    mockList.mockResolvedValue({ data: page } as never)

    renderApp('/tasks')

    expect(await screen.findByText('Estudar NestJS')).toBeInTheDocument()
    expect(screen.getAllByText('Em andamento')).toHaveLength(2)
    expect(screen.getByText(user.name)).toBeInTheDocument()
  })
})