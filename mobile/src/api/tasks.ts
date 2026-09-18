import { api } from './client'
import type {
  CreateTaskInput,
  Task,
  TaskListResponse,
  TaskQuery,
  UpdateTaskInput,
} from '../types'

export function buildTaskQuery(query: TaskQuery): string {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.search) params.set('search', query.search)
  if (query.dueDateFrom) params.set('dueDateFrom', query.dueDateFrom)
  if (query.dueDateTo) params.set('dueDateTo', query.dueDateTo)
  if (query.page && query.page > 1) params.set('page', String(query.page))
  if (query.pageSize && query.pageSize !== 20) params.set('pageSize', String(query.pageSize))
  const qs = params.toString()
  return qs ? `/tasks?${qs}` : '/tasks'
}

export function listTasks(query: TaskQuery = {}) {
  return api.get<TaskListResponse>(buildTaskQuery(query))
}

export function getTask(id: number) {
  return api.get<Task>(`/tasks/${id}`)
}

export function createTask(input: CreateTaskInput) {
  return api.post<Task>('/tasks', input)
}

export function updateTask(id: number, input: UpdateTaskInput) {
  return api.patch<Task>(`/tasks/${id}`, input)
}

export function markTaskDone(id: number) {
  return api.patch<Task>(`/tasks/${id}/done`)
}

export function deleteTask(id: number) {
  return api.delete<void>(`/tasks/${id}`)
}