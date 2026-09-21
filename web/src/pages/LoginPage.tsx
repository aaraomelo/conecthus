import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { getAuthError } from '../api/client'
import { loginSchema, type LoginValues } from '../features/auth/loginSchema'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  })

  const onSubmit = async (data: LoginValues) => {
    try {
      await login(data.email, data.password)
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(getAuthError(err))
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__subtitle">Acesse sua conta</p>

        {error ? (
          <div className="alert alert--error" role="alert" data-testid="login-error">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            data-testid="login-email"
          />
          {errors.email ? (
            <span id="login-email-error" className="field__error" role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            data-testid="login-password"
          />
          {errors.password ? (
            <span id="login-password-error" className="field__error" role="alert">
              {errors.password.message}
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={isSubmitting}
          data-testid="login-submit"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="auth-card__footer">
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}