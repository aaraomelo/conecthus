import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '../types'

const USER_KEY = 'conecthus.user'
const TOKEN_KEY = 'conecthus.token'

let authToken: string | null = null

export function getToken(): string | null {
  return authToken
}

export function setToken(token: string | null) {
  authToken = token
}

export interface StoredSession {
  user: User | null
  token: string | null
}

export async function loadSession(): Promise<StoredSession> {
  try {
    const entries = await AsyncStorage.multiGet([USER_KEY, TOKEN_KEY])
    const rawUser = entries[0][1]
    const rawToken = entries[1][1]
    return {
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
      token: rawToken,
    }
  } catch {
    return { user: null, token: null }
  }
}

export async function persistSession(user: User, token: string) {
  authToken = token
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(user)],
    [TOKEN_KEY, token],
  ])
}

export async function removeSession() {
  authToken = null
  await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY])
}