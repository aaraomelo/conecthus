import { Platform } from 'react-native'

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_HOST}:3000/api`

export const MQTT_URL = process.env.EXPO_PUBLIC_MQTT_URL ?? `ws://${DEFAULT_HOST}:8083`