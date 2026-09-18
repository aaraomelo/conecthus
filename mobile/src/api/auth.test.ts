import { api } from './client'
import { loginUser, registerUser } from './auth'

jest.mock('./client', () => {
  const actual = jest.requireActual('./client')
  return {
    ...actual,
    api: {
      post: jest.fn().mockResolvedValue({ data: {} }),
      get: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() } },
    },
  }
})

const mockedApi = api as jest.Mocked<typeof api>

describe('auth api', () => {
  beforeEach(() => jest.clearAllMocks())

  it('registerUser posts to /auth/register', async () => {
    await registerUser('Ana', 'ana@test.com', '123456')
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'ana@test.com',
      password: '123456',
    })
  })

  it('loginUser posts to /auth/login', async () => {
    await loginUser('ana@test.com', '123456')
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@test.com',
      password: '123456',
    })
  })
})
