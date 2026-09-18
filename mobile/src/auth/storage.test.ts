import AsyncStorage from '@react-native-async-storage/async-storage'
import { getToken, loadSession, persistSession, removeSession, setToken } from './storage'

const mockStorage = AsyncStorage as unknown as {
  multiGet: jest.Mock
  multiSet: jest.Mock
  multiRemove: jest.Mock
  clear: jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
  setToken(null)
})

describe('storage', () => {
  it('getToken returns null initially', () => {
    expect(getToken()).toBeNull()
  })

  it('setToken updates in-memory token', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
  })

  it('persistSession saves user and token', async () => {
    const user = { id: 1, name: 'Ana', email: 'ana@test.com', createdAt: '', updatedAt: '' }
    mockStorage.multiSet.mockResolvedValueOnce(undefined)
    await persistSession(user as never, 'tok-123')
    expect(getToken()).toBe('tok-123')
    expect(mockStorage.multiSet).toHaveBeenCalledWith([
      ['conecthus.user', JSON.stringify(user)],
      ['conecthus.token', 'tok-123'],
    ])
  })

  it('loadSession returns parsed user and token', async () => {
    const user = { id: 2, name: 'Bob', email: 'bob@test.com', createdAt: '', updatedAt: '' }
    mockStorage.multiGet.mockResolvedValueOnce([
      ['conecthus.user', JSON.stringify(user)],
      ['conecthus.token', 'my-token'],
    ])
    const res = await loadSession()
    expect(res.user).toEqual(user)
    expect(res.token).toBe('my-token')
  })

  it('loadSession returns nulls when empty', async () => {
    mockStorage.multiGet.mockResolvedValueOnce([
      ['conecthus.user', null],
      ['conecthus.token', null],
    ])
    const res = await loadSession()
    expect(res.user).toBeNull()
    expect(res.token).toBeNull()
  })

  it('loadSession handles JSON parse error gracefully', async () => {
    mockStorage.multiGet.mockRejectedValueOnce(new Error('fail'))
    const res = await loadSession()
    expect(res.user).toBeNull()
    expect(res.token).toBeNull()
  })

  it('removeSession clears token and storage', async () => {
    mockStorage.multiRemove.mockResolvedValueOnce(undefined)
    setToken('x')
    await removeSession()
    expect(getToken()).toBeNull()
    expect(mockStorage.multiRemove).toHaveBeenCalled()
  })
})
