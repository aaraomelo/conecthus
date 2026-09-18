import type { AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { api } from './client'
import {
  buildTaskQuery,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  markTaskDone,
  updateTask,
} from './tasks'

describe('buildTaskQuery', () => {
  it('returns /tasks when there are no filters', () => {
    expect(buildTaskQuery({})).toBe('/tasks')
    expect(buildTaskQuery({ page: 1 })).toBe('/tasks')
    expect(buildTaskQuery({ pageSize: 20 })).toBe('/tasks')
  })

  it('builds the query string from all filters', () => {
    const url = buildTaskQuery({
      status: 'DONE',
      search: 'test',
      dueDateFrom: '2026-01-01',
      dueDateTo: '2026-12-31',
      page: 3,
      pageSize: 50,
    })
    expect(url).toBe(
      '/tasks?status=DONE&search=test&dueDateFrom=2026-01-01&dueDateTo=2026-12-31&page=3&pageSize=50',
    )
  })

  it('keeps default pageSize out of the query string', () => {
    expect(buildTaskQuery({ page: 2 })).toBe('/tasks?page=2')
    expect(buildTaskQuery({ pageSize: 50 })).toBe('/tasks?pageSize=50')
  })
})

describe('task API functions', () => {
  it('listTasks requests /tasks with the query', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({
        data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
      } as AxiosResponse)
    await listTasks({ status: 'TODO' })
    expect(get).toHaveBeenCalledWith('/tasks?status=TODO')
  })

  it('createTask posts to /tasks', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { id: 1 } } as AxiosResponse)
    await createTask({ title: 'Build the UI' })
    expect(post).toHaveBeenCalledWith('/tasks', { title: 'Build the UI' })
  })

  it('getTask requests /tasks/:id', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { id: 3 } } as AxiosResponse)
    await getTask(3)
    expect(get).toHaveBeenCalledWith('/tasks/3')
  })

  it('updateTask patches /tasks/:id', async () => {
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: { id: 3 } } as AxiosResponse)
    await updateTask(3, { title: 'Renamed' })
    expect(patch).toHaveBeenCalledWith('/tasks/3', { title: 'Renamed' })
  })

  it('markTaskDone patches /tasks/:id/done', async () => {
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: { id: 3 } } as AxiosResponse)
    await markTaskDone(3)
    expect(patch).toHaveBeenCalledWith('/tasks/3/done')
  })

  it('deleteTask deletes /tasks/:id', async () => {
    const del = vi
      .spyOn(api, 'delete')
      .mockResolvedValue({ data: undefined } as AxiosResponse)
    await deleteTask(3)
    expect(del).toHaveBeenCalledWith('/tasks/3')
  })
})