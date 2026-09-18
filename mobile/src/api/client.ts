import axios from 'axios'
import { API_BASE_URL } from '../config'
import { getToken } from '../auth/storage'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data.message.join(', ')
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível concluir a operação. Tente novamente.'
}