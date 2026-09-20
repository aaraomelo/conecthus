import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types'

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  hasInitialized: boolean
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  hasInitialized: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initAuth: (state) => {
      state.hasInitialized = true
      const storedUser = localStorage.getItem('conecthus.user')
      const storedToken = localStorage.getItem('conecthus.token')
      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser) as User
          state.token = storedToken
          state.user = user
          state.isAuthenticated = true
        } catch {
          state.token = null
          state.user = null
          state.isAuthenticated = false
        }
      }
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem('conecthus.token', action.payload.token)
      localStorage.setItem('conecthus.user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('conecthus.token')
      localStorage.removeItem('conecthus.user')
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('conecthus.token')
      localStorage.removeItem('conecthus.user')
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.hasInitialized = true
    },
  },
})

export const {
  initAuth,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  clearAuth,
} = authSlice.actions

export default authSlice.reducer