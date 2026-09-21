import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const mockLogin = vi.fn()
vi.mock('../auth/auth-context', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    user: null,
    loading: false,
    register: vi.fn(),
    logout: vi.fn(),
  })),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tasks" element={<div>Tasks</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear()
    mockNavigate.mockClear()
  })

  it('renders the login form', () => {
    renderPage()
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByTestId('login-email')).toBeInTheDocument()
    expect(screen.getByTestId('login-password')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
  })

  it('shows validation errors on submit with empty fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('login-submit'))

    expect(await screen.findByText('E-mail obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Senha obrigatória')).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('login-email'), 'invalid-email')
    await user.tab()

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
  })

  it('does not show password error when password has 2 chars', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('login-password'), '12')
    await user.tab()

    expect(screen.queryByText('Senha obrigatória')).not.toBeInTheDocument()
  })

  it('logs in and navigates to /tasks on success', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('login-email'), 'test@domain.com')
    await user.type(screen.getByTestId('login-password'), 'secret')
    await user.click(screen.getByTestId('login-submit'))

    expect(mockLogin).toHaveBeenCalledWith('test@domain.com', 'secret')
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', { replace: true })
  })

  it('displays error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'))

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('login-email'), 'test@domain.com')
    await user.type(screen.getByTestId('login-password'), 'wrong')
    await user.click(screen.getByTestId('login-submit'))

    expect(await screen.findByText('Algo deu errado. Tente novamente.')).toBeInTheDocument()
  })
})