import type { TaskStatus } from './types'

export const colors = {
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#f5f0ff',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f3f4f6',
  surface: '#ffffff',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const radius = 10

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
}

export const statusLabels: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
}

export const statusColors: Record<TaskStatus, string> = {
  TODO: colors.warning,
  IN_PROGRESS: colors.primary,
  DONE: colors.success,
}

export const statusBackgrounds: Record<TaskStatus, string> = {
  TODO: colors.warningLight,
  IN_PROGRESS: colors.primaryLight,
  DONE: colors.successLight,
}