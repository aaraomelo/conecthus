import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Task, TaskStatus } from '../../types'

export interface TasksState {
  items: Task[]
  loading: boolean
  error: string | null
  filters: {
    status?: TaskStatus
    search?: string
    dueDateFrom?: string
    dueDateTo?: string
    page: number
    pageSize: number
  }
}

const initialState: TasksState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    status: undefined,
    search: undefined,
    dueDateFrom: undefined,
    dueDateTo: undefined,
    page: 1,
    pageSize: 20,
  },
}

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    tasksRequested: (state) => {
      state.loading = true
      state.error = null
    },
    tasksReceived: (state, action: PayloadAction<{ items: Task[] }>) => {
      state.loading = false
      state.items = action.payload.items
    },
    tasksFailed: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    tasksFilterUpdated: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    tasksPageChanged: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload
    },
    taskAdded: (state, action: PayloadAction<Task>) => {
      state.items.unshift(action.payload)
    },
    taskUpdated: (state, action: PayloadAction<Task>) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id)
      if (index !== -1) state.items[index] = action.payload
    },
    taskDeleted: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((t) => t.id !== action.payload)
    },
    taskStatusChanged: (state, action: PayloadAction<{ id: number; status: TaskStatus }>) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id)
      if (index !== -1) state.items[index].status = action.payload.status
    },
  },
})

export const {
  tasksRequested,
  tasksReceived,
  tasksFailed,
  tasksFilterUpdated,
  tasksPageChanged,
  taskAdded,
  taskUpdated,
  taskDeleted,
  taskStatusChanged,
} = tasksSlice.actions

export default tasksSlice.reducer