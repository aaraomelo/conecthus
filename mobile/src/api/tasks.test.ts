import { api } from './client'
import { buildTaskQuery, createTask, deleteTask, getTask, listTasks, markTaskDone, updateTask } from './tasks'

jest.mock('./client', () => {
  const actual = jest.requireActual('./client')
  return {
    ...actual,
    api: {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      patch: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({}),
      interceptors: { request: { use: jest.fn() } },
    },
  }
})

const mockedApi = api as jest.Mocked<typeof api>

describe('buildTaskQuery', () => {
  it('returns /tasks for empty query', () => {
    expect(buildTaskQuery({})).toBe('/tasks')
  })

  it('includes status', () => {
    expect(buildTaskQuery({ status: 'DONE' })).toBe('/tasks?status=DONE')
  })

  it('skips empty status', () => {
    expect(buildTaskQuery({ status: '' })).toBe('/tasks')
  })

  it('includes search and pagination', () => {
    const qs = buildTaskQuery({ search: 'relatório', page: 2, pageSize: 10 })
    expect(qs).toContain('search=relat%C3%B3rio')
    expect(qs).toContain('page=2')
    expect(qs).toContain('pageSize=10')
  })

  it('uses default pageSize 20 (omits)', () => {
    expect(buildTaskQuery({ pageSize: 20 })).toBe('/tasks')
  })

  it('includes dueDate params', () => {
    const qs = buildTaskQuery({ dueDateFrom: '2026-01-01', dueDateTo: '2026-12-31' })
    expect(qs).toContain('dueDateFrom=2026-01-01')
    expect(qs).toContain('dueDateTo=2026-12-31')
  })

  it('combines all filters', () => {
    const qs = buildTaskQuery({
      status: 'IN_PROGRESS',
      search: 'api',
      dueDateFrom: '2026-09-01',
      page: 3,
      pageSize: 5,
    })
    expect(qs).toBe('/tasks?status=IN_PROGRESS&search=api&dueDateFrom=2026-09-01&page=3&pageSize=5')
  })
})

describe('tasks api', () => {
  beforeEach(() => jest.clearAllMocks())

  it('listTasks calls api.get', async () => {
    await listTasks({ status: 'DONE' })
    expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/tasks'))
  })

  it('getTask calls api.get with id', async () => {
    await getTask(5)
    expect(mockedApi.get).toHaveBeenCalledWith('/tasks/5')
  })

  it('createTask calls api.post', async () => {
    await createTask({ title: 'Nova' })
    expect(mockedApi.post).toHaveBeenCalledWith('/tasks', { title: 'Nova' })
  })

  it('updateTask calls api.patch', async () => {
    await updateTask(1, { title: 'Upd' })
    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/1', { title: 'Upd' })
  })

  it('markTaskDone calls api.patch', async () => {
    await markTaskDone(2)
    expect(mockedApi.patch).toHaveBeenCalledWith('/tasks/2/done')
  })

  it('deleteTask calls api.delete', async () => {
    await deleteTask(3)
    expect(mockedApi.delete).toHaveBeenCalledWith('/tasks/3')
  })
})
