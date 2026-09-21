import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const mockRegister = vi.fn()
vi.mock('../auth/auth-context', () => ({
  useAuth: vi.fn(() => ({
    register: mockRegister,
    user: null,
    loading: false,
    login: vi.fn(),
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
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tasks" element={<div>Tasks</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockClear()
    mockNavigate.mockClear()
  })

  it('renders the registration form', () => {
    renderPage()
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
    expect(screen.getByTestId('register-name')).toBeInTheDocument()
    expect(screen.getByTestId('register-email')).toBeInTheDocument()
    expect(screen.getByTestId('register-password')).toBeInTheDocument()
    expect(screen.getByTestId('register-confirm-password')).toBeInTheDocument()
    expect(screen.getByTestId('register-submit')).toBeInTheDocument()
  })

  it('shows validation errors on submit with empty fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('register-submit'))

    expect(await screen.findByText('Nome obrigatório')).toBeInTheDocument()
    expect(screen.getByText('E-mail obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Confirme sua senha')).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('register-email'), 'invalid-email')
    await user.tab()

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('register-password'), '12')
    await user.tab()

    expect(await screen.findByText('Mínimo 8 caracteres')).toBeInTheDocument()
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('register-password'), 'password1')
    await user.type(screen.getByTestId('register-confirm-password'), 'different')
    await user.tab()

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
  })

  it('registers a new user and navigates to /tasks on success', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('register-name'), 'Ana Silva')
    await user.type(screen.getByTestId('register-email'), 'ana@domain.com')
    await user.type(screen.getByTestId('register-password'), 'password1')
    await user.type(screen.getByTestId('register-confirm-password'), 'password1')
    await user.click(screen.getByTestId('register-submit'))

    expect(mockRegister).toHaveBeenCalledWith('Ana Silva', 'ana@domain.com', 'password1')
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', { replace: true })
  })

  it('displays error message when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('E-mail já cadastrado'))

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByTestId('register-name'), 'Ana Silva')
    await user.type(screen.getByTestId('register-email'), 'ana@domain.com')
    await user.type(screen.getByTestId('register-password'), 'password1')
    await user.type(screen.getByTestId('register-confirm-password'), 'password1')
    await user.click(screen.getByTestId('register-submit'))

    expect(await screen.findByText('Algo deu errado. Tente novamente.')).toBeInTheDocument()
  })
})