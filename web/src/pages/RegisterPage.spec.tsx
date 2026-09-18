import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { RegisterPage } from './RegisterPage'
import type { AuthResponse } from '../types'

vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
}))

import { registerUser } from '../api/auth'

const mockRegister = vi.mocked(registerUser)
const user = { id: 1, name: 'Ana', email: 'ana@example.com', createdAt: '', updatedAt: '' }

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tasks" element={<div>DASHBOARD</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
  })

  it('renders the registration form', () => {
    renderRegister()
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('registers a new user and navigates to /tasks', async () => {
    const response = { user, accessToken: 'token-reg' } satisfies AuthResponse
    mockRegister.mockResolvedValue({ data: response } as never)
    const userEventApi = userEvent.setup()

    renderRegister()
    await userEventApi.type(screen.getByLabelText('Nome'), 'Ana')
    await userEventApi.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEventApi.type(screen.getByLabelText('Senha'), 'secret1')
    await userEventApi.click(screen.getByTestId('register-submit'))

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument()
    expect(mockRegister).toHaveBeenCalledWith('Ana', 'ana@example.com', 'secret1')
    expect(localStorage.getItem('conecthus.token')).toBe('token-reg')
  })

  it('shows an error message when registration fails', async () => {
    mockRegister.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: 'E-mail já cadastrado' } },
    })
    const userEventApi = userEvent.setup()

    renderRegister()
    await userEventApi.type(screen.getByLabelText('Nome'), 'Ana')
    await userEventApi.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEventApi.type(screen.getByLabelText('Senha'), 'secret1')
    await userEventApi.click(screen.getByTestId('register-submit'))

    expect(await screen.findByTestId('register-error')).toHaveTextContent('E-mail já cadastrado')
  })
})