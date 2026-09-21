import { describe, expect, it } from 'vitest'
import { loginSchema, type LoginValues } from './loginSchema'
import { registerSchema, type RegisterValues } from './registerSchema'
import { taskFormSchema, type CreateTaskValues } from '../tasks/taskFormSchema'
import { taskQuerySchema, type TaskQueryValues } from '../tasks/taskQuerySchema'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@domain.com', password: 'secret' })
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ email: 'test@domain.com', password: 'secret' })
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('E-mail obrigatório')
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('E-mail inválido')
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@domain.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Senha obrigatória')
  })
})

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@domain.com',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'ana@domain.com',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Nome obrigatório')
  })

  it('rejects name over 120 chars', () => {
    const longName = 'A'.repeat(121)
    const result = registerSchema.safeParse({
      name: longName,
      email: 'ana@domain.com',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Nome excessivo')
  })

  it('rejects empty email', () => {
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: '',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('E-mail obrigatório')
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: 'not-an-email',
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('E-mail inválido')
  })

  it('rejects password under 8 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@domain.com',
      password: '123',
      confirmPassword: '123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mínimo 8 caracteres')
  })

  it('rejects password over 72 chars', () => {
    const longPassword = 'A'.repeat(73)
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@domain.com',
      password: longPassword,
      confirmPassword: longPassword,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Senha excessiva')
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@domain.com',
      password: 'password1',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('As senhas não coincidem')
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })
})

describe('taskFormSchema', () => {
  it('accepts valid task creation', () => {
    const result = taskFormSchema.safeParse({
      title: 'Minha tarefa',
      description: 'Descrição opcional',
      dueDate: '2025-12-31',
      status: 'TODO',
      priority: 'medium',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal task creation', () => {
    const result = taskFormSchema.safeParse({ title: 'Tarefa mínima' })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = taskFormSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Título obrigatório')
  })

  it('rejects title over 200 chars', () => {
    const result = taskFormSchema.safeParse({ title: 'A'.repeat(201) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Título excessivo')
  })

  it('rejects invalid status', () => {
    const result = taskFormSchema.safeParse({ title: 'T', status: 'done' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Status inválido')
  })

  it('rejects invalid priority', () => {
    const result = taskFormSchema.safeParse({ title: 'T', priority: 'critical' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Prioridade inválida')
  })
})

describe('taskQuerySchema', () => {
  it('accepts empty query', () => {
    const result = taskQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid status filter', () => {
    const result = taskQuerySchema.safeParse({ status: 'DONE' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = taskQuerySchema.safeParse({ status: 'invalid' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Status inválido')
  })

  it('rejects invalid sortBy', () => {
    const result = taskQuerySchema.safeParse({ sortBy: 'invalid' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Campo de ordenação inválido')
  })

  it('rejects negative page', () => {
    const result = taskQuerySchema.safeParse({ page: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects zero pageSize', () => {
    const result = taskQuerySchema.safeParse({ pageSize: 0 })
    expect(result.success).toBe(false)
  })
})