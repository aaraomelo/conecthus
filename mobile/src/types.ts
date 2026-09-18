export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  userId: number
  createdAt: string
  updatedAt: string
}

export interface TaskListResponse {
  items: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TaskQuery {
  status?: TaskStatus | ''
  search?: string
  dueDateFrom?: string
  dueDateTo?: string
  page?: number
  pageSize?: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  dueDate?: string | null
}