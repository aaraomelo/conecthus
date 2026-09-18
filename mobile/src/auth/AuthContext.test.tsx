import { render, waitFor, act, fireEvent, renderHook } from '@testing-library/react-native'
import { Text, Pressable } from 'react-native'
import { AuthProvider } from './AuthContext'
import { useAuth } from './auth-context'
import * as storage from './storage'
import * as authApi from '../api/auth'

jest.mock('../api/auth')
jest.mock('./storage', () => {
  const actual = jest.requireActual('./storage')
  return {
    ...actual,
    loadSession: jest.fn(),
    persistSession: jest.fn(),
    removeSession: jest.fn(),
    setToken: jest.fn(),
    getToken: jest.fn(() => null),
  }
})

const mockedStorage = storage as jest.Mocked<typeof storage>
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>

function Probe() {
  const { user, isAuthenticated, initializing, login, register, logout } = useAuth()
  return (
    <>
      <Text testID="initializing">{String(initializing)}</Text>
      <Text testID="authenticated">{String(isAuthenticated)}</Text>
      <Text testID="user">{user ? user.email : 'none'}</Text>
      <Pressable testID="login-btn" onPress={() => login('a@a.com', '123456')} />
      <Pressable testID="register-btn" onPress={() => register('Ana', 'ana@test.com', '123456')} />
      <Pressable testID="logout-btn" onPress={() => logout()} />
    </>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthProvider', () => {
  it('loads session on mount and finishes initializing', async () => {
    mockedStorage.loadSession.mockResolvedValueOnce({ user: null, token: null })
    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(getByTestId('initializing').props.children).toBe('false'))
    expect(getByTestId('authenticated').props.children).toBe('false')
  })

  it('sets user when session exists', async () => {
    const user = { id: 1, name: 'Ana', email: 'ana@test.com', createdAt: '', updatedAt: '' }
    mockedStorage.loadSession.mockResolvedValueOnce({ user: user as never, token: 'tok' })
    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(getByTestId('user').props.children).toBe('ana@test.com'))
    expect(mockedStorage.setToken).toHaveBeenCalledWith('tok')
  })

  it('login persists session and sets user', async () => {
    mockedStorage.loadSession.mockResolvedValueOnce({ user: null, token: null })
    const user = { id: 2, name: 'Bob', email: 'bob@test.com', createdAt: '', updatedAt: '' }
    mockedAuthApi.loginUser.mockResolvedValueOnce({ data: { user: user as never, accessToken: 'jwt-123' } } as never)
    mockedStorage.persistSession.mockResolvedValueOnce(undefined)
    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(getByTestId('initializing').props.children).toBe('false'))
    await act(async () => {
      fireEvent.press(getByTestId('login-btn'))
    })
    await waitFor(() => expect(getByTestId('user').props.children).toBe('bob@test.com'))
    expect(mockedStorage.persistSession).toHaveBeenCalledWith(user, 'jwt-123')
  })

  it('register persists session', async () => {
    mockedStorage.loadSession.mockResolvedValueOnce({ user: null, token: null })
    const user = { id: 3, name: 'Ana', email: 'ana@test.com', createdAt: '', updatedAt: '' }
    mockedAuthApi.registerUser.mockResolvedValueOnce({ data: { user: user as never, accessToken: 'jwt-xyz' } } as never)
    mockedStorage.persistSession.mockResolvedValueOnce(undefined)
    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(getByTestId('initializing').props.children).toBe('false'))
    await act(async () => {
      fireEvent.press(getByTestId('register-btn'))
    })
    await waitFor(() => expect(getByTestId('user').props.children).toBe('ana@test.com'))
  })

  it('logout clears session', async () => {
    const user = { id: 1, name: 'Ana', email: 'ana@test.com', createdAt: '', updatedAt: '' }
    mockedStorage.loadSession.mockResolvedValueOnce({ user: user as never, token: 'tok' })
    mockedStorage.removeSession.mockResolvedValueOnce(undefined)
    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(getByTestId('authenticated').props.children).toBe('true'))
    await act(async () => {
      fireEvent.press(getByTestId('logout-btn'))
    })
    await waitFor(() => expect(getByTestId('authenticated').props.children).toBe('false'))
    expect(mockedStorage.removeSession).toHaveBeenCalled()
  })

  it('throws when useAuth outside provider', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow('useAuth must be used within an AuthProvider')
  })
})
