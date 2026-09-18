import { useEffect, useRef, useState } from 'react'
import mqtt from 'mqtt'

export interface TaskNotification {
  event: string
  taskId: number
  title: string
  message: string
  at: string
}

function defaultMqttUrl(): string {
  if (import.meta.env.VITE_MQTT_URL) return String(import.meta.env.VITE_MQTT_URL)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/mqtt`
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
    const client = mqtt.connect(defaultMqttUrl(), {
      clientId: `web-${userId}-${Math.random().toString(16).slice(2)}`,
      reconnectPeriod: 2000,
    })

    client.on('connect', () => {
      client.subscribe(`notifications/${userId}`, { qos: 0 })
    })

    client.on('message', (_topic, payload) => {
      try {
        const data = JSON.parse(payload.toString()) as Record<string, unknown>
        const note: TaskNotification = {
          event: String(data.event ?? 'task'),
          taskId: Number(data.taskId ?? 0),
          title: String(data.title ?? ''),
          message: String(data.message ?? 'Tarefa atualizada'),
          at: new Date().toISOString(),
        }
        setNotifications((prev) => [note, ...prev].slice(0, 20))
        onNotificationRef.current?.(note)
      } catch {
        // ignorar payloads malformados
      }
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

export const TASKS_CHANGED_EVENT = 'conecthus:tasks-changed'