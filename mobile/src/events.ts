import { DeviceEventEmitter } from 'react-native'

export const TASKS_CHANGED_EVENT = 'conecthus:tasks-changed'

export function emitTasksChanged(payload?: unknown) {
  DeviceEventEmitter.emit(TASKS_CHANGED_EVENT, payload)
}

export function onTasksChanged(listener: (payload: unknown) => void): () => void {
  const subscription = DeviceEventEmitter.addListener(TASKS_CHANGED_EVENT, listener)
  return () => subscription.remove()
}