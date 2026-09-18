import { api } from './client'
import type { AuthResponse, User } from '../types'

export function registerUser(name: string, email: string, password: string) {
  return api.post<AuthResponse>('/auth/register', { name, email, password })
}

export function loginUser(email: string, password: string) {
  return api.post<AuthResponse>('/auth/login', { email, password })
}