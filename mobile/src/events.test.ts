import { emitTasksChanged, onTasksChanged, TASKS_CHANGED_EVENT } from './events'
import { DeviceEventEmitter } from 'react-native'

describe('events', () => {
  it('exports event constant', () => {
    expect(TASKS_CHANGED_EVENT).toBe('conecthus:tasks-changed')
  })

  it('emit and listen', () => {
    const listener = jest.fn()
    const off = onTasksChanged(listener)
    emitTasksChanged({ event: 'task.created' })
    expect(listener).toHaveBeenCalled()
    off()
    emitTasksChanged({ event: 'task.deleted' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('off removes listener (unsubscribe)', () => {
    const fn = jest.fn()
    const unsub = onTasksChanged(fn)
    unsub()
    emitTasksChanged({})
    expect(fn).not.toHaveBeenCalled()
  })
})
