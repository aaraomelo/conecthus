import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { LoginPage } from './LoginPage'
import type { AuthResponse } from '../types'

vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
}))

import { loginUser } from '../api/auth'

const mockLogin = vi.mocked(loginUser)
const user = { id: 1, name: 'Ana', email: 'ana@example.com', createdAt: '', updatedAt: '' }

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tasks" element={<div>DASHBOARD</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('renders the login form', () => {
    renderLogin()
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument()
  })

  it('logs in and navigates to /tasks', async () => {
    const response = { user, accessToken: 'token-123' } satisfies AuthResponse
    mockLogin.mockResolvedValue({ data: response } as never)
    const userEventApi = userEvent.setup()

    renderLogin()
    await userEventApi.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEventApi.type(screen.getByLabelText('Senha'), 'secret')
    await userEventApi.click(screen.getByTestId('login-submit'))

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument()
    expect(mockLogin).toHaveBeenCalledWith('ana@example.com', 'secret')
    expect(localStorage.getItem('conecthus.token')).toBe('token-123')
  })

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Credenciais inválidas' } },
    })
    const userEventApi = userEvent.setup()

    renderLogin()
    await userEventApi.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEventApi.type(screen.getByLabelText('Senha'), 'wrong')
    await userEventApi.click(screen.getByTestId('login-submit'))

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Credenciais inválidas')
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument()
  })
})