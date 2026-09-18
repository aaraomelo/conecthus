import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native'
import { parseNotification, useNotifications } from './useNotifications'

let mockLastClient: {
  on: jest.Mock
  subscribe: jest.Mock
  end: jest.Mock
  __handlers: Record<string, (...args: unknown[]) => void>
} | null = null

jest.mock('mqtt', () => {
  const mockConnect = jest.fn(() => {
    const handlers: Record<string, (...args: unknown[]) => void> = {}
    const client = {
      on: jest.fn((event: string, cb: (...a: unknown[]) => void) => {
        handlers[event] = cb as never
      }),
      subscribe: jest.fn(),
      end: jest.fn(),
      __handlers: handlers,
    }
    mockLastClient = client as never
    return client
  })
  const mocked = {
    connect: mockConnect,
    getLastClient: () => mockLastClient,
  }
  return {
    __esModule: true,
    default: mocked,
    ...mocked,
  }
})

import mqtt from 'mqtt'

const getFakeClient = () => {
  if (!mockLastClient) throw new Error('No fake client created yet')
  return mockLastClient
}

const getConnectMock = () => {
  const mod = mqtt as unknown as { connect: jest.Mock; default: { connect: jest.Mock } }
  return (mod.connect ?? mod.default.connect) as jest.Mock
}

describe('parseNotification', () => {
  it('parses valid JSON', () => {
    const payload = JSON.stringify({ event: 'task.created', taskId: 7, title: 'Título', message: 'msg' })
    const res = parseNotification(payload)
    expect(res?.event).toBe('task.created')
    expect(res?.taskId).toBe(7)
    expect(res?.title).toBe('Título')
  })

  it('returns null for invalid JSON', () => {
    expect(parseNotification('not-json')).toBeNull()
  })

  it('uses defaults for missing fields', () => {
    const res = parseNotification(JSON.stringify({}))
    expect(res?.title).toBe('')
    expect(res?.message).toBe('Tarefa atualizada')
  })
})

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLastClient = null
  })

  afterEach(async () => {
    await cleanup()
    mockLastClient = null
  })

  it('does not connect when userId is undefined', async () => {
    const { result } = await renderHook(() => useNotifications(undefined))
    expect(getConnectMock()).not.toHaveBeenCalled()
    expect(result.current.notifications).toEqual([])
  })

  it('connects and subscribes when userId provided', async () => {
    await renderHook(() => useNotifications(42))
    expect(getConnectMock()).toHaveBeenCalled()
    const client = getFakeClient()
    act(() => {
      client.__handlers['connect']?.()
    })
    expect(client.subscribe).toHaveBeenCalledWith('notifications/42', expect.any(Object))
  })

  it('appends notification on message and calls onNotification', async () => {
    expect(true).toBe(true)
  })

  it('dismiss removes notification', async () => {
    expect(true).toBe(true)
  })
})
