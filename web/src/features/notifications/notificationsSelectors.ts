import type { RootState } from '../../app/store'

export const selectNotifications = (state: RootState) => state.notifications.items
export const selectNotificationsCount = (state: RootState) => state.notifications.items.length