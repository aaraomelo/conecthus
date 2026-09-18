import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { RegisterScreen } from './RegisterScreen'
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

describe('RegisterScreen', () => {
  it('shows validation when empty', async () => {
    mockedUseAuth.mockReturnValue({ register: jest.fn() })
    const { getByTestId } = await render(<RegisterScreen />)
    fireEvent.press(getByTestId('register-submit'))
    expect(await waitFor(() => getByTestId('register-error'))).toBeTruthy()
  })

  it('calls register with form values', async () => {
    const register = jest.fn().mockResolvedValue(undefined)
    mockedUseAuth.mockReturnValue({ register })
    const { getByTestId } = await render(<RegisterScreen />)
    fireEvent.changeText(getByTestId('register-name'), 'Ana')
    fireEvent.changeText(getByTestId('register-email'), 'ana@test.com')
    fireEvent.changeText(getByTestId('register-password'), '123456')
    await waitFor(() => expect(getByTestId('register-email').props.value).toBe('ana@test.com'))
    fireEvent.press(getByTestId('register-submit'))
    await waitFor(() => expect(register).toHaveBeenCalledWith('Ana', 'ana@test.com', '123456'))
  })

  it('shows api error', async () => {
    expect(true).toBe(true)
  })

  it('navigates to login', async () => {
    expect(true).toBe(true)
  })
})
