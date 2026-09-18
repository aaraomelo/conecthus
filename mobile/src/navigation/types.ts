export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Tasks: undefined
  TaskForm: { taskId?: number } | undefined
  TaskDetail: { taskId: number }
}
