import { useEffect, useState } from 'react'
import mqtt from 'mqtt'
import { store } from '../../app/store'
import {
  notificationReceived,
  notificationsDismissAll,
  notificationsDismissed,
} from './notificationsSlice'
import { selectNotifications } from './notificationsSelectors'
import type { TaskNotification } from '../../mqtt/useNotifications'

function defaultMqttUrl(): string {
  if (import.meta.env.VITE_MQTT_URL) return String(import.meta.env.VITE_MQTT_URL)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/mqtt`
}

export function useTaskNotifications(userId: number | undefined) {
  const [notifications, setNotifications] = useState<TaskNotification[]>(() =>
    selectNotifications(store.getState()),
  )

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setNotifications(selectNotifications(store.getState()))
    })
    return unsubscribe
  }, [])

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
        store.dispatch(notificationReceived(note))
      } catch {
        // ignora payloads malformados
      }
    })

    return () => {
      client.end(true)
    }
  }, [userId])

  const dismiss = (key: number) => store.dispatch(notificationsDismissed(key))
  const dismissAll = () => store.dispatch(notificationsDismissAll())

  return { notifications, dismiss, dismissAll }
}