import type { User } from '../types'

const USER_KEY = 'conecthus.user'
export const TOKEN_KEY = 'conecthus.token'

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function persistUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function setSession(user: User, token: string) {
  persistUser(user)
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}