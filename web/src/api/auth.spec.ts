import type { AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { getCurrentUser, loginUser, registerUser, updateCurrentUser } from './auth'

describe('auth API functions', () => {
  it('registerUser posts to /auth/register', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { user: {}, accessToken: 't' } } as AxiosResponse)

    await registerUser('Ana', 'ana@example.com', 'secret1')
    expect(post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret1',
    })
  })

  it('loginUser posts to /auth/login', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { user: {}, accessToken: 't' } } as AxiosResponse)

    await loginUser('ana@example.com', 'secret1')
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@example.com',
      password: 'secret1',
    })
  })

  it('getCurrentUser gets /users/me', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: {} } as AxiosResponse)

    await getCurrentUser()
    expect(get).toHaveBeenCalledWith('/users/me')
  })

  it('updateCurrentUser patches /users/me', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} } as AxiosResponse)

    await updateCurrentUser('Novo Nome')
    expect(patch).toHaveBeenCalledWith('/users/me', { name: 'Novo Nome' })
  })
})