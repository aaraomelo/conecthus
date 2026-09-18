import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASKS_CHANGED_EVENT, useNotifications } from './useNotifications'

type Handler = (...args: unknown[]) => void

const { fakeConnect, FakeClient } = vi.hoisted(() => {
  class FakeClient {
    handlers = new Map<string, Handler[]>()

    on(event: string, handler: Handler) {
      const list = this.handlers.get(event) ?? []
      list.push(handler)
      this.handlers.set(event, list)
      return this
    }

    fire(event: string, ...args: unknown[]) {
      for (const handler of this.handlers.get(event) ?? []) {
        handler(...args)
      }
    }

    subscribe = vi.fn()
    end = vi.fn()
  }
  const fakeConnect = vi.fn()
  return { fakeConnect, FakeClient }
})

vi.mock('mqtt', () => ({
  default: {
    connect: () => {
      const client = new FakeClient()
      queueMicrotask(() => client.fire('connect'))
      fakeConnect(client)
      return client
    },
  },
}))

function renderNotificationsHook(userId: number | undefined, onNotification?: () => void) {
  return renderHook(() => useNotifications(userId, onNotification))
}

describe('useNotifications', () => {
  beforeEach(() => {
    fakeConnect.mockReset()
  })

  it('does nothing without a userId', () => {
    const { result } = renderNotificationsHook(undefined)
    expect(result.current.notifications).toEqual([])
    expect(fakeConnect).not.toHaveBeenCalled()
  })

  it('subscribes to the user topic after connecting', async () => {
    renderNotificationsHook(1)

    const client = fakeConnect.mock.calls[0]![0] as InstanceType<typeof FakeClient>
    await act(async () => {})

    expect(client.subscribe).toHaveBeenCalledWith('notifications/1', { qos: 0 })
  })

  it('parses incoming messages into notifications and calls onNotification', async () => {
    const onNotification = vi.fn()
    const { result } = renderNotificationsHook(1, onNotification)

    const client = fakeConnect.mock.calls[0]![0] as InstanceType<typeof FakeClient>
    await act(async () => {})
    act(() => {
      client.fire(
        'message',
        'notifications/1',
        JSON.stringify({ event: 'created', taskId: 9, title: 'Nova' }),
      )
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]!.title).toBe('Nova')
    expect(result.current.notifications[0]!.event).toBe('created')
    expect(onNotification).toHaveBeenCalledTimes(1)
  })

  it('dismisses and clears notifications', async () => {
    const { result } = renderNotificationsHook(1)

    const client = fakeConnect.mock.calls[0]![0] as InstanceType<typeof FakeClient>
    await act(async () => {})
    act(() => {
      client.fire(
        'message',
        'notifications/1',
        JSON.stringify({ event: 'deleted', title: 'X' }),
      )
    })
    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      result.current.dismiss(0)
    })
    expect(result.current.notifications).toHaveLength(0)

    act(() => {
      for (let i = 0; i < 3; i += 1) {
        client.fire('message', 'notifications/1', JSON.stringify({ event: 'created', title: `T${i}` }))
      }
    })
    expect(result.current.notifications).toHaveLength(3)

    act(() => {
      result.current.dismissAll()
    })
    expect(result.current.notifications).toHaveLength(0)
    expect(TASKS_CHANGED_EVENT).toBe('conecthus:tasks-changed')
  })

  it('ignores malformed payloads', async () => {
    const { result } = renderNotificationsHook(1)

    const client = fakeConnect.mock.calls[0]![0] as InstanceType<typeof FakeClient>
    await act(async () => {})
    act(() => {
      client.fire('message', 'notifications/1', 'not-json')
    })

    expect(result.current.notifications).toHaveLength(0)
  })
})