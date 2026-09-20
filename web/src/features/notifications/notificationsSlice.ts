import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { TaskNotification } from '../../mqtt/useNotifications'

export interface NotificationsState {
  items: TaskNotification[]
}

const initialState: NotificationsState = {
  items: [],
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived: (state, action: PayloadAction<TaskNotification>) => {
      state.items = [action.payload, ...state.items].slice(0, 20)
    },
    notificationsDismissed: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((_, index) => index !== action.payload)
    },
    notificationsDismissAll: (state) => {
      state.items = []
    },
  },
})

export const {
  notificationReceived,
  notificationsDismissed,
  notificationsDismissAll,
} = notificationsSlice.actions

export default notificationsSlice.reducer