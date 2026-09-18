import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthResponse, User } from '../types'
import { loginUser, registerUser } from '../api/auth'
import { AuthContext, type AuthContextValue } from './auth-context'
import { loadSession, persistSession, removeSession, setToken } from './storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  const applySession = useCallback(async (data: AuthResponse) => {
    await persistSession(data.user, data.accessToken)
    setUser(data.user)
  }, [])

  useEffect(() => {
    let active = true
    loadSession()
      .then((session) => {
        if (!active) return
        setToken(session.token)
        setUser(session.user)
      })
      .catch(() => {
        if (active) {
          setUser(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initializing,
      login: async (email, password) => {
        const data = (await loginUser(email, password)).data
        await applySession(data)
      },
      register: async (name, email, password) => {
        const data = (await registerUser(name, email, password)).data
        await applySession(data)
      },
      logout: async () => {
        await removeSession()
        setUser(null)
      },
    }),
    [user, initializing, applySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}