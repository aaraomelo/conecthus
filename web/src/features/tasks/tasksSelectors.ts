import type { RootState } from '../../app/store'

export const selectTasksState = (state: RootState) => state.tasks
export const selectItems = (state: RootState) => state.tasks.items
export const selectLoading = (state: RootState) => state.tasks.loading
export const selectError = (state: RootState) => state.tasks.error
export const selectFilters = (state: RootState) => state.tasks.filters
export const selectCurrentPage = (state: RootState) => state.tasks.filters.page
export const selectPageSize = (state: RootState) => state.tasks.filters.pageSize

export const selectFilteredTasks = (state: RootState) => {
  const items = selectItems(state)
  const filters = selectFilters(state)

  let result = [...items]

  if (filters.status) {
    result = result.filter((t) => t.status === filters.status)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(searchLower) ||
        (t.description !== null && t.description.toLowerCase().includes(searchLower)),
    )
  }

  if (filters.dueDateFrom) {
    result = result.filter((t) => t.dueDate !== null && t.dueDate >= filters.dueDateFrom!)
  }

  if (filters.dueDateTo) {
    result = result.filter((t) => t.dueDate !== null && t.dueDate <= filters.dueDateTo!)
  }

  return result
}

export const selectIsEmpty = (state: RootState) =>
  selectItems(state).length === 0 && !selectLoading(state)

export const selectPagination = (state: RootState) => ({
  page: selectCurrentPage(state),
  pageSize: selectPageSize(state),
  totalItems: selectItems(state).length,
})