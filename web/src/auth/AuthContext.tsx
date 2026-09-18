import { useMemo, useState, type ReactNode } from 'react'
import type { AuthResponse, User } from '../types'
import { loginUser, registerUser } from '../api/auth'
import { AuthContext, type AuthContextValue } from './auth-context'
import { clearSession, getStoredUser, persistUser, setSession } from './storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())

  const applySession = (data: AuthResponse) => {
    setSession(data.user, data.accessToken)
    setUser(data.user)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async (email, password) => applySession((await loginUser(email, password)).data),
      register: async (name, email, password) =>
        applySession((await registerUser(name, email, password)).data),
      logout: () => {
        clearSession()
        setUser(null)
      },
      refreshUser: (updated) => {
        persistUser(updated)
        setUser(updated)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}