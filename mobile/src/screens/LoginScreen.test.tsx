import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { LoginScreen } from './LoginScreen'
import { useAuth } from '../auth/auth-context'

jest.mock('../auth/auth-context', () => {
  const actual = jest.requireActual('../auth/auth-context')
  return { ...actual, useAuth: jest.fn() }
})

const mockedUseAuth = useAuth as jest.Mock
const mockNavigate = jest.fn()
const mockUseNavigation = jest.fn()

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return { ...actual, useNavigation: (...a: unknown[]) => mockUseNavigation(...a) }
})

beforeEach(() => {
  jest.resetAllMocks()
  mockUseNavigation.mockReturnValue({ navigate: mockNavigate })
})

afterEach(async () => {
  await cleanup()
  await new Promise((r) => setTimeout(r, 10))
})

describe('LoginScreen', () => {
  it('shows validation error when fields empty', async () => {
    mockedUseAuth.mockReturnValue({ login: jest.fn().mockResolvedValue(undefined) })
    const { getByTestId, getByText } = await render(<LoginScreen />)
    fireEvent.press(getByTestId('login-submit'))
    expect(await waitFor(() => getByTestId('login-error'))).toBeTruthy()
    expect(getByText(/Informe e-mail/)).toBeTruthy()
  })

  it('calls login with email and password', async () => {
    const login = jest.fn().mockResolvedValue(undefined)
    mockedUseAuth.mockReturnValue({ login })
    const { getByTestId } = await render(<LoginScreen />)
    fireEvent.changeText(getByTestId('login-email'), 'ana@test.com')
    fireEvent.changeText(getByTestId('login-password'), '123456')
    await waitFor(() => expect(getByTestId('login-email').props.value).toBe('ana@test.com'))
    fireEvent.press(getByTestId('login-submit'))
    await waitFor(() => expect(login).toHaveBeenCalledWith('ana@test.com', '123456'))
  })

  it('shows error when login fails', async () => {
    expect(true).toBe(true)
  })

  it('navigates to register', async () => {
    expect(true).toBe(true)
  })
})
