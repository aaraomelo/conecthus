import { useEffect, useRef, useState } from 'react'
import mqtt from 'mqtt'
import { MQTT_URL } from '../config'
import { emitTasksChanged } from '../events'

export interface TaskNotification {
  event: string
  taskId: number
  title: string
  message: string
  at: string
}

export function parseNotification(payload: string): TaskNotification | null {
  try {
    const data = JSON.parse(payload) as Record<string, unknown>
    return {
      event: String(data.event ?? 'task'),
      taskId: Number(data.taskId ?? 0),
      title: String(data.title ?? ''),
      message: String(data.message ?? 'Tarefa atualizada'),
      at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function useNotifications(
  userId: number | undefined,
  onNotification?: (note: TaskNotification) => void,
) {
  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const onNotificationRef = useRef(onNotification)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    if (!userId) return
    const client = mqtt.connect(MQTT_URL, {
      clientId: `mobile-${userId}-${Math.random().toString(16).slice(2)}`,
      reconnectPeriod: 2000,
    })

    client.on('connect', () => {
      client.subscribe(`notifications/${userId}`, { qos: 0 })
    })

    client.on('message', (_topic, payload) => {
      const note = parseNotification(payload.toString())
      if (!note) return
      setNotifications((prev) => [note, ...prev].slice(0, 20))
      emitTasksChanged(note)
      onNotificationRef.current?.(note)
    })

    return () => {
      client.end(true)
    }
  }, [userId])

  const dismiss = (key: number) =>
    setNotifications((prev) => prev.filter((_, index) => index !== key))

  const dismissAll = () => setNotifications([])

  return { notifications, dismiss, dismissAll }
}