import axios from 'axios'
import { getErrorMessage } from './client'

describe('getErrorMessage', () => {
  it('returns string message from response data', () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: 'Falha ao autenticar' } },
      message: 'Request failed',
    }
    // make axios.isAxiosError return true for this shape
    jest.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true)
    expect(getErrorMessage(error)).toBe('Falha ao autenticar')
  })

  it('joins array messages', () => {
    const error = {
      response: { data: { message: ['Campo obrigatório', 'E-mail inválido'] } },
    }
    jest.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true)
    expect(getErrorMessage(error)).toBe('Campo obrigatório, E-mail inválido')
  })

  it('falls back to error.message for non-axios errors', () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValueOnce(false)
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('returns default message for unknown error', () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValueOnce(false)
    expect(getErrorMessage(null)).toBe('Não foi possível concluir a operação. Tente novamente.')
  })

  it('falls back to axios error.message when no response', () => {
    const error = { response: undefined, message: 'Network Error' }
    jest.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true)
    expect(getErrorMessage(error)).toBe('Network Error')
  })
})
