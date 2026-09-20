import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponse, User } from '../types'
import { loginUser, registerUser } from '../api/auth'
import { AuthContext, type AuthContextValue } from './auth-context'
import { getStoredUser } from './storage'
import { store } from '../app/store'
import { initAuth, loginSuccess, logout, setUser } from '../features/auth/authSlice'
import { selectUser } from '../features/auth/authSelectors'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getStoredUser())

  useEffect(() => {
    store.dispatch(initAuth())
    const unsubscribe = store.subscribe(() => {
      setUserState(selectUser(store.getState()))
    })
    return unsubscribe
  }, [])

  const applySession = (data: AuthResponse) => {
    store.dispatch(loginSuccess({ token: data.accessToken, user: data.user }))
    setUserState(data.user)
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    login: async (email, password) => applySession((await loginUser(email, password)).data),
    register: async (name, email, password) =>
      applySession((await registerUser(name, email, password)).data),
    logout: () => {
      store.dispatch(logout())
      setUserState(null)
    },
    refreshUser: (updated) => {
      store.dispatch(setUser(updated))
      setUserState(updated)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}